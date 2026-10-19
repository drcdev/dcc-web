# Tasks: Previous, next and index links on project stories

**Input**: `specs/042-project-story-nav/` (spec.md, plan.md, quickstart.md)

**Tests**: Mandatory, written first and seen to fail before the code they cover (Principle I). Each test task names its one primary layer ("Where a test goes", `docs/testing.md`) and gives the reason for any second layer. No new E2E spec file and no edits to `tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`, `tests/component/html.ts`, `tests/fixtures/`, or the Playwright and Vitest config. Tests read project content through `tests/helpers/content.ts` and never name a real project.

**Format**: `[ID] [P?] [Story] Description`. `[P]` means a different file with no dependency on an unfinished task.

## Phase 1: Previous, next and index links (US1 and US2)

**Goal**: Every project story shows a labelled navigation block between its last part and the invitation, with previous, all projects and next in index order, usable by keyboard, screen reader and phone.

**Independent test**: On the fixture site, walk Next from the first project to the last and Previous back, then check keyboard order and the 390 px layout. Run `quickstart.md`.

### Tests first (write, run, see them fail)

- [X] T001 [P] [US1] Unit test (primary layer: unit; it is a pure function, so every first, last, single and no-wrap case is cheap here instead of needing a build per case): add `describe("neighbours")` to `tests/unit/content/project-order.test.ts`. Cases: a middle entry has `previous` at index - 1 and `next` at index + 1; the first has no `previous`; the last has no `next`; a single entry has neither; no wrap-around; the given order is used, never re-sorted. Covers FR-002, FR-003.
- [X] T002 [P] [US1] [US2] Component test (primary layer: component; markup and accessible names are observable through the Astro Container API without a browser): create `tests/component/project/StoryNav.test.ts`, rendering `src/components/project/StoryNav.astro` with the existing helpers unchanged. Assert a `nav` labelled "Projects" with `data-story-nav`; links in order previous, "All projects" (`/projects/`), next; visible text "Previous: <title>" and "Next: <title>" with `rel="prev"` and `rel="next"`; arrows are `aria-hidden`; a missing side renders no `li` and no `a`; no status text, script or button. Covers FR-001, FR-003, FR-005.
- [X] T003 [P] [US1] Build test (primary layer: build; only the real build applies the production draft filter to routes): add cases to `tests/build/drafts.test.ts` using its existing production and preview builds. Production: no story's nav links to a draft, so neighbours skip it. Preview: the draft takes its place where the index lists it. In both: the nav sits after the last `data-part` and before the invitation. Covers FR-002, FR-004.
- [X] T004 [US1] [US2] E2E test (primary layer: e2e; link-following, focus order, the 390 px stacked layout, 44 x 44 targets and scroll width need a real browser; the neighbour rule itself stays at the unit layer): add cases to `tests/e2e/projects-fixtures.spec.ts`, deriving order from the fixture index rows rather than literals. Walk Next from the first project to the last, each step landing on the next index row; the first has no Previous and the last has no Next; All projects lands on `/projects/`; Tab order is previous, all, next with a visible focus outline; at 390 px the links stack, each at least 44 x 44 with no horizontal scroll. Covers SC-001, FR-005.
- [X] T005 Run T001-T004 and confirm each fails for the missing feature, not a typo.

### Implementation

- [X] T006 [US1] Add pure `neighbours(ordered, id)` to `src/lib/content/project-order.ts`, returning `{ previous?, next? }` with no sorting and no wrap-around (T001 passes).
- [X] T007 [US1] [US2] Create `src/components/project/StoryNav.astro` per plan.md Design: `<nav aria-label="Projects" data-story-nav>`, `<ul>` of up to three `<li>`, visible text carries direction and title, arrows `aria-hidden`, a missing side renders nothing (T002 passes).
- [X] T008 [US2] Add a `/* Story navigation */` block to `src/components/project/portfolio.css`: top margin before the invitation; column with full-width `min-h-11` links below `sm`, row from `sm`; existing link, underline and focus styles; `break-words`; add `[data-story-nav] a:focus-visible` to the existing forced-colours `CanvasText` outline rule.
- [X] T009 [US1] Edit `src/layouts/ProjectLayout.astro`: optional `previous` and `next` props; render `<StoryNav previous next />` after `<slot />` and before `<ProjectInvitation />`.
- [X] T010 [US1] Edit `src/pages/projects/[slug].astro`: in `getStaticPaths()` call `neighbours()` on the list from `getPublishedProjects(process.env)` and pass `previous` and `next` as `{ slug, title }` props to the layout (T003 and T004 pass).
- [X] T011 Run the T001-T004 tests and `pnpm run test:a11y` (existing cases, no edit; fixture stories and the real story template must show no new violations). Use the local-toolchain rules in `CLAUDE.md` and the changed-paths tier only.

### Visual baselines

- [X] T012 Read `.claude/skills/_shared/visual-baselines.md`, then run `pnpm run test:visual:update` and inspect that only `story-template-*` macOS images changed (the diff shows previous "Minimal project", all projects and next "Every setting" on `/projects/every-part/`).
- [x] T013 Run `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it as the shared file describes), confirm only `story-template-*-linux.png` changed, and commit both sets of images before the PR is opened.

### Preview checks

- [ ] T014 [PREVIEW-CHECK] On the preview deployment, open a real middle project story and walk `quickstart.md` "By hand" steps 1-5: block position before the invitation, Next/Previous order against `/projects/`, tab order, stacked layout under 640 px with a long title wrapping, and links working with JavaScript off. Follow `.claude/skills/_shared/preview-check.md`: leave unticked and list it in the PR body.

## Dependencies and order

T001-T004 are parallel (different files) and precede T005. T006 before T010; T007 and T008 before T009; T009 and T010 before T011. T012 follows T011, T013 follows T012, T014 follows the preview deployment.

## Implementation strategy

One phase and one increment: the whole change is the MVP, because the nav is only useful with both the helper and the block.
