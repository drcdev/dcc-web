# Contract: `POST /api/contact` (after feature 033)

Supersedes the processing order, responses and logging of
`specs/007-contact-form/contracts/contact-api.md`. The **Request** section and **Body fields** of
that contract are unchanged (method, scheme, origin, content type, 10,240-byte cap, field rules).
`specs/007-contact-form/contracts/retrieval-api.md` is retired.

## Processing order

1. **Honeypot**: `website` non-empty → `200 {"ok":true}`. No Turnstile call, no send.
2. **Validation** (all fields, all errors collected) → on failure
   `400 {"ok":false,"error":"validation","fields":{...}}`. No send.
3. **Turnstile** siteverify (secret, token, `remoteip`, `idempotency_key = submission_id`).
   Accept only `success && action === "contact" && hostname === request hostname`; otherwise
   `422 {"ok":false,"error":"turnstile_failed"}`, no send. Network error or non-200 →
   `503 unavailable`.
4. **Send**: `await env.CONTACT_EMAIL.send(buildContactEmail(submission, { receivedAt: Date.now(),
   preview: env.SITE_ENVIRONMENT === "preview", host: url.host }))`, shape in
   [contact-email.md](./contact-email.md). Resolves → `200 {"ok":true}`.
5. Any throw in steps 3–4 → `503 {"ok":false,"error":"unavailable"}`.

Removed steps: duplicate check, IP hashing, rate limit, insert. No D1 access on this route.

**Fail closed**: the visitor gets `200` only after `send()` resolved. A refused or unreachable
send, a Turnstile outage, or any other throw ends in `503 unavailable`, and the client keeps every
typed value (unchanged client behaviour). Steps 1–3 and the pre-checks never call `send()`.

**Not limited per sender**: a sender who passes Turnstile is never refused for sending often. The
Worker reads `CF-Connecting-IP` only to pass it to siteverify as `remoteip`, never stores, hashes
or logs it.

## Responses and client messages

As in feature 007, minus the `429 rate_limited` row. The client's `rateLimited` message and its
branch in `src/components/sections/ContactForm.astro` are removed; any unexpected status keeps
showing the generic message.

## Logging

One line per request, `console.log(JSON.stringify(line))`:

| Outcome | When |
|---|---|
| `sent` | step 4 resolved |
| `honeypot` | step 1 |
| `invalid` | invalid JSON or step 2 |
| `turnstile_failed` | step 3 refused |
| `unavailable` | step 5; adds `name` (error class) and `code` when it matches `^E_[A-Z_]+$` |
| `forbidden` | origin check failed |
| `too_large` | size cap |

No field value, address, IP, token or message ID is ever logged.

## Removed routes

| Request | Response |
|---|---|
| `GET /api/messages/new` (any query, with or without `Authorization`) | `404 {"error":"not_found"}` with the Worker security headers |
| `POST /api/messages/{id}/read` (with or without `Authorization`) | same |
| any other `/api/messages*` path or method | same |

The 404 is the Worker's existing fall-through (`worker/src/index.ts`), so a valid old token and no
token get byte-identical responses.

## Scheduled events

The Worker exports no `scheduled` handler. Both Workers have zero Cron Triggers after their next
deploy (`triggers.crons: []`, see [worker-config.md](./worker-config.md)).
