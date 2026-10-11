---

description: "Task list for 035 share area and views note match the post width"
---

# Tasks: Share area and views note match the post width

**Input**: `specs/035-share-area-width/` (spec.md, plan.md, quickstart.md)

**Tests**: Mandatory (Principle I) and ordered before the implementation they cover. Layout at
breakpoints is browser-only, so the primary layer is E2E in the existing `tests/e2e/blog.spec.ts`.
A component test would only restate class names (the existing component tests assert structure,
not classes), so none is added.

## Format: `[ID] [P?] [Story] Description`

Toolchain: run `node -v` first and follow the Local toolchain section of `CLAUDE.md` for every
`pnpm` or `playwright` call.

## Phase 1: Tests, implementation and baselines

**Goal**: The views note and Share area span the title card's width at every screen width; from
768 px the Share heading sits left and the links right; below 768 px everything is centred.

**Independent test**: Open a post at 375, 768, 1024 and 1440 px and compare edges and
arrangement, as in `quickstart.md`.

### Tests first (seen to fail before the implementation)

- [X] T001 [US1] Layer E2E (edges are browser geometry; the 1440 px case also covers the
  questions panel row, which every built post has). In the `share` describe of
  `tests/e2e/blog.spec.ts`, add a test that at 375, 768, 1024 and 1440 px the left and right
  edges of `[data-views-note]` and `[data-share]` are within 1 px of `[data-title-card]`'s
  (FR-001, SC-001). Run it and confirm it fails at 1024 and 1440.
- [X] T002 [US2] Layer E2E (row versus stack is browser geometry). In the same describe, add a
  test that at 768 and 1440 px the `h2` is left of the first link, their vertical centres are
  within 1 px, the last visible link's right edge is at the section's content-box right (within
  1 px), and `[data-views-note]` computes `text-align: left` (FR-002, SC-002). Confirm it fails.
- [X] T003 [US2] Layer E2E (centring is computed browser style). In the same describe, add a test
  that at 320 and 375 px every share link's top is below the `h2`'s bottom, the `h2` and
  `[data-views-note]` compute `text-align: center`, and the links group's horizontal centre is
  within 1 px of the section's content-box centre (FR-003, SC-002). Confirm it fails.

### Implementation

- [X] T004 [US1] In `src/layouts/PostLayout.astro`, change the ViewsNote wrapper
  `<div class="mx-auto mt-8 max-w-3xl">` to `<div class="mt-8">` and update any nearby comment
  that describes the width. T001 edges pass.
- [X] T005 [P] [US2] In `src/components/post/ViewsNote.astro`, add `text-center md:text-left` to
  `<p data-views-note>`; wording and other classes unchanged.
- [X] T006 [US1] [US2] In `src/components/post/Share.astro`: on `<section>` drop `mx-auto
  max-w-3xl` and add `text-center md:flex md:items-center md:justify-between md:gap-x-6
  md:text-left`; on the `h2` change `mb-3` to `mb-3 md:mb-0 md:shrink-0`; on the links `<div>`
  add `justify-center md:justify-end`. Keep DOM order, content, links and script unchanged.
- [X] T007 [US2] Update the header comment of `src/components/post/Share.astro` (plan risk): the
  hidden Share button still sits at the end of the same row and moves nothing vertically, but
  with the links right-aligned (wide) or centred (narrow) showing it shifts the other links
  sideways, not the heading. Make the comment match the new layout.
- [X] T008 Run T001 to T003 in `tests/e2e/blog.spec.ts` and confirm they pass, and that the
  existing share tests, `tests/e2e/geometry.spec.ts` (320 px no sideways scroll) and the
  accessibility specs still pass.

### Visual baselines (SC-004)

- [X] T009 Read `.claude/skills/_shared/visual-baselines.md`, then run `pnpm run test:visual:update`
  (macOS). Check that only `post-template-*` images in `tests/e2e/visual.spec.ts-snapshots/`
  changed; any other diff is a regression to fix, not refresh.
- [X] T010 Run `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails,
  ask Don to start it as the shared file says). Again only `post-template-*` images may change.
  Commit and push both sets of images before opening the PR.

### Preview

- [ ] T011 [PREVIEW-CHECK] Don walks a post on the preview deployment (see
  `.claude/skills/_shared/preview-check.md`): at 1024 px and wider the views note and Share area
  match the title card's edges, with and without the questions panel open; at 768 px and wider the
  heading is left and the links right; below 768 px the note, heading and links are centred; the
  system Share button joins the links without moving the heading. Leave unticked; list it in the
  PR body.

## Dependencies and order

T001 to T003 (tests, may be written together) then T004 to T007 (T005 parallel to T004 and T006;
T007 after T006), then T008, T009, T010 in order, T011 after the preview exists.
