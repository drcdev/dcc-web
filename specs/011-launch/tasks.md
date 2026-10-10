---
description: "Task list for launching the new doncoleman.ca"
---

# Tasks: Launch the new doncoleman.ca

**Input**: Design documents from `/specs/011-launch/` (spec.md, plan.md, research.md, data-model.md, quickstart.md, contracts/)

**Prerequisites**: plan.md, spec.md. Tests are mandatory (Constitution Principle I): every story has unit/schema, component or build, E2E and accessibility test tasks as the plan's test layers require, ordered before the implementation they cover and seen to fail first.

**Major change** (Constitution Principle III): the PR is labelled, auto-merge stays off, and it waits for Don's approval after he checks the preview.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 readiness checks, US2 guided switch, US3 rollback, US4 live-site confirmation, US5 external links, US6 retirement
- **[PREVIEW-CHECK]**: a subagent cannot verify it locally; it needs the preview deployment or Don's eyes
- **[MANUAL]**: Don acts in a dashboard, account or DNS zone; the agent waits and confirms through `pnpm setup:check`

## Ground rules for every phase

- Toolchain: run `node -v`; if it is not the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the same Bash command as the `pnpm` call. Verify from an agent shell with `ASTRO_PREVIEW_BACKGROUND=1`.
- Nothing in Phases 1 to 10 changes DNS, signs in anywhere, or handles a credential. Setup-check items that read Cloudflare run only against fixture providers in tests.
- Cite the Astro docs page (found through the `astro-docs` MCP) in any task note where an Astro approach is chosen (`site`, `astro:env`, sitemap).
- **Visual baselines: no task.** The slice changes only robots meta, headers, config, docs and tooling. No snapshotted page changes, so any visual diff is a regression to fix, not a baseline to refresh. The macOS and Linux baseline update commands are deliberately omitted.
- Requirements added at checklist resolution are marked "(derived)": FR-003 (Turnstile hostname, privacy policy), FR-003b, FR-010b, FR-011a, FR-015b, FR-016a, FR-017 24-hour limit, FR-022 record count, FR-023 secret scan, FR-025b. Since the analyze pass they are also designed in plan.md ("Requirements added when the checklists were resolved"), contracts/setup-items.md and contracts/launch-walkthrough.md, which are authoritative where wording differs.
- Registry and docs stay in step: whenever a task adds or replaces a registry item (T031, T051, T062), it also adds or renames the matching `docs/setup.md` section stub (heading and anchor only), updates the intro's item count, and updates the fixed count and id list in `tests/unit/setup/docs-structure.test.ts` (and the review-address-noindex content test when item 17 is renamed), so `drift.test.ts` and `docs-structure.test.ts` stay green at T013, T053 and T063; T065 and T068 then write the full Launch-part assertions and sections.

## Phase 1: Setup and alignment (3 tasks)

- [X] T001 Confirm the toolchain and a clean start: run `node -v` against `.nvmrc`, `git status`, and merge the latest `main` into `011-launch` if it moved. Check sibling worktrees and open PRs for edits to the shared hot files `docs/setup.md`, `scripts/setup-check/items.ts` and `.github/workflows/ci.yml`; note any overlap in the PR body (Constitution XI).
- [X] T002 [P] Write a failing test in `tests/unit/setup/items.test.ts` that `package.json` has a `site:check` script (`node scripts/site-check/cli.ts`), then add the script to `package.json`. No new dependency.
- [X] T003 [P] Read the Astro docs through `astro-docs` for `site`, `astro:env` and `@astrojs/sitemap`, and make sure `specs/011-launch/research.md` R6 and R12 name the cited pages.

## Phase 2: Foundation, setup-check plumbing (10 tasks)

**Purpose**: shared types and readers every later item uses (FR-008: built before the walkthrough). Blocks Phases 4 to 9.

- [X] T004 [P] Write failing tests in `tests/unit/setup-check/report.test.ts` and `tests/unit/setup/schemas.test.ts` for the `waiting` status: counted in `counts.waiting`, printed as the word `waiting`, `ok` stays true with only waiting items, `nextAction` required for `waiting`, summary line gains `<w> waiting for the switch`.
- [X] T005 [P] Write failing tests in `tests/unit/setup-check/providers/dns.test.ts` for `resolveEach(name, type)` returning separate 1.1.1.1 and 8.8.8.8 answers, and in `tests/unit/setup-check/providers/http.test.ts` for `{ redirect: "manual" }` returning the raw `Location` header and a TLS failure surfacing with `kind: "tls"`.
- [X] T006 [P] Write failing tests in `tests/unit/setup-check/checks/launch-phase.test.ts` for `detectLaunchPhase(ctx)`: `switched` only when the Cloudflare Workers domain list holds `{ hostname: zone, service: workerName }`, `before-switch` otherwise, `ProviderAccessError` when the token, account id or read fails (never a guess). Add fixtures under `tests/fixtures/providers/cloudflare/`.
- [X] T007 [P] Write failing tests in `tests/unit/setup/schemas.test.ts` for the optional `launch` object in `setup/config.json` (`expectedPages` ids match `^[a-z0-9-]+$`, `expectedPaths` match `^/([a-z0-9-]+/)*$`, non-empty arrays), and in `tests/unit/setup/dns-baseline-schema.test.ts` that Ghost web records and mail records are derivable by name and type.
- [X] T008 [P] Write a failing redaction test in `tests/unit/setup-check/redact.test.ts` with a shared helper `expectRedacted(result)`, proving that `detectLaunchPhase`'s `ProviderAccessError` messages and the `waiting` report output never contain a token, account id, zone id, environment value or message content (FR-026). Every launch item's own test file (T025, T026, T044 to T048, T054 to T058) adds an `expectRedacted` case, so no test here waits on a later phase.
- [X] T009 Add `waiting` to `CheckStatus` and `CheckReportCounts`, the optional `postLaunch` field on `SetupItem`, `ProviderAccessError.kind`, `DnsReader.resolveEach` and the `HttpReader` redirect option in `scripts/setup-check/types.ts`; update `scripts/setup-check/report.ts`, `schemas.ts` and `cli.ts` so T004 and T007 pass.
- [X] T010 [P] Implement `resolveEach` in `scripts/setup-check/providers/dns.ts` and manual redirect plus TLS error classification in `scripts/setup-check/providers/http.ts` so T005 passes.
- [X] T011 Implement `detectLaunchPhase` in `scripts/setup-check/checks/launch-phase.ts` using the existing Cloudflare provider's read-only domain list so T006 passes. The read stays read-only and prints no token (FR-026).
- [X] T012 Write the failing build-level test `tests/build/launch-paths.test.ts` (every id in `launch.expectedPages` is a file in `src/content/pages/`; every `launch.expectedPaths` entry appears in the production sitemap), then add `launch.expectedPages` and `launch.expectedPaths` from data-model.md to `setup/config.json`, keeping `reviewHost`, so it and T007 pass.
- [X] T013 Run `pnpm exec vitest run tests/unit/setup-check tests/unit/setup` and fix any regression from the type changes (the registry still has 25 items here).

**Checkpoint**: plumbing is green; item work can start.

## Phase 3: US1 Readiness, sitemap and link crawler with CI step (11 tasks)

**Goal**: a dependency-free crawler fails on a missing sitemap page or broken internal link, runs locally in the gate and in CI against the real preview, and fails closed (FR-001, FR-001a, FR-002, FR-002a; SC-001).

**Independent test**: a deliberately broken internal link makes the crawl fail naming the target and the linking page.

- [X] T014 [P] [US1] Write failing unit tests in `tests/unit/site-check/crawl.test.ts` with fixtures in `tests/fixtures/site-check/` (sitemap index and child sitemaps, page HTML, one page linking to a missing page): `parseSitemap`, `extractLinks` (anchors only; fragment dropped; mailto, tel, javascript and other origins ignored), origin mapping, a sitemap entry that redirects is a `page` failure, up to 5 same-site redirect hops, 5xx retry once, `expectOrigin` and `expectNoindex` failures, and `formatFailures` naming kind, address, problem and every linking page.
- [X] T015 [P] [US1] Write failing unit tests in `tests/unit/site-check/cli.test.ts` for flags (`--base`, `--expect-origin`, `--expect-noindex`, `--no-links`, `--json`), the heading line, exit codes 0, 1 and 2, and that no environment value is printed.
- [X] T016 [P] [US1] Write failing unit tests in `tests/unit/site-check/preview.test.ts` for `waitForPreview(deps)` and `previewOrigin(env, config)`: success continues, any other conclusion fails with the contract message, no check run within 20 minutes fails closed with the contract message and rerun advice, a failed or unreachable preview never passes, no derivable alias fails plainly (FR-001a).
- [X] T017 [P] [US1] Write a failing test in `tests/unit/ci/workflows.test.ts` that `ci.yml` job `verify` has `checks: read` plus `contents: read`, and that step `Check the preview's sitemap and links` runs only on `pull_request`, uses only `GITHUB_TOKEN`, and exposes no other secret to PR code, including fork PRs (FR-002a).
- [X] T018 [P] [US1] Write the failing E2E spec `tests/e2e/site-links.spec.ts` (Playwright `e2e` project, `maxRedirects: 0` fetcher on `http://127.0.0.1:4321`) expecting `failures` equal to `[]`. No new template is added, so the existing axe checks in `tests/e2e/a11y.spec.ts` stay unchanged and must still pass.
- [X] T019 [US1] Implement `crawl`, `parseSitemap`, `extractLinks` and `formatFailures` in `scripts/site-check/crawl.ts` (pure, injected fetcher, concurrency 4) so T014 passes.
- [X] T020 [US1] Implement `scripts/site-check/cli.ts` so T015 passes.
- [X] T021 [US1] Implement `waitForPreview` and `previewOrigin` in `scripts/site-check/preview.ts` (poll every 20 seconds for up to 20 minutes; crawl with `expectNoindex: true`; `::error` annotations and a `$GITHUB_STEP_SUMMARY` table) so T016 passes.
- [X] T022 [US1] Add the preview-crawl step and `checks: read` permission to the `verify` job in `.github/workflows/ci.yml` as written in contracts/site-check.md so T017 passes. This is a CI change under Principle III.
- [X] T023 [US1] Build, then run the E2E spec so T018 passes, and confirm that adding a link to `/does-not-exist/` fails it naming the target and the linking page (quickstart scenario 1). Revert the link. The spec runs inside the existing `test:e2e`, so `verify` needs no new script.
- [ ] T024 [US1] [PREVIEW-CHECK] After the first push, confirm in the PR's `verify` run that the crawl step waited for `Workers Builds: dcc-web-preview`, passed with the `Preview site check passed` summary, and proved `--expect-noindex` on the real `workers.dev` host (local `wrangler dev` cannot exercise the host-scoped `_headers` rule).

**Checkpoint**: a broken link blocks the merge (US1 scenarios 1 and 2).

## Phase 4: US1 Readiness, launch content and main-check items (8 tasks)

**Goal**: automatic readiness items 26 and 27 plus the FR-003 readiness rows (FR-003, FR-003a, FR-004).

- [X] T025 [P] [US1] Write failing tests in `tests/unit/setup-check/checks/launch-content-ready.test.ts` with repo-reader fixtures for the four rules in contracts/setup-items.md: complete; missing for a draft expected page; missing for `placeholder copy` in any letter case in a non-draft page; missing for a project with `placeholder: true`; missing when `src/content/pages/privacy-policy.mdx` does not state Cloudflare D1 storage or names any of Ghost, Supabase, Mailgun or Fly.io (FR-003); missing naming the config field when `launch.expectedPages` is absent; one detail line per problem with the exact `nextAction`.
- [X] T026 [P] [US1] Write failing tests in `tests/unit/setup-check/checks/launch-main-checks.test.ts` with GitHub fixtures in `tests/fixtures/providers/github/`: complete, pending while in progress, missing with the run URL for any other conclusion, could-not-check when there is no run or the read failed.
- [X] T027 [P] [US1] Write a test (derived, FR-003) in `tests/unit/setup-check/checks/contact-turnstile-widget.test.ts` pinning that the existing Turnstile item stays missing when the widget's hostnames lack `doncoleman.ca`, so readiness can cite `contact-turnstile-widget` for "spam protection accepts the bare domain".
- [X] T028 [US1] Implement `scripts/setup-check/checks/launch-content-ready.ts` (item 26, repository files only through `RepoReader`) so T025 passes.
- [X] T029 [US1] Implement `scripts/setup-check/checks/launch-main-checks.ts` (item 27) so T026 passes.
- [X] T030 [US1] Confirm T027 passes against the existing `scripts/setup-check/checks/contact-turnstile-widget.ts`; change it only if a hostname gap exists.
- [X] T031 [US1] Register items 26 (`before-merge`, `needsDon: yes`) and 27 (`after-merge`) in `scripts/setup-check/items.ts`, add their `docs/setup.md` section stubs, and update `tests/unit/setup/items.test.ts`.
- [X] T032 [US1] Re-run `tests/build/launch-paths.test.ts` (written in T012) and the new item tests together, and confirm item 26 reports missing for Services, Speaking and Focus Pocus on today's content.

**Checkpoint**: item 26 (failing until Don replaces placeholders) and 27 report plainly.

## Phase 5: US4 Site origin, indexing and old Ghost addresses (11 tasks)

**Goal**: the production build serves `https://doncoleman.ca` and is indexable, previews are not, and old Ghost paths 404 (FR-010a, FR-010d, FR-018, FR-019, FR-027).

- [X] T033 [P] [US4] Write failing tests in `tests/unit/site/site-origin.test.ts` and `tests/unit/site/astro-config.test.ts`: a main Workers Builds env gives `https://doncoleman.ca`; other branches give the alias origin; local, CI and invalid config give the fallback.
- [X] T034 [P] [US4] Write failing tests in `tests/unit/site/build-env.test.ts` for `isIndexableBuild(env)` (true only for `WORKERS_CI === "1"` and branch `main`; fails toward noindex).
- [X] T035 [P] [US4] Write failing component tests in `tests/component/Seo.test.ts`: the default `noindex` follows the build decision, and an explicit `noindex: true` wins (draft pages, not-found page).
- [X] T036 [P] [US4] Write failing build tests in `tests/build/indexing.test.ts` (using `tests/build/run-astro.ts`): a main env gives no robots meta on public pages and `https://doncoleman.ca` in canonical, `og:url`, `sitemap-index.xml`, `robots.txt` and the writing feed; a branch env gives the alias origin and noindex; `robots.txt` never disallows.
- [X] T037 [P] [US4] Write failing tests in `tests/unit/site/headers.test.ts` for `public/_headers`: no `/*` noindex, both host rules (`https://:worker.:subdomain.workers.dev/*`, `https://new.doncoleman.ca/*`), security headers and the one-year HSTS unchanged (FR-010d).
- [X] T038 [P] [US4] Extend `tests/e2e/headers.spec.ts` (no `X-Robots-Tag` on a non-preview host, security headers unchanged), `tests/e2e/seo.spec.ts` (noindex expectations follow the build decision) and `tests/e2e/not-found.spec.ts` (`/tag/x/`, `/author/x/`, `/rss/`, `/ghost/` and an old post path return 404 with the not-found page and no `Location` header; the page says the page does not exist, says older blog addresses were not carried over, links home, and has one main heading in the main region, FR-027a).
- [X] T039 [US4] Change `resolveSiteOrigin` in `src/lib/site-origin.ts` so main builds give `https://doncoleman.ca` and stop reading `reviewHost`; update the Astro config if needed so T033 passes.
- [X] T040 [US4] Add `isIndexableBuild` to `src/lib/build-mode.ts`, drop the `indexable: false` constant from `src/config/site.ts`, and default `noindex` in `src/components/Seo.astro` from `astro:env/server` so T034 to T036 pass.
- [X] T041 [US4] Rewrite `public/_headers` per contracts/indexing-and-origin.md so T037 passes. Edit the 404 page copy only if T038 shows the wording is missing, with no change to titles, landmarks or other markup.
- [X] T042 [US4] Run the new tests, the existing axe checks in `tests/e2e/a11y.spec.ts` (WCAG 2.2 A and AA, zero violations, including the not-found page) and the visual project in compare mode; any visual diff is a regression to fix.
- [ ] T043 [US4] [PREVIEW-CHECK] Don checks the preview: pages send `X-Robots-Tag: noindex` and carry noindex meta, canonical links name the preview's own address, and an old Ghost path such as `/rss/` shows the plain not-found page.

**Checkpoint**: origin and indexing rules are correct on `main` after merge.

## Phase 6: US4 Changed setup items 4, 6, 16, 17, 18 (10 tasks)

**Goal**: existing items understand the switch (FR-010, FR-010b, FR-012, FR-019a, FR-017).

- [X] T044 [P] [US4] Update `tests/unit/setup-check/checks/dns-records-parity.test.ts`: when `switched`, Ghost web records add `replaced at launch, kept in the baseline for rollback` details and Cloudflare-added records (`AAAA www 100::`) stay informational; whole-zone comparison permits only the apex and `www` replacements (FR-010); `could-not-check` when the phase cannot be read.
- [X] T045 [P] [US4] Update `tests/unit/setup-check/checks/live-domain-ghost.test.ts` to the contract table: switched is complete; before-switch matches the Ghost baseline for apex and `www` (A/AAAA/CNAME only; mail comparison removed); any difference is `missing` with `Problem:` and the rollback `nextAction`; a deliberate switch is recognised only from the Cloudflare domain list, never DNS answers; after a rollback it confirms Ghost again. Add (derived, FR-010b) cases where only the apex or only `www` has switched, reporting each half separately.
- [X] T046 [P] [US4] Replace `review-address.test.ts` with `tests/unit/setup-check/checks/review-address-removed.test.ts`: waiting before the switch, missing while a Custom Domain for `reviewHost` exists, pending while resolvers still answer, complete when both are empty.
- [X] T047 [P] [US4] Replace `review-address-noindex.test.ts` with `tests/unit/setup-check/checks/preview-noindex.test.ts`: both Workers' `workers.dev` hosts on `/` and `/projects/` must send `noindex`; details list each failing host and path; independent of the phase.
- [X] T048 [P] [US4] Update `tests/unit/setup-check/checks/web-analytics.test.ts`: apex when switched, `reviewHost` before, `dependsOn: []`.
- [X] T049 [US4] Update `scripts/setup-check/checks/dns-records-parity.ts` and `live-domain-ghost.ts` so T044 and T045 pass, including the per-half report.
- [X] T050 [US4] Create `scripts/setup-check/checks/review-address-removed.ts` and `preview-noindex.ts`; delete `review-address.ts`, `review-address-noindex.ts` and their old tests, so T046 and T047 pass. Update `web-analytics.ts` so T048 passes.
- [X] T051 [US4] Update `scripts/setup-check/items.ts`: replace items 16 and 17 by the new ids (`postLaunch: true`, `dependsOn: ["dns-nameservers"]` on 16), adjust item 18, rename the two `docs/setup.md` section anchors to the new ids, and fix the registry-order tests in `tests/unit/setup/items.test.ts`.
- [X] T052 [US4] Ghost-record TTL (FR-009): the committed baseline is the source of truth (TTL 14400 for both Ghost web records, shown as "4 hr" in Cloudflare). contracts/launch-walkthrough.md L8, R2 and R3 already name it (fixed in the analyze pass). Confirm `setup/dns-baseline.json` still says 14400, and make sure T064's L8 table test compares TTL as well as type, name, content and proxy setting. If Don's dashboard shows otherwise at L8 (Phase 11), the baseline is corrected first.
- [X] T053 [US4] Run `pnpm exec vitest run tests/unit/setup-check tests/unit/setup` green.

## Phase 7: US4 New post-launch items 28 to 32 (10 tasks)

**Goal**: the live domain is proven, with `waiting`, `pending` and `Problem:` as words (FR-013 to FR-017).

- [X] T054 [P] [US4] Write failing tests `tests/unit/setup-check/checks/live-apex.test.ts` using fixtures in `tests/fixtures/providers/http|dns/`: waiting before the switch, pending while DNS settles, pending on a TLS error, could-not-check on other network failure, `Problem:` for wrong status, wrong canonical, `noindex` header or meta, or Ghost marker, `http://` must 301 or 308 to `https://doncoleman.ca/`, complete otherwise. Add (derived, FR-017) a case that every `pending` result's `nextAction` ends with the 24-hour sentence from contracts/setup-items.md; T055 to T058 assert the same for their pending cases.
- [X] T055 [P] [US4] Write failing tests `tests/unit/setup-check/checks/live-www-redirect.test.ts`: pending while a resolver returns the Ghost CNAME or on a TLS error, complete only for a single 301 with `Location` exactly `https://doncoleman.ca/about/?launch-check=1`, `Problem:` otherwise naming the status and `Location` found; includes the `http://www` path.
- [X] T056 [P] [US4] Write failing tests `tests/unit/setup-check/checks/live-sitemap.test.ts`: crawler with `checkLinks: false` and `expectOrigin` the apex, `robots.txt` names `https://doncoleman.ca/sitemap-index.xml`, every `launch.expectedPaths` entry present, one detail per failure, pending while DNS settles.
- [X] T057 [P] [US4] Write failing tests `tests/unit/setup-check/checks/live-contact-endpoint.test.ts`: complete only for 405, `Allow: POST` and JSON `{ ok: false, error: "method_not_allowed" }`; sends only GET, once per run, never a POST; TLS error is pending; anything else `Problem:` naming the status.
- [X] T058 [P] [US4] Write failing tests `tests/unit/setup-check/checks/mail-records.test.ts`: groups compared per resolver by MX `priority:host`, joined and normalised TXT, lower-case CNAME without a trailing dot; order and TTL ignored; complete, pending when resolvers disagree and one matches, `Problem:` otherwise with the rollback `nextAction`; dropped baseline records that still answer are information only; still passes after the Mailgun records move to `drop`.
- [X] T059 [US4] Implement `live-apex.ts` and `live-www-redirect.ts` in `scripts/setup-check/checks/` so T054 and T055 pass.
- [X] T060 [US4] Implement `live-sitemap.ts` (reusing `scripts/site-check/crawl.ts`) and `live-contact-endpoint.ts` in `scripts/setup-check/checks/` so T056 and T057 pass.
- [X] T061 [US4] Implement `scripts/setup-check/checks/mail-records.ts` so T058 passes.
- [X] T062 [US4] Register items 28 to 32 in `scripts/setup-check/items.ts` (28 to 31 `postLaunch: true`) for a 32-item registry, add their `docs/setup.md` section stubs, and update the registry tests. With `.env` present (never print it), `pnpm setup:check` stays under about 60 seconds and shows items 16 and 28 to 31 as `waiting`, items 6 and 32 complete and item 26 missing (quickstart scenario 5).
- [X] T063 [US4] Run `pnpm exec vitest run tests/unit/setup-check tests/unit/setup tests/unit/site-check`, `pnpm run lint` and the type check, all green.

**Checkpoint**: the setup check reports every launch state; `docs/launch.md` may now rely on it (FR-008).

## Phase 8: US2, US3, US5 Setup docs, skill and walkthrough Parts A to E (11 tasks)

**Goal**: `docs/launch.md` Parts A to E and the supporting setup docs (FR-003 to FR-006, FR-009 to FR-012, FR-011a, FR-019a, FR-020; US2, US3, US5).

- [X] T064 [P] [US2] Write failing tests in `tests/unit/setup/launch-doc.test.ts`: parts A to F in order; step ids L1 to L18, R1 to R5, T1 to T9 in order with anchors; each step has **What to do**, **Where**, **How to confirm** in order and a stated outcome when confirmation fails (FR-005); every Pause step contains `**Pause:**`; the L8 table equals the Ghost web records in `setup/dns-baseline.json` (type, name, content, DNS only, TTL 14400) and R2 and R3 name the same TTL; every derived assertion listed under "Tests that pin this contract" in contracts/launch-walkthrough.md; L15 directly after L14; Part E names every record from L8 and says rollback is impossible once Ghost is cancelled; no "paste" next to "chat" except in a "never" sentence; every `pnpm setup:check --item <id>` named is a registry id; L7 gate lists L1 to L6.
- [X] T065 [P] [US2] Extend `tests/unit/setup/docs-structure.test.ts` and `docs-dns.test.ts`: `docs/setup.md` has 32 item sections, a Launch part heading before section 26, items 6, 16, 17, 18 rewritten, an intro linking `docs/launch.md`, and no leftover wording for the retired review items.
- [X] T066 [P] [US2] Extend `tests/unit/setup/skill-behaviour.test.ts` for `.claude/skills/setup-walkthrough/SKILL.md`: `waiting` is treated like a completed step (one line, no pause); at item 26 it hands over to `docs/launch.md`; the three-answer pause (`Done — check it`, `Skip for now`, `Stop here`); the agent never signs in, changes DNS or handles credentials.
- [X] T067 [P] [US2] Extend `tests/unit/setup/drift.test.ts` so the registry, `docs/setup.md`, `docs/launch.md` and the contracts agree on item ids and counts, using no `specs/` path literals.
- [X] T068 [US2] Rewrite items 6, 16, 17, 18 and add the Launch part with items 26 to 32 in `docs/setup.md`, with an intro link to `docs/launch.md`, so T065 passes.
- [X] T069 [US2] Write the `docs/launch.md` intro and Part A (L1 to L7). The intro states the order of parts, that the switch happens only after this PR merges, the 2-week window, and the agent/Don boundary (FR-006, FR-007). Add (derived, FR-003, FR-003b) rows for the Turnstile hostname (`--item contact-turnstile-widget`), the privacy policy and placeholders (`--item launch-content-ready`), the production origin (L4 with `--expect-origin https://doncoleman.ca`), and accessibility plus performance through `--item launch-main-checks`. L5 and L14 test messages begin "Launch test", and Don deletes them once confirmed (FR-015b, derived). L7 is the readiness gate.
- [X] T070 [US2] Write Part B (L8 to L10): the Ghost records table equal to the baseline (TTL per T052), Don saves a whole-zone export on his own machine, reads Part E first, turns on Always Use HTTPS. Add (derived, FR-016a) the mail test (Don sends a message to and from his domain address) inside L9's text, not as a new step id, so the ids stay L8 to L10.
- [X] T071 [US2] Write Part C (L11 to L13): bare domain first, then `www`, in one sitting; replacement records have a cache lifetime of 5 minutes or less (FR-010c; say how Cloudflare shows it); if one half cannot be confirmed Don completes it in the same sitting or follows rollback for both, leaving no half-switched state (FR-010b, derived); note the switch date and Ghost's next renewal date (FR-021).
- [X] T072 [US4] Write Part D (L14 to L18): post-launch checks 28 to 32, mail test after the switch (FR-016a), the 24-hour pending limit and the FR-011a rollback triggers (unfixable `Problem:`, any mail record differing, still pending after 24 hours, Don judges the site unusable; Don decides), L15 external links directly after L14 (US5, FR-020), L16 removes `new.doncoleman.ca` (custom domain and DNS record) and confirms it no longer resolves, L17 optional Search Console, L18 switch date.
- [X] T073 [US3] Write Part E (R1 to R5): detach the Custom Domain, restore the apex A record, delete `AAAA www 100::` and recreate the `www` CNAME, turn off the Redirect Rule, confirm Ghost is back; usable until Ghost is cancelled, independent of the review address, with a note that no indexing step is needed after rollback.
- [X] T074 [US2] Update `.claude/skills/setup-walkthrough/SKILL.md` for `waiting`, the hand-over to `docs/launch.md` at item 26 and the readiness gate so T066 passes. Leave `/deliver`, `/tweak` and `/squash` untouched.

## Phase 9: US6 Walkthrough Part F retirement (7 tasks)

**Goal**: documented retirement with every irreversible step labelled (FR-021 to FR-025c; SC-006, SC-008).

- [X] T075 [P] [US6] Extend `tests/unit/setup/launch-doc.test.ts` for Part F: T2 exports come before T3 cancellation; T1 and the Part E intro state rollback ends at cancellation and that Ghost content and members cannot be recovered afterwards; Ghost cancellation, Supabase deletion and Mailgun deletion are labelled irreversible with their evidence list, and the Flux archive is labelled reversible (FR-025); Supabase order is show tables, fields and record count, export, confirm the export opens and its count matches (FR-022, derived), confirm identity by project name and the project reference that matches the Flux repository's Supabase config, then delete; the Mailgun step lists all five records including the tracking CNAME and says the iCloud records stay; the Ghost export check uses `ls -l` and never opens the members file; exports are deleted within 12 months and personal-data requests are answered within 30 days (FR-021a).
- [X] T076 [P] [US6] Extend the same test for derived requirements: a secret and personal-data scan of `drcdev/flux` before archiving (FR-023); revocation of retired services' keys (Mailgun sending domain and keys, Ghost integration keys) and removal of leftover secrets from GitHub, Cloudflare and local untracked files (FR-025b); confirmation that nothing but Ghost's newsletter sends through Mailgun before deletion; a final check that no DNS record points at Ghost, Mailgun or the review address (FR-025a, SC-008); exports stay outside the repository and are never committed (FR-007).
- [X] T077 [US6] Write Part F (T1 to T9) per the contract with the T075 and T076 content. Keep ids T1 to T9, placing the scan, key revocation and Mailgun-sender confirmation inside the existing steps' What/Where/How text rather than renumbering.
- [X] T078 [US6] In T4's text require the baseline update (`drop` with dated reasons for the five Mailgun records and the Ghost web records) in the follow-up PR straight after deletion, and say retirement is not complete until `--item mail-records` passes against the updated baseline (FR-024).
- [X] T079 [US6] In T9's text describe the small follow-up PR (FR-025c): `docs/design-source.md` says Flux is archived but still cloneable with the same command; baseline drops; the `new.doncoleman.ca` `_headers` rule removed; optional move of the apex Custom Domain into `wrangler.jsonc`. Do not edit `docs/design-source.md`, the baseline or `_headers` for this in the current PR.
- [X] T080 [US6] Run `pnpm exec vitest run tests/unit/setup` fully green.
- [X] T081 [US6] Read `docs/launch.md` once end to end against FR-005 to FR-007: plain language, no step asking for a pasted secret, every Don step marked as a pause.

## Phase 10: Verify and PR readiness (7 tasks)

- [X] T082 Run the full gate from an agent shell with `ASTRO_PREVIEW_BACKGROUND=1 pnpm run verify` (see the verify-from-agent-shell notes; read the `VERIFY_EXIT=` line; port 4321 collisions with sibling worktrees mean wait and rerun; if only load-bound, push and let CI verify with Don's agreement).
- [X] T083 Confirm accessibility and performance gates pass unchanged (`tests/e2e/a11y.spec.ts`, `tests/e2e/budget.spec.ts`) and the visual project shows no diff. Do not refresh baselines.
- [X] T084 Run quickstart scenarios 1 to 6 (those needing no live domain) and note the results.
- [X] T085 Confirm no new dependency in `package.json` or the lockfile, no secret or `.env` content in any committed file, and no `specs/` path literal in tests (drift guard).
- [X] T086 Prepare the PR body (opened from `drc-agents`): major change under Principle III, label applied, auto-merge off; the post-merge switch runs separately from `docs/launch.md` (Phases 11 and 12); the open `[PREVIEW-CHECK]` items; expected monthly cost $0 with running costs going down.
- [ ] T087 [PREVIEW-CHECK] Don checks the preview deployment (robots, canonical, 404 page, crawl step green) and approves the PR.
- [ ] T088 [PREVIEW-CHECK] Confirm the first preview run shows `X-Robots-Tag: noindex` on the `workers.dev` host through the crawl step, proving the `_headers` host match that local `wrangler dev` cannot exercise.

## Phase 11: Post-merge switch (run with Don from docs/launch.md)

**The implement phase skips this phase.** It runs after the PR merges, driven by the orchestrator with Don through `/setup-walkthrough` and `docs/launch.md`. Each task is Don's action. The agent waits and confirms through `pnpm setup:check`, never signs in, changes DNS, creates accounts or handles credentials, and Don never pastes a secret into the chat. Pull `main` first.

- [ ] T089 [MANUAL] [US1] L2: Don replaces the Services and Speaking placeholder copy and the Focus Pocus placeholders in his own words and publishes the pages (`draft: false`). The content lands on `main` through a normal small PR before the switch. Confirmed by `pnpm setup:check --item launch-content-ready`.
- [ ] T090 [MANUAL] [US1] L3 and L5: Don confirms every Ghost post is on the new site, sends a "Launch test" message from `https://new.doncoleman.ca/contact/`, confirms it arrived, then deletes it. The agent runs `pnpm run site:check -- --base https://new.doncoleman.ca --expect-origin https://doncoleman.ca` (L4) and `--item launch-main-checks` (L6), then presents the L7 gate; no switch step is shown until every readiness row is confirmed.
- [ ] T091 [MANUAL] [US2] L8 to L10: Don checks the recorded Ghost records and TTL against Cloudflare, saves a whole-zone export on his own machine, reads Part E, sends a mail test to and from his domain address, and turns on Always Use HTTPS. Confirmed by `--item dns-records-parity`, `--item live-domain-ghost` and `--item mail-records`.
- [x] T092 [MANUAL] [US2] L11: Don deletes the apex A record, adds Custom Domain `doncoleman.ca` on `dcc-web`, and notes the switch date and Ghost's next renewal date. Confirmed by `--item live-domain-ghost` ("Switched...") and `--item live-apex` (pending or complete).
- [x] T093 [MANUAL] [US2] L12: in the same sitting as T092, Don deletes the `www` CNAME, adds `AAAA www 100::` (proxied) and the 301 Redirect Rule. Confirmed by `--item live-www-redirect`. If one half fails, finish it or roll back both (T098).
- [x] T094 [MANUAL] [US4] L13 and L14: wait for DNS and certificates and re-run `pnpm setup:check` until items 28 to 32 are complete; Don sends a "Launch test" message from `https://doncoleman.ca/contact/`, confirms it arrived, deletes it, and confirms mail still works. A `Problem:`, or a state still pending after 24 hours, points to rollback. SC-002, SC-003 and SC-007 are proved here.
- [x] T095 [MANUAL] [US5] L15: Don updates external links that point to old blog addresses (LinkedIn posts, profiles, other sites he controls) and opens each to confirm it lands on a page.
- [x] T096 [MANUAL] [US2] L16: Don removes `new.doncoleman.ca` (custom domain and DNS record). Confirmed by `--item review-address-removed` and `dig +short new.doncoleman.ca` returning nothing.
- [x] T097 [MANUAL] [US4] L17 and L18: optional Search Console sitemap; record the switch date; run the full `pnpm setup:check` and confirm items 6, 16, 17, 18 and 26 to 32 are complete.
- [ ] T098 [MANUAL] [US3] Rollback, only if needed: Part E R1 to R5. Confirmed by `--item live-domain-ghost`, `--item dns-records-parity` and `--item mail-records`.

## Phase 12: Post-merge retirement (two or more weeks after the switch, run with Don from docs/launch.md)

**Also skipped by the implement phase.** Not before 2 weeks after the switch date, and before Ghost's next renewal if possible. It ends with the small follow-up PR (FR-025c) that the agent prepares.

- [x] T099 [MANUAL] [US6] T1 and T2: Don confirms he is satisfied (rollback ends at cancellation), then exports Ghost content (JSON) and members (CSV) outside the repository. The agent runs `ls -l` on the two paths he names and confirms both exist and are not empty, never opening the members file. (T2 export waived by Don, 2026-10-09)
- [x] T100 [MANUAL] [US6] Irreversible. T3: Don cancels the Ghost subscription after the evidence in T099, then revokes Ghost integration keys and removes leftover Ghost secrets (FR-025b).
- [x] T101 [MANUAL] [US6] Irreversible. T4: Don confirms nothing but Ghost's newsletter sends through Mailgun, deletes the five Mailgun records (two MX, SPF TXT, DKIM TXT, tracking CNAME `email.mail.doncoleman.ca`), then deletes the Mailgun sending domain and keys. The iCloud records stay. Don sends a mail test to and from the domain (FR-016a).
- [x] T102 [MANUAL] [US6] Irreversible. T5 to T7: Don views the Supabase tables, fields and record count, exports the submissions he wants, confirms the file opens and its count matches, confirms the project name and the project reference matching the Flux repo's Supabase config, then deletes the Flux project. (no export needed; the Flux Supabase project was already gone, 2026-10-09)
- [x] T103 [MANUAL] [US6] T8: scan `drcdev/flux` for committed secrets and personal data, revoke any secret found, then archive the repository (reversible). Confirmed by `gh repo view drcdev/flux --json isArchived`. (Done 2026-10-09: working-tree scan clean; by Don's decision Flux stays in place unarchived.)
- [x] T104 [US6] T9: the agent prepares the follow-up PR (FR-025c, from `drc-agents`): baseline `drop` entries with dated reasons for the five Mailgun records and the Ghost web records, `docs/design-source.md` updated, the `new.doncoleman.ca` `_headers` rule removed, optionally the apex Custom Domain in `wrangler.jsonc`. Don approves. Retirement is complete only when `--item mail-records` passes against the updated baseline and no DNS record points at Ghost, Mailgun or the review address (FR-025a, SC-008). (Ghost web records dropped here; Mailgun records dropped earlier; Custom Domain not moved)

## Dependencies and execution order

- Phase 1, then Phase 2 (blocks everything else).
- Phase 3 needs only Phase 1; item 30 in Phase 7 needs Phase 3.
- Phase 4 needs Phase 2. Phase 5 is independent of Phases 3, 4 and 6.
- Phase 6 needs Phases 2 and 5. Phase 7 needs Phases 2, 3 and 6 (registry order).
- Phase 8 needs Phases 4, 6 and 7 (FR-008: items before the walkthrough). Phase 9 needs Phase 8.
- Phase 10 needs Phases 1 to 9. Phases 11 and 12 run only after the merge.

## Parallel opportunities

- Within each group of tests, every `[P]` task touches a different file.
- Phases 3 and 5 may run in separate worktrees only if they avoid the shared hot files (`items.ts`, `ci.yml`, `docs/setup.md`); otherwise run in order.

## Implementation strategy

Deliver the PR in phase order. The MVP is Phases 1 to 5: the crawl gate and the correct origin and indexing rules. Phases 6 to 9 complete the setup check and the walkthrough. After the merge, run Phase 11 with Don, and Phase 12 two or more weeks later.
