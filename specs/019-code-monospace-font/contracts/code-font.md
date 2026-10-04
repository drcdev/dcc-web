# Contract: the code font in the built site and on the wire

**Feature**: `019-code-monospace-font`. Row ids (`M01` …) are cited in test titles; test files
must not contain `specs/...` path literals (the changed-paths drift guard rejects them). Feature
018's rows `F01`–`F21` still hold for Inter, except where a row below supersedes one.

## Page head (every page; BaseLayout)

| Row | Rule |
|---|---|
| M01 | The `<head>` holds two `<style>` elements with `@font-face` rules: feature 018's Inter style (F01–F03, unchanged) and one emitted by `<Font cssVariable="--font-jetbrains-mono">`. The second holds exactly four `@font-face` rules for one family `JetBrains Mono-<hash>`: (400, normal), (400, italic), (700, normal), (700, italic). |
| M02 | Each JetBrains Mono `@font-face` has `font-display: swap`, `unicode-range` equal to `INTER_UNICODE_RANGE`, and one `src` of the form `url("/_astro/fonts/<hash>.woff2") format("woff2")`, no `local()`. The same style holds exactly four metric-adjusted fallback faces in the family `JetBrains Mono-<hash> fallback: Courier New`, one per weight and style, each with only `src: local("Courier New")`, no `url()`, `font-display: swap`, a `size-adjust`, and whichever of `ascent-override`, `descent-override`, `line-gap-override` Astro computes (it emits no `line-gap-override` for Courier New). No other `@font-face` in that style. |
| M03 | The same style sets `--font-jetbrains-mono` on `:root` to the mono family, then the Courier New fallback family, then `MONO_FALLBACK_STACK` in order, ending with the generic `monospace`. |
| M04 | Still exactly two `<link rel="preload" as="font">`, the Inter 400 and 700 upright files (F04). No mono file is preloaded. |
| M05 | No `href`, `src` or `url()` in the head points at another origin (F05, both styles). |
| M06 | The page CSP meta keeps `font-src 'self'` and `style-src 'self'` plus `sha256-` hashes only; the only difference from before is one more style hash. No source, keyword or directive is added (supersedes F06's hash count). |

## Global styles

| Row | Rule |
|---|---|
| M07 | `src/styles/global.css` `@theme` sets `--font-mono: var(--font-jetbrains-mono)`; `--font-body` and `--font-heading` stay `var(--font-inter)` (F07). No `@font-face` in the file. |
| M08 | The body-font element rule no longer lists `pre` or `code` (supersedes F08). A rule after it gives `pre, code, kbd, samp` and every descendant of them `font-family: var(--font-mono)`. No rule in the change sets a font size, colour, weight, style, padding, line height, `font-synthesis` or `font-feature-settings` for code, and no `hl-*` class gains a font style or weight. |

## Build output

| Row | Rule |
|---|---|
| M09 | `dist/_astro/fonts/` holds exactly eight `.woff2` files, each named by a content hash, each byte-identical to one of the committed files in `src/assets/fonts/` or `src/assets/fonts/jetbrains-mono/`. No font file elsewhere in `dist/` (supersedes F09's count). |

## Committed files

| Row | Rule |
|---|---|
| M10 | `src/assets/fonts/jetbrains-mono/` holds exactly `JetBrainsMono-Regular.woff2`, `JetBrainsMono-Italic.woff2`, `JetBrainsMono-Bold.woff2`, `JetBrainsMono-BoldItalic.woff2` and `OFL.txt`. Each woff2 has family `JetBrains Mono`, the weight and style its name says, a cmap equal to the 202 code points of `INTER_UNICODE_RANGE`, and the SHA-256 recorded in the subset script. Together they are at most 60,000 bytes. `OFL.txt` is the release's licence, unmodified (SHA-256 pinned), and Inter's `LICENSE.txt` is unchanged. |
| M11 | `scripts/fonts/subset-jetbrains-mono.ts` pins the 2.304 release URL and SHA-256, `fonttools[woff]==4.60.2`, and per face `--unicodes` from `INTER_UNICODE_RANGE`, `--layout-features=` (no layout features, so no ligatures), `--no-hinting`, `--flavor=woff2`. |

## Served responses

| Row | Rule |
|---|---|
| M12 | A mono file `GET /_astro/fonts/<hash>.woff2` returns 200, `font/woff2`, the exact `Cache-Control: public, max-age=31536000, immutable` and the `/*` security headers, through the existing rule (F10; `public/_headers` unchanged, F12). |

## Rendering (browser)

| Row | Rule |
|---|---|
| M13 | On the fixture post `/writing/every-part/`, the browser reports a JetBrains Mono face (`isCustomFont`) for: the code block (and a highlighted token in it) → `JetBrainsMono-Regular`; inline code → the face its computed weight and style select (600 normal → `JetBrainsMono-Bold`); code in `em` → `JetBrainsMono-BoldItalic`; code in `strong` → `JetBrainsMono-Bold`; `kbd` → `JetBrainsMono-Regular`; `samp` → `JetBrainsMono-Regular`; `samp` in `em` → `JetBrainsMono-Italic`. A paragraph, heading and the code card caption and Copy button are still drawn by Inter. |
| M14 | Every glyph in the code block advances by the same width: the code block's characters are drawn by a face whose advance width is fixed (asserted in the browser as equal widths for two equal-length lines of different characters; research R2 measured every advance as 600, but no test reads advances from the file, since that would need a new font-parsing dependency). |
| M15 | On every template, every font request is to the site's own `/_astro/fonts/*.woff2`, each file at most once. A template that draws no `code`, `pre`, `kbd` or `samp` text requests no JetBrains Mono file. The JetBrains Mono files a page requests are exactly the faces its code text draws (spec FR-007): a page with code but no italic or bold code requests no italic or bold face. |
| M16 | With JavaScript off, the code block is still drawn by `JetBrainsMono-Regular`. |
| M17 | With `/_astro/fonts/**` blocked, code text is visible and drawn by a monospace face whose PostScript name does not start with `JetBrainsMono-`, and at 320 CSS px the page does not scroll sideways. |
| M18 | Visual shots are taken only after every face a subject's code text needs has loaded. |
| M19 | The guard: every character in the visual-subject sources is in all four Inter faces and all four mono faces, or is on the named exclusion list; a failure names the character, code point, file and family. |
| M20 | Budget: every budget template ≤ 153,600 bytes, CLS < 0.1, LCP ≤ 2.5 s, long tasks and JavaScript limits unchanged (no limit edited). |
