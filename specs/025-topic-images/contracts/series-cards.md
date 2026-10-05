# Contract: Series tiles, series banner and card outlines

**Feature**: `025-topic-images` | Extends spec 013 `contracts/writing-pages.md` ("Landing",
"Series page") and spec 008 `contracts/blog-pages.md` ("Post card", "Landing" item 2).

Tests assert this markup and these rendered properties; anything not listed keeps its spec 013
or spec 008 contract.

## 1. Series tile (`SeriesIntro.astro`, on `/writing/`)

```html
<div data-series-intro-item="convergence"
     class="overflow-hidden rounded-xl {banner fill/text} {outline}">
  <img data-series-image="convergence" alt="" width="1008" height="504"
       src="/_astro/convergence.<hash>.webp" srcset="… 400w, … 640w, … 1008w"
       sizes="(min-width: 1056px) 504px, (min-width: 768px) calc(50vw - 1.5rem), calc(100vw - 2rem)"
       loading="eager" fetchpriority="high" decoding="async"
       class="block aspect-[2/1] h-auto w-full">
  <div class="p-5">
    <h3>Convergence</h3> <p>{description}</p> <p><a href="/writing/convergence/">Read Convergence</a></p>
  </div>
</div>
```

- Order stays Convergence, Drift. Only the first tile carries `fetchpriority="high"`; both are
  `loading="eager"`.
- The `<img>` is the tile's first child, outside the padded text, not inside any `<a>`.
- `alt=""`; no `title`, `aria-label` or `figcaption`.
- Rendered: image width equals tile inner width (± 1 px), height = width / 2 (± 1 px); no
  horizontal page scroll at 320 px.
- The topic pill row, lead story and post cards on the page contain no `[data-series-image]`.

## 2. Series banner (`SeriesBanner.astro`, on `/writing/<series>/` and `/writing/<series>/<n>/`)

```html
<header data-series-banner="drift"
        class="mb-8 overflow-hidden rounded-xl {banner fill/text} {outline}">
  <img data-series-image="drift" alt="" width="1536" height="384"
       srcset="… 400w, … 640w, … 1024w, … 1536w"
       sizes="(min-width: 1056px) 1024px, calc(100vw - 2rem)"
       loading="eager" fetchpriority="high" decoding="async"
       class="block aspect-[4/1] h-auto w-full">
  <div class="p-6 md:p-8">
    <p>Series</p> <h1>Drift{, page n}</h1> <p>{description}</p> <p>{links}</p>
  </div>
</header>
```

- Same image on every page of the series (page 2 and later included).
- Every `srcset` candidate is a 4:1 centred crop of the 2:1 source.
- Rendered: strip width equals the header's inner width; strip height = width / 4 (± 1 px);
  the strip's bottom edge equals the text block's top edge (no gap); the header's computed
  top-left/top-right radii are the card radius and are what clip the strip.
- The `h1` stays the page heading; the `<img>` adds nothing to the accessibility tree.
- `TopicBanner` (`header[data-topic-banner]`, `/writing/topics/<topic>/`) contains no `<img>`.

## 3. Outlines (computed style, by theme)

| Element | Light | Dark | Forced colours |
|---|---|---|---|
| `[data-series-intro-item=<id>]`, `header[data-series-banner=<id>]` | `border-top-width: 0px` | `1px solid {colour}-300` | border width ≥ 1px |
| `[data-post-card]:not([data-text-only])`, `[data-lead-story]:not([data-text-only])` | `1px solid dusk-200` | `1px solid dusk-500` | 1px |
| `[data-post-card][data-text-only]`, `[data-lead-story][data-text-only]` | `2px solid` topic border (unchanged) | unchanged | 2px |
| `header[data-topic-banner]` | unchanged (no border) | unchanged (no border) | unchanged |

`{colour}` is the series' `colour` from `topics.ts` (Drift `lavender`, Convergence `sage`).
Each dark border colour is at least 3:1 against `dusk-BASE`.

## 4. Delivered files

- Every built `_astro/*.webp` derived from `src/assets/series/*.png` is ≤ 25,600 bytes.
- No page references a PNG derived from `src/assets/series/` (the originals are never sent to
  readers; the production build's existing unreferenced-asset prune removes any emitted copy).
