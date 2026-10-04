# Tasks: Retired status for projects

**Input**: `specs/015-project-retired-status/` (spec.md, plan.md, data-model.md, contracts/, research.md, quickstart.md)

**Major change (Principle III)**: new filled mauve pill tone. Auto-merge stays off; the `[PREVIEW-CHECK]` task (T032) is for Don.

**Tests are mandatory (Constitution Principle I).** Every test task is written BEFORE the code it covers and must be run and seen to fail (RED) first. Each test task names ONE primary layer (`docs/testing.md` "Where a test goes"); a second layer carries its reason in the task text. Test files must not contain `specs/...` path literals (drift guard); cite contract row ids (RP01 to RP05, S02) instead.

Format: `- [ ] T### [P?] [Story?] Description with path`. `[P]` = different files, no dependency on an open task.

Node: run `node -v` first; if not the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the same Bash command (CLAUDE.md).

## Phase 1: Setup and schema (blocking; serves all stories)

- [x] T001 [P] Layer unit. Write `tests/unit/content/project-status.test.ts` (new): `projectStatuses` has the four values, `statusLabel("retired")` is "Retired", `statusTone("retired")` is `mauve`, other statuses keep their current labels and tones. Run it, see it fail.
- [x] T002 [P] Layer unit. Extend `tests/unit/content/project-schema.test.ts`: status loop accepts `retired`; S02 phrase list names `shipped`, `experiment`, `in-progress`, `retired`; add "RP01" (replacedBy on non-retired), "RP02" (both, neither, `{}`, href beside project), "RP03" (non-https or host-less href, unknown key, empty or whitespace name, null). Run, see fail.
- [x] T003 [P] Layer unit. Create `tests/unit/content/project-replacement.test.ts` (new): "RP04" missing project (message has file, `replacedBy`, id, `src/content/projects/<id>.mdx`), "RP05" self reference ("this project itself"), drafts count as files; `resolveReplacement`: published on-site link, draft target in production (name, no link), draft target with drafts shown (link), off-site `name` plus `href`, name only, none. Run, see fail.
- [x] T004 Layer unit. Implement `src/lib/content/project-status.ts` (`projectStatuses`, `ProjectStatus`, `statusLabel`, `statusTone`) so T001 passes.
- [x] T005 Layer unit. Update `src/content/schemas/project.ts`: `status: z.enum(projectStatuses)`, strict `replacedBy` object (`project: reference("projects")`, `name`, `href`), refinements RP01 and RP02 per data-model.md (RP03 comes from the strict object, `requiredText` and `httpsUrl`); T002 passes.
- [x] T006 Layer unit. Implement `src/lib/content/project-replacement.ts` (`checkReplacements`, `resolveReplacement`, `projectFileError` use) so T003 passes.
- [x] T007 [P] Layer unit. Extend `tests/unit/content/project-order.test.ts` with one case: a retired project sorts by date like any status (FR-002). It cannot go RED because no sorting code changes (the behaviour already holds and there is no implementation task for it); keep it as a guard.
- [x] T008 Layer unit. Update `tests/unit/content/projects-guide.test.ts`: values list includes `retired`, names `replacedBy`, `project`, `name`, `href` and the RP error classes; walker treats the `reference()` value as a leaf (still demands every real setting). See it fail, then update `docs/projects.md` (`status` row lists `retired`, `replacedBy` row with both forms, RP01 to RP05) and the walker until green.
- [x] T009 Layer unit. Update `tests/unit/content/project-template.test.ts` to require the template to document `retired` and `replacedBy` and still pass the schema (FR-011); see fail; then update the optional-details comment in `src/content/projects/_template.mdx` (front matter unchanged).

**Checkpoint**: schema, status module, resolver, guide and template green (unit project).

## Phase 2: User Story 1 - A reader sees that a project is retired (P1)

**Goal**: Retired pill on the index row and story header; fixed note inside the header.
**Independent test**: the retired fixture row and story show the Retired pill and note; no other status changes.

Every test in this phase (T010 to T020) is written and seen to fail before the fixture (T021) and the code (T022 to T025). The US2 link journey (T020) sits here because the code that makes it pass (T024, T025) is shared with US1.

- [x] T010 [P] [US1] Layer component. Add a `mauve` case to `tests/component/project/Pill.test.ts` (same shape as other tones, `data-tone="mauve"`). See fail.
- [x] T011 [P] [US1] Layer component. Add `["retired", "Retired"]` to `tests/component/project/StatusPill.test.ts` (`data-status="retired"`, tone mauve, no role/aria). See fail.
- [x] T012 [P] [US1] Layer component. Extend `tests/component/project/StoryHeader.test.ts`: exact note wording for no replacement, `{name}`, `{name, href}`; no note on other statuses; on a retired draft the draft notice is before the header and the note after the meta; link text is the name, same tab (no `target`), underlined; name-only has no `<a>`; no role/aria on pill or note; no `<script>`. The existing "no in-page links" test stays unchanged. See fail.
- [x] T013 [P] [US1] Layer component. Extend `tests/component/project/ProjectRow.test.ts`: retired project shows the Retired pill, same `data-themes`, title link unchanged. See fail.
- [x] T014 [US1] Layer build. Add `tests/fixtures/projects/broken/RP04-missing-replacement.mdx` (retired draft naming `no-such-project`) and the run "RP04: a retired draft naming a missing project fails a production build" in `tests/build/project-validation.test.ts` (message names file and id, no canary). Second layer beyond T003, because a unit test cannot show `checkReplacements` is wired into the real `astro build` (contracts/build-errors.md). In the same file the existing row 03 phrase list gains `retired` (contract S02 changed; it already passes because T005 is in, and guards the message). See the RP04 run fail.
- [x] T015 [US1] Layer build. Extend `tests/build/drafts.test.ts` (no new build): add `{ from: "retired.mdx", replace: [["project: minimal", "project: draft"]] }` to its `projects` list, so in these two builds the retired fixture points at the draft fixture; the production build lists the retired row with the Retired pill and builds `/projects/retired/` with all four parts and a note naming "Draft project" without a link; the preview build links `/projects/draft/` (FR-002, FR-003, FR-007, SC-001). See fail.
- [x] T016 [US1] Layer E2E (fixture counts). Update `tests/e2e/projects-fixtures.spec.ts`: `ALL` 8 to 9; "lists projects newest first" list gains `"retired"` last (update the dates comment and header comment). Tooling and AI-integration counts stay. See fail (8 rows) until T021.
- [x] T017 [P] [US1] Layer E2E (theme-tokens; computed colours only a browser shows and pixels cannot name). In `tests/e2e/theme-tokens.spec.ts` add a `/projects/retired/` entry with a `[data-status="retired"]` probe: background `mauve-50`/`mauve-800`, color `mauve-950`/`mauve-100`, border `mauve-800`/`mauve-300` (light/dark). See fail.
- [x] T018 [P] [US1] Layer accessibility. In `tests/e2e/a11y.spec.ts` "portfolio states" add "the retired fixture story" (`/projects/retired/`) and "the full fixture index" (`/projects/`) to the axe states, both widths and themes (SC-004, FR-004a, FR-012); and add, for `/projects/retired/`, the no-horizontal-scroll check at 320 CSS px and at 200% zoom with the existing `expectNoHorizontalScroll` helper (FR-013; the TEMPLATES loop that runs that check does not reach the fixture site). See fail.
- [x] T019 [P] [US1] Layer visual. In `tests/e2e/visual.spec.ts` add `"retired"` to `FIXTURE_PROJECTS`; add subjects `project-row-retired` (path `/projects/`, locator `li[data-project="retired"]`, `wait: onlyFixtureRows`) and `retired-story-header` (path `/projects/retired/`, locator `header[data-story-header]`); update the header comment ("50 images per platform" to 58, "eight fixture-site subjects" to ten). It fails on missing snapshots until T028 and T029.
- [x] T020 [P] [US2] Layer E2E (a journey only a browser shows). Add a test in `tests/e2e/projects-fixtures.spec.ts` on `/projects/retired/`: click the note's link and land on `/projects/minimal/` in the same tab (SC-002, US2-1). Run against the fixture site (port 4322) and see it fail; resolver and markup variants are already covered at unit and component layers (T003, T012), so this test covers only the click.
- [x] T021 [US1] Fixture data (no layer; it is test input). Create `tests/fixtures/projects/retired.mdx` (title "Retired project", `status: retired`, `themes: [Automation]`, `date: 2025-01-01`, all four parts copied from `minimal.mdx`, `replacedBy: { project: minimal }`, not a draft; older than every existing fixture so it sorts last). T016 goes green; T015, T017, T018 and T020 now fail on the missing pill and note instead of a missing page.
- [x] T022 [US1] Add the `mauve` tone to `src/components/Pill.astro` (classes per data-model.md); T010 green.
- [x] T023 [US1] Update `src/components/project/StatusPill.astro` to use `ProjectStatus`, `statusLabel`, `statusTone`; type `status` in `src/components/project/ProjectRow.astro`; T011, T013 green.
- [x] T024 [US1] Render `<p data-retired-note>` in `src/components/project/StoryHeader.astro` (takes `status: ProjectStatus`, `replacement?`) per contracts/pages-dom.md; add the `[data-retired-note]` style from existing mauve tokens in `src/components/project/portfolio.css`; pass `replacement?` through `src/layouts/ProjectLayout.astro`; T012 green.
- [x] T025 [US1] Wire `src/pages/projects/[slug].astro`: after the `validateProjectStory` loop call `checkReplacements(all)`; per path compute `resolveReplacement(entry, all, publishedIds)` and pass it as a prop to `ProjectLayout`; T014, T015, T017, T018 and T020 green.

**Checkpoint**: unit, component, build and fixture-site e2e green; story US1 works alone.

## Phase 3: User Story 2 - A reader follows the link to the replacement (P2)

**Goal**: The note's replacement name links to the replacement story in one click.

No tasks of its own: the link's browser test is T020 (with the resolver cases in T003 and the markup cases in T012), and the code is T024 and T025 in Phase 2.

**Checkpoint**: link journey (T020) green.

## Phase 4: User Story 3 - Don marks Tempo retired (P3)

**Goal**: Tempo shows as retired, replaced by Cadence, no link.

- [x] T026 [US3] Layer unit. Add to `tests/unit/content/projects-content.test.ts` the assertion that Tempo is `retired`, `replacedBy` is `{ name: "Cadence" }` with no href, and it is still published (slug and `published` lists unchanged). See fail.
- [x] T027 [US3] Content: set `status: retired` and `replacedBy: { name: Cadence }` (plain-text name, no `href`, so no link; FR-009) in `src/content/projects/tempo.mdx`; update the body comment per research R8. T026 goes green. Confirm `tests/build/indexing.test.ts`, `tests/e2e/seo.spec.ts`, `tests/e2e/pages.spec.ts` need no change (Tempo stays at `/projects/tempo/`).

## Phase 5: Visual baselines and polish

- [ ] T028 Update visual baselines on macOS: `pnpm run test:visual:update` (via nvm and the pnpm shim, in the background; not while Docker builds dist). Prediction for this run: exactly 8 new `darwin` images (`project-row-retired-{phone,desktop}-{dark,light}-visual-darwin.png` and `retired-story-header-{phone,desktop}-{dark,light}-visual-darwin.png`) and NO existing image changes. Any modified existing image is a regression to fix, not a baseline to refresh.
- [ ] T029 Update Linux baselines: `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it; fallback is the `visual-baselines` PR label and the `visual-baselines-linux` artifact, copying only `*-linux.png`). Prediction: the same 8 subjects as `linux` images. `git status` must then show exactly the 16 new files (8 per platform) and no modified ones (baselines go from 100 to 116 images).
- [ ] T030 [P] Docs: `docs/testing.md` (contract-row mapping gains RP01 to RP05 and the changed S02; visual coverage notes the two new subjects); `docs/design-source.md` (`Pill` row mentions the Retired-only filled mauve tone).
- [ ] T031 Run the checks in `specs/015-project-retired-status/quickstart.md`, then ask Don before the full `pnpm run verify` (one run, wrapper in background under perl alarm, `ASTRO_PREVIEW_BACKGROUND=1`, lsof port 4321 first); read `VERIFY_EXIT=`.
- [ ] T032 [PREVIEW-CHECK] Don looks at `/projects/` and `/projects/tempo/` on the preview deployment in both themes and at phone width and judges how the filled mauve Retired pill and the retired note look (the dark fill mauve-800 is a planning choice; Don may ask for 900). The wording, the missing link and the colours are already proven by T012, T017, T018 and T026, so this check is only Don's visual approval of the design-system change (Principle III).

## Dependencies

- Phase 1 blocks all others. Within it: T001 to T003 and T007 first (RED), then T004 to T006, then T008, T009.
- Phase 2: tests T010 to T020 first (all RED), then the fixture T021, then code T022 to T025.
- Phase 3 has no tasks; it is done when T020 is green. Phase 4 needs Phase 1 (T026 before T027); the preview check needs Phase 2 code and T027.
- Phase 5: T028 then T029, after all code and fixtures are final (a later template change invalidates baselines); T032 once the PR's preview deployment exists.

## Parallel examples

- Phase 1 RED: T001, T002, T003, T007 together. Phase 2 RED: T010 to T013 together; T017 to T020 together.

## Strategy

MVP is Phase 1 plus User Story 1 (schema, pill, note, fixture). Then the US2 journey (green from Phase 2), the Tempo content, then baselines. Auto-merge off (major change).
