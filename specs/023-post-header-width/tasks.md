# Tasks: Post Header Width

**Input**: `specs/023-post-header-width/spec.md`, `plan.md`
**Tests**: mandatory, written first and seen to fail before the implementation they cover.
**Format**: `- [ ] T### [P?] [US1] Description with file path`

## Phase 1: User Story 1 - Header block lines up with the feature image (Priority: P1)

**Goal**: the post title card is as wide as the feature image at every width (FR-001 to FR-005).

**Independent Test**: on `/writing/every-part/` at 768, 1024, 1280 and 1440 px, the title card's left and right edges are within 1 px of the hero image's edges.

### Tests (before implementation)

- [x] T001 [US1] Layer: E2E (only a browser can show layout geometry; no second layer, a component class-list assertion would duplicate it). Add `test.describe("title card width")` to `tests/e2e/blog-fixtures.spec.ts` using the existing `LEAD` (`/writing/every-part/`) and `TEXT_ONLY` constants. For each width in 768, 1024, 1280 and 1440 on `LEAD`, assert `[data-title-card]` left and right edges are within 1 px of `[data-post-hero] img`. At 1280 on `TEXT_ONLY`, assert the card's edges are within 1 px of `#main > article`.
- [x] T002 [US1] Run the new block (project `sections`) and confirm it fails today at 1024 px and up on `LEAD` and in the `TEXT_ONLY` case, and passes at 768 px. Record the failure before T003.

### Implementation

- [x] T003 [US1] In `src/layouts/PostLayout.astro`, remove `mx-auto max-w-3xl` from the title card's static class string (keep the `class:list` offsets, the caption's own `max-w-3xl` in `src/components/post/PostHero.astro`, and all inner markup unchanged). Depends on T002.
- [x] T004 [US1] Re-run the T001 tests and confirm they pass; run the existing a11y spec and the post component tests (`tests/component/post/PostLayout.test.ts`) to confirm no regression.

### Visual baselines

- [x] T005 [US1] Update the macOS visual baselines with `pnpm run test:visual:update` (nvm + shim wrapper, see CLAUDE.md). Inspect the diff: only `post-template-desktop-{light,dark}-darwin.png` in `tests/e2e/visual.spec.ts-snapshots/` should change, and only the card width and text wrapping. Any other changed image is a regression to fix, not a baseline to refresh.
- [ ] T006 [US1] (orchestrator) Update the Linux visual baselines with `pnpm run test:visual:update:linux` (needs Docker Desktop; ask Don to start it if `docker info` fails). Same expectation: only `post-template-desktop-*-linux.png` change. Fall back to the `visual-baselines` PR label and artifact if the Docker result differs from CI.

### Preview and gate

- [ ] T007 [US1] [PREVIEW-CHECK] Don eyeballs the wider header block on a real post with a feature image at large widths (1280 px and wider) on the preview deployment, and on a post with a caption and one without an image.
- [ ] T008 [US1] (orchestrator) Run the full `pnpm run verify` gate (via the background wrapper under `perl alarm`, read `VERIFY_EXIT=`); ask Don first per the check-in rule. Depends on T001 to T006.

## Dependencies

T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T008. T007 runs on the preview after the push. No parallel tasks: they touch one template and share the visual baseline set.

## Implementation Strategy

Single story, single phase. Tests first (T001 to T002), the one class-list edit (T003), verify (T004), refresh baselines (T005 to T006), then the gate and preview check.
