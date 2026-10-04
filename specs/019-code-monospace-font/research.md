# Research: Self-hosted monospace font for code

**Feature**: `019-code-monospace-font` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

This feature adds a second family to feature 018's mechanism; it does not add a mechanism. Astro
choices were checked through the Astro Docs MCP (`search_astro_docs`) against the installed
Astro 7.3.5, and the generated output was confirmed with a throwaway `astro build` in this
worktree (2026-10-04, main at `cf9c97c` plus the spec commits). The throwaway build's config,
layout edit and font copies were reverted afterwards; nothing from it is committed.

## R1. Font delivery: a second local family in Astro's Fonts API

**Decision**: add one more entry to `fonts` in `astro.config.mjs`, with
`fontProviders.local()`, `name: "JetBrains Mono"`, `cssVariable: "--font-jetbrains-mono"`,
`fallbacks: [...MONO_FALLBACK_STACK]`, `optimizedFallbacks: true`, and four variants (400 normal,
400 italic, 700 normal, 700 italic) from `./src/assets/fonts/jetbrains-mono/`, each with
`display: "swap"` and the shared `unicodeRange`. Render
`<Font cssVariable="--font-jetbrains-mono" />` in `BaseLayout`'s `<head>` straight after the
Inter `<Font />`, **with no `preload`** (FR-007). Point Tailwind's `--font-mono` theme token at
`var(--font-jetbrains-mono)`.

**Docs pages** (Astro Docs MCP):

- "Using custom fonts", *Using a local font file* (files in `src/`, local provider, variants):
  docs.astro.build/en/guides/fonts/#using-a-local-font-file
- "Astro Font Provider API", *Local* and *Other properties* (`weight`, `style`, `src`,
  `display`, `unicodeRange`; caution against `public/`):
  docs.astro.build/en/reference/font-provider-reference/#local
- "Configuration Reference", `font.fallbacks`, `font.optimizedFallbacks`:
  docs.astro.build/en/reference/configuration-reference/#fontfallbacks
- "Image and Assets API Reference", `<Font />` (`cssVariable`, `preload` defaults to `false`):
  docs.astro.build/en/reference/modules/astro-assets/#font-
- "Using custom fonts", *Preloading fonts* ("preloading should be done sparingly … only the
  most essential fonts … above the fold"), which supports not preloading code faces:
  docs.astro.build/en/guides/fonts/#preloading-fonts
- "Using custom fonts", *Register fonts in Tailwind* (point a theme variable at the Fonts API
  variable): docs.astro.build/en/guides/fonts/#register-fonts-in-tailwind

**Confirmed by the throwaway build** (two families configured, both `<Font />` rendered):

- `dist/_astro/fonts/` held **eight** content-hashed `.woff2` files: the four Inter files and
  the four JetBrains Mono files, byte sizes identical to the inputs. The existing
  `/_astro/fonts/*` `_headers` rule (feature 018) therefore already gives them the one-year
  immutable cache (FR-011); `public/_headers` does not change.
- The JetBrains Mono `<Font />` wrote its own `<style>`: four `@font-face` rules for the family
  `JetBrains Mono-<hash>` (swap, the shared `unicode-range`, same-origin `url(... .woff2)`),
  four metric-adjusted fallback faces with `src: local("Courier New")` (family
  `JetBrains Mono-<hash> fallback: Courier New`, `size-adjust: 99.9837%`,
  `ascent-override: 102.0166%`, `descent-override: 30.0049%`, **no** `line-gap-override`
  because Courier New's line gap is 0, and no `unicode-range`, as for Inter), and
  `:root{--font-jetbrains-mono: "JetBrains Mono-<hash>", "JetBrains Mono-<hash> fallback: Courier New", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace}`.
- Still exactly two `<link rel="preload">` (Inter 400 and 700 normal). No mono preload.
- The page CSP gained one more `sha256-` style hash; `font-src 'self'` and every other source
  were unchanged (FR-010). Astro merges the hash itself (`vite-plugin-fonts.js` pushes
  `styleHashes`), so `security.csp` in the config does not change.
- Inline cost on every page: the mono `<style>` is 2,287 bytes raw; the home page's gzipped
  HTML grew from 7,900 to 8,149 bytes (**+249 bytes**).

**Alternatives considered**:

- `fontProviders.fontsource()` / `fontProviders.npm()` with `@fontsource/jetbrains-mono`:
  first-party providers, but they cannot apply our character set or drop the `calt` ligature
  feature, Fontsource is a font service at build time, and `npm` adds a dependency (FR-017).
  Same reasons as feature 018 R1.
- `fontProviders.google()` with `experimental.glyphs`: third-party service and experimental;
  ruled out by FR-005.
- Rendering the mono `<Font />` only in the post and story layouts: saves about 250 bytes on
  pages without code, but MDX standalone pages can hold code too, and it splits the font set-up
  across layouts. Rejected: one place (`BaseLayout`), and a page with no code still requests no
  mono **file** (FR-007), because a browser downloads a face only when text needs it.
- `@font-face` by hand: custom code where Astro has the feature (Principle IV).
- The variable JetBrains Mono: spec rules out variable fonts.

## R2. Source, subsetting recipe and measured sizes (FR-002, FR-003, SC-005)

**Decision**:

- **Source**: JetBrains Mono **2.304** (latest release), GitHub release
  `https://github.com/JetBrains/JetBrainsMono/releases/download/v2.304/JetBrainsMono-2.304.zip`,
  SHA-256 `6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf`. Static TTFs from
  `fonts/ttf/`: `JetBrainsMono-Regular.ttf`, `-Italic.ttf`, `-Bold.ttf`, `-BoldItalic.ttf`.
  Licence: the release's `OFL.txt` (SIL Open Font License 1.1, "Copyright 2020 The JetBrains
  Mono Project Authors"), SHA-256
  `30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad`, committed unmodified as
  `src/assets/fonts/jetbrains-mono/OFL.txt`, separate from Inter's `LICENSE.txt` (FR-013).
- **Tool**: the same pinned one-off as Inter, `uvx --from "fonttools[woff]==4.60.2" pyftsubset`;
  nothing in `package.json`, nothing in CI.
- **Script**: `scripts/fonts/subset-jetbrains-mono.ts`, a sibling of `subset-inter.ts` with the
  same shape (download into `.cache/fonts/`, verify SHA-256, `unzip` the four TTFs and
  `OFL.txt`, run `pyftsubset` per face, copy the licence; exported constants and
  `pyftsubsetArgs` for the unit test; network and `uvx` only under `import.meta.main`).
- **Arguments per face**:

  ```text
  JetBrainsMono-<face>.ttf
  --unicodes=<INTER_UNICODE_RANGE joined by ",">
  --layout-features=
  --no-hinting
  --flavor=woff2
  --output-file=src/assets/fonts/jetbrains-mono/JetBrainsMono-<face>.woff2
  ```

  `--layout-features=` (empty) keeps **no** OpenType layout feature. JetBrains Mono's
  programming ligatures live in `calt`; with no features they cannot be shipped or switched on
  (FR-003). The font has no `kern` feature (a monospace face), so `--layout-features=kern` gives
  byte-identical files; the empty list is chosen because it states the intent. No feature is
  needed to draw the shipped set: every shipped character, accented Latin-1 included, has its
  own precomposed glyph in the cmap.
- **Character set**: the same `INTER_UNICODE_RANGE` constant (feature 018 R3), so the set is
  written once for both families.

**Measured output** (fonttools 4.60.2, JetBrains Mono 2.304, measured 2026-10-04):

| Face | Code points in cmap | WOFF2 bytes | PostScript name | Weight class | Italic bit | SHA-256 |
|---|---|---|---|---|---|---|
| Regular | 202 | 7,460 | `JetBrainsMono-Regular` | 400 | no | `c7db62fa593d7a626f8eb77646a6f0944c01e3ba586ac3ceca55e8b36888bd18` |
| Italic | 202 | 8,256 | `JetBrainsMono-Italic` | 400 | yes | `3e6abb338d565e42430dc0d7612f261eb92d62b89a1f77c021cc9e7daa5d9dc0` |
| Bold | 202 | 7,544 | `JetBrainsMono-Bold` | 700 | no | `504d5a6ee14ff269ca94e8c5d2b661c92a6cd3290c11735c7099fd5a71bc83c0` |
| Bold Italic | 202 | 8,396 | `JetBrainsMono-BoldItalic` | 700 | yes | `62e2d56f1471aa78550024fc0432303c351d9c4141ba7a5331b267c8c2015fdf` |
| **All four** | | **31,656** | | | | |

- **31,656 of 60,000 bytes** (FR-003, SC-005): 28,344 bytes under the cap. No face swap needed.
- **Coverage**: all 202 code points of the shipped set are in every face, **including U+00AD
  SOFT HYPHEN** (which Inter lacks), and no other code point. → ✓ ✗ are present in all four
  faces. So the mono faces need no `NOT_IN_…` exception.
- **Layout tables**: `GSUB` and `GPOS` are present but hold no features at all (no `calt`,
  `liga` or `kern`).
- **Every glyph advances 600 units** (1000 per em) in every face, so every character advances by
  the same width (Story 1, scenario 1).
- **Determinism**: a second run gave byte-identical files (SHA-256 checked).
- **Fit with Inter (FR-002)**: x-height 550/1000 = 0.550 em against Inter's 1118/2048 =
  0.546 em; cap height 730/1000 against Inter's 0.728 em. Distinct I l 1 | and O 0 (slashed or
  dotted zero is the face's default, no feature needed). True italic designs in both weights.

**Alternatives considered**: IBM Plex Mono and Source Code Pro were set aside at clarify (spec
FR-002); not measured. Fontsource's JetBrains Mono `latin` files: not used, as in R1.

## R3. CSS: which rule gives code the mono face (FR-001, FR-004, FR-009)

Today `global.css` has an unlayered element rule giving
`body, p, a, span, div, li, blockquote, pre, code, input, textarea, button, label, figcaption`
`font-family: var(--font-body)`. Three findings shape the change:

1. **Tailwind preflight** already gives `code, kbd, samp, pre` `--default-mono-font-family`,
   which is `--font-mono` (Tailwind's `theme.css`). It is in the `base` layer, so the unlayered
   rule above beats it for `pre` and `code`; that is why code is in Inter today.
2. **Shiki tokens are `<span>`s inside `<pre><code>`**, so `span { font-family: var(--font-body) }`
   would put every highlighted token back in Inter even if `pre` and `code` changed.
3. **The Typography plugin sets `kbd { font-family: inherit }`** inside `.prose`, so prose
   keyboard keys follow the paragraph (Inter) today.

**Decision**:

- In `@theme`: `--font-mono: var(--font-jetbrains-mono);` with a comment naming the Fonts API.
- Remove `pre` and `code` from the body-font element rule.
- Add one unlayered rule right after it:

  ```css
  pre,
  code,
  kbd,
  samp,
  :is(pre, code, kbd, samp) * {
    font-family: var(--font-mono);
  }
  ```

  Being unlayered and later in the file, it beats the Typography `kbd` rule (layered) and the
  body rule for spans inside code (equal specificity, later wins). No size, colour, weight,
  padding or line-height declaration changes (FR-009); no `font-synthesis` and no
  `font-feature-settings` are set (FR-004: the four real faces cover every weight/style, and the
  fallback keeps the browser's default synthesis).
- `.code-card__button` (Copy) and `.code-card__caption` sit outside `pre` and stay in Inter.

**Weight and style that code text resolves to** (standard CSS font matching; the faces shipped
are 400 and 700, each upright and italic):

| Where | Computed weight / style | Mono face drawn |
|---|---|---|
| Code block (`pre`, `pre code`, Shiki spans) | 400 normal (Typography `pre` 400, `pre code` inherit) | Regular |
| Inline `code` in prose | 600 normal (Typography `code` 600) | **Bold** (as Inter Bold today) |
| Inline `code` in a heading or `strong` | 600 normal | Bold |
| Inline `code` in `em` | 600 italic | **Bold Italic** |
| `kbd` in prose | 500 normal (Typography `kbd` 500) | Regular |
| `samp` | 400 normal | Regular; inside `em`, **Italic** |

So in prose the regular italic face is reached only by `samp` (or `kbd`) inside emphasis. The
fixture post gains such a case so all four faces are exercised by the post-template subject
(R5).

**Alternatives considered**: a new token name (`--font-code`): rejected, because Tailwind's
preflight and the `font-mono` utility already read `--font-mono`, so one token serves both.
`font-family: … !important`: not needed.

## R4. Budget (FR-008, SC-004): estimate; the budget test measures

Per-page cost of the change:

- every page: the mono `<style>` in the head, **+249 bytes** gzipped (R1);
- a page that draws code: each mono face it draws, 7,460 to 8,396 bytes, plus about 700 bytes
  of response headers per file (feature 018 R4).

Budget templates that draw code: only `writing-post` (`/writing/sample-everything/`, the draft
sample post: 6 code blocks, inline code, 3 `kbd`, inline code in a heading, no italic code). It
draws Regular (blocks, `kbd`) and Bold (inline code, heading code): 15,004 + 1,400 = 16,404 bytes.

| Page | Feature 018 measure (R4) | Added | Estimate | Limit 153,600 |
|---|---|---|---|---|
| writing-post `/writing/sample-everything/` | 84,124 | 16,404 + 249 | **≈ 100,800** | ≈ 52,800 headroom |
| same page, if it drew all four mono faces | 84,124 | 34,456 + 249 | ≈ 118,800 | ≈ 34,800 headroom |
| writing-series-convergence (heaviest, no code) | 121,654 | 249 | ≈ 121,900 | ≈ 31,700 headroom |
| every other template (no code) | ≤ 89,168 | 249 | ≤ 89,500 | ≥ 64,100 headroom |

The feature 018 figures were taken before optimized fallbacks were on, so today's real numbers
are a few hundred bytes higher; that changes no conclusion. **Every page fits; the budget is
not raised.** The implement phase reads the real figures from the `budget` annotations and
records them in the PR body; if any page is over 153,600 bytes, work stops and Don is told the
page, bytes and breakdown (FR-008).

The two real posts with code (not budget templates) draw Regular and Bold only (blocks and
inline code; no `kbd`, `samp` or italic code).

**CLS**: the code faces are not preloaded, so code may first paint in the fallback. With Arial
absent the fallback is the system monospace stack; where Courier New exists, Astro's adjusted
Courier New face (`size-adjust` ≈ 100%, matched ascent and descent) has the same 0.6 em advance
as JetBrains Mono, so the swap moves almost nothing. The unchanged CLS < 0.1 check in the
budget test is the gate (FR-006).

## R5. Fixture post: code in emphasis, bold, keys and sample output

**Decision**: add one sentence to `tests/fixtures/posts/valid/every-part.mdx`, after the
emphasis sentence, for example:

```mdx
Code keeps its face in *emphasis with `code`*, in **bold with `code`**, and next to keys such as <kbd>Ctrl</kbd> and sample output such as <samp>ok</samp> or *<samp>done</samp>*.
```

**Rationale**: the fixture post (the post-template visual subject and the `fonts.spec.ts` page)
today has one inline code span and one code block. Story 1's scenario 3 and FR-001 name code in
emphasis and bold, `kbd` and `samp`; with this sentence the subject draws all four mono faces
(R3 table), so the Docker-to-CI first-run match covers each real face, including both italics.
The sentence is ASCII (the guard stays green), keeps reading time at one minute and leaves the
summary (used by the lead story and the listing cards) unchanged. The post-template baselines
change in this feature anyway (R6). A heading with code is not added: heading code resolves to
the same Bold face as `strong` code (both weight 600), and changing a heading would touch more
fixture expectations than it proves.

## R6. Which visual baselines change (FR-015, SC-007)

Code-bearing subjects were found by searching every source the fixture site and the shell draw
(`src/components`, `src/layouts`, `src/pages`, the fixture pages `sections.mdx` and
`contact-form.mdx`, the three fixture posts, the five fixture projects and the generated posts)
for backticks and `<code>`, `<pre>`, `<kbd>`, `<samp>`. The only hits are the fixture post
`every-part.mdx` and `src/components/post/CodeBlock.astro` (used only by posts). The other
fixture posts that hold code (`code-spike.mdx`, `unknown-language.mdx`) are not in
`FIXTURE_POSTS`, so they are not on the fixture site. The lead story and listing cards show the
post's summary, which has no code.

**Predicted changed images: exactly 8**, the `post-template` subject:

- `post-template-desktop-dark-visual-darwin.png`
- `post-template-desktop-light-visual-darwin.png`
- `post-template-phone-dark-visual-darwin.png`
- `post-template-phone-light-visual-darwin.png`
- `post-template-desktop-dark-visual-linux.png`
- `post-template-desktop-light-visual-linux.png`
- `post-template-phone-dark-visual-linux.png`
- `post-template-phone-light-visual-linux.png`

The other 124 images are predicted not to change: the mono `<style>` in the head draws nothing
on a page without code. No image is added or removed.

**Settling**: `visual.spec.ts` `settleFonts` waits for Inter Regular and Bold today. It gains a
wait that, for every `code, pre, kbd, samp` element with text, `document.fonts.check(<the
element's computed font shorthand>, <its text>)` is true, so a shot is never taken while a mono
face is unloaded or mid-swap (FR-015). Pages with no code wait for nothing extra.

**Linux drift lesson (issue #62, feature 018)**: the earlier Docker-vs-CI drift came from
synthesized italic in DejaVu. Here every code style is a real committed face, the shot waits for
it, and the Docker image keeps `fonts-dejavu-core` only for fallback parity (feature 018 R10).
Docker baselines matched CI on the first run for feature 018 (PR #72). The PR is opened without
the `visual-baselines` label, and the first CI visual run must pass; on failure the cause is
investigated in this feature (FR-015) before anything else, and CI-artifact baselines are not
landed without telling Don.

## R7. Coverage guard extension (FR-014)

**Decision**: `tests/unit/site/font-coverage.test.ts` reads the cmaps of all eight committed
faces (Inter in `src/assets/fonts/`, JetBrains Mono in `src/assets/fonts/jetbrains-mono/`) and
checks the visual-subject sources against each family separately, reporting
`U+XXXX <char> <file> (<family>)`. Because the guard already reads every source a subject can
draw (a superset of its code text), checking all text against the mono set as well is the
cheapest way to cover "code text in the visual subjects" without parsing code spans out of MDX
and components. The exclusion list is shared and unchanged (emoji, VS16, ZWJ, box drawing, soft
hyphen, whitespace). A new self-check case feeds a character that is outside the mono set and
expects it reported for the mono family.

**Today's result**: every source character is in both sets (the mono set is the Inter set plus
U+00AD), so the guard stays green; it was seen to fail through its self-check case.

## R8. How tests prove the face that drew code

As feature 018 R8: E2E tests use CDP `CSS.getPlatformFontsForNode` and compare the PostScript
name (`JetBrainsMono-Regular`, `-Italic`, `-Bold`, `-BoldItalic`) and `isCustomFont`. The
expected face is derived from the node's computed weight and style (≥ 600 → Bold), as the
existing inline-code test does, so a Typography change cannot make a test lie. A synthesized
slant or weight would show the wrong PostScript name.

## R9. Docs that change

- `docs/testing.md` "Visual coverage", fonts paragraph: JetBrains Mono for code, files in
  `src/assets/fonts/jetbrains-mono/`, not preloaded, the guard checks both families, `fonts.spec`
  checks the mono faces and that pages without code request none, the visual wait for code
  faces.
- `docs/design-source.md`: a row for the code font (`--font-mono`: self-hosted JetBrains Mono
  2.304 through Astro's Fonts API, system monospace stack as fallback, feature 019).
- `src/styles/global.css` comments; `src/layouts/BaseLayout.astro` header comment.
- `CLAUDE.md` and the pipeline skills need no change.
