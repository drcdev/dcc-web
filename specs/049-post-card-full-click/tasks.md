# Tasks: Full-card click and hover feedback on post cards

**Input**: `specs/049-post-card-full-click/` (spec.md, plan.md, quickstart.md)
**Tests**: mandatory and ordered before the implementation they cover (Principle I). Each test task names its one primary layer. No new spec file; no edits to `tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`, `tests/component/html.ts`, `tests/fixtures/`, `playwright.config.ts` or `vitest.config.ts`.
**Toolchain**: follow `CLAUDE.md` Local toolchain (nvm, pnpm shim, no `timeout`) for every `pnpm`/`playwright` call.

## Phase 1: Full-card click, focus outline and hover feedback (US1-US4)

**Goal**: the whole card and lead story open the post; pills and series marker stay separate links; focus outlines the card; hover feedback is gated to hover pointers and motion-safe.

**Independent test**: component tests plus the E2E cases below pass; a11y and visual projects pass unchanged.

### Tests first (must be seen failing before T006)

- [x] T001 [P] [US3] Component test (primary layer: component, Vitest Container API) in `tests/component/post/PostCard.test.ts`: the card has exactly one link to the post, the title link, carrying `data-post-link`; the image is outside any link. Keep the existing one-link tests.
- [x] T002 [P] [US4] Component test (primary layer: component) in `tests/component/post/PostCard.test.ts`: replace the obsolete "adds no hover, focus or active classes to the card" test with the invariant that every `translate`, `scale` and `transition` class on the card and image is `motion-safe:`-prefixed and the card has no `focus:`/`focus-visible:` lift. Component is the primary layer for the reduced-motion rule; T005 adds a browser check only because computed transforms are visible only in a browser.
- [x] T003 [P] [US1] [US3] [US4] Component tests (primary layer: component) in `tests/component/post/LeadStory.test.ts`: same two invariants as T001 and T002 for the lead story (one `data-post-link` link, image outside links, motion-safe movement classes).
- [x] T004 [US1] [US2] [US3] E2E tests (primary layer: E2E, because only a browser shows hit-testing and focus) in the existing `tests/e2e/blog-fixtures.spec.ts`, fixture site: (a) on a listing, `elementFromPoint(...).closest("a")` is the post link at the image, summary, date line and an empty area of an image card, of the text-only card and of the lead story, and one real click on the image navigates to the post; (b) clicking a topic pill and a series marker opens its own page, not the post; (c) Tab to a card's post link gives the article a solid outline, the link none, and the article's transform stays `none`.
- [x] T005 [US4] E2E tests (primary layer: E2E, hover and computed style need a browser) in the existing `tests/e2e/blog-fixtures.spec.ts`, using `test.use` inside a `describe`: with motion allowed and a hover pointer the article lifts, gains a shadow and the image scales; with `reducedMotion: "reduce"` position and scale stay at rest; under a touch context (`hasTouch`, `isMobile`, `hover: none`) hover shows no lift or shadow. Also add to the existing `tests/e2e/blog-forced-colors.spec.ts` a case that the focused card's outline is `CanvasText` (second layer justified: forced-colours emulation exists only in that spec and only a browser applies it).

### Implementation

- [x] T006 [US1] [US2] [US3] [US4] Edit `src/components/post/PostCard.astro` per plan D1-D5: `relative group` on the article; title link gets `data-post-link`, `after:absolute after:inset-0 after:content-['']` and `focus-visible:outline-none!`; each topic and series `<li>` gets `relative`; article gets the `has-[[data-post-link]:focus-visible]` outline classes (accent-500, dark accent-400, forced-colors CanvasText, offset 2); `hover:z-1`, `hover:shadow-lg`, `motion-safe:hover:-translate-y-1` and `motion-safe:transition motion-safe:duration-200 motion-safe:ease-out`; wrap the `<Image>` in `<div class="overflow-hidden">` with `motion-safe:group-hover:scale-[1.02] motion-safe:transition-transform motion-safe:duration-200` on the image. Text-only cards get no wrapper. No JS, no `global.css` change.
- [x] T007 [US1] [US2] [US3] [US4] Apply the same treatment in `src/components/post/LeadStory.astro`; the image wrapper gets `md:min-h-64` and the image keeps `md:h-full` so it fills the stretched grid cell.
- [x] T008 Run T001-T005 and confirm they pass: `pnpm vitest run tests/component/post/PostCard.test.ts tests/component/post/LeadStory.test.ts`, then `pnpm playwright test tests/e2e/blog-fixtures.spec.ts tests/e2e/blog-forced-colors.spec.ts`. Run `node -v` first and follow the sibling-port-collision note in CLAUDE.md memory if ports 4321/4322 are busy.

### Visual and accessibility checks

- [x] T009 [US4] Run the visual project and the a11y project unchanged (writing landing page, topic listing, series page, home, post template). The static look must be identical (SC-005), including the new image wrapper; if the lead story or card drifts, fix the wrapper classes rather than refresh.
- [x] T010 Only if T009 shows an intended baseline drift (decided on purpose, not to get through): refresh the macOS baselines with `pnpm run test:visual:update`, then the Linux baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; follow `.claude/skills/_shared/visual-baselines.md`). Skip if T009 passes.

### Preview checks

- [ ] T011 [PREVIEW-CHECK] [US4] Don checks on the preview deployment (quickstart.md "Manual"): hover feel on `/writing/` (lift, shadow, image grows inside its frame, no clipping by neighbours or the sticky header), outline wraps the whole card on Tab, Reduce motion shows shadow only, and on a phone a tapped card is not left lifted after going back. Left unticked by the implementing subagent; listed in the PR body.

## Dependencies and order

T001-T005 (tests, T001-T003 parallel, T004 and T005 share a spec file so sequential) -> seen failing -> T006 and T007 (different files, parallel) -> T008 -> T009 -> T010 (conditional) -> T011 (preview).

## Implementation strategy

One small slice: all four stories share two components, so they ship together. Tests first and red, then the two component edits, then run the tiered gate (`changed-paths.ts --base origin/main`) per `CLAUDE.md`.
