# Implementation Plan: Self-hosted Inter web fonts

**Branch**: `018-self-hosted-fonts` | **Date**: 2026-10-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/018-self-hosted-fonts/spec.md` (GitHub issue #62)

**Major change (Constitution Principle III): YES.** The slice changes the design system and the
site's visual identity: every page's typeface changes from the system stack to Inter, medium
(500) text renders lighter and semibold (600) text heavier, and all 132 visual baselines change.
It also supersedes the "system font stack, no web fonts" part of feature 002's FR-003. Its one
serving-configuration change is the `/_astro/fonts/*` cache rule in the committed
`public/_headers` file (FR-015), another Principle III trigger covered by the same review. It
adds no dependency, service, cost, CI workflow, Worker code or contact-data change (the
subsetting tool is a pinned one-off outside `package.json`). Auto-merge stays off, the PR carries the `major-change` label,
`tasks.md` carries a `[PREVIEW-CHECK]` task, and the PR body says why.

**Decisions taken after the first plan (Don, 2026-10-03; spec D3, FR-005 to FR-007,
Clarifications).** The first plan stopped at a budget gate: `/writing/convergence/` is 97,374
bytes today (78,604 of them two real card images) and 121,654 bytes with Inter Regular and Bold,
over the 102,400-byte limit. Don chose:

1. **Raise the per-page total-transfer budget to 150 KB** (`totalBytes: 150 * 1024`, 153,600
   bytes) in `tests/e2e/budget.spec.ts`, as a design decision recorded in the spec. LCP, CLS,
   long-task and JavaScript limits and the slow-4G conditions are unchanged. No image is shrunk
   or re-encoded; card-image right-sizing is spec follow-up work. With Inter, the convergence
   page is 121,654 of 153,600 bytes (31,946 headroom) and every other page has at least 59,441
   bytes of headroom (research R4).
2. **Turn Astro's optimized fallbacks on** (`optimizedFallbacks: true`), so fallback text is
   drawn with metric-adjusted faces and the swap to Inter does not shift layout (research R6).

## Summary

Ship four Inter 4.1 faces (400, 400 italic, 700, 700 italic), subset once to the FR-002
character set with kerning only, committed under `src/assets/fonts/` with the OFL licence.
Astro's Fonts API (`fontProviders.local()`) emits them with content-hashed names under
`/_astro/fonts/`; `<Font cssVariable="--font-inter" preload=…>` in `BaseLayout` writes the
`@font-face` rules (hashed into the CSP automatically) and preloads Regular and Bold; the
existing `--font-body` / `--font-heading` tokens point at `var(--font-inter)`, whose fallback
is today's system families (generic `sans-serif` moved last) preceded by Astro's optimized,
metric-adjusted `local("Arial")` / `local("Arial Bold")` fallback faces, so the swap keeps
layout. One `public/_headers` rule gives `/_astro/fonts/*` a one-year immutable
cache. A unit guard reads the fonts' cmap and the visual subjects' sources and fails on any
uncovered character. The four faces total 47,748 bytes; a page pays only for the faces it draws.
The budget test's total-transfer limit rises from 100 KB to 150 KB (spec D3); its other limits
stay. All 132 baselines regenerate, Linux ones in Docker, and the first CI run must match them.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, Node 24 from `.nvmrc` via nvm

**Primary Dependencies**: Astro Fonts API (`fonts` config, `fontProviders.local()`,
`<Font />` from `astro:assets`), Tailwind CSS 4.3.3 (`@theme` tokens), Cloudflare Workers static
assets (`public/_headers`). No new npm dependency. One-off tool outside the repo's dependencies:
`pyftsubset` from fonttools 4.60.2 via `uvx` (research R3). Tests read font files with
`fontace` 0.4.1, already installed as Astro's own dependency.

**Storage**: Files only: four WOFF2 files and `LICENSE.txt` in `src/assets/fonts/`.

**Testing**: Vitest `unit` (unit and component), Vitest `build` (`tests/build/local-site.test.ts`
L1 build, no new build), Playwright `e2e`, `a11y`, `visual`, `budget`.

**Target Platform**: Static pages on Cloudflare Workers static assets; evergreen browsers.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: Every budget template ≤ 153,600 bytes (150 KB) total transfer, raised
from 102,400 by spec D3; CLS < 0.1, LCP ≤ 2.5 s, long tasks ≤ 200 ms and JavaScript ≤ 10 KB on
simulated slow 4G, all unchanged (FR-006, FR-007). Measured per page in research R4; the
heaviest is `/writing/convergence/` at 121,654 bytes.

**Constraints**: No third-party request (FR-004); no CSP loosening (FR-009); readable while
loading and with JS off (FR-005, FR-012); no class changes for weights (FR-017); WCAG 2.2 AA.

**Scale/Scope**: 4 font files (47,748 bytes), about 6 source files, 1 script, about 11 test
files (including the one-constant budget change), 132 baseline images, 2 docs.

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1, and again after Don's 2026-10-03
decisions on the budget and the fallbacks. No open stop condition.*

| Principle | How this plan complies |
|---|---|
| I. Test-First | Every behaviour has a failing test first, at one named layer (Test placement below). Tasks order tests before the code they cover; the font files are test inputs committed with their tests. |
| II. Automated Release Gate | Nothing is skipped or weakened. The budget test's `totalBytes` changes from `100 * 1024` to `150 * 1024`. That is a deliberate design decision by the maintainer, made before any code, recorded in the spec (D3, FR-007, SC-004, Clarifications) with its rationale, and reviewed in this major-change PR. It is not a check loosened to get a red run through: the new value is set from measurements (research R4), the test keeps measuring every template on its own with no averaging, under the same slow-4G conditions, with every other limit unchanged, and a page over 150 KB still fails the gate. `design-tokens.test.ts`'s system-stack assertions are superseded by FR-001/FR-005 in this reviewed change, not deleted to get through. Full `verify` before the PR. |
| III. Human Review | **Major** (design system and visual identity; supersedes 002 FR-003). Auto-merge off, `major-change` label, `[PREVIEW-CHECK]` task, reason in the PR body. The budget change (D3) is called out in the PR body for Don's review. |
| IV. First-Party Before Custom | Astro Docs MCP consulted (research R1, pages cited). **Font loading**: Astro Fonts API, local provider, `<Font />` (first-party, used). **Fingerprinting**: the Fonts API's content-hashed `/_astro/fonts/` output (first-party, used; files in `src/`, not `public/`, as the docs advise). **CSP**: Astro's CSP hashes the `<Font />` style and merges `font-src` (first-party, used; no config change). **Tailwind**: `@theme` tokens pointing at the Fonts API variable, per the docs' Tailwind 4 section (used). **Fallbacks**: Fonts API `fallbacks` and `optimizedFallbacks: true` (first-party, used): Astro generates the metric-adjusted `local("Arial")` / `local("Arial Bold")` faces itself; the stack ends with the generic `sans-serif` because Astro only optimizes when the last fallback is generic (research R6). No hand-written `size-adjust` faces. **Font source**: the Fontsource/NPM/Google providers fall short: Fontsource's `latin` files are 99 KB for four faces and cannot take our character set or feature list, Google is a third-party service and `experimental.glyphs` is experimental (research R1). **Subsetting**: Astro has no subsetting for local files, so a one-off `pyftsubset` recipe is custom by necessity (research R3). **Caching**: Cloudflare's own `_headers` file (first-party, used); Cache Rules (dashboard state) and Worker code rejected (research R2). |
| V. Static by Default | No client JavaScript; fonts load through CSS and preload links; readable with JS off and while fonts load (F15, F16). |
| VI. Content as Files | No content model change. One fixture post sentence added (research R9). |
| VII. Private Data | Not touched. Fonts come from the site's own origin, so no visitor IP reaches a font service. |
| VIII. Cloudflare Best Practices | Static assets only; one committed `_headers` rule; no Worker, D1, Turnstile or Cron change; nothing configured in the dashboard. |
| IX. Cost Ceiling | Expected new monthly cost: **$0**. No service, no runtime dependency; four static files (about 48 KB) served from Workers static assets within the free plan; the subsetting tool runs once on a laptop. |
| X. Accessible, Fast and Private | `a11y` runs unchanged on every template (contrast does not depend on the face; Inter at the same sizes). Core Web Vitals "good" on mobile stays enforced by the budget test's unchanged LCP ≤ 2.5 s and CLS < 0.1 limits (plus long tasks ≤ 200 ms and JavaScript ≤ 10 KB); the optimized fallbacks protect CLS during the swap. CI still enforces a performance budget that fails the gate when broken; only its total-transfer figure moves to 150 KB (spec D3), and every page fits it (research R4: convergence 121,654 of 153,600 bytes). No third-party request. |
| XI. Spec Kit Workflow | Spec Kit branch and directory, one feature. Parallel worktrees: this slice touches `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `astro.config.mjs`, `public/_headers` and **every** visual baseline, so any sibling that changes a baseline must merge first or after, never alongside; the later PR merges `main` and regenerates. |
| Dev workflow: Astro decisions cite docs | research.md R1 names each Astro docs page. |
| Dev workflow: test placement | One primary layer per behaviour; second layers carry a written reason (below). |
| Dev workflow: scope | Card-image right-sizing, a long cache for all `/_astro/`, a monospace font and Inter inside SVG/og images stay out of scope (spec follow-up). No image is shrunk or re-encoded in this feature. |
| Dev workflow: plain language | No site copy changes. |

## Design

### Source changes

| File | Change |
|---|---|
| `src/lib/fonts/charset.ts` (new) | `INTER_UNICODE_RANGE`, `codePointsOf`, `NOT_IN_INTER`, `SYSTEM_FONT_STACK` (today's families, `sans-serif` moved last; data-model.md, research R6). |
| `src/assets/fonts/Inter-{Regular,Italic,Bold,BoldItalic}.woff2` (new) | Output of the subset recipe (research R3). |
| `src/assets/fonts/LICENSE.txt` (new) | Inter 4.1 `LICENSE.txt`, SIL Open Font License 1.1 (FR-013). |
| `scripts/fonts/subset-inter.ts` (new) | One-off recipe: download Inter 4.1, verify SHA-256, extract, `uvx --from "fonttools[woff]==4.60.2" pyftsubset …` per face, copy the licence. Exports its constants and `pyftsubsetArgs`. |
| `astro.config.mjs` | `fonts: [{ provider: fontProviders.local(), name: "Inter", cssVariable: "--font-inter", fallbacks: [...SYSTEM_FONT_STACK], optimizedFallbacks: true, options: { variants: [four variants, display "swap", unicodeRange] } }]` (research R1). Imports `fontProviders` and the charset module. `security.csp` unchanged. |
| `src/layouts/BaseLayout.astro` | `import { Font } from "astro:assets"`; `<Font cssVariable="--font-inter" preload={[{ weight: "400", style: "normal" }, { weight: "700", style: "normal" }]} />` in `<head>` after `<Seo />`. |
| `src/styles/global.css` | `--font-body: var(--font-inter); --font-heading: var(--font-inter);`; comment says Inter is self-hosted through Astro's Fonts API with the system stack as fallback. The body-font element rule is unchanged (FR-008). |
| `tests/e2e/budget.spec.ts` | `BUDGET.totalBytes` from `100 * 1024` to `150 * 1024`, with a comment citing feature 018 D3 (no `specs/...` path literal); every other limit and the throttling unchanged (FR-007). |
| `public/_headers` | New rule `/_astro/fonts/*` → `Cache-Control: public, max-age=31536000, immutable` (FR-015), placed after `/*`. |
| `tests/fixtures/posts/valid/every-part.mdx` | One sentence with `*emphasis*` and `***bold italic***` (research R9). |
| `scripts/visual-baselines-linux.sh` | Comment only: DejaVu stays for fallback parity (research R10). |
| `src/components/project/portfolio.css` | Header comment no longer says "the system font only". |
| `docs/testing.md`, `docs/design-source.md` | See "Docs" below. |

No component class changes (FR-017). Components whose weights map to a shipped face are listed
in research R7 for the review.

### Test placement

Each behaviour has one primary layer, the cheapest that can observe it (docs/testing.md "Where a
test goes"). Test titles cite contract rows (`F01` …); no `specs/...` path literals in tests.

| Behaviour (FR / SC / row) | Layer | Test |
|---|---|---|
| Each committed face: cmap equals the shipped set minus U+00AD, family Inter, weight/style match the file, total ≤ 50,000 bytes; `LICENSE.txt` is the OFL; nothing font-like under `public/` (FR-002, FR-004, FR-013; F19) | unit | `tests/unit/site/font-files.test.ts` (new; reads files with fontace through Astro's dependency) |
| Subset recipe pins Inter 4.1 URL and SHA-256, fonttools 4.60.2, `--layout-features=kern`, `--no-hinting`, `--flavor=woff2`, `--unicodes` from `INTER_UNICODE_RANGE` (FR-002 "kerning kept"; F20) | unit | `tests/unit/site/font-files.test.ts`, `describe("subset recipe")` (imports `scripts/fonts/subset-inter.ts` exports; the script's network and `uvx` steps only run under `import.meta.main`) |
| Charset module: tokens, expansion, `SYSTEM_FONT_STACK` holds exactly today's families with the generic `sans-serif` last (FR-002, FR-005) | unit | `tests/unit/site/font-files.test.ts`, `describe("charset")` |
| Guard: every character in shell, layout, page, config and script sources and in the fixture site's pages, posts (including generated ones) and projects is covered or explicitly excluded (FR-016, SC-008; F18) | unit | `tests/unit/site/font-coverage.test.ts` (new; research R5) |
| `astro.config.mjs` declares the one Inter family with the four variants, `display: "swap"`, the shared `unicodeRange`, `fallbacks` = `SYSTEM_FONT_STACK` (last entry generic), `optimizedFallbacks: true`, files under `./src/assets/fonts/` (FR-001, FR-002, FR-005, FR-006, FR-015) | unit | `tests/unit/site/astro-config.test.ts` (new `describe("fonts")` on the imported config) |
| `--font-body`/`--font-heading` are `var(--font-inter)`; `global.css` has no `@font-face` and no off-host `url()`; the body-font element rule still lists `pre` and `code` (FR-001, FR-004, FR-008; F07, F08) | unit | `tests/unit/site/design-tokens.test.ts` (replace "sets --font-body and --font-heading to system font stacks"; keep "has no @font-face declaration" and the off-host check; add the `pre`/`code` assertion) |
| `_headers` has four rules; `/_astro/fonts/*` sets only that exact `Cache-Control`; no other rule sets `Cache-Control` (FR-015; F12) | unit | `tests/unit/site/headers.test.ts` (update "has exactly three rules", add the font rule tests) |
| Head of every page: one Font `<style>` with four Inter `@font-face` (swap, unicode-range, same-origin woff2 `src`) and four metric-adjusted fallback `@font-face` (`local("Arial")` / `local("Arial Bold")` only, `size-adjust` and the three overrides, matching weight, style and unicode-range), `--font-inter` = Inter, the two fallback families, then the stack; exactly two preloads (400 and 700 normal) (FR-001, FR-004, FR-005, FR-006, FR-012; F01 to F05) | component | `tests/component/BaseLayout.test.ts` (new `describe("fonts")`; the container loads `astro.config.mjs` through `getViteConfig`, so the Fonts API virtual module resolves. If it does not in the container, the same assertions move to the build layer row below, with that reason written in the test comment) |
| Built output: `dist/_astro/fonts/` holds exactly four content-hashed `.woff2` files, byte-identical to `src/assets/fonts/`; no font file elsewhere in `dist/` (FR-004, FR-015; F09) | build | `tests/build/local-site.test.ts` (new `describe` reading the existing L1 build; no new build) |
| Faces actually drawn on the fixture post `/writing/every-part/`: paragraph `Inter-Regular`, `strong` `Inter-Bold`, `em`, block quote and views note `Inter-Italic`, bold italic `Inter-BoldItalic`, `code` `Inter-Regular`, a `font-medium` header link `Inter-Regular`, a `font-semibold`/`font-bold` heading `Inter-Bold`; all `isCustomFont` (FR-001, FR-003, FR-008, FR-017, SC-002; F13) | E2E | `tests/e2e/fonts.spec.ts` (new; CDP `CSS.getPlatformFontsForNode`, research R8) |
| Font requests on every budget template are same-origin `/_astro/fonts/*.woff2`, none to another origin (FR-004, SC-003; F14) | E2E | `tests/e2e/fonts.spec.ts` (loops `TEMPLATES`) |
| JS off: paragraph still drawn by `Inter-Regular` (FR-012; F15) | E2E | `tests/e2e/fonts.spec.ts` |
| Fonts blocked (`page.route` aborts `/_astro/fonts/**`): text visible, drawn by a font whose PostScript name is not `Inter-*` (an adjusted Arial or a system font, depending on the machine), italic still slanted (FR-003, FR-005; F16) | E2E | `tests/e2e/fonts.spec.ts` |
| Served font file: 200, `font/woff2`, exact `Cache-Control`, full security headers; page stylesheet under `/_astro/` without `immutable` (FR-015, SC-009; F10, F11) | E2E | `tests/e2e/headers.spec.ts` (two new tests). **Second layer, reason**: the unit test reads the rule text; only the served response shows that `wrangler`'s `_headers` matching reaches Astro's real output path and that the value replaces the default `Cache-Control` (research R2). |
| CSP: no violation on any template, sources unchanged (one more style hash) (FR-009; F06) | E2E | **No new test**: `tests/e2e/headers.spec.ts` "carries the page CSP meta tag with the closed allow-list" already filters `sha256-` hashes and listens for CSP console errors on every HTML template. |
| Accessibility on every template (FR-010, SC-005) | a11y | **No change**: `tests/e2e/a11y.spec.ts` and the blog/portfolio a11y specs run as they are. |
| Budget and CLS with fonts on every template: total transfer ≤ 150 KB, CLS < 0.1, LCP ≤ 2.5 s, long tasks and JS unchanged (FR-006, FR-007, SC-004; F21) | budget | `tests/e2e/budget.spec.ts`: one edit, `totalBytes: 150 * 1024` (spec D3); the test is otherwise unchanged and is the proof. Seen to fail first: with fonts in and the old 100 KB value, the convergence template fails on total bytes (research R4), then passes at 150 KB. |
| Shots taken only after fonts settle; all 132 baselines regenerated (FR-011, SC-006; F17) | visual | `tests/e2e/visual.spec.ts` `open()` awaits `document.fonts.ready` and asserts no face is loading and Regular and Bold are loaded |
| Docker-generated Linux baselines pass CI first time (FR-011, SC-001) | visual (CI) | The first `verify` run of the PR, opened without the `visual-baselines` label (research R10); recorded in the PR body. |

### Existing tests and lists that change

| File | Change | Why |
|---|---|---|
| `tests/unit/site/design-tokens.test.ts` | "sets --font-body and --font-heading to system font stacks" replaced by the `var(--font-inter)` test; the "no @font-face" test stays (faces come only from `<Font />`) | FR-001 supersedes 002 FR-003's system stack. |
| `tests/unit/site/headers.test.ts` | rule list becomes four, in file order: `/*`, `/_astro/fonts/*`, the two host rules | FR-015 |
| `tests/component/BaseLayout.test.ts` | new font describe; existing head-order assertions checked for the new `<style>` and `<link>` elements | F01 to F05 |
| `tests/e2e/visual.spec.ts` | `open()` waits for fonts; header comment mentions it | F17 |
| `tests/unit/site/csp.test.ts`, `tests/e2e/headers.spec.ts` (CSP test) | **No change**: `security.csp` config is unchanged and Astro merges `'self'` into the existing `font-src 'self'` | F06 |
| `tests/e2e/budget.spec.ts` | `totalBytes` `100 * 1024` → `150 * 1024`; header comment notes the raise and its reason (self-hosted type, feature 018 D3). LCP, CLS, long-task, JS limits and throttling untouched. | D3, FR-007 |
| `tests/e2e/blog-fixtures.spec.ts` | **Expected no change**; re-run after the `every-part.mdx` sentence (reading time stays 1 minute; lead and series links unchanged) | research R9 |
| `tests/e2e/geometry.spec.ts`, `projects.spec.ts` layout checks | **Expected no change**; Inter's wider glyphs could wrap a nav or row differently, so these are watched in the first full run and any failure is a design regression to fix, not a threshold to loosen | risk |

### Visual baselines

- **Predicted changed images: all 132** (66 `*-darwin.png`, 66 `*-linux.png`): every subject
  draws text and the typeface changes. Predicted new or deleted images: **none**.
- macOS: `pnpm run test:visual:update`. Linux: `pnpm run test:visual:update:linux` in Docker
  (ask Don to start Docker Desktop with an `AskUserQuestion`). The CI-label fallback is **not**
  used to land this PR's baselines (FR-011).
- `git status tests/e2e/visual.spec.ts-snapshots/` must show exactly 132 modified files.
- `scripts/visual-baselines-linux.sh` keeps `fonts-dejavu-core` (research R10).
- First-run match: open the PR without the `visual-baselines` label; the first CI visual run
  must pass. On failure: investigate in this feature, else stop and report to Don; issue #62
  closes only when the match is shown (SC-001).

### Docs

- `docs/testing.md`: "Layers" rows for the new unit, component, build and E2E tests and the
  visual note; "Visual coverage" paragraph on self-hosted Inter, the fonts wait, the coverage
  guard and why Docker keeps DejaVu.
- `docs/design-source.md`: the `--gh-font-body` / `--gh-font-heading` row records self-hosted
  Inter 4.1 through Astro's Fonts API (feature 018), the system stack as fallback.
- No other doc says "no web fonts" (research R11); `CLAUDE.md` and the pipeline skills are
  unchanged.

### Order of work (for tasks)

1. Charset module and its unit tests (RED, GREEN).
2. Subset recipe tests (RED); the script; run it once; commit the four files and the licence
   (font-files tests GREEN).
3. Coverage guard (should pass at once on today's sources: record that it was seen to fail
   first by temporarily feeding it a fixture string with an uncovered character, for example
   U+0100, in the test's own self-check case).
4. Tests for config, tokens, headers, BaseLayout head, build output, fonts E2E and the served
   header, all seen to fail.
5. Code: `astro.config.mjs` fonts block (optimized fallbacks on), `BaseLayout` `<Font />`,
   `global.css` tokens, `_headers` rule, until step-4 tests pass.
6. Fixture sentence (R9); `visual.spec.ts` fonts wait.
7. Budget: run `budget` with the fonts in and the old limit and record the convergence failure
   on total bytes; then set `totalBytes: 150 * 1024` (spec D3) and run `a11y` and `budget`.
   Compare the annotations with research R4 (including the few hundred bytes of fallback CSS)
   and record the convergence figure and CLS values in the PR body.
8. Baselines: macOS, then Linux in Docker; 132 modified.
9. Docs and comments.
10. `[PREVIEW-CHECK]`: Don reviews the preview in both themes and widths (home, a post with
    italic and bold italic, projects index, a story), including the 500 → 400 and 600 → 700
    weight mapping, and confirms fonts are cached on reload.
11. PR without the `visual-baselines` label, `major-change` label, auto-merge off; confirm the
    first CI run passes visual.

### Risks and open questions

- **Convergence headroom**: 31,946 bytes at 150 KB is about one more card image; a third post
  in that series could break the budget. The card-image follow-up is the fix, not another raise.
- **CLS**: swap from the fallback to Inter could shift text. Regular and Bold are preloaded and
  the optimized fallbacks adjust size and line metrics; the unchanged CLS < 0.1 check gates it.
  Bold fallback text likely uses Arial Regular with synthesized bold (research R6, known limit).
  On a runner without Arial the adjusted faces do not apply, so that run measures the unadjusted
  swap. If CLS fails, stop and report to Don.
- **Stack order**: `sans-serif` moves from before the emoji families to the end so Astro will
  generate the fallback faces; if it stayed in place, `optimizedFallbacks: true` would silently
  do nothing (the config unit test pins the last entry as generic).
- **Docker vs CI**: removing the synthetic italic should remove the 1% drift, but other
  rendering differences could remain; FR-011's investigate-then-stop path applies.
- **Container API and fonts**: if the component test cannot resolve the Fonts API in the
  container, those assertions move to the L1 build test with the reason in the comment.
- **`_headers` precedence**: whether the rule replaces Workers' default `Cache-Control` is
  checked by the E2E header test rather than assumed.
- **Layout shifts from wider glyphs**: geometry and layout E2E tests may expose wraps; treated
  as design regressions.
- **Parallel worktrees**: any sibling touching baselines must not merge alongside this PR.

## Project Structure

### Documentation (this feature)

```text
specs/018-self-hosted-fonts/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R11, budget measurements, fallback decision
├── data-model.md        # Phase 1: charset, faces, recipe, exclusions
├── quickstart.md        # Phase 1: validation run guide
├── contracts/
│   └── fonts.md         # Phase 1: rows F01–F20
├── checklists/
│   └── requirements.md  # From specify
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
astro.config.mjs                         # fonts block
public/_headers                          # /_astro/fonts/* cache rule
scripts/
├── fonts/subset-inter.ts                # new one-off recipe
└── visual-baselines-linux.sh            # comment only
src/
├── assets/fonts/                        # new: 4 × Inter-*.woff2, LICENSE.txt
├── layouts/BaseLayout.astro             # <Font />
├── lib/fonts/charset.ts                 # new
├── components/project/portfolio.css     # comment only
└── styles/global.css                    # tokens
tests/
├── unit/site/font-files.test.ts         # new
├── unit/site/font-coverage.test.ts      # new
├── unit/site/astro-config.test.ts       # fonts describe
├── unit/site/design-tokens.test.ts      # superseded stack test
├── unit/site/headers.test.ts            # fourth rule
├── component/BaseLayout.test.ts         # head fonts
├── build/local-site.test.ts             # dist/_astro/fonts
├── e2e/budget.spec.ts                   # totalBytes 150 KB (D3)
├── e2e/fonts.spec.ts                    # new
├── e2e/headers.spec.ts                  # served cache header
├── e2e/visual.spec.ts                   # fonts wait
├── e2e/visual.spec.ts-snapshots/        # 132 regenerated
└── fixtures/posts/valid/every-part.mdx  # emphasis + bold italic
docs/testing.md, docs/design-source.md
```

**Structure Decision**: the existing single Astro project. Font files live in `src/assets/fonts/`
as the Astro docs advise; the shared charset lives in `src/lib/fonts/` beside the other modules
`astro.config.mjs` already imports.

## Complexity Tracking

No constitution violations to justify. Two deliberate custom pieces, both explained under
Principle IV: the one-off subset recipe (Astro does not subset local fonts) and the coverage
guard (no first-party check exists). The budget raise is a maintainer decision recorded in the
spec (D3), not a complexity exception.
