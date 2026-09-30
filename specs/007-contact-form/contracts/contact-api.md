# Contract: `POST /api/contact`

Served by the Worker (`run_worker_first: ["/api/*"]`). Same origin as the page, so there is no
CORS and no `OPTIONS` handling. Every response carries the Worker security headers (research
R1) and `Content-Type: application/json; charset=utf-8`.

## Request

| Aspect | Rule | Failure |
|---|---|---|
| Method | `POST` only | `405 {"ok":false,"error":"method_not_allowed"}` with `Allow: POST` |
| Scheme | `https:`; `http:` is accepted only when the hostname is `127.0.0.1` or `localhost` | `403 forbidden` |
| Origin | the `Origin` header must be present and equal `new URL(request.url).origin`; when `Sec-Fetch-Site` is present it must be `same-origin`. A missing `Origin` is refused (FR-014) | `403 {"ok":false,"error":"forbidden"}` |
| Content type | `application/json` (parameters ignored) | `415 unsupported_media_type` |
| Size | `Content-Length` > 10,240 is refused before reading; the body is also read through a counting stream that aborts past 10,240 bytes | `413 too_large` |
| Body | valid JSON object | `400 {"ok":false,"error":"invalid_json"}` |

### Body fields

| Field | Type | Required | Rule (after trimming) | Field error codes |
|---|---|---|---|---|
| `submission_id` | string | yes | UUID v4, lowercase | `invalid` |
| `name` | string | yes | 1–100 | `required`, `too_long` |
| `email` | string | yes | ≤ 254, `^[^\s@]+@[^\s@]+\.[^\s@]+$` | `required`, `too_long`, `invalid` |
| `organization` | string | no | ≤ 100; empty or absent becomes null | `too_long` |
| `project` | string | no | control characters removed, ≤ 100; empty or absent becomes null | `too_long` |
| `message` | string | yes | 1–5,000 | `required`, `too_long` |
| `consent` | boolean | yes | must be `true` | `required` |
| `website` | string | no | honeypot: must be empty or absent | (see order, step 1) |
| `turnstile_token` | string | yes | 1–2,048 characters | missing → `422 turnstile_failed` |

Unknown fields are ignored. A string of only whitespace counts as empty. Lengths are JavaScript
string lengths (data-model.md).

## Processing order

1. **Honeypot**: `website` non-empty → `200 {"ok":true}`. No Turnstile call, no D1 access
   (FR-011).
2. **Validation** (all fields, all errors collected) → on failure
   `400 {"ok":false,"error":"validation","fields":{"email":"invalid","message":"too_long"}}`.
3. **Duplicate check**: `SELECT 1 FROM messages WHERE id = ?` → if found, `200 {"ok":true}`
   (research R8).
4. **Turnstile** siteverify (secret, token, `remoteip`, `idempotency_key = submission_id`). Accept
   only `success && action === "contact" && hostname === request hostname`. Otherwise →
   `422 {"ok":false,"error":"turnstile_failed"}`. A network error or non-200 from siteverify →
   `503 unavailable`.
5. **Rate limit**: count by `ip_hash` (data-model.md). `hour ≥ 3 || day ≥ 5` →
   `429 {"ok":false,"error":"rate_limited"}` with `Retry-After` set to the seconds until the
   oldest counted row leaves its window.
6. **Insert** `INSERT … ON CONFLICT(id) DO NOTHING` with `status='new'`,
   `received_at = Date.now()` → `200 {"ok":true}`.
7. Any D1 error in steps 3, 5 or 6 → `503 {"ok":false,"error":"unavailable"}`.

**Fail closed** (FR-012a): Turnstile unreachable, a siteverify error, or a D1 error at any step
always ends in `503 unavailable` with nothing stored. No step is skipped because a dependency is
down, and Flux's fail-open rate limit is not carried over. The client keeps every value.
Refused submissions (steps 1, 2, 4 and 5) are never stored, so they never count towards the
rate limit (FR-013a).

## Responses and client messages

| Status | `error` | Client message (plain language; every typed value stays in the form) |
|---|---|---|
| 200 | none | Success panel: "Thanks, your message was sent. I'll reply by email." |
| 400 | `validation` | Per field, e.g. "Enter a valid email address." / "Message is too long. The limit is 5,000 characters." |
| 400 | `invalid_json` | "Your message wasn't sent. Please try again." |
| 403 | `forbidden` | "Your message wasn't sent. Please try again from doncoleman.ca." |
| 413 | `too_large` | "Your message is too long to send. Please shorten it." |
| 415 | `unsupported_media_type` | "Your message wasn't sent. Please try again." |
| 422 | `turnstile_failed` | "We couldn't confirm you're not a bot. Please try again." (the widget is reset) |
| 429 | `rate_limited` | "You've sent too many messages. Please try again later." |
| 503 | `unavailable` | "Your message wasn't sent because the service is unavailable. Please try again in a few minutes." |
| network failure / timeout (15 s) | n/a | same as 503 |
| Turnstile script failed to load | n/a | "The spam check couldn't load. Please try again later." |

Implement finalises the copy in the component. It must stay plain language (constitution
Development Workflow), and the E2E tests assert the final strings.

## Logging

At most one structured line per request:
`{"event":"contact","outcome":"stored|honeypot|duplicate|invalid|turnstile_failed|rate_limited|unavailable|forbidden|too_large"}`.
For a 503 it adds an error `name` (never its message). No field values, no IP, no hash and no
token are ever logged (FR-016, Principle VII). An integration test captures `console` output
for every outcome and asserts that no submitted value and no IP appear in it.
