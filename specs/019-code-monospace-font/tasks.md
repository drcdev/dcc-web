# Tasks: Self-hosted monospace font for code

**Input**: `specs/019-code-monospace-font/` (spec.md, plan.md, research.md, data-model.md, contracts/code-font.md, quickstart.md)
**Branch**: `019-code-monospace-font` | **Major change** (Constitution III): auto-merge off, `major-change` label.

**Tests are mandatory** (Constitution I). Each test task names its one primary layer (unit,
component, build, E2E, a11y, visual or budget) per "Where a test goes" in `docs/testing.md`; a
second layer carries a written reason. The implement phase runs each new test and **sees it
fail** before the code it covers. Test titles cite contract rows (M01 to M20) and carry no
`specs/...` path literals. Run `node -v` first; if it is not the `.nvmrc` version, run
`source ~/.nvm/nvm.sh && nvm use` in the same command. In a worktree use `corepack pnpm` or the
pnpm shim; see CLAUDE.md "Local toolchain". This feature reuses feature 018's mechanism (see
`specs/018-self-hosted-fonts/tasks.md`).

Format: `- [ ] T### [P?] [Story?] [layer] Description with file path`. `[P]` = different files, no
dependency on an unfinished task.

User stories: US1 (P1) a reader reads code in a real monospace face; US2 (P2) the code font loads
like Inter (same origin, small, no layout cost, only the faces a page draws); US3 (P3) baselines
that show code refresh as one predicted change. US1 and US2 share one mechanism, built in Phase 3
with US1's drawn-face tests first; US2 adds the request, budget and serving proofs.

Note: spec FR-007 is stricter than contract row M15. A page with code but no italic or bold code
must request no italic or bold mono face; T024 tests that.

## Phase 1: Setup (charset stack, recipe, font files)

**Purpose**: the monospace fallback constant, the one-off subset recipe and the four committed font files.

- [ ] T001 [P] [unit] Add `describe("mono charset")` (RED) to `tests/unit/site/font-files.test.ts`: `MONO_FALLBACK_STACK` is Tailwind's default mono families with the generic `monospace` last (FR-006, M03); `INTER_UNICODE_RANGE` is unchanged. Layer unit: pure logic. Run it and see it fail (export missing).
- [ ] T002 Add `MONO_FALLBACK_STACK` to `src/lib/fonts/charset.ts` per data-model.md, and update the doc comment on `INTER_UNICODE_RANGE` (both families ship this set). T001 goes green.
- [ ] T003 [P] [unit] Add `describe("mono subset recipe")` (RED, M11) to `tests/unit/site/font-files.test.ts`: the exports of `scripts/fonts/subset-jetbrains-mono.ts` pin the JetBrains Mono 2.304 release URL and archive SHA-256, `fonttools[woff]==4.60.2` via `uvx`, and per face `--unicodes` from `INTER_UNICODE_RANGE`, `--layout-features=` (empty, so no ligatures, FR-003), `--no-hinting`, `--flavor=woff2`. Layer unit: asserts constants and argument lists only; network and `uvx` run only under `import.meta.main`. See it fail (module missing).
- [ ] T004 Create `scripts/fonts/subset-jetbrains-mono.ts` mirroring `scripts/fonts/subset-inter.ts`: download the pinned release once, verify SHA-256, extract, run `pyftsubset` for the four faces (400, 400 italic, 700, 700 italic), copy the release `OFL.txt` unmodified; export constants and the args builder; guard side effects with `import.meta.main`. T003 goes green.
- [ ] T005 [P] [unit] Add `describe("mono font files")` (RED, M10) to `tests/unit/site/font-files.test.ts`: `src/assets/fonts/jetbrains-mono/` holds exactly the four `JetBrainsMono-*.woff2` and `OFL.txt`; each woff2 has family `JetBrains Mono`, the weight and style its name says, a cmap equal to the 202 code points of `INTER_UNICODE_RANGE` (read with `fontace`), the SHA-256 pinned from research R2, and the four total at most 60,000 bytes; every glyph advance is 600 (supports M14); `OFL.txt` has its pinned SHA-256 and contains "SIL OPEN FONT LICENSE Version 1.1" and "JetBrains Mono"; Inter's directory still holds its four files and unchanged `LICENSE.txt` plus only the `jetbrains-mono/` directory (relax any existing "exactly these entries" check for that one directory); nothing font-like under `public/` (FR-005). Layer unit: the files are static inputs. See it fail (files absent).
- [ ] T006 Run `node scripts/fonts/subset-jetbrains-mono.ts` once (needs `uv` and `unzip`); commit only the four `src/assets/fonts/jetbrains-mono/JetBrainsMono-{Regular,Italic,Bold,BoldItalic}.woff2` and `src/assets/fonts/jetbrains-mono/OFL.txt` (not the originals, the zip or `.cache/`). T005 goes green; sizes match research R2 (31,656 bytes total).
- [ ] T007 Record reproducibility in the header comment of `scripts/fonts/subset-jetbrains-mono.ts` and `specs/019-code-monospace-font/quickstart.md` section 1: release URL and archive SHA-256, the exact `uvx ... pyftsubset` command, and the SHA-256 and byte size of each committed `.woff2` (from `shasum -a 256`); confirm a re-run produces no diff in `src/assets/fonts/jetbrains-mono/`.

**Checkpoint**: T001, T003 and T005 green; four fonts and licence committed.

## Phase 2: Foundational (guard, config, tokens, fixture content)

**Purpose**: wiring both code stories need. Tests first, each seen to fail.

- [ ] T008 [P] [unit] Extend the coverage guard `tests/unit/site/font-coverage.test.ts` (RED, M19, FR-014): the covered set is computed per family (all four Inter faces and all four mono faces); a failure message names the character, code point, file and family; add two self-check cases, an Inter-only miss and a mono-only miss, each of which must be reported, so the guard is shown able to fail. Layer unit: reads files, no browser. The real-sources case passes once T006 has landed; the self-check cases are the seen-to-fail evidence.
- [ ] T009 [P] [unit] Update `describe("fonts")` in `tests/unit/site/astro-config.test.ts` (RED, M01 to M03 config side): families length 2 (was 1); Inter assertions kept; the mono family uses `fontProviders.local()`, `name: "JetBrains Mono"`, `cssVariable: "--font-jetbrains-mono"`, four variants (400 normal, 400 italic, 700 normal, 700 italic) from `./src/assets/fonts/jetbrains-mono/`, `display: "swap"`, the shared `unicodeRange`, `fallbacks` = `MONO_FALLBACK_STACK` with generic `monospace` last, `optimizedFallbacks: true`. Layer unit: config object inspection. The old length-1 assertion is superseded by this feature's FR-001 and FR-005, not deleted to get through.
- [ ] T010 [P] [unit] Update `tests/unit/site/design-tokens.test.ts` (RED, M07, M08, FR-001, FR-004, FR-009): replace "keeps pre and code in the body-font element rule (F08, FR-008)" with: `--font-mono` is `var(--font-jetbrains-mono)`; `--font-body` and `--font-heading` stay `var(--font-inter)`; the body-font rule lists neither `pre` nor `code`; a later rule gives `pre, code, kbd, samp` and their descendants `font-family: var(--font-mono)`; no rule in the change sets a font size, colour, weight, style, padding, line height, `font-synthesis` or `font-feature-settings` for code; no `hl-*` rule has `font-style` or `font-weight`; still no `@font-face`. Layer unit: CSS text. The old assertion is superseded by this spec, noted in the test comment.
- [ ] T011 [P] Test-input content (no layer, not a test): add the sentence from research R5 to `tests/fixtures/posts/valid/every-part.mdx` after the emphasis sentence (code in `em` and `strong`, `kbd`, `samp`, `samp` in `em`), ASCII only; do not re-date any fixture post. Re-run `tests/e2e/blog-fixtures.spec.ts` and `tests/e2e/blog-pagination.spec.ts` after (reading time stays 1 minute; summary, lead and series links unchanged). Needed before baselines so the post draws all four mono faces.
- [ ] T012 Run T008 to T010 and record that T009 and T010 fail, and that T008's self-check cases prove the guard can fail.
- [ ] T013 Add the second `fonts` entry to `astro.config.mjs` per data-model.md (import `MONO_FALLBACK_STACK` from `src/lib/fonts/charset.ts`; rename the shared per-variant object so both families use it; comment cites the Astro docs pages from research R1 and this feature). Leave `security.csp` unchanged (FR-010). T009 goes green.
- [ ] T014 Edit `src/styles/global.css`: `--font-mono: var(--font-jetbrains-mono)` in `@theme`; remove `pre` and `code` from the body-font element rule; add after it the rule from research R3 giving `pre, code, kbd, samp` and their descendants `font-family: var(--font-mono)`, with a comment (code font, supersedes feature 018 D2). Add no size, colour, weight, style, padding, line-height, synthesis or feature-settings declaration and no `@font-face`. T010 goes green.

**Checkpoint**: unit project green for font files, guard, config and tokens; fixture sentence in place.

## Phase 3: User Story 1 - A reader reads code in a real monospace face (Priority: P1)

**Goal**: every `code`, `pre`, `kbd` and `samp` on the site is drawn by JetBrains Mono, with real italic and bold faces; prose stays Inter.

**Independent test**: load the fixture post; the browser reports the JetBrains Mono face drawing the code, Inter drawing prose, with equal advances in code.

### Tests first (US1)

- [ ] T015 [P] [US1] [component] Update `describe("fonts")` in `tests/component/BaseLayout.test.ts` (RED, M01 to M05, FR-005, FR-006, FR-007): `fontStyle()` selects the Inter style by family (two font `<style>` elements now); the mono style holds exactly four `@font-face` for `JetBrains Mono-<hash>` (400/700, normal/italic; swap; `unicode-range` = `INTER_UNICODE_RANGE`; one same-origin `url("/_astro/fonts/<hash>.woff2") format("woff2")` src, no `local()`) and exactly four fallback faces in `JetBrains Mono-<hash> fallback: Courier New` (only `local("Courier New")`, `size-adjust`, no `url()`); `--font-jetbrains-mono` lists the mono family, the Courier New fallback family, then `MONO_FALLBACK_STACK` ending `monospace`; still exactly two `<link rel="preload" as="font">`, both Inter upright files; no off-origin URL in either style. Layer component: head markup, no browser. If the container cannot resolve the Fonts API virtual module, move these assertions to T016 and say so in the test comment. Check existing head-order assertions against the new element.
- [ ] T016 [P] [US1] [build] Update the fonts `describe` in `tests/build/local-site.test.ts` on the existing L1 build, no new build (M09, FR-005, FR-011): `dist/_astro/fonts/` holds exactly eight content-hashed `.woff2` files, each byte-identical to one of the files in `src/assets/fonts/` or `src/assets/fonts/jetbrains-mono/`, and no font file elsewhere in `dist/`. Layer build: only the real `astro build` shows the hashed output.
- [ ] T017 [P] [US1] [E2E] In `tests/e2e/fonts.spec.ts` replace the "inline code is drawn in Inter" case with the M13 case (RED; CDP `CSS.getPlatformFontsForNode`, as feature 018): on `/writing/every-part/` the code block and a highlighted token in it are drawn by `JetBrainsMono-Regular`; inline code by the face its computed weight and style select (600 normal gives `JetBrainsMono-Bold`); code in `em` gives `JetBrainsMono-BoldItalic`; code in `strong` gives `JetBrainsMono-Bold`; `kbd` and `samp` give `JetBrainsMono-Regular`; `samp` in `em` gives `JetBrainsMono-Italic`; all `isCustomFont`; a paragraph, a heading, the code card caption and the Copy button are still drawn by Inter (FR-001, FR-004, SC-001). Layer E2E: only a real browser shows which face is drawn.
- [ ] T018 [P] [US1] [E2E] In `tests/e2e/fonts.spec.ts` add the equal-advance case (RED, M14, Story 1 scenario 1): two code-block lines of equal length but different characters (for example `iiiiiiii` and `WWWWWWWW`) measure equal rendered widths. Use existing fixture code block lines, or build the lines in the page with a `pre` appended by script, rather than editing the fixture and shifting other expectations. Layer E2E: only the browser shows rendered widths. Second layer over T005's advance check, reason: the file check proves the font is monospace, this proves the page draws every token (including Shiki spans) with it.
- [ ] T019 [P] [US1] [E2E] In `tests/e2e/fonts.spec.ts` extend the JS-off case (RED, M16, FR-016): with JavaScript disabled the code block is still drawn by `JetBrainsMono-Regular`. Layer E2E: needs a browser with JS off.
- [ ] T020 [P] [US1] [E2E] In `tests/e2e/fonts.spec.ts` extend the blocked-fonts case (RED, M17, FR-006): with `page.route` aborting `/_astro/fonts/**`, code text is visible and drawn by a face whose PostScript name does not start with `JetBrainsMono-`, and italic code stays slanted. Layer E2E: only a browser shows the fallback face.
- [ ] T021 [US1] Run T015 to T020 and record that each new or changed test fails (T016 needs `pnpm run build`; T017 to T020 need the built preview). Record the failures.

### Implementation (US1)

- [ ] T022 [US1] Edit `src/layouts/BaseLayout.astro`: render `<Font cssVariable="--font-jetbrains-mono" />` straight after the Inter `<Font />`, with **no `preload`** (FR-007); update the header comment. No class changes anywhere. T015 and T016 go green.
- [ ] T023 [US1] Run `pnpm run build` then `tests/e2e/fonts.spec.ts` (T017 to T020); fix until green. Confirm the existing CSP test in `tests/e2e/headers.spec.ts` still passes with one more `sha256-` hash and no console CSP error (M06; no new test, already covered on every HTML template).

**Checkpoint**: US1 testable on its own: code is drawn in JetBrains Mono, prose in Inter, in a real browser.

## Phase 4: User Story 2 - The code font loads like Inter (Priority: P2)

**Goal**: same-origin, cached, only the faces a page draws, no layout shift, within budget and WCAG 2.2 AA.

**Independent test**: for each template, mono font requests are same-origin and match exactly the faces drawn; budget, CLS and a11y pass.

### Tests first (US2)

- [ ] T024 [P] [US2] [E2E] Extend the template loop in `tests/e2e/fonts.spec.ts` (M15, FR-007, SC-002, SC-003): every font response on every template is a same-origin `/_astro/fonts/*.woff2`; each file is requested at most once; at most four Inter and four mono files; mono files are identified by the SHA-256 of the committed files; a template drawing no visible `code`, `pre`, `kbd` or `samp` text requests no mono file. **FR-007 (stricter than M15):** for every template, the set of mono files requested equals exactly the set of faces drawn by its code text (derived from each code element's computed weight and style by standard font matching), so a page with code but no italic or bold code requests no italic or bold mono face. Add an explicit case for a page whose code is only blocks drawn at 400 normal: use a built fixture page of that kind if the fixture site has one; if none does, add a test-input fixture or intercept a minimal page with `page.route` that links the real built stylesheet and font style, and say which in the test comment. If a case cannot go RED against pre-implementation code (nothing mono is requested yet), record it as green-by-absence and show it can fail by temporarily forcing a bold mono preload. Layer E2E: only the browser shows which font files it requests. Second layer over T015's M04 head check, reason: head markup cannot show the requests the browser makes from `@font-face` rules or how many a page triggers.
- [ ] T025 [P] [US2] [E2E] Add one test to `tests/e2e/headers.spec.ts` (RED, M12, FR-011): take a mono font URL from the home page's JetBrains Mono `@font-face` `src` (mono files have no preload link) and assert 200, `font/woff2`, the exact `Cache-Control: public, max-age=31536000, immutable` and the full security headers. Layer E2E, **second layer over `tests/unit/site/headers.test.ts`**: the unit test reads rule text; only the served response shows `wrangler`'s `_headers` matching reaches the mono file path. `public/_headers` itself does not change.
- [ ] T026 [US2] Run T024 and T025 and record failures where they can fail (against a build without the implementation, or via the forcing step in T024); with Phase 3 done, run them green.

### Verification (US2, existing gates, no new tests)

- [ ] T027 [US2] [budget] Run `pnpm run test:budget` unchanged (M20, FR-008, SC-004; no limit edited). Layer budget: the existing test is the proof, so there is no red step. Record the `writing-post` total (research R4 estimate about 100,800 bytes) and CLS before and after, and the `writing-series-convergence` total, for the PR body. If any template exceeds 153,600 bytes or CLS reaches 0.1, stop and report rather than adding a preload or editing a limit.
- [ ] T028 [US2] [a11y] Run `pnpm run test:a11y` and the blog and portfolio a11y specs unchanged (FR-012, SC-006), plus `tests/e2e/geometry.spec.ts`, `tests/e2e/blog.spec.ts` (code block scroll and Copy button) and `tests/e2e/projects.spec.ts`. No new test: templates are already covered. Wider mono glyphs that cause a wrap, overflow or reflow failure are a design regression to fix, not a threshold to loosen.

**Checkpoint**: US2 testable on its own: requests, serving, budget and a11y green.

## Phase 5: User Story 3 - Baselines refreshed as one predicted change (Priority: P3)

**Goal**: exactly the 8 `post-template` baselines regenerated for both platforms; none added or deleted; the Linux images pass CI on the first run.

**Independent test**: `git status tests/e2e/visual.spec.ts-snapshots/` shows exactly 8 modified files; visual passes on macOS and in Docker.

- [ ] T029 [US3] [visual] Edit `settleFonts` in `tests/e2e/visual.spec.ts` (RED, M18, FR-015): after the existing waits, for each `code, pre, kbd, samp` element await `document.fonts.check(font, text)` with the element's computed font and its text, and assert the matching `JetBrains Mono-<hash>` face is `loaded` (find faces in `document.fonts` by family matching `/^"?JetBrains Mono-[0-9a-f]+"?$/`; a check on the bare family name passes whatever happens); update the header comment. Show it fails when `/_astro/fonts/**` is aborted, then passes. Layer visual: shots must be taken after the faces settle. Run the visual project before regenerating and see it fail on the old `post-template` baselines (the predicted diff).
- [ ] T030 [US3] After all implementation and the T011 fixture edit, regenerate the macOS baselines with `pnpm run test:visual:update` (run from the agent via the nvm plus pnpm shim wrapper in the background; wait for sibling Playwright runs first, see CLAUDE.md). Restrict the change set to the 8 `post-template-{desktop,phone}-{dark,light}-visual-{darwin,linux}.png` images (research R6): any other changed image under `tests/e2e/visual.spec.ts-snapshots/` is restored with `git checkout -- <file>` and investigated as a regression, not refreshed.
- [ ] T031 [US3] Regenerate the Linux baselines with `pnpm run test:visual:update:linux` (the script builds in the Docker image matching `@playwright/test`). Run `docker info` first; if it fails, ask Don to start Docker Desktop with an `AskUserQuestion` whose question text carries the instruction (CLAUDE.md "Local toolchain"). Do not run it while another job builds `dist/`, and do not run the macOS update while Docker builds. Restrict to the same 8 images, restoring any other changed image with `git checkout`. The Linux images must match CI on the first run. Do not use the `visual-baselines` CI label or commit CI-artifact images without telling Don (FR-015).
- [ ] T032 [US3] Verify the change set: `git status tests/e2e/visual.spec.ts-snapshots/` shows exactly 8 modified files (4 `*-darwin.png`, 4 `*-linux.png`), 0 added, 0 deleted (SC-007); compare `*-previous.png` for the post template (code now monospace, prose unchanged); run `pnpm run test:visual` green on macOS. Commit the images.
- [ ] T033 [US3] [visual] Locally confirm the Docker-side mechanism using `tests/e2e/visual.spec.ts` and `tests/e2e/fonts.spec.ts`: the visual project passes against the committed Linux images in Docker, and the fixture post draws italic and bold italic code from the real `JetBrainsMono-Italic` and `-BoldItalic` faces, not a synthesized slant. Layer visual, no new test: T017 proves the faces, the existing subjects prove the pixels.

**Checkpoint**: US3 done: 8 baselines refreshed, green locally.

## Phase 6: Docs, full gate and PR

- [ ] T034 [P] Update `docs/testing.md`: "Layers" rows for the new and changed unit, component, build and E2E tests, and the "Visual coverage" fonts paragraph (JetBrains Mono self-hosted beside Inter, the guard over both families, the code-face wait, only the `post-template` baselines show code; research R9).
- [ ] T035 [P] Update `docs/design-source.md`: add a `--font-mono` row recording self-hosted JetBrains Mono 2.304 (feature 019) through Astro's Fonts API, system monospace stack as fallback; confirm no other doc says code uses the body font.
- [ ] T036 Run quickstart sections 1 to 5 in `specs/019-code-monospace-font/quickstart.md` and fix any drift between it and the real commands; run `pnpm run lint` and the type check.
- [ ] T037 Run the full gate (`pnpm run verify`) in the background via the wrapper script under `perl -e 'alarm N; exec @ARGV'` with `ASTRO_PREVIEW_BACKGROUND=1`; read the `VERIFY_EXIT=` line; check `lsof -i :4321` first. Check in with Don before the run (parallel gates crash his machine); if local runs are load-bound, push-and-let-CI-verify needs his okay.
- [ ] T038 Open the PR from the `drc-agents` account (`gh auth switch --user drc-agents` before `gh pr create`, back to `drcdev` after) **without** the `visual-baselines` label, with the `major-change` label, auto-merge off, closing issue #75. The PR body says why (design system and visual identity change, supersedes feature 018 D2), states the expected new monthly cost of $0 with no new dependency, service, contact-form, data or secret change (FR-017, Constitution IX), reports the `writing-post` and convergence byte figures and CLS values, and links the preview. The one pre-PR major-change/merge-mode question is asked before `gh pr create`.
- [ ] T039 Verify the first-run Docker-to-CI match (FR-015, SC-007): the first CI `verify` run's visual project passes on Linux with no label run and no artifact push. Checked by the orchestrator after the PR opens; the CI run is the check, so it is not marked `[PREVIEW-CHECK]`. On failure, inspect the CI diff images and investigate in this feature, else stop and report to Don. Record the result in the PR body.
- [ ] T040 [PREVIEW-CHECK] Don reviews a post with code on the preview deployment in light and dark mode at phone and desktop width: that inline code (weight 600, now JetBrains Mono Bold, heavier than bold Inter) looks acceptable beside Inter; the I l 1 and O 0 glyph check in a code block; that wider code lines scroll sideways inside their card and stay usable; and in DevTools Network (cache disabled) that a page without code fetches no JetBrains Mono file and that a reload serves them from cache. Needs the live preview and Don's eyes, so a subagent cannot verify it.

## Dependencies and order

- Phase 1 then Phase 2 then Phase 3. Phase 4 needs Phase 3 (the implementation it measures). Phase 5 needs Phases 3 and 4 complete (including the T011 fixture) because baselines come after all implementation and content edits. Phase 6 needs Phase 5; T034 and T035 can run any time after Phase 3, T036 and T037 last before the PR.
- Within a phase, each test task precedes the implementation it covers and must be seen to fail first (T001/T003/T005, T012, T021, T026, T029). T008's self-check is the guard's red step.
- Parallel `[P]` sets: T001, T003, T005; T008 to T011; T015 to T020; T024, T025; T034, T035.
- Parallel worktrees: this slice touches `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/lib/fonts/charset.ts`, `every-part.mdx` and the 8 `post-template` baselines; a sibling touching any of them must not merge alongside it.

## Implementation strategy

MVP is Phases 1 to 3: the code font is served and proven drawn in a real browser. Phase 4 proves the loading, serving, budget and accessibility behaviour; Phase 5 turns the visual project green and proves the first-run Docker-to-CI match. T040 is the only task left for Don.
