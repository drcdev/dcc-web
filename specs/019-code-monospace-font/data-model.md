# Data model: Self-hosted monospace font for code

**Feature**: `019-code-monospace-font`. No content schema, database or API changes. The
"entities" are constants, committed files and the CSS tokens that tie them together.

## Shipped character set (shared)

- **Constant**: `INTER_UNICODE_RANGE` in `src/lib/fonts/charset.ts` (feature 018), reused
  unchanged for the mono faces: 13 `unicode-range` tokens, 202 code points.
- **Inter**: 201 of them in the cmap (`NOT_IN_INTER = [U+00AD]`).
- **JetBrains Mono**: all 202 (no exception constant needed).
- A doc comment on the constant says it is the shipped set of both families.

## Monospace fallback stack (new constant)

`MONO_FALLBACK_STACK` in `src/lib/fonts/charset.ts`, Tailwind's default mono families in order,
generic last (Astro only generates adjusted fallbacks when the last entry is generic):

```text
ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace
```

## Monospace face (four records)

| Field | Regular | Italic | Bold | Bold Italic |
|---|---|---|---|---|
| File | `src/assets/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2` | `…-Italic.woff2` | `…-Bold.woff2` | `…-BoldItalic.woff2` |
| CSS weight / style | 400 normal | 400 italic | 700 normal | 700 italic |
| PostScript name | `JetBrainsMono-Regular` | `JetBrainsMono-Italic` | `JetBrainsMono-Bold` | `JetBrainsMono-BoldItalic` |
| Bytes | 7,460 | 8,256 | 7,544 | 8,396 |
| SHA-256 | `c7db62fa…88bd18` | `3e6abb33…5d9dc0` | `504d5a6e…83c0` | `62e2d56f…2015fdf` |

Full hashes in research R2. Total 31,656 bytes (cap 60,000). Built name:
`/_astro/fonts/<content hash>.woff2`.

## Licence file

`src/assets/fonts/jetbrains-mono/OFL.txt`, SIL OFL 1.1, unmodified from the 2.304 release,
SHA-256 `30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad`.

## Subset recipe

`scripts/fonts/subset-jetbrains-mono.ts` exports `JBM_VERSION = "2.304"`, `JBM_ZIP_URL`,
`JBM_ZIP_SHA256`, `FONTTOOLS_SPEC` (`fonttools[woff]==4.60.2`), `FACES`
(`Regular`, `Italic`, `Bold`, `BoldItalic`) and `pyftsubsetArgs(face, input, output)`.

## Font family config (astro.config.mjs)

| Field | Value |
|---|---|
| `provider` | `fontProviders.local()` |
| `name` | `JetBrains Mono` |
| `cssVariable` | `--font-jetbrains-mono` |
| `fallbacks` | `[...MONO_FALLBACK_STACK]` |
| `optimizedFallbacks` | `true` |
| `options.variants` | the four faces above, each `display: "swap"`, `unicodeRange` from `INTER_UNICODE_RANGE` |

The shared per-variant object (`interFace` today) is renamed to say it serves both families
(for example `subsetFace`).

## CSS tokens and rules

| Token / rule | Value |
|---|---|
| `--font-mono` (`@theme`) | `var(--font-jetbrains-mono)` |
| body-font element rule | as today minus `pre` and `code` |
| code rule | `pre, code, kbd, samp, :is(pre, code, kbd, samp) * { font-family: var(--font-mono); }` |

## Which face draws which code (state table)

See research R3: block code and `kbd` → Regular; inline `code` (weight 600) → Bold; inline code
in `em` → Bold Italic; `samp` in `em` → Italic.

## Guard exclusions

Unchanged from feature 018 and shared by both families: emoji (`\p{Extended_Pictographic}`),
U+FE0F, U+200D, box drawing U+2500–U+257F, U+00AD, tab and line breaks.
