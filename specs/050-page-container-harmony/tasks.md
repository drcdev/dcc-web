---

description: "Task list for feature 050 page container harmony"
---

# Tasks: Standalone pages use the same content card in light and dark mode

**Input**: Design documents from `/specs/050-page-container-harmony/`

**Prerequisites**: plan.md, spec.md, research.md (R6 test placement, R7 baselines), data-model.md, contracts/content-card.md, quickstart.md

**Tests**: Mandatory (Constitution Principle I). Every test task names its one primary layer (cheapest layer that can observe the behaviour, `docs/testing.md` "Where a test goes") and the reason for any second layer. Tests are written first and seen to fail before the implementation they cover.

**Organization**: By user story. The card is one small component, so the stories share Phase 2 (the component) and differ in the caller and the measurement.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (same card both themes, P1), US2 (responsive padding, P2), US3 (not-found page, P2)
- Toolchain: follow the Local toolchain section of `CLAUDE.md` for every pnpm, astro, playwright and wrangler call (`node -v` against `.nvmrc`; `source ~/.nvm/nvm.sh && nvm use` in the same command; `perl -e 'alarm N; exec @ARGV'` for long runs). Ask Don before the full `pnpm run verify`; the local gate is the tier from `node scripts/ci/changed-paths.ts --base origin/main`.

## Phase 1: Setup

**Purpose**: Confirm the starting point

- [ ] T001 Check `node -v` against `.nvmrc`, then run `pnpm exec vitest run tests/component/PageLayout.test.ts tests/component/NotFound.test.ts` and `pnpm exec playwright test tests/e2e/theme-tokens.spec.ts --project=e2e` to record a green baseline before any change; read `.claude/skills/_shared/visual-baselines.md` and `docs/testing.md` ("Where a test goes", "Visual coverage").
- [ ] T002 [P] Read `src/layouts/PageLayout.astro`, `src/pages/404.astro`, `tests/e2e/theme-tokens.spec.ts`, `tests/e2e/geometry.spec.ts` and `playwright.config.ts` to confirm where `#content-section` is drawn today and which Playwright project would run a new `tests/e2e/content-card.spec.ts` (the project-coverage config guard fails if a spec runs in no project).

---

## Phase 2: Foundational (blocking)

**Purpose**: Tests that must fail first, shared by all three stories. No implementation until each is seen to fail for the stated reason.

- [ ] T003 [P] Write the geometry spec `tests/e2e/content-card.spec.ts`. Primary layer: E2E in the `e2e` project, because only a browser computes layout. Pages: `/about/` and `/nope/` (not-found). For each of 390, 640, 768 and 1280 px, load once and flip the `dark` class on `<html>` in place (as `theme-tokens.spec.ts` does) to read both themes from the same load. Assert, per contract invariant 3 in `contracts/content-card.md`: card `getBoundingClientRect()` x, y, width, height equal across themes (0 px); computed `padding-*` is 16 px (390), 24 px (640), 32 px (768, 1280) on all four sides in both themes; first `<p>` inside `#content-section` has the same x and width across themes; in light mode `border-top-width` is at least 1 px and `box-shadow` is not `none` (SC-001 to SC-003, FR-003 to FR-005). Cite the requirement ids in test titles. No second layer: SC-004 (320 px no scroll) stays in `geometry.spec.ts`.
- [ ] T004 [P] Extend `tests/e2e/theme-tokens.spec.ts` with a probe of `#content-section` on fixture `/sections/`: `background-color` resolves to white in light and dusk-800 in dark; `border-top-color` resolves to dusk-200 at 80% in light and dusk-700 at 80% in dark (FR-001, FR-002). Teach the probe helper an `alpha` form (`dusk-200/80` resolves to `color-mix(in oklab, var(--color-dusk-200) 80%, transparent)`) with no colour literal. Primary layer: E2E, because that spec owns token-per-theme; the geometry spec does not repeat colours.
- [ ] T005 [P] Extend `tests/component/NotFound.test.ts` with a parity test: render `PageLayout` and `404.astro` through the Container API and assert both contain exactly one `#content-section` with identical class lists, and that the not-found `<h1>` is inside it (FR-006). Primary layer: Component, the cheapest layer that sees markup, and it is content-independent. No second layer.
- [ ] T006 Run T003, T004 and T005 against the unchanged source and confirm each fails for the expected reason (light padding 0 and no border; light border transparent; 404 has no `#content-section`), and that nothing else fails. Do not proceed until they fail. Record the three failure messages in the commit message body.
- [ ] T007 Create `src/components/page/ContentCard.astro` per `contracts/content-card.md`: no props, one default `<slot />` inside `<section id="content-section" class="prose lg:prose-lg dark:prose-invert prose-accent mx-auto mb-8 max-w-screen-lg rounded-2xl border border-dusk-200/80 bg-white p-4 shadow-xs sm:p-6 md:p-8 dark:border-dusk-700/80 dark:bg-dusk-800">`. Every box-affecting class is theme-independent; only colours carry `dark:`. No `overflow-*` utility (FR-013), no inline style or script (FR-010, CSP). Cite the Astro slots page in the file's PR notes, not in code.

**Checkpoint**: Component exists; no caller uses it yet.

---

## Phase 3: User Story 1 - Standalone page reads inside the same card in either theme (Priority: P1) MVP

**Goal**: Every page `PageLayout` draws shows the same card in light and dark, with the text column in the same place.

**Independent Test**: `pnpm exec playwright test tests/e2e/content-card.spec.ts --project=e2e` for `/about/` passes in both themes.

- [ ] T008 [US1] Replace the inline `<section id="content-section">` in `src/layouts/PageLayout.astro` with `<ContentCard>{draft && <DraftNotice />}<slot /></ContentCard>`. Keep the title section, `HomeIntro` and feature image above it untouched, and keep the draft notice as the first child (FR-007, FR-014). Make T003 pass for `/about/` and T004 pass.
- [ ] T009 [US1] Run `pnpm exec vitest run tests/component/PageLayout.test.ts` (structure, draft-notice-first and reading-order assertions, FR-014, already the primary layer for them) and `pnpm exec playwright test tests/e2e/geometry.spec.ts tests/e2e/sections.spec.ts tests/e2e/no-js.spec.ts --project=e2e` (320 px no scroll, wide and full-width image break-out FR-009, no-JS FR-010) to confirm they stay green. Fix the implementation, not the tests, if any fail.
- [ ] T010 [US1] Run `pnpm exec playwright test tests/e2e/a11y.spec.ts tests/e2e/home.spec.ts tests/e2e/pages.spec.ts tests/e2e/contact.spec.ts` and confirm zero axe violations in both themes on every template and that the home and contact journeys still pass (SC-005, FR-008, FR-013). Second layer note: axe is the accessibility layer for templates, not a repeat of the geometry test.

**Checkpoint**: Story 1 complete and independently testable.

---

## Phase 4: User Story 2 - Padding suits the screen size (Priority: P2)

**Goal**: 1rem padding up to 639 px, 1.5rem from 640 px, 2rem from 768 px, in both themes.

**Independent Test**: The padding assertions in `tests/e2e/content-card.spec.ts` at 390, 640, 768 and 1280 px.

- [ ] T011 [US2] Confirm the padding assertions of T003 (16, 24, 32, 32 px) pass for `/about/` in both themes with the `p-4 sm:p-6 md:p-8` classes from T007. If a width fails, adjust only the component's padding classes. No new test: T003 already owns this behaviour (FR-003), and a second test would repeat it.

**Checkpoint**: Stories 1 and 2 work.

---

## Phase 5: User Story 3 - The not-found page matches (Priority: P2)

**Goal**: `404.astro` shows the identical card in both themes.

**Independent Test**: T003 on `/nope/` and T005 pass; `tests/e2e/not-found.spec.ts` stays green.

- [ ] T012 [US3] Replace the inline content `<section>` in `src/pages/404.astro` with `<ContentCard>` wrapping the existing `<h1>` and copy unchanged; keep `BaseLayout` and its single main landmark; the card is not a landmark or region (FR-006). Make T003 pass for `/nope/` and T005 pass.
- [ ] T013 [US3] Run `pnpm exec playwright test tests/e2e/not-found.spec.ts tests/e2e/geometry.spec.ts tests/e2e/a11y.spec.ts` and confirm the not-found journey, 320 px no-scroll (SC-004) and axe checks pass in both themes. The footer stays at the bottom on the short page (spec edge case).

**Checkpoint**: All stories work.

---

## Phase 6: Polish and cross-cutting

- [ ] T014 [P] Add a one-line note to `docs/design-source.md`: the light-mode card departs from the Flux `content-section.hbs`, which has no light card (spec Assumptions, plan structure). In `docs/testing.md` ("Layers", E2E row or "Visual coverage"), mention `content-card.spec.ts` only if the document lists per-spec geometry coverage; do not restate values. Also update `specs/003-standalone-pages/contracts/page-dom.md` only if it is read by a test; otherwise leave history unchanged.
- [ ] T015 [P] Search the repository for other uses of the old dark-only classes (`dark:rounded-2xl`, `dark:bg-dusk-800 dark:p-6`) with `grep -rn "dark:p-6" src tests docs`; any hit outside `ContentCard.astro` that draws a covered page is a miss to fix, and a hit on a post, story or listing is out of scope and stays.
- [ ] T016 Merge the latest `origin/main` into the branch (`git fetch origin && git merge origin/main`), keeping both sides of any conflict in `PageLayout.astro`, `404.astro`, `theme-tokens.spec.ts` or visual baselines (spec Dependencies, Constitution row XI). Baselines are refreshed after this, not before.
- [ ] T017 Run `pnpm run verify:quick` (lint, typecheck, unit, worker, build) and fix findings.
- [ ] T018 Check Docker: run `docker info`. If it fails, stop and report that Don must start Docker Desktop (the implementer cannot ask; the orchestrator asks). There is no other route to Linux baselines.
- [ ] T019 Visual baselines, macOS: first run `pnpm run test:visual` to see which images differ and confirm only the predicted set in research R7 differs: `not-found-*`, `sections-*`, `home-now-start-here-*`, `contact-form-*` at phone and desktop, light and dark (32 images per platform). Any other diff (header, footer, menu-open, post, story, lead story, listing cards, series, project row, retired story header) is a regression to investigate, not to refresh. Then run `pnpm run test:visual:update` (via the nvm and shim wrapper in the background if the agent shell needs it, per `.claude/skills/_shared/visual-baselines.md`) and commit only the `*-darwin.png` files. Primary layer: Visual, because pixels are what it owns; the card values themselves are asserted by T003 and T004, so the screenshots are not the evidence of conformance (FR-012).
- [ ] T020 Visual baselines, Linux: after T019 and after T016 (the merge), run `pnpm run test:visual:update:linux` (needs Docker Desktop). Do not run it while the macOS update or a Docker build of `dist` is running. Commit only the `*-linux.png` files, then run `git diff --stat` and confirm the combined baseline diff touches only the 64 files predicted in R7 (32 per platform).
- [ ] T021 Review each refreshed baseline against its `-previous.png` and the spec's "Card properties per theme" table (FR-012): radius 1rem, 1 px border, white or dusk-800 background, shadow, padding steps, and nothing outside the card changed beyond its shift. Record the result in the PR body.
- [ ] T022 Run the local tier check `git fetch origin && node scripts/ci/changed-paths.ts --base origin/main` (this change is full tier). Ask Don before the full `pnpm run verify`; push and let CI be the gate if local runs are load-bound (see CLAUDE.md).
- [ ] T023 [PREVIEW-CHECK] On the preview deployment, open `/about/` and a dead link such as `/does-not-exist/` at phone and desktop width, switch theme with the header toggle, and confirm: white card with a fine border and soft shadow in light, dusk card with dark border in dark, text does not move when switching. Also check the home page and `/contact/`. Leave unticked for Don; list it in the PR body under its own heading per `.claude/skills/_shared/preview-check.md`.

---

## Dependencies and execution order

- Phase 1 first. Phase 2: T003, T004, T005 in parallel (different files), then T006 (see them fail), then T007.
- US1 (T008 to T010) needs T007. US2 (T011) needs T008. US3 (T012, T013) needs T007 and is independent of US1 and US2, so T012 can run in parallel with T008 (different files).
- Polish: T014 and T015 in parallel. T016 before T017 to T021. T019 before T020 (never both at once). T021 after T020. T022 and T023 last.

## Parallel example

```text
T003 content-card.spec.ts  |  T004 theme-tokens.spec.ts  |  T005 NotFound.test.ts
T008 PageLayout.astro      |  T012 404.astro   (after T007)
T014 docs note             |  T015 grep sweep
```

## Implementation strategy

MVP is Phase 2 plus US1 (the standard layout card). US2 needs no extra code, only its measurement. US3 completes the set; the change ships as one PR because a card on every page except not-found would leave the asymmetry the issue reports. Baselines are refreshed last, after merging `main`.
