# Tasks: Footer at the Bottom

**Input**: `specs/027-footer-at-bottom/` (plan.md, spec.md, quickstart.md)

**Tests**: Mandatory (Constitution Principle I). Each test task names its one primary layer
("Where a test goes", `docs/testing.md`). Tests come before the implementation they cover.

**Organization**: One user story (US1), so one phase. No setup or foundational work: the
change is three utility classes in the existing shell. Toolchain rules are in `CLAUDE.md`
(check `node -v` against `.nvmrc` before any `pnpm` or `playwright` command).

## Phase 1: User Story 1 - Footer sits at the bottom of a short page (Priority: P1)

**Goal**: On a page shorter than the window the footer's bottom edge meets the window's bottom
edge with no vertical scroll; on a longer page nothing changes.

**Independent Test**: Open the not-found page at 390 x 844 and 1280 x 800 (footer at the window
bottom, no scroll); open a writing post (footer straight after the content, same page height).

### Tests first (seen to fail before T003)

- [X] T001 [US1] Layer: E2E (only a browser shows layout geometry). In the per-template, per-size loop in `tests/e2e/geometry.spec.ts`, add assertions that (a) the `body > footer` bottom edge in document coordinates equals `document.documentElement.scrollHeight` within 1 px, and (b) `scrollHeight` equals `max(window.innerHeight, header height + wrapper content height + footer height)` within 1 px, where the wrapper content height is `<main>`'s margin box. Reuse the existing page loads (no new navigations). No second-layer test: a component test could only restate the class list, and JavaScript-off needs none because the placement is pure CSS with no `js:` variant.
- [X] T002 [US1] Run `pnpm exec playwright test tests/e2e/geometry.spec.ts` and confirm the new assertions fail on the not-found template at every size and pass on long templates. Record the red result in the commit message or PR body.

### Implementation

- [X] T003 [US1] In `src/layouts/BaseLayout.astro`, add `flex min-h-dvh flex-col` to the `<body>` class list and `grow` to `<div class="page-container">`. Change nothing else (no CSS file, no `SiteFooter.astro`; the footer stays a direct child of `<body>`).
- [X] T004 [US1] Re-run `tests/e2e/geometry.spec.ts` and `tests/e2e/a11y.spec.ts` (axe on every template); both must pass with no new violations.

### Visual baselines

- [X] T005 [US1] Refresh the macOS baselines: `pnpm run test:visual:update`, following `.claude/skills/_shared/visual-baselines.md` (run via the nvm+shim wrapper in the background, and not while Docker is building `dist`).
- [x] T006 [US1] Refresh the Linux baselines: `pnpm run test:visual:update:linux`. This needs Docker Desktop; if `docker info` fails, the orchestrator asks Don to start it (do not fall back to CI without asking). If the Linux result later differs from CI, use the `visual-baselines` label fallback in the shared doc.
- [x] T007 [US1] Check the changed snapshots with `git status` under `tests/e2e/visual.spec.ts-snapshots/`: only the eight `not-found-*` files (phone and desktop, dark and light, darwin and linux) may change, plus the sections-fixture full-page shots only if that page is shorter than the window at that size. Any other changed file is a regression: fix the layout (for example a collapsed margin that the flex item now contains), do not refresh it. Compare `-previous.png` against the new image to confirm the only difference is the footer position.

## Release gate

Last task, after everything above.

- [ ] T008 Release gate, last: run `pnpm run verify` (ask Don first per the repository's check-in rule; run it via the wrapper in the background under `perl alarm`, with `ASTRO_PREVIEW_BACKGROUND=1`, and read the `VERIFY_EXIT=` line). All checks must pass with none skipped or loosened. No `[PREVIEW-CHECK]` items (spec Clarifications).

## Dependencies

T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008. No parallel tasks: the
visual runs share ports and the same snapshot directory.

## Implementation strategy

MVP is the whole feature: write the failing geometry test, add the three utility classes, refresh the
not-found baselines, run the gate.
