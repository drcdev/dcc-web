# Data Model: Contact form sends email instead of storing messages

**Feature**: 033-contact-form-email | **Spec**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

Nothing in this feature is persisted by the site. The entities below live only for the length of
one request, or are configuration.

## Contact submission (value object, request-scoped)

Unchanged from feature 007 (`worker/src/contact/rules.ts`, `validateSubmission`).

| Field | Type | Rule |
|---|---|---|
| `submission_id` | string | UUID v4; still required; used as Turnstile's `idempotency_key`. No longer used for duplicate detection. |
| `name` | string | trimmed, 1–100 |
| `email` | string | trimmed, ≤ 254, `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| `organization` | string \| null | trimmed, ≤ 100, empty → null |
| `project` | string \| null | control characters removed, trimmed, ≤ 100, empty → null |
| `message` | string | trimmed, 1–5000 |
| `consent` | `true` | required |
| `website` | string | honeypot; non-empty → fake success, no send |
| `turnstile_token` | string | required, ≤ 2048 |

Removed constants: `RATE_PER_HOUR`, `RATE_PER_DAY`, `RETENTION_MONTHS`. Kept: field limits and
`BODY_MAX_BYTES`.

## Contact email (value object, built per accepted submission)

Built by `buildContactEmail(submission, { receivedAt, preview, host })` in `worker/src/contact/email.ts`;
the result is the `EmailMessageBuilder` passed to `env.CONTACT_EMAIL.send()`. Exact shape:
[contracts/contact-email.md](./contracts/contact-email.md).

| Field | Value |
|---|---|
| `to` | `CONTACT_DESTINATION` constant (`contact@doncoleman.ca`) |
| `from` | `{ email: CONTACT_SENDER ("contact-form@drc.dev"), name: "doncoleman.ca contact form" }` |
| `replyTo` | visitor `email` as a plain string when header-safe, else omitted |
| `subject` | `[Preview] `? + `Contact form: <name>` + ` (about <project>)`? with header text sanitised (C0/C1 controls, U+2028 and U+2029 → space, whitespace collapsed, trimmed; FR-004) |
| `text` | plain-text body: optional preview line, labelled fields, `Received:` ISO UTC, then the message |

Invariants: exactly one recipient, always the constant; no `cc`, `bcc`, `html`, `headers` or
`attachments`; no visitor value in any header other than the sanitised subject and the
header-safe Reply-To.

## Fixed destination (configuration)

| Where | Value |
|---|---|
| `wrangler.jsonc` `send_email[0].destination_address` (both envs) | `contact@doncoleman.ca` |
| `wrangler.jsonc` `send_email[0].allowed_sender_addresses` (both envs) | `["contact-form@drc.dev"]` |
| `worker/src/contact/email.ts` constants | same two values; a config test proves equality |
| Cloudflare Email Routing (account) | destination address verified by Don |

## Environment marker (configuration)

| Env | `SITE_ENVIRONMENT` var | Effect |
|---|---|---|
| production | absent | no mark |
| preview | `"preview"` | subject prefix `[Preview] `, body first line names the request host |

## Log line (per request)

`{"event":"contact","outcome":<Outcome>}` plus, on `unavailable` only, `name` (error class name)
and `code` (when it matches `^E_[A-Z_]+$`).

`Outcome` = `sent` | `honeypot` | `invalid` | `turnstile_failed` | `unavailable` | `forbidden` |
`too_large`. Removed: `stored`, `duplicate`, `rate_limited`.

## Database (D1) changes

| Object | Before | After |
|---|---|---|
| `messages` table + `idx_messages_ip_received`, `idx_messages_status_received`, `idx_messages_received` | present | dropped by `migrations/0003_drop_messages.sql` (`DROP TABLE IF EXISTS messages;`) |
| `question_sets`, `usage_bucket` | present | unchanged |
| `d1_migrations` | 0001, 0002 | 0001, 0002, 0003 |

State transitions: none remain. The `new → read` status, the retention delete and the fingerprint
clearing all go with the table.

## Secrets and setup references

| Name | Before | After |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | required | required |
| `CONTACT_READ_TOKEN` | required | removed from config, code, manifest, e2e env, tests; Don deletes the stored values after release |
| `IP_HASH_SALT` | required | same as above |
| `CLOUDFLARE_API_TOKEN` (local, read-only) | permissions list | + Account → Email Routing Addresses: Read |
