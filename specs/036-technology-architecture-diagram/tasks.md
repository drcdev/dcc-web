---

description: "Task list for the interactive architecture diagram on the Technology page"
---

# Tasks: Interactive architecture diagram on the Technology page

**Input**: Design documents from `/specs/036-technology-architecture-diagram/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/diagram-dom.md, contracts/part-files.md, quickstart.md

**Tests**: MANDATORY (constitution Principle I). Every story has test tasks ordered before the implementation they cover. Each test task names its one primary layer (the cheapest layer that can observe the behaviour, `docs/testing.md` "Where a test goes") and gives the reason for any second layer. Tests are written first and seen to fail (red) before the implementation task they cover.

**Organization**: Tasks are grouped by user story. Row ids (M01, P04, L06, J01, N01, R03 ...) refer to the contracts. No test file contains a `specs/` path literal; tests cite row ids and read real content through `tests/helpers/content.ts`, never by literal part names or paths.

**Visual baselines**: none change. Confirmed against `.claude/skills/_shared/visual-baselines.md` and `tests/e2e/visual.spec.ts`: the visual project snapshots only the shell (header, footer, open mobile menu), the not-found page and the fixture site, never real content, and the Technology page is not a snapshotted surface. This feature changes no shell, template or design-system token, so no `test:visual:update` or `test:visual:update:linux` task is needed (T038 re-confirms after implementation; any unpredicted visual diff is a regression to fix, not a baseline to refresh).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 (see the diagram), US2 (click a part), US3 (source links), US4 (no JavaScript)

## Phase 1: Setup

**Purpose**: Shared scaffolding every story depends on.

- [x] T001 Add the "Architecture part file" kind to `contentError` in `src/lib/content/errors.ts` (alongside "Page file", "Post file", "Project file"), used by P03, P04, P07 errors.
- [x] T002 [P] Create the part schema `src/content/schemas/architecture.ts`: `z.strictObject({ name: non-empty string, source: optional string })` (data-model §1; P01, P02).
- [x] T003 [P] Add an `architecture` option to `buildFixtureSite` in `tests/build/fixture-site.ts` that copies fixture part files from a given folder into the fixture site's `src/content/architecture/` (used by T016).

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: The layout module, the part-file check and the source helpers that every story renders from.

**CRITICAL**: No user story work starts until this phase is complete.

### Tests first

- [x] T004 [P] Unit test (layer: unit, pure data) for the layout module in `tests/unit/site/architecture-layout.test.ts`, rows L01-L09: 12 parts with the 12 pinned anchors (L01 / FR-009), shapes inside the viewBox, no overlaps except a group's `contains`, endpoints on edges, connections reference parts, FR-003 flow rules and the exact 9 connections of the Connections table (L06), label sizes 15 / 12.5 on a 240-wide viewBox (L07), top-to-bottom then left-to-right order (L08), coarse label-width fit (L09). Must fail (module missing).
- [x] T005 [P] Unit test (layer: unit) for the part schema in `tests/unit/content/architecture-schema.test.ts`, rows P01, P02 (blank or missing `name`, unknown key), using neutral example data. Must fail.
- [x] T006 [P] Unit test (layer: unit, temp folder with neutral data, because the logic is a pure file-system check and needs no build) for `assertPartSource` and `sourceUrl` in `tests/unit/content/architecture-source.test.ts`, rows P03 (absolute or `..` path), P04 (missing path), P05 (file gives `/blob/main/`), P06 (folder gives `/tree/main/`, no trailing slash), P07 (empty body). Must fail.
- [x] T007 Unit test (layer: unit) for `checkParts(layout, parts)` in `tests/unit/content/architecture-source.test.ts` (same file as T006, so not parallel with it), rows P08 (extra or missing ids) and P09 (label lines do not join to `name`). Must fail.

### Implementation

- [x] T008 Create `src/lib/architecture/layout.ts`: `Layout`, `LayoutPart`, `Connection` types and the 12-part, 9-connection layout in one vertical 240-unit-wide viewBox, per data-model §2-§4 (depends on T004). Box sizes and line breaks may be adjusted so labels fit (plan risk "Label fit at 240 units"); the size floors are fixed.
- [x] T009 [P] Create `src/lib/architecture/source.ts`: `REPOSITORY_URL` (github.com/drcdev/dcc-web), `assertPartSource(file, base, data)` (path inside the repository and existing, errors P03 / P04 naming the part file and path; git tracking is not checked here but by the P10 content test in T015, research R8) and `sourceUrl(root, path)` choosing blob vs tree from the file system (depends on T001, T006).
- [x] T010 [P] Create `src/lib/architecture/check.ts`: `checkParts(layout, parts)` returning or throwing the P08 / P09 errors via `contentError` (depends on T001, T007, T008).
- [x] T011 Register the `architecture` collection in `src/content.config.ts` (`glob()` loader on `src/content/architecture/*.md`, schema from T002, `generateId` calling `assertPartSource` and the empty-body check P07) (depends on T002, T009; cite the Astro content-collections docs page in a code comment as the plan does).
- [x] T012 Add the `architectureParts` reader to `tests/helpers/content.ts` (reads the real part files; returns id, name, source, body) for the content tests and the E2E spec.

**Checkpoint**: T004-T007 green; layout, check and source helpers ready.

---

## Phase 3: User Story 1 - See how the site fits together (Priority: P1) MVP

**Goal**: The Technology page shows the diagram first, with all 12 labelled parts and the 9 connections, readable at 320 px and desktop in both themes.

**Independent Test**: Open `/technology/` at 320 px and desktop in light and dark; every part is present, labelled and connected as the Connections table says; nothing is cut off; no sideways scroll.

### Tests first

- [x] T013 [P] [US1] Component test (layer: component, Astro container with neutral `parts` prop, because markup is observable without a build) in `tests/component/sections/ArchitectureDiagram.test.ts`, rows M01-M05, M09: figure with `id="architecture-diagram"` and figcaption, one `<svg role="group" aria-labelledby>`, exactly 12 part links with `<tspan>` label lines and no `aria-label`, boxes / lines / arrowheads / connection labels `aria-hidden`, a group's link covering only its tab, part and connection label classes, no `style` attribute. Must fail.
- [x] T014 [P] [US1] Build test (layer: build, because only the real `astro build` shows the built page) extending `tests/build/local-site.test.ts` (already in `test:build:content`), rows M01, M03, M06, M09, M10 and FR-014: on the built Technology page the diagram figure comes before every other body section, every part link's `#<id>` resolves to an entry with the same id (FR-009), all `id`s are unique, there is no `style` attribute, the kept sections (`Design`, `Analytics`, `Data locations`, closing note) are present in order after the explanations, and the `## Site`, `## Hosting`, `## Contact form` and `## Questions` headings are gone. Must fail.
- [x] T015 [P] [US1] Unit content test (layer: unit, reads the real part files through `architectureParts`; no edit needed when content changes) in `tests/unit/content/architecture-content.test.ts`, rows P08 on real data, P10 (every part but the browser has a source, the browser has none), P11 (two to five sentences, at most 100 words) and a check that part ids equal the layout ids. Must fail (files missing). In the same task, rewrite the `Technology` describe block in `tests/unit/content/site-pages.test.ts`: today it slices `technology.mdx` from `## contact form` to `## analytics`, which breaks once T021 removes that heading. Point its data-handling assertions at the contact path's part files instead (layout ids `contact-form`, `bot-check`, `email-path`, `inbox`, read through `architectureParts`): together they name email and none contains `d1`, `12 months`, `salted`, `fingerprint` or `deleted automatically`; neither `technology.mdx` nor any part file contains `stores contact submissions` or matches `canada|toronto`. Must fail (part files missing).
- [x] T016 [P] [US1] Build test (layer: build in `sync` mode, because only the real loader shows that `generateId` runs `assertPartSource`) in `tests/build/architecture-validation.test.ts` with a broken fixture `tests/fixtures/architecture/broken/` (a part file whose `source` does not exist), row P04 wiring: the build error names the file and the path. Uses fixtures only, so it is not content-tier. Must fail (depends on T003).
- [x] T017 [P] [US1] E2E test (layer: E2E, because label sizes and containment exist only in a real rendered browser) in `tests/e2e/architecture.spec.ts`, rows R01 (part labels at least 14 px, connection labels at least 12 px rendered at 320 px, light and dark), R02 (text resolves to Inter), R03 (each part label inside its box at 320 and 1280 px), R05 (each part link's clickable area at least 24 x 24 px at 320 px). Reads names through `architectureParts`. Must fail.

### Implementation

- [x] T018 [P] [US1] Write the 12 part files `src/content/architecture/<id>.md` (ids: `browser`, `questions-panel`, `contact-form`, `production`, `static-pages`, `worker-api`, `database`, `ai-model`, `bot-check`, `email-path`, `inbox`, `preview`) with `name`, `source` (none for `browser`, per the Parts table) and a two-to-five-sentence explanation of at most 100 words each. Carry over the still-true content of the removed Site, Hosting and Contact form sections per FR-014; production names www.doncoleman.ca and its own database; preview says every branch gets a separate Worker and database, preview emails are marked and Turnstile test keys are accepted; the contact path says nothing is stored and no IP address is kept (FR-013). Plain language, no hype. Verify each claim against the code the entry links to.
- [x] T019 [US1] Create `src/components/sections/ArchitectureDiagram.astro`: optional `parts` prop else the `architecture` collection, `checkParts`, the figure, caption (carrying the page's one-line introduction) and inline SVG with group frames, boxes, polylines with arrowhead markers and labels, then one `<a href="#id" data-part>` per part (M01-M05); scoped `<style>` using theme tokens only, no `style` attributes, `forced-colors: active` block, focus ring and selected-state cue (M09; research R6, R7). Entries are added in US2 (depends on T008, T010, T013, T018).
- [x] T020 [P] [US1] Register `ArchitectureDiagram` in `src/components/sections/index.ts` (`sectionNames`, `sectionComponents`) and `ArchitectureDiagram: section({})` in `src/components/sections/schemas.ts`; extend the existing registry tests first and see them fail, then register (layer: unit): `tests/unit/content/section-schemas.test.ts` ("lists the eight sections" becomes nine, with `ArchitectureDiagram`), `tests/unit/content/body.test.ts` (the `eight` list in the "is not a section" message, in registry order) and `tests/unit/site/docs-content-structure.test.ts` (every registered section documented in `docs/pages.md` in registry order, with an example). Add the `ArchitectureDiagram` entry and a `<ArchitectureDiagram />` example to the Components section of `docs/pages.md` in this task so that test goes green with the registration.
- [x] T021 [US1] Rebuild `src/content/pages/technology.mdx`: body starts with `<ArchitectureDiagram />`; remove `## Site`, `## Hosting`, `## Contact form` and the `## Questions` heading; keep `## Design`, `## Analytics`, `## Data locations` (table) and the closing note, in that order (FR-014, FR-015: frontmatter, visibility and nav unchanged). The only existing test that reads the removed headings is the `Technology` block of `tests/unit/content/site-pages.test.ts`, already rewritten in T015; confirm it is green. `tests/e2e/pages.spec.ts` checks only that `/technology/` answers 200 and needs no change; `tests/unit/content/navigation.test.ts`, `tests/e2e/shell.spec.ts` and `tests/e2e/templates.ts` reference the page's address and footer place only, which FR-015 keeps.
- [x] T022 [US1] Tune box sizes and label line breaks in `src/lib/architecture/layout.ts` until T017 (R01-R03, R05) passes at 320 and 1280 px in both themes, with 8 or more units of slack for Linux Inter being wider (FR-018).

**Checkpoint**: US1 delivered and independently testable: a correct, readable diagram renders first on the page.

---

## Phase 4: User Story 2 - Click a part to learn what it does (Priority: P1)

**Goal**: Activating a part moves to its entry in "How each part works", marks part and entry selected, and "Back to diagram" returns focus to the part.

**Independent Test**: Activate each part with mouse and with keyboard alone; each shows its own entry; selection, focus and back link behave per J01-J07.

### Tests first

- [x] T023 [P] [US2] Component test (layer: component) extending `tests/component/sections/ArchitectureDiagram.test.ts`, rows M06, M08: `<h2 id="how-each-part-works">`, one `<article id tabindex="-1" data-entry>` per part in layout order with an `<h3>` equal to the name, the generated "Connects to" line from the layout (omitted for parts with no outgoing connection, FR-017) and a `Back to diagram` link `href="#architecture-diagram"` with `data-back`. Must fail.
- [x] T024 [US2] E2E test (layer: E2E, because focus, fragments and the selected state need a real browser) in `tests/e2e/architecture.spec.ts` (same file as T017, so not parallel with it), rows J01 (click and Enter: fragment, `aria-current="true"`, `data-selected`, focus on the entry), J02 (single selection), J03 (deep link selects without moving focus), J04 (back link returns focus to the part, selection kept), J05 (non-part fragment such as `#design` clears selection), J06 (focus ring and non-colour selected cue visible in both themes and under forced colours), J07 (no smooth scroll or transition), plus Tab order top to bottom then left to right with no keyboard trap (SC-002). Must fail.
- [x] T025 [US2] A11y test (layer: a11y via axe; second layer is justified because the selected markup exists only after an activation, as with the questions panel, so the existing idle `technology` template scan in `tests/e2e/a11y.spec.ts` cannot see it) in `tests/e2e/architecture.spec.ts`: zero axe violations with a part selected, light and dark, 320 px and desktop (SC-003). Must fail until the selected state exists.

### Implementation

- [x] T026 [US2] Extend `src/components/sections/ArchitectureDiagram.astro` with the entries: `## How each part works` heading, one `<article>` per part rendering the body with `render()`, the "Connects to" line and the back link (M06, M08) (depends on T019, T023).
- [x] T027 [US2] Add the processed `<script>` (about 40 lines, deferred module from `/_astro/`, this page only) to `ArchitectureDiagram.astro`: on load and on `hashchange` select the part named by the fragment (`aria-current`, `data-selected`), clear on a non-part fragment, move focus to the entry only on user activation (J01), never on load (J03), and handle back-link clicks (J04). No animation (J07). Stays inside the 10 KB JS budget (research R5; depends on T024, T026).
- [x] T028 [US2] Finish the entry styling, focus ring, selected cue and forced-colours rules in the component's scoped style so T024 J06 and T025 pass (target sizes, contrast 4.5:1 text and 3:1 lines and cues in both themes, FR-010).

**Checkpoint**: US1 and US2 work independently; the interactive half of the issue is done.

---

## Phase 5: User Story 3 - Go from a part to its source code (Priority: P2)

**Goal**: Each entry (except the browser's) links to the right file or folder on the public repository's `main` branch, in a new tab, and a broken path fails the build.

**Independent Test**: Every source link points at an existing, git-tracked repository path; a deleted path fails the build with the part file and path named.

### Tests first

- [x] T029 [P] [US3] Component test (layer: component) extending `tests/component/sections/ArchitectureDiagram.test.ts`, row M07: source link `href` from `sourceUrl`, `target="_blank"`, `rel="noopener"`, visible text `Source: <path>` plus "(opens in a new tab)" inside the link, omitted when a part has no source. Must fail.
- [x] T030 [US3] E2E test (layer: E2E; second layer to the unit and build tests because it checks the rendered links on the real site, not the source rules) in `tests/e2e/architecture.spec.ts`: on the built page every source link in the entries has the `Source:` form, opens in a new tab with `rel="noopener"`, and no request goes to GitHub or another origin until a link is followed (FR-011, M11). Must fail.

### Implementation

- [x] T031 [US3] Add the source link to each entry in `ArchitectureDiagram.astro` using `sourceUrl` (M07; depends on T026, T029). P04, P10 are already covered by T015 and T016; T018's `source` values must pass them.
- [x] T032 [US3] Confirm the real source paths in the 12 part files all exist on `main` and are tracked (T015 green); note in the PR body that links to files added by this PR resolve only after merge (research R8).

**Checkpoint**: US3 works; stale links fail the gate.

---

## Phase 6: User Story 4 - Read it all without JavaScript (Priority: P2)

**Goal**: With JavaScript off, the diagram renders and every part's name, explanation, "Connects to" line, source link and back link is present and works.

**Independent Test**: Load with JavaScript disabled; follow each part link to its entry and each back link to the diagram.

### Tests first

- [x] T033 [US4] E2E test (layer: E2E with JavaScript disabled, because only a real browser shows the no-JS fragment behaviour) in `tests/e2e/architecture.spec.ts`, rows N01, N02 and SC-004: the diagram renders, every part link lands on its entry, each entry shows name, explanation, "Connects to" line and source link where it has one, and back links go to `#architecture-diagram`. Follow the pattern of `tests/e2e/no-js.spec.ts`. Write it before T019 (after T017, same file, in sequence), so it is seen red against the page without the diagram; it turns green as T019, T026 and T031 land, and T034 closes any gap left.

### Implementation

- [x] T034 [US4] Fix any gap T033 finds in `ArchitectureDiagram.astro` so the page needs no script for any content or link (FR-008); the script stays enhancement only.

**Checkpoint**: all four stories work independently.

---

## Phase 7: Polish and cross-cutting concerns

- [X] T035 [P] Docs: add to `docs/pages.md` how to edit a part (file plus layout), the build errors and the review trigger of FR-019 (any change to `worker/src/`, `wrangler.jsonc`, migrations or a linked file or folder is checked against the diagram in the same pull request); add an "Architecture diagram (feature 036)" placement note to `docs/testing.md`. `docs/pages.md` is the page's editing notes for FR-019; the Components entry itself was added in T020.
- [X] T036 [P] Confirm the existing checks still hold without edits: `tests/e2e/a11y.spec.ts` (technology template, both themes and widths), `tests/e2e/geometry.spec.ts` (no sideways scroll at 320 / 390 / 1280, R04), `tests/e2e/budget.spec.ts` (LCP, CLS, 10 KB JS, 150 KB total; SC-005) and `tests/e2e/site-links.spec.ts`; run the targeted files under the `perl` alarm (see `CLAUDE.md`). Fix the diagram, never the budget.
- [X] T037 Run the `quickstart.md` validation steps 1-3 locally (unit, component, build, E2E for the new files).
- [X] T038 Confirm no visual baseline changed: `git status` shows no change under `tests/e2e/visual.spec.ts-snapshots/`. Any visual diff is a regression to fix (`.claude/skills/_shared/visual-baselines.md`); do not refresh baselines for this feature.
- [X] T039 [P] Merge `origin/main` before the gate and resolve additive conflicts in the shared files by keeping both sides (`src/components/sections/index.ts`, `schemas.ts`, `src/content.config.ts`, `tests/helpers/content.ts`, `docs/testing.md`, `docs/pages.md`); watch for `.specify/feature.json` (keep own `feature_directory`).
- [ ] T040 Local verify gate per `.claude/skills/_shared/verify-gate.md`: commit everything, `git fetch origin`, `node scripts/ci/changed-paths.ts --base origin/main` for the tier, run only that tier's checks (this change is code, so expect the full `pnpm run verify`; ask Don first, and run it via the wrapper in the background under `perl` alarm with `ASTRO_PREVIEW_BACKGROUND=1`, reading `VERIFY_EXIT=`). CI recomputes the tier and is the gate. State the expected cost change of $0 a month in the PR body.

### Preview checks (unticked by subagents; listed in the PR body for Don; do not hold back auto-merge)

- [ ] T041 [PREVIEW-CHECK] On the PR preview at 320 px, 390 px and desktop, light and dark: the diagram is first, nothing is cut off, no sideways scroll, lines meet their boxes, labels read cleanly; at 200% zoom and with a WCAG 1.4.12 text-spacing override, the explanations lose no content and diagram labels are not clipped (FR-010; quickstart §4 items 1 and 9).
- [ ] T042 [PREVIEW-CHECK] Keyboard-only pass through every part and every back link: focus ring visible, order top to bottom, Enter moves to the entry and highlights part and entry, "Back to diagram" returns focus to the part; the focused part is never fully hidden by other page content (WCAG 2.4.11, FR-010) (SC-007, quickstart §4 items 2 and 5).
- [ ] T043 [PREVIEW-CHECK] Screen-reader pass (VoiceOver with Safari): each part's name is read on focus; Enter moves to the entry and its heading and explanation are read (SC-007, quickstart §4 item 7).
- [ ] T044 [PREVIEW-CHECK] Forced colours (Windows High Contrast or Chromium emulation): parts, lines, focus ring and selected state are visible (SC-007, quickstart §4 item 6).
- [ ] T045 [PREVIEW-CHECK] Follow each source link: it opens a new tab on GitHub `main` at the right file or folder (a file added by this PR resolves only after merge); open `/technology/#worker-api` directly and check the entry is highlighted; turn JavaScript off and check every link still works (quickstart §4 items 3-5).
- [ ] T046 [PREVIEW-CHECK] Read every explanation against how the site works today (FR-013, SC-007): nothing says the contact form stores messages; preview and production each have their own Worker and database; the contact path matches the constitution's private-data rules (quickstart §4 item 8).

---

## Dependencies and execution order

- Phase 1 has no dependencies. Phase 2 depends on Phase 1 and blocks all stories.
- US1 (Phase 3) and US2 (Phase 4) are both P1; US2 builds on the component US1 creates (T026 depends on T019), so run US1 first. US3 (T031) depends on T026; US4 (T034) depends on US1-US3 markup. T033 is written early, before T019 (see T033); T029 and T030 can be written in parallel with US2 work. T015 also rewrites the Technology block of `site-pages.test.ts`, so it must land before T021.
- Within a story: tests first and seen red, then implementation, then green.
- Polish depends on all stories; T040 is last (after T039); the PREVIEW-CHECK items come after the PR is open.

## Parallel opportunities

- Phase 1: T002 and T003 in parallel after T001.
- Phase 2 tests: T004, T005, T006 in parallel (T007 shares T006's file); implementation T009 and T010 in parallel once T008 and their tests exist.
- US1 tests: T013-T017 in parallel (different files; T017 shares `tests/e2e/architecture.spec.ts` with later E2E tasks, so write those in sequence). T018 (content) and T020 (registration) in parallel with each other.
- US2 tests T023 and T025 in parallel; T029 and T030 in parallel with US2 implementation.
- Polish: T035, T036, T039 in parallel.

## Implementation strategy

- MVP is US1: a correct, readable diagram first on the page (the page already has the content in the part files and no dead ends). Ship US1 + US2 together for the interactive core (both P1); US3 and US4 follow, each independently testable, and all land in one PR.
- Incremental order: Setup, Foundational, US1, US2, US3, US4, Polish. After each checkpoint run the story's targeted tests plus `pnpm run verify:quick` under the `perl` alarm; only the final tiered gate counts.

## Notes

- Out of scope (follow-ups, not done here): diagram accuracy beyond links remains review-owned; no new endpoint, dependency, binding or cost (FR-020).
- Never name real part content in tests; read it through `architectureParts`.

---

## Phase 8: Convergence

- [x] T047 Reword `src/content/architecture/preview.md` so it matches `wrangler.jsonc`: every change gets a preview on the one separate preview Worker (`dcc-web-preview`) with its own preview database, apart from the live site's Worker and database, not a Worker and database per change; keep the marked preview emails and Turnstile test keys; stay within P11 (two to five sentences, at most 100 words) per FR-013 (contradicts)
- [x] T048 Make the privacy-policy mention in `src/content/architecture/inbox.md` a Markdown link to `/privacy-policy/`, carrying over the removed Contact form section's link; confirm `tests/e2e/site-links.spec.ts` still passes per FR-014 (partial)
- [x] T049 Follow the first use of a technical name in each entry with a short plain description: "Worker" in `src/content/architecture/worker-api.md`, `production.md` and `preview.md` (for example "a small program that runs on Cloudflare's network"), and "Workers AI" in `ai-model.md`; keep each entry within P11 per FR-013 (partial)
- [x] T050 Extend the SC-002 test in `tests/e2e/architecture.spec.ts` (layer: E2E) with a Shift+Tab pass from the last part back to the first, in reverse layout order, and check that Shift+Tab from the first part leaves the diagram (no trap) per SC-002, US2/AC4 (partial)
