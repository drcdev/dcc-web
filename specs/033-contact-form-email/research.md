# Research: Contact form sends email instead of storing messages

**Feature**: 033-contact-form-email | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

Every decision below names the first-party option it uses (Constitution IV). Cloudflare facts were
read from developers.cloudflare.com on 2026-10-10; Astro facts from the Astro Docs MCP
(`astro-docs`), which was available.

## R1. How the Worker sends the email

- **Decision**: Use the Workers `send_email` binding (Cloudflare Email Service / Email Routing)
  with the **structured `send()` builder API**: `env.CONTACT_EMAIL.send({ to, from, replyTo,
  subject, text })`. No `html` part. No MIME library.
- **Rationale**:
  - First-party: the binding is Cloudflare's own way for a Worker to send email; it needs no API
    key, no secret and no new package (Principle IV, Technology Constraints).
  - The builder API is what Cloudflare recommends for new code ("prefer the structured send()
    method", developers.cloudflare.com/email-routing/email-workers/send-email-workers/). The legacy
    `EmailMessage` from `cloudflare:email` "remains supported for backward compatibility" but
    needs a hand-built raw MIME message; the docs' own example pulls in `mimetext` and
    `nodejs_compat`, which would add a dependency and header-encoding code we would own.
  - The generated types in `worker/worker-configuration.d.ts` (wrangler 4.149.0) already declare
    `SendEmail.send(builder: EmailMessageBuilder)` with `from: string | EmailAddress`,
    `replyTo?: string | EmailAddress`, `subject`, `text`, and `to`. Typecheck covers the call.
  - The builder encodes headers itself, so the site never writes a raw header line. Combined with
    R4's sanitising this removes header-injection risk without custom MIME code.
- **Alternatives considered**:
  - `EmailMessage` + raw MIME (hand-written, no library): workable fallback if the builder were
    refused for Email-Routing-only senders (see R3 risk). Rejected as the default because we would
    own RFC 5322 / RFC 2047 encoding of the visitor's name in the subject.
  - Email Service REST API from the Worker: needs an API token secret; the binding needs none.
  - A third-party email API (Resend, Postmark, SES): not first-party, adds a secret and a vendor,
    and a cost line. Rejected.
  - Astro Actions or an Astro server endpoint: needs on-demand rendering and an adapter
    (docs.astro.build/en/guides/on-demand-rendering/, /en/guides/actions/ "Pages must be on-demand
    rendered when calling actions using a form action"). Principle V keeps every page static and the
    API in the existing Worker, so no Astro change is involved.

## R2. Fixed destination and restricted sender (free plan)

- **Decision**: In `wrangler.jsonc`, both the top level and `env.preview` declare

  ```jsonc
  "send_email": [{
    "name": "CONTACT_EMAIL",
    "destination_address": "contact@doncoleman.ca",
    "allowed_sender_addresses": ["contact-form@drc.dev"]
  }]
  ```

  The Worker also holds the same two addresses as constants in `worker/src/contact/email.ts` and
  passes `to: CONTACT_DESTINATION` (the builder type requires `to`). A config test asserts the
  constants equal the wrangler values in both environments, so the code can never drift from the
  binding restriction.
- **Rationale**:
  - developers.cloudflare.com/email-service/configuration/send-bindings/: with
    `destination_address`, "The binding can only send to the single destination address
    configured here." So even a code bug cannot add a recipient (FR-001, spec US1 scenario 5).
    `allowed_sender_addresses`: "The binding can only send from the addresses listed".
  - developers.cloudflare.com/email-service/platform/pricing/: "Sending to verified destination
    addresses in your account is free on all plans, including when only Email Routing is
    configured", and such sends "do not count toward the included quota". "Sending to arbitrary
    recipients requires the Workers Paid plan." Hence one fixed, verified destination and no copy to
    the visitor (spec Assumptions).
  - `contact@doncoleman.ca` is already public in the privacy policy and terms, so committing it
    exposes nothing new (spec Assumptions). Bindings are not inherited by wrangler environments, so
    `env.preview` repeats the block; preview mail goes to the same inbox, marked (R6).
- **Alternatives considered**: `allowed_destination_addresses` (a list; the spec allows exactly
  one); no restriction at all (any verified address in the account; weaker); a secret or var for
  the address (FR-001 says committed configuration, and the address is not secret).

## R3. Sending domain for Email Routing, apex keeps iCloud (FR-016) — **answered 2026-10-10**

- **Outcome (2026-10-10)**: subdomain-only routing is **not** possible here. When Don tried to turn
  on Email Routing for `mail.doncoleman.ca`, the dashboard proposed changing the apex doncoleman.ca
  MX, SPF and DKIM (iCloud) records. Don chose fallback 2 (a separate domain) using **`drc.dev`**,
  which he already owns and which already has Email Routing on in Cloudflare. The Worker sends from
  `contact-form@drc.dev` (display name unchanged) to the verified destination
  `contact@doncoleman.ca`. doncoleman.ca's DNS and iCloud mail are untouched; no DNS record is added
  anywhere; no new cost (no registration needed). **Assumption (risk)**: `drc.dev` is a zone in the
  same Cloudflare account as the Worker; setup item 17 verifies it before the first push.
- **Original decision (superseded)**: Turn on Email Routing for `mail.doncoleman.ca` only. Send from
  `contact-form@mail.doncoleman.ca`. Leave the apex `doncoleman.ca` MX (`mx01/mx02.mail.icloud.com`),
  SPF (`include:icloud.com`), `apple-domain` TXT and `sig1._domainkey` CNAME untouched. Verify
  `contact@doncoleman.ca` as an Email Routing destination address (account-scoped; the verification
  email arrives through iCloud like any other mail).
- **What the documentation confirms**:
  - Routing can be added per subdomain: developers.cloudflare.com/email-service/configuration/subdomains/
    ("Under Subdomains, enter the subdomain you want to enable"), and "Cloudflare adds the required
    DNS records to the subdomain".
  - The Cloudflare API's enable call (`POST /zones/{zone_id}/email/routing/dns`, SDK
    `emailRouting.dns.create`) takes a body `name` ("Domain of your zone"), so enabling is
    addressed to a name, not only the apex.
  - Apex routing "Cannot use Email Routing with external mail servers" and "Email Routing requires
    Cloudflare MX records" (…/email-service/configuration/domains/), which is why the apex must stay
    off.
- **What the documentation does NOT confirm**: whether the subdomain can be enabled while apex
  routing stays **disabled**. The subdomain steps start with "Select the apex domain, then open
  Settings", and the page says Email Routing "applies to the apex domain" by default. No page says
  the apex must be enabled first, and no page says it need not be. **This cannot be settled from the
  docs, so it is a risk, confirmed in practice as the first setup step, before any implementation
  push that adds the binding** (see R11 ordering). The dashboard may require the apex's routing
  settings page to exist; it must not be allowed to write apex MX records. The walkthrough tells Don
  to stop if the dashboard proposes any change to the apex MX, SPF or DKIM records.
- **Fallbacks, in order** (each needs Don's decision; none is taken silently):
  1. **Email Sending onboarding of `mail.doncoleman.ca`** instead of routing. Its records go to
     `cf-bounce.mail.doncoleman.ca` and the subdomain (MX, SPF, DKIM, DMARC), never the apex.
     Sends to verified destinations are still free and outside the quota per the pricing page, but
     the pricing table also lists outbound sending as "Not available" on Workers Free, and the page
     does not reconcile the two. Confirm in the dashboard; $0 if allowed.
  2. **A separate domain** in the Cloudflare account with Email Routing on its apex (no existing
     mail to break). A new registration would cost about $1/month; **chosen 2026-10-10 using
     `drc.dev`, which Don already owns, so the cost is $0.**
  3. **Workers Paid** ($5/month) with Email Sending on the subdomain. Inside the ceiling only if
     current spend allows; last resort.
- **Rollback**: the chosen design adds no record to doncoleman.ca. Its apex records stay protected
  by setup item 5 (`mail-records`), which fails if any apex mail record changes. Anything left
  half-applied on doncoleman.ca by the failed subdomain attempt is for Don to undo (tasks T043).

## R4. Header safety: subject, From, Reply-To (FR-003, FR-004, edge cases)

- **Decision**:
  - Subject: `Contact form: <name>` or `Contact form: <name> (about <project>)`; preview prefix
    `[Preview] ` (R6). Before use, name and project have every C0/C1 control character (including
    CR, LF, TAB, U+0085) and the Unicode line and paragraph separators (U+2028, U+2029) replaced
    by a space, runs of whitespace collapsed, and are trimmed. Validation
    already caps both at 100 characters, so the subject stays well under header limits.
  - From: `{ email: "contact-form@drc.dev", name: "doncoleman.ca contact form" }`, a constant.
  - Reply-To: the visitor's email address as a **plain string**, never with the visitor's name as a
    display name. It is used only when it also matches a header-safe pattern (no whitespace,
    control characters, `<`, `>`, `,`, `;`, `"`, `(`, `)`, `\`, and exactly one `@`). Otherwise
    Reply-To is left unset and the body still shows the address; the visitor sees no difference.
    The existing validation (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) is unchanged (FR-007).
- **Rationale**: only the subject and Reply-To carry visitor text into headers. The builder API
  encodes values, and the sanitising makes the property testable without relying on it: no field
  can add a header or recipient, and `destination_address` (R2) independently pins the recipient.
- **Alternatives considered**: tightening the form's email validation (changes FR-007 behaviour);
  putting the visitor's name in the Reply-To display name (more header surface for no gain).

## R5. Email body (FR-002)

- **Decision**: plain text only (`text`, no `html`). Fixed labels, one per line, then the message:

  ```text
  [only on preview] This message was sent from a preview deployment: <request host>

  Name: <name>
  Email: <email>
  Organization: <organization or "not given">
  Project: <project or "not given">
  Received: <ISO 8601 UTC, e.g. 2026-10-10T17:04:11Z>

  Message:
  <message, as typed>
  ```

- **Rationale**: plain text means markup is never interpreted (FR-002). UTC ISO matches the old
  retrieval contract's `received_at` and is unambiguous. Field limits keep the body under 6 KB,
  far below the 5 MiB message limit.

## R6. Preview marker (FR-006)

- **Decision**: `env.preview.vars` gains `"SITE_ENVIRONMENT": "preview"`; production defines no
  such var. When it equals `"preview"`, the subject starts with `[Preview] ` and the body's first
  line names the preview by the request's host (for example
  `br-033-contact-form-email-dcc-web-preview.drc-dev.workers.dev`). The host comes from the request
  URL the Worker already parses for the same-origin check, never from a header the client controls
  beyond that check.
- **Rationale**: wrangler vars are per environment and not inherited, so production can never carry
  the mark. `ALLOW_TURNSTILE_TESTING` is a security switch with a different meaning and is not
  reused. The Worker's generated types are regenerated (`pnpm run types:worker`) because
  `typecheck` runs `wrangler types --check`.
- **Alternatives considered**: inferring preview from the hostname (fragile; production could be
  reached by other hostnames); a second destination address (spec says same inbox, marked).

## R7. Fail closed and the order of checks (FR-005, FR-007, FR-012, FR-013)

- **Decision**: `handleSubmit` keeps today's order and responses, minus the store:
  method → same-origin → content type → size cap → JSON → honeypot (fake success, no send) →
  validation → Turnstile → **send** → `{ ok: true }`. The duplicate-id lookup, IP hashing, rate
  limit and insert are removed. Turnstile verification and the send stay inside the existing
  `try`; any throw from `send()` returns the existing `503 { ok:false, error:"unavailable" }`.
  Outcomes logged: `sent`, `honeypot` (the spec's "trap"), `invalid`, `turnstile_failed`,
  `unavailable`, `forbidden`, `too_large`. `stored`, `duplicate` and `rate_limited` go. On
  `unavailable` the line carries the error `name` and, when the thrown error has a `code` matching
  `^E_[A-Z_]+$` (the binding's documented codes, e.g. `E_RECIPIENT_NOT_ALLOWED`), that code.
  Nothing else.
- **Rationale**: the confirmation is shown only after `send()` resolves (FR-005). The client
  already keeps field values on 503 (feature 007). The `submission_id` is still validated and
  still used as Turnstile's `idempotency_key`; with no store, a retry with the same id can send a
  second email, which the spec accepts.
- The form's `rateLimited` message and the 429 branch in `ContactForm.astro` become dead and are
  removed; the E2E error table drops the 429 row.

## R8. Removing the message store (FR-009, FR-017, FR-018)

- **Decision**: new migration `migrations/0003_drop_messages.sql`:
  `DROP TABLE IF EXISTS messages;` (SQLite drops the table's three indexes with it). Applied by the
  existing CI deploy scripts: preview on every branch build (`deploy:preview`), production on
  `main` (`deploy:production`). `migrations/0001_create_messages.sql` stays, since D1 records
  applied migrations by file name and a fresh local database must replay the history.
- **Rationale**: D1 migrations are Cloudflare's committed, CI-applied way to change schema
  (Principle VIII). `IF EXISTS` keeps the migration safe on a database where the table is already
  gone. `question_sets` and `usage_bucket` are untouched (schema test proves it).
- **Consequence noted**: D1 Time Travel keeps point-in-time restore history (7 days on Workers
  Free), so dropped rows remain restorable by Don for up to 7 days after the deploy, then are gone.
  The spec removes the recovery-history statement from the privacy policy because the site no longer
  stores messages; this short tail after the switch is mentioned in the PR body, not the policy.
- The comment in `scripts/deploy/preview.ts` that says preview migrations are "additive only" is
  corrected (this is the first non-additive migration; the spec accepts the shared-preview effect).

## R9. Removing the retrieval endpoint, secrets and cron (FR-010, FR-011)

- **Decision**:
  - Delete `worker/src/messages/` and the `/api/messages` branch in `worker/src/index.ts`. Those
    paths fall through to the existing `json({ error: "not_found" }, 404)` regardless of
    `Authorization`.
  - `secrets.required` becomes `["TURNSTILE_SECRET_KEY"]` in both environments.
  - `triggers` becomes `{ "crons": [] }` in **both** environments, and the `scheduled` handler and
    `worker/src/retention.ts` are deleted. Cloudflare: "If the `crons` property is an empty array
    then all the Cron Triggers are removed", whereas if "`triggers` or `crons` are `undefined` then
    the currently deployed Cron Triggers are left in-place"
    (developers.cloudflare.com/workers/configuration/cron-triggers/). Omitting the key would leave
    the 03:17 cron calling a Worker with no `scheduled` handler.
  - Delete `worker/src/contact/{ip-hash,rate-limit,queries}.ts`; drop `RATE_PER_HOUR`,
    `RATE_PER_DAY`, `RETENTION_MONTHS` from `rules.ts`.
- **Rationale**: Principle VII (collect and keep the minimum). The empty `crons` array can be
  removed in a later change once both Workers have deployed with it; that is noted as follow-up
  rather than done here, because removing it early would leave the cron in place.

## R10. Local development and tests with the `send_email` binding

- **Decision**:
  - **Worker tests** (`worker/vitest.config.ts`, `@cloudflare/vitest-plugin`): every test that
    reaches the send injects a fake binding through the existing `run(request, envOverrides)` seam,
    exactly like `fakeAi`: `fakeEmail({ throws? })` records each builder object and returns
    `{ messageId }` or throws an `Error` with a `code`. Tests assert exactly one call, the `to`,
    `from`, `replyTo`, `subject` and `text`, and zero calls on refused paths. `remoteBindings:false`
    already stops any real send. Miniflare's own local `send_email` simulation is never relied on
    for assertions.
  - **E2E** (`wrangler dev` under Playwright): keep the binding in `wrangler.e2e.json`. Cloudflare's
    local simulator does not send: "the email content is logged to the console and saved to local
    files for inspection" (developers.cloudflare.com/email-service/local-development/sending/),
    and it needs no login (unlike `ai`, which `scripts/e2e-wrangler-config.ts` strips). The journey
    test asserts the confirmation; the failure journey stubs `/api/contact` with a 503 via
    `page.route`, as the existing error-table test does.
  - **Fallback** if wrangler dev turns out to proxy `send_email` remotely or reject it offline:
    strip `send_email` in `scripts/e2e-wrangler-config.ts` (like `ai`) and stub the success path
    with `page.route`. The decision is made by the first E2E run in implementation, and noted in
    tasks.
  - `"remote": true` is never set in committed config (it would send real mail from `wrangler dev`).
  - `tests/fixtures/worker/e2e.env` drops `CONTACT_READ_TOKEN` and `IP_HASH_SALT`.
- **Rationale**: one primary layer per behaviour (Development Workflow): the email's content and
  the no-send-on-refusal rules belong to the Worker integration tests; E2E covers only the visitor
  journey.

## R11. Setup check and walkthrough (FR-016, US7)

- **Decision**:
  - New setup item **17 `contact-email`** ("Contact email"), phase `before-merge`, needs Don. Parts:
    1. **Destination verified**: Cloudflare API `emailRouting.addresses.list({ account_id })`
       (SDK `cloudflare@7.2.0`) has `contact@doncoleman.ca` with a non-null `verified` date. The
       read-only token gains **Account → Email Routing Addresses: Read**.
    2. **Sending domain routing on**: the Cloudflare API finds the `drc.dev` zone
       (`zones.list({ name })`) and its Email Routing settings (`emailRouting.get({ zone_id })`)
       report `enabled: true` and status `ready`. The token gains the `drc.dev` zone with
       **Zone: Read** and **Zone Settings: Read**. (Revised 2026-10-10 from public-DNS MX/SPF
       checks on `mail.doncoleman.ca`.)
    3. **doncoleman.ca untouched**: delegated to item 5 (`mail-records`); item 17 adds no record.
  - Item 16 (`contact-bindings`): Worker-secrets part requires only `TURNSTILE_SECRET_KEY`; the
    production-deploy part stops requiring a cron and instead reports a leftover Cron Trigger on
    `dcc-web` as a problem ("the deploy should have removed it"). Databases stay (questions feature).
  - `secrets.ts`: remove `CONTACT_READ_TOKEN` and `IP_HASH_SALT`; extend the token's permission list.
  - `setup/dns-baseline.json`: unchanged. (The earlier plan to copy subdomain records into it was
    dropped with the subdomain on 2026-10-10.)
  - Walkthrough (`.claude/skills/setup-walkthrough/SKILL.md`) and `docs/setup.md` gain item 17 and
    lose the two secrets and the cron, with an after-release step for Don to delete the two retired
    secrets (`wrangler secret delete`, his action).
- **Ordering risk**: Wrangler may refuse to upload a Worker whose `send_email.destination_address`
  is not yet a verified destination in the account. The first commit that adds the binding is
  therefore pushed only after Don has completed item 17 (routing on `drc.dev`, destination
  verified). Until then, implementation stays local (all tests run locally and offline).

## R12. Cost (Principle IX)

- Email Routing: free on Workers Free. Sends to verified destinations: free on all plans and outside
  the sending quota (pricing page). Removing the cron and the message table lowers D1 usage.
  **Expected change: $0/month.** The R3 separate-domain fallback uses `drc.dev`, already owned, so
  it adds no cost.

## R13. Constitution amendment content (first task)

See plan.md "Constitution amendment". Recommended bump **MAJOR** (made as 3.0.0 → 4.0.0, on top of main's issue #143
amendment to 3.0.0): Principle VII's
rules are redefined (no store, no salted hash, no store separation, no retention job) and V's
Contact API entry is redefined. The `speckit-constitution` skill makes the final call on the bump.
