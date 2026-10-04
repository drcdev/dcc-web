# Contract: diagram SVG with embedded Inter

Applies to every `.svg` under `src/content/` that contains a `<text` element (research R7). Test
titles cite the row id (`D01` …). Messages always start with the repository-relative file path.

## Shape

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480"
     role="img" aria-label="…" font-family="Inter, sans-serif">
  <!-- Inter 4.1, Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter). Glyph subset licensed under the SIL Open Font License 1.1: https://openfontlicense.org (full text in src/assets/fonts/LICENSE.txt). Written by scripts/fonts/embed-diagram-fonts.ts: edit a label, then re-run it. -->
  <style data-inter-subset="">@font-face{font-family:Inter;font-style:normal;font-weight:400;src:url(data:font/woff2;base64,…) format("woff2")}@font-face{font-family:Inter;font-style:normal;font-weight:700;src:url(data:font/woff2;base64,…) format("woff2")}</style>
  <defs>…</defs>
  …
  <g font-size="30" font-weight="700" fill="#2a2540" text-anchor="middle">
    <rect …/>
    <text x="190" y="222">Box title</text>
    <text x="190" y="262" font-size="24" font-weight="400">detail line</text>
  </g>
</svg>
```

The comment and `<style data-inter-subset="">` are the **font block**: the script owns them and
rewrites them as a unit, directly after the root start tag. Everything else is hand-edited.

## Rules (unit layer unless marked)

| Row | Rule | Failure message (shape) |
|---|---|---|
| D01 | Root `<svg>` has `font-family="Inter, sans-serif"` exactly | `<file>: the root <svg> must set font-family="Inter, sans-serif" (found …)` |
| D02 | No other element has a `font-family` attribute; no element has a `style` attribute; no `font-family` in CSS other than the two `@font-face` rules | `<file>: text asks for a font other than Inter (<element> font-family="…")` |
| D03 | `font-weight` values are `400` or `700`; no `font-style` | `<file>: font-weight … has no embedded Inter face` |
| D04 | Exactly one `<style data-inter-subset="">` with exactly two `@font-face` rules: family `Inter`, normal style, weights 400 and 700, WOFF2 data URIs; fontace reports weight 400 and 700 respectively | `<file>: the embedded Inter block is missing or malformed; run pnpm run fonts:diagrams -- <file>` |
| D05 | Every label character (decoded entities; U+0020 and line breaks excepted) is in the cmap of both embedded faces | `<file>: U+XXXX <char> is not in the embedded Inter <Regular\|Bold> glyphs; run pnpm run fonts:diagrams -- <file>` |
| D06 | File size ≤ 16,384 bytes | `<file>: <n> bytes is over the 16 KB diagram limit` |
| D07 | The licence comment directly precedes the `<style data-inter-subset="">` and names "Inter 4.1", "The Inter Project Authors", "SIL Open Font License 1.1", the licence address `https://openfontlicense.org` and `src/assets/fonts/LICENSE.txt` (FR-013) | `<file>: the Inter licence notice is missing` |
| D08 | No external reference: every `url(` is `url(#…)` or `url(data:…)`; no `href`/`xlink:href` other than `#…` | `<file>: references another file (…); diagrams must be self-contained` |
| D09 | Labels are text: at least one `<text>` with non-empty content; no `<path>` inside a `<text>` | covered by the glob (only files with `<text` are checked) and D05 |
| D10 | Guard self-checks: an inline SVG string with a system font, a missing glyph, a missing block and an over-size body each produce the matching message (the gate can fail) | test assertion |
| D11 (E2E) | Opened directly in Chromium on a machine without Inter, each diagram's `document.fonts` has an `Inter` face loaded for every weight its labels use, and `document.fonts.check()` is true for each label at its size and weight | Playwright assertion naming the file |
| D12 (E2E) | Each label's rendered bounding box lies inside the `<rect>` that contains its anchor point, with at least 16 units between the box and each side of the rect, and no label overlaps another | Playwright assertion naming the file and the label |

D11 and D12 are browser behaviours (whether the data-URI face actually loads and how wide the
shaped text really is), so they sit at the E2E layer; D01 to D10 are static file rules and sit at
the unit layer. They test different behaviours, so there is no second layer.
