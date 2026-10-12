---

description: "Task list for the Wayfinder self-assessment"
---

# Tasks: Wayfinder self-assessment

**Input**: Design documents from `/specs/037-wayfinder-self-assessment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (assessment-data.md rows A1-A10, assessment-ui.md rows U1-U21, results-link.md rows L1-L7), quickstart.md

**Tests**: Mandatory (constitution Principle I). Every test task is written first, seen to fail, and
names its one primary layer from "Where a test goes" in `docs/testing.md`. A second layer carries a
written reason in the task. Tests come before the implementation they cover.

**Organization**: Grouped by user story. Foundational work (the data file, the moved text, the
shared pure modules) blocks every story because all four render from, or read, the one data file.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1 to US4 from spec.md
- **[PREVIEW-CHECK]** (suffix at the end of the task line): cannot be verified by an agent locally (needs the preview deployment or
  Don's eyes). Left unticked by the subagent and listed in the PR body
  (`.claude/skills/_shared/preview-check.md`).
- Toolchain: follow `CLAUDE.md` "Local toolchain" (`node -v`, nvm, no `timeout`) for every
  `pnpm`/`astro`/`playwright` call. Ask Don before a full `pnpm run verify`.

## Paths

Single Astro project: `src/`, `tests/`, `docs/` at the repository root; paths as in plan.md
"Project Structure". E2E and a11y specs find the post through `postsWithAssessment()` and read
expectations from the YAML; they never name the post (docs/testing.md "Real content in tests").

---

## Phase 1: Setup

- [X] T001 Confirm the toolchain (`node -v` against `.nvmrc`) and run the existing `tests/build/question-source.test.ts` and `tests/unit/content/body.test.ts` once to record a green starting point on this branch; no file changes.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: the single data file, the schema, the build-time checks, the three post components
that render the moved text, and the question-source expansion (FR-004, FR-014, FR-021, rows A1-A10).

### Tests first

- [X] T002 [P] Write `tests/unit/assessment/schema.test.ts` for the Zod schema in `src/content/schemas/assessment.ts`: rows A1 (missing or empty field, unknown key, other than five shifts or three statements, scale not five labels), A2 (repeated shift id or anchor), A3 (scale ends not "Rarely"/"Almost always"). Layer: unit (pure schema logic).
- [X] T003 [P] Write `tests/unit/assessment/version.test.ts` for `src/lib/assessment/version.ts`: the version changes on any statement text edit (even a typo) and on reordering shifts or statements, and does not change when reminders, week text, shift names, From/To, labels, title or intro change (FR-014). Layer: unit.
- [X] T004 [P] Write `tests/unit/assessment/result-link.test.ts` for `src/lib/assessment/result-link.ts`: encode/decode round trip, the grammar in `contracts/results-link.md`, rejection of malformed, out-of-range, wrong-count and altered fragments, date handling, `kind` of none/result/malformed. Layer: unit.
- [X] T005 [P] Write `tests/unit/assessment/checks.test.ts` for `src/lib/assessment/checks.ts`: A9 (post From/To line differs from the data file) and A10 (a moved practical application or week text still verbatim in the post prose). Layer: unit.
- [X] T006 [P] Write `tests/unit/assessment/question-text.test.ts` for `src/lib/assessment/question-text.ts`: `PracticalApplication` and `DevelopmentPlan` tags expand to "Practical Application: ..." and the six "Week N: <name>" paragraphs in place, `SelfAssessment` is dropped, no component tag remains (FR-021). Layer: unit.
- [X] T007 [P] Extend `tests/unit/content/body.test.ts` for row A8: `validatePageBody` for kind "post" accepts the three post components and rejects any other tag with the extended allowed-names list. Layer: unit.
- [X] T008 [P] Write `tests/component/assessment/PracticalApplication.test.ts` and `tests/component/assessment/DevelopmentPlan.test.ts` using the Astro container API with a `data` prop: same markup as the old prose, text equal to the data file field; A4 and A5 errors name the post file, the id and the known ids. Layer: component (Astro components render from data).
- [X] T009 [P] Add `tests/fixtures/assessments/` fixture data files and `tests/fixtures/posts/broken/a01-*.mdx`, `a04-*.mdx`, `a05-*.mdx`, `a09-*.mdx`, `a10-*.mdx` and extend `tests/build/post-validation.test.ts` so each broken fixture fails the real `astro build` with a message naming the file and the field (rows A1, A4, A5, A9, A10). Layer: build (only the real build shows the error reaching output). Rows A6 and A7 are added in T040.
- [X] T010 [P] Extend `tests/build/question-source.test.ts`: every built `question-source.json` for a post using the components holds each data-file practical application and week text and no component tag; the hash covers the expanded text (FR-021). Layer: build (needs the real built route output).
- [X] T011 Add `postsWithAssessment()` to `tests/helpers/content.ts`, returning the posts that render `SelfAssessment` with their parsed YAML, and extend the content-literal guard if needed. Layer: n/a (test helper used by later e2e and a11y tasks).

### Implementation

- [X] T012 Create `src/content/schemas/assessment.ts` (Zod from `astro/zod`, refinements A2 and A3) and register the `assessments` collection with the `glob()` loader in `src/content.config.ts`.
- [X] T013 Create `src/content/assessments/wayfinder.yaml`: move the five Practical Application paragraphs and the six-week plan texts out of the post unchanged, add shift names, From/To, anchors, the five scale labels, title and intro, and draft three statements per shift worded so agreeing places the reader nearer "To" (from the post text and Common Pitfalls). Statement wording is reviewed by Don in T038.
- [X] T014 [P] Create `src/lib/assessment/version.ts` (statement set version, `node:crypto`, research R5).
- [X] T015 [P] Create `src/lib/assessment/result-link.ts` (encode, decode, URL per `contracts/results-link.md`).
- [X] T016 [P] Create `src/lib/assessment/checks.ts` (A9 and A10).
- [X] T017 [P] Create `src/lib/assessment/question-text.ts` (FR-021 expansion).
- [X] T018 Create `src/lib/assessment/lookup.ts` (`getEntry` wrapper raising A4/A5 through `contentError`). The A6/A7 heading checks are added in T043, after their test T040.
- [X] T019 [P] Create `src/components/assessment/PracticalApplication.astro` and `DevelopmentPlan.astro` rendering the same markup the prose had.
- [X] T020 Create `src/components/assessment/index.ts` (the post-only component registry, names exported for `validatePageBody`) and update `src/lib/content/body.ts` so kind "post" accepts them (A8).
- [X] T021 Update `src/pages/writing/[slug].astro` to pass the registry as `components`, run the A9/A10 checks, and hash the expanded question source; update `src/pages/writing/[slug]/question-source.json.ts` to expand through `question-text.ts` before `prepareQuestionSource()`.
- [X] T022 Edit the Wayfinder post in `src/content/posts/` (the-systems-leadership-wayfinder MDX): replace the five Practical Application paragraphs with `<PracticalApplication assessment="wayfinder" shift="..." />` and the six week paragraphs with `<DevelopmentPlan assessment="wayfinder" />`; leave shift names and From/To lines in the prose.
- [X] T023 [P] Document the three components and rows A1-A10 in `docs/posts.md`.
- [X] T024 Run T002-T010 and confirm they pass; run `pnpm run test:build` on the post-validation and question-source tests.

**Checkpoint**: the post renders its moved text from the data file, the question source is unchanged in content, bad data fails the build with the file named.

---

## Phase 3: User Story 1 - Take the self-assessment and see where I sit (P1) - MVP

**Goal**: one form of fifteen statements, validation, chart and text summary.

**Independent Test**: answer all fifteen; the chart and summary show one position per shift equal
to the mean of its three answers (SC-002).

### Tests first (US1)

- [X] T025 [P] [US1] Write `tests/unit/assessment/score.test.ts` for `src/lib/assessment/score.ts`: mean per shift, low band below 3, band phrases ("nearer 'From' (...)", "in the middle" at exactly 3, "nearer 'To' (...)"), one-decimal formatting, change text ("up 0.7", "down 0.3", "no change") (FR-005, FR-007, SC-002). Layer: unit.
- [X] T026 [P] [US1] Write `tests/component/assessment/SelfAssessment.test.ts`: five fieldset groups named by shift, 15 statement fieldsets of five labelled radios, `type="button"` buttons, statement list for no-JS, one JSON data attribute carrying the version and no answers, h3 inside the h2 (U1 structure, U2, U18 markup, FR-001). Layer: component (markup from data).
- [X] T027 [P] [US1] Write `tests/build/assessment-scripts.test.ts`: only posts rendering the block carry the loader, the chunk reference, the styles and the title-card line; other pages' HTML has none and their shared scripts are unchanged (U16, SC-005). Layer: build (the check spans built output across pages).
- [X] T028 [US1] Write `tests/e2e/self-assessment.spec.ts` (US1 section): empty submit shows the error summary with the count, a link per unanswered statement, `aria-invalid` and "Choose an answer", focus on the first unanswered radio (U3); full answers show chart and summary matching the means (U4); status text and DOM order (U5); changing an answer and resubmitting updates both; keyboard-only completion; no CSP violation and no `style` attribute set by the module (U19); the module chunk is not requested at load while the block is more than one viewport below and is requested once the block comes within one viewport height (U16 second half, L4, FR-017); answering and showing results trigger zero network requests (U15 first half, FR-016); at 320 px, at 200% zoom and with the WCAG text-spacing overrides the form, chart rows and band phrases show no sideways scroll or clipping (U17 layout part, FR-018). Layer: e2e (a journey in a real browser). Must fail before T031-T036.
- [X] T029 [P] [US1] Extend `tests/e2e/no-js.spec.ts` for U18: post reads in full including the moved text, the block shows the JS note and the statement list, no form controls visible. Layer: e2e (JavaScript off needs a browser context).
- [X] T030 [P] [US1] Write `tests/e2e/self-assessment.a11y.spec.ts` (empty form, errors shown, results shown; light and dark): axe with the WCAG 2.2 AA tags, plus the checks axe does not make: each answer choice with its label and each button is at least 24 x 24 CSS px (2.5.8); every control reached by Tab shows a focus indicator not fully hidden by the sticky header (2.4.7, 2.4.11); chart track, marker, focus indicator and radio boundary colours reach 3:1 against their background in each theme (1.4.11); forced colours keep the track and marker visible. Layer: a11y. Second layer beside the template a11y runs because these states exist only after interaction.

- [X] T062 [P] [US1] Extend `tests/e2e/budget.spec.ts` with the Wayfinder post measured at load and after scrolling to the block, answering all statements and showing results, under the existing slow-4G / 4x CPU conditions: LCP 2.5 s, CLS below 0.1, long tasks 200 ms, JavaScript 10 KB, total 150 KB (FR-018b, SC-005). Layer: budget (the only layer that measures transferred bytes and timing). Written here, before T031-T036, and seen to fail (the after-results case cannot answer a form that does not exist yet); it is re-run after US4 in T067. Tighten nothing; if it fails later, fix the code, never the limit. (ID kept from the first draft; position, not number, sets the order.)

### Implementation (US1)

- [X] T031 [US1] Create `src/lib/assessment/score.ts` (shared pure scoring, bands, phrases, change text).
- [X] T032 [US1] Create `src/components/assessment/SelfAssessment.astro`: h2 and intro, form, no-JS note and statement list, status region, empty result containers, bootstrap `<script>` using `IntersectionObserver` (one viewport height) to `import()` the module, scoped styles with 24 px targets, 320 px layout, dark and forced-colours support.
- [X] T033 [US1] Create `src/lib/assessment/client.ts` (US1 part): read answers, validate with the error summary and focus rule, compute scores, draw the SVG chart (one row per shift, From/To at the ends, marker at `(score-1)/4`, accessible name pointing at the summary), write the text summary and the polite status messages ("Your results are ready below.", "Your results are updated.").
- [X] T034 [P] [US1] Create `src/components/assessment/AssessmentLink.astro` (reserved one-line title-card link "Take the self-assessment" to the assessment heading) and add the optional empty `title-extra` slot to `src/layouts/PostLayout.astro`, rendering exactly today's markup when empty.
- [X] T035 [US1] In `src/pages/writing/[slug].astro` render `AssessmentLink` into the slot only for posts that render `SelfAssessment` (the A6 and A7 checks come in T043, after T040).
- [X] T036 [US1] Add `<SelfAssessment assessment="wayfinder" />` under its `##` heading in the Wayfinder post between Mindset Shift #5 and "The Systems Leadership Wayfinder" (FR-001).
- [X] T037 [US1] Run T025-T030 and T062 and confirm they pass.
- [ ] T038 [P] [US1] Don reviews the drafted statement wording in `src/content/assessments/wayfinder.yaml` on the preview and edits it (any later edit invalidates older results links by design). [PREVIEW-CHECK]
- [ ] T039 [P] [US1] SC-001: on the preview Don takes the assessment once without hurrying and confirms it takes under 5 minutes. [PREVIEW-CHECK]

**Checkpoint**: US1 works alone and is the MVP.

---

## Phase 4: User Story 2 - From a low score to what to practise (P2)

**Goal**: low-band shifts link to their section and show the Practical Application paragraph.

**Independent Test**: answer so two shifts score low; exactly those two show links that land on the matching heading, not hidden under the header.

### Tests first (US2)

- [X] T040 [P] [US2] Extend `tests/build/post-validation.test.ts` with `tests/fixtures/posts/broken/a06-*.mdx` and `a07-*.mdx`: a shift anchor not matching a rendered heading id, and two `SelfAssessment` tags for the same assessment, each failing the build naming the post file and the shift. Layer: build (checks run against the real rendered headings).
- [X] T041 [P] [US2] Extend `tests/unit/assessment/score.test.ts`: low-band selection (below 3 only), none-low case naming the lowest-scoring shift (ties keep the post's order) as "Next to practise" (FR-008). Layer: unit.
- [X] T042 [US2] Extend `tests/e2e/self-assessment.spec.ts` (US2 section): two low shifts show exactly two "Read <name>" links and the unchanged Practical Application text; following one puts the heading in view below the sticky header, focuses it, leaves the fragment unchanged (U6, U7); all-middle answers show "None of your scores is below the middle." plus the next shift; reduced-motion scrolls instantly (U20). Layer: e2e (scroll position and focus need a browser).

### Implementation (US2)

- [X] T043 [US2] Add `selectLowBand` and `nextToPractise` to `src/lib/assessment/score.ts`, and add the A6 (shift anchor matches a rendered heading id) and A7 (one `SelfAssessment` per assessment) checks to `src/lib/assessment/lookup.ts`, called from `src/pages/writing/[slug].astro` (tests: T040).
- [X] T044 [US2] Extend `src/lib/assessment/client.ts`: render low-band links and paragraphs (from the data attribute), the none-low message, heading focus on follow, smooth scroll only without reduced motion; confirm the mindset-shift headings have enough `scroll-margin-top` for the header (adjust in `SelfAssessment.astro` global rules, not the shell).
- [X] T045 [US2] Run T040-T042 and confirm they pass.

---

## Phase 5: User Story 3 - Print a six-week plan shaped by my results (P2)

**Goal**: the print gives only the plan, ordered by score; without results the post prints the statement list.

**Independent Test**: after results, print preview shows only the plan on at most two pages, weeks ordered by score.

### Tests first (US3)

- [X] T046 [P] [US3] Write `tests/unit/assessment/plan.test.ts` for `src/lib/assessment/plan.ts`: weeks 1-5 ordered lowest to highest, ties keep the post's order, all-tied keeps the post's order, week 6 integration (FR-010). Layer: unit.
- [X] T047 [US3] Extend `tests/e2e/self-assessment.spec.ts` (US3 section): with print media emulated and results shown, only the plan sheet is visible in the stated reading order (title, date, five positions, results link, weeks 1-6); header, footer, share area and post are hidden (U8); `page.pdf` on A4 and Letter gives at most two pages (U9, SC-003); the browser-menu path gives the same plan; without results the print holds the statement list and no form controls (FR-011). Layer: e2e (print media and PDF need a browser).

### Implementation (US3)

- [X] T048 [US3] Create `src/lib/assessment/plan.ts` (stable order by sum).
- [X] T049 [US3] Extend `src/lib/assessment/client.ts`: "Print my plan" button calling `window.print()`, append the plan sheet to `<body>` and set `data-assessment-plan` on `<html>` while a result is shown, the sheet built from the same data fields as the post.
- [X] T050 [US3] Add the print styles to `src/components/assessment/SelfAssessment.astro` (plan-only when the root attribute is set, statement list without controls otherwise, A4 and Letter fit); shipped only on posts that render the block.
- [X] T051 [US3] Run T046-T047 and confirm they pass.
- [ ] T052 [P] [US3] Don opens the print preview on the preview deployment in his browser for A4 and US Letter and confirms the plan reads in the stated order on at most two pages. [PREVIEW-CHECK]

---

## Phase 6: User Story 4 - Retake later and see how I have grown (P3)

**Goal**: results link, earlier result on load, comparison chart, clear, and no network traffic.

**Independent Test**: take the assessment, copy the link, open it fresh, retake with different answers, see both results with the change per shift.

### Tests first (US4)

- [X] T053 [US4] Extend `tests/e2e/self-assessment.spec.ts` (US4 section): L1 earlier result shown at once with "Earlier result from <date>" and the title-card link text swapped without a layout shift; L2 older version shown on its own and a retake shown separately with no change; L3 malformed fragment gives "This results link could not be read.", the link keeps its wording and the fragment stays as it is until results are shown or cleared; with a fragment the module chunk is requested at once (U16, FR-017); L5 `replaceState` leaves `history.length` unchanged; L6 clear removes answers, earlier result, plan and fragment; U10 link text and "Copy link" with the sharing sentence; U12/U13 hollow diamond and filled circle with a legend and change text; U14 status "Your answers have been cleared." and focus on the first radio (FR-009); U20 activating the title-card link (either wording) focuses its target heading and leaves the fragment unchanged. Layer: e2e (journey, history and focus).
- [X] T054 [US4] Add a request-recording journey to `tests/e2e/self-assessment.spec.ts` opened through a results link: answering, showing, following a link, copying, printing and clearing trigger zero requests, and no request of any kind (fetch, XHR, beacon, image, script, style, font, navigation, prefetch, WebSocket) has the fragment, `result=` or an answer in its URL, headers or body; no cookies, local storage, session storage, IndexedDB or Cache Storage written (L7, U15, SC-004, FR-012, FR-016). Layer: e2e (only a browser records every request); it extends the recorder T028 started for answering and showing, in the same file and layer, so the privacy guarantee is observed in one spec.
- [X] T055 [US4] Add CLS cases to `tests/e2e/self-assessment.spec.ts`: opened through a results link at 320 and 390 px, layout-shift entries before first input sum to 0 (U21, FR-018a); and with a comparison shown, at 320 px, 200% zoom and text-spacing overrides the two-marker chart rows, change text and results link (wrapping anywhere) show no sideways scroll or clipping (U17, US4 part; the US1 part is in T028). Layer: e2e (layout shift and zoom need a real browser).
- [X] T056 [US4] Extend `tests/e2e/self-assessment.a11y.spec.ts` with the comparison, two-separate-results and unreadable-link states in light and dark: axe, 3:1 non-text contrast for the hollow diamond, filled circle and legend markers, 24 x 24 targets for "Copy link", and forced-colours checks of both markers, the tracks and the legend (SC-006, FR-013, FR-018). Layer: a11y (axe); second layer reason as in T030.

### Implementation (US4)

- [X] T057 [US4] Extend `src/lib/assessment/client.ts`: decode the fragment on load (eager `import()` when a fragment is present), render the earlier result with date and the older-version mark, retake comparison chart (circle/diamond, legend) and change text, separate panels for non-comparable results, results link text with "Copy link" and the sharing sentence, `history.replaceState` on results and clear, "Clear my answers", title-card link text swap to "Your earlier result is below" with focus on its target, unreadable-link status.
- [X] T058 [US4] Add the matching styles (diamond and circle markers, legend, link wrapping anywhere, forced-colours) to `src/components/assessment/SelfAssessment.astro`, keeping `client.ts` near the 6 KB compressed target.
- [X] T059 [US4] Run T053-T056 and confirm they pass.

---

## Phase 7: Polish and cross-cutting

- [x] T060 [P] Add the FR-016a paragraph to `src/content/pages/privacy-policy.mdx` (runs only in the browser, the site never receives or stores answers or scores, the results link holds the scores in the page address so anyone it is shared with can see them). Layer: none beyond the existing page checks (copy, not behaviour).
- [ ] T061 [P] Don reads the privacy paragraph in `src/content/pages/privacy-policy.mdx` on the preview for wording. [PREVIEW-CHECK]
- [ ] T063 [P] Don checks on the preview that the moved Practical Application paragraphs read word for word as before (quickstart step 1). [PREVIEW-CHECK]
- [ ] T064 [P] Don does the screen-reader pass (errors, results, text summary says all the chart shows) and the no-JavaScript list reading order on the preview (SC-006 manual part). [PREVIEW-CHECK]
- [ ] T065 [P] FR-016b, post-release: Don opens one production page view of the Wayfinder post through a results link and inspects the Web Analytics beacon payload. Pass: no field contains `#`, `result=` or any part of the fragment. Fail: add a Web Analytics exclude rule for the post's path the same day and open a follow-up issue. [PREVIEW-CHECK]
- [x] T066 Visual baselines: no baseline update is needed (see "Baseline conclusion" below). Run `pnpm run test:visual` and confirm it passes with no diff; any diff is a regression to fix in `PostLayout.astro` (empty slot must render today's markup), not a reason to refresh baselines. Only if a diff is intended after review, run `pnpm run test:visual:update` then `pnpm run test:visual:update:linux` (needs Docker Desktop) per `.claude/skills/_shared/visual-baselines.md`.
- [x] T067 Re-run `tests/e2e/budget.spec.ts` (T062) against the finished module, run the quickstart walk-through steps 2-13 and 16 locally and the local gate: `changed-paths.ts --base origin/main` tier only; ask Don before a full `pnpm run verify` (CLAUDE.md, memory: parallel gates crash his machine).

---

## Baseline conclusion

No visual-baseline update tasks beyond the no-diff check in T066. `tests/e2e/visual.spec.ts` snapshots the
design system and the templates against the fixture site (listing, `/writing/every-part/`,
`/writing/drift/`, projects, contact form, header, footer, mobile menu) and never the real Wayfinder
post. The only shared surface this slice touches is `PostLayout.astro`, which gains an optional named
slot that renders nothing when empty, so every snapshotted post keeps exactly today's markup. No
shell, token or Tailwind theme change; print rules apply to print media only.

## Dependencies and order

- Phase 1, then Phase 2 (blocks all stories). Within Phase 2: tests T002-T011 before T012-T023, T024 last.
- US1 (Phase 3) after Phase 2. US2 and US3 each depend on US1's `client.ts` and `SelfAssessment.astro`; US3 also uses `result-link.ts` and `version.ts` from Phase 2. US4 depends on US1 and the print sheet from US3 (the link is printed).
- US2 and US3 can proceed in parallel after US1 only if their `client.ts` and `SelfAssessment.astro` edits are merged carefully; default is sequential.
- Polish after the stories. T062's budget test is written with the US1 tests, before any client code, and re-run in T067 once US2-US4 have added to the module.
- Edits to `[slug].astro`, `PostLayout.astro`, `body.ts`, `content.config.ts`, `privacy-policy.mdx`, `docs/posts.md`, `budget.spec.ts` and `tests/helpers/content.ts` are small and additive; on a sibling-worktree conflict, merge `origin/main` and keep both sides.

## Parallel examples

- Phase 2 tests: T002-T010 touch different files and run together.
- Phase 2 modules: T014-T017 and T019, T023 are independent files.
- US1 tests: T025, T026, T027, T029, T030, T062 together; T028 shares `self-assessment.spec.ts` so goes alone.

## Implementation strategy

MVP is Phase 1, Phase 2 and US1: the post renders from the data file and a reader can take the
assessment and see results. Then US2 (links), US3 (print), US4 (retake), then Polish. Each story ends with its tests green before the next starts.

## PREVIEW-CHECK items (for the PR body)

T038 statement wording, T039 SC-001 usability, T052 print preview A4 and Letter, T061 privacy paragraph, T063 moved text reads unchanged, T064 screen-reader and no-JS reading order, T065 production beacon (FR-016b, post-release).

---

## Phase 8: Convergence

- [x] T068 [P] Add a `headingId` case block to `tests/unit/assessment/` (new `lookup.test.ts` or beside `checks.test.ts`): for the real data file's title and for titles with `?`, `#`, `:`, an apostrophe, curly quotes and repeated spaces, `headingId(title)` equals the id Astro's Markdown renderer gives `## <title>` (github-slugger), so the block's `aria-labelledby` and the title-card link always name a rendered heading. Layer: unit. per Constitution I, U20 (partial)
- [x] T069 [P] Add `tests/fixtures/posts/broken/a11-block-without-heading.mdx` (renders `<SelfAssessment assessment="sample" />` with no `## <title>` heading above it) and a case in `tests/build/post-validation.test.ts` asserting the real build fails naming the post file and the needed heading, covering the existing check in `src/pages/writing/[slug].astro` that no test exercises. Layer: build (the check runs against rendered headings). per Constitution I, plan: title-card link target (partial)
- [x] T070 [P] Extend `tests/unit/assessment/schema.test.ts`: a scale with two equal labels is rejected with a message on `scale` (the distinct-labels refinement in `src/content/schemas/assessment.ts` has no test). Layer: unit. per Constitution I, A1 (partial)
- [x] T071 [P] Extend `tests/unit/assessment/checks.test.ts`: `checkFromToLines` does not throw for a shift whose anchor matches no heading (that case is left to A6), so A9 and A6 never report the same fault twice. Layer: unit. per Constitution I, A9 (partial)
- [x] T072 [P] Extend `tests/e2e/no-js.spec.ts`: with JavaScript off and print media emulated, the Wayfinder post (found through `postsWithAssessment()`) prints the statement list with all fifteen statements and no visible form controls (quickstart step 11 second half; the existing FR-011 print test runs with JavaScript on). Layer: e2e (JavaScript off and print media need a browser). per FR-011 (partial)

## Phase 9: Shorter post (Don's PR #176 review, 2026-10-11)

- [x] T073 Remove everything after "## Printable Resources" from the Wayfinder post (the "Practical First Steps" section, "Immediate Actions (This Week)" and the "6-Week Development Plan" with its intro), delete `src/components/assessment/DevelopmentPlan.astro` and every use of it (registry, question-source expansion, the A10 week check, its tests and fixtures, `docs/posts.md`). The week texts and integration week stay in the data file for the printed plan (US3). The `DevelopmentPlan` parts of T005, T006, T007, T008, T010, T019, T022 and T023 are superseded. Layer: unit, component and build tests updated with the change.

## Phase 10: Collapsed behind a button (Don's PR #176 review, 2026-10-11)

- [ ] T074 Wrap everything below the assessment heading in `src/components/assessment/SelfAssessment.astro` in a native `<details>` whose `<summary>` is a "Take the self-assessment" button (FR-001a, U22): collapsed by default; the bootstrap opens it for any `#result=` fragment and for a fragment naming something inside it, and loads the module on open; the title-card link targets the content id from `assessmentContentId` (`src/lib/assessment/lookup.ts`) so the browser opens it with JavaScript off; `client.ts` opens it before going to the heading; print shows the statement list while collapsed. Tests first: component (`tests/component/assessment/SelfAssessment.test.ts`: one details, collapsed, summary text, content id), e2e (`tests/e2e/self-assessment.spec.ts`: collapsed by default, button, Enter and Space, open loads the module, title-card link before and after the module, in-page link, results link opens it, print while collapsed), a11y (`tests/e2e/self-assessment.a11y.spec.ts`: axe while collapsed in both themes, target size, focus ring, forced-colours indicator), no-JS (`tests/e2e/no-js.spec.ts`: the button and the title-card link reveal the list) and the budget journey opens the block (`tests/e2e/budget.spec.ts`). Layer: as named per test. Open: the budget journey now loads the two Printable Resources infographics below the collapsed block when it scrolls there, so its total-bytes check fails; awaiting Don's decision.
