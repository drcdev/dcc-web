---

description: "Task list for the collapsible questions panel on small screens"
---

# Tasks: Collapsible questions panel on small screens

**Input**: Design documents from `/specs/046-mobile-questions-disclosure/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/questions-disclosure.md, quickstart.md

**Tests**: Mandatory (constitution Principle I). Every story has test tasks ordered before the implementation they cover, and each test task names its one primary layer (`docs/testing.md`, "Where a test goes"). A second layer carries a written reason. Run each new test and see it fail before the implementation task that follows it.

**Organization**: Grouped by user story. All stories edit one component (`src/components/post/QuestionsPanel.astro`), so implementation tasks are sequential; test tasks in different files can run in parallel.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 closed bar on small screens, US2 open and use, US3 wide screens, US4 JavaScript off
- **Layer**: component (Vitest, Astro Container API), e2e (Playwright `sections` project on the fixture site), a11y, budget, visual

## Phase 1: Setup

- [ ] T001 Run `node -v` and, if it differs from `.nvmrc`, `source ~/.nvm/nvm.sh && nvm use` in the same command as every toolchain call (CLAUDE.md "Local toolchain"); read `docs/testing.md` ("Where a test goes", "Critical-thinking questions") and `specs/046-mobile-questions-disclosure/contracts/questions-disclosure.md`
- [ ] T002 [P] Read `src/components/post/QuestionsPanel.astro`, `tests/component/post/QuestionsPanel.test.ts`, `tests/e2e/questions.spec.ts` and the 022 P20/P21 tests to list the tests this feature replaces (three P20 tests) and the ones that must keep passing unchanged (P21, P21a, P21b)

---

## Phase 2: Foundational (markup shared by all stories)

**Purpose**: the disclosure markup and the heading rename, which every story depends on.

- [ ] T003 Rewrite the P07 test and add D02/D03/D04 markup tests in `tests/component/post/QuestionsPanel.test.ts`. Layer: component (markup and exact strings need no browser). Assert: aside is a landmark with `aria-label="Think while you read"` (no `aria-labelledby`); `h2` contains a `button[type=button][data-questions-toggle][aria-expanded=false][aria-controls=questions-content]` with the two exact lines "Think while you read" and "Optional AI critical thinking questions"; the chevron `svg` is `aria-hidden`; the wide span reads exactly "Think while you read" and has no second line; `#questions-content[data-questions-content]` holds the existing sentence, buttons, status region, list and AI note in 022's order (P09); no `style` attribute anywhere in the markup. Run it and see it fail.
- [ ] T004 Implement the markup in `src/components/post/QuestionsPanel.astro`: `TITLE = "Think while you read"` constant, `aria-label` on the aside, `h2` with the `xl:hidden` button (min-h-11, label left, chevron right, site focus ring and forced-colour classes, chevron turned by a variant on the expanded state, no transition) and the `hidden xl:inline` heading span, content wrapper `#questions-content`, padding `xl:p-6` only, content shown below xl only while `aria-expanded="true"` and always from xl (pure CSS, Tailwind). Keep `hidden [.js_&]:block`, `data-sticky` and the grid placement. T003 passes.

**Checkpoint**: the markup matches the contract; behaviour is added per story.

---

## Phase 3: User Story 1 - Start reading straight away on a phone (Priority: P1) MVP

**Goal**: below 1280 px with JavaScript on, one slim closed bar, and the first paragraph inside the first screen.

**Independent Test**: load the fixture post at 390x844 and 768x1024; only the bar shows and the first paragraph's top is inside the viewport.

### Tests for User Story 1

- [ ] T005 [US1] Replace the three 022 P20 tests in `tests/e2e/questions.spec.ts` with D01, D12 and D13 tests. Layer: e2e (needs real layout and measured geometry). At 320, 390, 768 and 1279 px with JavaScript on: the button is visible with both exact lines, `aria-expanded="false"`, the content wrapper is not displayed, and there is no horizontal scroll; at 390 px the aside border box is at most 80 px (5rem) tall; at 390x844 and 768x1024 the first body paragraph's top is less than the viewport height. See them fail.
- [ ] T006 [P] [US1] Add a D11 layout-shift test in `tests/e2e/questions.spec.ts`, observing `layout-shift` entries from navigation until idle at 390x844 and 1280x800 and asserting none has a source inside `[data-questions]`. Layer: e2e (a shift is only measurable in a browser with fonts swapping). The existing `budget.spec.ts` stays the whole-page CLS gate and is not duplicated.

### Implementation for User Story 1

- [ ] T007 [US1] Tune the closed-bar classes in `src/components/post/QuestionsPanel.astro` until T005 and T006 pass: bar at most 80 px at 390 px (reduce horizontal padding or chevron gap before reducing text; the second line stays at least 0.875rem), label wraps at 320 px with the chevron staying right and centred, 44x44 minimum target.
- [ ] T008 [P] [US1] Update the comment "Below xl the panel is a block above the body" in `src/layouts/PostLayout.astro` to say the panel is a closed disclosure there (comment only, no structural change; FR-014).

**Checkpoint**: US1 is demonstrable on its own (a closed bar that cannot yet be opened).

---

## Phase 4: User Story 2 - Open the panel and get questions on a phone (Priority: P1)

**Goal**: the trigger opens and closes the unchanged panel without losing state.

**Independent Test**: at 390x844 open with click, Enter and Space, press Get questions against the stub, close and reopen.

### Tests for User Story 2

- [ ] T009 [US2] Add D05 and D06 tests in `tests/e2e/questions.spec.ts`. Layer: e2e (focus, keyboard and request counts are browser behaviour). At 390x844: open and close by click, Enter and Space (the button is the active element after each, and `document.activeElement` never becomes `body`, SC-004); closed content is out of the accessibility tree and focus order; opening sends no request to `/api/questions`; after "Get questions", closing and reopening shows the same list with no new request; closing while the stubbed request is pending, then reopening, shows the result and focus was never lost. See them fail.
- [ ] T010 [P] [US2] Add a D15 open-state axe scan at 390 px in light and dark themes in `tests/e2e/blog-fixture.a11y.spec.ts`. Layer: a11y. Second layer is justified because the open markup exists only after a press, so the template scan (which already covers the closed state) cannot see it, as 022 argued. Also assert the text-spacing override grows the bar without clipping.
- [ ] T011 [P] [US2] Add a D15 forced-colours test in `tests/e2e/blog-forced-colors.spec.ts`: at 390 px the card border, chevron and focus ring on the button are visible and the ring uses `Highlight`. Layer: e2e (forced-colours emulation is browser-only).

### Implementation for User Story 2

- [ ] T012 [US2] Add the click handler to the panel's existing processed `<script>` in `src/components/post/QuestionsPanel.astro`: inside the per-panel loop, find `[data-questions-toggle]` and on `click` set `aria-expanded` to the opposite value, nothing else (no request, no state reset, no `style`, no storage, FR-005, FR-011, FR-012). Confirm the success focus move to "New questions" is harmless while closed. T009 to T011 pass.

**Checkpoint**: US1 and US2 together deliver the phone experience.

---

## Phase 5: User Story 3 - Wide screens keep the sidebar (Priority: P2)

**Goal**: at 1280 px and wider the panel is the open sidebar with no trigger, and crossing the boundary keeps state.

**Independent Test**: load at 1280x800 and 1440x900; resize 390 to 1280 and back.

### Tests for User Story 3

- [ ] T013 [US3] Add D03/D07/D08 tests in `tests/e2e/questions.spec.ts`. Layer: e2e (breakpoint and resize behaviour need a browser). At 1280x800 and 1440x900: the button is not visible and not focusable, the `h2` reads exactly "Think while you read", the content is shown, and the existing P21/P21a placement and sticky tests still pass unchanged. Resize 390 to 1280 to 390: after opening on the small layout the sidebar shows full content at 1280; narrowing again restores the open state and fetched questions; a never-opened panel returns closed; no focus is moved by the resize.

### Implementation for User Story 3

- [ ] T014 [US3] Fix anything T013 or the unchanged 022 tests (P21, P21a, P21b, P22 to P24) expose in the `xl:` classes of `src/components/post/QuestionsPanel.astro`. Add no resize script (D08: pure CSS and the untouched attribute). If the checks already pass, record that in the task notes and make no change.

---

## Phase 6: User Story 4 - JavaScript off (Priority: P2)

**Goal**: with JavaScript off nothing in the questions area is shown or focusable.

**Independent Test**: load the fixture post with JavaScript disabled at 390x844 and 1280x800.

### Tests for User Story 4

- [ ] T015 [US4] Extend the existing no-JS test in `tests/e2e/no-js.spec.ts` for D09: at 390x844 and 1280x800 with JavaScript disabled, the aside, the button and the content are not displayed, zero focusable elements exist in the questions area (SC-006), and the body follows the title card. Layer: e2e (JavaScript-disabled browsing context; the `js` root class cannot be exercised in a component test).

### Implementation for User Story 4

- [ ] T016 [US4] Confirm `src/components/post/QuestionsPanel.astro` keeps `hidden [.js_&]:block` on the aside and that no toggle markup shows without the `js` class; fix only if T015 fails.

---

## Phase 7: Polish and cross-cutting

- [ ] T017 [P] Update `docs/testing.md` "Critical-thinking questions": rename the panel to "Think while you read", add one line saying where the disclosure is tested (component test for markup, `questions.spec.ts` for behaviour, a11y and forced-colours specs), and change the visual paragraph's "above the body" to "a closed bar above the body" (plan, Docs).
- [ ] T018 Run the post-template visual project against the changed template to see the eight expected images fail (phone and desktop, light and dark, on the current platform), then refresh macOS baselines with `pnpm run test:visual:update` (run from the agent via the nvm plus pnpm shim wrapper in the background; read `.claude/skills/_shared/visual-baselines.md` first). Layer: visual. Compare `-previous.png` against the new image and confirm only `post-template-phone-{light,dark}` (closed bar) and `post-template-desktop-{light,dark}` (heading wording) changed.
- [ ] T019 Refresh the Linux baselines with `pnpm run test:visual:update:linux` after T018 (needs Docker Desktop; if `docker info` fails, ask Don to start it). Copy only the `*-linux.png` files, confirm the diff is the same four images per platform (eight in total) with the desktop change limited to the heading text (SC-005), and that no other visual baseline moved.
- [ ] T020 Run the local gate for the changed tiers only: `changed-paths.ts --base origin/main` (CLAUDE.md; ask Don before a full `pnpm run verify`). Confirm component, `sections`, a11y, no-JS, budget (JS at most 10 KB, LCP, CLS, no limit raised) and visual projects pass, and no CSP violation is reported on the post page (FR-012, D14).
- [ ] T021 Run the steps in `specs/046-mobile-questions-disclosure/quickstart.md` that an agent can run locally and note the results.
- [ ] T022 [PREVIEW-CHECK] On the preview deployment on a real phone: the closed bar reads "Think while you read" over "Optional AI critical thinking questions", the first paragraph starts in the first screen, tapping opens and closes it, and Get questions works (quickstart "Manual check").
- [ ] T023 [PREVIEW-CHECK] With VoiceOver on iOS (and TalkBack on Android if available): the trigger is announced as a button with its name and collapsed or expanded state, and it identifies the content it controls.
- [ ] T024 [PREVIEW-CHECK] On the preview at a desktop width of 1280 px or more: the sidebar panel's heading reads "Think while you read", it stays sticky, and no trigger appears.

---

## Dependencies and execution order

- Phase 1 first. Phase 2 blocks all stories: T003 (test, must fail) before T004.
- US1 (Phase 3) and US2 (Phase 4) are both P1; do US1 first (MVP), US2 needs only Phase 2 but shares the component file with US1, so run the implementation tasks T007, T012, T014 and T016 one after another.
- US3 and US4 tests (T013, T015) can be written once Phase 2 is done; their implementation tasks follow the earlier ones.
- Within every story, the test task precedes its implementation task and is seen to fail first.
- Phase 7: T017 any time after T012; T018 after all implementation; T019 after T018; T020 after T019; T022 to T024 are [PREVIEW-CHECK] items, left unticked by the subagent and listed in the PR body (`.claude/skills/_shared/preview-check.md`).

## Parallel opportunities

- T005 and T006 target the same file, so write them in one pass; T008 runs alongside T007.
- T010 and T011 run in parallel with each other (different files) once T009 is written.
- T013 (`questions.spec.ts`), T015 (`no-js.spec.ts`) and T010/T011 touch different files and can be written in parallel after Phase 2.
- T017 runs in parallel with the test-writing tasks.

## Implementation strategy

- MVP is Phase 2 plus US1 (closed bar, first paragraph on screen), but US2 must ship in the same PR: a bar that cannot open would remove the feature from small screens.
- Deliver in story order, running the story's tests after each implementation task; do the baseline refresh only once, after all implementation (T018, T019).
