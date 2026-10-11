# Tasks: Home page with a Now section and Start here reading paths

**Input**: `/specs/040-home-now-start-here/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Tests**: Mandatory (Constitution Principle I). Each test task names its one primary layer (the cheapest that can observe the behaviour, per "Where a test goes" in `docs/testing.md`) and the reason for any second layer. Tests are written and seen to fail before the implementation they cover. Contract rows (N01-N09, R01-R10 in `contracts/build-errors.md`) go in test titles. No test names a real slug (`no-real-content-in-tests` guard): real content is read through `tests/helpers/content.ts`.

**Format**: `- [ ] T### [P?] [US?] Description with file path`. `[P]` = different files, no dependency on an unfinished task.

## Phase 1: Setup

- [ ] T001 Run `node -v` against `.nvmrc` (source nvm in the same command if it differs), then confirm `.reference/flux` exists in the worktree (symlink or copy from the main checkout) and `pnpm install --frozen-lockfile` is clean.
- [ ] T002 Re-read `docs/testing.md` ("Where a test goes", "Real content in tests", "Visual coverage") and `.claude/skills/_shared/visual-baselines.md`; note the layer rules used by the test tasks below.

## Phase 2: Foundational (blocks every story)

**Purpose**: The fixture harnesses drop real posts and projects, so the real reading-path files would point at missing items and fail every fixture build. Land this first (plan, "Fixture builds"). Shared content-error and date plumbing also lives here.

- [ ] T003 [P] Test (layer: unit): in `tests/unit/content/dates.test.ts`, cover the raw-date check shared by posts and Now: `YYYY-MM-DD` shape, real calendar day (2026-02-30 fails), and "not after the build date in UTC" (equal passes, later fails), with the clock injected. Row N02, N03.
- [ ] T004 Implement the shared date helper in `src/lib/content/dates.ts` (extend or sit beside `post-dates.ts`; no change to post behaviour) and add `"now"` and `"reading path"` to `ContentKind` in `src/lib/content/errors.ts` so `contentError()` emits `Now file <path>: ...` and `Reading path file <path>: ...`. Makes T003 pass.
- [ ] T005 Test (layer: build): in `tests/build/fixture-site.test.ts`, assert the default fixture build and the Playwright fixture site build succeed with the real `src/content/reading-paths/*.yaml` present (the harnesses delete them) and, for the Playwright fixture site, that fixture Now and fixture reading-path files are in place. Reason for build layer: only the real harness copy shows this. Seen failing before T006-T008.
- [ ] T006 [P] Create fixture content: `tests/fixtures/now/now.md` (valid, dated in the past, all four topics, one contact link) and `tests/fixtures/reading-paths/` with valid files pointing only at the fixture posts and projects (two paths, positions 1 and 2, one project item), plus broken variants kept in separate subfolders (missing item, duplicate item, five paths, duplicate position, bad YAML, future-dated Now, two Now files) for the build and unit tests.
- [ ] T007 Edit `tests/build/fixture-site.ts`: when real posts or projects are removed, also delete the copied `src/content/reading-paths/*.yaml`; add a `readingPaths` option (and a `now` option) to install files from `tests/fixtures/`. Keep the default Now file unless an option replaces it.
- [ ] T008 Edit `scripts/build-fixture-site.ts`: delete the copied real reading-path files, and swap in the fixture Now file and fixture reading-path files that point at the Playwright fixture site's 16 fixture posts and 5 fixture projects. (Depends on T006.) Makes T005 pass.
- [ ] T009 [P] Edit `tests/helpers/content.ts` to read real reading paths (`src/content/reading-paths/`) and the real Now file (`src/content/now/now.md`), so real-content tests never name a slug.

**Checkpoint**: fixture builds survive the new content directories.

## Phase 3: User Story 1 - See what Don is doing now and what he is open to (P1)

**Goal**: The home page shows a dated Now section with four labelled topics and an "open to" line linking to `/contact/`, editable from one file.

**Independent test**: Build with a Now entry and open `/`: Now section shows its date, four topics in order and the open-to line, with JavaScript off.

### Tests (write first, see them fail)

- [ ] T010 [P] [US1] Test (layer: unit): `tests/unit/content/now-schema.test.ts` for the Now front matter schema: required `updated`, `workingOn`, `reading`, `mbaResearch`, `aiExperiments`; blank or whitespace fails; more than 200 characters or more than one line fails; unknown key fails and is named; plain text accepted. Rows N01, N04, N05, N09.
- [ ] T011 [P] [US1] Test (layer: unit): `tests/unit/content/now-body.test.ts` for the open-to line check: empty body, no `/contact/` link, more than one paragraph or a heading all fail with the contract messages; extra links allowed when one goes to `/contact/`. Rows N06, N08. Also the future-date and non-real-day rows through the Now schema (N02, N03), with the clock injected.
- [ ] T012 [P] [US1] Test (layer: component, Astro Container API): `tests/component/sections/Now.test.ts`: `h2` "Now" in a region labelled by it; `Updated <time datetime="YYYY-MM-DD">October 1, 2026</time>`; a `<dl>` with the labels "Working on", "Reading", "MBA research", "AI experiments" in that order, each paired with its text; open-to paragraph with a `/contact/` link; no `<script>`. Rows from `contracts/home-sections.md`.
- [ ] T013 [US1] Test (layer: build): `tests/build/home-sections.test.ts` (Now part): real `astro build` fails with the named message for a future-dated Now (N03), a missing required topic (N04), and zero or two Now files (N07); a valid fixture Now builds and `/` HTML contains the Now section. Reason for build layer: collection loading and `getNow()` count check only show in the real build. Must not name a real slug.

### Implementation

- [ ] T014 [P] [US1] Create `src/content/schemas/now.ts` (strict Zod schema, date check from T004, topic limits, custom error text per `contracts/build-errors.md`). Makes T010, T011 pass.
- [ ] T015 [US1] Add the `now` collection (`glob()` loader on `src/content/now/*.md`, schema from T014, body checks for N06/N08) to `src/content.config.ts`.
- [ ] T016 [US1] Create `src/lib/now.ts` with `getNow()`: exactly one entry (N07 error otherwise), returns `{ updated, topics, OpenTo }` via `render()`.
- [ ] T017 [P] [US1] Create `src/components/sections/Now.astro` per `contracts/home-sections.md` (same heading, spacing, colour, link and focus styles as RecentWriting; theme tokens only; one column; long text wraps). Makes T012 pass.
- [ ] T018 [US1] Register `Now` in `src/components/sections/index.ts` and a no-prop schema in `src/components/sections/schemas.ts`.
- [ ] T019 [US1] Create `src/content/now/now.md` with the launch entry from FR-021 (dated 2026-10-11, exact wording). Mark the wording for Don's review: `[PREVIEW-CHECK]` (see T041).
- [ ] T020 [US1] Edit `src/content/pages/index.mdx`: remove the two paragraphs and the "What I do" section, make the body `<Now />` then `<RecentWriting />` (intro front matter, title, description and social image untouched, FR-016, FR-016a). Confirm no remaining mention of advisory work or workshops on the home page.

**Checkpoint**: US1 works alone; T010-T013 pass.

## Phase 4: User Story 2 - Choose a reading path from "Start here" (P2)

**Goal**: Named reading paths of ordered posts and project stories with reading times, built from content files, failing the build clearly on bad references.

**Independent test**: Build the fixture site with two paths and open `/`: each path shows name, description and items in order with title links and "N min read"; project items carry "Project".

### Tests (write first, see them fail)

- [ ] T021 [P] [US2] Test (layer: unit): `tests/unit/content/reading-path-schema.test.ts`: required `title`, `description`, `position`; description one sentence ending `.` and at most 160 characters; `position` 1-4; `items` 1-5; each item exactly one of `post` or `project`. Rows R01, R02, R03, R08, R10.
- [ ] T022 [P] [US2] Test (layer: unit): `tests/unit/content/reading-paths.test.ts` for the pure module: `checkReadingPaths()` names file and item for a missing target (R04, drafts count as existing), duplicate item in a path (R05; post and project with same slug are distinct), more than four paths (R06), duplicate position (R07); `resolveReadingPaths()` sorts by position, keeps item order, drops draft items in production only, drops an emptied path, returns none when all are dropped, keeps a one-item path, allows the same post in two paths.
- [ ] T023 [P] [US2] Test (layer: unit): `tests/unit/markdown/reading-time.test.ts` (extend): one shared rule, 225 words a minute, rounded up, minimum 1, body only (front matter and a project's call to action and links not counted), applied identically to a post and a project story body. FR-010a.
- [ ] T024 [P] [US2] Test (layer: component, Astro Container API): `tests/component/sections/StartHere.test.ts`: `h2` "Start here"; each path an `h3` in a region labelled by it, whether one path or several; `<ol>` items; link text is the full title; "N min read"; the visible "Project" label on project items only; renders nothing when no paths; no `<script>`.
- [ ] T025 [US2] Test (layer: build): extend `tests/build/home-sections.test.ts`: real build fails with the named message for a missing item (R04), duplicate item (R05), five paths (R06), duplicate position (R07), unparsable YAML (R09); production build drops a draft item and an emptied path while a non-production build keeps them (FR-013); zero paths hides the section; item order and reading times in `/` HTML. Reason for build layer: `reference()` timing, collection reads and the production draft filter span real build output.

### Implementation

- [ ] T026 [P] [US2] Create `src/content/schemas/reading-path.ts` (`reference("posts")` / `reference("projects")` item union, description and position rules, custom messages). Makes T021 pass.
- [ ] T027 [P] [US2] Create the pure module `src/lib/content/reading-paths.ts` with `checkReadingPaths()` and `resolveReadingPaths()`. Makes T022 pass.
- [ ] T028 [US2] Add the `readingPaths` collection (`glob()` on `src/content/reading-paths/*.yaml`) to `src/content.config.ts`; call the check so the build fails with the contract messages.
- [ ] T029 [US2] Create `src/lib/reading-paths.ts` with `getReadingPaths()`: joins collections with `getPostSummaries()` and `getPublishedProjects()` (existing visibility rule), reads project minutes from `render(entry).remarkPluginFrontmatter.minutesRead`, builds hrefs with the existing address helpers. Confirm both posts and projects use the one `src/lib/markdown/reading-time.ts` plugin (makes T023 pass; fix only if they diverge).
- [ ] T030 [P] [US2] Create `src/components/sections/StartHere.astro` per `contracts/home-sections.md`: one column below 768 px, two columns from it, row-major in position order, top-aligned, source order equals visual order, 24 px minimum link targets, existing focus style. Makes T024 pass.
- [ ] T031 [US2] Register `StartHere` in `src/components/sections/index.ts` and `src/components/sections/schemas.ts`; update the `src/content/pages/index.mdx` body to `<Now />`, `<StartHere />`, `<RecentWriting />`.
- [ ] T032 [P] [US2] Create `src/content/reading-paths/leading-change-in-healthcare.yaml` (position 1, items: post `the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change`, post `starting-something-new`) and `src/content/reading-paths/building-with-ai-agents.yaml` (position 2, items: post `building-focus-pocus-what-i-learned-about-ai-coding-and-integration`, project `cadence`, project `drcdev-github-io`, project `flux`) per FR-022, with draft descriptions ending in a full stop. Mark the descriptions for Don: `[PREVIEW-CHECK]` (T041).
- [ ] T033 [US2] Add a real-content test in `tests/build/home-sections.test.ts` (or `tests/unit/content/launch-paths.test.ts`) that reads the real paths through `tests/helpers/content.ts` and asserts the invariants only (at most four paths, every item resolves, no duplicate, every description under 160 characters), naming no slug.

**Checkpoint**: US1 and US2 work; the real site builds with the launch paths.

## Phase 5: User Story 3 - Recent writing stays below (P3)

**Goal**: Section order is intro, Now, Start here, Recent writing, with Recent writing unchanged; the page is accessible, within budget and readable at 320 px and without JavaScript.

**Independent test**: Open `/` and confirm order, three newest posts and the "All writing" link.

### Tests (write first, see them fail)

- [ ] T034 [US3] Test (layer: e2e, real browser): `tests/e2e/home.spec.ts` on the fixture site: section order (intro, Now, Start here, Recent writing), heading levels (one `h1`, `h2` sections, `h3` paths), Recent writing still shows the three newest visible posts and "All writing", the Now contact link and a path link navigate, tab order follows source order, no horizontal scroll at 320 px, 200% zoom and 1.4.12 text-spacing overrides with a very long title not clipped, and the page works with JavaScript disabled. Reason for e2e layer: layout, tab order and no-JS only show in a browser.
- [ ] T035 [US3] Confirm `/` is in the existing axe list (`tests/e2e/a11y.spec.ts`), the no-JS list and the `tests/e2e/budget.spec.ts` list, and that the fixture site's `/` carries the new sections, so the existing template-level checks cover them (no new test if already covered; add `/` there if not). Layer: accessibility/budget (template level).
- [ ] T036 [US3] Test (layer: visual): add `home-now-start-here-{phone,desktop}-{light,dark}` shots of the fixture home page to `tests/e2e/visual.spec.ts`, loading lazy images first as the other shots do. Reason for visual layer: spacing, columns and theme tokens in both themes are only judged by pixels.

### Implementation

- [ ] T037 [US3] Verify `src/components/sections/RecentWriting.astro` is untouched and the new sections share its heading, spacing, link and focus tokens (FR-015a); fix any drift in `Now.astro` or `StartHere.astro` rather than in RecentWriting. Check forced-colours and dark theme by reading the CSS (no colour-only signals; "Project" is text).
- [ ] T038 [US3] Run the local checks for this tier only: `pnpm exec tsx scripts/ci/changed-paths.ts --base origin/main` and the tier it reports (type check, lint, unit, component, build tests), with `ASTRO_PREVIEW_BACKGROUND=1` where needed. Ask Don before any full `pnpm run verify`.

## Phase 6: Polish and cross-cutting

- [ ] T039 Update visual baselines after the implementation is final: run `pnpm run test:visual:update` (macOS), then `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, report it to the caller rather than skipping). Commit only the new `home-now-start-here-*` PNGs; if `menu-open-phone-*` moved, refresh those four and say so in the PR. Compare `-previous.png` not `-actual.png` (see `.claude/skills/_shared/visual-baselines.md`).
- [ ] T040 [P] Grep guards: no `Cloud Architect` anywhere in `src/` (FR-020); the home page does not mention advisory work or workshops (FR-016); no new script on `/` (FR-017). Update `docs/testing.md` contract-row mapping with a "Now and reading paths" section for N01-N09 and R01-R10 pointing to the tests above.
- [ ] T041 [PREVIEW-CHECK] Don checks on the preview deployment (rules in `.claude/skills/_shared/preview-check.md`; leave unticked, list in the PR body): the launch Now wording (FR-021, T019), the date style "Updated October 11, 2026", the two path descriptions and item order (FR-022, T032), and a look at the new sections in light and dark themes on a phone and a desktop.
- [ ] T042 Run `quickstart.md` end to end (fixture build, real build, edit the Now date and confirm only `src/content/now/now.md` changes); open the PR from `drc-agents` with the PREVIEW-CHECK list and arm auto-merge after the final push.

## Dependencies and order

- Phase 1 then Phase 2 (T003-T009) before any story. T004 follows T003; T007 and T008 follow T005 and T006; T009 is independent.
- US1 (Phase 3) before US2: T015 and T018/T031 edit shared files (`content.config.ts`, `sections/index.ts`, `index.mdx`). US3 follows US2 (its tests need both sections).
- Within a story, test tasks precede implementation; T020 (index.mdx) before US2's T031.
- T039 (baselines) after all implementation and T037; T041-T042 last.

## Parallel examples

- Phase 2: T003, T006, T009 together.
- US1 tests: T010, T011, T012 together; implementation T014 and T017 together.
- US2 tests: T021, T022, T023, T024 together; T026, T027, T030, T032 together.

## Implementation strategy

MVP is Phases 1-3 (US1): the Now section on the home page. Then add Start here (US2), then the order, accessibility and visual coverage (US3), then baselines and the PR. The Foundational fixture-harness work is the main risk and goes first.
