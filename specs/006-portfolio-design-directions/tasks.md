# Tasks: Design directions for the portfolio

**Input**: `specs/006-portfolio-design-directions/` (spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md)

**Toolchain reminder (every task that runs `pnpm`, `astro` or `playwright`)**: node from nvm (`.nvmrc` = 24; run `node -v` first, and `source ~/.nvm/nvm.sh && nvm use` in the same command if it is not 24); call `corepack pnpm` (or put the shim dir `/Users/doncoleman/.claude/jobs/af7f52f6/tmp/bin` on PATH); bound long runs with `perl -e 'alarm N; exec @ARGV' <cmd>` (no `timeout` on macOS); set `ASTRO_PREVIEW_BACKGROUND=1` for every Playwright or `verify` run.

**Tests are mandatory** (Constitution Principle I). Each phase lists its tests first. Write them, run them, and see them fail for the right reason before starting the implementation they cover. A task is not done until its tests pass.

**Conventions**: `†` = prototype file deleted in Phase 9. `‡` = shared file with a one-line edit reverted in Phase 9. Markers: `[P]` = parallel (different files, no dependency on unfinished tasks). `[US1]` story page, `[US2]` projects index, `[US3]` reduced motion / no JS / accessibility, `[US4]` decision document. `[PREVIEW-CHECK]` = Don must check this on the preview deployment or by eye; it cannot be closed by an agent and blocks auto-merge (the PR is a major change and auto-merge stays off anyway; say so in the PR body).

**Order**: run tasks in the order they appear in this file. Task IDs are stable, so T066, T035, T050 and T063 appear earlier than their numbers suggest (they were moved to sit before the code they test).

**Scope guard (FR-050 to FR-054)**: create, edit or delete only these paths: `src/pages/design/portfolio/`, `src/prototypes/portfolio/`, `tests/unit/prototypes/portfolio/`, `tests/component/prototypes/portfolio/`, `tests/e2e/portfolio-*`, `tests/design/portfolio/`, `docs/design/portfolio.md`, `docs/design/portfolio/`, `specs/006-portfolio-design-directions/`, plus the two ‡ shared edits. Never touch `package.json`, the lockfile, `src/components/`, `src/layouts/`, `global.css`, navigation, CSP, the blog feature's `/design/blog/`, `docs/design/blog*` or any visual baseline.

**Scope-guard command** (run at every checkpoint and in T087; must print nothing): `git fetch origin main && git diff --name-only "$(git merge-base origin/main HEAD)" HEAD -- package.json pnpm-lock.yaml src/components src/layouts src/styles src/config src/content src/content.config.ts tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots docs/design/blog.md docs/design/blog src/pages/design/blog`. It is a checkpoint command, not a Vitest file, because CI checks out with `fetch-depth: 2` and has no merge base to diff against.

**Removal timing**: Phases 1 to 8 leave every prototype in place. **Phase 9 runs only after the pipeline's Finish step has captured the pinned Cloudflare preview URL of the last prototype commit; the orchestrator triggers it.** Do not run Phase 9 during the ordinary implement phases.

---

## Phase 1: Setup and shared temporary edits

**Purpose**: Folders, the route list and the two shared one-line edits.

- [ ] T001 Confirm the toolchain (`node -v` is 24.x) and a clean baseline: run `corepack pnpm exec vitest run` and note that the existing suite passes before any change. No file changes.
- [ ] T002 Write a failing unit test `tests/unit/prototypes/portfolio/sitemap-filter.test.ts` † asserting the configured sitemap excludes every page whose pathname starts with `/design/` (for example `design/portfolio/`, `design/portfolio/a/focus-pocus/`), still excludes `/404…` pages, and keeps normal pages (`""`, `about/`) (FR-007, FR-053). The filter is an inline closure in `astro.config.mjs` and is not exported, so do not try to import it and do not change the config to export it: copy the `buildSitemap` helper pattern from `tests/unit/site/sitemap.test.ts` (reset `WORKERS_CI*` env, `vi.resetModules()`, dynamic `import("../../../../astro.config.mjs")`, run the `@astrojs/sitemap` `astro:routes:resolved`, `astro:config:done` and `astro:build:done` hooks against a temp dir, read `sitemap-0.xml`). Do not edit `tests/unit/site/sitemap.test.ts`; its expectations must keep passing unchanged. Run the new test and see it fail on the `/design/` entries.
- [ ] T003 ‡ Edit the sitemap `filter` in `astro.config.mjs` to also drop paths starting `/design/`, using exactly the condition `pathname.startsWith("/design/")` so the blog feature's identical edit merges cleanly. Run T002 until it passes.
- [ ] T004 Create `tests/e2e/portfolio-prototypes.ts` † exporting `PORTFOLIO_PROTOTYPES` in the same entry shape as `TEMPLATES` (`name`, `path`, `built: true`). Start it as an empty array; the seven routes from contracts/prototype-routes.md are added by T035, T050, T063 and T068, each before the pages it covers are built. Every `name` starts with `portfolio-` (for example `portfolio-a-story`) so `--grep portfolio` selects them in the shared suites.
- [ ] T005 ‡ Append `...PORTFOLIO_PROTOTYPES` on its own line to `TEMPLATES` in `tests/e2e/templates.ts` (import from `./portfolio-prototypes`). One added import and one added entry only.
- [ ] T006 Create the empty folder skeleton with placeholder-free index files only where needed: `src/prototypes/portfolio/{shared,a,b,c}/`, `src/pages/design/portfolio/{a,b,c}/`, `tests/unit/prototypes/portfolio/`, `tests/component/prototypes/portfolio/`, `tests/design/portfolio/` (create directories when the first file lands; no separate commit needed).
- [ ] T007 Run the scope-guard command (see the top of this file) and confirm it prints nothing (FR-045, FR-050, FR-052, FR-054). Repeat it at every checkpoint below; any output is a scope breach to undo before continuing. No file is created for this guard.

**Checkpoint**: `TEMPLATES` accepts the prototype routes, the sitemap ignores `/design/`, and the scope-guard command prints nothing.

---

## Phase 2: Foundational sample data, helpers and shared pieces

**Purpose**: Everything all three directions share. Blocks Phases 3 to 5.

### Tests first (must fail before T014 to T023)

- [ ] T008 [P] Write `tests/unit/prototypes/portfolio/sample.test.ts` † covering data-model.md invariants 1 to 11 (stage order equals `STAGE_ORDER`, all stages `draft: true`, exactly one chosen option with a reason, `fit` covers every constraint, only Focus Pocus has `storyPath`, unique slugs, all statuses and at least 4 themes, one-sentence problems of at most 140 characters, placeholder label and description, demo stand-in note, three directions with `newResources` present). Also assert five entries exist (Focus Pocus, Tempo, Flux, drc.dev, Plunge Buddy) and that no visible string is empty. See it fail.
- [ ] T009 [P] Write `tests/unit/prototypes/portfolio/filter.test.ts` † for `themesOf` (sorted, unique), `matches` (null shows all, exact case-sensitive match) and `parseThemeParam` (known, unknown gives `unknown: true`, missing gives null). See it fail.
- [ ] T010 [P] Write `tests/unit/prototypes/portfolio/contact-link.test.ts` † for `contactHref("focus-pocus") === "/contact/?project=focus-pocus"` and a throw on a slug failing `^[a-z0-9-]{1,64}$` (for example `"Focus Pocus"`, `""` and a 65-character slug) (FR-015, contracts/contact-handoff.md). See it fail.
- [ ] T011 [P] Write component tests in `tests/component/prototypes/portfolio/shared.test.ts` † using the Astro Container API as the existing `tests/component` files do, for: `PrototypeNotice` (text "Design prototype for review. Not part of the live site." and link to `/design/portfolio/`); `DraftMark` (visible text "Draft for review", `data-draft-mark`, readable by assistive technology, not an aria-hidden badge, FR-037); `PlaceholderFrame` (visible "Placeholder" plus label and description text, no `<img>`, FR-037); `ArchitectureDiagram` and `OptionsDiagram` (`role="img"`, `aria-labelledby` naming a label, description text present, no `style=` attribute, FR-033); `StatusBadge` (status and theme shown as text, FR-025); `ThemePills`. See them fail.
- [ ] T012 [P] Write `tests/component/prototypes/portfolio/portfolio-filter.test.ts` † for the `PortfolioFilter` markup before any script runs: control group has `hidden js:flex`, live status `<p role="status" aria-live="polite">` with `hidden js:block`, every entry present with `data-themes`, no-match message and "Show all projects" button present but hidden, native `<button type="button" aria-pressed>` controls, each control with an accessible name and a minimum 24 by 24 CSS pixel size class (FR-022, FR-035, FR-036). See it fail.
- [ ] T013 [P] Write `tests/component/prototypes/portfolio/no-inline-style.test.ts` † that renders every shared and per-direction component (extend as directions land) and fails on any `style=` attribute, `<iframe>`, `<img>` with an external src, or absolute external URL other than `https://drc.dev/…` and the GitHub repository links (CSP, FR-050). The same file also reads every `.css` and `.astro` file under `src/prototypes/portfolio/` and fails on a colour literal (hex, `rgb(`, `hsl(`, `oklch(`), a `font-family` or `@font-face` declaration, or a new `--color-`/`--font-` custom property, so directions use only the site's existing palettes and typefaces (FR-005, FR-050). Each direction's component test task (T025, T038, T053) extends this file's component list with that direction's components.
- [ ] T066 [P] Write `tests/unit/prototypes/portfolio/distinct.test.ts` † asserting from `directions` in `sample.ts` that every pair of directions has different values in at least three of the five `dimensions` fields (story layout, stage movement, option pattern, index structure, reveal style; FR-001, data-model invariant 12). See it fail; T015 makes it pass.

### Implementation

- [ ] T014 [P] Create `src/prototypes/portfolio/types.ts` † with the types from data-model.md (`ProjectStatus`, `Theme`, `ProjectEntry`, `Visual`, `StoryStage`, `StoryOption`, `Constraint`, `Demo`, `SampleStory`, `Direction`, `StageId`, `STAGE_ORDER`).
- [ ] T015 Create `src/prototypes/portfolio/sample.ts` † with `focusPocus`, `otherEntries`, `allEntries` and `directions` per data-model.md: Claude-drafted plain-language story from the drc.dev page and repository, every stage marked draft, three options with one chosen and its reason, three or more constraints, demo stand-in note, visuals as specified (architecture diagram beside `built`, options diagram beside `options`, screenshot placeholder beside `problem`, clip placeholder beside `outcome`, none for `constraints` and `lessons`), and the "Themes and status are a draft for Don's review." note, and each direction's `dimensions` values (FR-001, FR-003, FR-021, FR-032). Run T008 and T066 until they pass.
- [ ] T016 [P] Create `src/prototypes/portfolio/filter.ts` † (`themesOf`, `matches`, `parseThemeParam`). Run T009 until it passes.
- [ ] T017 [P] Create `src/prototypes/portfolio/contact-link.ts` † (`contactHref`). Run T010 until it passes.
- [ ] T018 [P] Create `src/prototypes/portfolio/shared/PrototypeNotice.astro` † and `shared/DraftMark.astro` †.
- [ ] T019 [P] Create `src/prototypes/portfolio/shared/PlaceholderFrame.astro` † (bordered frame in palette tokens, visible "Placeholder" text, description, a visible border that survives forced colours, FR-038).
- [ ] T020 [P] Create `src/prototypes/portfolio/shared/ArchitectureDiagram.astro` † and `shared/OptionsDiagram.astro` † as inline SVG using palette tokens through classes (no `style=`), `role="img"`, `aria-labelledby`, description text, `forced-colors` safe strokes and text (FR-033, FR-038). Keep markup small for the 100 KB budget.
- [ ] T021 [P] Create `src/prototypes/portfolio/shared/StatusBadge.astro` † and `shared/ThemePills.astro` † (text labels, AA contrast in both themes, not colour alone).
- [ ] T022 Create `src/prototypes/portfolio/shared/PortfolioFilter.astro` † as the `<portfolio-filter>` custom-element island per contracts/islands.md: theme buttons, "All projects", polite live status announcing every result change including "No projects match this theme." without moving focus, `?theme=` read and `history.replaceState` write, unknown theme shows the no-match message, focus stays on the pressed button (FR-022, FR-035). Run T012 until it passes.
- [ ] T023 [P] Create `src/prototypes/portfolio/shared/stage-accents.css` † with the seven stage accent classes (problem rust, constraints sand, options lavender, built sage, outcome mist, lessons mauve, invitation accent), palette tokens only, AA shades per theme, and a shared `@media (prefers-reduced-motion: no-preference)` guard pattern for `data-reveal`. Add a shared `:focus-visible` and `scroll-margin-top` rule so a focused element is never obscured by a sticky element (FR-035).
- [ ] T024 [P] Write a failing component test then implement `src/prototypes/portfolio/shared/StageSection.astro` †: renders `<section id aria-labelledby>` with `h2`, `DraftMark` and an optional visual in the same section; no empty column when the visual is absent. Test file `tests/component/prototypes/portfolio/stage-section.test.ts` †. Test first, see it fail, then build.

**Checkpoint**: unit and shared component tests pass: `corepack pnpm exec vitest run tests/unit/prototypes/portfolio tests/component/prototypes/portfolio`.

---

## Phase 3: Direction A "Timeline" (US1, US2, US3)

**Goal**: A story page and index in a vertical timeline pattern: stages on a rail, options in native `<details>` (chosen open), CSS scroll-driven fade-and-rise reveals, no view transition. Index is a chronological list.

**Independent test**: open `/design/portfolio/a/` and `/design/portfolio/a/focus-pocus/` in both themes at 390 and 1280 px; all seven stages, every option, visuals and the invitation are present and usable.

### Tests first

- [ ] T025 [P] [US1] Component test `tests/component/prototypes/portfolio/a-story.test.ts` †: seven stages in `STAGE_ORDER` with ids, `h2`s and draft marks; every option in HTML with `data-option`, chosen one has `data-chosen`, a visible "Chosen" label and its reason; options use `<details>` with the chosen open; visuals inside their stage; demo link to `https://drc.dev/projects/focus-pocus` and repository link and the stand-in note in `built`; invitation `h2` "Have a problem like this?" with `href="/contact/?project=focus-pocus"`; `[data-reveal]` present; no `style=`; one `h1`; notice present; each stage's heading and body text, each option's text and each visual's label equal the values in `focusPocus` from `sample.ts`, so every direction shows the same shared content (FR-008). Extend T013's component list with A's components. See it fail.
- [ ] T026 [P] [US2] Component test `tests/component/prototypes/portfolio/a-index.test.ts` †: five `data-entry` entries each with title, one-line problem, visual, theme text and status text; only Focus Pocus links to `/design/portfolio/a/focus-pocus/`; the others link only to their drc.dev page; filter markup present. See it fail.
- [ ] T027 [US1] E2E in `tests/e2e/portfolio-directions.spec.ts` † (create the file; a `describe` per direction, A first): stage order; every option reachable (open each `<details>` with keyboard Enter or Space); visuals inside their stage and beside the text at 1280 px, below it at 390 px; no horizontal page scroll at 320, 390 and 1280 px and at 200% zoom (FR-034); invitation `href`; noindex meta; not in header, footer or sitemap; theme toggle mid-story keeps `scrollY` and focus on the toggle and does not replay reveals; `#options` deep link puts the heading at the top of the viewport with the stage visible at once and the next Tab moving into or after it; every interactive control has a visible focus indicator and is not covered by sticky elements when focused (FR-035); controls at least 24 by 24 CSS pixels (FR-036). See it fail.
- [ ] T028 [US2] E2E (same file, A section): index shows five entries with all fields; filter apply, clear and `?theme=` known and unknown; the live region text announces each result change including no-match (FR-022); Focus Pocus reaches the A story; other entries are not story links. See it fail.
- [ ] T029 [US3] E2E (same file, A section): reduced motion gives `[data-reveal]` computed `animation-name: none` and opacity 1 with nothing hidden per FR-018; JS off shows all stages, options, visual text, invitation, every index entry and no visible button (FR-016, FR-017, FR-023); forced-colours emulation keeps text, controls, focus rings, status labels and diagram parts visible (FR-018 hidden-content rule, FR-038, using `forcedColors: "active"` and a check that borders and text are not `transparent`). With reduced motion also assert: switching `reducedMotion` from `no-preference` to `reduce` mid-visit with `page.emulateMedia` stops reveals from that moment; filter changes and `<details>` toggles have zero transition and animation duration (FR-016). Run axe (`@axe-core/playwright`, the WCAG 2.2 A/AA tags `tests/e2e/a11y.spec.ts` uses) on the A index and story in each FR-030 state the shared suite does not cover: reduced motion, JavaScript off at 1280 px (same served-HTML approach as the shared suite's no-JS axe test), forced colours, 320 px width and 200% zoom; zero violations (FR-030, SC-003). See it fail.
- [ ] T035 [US1] Add the A index and story routes to `PORTFOLIO_PROTOTYPES` in `tests/e2e/portfolio-prototypes.ts` † now, before the pages exist, so the existing a11y, no-JS and budget suites cover them and fail on the missing pages.

### Implementation

- [ ] T030 [P] [US1] Create `src/prototypes/portfolio/a/a.css` † (rail, stage accents, `animation-timeline: view()` reveals inside `@media (prefers-reduced-motion: no-preference)`, forced-colours borders, 320 px reflow, scroll-margin for focus).
- [ ] T031 [P] [US1] Create `src/prototypes/portfolio/a/OptionDetails.astro` † and `a/TimelineStage.astro` †.
- [ ] T032 [US1] Create `src/prototypes/portfolio/a/TimelineStory.astro` † composing notice, h1, problem line, seven stages, demo, invitation with `contactHref`.
- [ ] T033 [P] [US2] Create `src/prototypes/portfolio/a/TimelineIndex.astro` † with `PortfolioFilter`.
- [ ] T034 [US1] Create pages `src/pages/design/portfolio/a/focus-pocus.astro` † and `src/pages/design/portfolio/a/index.astro` † in `BaseLayout` with `noindex`, titles "Timeline – Focus Pocus · Don Coleman" and "Timeline – Projects · Don Coleman", description. Run T025 and T026 until they pass.
- [ ] T036 [US1] Build (`corepack pnpm run build`) and run T027 to T029 plus the existing suites for A: `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm exec playwright test --project=a11y --project=budget --project=e2e --grep "Timeline|portfolio"`. Fix until green, including axe in both themes at two widths, menu open, forced colours, 320 px and 200% reflow, text spacing, the budget (LCP, CLS, at most 10 KB JS, at most 100 KB transfer).
- [ ] T037 [US3] [PREVIEW-CHECK] Direction A manual checks for FR-039, recorded in the PR description by Don or the implementer on the preview: keyboard-only use of the option details and the filter; reading order matches story order; focus not obscured; diagram and placeholder text alternatives make sense to a screen reader; filter announcements are heard; contrast and forced-colours look right by eye (FR-033, FR-038).

**Checkpoint**: Direction A is complete, gated and independently reviewable.

---

## Phase 4: Direction B "Cards" (US1, US2, US3)

**Goal**: Story as stacked stage cards with a bento index, options as tabs (`<option-tabs>` island), sticky-free layout, staggered card reveals, cross-document view transitions between index and story.

### Tests first

- [ ] T038 [P] [US1] Component test `tests/component/prototypes/portfolio/b-story.test.ts` †: same story assertions as T025, plus option cards all in HTML, chosen first and labelled, the tab container carrying `hidden js:flex`, and no `role="tablist"` in server HTML. Extend T013's component list with B's components. See it fail.
- [ ] T039 [P] [US1] Component test `tests/component/prototypes/portfolio/option-tabs.test.ts` † for the `OptionTabs` pre-script markup per contracts/islands.md (all options visible, chosen marked with reason, tab buttons hidden without JS, 24 px target classes). See it fail.
- [ ] T040 [P] [US2] Component test `tests/component/prototypes/portfolio/b-index.test.ts` † (bento cards: five entries, all fields, only Focus Pocus links to the B story, filter markup, `@view-transition` opt-in class or name present). See it fail.
- [ ] T041 [US1] E2E (`portfolio-directions.spec.ts`, B section): everything in T027 adapted; option tabs by keyboard: Left/Right, Home/End, only the selected tab in the Tab order, automatic activation, every option reachable, `tablist` name "Options considered"; invitation `href`. See it fail.
- [ ] T042 [US2] E2E (B section): index fields, filter behaviour and announcements as in T028; following Focus Pocus reaches the B story. See it fail.
- [ ] T043 [US3] E2E (B section): reduced motion (reveals off, no `@view-transition` animation, all content visible), JS off (all options stacked, no tab buttons visible), forced colours, mid-visit reduced-motion change, instant tab and filter changes, and the extra-state axe runs, all as in T029. See it fail.
- [ ] T050 [US1] Add the B index and story routes to `tests/e2e/portfolio-prototypes.ts` † now, before the pages exist, so the shared a11y, no-JS and budget suites fail on them first.

### Implementation

- [ ] T044 [P] [US1] Create `src/prototypes/portfolio/b/b.css` † (cards, staggered `view()` reveals in the no-preference guard, `@view-transition { navigation: auto; }` only inside `prefers-reduced-motion: no-preference`, forced-colours borders, reflow).
- [ ] T045 [US1] Create `src/prototypes/portfolio/b/OptionTabs.astro` † (`<option-tabs>` island: WAI-ARIA tabs, automatic activation, arrow/Home/End, roving tabindex, unselected panels `hidden`). Run T039 until it passes.
- [ ] T046 [P] [US1] Create `src/prototypes/portfolio/b/StageCard.astro` † and `b/DemoPanel.astro` † (placeholder frame plus link, stand-in note; no iframe).
- [ ] T047 [US1] Create `src/prototypes/portfolio/b/CardStory.astro` †.
- [ ] T048 [P] [US2] Create `src/prototypes/portfolio/b/BentoIndex.astro` †.
- [ ] T049 [US1] Create pages `src/pages/design/portfolio/b/focus-pocus.astro` † and `src/pages/design/portfolio/b/index.astro` † with `noindex` and titles "Cards – …". Run T038 and T040 until they pass.
- [ ] T051 [US1] Build and run T041 to T043 plus the existing a11y, no-JS and budget suites for B. Fix until green (keep JS with `<option-tabs>` and the filter under 10 KB).
- [ ] T052 [US3] [PREVIEW-CHECK] Direction B manual checks for FR-039 (tabs and filter by keyboard, reading order, focus not obscured, screen-reader names for tabs, diagrams and placeholders, announcements, view transition between index and story looks right and does not run with reduced motion), recorded in the PR description.

**Checkpoint**: Directions A and B are independently complete.

---

## Phase 5: Direction C "Chapters" (US1, US2, US3)

**Goal**: Story as full-width chapters with a sticky visual panel and progress rail, options as a comparison table (constraints by options) in a keyboard-reachable scroll region, chapter-style index, cross-document view transitions.

### Tests first

- [ ] T053 [P] [US1] Component test `tests/component/prototypes/portfolio/c-story.test.ts` †: story assertions as T025, plus the option table has a `<caption>`, column headers `scope="col"` for options, row headers `scope="row"` for constraints, sits in `<div role="region" aria-labelledby tabindex="0">`, the chosen option column is labelled "Chosen" in text with its reason nearby. Extend T013's component list with C's components. See it fail.
- [ ] T054 [P] [US2] Component test `tests/component/prototypes/portfolio/c-index.test.ts` † (chapter index: five entries with all fields, Focus Pocus-only story link, filter markup). See it fail.
- [ ] T055 [US1] E2E (`portfolio-directions.spec.ts`, C section): T027 assertions adapted; the sticky visual panel and progress rail never cover a focused element (Tab through the whole story and assert each focused element is at least partly in the unobscured viewport, FR-035); table scrolls inside its own region at 320 and 390 px while the page does not; region reachable by keyboard; every cell readable. See it fail.
- [ ] T056 [US2] E2E (C section): index and filter as in T028. See it fail.
- [ ] T057 [US3] E2E (C section): reduced motion, JS off, forced colours as in T029; sticky panel falls back to in-flow placement when reduced motion or narrow width demands it; mid-visit reduced-motion change, instant filter changes and the extra-state axe runs as in T029. See it fail.
- [ ] T063 [US1] Add the C index and story routes to `tests/e2e/portfolio-prototypes.ts` † now, before the pages exist, so the shared a11y, no-JS and budget suites fail on them first.

### Implementation

- [ ] T058 [P] [US1] Create `src/prototypes/portfolio/c/c.css` † (sticky panel at 1280 px only, progress rail, `timeline-scope` reveals in the no-preference guard, view transitions in the same guard, forced-colours borders, `scroll-margin-top` above sticky parts, reflow).
- [ ] T059 [P] [US1] Create `src/prototypes/portfolio/c/OptionTable.astro` †, `c/StickyVisual.astro` † and `c/Chapter.astro` †.
- [ ] T060 [US1] Create `src/prototypes/portfolio/c/ChapterStory.astro` †.
- [ ] T061 [P] [US2] Create `src/prototypes/portfolio/c/ChapterIndex.astro` †.
- [ ] T062 [US1] Create pages `src/pages/design/portfolio/c/focus-pocus.astro` † and `src/pages/design/portfolio/c/index.astro` † with `noindex` and titles "Chapters – …". Run T053 and T054 until they pass.
- [ ] T064 [US1] Build and run T055 to T057 plus the existing suites for C. Fix until green.
- [ ] T065 [US3] [PREVIEW-CHECK] Direction C manual checks for FR-039 (table and region by keyboard, sticky panel and rail do not hide focus, reading order matches story order with the sticky visual, text alternatives, announcements), recorded in the PR description.

**Checkpoint**: all three directions are built and pass their own tests.

---

## Phase 6: Hub page, cross-cutting suites and full gate (US1, US2, US3)

### Tests first

- [ ] T067 [P] [US1] Component test `tests/component/prototypes/portfolio/hub.test.ts` †: `h1` "Portfolio design directions", three directions each with name, summary and links to its index and story. See it fail.
- [ ] T068 [US1] E2E (`portfolio-directions.spec.ts`, hub section): hub links reach all six pages with status 200, noindex meta on every page, none of the seven routes appears in header, footer or `/sitemap-0.xml`, and `/design/portfolio/` shows a route to each direction; no non-prototype page in `TEMPLATES` links to any `/design/` address (FR-007); the extra-state axe runs of T029 also on the hub (FR-030, SC-003). Add the hub `/design/portfolio/` to `tests/e2e/portfolio-prototypes.ts` † in this task, before the hub exists. See it fail.
- [ ] T069 [US3] Test `tests/unit/prototypes/portfolio/visual-unaffected.test.ts` † that reads `tests/e2e/visual.spec.ts` and asserts it snapshots no `/design/` path (FR-054). File reads only, no git, so it runs in CI; the unchanged-baselines half of FR-054 is the scope-guard command. Then run the existing visual project and confirm it passes unchanged: `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1800; exec @ARGV' corepack pnpm run test:visual`. No baseline update is needed because no snapshotted page changes; do not run `test:visual:update`.

### Implementation

- [ ] T070 [US1] Create `src/pages/design/portfolio/index.astro` † (hub) using `directions` from `sample.ts` and `noindex`. Run T067 and T068 until they pass.
- [ ] T071 [US3] Run the full gate on the branch (FR-031): `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 3600; exec @ARGV' corepack pnpm run verify`. Fix any failure in the prototype code (never weaken a check or raise a budget). Existing visual baselines must match untouched.
- [ ] T072 [US3] Confirm the sitemap and headers: after the build, `dist/**/sitemap*.xml` has no `/design/` address and the CSP and headers specs still pass unchanged (FR-007, FR-050).
- [ ] T073 [US1] [PREVIEW-CHECK] Don reviews the sample story text and index entries on the preview deployment for content accuracy. This is not a merge condition (FR-003); record corrections in the Decision section or as follow-up for the real portfolio feature.
- [ ] T074 [US3] [PREVIEW-CHECK] Don checks by eye on the preview in both themes at phone and desktop widths: colour contrast of status labels, theme tags, draft marks, placeholder labels, diagram labels and focus rings (FR-033); zoom to 200% and a 320 px window for reflow (FR-034); and Windows High Contrast or an equivalent forced-colours view (FR-038).

**Checkpoint**: the full `verify` gate passes with prototypes in place.

---

## Phase 7: Screenshot capture setup and the 24 screenshots (US4)

### Tests first

- [ ] T075 [US4] Write `tests/unit/prototypes/portfolio/capture-config.test.ts` † asserting `tests/design/portfolio/capture.config.ts` exists, is a standalone Playwright config (not referenced by `playwright.config.ts` projects, so `verify` never runs it), and that the capture spec enumerates exactly 24 combinations (3 directions × index/story × phone 390 / desktop 1280 × light/dark) with names `<a|b|c>-<index|story>-<phone|desktop>-<light|dark>.webp`. See it fail.

### Implementation

- [ ] T076 [US4] Create `tests/design/portfolio/capture.config.ts` † (standalone, serves the production build on port 4321 through `wrangler dev` or the existing preview mechanism, reduced motion emulated, dark and light via `colorScheme`) and `tests/design/portfolio/capture.spec.ts` † (full-page PNG buffer, converted to WebP with `sharp`, each under 600 KB, written to `docs/design/portfolio/`). Run T075 until it passes.
- [ ] T077 [US4] Build, serve, and run the capture: `ASTRO_PREVIEW_BACKGROUND=1 corepack pnpm exec playwright test --config tests/design/portfolio/capture.config.ts`. Confirm `ls docs/design/portfolio/*.webp | wc -l` prints 24 and every file is under 600 KB.
- [ ] T078 [US4] [PREVIEW-CHECK] Don looks at the 24 images (for example in the finished document) and confirms each shows the whole page in its final state with nothing cut off or blank.

**Checkpoint**: 24 screenshots committed under `docs/design/portfolio/`.

---

## Phase 8: Decision document with placeholder preview URLs (US4)

### Tests first

- [ ] T079 [US4] Write `tests/unit/prototypes/portfolio/decision-doc.test.ts` † per contracts/decision-document.md: three direction headings; each direction's four behaviour labels (Story stages, Option comparison, Demo embeds, Scroll reveals), each paragraph mentioning reduced motion and JavaScript off, and the Demo embeds paragraph saying embedded or linked (FR-040); a Trade-offs section covering does well, does poorly, build and maintenance effort, and risks (FR-048); a New visual resources section that reads "None." or lists items (FR-049); a Comparison table with exactly the eight FR-048 rows; no ranking, scoring or recommendation wording such as "recommend", "best", "winner", "score" or "rank" (FR-041); the Contact hand-off section; exactly 24 image references each resolving to an existing file, with alt text naming its direction, page, width and theme (FR-042); the Decision section holds only the comment `<!-- Don: record the chosen direction and any changes here. -->` (FR-041); the story-content draft disclosure, the placeholder screenshots-and-clips disclosure and the no-live-demo stand-in disclosure (FR-049); the "pinned to commit" sentence and Cloudflare version-retention statement (FR-046, FR-047); no `docs/design/blog*` reference. The pinned-SHA assertion is skipped while the URLs are placeholders (guard on the literal `PINNED_URL_PLACEHOLDER`) and enforced in Phase 9. See it fail.

### Implementation

- [ ] T080 [US4] Draft `docs/design/portfolio.md` following contracts/decision-document.md, in plain language with no hype (FR-032, FR-048): introduction, `## Preview addresses` using the literal placeholders `PINNED_URL_PLACEHOLDER` and `PINNED_SHA_PLACEHOLDER`, the three direction sections (summary, preview links, screenshot table with alt text, How it works, Trade-offs including browser support, JavaScript, effort and scaling, New visual resources), Comparison, Contact hand-off pointing to `specs/006-portfolio-design-directions/contracts/contact-handoff.md`, and the empty Decision section. Run T079 until it passes (placeholder mode).
- [ ] T081 [US4] Commit and push the finished prototypes, the document and its 24 screenshots so Workers Builds creates the preview deployment for that commit. Do not start Phase 9 here.
- [ ] T082 [US4] [PREVIEW-CHECK] Don reads `docs/design/portfolio.md` end to end without the preview and confirms it is enough to choose a direction (SC-004), and confirms the Decision section is left for him.

**Checkpoint**: prototypes, screenshots and the draft document are pushed. The orchestrator's Finish step now captures the version preview URL and commit SHA of this last prototype commit.

---

## Phase 9: Pinned URLs and prototype removal

> **Runs only after the pipeline's Finish step has captured the pinned Cloudflare preview URL of the last prototype commit. The orchestrator triggers this phase. The implement phases before it leave every prototype in place. Do not start it on your own.**
>
> **One commit**: T083 to T088 change the working tree only; nothing is committed until T089. Any commit made between the pinned commit and the removal would itself be the last commit with prototypes and break FR-046. If a prototype must change, go back to Phase 7, recapture, and have the Finish step pin the new commit.

- [ ] T083 [US4] Fill in `docs/design/portfolio.md`: replace `PINNED_URL_PLACEHOLDER` with the captured version preview URL for the hub, and each direction's index and story address (`<url>/design/portfolio/`, `/a/`, `/a/focus-pocus/`, and so on), and `PINNED_SHA_PLACEHOLDER` with the last prototype commit's SHA (7 to 40 hex characters). Open the pinned hub and all six pages once to confirm they load.
- [ ] T084 [US4] Run `corepack pnpm exec vitest run tests/unit/prototypes/portfolio/decision-doc.test.ts` with the SHA assertion now enforced; it must pass before anything is deleted.
- [ ] T085 [US4] Remove every prototype file (staged for the single T089 commit): delete `src/pages/design/portfolio/`, `src/prototypes/portfolio/`, `tests/unit/prototypes/portfolio/`, `tests/component/prototypes/portfolio/`, `tests/e2e/portfolio-prototypes.ts`, `tests/e2e/portfolio-directions.spec.ts` and `tests/design/portfolio/`. Keep `docs/design/portfolio.md`, `docs/design/portfolio/*.webp` and the spec folder.
- [ ] T086 [US4] Revert the two ‡ shared edits: remove the `PORTFOLIO_PROTOTYPES` import and entry from `tests/e2e/templates.ts`, and remove the `/design/` condition from the sitemap filter in `astro.config.mjs`. Afterwards both files must match `origin/main` exactly (`git diff origin/main -- astro.config.mjs tests/e2e/templates.ts` prints nothing): the blog feature's identical edits never reach main (FR-053), so nothing of theirs is kept here.
- [ ] T087 [US4] Confirm the removal diff is docs only outside `specs/` and `.specify/`: `git fetch origin main` then `git diff --stat origin/main...HEAD -- . ':!specs' ':!.specify'` lists only `docs/design/portfolio.md` and `docs/design/portfolio/*.webp` (FR-043, SC-005), and `git diff --name-only origin/main...HEAD -- .specify` lists at most `.specify/feature.json` (Spec Kit's record of the current feature). Run the scope-guard command: it prints nothing, so `package.json`, the lockfile and all visual baselines are unchanged.
- [ ] T088 [US4] Re-run the full gate after removal (FR-031): `ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 3600; exec @ARGV' corepack pnpm run verify`, including that the `visual` project still passes with the untouched baselines and that `/design/portfolio/` now returns the not-found page.
- [ ] T089 [US4] Commit T083 to T088 together as one commit (filled-in document, deletions and reverts) and push. Open the PR from the `drc-agents` account (`gh auth switch --user drc-agents` before `gh pr create`, `gh auth switch --user drcdev` after), labelled major change, auto-merge off, with the manual-check results (T037, T052, T065, T074) in the description (FR-039, FR-044).
- [ ] T090 [US4] [PREVIEW-CHECK] Don opens the pinned addresses in the document, reviews the directions, records his choice in the Decision section, and approves the PR (Principle III).

---

## Dependencies and order

- Phase 1 then Phase 2 (blocks all directions). Phases 3, 4 and 5 run **in order A, B, C, never in parallel**: they all edit three shared test files, `tests/e2e/portfolio-directions.spec.ts` (T027 creates it; T041 to T043 and T055 to T057 add sections), `tests/e2e/portfolio-prototypes.ts` (T035, T050, T063, then T068) and `tests/component/prototypes/portfolio/no-inline-style.test.ts` (T013, extended by T025, T038, T053). Only tasks inside one phase that touch none of these files may run in parallel.
- Phase 6 needs all three directions. Phase 7 needs Phase 6 (a passing build). Phase 8 needs Phase 7's 24 images. Phase 9 needs the Finish step's pinned URL.
- Within a phase: tests before implementation, and each test seen failing first.

## Parallel examples

- Phase 2 tests: T008 to T013 and T066 together; implementation T014, T016 to T021, T023 together.
- Phase 3: T025 and T026 together; T030, T031 and T033 together.
- Phase 4: T038 to T040 together; T044, T046 and T048 together.
- Phase 5: T053 and T054 together; T058, T059 and T061 together.

## Coverage map

Every functional requirement and buildable success criterion, with the tasks that test (first) and build it.

- **Directions**: FR-001 distinct: T066, T015. FR-002 name, summary, both pages: T008, T067, T070. FR-003 Focus Pocus, draft marks: T008, T011, T015, T025, T073. FR-004 only site baseline and Flux: T013 (no new colours or fonts), T037/T052/T065 by eye. FR-005 no new visual resources: T013, T079. FR-006 addresses, hub, themes, widths: T027, T041, T055, T068, T070. FR-007 no navigation or search discovery: T002, T003, T027, T068, T072. FR-008 same shared content: T025 (inherited by T038, T053).
- **Story page**: FR-010 seven stages and headings: T024, T025, T027, T038, T053. FR-011 every option, chosen and reason: T025, T027, T039, T041, T053, T055. FR-012 visuals beside their stage, text alternatives: T011, T019, T020, T024, T027. FR-013 progressive reveal: T030, T044, T058, T037/T052/T065. FR-014 demo link and stand-in: T025, T046. FR-015 contact hand-off: T010, T017, T025, T027. FR-016 reduced motion everywhere: T029, T043, T057, shared a11y suite. FR-017 no JavaScript: T029, T043, T057, shared no-JS suite. FR-018 hidden-content rule: T029, T043, T057.
- **Index**: FR-020 entry fields: T026, T028, T040, T054. FR-021 five entries, story link only for Focus Pocus: T008, T026, T028. FR-022 filter, clear, no-match, announcements: T009, T012, T022, T028, T042, T056. FR-023 no-JS index: T012, T029. FR-024 same-direction story: T026, T028, T042. FR-025 status and themes as text: T011, T021.
- **Quality**: FR-030 axe in every state: shared a11y suite via T035/T050/T063/T068, extra states in T029, T043, T057, T068. FR-031 release gate before and after removal: T071, T088. FR-032 plain language: T015, T080. FR-033 contrast: T011, T020, T036, T074. FR-034 reflow: T027, T036, T055, T074. FR-035 keyboard and focus not obscured: T023, T027, T055. FR-036 target size: T012, T027. FR-037 AT labels: T011, T037. FR-038 forced colours: T029, T043, T057, T074. FR-039 manual checks in the PR: T037, T052, T065, T089.
- **Scope**: FR-045 and FR-050 to FR-054: scope-guard command (T007, every checkpoint, T087), T013, T069, T086. FR-053 shared edits added and reverted: T003, T005, T086. FR-054 visual unaffected: T069, T088.
- **Decision document and delivery**: FR-040, FR-041, FR-047, FR-048, FR-049: T079, T080. FR-042 screenshots: T075 to T078. FR-043 removal: T085 to T087. FR-044 major-change PR, auto-merge off: T089. FR-046 pinned commit: T081, T083, T084, T089 (single commit).
- **Success criteria**: SC-001: T027, T041, T055. SC-002: T029, T043, T057. SC-003: as FR-030. SC-004: T079, T082. SC-005: T087, T088. SC-006: T009, T028.
- No visual baseline update task is included: the prototype routes are not snapshotted and no already-snapshotted page changes.

## Implementation strategy

MVP is Phase 1, Phase 2 and Direction A end to end, then B and C in the same pattern. Ship nothing to main except the decision document, its screenshots and the spec folder (Phase 9).
