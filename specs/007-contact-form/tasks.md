# Tasks: Contact Form and Message Retrieval

**Input**: Design documents from `/specs/007-contact-form/` (plan.md, spec.md, research.md, data-model.md, contracts/*, quickstart.md)

**Prerequisites**: plan.md, spec.md. Constitution Principle I applies: **tests are mandatory and test-first**. Every test task must be run and **seen to fail for the right reason** before the implementation tasks after it begin; record the failing output in the task notes. Each phase ends with the whole suite green: no test written in one phase is left failing for a later phase to fix, and no task is marked done on a red suite.

**Organization**: `## Phase N` sections, each sized for one subagent. Phases 1 and 2 block everything. Story phases follow spec priority (P1, P2, P3). Tasks suffixed `[PREVIEW-CHECK]` need Don's Cloudflare account, the preview deployment or Don's eyes, and a subagent cannot verify them locally; the orchestrator must leave them open for Don.

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: parallelisable (different files, no dependency on an incomplete task).
- **[US#]**: US1 send, US2 error recovery, US3 retrieval, US4 spam and abuse, US5 project link, US6 privacy policy, US7 retention, US8 preview separation, US9 setup.
- Toolchain: `node -v` must be v24 (else `source ~/.nvm/nvm.sh && nvm use` in the same command); use `corepack pnpm`; bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd>`; `verify` needs `ASTRO_PREVIEW_BACKGROUND=1`.
- Never print secret values. Constitution Principle IV: consult the Astro Docs MCP (`astro-docs`) before Astro-specific choices (fall back to docs.astro.build and say so).
- Limits used throughout (from `worker/src/contact/rules.ts`, data-model.md): name ≤ 100, email ≤ 254, organization ≤ 100, project ≤ 100, message ≤ 5,000 characters; body ≤ 10,240 bytes; 3 per rolling hour and 5 per rolling day per IP hash; retention 12 months; `ip_hash` cleared from rows older than 24 hours.

---

## Phase 1: Setup (workspace and tooling)

**Purpose**: the `worker/` workspace package and toolchain wiring. No feature behaviour.

- [X] T001 Write the failing test first: extend `tests/unit/site/config-files.test.ts` to assert `pnpm-workspace.yaml` lists `worker`, `worker/package.json` exists with the Vitest 4 and plugin devDeps, `worker/tsconfig.json` exists and root `tsconfig.json` excludes `worker/`, the ESLint config covers `worker/**` with `@typescript-eslint/no-floating-promises` on, and the `typecheck`, `test`, `types:worker` and `deploy:production` scripts in `package.json` are wired per plan.md. Run it and confirm it fails.
- [X] T002 Add `packages: ["worker"]` alongside the existing entries in `pnpm-workspace.yaml`; create `worker/package.json` (private `@dcc-web/worker`, devDeps `vitest` 4.1.x and `@cloudflare/vitest-plugin` 1.3.x, `test` script `vitest run`) per plan.md and research R5. Pick versions outside pnpm `minimumReleaseAge` or add exact `minimumReleaseAgeExclude` entries as the file already does.
- [X] T003 Bump `wrangler` in root `package.json` to the version the plugin pins (4.144.0, research R5) and run `corepack pnpm install` to update `pnpm-lock.yaml`; confirm the worker package resolves vitest 4.1.x while the root keeps 5.x.
- [X] T004 [P] Create `worker/tsconfig.json` (strict, `types` from `./worker-configuration.d.ts`) and exclude `worker/` from the root `tsconfig.json`.
- [X] T005 [P] Extend the ESLint config (`eslint.config.*`) to cover `worker/` (typescript-eslint `projectService` on `worker/tsconfig.json`) with `@typescript-eslint/no-floating-promises` on for `worker/**`.
- [X] T006 Update `package.json` scripts per plan.md "How the new test layers plug into verify": `typecheck` adds `tsc -p worker` and `wrangler types worker/worker-configuration.d.ts --check`; `test` adds `pnpm --filter ./worker test`; add `types:worker` and a `deploy:production` entry (its script file is written in Phase 11). Re-run the config-files test until it passes.

**Checkpoint**: `corepack pnpm install --frozen-lockfile` works and the suite is green.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Wrangler config, migration, shared rules, Worker skeleton, test harnesses.

### Tests first (seen to fail)

- [X] T007 [P] Write `worker/test/rules.test.ts` for `validateSubmission()` and the limits exported by `worker/src/contact/rules.ts` (`NAME_MAX` 100, `EMAIL_MAX` 254 with the basic format check, `ORGANIZATION_MAX` 100, `PROJECT_MAX` 100 with control characters removed, `MESSAGE_MAX` 5,000, whitespace-only counts as empty, consent must be `true`, `BODY_MAX_BYTES` 10,240, `RATE_PER_HOUR` 3, `RATE_PER_DAY` 5, `RETENTION_MONTHS` 12) per contracts/contact-api.md, data-model.md, FR-002, FR-003a, FR-006, FR-018a. Run; must fail (module missing).
- [X] T008 [P] Write `worker/vitest.config.ts` (`cloudflareTest({ wrangler: { configPath: "../wrangler.jsonc" } })`), `worker/test/setup.ts` (`applyD1Migrations` per file) and `worker/test/schema.test.ts` asserting the `messages` columns, `CHECK` limits and the three indexes from data-model.md exist after migrations. Run; must fail.
- [X] T009 [P] Extend `tests/unit/site/config-files.test.ts` with assertions for `wrangler.jsonc` per contracts/worker-config.md: `main`, `run_worker_first` exactly `["/api/*"]`, production binds only `contact` and `env.preview` (Worker `dcc-web-preview`) binds only `contact-preview`, both as `DB`, the two `database_id` values present and different, each either a 36-character UUID or the committed placeholder (the placeholder allowance is removed in T074), cron `17 3 * * *` in both environments, the same three `secrets.required` names in both, invocation logs off, no secret-looking `vars`; migrations are additive only; `playwright.config.ts` serves through `wrangler dev` with `--env-file tests/fixtures/worker/e2e.env` and `.cache/` is gitignored. Must fail.
- [X] T010 [P] Write `worker/test/router.test.ts`: an unknown `/api/*` path answers `404 {"error":"not_found"}` as JSON (not the HTML 404 page); every response carries `Content-Type: application/json; charset=utf-8`, the Worker security headers (research R1) and no `Access-Control-*` header (FR-022, FR-023b). Must fail.

### Implementation

- [X] T011 Create `migrations/0001_create_messages.sql` per data-model.md (table, constraints, indexes for list-new, rate-limit lookups and retention).
- [X] T012 Edit `wrangler.jsonc` per contracts/worker-config.md: `main`, `run_worker_first`, `d1_databases` (placeholder IDs until Phase 14), cron, `secrets.required`, `env.preview`, observability with invocation logs off. Keep existing assets and headers settings.
- [X] T013 Implement `worker/src/contact/rules.ts` (shared limits, `RETENTION_MONTHS`, `validateSubmission()`); make `rules.test.ts` pass.
- [X] T014 Implement `worker/src/http.ts` (JSON responses and security headers, no CORS) and the `worker/src/index.ts` skeleton: `fetch` handles only `/api/*` (unknown path 404 JSON) and an empty `scheduled` handler; make `router.test.ts` pass.
- [X] T015 Generate `worker/worker-configuration.d.ts` with `corepack pnpm run types:worker` and commit it; make the schema and config tests pass; run `corepack pnpm run typecheck` and `corepack pnpm --filter ./worker test`.
- [X] T016 Update `playwright.config.ts` so the web server is `wrangler dev` serving the built site plus the Worker: remove `.cache/e2e-state`, apply local migrations, then `wrangler dev --ip 127.0.0.1 --port 4321 --persist-to .cache/e2e-state --env-file tests/fixtures/worker/e2e.env` (plan.md, research R4). Create `tests/fixtures/worker/e2e.env` with the public Turnstile test secret, a fake read token and a fake salt only; ensure `.cache/` is gitignored. Confirm the config test and the existing e2e projects pass.

**Checkpoint**: Worker package tests run against local D1; Playwright serves through `wrangler dev`; the suite is green.

---

## Phase 3: User Story 1 - Visitor sends a message: Worker submit path (P1)

**Goal**: `POST /api/contact` accepts a valid same-origin submission, verifies Turnstile, and stores one row in D1.

**Independent test**: the Worker integration test stores one row with a hashed IP from a valid submission.

### Tests first (seen to fail)

- [ ] T017 [P] [US1] Write `worker/test/contact.test.ts` (accept and refuse at the edge) per contracts/contact-api.md: a valid submit returns `200 {"ok":true}` and stores one row with `ip_hash` and no raw IP, organization null, status `new`; wrong method 405 with `Allow: POST`; `Origin` missing, foreign, or `Sec-Fetch-Site` not `same-origin` → 403; `http:` on a non-local host → 403 while `127.0.0.1`/`localhost` are accepted (FR-014); wrong content type 415; `Content-Length` over 10,240 and a streamed body over 10,240 bytes → 413 with no row. Turnstile (mocked siteverify): accepted only when `success`, `action === "contact"` and `hostname` equals the request host, otherwise 422 with no row; siteverify unreachable or non-200 → 503 with no row (FR-012a); siteverify receives `remoteip` and `idempotency_key` and no form field (FR-012b); siteverify is the only outbound request (FR-026). Must fail.
- [ ] T018 [P] [US1] Write `worker/test/ip-hash.test.ts`: HMAC-SHA-256 known vector with a test salt gives 64 lowercase hex characters; the same IP under a different salt gives a different hash. Must fail.
- [ ] T019 [P] [US1] Write `worker/test/logging.test.ts`: spy on `console` across the submit success and failure paths and assert at most one line per request carrying only `event`, `outcome` and, for a 503, an error `name`; no submitted value, IP or hash appears (FR-016). Must fail.
- [ ] T020 [P] [US1] Write `worker/test/query-plans.test.ts`: `EXPLAIN QUERY PLAN` for every statement the submit path runs at this phase (duplicate check, insert), asserting no `SCAN messages` (FR-025a). Must fail.

### Implementation

- [ ] T021 [US1] Implement `worker/src/contact/ip-hash.ts` (HMAC-SHA-256 with `IP_HASH_SALT`) and `worker/src/contact/turnstile.ts` (server-side siteverify with action and hostname checks, fail closed, research R6).
- [ ] T022 [US1] Implement `worker/src/contact/submit.ts` (method, scheme, origin and content-type checks, size cap, parse, `validateSubmission`, duplicate check, Turnstile, insert; outcome-only structured logs) and route `POST /api/contact` in `worker/src/index.ts`; make the Phase 3 Worker tests pass.
- [ ] T023 [US1] Run `corepack pnpm --filter ./worker test` and `corepack pnpm run typecheck` until green.

**Checkpoint**: the submit path works against local D1.

---

## Phase 4: User Story 1 - Visitor sends a message: page and island (P1)

**Goal**: a visitor submits the form at `/contact/` and sees a confirmation; the message is stored in D1.

**Independent test**: E2E valid send with organization blank shows the focused success panel and one stored row.

### Tests first (seen to fail)

- [ ] T024 [P] [US1] Extend `tests/unit/site/csp.test.ts`: `/contact/` gets the Turnstile script and frame sources (`https://challenges.cloudflare.com`) while the site-wide CSP is unchanged (contracts/contact-page.md "CSP"). Must fail.
- [ ] T025 [P] [US1] Write `tests/component/sections/ContactForm.test.ts` (Astro Container API) for the contracts/contact-page.md static markup table: labelled fields with `maxlength` from the shared rules, `autocomplete` input purposes, the required note, the consent sentence as the checkbox label with the privacy link opening in a new tab, the honeypot hidden from everyone, the no-JS notice before the fields, Send disabled in markup, the project line not focusable, and DOM order Name, Email, Organization, Message, consent checkbox, privacy link, human-check slot, status region, Send (FR-008a to FR-008p, FR-008o). Must fail.
- [ ] T026 [P] [US1] Write `tests/e2e/contact.spec.ts` journey "valid send": fill, consent, Send, success panel shown and focused within 5 s (SC-001), message retrievable via the API with the fixture token (retrieval assertion enabled in Phase 6); no request to `challenges.cloudflare.com` before the first interaction (FR-009); no CSP violation through the submission (`tests/e2e/csp-violations.ts`). Set a unique `CF-Connecting-IP` per test via `page.route` (research R6). Must fail.
- [ ] T027 [P] [US1] Add a `contact` template to `tests/e2e/templates.ts` so the `a11y` (axe), `budget`, `shell` and `no-js` projects cover `/contact/`; extend `tests/e2e/no-js.spec.ts` for the no-JS notice if needed. Extend `tests/unit/site/navigation.test.ts` so `/contact/` is not in `futureDestinations`. Must fail.

### Implementation

- [ ] T028 [US1] Create `src/components/sections/ContactForm.astro` ported from `.reference/flux` (markup, processed island `<script>` posting JSON to `/api/contact`, success panel with focus, Turnstile loaded on first interaction, per-page `Astro.csp`); import limits from `worker/src/contact/rules.ts`. Consult the Astro Docs MCP for client scripts, CSP and `astro:env`.
- [ ] T029 [US1] Register `ContactForm` in `src/components/sections/index.ts` and `schemas.ts`; add `PUBLIC_TURNSTILE_SITE_KEY` to `env.schema` in `astro.config.mjs` (public, client); make the always-pass test site key available to the build used by E2E.
- [ ] T030 [US1] Create `src/content/pages/contact.mdx` (title "Contact", copy, privacy note, `<ContactForm />`) and remove `/contact/` from `futureDestinations` in `src/config/navigation.ts`.
- [ ] T031 [US1] Run component, unit, Worker, csp and navigation tests and the `contact.spec.ts`, `a11y`, `budget`, `no-js`, `shell` e2e projects until green.

**Checkpoint**: US1 works end to end locally.

---

## Phase 5: User Story 2 - Visitor recovers from an error (P1)

**Goal**: every failure is explained in plain language and nothing the visitor typed is lost.

### Tests first (seen to fail)

- [ ] T032 [P] [US2] Extend `worker/test/contact.test.ts` with every validation row of contracts/contact-api.md: several field errors returned together in `fields`, each field code (`required`, `too_long`, `invalid`) including the 100/254/100/100/5,000 limits, consent missing, whitespace-only as empty, `invalid_json`, and a D1 failure on the duplicate check or the insert → 503 with nothing stored (FR-012a). Must fail.
- [ ] T033 [P] [US2] Extend `tests/component/sections/ContactForm.test.ts` for error containers (`aria-describedby`, `aria-invalid`, polite live region, form-level status region above Send, sending state) per FR-008e to FR-008i. Must fail.
- [ ] T034 [P] [US2] Extend `tests/e2e/contact.spec.ts`: no consent error tied to the checkbox; invalid email and 5,001-character message errors naming the field and limit, with values kept and focus on the first invalid field; double-click Send stores one message; `/api/contact` fulfilled with 503 and with 429 shows the contract's plain error with values kept and focus on Send; Turnstile script aborted shows "The spam check couldn't load. Please try again later." with values kept; keyboard-only path with announced errors and success. Must fail.

### Implementation

- [ ] T035 [US2] Complete server error mapping (400 `validation` and `invalid_json`, 503 on D1 failure) in `worker/src/contact/submit.ts`; make the Worker tests pass.
- [ ] T036 [US2] Implement client validation, error rendering, first-error focus, sending state, double-submit guard and retry in the `ContactForm.astro` island; make component and e2e tests pass.
- [ ] T037 [US2] Run the axe `a11y` project on `/contact/` in an error state and with the success panel shown, in both themes (SC-009), and fix findings (contrast pairs from the design-source adjustments table).

---

## Phase 6: User Story 3 - Don retrieves new messages through an assistant (P1)

**Goal**: a bearer-token holder lists new messages and marks them read, and can do nothing else.

### Tests first (seen to fail)

- [ ] T038 [P] [US3] Write `worker/test/retrieval.contract.test.ts` for every row of contracts/retrieval-api.md: identical 401 (body and headers) for a missing header, another scheme, an empty value, a wrong token and the other environment's token, on every route and method, and when the secret is unset; token read only from `Authorization`; list-new returns only unread messages oldest first in the documented shape with no `ip_hash` or `status`; `limit` 1–100 (default 50) and `after` cursor paging across 120 messages, each exactly once; invalid `limit` or cursor 400; mark-read 200 then 409, unknown or non-UUID id 404, no content in 404/409; wrong methods 405 with `Allow`; no CORS headers; no delete, edit or single-message route (FR-020 to FR-023b). Must fail.
- [ ] T039 [P] [US3] Extend `worker/test/query-plans.test.ts` and `worker/test/logging.test.ts` to the retrieval statements and paths. Must fail.
- [ ] T040 [P] [US3] Enable the retrieval assertions in `tests/e2e/contact.spec.ts` (send, list with the fixture token, mark read, list empty, mark again 409, no header 401). Must fail.

### Implementation

- [ ] T041 [US3] Implement `worker/src/messages/auth.ts` (bearer; SHA-256 digests compared with `crypto.subtle.timingSafeEqual`, constant time), `list-new.ts` and `mark-read.ts`; route them in `worker/src/index.ts`; make contract, query-plan and logging tests pass.
- [ ] T042 [US3] Run the retrieval e2e assertions and the curl steps of quickstart section 4 against `wrangler dev`.

---

## Phase 7: User Story 4 - Spam and abuse are kept out (P2)

**Goal**: honeypot, Turnstile, rate limits and origin checks stop abuse without bothering real visitors.

### Tests first (seen to fail)

- [ ] T043 [P] [US4] Extend `worker/test/contact.test.ts`: a filled `website` honeypot returns `200 {"ok":true}` with no row, no siteverify call and no D1 access (FR-011); the 4th accepted submission in a rolling hour and the 6th in a rolling day per IP hash are refused with `429 rate_limited` and a `Retry-After` header; window edges (just inside and just outside 60 minutes and 24 hours); refused submissions do not count (FR-013a); different IPs are independent; the sender is taken only from `CF-Connecting-IP`, an `X-Forwarded-For` header is ignored, and a missing `CF-Connecting-IP` counts against one shared `unknown` sender (FR-013b); a D1 failure on the rate-limit count → 503 with nothing stored (FR-012a). Must fail.
- [ ] T044 [P] [US4] Write `worker/test/rate-limit.test.ts` for exact D1 row counting and index use of the rate-limit query (no `SCAN messages`). Must fail.
- [ ] T045 [P] [US4] Extend `tests/e2e/contact.spec.ts`: the hidden field is never reachable by keyboard or announced (FR-008d) and a filled honeypot shows success. Must fail.

### Implementation

- [ ] T046 [US4] Implement `worker/src/contact/rate-limit.ts`; add the honeypot step and the rate-limit step (fail closed) to `submit.ts` in the contract's processing order; make all US4 tests pass.

---

## Phase 8: User Story 5 - Visitor coming from a project story (P2)

**Goal**: `/contact/?project=<name>` shows "About: <name>" and stores the project safely.

### Tests first (seen to fail)

- [ ] T047 [P] [US5] Extend `tests/component/sections/ContactForm.test.ts` and `tests/e2e/contact.spec.ts`: `?project=Cadence` shows "About: Cadence" and stores it; a 150-character `<b>x</b>` value renders as text, is cut to 100 and stored the same way; no parameter shows no line and stores null. Must fail.
- [ ] T048 [P] [US5] Extend `worker/test/contact.test.ts` for project length, control-character removal and storage as plain text. Must fail.

### Implementation

- [ ] T049 [US5] Implement project parameter handling (text-only rendering, 100-character cut) in the `ContactForm.astro` island and server validation; make tests pass. Note any project-story pages that already link to `/contact/?project=` (do not add new content).

---

## Phase 9: User Story 6 - Visitor understands what happens to their information (P2)

**Goal**: the privacy policy and the contact page note state the FR-019 facts, kept in sync with the code.

### Tests first (seen to fail)

- [ ] T050 [P] [US6] Write `tests/unit/site/privacy-policy.test.ts` asserting `src/content/pages/privacy-policy.mdx` states the collected fields, `RETENTION_MONTHS` from the shared rules, "Western North America", the IP fingerprint handling (removed after about two days), Turnstile with exactly the FR-012b list and its privacy addendum link, the deletion request route with the 30-day answer and the 7-day Time Travel note, no leftover placeholders, `draft: true` unchanged. Must fail.
- [ ] T051 [P] [US6] Extend the `ContactForm` component test and `tests/e2e/contact.spec.ts` for the page note linking to the privacy policy (underlined, "(opens in a new tab)"). Must fail.

### Implementation

- [ ] T052 [US6] Edit only "The contact form", "Spam protection", "Your choices" and "Last updated" in `src/content/pages/privacy-policy.mdx` per plan.md "Privacy policy text"; make the tests pass and run the `pages`, `seo` and `a11y` e2e projects for `/privacy-policy/`.

---

## Phase 10: User Story 7 - Old messages are deleted automatically (P2)

**Goal**: a daily cron deletes messages older than 12 months (any status) and clears IP fingerprints older than 24 hours.

### Tests first (seen to fail)

- [ ] T053 [P] [US7] Write `worker/test/retention.test.ts` per contracts/worker-config.md "Retention cron": only rows older than `RETENTION_MONTHS` calendar months (UTC) deleted regardless of read state (SC-007), rows at the boundary ± 1 minute on the right side, the 29 February mapping pinned, a 1,200-row batch fully deleted, fingerprint cleared on rows 25 hours old while rows 23 hours old keep it and the message stays, both statements indexed (no `SCAN messages`), exactly one log line with `event` and the deleted count and no personal data (FR-016), and a failure in one step leaves the rows for the next run and still surfaces as an errored run. Must fail.

### Implementation

- [ ] T054 [US7] Implement `worker/src/retention.ts` and wire `scheduled` in `worker/src/index.ts`; make the test pass and confirm the cron `17 3 * * *` exists for both environments in `wrangler.jsonc`.

---

## Phase 11: User Story 8 - Preview messages stay separate (P2)

**Goal**: previews use `dcc-web-preview` with its own D1 database and secrets; deploy scripts apply migrations safely and refuse to cross environments.

### Tests first (seen to fail)

- [ ] T055 [P] [US8] Extend `tests/unit/site/site-origin.test.ts` for `previewWorkerName` and the preview address pattern `https://<alias>-dcc-web-preview.drc-dev.workers.dev` (alias cut to 47 characters). Must fail.
- [ ] T056 [P] [US8] Rewrite `tests/unit/site/deploy-preview.test.ts` and add `tests/unit/site/deploy-production.test.ts` for `scripts/deploy/preview.ts` and `scripts/deploy/production.ts` per contracts/worker-config.md: `WRANGLER_CI_OVERRIDE_NAME` guard fails when misconfigured, production refuses unless the branch is `main`, migrations first (`contact-preview --env preview` or `contact`), stop at first failing step, aliased upload on non-main branches, no environment value in output. Must fail.
- [ ] T057 [P] [US8] Write `worker/test/environments.test.ts` with a second Vitest project that loads `wrangler.jsonc` with `environment: "preview"` (Cloudflare Vitest integration): the preview project binds `DB` to `contact-preview`; a message stored through one environment's Worker is absent from the other's list-new, and each environment's read token is refused (identical 401) by the other (SC-006, FR-017, FR-024). Run it; must fail because the `preview` Vitest project does not exist yet.

### Implementation

- [ ] T058 [US8] Add `previewWorkerName` to `setup/config.json` and `src/lib/site-origin.ts`; rewrite `scripts/deploy/preview.ts`; create `scripts/deploy/production.ts`; wire the `deploy:preview` and `deploy:production` scripts; add the `preview` project to `worker/vitest.config.ts`; make the tests pass.

---

## Phase 12: User Story 9 - Setup: readers and check modules (P3)

**Goal**: the new read-only `CloudflareReader` methods and one check module per item 19 to 25, unit-tested with fake readers. No real Cloudflare calls. The modules are not registered yet (Phase 13 registers them with their runbook sections, so the drift tests stay green).

### Tests first (seen to fail)

- [ ] T059 [P] [US9] Extend `tests/unit/setup-check/providers/read-only.test.ts` and add tests for each new `CloudflareReader` method (`listD1Databases`, `listD1AppliedMigrations`, `listWorkerSecretNames`, `listWorkerCrons`, `listBuildTriggers`, `listBuildVariableNames`, `listTurnstileWidgets`): only documented fields returned, `secret`, `value` and `sitekey` dropped (fixtures contain values and prove they never come back), the `SELECT` body is exactly the constant, 403 gives the permission hint. Must fail.
- [ ] T060 [P] [US9] Write one `tests/unit/setup-check/checks/<id>.test.ts` per new item (`contact-d1-databases`, `contact-turnstile-widget`, `contact-worker-secrets`, `contact-preview-builds`, `contact-turnstile-site-key`, `contact-preview-deploy`, `contact-production-deploy`) covering complete, missing (per database, Worker or trigger), pending and could-not-check; unreadable region is `missing`; D1 IDs must equal `wrangler.jsonc` and a placeholder ID is `missing`. Must fail.

### Implementation

- [ ] T061 [US9] Add the seven reader methods to `scripts/setup-check/types.ts` and `scripts/setup-check/providers/cloudflare.ts` (drop value, secret and sitekey fields before returning; fixed `SELECT` constant).
- [ ] T062 [US9] Add `scripts/setup-check/checks/` modules for the seven items per contracts/setup-items.md; make the reader and check tests pass.

---

## Phase 13: User Story 9 - Setup: registry, runbook and walkthrough (P3)

**Goal**: `docs/setup.md`, the registry, `setup:check` and the walkthrough skill cover items 19 to 25 and fail until Don finishes each.

### Tests first (seen to fail)

- [ ] T063 [P] [US9] Update `tests/unit/setup/items.test.ts`, `drift.test.ts`, `docs-structure.test.ts` and `skill-behaviour.test.ts` so counts derive from the registry length (25) and assert: docs sections 19 to 25 with the five standard headings, the Contact form part, item 2 token permission additions, item 10 text move, the FR-027a region restatement in the item 19 question text, shown-only commands, the `.env.example` comment, and `secrets.ts` entries for the three Worker secrets and the site-key variable. Must fail.
- [ ] T064 [P] [US9] Extend `tests/unit/setup-check/cli.test.ts` and `report.test.ts` so output never contains a secret value and item 25 shows as after-merge without failing the check before merge (FR-028a). Must fail.

### Implementation

- [ ] T065 [US9] Register items 19 to 25 in `scripts/setup-check/items.ts` (dependencies and phases per contracts/setup-items.md); update `secrets.ts` and `schemas.ts` as needed.
- [ ] T066 [US9] Write `docs/setup.md` part "Contact form" with sections 19 to 25 (anchors equal item IDs, What it is for / Where to do it / How it will be confirmed / Constitution principle / Secrets), the secret replacement and recovery rules, and the item 2 and 10 edits and intro count; update the `.env.example` token permission comment.
- [ ] T067 [US9] Update `.claude/skills/setup-walkthrough/SKILL.md`: count from the registry, region restatement inside the item 19 `AskUserQuestion` text, stop before any store is created if the region is not confirmed (FR-027b), shown-only commands block, the allowed `wrangler d1 list --json` step, after-merge rule for item 25.
- [ ] T068 [US9] Run `corepack pnpm run test` and `corepack pnpm setup:check`; confirm items 19 to 24 report missing or could-not-check with plain next actions and no secret in output.

---

## Phase 14: Don's setup steps and preview deployment (manual)

**Purpose**: steps only Don can do in his Cloudflare account, plus agent follow-ups once he supplies results.

- [ ] T069 Item 19: after Don confirms the region restatement (wnam, cannot be changed), Don creates the two D1 databases: `pnpm exec wrangler d1 create contact --location wnam` and `pnpm exec wrangler d1 create contact-preview --location wnam`, declining any offer to add bindings. [PREVIEW-CHECK]
- [ ] T070 Item 2: Don adds Account D1: Read, Workers Builds Configuration: Read and Turnstile Sites: Read to the local read-only token. [PREVIEW-CHECK]
- [ ] T071 Item 20: Don creates the Turnstile widget `dcc-web contact` (managed; hostnames `doncoleman.ca` and `drc-dev.workers.dev`); if `drc-dev.workers.dev` is refused, use the research R6 preview fallback (test keys, preview only). [PREVIEW-CHECK]
- [ ] T072 Item 21: Don sets `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN` and `IP_HASH_SALT` on `dcc-web` and, with `--env preview` (different token and salt), on `dcc-web-preview`. Values are typed or piped by Don only, never in chat or files. [PREVIEW-CHECK]
- [ ] T073 Items 22 and 23: Don connects `dcc-web-preview` to the repository (`pnpm run build`, deploy `pnpm run deploy:preview`), turns on the workers.dev address and preview URLs, turns off non-production builds on `dcc-web`, and adds the `PUBLIC_TURNSTILE_SITE_KEY` build variable on both Workers' builds. [PREVIEW-CHECK]
- [ ] T074 Once Don confirms item 19, read the two IDs with `pnpm exec wrangler d1 list --json`, write them into `wrangler.jsonc` (`contact` at top level, `contact-preview` in `env.preview`), remove the placeholder allowance from the T009 assertion so only real, different UUIDs pass, run the config-files test, commit and push. If the IDs are not available, leave the placeholders and the allowance, and record the blocker.
- [ ] T075 Item 24: Don adds Account D1: Edit to the Workers Builds API token; then the branch is pushed or Retry build is run on `dcc-web-preview`. [PREVIEW-CHECK]
- [ ] T076 Run `corepack pnpm setup:check` with Don's local token and confirm items 19 to 24 are complete (item 25 after merge). [PREVIEW-CHECK]
- [ ] T077 A test submission from `https://br-007-contact-form-dcc-web-preview.drc-dev.workers.dev/contact/` lands in `contact-preview` and is retrievable with the preview read token (`GET /api/messages/new`); the production token on the preview address returns 401; the preview cron is registered (SC-011, FR-024). [PREVIEW-CHECK]
- [ ] T078 Don reviews the contact page and privacy policy on the preview address (layout, wording, colours, keyboard-only send, VoiceOver announcements, reflow at 320 px and 400% zoom, mobile; SC-009 manual items) and approves the PR (Principle III major change; auto-merge stays off). [PREVIEW-CHECK]
- [ ] T079 Item 25, after merge: Don sets the `dcc-web` production deploy command to `pnpm run deploy:production` and retries the latest `main` build; then `setup:check` shows all 25 items complete. [PREVIEW-CHECK]

---

## Phase 15: Polish and cross-cutting concerns

**Purpose**: visual baselines, docs consistency, rebase, final gate.

- [ ] T080 Build and run `corepack pnpm run test:visual` to see which snapshots differ. Committed snapshots cover home, about, sections, header, footer, menu-open and not-found; `/contact/` is not currently snapshotted. Expected diffs are only where the newly linked Contact destination changes header, menu or footer. Any unpredicted diff is a regression to fix, not a baseline to refresh. Add contact page snapshots (desktop and phone, light and dark) to `tests/e2e/visual.spec.ts`.
- [ ] T081 Update macOS visual baselines: `corepack pnpm run test:visual:update`; review the changed images in `tests/e2e/visual.spec.ts-snapshots/` and commit only intended ones.
- [ ] T082 Update Linux visual baselines: `corepack pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it via an `AskUserQuestion` whose question text carries the instruction; fallback is the `visual-baselines` PR label and `gh run download`). Commit the Linux images.
- [ ] T083 [P] Confirm the requirement-quality checklists in `specs/007-contact-form/checklists/` still have no unchecked item (`grep -c '^- \[ \]'` is 0 for each file); confirm no committed secret (secrets lint) and no leftover placeholder text in the page, policy or docs.
- [ ] T084 Parallel-work rebase (Principle XI): `git fetch origin main`, `git rebase origin/main`, resolve conflicts keeping both sides using the plan.md "Parallel work" table (`wrangler.jsonc`, `astro.config.mjs`, `package.json` by hand, `src/config/navigation.ts`, `src/components/sections/index.ts` and `schemas.ts`, `tests/e2e/templates.ts`, `docs/setup.md` and setup-check items renumbered after the other feature's, snapshots), **regenerate** `pnpm-lock.yaml` with `corepack pnpm install` (never hand-merge), regenerate only this feature's visual baselines if the rebase changed them, then re-run verify. If a conflict is in a file this feature does not own and the resolution is not obvious, stop and report.
- [ ] T085 Final gate: `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm run verify` passes (lint, typecheck including worker, root and worker tests, build, all E2E projects); push with `--force-with-lease` if rebased.
- [ ] T086 Prepare the PR notes (opened from `drc-agents` per CLAUDE.md): state this is a **major change** (Principle III, five counts in plan.md), apply the `major-change` label, auto-merge OFF, list the open `[PREVIEW-CHECK]` items, and note that item 25 remains after merge.

---

## Dependencies and execution order

- Phase 1 then Phase 2 block all others.
- Phases 3 to 6 (P1) run in order. Phase 4 needs the submit path from Phase 3; Phase 6 needs the Worker router and enables the retrieval assertion in the Phase 4 e2e test.
- Phases 7 to 11 (P2) depend on Phase 4. Phases 5, 7 and 8 edit the same files (`submit.ts`, `contact.test.ts`, `contact.spec.ts`), so run them in order.
- Phase 12 depends on the `wrangler.jsonc` shape (Phase 2); Phase 13 depends on Phase 12 and the deploy scripts (Phase 11).
- Phase 14 needs Phases 11 and 13 done and the branch pushed. Its manual items block the PR being merge-ready. Phase 15 comes last; visual tasks need Phases 3 to 9 complete.

## Parallel opportunities

- Within each phase, the `[P]` test-writing tasks touch different files and can run together.
- Phases 10, 11 and 12 can proceed in parallel worktrees if `worker/src/index.ts`, `wrangler.jsonc` and `package.json` are merged carefully.

## Implementation strategy

- MVP: Phases 1 to 4 (US1: Worker, page and island), then 5 and 6 to complete the P1 set. Nothing ships until all P1 stories and the Phase 14 checks pass, since collecting contact data is a major change.
- Incremental: P2 stories (Phases 7 to 11), then setup (Phases 12 and 13), Don's manual steps and the preview check, then polish.
- Every test task is run and seen to fail before the implementation it covers; each phase ends with its tests, and the whole suite, passing locally.
