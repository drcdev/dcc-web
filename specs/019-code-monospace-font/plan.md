# Implementation Plan: Self-hosted monospace font for code

**Branch**: `019-code-monospace-font` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-code-monospace-font/spec.md` (GitHub issue #75)

**Major change (Constitution Principle III): YES.** The slice changes the design system and the
site's visual identity: every `code`, `pre`, `kbd` and `samp` on the site changes typeface from
Inter (or, for `kbd`/`samp` outside prose, the visitor's system monospace) to JetBrains Mono, and
it supersedes feature 018's D2 and FR-008 ("code keeps the body font"). It adds no dependency,
service, CI workflow, serving rule, Worker code or contact-data change, and no recurring cost:
the font files are committed static assets and the subsetting tool is the same pinned one-off
outside `package.json` that feature 018 uses. Auto-merge stays off, the PR carries the
`major-change` label, `tasks.md` carries a `[PREVIEW-CHECK]` task, and the PR body says why.

## Summary

Ship four JetBrains Mono 2.304 faces (400, 400 italic, 700, 700 italic), subset once with the
same character set as Inter and **no** OpenType layout features (so no ligatures), committed under
`src/assets/fonts/jetbrains-mono/` with the release's `OFL.txt`. Measured: **31,656 bytes for
the four** (cap 60,000; research R2). A second `fonts` entry in `astro.config.mjs` uses the same
local provider; `<Font cssVariable="--font-jetbrains-mono" />` in `BaseLayout` writes the
`@font-face` rules and Astro's metric-adjusted Courier New fallback faces, with **no preload**.
Tailwind's `--font-mono` token points at the new variable; `pre` and `code` leave the body-font
rule and one rule gives `pre, code, kbd, samp` and their descendants (Shiki's token spans) the
mono font. The existing `/_astro/fonts/*` cache rule and CSP handling cover the new files with no
config change (confirmed by a throwaway build, research R1). The coverage guard checks both
families. Only the eight `post-template` baselines change; Linux ones come from Docker and must
pass CI on the first run.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5, Node 24 from `.nvmrc` via nvm

**Primary Dependencies**: Astro Fonts API (`fonts` config, `fontProviders.local()`,
`<Font />` from `astro:assets`), Tailwind CSS 4 (`@theme` `--font-mono`, preflight),
`@tailwindcss/typography` (unchanged). No new npm dependency. One-off tool outside the repo's
dependencies: `pyftsubset` from fonttools 4.60.2 via `uvx` (as feature 018). Tests read font
files with `fontace`, already installed as Astro's own dependency.

**Storage**: Files only: four WOFF2 files and `OFL.txt` in `src/assets/fonts/jetbrains-mono/`.

**Testing**: Vitest `unit` (unit and component), Vitest `build` (`tests/build/local-site.test.ts`
L1 build, no new build), Playwright `e2e`, `a11y`, `visual`, `budget`.

**Target Platform**: Static pages on Cloudflare Workers static assets; evergreen browsers.

**Project Type**: Static website (Astro), single project.

**Performance Goals**: Every budget template ≤ 153,600 bytes total transfer, CLS < 0.1,
LCP ≤ 2.5 s, long tasks ≤ 200 ms, JavaScript ≤ 10 KB on slow 4G, all unchanged. Estimated
heaviest code page `writing-post` ≈ 100,800 bytes; heaviest page overall stays
`writing-series-convergence` ≈ 121,900 bytes (research R4).

**Constraints**: No third-party request (FR-005); no CSP loosening (FR-010); no mono preload and
no mono request on pages without code (FR-007); readable while loading and with JS off (FR-006,
FR-016); no change to code size, colour, weight, padding or line height (FR-009); WCAG 2.2 AA.

**Scale/Scope**: 4 font files (31,656 bytes) + licence, 1 script, about 5 source files, about 9
test files, 8 baseline images, 2 docs.

No NEEDS CLARIFICATION remains: the face, faces, roles, loading and cap were settled at clarify;
size, CSS mechanics and baseline list were settled in research.

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1. No open stop condition.*

| Principle | How this plan complies |
|---|---|
| I. Test-First | **Tests are mandatory and written first.** Every behaviour below has a test at one named layer that is written and seen to fail before the code it covers (Test placement). The committed font files are test inputs added with their tests; the guard is shown able to fail through its self-check cases. |
| II. Automated Release Gate | Nothing is skipped, disabled or weakened. No budget limit, comparison threshold or CSP rule changes. Feature 018 assertions that this spec supersedes (F08 "pre and code use the body font", F09 "exactly four files", "one font `<style>`", "at most four font requests") are replaced by the stricter rows of this feature's contract in the same reviewed change, not deleted. Full `verify` before the PR. |
| III. Human Review | **Major** (design system and visual identity; supersedes 018 D2/FR-008). Auto-merge off, `major-change` label, `[PREVIEW-CHECK]` task, reason in the PR body. |
| IV. First-Party Before Custom | Astro Docs MCP consulted (research R1 cites each page). **Font loading**: Astro Fonts API, local provider, `<Font />` (first-party, used). **Fingerprinting and cache**: Fonts API content-hashed `/_astro/fonts/` output plus the existing Cloudflare `_headers` rule (first-party, used, unchanged). **CSP**: Astro hashes the second `<Font />` style automatically (first-party, used; config unchanged). **Fallback metrics**: Fonts API `optimizedFallbacks` (first-party, used; generates adjusted `local("Courier New")` faces). **Tailwind**: `--font-mono` theme token pointing at the Fonts API variable, per the docs' Tailwind section, which also feeds Tailwind's own preflight mono rule (first-party, used). **Font source**: Fontsource/NPM/Google providers fall short (cannot apply our character set or drop `calt` ligatures; build-time font service; `npm` adds a dependency; Google is third-party and `experimental.glyphs` experimental). **Subsetting**: Astro does not subset local files, so the pinned `pyftsubset` recipe is custom by necessity, as in feature 018. **Coverage guard**: no first-party check exists; the existing custom guard is extended. |
| V. Static by Default | No client JavaScript; fonts load through CSS. Code is readable with JS off and while fonts load (M16, M17). |
| VI. Content as Files | No content model change. One fixture post sentence added (research R5). |
| VII. Private Data | Not touched. Fonts come from the site's own origin; no contact-form, API, storage or secret change (FR-017). |
| VIII. Cloudflare Best Practices | Static assets only; no `_headers`, Worker, D1, Turnstile or Cron change; nothing in the dashboard. |
| IX. Cost Ceiling | Expected new monthly cost: **$0**. No service or runtime dependency; four static files (about 32 KB) served from Workers static assets within the free plan; the recipe runs once on a laptop. |
| X. Accessible, Fast and Private | `a11y` runs unchanged on every template (contrast does not depend on the face; sizes and colours unchanged; `kbd` box shadow unchanged). Wider monospace glyphs may make more code lines scroll inside their card; the existing 320 px / 200% zoom / text-spacing checks and the focus check on scrollable blocks gate it. Budget limits unchanged and every page fits (research R4). No third-party request. |
| XI. Spec Kit Workflow | Spec Kit branch and directory, one feature. Parallel worktrees: this slice touches `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/lib/fonts/charset.ts`, the fixture post `every-part.mdx` and the 8 `post-template` baselines; a sibling touching any of them merges first or after, never alongside, and the later PR merges `main` and regenerates. |
| Dev workflow: Astro decisions cite docs | research.md R1 names each Astro docs page (found through the Astro Docs MCP). |
| Dev workflow: test placement | One primary layer per behaviour; second layers carry a written reason (below). |
| Dev workflow: scope | Box-drawing glyphs, ligatures, variable fonts, other weights, Inter changes, budget or threshold changes and SVG/og text stay out (spec Out of Scope, Follow-up). |
| Dev workflow: plain language | The only new text is a fixture sentence; no site copy changes. |

**Post-design re-check**: the design adds no file outside the list above, changes no gate
setting, and keeps every page under the unchanged budget. Gate passes.

## Design

### Source changes

| File | Change |
|---|---|
| `src/lib/fonts/charset.ts` | Add `MONO_FALLBACK_STACK` (data-model.md). Doc comment on `INTER_UNICODE_RANGE` says both families ship this set. |
| `src/assets/fonts/jetbrains-mono/JetBrainsMono-{Regular,Italic,Bold,BoldItalic}.woff2` (new) | Output of the recipe; SHA-256 and sizes in research R2. |
| `src/assets/fonts/jetbrains-mono/OFL.txt` (new) | JetBrains Mono 2.304 `OFL.txt`, unmodified (FR-013). |
| `scripts/fonts/subset-jetbrains-mono.ts` (new) | One-off recipe mirroring `subset-inter.ts`; header comment records URL, archive SHA-256, the command and output hashes. |
| `astro.config.mjs` | Second `fonts` entry (data-model.md); the shared per-variant object renamed for both families; comment cites the docs and this feature. `security.csp` unchanged. |
| `src/layouts/BaseLayout.astro` | `<Font cssVariable="--font-jetbrains-mono" />` (no `preload`) after the Inter `<Font />`; header comment updated. |
| `src/styles/global.css` | `--font-mono: var(--font-jetbrains-mono)` in `@theme`; `pre` and `code` removed from the body-font rule; the code rule from research R3 added after it, with a comment. |
| `tests/fixtures/posts/valid/every-part.mdx` | One sentence with code in emphasis and bold, `kbd`, `samp` and `samp` in emphasis (research R5). |
| `docs/testing.md`, `docs/design-source.md` | See "Docs". |

`public/_headers`, `security.csp`, `scripts/visual-baselines-linux.sh`, the budget test's limits
and `playwright.config.ts` do **not** change.

### Test placement

Each behaviour has one primary layer, the cheapest that can observe it (`docs/testing.md` "Where
a test goes"). Test titles cite contract rows (`M01` …); no `specs/...` path literals in tests.

| Behaviour (FR / SC / row) | Layer | Test |
|---|---|---|
| Mono files: family `JetBrains Mono`, weight/style per name, cmap = the 202 shipped code points, pinned SHA-256 (which also pins "no layout features", research R2), total ≤ 60,000 bytes; `OFL.txt` unmodified (pinned SHA-256, contains "SIL OPEN FONT LICENSE Version 1.1" and "JetBrains Mono"); Inter's directory still holds its four files, its licence and the `jetbrains-mono` directory only (FR-002, FR-003, FR-013, SC-005; M10) | unit | `tests/unit/site/font-files.test.ts` (new `describe("JetBrains Mono files")`; update "holds exactly the four woff2 files and the licence" to allow the subdirectory) |
| Recipe pins 2.304 URL and SHA-256, fonttools 4.60.2, `--layout-features=`, `--no-hinting`, `--flavor=woff2`, `--unicodes` from `INTER_UNICODE_RANGE` (FR-003 no ligatures; M11) | unit | `tests/unit/site/font-files.test.ts`, `describe("mono subset recipe")` (imports the script's exports; network and `uvx` only under `import.meta.main`) |
| `MONO_FALLBACK_STACK` is Tailwind's default mono families with generic `monospace` last (FR-006; M03) | unit | `tests/unit/site/font-files.test.ts`, `describe("charset")` |
| Guard: every visual-subject source character is in all four Inter faces **and** all four mono faces or excluded; reports char, code point, file and family; self-check cases for an Inter-only miss and a mono-only miss (FR-014; M19) | unit | `tests/unit/site/font-coverage.test.ts` (extend `coveredSet` per family) |
| Config declares two families; the mono one has the four variants from `./src/assets/fonts/jetbrains-mono/`, `display: "swap"`, the shared `unicodeRange`, `fallbacks` = `MONO_FALLBACK_STACK` (last generic), `optimizedFallbacks: true` (FR-001, FR-005, FR-006; M01–M03 config side) | unit | `tests/unit/site/astro-config.test.ts` (`describe("fonts")`: `toHaveLength(1)` becomes 2; Inter assertions kept) |
| `--font-mono` is `var(--font-jetbrains-mono)`; body/heading tokens unchanged; body-font rule lists neither `pre` nor `code`; a rule gives `pre, code, kbd, samp` and their descendants `var(--font-mono)`; no new code font-size/colour/weight/style/feature/synthesis declaration; no `hl-*` rule has `font-style` or `font-weight`; no `@font-face` (FR-001, FR-004, FR-009; M07, M08) | unit | `tests/unit/site/design-tokens.test.ts` (replace "keeps pre and code in the body-font element rule (F08)" with the M08 tests; add M07) |
| Head: a second font `<style>` with four mono faces (swap, range, same-origin woff2), four `local("Courier New")` adjusted fallback faces, `--font-jetbrains-mono` order ending `monospace`; still exactly two preloads, both Inter; no off-origin URL (FR-005, FR-006, FR-007; M01–M05) | component | `tests/component/BaseLayout.test.ts` (`fontStyle()` selects the Inter style by family instead of expecting one style; new mono cases) |
| Build: `dist/_astro/fonts/` holds exactly eight hashed files, byte-identical to the eight committed ones; no font file elsewhere (FR-005, FR-011; M09) | build | `tests/build/local-site.test.ts` (update the existing describe; reads the L1 build, no new build) |
| Drawn faces on the fixture post: block code and a Shiki token → `JetBrainsMono-Regular`; inline code by computed weight/style; code in `em` → `-BoldItalic`; in `strong` → `-Bold`; `kbd`, `samp` → `-Regular`; `samp` in `em` → `-Italic`; paragraph, heading, code caption and Copy button still Inter (FR-001, FR-004, SC-001; M13). The existing "inline code is drawn in Inter" case is superseded by this. | E2E | `tests/e2e/fonts.spec.ts` (CDP `CSS.getPlatformFontsForNode`, research R8) |
| Equal advance: two code-block lines of equal length but different characters render at equal widths (Story 1 scenario 1; M14) | E2E | `tests/e2e/fonts.spec.ts`. Reason it is E2E: only the browser shows rendered widths; the unit file check proves the font, this proves the page uses it for every token. |
| Font requests per template: same-origin `/_astro/fonts/*.woff2`, each once; at most four Inter and four mono; a template drawing no `code/pre/kbd/samp` text requests no mono file (FR-005, FR-007, SC-002, SC-003; M15) | E2E | `tests/e2e/fonts.spec.ts` (extend the template loop; mono files identified by SHA-256 of the committed files). **Second layer over M04's head check, reason**: head markup cannot show which files the browser actually requests. |
| JS off: code block drawn by `JetBrainsMono-Regular` (FR-016; M16) | E2E | `tests/e2e/fonts.spec.ts` |
| Fonts blocked: code visible and drawn by a non-`JetBrainsMono-` face (FR-006, edge case; M17) | E2E | `tests/e2e/fonts.spec.ts` (extend the existing blocked-fonts test) |
| Served mono file: 200, `font/woff2`, exact immutable `Cache-Control`, security headers (FR-011; M12) | E2E | `tests/e2e/headers.spec.ts`: one new test. The existing font test reaches an Inter file through its preload link; mono files have no preload, so the new test takes a mono file URL from the home page's JetBrains Mono `@font-face` `src` and asserts the same headers. **Second layer over the unit `_headers` test, reason**: only the served response shows the rule reaches the new hashed files. |
| CSP: no violation, one more style hash, no new source (FR-010; M06) | E2E | **No new test**: `tests/e2e/headers.spec.ts` CSP test already filters `sha256-` hashes and listens for violations on every template; `tests/unit/site/csp.test.ts` already pins the config, which does not change. |
| Accessibility on every template, including reflow and scrollable code focus (FR-012, SC-006) | a11y | **No change**: `tests/e2e/a11y.spec.ts`, `blog.a11y.spec.ts`, `blog-fixture.a11y.spec.ts` run as they are (the fixture post is already in them). |
| Budget and CLS with code fonts: every template ≤ 153,600 bytes, CLS < 0.1, other limits unchanged (FR-006, FR-008, SC-004; M20) | budget | **No change** to `tests/e2e/budget.spec.ts`; it is the proof. Its `writing-post` template draws code. It is an existing gate, not a new test, so there is no red step; the implement phase records the `writing-post` annotation before and after the change in the PR body. |
| Shots wait for the mono faces a subject draws; the 8 `post-template` baselines regenerated, nothing else (FR-015, SC-007; M18) | visual | `tests/e2e/visual.spec.ts` `settleFonts` gains the `document.fonts.check(font, text)` wait for each `code, pre, kbd, samp` element (research R6) |
| Docker-generated Linux baselines pass CI first time (FR-015, SC-007) | visual (CI) | The PR's first `verify` run, opened without the `visual-baselines` label; recorded in the PR body. |

### Existing tests that change

| File | Change | Why |
|---|---|---|
| `tests/unit/site/design-tokens.test.ts` | "keeps pre and code in the body-font element rule (F08, FR-008)" replaced by the M08 tests | Spec supersedes 018 FR-008. |
| `tests/unit/site/font-files.test.ts` | Directory listing allows `jetbrains-mono/`; new mono describes | M10, M11 |
| `tests/unit/site/font-coverage.test.ts` | Covered set per family; message names the family; mono self-check | M19 |
| `tests/unit/site/astro-config.test.ts` | Two families | M01–M03 |
| `tests/component/BaseLayout.test.ts` | `fontStyle()` picks the Inter style by family (two font styles now); mono cases added | M01–M05 |
| `tests/build/local-site.test.ts` | Four → eight files, sources from both directories | M09 |
| `tests/e2e/fonts.spec.ts` | Inline-code-in-Inter case replaced by M13; request loop adds the per-family cap and the no-code rule; JS-off and blocked tests extended | M13–M17 |
| `tests/e2e/visual.spec.ts` | `settleFonts` code-face wait; header comment | M18 |
| `tests/e2e/blog-fixtures.spec.ts`, `blog-pagination.spec.ts` | **Expected no change**; re-run after the fixture sentence (reading time stays 1 minute; summary unchanged) | research R5 |
| `tests/e2e/geometry.spec.ts`, `blog.spec.ts` (code block scroll, Copy button) | **Expected no change**; wider glyphs can make more lines scroll; a failure is a regression to fix, not a threshold to loosen | risk |

### Visual baselines

- **Predicted changed images: exactly 8**, both platforms of the `post-template` subject:
  `post-template-{desktop,phone}-{dark,light}-visual-{darwin,linux}.png` (research R6 lists them).
  Predicted new or deleted images: **none**. The other 124 images must not change.
- macOS: `pnpm run test:visual:update`. Linux: `pnpm run test:visual:update:linux` in Docker
  (ask Don to start Docker Desktop with an `AskUserQuestion` whose question text carries the
  instruction). `git status tests/e2e/visual.spec.ts-snapshots/` must show exactly those 8 files
  modified; any other diff is a regression to fix, not a baseline to refresh.
- Linux drift lesson: issue #62's drift came from synthesized italic in the Docker image. Every
  code style here is a real committed face (both italics included, exercised by the fixture
  sentence), and shots wait for them, so no system font draws code in a shot. Feature 018's
  Docker baselines matched CI on the first run.
- First-run match: open the PR without the `visual-baselines` label; the first CI visual run must
  pass. On failure, inspect the CI diff images and investigate in this feature (FR-015); do not
  land CI-artifact baselines without telling Don.

### Docs

- `docs/testing.md` "Visual coverage" fonts paragraph (research R9).
- `docs/design-source.md`: new row for `--font-mono` (self-hosted JetBrains Mono 2.304, feature
  019, system monospace stack as fallback).
- `CLAUDE.md` and the pipeline skills: no change.

### Order of work (for tasks)

1. Charset `MONO_FALLBACK_STACK` test (RED), constant (GREEN).
2. Recipe and mono font-file tests (RED); `scripts/fonts/subset-jetbrains-mono.ts`; run it; commit
   the four files and `OFL.txt` (GREEN; sizes and hashes match research R2).
3. Guard extension with the mono self-check (seen to fail through the self-check), then green.
4. Tests for config, tokens, head, build output, fonts E2E (faces, widths, requests, JS off,
   blocked), served header assertion and the visual wait, all seen to fail.
5. Code: `astro.config.mjs` second family, `BaseLayout` `<Font />`, `global.css` token and rules,
   until step 4 passes.
6. Fixture sentence (research R5); re-run `blog-fixtures` and `blog-pagination`.
7. `a11y` and `budget`; record the `writing-post` total and CLS, and the convergence total, in the
   PR body. Stop and tell Don if any page is over 153,600 bytes.
8. Baselines: macOS, then Linux in Docker; exactly the 8 `post-template` images modified.
9. Docs and comments.
10. `[PREVIEW-CHECK]`: Don reviews a post with code on the preview in both themes and widths,
    confirms the look beside Inter, that pages without code fetch no mono file, and that the
    files are cached on reload.
11. PR without the `visual-baselines` label, with `major-change`, auto-merge off; confirm the
    first CI visual run passes.

### Risks and open questions

- **Wider code**: JetBrains Mono's 0.6 em advance is wider than Inter's average, so more code
  lines scroll sideways and inline code takes more room. Gated by the geometry, a11y reflow and
  scroll-focus checks; any failure is fixed, not loosened. Don judges the look on the preview.
- **Inline code becomes bold mono**: Typography sets inline code to weight 600, which already
  draws Inter Bold today; it will draw JetBrains Mono Bold. That is today's weight, not a change
  (FR-009), but bold monospace reads heavier than bold Inter; called out for the preview check.
- **Swap without preload**: code first paints in the fallback and swaps. The adjusted Courier New
  fallback has the same advance, but Linux visitors (no Courier New) see the system mono stack.
  CLS < 0.1 is the gate; if it fails, stop and report rather than adding a preload (FR-007).
- **Budget is an estimate in this plan** (research R4: writing-post ≈ 100,800 bytes); the
  `budget` run measures it. Large headroom, so low risk.
- **Docker vs CI**: removing system-font code text should help, not hurt; FR-015's
  investigate-then-stop path applies if the first run fails.
- **Parallel worktrees**: any sibling touching the `post-template` baselines, `every-part.mdx`,
  `global.css`, `BaseLayout.astro` or `astro.config.mjs` must not merge alongside this PR.

## Project Structure

### Documentation (this feature)

```text
specs/019-code-monospace-font/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R9, measured sizes, CSS mechanics, baseline list
├── data-model.md        # Phase 1: charset, stack, faces, recipe, config, tokens
├── quickstart.md        # Phase 1: validation run guide
├── contracts/
│   └── code-font.md     # Phase 1: rows M01–M20
├── checklists/
│   └── requirements.md  # From specify
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
astro.config.mjs                              # second fonts family
scripts/fonts/subset-jetbrains-mono.ts        # new one-off recipe
src/
├── assets/fonts/jetbrains-mono/              # new: 4 × JetBrainsMono-*.woff2, OFL.txt
├── layouts/BaseLayout.astro                  # second <Font />
├── lib/fonts/charset.ts                      # MONO_FALLBACK_STACK
└── styles/global.css                         # --font-mono, code rule
tests/
├── unit/site/font-files.test.ts              # mono files, recipe, stack
├── unit/site/font-coverage.test.ts           # both families
├── unit/site/astro-config.test.ts            # two families
├── unit/site/design-tokens.test.ts           # M07, M08
├── component/BaseLayout.test.ts              # mono head
├── build/local-site.test.ts                  # eight files
├── e2e/fonts.spec.ts                         # mono faces, widths, requests
├── e2e/headers.spec.ts                       # mono file served header
├── e2e/visual.spec.ts                        # code-face wait
├── e2e/visual.spec.ts-snapshots/             # 8 post-template images regenerated
└── fixtures/posts/valid/every-part.mdx       # code in em/strong, kbd, samp
docs/testing.md, docs/design-source.md
```

**Structure Decision**: the existing single Astro project. Mono files live in their own
subdirectory so Inter's directory, licence and existing tests keep their meaning, and each
family's licence sits beside its files.

## Complexity Tracking

No constitution violations to justify. The two custom pieces are the ones feature 018 already
justified under Principle IV: the one-off subset recipe (Astro does not subset local fonts),
now with a sibling script for the second family, and the coverage guard (no first-party check
exists), now checking both families.
