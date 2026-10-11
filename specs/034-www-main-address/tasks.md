---
description: "Task list for making www.doncoleman.ca the main address"
---

# Tasks: Make www.doncoleman.ca the main address

**Input**: Design documents from `specs/034-www-main-address/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: Mandatory (constitution Principle I). Every test task names its one primary layer (the
cheapest that can observe the behaviour, per "Where a test goes" in `docs/testing.md`) and is seen
to fail (red) before the implementation task it covers. A second layer needs a written reason; none
is used here. Live behaviour after the swap is confirmed by setup-check item 18, not by CI.

**Visual baselines**: No baseline task. The change swaps one origin constant and setup-check/docs
files; no page, template, shell or design-system pixel changes (plan: "No visual baseline should
change"). If the visual project shows drift in `verify`, stop and investigate rather than refresh.

**`[PREVIEW-CHECK]`**: per `.claude/skills/_shared/preview-check.md`, work that cannot be verified
locally (the live dashboard swap, DNS, Search Console, live hosts) carries the marker, stays
unticked, and is listed in the PR body. The swap itself is Don's post-merge work; only the written
runbook and docs are repository tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: different files, no dependency on an incomplete task
- Test layers: unit (Vitest `unit`), build (Vitest `build`, real `astro build`)

---

## Phase 1: Setup

- [ ] T001 Run `node -v` (switch with `source ~/.nvm/nvm.sh && nvm use` in the same command if needed), `git merge origin/main` into the branch, and note the baseline test counts for `tests/unit/setup`, `tests/unit/setup-check` and `tests/unit/site` so later red runs can be told from pre-existing failures.

---

## Phase 2: Foundational (blocks US3 and US4)

**Purpose**: the baseline schema field and the shared host constants that items 4, 15, 16 and 18 use.

- [ ] T002 [P] Unit test (layer: unit) in `tests/unit/setup/dns-baseline-schema.test.ts`: the strict schema accepts optional `proxied: boolean`, still rejects unknown keys, and the real `setup/dns-baseline.json` contains `AAAA doncoleman.ca 100::` with `proxied: true`, the eleven existing records without a `proxied` key, and no record named `www` (contracts/dns-baseline.md). Run and record red.
- [ ] T003 Add optional `proxied` to the baseline record type and schema in `scripts/setup-check/types.ts` and `scripts/setup-check/schemas.ts`, and append the placeholder record to `setup/dns-baseline.json`. T002 goes green.

**Checkpoint**: schema and baseline ready.

---

## Phase 3: User Story 1 - Readers and search engines land on www (P1) MVP

**Goal**: a production build names only `https://www.doncoleman.ca` for the site's own address (FR-001 to FR-004, SC-001).

**Independent test**: the build project's production build has no text file containing `//doncoleman.ca` (any scheme), and every site-host absolute URL has the `www` origin.

### Tests (write first, see them fail)

- [ ] T004 [P] [US1] Unit test (layer: unit) in `tests/unit/site/site-origin.test.ts`: `resolveSiteOrigin` returns `https://www.doncoleman.ca` for `WORKERS_CI=1` + `WORKERS_CI_BRANCH=main` and for local, test and missing-value environments; preview branch with valid config still returns the preview alias origin. Run and record red.
- [ ] T005 [P] [US1] Unit test (layer: unit) in `tests/unit/site/astro-config.test.ts`: Astro's `site` resolves to the `www` origin in the default environment. Update the expectations in `tests/unit/site/sitemap.test.ts`, `tests/unit/site-check/crawl.test.ts` and `tests/unit/setup-check/providers/http.test.ts` only where they assert the fallback origin (not where bare-domain strings are arbitrary fixtures). Run and record red.
- [ ] T006 [US1] Build test (layer: build, because only the real `astro build` shows every canonical, Open Graph, sitemap, `robots.txt` and RSS URL) in `tests/build/indexing.test.ts`: change the expected origin to `https://www.doncoleman.ca` and add an assertion that no text file in the build output (every `.html`, `.xml`, `.txt`, `.json` and other non-image, non-font file, per SC-001) contains `//doncoleman.ca` (covers `https://`, `http://` and scheme-relative bare-domain URLs, FR-003; mail addresses and prose excluded, per contracts/site-origin.md). Change only the sitemap-origin expectations in `tests/build/drafts.test.ts` and `tests/build/local-site.test.ts`. Run and record red.

### Implementation

- [ ] T007 [US1] Set `FALLBACK_ORIGIN = "https://www.doncoleman.ca"` in `src/lib/site-origin.ts` and update its comment to cite spec 034 (supersedes 011 FR-010a). Leave prose naming "doncoleman.ca" such as `ContactForm.astro` unchanged (FR-003). T004 to T006 go green.
- [ ] T008 [P] [US1] Update the comment in `tests/e2e/seo.spec.ts` that names the bare domain; the spec reads its origin from `robots.txt`, so no assertion changes (no second-layer test is added).
- [ ] T009 [P] [US1] Update the fixtures `tests/fixtures/site-check/sitemap-index.xml`, `sitemap-0.xml` and `robots.txt` to `www` only if a test in T005 needs them to match the new fallback; otherwise leave them.

**Checkpoint**: US1 repository behaviour complete and testable alone.

---

## Phase 4: User Story 2 - Old Ghost addresses still reach their posts (P1)

**Goal**: the spec 030 redirects stay unchanged (FR-004) and the setup check can rely on the fixed probe mapping.

**Independent test**: `public/_redirects` still maps `/drift/2025/self-contained-development-for-ghost-themes/` to `/writing/self-contained-development-for-ghost-themes/`.

- [ ] T010 [US2] Guard test (layer: unit, reading the committed `public/_redirects`) in `tests/unit/site/redirects.test.ts`: import `GHOST_PROBE` (`{ from, to }`) from `scripts/setup-check/checks/live-hosts.ts` and assert, with the file's existing `resolve()` helper, that `GHOST_PROBE.from` with and without the trailing slash answers 301 to `GHOST_PROBE.to` (FR-004, FR-009). This is a guard over behaviour that must not change: `public/_redirects` is not edited, and host-relative targets are already guarded by the existing "built-address target" test, so no assertion is added for that. Test-first still holds: run it and record red (the `GHOST_PROBE` export does not exist yet); T019 creates the export and turns it green without touching `public/_redirects`. Use the imported constant, never the real post address as a literal (docs/testing.md, "Real content in tests").

**Checkpoint**: Ghost mapping guard written and red; it goes green with T019. Live confirmation is T031.

---

## Phase 5: User Story 3 - The setup check confirms the new arrangement (P2)

**Goal**: item 18 "Live hosts" plus the updated items 4, 15 and 16 (FR-009 to FR-013).

**Independent test**: each item run against recorded responses for the correct arrangement, the old arrangement and each half-switched state returns the contracted status and next action.

### Tests (write first, see them fail)

- [ ] T011 [P] [US3] Unit test (layer: unit, injected `http` reader with recorded responses, no network) new `tests/unit/setup-check/checks/live-hosts.test.ts` covering contracts/setup-check.md: all ten probes pass gives `complete`; `www` TLS failure gives `pending`; named `missing` cases (old arrangement, `www` serves but bare serves, bare to a different path, bare drops query, 302, two HTTPS hops, loop, `http://www` not redirected, 200 without the site's canonical, redirect to a foreign host not followed, a 2-hop `http://doncoleman.ca` chain through a wrong middle URL, a certificate failure on the bare domain gives `missing` not `pending`); timeout or network failure gives `could-not-check`; max 3 redirects; one request per hop with no automatic retry; no credentials sent; detail lines carry URL, hop statuses, `Location` and the broken rule. Ghost probe paths come from the module's `GHOST_PROBE` export, not literals. Run and record red.
- [ ] T012 [P] [US3] Unit test (layer: unit) in `tests/unit/setup-check/checks/dns-records-parity.test.ts`: the four `proxied` rows of the contract table; missing placeholder; placeholder with different content; unmatched apex and `www` records stay informational. Run and record red.
- [ ] T013 [P] [US3] Unit test (layer: unit) in `tests/unit/setup-check/checks/web-analytics.test.ts`: the beacon is fetched from `https://www.doncoleman.ca/`, and summaries name `www`. Update any bare-domain expectations. Run and record red.
- [ ] T014 [P] [US3] Unit test (layer: unit) in `tests/unit/setup-check/checks/contact-bindings.test.ts`: widget hostnames including `www.doncoleman.ca` pass with or without `doncoleman.ca`; `doncoleman.ca` only gives a problem that names `www.doncoleman.ca` (assert the rule, not the contract's exact wording; docs/testing.md "Invariants, not mirrors"); preview-host rules unchanged. Run and record red.
- [ ] T015 [P] [US3] Unit test (layer: unit) in `tests/unit/setup/items.test.ts` and `tests/unit/setup-check/report.test.ts`: the registry has 18 items, item 18 is `live-hosts`, order 18, phase `after-merge`, `needsDon`, requirements and principles per data-model.md, and non-empty `purpose`, `where` and `confirmedBy` (the wording comes from contracts/setup-check.md in T020 but is not restated in the test; docs/testing.md "Invariants, not mirrors"); items 1 to 17 keep ids, orders and phases; report and summary counts read 18. Run and record red.

### Implementation

- [ ] T016 [US3] Add `parity` rules for `proxied` in `scripts/setup-check/checks/dns-records-parity.ts` (both directions, contract messages). T012 goes green.
- [ ] T017 [P] [US3] In `scripts/setup-check/checks/web-analytics.ts` read the beacon from `https://<main host>/` where main host is `new URL(FALLBACK_ORIGIN).host`. T013 goes green.
- [ ] T018 [P] [US3] In `scripts/setup-check/checks/contact-bindings.ts` set `PRODUCTION_HOST` from the main host and update the header comment and fix text. T014 goes green.
- [ ] T019 [US3] Create `scripts/setup-check/checks/live-hosts.ts` per contracts/setup-check.md and data-model.md (probe table, exported `GHOST_PROBE`, manual redirect follower with max 3 hops, only `www`/bare hosts followed, 10 s timeout from the existing `http` provider, no retry, result mapping, `fromProviderError` for network failure). T011 and T010 go green.
- [ ] T020 [US3] Register item 18 in `scripts/setup-check/items.ts` (order 18, `after-merge`, texts from the contract) and update the `confirmedBy` and `where` texts of items 4, 15 and 16 to follow the new hosts and the proxied placeholder. T015 goes green.

**Checkpoint**: `pnpm setup:check` knows 18 items; items 4, 15, 16 and 18 are unit-proven.

---

## Phase 6: User Story 4 - Don can do the live swap in one short sitting (P2)

**Goal**: written, ordered swap and rollback steps and the walkthrough step (FR-014 to FR-016).

**Independent test**: the docs-structure test finds the key phrases of the swap and rollback in order, and the docs, registry and skill agree.

### Tests (write first, see them fail)

- [ ] T021 [P] [US4] Unit test (layer: unit) in `tests/unit/setup/docs-structure.test.ts`: `docs/setup.md` has the new part heading `# Main address` after the Contact form part and before Edge protections; `## 18. Live hosts {#live-hosts}` with the five standard headings; `### Live swap` steps 0 to 7 and `### Rollback` partial states "after step 1" to "after step 5" (FR-015b) contain the contract's key phrases in order (Always Use HTTPS, Turnstile `www.doncoleman.ca`, delete `www` rule and `AAAA www`, Custom Domain on `www`, remove bare Custom Domain, `AAAA doncoleman.ca 100::` proxied and the 301 redirect rule with preserved query, `pnpm setup:check`, Search Console sitemap, 24-hour retry and revert PR); the intro counts 18 items; no secret-shaped values appear in examples (FR-009b). Run and record red.
- [ ] T022 [P] [US4] Unit test (layer: unit) in `tests/unit/setup/drift.test.ts` and `tests/unit/setup/docs-dns.test.ts`: every registry item including 18 has a matching docs anchor and the item 4 docs say all records are DNS only except the proxied bare-domain placeholder. Run and record red.
- [ ] T023 [P] [US4] Unit test (layer: unit) in `tests/unit/setup/skill-behaviour.test.ts`: the setup-walkthrough skill has a "Live hosts (item 18)" step that points to `docs/setup.md#live-hosts`, shows dashboard actions for Don to do himself, and runs only `pnpm setup:check --item live-hosts`. Run and record red.

### Implementation

- [ ] T024 [US4] Edit `docs/setup.md`: count 18 items; item 4 notes the proxied placeholder; item 15 says the beacon is read on `www`; item 16 says the widget hostnames include `www.doncoleman.ca`; add `# Main address` and `## 18. Live hosts {#live-hosts}` with `### Live swap` and `### Rollback` exactly as in contracts/live-swap-runbook.md (each swap step states its precondition, done signal and time bound per FR-015a, including the 10-minute stop rule at step 3; the rollback covers each partial state "after step 1" to "after step 5" per FR-015b; state the downtime bounds, 15 and 5 minutes, and the 24-hour deadline with the revert pull request). T021 and T022 go green.
- [ ] T025 [US4] Add the "Live hosts (item 18)" step to `.claude/skills/setup-walkthrough/SKILL.md`. T023 goes green.
- [ ] T026 [P] [US4] Confirm `specs/011-launch` is untouched (FR-016); the supersession lives in this spec. Add nothing there.

**Checkpoint**: runbook and docs consistent with the registry.

---

## Phase 7: Polish and gate

- [ ] T027 Run the local gate tier only: `pnpm exec tsx scripts/changed-paths.ts --base origin/main` (or the repository's documented equivalent) with node from `.nvmrc`; fix lint, type and test failures. Ask Don before a full `pnpm run verify` (see Local toolchain and memory notes); do not run parallel gates.
- [ ] T028 Walk `specs/034-www-main-address/quickstart.md` against the finished work and confirm no visual baseline drift; do not refresh baselines (none expected).
- [ ] T029 PR body: open from `drc-agents`; include expected cost change $0/month (R12), the Turnstile decision (R8, FR-012: the root entry may already cover `www`, but the explicit `www.doncoleman.ca` entry is required anyway), the merge-to-swap window risk, and a separate heading "Post-merge (Don, PREVIEW-CHECK)" listing T030 to T034. Arm auto-merge after the final push.

### Post-merge items (Don; not verifiable by a subagent)

- [ ] T030 [PREVIEW-CHECK] After the merge deploys, do the live swap following `docs/setup.md#live-hosts` in one sitting (steps 0 to 5) on the same day as the merge. If it is not complete 24 hours after the production deploy, roll back as needed and open a revert pull request of this change (FR-015).
- [ ] T031 [PREVIEW-CHECK] Run `pnpm setup:check`; expect 18/18 (item 18 may be `pending` while the `www` certificate issues). Confirms the Ghost address `/drift/2025/self-contained-development-for-ghost-themes/` ends on `www` from both hosts (US2, SC-002, SC-003).
- [ ] T032 [PREVIEW-CHECK] Resubmit `https://www.doncoleman.ca/sitemap-index.xml` in Search Console (swap step 7).
- [ ] T033 [PREVIEW-CHECK] Submit the contact form once on `https://www.doncoleman.ca/contact/` and confirm the email arrives (SC-005).
- [ ] T034 [PREVIEW-CHECK] Confirm only the bare domain and `www` DNS records changed (SC-006).

---

## Dependencies and order

- Phase 1, then Phase 2 (blocks Phase 5 and Phase 6 for the `proxied` field), then US1 and US2 (the US2 guard T010 can be written alongside US1, but goes green only with T019), US3 (needs T003 and T007), US4 (needs T020 for registry text), then Phase 7.
- Within a story: tests, see red, implementation. T020 follows T016 to T019. T024 follows T020.
- T010 (US2 guard) imports from `live-hosts.ts`, so it stays red until T019 in US3; US2 is complete only after T019.
- Parallel: T002 with nothing else in Phase 2; T004/T005 together; T011 to T015 together; T017 and T018 together; T021 to T023 together.

## Implementation strategy

- MVP is US1 (T001 to T009): the origin constant plus its tests, shippable alone.
- Then US2 guard, US3 (setup check) and US4 (runbook) as one PR; all four are needed before the swap is safe to run.
