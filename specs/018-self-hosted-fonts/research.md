# Research: Self-hosted Inter web fonts

**Feature**: `018-self-hosted-fonts` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

All Astro choices below were checked through the Astro Docs MCP (`search_astro_docs`) against the
installed Astro 7.3.5, and the generated output was confirmed by reading
`node_modules/astro/components/Font.astro` and `node_modules/astro/dist/assets/fonts/**`.
Measurements were taken on 2026-10-03 in this worktree (main at `0daaada` plus the spec commits).

## R1. Font delivery: Astro's Fonts API with the local provider

**Decision**: Use Astro's built-in Fonts API (`fonts` in `astro.config.mjs`) with
`fontProviders.local()` and the `<Font />` component from `astro:assets` in
`src/layouts/BaseLayout.astro`. Exact API chosen:

```js
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";
import { INTER_UNICODE_RANGE, SYSTEM_FONT_STACK } from "./src/lib/fonts/charset.ts";

fonts: [{
  provider: fontProviders.local(),
  name: "Inter",
  cssVariable: "--font-inter",
  fallbacks: [...SYSTEM_FONT_STACK],   // today's stack, exactly (FR-005)
  optimizedFallbacks: false,           // R6
  options: {
    variants: [
      { weight: 400, style: "normal", src: ["./src/assets/fonts/Inter-Regular.woff2"],    display: "swap", unicodeRange: [...INTER_UNICODE_RANGE] },
      { weight: 400, style: "italic", src: ["./src/assets/fonts/Inter-Italic.woff2"],     display: "swap", unicodeRange: [...INTER_UNICODE_RANGE] },
      { weight: 700, style: "normal", src: ["./src/assets/fonts/Inter-Bold.woff2"],       display: "swap", unicodeRange: [...INTER_UNICODE_RANGE] },
      { weight: 700, style: "italic", src: ["./src/assets/fonts/Inter-BoldItalic.woff2"], display: "swap", unicodeRange: [...INTER_UNICODE_RANGE] },
    ],
  },
}],
```

```astro
---
// src/layouts/BaseLayout.astro, in <head> after <Seo />
import { Font } from "astro:assets";
---
<Font cssVariable="--font-inter" preload={[{ weight: "400", style: "normal" }, { weight: "700", style: "normal" }]} />
```

```css
/* src/styles/global.css @theme */
--font-body: var(--font-inter);
--font-heading: var(--font-inter);
```

**Rationale** (docs pages, found through the Astro Docs MCP):

- "Using custom fonts", *Using a local font file*: font files go in `src/` (for example
  `src/assets/fonts/`), registered with the local provider and `options.variants`.
  docs.astro.build/en/guides/fonts/#using-a-local-font-file
- "Astro Font Provider API", *Local*: each variant is one `@font-face` and takes `weight`,
  `style`, `src`, plus `display`, `unicodeRange`, `stretch`, `featureSettings`,
  `variationSettings`. The docs **caution against `public/`**, because Astro copies the files
  there into the output a second time. docs.astro.build/en/reference/font-provider-reference/#local
- "Configuration Reference", `font.fallbacks` and `font.optimizedFallbacks`
  (default `["sans-serif"]` and `true`). docs.astro.build/en/reference/configuration-reference/#fontfallbacks
- "Image and Assets API Reference", `<Font />`: `cssVariable` (required) and `preload`
  (`boolean` or an array of `{ weight, style, subset }` filters). It renders a `<style>` with the
  `@font-face` rules and the CSS variable, plus `<link rel="preload" as="font" crossorigin>` for
  the chosen files. docs.astro.build/en/reference/modules/astro-assets/#font-
- "Using custom fonts", *Register fonts in Tailwind*: for Tailwind 4, point a theme variable at
  the Fonts API variable. docs.astro.build/en/guides/fonts/#register-fonts-in-tailwind. The site
  already reads `var(--font-body)` / `var(--font-heading)` in one global rule, so those two
  tokens are pointed at `var(--font-inter)` instead of adding `--font-sans`.
- "Configuration Reference", `security.csp`: Astro hashes the styles it emits. The installed
  source confirms the fonts plugin pushes the hash of the `<Font />` CSS into
  `injectedCsp.styleHashes` and adds the font origin (`'self'` for a local build) to
  `font-src`, merging with the existing `font-src 'self'` (`dist/core/csp/common.js`). So the
  CSP gains one `sha256-` style hash and no new source (FR-009).

What the build emits (from the installed source, to be pinned by the build test):

- Files at `/_astro/fonts/<xxhash of the file content>.woff2` (`ASSETS_DIR = "fonts"` under
  `build.assets`, `BuildFontFileIdGenerator` hashes the content). That is the fingerprinted
  name FR-015 asks for, and the path `/_astro/fonts/*` holds the Inter files and nothing else.
- The family name in `@font-face` is `Inter-<hash of the family config>`, not `Inter`; tests
  check the face actually drawn (PostScript name, R8), never the `font-family` string.
- `font-display` defaults to `swap`; it is set explicitly anyway so the config states FR-005.

**Alternatives considered**:

- `@font-face` written by hand in `global.css` with files in `public/fonts/`: works, but it is
  custom code where Astro has a first-party feature (Principle IV), gives no fingerprinted
  names, no preload links and no automatic CSP hash.
- `fontProviders.fontsource()` or `fontProviders.npm()` with `@fontsource/inter`: first-party
  providers, but they fetch Fontsource's own `latin` subset (23.7 to 25.9 KB a face, 99 KB for
  four), which cannot fit the budget (R3), they cannot apply our own character set and feature
  list, and `npm` adds a dependency (major change, more surface). Fontsource is also a font
  service at build time.
- `fontProviders.google()` with `experimental.glyphs`: a third-party service at build time and
  an experimental option; rejected by FR-004 and D1.
- The variable font (`InterVariable.woff2`, weight `"100 900"`): one file per style, but the
  variable outlines are larger than two static weights after subsetting, and the spec rules out
  variable fonts.

## R2. Cloudflare: cache header through `public/_headers`

**Decision**: Add one rule to `public/_headers`:

```text
/_astro/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

**Rationale**: Workers static assets apply `_headers` rules (the site already relies on them,
and `wrangler dev`, which every E2E run uses, applies them as production does). Rules that match
the same path combine, so the font files keep the `/*` security headers and gain the cache
header. Astro puts only Fonts API files under `/_astro/fonts/`, so the rule reaches the four
Inter files and nothing else (FR-015: other build files keep today's caching). This is
Cloudflare's own first-party mechanism; no Worker code, no Cache Rules in the dashboard
(Principle VIII: configuration is committed).

**Alternatives considered**: a rule on all of `/_astro/*` (out of scope by clarification,
listed as follow-up); a Cloudflare Cache Rule (dashboard state, not committed); setting headers
in the Worker (only `/api/*` runs Worker code, Principle VIII).

**Unverified point, settled by a test**: that a `_headers` `Cache-Control` replaces the static
asset default rather than being appended. The E2E header test (plan, test placement) asserts
the served value exactly, so the gate shows it either way.

## R3. Character set, subsetting tool and source

**Decision**:

- **Source**: Inter **4.1** from the rsms/inter GitHub release
  (`https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip`, SHA-256
  `9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`), using the static TTFs in
  `extras/ttf/`: `Inter-Regular.ttf`, `Inter-Italic.ttf`, `Inter-Bold.ttf`,
  `Inter-BoldItalic.ttf`. The release's `LICENSE.txt` (SIL Open Font License 1.1) is committed
  as `src/assets/fonts/LICENSE.txt` (FR-013).
- **Tool**: `pyftsubset` from **fonttools 4.60.2** (with `brotli` for WOFF2), run through
  `uvx --from "fonttools[woff]==4.60.2" pyftsubset`. It is a documented one-off: nothing is
  added to `package.json`, nothing runs in CI or at runtime, and the outputs are committed.
- **Script**: `scripts/fonts/subset-inter.ts` (Node 24 runs it directly, like the other
  scripts). It downloads the release zip into `.cache/fonts/`, checks the SHA-256, extracts the
  four TTFs and the licence with `unzip`, runs `pyftsubset` per face, and writes
  `src/assets/fonts/Inter-{Regular,Italic,Bold,BoldItalic}.woff2` and `LICENSE.txt`. Usage:
  `node scripts/fonts/subset-inter.ts` (needs `uv`, which Don has; the script prints the
  install hint when `uvx` is missing). It exports its argument builder so a unit test can pin
  the flags.
- **Exact `pyftsubset` arguments** (per face):

  ```text
  <face>.ttf
  --unicodes=U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+2192,U+2713,U+2717
  --layout-features=kern
  --no-hinting
  --flavor=woff2
  --output-file=src/assets/fonts/<face>.woff2
  ```

  The unicode list is the single constant `INTER_UNICODE_RANGE` in `src/lib/fonts/charset.ts`,
  which `astro.config.mjs` (the `unicodeRange` of each variant), the script and the tests all
  import, so the character set is written once.
- **Character set (FR-002)**: printable ASCII U+0020–U+007E; all of Latin-1 U+00A0–U+00FF;
  – — ‘ ’ “ ” • … (U+2013, U+2014, U+2018, U+2019, U+201C, U+201D, U+2022, U+2026); → ✓ ✗
  (U+2192, U+2713, U+2717). Inter 4.1 has all three of the last group in every face (checked).
- **Layout features**: `kern` only. Inter's other features (`liga`, `calt`, `ccmp`, the
  stylistic sets) are dropped. `calt` drops Inter's contextual alternates (for example
  case-sensitive punctuation and the `->` arrow ligature); the site has no text that relies on
  them. `--no-hinting` drops TrueType hinting instructions, which Chromium on macOS and Linux
  does not use for these sizes; it also keeps the outlines identical across renderers.
- **Determinism**: running the subset twice gives byte-identical files (checked with SHA-1), so
  the script is reproducible.

**Measured output** (fonttools 4.60.2, brotli 1.2.0, Inter 4.1):

| Face | Glyphs in cmap | WOFF2 bytes | PostScript name | Weight class |
|---|---|---|---|---|
| Regular | 201 | 11,364 | `Inter-Regular` | 400 |
| Italic | 201 | 12,308 | `Inter-Italic` | 400 |
| Bold | 201 | 11,516 | `Inter-Bold` | 700 |
| Bold Italic | 201 | 12,560 | `Inter-BoldItalic` | 700 |
| **All four** | | **47,748** | | |

For comparison: the same subset with `kern,liga,calt` is 59,252 bytes for four, with no
features 36,996 bytes, and Fontsource's `latin` files are 99 KB for four.

**One gap in the set, by design**: U+00AD SOFT HYPHEN is inside the Latin-1 range but not in
Inter's cmap in any face. Browsers never draw it as a glyph (at a break they draw a hyphen from
the font), so this is expected. The font-file test and the guard test treat U+00AD as a
documented exception rather than a missing glyph.

**Alternatives considered**:

- `subset-font` (Node, harfbuzzjs WASM) as a devDependency: keeps the tool in the Node
  toolchain, but adds a dependency (a major change on its own) for a step that runs once per
  Inter upgrade. Rejected in favour of a pinned, documented one-off.
- `glyphhanger`: wraps `pyftsubset` and adds a crawler; no gain here.
- Committing the release's own `web/Inter-*.woff2` (111 to 121 KB each): far over budget.

## R4. Budget feasibility (FR-007, SC-004): measured, and one page does not fit

**Method**: the budget test's own conditions, reproduced with a script: Chromium at 390 x 844,
cache disabled, slow 4G (150 ms RTT, 1.6 Mbps down), `encodedDataLength` summed per response
(headers included). Main-site pages were served by `wrangler dev` exactly as the budget project
serves them. The fixture site could not be served by `astro preview` in the agent sandbox (the
preview process exits before it is ready), so fixture pages were served by a stand-in static
server that gzips text the way the preview server does. Then the Playwright `budget` project
itself was run for the main-site templates (all 17 passed; the two fixture-site cases failed
only because the stand-in for that run did not compress, and were re-measured with gzip).

**Font cost per page**: only the faces a page draws are downloaded (no preload of italic faces).
Each font response adds about 700 bytes of headers (security headers plus the new
`Cache-Control`). Regular + Bold = 22,880 + 1,400 = **24,280 bytes**; all four =
47,748 + 2,800 = **50,548 bytes**. Every page draws at least Regular and Bold (body text and the
header's bold name and semibold links).

**Today and with fonts** (budget limit 102,400 bytes):

| Page (budget template) | Faces drawn | Today | With Inter | Headroom |
|---|---|---|---|---|
| writing-series-convergence `/writing/convergence/` | 400, 700 | 97,374 | **121,654** | **−19,254 (over)** |
| writing-all `/writing/all/` | 400, 700 | 64,888 | 89,168 | 13,232 |
| projects `/projects/` | 400, 700 | 59,833 | 84,113 | 18,287 |
| writing-post `/writing/sample-everything/` | all four | 33,576 | 84,124 | 18,276 |
| writing-landing `/writing/` | 400, 700 | 53,368 | 77,648 | 24,752 |
| about | 400, 700 | 46,523 | 70,803 | 31,597 |
| home | 400, 700 | 36,305 | 60,585 | 41,815 |
| writing-post-text-only (fixture) | 400, 700, 400 italic | 42,457 | 79,745 | 22,655 |
| writing-all, 12 cards (fixture) | 400, 700 | 43,606 | 67,886 | 34,514 |
| every other template | 400, 700 | ≤ 34,044 | ≤ 58,324 | ≥ 44,076 |
| *fixture post `/writing/every-part/` (visual subject, not a budget template)* | *all four after R9* | *43,611* | *94,159* | *8,241* |

The fixture post page today is 8,152 bytes of HTML and 34,978 bytes of CSS (the fixture site's
CSS is larger than the real site's 12,322 bytes) plus a 481-byte image. Even if it drew all four
faces it would stay under the limit.

**Finding: `writing-series-convergence` cannot fit.** It is 97,374 bytes today (5,026 bytes of
headroom), and 78,604 bytes of that are the two real posts' card
images (`starting-new-hero` 480w WebP 47,050 bytes, `wayfinder-hero` 480w WebP 31,554 bytes).
The smallest Inter that satisfies D1 (Regular and Bold, no features at all, 17,516 bytes) would
still put it at about 116 KB. No font choice inside the spec fits this page.

Under D3 and the spec's "Heaviest page" edge case, **the work stops at this point and is
reported to Don; the budget is not raised.** The plan records this as gate **G0** (plan.md):
no implementation task may start until Don decides. The options, with measurements:

| Option | What changes | Convergence page with Inter | In this feature? |
|---|---|---|---|
| **A (recommended)**: right-size listing-card images first, in its own reviewed change (a `/squash` or `/tweak` before this feature resumes). Add a 400w candidate to the card `widths` and encode card images at WebP quality 60. | Card images only; a 390 px phone picks 400w instead of 480w. Measured with sharp on the source photos: starting-new-hero 24,124 bytes, wayfinder-hero 14,530 bytes (38,654 for both, against 78,604 today). | about 82,700 bytes, about 19.7 KB headroom | No: image handling is out of this feature's scope; it is a prerequisite PR. |
| A1: 400w candidate only, default quality 80 | 33,392 + 21,500 = 54,892 bytes of images | about 98,900 bytes, about 3.5 KB headroom | Too thin to recommend; the next post in the series breaks it. |
| A2: quality 60 only, keep 480w | 33,934 + 21,082 = 55,016 bytes of images | about 99,100 bytes, about 3.3 KB headroom | Too thin. |
| B: Don amends D1 (for example a single Regular face with synthesized bold) | Contradicts FR-002, FR-003 and FR-017 | about 109,400 bytes, still over | No. |
| C: Don raises the budget or exempts the real-content listing pages from it | Contradicts D3; weakening a check is its own reviewed change (Principle II) | n/a | No. |

The convergence page is fragile even without fonts: one more post in the series adds about
30 to 47 KB of card image. Option A fixes that cause as well, so it is the recommendation.

After option A lands, the font work proceeds unchanged and the heaviest pages are
writing-all (about 89 KB, or less once its cards also shrink) and the sample post with all four
faces (about 84 KB).

## R5. Guard test for uncovered characters (FR-016)

**Decision**: a unit test, `tests/unit/site/font-coverage.test.ts`, that:

1. Reads the cmap of each committed WOFF2 with **fontace** (the font reader Astro's Fonts API
   already uses, `fontace(buffer).unicodeRangeArray`), loaded through Astro's own dependency
   with `createRequire` the way `tests/helpers/content.ts` loads Astro's front matter parser.
   No new dependency. The covered set is the intersection of the four faces.
2. Collects the text of the visual subjects from source, a deliberate superset of what the
   screenshots draw:
   - shell and templates: every file under `src/components/`, `src/layouts/`, `src/pages/`,
     `src/config/` and `src/scripts/` (markup, labels, aria text, scripts that write text);
   - fixture site: `tests/fixtures/pages/` files named in `FIXTURE_PAGES`,
     `tests/fixtures/posts/valid/` files named in `FIXTURE_POSTS`, every
     `tests/fixtures/projects/*.mdx`, and the generated posts from `generateFixturePosts()`, all
     imported from `scripts/build-fixture-site.ts` so the list never drifts.
   Real content under `src/content/` is not read (spec: real content is not checked).
3. Fails with a list of `U+XXXX <char> <file>` for every character that is not covered and not
   excluded.

**Exclusions** (explicit, each with its reason, in the test):

- emoji: any `\p{Extended_Pictographic}` code point, U+FE0F VARIATION SELECTOR-16 and U+200D
  ZERO WIDTH JOINER (they stay on the system emoji fonts);
- box drawing: U+2500–U+257F (system monospace or sans fonts draw them);
- U+00AD SOFT HYPHEN (never drawn as a glyph, R3);
- whitespace and line breaks (`\t`, `\n`, `\r`).

Today's scan of those sources finds only © · – — … → ✓ ✗ outside ASCII, all covered; the
fixture files are pure ASCII. The 23 non-ASCII characters used anywhere in the site (© · É ä é –
— … → ─ ═ ╿ ⚠ ✅ ✓ ✗ ❌ U+FE0F 🏷 💡 📊 🔄 😄) are covered except the box drawing, ⚠ ✅ ❌,
U+FE0F and the emoji, which are excluded by rule and only appear in real content.

**Rationale**: the cheapest layer that can observe it (no browser, no build). Reading the cmap
rather than the committed `unicode-range` catches a wrong subset as well as a wrong range.

**Alternatives considered**: an E2E test that walks the rendered text of each visual subject
and asks CDP which fonts drew it. Exact, but it costs a browser run per subject, and the source
superset already covers every string those subjects can show.

## R6. Fallback stack and optimized fallbacks

**Decision**: `fallbacks` is exactly today's stack, `ui-sans-serif, system-ui, -apple-system,
"Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`, and
`optimizedFallbacks: false`.

**Rationale**: FR-005 says the fallback is "the stack the site uses today". Astro's optimized
fallback inserts metric-adjusted `local("Arial")` faces ahead of the stack, which would change
what a visitor sees while Inter loads (Arial instead of the system UI font), and on Linux it
would depend on whether a font named Arial exists. Astro only optimizes when the last fallback
is a generic family; ours ends with the emoji families, so it would not optimize anyway, but
setting it to `false` states the intent. The stack moves from `global.css` into
`SYSTEM_FONT_STACK` in `src/lib/fonts/charset.ts` so one constant feeds the config and the test.

**CLS risk and mitigation**: with `font-display: swap`, text first drawn in the fallback and
redrawn in Inter can move. Regular and Bold are preloaded, so on most loads they arrive with the
render-blocking CSS and the first paint is already in Inter. Italic faces are not preloaded and
can swap late, but italic text is a small share of any page. The budget test's CLS < 0.1 check
is the gate (FR-006); today's worst page is 0.036 (contact). If CLS fails, the remedy is a
spec question for Don (size-adjusted fallback faces would contradict FR-005), not a silent
change.

## R7. Weight mapping (FR-017)

**Decision**: no class changes. Standard CSS font matching with faces 400 and 700 declared:

- `font-medium` (500) and the Typography plugin's 500 (blockquote, links) render with **400**
  (for a desired weight between 400 and 500, the browser looks at weights up to 500, then
  below, then above; 400 is the nearest below).
- `font-semibold` (600), `font-extrabold` (800), Typography headings (600, 700, 800),
  `bolder` (from 400 gives 700; from 600 gives 900) render with **700**.
- With all four faces declared there is a real face for every weight and style, so the browser
  never synthesizes bold or italic for text in Inter (FR-003). Synthesis stays on for the
  fallback stack (`font-synthesis` is not touched).

Components affected (22 `font-medium`, 23 `font-semibold`, 3 `font-extrabold`, 2
`font-weight: bolder` uses), listed for the review:

- **500 → 400**: `src/components/SiteFooter.astro`, `SiteHeader.astro`,
  `page/HomeIntro.astro`, `post/Pagination.astro`, `post/SeriesBanner.astro`,
  `post/SeriesIntro.astro`, `post/SeriesPage.astro`, `post/Share.astro`,
  `post/TopicPillRow.astro`, `post/topic-styles.ts`, `project/portfolio.css`,
  `sections/ContactForm.astro`, `sections/RecentWriting.astro`, `src/pages/writing/index.astro`,
  `src/pages/writing/topics/[topic]/[...page].astro`, `src/styles/global.css` (the
  `.code-card__button` rule).
- **600 / 800 → 700**: `src/components/Pill.astro`, `SiteFooter.astro`, `SiteHeader.astro`,
  `post/PostCard.astro`, `post/SeriesBanner.astro`, `post/TopicBanner.astro`,
  `post/topic-styles.ts`, `project/PartPicture.astro`, `project/portfolio.css`,
  `sections/CallToAction.astro`, `src/layouts/PostLayout.astro`,
  `src/pages/writing/all/[...page].astro`, `src/pages/writing/index.astro`,
  `src/styles/global.css` (table header rule, `.prose-accent h4` `bolder`).

Medium text becomes visibly lighter than today's system 500 and semibold heavier; that is the
predicted design change Don reviews on the preview (Principle III).

## R8. How tests prove the face that was drawn

**Decision**: E2E tests use the Chrome DevTools Protocol call `CSS.getPlatformFontsForNode`,
which returns the fonts that actually drew a node's text, with `familyName`, `postScriptName`
and `isCustomFont`. A synthesized italic shows up as `Inter-Regular` on an italic element, so
"`<em>` is drawn by `Inter-Italic`" proves a real face (FR-003, SC-002). This avoids depending
on Astro's hashed `font-family` name.

## R9. Fixture post gains emphasis and bold italic

**Decision**: add one sentence with `*emphasis*` and `***bold italic***` to
`tests/fixtures/posts/valid/every-part.mdx`.

**Rationale**: the spec's Story 1 names the fixture post's "block quotes, emphasis, bold italic
and the views note", but today the fixture draws italic only in the block quote and the views
note and has no bold italic at all. The post-template subject is the one that drifted in issue
#62; it should exercise all four faces so the Docker-to-CI match (FR-011) covers each one. All
132 baselines regenerate in this feature anyway, so the edit adds no extra baseline churn. The
fixture is test-owned content (docs/testing.md "Real content in tests").

## R10. Visual baselines and the Docker image (FR-011)

**Decisions**:

- `tests/e2e/visual.spec.ts` `open()` awaits `document.fonts.ready` after the images settle,
  then asserts that no `FontFace` in `document.fonts` has status `"loading"` and that the
  Regular and Bold faces have status `"loaded"`, so a shot is never taken mid-swap or in the
  fallback font.
- `scripts/visual-baselines-linux.sh` **keeps** installing `fonts-dejavu-core`. After this
  change no visual subject draws text in a system font (the guard proves it), but `ubuntu-latest`
  ships DejaVu and the Playwright image does not; keeping it means any glyph that does fall back
  (an excluded emoji or box-drawing character added to a fixture later, or an SVG `<text>` in a
  future fixture image) still renders the same in Docker and CI. Only its comment changes, to
  say why it stays.
- **First-run match (SC-001)**: the Linux baselines are produced only by
  `pnpm run test:visual:update:linux` in Docker and committed; the PR is opened **without** the
  `visual-baselines` label, and the first CI `verify` run's visual project must pass. If it
  fails, the job's diff images are inspected and the cause investigated within this feature
  (Docker image fonts, `fc-match`, rendering flags); if the match still cannot be shown, the
  work stops and the diff is reported to Don. CI-artifact baselines are never committed for this
  PR, and the PR body says "Closes #62" only once the first-run pass is shown.

## R11. Docs that change

- `docs/testing.md`: "Layers" table rows for unit (font files, charset guard), component,
  build, E2E (fonts spec) and the visual row (fonts settle before shots); "Visual coverage"
  gains a paragraph on self-hosted Inter, `document.fonts.ready`, the guard test and why Docker
  keeps DejaVu.
- `docs/design-source.md`: the `--gh-font-body` / `--gh-font-heading` row becomes "Self-hosted
  Inter 4.1 (400, 400 italic, 700, 700 italic, subset) through Astro's Fonts API; system stack
  as fallback (feature 018)".
- `src/styles/global.css` comment "system stacks only; no web fonts" is replaced.
- `src/components/project/portfolio.css` header comment "the system font only" is updated.
- `scripts/visual-baselines-linux.sh` comment (R10).
- No doc outside these mentions "no web fonts" (searched `docs/`, `CLAUDE.md`, `VOICE.md`,
  `.claude/skills/`, `src/`, `tests/`, `scripts/`, `.github/`). `CLAUDE.md` and the pipeline
  skills need no change.
