# Tasks: Second call to action in the home introduction card

**Input**: `specs/051-home-dual-cta/` (spec.md, plan.md, research.md, data-model.md, contracts/home-intro-ctas.md, quickstart.md)

**Tests**: Mandatory (Principle I). Each test task names its one primary layer ("Where a test goes", `docs/testing.md`) and is written and seen to fail before the implementation it covers. Existing test files are extended; no new E2E spec file.

**Format**: `- [ ] T### [P?] [Story] Description with file path`. `[P]` = different file, no dependency on an unfinished task. `[PREVIEW-CHECK]` = needs Don on the preview (`.claude/skills/_shared/preview-check.md`); left unticked by the subagent.

## Phase 1: Setup

- [ ] T001 Confirm Node matches `.nvmrc` (`node -v`, else `source ~/.nvm/nvm.sh && nvm use` in the same command) and read `docs/testing.md` ("Where a test goes"), `.claude/skills/_shared/visual-baselines.md` and `specs/051-home-dual-cta/contracts/home-intro-ctas.md`; no file changes.

---

## Phase 2: User Story 3 - Don controls the second call to action from the page file (Priority: P2, done first because US1 and US2 read the field)

**Goal**: `intro.secondaryCta` is an optional `{ label, href }` with the same rules as `cta`; bad values fail the build naming the field.

**Independent Test**: `pnpm exec vitest run tests/unit/content/page-schema.test.ts` passes.

### Tests (write first, see them fail)

- [ ] T002 [US3] Layer: unit (schema). Extend `tests/unit/content/page-schema.test.ts` next to the existing `intro`/`cta` cases: accepts `secondaryCta` absent, with an internal `/x/` href and with an `https://` href; rejects empty and whitespace-only label, missing href, relative href, protocol-relative `//host`, extra field, empty object, `null`, wrong type, and `secondaryCta` without `cta`; each rejection's issue path names `intro.secondaryCta.<field>` and every bad field is reported together (FR-001, FR-002, FR-016). No second layer: `tests/build/page-validation.test.ts` already proves the collection schema runs on real files.

### Implementation

- [ ] T003 [US3] In `src/content/schemas/page.ts`, define the call-to-action `z.strictObject` once as a local `callToAction` constant, use it for `cta` (required, rules unchanged) and add `secondaryCta: callToAction.optional()` inside the strict `intro` object (data-model.md). T002 passes.
- [ ] T004 [P] [US3] Update the `intro` row in `docs/pages.md` (line ~46) to list `secondaryCta` (optional, same shape as `cta`).

**Checkpoint**: Schema accepts and rejects as specified.

---

## Phase 3: User Stories 1 and 2 - Second button, laid out for every screen (Priority: P1)

**Goal**: The card shows the filled main button and the outlined "Read my writing" button, social icons on their own row above, stacked full width below 640 px and on one row (label width, left-aligned) from 640 px, both at least 44 px tall and equal in height, accessible in light and dark.

**Independent Test**: Build the site, open `/` at 375, 640, 768, 1280 px in both themes: two buttons per contract, second link reaches `/writing/`, all pages specs below pass.

### Tests (write first, see them fail)

- [ ] T005 [P] [US1] Layer: component. Extend `tests/component/HomeIntro.test.ts`: add a second `intro` fixture with `secondaryCta`; update "focusable in order" and "source order" to GitHub, LinkedIn, main, second; assert the second link renders after the main, filled vs outlined class sets, `min-h-11` on both, the social `<ul>` precedes the button group, accessible name equals the visible label, and with no `secondaryCta` exactly one button and no empty element (FR-003, FR-004, FR-005, FR-006, FR-008, FR-012: only theme colour classes). Why not E2E: class, DOM order and absent-element checks need no browser.
- [ ] T006 [P] [US1] Add `homeSecondaryCtaHref` beside `homeCtaHref` in `tests/helpers/content.ts`, read from `src/content/pages/index.mdx` front matter, so the e2e spec takes the href from content (literal guard).
- [ ] T007 [US2] Layer: E2E (only a real browser measures layout, contrast and navigation). Extend `tests/e2e/pages.spec.ts`, describe "home introduction card": at 375 the buttons are stacked, main on top, each full width of the text column; at 640, 768 and 1280 they share one row, each as wide as its label, left-aligned with the text, social row above; equal heights of at least 44 px and widths of at least 44 px; all four links fully inside the card and not overlapping (checked at 640 and 320); the card has no horizontal overflow; the second link navigates to `homeSecondaryCtaHref`; change the 24 px target test's `toHaveCount(3)` to 4 (FR-007, FR-008, FR-011, SC-001, SC-002). Depends on T006.
- [ ] T008 [US2] Layer: E2E, same file and describe as T007 (axe does not check borders, hover or focus). Both themes: the second button's border at least 3:1 and focus outline at least 3:1 against the card; hover text at least 4.5:1 for both buttons, with `reducedMotion: "reduce"` so no mid-fade colour is sampled (FR-009, FR-010, SC-003). Depends on T007 (same file).

### Implementation

- [ ] T009 [US1] Update `src/components/page/HomeIntro.astro` per `contracts/home-intro-ctas.md`: icon `<ul>` as its own first row at every width (16 px above the group); button group `grid w-full auto-rows-fr gap-3 sm:flex sm:w-auto sm:flex-row`; shared button base `inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium motion-safe:transition-colors`; main filled with `border-transparent` and its existing colours; second outlined (`border-dusk-500 text-dusk-800 hover:bg-mist-200 dark:border-dusk-400 dark:text-mist-200 dark:hover:bg-dusk-700`), rendered only when `intro.secondaryCta` is set. No script. T005, T007 and T008 pass for the schema-valid fixture once T010 lands.
- [ ] T010 [US1] Add `secondaryCta: { label: Read my writing, href: /writing/ }` to the `intro` front matter in `src/content/pages/index.mdx` (FR-013); the main `cta` is unchanged.
- [ ] T011 [US1] Run the existing guards on the new card without edits: `tests/e2e/a11y.spec.ts` (home, both themes), `tests/e2e/geometry.spec.ts` (320/390/1280 overflow), `tests/e2e/budget.spec.ts` (values unchanged, FR-014). Fix the component, never the checks, if one fails.

**Checkpoint**: Both buttons work, laid out per spec, all non-visual checks green.

---

## Phase 4: Visual baselines and review

- [ ] T012 Layer: visual (page template appearance). Regenerate the macOS baselines with `pnpm run test:visual:update` (nvm and pnpm shim wrapper in the background, per `.claude/skills/_shared/visual-baselines.md`); only `tests/e2e/visual.spec.ts-snapshots/home-now-start-here-{phone,desktop}-{light,dark}-visual-darwin.png` should change. Review the images by eye.
- [ ] T013 Regenerate the Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it). Only the four `home-now-start-here-*-visual-linux.png` files should change; commit all 8 images. Depends on T012.
- [ ] T014 Run the local gate for the changed-paths tier (`changed-paths.ts --base origin/main`), and ask Don before any full `pnpm run verify` (CLAUDE.md memory: check in before the full gate). Tick tasks only after tests pass.
- [ ] T015 [PREVIEW-CHECK] Don checks on the preview: the main button is taller (44 px) and the social icons sit on their own row; "Read my writing" is clearly quieter and lands on `/writing/`; light and dark look right at phone and desktop width; hover tint and visible focus ring on both buttons; Windows high contrast shows both button outlines (not testable locally); at 200 percent text size labels wrap without clipping.

---

## Dependencies and order

- Phase 2 (schema) before Phase 3: T010 needs T003, or the build rejects the field.
- Within Phase 3: tests T005 to T008 before T009 and T010; T007 before T008 (same file).
- Phase 4 after Phase 3: T012 then T013 then T014; T015 is Don's, after the PR is up.
- Parallel: T004 with T002 and T003; T005 with T006.

## Implementation strategy

Ship all in one PR (US1 and US2 are both P1 and one component). Order: schema, tests red, component and content, guards, baselines, gate. MVP is Phase 2 plus Phase 3.
