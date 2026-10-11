# Tasks: Home page with a Now section and Start here reading paths

**Input**: `/specs/040-home-now-start-here/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: Mandatory (Constitution Principle I). Each test task names its one primary layer (the cheapest that can observe the behaviour, per "Where a test goes" in `docs/testing.md`) and the reason for any second layer. Tests are written and seen to fail before the implementation they cover. Contract rows (N01-N09, R01-R10 in `contracts/build-errors.md`) go in test titles, at the layer the contract names for each row. No test names a real slug (`no-real-content-in-tests` guard): real content is read through `tests/helpers/content.ts`.

**Format**: `- [ ] T### [P?] [US?] Description with file path`. `[P]` = different files, no dependency on an unfinished task.

## Phase 1: Setup

- [X] T001 Run `node -v` against `.nvmrc` (source nvm in the same command if it differs), then confirm `.reference/flux` exists in the worktree (symlink or copy from the main checkout) and `pnpm install --frozen-lockfile` is clean.
- [X] T002 Re-read `docs/testing.md` ("Where a test goes", "Real content in tests", "Visual coverage") and `.claude/skills/_shared/visual-baselines.md`; note the layer rules used by the test tasks below.

## Phase 2: Foundational (blocks every story)

**Purpose**: The fixture harnesses drop real posts and projects, so the real reading-path files would point at missing items and fail every fixture build. Land this first (plan, "Fixture builds"). Shared content-error and date plumbing also lives here.

- [X] T003 [P] Test (layer: unit): in `tests/unit/content/dates.test.ts`, cover the raw-date check shared by posts and Now: `YYYY-MM-DD` shape, real calendar day (2026-02-30 fails), and "not after the build date in UTC" (equal passes, later fails), with the clock injected. Row N02, N03.
- [X] T004 Implement the shared date helper in `src/lib/content/dates.ts` (extend or sit beside `post-dates.ts`; no change to post behaviour) and add `"now"` and `"reading path"` to `ContentKind` in `src/lib/content/errors.ts` so `contentError()` emits `Now file <path>: ...` and `Reading path file <path>: ...`. Makes T003 pass.
- [X] T005 Test (layer: build): in `tests/build/fixture-site.test.ts`, assert on the copied source trees: the Playwright fixture site's copy holds exactly the fixture Now file and the fixture reading-path files from `tests/fixtures/` (and no file copied from the real `src/content/reading-paths/`), and the default fixture harness's copy holds no real reading-path file once real posts are removed. Seen failing before T006-T008 (the Playwright fixture copy has no fixture Now or reading-path files yet). Reason for build layer: only the real harness copy shows this. It guards the real paths added in T034.
- [X] T006 [P] Create fixture content: `tests/fixtures/now/now.md` (valid, dated in the past, all four topics, one contact link, and one topic carrying a long unbroken word for the wrap checks) and `tests/fixtures/reading-paths/` with valid files pointing only at the fixture posts and projects (two paths, positions 1 and 2, one project item, one item whose title is very long), plus broken variants kept in separate subfolders (missing item, five paths, bad YAML, future-dated Now, Now with no `/contact/` link, two Now files) for the build tests.
- [X] T007 Edit `tests/build/fixture-site.ts`: when real posts or projects are removed, also delete the copied `src/content/reading-paths/*.yaml`; add a `readingPaths` option (and a `now` option) to install files from `tests/fixtures/`. Keep the default Now file unless an option replaces it.
- [X] T008 Edit `scripts/build-fixture-site.ts`: delete the copied real reading-path files, and swap in the fixture Now file and fixture reading-path files that point at the Playwright fixture site's 16 fixture posts and 5 fixture projects. (Depends on T006.) Makes T005 pass.
- [X] T009 [P] Edit `tests/helpers/content.ts` to read real reading paths (`src/content/reading-paths/`) and the real Now file (`src/content/now/now.md`), so real-content tests never name a slug.

**Checkpoint**: fixture builds survive the new content directories.

## Phase 3: User Story 1 - See what Don is doing now and what he is open to (P1)

**Goal**: The home page shows a dated Now section with four labelled topics and an "open to" line linking to `/contact/`, editable from one file.

**Independent test**: Build with a Now entry and open `/`: Now section shows its date, four topics in order and the open-to line, with JavaScript off.

### Tests (write first, see them fail)

- [ ] T010 [P] [US1] Test (layer: unit): `tests/unit/content/now-schema.test.ts` for the Now front matter schema: required `updated` (N01), not a real `YYYY-MM-DD` day (N02), after the build date in UTC with the clock injected (N03); required `workingOn`, `reading`, `mbaResearch`, `aiExperiments`, blank or whitespace fails (N04); unknown key fails and is named (N05); more than 200 characters or more than one line fails (N09); plain text accepted.
- [ ] T011 [P] [US1] Test (layer: unit): `tests/unit/content/now-body.test.ts` for `checkNowBody()`, the open-to line check: empty body or no `/contact/` link (N06), more than one paragraph or a heading (N08) all fail with the contract messages; extra links allowed when one goes to `/contact/`.
- [ ] T012 [P] [US1] Test (layer: component, Astro Container API): `tests/component/sections/Now.test.ts`: `h2` "Now" in a region labelled by it; `Updated <time datetime="YYYY-MM-DD">October 1, 2026</time>`; a `<dl>` with the labels "Working on", "Reading", "MBA research", "AI experiments" in that order, each paired with its text; open-to paragraph with a `/contact/` link; no `<script>`. Rows from `contracts/home-sections.md`.
- [ ] T013 [US1] Test (layer: build): `tests/build/home-sections.test.ts` (Now part): real `astro build` fails with the named message for a future-dated Now (N03), a Now body with no `/contact/` link (N06) and zero or two Now files (N07); a valid fixture Now builds and `/` HTML contains the Now section. Reason for build layer: N03 and N06 prove the schema date check and `checkNowBody()` are wired into the real build (their rules are unit-tested in T010-T011); N07 and collection loading only show in the real build. Must not name a real slug.
- [ ] T014 [US1] Test (layer: e2e, real browser): create `tests/e2e/home.spec.ts` on the fixture site (port 4322; its home page is the real `index.mdx` with the fixture Now): the Now section sits after the intro and directly before Recent writing; the home page text has no "What I do" heading and no mention of advisory work or workshops (FR-016); the Now contact link is an inline text link that navigates to `/contact/`; the Now section is readable with JavaScript disabled; no horizontal scroll and no clipped Now text at 320 px, at 200% zoom and with WCAG 1.4.12 text-spacing overrides (the fixture topic with a long unbroken word wraps); with forced colours emulated, the Now link and its focus indicator stay visible (FR-018). Reason for e2e layer: rendered order with the intro, layout, navigation and forced colours only show in a browser.

### Implementation

- [ ] T015 [P] [US1] Create `src/content/schemas/now.ts`: the strict Zod front matter schema (date check from T004, topic limits, custom error text per `contracts/build-errors.md`) and the pure `checkNowBody()` (N06, N08). Makes T010, T011 pass.
- [ ] T016 [US1] Add the `now` collection (`glob()` loader on `src/content/now/*.md`, schema from T015) to `src/content.config.ts`.
- [ ] T017 [US1] Create `src/lib/now.ts` with `getNow()`: exactly one entry (N07 error otherwise), runs `checkNowBody()` on the entry body (the collection schema sees only front matter), and returns `{ updated, topics, OpenTo }` via `render()`.
- [ ] T018 [P] [US1] Create `src/components/sections/Now.astro` per `contracts/home-sections.md` (same heading, spacing, colour, link and focus styles as RecentWriting; theme tokens only; one column; long text wraps). Makes T012 pass.
- [ ] T019 [US1] Register `Now` in `src/components/sections/index.ts` and a no-prop schema in `src/components/sections/schemas.ts`.
- [ ] T020 [US1] Create `src/content/now/now.md` with the launch entry from FR-021 (dated 2026-10-11, exact wording). Mark the wording for Don's review: `[PREVIEW-CHECK]` (see T043).
- [ ] T021 [US1] Edit `src/content/pages/index.mdx`: remove the two paragraphs and the "What I do" section, make the body `<Now />` then `<RecentWriting />` (intro front matter, title, description and social image untouched, FR-016, FR-016a). Makes T013 and T014 pass.

**Checkpoint**: US1 works alone; T010-T014 pass.

## Phase 4: User Story 2 - Choose a reading path from "Start here" (P2)

**Goal**: Named reading paths of ordered posts and project stories with reading times, built from content files, failing the build clearly on bad references.

**Independent test**: Build the fixture site with two paths and open `/`: each path shows name, description and items in order with title links and "N min read"; project items carry "Project".

### Tests (write first, see them fail)

- [ ] T022 [P] [US2] Test (layer: unit): `tests/unit/content/reading-path-schema.test.ts`: required `title`, `description`, `position`; description one sentence ending `.` and at most 160 characters; `position` 1-4; `items` 1-5; each item exactly one of `post` or `project`. Rows R01, R02, R03, R08, R10.
- [ ] T023 [P] [US2] Test (layer: unit): `tests/unit/content/reading-paths.test.ts` for the pure module: `checkReadingPaths()` names file and item for a missing target (R04, drafts count as existing), duplicate item in a path (R05; post and project with same slug are distinct), more than four paths counted before drafts are removed (R06), duplicate position (R07); `resolveReadingPaths()` sorts by position, keeps item order, drops draft items in production only, drops an emptied path, returns none when all are dropped, keeps a one-item path, allows the same post in two paths.
- [ ] T024 [P] [US2] Test (layer: unit): `tests/unit/markdown/reading-time.test.ts` (extend): one shared rule, 225 words a minute, rounded up, minimum 1, body only (front matter and a project's call to action and links not counted), applied identically to a post and a project story body. FR-010a.
- [ ] T025 [P] [US2] Test (layer: component, Astro Container API): `tests/component/sections/StartHere.test.ts`: `h2` "Start here"; each path an `h3` in a region labelled by it, whether one path or several; `<ol>` items; link text is the full title; "N min read"; the visible "Project" label on project items only; renders nothing when no paths; no `<script>`.
- [ ] T026 [US2] Test (layer: build): extend `tests/build/home-sections.test.ts`: real build fails with the named message for a missing item (R04) and unparsable YAML (R09); production build drops a draft item and an emptied path while a non-production build keeps them (FR-013); zero paths hides the section; item order and reading times in `/` HTML. Reason for build layer: R04 proves `checkReadingPaths()` is wired into the build (R05-R07 stay unit-only per the contract); R09, `reference()` timing, collection reads and the production draft filter span real build output.
- [ ] T027 [US2] Test (layer: e2e, real browser): extend `tests/e2e/home.spec.ts`: Start here sits between Now and Recent writing; one `h1`, `h2` sections and an `h3` per path; a path link navigates to its post or project page; tab order follows source order through Now and Start here; no horizontal scroll and no clipped text at 320 px, 200% zoom and 1.4.12 text-spacing overrides with the very long fixture item title; path links and their focus indicator stay visible with forced colours emulated; Start here is readable with JavaScript disabled. Reason for e2e layer: tab order, layout and forced colours only show in a browser.

### Implementation

- [ ] T028 [P] [US2] Create `src/content/schemas/reading-path.ts` (`reference("posts")` / `reference("projects")` item union, description and position rules, custom messages). Makes T022 pass.
- [ ] T029 [P] [US2] Create the pure module `src/lib/content/reading-paths.ts` with `checkReadingPaths()` and `resolveReadingPaths()`. Makes T023 pass.
- [ ] T030 [US2] Add the `readingPaths` collection (`glob()` on `src/content/reading-paths/*.yaml`) to `src/content.config.ts`; call the check so the build fails with the contract messages.
- [ ] T031 [US2] Create `src/lib/reading-paths.ts` with `getReadingPaths()`: joins collections with `getPostSummaries()` and `getPublishedProjects()` (existing visibility rule), reads project minutes from `render(entry).remarkPluginFrontmatter.minutesRead`, builds hrefs with the existing address helpers. Confirm both posts and projects use the one `src/lib/markdown/reading-time.ts` plugin (makes T024 pass; fix only if they diverge).
- [ ] T032 [P] [US2] Create `src/components/sections/StartHere.astro` per `contracts/home-sections.md`: one column below 768 px, two columns from it, row-major in position order, top-aligned, source order equals visual order, 24 px minimum link targets, existing focus style. Makes T025 pass.
- [ ] T033 [US2] Register `StartHere` in `src/components/sections/index.ts` and `src/components/sections/schemas.ts`; update the `src/content/pages/index.mdx` body to `<Now />`, `<StartHere />`, `<RecentWriting />`. Makes T026 and T027 pass.
- [ ] T034 [US2] Test (layer: unit, real content), written before T035: `tests/unit/content/launch-paths.test.ts` reads the real paths through `tests/helpers/content.ts` and asserts the invariants only (at most four paths, unique positions, every item names an existing post or project file, no duplicate item, every description one sentence of at most 160 characters), naming no slug. It guards Don's later edits; it cannot fail before T035 because zero paths is valid (FR-014), which is accepted.
- [ ] T035 [P] [US2] Create `src/content/reading-paths/leading-change-in-healthcare.yaml` (position 1, items: post `the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change`, post `starting-something-new`) and `src/content/reading-paths/building-with-ai-agents.yaml` (position 2, items: post `building-focus-pocus-what-i-learned-about-ai-coding-and-integration`, project `cadence`, project `drcdev-github-io`, project `flux`) per FR-022, with draft descriptions ending in a full stop. Mark the descriptions for Don: `[PREVIEW-CHECK]` (T043).

**Checkpoint**: US1 and US2 work; the real site builds with the launch paths.

## Phase 5: User Story 3 - Recent writing stays below (P3)

**Goal**: Section order is intro, Now, Start here, Recent writing, with Recent writing unchanged; the page is accessible, within budget and readable at 320 px and without JavaScript.

**Independent test**: Open `/` and confirm order, three newest posts and the "All writing" link.

### Tests

- [ ] T036 [US3] Test (layer: e2e, real browser): extend `tests/e2e/home.spec.ts`: Recent writing is the last section, below Start here, and still shows the three newest visible posts and the "All writing" link. This is a regression guard on existing behaviour (US3 adds no new behaviour, so it passes when written); the order part is already seen failing in T014 and T027. Reason for e2e layer: the rendered section order alongside the other home checks in one journey.
- [ ] T037 [US3] Confirm `/` is in the existing axe list (`tests/e2e/templates.ts`, used by `tests/e2e/a11y.spec.ts` at phone and desktop widths, both themes and with JavaScript off, with the `wcag22aa` tag that includes target size) and the `tests/e2e/budget.spec.ts` list, so the existing template-level checks cover the new sections on the real site with the launch paths shown (SC-004). No new test if already covered; add `/` there if not. Layer: accessibility/budget (template level).
- [ ] T038 [US3] Test (layer: visual): add `home-now-start-here-{phone,desktop}-{light,dark}` shots of the fixture home page to `tests/e2e/visual.spec.ts`, loading lazy images first as the other shots do. Reason for visual layer: spacing, columns and theme tokens in both themes are only judged by pixels.

### Implementation

- [ ] T039 [US3] Verify `src/components/sections/RecentWriting.astro` is untouched and the new sections share its heading, spacing, link and focus tokens (FR-015a); fix any drift in `Now.astro` or `StartHere.astro` rather than in RecentWriting.
- [ ] T040 [US3] Run the local checks for this tier only: `pnpm exec tsx scripts/ci/changed-paths.ts --base origin/main` and the tier it reports (type check, lint, unit, component, build tests), with `ASTRO_PREVIEW_BACKGROUND=1` where needed. Ask Don before any full `pnpm run verify`.

## Phase 6: Polish and cross-cutting

- [ ] T041 Update visual baselines after the implementation is final: run `pnpm run test:visual:update` (macOS), then `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, report it to the caller rather than skipping). Commit only the new `home-now-start-here-*` PNGs; if `menu-open-phone-*` moved, refresh those four and say so in the PR. Compare `-previous.png` not `-actual.png` (see `.claude/skills/_shared/visual-baselines.md`).
- [ ] T042 [P] Guards: no `Cloud Architect` anywhere in `src/` (FR-020); no new script on `/` (FR-017); `git diff origin/main -- src/content/pages/index.mdx` changes only the body, not the front matter (title, description, social image and intro unchanged, FR-016a). Update `docs/testing.md` contract-row mapping with a "Now and reading paths" section for N01-N09 and R01-R10 pointing to the tests above.
- [ ] T043 [PREVIEW-CHECK] Don checks on the preview deployment (rules in `.claude/skills/_shared/preview-check.md`; leave unticked, list in the PR body): the launch Now wording (FR-021, T020), the date style "Updated October 11, 2026", the two path descriptions and item order (FR-022, T035), and a look at the new sections in light and dark themes on a phone and a desktop.
- [ ] T044 Run `quickstart.md` end to end (fixture build, real build, edit the Now date and confirm only `src/content/now/now.md` changes); open the PR from `drc-agents` with the PREVIEW-CHECK list and arm auto-merge after the final push.

## Dependencies and order

- Phase 1 then Phase 2 (T003-T009) before any story. T004 follows T003; T007 and T008 follow T005 and T006; T009 is independent.
- US1 (Phase 3) before US2: T016 and T019/T033 edit shared files (`content.config.ts`, `sections/index.ts`, `index.mdx`), and T027 extends the `home.spec.ts` created in T014. US3 follows US2 (its tests need both sections).
- Within a story, test tasks precede implementation; T021 (index.mdx) before US2's T033; T034 before T035.
- T041 (baselines) after all implementation and T039; T043-T044 last.

## Parallel examples

- Phase 2: T003, T006, T009 together.
- US1 tests: T010, T011, T012 together; implementation T015 and T018 together.
- US2 tests: T022, T023, T024, T025 together; T028, T029, T032 together.

## Implementation strategy

MVP is Phases 1-3 (US1): the Now section on the home page. Then add Start here (US2), then the Recent writing guard, accessibility and visual coverage (US3), then baselines and the PR. The Foundational fixture-harness work is the main risk and goes first.
