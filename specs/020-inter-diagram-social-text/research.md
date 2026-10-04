# Research: Inter text in diagrams and the sharing image

**Feature**: `020-inter-diagram-social-text` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

The spec's Clarifications fix the approach (per-diagram inline glyph subset, edit in place plus
one script, wrapped labels, a 16 KB cap, a unit-tested sharing-image script). This file resolves
the points the spec left to the plan and records the measurements behind them. Measurements
were taken on 2026-10-04 in this worktree.

## R1. First-party options (Principle IV)

The Astro Docs MCP server was consulted (search results cited by page).

| Capability | First-party option considered | Used? | Why |
|---|---|---|---|
| Inter in the page | Astro Fonts API, local provider ([Using custom fonts](https://docs.astro.build/en/guides/fonts/), [Font Provider API, Local](https://docs.astro.build/en/reference/font-provider-reference/#local)) | Kept as feature 018 shipped it | It styles the page. A diagram is shown through `<Image />` as an `<img>`, and an SVG loaded as an image is an isolated document that cannot see the page's `@font-face` rules or fetch any other file, so the Fonts API cannot reach diagram text. |
| Diagram as an image | `<Image />` from `astro:assets` ([Images, Astro components for images](https://docs.astro.build/en/guides/images/#astro-components-for-images)) | Kept, unchanged | With `image.dangerouslyProcessSVG` at its default `false` ([Configuration reference, image.dangerouslyProcessSVG](https://docs.astro.build/en/reference/configuration-reference/#imagedangerouslyprocesssvg)) Astro does not process SVG sources. Confirmed on today's build: every `dist/_astro/architecture.*.svg` is byte-identical in size to its source (for example the Cadence diagram is 2,170 bytes in both). So whatever the committed SVG holds is what ships, with no build step. |
| Inline the SVG so page fonts apply | SVG components (`import Diagram from "./x.svg"`, [Images, SVG components](https://docs.astro.build/en/guides/images/#svg-components)) | Not used | It would make page Inter apply, but it fails FR-002 (the diagram opened on its own would still use the system font), contradicts the spec assumption that diagrams stay images, puts every diagram's bytes into the HTML (not lazy-loaded), and content collection `image()` fields give `ImageMetadata`, not components, so the content model would change. |
| Shrink diagrams at build time | Experimental SVG optimization (`experimental.svgOptimizer`, [Experimental SVG optimization](https://docs.astro.build/en/reference/experimental-flags/svg-optimization/)) | Not used | It applies only to SVG components, not to `<Image />` sources, and it is experimental. SVGO also cannot shrink a base64 font. |
| Font data for an OG image | `fontData` and `experimental_getFontFileURL()` with Satori ([Using custom fonts, Accessing font data programmatically](https://docs.astro.build/en/guides/fonts/#accessing-font-data-programmatically)) | Not used | The recipe needs `satori`, `satori-html` and `sharp` as new dependencies (a Principle III trigger and a new tool) and an endpoint that renders at build time. The spec keeps the sharing image a committed file rendered once by hand. The existing script already drives Playwright's Chromium (a dev dependency), so it only needs the committed Inter Bold file inlined. |
| Cloudflare | Cloudflare Fonts (rewrites Google Fonts links in HTML), Images, Browser Rendering | Not used | Nothing runs at request time: the diagrams and the PNG are static assets served by Workers static assets as today. Cloudflare Fonts only acts on Google Fonts `<link>` tags in HTML, not inside images; Images and Browser Rendering would add a service and a cost for a file that changes once. |
| Subsetting | None (Astro has no subsetting for local files or images) | Custom by necessity | The same pinned `uvx --from "fonttools[woff]==4.60.2" pyftsubset` that feature 018 uses (`scripts/fonts/subset-inter.ts`). |

**Why nothing runs at build time.** The spec (FR-007, Clarifications) puts the font step in a
hand-run script. A build step would need `uv`/Python in Workers Builds and CI, or a JavaScript
subsetter added as an npm dependency; both are new tools and a major-change trigger for no gain,
since a diagram's labels change rarely. The gate (unit tests on the committed files) catches a
label edited without re-running the script.

**Why no new npm dependency.** The script shells out to `uvx` (already the pinned recipe from
018, not in `package.json`). The tests read the embedded fonts with `fontace`, which is already
installed as Astro's own dependency and already used by `tests/unit/site/font-coverage.test.ts`
through `createRequire` on `astro/package.json`. The E2E check uses Playwright, already present.
Base64 and Brotli are not needed in Node (fontace parses WOFF2 itself).

## R2. Source of the per-diagram subsets

**Decision**: subset from the committed `src/assets/fonts/Inter-Regular.woff2` and
`src/assets/fonts/Inter-Bold.woff2`, not from the Inter 4.1 release archive.

**Rationale**:
- Same release by construction (FR-013): those files are feature 018's Inter 4.1 subsets, checked
  by `font-files.test.ts` against recorded SHA-256 values.
- The glyphs and kerning in a diagram are exactly the ones the page draws, so diagram text and
  page text cannot drift apart.
- No download, no checksum step, no `unzip`, works offline; `pyftsubset` reads WOFF2 input with
  the `woff` extra already pinned.
- Coverage follows: a character outside the site's shipped set cannot be put in a diagram. The
  gate then reports it as missing (FR-009) instead of the script silently pulling it from the
  full font.

**Alternatives considered**: the release TTFs from `extras/ttf/` (what 018 subset). Rejected:
needs the 64 MB archive per run, and the extra coverage is not wanted (see above).

**Measured** (Cadence labels, the largest set, 2026-10-04): Regular subset 2,824 bytes (3,769 as
base64), Bold subset of the bold labels only 1,996 bytes (2,665 as base64).

## R3. What each face carries

**Decision**: both faces are subset to the union of every character in the diagram's labels
(plus U+0020), whatever weight each label uses.

**Rationale**: the gate's coverage check (R6) then needs no weight resolution through SVG
inheritance: every label character must be in every embedded face. A label switched from regular
to bold in an edit never needs a second run. Cost: the Bold face grows by the few letters only
regular labels use, well under 1 KB per diagram (estimated from R2: Regular, which carries
nearly all characters, is 2,824 bytes). Every diagram embeds both faces, including the template
starter (whose two labels are regular today), so a new diagram can use bold titles straight
away and the contract has no special case (FR-003a, FR-004).

**Alternatives considered**: per-weight sets (smaller Bold); rejected for the inheritance logic
it pushes into both the script and the gate.

## R4. Family name, fallback stack and where they are declared

**Decision**:
- `@font-face { font-family: Inter; font-style: normal; font-weight: 400 | 700; src: url(data:font/woff2;base64,…) format("woff2") }`, two rules.
- The root `<svg>` element carries `font-family="Inter, sans-serif"`. No other element sets
  `font-family`, and no element has a `style` attribute. Weights stay as today: box titles 700,
  details 400 (`font-weight` attributes on the `<g>` and `<text>` elements, values `400` or
  `700` only; no `font-style`).
- The gate accepts exactly the stack `Inter, sans-serif`.

**Rationale**:
- `Inter` is the name the page uses. The image is an isolated document, so the name cannot clash
  with the page's own faces, and an author `@font-face` takes precedence over any locally
  installed font of the same name, so a visitor's installed Inter (of another version) is never
  used.
- The generic `sans-serif` is kept last so that, where a browser refuses downloadable fonts
  (iOS Lockdown Mode, a Firefox profile with downloadable fonts off), labels still draw in a sans
  face rather than the default serif. It never applies to a covered character in a normal browser
  because the gate (R6) proves every label character is in both embedded faces. No named system
  family (`system-ui`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`, `ui-sans-serif`,
  `-apple-system`) is allowed, which is what FR-008 checks.
- One declaration on the root makes the rule checkable without an XML parser.

**Alternatives considered**: a private family name such as `Inter Diagram` (no benefit inside an
isolated document, and it reads as a different font in review); no fallback at all (serif text in
Lockdown Mode).

## R5. OFL attribution inside the SVG

Inter's licence is the SIL Open Font License 1.1 with no Reserved Font Name
(`src/assets/fonts/LICENSE.txt`), so a subset may keep the name Inter. OFL condition 2 lets the
font be bundled with other software as long as each copy carries the copyright notice and the
licence, which "can be included either as stand-alone text files, human-readable headers or in
the appropriate machine-readable metadata fields within text or binary files".

**Decision**: both, in each diagram:
1. **Machine-readable**: the subset keeps name IDs 0 to 6 (`--name-IDs=0,1,2,3,4,5,6`, which is
   also `pyftsubset`'s default and what 018's files hold). Name ID 0 is
   "Copyright 2016 The Inter Project Authors". (The committed source files do not hold name IDs
   13/14, the licence text and URL, so they cannot be carried from them.)
2. **Human-readable header**: an XML comment written by the script directly before the font
   block:
   `<!-- Inter 4.1, Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter). Glyph subset licensed under the SIL Open Font License 1.1: https://openfontlicense.org (full text in src/assets/fonts/LICENSE.txt). Written by scripts/fonts/embed-diagram-fonts.ts: edit a label, then re-run it. -->`

The repository already ships the full licence in `src/assets/fonts/LICENSE.txt` (FR-013), and
the comment points to it. Astro does not process SVG sources (R1), so the comment reaches the
served file. A unit test checks the comment is present (contract row D07).

## R6. How the gate finds a missing glyph (FR-009)

**Decision**: a unit test, no browser. For each diagram it:
1. extracts every label: the character data of each `<text>` (and any `<tspan>`), with the five
   XML entities and numeric references decoded;
2. extracts the two `@font-face` rules from the generated `<style>` block, base64-decodes each
   `src`, and reads the face with `fontace` (through Astro's dependency, as
   `font-coverage.test.ts` does): its `unicodeRangeArray` is the face's cmap, expanded with
   `codePointsOf` from `src/lib/fonts/charset.ts`; fontace's `weight` also confirms the 400 rule
   holds Regular and the 700 rule holds Bold;
3. reports every label character (except U+0020 space, which is always added, and line breaks)
   missing from either face as `<file>: U+XXXX <char> is not in the embedded Inter <Regular|Bold> glyphs; run pnpm run fonts:diagrams -- <file>`.

A self-check on an inline SVG string with a character outside its embedded subset proves the
guard can fail (pattern from `font-coverage.test.ts`).

The pure functions (label extraction, block parsing, checks) live in
`scripts/fonts/diagram-fonts.ts`, shared by the script and the tests, so the script refuses to
write a file that would fail the gate.

**Alternatives considered**: checking in a browser with `document.fonts.check()` (E2E, slower,
and the cmap answer is exact without one); parsing the WOFF2 by hand (fontace already does it).

## R7. Which files the gate covers

**Decision**: every `.svg` under `src/content/` that contains a `<text` element. Today that is the
five published project diagrams and the template starter (`images/template/diagram.svg`); the
glob also covers draft stories and any future SVG with text in posts or pages, so no list needs
upkeep and the tests name no real project (docs/testing.md "Real content in tests"). A sanity
assertion requires at least one file and the template starter to be among them, so an empty glob
cannot pass silently. SVGs with no text are out of scope (they need no font).

The unit tests run on content-only pull requests too: `changed-paths.ts` treats content as not
skip-safe, so the `static` job's `test:unit` step runs (`full != 'false'`), and a label edited
without re-running the script fails CI.

## R8. Labels that need wrapping (FR-003)

**Measurement**: HarfBuzz shaping with kerning (Chromium shapes with HarfBuzz) on the committed
WOFF2 files, at each label's size and weight. **Clear space rule**: at least 16 units between the
label's advance box and each side of its `<rect>` (`x` and `x + width`), so a label fits a
300-unit box when its width is at most 268.

| Diagram | Label | Inter width | Fits 268? |
|---|---|---|---|
| Cadence | local store and write queue | 307.5 | no |
| Cadence | sync and AI routines, when online | 382.2 | no |
| Cadence | via a Shortcuts handoff, optional | 366.4 | no |
| Tempo | or Health Connect, optional | 310.8 | no |
| Flux | Supabase Edge Functions | 294.7 | no |
| **Flux** | **Handlebars, Tailwind v4** | **272.7** | **no (13.6 units each side)** |
| Flux | posts, members, routes | 267.3 | yes (16.35 each side; closest fit) |
| drcdev | Markdown descriptions | 266.2 | yes |
| Flux | hosted on Magic Pages | 266.0 | yes |
| (all other labels) | | ≤ 264.2 | yes |
| Template | Input / Result (14 units, 110-unit boxes) | 33.5 / 40.8 | yes |

The spec names five labels; the same 16-unit rule also catches a sixth, Flux "Handlebars,
Tailwind v4". FR-003 makes the rule binding ("except where a label no longer fits its box with
16 units of clear space on each side … the plan lists every such adjustment"), so it wraps too.
Bold titles all fit (widest 232.0).

Wrapped lines (widths): "local store and" 166.6 / "write queue" 134.1; "sync and AI routines,"
238.3 / "when online" 137.1; "via a Shortcuts" 168.9 / "handoff, optional" 190.7 ("via a
Shortcuts handoff," alone is 269.0, one unit over, so the break moves left); "or Health Connect,"
213.4 / "optional" 90.6; "Supabase Edge" 177.6 / "Functions" 110.3; "Handlebars," 137.0 /
"Tailwind v4" 128.9.

**Geometry rule**: a wrapped label adds one line at the box's existing detail line spacing (34
units). The box grows by 34 units downward. Where growing would bring a box within 30 units of the
canvas bottom (the right-hand column of Cadence and Tempo), the box moves up just enough to keep a
30-unit margin; arrow endpoints are kept if they still land on the box edge. The full list of
adjustments is in [data-model.md](./data-model.md#wrapped-labels-and-box-changes).

## R9. Sharing image script

**Decision**: refactor `scripts/og-image/render.ts` so that:
- it exports `OG_FONT_FILE` (`src/assets/fonts/Inter-Bold.woff2`, resolved from the script's
  URL) and a pure `ogHtml(fontBase64: string): string` that returns today's template with an
  inline `@font-face { font-family: Inter; font-weight: 700; font-style: normal; src:
  url(data:font/woff2;base64,…) format("woff2") }` and `font-family: Inter` on `body`, with no
  other family named;
- the Chromium launch moves under `if (import.meta.main)` with a dynamic import of
  `@playwright/test`, so the unit test imports the module without launching a browser (the same
  guard `subset-inter.ts` uses);
- before the screenshot it awaits `document.fonts.ready` and throws unless an `Inter` 700
  `FontFace` has status `loaded` and `document.fonts.check("700 112px Inter", "Don Coleman")`
  is true (`check()` alone can pass when no face matches), so a run that would fall back
  fails instead of writing a wrong PNG.

Size (1200×630), colours, padding, letter spacing, rule and wording stay as they are (FR-005).
"Don Coleman" is inside the committed Bold face's character set, so no new glyph coverage is
needed. The PNG is re-rendered once by hand and confirmed on the preview (`[PREVIEW-CHECK]`).

**Alternatives considered**: grepping the script source in the test (weaker: it proves a string
is present, not that the HTML handed to Chromium has the font); a build-time generator (R1).

## R10. Measurement before the change (FR-011)

- Diagram files: `wc -c` raw and `gzip -9c | wc -c` (an estimate of compressed transfer;
  Cloudflare compresses `image/svg+xml`). Figures in the plan's FR-011 table.
- Project story page: the budget spec's own measurement (`pnpm run test:budget`, project-story
  template, which is the picked story from `tests/helpers/content.ts`, Cadence today) on a local
  build at commit `bb814bb`: **64,933 bytes total transfer**, LCP 732 ms, CLS 0, long tasks 0 ms,
  JavaScript 0 bytes, against the 153,600-byte (150 KB) limit. The architecture diagram sits in
  the Build part far below the fold at 390×844 and is `loading="lazy"`, so it is most likely not
  part of that figure; the after run records whether a diagram request appears. Even if it did,
  the 16 KB cap keeps the page at most about 81 KB, well inside 150 KB.
