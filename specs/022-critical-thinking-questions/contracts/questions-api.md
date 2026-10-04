# Contract: Questions API (`POST /api/questions`)

The second first-party endpoint named in Constitution Principle V (v2.2.0). Runs in the site's
Worker (`worker/src/questions/handler.ts`), routed from `worker/src/index.ts`. Row ids (Q01…)
are for test titles.

## Request

```http
POST /api/questions HTTP/1.1
Origin: https://doncoleman.ca
Sec-Fetch-Site: same-origin
Content-Type: application/json

{ "slug": "some-post", "hash": "<64 hex>", "fresh": false }
```

| Field | Type | Rule |
|---|---|---|
| `slug` | string | required, 1–200 chars, `^[a-z0-9][a-z0-9-]*$` |
| `hash` | string | required, `^[0-9a-f]{64}$` |
| `fresh` | boolean | optional, default `false`. `true` = the "new questions" action |

Unknown fields are ignored. The body is read through a byte counter capped at 1,024 bytes.

## Processing order

1. Method is `POST`, else Q01.
2. Same-origin and HTTPS (shared `isSameOriginRequest`, as the contact API), else Q02.
3. `Content-Type` is `application/json`, else Q03.
4. Body within 1,024 bytes, else Q04; JSON object with valid fields, else Q05.
5. If `fresh` is false: look up `question_sets (slug, hash)`. Hit → Q10 (no bucket, no model, no
   asset read).
6. Read `/writing/<slug>/question-source.json` through `env.ASSETS`. Not 200 → Q06. File `hash`
   differs from the request → Q07.
7. Take a token (data-model §3). Empty → Q08 (no model call).
8. Call `env.AI.run(QUESTIONS_MODEL, …)` with the 15 s timeout; parse and validate.
   Error, timeout or fewer than 2 valid → refund the token → Q09.
9. Success: if not `fresh`, insert the set and delete the slug's other hashes in one `batch()` →
   Q11; if `fresh`, store nothing → Q12.

Any D1 or asset failure at any step → Q09 (fail closed; a token already taken is refunded).

## Responses

All responses are JSON with the Worker security headers from `worker/src/http.ts`
(`Cache-Control: no-store`, `X-Robots-Tag: noindex`, `nosniff`, `Referrer-Policy: no-referrer`,
HSTS) and no CORS headers. Error bodies name no provider, model, prompt or internal detail
(FR-015).

| Id | Status | Body | Extra headers | When |
|---|---|---|---|---|
| Q01 | 405 | `{ "ok": false, "error": "method_not_allowed" }` | `Allow: POST` | not POST |
| Q02 | 403 | `{ "ok": false, "error": "forbidden" }` | | cross-origin, cross-site `Sec-Fetch-Site`, missing `Origin`, or plain HTTP off localhost |
| Q03 | 415 | `{ "ok": false, "error": "unsupported_media_type" }` | | not JSON |
| Q04 | 413 | `{ "ok": false, "error": "too_large" }` | | body over 1,024 bytes |
| Q05 | 400 | `{ "ok": false, "error": "invalid" }` | | not an object, bad `slug`, `hash` or `fresh` |
| Q06 | 404 | `{ "ok": false, "error": "not_found" }` | | no such post in this build (unknown slug, or a draft on production) |
| Q07 | 404 | `{ "ok": false, "error": "stale" }` | | the post changed since the page loaded |
| Q08 | 429 | `{ "ok": false, "error": "limited", "retryAfter": <seconds> }` | `Retry-After: <seconds>` | bucket empty |
| Q09 | 503 | `{ "ok": false, "error": "unavailable" }` | | model error, timeout, malformed output, D1 or asset failure |
| Q10 | 200 | `{ "ok": true, "source": "cached", "questions": [..] }` | | cached set for this version |
| Q11 | 200 | `{ "ok": true, "source": "generated", "questions": [..] }` | | first set for this version, now cached |
| Q12 | 200 | `{ "ok": true, "source": "fresh", "questions": [..] }` | | "new questions", not stored |

`questions` always holds 2–4 strings that passed data-model §5. `retryAfter` is a whole number
of seconds ≥ 1, equal to the header.

## Guarantees (tested)

- Q20: a cached press never changes `usage_bucket` (SC-003).
- Q21: generations never exceed the bucket: with capacity N and no time passing, the (N+1)th
  generation is Q08 and the model fake was called exactly N times.
- Q22: a failed or malformed generation leaves `tokens` where it was (refund).
- Q23: Q08 and Q06/Q07 never call the model.
- Q24: no log line, response or D1 row contains an IP, a request header value or raw model
  output; one line `{"event":"questions","outcome":…}` per request (FR-019, FR-022, SC-006).
- Q25: the endpoint never reads `CF-Connecting-IP` or sets a cookie.
- Q26: production and preview each use their own database and bucket (`environments.test.ts`).
- Q27: a request body with extra text fields (for example `text`) changes nothing: generation
  uses only the source file (FR-014).
