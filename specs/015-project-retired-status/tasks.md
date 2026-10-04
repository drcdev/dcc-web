# Tasks: Retired status for projects

**Input**: `specs/015-project-retired-status/` (spec.md, plan.md, data-model.md, contracts/, research.md, quickstart.md)

**Major change (Principle III)**: new filled mauve pill tone. Auto-merge stays off; the `[PREVIEW-CHECK]` tasks are for Don.

**Tests are mandatory (Constitution Principle I).** Every test task is written BEFORE the code it covers and must be run and seen to fail (RED) first. Each test task names ONE primary layer (`docs/testing.md` "Where a test goes"); a second layer carries its reason in the task text. Test files must not contain `specs/...` path literals (drift guard); cite contract row ids (RP01 to RP05, S02) instead.

Format: `- [ ] T### [P?] [Story?] Description with path`. `[P]` = different files, no dependency on an open task.

Node: run `node -v` first; if not the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the same Bash command (CLAUDE.md).

## Phase 1: Setup and schema (blocking; serves all stories)

- [ ] T001 [P] Layer unit. Write `tests/unit/content/project-status.test.ts` (new): `projectStatuses` has the four values, `statusLabel("retired")` is "Retired", `statusTone("retired")` is `mauve`, other statuses keep their current labels and tones. Run it, see it fail.
- [ ] T002 [P] Layer unit. Extend `tests/unit/content/project-schema.test.ts`: status loop accepts `retired`; S02 phrase list names `shipped`, `experiment`, `in-progress`, `retired`; add "RP01" (replacedBy on non-retired), "RP02" (both, neither, `{}`, href beside project), "RP03" (non-https or host-less href, unknown key, empty or whitespace name, null). Run, see fail.
- [ ] T003 [P] Layer unit. Create `tests/unit/content/project-replacement.test.ts` (new): "RP04" missing project (message has file, `replacedBy`, id, `src/content/projects/<id>.mdx`), "RP05" self reference ("this project itself"), drafts count as files; `resolveReplacement`: published on-site link, draft target in production (name, no link), draft target with drafts shown (link), off-site `name` plus `href`, name only, none. Run, see fail.
- [ ] T004 Layer unit. Implement `src/lib/content/project-status.ts` (`projectStatuses`, `ProjectStatus`, `statusLabel`, `statusTone`) so T001 passes.
- [ ] T005 Layer unit. Update `src/content/schemas/project.ts`: `status: z.enum(projectStatuses)`, strict `replacedBy` object (`project: reference("projects")`, `name`, `href`), refinements RP01 and RP02 per data-model.md; T002 passes.
- [ ] T006 Layer unit. Implement `src/lib/content/project-replacement.ts` (`checkReplacements`, `resolveReplacement`, `projectFileError` use) so T003 passes.
- [ ] T007 [P] Layer unit. Extend `tests/unit/content/project-order.test.ts` with one case: a retired project sorts by date like any status (FR-002). It cannot go RED because no sorting code changes; keep it as a guard.
- [ ] T008 Layer unit. Update `tests/unit/content/projects-guide.test.ts`: values list includes `retired`, names `replacedBy`, `project`, `name`, `href` and the RP error classes; walker treats the `reference()` value as a leaf (still demands every real setting). See it fail, then update `docs/projects.md` (`status` row lists `retired`, `replacedBy` row with both forms, RP01 to RP05) and the walker until green.
- [ ] T009 Layer unit. Update `tests/unit/content/project-template.test.ts` to require the template to document `retired` and `replacedBy` and still pass the schema (FR-011); see fail; then update the optional-details comment in `src/content/projects/_template.mdx` (front matter unchanged).

**Checkpoint**: schema, status module, resolver, guide and template green (unit project).

## Phase 2: User Story 1 - A reader sees that a project is retired (P1)

**Goal**: Retired pill on the index row and story header; fixed note inside the header.
**Independent test**: the retired fixture row and story show the Retired pill and note; no other status changes.

- [ ] T010 [P] [US1] Layer component. Add a `mauve` case to `tests/component/project/Pill.test.ts` (same shape as other tones, `data-tone="mauve"`). See fail.
- [ ] T011 [P] [US1] Layer component. Add `["retired", "Retired"]` to `tests/component/project/StatusPill.test.ts` (`data-status="retired"`, tone mauve, no role/aria). See fail.
- [ ] T012 [P] [US1] Layer component. Extend `tests/component/project/StoryHeader.test.ts`: exact note wording for no replacement, `{name}`, `{name, href}`; no note on other statuses; on a retired draft the draft notice is before the header and the note after the meta; link text is the name, same tab (no `target`), underlined; name-only has no `<a>`; no role/aria on pill or note; no `<script>`. The existing "no in-page links" test stays unchanged. See fail.
- [ ] T013 [P] [US1] Layer component. Extend `tests/component/project/ProjectRow.test.ts`: retired project shows the Retired pill, same `data-themes`, title link unchanged. See fail.
- [ ] T014 [US1] Layer unit. Add to `tests/unit/content/projects-content.test.ts` the assertion that Tempo is `retired`, `replacedBy` is `{ name: "Cadence" }` with no href, and it is still published (slug and `published` lists unchanged). See fail (serves US3 too).
- [ ] T015 [US1] Add the `mauve` tone to `src/components/Pill.astro` (classes per data-model.md); T010 green.
- [ ] T016 [US1] Update `src/components/project/StatusPill.astro` to use `ProjectStatus`, `statusLabel`, `statusTone`; type `status` in `src/components/project/ProjectRow.astro`; T011, T013 green.
- [ ] T017 [US1] Render `<p data-retired-note>` in `src/components/project/StoryHeader.astro` (takes `status: ProjectStatus`, `replacement?`) per contracts/pages-dom.md; add the `[data-retired-note]` style from existing mauve tokens in `src/components/project/portfolio.css`; pass `replacement?` through `src/layouts/ProjectLayout.astro`; T012 green.
- [ ] T018 [US1] Layer build. Write first: add `tests/fixtures/projects/broken/RP04-missing-replacement.mdx` (retired draft naming a missing project) and the run "RP04: a retired draft naming a missing project fails a production build" in `tests/build/project-validation.test.ts` (message names file and id, no canary; row 03 phrase list may add `retired`). Second layer beyond T003, because a unit test cannot show `checkReplacements` is wired into the real `astro build` (contracts/build-errors.md). See fail before T019.
- [ ] T019 [US1] Wire `src/pages/projects/[slug].astro`: after the `validateProjectStory` loop call `checkReplacements(all)`; per path compute `resolveReplacement(entry, all, publishedIds)` and pass it as a prop to `ProjectLayout`; T018 green.
- [ ] T020 [US1] Create `tests/fixtures/projects/retired.mdx` (retired, date 2025-01-01, all four parts, `replacedBy: { project: minimal }`; older than every existing fixture so it sorts last).
- [ ] T021 [US1] Layer build. Extend `tests/build/drafts.test.ts` (no new build): add a retired fixture pointing `project: minimal` at `draft`; production build lists the retired row with the Retired pill and builds `/projects/retired/` with all four parts and a note naming "Draft project" without a link; preview build links `/projects/draft/` (FR-002, FR-003, FR-007, SC-001). See fail before T015 to T019, green after.
- [ ] T022 [US1] Layer E2E (fixture counts). Update `tests/e2e/projects-fixtures.spec.ts`: `ALL` 8 to 9; "lists projects newest first" list gains `"retired"` last (update the dates comment and header comment). Tooling and AI-integration counts stay.
- [ ] T023 [P] [US1] Layer E2E (theme-tokens; computed colours only a browser shows and pixels cannot name). In `tests/e2e/theme-tokens.spec.ts` add a `/projects/retired/` entry with a `[data-status="retired"]` probe: background `mauve-50`/`mauve-800`, color `mauve-950`/`mauve-100`, border `mauve-800`/`mauve-300` (light/dark). See fail before T015.
- [ ] T024 [P] [US1] Layer accessibility. In `tests/e2e/a11y.spec.ts` "portfolio states" add "the retired fixture story" (`/projects/retired/`) and "the full fixture index" (`/projects/`), both widths and themes (SC-004, FR-004a, FR-012, FR-013).

**Checkpoint**: unit, component, build and fixture-site e2e green; story US1 works alone.

## Phase 3: User Story 2 - A reader follows the link to the replacement (P2)

**Goal**: The note's replacement name links to the replacement story in one click.

- [ ] T025 [US2] Layer E2E (a journey only a browser shows). Add a test in `tests/e2e/projects-fixtures.spec.ts` on `/projects/retired/`: click the note's link and land on `/projects/minimal/` in the same tab (SC-002, US2-1). Written and seen to fail before T017 and T019 (run against the fixture site on port 4322); resolver and markup variants are already covered at unit and component layers (T003, T012), so this test covers only the click.

**Checkpoint**: link journey green.

## Phase 4: User Story 3 - Don marks Tempo retired (P3)

**Goal**: Tempo shows as retired, replaced by Cadence, no link.

- [ ] T026 [US3] Content: set `status: retired` and `replacedBy: { name: Cadence }` (no href) in `src/content/projects/tempo.mdx`; update the body comment per research R8. T014 goes green. Confirm `tests/build/indexing.test.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/pages.spec.ts` need no change (Tempo stays at `/projects/tempo/`).
- [ ] T027 [US3] [PREVIEW-CHECK] Don reads `/projects/` and `/projects/tempo/` on the preview deployment in both themes: Retired pill, retired note ("Retired. I no longer use or maintain this project. It was replaced by Cadence."), no link.

## Phase 5: Visual baselines and polish

- [ ] T028 Layer visual. In `tests/e2e/visual.spec.ts` add `"retired"` to `FIXTURE_PROJECTS`; add subjects `project-row-retired` (path `/projects/`, locator `li[data-project="retired"]`, `wait: onlyFixtureRows`) and `retired-story-header` (path `/projects/retired/`, locator `header[data-story-header]`); update the header comment ("50 images per platform" to 58, "eight fixture-site subjects" to ten). The run fails on missing snapshots until T029.
- [ ] T029 Update visual baselines on macOS: `pnpm run test:visual:update` (via nvm and the pnpm shim, in the background; not while Docker builds dist). Prediction: exactly 16 new images, 8 per platform (`project-row-retired-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png` and `retired-story-header-{phone,desktop}-{dark,light}-visual-{darwin,linux}.png`) and NO existing image changes. Any modified existing image is a regression to fix, not a baseline to refresh.
- [ ] T030 Update Linux baselines: `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it; fallback is the `visual-baselines` PR label and the `visual-baselines-linux` artifact, copying only `*-linux.png`). `git status` must then show exactly the 16 new files and no modified ones (baselines go from 100 to 116 images).
- [ ] T031 [P] Docs: `docs/testing.md` (contract-row mapping gains RP01 to RP05 and the changed S02; visual coverage notes the two new subjects); `docs/design-source.md` (`Pill` row mentions the Retired-only filled mauve tone).
- [ ] T032 Run the checks in `specs/015-project-retired-status/quickstart.md`, then ask Don before the full `pnpm run verify` (one run, wrapper in background under perl alarm, `ASTRO_PREVIEW_BACKGROUND=1`, lsof port 4321 first); read `VERIFY_EXIT=`.
- [ ] T033 [PREVIEW-CHECK] Don judges the filled mauve pill and the note contrast in both themes and at phone width on the preview deployment (dark fill mauve-800 is a planning choice; Don may ask for 900).

## Dependencies

- Phase 1 blocks all others. Within it: T001 to T003 and T007 first (RED), then T004 to T006, then T008, T009.
- Phase 2: tests T010 to T014 and T018 before code T015 to T017 and T019; T020 before T021 to T025; T022 to T024 need T015 to T019.
- Phase 3 needs Phase 2. Phase 4 needs Phase 1 (T014 first); the preview needs Phase 2 code.
- Phase 5: T028 then T029 then T030, after all code and fixtures are final (a later template change invalidates baselines).

## Parallel examples

- Phase 1 RED: T001, T002, T003, T007 together. Phase 2 RED: T010 to T013 together; T023 and T024 together.

## Strategy

MVP is Phase 1 plus User Story 1 (schema, pill, note, fixture). Then the US2 journey, the Tempo content, then baselines. Auto-merge off (major change).
