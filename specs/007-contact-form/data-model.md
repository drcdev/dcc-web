# Data Model: Contact Form and Message Retrieval

**Feature**: `007-contact-form` | **Date**: 2026-09-29 | **Plan**: [plan.md](./plan.md)

## Storage layout

| Environment | Worker | D1 database | Binding | Location hint | Secrets (names) |
|---|---|---|---|---|---|
| Production | `dcc-web` | `contact` | `DB` | `wnam` | `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN`, `IP_HASH_SALT` |
| Preview | `dcc-web-preview` (`env.preview`) | `contact-preview` | `DB` | `wnam` | same names, different values |
| Local / tests | `wrangler dev`, Vitest plugin | Miniflare local SQLite | `DB` | n/a | public test values in `tests/fixtures/worker/e2e.env` / plugin bindings |

Both databases have the same schema, managed by the migrations in `migrations/` at the
repository root (`migrations_dir` on both bindings). Wrangler records applied migrations in
its default `d1_migrations` table.

## Entity: Message (table `messages`)

One accepted contact submission. Nothing else is stored: rejected, honeypot, rate-limited and
Turnstile-failed submissions leave no row.

| Column | Type | Null | Rule | Source |
|---|---|---|---|---|
| `id` | TEXT PRIMARY KEY | no | lowercase UUID v4 (`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`) | `submission_id` generated in the browser (research R8) |
| `name` | TEXT | no | trimmed, 1–100 characters | form |
| `email` | TEXT | no | trimmed, 3–254 characters, matches `^[^\s@]+@[^\s@]+\.[^\s@]+$` | form |
| `organization` | TEXT | yes | trimmed, ≤ 100 characters; empty becomes NULL | form (optional) |
| `project` | TEXT | yes | trimmed, control characters removed, ≤ 100 characters; empty becomes NULL | `?project=` via hidden field |
| `message` | TEXT | no | trimmed, 1–5,000 characters | form |
| `ip_hash` | TEXT | no | 64 lowercase hex characters: HMAC-SHA-256(`IP_HASH_SALT`, `CF-Connecting-IP` or `"unknown"`) | Worker |
| `status` | TEXT | no | `'new'` or `'read'`, default `'new'` | Worker |
| `received_at` | INTEGER | no | Unix epoch milliseconds (UTC), set by the Worker at insert | Worker |

"Characters" means JavaScript string length (UTF-16 code units), the same unit the browser's
`maxlength` uses. SQLite `CHECK` constraints repeat the limits with `length()`, which counts
code points and is never larger. So the database can never hold a value that the Worker's
validation would refuse.

**Never stored**: the raw IP address, the Turnstile token, the honeypot value, the consent
flag (its presence is a precondition for storing at all), user agent, referrer or any header.

### Indexes

| Name | Columns | Serves |
|---|---|---|
| (PK autoindex) | `id` | duplicate check (R8), mark-read lookup |
| `idx_messages_ip_received` | `(ip_hash, received_at)` | rate-limit count (R7) |
| `idx_messages_status_received` | `(status, received_at, id)` | list new, oldest first, cursor paging (R9) |
| `idx_messages_received` | `(received_at)` | retention delete (R11) |

Each query's plan must use its index. An integration test runs `EXPLAIN QUERY PLAN` for the
four statements and fails if any shows `SCAN messages` (a full table scan), so the row-read
figures in research R10 hold.

### Migration `migrations/0001_create_messages.sql` (outline)

```sql
CREATE TABLE messages (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  email        TEXT    NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  organization TEXT             CHECK (organization IS NULL OR length(organization) BETWEEN 1 AND 100),
  project      TEXT             CHECK (project IS NULL OR length(project) BETWEEN 1 AND 100),
  message      TEXT    NOT NULL CHECK (length(message) BETWEEN 1 AND 5000),
  ip_hash      TEXT    NOT NULL CHECK (length(ip_hash) = 64),
  status       TEXT    NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
  received_at  INTEGER NOT NULL
);
CREATE INDEX idx_messages_ip_received     ON messages (ip_hash, received_at);
CREATE INDEX idx_messages_status_received ON messages (status, received_at, id);
CREATE INDEX idx_messages_received        ON messages (received_at);
```

Later migrations must be additive (research R3, "Migrations before code").

### State transitions

```text
            accepted submission
 (none) ──────────────────────────▶ new ──── mark read (bearer key) ────▶ read
                                     │                                    │
                                     └──── retention: received_at < now − 12 months ────┴──▶ (deleted)
```

- `new → read` only through `POST /api/messages/{id}/read`. There is no `read → new`.
- Deletion happens only through the daily cron (or manually by Don, outside the system, for a
  deletion request). There is no delete endpoint (FR-022).
- Marking a `read` message again returns `409 already_read` and changes nothing. An unknown ID
  returns `404 not_found`.

## Value object: Submission (request body of `POST /api/contact`)

Not stored as is. It is validated into a Message. Field rules are in
[contracts/contact-api.md](./contracts/contact-api.md). The shared rules module
`worker/src/contact/rules.ts` exports the limits (`NAME_MAX = 100`, `EMAIL_MAX = 254`,
`ORGANIZATION_MAX = 100`, `PROJECT_MAX = 100`, `MESSAGE_MAX = 5000`, `BODY_MAX_BYTES = 10_240`,
`RATE_PER_HOUR = 3`, `RATE_PER_DAY = 5`, `RETENTION_MONTHS = 12`) and the pure
`validateSubmission()` function. The Worker and the Astro form component both import it, so the
form's `maxlength` values and the server's checks come from one place.

## Value object: Retrieval key

| Attribute | Rule |
|---|---|
| Name | `CONTACT_READ_TOKEN` (Worker secret, one value per environment; FR-024) |
| Format | at least 32 random bytes, Base64 or hex, generated by Don outside the chat |
| Grants | `GET /api/messages/new`, `POST /api/messages/{id}/read`, nothing else |
| Comparison | SHA-256 of presented and stored value, compared with `crypto.subtle.timingSafeEqual` |

## Value object: Rate-limit window

Derived, not stored: the count query over `messages` for one `ip_hash`, where
`hour = rows with received_at ≥ now − 3,600,000` and
`day = rows with received_at ≥ now − 86,400,000`. Refuse when `hour ≥ 3 || day ≥ 5`.

## Setup registry additions (`scripts/setup-check/items.ts`)

Seven new `SetupItem`s, orders 19–25, using the existing shape (`id`, `order`, `title`,
`purpose`, `where`, `confirmedBy`, `needsDon`, `principles`, `requirements`, `secrets`,
`dependsOn`, `phase`). Their full definitions are in
[contracts/setup-items.md](./contracts/setup-items.md). New `SecretRef` entries in
`scripts/setup-check/secrets.ts` (names only):

| Name | Kind | Store | Used by |
|---|---|---|---|
| `TURNSTILE_SECRET_KEY` | secret | cloudflare-worker-secret (`dcc-web`, `dcc-web-preview`) | `contact-worker-secrets` |
| `CONTACT_READ_TOKEN` | secret | cloudflare-worker-secret (both Workers, different values) | `contact-worker-secrets` |
| `IP_HASH_SALT` | secret | cloudflare-worker-secret (both Workers, different values) | `contact-worker-secrets` |
| `PUBLIC_TURNSTILE_SITE_KEY` | variable | workers-builds-build-variable (both connections) | `contact-turnstile-site-key` |

`SecretRef.store` gains the two new store kinds. The drift test keeps enforcing that every
secret name referenced by `wrangler.jsonc` (`secrets.required`), `.env.example` or a workflow
appears in the manifest.
