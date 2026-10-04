---
description: "Task list for Inter text in diagrams and the sharing image"
---

# Tasks: Inter text in diagrams and the sharing image

**Input**: `specs/020-inter-diagram-social-text/` (plan.md, spec.md, research.md, data-model.md, contracts/diagram-svg.md, contracts/scripts.md, quickstart.md)

**Tests**: MANDATORY (Constitution Principle I). Every test task is written before the code it covers, names its one primary layer from `docs/testing.md` "Where a test goes", and MUST be seen to fail first. Test titles cite contract rows (D01, S03, O02 ...). No test names a real project or uses a `specs/...` path literal; diagram files are found by globbing `src/content/`.

**Major change**: yes (Principle III). Auto-merge stays off; the PR carries the `major-change` label.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 diagram labels match the page (P1), US2 sharing image in Inter (P2), US3 new and edited diagrams stay in Inter (P3)
- Run `node -v` first; if it is not the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the same Bash command as the toolchain call.

## Phase 1: Setup

- [x] T001 Confirm the baseline: run `node -v`, check `uv --version` works (needed by `uvx`), and confirm `src/assets/fonts/Inter-Regular.woff2`, `Inter-Bold.woff2` and `LICENSE.txt` exist and `scripts/fonts/subset-inter.ts` exports `FONTTOOLS_SPEC`. Re-measure the byte and `gzip -9c | wc -c` sizes of the six SVGs under `src/content/projects/images/` and of `public/og-default.png` against the "Before" columns of the FR-011 table in `specs/020-inter-diagram-social-text/plan.md`; fix the table if a figure differs.
- [x] T002 [P] Check whether `tests/unit/site/config-files.test.ts` or any docs-structure test under `tests/unit/` pins `package.json` scripts or `docs/projects.md` headings; list the ones that T012 and T024 must update in the same task as their change (plan "Existing tests and lists that change").

## Phase 2: Foundational (tests first, seen to fail)

**Purpose**: all three new test files exist and fail for the right reason before any implementation. No implementation task in later phases starts until its covering test here has been seen red.

- [x] T003 [P] Unit layer: write `tests/unit/site/diagram-fonts.test.ts`, `describe("diagram files")`: glob every `.svg` under `src/content/` containing `<text`, require at least one file plus the template starter, and for each assert via `diagramProblems()` from `scripts/fonts/diagram-fonts.ts` (fontace reached through `createRequire` as `tests/unit/site/font-coverage.test.ts` does, passed in as `readFace`) rules D01 (root `font-family="Inter, sans-serif"`), D02 (no other `font-family`, no `style` attribute), D03 (weights 400/700, no `font-style`), D04 (one `<style data-inter-subset>`, two `@font-face` rules, fontace weights 400 and 700), D06 (at most 16,384 bytes), D07 (licence comment naming Inter 4.1, The Inter Project Authors, SIL Open Font License 1.1, `https://openfontlicense.org` and `src/assets/fonts/LICENSE.txt`), D08 (self-contained). Messages start with the repo-relative file path. Unit is the cheapest layer: these are static file rules. Run it and SEE IT FAIL (today: the module does not exist and D01, D04, D07 would fail).
- [x] T004 Unit layer: in `tests/unit/site/diagram-fonts.test.ts`, add its own `it` for D05: every label character (decoded entities; U+0020 and line breaks excepted) is in the cmap of both embedded faces (`unicodeRangeArray`), message `<file>: U+XXXX <char> is not in the embedded Inter <Regular|Bold> glyphs; run pnpm run fonts:diagrams -- <file>`. Note in a comment how weight is read if fontace omits it for WOFF2 (plan Risks). Same file as T003, so after it. Seen to fail first.
- [x] T005 Unit layer: in `tests/unit/site/diagram-fonts.test.ts`, add `describe("guard self-check")` (D10): inline SVG strings with a system font, a missing glyph (block built from the committed Regular/Bold files so no `uvx` is needed), no block, and an over-size body each yield the matching message (the gate can fail). Seen to fail first.
- [x] T006 Unit layer: in `tests/unit/site/diagram-fonts.test.ts`, add `describe("font block")` (S04): `withFontBlock()` inserts the block directly after the root start tag, replaces an existing block, and leaves every other byte unchanged; `labelText()` decodes entities and `<tspan>` text. Seen to fail first.
- [x] T007 Unit layer: in `tests/unit/site/diagram-fonts.test.ts`, add `describe("embed script")` (S03): `diagramSubsetArgs()` exported from `scripts/fonts/embed-diagram-fonts.ts` uses the committed WOFF2 inputs, `--text-file`, `--layout-features=kern`, `--no-hinting`, `--name-IDs=0,1,2,3,4,5,6`, `--flavor=woff2` and the shared `FONTTOOLS_SPEC`. Imports exports only; `uvx` runs only under `import.meta.main`. Seen to fail first.
- [x] T008 [P] E2E layer: write `tests/e2e/diagram-fonts.spec.ts` (D11 and D12). Only a real browser shows that the data-URI face loads and how wide shaped text is, which is why this is E2E and not unit. For every diagram file found by globbing `src/content/`, `page.goto` its `file://` URL, await `document.fonts.ready`, assert an `Inter` `FontFace` is `loaded` for every weight its labels use and `document.fonts.check()` is true per label at its size and weight (D11); then assert each label's `getBBox()` lies inside the containing `<rect>` with at least 16 units each side and no two labels overlap (D12). Assertions name the file and label. Follow existing e2e spec conventions and the `test:e2e:parallel` setup. Seen to fail first (today: no Inter face, six labels too wide).
- [x] T009 [P] Unit layer: write `tests/unit/site/og-image.test.ts` (O01 to O03): import `scripts/og-image/render.ts` without launching a browser; assert `OG_FONT_FILE` is `src/assets/fonts/Inter-Bold.woff2` and exists; `ogHtml(base64)` holds exactly one `@font-face` (family Inter, weight 700, normal, WOFF2 data URI equal to that file's base64); every `font-family` is `Inter`; no `SYSTEM_FONT_STACK` entry (from `src/lib/fonts/charset.ts`) or generic family appears; size 1200x630, colours `#1c1a29` and `#d68844`, 112px bold, letter-spacing -0.02em, 160x8 rule, 96px padding unchanged. Unit is cheapest because `ogHtml` is pure. Seen to fail first (no exports today).

## Phase 3: User Story 1 - Diagram labels match the page (P1)

**Goal**: all five published diagrams and the template starter draw in embedded Inter, with wording, colours and arrows unchanged and six labels wrapped.

**Independent test**: `tests/unit/site/diagram-fonts.test.ts` (D01 to D08, S03, S04) and `tests/e2e/diagram-fonts.spec.ts` (D11, D12) pass; the FR-011 after-sizes are filled in.

- [x] T010 [US1] Create the pure module `scripts/fonts/diagram-fonts.ts` per `contracts/scripts.md`: `labelText`, `fontBlock`, `withFontBlock`, `embeddedFaces`, `diagramProblems(svg, file, readFace)` (D01 to D08 messages), `DIAGRAM_FONT_FAMILY`, `DIAGRAM_MAX_BYTES`; no side effects, imports only `node:` built-ins and `src/lib/fonts/charset.ts`. Run T005 and T006 until they pass (the per-file cases in T003 and T004 stay red until T017).
- [x] T011 [US1] Create `scripts/fonts/embed-diagram-fonts.ts` per `contracts/scripts.md` S01 to S08: no-argument run covers every `.svg` with `<text` under `src/content/`; label characters plus U+0020 to a temp text file; export `diagramSubsetArgs()` using `FONTTOOLS_SPEC` from `scripts/fonts/subset-inter.ts`; run `uvx` pyftsubset per face; `withFontBlock`; run D01 to D08 before writing and write nothing on failure; print bytes before and after; `uvx not found. Install uv: brew install uv` error; all side effects under `if (import.meta.main)`. T007 passes.
- [x] T012 [US1] Add `"fonts:diagrams": "node scripts/fonts/embed-diagram-fonts.ts"` to the `scripts` of `package.json` (no dependency change); update any test listed in T002 that pins the script list in the same task.
- [x] T013 [P] [US1] Hand-edit `src/content/projects/images/cadence/architecture.svg`: root `font-family="Inter, sans-serif"`, remove the old `font-family` from the `<g>`, and per `data-model.md` "Wrapped labels and box changes" wrap On-device data (rect y 150, height 214, baselines 222/262/296/330, "local store and" / "write queue" / "works offline"), Supabase (rect 40/194, baselines 108/148/182, "sync and AI routines," / "when online") and move Apple Watch up 24 (rect y 256, height 194, baselines 324/364/398, "via a Shortcuts" / "handoff, optional"). Each line is its own `<text>` at the box's centre x; arrows and wording unchanged.
- [x] T014 [P] [US1] Hand-edit `src/content/projects/images/tempo/architecture.svg`: root `font-family="Inter, sans-serif"`, remove the old `<g>` declaration, and move the Apple Health box up 24 (rect y 256, height 194, baselines 324/364/398, "or Health Connect," / "optional"); arrows unchanged.
- [x] T015 [P] [US1] Hand-edit `src/content/projects/images/flux/architecture.svg`: root `font-family`, remove the old declaration, and wrap Flux theme (rect 150/214, "Handlebars," / "Tailwind v4" / "two newsletter streams") and AI analysis (rect 150/214, "Supabase Edge" / "Functions" / "optional, member tiers"); arrows unchanged.
- [x] T016 [P] [US1] Hand-edit `src/content/projects/images/drcdev-github-io/architecture.svg`, `src/content/projects/images/focus-pocus/architecture.svg` and the template `src/content/projects/images/template/diagram.svg`: root `font-family="Inter, sans-serif"` and remove the old `font-family` declarations (the template's two `<text>` lose `font-family="sans-serif"`); geometry untouched.
- [x] T017 [US1] Run `pnpm run fonts:diagrams` (no arguments) over all six SVGs; confirm each prints sizes and none exceeds 16,384 bytes; re-run and confirm `git diff` shows no further change (S07, byte-identical). Review `git diff --stat` and the SVG diffs: only the six SVGs changed among images (FR-014; `public/og-default.png` changes later in T020); every SVG keeps its `width`, `height`, `viewBox`, `role`, `aria-label`, colours and wording byte for byte, and the drcdev.github.io, Focus Pocus and template files differ only in `font-family` and the font block (FR-003). Then run `tests/unit/site/diagram-fonts.test.ts` and `tests/e2e/diagram-fonts.spec.ts` and see them pass. If D12 flags another label (for example Flux "posts, members, routes" at 16.35 units), wrap it per FR-003b, re-run the font step, and note it for the PR body.
- [x] T018 [US1] Fill in the "After bytes" and "After gzip" columns of the FR-011 table in `specs/020-inter-diagram-social-text/plan.md` for the six SVGs, from the files written in T017 (`wc -c`, `gzip -9c | wc -c`).

**Checkpoint**: US1 is shippable on its own.

## Phase 4: User Story 2 - Sharing image lettering in Inter (P2)

**Goal**: `public/og-default.png` shows "Don Coleman" in Inter Bold, and re-rendering always gives Inter.

**Independent test**: `tests/unit/site/og-image.test.ts` passes; the script refuses to write if Inter does not load; the PNG is checked by eye (T031).

- [x] T019 [US2] Refactor `scripts/og-image/render.ts` per O01 to O04: export `OG_FONT_FILE` and pure `ogHtml(fontBase64)` with the inline `@font-face` (Inter 700) and `font-family: Inter` on `body`, no system or generic family, look unchanged (O03); move the browser launch under `if (import.meta.main)` with dynamic `import("@playwright/test")`, await `document.fonts.ready`, throw `Inter Bold did not load; the sharing image was not written` unless an `Inter` 700 `FontFace` in `document.fonts` has status `loaded` and `document.fonts.check("700 112px Inter", "Don Coleman")` is true (O04; `check()` alone can pass with no matching face), then write `public/og-default.png`. Update the header comment: re-run `node scripts/og-image/render.ts` and commit the PNG whenever this script changes. T009 passes.
- [x] T020 [US2] Run `node scripts/og-image/render.ts` once by hand (nvm per the toolchain note), confirm it exits 0, and commit the re-rendered `public/og-default.png` (1200x630). View the image to confirm the lettering is Inter Bold with the same size, colours and position.
- [x] T021 [US2] Component layer, no new test: run `tests/component/Seo.test.ts` and `tests/component/NotFound.test.ts` to confirm the sharing metadata still names `/og-default.png` and its alt text (FR-005); no edit expected.
- [x] T022 [US2] Fill in the `public/og-default.png` "After bytes" cell of the FR-011 table in `specs/020-inter-diagram-social-text/plan.md` (`wc -c`).

**Checkpoint**: US2 complete; independent of US1.

## Phase 5: User Story 3 - New and edited diagrams stay in Inter (P3)

**Goal**: a later label edit or a new diagram without the script step fails the gate with a clear message, and the editing path is documented.

**Independent test**: the guard cases from T003 to T005 pass on the real files and the self-check; the docs name the path; the template starter passes.

- [ ] T023 [US3] Prove the gate fails on a real edit: change one label in one diagram to use a character absent from the embedded faces, run `tests/unit/site/diagram-fonts.test.ts`, confirm the message names the file and character and tells the editor to run `pnpm run fonts:diagrams -- <file>`, then revert the edit and confirm `git status` shows no leftover change.
- [ ] T024 [P] [US3] Documentation: in `docs/projects.md`, under the `diagram` kind, add a short "Text in a diagram" part per plan "Docs": labels as `<text>` with root `font-family="Inter, sans-serif"`; after adding or changing a label run `pnpm run fonts:diagrams -- <file>` (needs `uv`); the gate fails naming file and character; keep each file under 16 KB; leave 16 units each side of a label and wrap onto a second line rather than shrink or reword (34 units between lines, box 34 units taller per line); update alt text, `aria-label` and `description` when an edit changes what the diagram says. Update any docs-structure test from T002 in the same task.
- [ ] T025 [P] [US3] Documentation: in `docs/testing.md`, extend the Fonts paragraph with the diagram unit test, the diagram E2E test and the og unit test, and say the gate checks the og script, not the PNG: re-run `node scripts/og-image/render.ts` and commit `public/og-default.png` whenever the script changes.

## Phase 6: Polish and verification

- [ ] T026 Budget layer, no new test: run the existing `tests/e2e/budget.spec.ts` unchanged and confirm every template passes at the 150 KB limit; copy the project-story total transfer figure (and whether a diagram request appears) into the "After" cell of the second FR-011 table in `specs/020-inter-diagram-social-text/plan.md`.
- [ ] T027 Accessibility layer, no new test: run `tests/e2e/a11y.spec.ts` and the portfolio a11y specs unchanged; no new violation (SC-005).
- [ ] T028 Visual layer, no new test: run the visual project (`pnpm run test:visual`) and confirm it passes with the committed baselines. The plan expects NO baseline change (fixture diagrams are raster). Any diff is a regression to fix, not a baseline to refresh; run no update command.
- [ ] T029 Run `pnpm run verify:quick`, then fix lint, type and format findings in the new scripts and tests.
- [ ] T030 Ask Don before the full `pnpm run verify` (parallel gates crash his machine); run it via the wrapper in the background under `perl -e 'alarm N; exec @ARGV'`, check `lsof` on port 4321 first, and read the `VERIFY_EXIT=` line. Merge `origin/main` first and re-run the font step if a sibling edited a diagram.
- [ ] T031 [PREVIEW-CHECK] Don confirms the sharing image: open `/og-default.png` on the branch preview deployment, and paste the preview or site URL into a real share preview (Slack, LinkedIn or Messenger) to see "Don Coleman" in Inter Bold with the same layout and colours as before. A pixel comparison is machine-dependent, so this is by eye.
- [ ] T032 [PREVIEW-CHECK] Don opens a published project story with a diagram on the preview in Safari (macOS or iOS) and in Firefox (SC-001: Safari and one other browser; the E2E check is Chromium only), and confirms the diagram letters in Inter and the six wrapped labels and two moved boxes (Cadence Apple Watch, Tempo Apple Health) look right, including the sixth wrap (Flux "Handlebars, Tailwind v4").

## Dependencies and order

- Phase 1, then Phase 2 (all tests red) before any implementation.
- US1 (Phase 3) and US2 (Phase 4) are independent after Phase 2; US3 (Phase 5) depends on US1 (T010 to T017).
- Within US1: T010 -> T011 -> T012; T013 to T016 in parallel; T017 after all; T018 after T017.
- T024 and T025 are parallel; Phase 6 follows all stories; T031 and T032 need the pushed preview and stay open for Don.

## Parallel opportunities

T002; T003 with T008 and T009 (different files); T013 to T016; T024 with T025.

## Implementation strategy

MVP is US1 (diagrams). Then US2, then the US3 gate proof and docs. Major change: auto-merge off, `major-change` label, PR body calls out the six wraps (the sixth is Flux "Handlebars, Tailwind v4") and the two moved boxes.
