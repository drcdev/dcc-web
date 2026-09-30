# Tasks: Contact Form and Message Retrieval

**Input**: Design documents from `/specs/007-contact-form/` (plan.md, spec.md, research.md, data-model.md, contracts/*, quickstart.md)

**Prerequisites**: plan.md, spec.md. Constitution Principle I applies: **tests are mandatory and test-first**. Every test task must be run and **seen to fail for the right reason** before the implementation tasks after it begin; record the failing output in the task notes.

**Organization**: `## Phase N` sections, each sized for one subagent. Phases 1 and 2 block everything. Story phases follow spec priority (P1, P2, P3). Tasks suffixed `[PREVIEW-CHECK]` need Don's Cloudflare account, the preview deployment or Don's eyes, and a subagent cannot verify them locally; the orchestrator must leave them open for Don.

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: parallelisable (different files, no dependency on an incomplete task).
- **[US#]**: US1 send, US2 error recovery, US3 retrieval, US4 spam and abuse, US5 project link, US6 privacy policy, US7 retention, US8 preview separation, US9 setup.
- Toolchain: `node -v` must be v24 (else `source ~/.nvm/nvm.sh && nvm use` in the same command); use `corepack pnpm`; bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd>`; `verify` needs `ASTRO_PREVIEW_BACKGROUND=1`.
- Never print secret values. Constitution Principle IV: consult the Astro Docs MCP (`astro-docs`) before Astro-specific choices (fall back to docs.astro.build and say so).

---

## Phase 1: Setup (workspace and tooling)

**Purpose**: the `worker/` workspace package and toolchain wiring. No feature behaviour.

- [ ] T001 Write the failing test first: extend `tests/unit/site/config-files.test.ts` to assert `pnpm-workspace.yaml` lists `worker`, `worker/package.json` exists with the Vitest 4 and plugin devDeps, root `tsconfig.json` excludes `worker/`, and the `typecheck`, `test`, `types:worker` and `deploy:production` scripts in `package.json` are wired per plan.md. Run it and confirm it fails.
- [ ] T002 Add `packages: ["worker"]` alongside the existing entries in `pnpm-workspace.yaml`; create `worker/package.json` (private `@dcc-web/worker`, devDeps `vitest` 4.1.x and `@cloudflare/vitest-plugin` 1.3.x, `test` script `vitest run`) per plan.md and research R5. Pick versions outside pnpm `minimumReleaseAge` or add exact `minimumReleaseAgeExclude` entries as the file already does.
- [ ] T003 Bump `wrangler` in root `package.json` to the version the plugin pins (4.144.0, research R5) and run `corepack pnpm install` to update `pnpm-lock.yaml`; confirm the worker package resolves vitest 4.1.x while the root keeps 5.x.
- [ ] T004 [P] Create `worker/tsconfig.json` (strict, `types` from `./worker-configuration.d.ts`) and exclude `worker/` from the root `tsconfig.json`.
- [ ] T005 [P] Extend the ESLint config (`eslint.config.*`) to cover `worker/` (typescript-eslint `projectService` on `worker/tsconfig.json`) with `@typescript-eslint/no-floating-promises` on for `worker/**`.
- [ ] T006 Update `package.json` scripts per plan.md "How the new test layers plug into verify": `typecheck` adds `tsc -p worker` and `wrangler types worker/worker-configuration.d.ts --check`; `test` adds `pnpm --filter ./worker test`; add `types:worker` and a `deploy:production` entry (its script file is written in Phase 10). Re-run the config-files test until it passes.

**Checkpoint**: `corepack pnpm install --frozen-lockfile` works.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Wrangler config, migration, shared rules, Worker skeleton, test harnesses.

### Tests first (seen to fail)

- [ ] T007 [P] Write `worker/test/rules.test.ts` for `validateSubmission()` and limits from `worker/src/contact/rules.ts` (name 100, email, organization, project 100, message 5,000, consent required, `RETENTION_MONTHS` = 12, 10 KB body cap) per contracts/contact-api.md, FR-002, FR-003a, FR-006, FR-018a. Run; must fail (module missing).
- [ ] T008 [P] Write `worker/vitest.config.ts` (`cloudflareTest({ wrangler: { configPath: "../wrangler.jsonc" } })`), `worker/test/setup.ts` (`applyD1Migrations` per file) and `worker/test/schema.test.ts` asserting the `messages` columns and indexes from data-model.md exist after migrations. Run; must fail.
- [ ] T009 [P] Extend `tests/unit/site/config-files.test.ts` with assertions for `wrangler.jsonc` (main, `run_worker_first: ["/api/*"]`, `d1_databases`, cron `17 3 * * *`, `secrets.required`, `env.preview` with Worker `dcc-web-preview` and D1 `contact-preview`, invocation logs off) and that migrations are additive only (contracts/worker-config.md). Must fail.
- [ ] T010 [P] Extend `tests/unit/site/csp.test.ts`: `/contact/` gets Turnstile sources (`challenges.cloudflare.com` script, frame, connect) while the site-wide CSP is unchanged. Must fail (implemented in Phase 3 with the component).

### Implementation

- [ ] T011 Create `migrations/0001_create_messages.sql` per data-model.md (table, constraints, indexes for list-new, rate-limit lookups and retention).
- [ ] T012 Edit `wrangler.jsonc` per contracts/worker-config.md: `main`, `run_worker_first`, `d1_databases` (placeholder IDs until Phase 12), cron, `secrets.required`, `env.preview`, observability. Keep existing assets and headers settings.
- [ ] T013 Implement `worker/src/contact/rules.ts` (shared limits, `RETENTION_MONTHS`, `validateSubmission()`); make `rules.test.ts` pass.
- [ ] T014 Implement `worker/src/http.ts` (JSON responses and security headers, no CORS) and the `worker/src/index.ts` skeleton: `fetch` handles only `/api/*` (unknown path 404 JSON, wrong method 405) and an empty `scheduled` handler.
- [ ] T015 Generate `worker/worker-configuration.d.ts` with `corepack pnpm run types:worker` and commit it; make the schema and config tests pass; run `corepack pnpm run typecheck` and `corepack pnpm --filter ./worker test`.
- [ ] T016 Update `playwright.config.ts` so the web server is `wrangler dev` serving the built site plus the Worker: remove `.cache/e2e-state`, apply local migrations, then `wrangler dev --ip 127.0.0.1 --port 4321 --persist-to .cache/e2e-state --env-file tests/fixtures/worker/e2e.env` (plan.md, research R4). Create `tests/fixtures/worker/e2e.env` with public Turnstile test secret, a fake read token and fake salt only; ensure `.cache/` is gitignored. Confirm existing e2e projects still pass.

**Checkpoint**: Worker package tests run against local D1; Playwright serves through `wrangler dev`.

---

## Phase 3: User Story 1 - Visitor sends a message (P1)

**Goal**: a visitor submits the form at `/contact/` and sees a confirmation; the message is stored in D1.

**Independent test**: E2E valid send with organization blank shows the focused success panel and one stored row.

### Tests first (seen to fail)

- [ ] T017 [P] [US1] Write `worker/test/contact.test.ts` (success path): valid submit returns the documented body, one row stored with hashed IP and no raw IP, organization null, unread; content-type and origin refusals; 10 KB limit; per contracts/contact-api.md. Mock Turnstile siteverify. Must fail.
- [ ] T018 [P] [US1] Write `worker/test/logging.test.ts`: spy on `console` across success and failure paths and assert no submitted value, IP or hash appears (FR-016). Must fail.
- [ ] T019 [P] [US1] Write `worker/test/query-plans.test.ts`: `EXPLAIN QUERY PLAN` for every statement the submit path runs, asserting no `SCAN messages` (FR-025a). Must fail.
- [ ] T020 [P] [US1] Write `tests/component/sections/ContactForm.test.ts` (Astro Container API): labelled fields, `autocomplete` input purposes, required note, consent sentence as label, honeypot hidden from everyone, no-JS notice before the fields, Send disabled without JS, tab order Name, Email, Organization, Project, Message, Consent, Human check, Send (FR-008a to FR-008o, contracts/contact-page.md). Must fail.
- [ ] T021 [P] [US1] Write `tests/e2e/contact.spec.ts` journey "valid send": fill, consent, Send, success panel focused, message retrievable via the API with the fixture token (retrieval assertion enabled in Phase 5). Set a unique `CF-Connecting-IP` per test via `page.route`. Must fail.
- [ ] T022 [P] [US1] Add a `contact` template to `tests/e2e/templates.ts` so the `a11y` (axe), `budget`, `shell` and `no-js` projects cover `/contact/`; extend `tests/e2e/no-js.spec.ts` for the no-JS notice if needed. Extend `tests/unit/site/navigation.test.ts` so `/contact/` is not in `futureDestinations`. Must fail.

### Implementation

- [ ] T023 [US1] Implement `worker/src/contact/ip-hash.ts` (HMAC-SHA-256 with `IP_HASH_SALT`) and `worker/src/contact/turnstile.ts` (server-side siteverify, fail closed, research R6).
- [ ] T024 [US1] Implement `worker/src/contact/submit.ts` (origin and content-type check, size cap, parse, `validateSubmission`, Turnstile, store; outcome-only structured logs) and route `POST /api/contact` in `worker/src/index.ts`; make the US1 Worker tests pass.
- [ ] T025 [US1] Create `src/components/sections/ContactForm.astro` ported from `.reference/flux` (markup, processed island `<script>` posting JSON to `/api/contact`, success panel with focus, Turnstile loaded on first interaction, per-page `Astro.csp`); import limits from `worker/src/contact/rules.ts`. Consult the Astro Docs MCP for client scripts, CSP and `astro:env`.
- [ ] T026 [US1] Register `ContactForm` in `src/components/sections/index.ts` and `schemas.ts`; add `PUBLIC_TURNSTILE_SITE_KEY` to `env.schema` in `astro.config.mjs` (public, client); add the test site key to `tests/fixtures/worker/e2e.env` or the build env used by E2E.
- [ ] T027 [US1] Create `src/content/pages/contact.mdx` (title "Contact", copy, privacy note, `<ContactForm />`) and remove `/contact/` from `futureDestinations` in `src/config/navigation.ts`.
- [ ] T028 [US1] Run component, unit, Worker, csp and navigation tests and the `contact.spec.ts`, `a11y`, `budget`, `no-js`, `shell` e2e projects until green.

**Checkpoint**: US1 works end to end locally.

---

## Phase 4: User Story 2 - Visitor recovers from an error (P1)

**Goal**: every failure is explained in plain language and nothing the visitor typed is lost.

### Tests first (seen to fail)

- [ ] T029 [P] [US2] Extend `worker/test/contact.test.ts` with every validation-code row of contracts/contact-api.md (several field errors together, consent missing, 503 fail closed, 429 shape). Must fail.
- [ ] T030 [P] [US2] Extend `tests/component/sections/ContactForm.test.ts` for error containers (`aria-describedby`, `aria-invalid`, polite live region, form-level error region, sending state) per FR-008e to FR-008i. Must fail.
- [ ] T031 [P] [US2] Extend `tests/e2e/contact.spec.ts`: no consent error tied to checkbox; invalid email and 5,001-character message errors with limits and values kept; double-click Send stores one message; `/api/contact` fulfilled 503 and 429 shows a plain error with values kept; Turnstile script aborted shows "Spam check couldn't load" with values kept; keyboard-only path with announced errors and success. Must fail.

### Implementation

- [ ] T032 [US2] Complete server error mapping in `worker/src/contact/submit.ts`; make the Worker tests pass.
- [ ] T033 [US2] Implement client validation, error rendering, first-error focus, sending state, double-submit guard and retry in the `ContactForm.astro` island; make component and e2e tests pass.
- [ ] T034 [US2] Run the axe `a11y` project on `/contact/` in an error state and fix findings (contrast pairs from the design-source adjustments table).

---

## Phase 5: User Story 3 - Don retrieves new messages through an assistant (P1)

**Goal**: a bearer-token holder lists new messages and marks them read, and can do nothing else.

### Tests first (seen to fail)

- [ ] T035 [P] [US3] Write `worker/test/retrieval.contract.test.ts` for every row of contracts/retrieval-api.md: 401 without or with a wrong token (no hint which), timing-safe compare, list-new returns only unread in the documented shape with no `ip_hash`, mark-read 200 then 409, unknown id 404, wrong methods 405, no CORS headers, no delete or edit route. Must fail.
- [ ] T036 [P] [US3] Extend `worker/test/query-plans.test.ts` and `worker/test/logging.test.ts` to the retrieval statements and paths. Must fail.
- [ ] T037 [P] [US3] Enable the retrieval assertions in `tests/e2e/contact.spec.ts` (send, list with the fixture token, mark read, list empty, mark again 409, no header 401). Must fail.

### Implementation

- [ ] T038 [US3] Implement `worker/src/messages/auth.ts` (bearer, timing-safe), `list-new.ts` and `mark-read.ts`; route them in `worker/src/index.ts`; make contract, query-plan and logging tests pass.
- [ ] T039 [US3] Run the retrieval e2e assertions and the curl steps of quickstart section 4 against `wrangler dev`.

---

## Phase 6: User Story 4 - Spam and abuse are kept out (P2)

**Goal**: honeypot, Turnstile, rate limits and origin checks stop abuse without bothering real visitors.

### Tests first (seen to fail)

- [ ] T040 [P] [US4] Extend `worker/test/contact.test.ts`: filled honeypot returns success with no row; Turnstile failure and unreachable siteverify fail closed (no row); 3 per rolling hour and 5 per rolling day per IP hash refused with 429; window edges; different IPs independent; cross-origin and missing Origin refused. Must fail.
- [ ] T041 [P] [US4] Write `worker/test/rate-limit.test.ts` for exact D1 row counting and index use. Must fail.
- [ ] T042 [P] [US4] Extend `tests/e2e/contact.spec.ts`: the hidden field is never reachable by keyboard or announced (FR-008d) and a filled honeypot shows success. Must fail.

### Implementation

- [ ] T043 [US4] Implement `worker/src/contact/rate-limit.ts`; finish honeypot, Turnstile and origin handling in `submit.ts`; make all US4 tests pass.

---

## Phase 7: User Story 5 - Visitor coming from a project story (P2)

**Goal**: `/contact/?project=<name>` shows "About: <name>" and stores the project safely.

### Tests first (seen to fail)

- [ ] T044 [P] [US5] Extend `tests/component/sections/ContactForm.test.ts` and `tests/e2e/contact.spec.ts`: `?project=Cadence` shows the label and stores it; a 150-character `<b>x</b>` value renders as text, is cut to 100 and stored the same way; no parameter shows no label. Must fail.
- [ ] T045 [P] [US5] Extend `worker/test/contact.test.ts` for project length and storage as plain text. Must fail.

### Implementation

- [ ] T046 [US5] Implement project parameter handling (text-only rendering, 100-character cut) in the `ContactForm.astro` island and server validation; make tests pass. Note any project-story pages that already link to `/contact/?project=` (do not add new content).

---

## Phase 8: User Story 6 - Visitor understands what happens to their information (P2)

**Goal**: the privacy policy and the contact page note state the FR-019 facts, kept in sync with the code.

### Tests first (seen to fail)

- [ ] T047 [P] [US6] Write `tests/unit/site/privacy-policy.test.ts` asserting `src/content/pages/privacy-policy.mdx` states the collected fields, `RETENTION_MONTHS` from the shared rules, "Western North America", the IP fingerprint handling, Turnstile with its privacy addendum link, the deletion request route and the 7-day Time Travel note, no leftover placeholders, `draft: true` unchanged. Must fail.
- [ ] T048 [P] [US6] Extend the `ContactForm` component test and `tests/e2e/contact.spec.ts` for the page note linking to the privacy policy. Must fail.

### Implementation

- [ ] T049 [US6] Edit only "The contact form", "Spam protection", "Your choices" and "Last updated" in `src/content/pages/privacy-policy.mdx` per plan.md "Privacy policy text"; make the tests pass and run the `pages`, `seo` and `a11y` e2e projects for `/privacy-policy/`.

---

## Phase 9: User Story 7 - Old messages are deleted automatically (P2)

**Goal**: a daily cron deletes messages older than 12 months (any status) and clears IP fingerprints older than 24 hours.

### Tests first (seen to fail)

- [ ] T050 [P] [US7] Write `worker/test/retention.test.ts`: only rows older than `RETENTION_MONTHS` deleted regardless of read state (SC-007), boundary rows kept, fingerprint cleared after 24 hours while the message stays, statements indexed, nothing logged, one failing step does not skip the other. Must fail.

### Implementation

- [ ] T051 [US7] Implement `worker/src/retention.ts` and wire `scheduled` in `worker/src/index.ts`; make the test pass and confirm the cron `17 3 * * *` exists for both environments in `wrangler.jsonc`.

---

## Phase 10: User Story 8 - Preview messages stay separate (P2)

**Goal**: previews use `dcc-web-preview` with its own D1 database and secrets; deploy scripts apply migrations safely and refuse to cross environments.

### Tests first (seen to fail)

- [ ] T052 [P] [US8] Extend `tests/unit/site/site-origin.test.ts` for `previewWorkerName` and the preview address pattern `https://<alias>-dcc-web-preview.drc-dev.workers.dev`. Must fail.
- [ ] T053 [P] [US8] Rewrite `tests/unit/site/deploy-preview.test.ts` and add `tests/unit/site/deploy-production.test.ts` for `scripts/deploy/preview.ts` and `scripts/deploy/production.ts` per contracts/worker-config.md: `WRANGLER_CI_OVERRIDE_NAME` guard fails when misconfigured, migrations first (`contact-preview` or `contact`), stop at first failing step, aliased upload on non-main branches, no secrets in output. Must fail.
- [ ] T054 [P] [US8] Add a config test in `tests/unit/site/config-files.test.ts` asserting `env.preview` has a different database name and ID from production and no shared secret values. Must fail.

### Implementation

- [ ] T055 [US8] Add `previewWorkerName` to `setup/config.json` and `src/lib/site-origin.ts`; rewrite `scripts/deploy/preview.ts`; create `scripts/deploy/production.ts`; wire the `deploy:preview` and `deploy:production` scripts; make the tests pass.

---

## Phase 11: User Story 9 - Setup: agent-side halves (P3)

**Goal**: `docs/setup.md`, the registry, `setup:check` and the walkthrough skill cover items 19 to 25 and fail until Don finishes each. Fully unit-tested with fake readers; no real Cloudflare calls.

### Tests first (seen to fail)

- [ ] T056 [P] [US9] Extend `tests/unit/setup-check/providers/read-only.test.ts` and add tests for each new `CloudflareReader` method (`listD1Databases`, `listD1AppliedMigrations`, `listWorkerSecretNames`, `listWorkerCrons`, `listBuildTriggers`, `listBuildVariableNames`, `listTurnstileWidgets`): only documented fields returned, `secret`, `value` and `sitekey` dropped, the `SELECT` body is exactly the constant, 403 gives the permission hint. Must fail.
- [ ] T057 [P] [US9] Write one `tests/unit/setup-check/checks/<id>.test.ts` per new item (`contact-d1-databases`, `contact-turnstile-widget`, `contact-worker-secrets`, `contact-preview-builds`, `contact-turnstile-site-key`, `contact-preview-deploy`, `contact-production-deploy`) covering complete, missing (per database, Worker or trigger), pending and could-not-check; unreadable region is `missing`; D1 IDs must equal `wrangler.jsonc`. Must fail.
- [ ] T058 [P] [US9] Update `tests/unit/setup/items.test.ts`, `drift.test.ts`, `docs-structure.test.ts` and `skill-behaviour.test.ts` so counts derive from the registry length (25) and assert: docs sections 19 to 25 with the five standard headings, the Contact form part, item 2 token permission additions, item 10 text move, the FR-027a region restatement in the item 19 question text, shown-only commands, the `.env.example` comment, and `secrets.ts` entries for the three Worker secrets and the site-key variable. Must fail.
- [ ] T059 [P] [US9] Extend `tests/unit/setup-check/cli.test.ts` and `report.test.ts` so output never contains a secret value and item 25 shows as after-merge. Must fail.

### Implementation

- [ ] T060 [US9] Add the seven reader methods to `scripts/setup-check/types.ts` and `scripts/setup-check/providers/cloudflare.ts` (drop value, secret and sitekey fields before returning; fixed `SELECT` constant).
- [ ] T061 [US9] Add `scripts/setup-check/checks/` modules for the seven items and register items 19 to 25 in `scripts/setup-check/items.ts` (dependencies and phases per contracts/setup-items.md); update `secrets.ts` and `schemas.ts` as needed.
- [ ] T062 [US9] Write `docs/setup.md` part "Contact form" with sections 19 to 25 (anchors equal item IDs, What it is for / Where to do it / How it will be confirmed / Constitution principle / Secrets), the secret replacement and recovery rules, and the item 2 and 10 edits and intro count; update the `.env.example` token permission comment.
- [ ] T063 [US9] Update `.claude/skills/setup-walkthrough/SKILL.md`: count from the registry, region restatement inside the item 19 `AskUserQuestion` text, shown-only commands block, the allowed `wrangler d1 list --json` step, after-merge rule for item 25.
- [ ] T064 [US9] Run `corepack pnpm run test` and `corepack pnpm setup:check`; confirm items 19 to 24 report missing or could-not-check with plain next actions and no secret in output.

---

## Phase 12: Don's setup steps and preview deployment (manual)

**Purpose**: steps only Don can do in his Cloudflare account, plus agent follow-ups once he supplies results.

- [ ] T065 Item 19: after Don confirms the region restatement (wnam, cannot be changed), Don creates the two D1 databases: `pnpm exec wrangler d1 create contact --location wnam` and `pnpm exec wrangler d1 create contact-preview --location wnam`, declining any offer to add bindings. [PREVIEW-CHECK]
- [ ] T066 Once Don confirms item 19, read the two IDs with `pnpm exec wrangler d1 list --json`, write them into `wrangler.jsonc` (`contact` at top level, `contact-preview` in `env.preview`), run the config-files test, commit and push. If the IDs are not available, leave the placeholders and record the blocker.
- [ ] T067 Item 2: Don adds Account D1: Read, Workers Builds Configuration: Read and Turnstile Sites: Read to the local read-only token. [PREVIEW-CHECK]
- [ ] T068 Item 20: Don creates the Turnstile widget `dcc-web contact` (managed; hostnames `doncoleman.ca` and `drc-dev.workers.dev`); if `drc-dev.workers.dev` is refused, use the research R6 preview fallback (test keys, preview only). [PREVIEW-CHECK]
- [ ] T069 Item 21: Don sets `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN` and `IP_HASH_SALT` on `dcc-web` and, with `--env preview` (different token and salt), on `dcc-web-preview`. Values are typed or piped by Don only, never in chat or files. [PREVIEW-CHECK]
- [ ] T070 Item 22: Don connects `dcc-web-preview` to the repository (`pnpm run build`, deploy `pnpm run deploy:preview`), turns on the workers.dev address and preview URLs, and turns off non-production builds on `dcc-web`. [PREVIEW-CHECK]
- [ ] T071 Item 23: Don adds the `PUBLIC_TURNSTILE_SITE_KEY` build variable on both Workers' builds. [PREVIEW-CHECK]
- [ ] T072 Item 24: Don adds Account D1: Edit to the Workers Builds API token; then the branch is pushed or Retry build is run on `dcc-web-preview`. [PREVIEW-CHECK]
- [ ] T073 Run `corepack pnpm setup:check` with Don's local token and confirm items 19 to 24 are complete (item 25 after merge). [PREVIEW-CHECK]
- [ ] T074 A test submission from `https://br-007-contact-form-dcc-web-preview.drc-dev.workers.dev/contact/` lands in `contact-preview` and is retrievable with the preview read token (`GET /api/messages/new`); the production token on the preview address returns 401; the preview cron is registered (SC-011, FR-024). [PREVIEW-CHECK]
- [ ] T075 Don reviews the contact page and privacy policy on the preview address (layout, wording, colours, keyboard use, mobile) and approves the PR (Principle III major change; auto-merge stays off). [PREVIEW-CHECK]
- [ ] T076 Item 25, after merge: Don sets the `dcc-web` production deploy command to `pnpm run deploy:production` and retries the latest `main` build; then `setup:check` shows all 25 items complete. [PREVIEW-CHECK]

---

## Phase 13: Polish and cross-cutting concerns

**Purpose**: visual baselines, docs consistency, rebase, final gate.

- [ ] T077 Build and run `corepack pnpm run test:visual` to see which snapshots differ. Committed snapshots cover home, about, sections, header, footer, menu-open and not-found; `/contact/` is not currently snapshotted. Expected diffs are only where the newly linked Contact destination changes header, menu or footer. Any unpredicted diff is a regression to fix, not a baseline to refresh. Add contact page snapshots (desktop and phone, light and dark) to `tests/e2e/visual.spec.ts`.
- [ ] T078 Update macOS visual baselines: `corepack pnpm run test:visual:update`; review the changed images in `tests/e2e/visual.spec.ts-snapshots/` and commit only intended ones.
- [ ] T079 Update Linux visual baselines: `corepack pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it via an `AskUserQuestion` whose question text carries the instruction; fallback is the `visual-baselines` PR label and `gh run download`). Commit the Linux images.
- [ ] T080 [P] Tick the items in `specs/007-contact-form/checklists/` that are now verified and note remaining gaps; confirm no committed secret (secrets lint) and no leftover placeholder text.
- [ ] T081 Parallel-work rebase (Principle XI): `git fetch origin main`, `git rebase origin/main`, resolve conflicts keeping both sides using the plan.md "Parallel work" table (`wrangler.jsonc`, `astro.config.mjs`, `package.json` by hand, `src/config/navigation.ts`, `src/components/sections/index.ts` and `schemas.ts`, `tests/e2e/templates.ts`, `docs/setup.md` and setup-check items renumbered after the other feature's, snapshots), **regenerate** `pnpm-lock.yaml` with `corepack pnpm install` (never hand-merge), regenerate only this feature's visual baselines if the rebase changed them, then re-run verify. If a conflict is in a file this feature does not own and the resolution is not obvious, stop and report.
- [ ] T082 Final gate: `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm run verify` passes (lint, typecheck including worker, root and worker tests, build, all E2E projects); push with `--force-with-lease` if rebased.
- [ ] T083 Prepare the PR notes (opened from `drc-agents` per CLAUDE.md): state this is a **major change** (Principle III, five counts in plan.md), auto-merge OFF, list the open `[PREVIEW-CHECK]` items, and note that item 25 remains after merge.

---

## Dependencies and execution order

- Phase 1 then Phase 2 block all others.
- Phases 3, 4, 5 (P1) run in order; Phase 5 needs the Worker router from Phase 3 and enables the retrieval assertion in the Phase 3 e2e test.
- Phases 6 to 10 (P2) depend on Phase 3. Phases 4, 6 and 7 edit the same files (`submit.ts`, `contact.spec.ts`), so run them in order.
- Phase 11 (P3) depends on the `wrangler.jsonc` shape (Phase 2) and deploy scripts (Phase 10).
- Phase 12 needs Phases 10 and 11 done and the branch pushed. Its manual items block the PR being merge-ready. Phase 13 comes last; visual tasks need Phases 3 to 8 complete.

## Parallel opportunities

- Within each phase, the `[P]` test-writing tasks touch different files and can run together.
- Phases 9, 10 and 11 can proceed in parallel worktrees if `worker/src/index.ts`, `wrangler.jsonc` and `package.json` are merged carefully.

## Implementation strategy

- MVP: Phases 1 to 3 (US1: Worker, page and island), then 4 and 5 to complete the P1 set. Nothing ships until all P1 stories and the Phase 12 checks pass, since collecting contact data is a major change.
- Incremental: P2 stories (Phases 6 to 10), then setup (Phase 11), Don's manual steps and the preview check, then polish.
- Every test task is run and seen to fail before the implementation it covers; each phase ends with its tests passing locally.
