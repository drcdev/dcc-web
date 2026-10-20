# Data model: page container harmony (050)

This feature stores no data. Its one "entity" is the visual content card, described here by its
properties per theme so tests and review have a single reference.

## ContentCard

Rendered by `src/components/page/ContentCard.astro` as `<section id="content-section">`, one per
page, holding the page body (default slot). Used by `PageLayout.astro` and `404.astro`.

| Property | Light | Dark | Varies by theme? |
|---|---|---|---|
| Max width | 64rem (`max-w-screen-lg`), centred (`mx-auto`) | same | No |
| Bottom margin | 2rem (`mb-8`) | same | No |
| Corner radius | 1rem (`rounded-2xl`) | same | No |
| Border width | 1 px, solid | same | No |
| Border colour | `dusk-200` at 80% | `dusk-700` at 80% | Yes (colour only) |
| Background | `white` | `dusk-800` | Yes (colour only) |
| Shadow | `shadow-xs` | `shadow-xs` (near invisible on dusk) | No |
| Padding < 640 px | 1rem all sides | same | No |
| Padding 640–767 px | 1.5rem | same | No |
| Padding ≥ 768 px | 2rem | same | No |
| Prose | `prose lg:prose-lg prose-accent` | + `prose-invert` | Yes (colour only) |

### Rules (from the spec)

- Every box-affecting property is theme-independent (FR-003, FR-004, FR-005).
- The draft notice, when present, is the first child (edge case "Draft notice"; `PageLayout`
  passes it into the slot first, as today).
- Wide/full images inside break out past the padding as today (FR-009).

### State

Theme is the only state: the `dark` class on `<html>` (set before paint by the existing theme
script). The card has no state or behaviour of its own.
