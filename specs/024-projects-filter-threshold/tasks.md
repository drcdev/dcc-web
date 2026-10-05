# Tasks: Projects Filter Threshold

**Input**: `specs/024-projects-filter-threshold/` (spec.md, plan.md, quickstart.md)

Single phase, one implement subagent. Tests come first and are seen failing before the code
they cover. Run Node from `.nvmrc` (CLAUDE.md "Local toolchain"). No visual baseline change is
predicted (the fixture site keeps the filter at threshold 0), so there is no baseline task; any
visual diff is a regression to fix.

## Phase 1: Hide the projects filter at 10 or fewer projects (US1, US2)

### Tests first

- [ ] T001 [P] [US1] Unit test (layer: unit): in `tests/unit/content/filter-logic.test.ts` add cases for `showsThemeFilter(count, threshold)` from `src/lib/content/themes.ts` (10/10 false, 11/10 true, 0/10 false, 5/0 true) and that `PROJECT_FILTER_THRESHOLD` from `src/config/projects.ts` is 10. Run it and see it fail.
- [ ] T002 [P] [US1] Unit test (layer: unit): in `tests/unit/site/fixture-site-content.test.ts` add cases that `prepareFixtureSite` writes `PROJECT_FILTER_THRESHOLD = 0` into the copied `src/config/projects.ts` while the repository file stays at 10, and that the exported pure helper `lowerFilterThreshold(text)` in `scripts/build-fixture-site.ts` throws when the constant is not found exactly once. Run it and see it fail.
- [ ] T003 [P] [US1] [US2] Component test (layer: component): create `tests/component/project/ProjectList.test.ts` for `src/components/project/ProjectList.astro` using Astro's container helpers: with the default threshold, total 10 renders `ul[data-project-list]` with every slotted row and no `project-filter` or `data-filter-*`; total 11 renders `project-filter` with its controls. Run it and see it fail.
- [ ] T004 [P] [US1] Build test (layer: build, the only layer that can see emitted scripts; no new build): in `tests/build/local-site.test.ts` assert the existing L1 build's `projects/index.html` has every project row, no `<project-filter`, no `data-filter-` attributes, no "No projects match", and the same `<script` count as `about/index.html`. Run it and see it fail.
- [ ] T005 [P] [US2] E2E test (layer: E2E, only a browser can show the no-script state; moves the coverage `projects-no-js.spec.ts` loses on port 4321): in the existing `tests/e2e/projects-fixtures.spec.ts` add one case with JavaScript off: `project-filter` is present, every row is visible, and the controls, status and empty message are hidden. Do not add a spec file.

### Implementation

- [ ] T006 [US1] Create `src/config/projects.ts` exporting `PROJECT_FILTER_THRESHOLD = 10` with a comment that the fixture-site build lowers it in its copy.
- [ ] T007 [US1] Add `showsThemeFilter(count: number, threshold: number): boolean` (returns `count > threshold`) to `src/lib/content/themes.ts`; do not import the config module there.
- [ ] T008 [US1] [US2] Create `src/components/project/ProjectList.astro` (props `themes`, `total`, optional `threshold` defaulting to `PROJECT_FILTER_THRESHOLD`): render `<ProjectFilter themes total><slot /></ProjectFilter>` when `showsThemeFilter(total, threshold)`, otherwise `<ul data-project-list class="not-prose"><slot /></ul>`.
- [ ] T009 [US1] In `src/pages/projects/index.astro` replace `<ProjectFilter …>` with `<ProjectList …>`, keeping `total` as `projects.length` and the empty-index branch unchanged.
- [ ] T010 [US2] In `scripts/build-fixture-site.ts` export `FIXTURE_FILTER_THRESHOLD = 0` and the pure helper `lowerFilterThreshold(text)` (replace `PROJECT_FILTER_THRESHOLD = 10` with the fixture value, throw unless found exactly once), and call it on the copied `src/config/projects.ts` in `prepareFixtureSite()` after the `src/` copy.

### Check

- [ ] T011 Run the fast checks in `specs/024-projects-filter-threshold/quickstart.md` (unit, component, build tests, then `pnpm run build:fixtures` and the `sections` Playwright run of `tests/e2e/projects-fixtures.spec.ts`); all must pass and no visual baseline may change.
- [ ] T012 Run `pnpm run verify:quick` and fix anything it reports. The orchestrator runs the full gate.

## Dependencies

T001-T005 are independent and precede T006-T010. T006 precedes T007-T010; T007 precedes T008; T008 precedes T009; T010 depends on T006. T011 and T012 run last.
