---

description: "Task list for the interactive career timeline (feature 041)"
---

# Tasks: Interactive career timeline

**Input**: Design documents from `/specs/041-career-timeline/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: MANDATORY (constitution Principle I and Development Workflow). Test tasks come before the implementation they cover and are seen to fail first. Each test task names its one primary layer (`docs/testing.md` "Where a test goes") and gives the written reason for any second layer.

**Organization**: Grouped by user story. US1 (P1) is the MVP; US2 (P2) adds links to posts and awards; US3 (P3) adds the filter.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1, US2, US3
- `[PREVIEW-CHECK]`: cannot be verified locally; stays unticked and goes in the PR body (`.claude/skills/_shared/preview-check.md`)
- Toolchain: run `node -v` first; if it is not the `.nvmrc` version, `source ~/.nvm/nvm.sh && nvm use` in the same Bash command as every `pnpm`, `astro` or `playwright` call (CLAUDE.md "Local toolchain").

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Constants and fixture files every later phase reads

- [X] T001 Add `"career step"` to `ErrorKind` in `src/lib/content/errors.ts` so `contentError` can prefix `Career step file src/content/career/<id>.yaml:` (contracts/build-errors.md)
- [X] T002 [P] Create valid fixture step files in `tests/fixtures/career/valid/*.yaml`: neutral roles and organizations, posts naming fixture posts `every-part` and `text-only`, all three categories, one award without a link, one step with every detail part, last step `end: present` with no `nextMove`. Name no real role, post or award (`no-real-content-in-tests` guard).
- [X] T003 [P] Create broken fixture step files in `tests/fixtures/career/broken/` (one file per build run: missing `scope` for the T01 sync run; a latest step that does not end `present` for the T09 build run, contracts/build-errors.md "Wiring")

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `career` collection, its schema and the fixture-site harness. No story can render until this exists. Fixture builds must not pick up real step files, because those name real posts (research R12, the main risk).

**CRITICAL**: No user story work starts until this phase is complete.

### Tests first (unit layer)

- [X] T004 [P] Unit test, primary layer **Unit**, for schema rows T01-T07 and T12 in `tests/unit/content/career-schema.test.ts` (one case per row, row id in the title; strict keys, `YYYY-MM` and `present`, end not before start, empty lists, award shape and https `href`, duplicate post, text limits 120/300/200). Run it and see it fail.
- [X] T005 [P] Unit test, primary layer **Unit**, for the harness in `tests/helpers/content.ts`: the helper reads `src/content/career/` and returns the current role by rule (latest start), naming no literal. Put it in `tests/unit/content/career-launch.test.ts` as the "reads the real files" skeleton (real-content rules are added in T018). See it fail.
- [X] T006 Build test, primary layer **Build (`sync`)**, in `tests/build/career-timeline.test.ts`: `buildFixtureSite(..., { mode: "sync" })` with the T01 broken fixture from T003 fails and the error names the step file and field (proves the schema is wired in `src/content.config.ts`; a unit test cannot see the call site). Depends on T008. See it fail.

### Implementation

- [X] T007 Create the strict step schema in `src/content/schemas/career.ts` per data-model.md (trimmed non-empty text, limits, `YYYY-MM`, `present`, end-not-before-start refine, list-not-empty, awards object with https `href`, `reference("posts")[]` with duplicate refine). Makes T004 pass.
- [X] T008 Register the `career` collection (`glob()` loader, `src/content/career/*.yaml`) in `src/content.config.ts`; add an empty-safe path so no files means no steps. Makes T006 pass.
- [X] T009 Extend `tests/helpers/content.ts` to read `src/content/career/`. Makes T005 pass.
- [X] T010 Update the fixture-site harness: `tests/build/fixture-site.ts` drops real career files unless `realPosts` is set (the reading-path rule) and gains a `career` option for fixture files; `scripts/build-fixture-site.ts` swaps in `tests/fixtures/career/valid/` for the Playwright fixture site (port 4322).
- [X] T011 Run `pnpm run verify:quick`; confirm no existing test moved because of the harness change (fixture builds still pass with no career files).

**Checkpoint**: collection, schema and harness ready.

---

## Phase 3: User Story 1 - Read the career as a timeline (Priority: P1) MVP

**Goal**: The About page shows the career steps in order as closed native disclosures; opening one shows its scope and detail parts and the Achievements and Leadership lists; works without JavaScript.

**Independent Test**: Open the fixture `/about/`, check the steps run earliest to latest, open one, read its parts, close it, repeat with JavaScript disabled and with the keyboard.

### Tests for User Story 1 (write first, see them fail)

- [X] T012 [P] [US1] Unit test, primary layer **Unit**, in `tests/unit/content/career.test.ts`: `orderSteps()` sorts by start then id (C1), `formatPeriod()` gives "Oct 2014 – Sep 2016" (en dash) and "present" forms, the last step is the current role, C2 rows T08 and T09 from `checkCareer()` (row ids in titles).
- [X] T013 [P] [US1] Component test, primary layer **Component**, in `tests/component/sections/CareerTimeline.test.ts` (Container API, `timeline` prop): ordered list in order, every step closed, summary shows role, organization and period, summary accessible name (FR-007a), detail labels only for present parts in FR-008 order, no empty headings, no next-move label on the last step, Achievements and Leadership as labelled lists, text rendered as text (no markup from a field, a line break in a field not kept, FR-003b), no inline `style` attribute anywhere (FR-017a), nothing rendered with no steps, h3 "Career" with h4 list headings.
- [X] T014 [P] [US1] E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts` on fixture `/about/`: open and close by mouse and by keyboard (Enter, Space), target size, open state announced, JavaScript-off project shows every step openable, 320 px has no sideways scroll, a keyboard-focused summary shows the site's focus outline (FR-017), print emulation shows every step open, reduced motion has no animation, forced colours keep a visible state. Only a real browser can show these.
- [X] T015 [US1] Build test, primary layer **Build (`build`)**, in `tests/build/career-timeline.test.ts`: the T09 broken fixture from T003 (latest step not `present`) fails the About page build and the message names the step file, proving `checkCareer()` runs from the page. Reason a build test: only the real build shows that the call site runs. This is the feature's only `build` run (contracts/build-errors.md "Wiring").
- [X] T016 [US1] Unit test, primary layer **Unit**, in `tests/unit/content/career-launch.test.ts`: `src/content/pages/about.mdx`, read through `tests/helpers/content.ts`, places `<CareerTimeline />` after the "About me" list and before `### Recognition`, and the list has no "Leadership" line (FR-016). Reason it is not a build test: fixture builds drop the real career files (T010) and no `test:build:content` build keeps real posts, so a built `/about/` shows no timeline; the MDX order decides placement.
- [X] T017 [US1] Unit test, primary layer **Unit**, in `tests/unit/content/job-title-only-on-about.test.ts` (FR-019): the current role's title, read through `tests/helpers/content.ts`, appears in no `src/` file except `src/content/pages/about.mdx` and `src/content/career/`; and `getCollection("career")` is called only from `src/lib/career.ts`, whose `getCareerTimeline()` is imported only by `CareerTimeline.astro` ("nothing else on the site may read the career files"). Names no literal.
- [X] T018 [US1] Unit test, primary layer **Unit**, in `tests/unit/content/career-launch.test.ts` (rules over the real files via the helper): at least one step, last is the current role and ends `present`, no `nextMove` on it, every listed post is published. No launch count and no check on which parts are filled, so adding a step or a reflection part needs no test change (FR-005b; launch text is checked by Don in T047). Names no literal. Fails until T023.

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement `src/lib/content/career.ts` (pure): `checkCareer()` for C2, `orderSteps()`, `formatPeriod()`, `buildTimeline()`; errors via `contentError("career step", ...)`. Makes T012 pass.
- [X] T020 [US1] Implement `src/lib/career.ts`: `getCareerTimeline()` reads the collection, runs `checkCareer()` and returns the timeline view (data-model.md); post resolution is stubbed until US2.
- [X] T021 [US1] Implement `src/components/sections/CareerTimeline.astro`: ordered list of `<details>`/`<summary>`, closed by default, labelled detail parts, Achievements and Leadership lists, `timeline` prop override, Tailwind theme tokens, `motion-safe:` only, print shows all open, forced-colours rules. Register in `src/components/sections/index.ts` and `src/components/sections/schemas.ts` (no-prop schema). Makes T013 and T014 pass. Consult the Astro docs MCP for component and script patterns (Principle IV).
- [X] T022 [US1] Edit `src/content/pages/about.mdx`: remove the "Leadership" line from the "About me" list and add `<CareerTimeline />` after it, before `### Recognition` (FR-016).
- [X] T023 [US1] Create the seven launch step files in `src/content/career/` named in data-model.md, content exactly as spec FR-006a (no reflection text except the one `decision`; step 5 lists no posts and steps 4 and 5 no awards until T030 adds them). Makes T016, T017 and T018 pass.
- [X] T024 [US1] Run `pnpm run verify:quick`; fix anything it reports.

**Checkpoint**: US1 works alone and is demonstrable.

---

## Phase 4: User Story 2 - Follow a step to its writing or award (Priority: P2)

**Goal**: A step lists related posts (linked, using the post's own title) and awards (name and year, optional link); a missing or draft post fails the build naming the file.

**Independent Test**: Open the step with posts and the step with awards, follow each link; break a post name and see the build fail naming the step file.

### Tests for User Story 2 (write first)

- [X] T025 [P] [US2] Unit test, primary layer **Unit**, in `tests/unit/content/career.test.ts`: C3 row T10 and C4 row T11 from `checkCareer()` (post missing; post draft in any build mode), messages carry file, field and value.
- [X] T026 [P] [US2] Component test, primary layer **Component**, in `tests/component/sections/CareerTimeline.test.ts`: a "Writing" list of links to each post's own title and href, an "Awards" list showing "Name (Year)", an award without `href` is plain text, an award with `href` is a link, lists absent when empty.
- [X] T027 [US2] No new Astro run: confirm `tests/build/career-timeline.test.ts` still holds exactly the T006 `sync` run and the T015 `build` run. Rows T10 and T11 reach the build through the call site T015 proves, and their messages (file, field, post) are proven by T025 at the unit layer (US2 scenario 4, SC-006; contracts/build-errors.md "Wiring"; build budget stays at two career runs).
- [X] T028 [US2] E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts`: on the fixture `/about/`, a post link and an award link in an opened step navigate to the right targets (a journey; link markup itself is covered at the component layer, so this only checks the journey).

### Implementation for User Story 2

- [X] T029 [US2] Extend `src/lib/content/career.ts` `checkCareer()` for C3 and C4; resolve posts to `{ title, href }` in `src/lib/career.ts` via `getPostSummaries()` and `postHref()`. Makes T025 pass.
- [X] T030 [US2] Render the Writing and Awards lists in `src/components/sections/CareerTimeline.astro`; add the awards (step 4 linked to the same CCHL articles the Recognition section uses; step 5 unlinked) and step 5's four related posts to the launch files in `src/content/career/` per spec FR-006a. Makes T026 and T028 pass.
- [X] T031 [US2] Run `pnpm run verify:quick`.

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 - Filter the timeline by theme (Priority: P3)

**Goal**: A progressively enhanced filter (All, Achievements, Leadership, Awards; used categories only) opens and highlights matching steps, collapses and mutes the rest (first built as a dot-pattern dither, replaced in Phase 7), and announces a count.

**Independent Test**: With JavaScript on, choose a category and confirm matching steps open with highlighted items and the rest are muted but readable and openable; choose All and everything resets.

**Note (2026-10-15)**: the dot-pattern dither and `data-dithered` built in T032-T039 are superseded by Phase 7 (spec FR-011, FR-011a, research R8). These ticked tasks record what was built; Phase 7 changes it.

### Tests for User Story 3 (write first)

- [X] T032 [P] [US3] Unit test, primary layer **Unit**, in `tests/unit/content/career-filter.test.ts`: `usedCategories()` (only used, fixed order), `matchingSteps()`, `statusText()` (singular for 1, plural otherwise, "Showing all N roles."), `applyChoice(current, next, steps)` (fresh open/dither/match plan for every step whatever was opened by hand; `null` for the already-selected choice, so nothing changes and nothing is announced).
- [X] T033 [P] [US3] Component test, primary layer **Component**, in `tests/component/sections/CareerTimeline.test.ts`: filter group and status line are `hidden` in served HTML, only used categories offered, All first and selected, no filter or status with no used category, `data-*` hooks present.
- [X] T034 [US3] E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts`: filter journey (matching steps open, items `data-match`, others closed and dithered but visible and openable), status line empty on load and filled only after a change, status text, All resets hand-opened steps, focus stays on the pressed button and moves to the summary when its step closes around it, no filter or status shown with JavaScript off, no layout shift on reveal, nothing written to storage or address, no animation under reduced motion, a dithered summary keeps a visible focus outline, print emulation with a category chosen shows every step open with no dither, highlight, filter or status (FR-018), and a theme switch with a category chosen keeps the filter state.
- [X] T035 [US3] Accessibility test, primary layer **Accessibility** (second layer after the existing idle `/about/` entry in `a11y.spec.ts`), in `tests/e2e/career-timeline.a11y.spec.ts`: axe with each offered category chosen and with a dithered step opened by hand, light and dark, phone and desktop (SC-004). Reason for the second layer: the filtered markup and dither exist only after a press, as with the questions panel states.
- [X] T036 [US3] Visual test, primary layer **Visual**, in `tests/e2e/visual.spec.ts`: element shots `career-timeline-{phone,desktop}-{light,dark}` of the fixture timeline with one category chosen so an open highlighted step and a dithered step are in frame (FR-021). Fails until baselines exist (T044, T045).

### Implementation for User Story 3

- [X] T037 [P] [US3] Implement `src/lib/content/career-filter.ts` (pure): `usedCategories()`, `matchingSteps()`, `statusText()`, `applyChoice()`. Makes T032 pass.
- [X] T038 [US3] Add the filter markup (hidden), status line (`aria-live`, not announced on load) and dither/highlight styles (CSS `radial-gradient` on the summary row with text on a solid backing, lower role weight, dashed border in forced colours, none in print) to `src/components/sections/CareerTimeline.astro`. Makes T033 pass.
- [X] T039 [US3] Add the `<career-timeline>` custom element in the component's processed `<script>` (same pattern as `src/components/ProjectFilter.astro`): reveal on run (status line left empty), single choice, apply `applyChoice()` to every step, focus rules FR-013a/b, `textContent` only, no storage. Makes T034, T035 pass. Consult Astro docs MCP for script handling and `security.csp` hashing.
- [X] T040 [US3] Run `pnpm run verify:quick` and `pnpm run test:budget` for `/about/`; confirm no budget regression.

**Checkpoint**: all three stories work.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T041 [P] Update `docs/testing.md`: feature 041 section, contract-row to test mapping (T01-T13), build budget plus two runs, new visual subjects in "Visual coverage".
- [X] T042 Run `pnpm run lint`, `pnpm run typecheck` and `pnpm run test:unit`; fix findings. Confirm `no-real-content-in-tests` and `content-tier` guards are green.
- [X] T043 Validate `specs/041-career-timeline/quickstart.md` by hand against `pnpm run build` and the preview server.
- [X] T044 Update the macOS visual baselines with `pnpm run test:visual:update` (nvm + shim wrapper in the background, see `.claude/skills/_shared/visual-baselines.md`); commit only the new `career-timeline-*-darwin.png`. Any other image that moves is a regression to fix, not accept.
- [X] T045 Update the Linux visual baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it with an `AskUserQuestion` whose question text carries the instruction); commit only the new `*-linux.png`. Run after T044, not alongside Docker builds.
- [X] T046 Run `node scripts/ci/changed-paths.ts --base origin/main` and the checks for the tier it prints; ask Don before a full `pnpm run verify`.
- [ ] T047 [PREVIEW-CHECK] Don reads the real `/about/` on the preview in light and dark, phone and desktop: wording of the seven steps, legibility of the chosen muted treatment (T060), the disclosure marker on the role title's line (FR-007b), highlight clarity, that the Leadership line is gone and "Recognition" is unchanged word for word, 3:1 contrast of the disclosure marker and filter button edges, and no clipped or overlapping text at 200% text zoom (FR-017).
- [ ] T048 [PREVIEW-CHECK] Don checks print preview of `/about/`, the page with a screen reader (state announcements, status line), and every linked post and award target on the preview.

---

## Phase 7: Review round — non-matching treatment

**Purpose**: Don's 2026-10-15 preview review (spec Clarifications, session 2026-10-15): drop the dot-pattern dither, put the disclosure marker inline with the role title (FR-007b), and show two muting treatments (FR-011, FR-011a) as separate commits so each has its own Cloudflare commit preview URL. No runtime switch code. Don picks one; the other is reverted.

**Independent Test**: On each variant's commit preview, choose a category on `/about/`: matching steps open with the marker on the role title's line; non-matching steps are collapsed, visibly muted, readable at AA contrast and carry their variant's non-colour cue.

**Note**: the variant commits refresh only the macOS baselines, so the Linux visual shots in CI `verify` may fail on those two commits; that is expected and is fixed by T062 after the pick. Cloudflare builds the commit previews either way.

### Inline disclosure marker and the muted state (tests first)

- [X] T049 E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts` (FR-007b): on the fixture `/about/`, at phone and desktop widths, idle, with a category chosen (a matching and a muted step), opened and closed, and with JavaScript off, the summary's disclosure marker sits on the same line as the first line of `[data-step-role]` (compare the marker's and the role's first-line boxes), and the summary's accessible name is unchanged (FR-007a). Reason E2E, not component: line placement needs real layout. See it fail on the current marker-above-title layout.
- [X] T050 Rename tests first (spec FR-011, research R7/R8): in `tests/unit/content/career-filter.test.ts` the step plan field `dithered` becomes `muted`; in `tests/e2e/career-timeline.spec.ts`, `tests/e2e/career-timeline.a11y.spec.ts` and `tests/e2e/visual.spec.ts` every `data-dithered` becomes `data-muted`, and the E2E asserts a muted summary has no `background-image` and no `opacity` below 1 (FR-011). Primary layers as in T032/T034/T035/T036. See them fail.
- [X] T051 Implement the inline marker and the rename in `src/components/sections/CareerTimeline.astro`, `src/components/sections/career-timeline.css` and `src/lib/content/career-filter.ts`: the role title shares its first line with the marker (no block role pushed below it), `dithered` → `muted`, `data-dithered` → `data-muted`, and the `radial-gradient` dot pattern, its solid text backing and forced-colours dashed border removed. Update `docs/testing.md` wording. Makes T049 and T050 pass.

### Variant A, "Muted + side rule"

- [X] T052 E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts` (FR-011a Variant A): with a category chosen, a muted step's row has a solid background tint and a dashed left border, its role text keeps the colour of a matching step's role; a matching step has a solid left border in the accent colour; in forced colours the muted step's left border is still dashed; in print emulation neither rule nor tint shows. Contrast stays with the existing a11y layer (T035 rerun, light and dark). See it fail.
- [X] T053 Implement Variant A in `src/components/sections/career-timeline.css` (and classes in `CareerTimeline.astro` if needed) from Tailwind theme tokens: soft solid muted tint and faint dashed left timeline rule (at least 3:1 against the page background) on `li[data-muted]`, solid accent left rule on matching steps while a category is chosen, both themes, forced-colours and print rules, no `opacity`, no background image. Makes T052, T049 and T035 pass; run `pnpm run verify:quick`.
- [X] T054 Update the macOS visual baselines for Variant A with `pnpm run test:visual:update` (nvm + shim wrapper in the background, `.claude/skills/_shared/visual-baselines.md`); commit only the `career-timeline-*-darwin.png` changes. Any other image that moves is a regression to fix.
- [X] T055 Commit Variant A (T049-T054 together, conventional message naming "Variant A") and push to the PR #180 branch. Record the commit SHA and its Cloudflare commit preview URL (from the Cloudflare PR comment) in the PR body under the open `[PREVIEW-CHECK]` items. Do not arm or change auto-merge here.

### Variant B, "Compact one-line rows"

**Note (2026-10-15)**: Don picked Variant A; Variant B (T056-T059, done) was reverted after review in ae67f65.

- [X] T056 E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts` (FR-011a Variant B), replacing T052's Variant A assertions: with a category chosen, a muted step's summary lays out marker, role, organization and period on one line at desktop width (their boxes share one line), its computed font size is smaller than a matching step's, it has no background colour or image and no dashed rule; a matching step stays full size; at 320 px and 200% text zoom the muted line wraps with no sideways scroll and no clipping (FR-017); opening a muted step shows its detail at full size. Contrast stays with the a11y layer (T035 rerun, light and dark). See it fail.
- [X] T057 Implement Variant B in `src/components/sections/career-timeline.css` (and `CareerTimeline.astro` if needed), replacing the Variant A rules: one-line compact summary for `li[data-muted]` in a smaller size and a muted text token that meets 4.5:1 in both themes, no background treatment, matching steps unchanged, print shows full size. Makes T056, T049 and T035 pass; run `pnpm run verify:quick`.
- [X] T058 Update the macOS visual baselines for Variant B with `pnpm run test:visual:update` (as T054); commit only the `career-timeline-*-darwin.png` changes.
- [X] T059 Commit Variant B (T056-T058 together, conventional message naming "Variant B") as a separate commit after T055 and push. Record its SHA and Cloudflare commit preview URL in the PR body beside Variant A's.

### Pick and settle

- [X] T060 [PREVIEW-CHECK] Don opens the Variant A commit preview (T055) and the Variant B commit preview (T059), compares `/about/` with a category chosen in light and dark, phone and desktop (muted steps clearly de-emphasised yet easy to read, the non-colour cue visible, the marker on the role title's line), and picks one.
- [X] T061 Record Don's pick in spec.md Clarifications and reword FR-011, FR-011a, research R8, `contracts/timeline-markup.md` and the PR body to name only the chosen treatment (via the clarify flow).
- [X] T062 Revert the unpicked variant: if A is picked, revert the Variant B commit (`git revert`, restoring A's tests, CSS and macOS baselines); if B is picked, remove any Variant A leftovers (B already replaced A's rules and tests). Then refresh the macOS baselines (`pnpm run test:visual:update`) and the Linux baselines (`pnpm run test:visual:update:linux`, Docker; if `docker info` fails ask Don to start it with an `AskUserQuestion` whose question text carries the instruction), commit only `career-timeline-*` PNGs, run `node scripts/ci/changed-paths.ts --base origin/main` and its tier, push, and arm auto-merge after the final push (`.claude/skills/_shared/open-pr.md`).
  - Done 2026-10-15: Variant B reverted in ae67f65; unit, E2E, a11y, local-site and verify:quick green; macOS baselines unchanged; Linux career-timeline PNGs refreshed. Auto-merge is armed by the orchestrator.


## Phase 8: Reverse chronological order

**Purpose**: Don's 2026-10-15 request (spec Clarifications, session 2026-10-15, order question): the timeline lists the newest step first, the current role first and the earliest last. Ties: file name descending (FR-001). Same-day rule: the `<ol>` order is the visible order, no `reversed` attribute.

- [X] T063 [P] Unit tests, primary layer **Unit**, in `tests/unit/content/career.test.ts` and `tests/unit/content/career-launch.test.ts`: `orderSteps()` sorts by start descending, ties by id descending, whatever the input order; `buildTimeline()` puts the current role first; `checkCareer()` still rejects a latest step that does not end `present` or has a next move; the real steps run newest first and the first is the current role. Seen failing first.
- [X] T064 [P] Component test, primary layer **Component**, in `tests/component/sections/CareerTimeline.test.ts`: the ordered list holds the newest step first, no `reversed` attribute. E2E test, primary layer **E2E**, in `tests/e2e/career-timeline.spec.ts`: the steps' start dates run newest to earliest. Seen failing first.
- [X] T065 Implement the order in `orderSteps()` in `src/lib/content/career.ts` (descending; `checkCareer()` takes the first step as the current role).
- [X] T066 Run the targeted tests (career unit, component, E2E, a11y, `tests/build/local-site.test.ts`) and `pnpm run verify:quick`.
- [X] T067 Update the macOS then the Linux visual baselines for the career timeline (`.claude/skills/_shared/visual-baselines.md`) and confirm newest first with Variant A styling.
- [X] T068 Commit and push to the PR #180 branch.

## Phase 9: Vice Chair step

**Purpose**: Don's 2026-10-19 request (spec Clarifications, session 2026-10-19): end the CCHL Treasurer role in May 2026 and add the Vice Chair step (Jun 2026 – present).

- [X] T069 Set `end: "2026-05"` in `src/content/career/cchl-vancouver-island-chapter.yaml`.
- [X] T070 Add `src/content/career/cchl-vancouver-island-chapter-vice-chair.yaml` with the FR-006a scope and the one achievement; no other text. Director stays first by the file-name tie rule.
- [X] T071 Update spec, plan, quickstart, data-model and contracts to seven steps; run the career tests, the build tests and `pnpm run verify:quick`.

## Phase 10: Volunteer filter replaces Achievements

**Purpose**: Don's 2026-10-19 request (spec Clarifications, session 2026-10-19): Achievements is no longer a filter category (nearly every step has achievements, so it filtered nothing); a Volunteer category, a step-level `volunteer: true` flag, surfaces the two CCHL steps. Filter choices: All, Leadership, Awards, Volunteer.

- [X] T072 Update spec.md (Clarifications, US3, edge cases, FR-004, FR-004a, FR-005a, FR-006a, FR-009, FR-010, FR-011, FR-013, FR-020, FR-021, Key Entities, SC-003), plan.md, research R3, data-model.md, contracts (content-files, timeline-markup, build-errors T14), quickstart.md, checklists and `docs/testing.md`.
- [X] T073 [P] Schema unit test, primary layer **Unit**, in `tests/unit/content/career-schema.test.ts`: `volunteer: true` and `false` are accepted, omitted is allowed, any other value fails with "volunteer: write true, or leave the key out" (T14). Seen failing first.
- [X] T074 [P] Filter and timeline unit tests, primary layer **Unit**, in `tests/unit/content/career-filter.test.ts` and `tests/unit/content/career.test.ts`: the category list is leadership, awards, volunteer; `buildTimeline()` carries `volunteer` and offers Volunteer only when a step sets it, never Achievements; Volunteer matching opens the volunteer steps and mutes the rest; status "M of N roles are volunteer roles." and "1 of N roles is a volunteer role."; Leadership and Awards wording unchanged. Seen failing first.
- [X] T075 [P] Component test, primary layer **Component**, in `tests/component/sections/CareerTimeline.test.ts`: the buttons are All, Leadership, Awards, Volunteer; no Achievements button; a volunteer step's `data-categories` holds `volunteer`; the Achievements list still renders. Seen failing first.
- [X] T076 Fixture and E2E updates, primary layer **E2E**: mark one fixture step in `tests/fixtures/career/valid/` `volunteer: true`; `tests/e2e/career-timeline.spec.ts` and `tests/e2e/career-timeline.a11y.spec.ts` drop the Achievements choice, cover Volunteer (volunteer steps open and matching, no item highlighted, status line), and the visual shot in `tests/e2e/visual.spec.ts` chooses Leadership. Seen failing first.
- [X] T077 Implement: `volunteer` in `src/content/schemas/career.ts`; categories and `volunteer` in `src/lib/content/career.ts`; Volunteer status wording in `src/lib/content/career-filter.ts`; labels and `data-categories` in `src/components/sections/CareerTimeline.astro`; `volunteer: true` in the two CCHL step files.
- [x] T078 Run the targeted tests, `pnpm run build` (buttons All, Leadership, Awards, Volunteer; two steps with `volunteer` in `data-categories`) and `pnpm run verify:quick`.
- [x] T079 Refresh the macOS then the Linux career-timeline baselines (`.claude/skills/_shared/visual-baselines.md`), commit and push to the PR #180 branch.

---

## Dependencies & Execution Order

- Phase 1 then Phase 2 (blocks all stories). T006 needs T008; T004/T005 are written before T007/T009.
- US1 has no dependency on US2 or US3. US2 extends the files US1 creates (`src/lib/content/career.ts`, `CareerTimeline.astro`, launch files), so run it after US1. US3 extends the component, so run it after US1; it does not need US2 beyond the shared component file.
- Polish after all stories; T044 before T045; T036 passes only after T044/T045.
- Phase 8 after Phase 7: T063 and T064 first (seen failing), then T065, T066, T067 (macOS, then Linux, never concurrently), T068.
- Phase 7 after Phase 6 and in order: T049-T051, then Variant A (T052-T055, one commit), then Variant B (T056-T059, a separate later commit), then T060 (Don), T061, T062. T049 and T050 both edit `tests/e2e/career-timeline.spec.ts`, so they are not parallel. T047 and T048 are walked on the chosen variant.
- Within a story: tests, see them fail, implementation, `verify:quick`.

### Parallel opportunities

- T002/T003; T004/T005; T012/T013/T014; T025/T026; T032/T033; T019 with T012-T014 written; T037 alongside T038.
- Tasks touching `CareerTimeline.astro` or `tests/build/career-timeline.test.ts` are not parallel with each other.

### Parallel example: User Story 1 tests

```text
Task: "Unit test orderSteps/formatPeriod in tests/unit/content/career.test.ts"
Task: "Component test in tests/component/sections/CareerTimeline.test.ts"
Task: "E2E test in tests/e2e/career-timeline.spec.ts"
```

## Implementation Strategy

- **MVP**: Phases 1, 2 and 3 (US1): a readable, openable timeline with launch content. Stop and validate.
- **Incremental**: add US2 (links, post checks), then US3 (filter, muting, visuals), then Polish with baselines, then the Phase 7 review round (inline marker, Variant A and B on their own commit previews, Don picks, revert the other).
- Sibling-worktree conflicts: follow the plan's "Shared files" table; keep own `.specify/feature.json` when merging main.

## Notes

- [P] = different files, no dependency on an incomplete task.
- Reflection text is not written at launch (spec FR-006); do not invent copy.
- Never put Don's job title anywhere but the About page and the current step file (FR-019).
- Commit after each logical group; PR opens from `drc-agents` (CLAUDE.md "Merging").

## Phase 11: "Awards" reads "Recognition"

- [ ] T080 Fix the career e2e helpers: `stepsFor` must match the `|`-joined `data-categories` (the contract), and the no-Achievements test must assert no `achievements` button.
- [ ] T081 Update tests first: filter labels All, Leadership, Recognition, Volunteer; list heading "Recognition"; status "M of N roles have recognition." / "1 of N roles has recognition.".
- [ ] T082 Change the button label, the list heading and the status wording in `CareerTimeline.astro` and `career-filter.ts`; ids and the `awards` field unchanged.
- [ ] T083 Run the targeted tests and the career e2e specs, refresh the macOS then Linux career-timeline baselines, commit and push.
