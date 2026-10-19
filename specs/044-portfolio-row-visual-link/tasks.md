# Tasks: Clickable project row visuals

**Input**: `specs/044-portfolio-row-visual-link/` (spec.md, plan.md, quickstart.md)

**Tests**: Mandatory (constitution Principle I). Tests come first and are seen to fail before the
markup and CSS change. Each test task names its one primary layer ("Where a test goes",
`docs/testing.md`).

**Scope**: one component, one stylesheet, one component test file, two added E2E cases. No
visual baseline change is expected (SC-004), so there is no baseline-update task.

Before any `pnpm`, `playwright` or `astro` call, follow the Local toolchain section of
`CLAUDE.md` (`node -v`, then `source ~/.nvm/nvm.sh && nvm use` in the same command if needed).

## Phase 1: Clickable visual, one link per row (US1 + US2, both P1)

**Goal**: Clicking a row's visual opens the story (US1); each row still exposes one link and one
tab stop, with the visual's description kept for screen readers (US2).

**Independent test**: On `/projects/`, click a visual and land on its story; the accessibility
tree shows one link per row; Tab stops once per row.

### Tests first (confirm each fails before T006)

- [X] T001 [US2] Layer: component (cheapest layer that sees the markup). In `tests/component/project/ProjectRow.test.ts`, rewrite "has one link, named by the title, to the story" as "exposes one link to assistive technology and keyboard, named by the title": `focusable(html)` (from `tests/component/html.ts`, unchanged) has length 1 and is the title link, and the links without `aria-hidden="true"` also number 1. Apply the same focusable/non-hidden count to the retired-pill test's `byName(html, "a")` length-1 check, still asserting the title href.
- [X] T002 [US1] Layer: component. In `tests/component/project/ProjectRow.test.ts`, add "the visual is a hidden link to the same story": the second `<a>` carries the same `href` as the title link, `aria-hidden="true"` and `tabindex="-1"`, and contains the `<img>`.
- [X] T003 [US2] Layer: component. In `tests/component/project/ProjectRow.test.ts`, rewrite "shows the visual with its alt text" as "keeps the visual's description as screen-reader-only text": the `<img>` has `alt=""`, and a `span.sr-only` inside `[data-project-visual]`, outside the link, holds the visual's description from the fixture.
- [X] T004 [US1] Layer: E2E (only a browser shows click navigation and hover geometry; component layer cannot). In `tests/e2e/projects.spec.ts`, in the "the projects index" block, add one test: hover the first row's visual, assert the `[data-project-text]` and `[data-project-visual]` bounding boxes are unchanged and the image's computed opacity is below 1 (SC-005); then click the visual and assert the browser lands on that row's story. Read the row's expected href from the title link, not a literal.
- [X] T005 [US1] Layer: E2E (computed style under an emulated media preference needs a browser). In `tests/e2e/projects-motion.spec.ts`, in the existing "with reduced motion" block, add one test that the first visual image's computed `transition-duration` is `0s` on `/projects/`.

### Implementation

- [X] T006 [US1] [US2] In `src/components/project/ProjectRow.astro`, change `[data-project-visual]` to hold a `<span class="sr-only">{visual.alt}</span>` followed by `<a href={projectHref(slug)} aria-hidden="true" tabindex="-1" data-project-visual-link>` wrapping the existing `<Image>` with `alt=""`. Leave `widths`, `sizes`, `loading` and `decoding` unchanged. Update the header comment to say the title is the only link exposed to assistive technology and the visual repeats it as a hidden pointer target.
- [X] T007 [US1] In `src/components/project/portfolio.css` (Index section), add the three rules from plan.md "Styles": `[data-project-visual-link] { display: block; }`, `@media (hover: hover) { [data-project-visual-link]:hover img { opacity: 0.85; } }`, and `@media (prefers-reduced-motion: no-preference) { [data-project-visual-link] img { transition: opacity 150ms ease-out; } }`. No transform, no new colours or borders, no inline style.

### Verify

- [X] T008 Run the component tests (`pnpm run test:unit`, or `pnpm exec vitest run tests/component/project/ProjectRow.test.ts`); T001 to T003 pass.
- [X] T009 Build, then run `pnpm exec playwright test tests/e2e/projects.spec.ts tests/e2e/projects-motion.spec.ts tests/e2e/projects-no-js.spec.ts --project=e2e`; T004, T005 pass and the unchanged no-JS test (one `link` role per row) still passes. Check `lsof -i :4321` first (sibling worktrees share the port).
- [X] T010 Run the accessibility project (`pnpm run test:a11y`) and confirm no new violation on the projects index (SC-003; `aria-hidden` link with `tabindex="-1"` satisfies `aria-hidden-focus`).
- [X] T011 Run the visual project (`pnpm run test:visual`) and confirm no screenshot diff on any projects index shot (SC-004). A diff means the resting state moved: fix the markup or CSS, do not update a baseline.
- [X] T012 Run `pnpm run lint` and `pnpm run check` (type check); both clean.
- [ ] T013 [PREVIEW-CHECK] On the branch preview, walk `specs/044-portfolio-row-visual-link/quickstart.md`: hand pointer and slight dimming on hover with nothing moving, instant dimming under OS Reduce motion, one Tab stop per row, one link per project in VoiceOver with the description still read after the pills, and the visual opens the story with JavaScript off.

## Dependencies and order

- T001 to T005 before T006 and T007; each test is seen to fail first. T001 to T003 share one file, so sequential; T004 and T005 touch different files and can run in parallel with them.
- T006 and T007 touch different files and can run in parallel.
- T008 to T012 after T006 and T007; T013 last and stays unticked for the subagent (see `.claude/skills/_shared/preview-check.md`).

## Strategy

Single increment: both stories ship together because the hidden link and the sr-only description are one markup change. MVP is the whole phase.
