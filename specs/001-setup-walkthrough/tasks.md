---

description: "Task list for Setup Walkthrough and Setup Check"
---

# Tasks: Setup Walkthrough and Setup Check

**Input**: Design documents from `/specs/001-setup-walkthrough/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/

**Tests are MANDATORY, not optional.** Constitution Principle I (Test-First, NON-NEGOTIABLE)
overrides the tasks template's default. Every test task below MUST be run and seen to **fail**
before its paired implementation task begins, and MUST be re-run to confirm it **passes**
immediately after that implementation task. This applies to setup-check logic, status/report
behaviour, drift/consistency checks, the major-change gate, and the placeholder page's
accessibility and page-budget behaviour.

**`[PREVIEW-CHECK]` suffix**: a task ending in `[PREVIEW-CHECK]` needs Don's own hands, a
provider dashboard, the live preview deployment, or a real credential, so it cannot be verified
by a subagent working locally with fixtures. These are the steps of Don's actual walkthrough; the
non-`[PREVIEW-CHECK]` tasks build the tooling, tests and docs that drive them.

**Organization**: Tasks are grouped by phase; Phases 3–5 map to the spec's three user stories
(US1, US2, US3), in priority order (P1, P2, P3). Because this is a bootstrap slice, the stories
are more sequential than usual: US2 (the walkthrough) calls US1's check CLI as its only
confirmation logic (FR-010), so US1 must exist first; US3's documentation content is authored in
Phase 1 (Setup) and Phase 2 (Foundational) alongside the registry it must stay consistent with,
and Phase 5 validates the finished record. Tests that cover the runbook and the walkthrough
skill (T133, T120, T097) are written in Phase 1, before the files they test.

**Execution order is document order.** Task IDs are stable identifiers and were not renumbered
when `/speckit-analyze` moved tasks to put every test before the code it covers, so some IDs
appear out of numeric order (for example T030 runs first, and T131–T137 were added by analysis).

**Bootstrap exception (Principle I)**: the tool configuration that tests need in order to run at
all (`package.json`, `.nvmrc`, `tsconfig.json`, `eslint.config.js`, `.secretlintrc.json`,
`vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `astro.config.mjs`, T001–T011) is
created before the first test, as justified in plan.md's Complexity Tracking. It is then
exercised by every `pnpm run verify` run. Everything else, including `wrangler.jsonc`,
`.env.example`, the workflows, CODEOWNERS, the runbook and the skill, has a failing test first.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1, US2 or US3 — user-story phases only (Setup, Foundational and Polish tasks
  carry no story label)
- Every task names its exact file path(s)

## Requirement Coverage

| Requirement | Tasks |
|---|---|
| FR-001, FR-003 | T088, T091, T092, T095 |
| FR-002, FR-028, SC-003 | T089, T090, T050, T133 |
| FR-004 | T039, T040–T045, T134, T066 |
| FR-005, FR-030 | T089, T090, T135 |
| FR-006 | T046, T052–T087 |
| FR-007, FR-009, FR-011 | T029, T091, T097, T109 |
| FR-008 | T029, T097, T133 |
| FR-010, FR-012 | T029, T097, T109, T123 |
| FR-013 | T035, T066, T107, T115, T078 |
| FR-014, SC-006 | T019–T023, T074, T076, T113, T114, T125–T127 |
| FR-015, FR-016 | T001, T021, T094, T112, T132 |
| FR-017 | T018, T064, T070, T103, T104, T111 |
| FR-018, FR-031–FR-033, SC-008 | T012, T013, T015, T136 |
| FR-019, FR-034–FR-039, SC-005 | T026, T036, T037, T038, T058–T063, T102, T105, T106, T120, T134, T137 |
| FR-020 | T014, T016, T084, T117, T118 |
| FR-021, FR-025 | T009, T047, T050, T080, T100, T103, T116, T131 |
| FR-022 | T086, T119 |
| FR-023, FR-026 | T024–T028, T049, T050, T133 |
| FR-024, SC-004 | T005, T089, T108, T123, T135 |
| FR-027, FR-029 | T052–T087, T089, T091 |
| SC-001, SC-002, SC-007 | T128, T124, T129 |
| 18 setup items | check tests/implementations T052–T087; live steps T099–T119 (one per item) |

## Path Conventions

Single Astro project at the repository root (plan.md "Project Structure"): site code under
`src/` and `public/`; repository tooling under `scripts/`; committed setup expectations under
`setup/`; tests split into `tests/unit/` (Vitest) and `tests/e2e/` (Playwright); the walkthrough
skill under `.claude/skills/setup-walkthrough/`; the runbook at `docs/setup.md`.

---

## Phase 1: Setup (Bootstrap Scaffolding)

**Purpose**: Create the project so it can be built, checked, linted and deployed at all — this
repository currently has no package manifest and no `verify` gate.

- [ ] T030 Don switches his local Node.js to version 24 (`nvm install 24 && nvm use 24`) and confirms `node --version` reports 24.x. Blocks T010 onward: installs, Node type stripping and `engines.node` all need Node 24 (Don is on 22.17) [PREVIEW-CHECK]
- [x] T001 Create `package.json` at the repository root: `packageManager` (pnpm), `engines.node: ">=24"`, and every script entry with its full body exactly as in the plan's package.json contract (`dev`, `build`, `preview`, `astro`, `lint:secrets`, `lint`, `typecheck`, `test`, `test:e2e`, `verify`, `setup:check`, `setup:dns-snapshot`). No script is left empty or as a no-op placeholder, so `pnpm run verify` can never pass vacuously (Principle II); it fails until the tools and code it runs exist
- [x] T002 [P] Create `.nvmrc` containing `24`, recording the Node requirement (Don is currently on Node 22.17; the plan requires Node 24)
- [x] T003 [P] Create `tsconfig.json` extending `astro/tsconfigs/strict` with `erasableSyntaxOnly: true`, `allowImportingTsExtensions: true`, `noEmit`, `include: [".astro/types.d.ts", "**/*"]`, `exclude: ["dist"]` (research R2, R3)
- [x] T004 [P] Create `eslint.config.js`, a flat ESLint config using `typescript-eslint` and `eslint-plugin-astro`
- [x] T005 [P] Create `.secretlintrc.json` using `@secretlint/secretlint-rule-preset-recommend`, and `.secretlintignore` excluding `node_modules`, `dist`, `.astro`, `pnpm-lock.yaml`, `.env` (the gitignored local credentials file; `.astro` is generated build output). Nothing else is excluded (FR-024)
- [x] T006 [P] Create `vitest.config.ts` via Astro's `getViteConfig()`, `test.environment: 'node'`, `test.include: ['tests/unit/**']`
- [x] T007 [P] Create `playwright.config.ts` with `webServer` running `pnpm run preview` and `baseURL: 'http://localhost:4321'`
- [x] T008 [P] Update `.gitignore` with entries for `.env`, `.env.*` (except `.env.example`), `setup/*.local.json`, `dist`, `.astro`, `node_modules`, and Playwright's report/output directories
- [x] T010 Add devDependencies `astro` (7.x), `wrangler` (4.x), `@astrojs/check`, `typescript` (~6.0), `vitest`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `typescript-eslint`, `eslint-plugin-astro`, `secretlint`, `@secretlint/secretlint-rule-preset-recommend`, `cloudflare` to `package.json`, then run `pnpm install` to generate the committed `pnpm-lock.yaml` and `pnpm exec playwright install chromium` so the Playwright tests below can run and be seen to fail
- [x] T011 Create `astro.config.mjs` with the default static output (`defineConfig({})`)
- [x] T012 Write Playwright test `tests/e2e/placeholder.a11y.spec.ts`: (a) `@axe-core/playwright` against the built placeholder with tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` and zero violations allowed (FR-033); (b) structure per FR-031: exactly one `main` landmark, exactly one `h1`, no skipped heading levels, non-empty `<title>`, `lang="en"`, no `img`/`svg`/`video`/`audio`/`iframe`/`canvas`; (c) reflow per FR-031: no horizontal scroll at a 320 CSS px viewport and at 200% zoom; (d) keyboard per FR-032: pressing Tab from the top focuses the link to the current site first, its accessible name says where it goes, and its focused style differs visibly from its unfocused style (outline or box-shadow); run it and confirm it **fails** (no page or build exists yet)
- [x] T013 [P] Write Playwright test `tests/e2e/placeholder.budget.spec.ts` asserting zero `<script>` elements and zero JS requests, CLS 0 (`PerformanceObserver`), total transfer under 30 KB, the page still readable with JavaScript disabled, a `<meta name="robots" content="noindex">` tag present, and `<html lang="en">`; run it and confirm it **fails**
- [x] T014 [P] Write Vitest test `tests/unit/site/headers.test.ts` asserting `public/_headers` sets `X-Robots-Tag: noindex` on `/*` and never sets `no-transform`; run it and confirm it **fails** (the file doesn't exist yet)
- [x] T131 [P] Write Vitest test `tests/unit/site/config-files.test.ts` asserting: `wrangler.jsonc` (comments stripped, then parsed) has `name: "dcc-web"`, `assets.directory: "./dist"`, `workers_dev: true`, `preview_urls: true`, no `main` script and no `vars` or secrets; `.env.example` contains only comment lines and `NAME=` lines with empty values, and its names are exactly `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` (FR-025); run it and confirm it **fails** (neither file exists yet)
- [x] T015 Create `src/pages/index.astro`, the placeholder page: `lang="en"` on `<html>`, a descriptive `<title>`, exactly one `<main>` landmark, exactly one `<h1>`, `<meta name="robots" content="noindex">`, one link to the current Ghost site with an accessible name that says where it goes and a visible focus indicator, no client-side JavaScript, and no non-text content — this satisfies FR-031/FR-032 and makes T012 and T013 pass
- [x] T016 Create `public/_headers` with `/*` → `X-Robots-Tag: noindex` — makes T014 pass
- [x] T009 [P] Create `.env.example` listing `CLOUDFLARE_ACCOUNT_ID=`, `CLOUDFLARE_ZONE_ID=`, `CLOUDFLARE_API_TOKEN=` with empty values only, and comment lines naming each value's purpose and required scope (FR-025) — no placeholder that resembles a real secret
- [x] T018 Create `wrangler.jsonc`: `{ "name": "dcc-web", "compatibility_date": "<today>", "assets": { "directory": "./dist" }, "workers_dev": true, "preview_urls": true }` — makes the `wrangler.jsonc` part of T131 pass
- [x] T017 Run `pnpm run build`, `pnpm run test`, then `pnpm run test:e2e`, and confirm T012, T013, T014 and T131 now **pass**
- [x] T019 Write Vitest test `tests/unit/ci/major-change-gate.test.ts` covering: no `major-change` label → pass; label present and PR author is `drcdev` → fail with a message to reopen from `dcc-bot`; label present and `drcdev`'s latest review is `APPROVED` with `commitId === headSha` → pass; label present with no, stale or non-owner approval → fail ("waiting for Don's approval after he views the preview") — per `MajorGateInput`/`MajorGateDecision` in data-model.md; run it and confirm it **fails** (module doesn't exist)
- [x] T020 Implement `scripts/ci/major-change-gate.ts`: a pure `decide(input: MajorGateInput): MajorGateDecision` function plus a thin CLI that reads `gh api`-shaped JSON — makes T019 pass; run `pnpm run test` to confirm
- [x] T132 Write Vitest test `tests/unit/ci/workflows.test.ts` (text-level assertions, no new YAML dependency) asserting: `.github/workflows/ci.yml` has workflow name `CI`, job `verify`, triggers `pull_request` and `push` to `main`, `permissions: contents: read`, a step running `pnpm run verify`, `--frozen-lockfile`, every third-party `uses:` pinned to a 40-character SHA; `.github/workflows/major-change.yml` has job `major-change-approval`, the triggers and `pull-requests: read` from contracts/ci-and-gates.md and runs `scripts/ci/major-change-gate.ts`; neither workflow contains `continue-on-error`, an always-false `if:`, or any `secrets.` reference other than `GITHUB_TOKEN` (Principle II, FR-021); `.github/CODEOWNERS` assigns `@drcdev` to every path listed in contracts/ci-and-gates.md; run it and confirm it **fails** (files don't exist yet)
- [x] T021 [P] Create `.github/workflows/ci.yml` (workflow name `CI`, job id/name `verify`, triggers `pull_request` and `push` to `main`, `permissions: contents: read`; steps: `actions/checkout`, `pnpm/action-setup`, `actions/setup-node` with `node-version-file: .nvmrc` and `cache: pnpm`, `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps chromium`, `pnpm run verify`; third-party actions pinned to full commit SHAs; `concurrency` cancels superseded runs on the same ref) per research R10 — makes the `ci.yml` part of T132 pass
- [x] T022 [P] Create `.github/workflows/major-change.yml` (workflow name `Major change`, job id/name `major-change-approval`, triggers `pull_request` [opened, synchronize, reopened, labeled, unlabeled, ready_for_review] and `pull_request_review` [submitted, edited, dismissed], `permissions: pull-requests: read`; fetches labels, author, head SHA and reviews via `gh api` and runs `scripts/ci/major-change-gate.ts`) per contracts/ci-and-gates.md — makes the `major-change.yml` part of T132 pass
- [x] T023 [P] Create `.github/CODEOWNERS` assigning `@drcdev` to `/.github/`, `/package.json`, `/pnpm-lock.yaml`, `/.nvmrc`, `/wrangler.jsonc`, `/astro.config.mjs`, `/public/_headers`, `/scripts/ci/`, `/setup/`, `/.specify/memory/constitution.md`, and the CODEOWNERS file itself (research R9) — makes the CODEOWNERS part of T132 pass
- [x] T133 Write Vitest test `tests/unit/setup/docs-structure.test.ts` asserting `docs/setup.md` has exactly 18 item sections whose anchors are the spec's fixed item IDs in step order (FR-026), and each section has the labelled parts "What it is for", "Where to do it", "How it will be confirmed" in that order, plus the constitution principle and "Secrets" (names only) (FR-008, FR-023); run it and confirm it **fails** (the runbook doesn't exist yet). T050 later adds the registry-driven one-to-one check
- [x] T120 Write Vitest test `tests/unit/setup/docs-dns.test.ts` asserting `docs/setup.md` contains a rollback-procedure section for the nameserver switch referencing the original Squarespace nameservers (FR-039), the TTL-replacement instruction for imported records (FR-035), and the baseline-nameserver/delegated-subdomain-NS recording note (FR-034); and, once `setup/dns-baseline.json` has a non-empty `originalNameservers`, that the `dns-nameservers` section lists the same values; confirm it **fails** (docs not written yet)
- [x] T024 Create `docs/setup.md` runbook skeleton: an introduction plus 18 section headings, one per setup item, in walkthrough order, with anchors matching each item's `id` from the data-model.md registry table — the heading part of T133 now passes
- [x] T025 Write the `docs/setup.md` sections for `local-tools` and `local-credentials`: purpose, where, how confirmed, constitution principle, secret names only — state the Node 24 requirement explicitly (Don is on 22.17) and the exact read-only Cloudflare token scope (Zone Read, DNS Read, Workers Scripts Read, Web Analytics Read) from research R14
- [x] T026 Write the `docs/setup.md` sections for `cloudflare-zone`, `dns-records-parity`, `dns-nameservers`, `live-domain-ghost`: state that every record imported into Cloudflare must have its TTL changed from "automatic" to the exact Squarespace TTL value, because FR-035 compares TTL exactly; state that the baseline must record the domain's original nameservers and any delegated-subdomain NS records before the switch (FR-034, FR-039); include the rollback procedure (with a place for the original nameservers that Don fills in at T037) — switch the nameservers back at Squarespace to the recorded originals if the live site or email breaks and cannot be fixed within Cloudflare in minutes
- [x] T121 Run `pnpm run test` and confirm T120 now **passes** against the sections written in T026
- [x] T027 Write the `docs/setup.md` sections for `cloudflare-worker`, `github-machine-account`, `github-secret-scanning`, `workers-builds`, `github-ci-workflow`
- [x] T028 Write the `docs/setup.md` sections for `github-codeowners`, `github-major-label`, `github-main-protection`, `pipeline-secrets`, `review-address`, `review-address-noindex`, `web-analytics`
- [x] T097 Write Vitest test `tests/unit/setup/skill-behaviour.test.ts` asserting `.claude/skills/setup-walkthrough/SKILL.md`: confirms every step exclusively through `pnpm setup:check --json --item <id>` and contains no confirmation logic of its own (FR-010); never invokes a mutating command (`gh api -X`, `gh label create`, `wrangler deploy`, etc.) outside a "show Don this command" block, and lists only the allowed read-only commands (FR-012); forbids `cat .env`, `printenv`, `gh auth token` and debug/verbose flags (FR-012, FR-024); names the three labelled parts "What it is for", "Where to do it", "How it will be confirmed" in that order (FR-008); offers exactly the three answers Done / Skip for now / Stop (FR-009); shows a `live-domain-ghost` "Problem:" first; shows the rollback procedure before the nameserver switch (FR-039); run it and confirm it **fails** (the skill file doesn't exist yet)
- [x] T029 Create `.claude/skills/setup-walkthrough/SKILL.md` implementing contracts/walkthrough-skill.md in full: run `pnpm setup:check --json`; if `live-domain-ghost` reports a "Problem:" summary, show it before any other step; show the full ordered step list with number, title and status only; for each incomplete step show What it is for / Where to do it / How it will be confirmed as three separately labelled parts in that order (FR-008) from the registry and its docs section, then pause with AskUserQuestion (`Done — check it` / `Skip for now` / `Stop here`); on Done run `pnpm setup:check --json --item <id>` and continue, or show the finding and stay, or explain a `pending` wait; show steps whose prerequisites are not complete as blocked; refuse to show `dns-nameservers` actionable until `dns-records-parity` is complete, and show the rollback procedure (FR-039) before Don makes the nameserver switch; tell Don the after-merge steps need this slice's PR merged first, with the PR link; never ask for or echo a secret value, and list only read-only allowed commands (`pnpm setup:check …`, `pnpm setup:dns-snapshot`, `gh auth status`, `node --version`, `pnpm --version`, `git status`) — commands that change provider settings are shown for Don to run himself, never run by the skill; if Don pastes something that looks like a secret, tell him to revoke and recreate it and do not repeat it — makes T097 pass
- [x] T098 Run `pnpm run test` and confirm T097 now **passes** against the SKILL.md written in T029

**Checkpoint**: The repository builds, lints, type-checks and deploys a placeholder; CI and the
major-change gate exist; the runbook and skill files exist with full content, ready to be wired
to the (not-yet-built) setup check.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The setup-item registry, schemas, providers and fixtures that every user-story phase
below depends on. **No per-item check, walkthrough behaviour, or docs-drift enforcement can be
built until this phase is done.**

- [x] T031 Write Vitest test `tests/unit/setup/schemas.test.ts` for `astro/zod` schemas validating `setup/config.json`, `setup/dns-baseline.json`, `setup/github-ruleset.json`, and the `--json` report shape (valid samples accepted; invalid samples rejected with a clear error); run it and confirm it **fails** (schemas.ts doesn't exist)
- [x] T032 Implement `scripts/setup-check/types.ts`: `SetupItem`, `CheckResult`, `CheckReport`, `SecretRef`, `DnsBaselineRecord`, `ProviderContext`, `MajorGateInput`, `MajorGateDecision` per data-model.md
- [x] T033 Implement `scripts/setup-check/schemas.ts` using `astro/zod` for config/baseline/ruleset/report validation — makes T031 pass; run `pnpm run test` to confirm
- [x] T034 [P] Create `setup/config.json`: `{ "owner": "drcdev", "repo": "dcc-web", "machineAccount": "dcc-bot", "workerName": "dcc-web", "zone": "doncoleman.ca", "reviewHost": "new.doncoleman.ca", "ghostMarker": "Ghost" }`
- [x] T035 [P] Create `setup/github-ruleset.json`, the `main-protection` ruleset body: `deletion` blocked, `non_fast_forward` blocked, `pull_request` (required_approving_review_count 0, require_code_owner_review true, dismiss_stale_reviews_on_push true), `required_status_checks` (strict, contexts `verify` and `major-change-approval`), no bypass actors — per research R9
- [x] T036 Write Vitest test `tests/unit/setup/dns-baseline-schema.test.ts` asserting `setup/dns-baseline.json` is `{ originalNameservers, records }` per data-model.md, every record has type/name/content/ttl/source/decision, MX/SRV records carry priority, and a `drop` record has a reason; invalid samples (missing field, MX without priority, drop without reason) are rejected (FR-034); run it and confirm it **fails** (the baseline file doesn't exist yet)
- [x] T137 Create the initial `setup/dns-baseline.json` as `{ "originalNameservers": [], "records": [] }` — schema-valid, so it makes T036 pass, while T058 guarantees `dns-records-parity` stays `missing` until Don fills it in at T037; run `pnpm run test` to confirm
- [x] T134 Write Vitest test `tests/unit/setup-check/dns-snapshot.test.ts` with a faked resolver: the helper resolves every baseline name plus the fixed common-name list (apex, `www`, `mail`, `_dmarc`, common DKIM selectors), reports each answer not in the baseline, writes only the gitignored `setup/dns-snapshot.local.json`, and makes no call other than DNS reads (FR-037, FR-004); run it and confirm it **fails** (the helper doesn't exist yet)
- [x] T038 Implement `scripts/setup-check/dns-snapshot.ts`, a read-only helper that resolves the baseline's names plus a fixed common-name list (apex, `www`, `mail`, `_dmarc`, common DKIM selectors) against public DNS and writes gitignored `setup/dns-snapshot.local.json`; it changes nothing at any provider — makes T134 pass
- [x] T039 Write Vitest test `tests/unit/setup-check/providers/read-only.test.ts` asserting the GitHub provider module never constructs a `gh api` call using `-X`/`--method`/`-f`/`-F`/`--field`/`--raw-field`/`--input`, the Cloudflare provider module exposes only list/get SDK methods, and the HTTP provider only issues `GET`/`HEAD` requests (FR-004); run it and confirm it **fails** (provider modules don't exist)
- [x] T135 Write Vitest test `tests/unit/setup-check/providers/behaviour.test.ts`: a call exceeding the 10-second limit, a `gh` non-zero exit or auth failure, and a Cloudflare 401/403 each surface as an access error that the check maps to `could-not-check` with a reason naming the missing access (Story 1 scenario 4, FR-027); no provider sets a verbose or debug mode (`GH_DEBUG`, `DEBUG`, SDK debug logging) (FR-024); provider error text is passed through redaction before it is returned, and the env reader never includes a value in an error (FR-024, FR-030); run it and confirm it **fails** (provider modules don't exist)
- [x] T040 Implement `scripts/setup-check/providers/github.ts` (runs `gh api` via `node:child_process.execFile`, GET only)
- [x] T041 Implement `scripts/setup-check/providers/cloudflare.ts` (official `cloudflare` SDK, read-only token loaded from `.env`, wraps list/get calls only)
- [x] T042 [P] Implement `scripts/setup-check/providers/dns.ts` (`node:dns/promises` `Resolver` pinned to 1.1.1.1 and 8.8.8.8)
- [x] T043 [P] Implement `scripts/setup-check/providers/http.ts` (global `fetch` for HTTPS, header and Ghost-marker probes)
- [x] T044 [P] Implement `scripts/setup-check/providers/env.ts` (Node `process.loadEnvFile` reader for `.env`)
- [x] T045 [P] Implement `scripts/setup-check/providers/fs.ts` (read-only reader for `setup/*.json` and `docs/setup.md`); after T040–T045, run `pnpm run test` and confirm T039 and T135 now **pass**
- [x] T046 [P] Create `tests/fixtures/providers/`, recorded JSON fixtures for GitHub, Cloudflare, DNS and HTTP responses covering complete/missing/pending/could-not-check for each of the 18 items, plus the edge cases: partial branch protection, records present only at Squarespace, delegation pending, live domain switched away from Ghost, an indexable review host, and a pull request authored by Don (FR-006)
- [x] T048 Write Vitest test `tests/unit/setup/items.test.ts` asserting registry invariants: unique `id` and `order`; non-empty text fields; every `secrets` entry exists in the manifest; `dependsOn` refers only to earlier items and contains no cycle; every item has a matching `docs/setup.md` anchor; run it and confirm it **fails** (items.ts doesn't exist)
- [x] T050 Write Vitest test `tests/unit/setup/drift.test.ts` asserting: (a) every registry item has exactly one `docs/setup.md` section with a matching anchor and vice versa (FR-023); (b) every secret/variable name referenced in `.github/workflows/*.yml`, `wrangler.jsonc` and `.env.example` exists in the manifest (the automatic `GITHUB_TOKEN` is exempt), every `local-env` manifest entry appears in `.env.example`, every `github-actions` entry is referenced by a workflow, and every `gh-keyring` entry is named in `docs/setup.md` (it lives in no committed file); (c) the ruleset contexts in `setup/github-ruleset.json` match the job names in the CI workflows; (d) `.github/CODEOWNERS` covers every major-path item; run it and confirm it **fails** (items.ts and secrets.ts don't exist yet). Skill-to-check wiring (FR-010) is tested by T097
- [x] T047 Implement `scripts/setup-check/secrets.ts`, the `SecretRef` manifest: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `DCC_BOT_GITHUB_CREDENTIAL`, per data-model.md — together with T049 and T051 makes T050 pass
- [x] T049 Implement `scripts/setup-check/items.ts`, the 18-item setup registry (`id`, `order`, `title`, `purpose`, `where`, `confirmedBy`, `needsDon`, `principles`, `requirements`, `secrets`, `dependsOn`, `phase`, and a `check` field wired to a not-yet-implemented function per item) per the data-model.md table — makes T048 pass; run `pnpm run test` to confirm
- [x] T051 Reconcile `docs/setup.md`, `.github/CODEOWNERS`, `.env.example`, `setup/github-ruleset.json` and `.claude/skills/setup-walkthrough/SKILL.md` (from Phase 1) against the finished `items.ts`/`secrets.ts` — makes T050 pass; run `pnpm run test` to confirm

**Checkpoint**: The registry, schemas, providers, fixtures, and cross-file drift enforcement are
complete. Per-item checks (US1) can now be implemented.

---

## Phase 3: User Story 1 - Check setup status at any time (Priority: P1) 🎯 MVP

**Goal**: `pnpm setup:check` inspects all 18 setup items and reports each as complete, missing,
pending or could-not-check, with a next action for anything not complete, never showing a secret
value.

**Independent Test**: With nothing set up, run the check and confirm every item is reported
missing with a next action. Complete one item by hand and confirm only that item flips to
complete.

- [ ] T052 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/local-tools.test.ts` (complete when Node ≥ 24, pnpm version matches `packageManager`, `gh` signed in as Don; missing/could-not-check cases from fixtures); confirm it **fails**
- [ ] T053 [US1] Implement `scripts/setup-check/checks/local-tools.ts` — makes T052 pass
- [ ] T054 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/local-credentials.test.ts` (`.env` has every required name non-empty; Cloudflare token-verify reports active; missing/could-not-check cases); confirm it **fails**
- [ ] T055 [US1] Implement `scripts/setup-check/checks/local-credentials.ts` — makes T054 pass
- [ ] T056 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/cloudflare-zone.test.ts` (zone `doncoleman.ca` exists on the Free plan, id equals `CLOUDFLARE_ZONE_ID`); confirm it **fails**
- [ ] T057 [US1] Implement `scripts/setup-check/checks/cloudflare-zone.ts` — makes T056 pass
- [ ] T058 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/dns-records-parity.test.ts` (every `keep` record matches per FR-035/FR-036 normalisation including `proxied: false` and exact TTL; an undecided record keeps the item `missing`; Squarespace-only unmatched records are flagged; records present in the Cloudflare zone but not in the baseline are listed in `details` for Don to add or delete; a baseline with no records or no `originalNameservers` keeps the item `missing` with "record the Squarespace baseline first", so parity can never pass vacuously before the nameserver switch); confirm it **fails**
- [ ] T059 [US1] Implement `scripts/setup-check/checks/dns-records-parity.ts` — makes T058 pass
- [ ] T060 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/dns-nameservers.test.ts` (public NS equal the zone's assigned nameservers and zone status active → complete; delegation in progress → pending; item stays `missing` with "complete DNS parity first" while `dns-records-parity` is not complete, per FR-037); confirm it **fails**
- [ ] T061 [US1] Implement `scripts/setup-check/checks/dns-nameservers.ts` — makes T060 pass
- [ ] T062 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/live-domain-ghost.test.ts` (apex/`www` A/AAAA/CNAME match the recorded Ghost baseline and every kept MX/email TXT record resolves as in the baseline → complete; any difference → `missing` with a "Problem:" summary per FR-038); confirm it **fails**
- [ ] T063 [US1] Implement `scripts/setup-check/checks/live-domain-ghost.ts` — makes T062 pass
- [ ] T064 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/cloudflare-worker.test.ts` (Worker `dcc-web` exists with `workers.dev` and preview URLs enabled); confirm it **fails**
- [ ] T065 [US1] Implement `scripts/setup-check/checks/cloudflare-worker.ts` — makes T064 pass
- [ ] T066 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/github-machine-account.test.ts` (`dcc-bot` collaborator permission is write or maintain, not admin, per FR-013); confirm it **fails**
- [ ] T067 [US1] Implement `scripts/setup-check/checks/github-machine-account.ts` — makes T066 pass
- [ ] T068 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/github-secret-scanning.test.ts` (`security_and_analysis.secret_scanning` and `…secret_scanning_push_protection` both `enabled`); confirm it **fails**
- [ ] T069 [US1] Implement `scripts/setup-check/checks/github-secret-scanning.ts` — makes T068 pass
- [ ] T070 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/workers-builds.test.ts` (latest `main` commit has a successful Workers Builds run; latest open PR head has one with a preview URL; `pending` while queued/running); confirm it **fails**
- [ ] T071 [US1] Implement `scripts/setup-check/checks/workers-builds.ts` — makes T070 pass
- [ ] T072 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/github-ci-workflow.test.ts` (`ci.yml` and `major-change.yml` exist on `main`; latest `verify` run on `main` succeeded); confirm it **fails**
- [ ] T073 [US1] Implement `scripts/setup-check/checks/github-ci-workflow.ts` — makes T072 pass
- [ ] T074 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/github-codeowners.test.ts` (CODEOWNERS on `main` names `@drcdev` for every major path; GitHub reports no CODEOWNERS errors); confirm it **fails**
- [ ] T075 [US1] Implement `scripts/setup-check/checks/github-codeowners.ts` — makes T074 pass
- [ ] T076 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/github-major-label.test.ts` (label `major-change` exists; repository `allow_auto_merge` is true); confirm it **fails**
- [ ] T077 [US1] Implement `scripts/setup-check/checks/github-major-label.ts` — makes T076 pass
- [ ] T078 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/github-main-protection.test.ts` (active ruleset on `main` matches `setup/github-ruleset.json`; each missing or weaker rule named individually from the closed list in the spec's Edge Cases); confirm it **fails**
- [ ] T079 [US1] Implement `scripts/setup-check/checks/github-main-protection.ts` — makes T078 pass
- [ ] T080 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/pipeline-secrets.test.ts` (GitHub Actions secret and variable names equal the manifest's GitHub entries — none in this slice — with none missing and none extra); confirm it **fails**
- [ ] T081 [US1] Implement `scripts/setup-check/checks/pipeline-secrets.ts` — makes T080 pass
- [ ] T082 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/review-address.test.ts` (`new.doncoleman.ca` is a Custom Domain on `dcc-web`; `https://new.doncoleman.ca/` returns 200 over HTTPS); confirm it **fails**
- [ ] T083 [US1] Implement `scripts/setup-check/checks/review-address.ts` — makes T082 pass
- [ ] T084 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/review-address-noindex.test.ts` (response header `X-Robots-Tag` contains `noindex`; an automated case confirms the rule applies to every path, not only `/`); confirm it **fails**
- [ ] T085 [US1] Implement `scripts/setup-check/checks/review-address-noindex.ts` — makes T084 pass
- [ ] T086 [P] [US1] Write Vitest test `tests/unit/setup-check/checks/web-analytics.test.ts` (a Web Analytics site for `new.doncoleman.ca` exists with automatic setup on; served HTML references the Cloudflare beacon); confirm it **fails**
- [ ] T087 [US1] Implement `scripts/setup-check/checks/web-analytics.ts` — makes T086 pass
- [ ] T088 [US1] Wire all 18 `checks/*.ts` functions into their `items.ts` registry entries' `check` field; run `pnpm run test` and confirm every per-item test suite (T052–T087) passes
- [ ] T089 [P] [US1] Write Vitest test `tests/unit/setup-check/report.test.ts`: summary line "`N` of 18 complete"; `ok` true only when `counts.complete === counts.total`; `nextAction` required whenever `status !== 'complete'`; `reason` required for `could-not-check` and printed on a line starting "Reason:"; each status printed as its word(s) ("complete", "missing", "pending", "could not check") beside any symbol; no ANSI colour codes when stdout is not a TTY or `NO_COLOR` is set; no box-drawing characters (FR-029); each `summary` is one sentence; a `pending` next action states what is awaited, the expected wait and that no action is needed now (FR-028); `step` formatted `"Step N of 18"`; `docs` formatted `docs/setup.md#<id>`; a canary secret value injected into a fake provider error never appears in the human or JSON output, is replaced by `[redacted]`, and the message still names the secret (FR-005, FR-030, SC-004); confirm it **fails**
- [ ] T090 [US1] Implement `scripts/setup-check/report.ts` (human report and `--json` report per contracts/setup-check-cli.md and contracts/check-report.schema.json, with a final redaction pass replacing any manifest secret's value with `[redacted]`) — makes T089 pass; run `pnpm run test` to confirm
- [ ] T091 [P] [US1] Write Vitest test `tests/unit/setup-check/cli.test.ts`: exit code 0 only when every checked item is `complete`; exit 1 otherwise; exit 2 on an unknown flag, an unknown `--item` id, or an invalid `setup/*.json`; `--item` filters to the named item(s); `--json` output validates against `contracts/check-report.schema.json`; `--no-network` marks every non-local item `could-not-check` with reason "skipped: --no-network"; an item whose `dependsOn` prerequisite is not `complete` is reported `missing` with a next action naming the prerequisite step, and `--item <id>` evaluates that item's prerequisites to decide this (spec "Setup items" prerequisites rule, FR-011); confirm it **fails**
- [ ] T092 [US1] Implement `scripts/setup-check/cli.ts` (arg parsing; prerequisite gating per the registry `dependsOn`; checks run concurrently with a 10-second per-call timeout; exit codes 0/1/2 per contracts/setup-check-cli.md) — makes T091 pass; run `pnpm run test` to confirm
- [ ] T093 [US1] Confirm the `setup:check` and `setup:dns-snapshot` scripts set in T001 run: `pnpm setup:check --no-network` runs locally with no network call
- [ ] T094 [US1] Run `pnpm run verify` (set in T001: `lint:secrets`, `lint`, `typecheck`, `test`, `build`, `test:e2e`, in order, stopping at the first failure) locally end-to-end and confirm every step passes
- [ ] T095 [US1] Run quickstart §2 (Story 1 acceptance scenario 1): with no `.env` and no provider setup, run `pnpm setup:check` and confirm every item is `missing` or `could-not-check`, each with a next action, walkthrough step and docs link, and the process exits `1`
- [ ] T096 [US1] Run quickstart §5 (Story 1 acceptance scenario 4): with the network disconnected (or `CLOUDFLARE_API_TOKEN` temporarily blanked), run `pnpm setup:check` and confirm the Cloudflare/DNS items report `could-not-check` with a reason and remedy, and none is reported `complete`

**Checkpoint**: `pnpm setup:check` is fully implemented and independently usable and testable on a
fresh clone with no live accounts — the MVP of this slice.

---

## Phase 4: User Story 2 - Guided first-time setup (Priority: P2)

**Goal**: `/setup-walkthrough` takes Don through every setup item in a safe order, pausing at
every step that needs him, confirming each step through the setup check, and completing the real
account setup this slice depends on.

**Independent Test**: Start the walkthrough with one item already complete and the rest missing.
Confirm it skips the complete item, stops at the first missing one with a what/where/how-confirm
explanation, refuses to move on if confirmation fails, and continues once it passes.

- [ ] T109 Don starts `/setup-walkthrough` in Claude Code with only `local-tools` able to pass (Node 24 from T030) and performs T099–T108 and T037 through it, in the listed order; he confirms it shows the ordered step list, skips already-complete steps with a note, shows what/where/how-confirmed for each incomplete step, offers Done/Skip/Stop, stays on a step whose confirmation fails, refuses to show the `dns-nameservers` step actionable until `dns-records-parity` is complete, shows the rollback procedure before the switch, and resumes at the first incomplete step after he stops and restarts (Story 2 acceptance scenarios 1–5, quickstart §6). After T110 he resumes it for T111–T119 [PREVIEW-CHECK]
- [ ] T099 Don confirms `gh auth status` shows his own account signed in, then runs `pnpm setup:check --item local-tools` and confirms it reports `complete` (Node 24 already switched in T030) [PREVIEW-CHECK]
- [ ] T100 Don creates a Cloudflare API token scoped to read-only access on his account and the `doncoleman.ca` zone (Zone Read, DNS Read, Workers Scripts Read, Web Analytics Read), copies `.env.example` to `.env` and fills in `CLOUDFLARE_API_TOKEN`, then runs `pnpm setup:check --item local-credentials` until it reports `complete` [PREVIEW-CHECK]
- [ ] T101 Don adds zone `doncoleman.ca` to Cloudflare on the Free plan, records the zone ID in `.env` as `CLOUDFLARE_ZONE_ID` and the account ID as `CLOUDFLARE_ACCOUNT_ID`, then runs `pnpm setup:check --item cloudflare-zone` until it reports `complete` [PREVIEW-CHECK]
- [ ] T037 Don lists every DNS record from Squarespace's DNS screen for `doncoleman.ca` and its subdomains (A, AAAA, CNAME, MX, TXT, SRV, CAA, delegated-subdomain NS) plus the domain's current nameservers, and commits them into `setup/dns-baseline.json` (`records` with a keep/drop decision and a reason for each drop; `originalNameservers`); records the same original nameservers in the `dns-nameservers` section of `docs/setup.md` for rollback (FR-034, FR-039); `pnpm run verify` must still pass on the commit [PREVIEW-CHECK]
- [ ] T102 Don runs `pnpm setup:dns-snapshot`, adds any name discovered but missing from `setup/dns-baseline.json` with a decision, creates or imports the matching `keep` records in the Cloudflare zone as DNS only (grey cloud), and sets each record's TTL to the exact Squarespace value — replacing Cloudflare's "automatic" TTL, which does not match a numeric baseline TTL (FR-035) — then reruns `pnpm setup:check --item dns-records-parity` until it reports `complete` [PREVIEW-CHECK]
- [ ] T105 Don first confirms `pnpm setup:check --item live-domain-ghost` reports `complete` and reads the rollback procedure in `docs/setup.md#dns-nameservers` (FR-039, shown by the walkthrough); then, only after `dns-records-parity` is `complete`, changes the nameservers for `doncoleman.ca` at Squarespace to the two Cloudflare-assigned nameservers and runs `pnpm setup:check --item dns-nameservers` until it reports `complete` (delegation may show `pending` for up to 24 hours) [PREVIEW-CHECK]
- [ ] T106 Don confirms `pnpm setup:check --item live-domain-ghost` still reports `complete` after the nameserver switch (T105), and manually confirms `https://doncoleman.ca/` still shows the Ghost site and a test email still arrives; if not, he follows the rollback procedure [PREVIEW-CHECK]
- [ ] T103 Don creates Worker `dcc-web` by importing the repository in Workers & Pages → Create → Import a repository → `drcdev/dcc-web` (this creates the Worker and connects Workers Builds in one step, research R4), authorising Cloudflare's GitHub app for the `drcdev/dcc-web` repository only, not all repositories (FR-021); then enables its `workers.dev` address and preview URLs and runs `pnpm setup:check --item cloudflare-worker` until it reports `complete` [PREVIEW-CHECK]
- [ ] T104 Don sets the Workers Builds settings on Worker `dcc-web`: production branch `main`, build command `pnpm run build`, deploy command `pnpm exec wrangler deploy`, non-production branch builds on with deploy command `pnpm exec wrangler versions upload`, and no build variables or secrets; then confirms this slice's pull request shows a Workers Builds preview URL [PREVIEW-CHECK]
- [ ] T107 Don creates the `dcc-bot` GitHub machine account, adds it as a `drcdev/dcc-web` collaborator with write permission (not admin), confirms its name matches `machineAccount` in `setup/config.json`, and signs it into the local `gh` keyring (`gh auth login`), then switches the active `gh` account back to Don (`gh auth switch`) because the check reads as Don; runs `pnpm setup:check --item github-machine-account` until it reports `complete` [PREVIEW-CHECK]
- [ ] T108 Don enables GitHub secret scanning and push protection for `drcdev/dcc-web` in repository settings, then runs `pnpm setup:check --item github-secret-scanning` until it reports `complete` [PREVIEW-CHECK]
- [ ] T110 Don reviews this slice's pull request on its Workers Builds preview deployment and merges it by hand only when the `verify` check on the pull request's latest commit is green (bootstrap exception: `dcc-bot` and the ruleset do not exist yet, per plan.md's Constitution Check, so GitHub cannot enforce this yet; the exception covers only the missing enforcement and code-owner approval, never a failing `verify`). He records his approval of the major change on the pull request before merging [PREVIEW-CHECK]
- [ ] T111 Don confirms `pnpm setup:check --item workers-builds` reports `complete` once the production build on `main` from Workers Builds succeeds [PREVIEW-CHECK]
- [ ] T112 Don confirms `pnpm setup:check --item github-ci-workflow` reports `complete` once the `verify` run on `main` succeeds [PREVIEW-CHECK]
- [ ] T113 Don confirms `pnpm setup:check --item github-codeowners` reports `complete` now that `.github/CODEOWNERS` is on `main` [PREVIEW-CHECK]
- [ ] T114 Don creates the `major-change` label and enables repository auto-merge, then runs `pnpm setup:check --item github-major-label` until it reports `complete` [PREVIEW-CHECK]
- [ ] T115 Don imports `setup/github-ruleset.json` as a repository ruleset on `main` (`gh api -X POST repos/drcdev/dcc-web/rulesets --input setup/github-ruleset.json`), then runs `pnpm setup:check --item github-main-protection` until every rule reports active [PREVIEW-CHECK]
- [ ] T116 Don confirms `pnpm setup:check --item pipeline-secrets` reports `complete` (no GitHub Actions secrets or variables defined beyond the documented empty list) [PREVIEW-CHECK]
- [ ] T117 Don adds `new.doncoleman.ca` as a Custom Domain on Worker `dcc-web` in the Cloudflare dashboard, then runs `pnpm setup:check --item review-address` until it reports `complete` [PREVIEW-CHECK]
- [ ] T118 Don confirms `pnpm setup:check --item review-address-noindex` reports `complete` and independently verifies `curl -sI https://new.doncoleman.ca/ | grep -i x-robots-tag` contains `noindex` [PREVIEW-CHECK]
- [ ] T136 Don does a keyboard-only pass over `https://new.doncoleman.ca/` and confirms the link to the current site is reachable with Tab and shows a visible focus indicator (SC-008, FR-032) [PREVIEW-CHECK]
- [ ] T119 Don enables Cloudflare Web Analytics with automatic setup for `new.doncoleman.ca`, then runs `pnpm setup:check --item web-analytics` until it reports `complete` [PREVIEW-CHECK]

**Checkpoint**: The guided walkthrough has taken Don through every setup item, and each is
individually confirmed complete by the setup check.

---

## Phase 5: User Story 3 - Repeatable, auditable setup record (Priority: P3)

**Goal**: `docs/setup.md` documents every setup item in plain language — purpose, location,
confirmation, constitution principle, secret names only — so the setup can be repeated or
audited without the walkthrough.

**Independent Test**: Read the setup document on its own and confirm every check item appears in
it with purpose, location and confirmation, and that no secret value appears anywhere in the
repository.

- [ ] T122 [US3] Run quickstart §9 (Story 3 acceptance scenario 1): open `docs/setup.md` and confirm one section per check item with purpose, where, how confirmed, constitution principle and secret names only, matching the `pnpm run verify` drift test's result
- [ ] T123 [US3] Run quickstart's negative check and Story 3 acceptance scenario 2 (SC-004): run `pnpm run lint:secrets` and manually scan the repository for any committed secret-like value; review the `/setup-walkthrough` transcript from T109, the GitHub Actions logs and the Workers Builds logs for any secret value; confirm none are found and only secret/variable names appear [PREVIEW-CHECK]

**Checkpoint**: The setup is fully documented and auditable without the walkthrough or the agent.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Confirm the whole-feature success criteria that only make sense once every earlier
phase is in place.

- [ ] T124 Confirm `pnpm setup:check` completes in under 30 seconds on a full 18-item run with every provider reachable (SC-002), including a cold first run of the day [PREVIEW-CHECK]
- [ ] T125 As `dcc-bot`, open a pull request that fails a unit test and confirm the `verify` check fails and the merge button is blocked (SC-006, quickstart §7.1) [PREVIEW-CHECK]
- [ ] T126 As `dcc-bot`, open a pull request labelled `major-change` (or touching `package.json`) with green checks and confirm it cannot merge until Don approves the latest commit as the required code-owner reviewer, then confirm it becomes mergeable after his approval (SC-006, quickstart §7.2) [PREVIEW-CHECK]
- [ ] T127 As `dcc-bot`, open a non-major pull request with green checks and confirm it is mergeable (auto-merge) without Don's review (SC-006, quickstart §7.3) [PREVIEW-CHECK]
- [ ] T128 Run `pnpm setup:check` live and confirm "18 of 18 complete" with exit code 0 (quickstart §8); record the elapsed time from the first walkthrough step to this result, minus pending/PR-review wait time, and confirm it is under 90 minutes (SC-001) [PREVIEW-CHECK]
- [ ] T129 [P] Confirm added running cost is $0/month (SC-007) by reviewing the Cloudflare and GitHub plan tiers used (Free plan zone/Workers/Workers Builds/Web Analytics, public-repo GitHub Actions, one free `dcc-bot` machine account) and record the result as a comment on this slice's merged pull request [PREVIEW-CHECK]
- [ ] T130 Run `pnpm run verify` one final time locally and confirm secretlint, ESLint, `astro check`, Vitest, `astro build` and Playwright (axe + page-budget) all pass together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (needs `package.json`, tsconfig, Vitest config,
  `docs/setup.md` skeleton and the skill file to exist). **Blocks every user-story phase.**
  Contains no `[PREVIEW-CHECK]` task: the committed DNS baseline starts empty (T137) and Don fills
  it in during the walkthrough (T037).
- **US1 (Phase 3)**: Depends on Foundational (registry, schemas, providers, fixtures). Delivers
  the MVP.
- **US2 (Phase 4)**: Depends on US1 — the walkthrough's only confirmation logic is the setup
  check CLI (FR-010), so `pnpm setup:check --item <id>` must exist first. Also depends on the
  Foundational drift test. Don fills in the DNS baseline (T037) as part of walkthrough step 4.
- **US3 (Phase 5)**: Depends on Foundational (registry/docs exist) and benefits from US1's drift
  test infrastructure; largely independent of US2's live walkthrough, but its independent test
  (reading the finished record) is most meaningful once US2 has run.
- **Polish (Phase 6)**: Depends on US1, US2 and US3 all being complete — it validates whole-slice
  success criteria (branch protection, timing, cost).

### Within Each Phase

- Every test task MUST be run and seen to fail before its paired implementation task, and re-run
  to confirm it passes immediately after.
- Per-item check test/implementation pairs (T052–T087) are independent of each other and may be
  done in any order or in parallel; T088 (wiring into the registry) depends on all of them.
- `[PREVIEW-CHECK]` tasks in Phase 4 follow the safe walkthrough order from plan.md and must be
  done in the order listed: baseline recorded (T037) and DNS parity complete (T102) before the
  nameserver switch (T105); `live-domain-ghost` confirmed and the rollback procedure read before
  the switch, and confirmed again after it (T106); every before-merge step before the PR merge at
  T110; every after-merge step (T111–T119, T136) after it. T110 merges only with `verify` green.
- T030 (Node 24) blocks T010 onward; T017 runs only after T018 so it also confirms T131.

### Parallel Opportunities

- `[P]`-marked Setup tasks T002–T008 can run in parallel; T013, T014 and T131 can be written in
  parallel; T009 follows T131, and T021–T023 follow T132.
- All `[P]`-marked Foundational tasks (T034–T035, T042–T045, T046) can run in parallel once their
  own prerequisites are met (T042–T045 after T039 and T135).
- All 18 "write test" tasks in Phase 3 (T052, T054, T056, T058, T060, T062, T064, T066, T068,
  T070, T072, T074, T076, T078, T080, T082, T084, T086) can be written in parallel; their paired
  implementation tasks can then proceed in parallel too, since each `checks/<id>.ts` file is
  independent.
- T089 and T091 (report and CLI tests) can be written in parallel.

---

## Parallel Example: Phase 3 (User Story 1) check tests

```bash
# Launch all 18 "write test" tasks together — each targets a different file:
Task: "Write Vitest test tests/unit/setup-check/checks/local-tools.test.ts"
Task: "Write Vitest test tests/unit/setup-check/checks/local-credentials.test.ts"
Task: "Write Vitest test tests/unit/setup-check/checks/cloudflare-zone.test.ts"
# … and the remaining 15 checks/*.test.ts files
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1): `pnpm setup:check` reports all 18 items against fixtures, with a
   working CLI, report and `verify` gate.
3. **STOP and VALIDATE**: run quickstart §1–5 locally; confirm `pnpm run verify` is green in CI.

### Incremental Delivery

1. Setup + Foundational → foundation ready (no live accounts touched yet).
2. Add US1 → the setup check works against recorded fixtures and is independently testable. It
   ships in this slice's single pull request, which merges only at T110.
3. Add US2 → Don runs the real walkthrough, doing the live account setup for all 18 items
   (`[PREVIEW-CHECK]` tasks T109, T099–T119, T037 and T136, in the listed order), including
   merging this slice's own PR at T110.
4. Add US3 → the finished `docs/setup.md` is confirmed complete and secret-free on its own.
5. Polish → branch-protection test PRs, timing and cost are confirmed against the live setup.

### Notes

- `[P]` tasks touch different files with no dependency on an incomplete task.
- `[Story]` labels map a task to its user story for traceability; Setup, Foundational and Polish
  tasks carry no story label.
- `[PREVIEW-CHECK]` tasks are Don's own actions and cannot be completed or verified by an agent
  working locally with fixtures; every other task is agent-executable and locally verifiable.
- Commit after each task or logical group; never skip a "confirm it fails" or "confirm it passes"
  step — that is the test-first guarantee this slice's constitution requires.
