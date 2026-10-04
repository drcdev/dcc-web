# Tasks: Self-hosted Inter web fonts

**Input**: `specs/018-self-hosted-fonts/` (spec.md, plan.md, research.md, data-model.md, contracts/fonts.md, quickstart.md)
**Branch**: `018-self-hosted-fonts` | **Major change** (Constitution III): auto-merge off, `major-change` label.

**Tests are mandatory** (Constitution I). Each test task names its one primary layer (unit,
component, build, E2E, a11y, visual or budget) per "Where a test goes" in `docs/testing.md`; a
second layer carries a written reason. The implement phase runs each new test and **sees it
fail** before the code it covers. Test titles cite contract rows (F01 to F21) and carry no
`specs/...` path literals. Run `node -v` first; if it is not the `.nvmrc` version, run
`source ~/.nvm/nvm.sh && nvm use` in the same command. In a worktree use `corepack pnpm` or the
pnpm shim; see CLAUDE.md "Local toolchain".

Format: `- [ ] T### [P?] [Story?] [layer] Description with file path`. `[P]` = different files, no
dependency on an unfinished task.

User stories: US1 (P1) Linux baselines match CI first time; US2 (P2) one typeface everywhere;
US3 (P3) all baselines refreshed as one predicted change. US2 is the mechanism, so it is built
first; US3 produces the images; US1 is proven by the first CI run.

## Phase 1: Setup (font files, licence, recipe)

**Purpose**: the one-off subset recipe and the four committed font files.

- [X] T001 [P] [unit] Write the charset tests (RED) in `tests/unit/site/font-files.test.ts`, `describe("charset")`: `INTER_UNICODE_RANGE` tokens and `codePointsOf` expansion, `NOT_IN_INTER`, and `SYSTEM_FONT_STACK` holds exactly today's families with the generic `sans-serif` last (FR-002, FR-005). Layer unit: pure logic. Run it and see it fail (module missing).
- [X] T002 Create `src/lib/fonts/charset.ts` exporting `INTER_UNICODE_RANGE`, `codePointsOf`, `NOT_IN_INTER` and `SYSTEM_FONT_STACK` per data-model.md and research R6, until T001 passes.
- [X] T003 [P] [unit] Write the subset-recipe tests (RED) in `tests/unit/site/font-files.test.ts`, `describe("subset recipe")` (F20): the exports of `scripts/fonts/subset-inter.ts` pin the Inter 4.1 release URL and SHA-256, fonttools 4.60.2 (`fonttools[woff]==4.60.2` via `uvx`), and the args `--layout-features=kern`, `--no-hinting`, `--flavor=woff2`, `--unicodes` from `INTER_UNICODE_RANGE`. Layer unit: asserts constants and argument lists only; network and `uvx` run only under `import.meta.main`. See it fail.
- [X] T004 Create `scripts/fonts/subset-inter.ts`: download the pinned Inter 4.1 release once, verify SHA-256, extract, run `uvx --from "fonttools[woff]==4.60.2" pyftsubset` for the four faces (400, 400 italic, 700, 700 italic), copy the OFL `LICENSE.txt`; export its constants and `pyftsubsetArgs`; guard side effects with `import.meta.main` (research R3). T003 goes green.
- [X] T005 [P] [unit] Write the font-file tests (RED) in `tests/unit/site/font-files.test.ts` (F19, F09 source side): each file in `src/assets/fonts/` has family Inter, the weight and style matching its name, a cmap equal to the shipped set minus U+00AD (read with `fontace`), the four total at most 50,000 bytes; `LICENSE.txt` is the SIL OFL 1.1 (FR-013); nothing font-like under `public/` (FR-004). Layer unit: the files are static inputs. See it fail (files absent).
- [X] T006 Run `node scripts/fonts/subset-inter.ts` once (needs `uv` and `unzip`); commit only `src/assets/fonts/Inter-Regular.woff2`, `src/assets/fonts/Inter-Italic.woff2`, `src/assets/fonts/Inter-Bold.woff2`, `src/assets/fonts/Inter-BoldItalic.woff2` and `src/assets/fonts/LICENSE.txt` (not the Inter originals or the zip). T005 goes green.
- [X] T007 Record reproducibility in `specs/018-self-hosted-fonts/quickstart.md` section 1 and in the header comment of `scripts/fonts/subset-inter.ts`: the exact release URL and archive SHA-256, the exact `uvx ... pyftsubset` command line, and the SHA-256 and byte size of each of the four committed `.woff2` files (from `shasum -a 256`); confirm a re-run produces no diff in `src/assets/fonts/`.

**Checkpoint**: T001, T003 and T005 green; four fonts and licence committed.

## Phase 2: Foundational (guard, config, tokens, headers)

**Purpose**: wiring every story needs. Tests first, each seen to fail.

- [X] T008 [P] [unit] Write the coverage guard `tests/unit/site/font-coverage.test.ts` (F18, FR-016, SC-008): every character in the shell, layout, page, config and script sources and in the fixture site's pages, posts (including generated ones) and projects is in all four cmaps or in the explicit exclusion list (research R5). Include a self-check case feeding a string with uncovered U+0100 that must be reported, to show the guard can fail (the real-sources case should pass at once). Layer unit: reads files, no browser.
- [X] T009 [P] [unit] Add the `describe("fonts")` tests (RED) to `tests/unit/site/astro-config.test.ts` on the imported config: one Inter family, `fontProviders.local()`, `cssVariable: "--font-inter"`, four variants from `./src/assets/fonts/`, `display: "swap"`, shared `unicodeRange` = `INTER_UNICODE_RANGE`, `fallbacks` = `SYSTEM_FONT_STACK` with a generic last entry, `optimizedFallbacks: true` (FR-001, FR-002, FR-005, FR-006). Layer unit: config object inspection.
- [X] T010 [P] [unit] Update `tests/unit/site/design-tokens.test.ts` (RED, F07, F08): replace "sets --font-body and --font-heading to system font stacks" with `var(--font-inter)` for both; keep "has no @font-face" and the off-host `url()` check; add the assertion that the body-font element rule still lists `pre` and `code` (FR-008). Layer unit: CSS text. The old assertion is superseded by FR-001, not deleted to get through.
- [X] T011 [P] [unit] Update `tests/unit/site/headers.test.ts` (RED, F12): four rules in file order (`/*`, `/_astro/fonts/*`, the two host rules); `/_astro/fonts/*` sets only `Cache-Control: public, max-age=31536000, immutable`; no other rule sets `Cache-Control` (FR-015). Layer unit: reads rule text; the served response is T019.
- [X] T012 Run T008 to T011 and record that T009 to T011 fail (and T008 passes on today's sources, its self-check case proving it can fail).
- [X] T013 Add the `fonts` block to `astro.config.mjs` (import `fontProviders` from `astro/config` and `SYSTEM_FONT_STACK`/`INTER_UNICODE_RANGE` from `src/lib/fonts/charset.ts`): Inter, `fontProviders.local()`, `cssVariable: "--font-inter"`, `fallbacks: [...SYSTEM_FONT_STACK]`, `optimizedFallbacks: true`, four variants from `./src/assets/fonts/`, `display: "swap"`, `unicodeRange`. Leave `security.csp` unchanged (FR-009). T009 goes green.
- [X] T014 Edit `src/styles/global.css`: `--font-body: var(--font-inter); --font-heading: var(--font-inter);`, update the comment (self-hosted Inter via Astro's Fonts API, system stack as fallback); leave the body-font element rule and add no `@font-face`. T010 goes green.
- [X] T015 Add to `public/_headers`, after `/*`: `/_astro/fonts/*` with `Cache-Control: public, max-age=31536000, immutable`. T011 goes green.

**Checkpoint**: unit project green for fonts, config, tokens, headers.

## Phase 3: User Story 2 - A reader sees the same typeface everywhere (Priority: P2)

**Goal**: Inter on every page, true italics, same-origin fonts, no CSP change, no layout shift.

**Independent test**: load each template; computed faces are Inter, font requests are same-origin, a11y and budget pass.

### Tests first (US2)

- [X] T016 [P] [US2] [component] Add `describe("fonts")` to `tests/component/BaseLayout.test.ts` (RED, F01 to F05, FR-001, FR-004, FR-005, FR-006, FR-012): head holds one Font `<style>` with four Inter `@font-face` (swap, `unicode-range`, same-origin woff2 `src`) and four metric-adjusted fallback faces (`local("Arial")`/`local("Arial Bold")` only, `size-adjust` and the three overrides, matching weight, style, unicode-range); `--font-inter` lists Inter, the two fallback families, then the stack; exactly two preloads (400 and 700 normal, `as="font"`, `type="font/woff2"`, `crossorigin`); no off-origin URL. Layer component: head markup, no browser needed. If the container cannot resolve the Fonts API virtual module, move these assertions to T017 and write that reason in the test comment. Check existing head-order assertions against the new elements.
- [X] T017 [P] [US2] [build] Add a `describe` to `tests/build/local-site.test.ts` on the existing L1 build, no new build (F09, FR-004, FR-015): `dist/_astro/fonts/` holds exactly four content-hashed `.woff2` files byte-identical to `src/assets/fonts/`, and no font file elsewhere in `dist/`. Layer build: only the real `astro build` shows the hashed output.
- [X] T018 [P] [US2] [E2E] Create `tests/e2e/fonts.spec.ts` (RED, F13 to F16; research R8, CDP `CSS.getPlatformFontsForNode`): on the fixture post `/writing/every-part/` paragraph `Inter-Regular`, `strong` `Inter-Bold`, `em`, block quote and views note `Inter-Italic`, bold italic `Inter-BoldItalic`, `code` `Inter-Regular`, a `font-medium` header link `Inter-Regular`, a `font-semibold`/`font-bold` heading `Inter-Bold`, all `isCustomFont` (F13, FR-001, FR-003, FR-008, FR-017, SC-002); across `TEMPLATES` every font response is same-origin `/_astro/fonts/*.woff2` and none goes elsewhere, each file is requested at most once (at most four), and home, which draws no italic, requests no italic face (F14, FR-004, FR-018, SC-003); JS off still `Inter-Regular` (F15); with `page.route` aborting `/_astro/fonts/**` text is visible, drawn by a non-`Inter-*` font and italics stay slanted (F16). Layer E2E: only a real browser shows which face is drawn and which font files are requested. F14 is a second layer over T016's F05 head check, reason: the head markup cannot show the requests the browser actually makes from the `@font-face` rules or how many of them a page triggers.
- [X] T019 [P] [US2] [E2E] Add two tests to `tests/e2e/headers.spec.ts` (RED, F10, F11, FR-015, SC-009): a served `/_astro/fonts/<hash>.woff2` returns 200, `font/woff2`, the exact `Cache-Control` and the full security headers; the page stylesheet under `/_astro/` has no `immutable`. Layer E2E, **second layer over T011**: the unit test reads rule text; only the served response shows that `wrangler`'s `_headers` matching reaches Astro's real output path and replaces the default `Cache-Control` (research R2).
- [X] T020 [P] [US2] Test-input content (no layer, not a test): add one sentence with `*emphasis*` and `***bold italic***` to `tests/fixtures/posts/valid/every-part.mdx` (research R9) so F13 can see italic and bold italic; do not re-date any fixture post. Test-input content; re-run `tests/e2e/blog-fixtures.spec.ts` after (reading time still 1 minute, lead and series links unchanged).
- [X] T021 [US2] Run T016 to T019 and see the new ones fail (T017 needs `pnpm run build`; T018 and T019 need the built preview). Record the failures.

### Implementation (US2)

- [X] T022 [US2] Edit `src/layouts/BaseLayout.astro`: `import { Font } from "astro:assets"` and add `<Font cssVariable="--font-inter" preload={[{ weight: "400", style: "normal" }, { weight: "700", style: "normal" }]} />` in `<head>` after `<Seo />`. No class changes anywhere (FR-017). T016 and T017 go green.
- [X] T023 [US2] Run `pnpm run build` then `tests/e2e/fonts.spec.ts`, `tests/e2e/headers.spec.ts` and `tests/e2e/blog-fixtures.spec.ts`; fix until T018 and T019 pass. Confirm the existing CSP test in `tests/e2e/headers.spec.ts` ("carries the page CSP meta tag with the closed allow-list") still passes with one more `sha256-` hash and no console CSP error (F06; no new test, already covered on every HTML template).
- [X] T024 [US2] [budget] Seen-to-fail step: with fonts in and `BUDGET.totalBytes` still `100 * 1024` in `tests/e2e/budget.spec.ts`, run `pnpm run test:budget` and record the `/writing/convergence/` total-bytes failure (research R4, about 121,654 bytes). Layer budget: the existing test is the proof, no new test.
- [X] T025 [US2] [budget] Set `BUDGET.totalBytes` to `150 * 1024` in `tests/e2e/budget.spec.ts` with a comment citing feature 018 D3 (self-hosted type; no `specs/...` path literal) and update the header comment; leave LCP, CLS, long-task, JS limits and slow-4G throttling untouched (FR-006, FR-007, SC-004, F21). Run `pnpm run test:budget` green; record the convergence figure and CLS values for the PR body, compared with research R4.
- [X] T026 [US2] [a11y] Run `pnpm run test:a11y` and the blog and portfolio a11y specs unchanged (FR-010, SC-005); no new test, templates are already covered. Also run `tests/e2e/geometry.spec.ts` and `tests/e2e/projects.spec.ts`; any wrap or layout failure from Inter's wider glyphs is a design regression to fix, not a threshold to loosen.

**Checkpoint**: US2 testable on its own: fonts, headers, budget, a11y green.

## Phase 4: User Story 3 - Baselines refreshed as one predicted change (Priority: P3)

**Goal**: all 132 visual baselines regenerated for both platforms, none added or deleted.

**Independent test**: 132 modified files under `tests/e2e/visual.spec.ts-snapshots/`; visual passes locally on macOS.

- [X] T027 [US3] [visual] Edit `tests/e2e/visual.spec.ts` `open()` (F17, FR-011): after existing waits, await `document.fonts.ready` and assert no `FontFace` is still loading and the Regular and Bold faces are loaded; mention it in the header comment. Layer visual: shots must be taken after fonts settle. Run the visual project before regenerating and see it fail on the old baselines (the predicted diff, every subject).
- [X] T028 [P] [US3] Edit comment-only files: `scripts/visual-baselines-linux.sh` (DejaVu stays for fallback parity, research R10) and the header comment of `src/components/project/portfolio.css` (no longer "the system font only").
- [X] T029 [US3] After all implementation and after the T020 fixture edit, regenerate the macOS baselines in `tests/e2e/visual.spec.ts-snapshots/` with `pnpm run test:visual:update` (run from the agent via the nvm plus pnpm shim wrapper in the background; wait for sibling Playwright runs first, see CLAUDE.md).
- [X] T030 [US3] Regenerate the Linux baselines in `tests/e2e/visual.spec.ts-snapshots/` with `pnpm run test:visual:update:linux` (the script builds in the Docker image matching `@playwright/test`). Run `docker info` first; if it fails, ask Don to start Docker Desktop with an `AskUserQuestion` whose question text carries the instruction (CLAUDE.md "Local toolchain"). Do not run it while another job builds `dist/`. Do not use the `visual-baselines` CI label or commit CI-artifact images (FR-011).
- [X] T031 [US3] Verify the change set: `git status tests/e2e/visual.spec.ts-snapshots/` shows exactly 132 modified files (66 `*-darwin.png`, 66 `*-linux.png`), 0 added, 0 deleted (FR-011, SC-006); spot-compare `*-previous.png` for the fixture post and a shell image; run `pnpm run test:visual` green on macOS. A diff nobody predicted is a regression to fix, not a baseline to refresh. Commit the images.

**Checkpoint**: US3 done: 132 baselines refreshed and green locally.

## Phase 5: User Story 1 - A predicted visual change lands green first time (Priority: P1)

**Goal**: the Docker-generated Linux baselines pass the first CI visual run, with a real italic face on the fixture post.

**Independent test**: first CI `verify` run on the PR, opened without the `visual-baselines` label, passes visual.

- [X] T032 [US1] [visual] Locally confirm the Docker-side mechanism using `tests/e2e/visual.spec.ts` and `tests/e2e/fonts.spec.ts`: the fixture post `/writing/every-part/` draws italic and bold italic from `Inter-Italic` and `Inter-BoldItalic`, not a synthesized slant (acceptance scenario 2), and the visual project passes against the committed Linux images in Docker. Layer visual, no new test: T018 proves the faces, the existing subjects prove the pixels.
- [x] T033 [US1] Run the full gate (`pnpm run verify`) in the background via the wrapper script under `perl -e 'alarm N; exec @ARGV'` with `ASTRO_PREVIEW_BACKGROUND=1`; read the `VERIFY_EXIT=` line; check `lsof -i :4321` first. Check in with Don before the run; if local runs are load-bound, push-and-let-CI-verify needs his okay.
- [ ] T034 [US1] Open the PR from the `drc-agents` account (`gh auth switch --user drc-agents` before `gh pr create`, back to `drcdev` after) **without** the `visual-baselines` label, with the `major-change` label, auto-merge off; the PR body says why (design system and `public/_headers` serving change, budget D3) and states the expected new monthly cost of $0 with no new service, contact-form, data or secret change (FR-014, SC-007, Constitution IX), reports the convergence byte figure and CLS values, and links the preview. The one pre-PR major-change/merge-mode question is asked before `gh pr create`.
- [ ] T035 [US1] Verify the first-run Docker-to-CI match (FR-011, SC-001): the first CI `verify` run's visual project passes on Linux with no label run and no artifact push. Checked by the orchestrator after the PR opens; the CI run is the check, so it is not marked `[PREVIEW-CHECK]`. On failure, investigate in this feature (`fc-match`, the Docker image's fonts, rendering flags), else stop and report the diff to Don; issue #62 closes only when the match is shown. Record the result in the PR body.

## Phase 6: Polish and cross-cutting

- [X] T036 [P] Update `docs/testing.md`: "Layers" rows for the new unit, component, build and E2E tests and the visual note; "Visual coverage" paragraph on self-hosted Inter, the fonts wait, the coverage guard and why Docker keeps DejaVu.
- [X] T037 [P] Update `docs/design-source.md`: the `--gh-font-body` / `--gh-font-heading` row records self-hosted Inter 4.1 through Astro's Fonts API (feature 018), system stack as fallback. Confirm no other doc says "no web fonts" (research R11).
- [X] T038 Run quickstart sections 2 to 5 in `specs/018-self-hosted-fonts/quickstart.md` and fix any drift between it and the real commands; run `pnpm run lint` and the type check before the PR.
- [ ] T039 [PREVIEW-CHECK] Don reviews the preview deployment in light and dark mode at phone and desktop width: home, a post with italic and bold italic, the projects index and a story; checks headings, medium labels (now Regular) and semibold labels (now Bold), and that each 500 → 400 element listed in research R7 still has a cue other than weight (FR-017); in DevTools Network sees four or fewer `/_astro/fonts/*.woff2` requests with `immutable`, and a reload serves them from cache (SC-009); with slow 4G and cache disabled sees no visible jump on the swap from the adjusted Arial fallback to Inter. Needs the live preview and Don's eyes, so a subagent cannot verify it.

## Dependencies and order

- Phase 1 then Phase 2 then Phase 3. Phase 4 needs Phase 3 complete (including the T020 fixture and T025 budget) because baselines come after all implementation and content edits. Phase 5 needs Phase 4. Docs (T036, T037) can run any time after Phase 3; T038 runs last before the PR.
- Within a phase, each test task precedes the implementation it covers and must be seen to fail first (T012, T021, T024, T027).
- Parallel `[P]` sets: T001, T003, T005; T008 to T011; T016 to T020; T028; T036, T037.
- Parallel worktrees: this slice changes every baseline; a sibling changing baselines must not merge alongside it.

## Implementation strategy

MVP is Phases 1 to 3: the fonts are served and proven in the browser. Phases 4 and 5 turn the visual project green and prove the first-run match that issue #62 asks for. T039 is the only task left for Don.

## Phase 7: Convergence

- [X] T040 [US3] [visual] Make the "Regular and Bold are loaded" waits real per F17 and T027 (partial): Astro registers the family as `Inter-<hash>` (see `--font-inter` in the built head), so `document.fonts.check('400 16px "Inter"')` in `settleFonts()` in `tests/e2e/visual.spec.ts` and the `"400 1em Inter"`-style checks in the "Inter is loaded for every weight and style the page draws" test in `tests/e2e/fonts.spec.ts` name a family with no faces and pass whatever happens. Find the faces in `document.fonts` by family matching `/^"?Inter-[0-9a-f]+"?$/` and assert `status === "loaded"` for 400 normal and 700 normal (visual) and for all four weight/style pairs on the fixture post (fonts spec). Show each corrected check fails when `/_astro/fonts/**` is aborted, then passes; no baseline should change (if one does, stop and report it).
- [X] T041 [P] Reconcile `specs/018-self-hosted-fonts/contracts/fonts.md` with the verified behaviour per F02, F13 and F14 (partial; docs only, no test or code change): F02 says each fallback face has the same `unicode-range` as its Inter face, but Astro emits fallback faces with no `unicode-range` (asserted in `tests/component/BaseLayout.test.ts`); F13 says `code` is drawn by `Inter-Regular`, but prose sets `code` to weight 600, which FR-017 maps to `Inter-Bold` (asserted by computed weight in `tests/e2e/fonts.spec.ts`); F14 names home as a template that draws no italic, while the fonts spec notes the home tagline is italic and checks the rule per template from computed styles. Reword the three rows to match, and note the F02 difference in research R1 or R6.
