# Research: Series Images and Dark-Mode Card Outlines

**Feature**: `025-topic-images` | **Date**: 2026-10-05 | **Plan**: [plan.md](./plan.md)

Astro choices below cite the page found through the Astro Docs MCP (`astro-docs`), which was
available for this plan. The site runs Astro 7.3.5 with the default sharp image service.

## R1. Where the source images live

**Decision**: `src/assets/series/drift.png` and `src/assets/series/convergence.png`, imported
by one new module, `src/config/series-images.ts`, which maps each series id to its image.
During implementation the two files are copied in from `/Users/doncoleman/Downloads/` through
sharp (lossless PNG re-encode, no metadata carried over), not with a plain `cp`.

**Rationale**:

- Astro recommends keeping local images in `src/` so `astro:assets` can transform and
  optimise them; files in `public/` are served as they are
  (docs.astro.build/en/guides/images/#where-to-store-images, "src/ vs public/").
- The images belong to a series, and series are site configuration (`src/config/topics.ts`),
  not a content collection. They are not post content, so `src/content/posts/images/` is the
  wrong home, and there is no topic collection to give them an `image()` field.
- `topics.ts` cannot import the PNGs itself: `tests/helpers/content.ts` and other plain-Node
  readers import it without Vite, and a `.png` import would break them. A separate module
  imported only by Astro components (and by Vitest, which runs through `getViteConfig`) keeps
  `topics.ts` loadable everywhere.
- Inspection of the sources (2026-10-05): both are 1536 × 768 RGB PNGs with only `IHDR`,
  `pHYs`, `IDAT` and `IEND` chunks. There is no EXIF, XMP, ICC, text chunk or C2PA manifest.
  Re-encoding through sharp (as features 014 and the Cadence story did for screenshots) drops
  `pHYs` and guarantees nothing else rides along, at no cost.

**Alternatives considered**: `public/images/series/` (rejected: no resizing or WebP, the 1.5 MB
files would be served as they are, against FR-007); `src/content/posts/images/` (rejected:
not post content, and the content helper treats `images/` as post assets); an `image` field on
the `Topic` type in `topics.ts` (rejected: breaks the plain-Node imports above); a new `series`
data collection with the `image()` schema helper (rejected: turns two config entries into a
collection, the spec rules out a general per-topic image mechanism).

## R2. Rendering: `<Image>` or `<Picture>`

**Decision**: Astro's `<Image>` from `astro:assets`, WebP output, with explicit `widths` and
`sizes`, as `PostCard` and `LeadStory` already do.

- Tile (landing, full 2:1, no crop): `widths={[400, 640, 1008]}`,
  `sizes="(min-width: 1056px) 504px, (min-width: 768px) calc(50vw - 1.5rem), calc(100vw - 2rem)"`,
  `quality={70}`, `alt=""`, `loading="eager"`; the first tile (Convergence) also
  `fetchpriority="high"`.
- Strip (series page, 4:1 centred crop): `width={1536} height={384}` with
  `widths={[400, 640, 1024, 1536]}`,
  `sizes="(min-width: 1056px) 1024px, calc(100vw - 2rem)"`, `quality={70}`, `alt=""`,
  `loading="eager"`, `fetchpriority="high"`.

**Rationale**: `<Image>` resizes at build time, writes `width` and `height` so the space is
reserved before load (FR-008, no CLS), and outputs a plain `<img>` that needs no JavaScript
(FR-009) (docs.astro.build/en/guides/images/#astro-components-for-images;
docs.astro.build/en/reference/modules/astro-assets/#widths and #sizes). Since Astro 6 the
default image service crops whenever both `width` and `height` are given, centred unless
`position` says otherwise (docs.astro.build/en/guides/upgrade-to/v6/#changed-cropping-by-default-in-default-image-service;
docs.astro.build/en/reference/modules/astro-assets/#position), so the 4:1 strip is cut at build
time and the reader downloads only the strip, not the 2:1 picture. `alt` is mandatory on
`<Image>`; `alt=""` marks the image decorative (FR-006).

`<Picture>` with AVIF + WebP was considered and rejected: the WebP files are already 3 to 16 KB
(R5), so a second format would add markup and build time for a gain of a few kilobytes.
Responsive `layout` (`constrained` / `full-width`) was considered and rejected for consistency
with the two existing card images, which use explicit `widths`/`sizes`; it also generates
candidates up to 1600w+ that the 1024 px column never uses.

**Implementation check (build test)**: the build test asserts that every strip candidate is
4:1 (each `srcset` file's pixel size, read with sharp) so that a change in how Astro applies the
crop to `widths` is caught. Fallback if Astro scales the height per width differently than
expected: request the 2:1 image and crop in CSS (`aspect-[4/1] object-cover object-center`),
which doubles the strip's bytes (still under 10 KB at 400w).

**Sizes derivation**: `main` is `container mx-auto p-4`, and the writing pages wrap content in
`max-w-screen-lg` (1024 px). The banner is therefore `100vw - 2rem` wide up to 1056 px, then
1024 px. The tiles are a two-column grid with `gap-4` from `md`: about `50vw - 1.5rem` between
768 and 1055 px, then (1024 − 16) / 2 = 504 px. At 2x DPR the widest tile wants 1008 px and the
widest strip 2048 px; the source is 1536 wide and Astro never upscales, so 1536 is the top
strip candidate.

## R3. The joined strip + banner card

**Decision**: the strip is the first child **inside** `SeriesBanner`'s `<header
data-series-banner>`. The header loses its padding and gains `overflow-hidden`; the eyebrow,
`h1`, description and links move into an inner `div` that keeps `p-6 md:p-8`. The tile follows
the same pattern in `SeriesIntro`: the tile `div` drops `p-5` for `overflow-hidden`, the image
comes first, and the text sits in an inner `div` with `p-5`.

**Rationale**: one element with `rounded-xl overflow-hidden` gives the strip the rounded top
corners and the banner square top corners by construction (FR-003); one border on that element
wraps strip and banner with no line between them (FR-011); the strip is never wider than the
banner (spec edge case). The visual test's locator, `header[data-series-banner]`, keeps working
and now captures the whole joined card. The image is decorative, so placing it inside the
`header` adds nothing to the accessibility tree.

**Alternatives considered**: a wrapper `div` around a separate image and the `header` (rejected:
two elements to keep flush, two borders to merge, and the visual locator would need to change);
a CSS `background-image` (rejected: no `astro:assets` resizing, no reserved size, and forced
colours mode removes background images).

## R4. Dark-mode outlines

**Decision**:

| Card | Light | Dark | Forced colours |
|---|---|---|---|
| Series tile, series banner | no border (unchanged) | `dark:border dark:border-{colour}-300` (1px) | `forced-colors:border` (1px, system colour) |
| Post card / lead story with an image | `border border-dusk-200` (unchanged) | `dark:border-dusk-500` (was `dusk-700`) | existing 1px border |
| Text-only post card / lead story | `border-2` in topic colour (unchanged) | unchanged (its topic border is its one outline) | unchanged |
| Topic banner, PostLayout title card, cards outside `/writing/` | unchanged | unchanged | unchanged |

The series outline classes live in `topic-styles.ts` as a new `outline` field of `TopicStyle`
(series palettes need it; every palette gets one so the map stays uniform). The neutral card
edge becomes one exported constant, `cardEdge`, used by `PostCard` and `LeadStory`.

**Contrast (computed with the same HSL-from-BASE rule the unit test uses)**:

| Token | vs page `dusk-BASE` (#1c1a29) | Note |
|---|---|---|
| `dusk-700` (today) | 1.64:1 | fails 3:1, which is the reported problem |
| `dusk-500` (chosen) | 3.16:1 | passes; quietest neutral that passes |
| `dusk-400` | 4.78:1 | passes; brighter, kept as the fallback if Don finds `dusk-500` too faint |
| `lavender-300`, `sage-300` | already ≥ 3:1 (asserted today by `topics.test.ts` for the marker) | same token as the series marker's dark outline |

`dusk-500` against the card fill `dusk-800` is 2.64:1, but the edge that matters for WCAG 1.4.11
is between the card and the page, and the outline sits on that boundary. Text colours and fills
do not change, so every text pair keeps its existing ≥ 4.5:1 (FR-012).

**Rationale**: `dark:` and `forced-colors:` variants keep light mode pixel-identical (no
transparent border that would shift the box by 1 px, FR-013) while giving forced-colours mode a
system-colour edge (FR-014), matching how pills and the marker already handle forced colours.
1px is thinner than the marker's 2px (FR-011). Only existing palette tokens are used (FR-015).

**Alternatives considered**: `outline`/`ring` utilities (rejected: `ring` is a box-shadow, which
forced-colours mode removes; `outline` would sit outside the radius-clipped image in some
engines and duplicates the existing border approach); a transparent 1px light-mode border
(rejected: shifts light-mode layout by 1px, against FR-013); 2px series outline (rejected: the
spec asks for thin, no thicker than the marker; 1px reads as an edge, the marker stays the
emphatic one).

## R5. Image weight and the performance budget

Measured with sharp (the same encoder Astro uses) from the supplied sources, WebP:

| Candidate | Drift | Convergence |
|---|---|---|
| Tile 400 × 200, q65 | 5,040 B | 3,610 B |
| Tile 640 × 320, q65 | 8,682 B | 6,308 B |
| Tile 1008 × 504, q65 | 15,518 B | 11,126 B |
| Strip 400 × 100, q65 | 2,952 B | 2,750 B |
| Strip 1024 × 256, q65 | 8,772 B | 8,146 B |
| Strip 1536 × 384, q65 | 13,918 B | 13,206 B |

Quality 70 (chosen; the pictures are illustrations with smooth gradients where banding shows
first) adds roughly 10 to 15%.

**Budget figures (existing `tests/e2e/budget.spec.ts`, unchanged)**: the budget run is a 390 px
1x viewport, so the browser picks the 400w candidates.

- `writing-landing` (`/writing/`): was 77,648 B with Inter (018 R4), lower since 021 trimmed
  card images. The two 400w tiles add about 9 to 11 KB with headers. Expected well under the
  150 KB (153,600 B) limit.
- `writing-series-convergence` / `writing-series-drift`: 86,741 B for convergence after 021.
  One 400w strip adds about 3 to 4 KB. Expected about 90 KB.

**SC-005 figure**: every delivered series image file is at most **25 KB** (the largest
candidate, the 1536w strip or the 1008w tile at q70, is expected near 16 to 18 KB), and the file
a 390 px phone downloads is at most **8 KB**. That is under 2% of the 1.5 MB source. A build test
asserts the 25 KB cap per file; the budget run records the phone figure.

**LCP**: on `/writing/` at 390 × 844 and at 1280 × 800 the series tiles now sit above the lead
story, so the Convergence tile image is the likely LCP element; it loads eagerly at high
priority. On the series pages the strip is at the top of every page and loads eagerly at high
priority. `LeadStory` keeps its own `loading="eager" fetchpriority="high"` unchanged; if the
budget run shows LCP pressure on `/writing/`, the first tuning step is to drop the lead story to
`fetchpriority="auto"` (it is now below the fold on a phone). No CLS: `<Image>` writes
`width`/`height`.

## R6. How the images are exercised in tests

**Decision**: the series images are site assets, not content, so the Playwright fixture site
(which copies the repository's `src/` and removes only real posts) renders the **real** series
images. Every check runs there or in the Astro container; none depends on which real posts
exist.

- Unit: `series-images.ts` maps exactly `seriesIds` (derived from `topics.ts`, no hard-coded
  list), each image is 1536 × 768 (2:1); outline tokens meet 3:1 against `dusk-BASE`.
- Component (Astro container): `SeriesIntro` and `SeriesBanner` markup (image position, `alt=""`,
  not inside a link, loading attributes, 4:1 strip dimensions, page 2 still shows the strip);
  `TopicBanner` has no image; `PostCard`/`LeadStory` edge classes.
- Build (fixture-site build already used by `tests/build/blog-listing.test.ts`): strip candidates
  are 4:1, every series image file ≤ 25 KB, a topic page has no series image.
- E2E on the fixture site (`sections` project, `blog-fixtures.spec.ts`): rendered geometry (tile
  image spans the tile and is 2:1, strip ≈ 4:1, same width as the banner, flush, no horizontal
  scroll at 320 px); dark-mode outline colours via computed style (`theme-tokens.spec.ts`);
  forced colours (`blog-forced-colors.spec.ts`).
- Visual: one new fixture subject (series tiles) plus refreshed baselines (plan, "Visual
  baselines").
- Budget and a11y: existing template runs on the real site, unchanged in code.

`tests/helpers/content.ts` needs no change: no post or project is added, and the series list
comes from `topics.ts`.
