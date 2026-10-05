# Tasks: Series Images and Dark-Mode Card Outlines

**Input**: `specs/025-topic-images/` (spec.md, plan.md, research.md, data-model.md, contracts/series-cards.md, quickstart.md)
**Tests**: mandatory (Constitution Principle I). Every test task names its one primary layer (`docs/testing.md`, "Where a test goes"); a second layer carries a reason. Tests are written first and seen to fail before the implementation they cover.
**Toolchain**: follow `CLAUDE.md` "Local toolchain" (a plain wrapper script that puts Node 24 on `PATH` and runs `<cmd...>` under `perl alarm`; at planning time it lived at `/Users/doncoleman/.claude/jobs/808fe259/tmp/run.sh <alarm-seconds> <cmd...>`, recreate it if that job directory is gone). Ask Don before the full `pnpm run verify`.
**Format**: `- [ ] T### [P?] [US?] description with path`. `[P]` = different files, no dependency on an unfinished task.
**Major change** (Principle III, design system / visual identity): flagged in the PR body.

## Phase 1: Foundations (images, config, shared style tokens)

**Purpose**: the image files, the series-to-image map and the shared style tokens every story uses. Blocks Phases 2 to 4.

- [X] T001 Copy `/Users/doncoleman/Downloads/drift.png` and `/Users/doncoleman/Downloads/convergence.png` into `src/assets/series/drift.png` and `src/assets/series/convergence.png` by re-encoding through sharp (lossless PNG, 1536 x 768, no metadata); confirm sharp metadata shows no EXIF, ICC or XMP (research R1, quickstart step 1).
- [X] T002 [P] Write unit test `tests/unit/content/series-images.test.ts` (layer: unit; derives its list from `seriesIds`, no real names): the map has exactly one entry per series id and no other key, each image is 2:1, `seriesImage()` throws for a non-series id (FR-001, FR-004). Run it and see it fail (module missing).
- [X] T003 [P] Extend `tests/unit/content/topics.test.ts` (layer: unit, pure colour maths): new describe computes every dark edge token (series `outline` 300 shades, `cardEdge` `dusk-500`, and the kept text-only topic borders) against `dusk-BASE` and requires at least 3:1; asserts every class uses an existing palette token and `outline` includes the `forced-colors:` classes (FR-012, FR-014, FR-015). See it fail.
- [X] T004 Create `src/config/series-images.ts`: import both PNGs, export `seriesImages` keyed by `seriesIds` and `seriesImage(id)` that throws for a non-series id; leave `src/config/topics.ts` unchanged (data-model.md). T002 passes.
- [X] T005 Add `outline` (per palette) and the `cardEdge` export to `src/components/post/topic-styles.ts`, and update its header comment with the measured contrast figures (data-model.md). T003 passes.

**Checkpoint**: unit tests green; images and tokens exist.

## Phase 2: User Story 1 - Series tiles show their image on /writing/ (P1)

**Goal**: each series tile shows its image edge to edge at the top, 2:1, uncropped, above the padded text.
**Independent test**: build the fixture site, open `/writing/`; each tile shows its own image first; no other card gains an image.

### Tests (write first, see fail)

- [ ] T006 [P] [US1] Update `tests/component/post/SeriesIntro.test.ts` (layer: component, Astro container; markup contract section 1): image is the tile's first child, outside the `p-5` text div, not inside any `<a>`, `alt=""`, `data-series-image` matches the series, `loading="eager"`, only the first (Convergence) tile has `fetchpriority="high"`, tile order Convergence then Drift, no `title`/`aria-label`, `overflow-hidden rounded-xl` on the tile, 2:1 `width`/`height`. FR-009 (no JavaScript) is covered here because the image is static HTML; no browser-level second test.
- [ ] T007 [P] [US1] Update `tests/component/post/LeadStory.test.ts` (layer: component): lead story image is `loading="eager"` with `fetchpriority="auto"`, so `/writing/` has one high-priority image (plan, loading rules).
- [ ] T008 [P] [US1] Add to `tests/build/blog-listing.test.ts` (layer: build, only the real build shows emitted files): every `_astro/*.webp` derived from the series images is at most 25,600 bytes, each tile's 400w candidate (the file a 390 px 1x phone downloads) is at most 8,192 bytes, no built page references a PNG derived from `src/assets/series/`, the landing page tile images carry the 400/640/1008 `srcset` widths, and `/writing/` has exactly one `fetchpriority="high"` image (FR-007, SC-005, contract section 4). Second layer for the priority count, with reason: T006 and T007 each check one component, and only the built page shows the count across the tiles and the lead story together.
- [ ] T009 [P] [US1] Add geometry checks to `tests/e2e/blog-fixtures.spec.ts` (layer: e2e on the fixture site, because only a browser shows rendered size; the component test cannot): at phone and desktop widths each tile image spans the tile's inner width and its height is width/2 within 1 px, the two side-by-side tiles are equal height with images aligned at the top, with WCAG 1.4.12 text spacing injected at 320 px and at a 640 px (200% zoom) layout each tile grows to fit its text (no text clipped by the tile's `overflow-hidden`, none overlapped by the image), the focused "Read <series>" link's focus indicator lies wholly inside the tile, and the topic pill row, lead story and post cards contain no `[data-series-image]` (FR-002, FR-005, FR-016, US1 scenarios 1 to 3). No horizontal scroll at 320 px is already covered by the existing `REFLOW_PAGES` a11y check (plan), so it is not repeated here.

### Implementation

- [ ] T010 [US1] Edit `src/components/post/SeriesIntro.astro`: tile becomes `overflow-hidden rounded-xl` with banner fill and `outline`; add `<Image>` first (2:1, `widths` 400/640/1008, `sizes` per contract, `alt=""`, eager, `fetchpriority="high"` on the first tile only, `data-series-image`) and wrap the text in an inner `p-5` div. T006, T008 (all but the one-high-priority count, which passes after T011) and T009 pass.
- [ ] T011 [US1] Edit `src/components/post/LeadStory.astro`: image `fetchpriority="auto"`, keep `loading="eager"`. T007 and T008's one-high-priority check pass.

**Checkpoint**: `/writing/` tiles show images; US1 independently verifiable.

## Phase 3: User Story 2 - Series pages show their image above the banner (P1)

**Goal**: a 4:1 centred strip joined flush on top of the banner on every page of both series; none on topic pages.
**Independent test**: open `/writing/drift/` and `/writing/convergence/` (and page 2): strip above banner; open a `/writing/topics/<topic>/`: no image.

### Tests (write first, see fail)

- [ ] T012 [P] [US2] Update `tests/component/post/SeriesBanner.test.ts` (layer: component; contract section 2): `<img>` is inside the `<header>` before the eyebrow, `width=1536 height=384`, `alt=""`, eager and `fetchpriority="high"`, present on page 2 too, text block `p-6 md:p-8`, header `mb-8 overflow-hidden rounded-xl`, `h1` still the only heading and unchanged.
- [ ] T013 [P] [US2] Extend the existing `tests/component/post/TopicBanner.test.ts` (layer: component): `header[data-topic-banner]` contains no `<img>` for any topic (FR-004).
- [ ] T014 [P] [US2] Add to `tests/build/blog-listing.test.ts` (layer: build, because the crop of every `srcset` candidate is only visible in the real build output; research R2 risk): every strip `srcset` candidate on a series page has a 4:1 pixel size (400/640/1024/1536 wide), the 400w strip candidate is at most 8,192 bytes (SC-005), and an empty-series page still shows the strip (the empty state is page composition, which no component test renders). The topic page's lack of an image is T013's (component) and is not repeated here.
- [ ] T015 [P] [US2] Add geometry checks to `tests/e2e/blog-fixtures.spec.ts` (layer: e2e fixture site, rendered size and position): strip width equals the banner inner width, height is width/4 within 1 px at 320, 390 and desktop widths, strip bottom edge equals the text block top (no gap), header top radii are the card radius and the strip is clipped by them, never wider than the banner, with WCAG 1.4.12 text spacing at 320 px and at a 640 px (200% zoom) layout the banner grows to fit its text with nothing clipped, and the focused banner links' focus indicators lie wholly inside the header (FR-003, FR-005, FR-008, FR-016). No horizontal scroll at 320 px is the existing `REFLOW_PAGES` a11y check, and "same image on page 2" is T012's (component); neither is repeated here.

### Implementation

- [ ] T016 [US2] Edit `src/components/post/SeriesBanner.astro`: header `mb-8 overflow-hidden rounded-xl` with banner fill and `outline`; `<Image>` strip first (`width={1536} height={384}`, `widths` 400/640/1024/1536, `sizes` per contract, `alt=""`, eager, high priority, `aspect-[4/1]`), text in an inner `p-6 md:p-8` div. `SeriesPage.astro` and the route files stay unchanged. T012 to T015 pass; if T014 shows Astro does not crop each candidate, apply the CSS-crop fallback named in the plan and record it as a decision.

**Checkpoint**: series pages joined card works.

## Phase 4: User Story 3 - Cards stand out in dark mode (P2)

**Goal**: dark-mode outlines on series tiles, joined banners, post cards and the lead story; light mode and topic banners unchanged.
**Independent test**: dark mode on `/writing/` and a series page shows the outlines; light mode looks as before.

### Tests (write first, see fail)

- [ ] T017 [P] [US3] Update `tests/component/post/PostCard.test.ts` (layer: component, class contract): image card uses `cardEdge` (`border border-dusk-200 dark:border-dusk-500`, no `dusk-700`), text-only card keeps its 2 px topic border and gains no `cardEdge`/second outline, no hover/focus/active classes added (FR-010, FR-013, FR-016).
- [ ] T018 [US3] Update `tests/component/post/LeadStory.test.ts` (layer: component; same file as T007, so run after it): same `cardEdge` and text-only expectations for the lead story.
- [ ] T019 [P] [US3] Add probes to `tests/e2e/theme-tokens.spec.ts` (layer: e2e fixture site, because only a browser resolves computed colours per theme): on `/writing/`, `/writing/drift/` and a topic page, in dark the tiles and banner resolve a 1 px border in the series 300 shade, image cards and lead story resolve 1 px `dusk-500`, text-only cards keep their 2 px topic colour, the topic banner has no border, and the series images have computed `filter: none` and `opacity: 1`; in light the tile/banner border width is 0 and the card edge is `dusk-200` (FR-010, FR-011, FR-013, FR-017).
- [ ] T020 [P] [US3] Add to `tests/e2e/blog-forced-colors.spec.ts` (layer: e2e, forced colours only emulate in a browser): in forced-colors with light and dark themes, series tile, joined banner, post card and lead story (image and text-only) each have a solid border of at least 1 px in the system text colour, and the series images stay visible (FR-014).

### Implementation

- [ ] T021 [US3] Edit `src/components/post/PostCard.astro` and `src/components/post/LeadStory.astro`: non-text-only branch uses `cardEdge`; text-only branch unchanged. T017 to T020 pass (series `outline` already applied in T010 and T016).

**Checkpoint**: all behaviour tests green.

## Phase 5: Baselines, docs and gate

**Purpose**: visual coverage, design notes, budget evidence, preview review.

- [ ] T022 Add the `series-intro` fixture subject (locator `[data-series-intro] > div`, phone and desktop, light and dark) to `tests/e2e/visual.spec.ts` (layer: visual, pixels of the tiles; US1, US3). Run it first without baselines and see it fail for the missing snapshots.
- [ ] T023 Update the macOS visual baselines: `pnpm run test:visual:update` via the wrapper (this slice alters templates and the design system). Expected changes only: `series-banner-*` (4), `lead-story-{phone,desktop}-dark` (2), `listing-cards-{phone,desktop}-dark` (2), new `series-intro-*` (4). Any light `lead-story` or `listing-cards` diff or other changed baseline is a regression: fix the code, not the baseline. Compare `-previous.png`, not `-actual.png`; do not run it while Docker builds `dist`.
- [ ] T024 Update the Linux visual baselines: `pnpm run test:visual:update:linux` (needs Docker Desktop; if `docker info` fails, ask Don to start it, do not fall back to CI without asking). Commit only `*-linux.png`, same expected set as T023. Fallback only with Don's say-so: the `visual-baselines` label flow in `.claude/skills/_shared/visual-baselines.md`.
- [ ] T025 [P] Record the series images and dark-mode card outline in `docs/design/blog.md` (FR-018, Principle III design-system note).
- [ ] T026 Measure `totalBytes`, LCP and CLS for `home`, `writing-landing`, `writing-series-drift` and `writing-series-convergence` on `main` and on this branch (`pnpm run test:budget`), and record both sets for the PR body; if LCP is above 2.0 s apply the plan's first lever (`fetchpriority="low"` on the Drift tile, then quality 60) and record the decision (FR-007, FR-008, SC-004).
- [ ] T027 Run the existing a11y and budget projects unchanged and the quickstart fast checks; merge `origin/main` first. After Don agrees, run the full `pnpm run verify` in the background through the wrapper, read the `VERIFY_EXIT=` line, and fix any red.
- [ ] T028 [PREVIEW-CHECK] Don judges on the preview deployment (`/writing/`, `/writing/drift/`, `/writing/convergence/`, `/writing/drift/2/` if present, `/writing/topics/technology-teams/`; light and dark; phone and desktop): image compression shows no visible banding, blockiness or blur (FR-007); the centred 4:1 crop keeps the orange focal point (spec assumption); the `dusk-500` card edge is visible enough (swap to `dusk-400` is one token if not); outlines read as one family with the series marker. Left unticked by the implementing agent and listed in its summary. See `.claude/skills/_shared/preview-check.md`.

## Dependencies and order

- Phase 1 first (T002/T003 before T004/T005; T001 before T004).
- Phases 2 and 3 depend on Phase 1 and touch different components, so either order works; both use `outline` from T005. They are not run in parallel with each other: T008/T014 share `tests/build/blog-listing.test.ts` and T009/T015 share `tests/e2e/blog-fixtures.spec.ts`.
- Phase 4 depends on Phases 2 and 3 (T019 and T020 probe tiles and banner); T018 runs after T007 (same file).
- Phase 5 needs all code done; T022 before T023, T023 before T024, T026 and T027 after baselines, T028 last and left open.
- Within each phase, test tasks precede the implementation tasks.

## Parallel examples

- Phase 1: T002 and T003 together.
- Phase 2: T006, T007, T008, T009 together.
- Phase 3: T012 to T015 together.

## Implementation strategy

MVP is Phase 1 plus Phase 2 (tiles with images). Phase 3 completes the images; Phase 4 is the dark-mode fix. Land everything in one PR (one feature, one branch); auto-merge stays off while T028 is open.
