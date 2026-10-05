# Implementation Plan: Series Images and Dark-Mode Card Outlines

**Branch**: `025-topic-images` | **Date**: 2026-10-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/025-topic-images/spec.md` (with its 2026-10-05
Clarifications)

**Major change (Constitution Principle III): YES.** Criterion: *changes the design system or
visual identity*. The two series gain a picture that becomes part of how they are recognised,
and every writing card changes its dark-mode edge (a new outline on series tiles and banners, a
new neutral edge token on post cards and the lead story). Under Technology Constraints, a
deviation from the ported design baseline is a major change. No other criterion applies: no
dependency, integration or service is added (sharp and `astro:assets` are already in use), no
contact data is touched, running costs do not rise (below), no CI, deployment, Worker or
infrastructure file changes, and the constitution is not amended. The PR body flags the change
with this criterion so Don reviews the preview in both themes before approving. Auto-merge may
still be armed; it waits for his approval.

## Summary

Drift and Convergence each get one decorative image, copied from Don's two 1536 × 768 PNGs into
`src/assets/series/` (re-encoded through sharp, no metadata) and mapped to the series ids in a
new `src/config/series-images.ts`. Astro's `<Image>` renders them: full 2:1 at the top of each
series tile on `/writing/`, and as a 4:1 centred strip, cropped at build time, joined flush on
top of the series banner on every page of `/writing/drift/` and `/writing/convergence/`. Both
images are WebP, sized per slot (a 390 px phone downloads files of 3 to 6 KB), load eagerly
because they sit at the top of their pages, and reserve their space through `width`/`height`.
Each page has exactly one high-priority image: the Convergence tile on `/writing/` (the lead
story drops to `fetchpriority="auto"`) and the strip on a series page.

In dark mode the series tiles and banners gain a 1px outline in the series' 300 shade (the
marker's dark outline token; lavender-300 6.16:1 and sage-300 10.48:1 against the page), and
post cards and the lead story with an image move their edge from `dusk-700` (1.64:1 against
the page) to `dusk-500` (3.16:1). Light mode is untouched;
forced-colours mode keeps a system-colour edge. Tests come first at the cheapest layer for each
behaviour; the existing budget, a11y and visual gates stay as they are, with predicted visual
baseline changes and one new visual subject.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, Tailwind CSS 4, Node 24 from `.nvmrc`

**Primary Dependencies**: `astro:assets` `<Image>` with the default sharp image service (already
used by `PostCard` and `LeadStory`). sharp, already installed as Astro's image service, is used
once at implementation time to copy the sources in. No new dependency.

**Storage**: Two PNG files in `src/assets/series/`. No content schema, D1 or API change.

**Testing**: Vitest `unit` (unit + Astro container component tests) and `build` (fixture-site
build) projects; Playwright `sections` (fixture site, 4322), `e2e`, `a11y`, `budget` and `visual`
projects.

**Target Platform**: Prerendered static pages on Cloudflare Workers static assets; evergreen
browsers, light, dark and forced-colours modes.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: Existing budget, unchanged: per template on simulated slow-4G mobile,
LCP ≤ 2.5 s, CLS < 0.1, long tasks ≤ 200 ms, JS ≤ 10 KB, total ≤ 150 KB. These limits apply
to each affected template on its own: `home` (its "Recent writing" cards change edge),
`writing-landing`, `writing-series-drift`, `writing-series-convergence` and `writing-topic`, all
already in `tests/e2e/templates.ts`. Later series pages are the same template with the same
image and are not budgeted separately. SC-005 figures (spec): every delivered series image file
≤ 25 KB; the file a 390 px 1x phone downloads ≤ 8 KB (research R5). Delivered images reuse the
existing `/_astro/*` caching rule in `public/_headers` (`max-age=31536000, immutable`); no new
header is needed.

**Constraints**: Tile images uncropped 2:1; strip about 4:1, centred, never wider than the
banner; decorative (`alt=""`), not links; no JavaScript; light mode pixel-identical apart from
the added images; existing palette tokens only; WCAG 2.2 AA (3:1 non-text, 4.5:1 text).

**Scale/Scope**: 2 image files, 1 new config module, 4 components edited (`SeriesIntro`,
`SeriesBanner`, `PostCard`, `LeadStory`) plus `topic-styles.ts`; about 8 test files edited or
added; 1 new visual subject; 16 visual baselines per the table below change across both
platforms and 8 are added.

No NEEDS CLARIFICATION remains; research.md R1 to R6 resolves every choice.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan meets it |
|---|---|---|
| **I. Test-First** | PASS | Every behaviour gets a failing test first, at one primary layer (see "Test placement"). Existing tests that pin `dark:border-dusk-700` on `PostCard`/`LeadStory` are updated to the new token *before* the components change, and seen to fail. |
| **II. Automated Release Gate** | PASS | No gate is skipped or weakened. Budget limits, a11y and visual thresholds are unchanged; baselines change only where predicted below. Branch gets its preview deployment as usual. |
| **III. Human Review for Major Changes** | PASS (major) | Classified **major** (design system / visual identity), stated above and to be flagged in the PR body. Don's approving review is required as for every PR. |
| **IV. First-Party Before Custom** | PASS | Images: Astro `<Image>` from `astro:assets` (build-time resize, WebP, build-time 4:1 crop via `width`+`height`, intrinsic size for CLS), images stored in `src/` per docs.astro.build/en/guides/images/#where-to-store-images. `<Picture>` considered and not needed (R2). Delivery: Cloudflare Workers static assets, the site's existing hosting; no Cloudflare Images or Image Resizing, since build-time transforms already cover it at no cost. Styling: Tailwind `dark:` and `forced-colors:` variants with existing tokens. No custom image code; the one-off sharp re-encode is a copy step, not shipped code. Astro Docs MCP was available and is cited in research.md. |
| **V. Static by Default** | PASS | All pages stay prerendered; images are plain `<img>` with no client JavaScript and show with JavaScript off. No endpoint added. |
| **VI. Content as Files** | PASS | Images are committed files; the mapping is a typed config module beside `topics.ts`. A missing image for a series fails the unit test and the build (`seriesImage()` throws). No CMS or database. |
| **VII. Private Data** | PASS | Not touched. The images carry no metadata (checked: no EXIF/XMP/ICC/text chunks; re-encoded anyway). |
| **VIII. Cloudflare Best Practices** | PASS | Static assets only; `/api/*` untouched; no Worker, D1 or config change. About 10 new `_astro/*.webp` files, far inside the free plan's static-asset limits. |
| **IX. Cost Ceiling** | PASS | Expected new monthly cost: **$0**. Static asset requests are free and unmetered on Workers static assets; no new service. Repository grows by about 3 MB of source PNG. Not a cost-driven major change. |
| **X. Accessible, Fast and Private** | PASS | Decorative `alt=""`; every dark card edge ≥ 3:1 against `dusk-BASE`, measured for this feature: dusk-500 3.16:1, lavender-300 6.16:1, sage-300 10.48:1, and the kept text-only borders (lowest lavender-400 4.06:1, dusk-500 3.16:1); text pairs unchanged ≥ 4.5:1; forced-colours edges in `CanvasText`; budget impact about +10 KB on `/writing/` and +3 KB on series pages, well under 150 KB; one eager high-priority image per page; no CLS. No third-party script. |
| **XI. Spec Kit Workflow** | PASS | Spec Kit branch `025-topic-images`, one feature, worked in its own worktree. Parallel worktrees: this slice edits `PostCard.astro`, `LeadStory.astro`, `topic-styles.ts` and visual baselines, so a sibling touching those must merge first and this branch re-merges `origin/main` before the gate. |
| **Security Baseline** | PASS | `public/_headers`, ruleset, Dependabot and endpoint limits unchanged. Images are same-origin, so the CSP `img-src` needs no change. |
| **Development Workflow** | PASS | Astro choices cite docs pages (research R1, R2). Each test task names its layer. Scope limited to the spec; follow-ups listed below. Plain-language copy (no new copy is added). |

No violations; Complexity Tracking is empty.

## Design

### Files

- `src/assets/series/drift.png`, `src/assets/series/convergence.png` (new): copied in from
  `/Users/doncoleman/Downloads/` via sharp, lossless PNG, metadata not kept (R1).
- `src/config/series-images.ts` (new): imports both, exports `seriesImages` keyed by
  `seriesIds` and `seriesImage(id)` which throws for a non-series id. `topics.ts` is unchanged so
  plain-Node readers (`tests/helpers/content.ts`) keep working.
- `src/components/post/topic-styles.ts`: new `outline` field per palette
  (`dark:border dark:border-{c}-300 forced-colors:border forced-colors:border-[CanvasText]`) and new `cardEdge` export
  (`border border-dusk-200 dark:border-dusk-500`); header comment updated with the contrast
  figures.
- `src/components/post/SeriesIntro.astro`: tile becomes `overflow-hidden rounded-xl` + banner
  fill + `outline`; `<Image>` first (2:1, eager, first tile `fetchpriority="high"`), text in an
  inner `p-5` div.
- `src/components/post/SeriesBanner.astro`: header becomes `mb-8 overflow-hidden rounded-xl` +
  fill + `outline`; `<Image>` strip first (`width={1536} height={384}`, eager, high priority),
  text in an inner `p-6 md:p-8` div. `SeriesPage.astro` and both route files are unchanged.
- `src/components/post/PostCard.astro`, `LeadStory.astro`: the non-text-only branch uses
  `cardEdge`. Text-only branch unchanged. `LeadStory`'s image moves from
  `fetchpriority="high"` to `fetchpriority="auto"` (still `loading="eager"`), so `/writing/`
  has one high-priority image, the Convergence tile.
- Loading rules: both tiles load eagerly, because side by side (tablet and up) both sit in the
  first viewport and stacked on a 390 × 844 phone the Drift tile starts inside or just below it;
  lazy loading would save at most one 4 to 6 KB file and risk a late paint. Only the first tile
  is high priority. The cards have no hover, focus or active styles of their own, so the
  outline never changes with state. The tile and banner links sit inside the padded text block,
  so the card's `overflow-hidden` never clips their focus ring, and the card's height is
  `auto`, so 200% zoom or text spacing grows the card rather than clipping text.
- `docs/design/blog.md`: one note recording the series images and the dark-mode card outline
  as part of the writing design (the design-system change Principle III flags).

Exact attributes and rendered properties: [contracts/series-cards.md](./contracts/series-cards.md).
Entities and style fields: [data-model.md](./data-model.md).

### Test placement (Development Workflow: one primary layer each)

| Behaviour (spec) | Layer | Where |
|---|---|---|
| Each series has exactly one 2:1 image; non-series topics need none (FR-001, FR-004, edge case) | Unit | new `tests/unit/content/series-images.test.ts` (derives the list from `seriesIds`) |
| Dark outlines ≥ 3:1 vs page; only existing tokens (FR-012, FR-015) | Unit | `tests/unit/content/topics.test.ts` (new describe for `outline` and `cardEdge`) |
| Tile markup: image first, outside padding, `alt=""`, not in a link, eager, priority on first (FR-002, FR-006, FR-009) | Component | `tests/component/post/SeriesIntro.test.ts` |
| Banner markup: strip inside header before eyebrow, 4:1 `width`/`height`, `alt=""`, on page 2 too; `h1` unchanged (FR-003, FR-006) | Component | `tests/component/post/SeriesBanner.test.ts` |
| Topic banner has no image (FR-004) | Component | existing `tests/component/post/TopicBanner.test.ts` (extended) |
| Card edge classes, text-only keeps its topic border; lead story image no longer high priority (FR-010, FR-013, FR-016) | Component | `PostCard.test.ts`, `LeadStory.test.ts` (update the `dusk-700` and `fetchpriority` expectations) |
| Kept text-only topic borders ≥ 3:1 against the page (FR-012) | Unit | `tests/unit/content/topics.test.ts` (same describe as the outline check) |
| Strip candidates are 4:1; every series WebP ≤ 25 KB and each 400w candidate ≤ 8 KB; one high-priority image on `/writing/` (second layer: only the built page combines tiles and lead story); empty series page still shows the strip (FR-003, FR-007, SC-005) | Build | `tests/build/blog-listing.test.ts` (its existing fixture build) |
| Rendered geometry: tile 2:1 full width, strip ≈ 4:1 banner-wide and flush; cards grow under 200% zoom and text spacing with nothing clipped; focus indicators not clipped by the card (FR-002, FR-003, FR-005, FR-016) | E2E (fixture site) | `tests/e2e/blog-fixtures.spec.ts` |
| Dark outline colours resolve; light unchanged; topic banner unchanged; images unfiltered in dark (FR-010, FR-011, FR-013, FR-017) | E2E (fixture site) | `tests/e2e/theme-tokens.spec.ts` (new probes on `/writing/`, `/writing/drift/`, a topic page) |
| Edges visible in forced colours (FR-014) | E2E | `tests/e2e/blog-forced-colors.spec.ts` |
| Pixels of the tiles (US1, US3) | Visual | `tests/e2e/visual.spec.ts`: new fixture subject `series-intro` on `/writing/`, locator `[data-series-intro] > div` (the grid) |
| Budget, no CLS, LCP (FR-007, FR-008, SC-004) | Budget | existing `tests/e2e/budget.spec.ts`, unchanged |
| AA on home, landing, both series, empty series, topic templates (SC-004) | a11y | existing `blog.a11y.spec.ts` / `blog-fixture.a11y.spec.ts`, unchanged |
| 320 px reflow on `/writing/` and `/writing/drift/` (FR-005) | a11y | existing `REFLOW_PAGES` in `blog.a11y.spec.ts`, unchanged |

FR-009 (no JavaScript) is covered by the component tests: the image is static HTML with no
script, so no second, browser-level test is added.

**Fixture vs real content**: the series images are site assets, not posts, so the fixture site
(which copies `src/` and drops only real posts) renders the real images; visual, geometry and
token checks run there on frozen fixture posts. Budget and a11y run on the real site's
templates, as today. No fixture post is added and `tests/helpers/content.ts` needs no change.

### Visual baselines

| Baseline | Phone/desktop × theme | Per platform | Both platforms | Why |
|---|---|---|---|---|
| `series-banner-*` | 2 × light, dark | 4 changed | 8 | strip joins the banner; dark adds the outline |
| `lead-story-{phone,desktop}-dark` | 2 | 2 changed | 4 | fixture lead story (`every-part`) has an image: edge `dusk-700` → `dusk-500` |
| `listing-cards-{phone,desktop}-dark` | 2 | 2 changed | 4 | the image cards' edge; the text-only card is unchanged |
| `series-intro-*` (new subject) | 2 × light, dark | 4 new | 8 | tiles with images and outline |

Light `lead-story` and `listing-cards`, `post-template` (related posts sit outside the
screenshotted `article`), `sections`, header, footer, menu, not-found, projects and contact
baselines must not change. Refresh macOS locally and Linux via Docker per
`.claude/skills/_shared/visual-baselines.md`; the series images add new raster content rather
than glyphs, so Docker output is expected to match CI, with the `visual-baselines` label as the
fallback if CI disagrees.

### Budget expectations

From research R5 and the figures recorded in specs 018 and 021: `writing-landing` gains about
10 KB (two 400w tiles), `writing-series-convergence` (86.7 KB after 021) and
`writing-series-drift` gain about 3 to 4 KB (one 400w strip). All stay far under 150 KB. LCP on
`/writing/` likely moves from the lead story to the Convergence tile image, which loads eagerly
at high priority; the series pages' LCP is the strip or the `h1`. Expected margins to the
150 KB (153,600 B) limit: `writing-landing` about 60 KB or more, the series pages about 60 KB.
The implementation measures `totalBytes`, LCP and CLS for `home`, `writing-landing`,
`writing-series-drift` and `writing-series-convergence` on `main` before the change and again
after it, and records both sets in the PR. If the budget run shows LCP above 2.0 s (80% of the
2.5 s limit) on any of them, the first lever is `fetchpriority="low"` on the Drift tile, then
quality 60; either is recorded as a decision if used.

## Project Structure

### Documentation (this feature)

```text
specs/025-topic-images/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── series-cards.md  # Phase 1
├── checklists/
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── assets/series/
│   ├── convergence.png        # new
│   └── drift.png              # new
├── config/
│   ├── series-images.ts       # new: series id -> ImageMetadata
│   └── topics.ts              # unchanged
└── components/post/
    ├── topic-styles.ts        # + outline, + cardEdge
    ├── SeriesIntro.astro      # tile image + outline
    ├── SeriesBanner.astro     # joined strip + outline
    ├── PostCard.astro         # cardEdge
    └── LeadStory.astro        # cardEdge

tests/
├── unit/content/series-images.test.ts       # new
├── unit/content/topics.test.ts              # outline contrast
├── component/post/{SeriesIntro,SeriesBanner,PostCard,LeadStory,TopicBanner}.test.ts
├── build/blog-listing.test.ts               # strip ratio, file caps
└── e2e/{blog-fixtures,theme-tokens,blog-forced-colors,visual}.spec.ts
    └── visual.spec.ts-snapshots/            # 16 changed, 8 new PNGs
```

**Structure Decision**: single Astro project; the images sit in `src/assets/` beside the
existing `fonts/`, mapped from `src/config/` beside `topics.ts`, and rendered by the existing
post components. No new route or layout.

## Risks and open points

- **Astro crop with `widths`**: research R2 relies on `<Image>` cropping each `srcset`
  candidate to the requested 4:1. A build test checks it; the fallback is a CSS crop of the 2:1
  image (about twice the strip bytes, still a few KB).
- **`dusk-500` faintness**: chosen as the quietest neutral that passes 3:1 (3.16:1). If Don finds
  it too faint on the preview, `dusk-400` (4.78:1) is a one-token swap.
- **Parallel worktrees**: `PostCard.astro`, `LeadStory.astro`, `topic-styles.ts` and the
  `lead-story` / `listing-cards` baselines are shared with any sibling slice touching cards;
  merge `origin/main` before the gate and re-take those baselines if a sibling changed them.

## Follow-up (out of scope, from the spec)

Images for non-series topics; series images in Open Graph, RSS or post pages; dark-mode edges
for the post page's title card, topic banners and non-writing pages.

## Post-design Constitution Check

Re-checked after research, data model and contract: unchanged, all PASS, classification still
**major** (design system / visual identity). The design adds no dependency, endpoint, cost or
configuration change; the only new runtime artefacts are static WebP files.

## Complexity Tracking

None.
