# Contract: `<ArchitectureDiagram />` markup, behaviour and layout

The section component `src/components/sections/ArchitectureDiagram.astro`, registered in
`src/components/sections/index.ts` (`sectionNames`, `sectionComponents`) with schema
`section({})` in `schemas.ts`. Used once, first in the body of `src/content/pages/technology.mdx`.
It takes an optional `parts` prop (pre-rendered parts) so component tests can feed neutral data,
like `RecentWriting`'s `posts` prop; without it, it reads the `architecture` collection.

## Static markup (no JavaScript needed)

| Row | Rule |
|---|---|
| M01 | `<figure id="architecture-diagram" class="not-prose …">` comes before every other body section of the page (FR-001). |
| M02 | The figure holds a `<figcaption>` (what the diagram shows) and one inline `<svg viewBox="0 0 240 H" role="group" aria-labelledby="<figcaption id>">`. |
| M03 | Each part is one `<a href="#<id>" data-part="<id>">` inside the SVG, with its label as `<text>` children (one `<tspan>` per line). No `aria-label`: the accessible name is the visible label (WCAG 2.5.3). Exactly 12 part links. |
| M04 | Boxes, frames, lines, arrowheads, glyphs and connection labels are `aria-hidden="true"`. A group's link covers only its tab, never the frame, so no link contains another. |
| M05 | Part-label `<text>` uses the part-label class (15 units); connection-label `<text>` the connection-label class (12.5 units). Text font is the page's Inter via CSS. |
| M06 | After the figure: `<h2 id="how-each-part-works">How each part works</h2>` and one `<article id="<id>" tabindex="-1" data-entry="<id>">` per part in layout order, each with `<h3>` = `name`, the explanation, a "Connects to" line built from the layout's outgoing connections (omitted when there are none), the source link (M07, omitted for a part with no `source`) and the back link (M08). |
| M07 | Source link: `<a href="<sourceUrl>" target="_blank" rel="noopener">`, visible text `Source: <path>` followed by `(opens in a new tab)` (visible or visually hidden text inside the link, so it is in the accessible name). |
| M08 | Back link: `<a href="#architecture-diagram" data-back="<id>">Back to diagram</a>`. |
| M09 | No element has a `style` attribute; colours come from CSS classes using theme tokens, with a `forced-colors: active` block. |
| M10 | Every `id` on the built page is unique (part ids must not collide with Markdown heading ids). |
| M11 | The page loads no third-party resource for the diagram; the only added script is the component's processed module from `/_astro/` (FR-011). |

## Behaviour with JavaScript

| Row | Given / when | Then |
|---|---|---|
| J01 | a part link is activated (click, tap, Enter) | the URL fragment becomes `#<id>`, the browser scrolls to the entry, the part link gets `aria-current="true"`, the entry gets `data-selected`, focus moves to the entry |
| J02 | another part is activated | only the new part and entry carry `aria-current` / `data-selected` |
| J03 | the page loads with `#<id>` naming a part | that part and entry are selected; focus is not moved |
| J04 | an entry's back link is activated | default jump prevented; the entry's part link scrolls into view and receives focus; selection kept |
| J05 | a fragment that is not a part (for example `#design`) | selection cleared, nothing else changes |
| J06 | selected and focus states | visible in both themes and forced colours; selection also shown by a non-colour cue |
| J07 | no animation | no smooth scrolling or transitions on selection |

## Behaviour without JavaScript

| Row | Rule |
|---|---|
| N01 | The diagram renders; every part link goes to its entry's fragment; every entry's name, explanation, "Connects to" line and source link is present (FR-008, SC-004). |
| N02 | Back links go to `#architecture-diagram`. |

## Layout (unit, `src/lib/architecture/layout.ts`)

| Row | Invariant |
|---|---|
| L01 | 12 parts, unique ids |
| L02 | all shapes and label boxes inside the viewBox |
| L03 | no overlapping boxes except a group frame around exactly its `contains` |
| L04 | connection endpoints on the edges of their `from` and `to` parts |
| L05 | connections reference existing parts |
| L06 | flow rules of data-model.md §2 item 6 (FR-003) |
| L07 | label sizes: part 15, connection 12.5 units; viewBox width 240 (so ≥ 14 / ≥ 12 CSS px at a 240 px container) |
| L08 | parts ordered top to bottom, then left to right |
| L09 | estimated label width (characters × 0.6 × size) fits inside each part's box with padding (coarse guard; the E2E row R03 is the real check) |

## Rendered checks (E2E, real site)

| Row | Check |
|---|---|
| R01 | At 320 px in light and dark themes, each part label's rendered font size ≥ 14 CSS px and each connection label's ≥ 12 CSS px (SC-006). |
| R02 | Diagram text resolves to Inter. |
| R03 | Every part label lies inside its box (bounding boxes) at 320 and 1280 px. |
| R04 | No horizontal scroll at 320 px is already owned by `tests/e2e/geometry.spec.ts` (technology is a template); not repeated. |
