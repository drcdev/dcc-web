---

description: "Task list for contact form sends email instead of storing messages"
---

# Tasks: Contact form sends email instead of storing messages

**Input**: `specs/033-contact-form-email/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md, spec.md, `.specify/memory/constitution.md`

**Tests**: MANDATORY (Constitution Principle I overrides the template's "optional"). Every story has test tasks ordered before the implementation they cover. Each test task names its one primary layer (the cheapest layer that can observe the behaviour, per "Where a test goes" in `docs/testing.md`) and gives the reason for any second layer.

**Organization**: grouped by user story. This is a **major change** (Principle III); auto-merge stays OFF.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US7 from spec.md
- **[PREVIEW-CHECK]**: cannot be verified by an agent locally (needs Don, his dashboard, or the preview/production deployment). Per `.claude/skills/_shared/preview-check.md`: left unticked by the subagent, listed in its summary, collected into the PR body, and auto-merge stays off while any is open.
- Layer tags: `[unit]`, `[worker-unit]` (pure functions in `worker/test`), `[worker-int]` (Worker integration, `pnpm run test:worker`, fake `CONTACT_EMAIL` binding), `[e2e]`.

## ORDERING NOTE (FR-016a) - read before starting

Implementation stays **local**. No commit that carries the `send_email` binding (`wrangler.jsonc`) is **pushed** until Email Routing is on for `mail.doncoleman.ca` and `contact@doncoleman.ca` is verified (T042, T049; Don). Local commits per phase are fine (the git extension commits after each phase); the first push happens at Finish (T048), after T042 and T043. Every test in this list runs offline (fake binding, `wrangler dev` local simulation).

## Phase 1: Setup (amendment and contract fixes)

**Purpose**: the constitution must allow what the rest of the slice builds, and the contracts must match the spec.

- [X] T001 Amend `.specify/memory/constitution.md` through the `speckit-constitution` skill (never by hand), using the content in spec.md "Dependencies" and plan.md "Constitution amendment": Principle I integration-test wording; V Contact API entry (emails each accepted submission to one fixed verified address, stores nothing, no retrieval endpoint, verifies Turnstile); VII (never written to a database, file or log; one destination fixed in committed config; no IP or fingerprint stored or computed; preview emails marked; privacy policy names the email service and retention-on-request); VIII (Email Routing named, retrieval no longer the bearer example, no rate-limit sentence, contact email only to verified destinations, and the CI-applied-configuration bullet saying that turning on Email Routing for the sending subdomain and verifying the destination are one-time account setup by Don confirmed by the setup check, not Worker configuration); Technology Constraints (Contact API line, new Email line); Security Baseline (Turnstile, trap field, same-origin; untrusted-data bullet names contact emails). Recommend 3.0.0 MAJOR and record why in the Sync Impact Report, including the follow-up to delete `CONTACT_READ_TOKEN` and `IP_HASH_SALT`. This is the first implementation task; nothing below starts before it.
- [X] T002 Fix spec-contract mismatch 1 (FR-004): `contracts/contact-email.md` `headerText` also replaces U+2028 and U+2029 with a space, with example rows for U+0085, U+2028 and U+2029; `data-model.md` and `research.md` say the same. Done during analyze; T011 tests it.
- [X] T003 Fix spec-contract mismatch 2 (FR-017a): `plan.md` "Pre-merge sequence" step 5 and `quickstart.md` section 5 state that Don deletes `CONTACT_READ_TOKEN` and `IP_HASH_SALT` from both Workers within 7 days of release as a post-merge PR-body item, and the step order matches FR-016a and FR-017 (steps 1 and 2 before the first push, step 3 on that preview, step 4 immediately before approving, step 5 after merge). Done during analyze.

**Checkpoint**: constitution amended (T001) before any other implementation task.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: binding, types, test fakes and config invariants every story relies on. Local commits only (FR-016a).

- [X] T004 [P] Write failing config tests `[unit]` in `tests/unit/site/config-files.test.ts` per `contracts/worker-config.md` Invariants: exactly one `send_email` binding named `CONTACT_EMAIL` per environment; `destination_address` equals `CONTACT_DESTINATION` and `allowed_sender_addresses` equals `[CONTACT_SENDER]` (imported from `worker/src/contact/email.ts`) in both environments; no `remote: true`; `triggers.crons` present and `[]` in both environments; `secrets.required` exactly `["TURNSTILE_SECRET_KEY"]` in both; `SITE_ENVIRONMENT` is `"preview"` only in `env.preview.vars`. Layer: unit, because the config is a JSON file read directly; no second layer.
- [X] T005 Add constants-only `worker/src/contact/email.ts` exporting `CONTACT_DESTINATION`, `CONTACT_SENDER`, `CONTACT_SENDER_NAME` (builder functions come in T013).
- [X] T006 Edit `wrangler.jsonc` per `contracts/worker-config.md`: `send_email` block, `triggers: { crons: [] }`, `secrets.required: ["TURNSTILE_SECRET_KEY"]` at top level and in `env.preview`; `vars.SITE_ENVIRONMENT = "preview"` in preview. Do not push (FR-016a).
- [X] T007 Regenerate `worker/worker-configuration.d.ts` with `pnpm run types:worker` (Env gains `CONTACT_EMAIL: SendEmail` and `SITE_ENVIRONMENT`, loses the two retired secrets); remove the two retired secret bindings from `worker/vitest.config.ts` and `worker/test/env.d.ts`; remove the two names from `tests/fixtures/worker/e2e.env`; check `scripts/e2e-wrangler-config.ts` keeps `send_email` (fallback in research R10 if `wrangler dev` cannot run it offline).
- [X] T008 [P] Add `fakeEmail()` (records every `send()` call, can be told to reject with an `Error` carrying an `E_*` code) to `worker/test/helpers.ts`; the store/retrieval helpers are removed with their tests in T025.
- [X] T009 Confirm T004 now passes `[unit]` (`pnpm run test:unit`) and `pnpm run typecheck` is clean.

**Checkpoint**: binding and types in place locally; user stories can start.

---

## Phase 3: User Story 1 - A visitor's message reaches Don by email (Priority: P1) MVP

**Goal**: each accepted submission sends exactly one plain-text email to the fixed destination with every field, Reply-To the visitor.

**Independent Test**: submit a valid message with and without organization and project against the fake binding; one send, correct fields.

### Tests for User Story 1 (write first, see them fail)

- [X] T010 [P] [US1] `[worker-unit]` in new `worker/test/contact-email.test.ts`: `buildContactEmail` field table (to constant, from with name, no cc/bcc/html/headers/attachments, body layout with "not given" fallbacks, `Received:` ISO UTC without milliseconds, message verbatim with line breaks, project line); `safeReplyTo` accept/reject table per contract (one `@`, no whitespace/control/`<>,;"()\`; key absent when `undefined`); a visitor address on the destination domain, or equal to `CONTACT_DESTINATION`, still goes to the constant `to` with the visitor as `replyTo` (spec edge case). Layer: pure functions, so worker-unit is cheapest.
- [X] T011 [P] [US1] `[worker-unit]` in `worker/test/contact-email.test.ts`: `headerText` and subject: CR/LF header injection (`Ada\r\nBcc: x@y.z` gives one line), TAB, U+0085, U+007F-U+009F, **U+2028 and U+2029 replaced by a space** (FR-004, mismatch 1), whitespace collapsed and trimmed, subject at most 260 characters with 100-character name and project, `(about <project>)` only when set.
- [X] T012 [US1] `[worker-int]` in `worker/test/contact.test.ts`: a valid POST makes exactly one `send()` on the fake binding and returns `200 {"ok":true}`, with and without organization and project; the recipient is always the constant even if the body carries `to`, `cc`, `bcc` or a header-looking field (US1 scenario 5, SC-001). Second-layer reason: the handler wiring (order, status) is only observable through the real route; T010 and T011 cover the pure builder.

### Implementation for User Story 1

- [X] T013 [US1] Implement `headerText`, `safeReplyTo` and `buildContactEmail` in `worker/src/contact/email.ts` per `contracts/contact-email.md` (as fixed by T002) until T010 and T011 pass.
- [X] T014 [US1] Change `worker/src/contact/submit.ts`: after validation and Turnstile, `await env.CONTACT_EMAIL.send(buildContactEmail(submission, { receivedAt: Date.now(), preview: env.SITE_ENVIRONMENT === "preview", host: url.host }))` then `200 {"ok":true}`; no D1 access on this route. T012 passes.

**Checkpoint**: US1 works against the fake binding.

---

## Phase 4: User Story 2 - A visitor learns when sending fails, and keeps what they typed (Priority: P1)

**Goal**: 200 only after `send()` resolved; any throw gives `503 unavailable` and the client keeps every value.

**Independent Test**: reject the fake `send()`; the response is 503 and the form keeps its values.

- [X] T015 [P] [US2] `[worker-int]` in `worker/test/contact.test.ts`: `send()` rejecting with each of `E_SENDER_NOT_VERIFIED`, `E_RECIPIENT_NOT_ALLOWED`, `E_RATE_LIMIT_EXCEEDED`, `E_DELIVERY_FAILED`, `E_INTERNAL_SERVER_ERROR` and a plain `Error` gives `503 {"ok":false,"error":"unavailable"}` with no retry (one `send()` call); a Turnstile network error also gives 503 with zero sends (SC-003). Layer: Worker integration owns the status mapping.
- [X] T016 [P] [US2] `[e2e]` in `tests/e2e/contact.spec.ts`: a stubbed 503 keeps every typed value and shows the service-unavailable error; a stubbed 200 shows the existing confirmation; the 429 row and the storage/retrieval journey are gone. Rework every other test that reads the retrieval endpoint (double-click, honeypot, `?project=` and markup tests) to assert only what the browser shows: the double-click sends exactly one `POST /api/contact` (counted from page requests), the honeypot shows the success panel, and the project tests check the About line and the request body (the email's project line is T010's job); drop the `uniqueSender`/`CF-Connecting-IP` rate-limit workaround and its header comment. The real valid-send journey against `wrangler dev` (local `send_email` simulation) keeps showing the confirmation. Layer: e2e because focus, message and value retention are only visible in a browser; the status mapping itself is T015.
- [X] T017 [US2] Make T015 pass in `worker/src/contact/submit.ts` (single try/catch around Turnstile and send, `503 unavailable`, no retry).
- [X] T018 [US2] Remove the `rateLimited` message and its 429 branch from `src/components/sections/ContactForm.astro` (any unexpected status keeps the generic message); T016 passes.

**Checkpoint**: failures are visible and non-lossy.

---

## Phase 5: User Story 3 - The site no longer keeps contact messages (Priority: P1)

**Goal**: no table, no retrieval endpoint, no retention job, no cron, no retired secrets, no per-sender data.

**Independent Test**: `messages` does not exist, `/api/messages*` is 404 with or without a token, the Worker has no `scheduled` export and no cron.

### Tests for User Story 3 (write first)

- [X] T019 [P] [US3] `[worker-int]` in `worker/test/router.test.ts` (replaces `retrieval.contract.test.ts`): `GET /api/messages/new`, `POST /api/messages/{id}/read` and any other `/api/messages*` path or method give byte-identical `404 {"error":"not_found"}` with the security headers, with a valid old-style bearer token and with none (SC-005).
- [X] T020 [P] [US3] `[worker-int]` in `worker/test/schema.test.ts` and `worker/test/query-plans.test.ts` (local D1): after all migrations `messages` and its three indexes are absent, `question_sets` and `usage_bucket` are intact, `d1_migrations` lists 0001 to 0003; the query-plan test is trimmed to the questions queries.
- [X] T021 [P] [US3] `[worker-int]` in `worker/test/contact.test.ts`: an accepted submission writes nothing to D1 (all tables unchanged) and the Worker entry has no `scheduled` export (FR-009, FR-011). Layer: worker-int because D1 state and the entry export are observed on the real runtime.
- [X] T022 [P] [US3] `[unit]` in `tests/unit/site/config-files.test.ts`: no `CONTACT_READ_TOKEN`, `IP_HASH_SALT`, `messages` binding or cron remains in `wrangler.jsonc`, `.env.example`, workflows or `tests/fixtures/worker/e2e.env` (extends T004; `tests/unit/setup/drift.test.ts` keeps the manifest in step).

### Implementation for User Story 3

- [X] T023 [US3] Add `migrations/0003_drop_messages.sql` (`DROP TABLE IF EXISTS messages;`); T020 passes.
- [X] T024 [US3] Delete `worker/src/messages/`, `worker/src/retention.ts`, `worker/src/contact/{ip-hash,rate-limit,queries}.ts`; remove the `/api/messages` route and `scheduled` export from `worker/src/index.ts`; remove `RATE_PER_HOUR`, `RATE_PER_DAY`, `RETENTION_MONTHS` from `worker/src/contact/rules.ts`; keep `CF-Connecting-IP` only as Turnstile `remoteip`. T019, T021, T022 pass.
- [X] T025 [US3] Delete the obsolete tests `worker/test/{ip-hash,rate-limit,retention,retrieval.contract}.test.ts`, remove the store/retrieval helpers from `worker/test/helpers.ts`, and update `worker/test/rules.test.ts` for the removed constants (their behaviour is covered by T019 to T021 and T027).

**Checkpoint**: nothing is stored.

---

## Phase 6: User Story 4 - Spam and abuse are still kept out (Priority: P2)

**Goal**: honeypot, validation, Turnstile, same-origin and size cap each stop a send; repeat senders are not limited; logs carry outcome only.

- [X] T026 [P] [US4] `[worker-int]` in `worker/test/contact.test.ts`: zero `send()` calls for honeypot (fake `{ok:true}`), invalid fields, Turnstile failure (wrong action or hostname, success false), cross-origin, no `Origin` header, `Origin: null`, wrong content type, over 10 KB (SC-006, US4 scenario 3).
- [X] T027 [P] [US4] `[worker-int]` in `worker/test/contact.test.ts`: the same sender sending many times in a row is never refused (no 429), replacing `rate-limit.test.ts`.
- [X] T028 [P] [US4] `[worker-int]` in `worker/test/logging.test.ts`: one JSON line per request with outcomes `sent`, `honeypot`, `invalid`, `turnstile_failed`, `unavailable` (adds `name` and an `E_*` `code` only), `forbidden`, `too_large`; no field value, address, IP, token or message id appears in any line (FR-013).
- [X] T029 [US4] Make T026 to T028 pass in `worker/src/contact/submit.ts` and the handler's logging (outcome type updated; `stored`, `duplicate`, `rate_limited` removed).

---

## Phase 7: User Story 5 - Preview deployments do not mix with real enquiries (Priority: P2)

**Goal**: preview emails say so; production emails do not.

- [X] T030 [P] [US5] `[worker-unit]` in `worker/test/contact-email.test.ts`: `preview: true` gives subject prefix `[Preview] ` and a first body line naming the host followed by a blank line; `preview: false` gives neither.
- [X] T031 [P] [US5] `[worker-int]` in `worker/test/environments.test.ts`, both Vitest projects: with `SITE_ENVIRONMENT = "preview"` the sent email is marked; with it absent it is not. Second-layer reason: proves the var wiring from `Env`, which T030 cannot see.
- [X] T032 [US5] Make T030 and T031 pass in `worker/src/contact/email.ts` and `submit.ts` (var read, marker applied).

---

## Phase 8: User Story 6 - A visitor understands where their message goes (Priority: P2)

**Goal**: privacy policy, Contact note and technology page describe email delivery in plain language, and still pass accessibility.

- [X] T033 [P] [US6] `[unit]` (content) in `tests/unit/site/privacy-policy.test.ts`: the policy names the email service (Cloudflare) and says the email is then kept in Don's mailbox with his mail provider; says the site stores nothing; says the IP address is not stored or used to limit sending but is still passed to the human-check service; says Don keeps contact emails only as long as needed and deletes one on request, answering within 30 days; explains how to ask (the form, or the contact address shown as a link whose text is the address); says deletion covers copies and the deleted-items folder while the provider's backups follow its terms; drops the D1, region, recovery-history, IP-hash, 12-month and "no email is sent" wording; and has a current `Last updated: <day> <month> <year>` line (FR-014, FR-007b).
- [X] T034 [P] [US6] `[unit]` (content) in `tests/unit/content/site-pages.test.ts`: the Contact note matches the policy's retention statement and keeps the consent link (FR-015); the technology page names email delivery and no longer names D1 storage or the cron for contact data.
- [X] T035 [US6] Reword `src/content/pages/privacy-policy.mdx`, `contact.mdx` and `technology.mdx` in plain language and update "Last updated"; T033 and T034 pass.
- [X] T036 [US6] `[e2e]` run the existing a11y and contact checks (`tests/e2e/a11y.spec.ts`, `tests/e2e/contact.spec.ts`) for the Contact and privacy pages and fix any WCAG 2.2 AA finding in the changed text (FR-007a, FR-007b, SC-009). No new test file: the template matrix already covers these pages (accessibility checks cover templates, not stories).

---

## Phase 9: User Story 7 - Don completes the one-time email setup (Priority: P3)

**Goal**: the setup check, secret manifest, docs and walkthrough describe and verify the email setup; Don's dashboard steps are marked for preview-check.

### Tests (write first)

- [X] T037 [P] [US7] `[unit]` in new `tests/unit/setup-check/checks/contact-email.test.ts`: item 17 per `contracts/setup-check.md`: destination missing, present-unverified and verified; an authorisation error names "Email Routing Addresses: Read"; subdomain MX (`route1/2/3.mx.cloudflare.net`) and SPF `include:_spf.mx.cloudflare.net` missing or present; complete summary text. Provider fixtures under `tests/unit/setup-check/`.
- [X] T038 [P] [US7] `[unit]` in the item 16 tests under `tests/unit/setup-check/checks/` and in `tests/unit/setup/*.test.ts`: item 16 requires only `TURNSTILE_SECRET_KEY`, reports a cron still registered on `dcc-web` as a problem, has no `productionCron` or `DEFAULT_CRON`; the manifest drops the two secrets and adds the Email Routing Addresses Read permission with `usedBy: contact-email`; `drift.test.ts` still passes; the DNS baseline schema accepts the subdomain records.

### Implementation

- [X] T039 [US7] Add `listEmailRoutingAddresses` (read-only, `client.emailRouting.addresses.list`) to `scripts/setup-check/providers/cloudflare.ts` and the new `scripts/setup-check/checks/contact-email.ts`; register item 17 in `scripts/setup-check/items.ts` (order 17, phase `before-merge`, needsDon, principles VII VIII IX, dependsOn `local-credentials`, `cloudflare-zone`, `mail-records`); update `types.ts` and `cli.ts` as needed. T037 passes.
- [X] T040 [US7] Update item 16 (`checks/contact-bindings.ts`, `contact-shared.ts`) and `scripts/setup-check/secrets.ts` per the contract; correct the "additive only" comment in `scripts/deploy/preview.ts`. T038 passes.
- [X] T041 [P] [US7] Add `## 17. Contact email {#contact-email}` and trim item 16 in `docs/setup.md`; add the matching step to `.claude/skills/setup-walkthrough/SKILL.md` (subdomain `mail` only, stop if the dashboard touches apex records, verify the destination, extend the read-only token, delete retired secrets within 7 days of release using `--env-file /dev/null`). A test reads the walkthrough `SKILL.md`: keep it passing.
- [ ] T042 [US7] [PREVIEW-CHECK] Don turns on Email Routing for `mail.doncoleman.ca` only (Cloudflare dashboard, Settings, Subdomains), refuses any apex record change, adds and verifies `contact@doncoleman.ca`, sends himself a normal email to it, and adds Email Routing Addresses: Read to the read-only token. This also confirms research R3. Leave unticked; it unblocks the first push (FR-016a).
- [ ] T043 [US7] [PREVIEW-CHECK] After T042, copy the records Cloudflare created on `mail.doncoleman.ca` (MX x3, SPF TXT, DKIM TXT if any) exactly into `setup/dns-baseline.json`, then run `pnpm run setup:check`; items 4, 5 and 17 must pass (item 5 passing is SC-008). It cannot be verified before Don's dashboard step, so it stays open until then.

---

## Phase 10: Polish and cross-cutting concerns

- [X] T044 FR-019 search: outside `specs/` and `migrations/`, search for `CONTACT_READ_TOKEN`, `IP_HASH_SALT`, `/api/messages`, `messages` table references, and contact-message retention, rate limiting or retrieval; update each hit (docs, `.env.example`, skills, comments, `docs/testing.md`, CLAUDE.md if stale) or record why it is still correct. Repeat the search immediately before the PR opens. Done: stale hits fixed in `docs/setup.md` (rate-limit rule text) and `docs/testing.md` (worker layer row); the rest are correct (retired-secret deletion steps, tests asserting the removals, comments naming migration 0003). Repeat before the PR opens.
- [X] T045 Update the visual baselines if the Contact note or any other shell, template or design-system text changed the pixels of the visual project (the contact form shot, and any privacy-page shot): read `.claude/skills/_shared/visual-baselines.md`, run `pnpm run test:visual:update` (macOS), then `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it); compare `-previous.png`; do not run the macOS update while Docker builds `dist`; commit only the changed `*-darwin.png` and `*-linux.png`. If the visual project shows no diff, record that and change nothing. Done: the macOS visual contact form shots (4) pass, no pixels changed, no baseline touched.
- [ ] T046 Run `pnpm run verify:quick`, then ask Don before the full `pnpm run verify` (parallel gates crash his machine); run it in the background under the wrapper and read `VERIFY_EXIT=`. Merge `origin/main` first (shared files `wrangler.jsonc`, setup items). Walk the quickstart section 1 table, including the removed-route check.
- [ ] T047 Prepare the PR body: flag it as a **major change** naming the Principle III criteria (FR-020); list the pre-merge items (T050, T051) and post-merge items (T052, T053) as checkboxes (FR-017, FR-017a); note that the apex DMARC follow-up (#136) must account for `mail.doncoleman.ca`; open the PR from `drc-agents`; leave auto-merge **off** while any `[PREVIEW-CHECK]` is open.
- [ ] T048 Finish: only after T042 and T043 are done, push the branch (the first push carrying the binding, FR-016a) and open the PR.

### Don's deployment checks (all `[PREVIEW-CHECK]`, left unticked by the agent)

- [ ] T049 [PREVIEW-CHECK] Gate for the first push: `pnpm run setup:check` shows item 17 complete (Email Routing on for `mail.doncoleman.ca`, `contact@doncoleman.ca` verified). Same outcome as T042; tick once the check passes.
- [ ] T050 [PREVIEW-CHECK] Preview send: from `br-033-contact-form-email-dcc-web-preview.drc-dev.workers.dev/contact/` (via a project story's contact link) a message arrives within 5 minutes, subject `[Preview] Contact form: <name> (about <project>)`, first body line names the preview host, Reply addresses the visitor, and a second send straight away is also delivered (SC-002 on preview).
- [ ] T051 [PREVIEW-CHECK] Immediately before approving: collect unread production messages through the retrieval endpoint, then re-check that it returns an empty list of new messages (FR-017). Then approve; the merge deploys `0003_drop_messages.sql` and removes the cron.
- [ ] T052 [PREVIEW-CHECK] After merge: one production test send from `https://doncoleman.ca/contact/` (arrives within 5 minutes, no `[Preview]`, Reply addresses the visitor); `/api/messages/new` returns 404 with and without the old token; listing each remote database's tables (`dcc-web` and `dcc-web-preview`, read-only `SELECT name FROM sqlite_master WHERE type='table'`) shows no `messages` and both questions tables (FR-009, SC-004); `pnpm run setup:check` shows item 16 without a cron and item 17 complete.
- [ ] T053 [PREVIEW-CHECK] Within 7 days of release (FR-017a): Don deletes `CONTACT_READ_TOKEN` and `IP_HASH_SALT` from both Workers' secret stores (`pnpm exec wrangler secret delete <NAME> --env-file /dev/null`, plus `--env preview` for the preview Worker). Hygiene, not a security deadline. He also retires or reconfigures his scheduled assistant that called the retrieval endpoint.

---

## Dependencies and execution order

- Phase 1 first; T001 before everything. T002 and T003 were completed during analyze (doc edits only).
- Phase 2 blocks all stories. Within it: T005 before T004 can import its constants; T004 and T008 are parallel; T006, then T007, then T009.
- US1 (Phase 3) is the MVP. US2 depends on US1's `submit.ts`. US3 touches `submit.ts` and `index.ts`, so it runs after US1 and US2. US4 and US5 follow US1 and US3 (same files). US6 (content only) and US7 (scripts and docs) are independent of the Worker code and can run in parallel with US4 and US5.
- T042, T043 and T049 to T053 are Don-owned and gate Finish (T048) and the merge. T045 (baselines) comes after US6 wording is final; T046 is the last agent task before Finish.

## Parallel opportunities

- Phase 2: T004 and T008. US1 tests T010, T011. US2 tests T015, T016. US3 tests T019 to T022. US4 tests T026 to T028. US5 tests T030, T031. US6 tests T033, T034. US7 tests T037, T038 and docs T041.
- US6 and US7 in parallel with US4 and US5 (different files).

## Implementation strategy

US1 with Phase 2 is the MVP, but the slice ships only whole: US1 to US3 (P1) must land in one PR (FR-017). Build locally with the fake binding, commit per phase, do not push until T042 and T043 are done; then push at Finish, run the preview check (T050), and keep auto-merge off until Don has ticked every open `[PREVIEW-CHECK]` item that gates the merge.

---

## Phase 11: Convergence

- [X] T054 Fix stale contact comments per FR-019 (partial): `tests/unit/site/privacy-policy.test.ts` header says the policy "takes the retention period from the shared rules" and `tests/unit/content/site-pages.test.ts` (comment above the Last-updated test) says the region and retention facts "are pinned against the shared rules"; neither is true now (no region, no retention constant). Reword both to describe the email-delivery facts the tests pin, and correct the feature-007 requirement numbers left in feature-033 code comments and test names (`worker/src/contact/submit.ts` "FR-016" for logging is FR-013, "FR-011" for the honeypot is FR-007, "FR-012a" is FR-005; `worker/test/environments.test.ts` "FR-016" for the preview mark is FR-006). Comment and test-name text only; no behaviour change.
