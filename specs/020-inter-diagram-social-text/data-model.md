# Data model: Inter text in diagrams and the sharing image

**Feature**: `020-inter-diagram-social-text` | **Date**: 2026-10-04

No content collection schema changes. The entities below are files and the rules the gate holds
them to. The file format is in [contracts/diagram-svg.md](./contracts/diagram-svg.md); the
script interfaces are in [contracts/scripts.md](./contracts/scripts.md).

## Diagram file

A committed SVG under `src/content/` that contains at least one `<text>` element. Today: the five
`src/content/projects/images/<project>/architecture.svg` files named by a project's
`visuals.<name>` with `kind: diagram`, and the template starter
`src/content/projects/images/template/diagram.svg`.

| Field | Source | Rule |
|---|---|---|
| Root `font-family` | `<svg font-family="…">` | exactly `Inter, sans-serif` (FR-001, FR-008) |
| Other `font-family` | any other element | none allowed (FR-008) |
| `style` attributes | any element | none allowed (FR-008) |
| `font-weight` values | `<g>`, `<text>`, `<tspan>` | `400` or `700` only; no `font-style` (FR-001) |
| Font block | generated `<style data-inter-subset="">` | exactly two `@font-face` rules, family `Inter`, weights 400 and 700, style normal, `src: url(data:font/woff2;base64,…) format("woff2")` (FR-003a, FR-012) |
| Licence comment | XML comment directly before the `<style data-inter-subset="">` | names Inter 4.1, the copyright holder ("The Inter Project Authors"), the SIL Open Font License 1.1 with its address (`https://openfontlicense.org`) and `src/assets/fonts/LICENSE.txt` (FR-013, D07) |
| Labels | character data of `<text>`/`<tspan>` | real text, never paths; every character is in both embedded faces' cmaps (FR-003a, FR-009) |
| External references | `href`, `url(…)` | only `url(#id)` and `url(data:…)`; no `http`, no relative file (FR-012) |
| Size | file bytes | ≤ 16,384 (FR-009a) |
| Dimensions, `viewBox`, `role`, `aria-label`, colours | root and shapes | unchanged by this feature, except the box geometry listed below (FR-003) |

Relationships: a project's `visuals.<name>.src` points at the file; `alt` and `description` stay
in the MDX frontmatter and do not change.

### State transitions (a label edit)

1. **Consistent**: labels and font block agree; the gate passes.
2. **Edited**: a label changed by hand. If it uses a character not in the block, the gate fails
   naming the file and the character (FR-009); if not, it still passes, and the block may carry
   unused glyphs.
3. **Re-embedded**: `pnpm run fonts:diagrams -- <file>` rewrites the comment and block only;
   back to Consistent, with no unused glyphs.

## Embedded face

One `@font-face` rule inside a diagram's font block.

| Field | Rule |
|---|---|
| `font-family` | `Inter` |
| `font-weight` | `400` (from `src/assets/fonts/Inter-Regular.woff2`) or `700` (from `Inter-Bold.woff2`); fontace's reported weight matches |
| Glyphs | the union of the diagram's label characters plus U+0020, nothing else beyond `.notdef` |
| Layout features | `kern` only, no hinting, WOFF2, name IDs 0 to 6 kept (copyright) |

## Wrapped labels and box changes

Applied by hand once in this feature (FR-003; widths and rule in research R8). Detail lines keep
size 24 and weight 400; titles are unchanged. Line spacing 34 units, as today. Coordinates are in
each diagram's own 1200×480 `viewBox`.

| Diagram | Box (title) | Before: rect `y`, `height`; baselines | After: rect `y`, `height`; baselines | Label lines after | Arrows |
|---|---|---|---|---|---|
| Cadence | On-device data | 150, 180; 222 / 262 / 296 | 150, **214**; 222 / 262 / 296 / 330 | "local store and" / "write queue" / "works offline" | unchanged: `M344 240 H442` and `M754 220 L852 130` still meet the box sides; the `H852` run of `M190 334 V400 H852 V360` stays 36 units below the new bottom (364) |
| Cadence | Supabase | 40, 160; 108 / 148 | 40, **194**; 108 / 148 / 182 | "sync and AI routines," / "when online" | unchanged: `M754 220 L852 130` ends on the box side (40 to 234) |
| Cadence | Apple Watch | 280, 160; 348 / 388 | **256**, **194**; 324 / 364 / 398 | "via a Shortcuts" / "handoff, optional" | unchanged: `… V360` ends on the box side (256 to 450). Moved up 24 to keep a 30-unit bottom margin; 22 units clear below Supabase |
| Tempo | Apple Health | 280, 160; 348 / 388 | **256**, **194**; 324 / 364 / 398 | "or Health Connect," / "optional" | unchanged: `M754 260 L852 350` ends on the box side (256 to 450). Moved up 24 for the 30-unit bottom margin; 56 units clear below Supabase |
| Flux | Ghost | 150, 180; 222 / 262 / 296 | 150, **248**; 222 / 262 / 296 / 330 / 364 | "hosted on" / "Magic Pages" / "posts, members," / "routes" | unchanged (`M344 240 H442` at y 240) |
| Flux | Flux theme | 150, 180; 222 / 262 / 296 | 150, **248**; 222 / 262 / 296 / 330 / 364 | "Handlebars," / "Tailwind v4" / "two newsletter" / "streams" | unchanged (`M344 240 H442`, `M754 240 H852` at y 240) |
| Flux | AI analysis | 150, 180; 222 / 262 / 296 | 150, **248**; 222 / 262 / 296 / 330 / 364 | "Supabase Edge" / "Functions" / "optional," / "member tiers" | unchanged |
| drcdev.github.io | Project entries | 150, 180; 222 / 262 / 296 | 150, **214**; 222 / 262 / 296 / 330 | "one TypeScript file" / "Markdown" / "descriptions" | unchanged (`M344 240 H442` at y 240) |
| drcdev.github.io | Next.js | 150, 180; 222 / 262 / 296 | 150, **214**; 222 / 262 / 296 / 330 | "static export" / "Tailwind v4," / "ASCII look" | unchanged |
| Focus Pocus | Focus Pocus | 150, 180; 230 / 272 | 150, **214**; 230 / 272 / 306 | "MCP server," / "35+ tools" | unchanged |

The last three rows and the Flux Ghost row were added after CI (PR #80) showed Linux Chromium
renders Inter about 3.4 units wider than macOS Chromium at 24 px: Flux "posts, members, routes"
measured 16.35 units each side on macOS and 13.00 on Linux. Every label with under 8 units of
slack beyond the 16-unit rule on macOS was wrapped, so there are now 13 wrapped labels (the
extra ones: Flux "posts, members, routes", "hosted on Magic Pages" and, re-split, "two newsletter
streams" and "optional, member tiers"; drcdev.github.io "Markdown descriptions" and "Tailwind v4,
ASCII look"; Focus Pocus "MCP server, 35+ tools"). The three Flux boxes stay equal in height.

Every other box, label, colour, arrow and the drcdev.github.io GitHub Pages box, Claude Desktop,
OmniFocus and template diagram boxes keep their geometry. Each wrapped line is its own `<text>`
element at the box's centre `x`, as the existing lines are.

## Sharing image source

`scripts/og-image/render.ts` and its output `public/og-default.png`.

| Field | Rule |
|---|---|
| `OG_FONT_FILE` | `src/assets/fonts/Inter-Bold.woff2` (FR-006) |
| `ogHtml(fontBase64)` | one inline `@font-face` (family `Inter`, weight 700, normal, WOFF2 data URI of that file); `font-family: Inter` on `body`; no family from `SYSTEM_FONT_STACK` and no generic family anywhere |
| Output | 1200×630 PNG at `public/og-default.png`, dusk `#1c1a29` background, "Don Coleman" in rust `#d68844`, 112 px, 700, letter-spacing -0.02em, 160×8 rule (FR-005) |
| Site metadata | `/og-default.png` and its alt text unchanged (existing `Seo.test.ts`, `seo.spec.ts`) |
