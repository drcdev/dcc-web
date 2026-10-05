# Data Model: Series Images and Dark-Mode Card Outlines

**Feature**: `025-topic-images` | **Plan**: [plan.md](./plan.md)

No content schema, collection, database or API changes. The "data" is two image files, one
configuration map and new style entries.

## Series (existing, `src/config/topics.ts`) — unchanged

`Topic` with `series: true`: `drift` (lavender) and `convergence` (sage). `seriesIds` stays the
single source of which topics are series. No field is added to `Topic` (research R1).

## Series image (new)

| Field | Value | Rule |
|---|---|---|
| Source file | `src/assets/series/<series-id>.png` | One per series id; PNG, 1536 × 768 (2:1); no metadata chunks beyond what sharp writes. |
| Map | `src/config/series-images.ts` exports `seriesImages: Record<SeriesId, ImageMetadata>` and `seriesImage(id): ImageMetadata` | Keys are exactly `seriesIds`. `seriesImage` throws for a non-series id, so a template that asks for one fails the build. |
| Tile rendering | full 2:1, `widths` 400/640/1008 | No crop (FR-002, FR-005). |
| Strip rendering | 4:1 centred crop, 1536 × 384 and `widths` 400/640/1024/1536 | Series pages only (FR-003). |
| Text alternative | `alt=""` | Decorative (FR-006). |
| Marker attribute | `data-series-image="<series-id>"` on the `<img>` | Hook for tests; not styling. |

Validation: a unit test fails when a series id has no image, when the map has a key that is not
a series, or when an image is not 2:1. Adding a non-series topic needs no image (spec edge case),
because the map is keyed by `seriesIds` only.

## Topic style (existing, `src/components/post/topic-styles.ts`) — extended

| Field | Change |
|---|---|
| `outline` (new) | `dark:border dark:border-{colour}-300 forced-colors:border forced-colors:border-[CanvasText]` for each palette; used on series tiles and series banners only. `{colour}-300` is the token the marker's dark outline already uses. |
| `cardEdge` (new export) | `border border-dusk-200 dark:border-dusk-500`, replacing the inline `border border-dusk-200 dark:border-dusk-700` in `PostCard` and `LeadStory`. |
| `pill`, `border`, `banner`, `marker` | Unchanged. |

Validation: `tests/unit/content/topics.test.ts` computes each dark outline token (series
`outline`, `cardEdge` and the kept text-only topic borders) against `dusk-BASE` and requires at least 3:1 (FR-012), and checks that
every class is an existing palette token (FR-015).

## Card (component surfaces) — states

| Card | Light | Dark | Forced colours |
|---|---|---|---|
| Series tile (`[data-series-intro-item]`) | image + text, no border | + 1px `{colour}-300` border | 1px system-colour border |
| Series banner (`header[data-series-banner]`) | strip + text joined, no border | + 1px `{colour}-300` border round both | 1px system-colour border |
| Post card / lead story with image | 1px `dusk-200` | 1px `dusk-500` | 1px system colour |
| Text-only post card / lead story | 2px topic colour | 2px topic colour (unchanged) | 2px system colour |
| Topic banner | unchanged | unchanged | unchanged |
