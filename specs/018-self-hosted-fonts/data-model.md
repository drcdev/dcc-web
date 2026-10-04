# Data model: Self-hosted Inter web fonts

**Feature**: `018-self-hosted-fonts` | **Date**: 2026-10-03

This feature has no stored data. The "entities" are committed files and constants whose shape
the tests pin. Paths are repository-relative.

## Shipped character set

`src/lib/fonts/charset.ts` (new, no imports, so `astro.config.mjs`, the subset script and the
tests can all load it):

| Export | Type | Value / rule |
|---|---|---|
| `INTER_UNICODE_RANGE` | `readonly string[]` (CSS `unicode-range` tokens) | `U+0020-007E`, `U+00A0-00FF`, `U+2013`, `U+2014`, `U+2018`, `U+2019`, `U+201C`, `U+201D`, `U+2022`, `U+2026`, `U+2192`, `U+2713`, `U+2717` (FR-002) |
| `codePointsOf(range)` | `(tokens: readonly string[]) => Set<number>` | Expands the tokens to code points (202 code points; 201 once U+00AD is set aside, matching the 201 cmap entries measured in each face). |
| `NOT_IN_INTER` | `readonly number[]` | `[0x00AD]`: inside the range, absent from Inter's cmap, never drawn as a glyph (research R3). |
| `SYSTEM_FONT_STACK` | `readonly string[]` | `ui-sans-serif`, `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica`, `Arial`, `Apple Color Emoji`, `Segoe UI Emoji`, `sans-serif`: today's families, none added or removed, with the generic `sans-serif` moved from before the emoji families to the end so Astro's optimized fallbacks apply (FR-005, research R6; see "Fallback stack" below). |

Rules: the covered set of every face equals `codePointsOf(INTER_UNICODE_RANGE)` minus
`NOT_IN_INTER`, exactly (no more, no less).

## Font face (four instances)

| Field | Regular | Italic | Bold | Bold Italic |
|---|---|---|---|---|
| Committed file | `src/assets/fonts/Inter-Regular.woff2` | `src/assets/fonts/Inter-Italic.woff2` | `src/assets/fonts/Inter-Bold.woff2` | `src/assets/fonts/Inter-BoldItalic.woff2` |
| CSS `font-weight` / `font-style` | 400 / normal | 400 / italic | 700 / normal | 700 / italic |
| Family in the file (fontace) | Inter | Inter | Inter | Inter |
| PostScript name (what CDP reports, R8) | `Inter-Regular` | `Inter-Italic` | `Inter-Bold` | `Inter-BoldItalic` |
| Bytes (measured) | 11,364 | 12,308 | 11,516 | 12,560 |
| Preloaded | yes | no | yes | no |
| Built URL | `/_astro/fonts/<content hash>.woff2` | same pattern | same pattern | same pattern |

Validation rules:

- Exactly these four `.woff2` files under `src/assets/fonts/`, plus `LICENSE.txt` (SIL Open
  Font License 1.1 text from the Inter 4.1 release, FR-013). Nothing under `public/` holds a
  font.
- Total committed WOFF2 bytes ≤ **50,000** (47,748 measured). The ceiling catches a re-subset
  that keeps extra layout features (59,252 bytes with `liga,calt`) or more characters, either of
  which breaks the budget arithmetic in research R4.
- Each built file is byte-identical to its committed source (Astro copies, it does not
  re-encode), and `dist/_astro/fonts/` holds exactly four files.

## Subset recipe (one-off, reproducible)

`scripts/fonts/subset-inter.ts` (new). Exports, for the unit test:

| Export | Value |
|---|---|
| `INTER_VERSION` | `"4.1"` |
| `INTER_ZIP_URL` | `https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip` |
| `INTER_ZIP_SHA256` | `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e` |
| `FONTTOOLS_SPEC` | `"fonttools[woff]==4.60.2"` |
| `FACES` | `Regular`, `Italic`, `Bold`, `BoldItalic` (source `extras/ttf/Inter-<face>.ttf`) |
| `pyftsubsetArgs(face, input, output)` | `[input, "--unicodes=" + INTER_UNICODE_RANGE.join(","), "--layout-features=kern", "--no-hinting", "--flavor=woff2", "--output-file=" + output]` |

Running it is not part of any gate: it runs when Inter is upgraded, and its outputs are
committed.

## Fallback stack

`SYSTEM_FONT_STACK` is today's families with the generic `sans-serif` moved last, so Astro's
optimized fallbacks apply (research R6): `ui-sans-serif, system-ui, -apple-system, "Segoe UI",
Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`.

The value of `--font-inter` that `<Font />` writes on `:root`:
`Inter-<hash>, "Inter-<hash> fallback: Arial", "Inter-<hash> fallback: Arial Bold"`, then
`SYSTEM_FONT_STACK`. `--font-body` and `--font-heading` in `src/styles/global.css` are
`var(--font-inter)`. The two fallback families hold four metric-adjusted `@font-face` rules
(`local("Arial")` for 400, `local("Arial Bold")` for 700, each with `size-adjust` and metric
overrides and the same weight, style and `unicode-range` as its Inter face).

## Guard exclusions

In `tests/unit/site/font-coverage.test.ts`, each with its reason:

| Exclusion | Rule | Reason |
|---|---|---|
| Emoji | `\p{Extended_Pictographic}`, U+FE0F, U+200D | Drawn by the system emoji fonts by design. |
| Box drawing | U+2500–U+257F | Outside the shipped set; system fonts draw them. |
| Soft hyphen | U+00AD | Never drawn as a glyph. |
| Whitespace controls | U+0009, U+000A, U+000D | Not drawn. |

State: a character found in a visual-subject source that is neither covered nor excluded fails
the test, naming the character, its code point and the file.

## Visual baseline

`tests/e2e/visual.spec.ts-snapshots/<subject>-<width>-<theme>-visual-<platform>.png`: 66 per
platform, 132 in total, all regenerated by this feature (none added, none removed).
