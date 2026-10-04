# Tasks: Right-size listing card images

**Input**: `specs/021-card-image-size/` (spec.md, plan.md, research.md, contracts/post-card-image.md, quickstart.md)
**Branch**: `021-card-image-size` | **Issue**: #73

**Tests are mandatory** (Constitution Principle I). Each test task names its one primary layer
(`docs/testing.md`, "Where a test goes"). Tests come before the implementation they cover and
are seen to fail first. The source change is three props on one `<Image>`.

## Format: `- [ ] T### [P?] [Story] Description with file path`

## Phase 1: Setup

- [X] T001 Run `node -v`; if it is not the `.nvmrc` major, use `source ~/.nvm/nvm.sh && nvm use` in the same Bash command as every toolchain call. Check `lsof -i :4321 -i :4322` shows no sibling Playwright server before any E2E run (CLAUDE.md, "Local toolchain").
- [X] T002 Read `src/components/post/PostCard.astro`, `tests/component/post/PostCard.test.ts` (the `withImage` card and its 1200 px fixture source) and `tests/e2e/blog-fixtures.spec.ts` to learn the existing helpers and patterns before writing tests.

---

## Phase 2: User Story 1 - Lighter series and listing pages on a phone (Priority: P1) MVP

**Goal**: A 390 px, 1x phone downloads the 400w card file at quality 65 instead of the 480w file at quality 80.

**Independent test**: Component tests C1 to C3 pass on the rendered card, and the fixture-site E2E test C6 shows `currentSrc` at most 400w on every card listing.

### Tests (write first, run, confirm they fail on today's 320/480/640 widths, `100vw` and missing `q=`)

- [X] T003 [P] [US1] Component test (layer: component; the Astro container observes the rendered `srcset` with no browser) in `tests/component/post/PostCard.test.ts`: for the `withImage` card (1200 px source) parse the `srcset` descriptors and expect exactly `320w, 400w, 640w` (C1, FR-001, FR-004). Also render the card with a narrower source (a copy of the fixture image metadata with `width: 480, height: 270`) and expect exactly `320w, 400w, 480w` (nothing enlarged; spec edge case).
- [X] T004 [P] [US1] Component test (layer: component, same file as T003) in `tests/component/post/PostCard.test.ts`: `sizes` equals `(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 2rem)` (C2, FR-002).
- [X] T005 [P] [US1] Component test (layer: component, same file) in `tests/component/post/PostCard.test.ts`: the `src` and every `srcset` URL contain `q=65` and `f=webp` (C3, FR-003, FR-005). If the container omits `q=` from candidate URLs at the red step, move this one check to a build test of the fixture-site HTML and write the reason in the test and in `plan.md` "Risks and notes".
- [X] T006 [US1] E2E test (layer: E2E, `sections` project, fixture site; only a browser shows which candidate it chooses) in `tests/e2e/blog-fixtures.spec.ts`: new `test.describe("card images at phone width")` at 390x844 with `deviceScaleFactor: 1`, visiting `/`, `/writing/`, `/writing/all/`, `/writing/topics/fixture-cards/` and `/writing/drift/`. On each page scroll every card `img` into view, wait for `complete`, map `currentSrc` to its `srcset` descriptor, expect at most 400w and at least one image card per page (C6, SC-001). Use fixture content only; name no real post.
- [X] T007 [US1] Run the new tests (`pnpm exec vitest run --project unit tests/component/post/PostCard.test.ts`; then `pnpm run build:fixtures` and `pnpm exec playwright test --project=sections tests/e2e/blog-fixtures.spec.ts`) and see them fail; record that T003 to T006 fail for the expected reasons (480w pick, `100vw`, no `q=`).

### Implementation

- [X] T008 [US1] In `src/components/post/PostCard.astro` set on the `<Image>`: `widths={[320, 400, 640]}`, `sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 2rem)"` and `quality={65}`. Change nothing else (alt, size, `loading="lazy"` and classes stay).
- [X] T009 [US1] Re-run T003 to T006 and confirm they now pass; run `pnpm run lint` and `pnpm run typecheck`.

**Checkpoint**: US1 delivers the saving on its own.

---

## Phase 3: User Story 2 - Cards still look right on larger and sharper screens (Priority: P2)

**Goal**: Wider and high-density screens still get a sufficient file, and no other image changes.

**Independent test**: The 640w candidate stays offered; card shape, alt, size and lazy loading are unchanged; hero, lead and project images carry no quality parameter; the `listing-cards` visual subject is unchanged or only its own baselines are refreshed.

### Tests (regression guards: the behaviour is kept, so they pass at once. Each is seen to fail by a temporary local break, then the break is reverted before commit)

- [X] T010 [P] [US2] Component test (layer: component) in `tests/component/post/PostCard.test.ts`: keep the existing `alt`, `width`, `height` and `loading="lazy"` assertions green and add a check for the `aspect-[16/9]` and `object-cover` classes (C4, FR-005). See it fail by temporarily removing `aspect-[16/9]` from `PostCard.astro`, then revert.
- [X] T011 [P] [US2] Component test (layer: component; the quality prop is a per-component rendering fact, not a browser one) in `tests/component/post/LeadStory.test.ts` and `tests/component/post/PostHero.test.ts`: no candidate URL contains `q=` (C5, FR-006). See each fail by temporarily adding `quality={65}` to the `<Image>` in `LeadStory.astro` and `PostHero.astro`, then revert.
- [X] T012 [US2] (Result: `listing-cards-*` passed, 66/66, no baseline change needed.) Run the visual project (`pnpm run test:visual`). If `listing-cards-*` passes, no baseline change is needed; record that. Only if the `listing-cards` snapshot fails, refresh the macOS set with `pnpm run test:visual:update`, then the Linux set with `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, stop and report so Don can start it, or use the `visual-baselines` PR label and copy only `*-linux.png` from the artifact). Commit only the `tests/e2e/visual.spec.ts-snapshots/listing-cards-*.png` images. Any other subject that differs (`lead-story`, `post-template`, project rows, shell) is a regression to fix, not a baseline to refresh.

---

## Phase 4: User Story 3 - A series can keep growing within budget (Priority: P3)

**Goal**: Pages stay inside the unchanged 150 KB budget with more headroom, and the saving is measured.

**Independent test**: `budget.spec.ts` passes unchanged, and the convergence before/after figures are recorded.

- [X] T013 [US3] Budget check (layer: budget; the existing `budget.spec.ts` already observes total transfer, so no new test and no limit changed): run the `budget` project and confirm every template and the 12-card fixture `/writing/all/` pass (C7, FR-007, SC-003).
- [X] T014 [US3] Record the SC-002 measurement (a reported figure, not a gate). From T013's `budget` run read the `writing-series-convergence` annotation for the page's total transfer (`totalBytes`: compressed, headers included; the annotation has no per-image figure), take the two card images' transferred bytes from the Network panel in quickstart step 5 (same 390 px, 1x, cache disabled), and compare with research.md R4 (78,604 B of card images on a 121,654 B page; targets: card images at most about 47 KB, a cut of at least 40%, and page below 100 KB). As a cross-check, sum the two 400w `_astro/` WebP files the built `/writing/convergence/` card HTML references (`pnpm run build`; baseline 77,520 B of 480w files, expected about 41,000 B). Add an "After" section with the figures and the method to `specs/021-card-image-size/research.md` for the PR body. If a target is missed, report it and open a follow-up issue; it is not rework here while T013 and T006 pass (SC-002).

---

## Phase 5: Polish and cross-cutting

- [x] T015 [P] Docs: `grep` found no description of the card image widths in `docs/` (`docs/posts.md` "Images and their widths" covers in-post images only), so add one sentence to the `writing-landing` row of the "Visual coverage" table in `docs/testing.md` saying where the card-image check lives (component tests in `PostCard.test.ts`, E2E in the `sections` project's `blog-fixtures.spec.ts`). Re-grep first; skip if a doc has since gained such a description and edit that one instead.
- [x] T016 Run `pnpm run verify:quick` (inner loop). The full gate's `a11y` project keeps the WCAG 2.2 AA check on every template green (SC-003). Ask Don before the full `pnpm run verify` gate, then run it via the wrapper under `perl -e 'alarm N; exec @ARGV'` and read the `VERIFY_EXIT=` line. Result: local full gate was red only from two sibling worktrees sharing ports 4321/4322 (sibling fixture build served, then `ERR_CONNECTION_REFUSED`); unit 2796/2796, worker 132/132, build green, `verify:quick` green on the merged branch; Don chose to let CI run the gate, and the `verify`, `e2e`, `build-tests` and `static` checks on PR #79 passed.
- [x] T017 Walk through `specs/021-card-image-size/quickstart.md` and confirm each check, including step 5's local look at the convergence cards at 390 px (SC-004); note the incidental `wayfinder-hero` alt-text mismatch as follow-up only (out of scope).

---

## Dependencies and order

- Phase 1, then Phase 2. Within Phase 2: T003 to T006 (T003 to T005 parallel, same file so edit sequentially in practice; T006 another file) then T007 (red) then T008 then T009.
- Phase 3 depends on T008 (T010, T011 parallel; T012 after them).
- Phase 4 depends on T008 and runs after Phase 3 (the build used by T014 must not run while Docker builds `dist/`).
- Phase 5 last. No `[PREVIEW-CHECK]` task: every check is observable locally or in CI (plan judged none needed).

## Parallel opportunities

T003/T004/T005 with T006; T010 with T011; T015 with T013/T014.

## Implementation strategy

MVP is Phase 2 (US1): it carries the entire source change. Phases 3 and 4 add regression guards, the visual check and the measurement. Total 17 tasks: Setup 2, US1 7, US2 3, US3 2, Polish 3.
