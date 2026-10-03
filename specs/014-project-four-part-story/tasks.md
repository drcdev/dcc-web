# Tasks: Simplify the project pages to a four-part story

**Input**: `specs/014-project-four-part-story/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md, checklists/)
**Branch**: `014-project-four-part-story` | **Issue**: #35 | **Major change** (Constitution III): auto-merge stays off.

**Tests are mandatory** (Constitution I). Each test task is written first, seen to fail, then made to pass by the implementation task that follows it. Every test task names its one primary layer (unit, component, build, worker, e2e, a11y, visual, budget; see `docs/testing.md` "Where a test goes" and the plan.md test-layer table). A second layer carries a written reason.

**Format**: `- [ ] T### [P?] [US#] Description with path`. `[P]` = different files, no dependency on an unfinished task. `[PREVIEW-CHECK]` = a subagent cannot verify it; needs the preview deployment or Don's eyes.

**Toolchain**: run `node -v`; if not the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the same Bash command as `pnpm`/`astro`/`playwright`. Ask Don before the full `pnpm run verify`.

## Phase 1: Setup and spike

**Purpose**: Record the "before" numbers and prove the plugin mechanism before anything depends on it.

- [x] T001 Record full-document heights at 390 px (light theme, non-production build) of the five current project pages on the unchanged tree with a throwaway Playwright script (not committed); save the numbers to `specs/014-project-four-part-story/page-heights-before.md` for the PR body (SC-002, quickstart step 0).
- [x] T002 Spike the parts plugin (research R2). In a scratch copy of one fixture, add `src/lib/markdown/project-parts.ts` exporting `projectPartsPlugin` (Sätteri mdast plugin: factory returns `null` unless `fileURL` is under `src/content/projects/`; wraps each `##` heading and following siblings in an `mdxJsxFlowElement` `ProjectPart` with `name`, and replaces the first table in the Options group with `OptionsTable`), register it in `astro.config.mjs` beside `readingTimePlugin`, and run one real `astro build` to confirm `ProjectPart` and `OptionsTable` resolve through `<Content components>`. **Fallback if a plugin-created JSX element is not resolved**: a hast plugin (`defineHastPlugin`) wraps parts in `<section data-part>`, and the route overrides `section` and `table` through the same `components` prop; record which route was taken in research.md R2. Cite the Astro docs page used (constitution IV). The spike is throwaway: its code is kept only once T016 has been written and seen to fail (T021).

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: Shared part ids, the new schema and ordering.

- [x] T003 [P] Write unit tests (primary layer: unit) for schema rows R01-R04 (removed `order`, `comparison`, `demo.embed`, clip kind each fail naming the key), N01-N02 (`visuals.<name>.part` enum, at most one picture per part), N03 (`invitation` trimmed, empty means standard), `date` required, and carried rows S01-S08 by rewriting `tests/unit/content/project-schema.test.ts`; delete `tests/unit/content/project-clips.test.ts`. Run and see them fail.
- [x] T004 [P] Write unit tests (unit) for ordering by `date` descending, then title, then file name (slug) by rewriting `tests/unit/content/project-order.test.ts` (no `order`). See fail.
- [x] T005 Create `src/lib/content/parts.ts` (`partIds`, `partHeadings`: problem/Problem, options/Options, build/Build, lessons/Lessons) per data-model.md; its values are asserted through the T003 `part` enum cases.
- [x] T006 Update `src/content/schemas/project.ts` per data-model.md (drop `order`, `comparison`, `demo.embed`, clip kind; `date` required; add `part` and `invitation`; strict). Remove the clip check from `src/lib/content/project-images.ts`. Make T003 pass.
- [x] T007 Update `src/lib/content/project-order.ts` to date, title, slug; make T004 pass. Delete `src/lib/content/stages.ts`, `src/lib/content/demo-csp.ts` and their tests (`tests/unit/content/stages.test.ts`, demo CSP tests) as the behaviour is removed, not disabled.
  - Note: `stages.ts`, `demo-csp.ts` and `stages.test.ts` are kept until Phase 4 (T025), because `StoryHeader`, `blocks/`, `project-body.ts`, the route and several old tests still import them; delete them with those files.
- [x] T008 [P] Update `tests/component/project/helpers.ts` (drop `comparison` and clips; add `part`, `invitation`, `date`, parsed `comparison`) and `src/env.d.ts` (`App.Locals.project` gains `comparison`).

---

## Phase 3: User Story 3 - The build rejects a malformed options table (P1)

**Goal**: `validateProjectStory` enforces part order and table shape, naming file and rule; runs for drafts in every build.
**Independent test**: a one-broken-file build fails with the file name and rule from `contracts/build-errors.md`.

- [x] T009 [US3] Write unit tests (unit) for every row of `contracts/build-errors.md` P01-P07 (parts, order, text before Problem, body images), T01-T13 (table and constraint-list rules, allowed cases), R05-R06 (body tags, import/export rejected), plus allowed sub-headings and MDX comments, in `tests/unit/content/project-story.test.ts`; also the returned `OptionsComparison` shape. See fail.
- [x] T010 [US3] Implement `validateProjectStory(file, body)` in `src/lib/content/project-story.ts` using Sätteri `mdxToMdast`; delete `src/lib/content/project-body.ts` and `tests/unit/content/project-body.test.ts`, `project-blocks.test.ts`, and project cases in `body.test.ts` as replaced. Make T009 pass.
- [x] T011 [US3] Write build tests (primary layer: build; reason: only the real loader and route prove call-site wiring, the rule logic stays unit) in `tests/build/project-validation.test.ts`: a removed setting in a draft under production fails at `sync` (R01, S01-S08); a malformed table in a draft fails a production build naming file and rule (P/T/R05-R06 call site, US3-7); keep S09-S11 (image check, file name, duplicate slug). See fail.
- [x] T012 [US3] Wire `validateProjectStory` into `getStaticPaths()` in `src/pages/projects/[slug].astro` over every entry (drafts included), put `comparison` on `Astro.locals.project`. Make T011 pass.

**Checkpoint**: build checks guard all content before any page is rebuilt.

---

## Phase 4: User Story 1 - Read a project as a four-part story (P1)

**Goal**: heading, four parts, table, Build links, invitation, in post-like prose.
**Independent test**: open a fixture story; four `section[data-part]` in order, picture beside at 1280 px and below at 390 px, no contents list or chapter numbers.

Tests and fixtures first (T013-T020, each test seen to fail), then the code that makes them pass (T021-T025).

- [x] T013 [P] [US1] Component tests (primary layer: component) `tests/component/project/ProjectPart.test.ts`: `section`, `aria-labelledby`, picture column only when assigned, first picture eager, Build links only when `demo`/`standIn`/`source` set, link text naming the project (FR-008). See fail.
- [x] T014 [P] [US1] Component tests (component) `tests/component/project/OptionsTable.test.ts`: caption, `scope` headers, `data-fit` plus the answer in words, chosen-row marker in text. See fail.
- [x] T015 [P] [US1] Component tests (component) `tests/component/project/ProjectInvitation.test.ts`: custom vs standard sentence, contact link carries only the slug; update `StoryHeader.test.ts` (no contents list); create `PartPicture.test.ts` from `Visual.test.ts` with clip cases removed (alt, diagram description). See fail.
- [x] T016 [P] [US1] Unit tests (unit) `tests/unit/markdown/project-parts.test.ts`: compile small MDX with `satteri` and the plugin; groups four parts, replaces only the Options table, ignores non-project files. See fail.
- [x] T017 [US1] Rewrite fixtures in `tests/fixtures/projects/` (`minimal`, `draft`, `every-setting` to four parts; `every-block.mdx` becomes `every-part.mdx`: picture on every part, a stand-in link and a source link, `invitation`, a sub-heading, a table outside Options; remove clip and poster files; keep `broken/`). These are test inputs, written before the code.
- [x] T018 [US1] E2E tests (primary layer: e2e, journeys only a browser shows) rewrite `tests/e2e/projects.spec.ts`: heading, four parts in order, no part `min-height` (FR-004), part `h2` computed size equals a post `h2`, picture beside at 1280 px and below at 390 px, links, invitation, progress bar, title carry-over, keyboard focus on the Build links, the invitation link and the table region visible and not covered by the progress bar (FR-027); trim reveal cases from `projects-motion.spec.ts` (keep progress bar); update selectors in `projects-no-js.spec.ts` (FR-011) and `projects-forced-colors.spec.ts` (table and chosen row). Run against the fixture site and see fail.
- [x] T019 [US1] Build test (build; reason: only the real MDX compile proves plugin output reaches `<Content components>`) one assertion in `tests/build/drafts.test.ts` that `projects/minimal/index.html` is one `article` in `main` with the heading in a `header`, four `section[data-part]` in order, the table markup and the invitation last (FR-002, FR-025). See fail.
- [x] T020 [P] [US1] A11y tests (a11y): rename the fixture entry to `every-part`, add the `every-setting` fixture story (the live demo link, which cannot share a page with a stand-in; SC-006), and keep `/projects/` and `/projects/focus-pocus/` in `tests/e2e/a11y.spec.ts` (its existing reflow checks at 320 px and 200% cover FR-026). See the `every-part` entry fail.
- [x] T021 [US1] Turn the T002 spike into `src/lib/markdown/project-parts.ts` (or the hast fallback recorded there), registered in `astro.config.mjs`; remove the clip `assetsInlineLimit` rule. Make T016 pass.
- [x] T022 [P] [US1] Create `src/components/project/ProjectPart.astro`, `PartPicture.astro`, `BuildLinks.astro`; make T013 and the T015 PartPicture cases pass.
- [x] T023 [P] [US1] Create `src/components/project/OptionsTable.astro` (reads `Astro.locals.project.comparison`; keyboard-reachable scroll region, `data-fit`, text answer beside tint); make T014 pass.
- [x] T024 [P] [US1] Create `src/components/project/ProjectInvitation.astro`; update `StoryHeader.astro` (contents list removed); make T015 pass.
- [x] T025 [US1] Update `src/layouts/ProjectLayout.astro` (invitation after body, one article in main), `src/layouts/PostLayout.astro` (prose classes from a shared constant) and `src/pages/projects/[slug].astro` (`components={{ ProjectPart, OptionsTable }}`, no CSP widening). Update `src/components/project/portfolio.css`: remove chapter, stage, reveal CSS; add part grid, answer tints from existing sage/sand/rust tokens (4.5:1 both themes), no sideways page scroll, focus styles. Delete `src/components/project/blocks/` and the old block component tests (`Chapter`, `Demo`, `Invitation`, `OptionComparison`, `Visual`). Make T018-T020 pass; run `pnpm run test:a11y` in light, dark and forced colours.

---

## Phase 5: User Story 2 - Write a new project from the template (P1)

**Goal**: copy, rename, fill in `_template.mdx`.
**Independent test**: a renamed copy of the template builds with four parts, links and invitation.

- [x] T026 [US2] Write unit tests (unit) `tests/unit/content/project-template.test.ts`: file exists, `draft: true`, passes schema and story check, example picture with `part` and an `invitation`, comments name the optional details, only example.com links. Write build tests (build; reason: only the real loader and route show exclusion and a clean build) in `tests/build/project-validation.test.ts`: template excluded (X01) and a renamed copy builds (X02, SC-003). See fail.
- [x] T027 [US2] Update the `src/content.config.ts` loader pattern to `["**/*.{md,mdx}", "!**/_*"]` and the route duplicate-file glob in `src/pages/projects/[slug].astro` to exclude `_` files (research R3); create `src/content/projects/_template.mdx` and `src/content/projects/images/template/diagram.svg` per data-model.md. Make T026 pass.
- [x] T028 [P] [US2] Update `tests/unit/content/projects-guide.test.ts` (unit: guide names every setting, part, allowed answer; no blocks or stages) and see it fail; rewrite `docs/projects.md` for the four-part shape; update the contract-row mapping in `docs/testing.md`. Make the test pass.

---

## Phase 6: User Story 4 - Browse the project list (P2)

**Goal**: same rows and filter, tighter spacing, newest first.

- [X] T029 [US4] E2E test (e2e) in `tests/e2e/projects-fixtures.spec.ts`: newest-first order assertion, count stays 9, filter unchanged, row links at least 24 by 24 px beside the existing filter-button target check (FR-027). See fail where order differs. The smaller row spacing itself is checked at the visual layer (T038).
- [X] T030 [US4] Reduce vertical row spacing in `src/components/project/portfolio.css` (FR-021); keep `src/pages/projects/index.astro` markup. Make T029 pass. Production list/empty-state behaviour is covered by T032.

---

## Phase 7: User Story 5 - Existing projects as drafts (P2)

**Goal**: five projects in the new shape, all `draft: true`, using only current text (FR-022 mapping).

- [X] T031 [US5] Write unit tests (unit) `tests/unit/content/projects-content.test.ts` (replaces `focus-pocus.test.ts`): all five `draft: true`, "draft for review" comments kept, no removed setting, each passes schema and story check, current invitation sentence moved to `invitation`. Delete `tests/unit/content/focus-pocus.test.ts`. See fail.
- [X] T032 [US5] Build tests (build) update `tests/build/drafts.test.ts` and `tests/build/indexing.test.ts`: production lists no projects, builds no project pages, empty state, no sitemap entries, Focus Pocus on the draft list (US4-3, SC-005). See fail (Focus Pocus is still published).
- [X] T033 [P] [US5] Rewrite `src/content/projects/focus-pocus.mdx` per FR-022 (built-chapter picture keeps the part, outcome picture stays unassigned); `draft: true`; list dropped text in a scratch note.
- [X] T034 [P] [US5] Rewrite `src/content/projects/drcdev-github-io.mdx` and `flux.mdx` per FR-022; keep drafts and review comments; list dropped text.
- [X] T035 [P] [US5] Rewrite `src/content/projects/plunge-buddy.mdx` and `tempo.mdx` per FR-022; keep drafts and review comments; list dropped text. Then make T031 and T032 pass and run the whole unit project.

---

## Phase 8: Polish, baselines, verification

- [X] T036 Re-measure the five pages at 390 px (quickstart step 0), confirm each is shorter than T001, and write both tables plus the dropped-text lists from T033-T035 into `specs/014-project-four-part-story/pr-notes.md` (links dropped-text.md) for the PR body (SC-002).
- [X] T037 Run quickstart step 3 (try-a-mistake by hand on a copy of the template, delete after) and `pnpm run verify:quick`; fix failures. Confirm the budget layer (`tests/e2e/budget.spec.ts`) passes unchanged.
- [X] T038 Update macOS visual baselines with `pnpm run test:visual:update` (only `projects` and `project-story` should change; any other page diff is a regression to fix, not refresh). Review the new images against the spec, including the smaller list row spacing (US4-2).
- [X] T039 Update Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails ask Don to start it). Fallback if the table glyphs differ from CI: `visual-baselines` PR label, download the `visual-baselines-linux` artifact, commit `*-linux.png` only.
- [ ] T040 Run the full `pnpm run verify` gate (ask Don first; background wrapper under `perl alarm`, read `VERIFY_EXIT=`). Open the PR from `drc-agents` with auto-merge off and the major-change reason stated in the body.
- [ ] T041 [PREVIEW-CHECK] Don rereads each of the five rewritten drafts (Focus Pocus, drcdev-github-io, Flux, Plunge Buddy, Tempo) on the preview against the dropped-text lists: no new claims, review comments still sensible, picture placements (SC-007, FR-022).
- [ ] T042 [PREVIEW-CHECK] Don judges the table answer colours (sage/sand/rust tints), part spacing, picture beside/below layout and list row spacing on `/projects/` and the five pages at wide and phone widths, light and dark, plus what automated checks cannot judge: reading order matching the layout, meaningful alternative text and diagram descriptions, and the table scrolling in its own region on a phone (SC-007). Approves the PR; production lists no project until he publishes one.

---

## Dependencies and order

- Phase 1 first (T002 decides the plugin route). Phase 2 blocks everything. Phase 3 (US3) before Phase 4 because the route needs `comparison`. Phase 4 (US1) before Phase 5 (template builds need components). Phases 6 and 7 follow Phase 4; Phase 7 needs Phases 3 and 5. Phase 8 last.
- Within a phase, each test task precedes its implementation task; in Phase 4 all tests and fixtures (T013-T020) precede the code (T021-T025).

## Parallel examples

- Phase 2: T003, T004, T008. Phase 4: T013-T016 and T020 together, then T022-T024. Phase 7: T033-T035 (different files).

## Strategy

Deliver in phase order; US3 + US1 + US2 form the MVP (writer-safe four-part pages). Nothing merges before T041 and T042.

---

## Phase 9: Convergence

- [ ] T043 [US3] Add unit tests (primary layer: unit) to `tests/unit/content/project-story.test.ts` that a chosen option written bold-and-italic as `***Name***` and as `_**Name**_` is accepted as the one bold option (`chosen: true`, name without markers), while `*Name*` (italic only) still fails "exactly one option must be in bold". See them fail: today both bold-italic forms parse as emphasis wrapping strong and are rejected with "found 0" per FR-013 (partial)
- [ ] T044 [US3] In `checkOptions` in `src/lib/content/project-story.ts`, treat a first cell whose only child is an `emphasis` holding exactly one `strong` (and nothing else) as fully bold, the same as `strong` holding `emphasis`; keep the partly-bold rule (T08) unchanged. Make T043 pass per FR-013 (partial)
- [ ] T045 Delete the orphaned per-chapter draft mark `src/components/project/DraftMark.astro` and its test `tests/component/project/DraftMark.test.ts` (its only user, `blocks/Chapter.astro`, is gone), and drop it from the `Pill` row in `docs/design-source.md`; run the component project to confirm nothing else imports it per spec Assumptions "the per-chapter draft marks go away with the chapters" and plan: blocks deleted (unrequested)
