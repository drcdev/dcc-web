# Implementation Plan: Inter text in diagrams and the sharing image

**Branch**: `020-inter-diagram-social-text` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-inter-diagram-social-text/spec.md` (GitHub issue #76)

**Major change (Constitution Principle III): YES, confirmed.** The lettering of the project
diagrams and of the site-wide sharing image is part of the site's visual identity, and six
diagram boxes change shape to fit the wrapped labels. It adds no dependency, integration,
service, cost, CI workflow, Worker, `_headers` or contact-data change: the font step reuses the
pinned `uvx` fonttools recipe from feature 018 outside `package.json`, the tests read fonts with
`fontace`, which Astro already installs, and `package.json` gains only a script alias. Auto-merge
stays off, the PR carries the `major-change` label, `tasks.md` carries a `[PREVIEW-CHECK]` task
(diagrams in Safari and one other browser, and the sharing image), and the PR body says why.

## Summary

Each diagram SVG carries its own Inter: an inline `<style>` with two data-URI `@font-face` rules
(Regular 400, Bold 700) holding only the characters its labels use, cut from the committed
`src/assets/fonts/Inter-{Regular,Bold}.woff2`. The root `<svg>` asks for `Inter, sans-serif`;
labels stay real `<text>`. Labels are edited by hand in the SVG, then
`pnpm run fonts:diagrams -- <file>` (`scripts/fonts/embed-diagram-fonts.ts`, `uvx` fonttools)
rewrites the font block. Nothing runs at build time; Astro serves the SVG byte for byte. Six
detail labels that do not fit their 300-unit boxes with 16 units each side in Inter wrap onto two
lines and their boxes grow (the sixth found by research R8, now listed in the spec too). A unit test holds every
SVG with text under `src/content/` to the contract (Inter only, glyphs present in the embedded
cmaps, licence notice, self-contained, at most 16 KB); an E2E test proves in Chromium that the
faces load and the labels fit. The sharing-image script inlines `Inter-Bold.woff2` through a
data-URI `@font-face`, names no other font, and refuses to write if the face does not load; a
unit test checks its exported HTML, and the PNG is re-rendered once by hand.

## Technical Context

**Language/Version**: TypeScript (strict), Node 24 (`.nvmrc`), Astro current stable as pinned in
`package.json`; Python fonttools 4.60.2 through `uvx` for the hand-run font step only

**Primary Dependencies**: none new. Existing: Astro `<Image />` (diagrams), Playwright
(`@playwright/test`, already a dev dependency; E2E and the sharing-image script), Vitest,
`fontace` (Astro's own dependency, reached through `createRequire` as
`tests/unit/site/font-coverage.test.ts` does). Dev-time tool, not in `package.json`:
`uvx --from "fonttools[woff]==4.60.2"` (same pin as 018, `uv` 0.12.19 checked present)

**Storage**: committed files only (`src/content/**/*.svg`, `public/og-default.png`)

**Testing**: Vitest `unit` project; Playwright `e2e` project; existing `budget`, `a11y` and
`visual` projects unchanged

**Target Platform**: static assets on Cloudflare Workers; browsers rendering SVG-as-image
(Chromium, WebKit, Gecko)

**Project Type**: static Astro site (single project)

**Performance Goals**: every page template stays within the unchanged budget (150 KB total
transfer, LCP ≤ 2.5 s, CLS < 0.1, long tasks ≤ 200 ms, JS ≤ 10 KB)

**Constraints**: each diagram SVG ≤ 16,384 bytes; no request beyond the SVG itself; CSP not
loosened; Inter glyphs only from the 018 files; no build-time step; no new npm dependency

**Scale/Scope**: 5 published diagrams + 1 template starter; 1 sharing image; 6 wrapped labels

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1. No violation; nothing in Complexity
Tracking.*

| Principle | How this plan complies |
|---|---|
| I. Test-First | Every behaviour has a test written first and seen to fail, at one named layer (Test placement below). On today's files the unit diagram test fails D01 (root font-family), D04 (no block) and D07; the E2E test fails D11 (no Inter face) and D12 (six labels too wide); the og test fails O01/O02 (no exports). Tasks order tests before the code they cover. |
| II. Automated Release Gate | No check is skipped, disabled or weakened; the budget limits are untouched (FR-010). New checks join the existing `test:unit` and `test:e2e:parallel` steps, which also run on content-only PRs (research R7), so a later label edit without the script fails CI. Full `verify` before the PR. |
| III. Human Review | **Major**: visual identity (diagram lettering, six box shapes, sharing image). Auto-merge off, `major-change` label, `[PREVIEW-CHECK]` task, reason in the PR body; the sixth wrapped label and the two moved boxes (research R8) are called out for Don. |
| IV. First-Party Before Custom | Astro Docs MCP consulted; each option and page in research R1. **Page fonts**: Astro Fonts API (kept; cannot reach an SVG shown as an `<img>`). **Diagram delivery**: `<Image />` (kept; SVG sources pass through unprocessed with `image.dangerouslyProcessSVG` false, confirmed on today's build). **SVG components** (inline): rejected, fails FR-002 and changes the content model. **`experimental.svgOptimizer`**: components only, and cannot shrink a font. **OG via `fontData` + Satori**: rejected, three new dependencies and a build step. **Cloudflare**: Cloudflare Fonts only rewrites Google Fonts links in HTML; Images or Browser Rendering would add a service for a file that changes once; plain static assets used. **Subsetting**: no first-party option, so the 018 `pyftsubset` recipe is reused (custom by necessity). **Why nothing runs at build time**: it would need `uv`/Python in Workers Builds and CI or a new JS subsetter dependency, for files that change rarely; the gate catches drift. **Why no new npm dependency**: `uvx` sits outside `package.json` as in 018, `fontace` ships with Astro, Playwright is already present. |
| V. Static by Default | No client JavaScript; diagrams remain prerendered `<img>` elements; text readable with JS off (the figure caption and alt text are unchanged). |
| VI. Content as Files | Diagrams stay committed SVG files edited by hand; the only extra step is one script on the edited file (FR-007), documented in `docs/projects.md`. No schema change. |
| VII. Private Data | Not touched. The fonts are inside the image, so no request leaves the site's origin. |
| VIII. Cloudflare Best Practices | Static assets only; no Worker, D1, Turnstile, Cron, `wrangler.jsonc` or `_headers` change; nothing in the dashboard. The SVG response keeps the `/*` CSP (`frame-ancestors`, `object-src`, `base-uri`), which does not restrict `data:` fonts inside the image document. |
| IX. Cost Ceiling | Expected new monthly cost: **$0**. No service or runtime dependency; six SVG files grow by roughly 7 KB each, served from Workers static assets within the free plan; the font tool runs on a laptop. |
| X. Accessible, Fast and Private | Alt text, `aria-label` and the visible description are unchanged; label size and weight unchanged and the diagrams keep their own light background, so contrast is unchanged; `a11y` runs as is. Budget unchanged and measured before and after (FR-011 table). No third-party request. |
| XI. Spec Kit Workflow | Spec Kit branch and directory, one feature. Files touched: the six SVGs, `scripts/fonts/*`, `scripts/og-image/render.ts`, `public/og-default.png`, `package.json` (`scripts` only), `docs/projects.md`, `docs/testing.md`, new tests. A sibling worktree that edits a diagram or `docs/projects.md` must merge first or after; this PR merges `main` before opening and re-runs the font script on any diagram that changed. No visual baseline changes, so no baseline conflict. |
| Dev workflow: Astro decisions cite docs | research.md R1 names each Astro docs page. |
| Dev workflow: tests before implementation | Order of work below. |
| Dev workflow: test placement | One primary layer per behaviour, from `docs/testing.md` "Where a test goes"; no second layer is used (Test placement). |
| Dev workflow: scope | Restyling diagrams, per-page sharing images, a monospace font, card-image right-sizing and a long cache for `/_astro/` stay out (Follow-up). |
| Dev workflow: plain language | Label wording is unchanged; new docs text and error messages are plain. |

## Design

### Source changes

| File | Change |
|---|---|
| `scripts/fonts/diagram-fonts.ts` (new) | Pure module: label extraction, font block builder and rewriter, face parser, `diagramProblems()` (D01 to D08), constants. Contract: [scripts.md](./contracts/scripts.md). |
| `scripts/fonts/embed-diagram-fonts.ts` (new) | The hand-run script (S01 to S08): subset the two committed faces to the file's label characters with `uvx` fonttools, write the block, check, print sizes. |
| `scripts/fonts/subset-inter.ts` | No behaviour change; its exported `FONTTOOLS_SPEC` is imported by the new script. |
| `package.json` | `scripts`: `"fonts:diagrams": "node scripts/fonts/embed-diagram-fonts.ts"`. No dependency change. |
| `src/content/projects/images/*/architecture.svg` (5) | Root `font-family="Inter, sans-serif"`; `font-family` removed from the `<g>`; six wrapped labels and box changes per [data-model.md](./data-model.md#wrapped-labels-and-box-changes); font block written by the script. |
| `src/content/projects/images/template/diagram.svg` | Root `font-family="Inter, sans-serif"`; `font-family="sans-serif"` removed from the two `<text>`; font block written by the script. |
| `scripts/og-image/render.ts` | `OG_FONT_FILE`, pure `ogHtml(fontBase64)`, inline `@font-face`, `font-family: Inter`, fonts-loaded check, browser launch under `import.meta.main` (O01 to O04). |
| `public/og-default.png` | Re-rendered once by hand with the new script. |
| `docs/projects.md`, `docs/testing.md` | See Docs. |

### Resolved design points

- **Subset source**: the committed `src/assets/fonts/Inter-Regular.woff2` and
  `Inter-Bold.woff2`, not the Inter 4.1 archive (research R2).
- **Glyphs per face**: the union of the diagram's label characters plus space, in both faces
  (research R3).
- **Family and fallback**: `@font-face` family `Inter`; root `font-family="Inter, sans-serif"`;
  the gate accepts exactly that stack and no named system family (research R4).
- **OFL attribution**: copyright kept in name ID 0 of each subset, plus a human-readable XML
  comment directly before the `<style data-inter-subset="">` naming Inter 4.1, the copyright
  holder, the SIL OFL 1.1 with its address (`https://openfontlicense.org`) and
  `src/assets/fonts/LICENSE.txt` (research R5, contract D07).
- **Script**: `scripts/fonts/embed-diagram-fonts.ts`, run as
  `pnpm run fonts:diagrams [-- <file.svg> ...]` (no argument: every SVG with text under
  `src/content/`).
- **Missing-glyph detection**: unit test decodes each embedded face and reads its cmap with
  `fontace`, then checks every label character (research R6, contract D05).
- **Files covered**: every `.svg` under `src/content/` with a `<text>` element (research R7).

### Test placement

Each behaviour has one primary layer, the cheapest that can observe it (`docs/testing.md` "Where
a test goes"). Test titles cite contract rows (`D01`, `S03`, `O02` …). No test names a real
project or uses a `specs/...` path literal; diagram files are found by globbing `src/content/`.

| Behaviour (FR / SC / row) | Layer | Test |
|---|---|---|
| Every SVG with text under `src/content/` asks only for `Inter, sans-serif`, uses weights 400/700 only, has a well-formed two-face block whose fontace weights match, carries the licence notice, references nothing outside itself and is ≤ 16,384 bytes; at least one file and the template starter are found (FR-001, FR-003a, FR-004, FR-008, FR-009a, FR-012, FR-013, SC-004; D01 to D04, D06 to D08) | unit | `tests/unit/site/diagram-fonts.test.ts` (new; runs `diagramProblems()` on each file and expects `[]`) |
| Every label character is in both embedded faces' cmaps; message names file and character (FR-009, SC-004; D05) | unit | `tests/unit/site/diagram-fonts.test.ts` (same file, its own `it`) |
| The guard can fail: inline SVG strings with a system font, a missing glyph, no block and an over-size body each give the matching message (SC-004; D10) | unit | `tests/unit/site/diagram-fonts.test.ts`, `describe("guard self-check")` (the missing-glyph case builds its block from the committed Regular/Bold files, so it needs no `uvx`) |
| `withFontBlock()` inserts the block after the root start tag, replaces an existing block and leaves every other byte unchanged; `labelText()` decodes entities and `<tspan>` text (FR-003, FR-007; S04) | unit | `tests/unit/site/diagram-fonts.test.ts`, `describe("font block")` |
| `diagramSubsetArgs()` uses the committed WOFF2 inputs, `--text-file`, `--layout-features=kern`, `--no-hinting`, `--name-IDs=0,1,2,3,4,5,6`, `--flavor=woff2`, and the shared `FONTTOOLS_SPEC` (FR-007, FR-013; S03) | unit | `tests/unit/site/diagram-fonts.test.ts`, `describe("embed script")` (imports exports only; `uvx` runs only under `import.meta.main`) |
| Opened directly in Chromium (no Inter installed on CI), each diagram's labels are drawn by its embedded Inter faces at the weights they use (FR-001, FR-002, SC-001; D11) | E2E | `tests/e2e/diagram-fonts.spec.ts` (new; `page.goto` of each file's `file://` URL, `document.fonts.ready`, `FontFace.status`, `document.fonts.check()`). Only a browser shows that the data-URI face actually loads and applies. |
| Each label sits inside its box with ≥ 16 units each side and no two labels overlap (FR-003, edge case "wider or narrower glyphs"; D12) | E2E | `tests/e2e/diagram-fonts.spec.ts` (`getBBox()` against the containing `<rect>`). Only real shaping shows the width. |
| `OG_FONT_FILE` is `src/assets/fonts/Inter-Bold.woff2` and exists; `ogHtml()` holds one `@font-face` for Inter 700 whose data URI is that file's base64; every `font-family` is `Inter`; no `SYSTEM_FONT_STACK` entry or generic family appears; size, colours and wording as today (FR-005, FR-006, SC-002; O01 to O03) | unit | `tests/unit/site/og-image.test.ts` (new; imports the module without launching a browser) |
| Sharing metadata still names `/og-default.png` and its alt text (FR-005) | component | **No change**: `tests/component/Seo.test.ts` and `NotFound.test.ts` already assert it. |
| Committed PNG shows Inter Bold (SC-002, SC-006) | — | `[PREVIEW-CHECK]` (Don), per the spec; a pixel comparison of a hand-rendered PNG would be machine-dependent. |
| Budget unchanged on every template, project story included (FR-010, SC-003) | budget | **No change**: `tests/e2e/budget.spec.ts` runs as is and is the proof; its project-story figure is copied into the FR-011 table. |
| No new accessibility violation (SC-005) | a11y | **No change**: `tests/e2e/a11y.spec.ts` and the portfolio a11y specs run as is. |
| No visual baseline changes (SC-005) | visual | **No change**: the fixture projects use a raster sample picture, so the visual project must pass with the committed baselines; any diff is a regression (CLAUDE.md "Visual baselines"). |
| CSP not loosened, no extra request (FR-012) | unit | Covered by D08 above (the file is self-contained); `public/_headers` and the CSP config are not edited, and `headers.test.ts` / `csp.test.ts` keep holding them. |

### Existing tests and lists that change

- None expected. `tests/unit/site/font-files.test.ts` keeps checking the four committed faces,
  which this feature reads but does not change (FR-013). If `tests/unit/site/config-files.test.ts`
  or a docs-structure test pins `package.json` scripts or the `docs/projects.md` headings, it is
  updated in the same task as the change it covers.

### Visual baselines

None change. The visual project shoots only the shell, the not-found page and fixture subjects;
the fixture projects' pictures are raster files. No baseline is regenerated in this PR; any diff
in the visual run is a regression to fix.

### Docs

- `docs/projects.md`: under the `diagram` kind, a short "Text in a diagram" part: write labels as
  `<text>` in the SVG with the root `font-family="Inter, sans-serif"`; after adding or changing a
  label run `pnpm run fonts:diagrams -- <file>` (needs `uv`); the gate fails naming the file and
  character if you forget; keep each file under 16 KB; leave 16 units each side of a label inside
  its box and wrap onto a second line rather than shrinking or rewording (34 units between
  lines, the box 34 units taller per line); when an edit changes what the diagram says, update
  the alt text, the SVG's `aria-label` and the `description` in the same change. This is where
  FR-007 documents the editing path.
- `docs/testing.md`: the Fonts paragraph gains the diagram unit and E2E tests and the og unit
  test, and says the gate checks the og script, not the PNG: re-run
  `node scripts/og-image/render.ts` and commit `public/og-default.png` whenever the script
  changes (the documented re-render step of FR-006). The script's header comment says the same.

### FR-011: sizes before and after

Before figures measured on 2026-10-04 at commit `bb814bb` (research R10). The after columns are
filled in by the implement phase; the gzip figure is `gzip -9c | wc -c`, an estimate of the
compressed transfer.

| File | Before bytes | Before gzip | After bytes | After gzip |
|---|---|---|---|---|
| `images/cadence/architecture.svg` | 2,170 | 776 | 10,384 | 6,836 |
| `images/drcdev-github-io/architecture.svg` | 1,774 | 672 | 10,456 | 7,191 |
| `images/flux/architecture.svg` | 1,821 | 696 | 9,924 | 6,711 |
| `images/focus-pocus/architecture.svg` | 1,472 | 585 | 9,634 | 6,702 |
| `images/tempo/architecture.svg` | 2,119 | 740 | 10,496 | 7,001 |
| `images/template/diagram.svg` (never published) | 689 | 334 | 4,265 | 2,916 |
| `public/og-default.png` | 15,938 | n/a | 17,171 | n/a |

| Page (budget spec, simulated mobile) | Before total transfer | After total transfer | Limit |
|---|---|---|---|
| project-story template (picked story) | 64,933 bytes (LCP 732 ms, CLS 0, JS 0) | 65,263 bytes (LCP 680 ms, CLS 0, JS 0); +330 bytes of run-to-run variation, no diagram request counted (lazy-loaded below the fold) | 153,600 bytes |

The diagram is lazy-loaded far below the fold at 390×844, so it is most likely outside both
figures; the after run notes whether a diagram request appears. Prototype estimate: about 9 to
10 KB per diagram after (two subsets about 6.4 KB as base64 plus the markup).

### Order of work (for tasks)

1. Tests first, seen to fail: `tests/unit/site/diagram-fonts.test.ts`,
   `tests/e2e/diagram-fonts.spec.ts`, `tests/unit/site/og-image.test.ts`.
2. `scripts/fonts/diagram-fonts.ts` (pure module) until the self-check and font-block tests pass.
3. `scripts/fonts/embed-diagram-fonts.ts` and the `package.json` alias.
4. Hand edits to the six SVGs: root `font-family`, remove the old declarations, the six wraps and
   box changes.
5. Run `pnpm run fonts:diagrams` on all six; the unit and E2E diagram tests pass; re-run once and
   confirm no diff (S07).
6. `scripts/og-image/render.ts` refactor; og unit test passes; run it once and commit the PNG.
7. Docs.
8. Measure after figures and fill the FR-011 table.
9. `verify:quick`, then the full gate (ask Don first), then the PR (major, auto-merge off,
   `[PREVIEW-CHECK]`).

### Risks and open questions

- **Six wraps, not five.** The 16-unit rule also catches Flux "Handlebars, Tailwind v4" (272.7
  units, 13.6 each side). FR-003's rule is binding, so it wraps; the PR body tells Don. The
  closest fit left unwrapped is Flux "posts, members, routes" with 16.35 units each side; the
  E2E check would catch it if Chromium's shaping differed.
- **Two boxes move.** Growing the Cadence Apple Watch and Tempo Apple Health boxes downward would
  leave them 6 units from the canvas edge, so each moves up 24 units (arrows unchanged). Called
  out in the PR body.
- **Other engines.** The E2E check runs in Chromium only. WebKit and Gecko support data-URI WOFF2
  fonts inside SVG images, but the `[PREVIEW-CHECK]` (T032) includes opening a diagram in
  Safari and Firefox to confirm (SC-001).
- **Downloadable fonts turned off** (iOS Lockdown Mode, some privacy settings): labels fall back
  to the generic `sans-serif`, by design (research R4).
- **fontace output shape**: the tests rely on `unicodeRangeArray` and `weight`, as
  `font-coverage.test.ts` already does with `unicodeRangeArray`; if `weight` is not reported
  for a WOFF2 buffer, D04 reads the `OS/2` weight via fontace's other fields or drops to checking
  the rule order, noted in the test comment.
- **Hand-rendered PNG** pixels differ slightly between machines (antialiasing), but the face no
  longer does; the PNG is checked by eye on the preview.

## Project Structure

### Documentation (this feature)

```text
specs/020-inter-diagram-social-text/
├── plan.md              # This file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── diagram-svg.md   # Phase 1: diagram file contract and gate rows D01–D12
│   └── scripts.md       # Phase 1: embed script, pure module and og script rows
├── checklists/
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
scripts/
├── fonts/
│   ├── subset-inter.ts            # unchanged (exports FONTTOOLS_SPEC)
│   ├── diagram-fonts.ts           # new, pure
│   └── embed-diagram-fonts.ts     # new, hand-run
└── og-image/
    └── render.ts                  # changed

src/
├── assets/fonts/                  # unchanged (source of the subsets)
├── lib/fonts/charset.ts           # unchanged (codePointsOf, SYSTEM_FONT_STACK)
└── content/projects/images/
    ├── <project>/architecture.svg # 5 changed
    └── template/diagram.svg       # changed

public/og-default.png              # re-rendered

tests/
├── unit/site/diagram-fonts.test.ts  # new
├── unit/site/og-image.test.ts       # new
└── e2e/diagram-fonts.spec.ts        # new

docs/projects.md, docs/testing.md   # changed
package.json                        # scripts: fonts:diagrams
```

**Structure Decision**: single Astro project; the font logic sits beside 018's recipe in
`scripts/fonts/`, and the tests in the existing `tests/unit/site/` and `tests/e2e/` folders.

## Complexity Tracking

No Constitution Check violations.

## Follow-up work (out of scope)

- A monospace code font (carried over from 018).
- Right-sizing card and feature images, then lowering the 150 KB budget (carried over from 018).
- Per-page sharing images.
- A long cache lifetime for all fingerprinted `/_astro/` files (carried over from 018).
- Restyling the diagrams (colours, dark-mode variants, new layouts) beyond the six fits.
- Running the diagram E2E check in WebKit and Firefox as well as Chromium.
