# Tasks: Remove the project placeholder picture option

**Input**: Design documents in `specs/032-remove-placeholder-picture/` (spec.md, plan.md, research.md, data-model.md, contracts/project-picture.md, quickstart.md)

**Tests**: Mandatory (Constitution Principle I). Each test task names its one primary layer (cheapest that can observe the behaviour, `docs/testing.md` "Where a test goes"); a second layer carries a written reason. Test tasks come before the implementation they cover and are seen to fail first.

**Toolchain**: Follow the Local toolchain section of `CLAUDE.md` for every pnpm/astro/playwright call (check `node -v`, run via the wrapper).

**Facts to use**: there are **seven** broken fixtures that set `placeholder` (17-missing-image, 26-duplicate-slug, 27-bad-file-name, R01-removed-order, RP04-missing-replacement, story-malformed-table, story-mdx-element). The new rejection cases carry no "R05" label: R05 is already used in `tests/build/project-validation.test.ts`, so do not reuse it in code or tests.

## Format: `- [ ] [ID] [P?] [Story] Description with file path`

## Phase 1: Setup

- [X] T001 Record the baseline: run `grep -rn "placeholder:" tests/fixtures tests/component tests/unit src docs/projects.md` and note every hit; confirm the expected set from plan.md (3 valid/draft fixtures with 7 uses, 7 broken fixtures with 1 use each, component helper `screenshot`, schema test `full`, `src/content/schemas/project.ts`, `docs/projects.md`). Confirm no file under `src/content/projects/` matches (FR-008). No file changes.

## Phase 2: Foundational

None. The three stories touch separate files and need no shared prerequisite beyond T001.

## Phase 3: User Story 1 - A project file can no longer mark a picture as a placeholder (P1)

**Goal**: The project schema rejects `placeholder` on every picture, any value, with an error naming it.

**Independent Test**: Schema validation of a picture with `placeholder` fails naming `placeholder`; the real site still builds.

### Tests (write first, see them fail)

- [X] T002 [US1] Add schema rejection tests in `tests/unit/content/project-schema.test.ts` (primary layer: unit, the schema is pure logic): `placeholder` is rejected on the list picture `visual` as an image and as a diagram, on a `visuals` entry as an image and as a diagram, and with value `false` as well as `true`; each issue text contains `placeholder`. Seen to fail today (schema accepts the key). No second layer: that Astro names the file for a strict-schema failure is already proven by the existing wiring run in `tests/build/project-validation.test.ts`, so no new broken fixture or build run is added (research R3).

### Implementation

- [X] T003 [US1] Remove the optional `placeholder` boolean from both picture shapes (image and diagram) in `src/content/schemas/project.ts` so the strict objects reject it. Check the Astro content collections docs cited in plan.md (Constitution IV). T002 now passes.
- [X] T004 [US1] Remove `placeholder` from the `full` picture data and any other accepted-key test data in `tests/unit/content/project-schema.test.ts` so the positive cases do not use the removed key.

**Checkpoint**: the unit test file `tests/unit/content/project-schema.test.ts` passes.

## Phase 4: User Story 2 - Pictures in a story no longer show a "Placeholder" mark (P2)

**Goal**: No mark, no `data-placeholder` or `data-visual-mark` hook, no styles for them; pictures otherwise unchanged.

**Independent Test**: Component render with legacy data shows no mark; the fixture build has no mark; forced-colours borders remain.

### Tests (write first, see them fail)

- [X] T005 [US2] Replace the mark test in `tests/component/project/PartPicture.test.ts` (primary layer: component, Astro container render of one component) with a "no mark" test: render a picture whose data object still carries `placeholder: true`, passed explicitly through `makeProject({ visuals: { ... } })` so the test does not depend on the shared `screenshot` data that T009 cleans, and assert the output has no "Placeholder" text and no `data-placeholder` or `data-visual-mark`. Keep existing assertions for alt text, diagram `aria-describedby` figcaption, and eager first / lazy rest loading. Seen to fail today.
- [X] T006 [US2] Flip the `data-placeholder` assertion in `tests/build/local-site.test.ts` (~line 372) to `not.toContain("data-placeholder")` and also assert no `data-visual-mark` (primary layer: build, only the real build over the fixture site shows the whole story page output; second layer reason: it replaces the end-to-end check being deleted in T010, and the component test T005 cannot see the assembled page). Seen to fail today.

### Implementation

- [X] T007 [P] [US2] Remove the mark line (and its `data-placeholder` / `data-visual-mark` use) from `src/components/project/PartPicture.astro` and update its header comment. T005 and T006 pass after the fixtures in T011/T012 land.
- [X] T008 [P] [US2] In `src/components/project/portfolio.css` remove the `[data-visual-mark]` rule (~line 98) and the `[data-placeholder]` entry from the forced-colours border selector list (~line 225), keeping every other entry and a valid selector list (FR-003).
- [X] T009 [US2] Remove `placeholder` from the `screenshot` visual in `tests/component/project/helpers.ts`.
- [X] T010 [US2] Delete the e2e test "marks placeholders with real text" in `tests/e2e/projects-fixtures.spec.ts` (~line 253); the behaviour it covered is removed, and its replacement is T005/T006 at cheaper layers. Leave the existing forced-colours and a11y project checks unchanged (FR-009; no new accessibility test, no remaining element's markup or style changes).

**Checkpoint**: the component tests under `tests/component/project` pass; `astro check` reports no reader of `picture.placeholder`.

## Phase 5: User Story 3 - Fixtures, docs and visual baselines match the new format (P3)

**Goal**: No fixture, test data or guide mentions the setting; only the eight story-template baselines change.

**Independent Test**: `grep` for the `placeholder:` key finds nothing outside historical records; visual check passes on both platforms.

### Implementation (fixtures and docs)

- [X] T011 [P] [US3] Remove all four `placeholder: true` lines from `tests/fixtures/projects/every-part.mdx`, two from `tests/fixtures/projects/every-setting.mdx`, one from `tests/fixtures/projects/draft.mdx`. Keep the "A placeholder picture for ..." alt text (research R6).
- [X] T012 [P] [US3] Remove the one `placeholder` line from each of the seven broken fixtures under `tests/fixtures/projects/broken/`: `17-missing-image`, `26-duplicate-slug`, `27-bad-file-name`, `R01-removed-order`, `RP04-missing-replacement`, `story-malformed-table`, `story-mdx-element`. Each must still fail for its own reason only; `tests/build/project-validation.test.ts` asserts each message and is the check (no fixture is added or removed).
- [X] T013 [P] [US3] In `docs/projects.md` remove the `placeholder` yaml line and its bullet, and rename the "Drafts and placeholders" heading to "Drafts" (FR-006); fix any link to that heading.
- [X] T014 [US3] Verify the search: `grep -rn "placeholder:" tests/fixtures tests/component tests/unit src docs/projects.md` returns nothing (SC-003); `git diff --stat` shows nothing under `src/content/projects/` (FR-008). Run the Vitest suites that cover this: `tests/unit/content`, `tests/component/project`, `tests/build/project-validation.test.ts` and `tests/build/local-site.test.ts`; all pass.

### Visual baselines (after all fixture, component and style edits, and with no sibling worktree browser tests running)

- [X] T015 [US3] Refresh the macOS baselines: `pnpm run test:visual:update` via the wrapper, following `.claude/skills/_shared/visual-baselines.md`. Then `git status`: the changed PNGs MUST be exactly the four `tests/e2e/visual.spec.ts-snapshots/story-template-{desktop,phone}-{light,dark}-visual-darwin.png`. Restore any other changed PNG with `git checkout -- <file>` and investigate it as a regression (FR-007).
- [X] T016 [US3] Refresh the Linux baselines: `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, follow CLAUDE.md and ask Don, do not fall back to CI unasked). Changed PNGs MUST be exactly the four `story-template-*-linux.png`; restore any other with `git checkout` and investigate. If Docker output later differs from CI, use the `visual-baselines` label fallback described in the shared doc.
- [X] T017 [US3] Review each refreshed image against its `-previous.png`: it differs only by the three marks gone and the content below moving up; the project-row, retired-story-header and lead-story shots are unchanged.

**Checkpoint**: `pnpm run test:visual` passes on the platform available locally with only the eight files changed.

## Phase 6: Polish and cross-cutting

- [X] T018 Run `pnpm run verify` (ask Don first per the memory note; run via the wrapper in the background under `perl alarm`, read the `VERIFY_EXIT=` line); lint, type check (`astro check`), unit, component, build, e2e, a11y, visual and budget checks all pass. Push for CI if local failure is load-only and Don allows.
- [X] T019 Confirm the PR body states: not a major change (Constitution III), expected cost $0, and the eight refreshed baselines. No `[PREVIEW-CHECK]` items: nothing here needs the preview deployment, since the visual diff is covered by T017, so auto-merge may be armed after the final push.

## Dependencies and order

- T001 first. US1 (T002, T003, T004) is independent of US2 and US3 and is the MVP.
- US2: T005, T006 before T007, T008; T009 and T010 any time after T005. T006 passes only after T011/T012 (fixtures drop the key) and T007.
- US3 fixtures (T011-T013) are independent files; T014 follows them. T015, T016, T017 run in order, only after every other implementation task (T003, T007-T013) is done.
- T018, T019 last.

## Parallel examples

- After T002 is written: T005 and T006 can be written in parallel with T003.
- T007 and T008 touch different files; T011, T012 and T013 touch different files.
- Do not run T015/T016 in parallel with any other browser test run.

## Implementation strategy

MVP is US1 (schema rejects the setting). Then US2 (mark and styles gone), then US3 (fixtures, guide, baselines), then the gate. Commit after each phase.

## Counts

19 tasks: Setup 1, Foundational 0, US1 3, US2 6, US3 7, Polish 2. No `[PREVIEW-CHECK]` tasks.

## Phase 7: Convergence

- [X] T020 Delete the orphaned line "Remove the line when you do." under the `draft: true` bullet in the "Drafts" section of `docs/projects.md` (left over from the removed placeholder bullet; it now reads as advice about the draft setting) per FR-006 (partial)
