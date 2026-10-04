# Chore plan: freeze-footer-year (issue #45)

Branch: `chore/freeze-footer-year`, from `main` at fb9dd8e (after #54 merged).
Issue: https://github.com/drcdev/dcc-web/issues/45. The PR body says `Closes #45`.

## Goal

The footer prints the year the site was built (`src/components/SiteFooter.astro` line 12,
`const year = new Date().getFullYear();`). That year shows up in the footer, not-found and
sections-fixture snapshots, so the first build in 2027 would fail them all even though nothing
changed. This chore ([#45](https://github.com/drcdev/dcc-web/issues/45), a follow-up from #43)
makes the `visual` project render a fixed year (2026, the year in today's baselines) before
each shot. The snapshots then move only when the footer's design moves. The site's output does
not change and the baselines do not change. The tests that check the real year (the component
test and `shell.spec.ts`) keep checking it.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Unit test, seen failing first.** `tests/unit/site/visual-footer-year.test.ts` (W1) fails
   before W2 (the helper module does not exist yet) and passes after. The implement summary
   records the red run.
2. **Every shot goes through the freeze.** The W1 source check passes: `open()` in
   `tests/e2e/visual.spec.ts` calls `freezeFooterYear(page)` after `page.goto`, and
   `page.goto(` appears nowhere else in the file.
3. **No pixel moves today.** `--project=visual` passes 50 of 50 with no update flag, and
   `git diff --name-only main -- tests/e2e/visual.spec.ts-snapshots/` is empty. No baseline
   refresh on either platform.
4. **The freeze works across a year change** (W3, scratch edit, never committed):
   - Change line 12 of `SiteFooter.astro` to `const year = 2027;`, run `pnpm run build`, then
     `--project=visual`. All 50 pass. (Without the freeze, the 12 year-bearing tests listed
     below would fail.)
   - Revert and rebuild. `git status --porcelain src/` is empty afterwards.
5. **The real year is still tested.** `tests/component/SiteFooter.test.ts` ("states the build
   year and Don's name") and `tests/e2e/shell.spec.ts` (footer `toContainText` with
   `new Date().getFullYear()`) are unchanged and pass.
6. **Test counts:** `--project=visual --list` stays **50**. The unit project gains only the W1
   cases.
7. **Scope of the diff:** `git diff --name-only main` lists only `tests/e2e/footer-year.ts`
   (new), `tests/e2e/visual.spec.ts`, `tests/unit/site/visual-footer-year.test.ts` (new),
   `docs/testing.md` and `.specify/chores/freeze-footer-year/**`. Nothing under `src/`,
   `scripts/`, `.github/`, `.claude/` or `public/`, and not `playwright.config.ts`,
   `package.json`, `astro.config.mjs` or `CLAUDE.md`.
8. `pnpm run verify:quick` is green, then the full gate before the PR.

**Before measurement** (from `ls tests/e2e/visual.spec.ts-snapshots/` and the locators in
`visual.spec.ts`, at fb9dd8e):

| What | Before |
|---|---|
| Visual PNGs | 100 (50 darwin, 50 linux) |
| PNGs whose pixels depend on the build year | **24** (12 per platform): `footer-*` 8, `not-found-*` 8 (full page), `sections-*` 8 (full page; the fixture site uses the same footer) |
| PNGs free of the year | 76: `header-*` and `menu-open-*` (both shoot only `<header>`) and the 8 fixture element subjects |
| Footer text in every baseline | `© 2026 Don Coleman. All rights reserved.` |
| Visual tests that would fail on a 2027 build | 12 (footer, not-found, sections × 2 widths × 2 themes) |
| Visual tests that would fail on a 2027 build after this chore | 0 |

Corrections to the issue and the explore notes: the issue says the header and menu snapshots
carry the year, but they shoot only `<header>`. The explore notes counted 16 year-bearing PNGs
per platform; the snapshot list gives 12 per platform. The explore notes also said the
component test does not assert the year; it does (`SiteFooter.test.ts` line 84, using the
runtime year), as does `shell.spec.ts` line 288.

## Scope

**In:**

- `tests/e2e/footer-year.ts`: new helper module. It is not a spec file, so no Playwright project
  matches it (same pattern as `templates.ts` and `csp-violations.ts`).
- `tests/e2e/visual.spec.ts`: `open()` calls the helper; the head comment and the fixture-block
  comment mention the frozen year.
- `tests/unit/site/visual-footer-year.test.ts` (new).
- `docs/testing.md`: one sentence in "Visual coverage".
- This plan, and the review report later.

**Out:**

- Any change to `SiteFooter.astro` or the build: no env var, no `envField`, no test hook in
  production code.
- `playwright.config.ts`: no global `stylePath` or `mask`.
- Any baseline PNG.
- CLAUDE.md and the four pipeline skills: the shared "Visual baselines" sentences stay true.

**Follow-ups for the PR body:**

- The component and shell tests compare the build year with the test-run year. A build made on
  31 December and tested on 1 January would fail them. That is a separate, rare flake, not this
  issue. Note it; do not fix it here.

## Constitution Check

- **I. Test-First:** W1 (unit) is written and seen failing before W2. W3 proves the freeze on
  real pixels with the existing visual project.
- **II. Automated Release Gate:** no check is skipped or weakened. The year-bearing shots still
  compare every pixel of the footer, including the year's glyphs; only the digits are fixed. The
  real year stays asserted by the component and shell tests.
- **III. Human Review for Major Changes:** no criterion fires. There is no dependency, contact
  data, design system, layout, cost, CI/deployment configuration or constitution change. Only
  test code and docs change, and no baseline moves. Verdict: **not major**; auto-merge applies.
- **IV. First-Party Before Custom:** Playwright's first-party options were weighed (see Docs
  citations). `mask` and `stylePath` would hide the year but change the pixels, and `page.clock`
  cannot reach a year fixed at build time. Astro's typed env (`envField`) could feed the year at
  build time, but it would put a test hook into production code and need wiring in three build
  paths (main build, fixture build, Docker/CI baseline builds). The chosen option uses
  Playwright's own `page.evaluate` to set the text, with no custom tooling. No Astro usage
  changes, so no Astro Docs MCP lookup is needed.
- **V. Static by Default:** unchanged; nothing ships.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** unchanged.
- **VIII. Cloudflare Best Practices:** unchanged.
- **IX. Cost Ceiling:** unchanged.
- **X. Accessible, Fast and Private:** unchanged; the a11y and budget projects are untouched.
- **XI. Spec Kit Workflow:** chore branch and `.specify/chores/freeze-footer-year/` per the
  `/chore` pipeline; no files shared with other in-flight work are known.

## Work items

### W1: Unit test for the freeze helper and its use in `visual.spec.ts` (test first)

- [x] W1 done
- **Files:** `tests/unit/site/visual-footer-year.test.ts` (new).
- **Test:** new-first. **Layer: unit**, the cheapest layer that can observe the mechanism: the
  text rewrite is a pure function, and "every shot is frozen" is a fact about the spec's source.
  The pixel effect is observed by the existing visual project (W3), which is the visual layer
  doing its own job, not a second test of the same behaviour.
- **Cases:**
  1. `FROZEN_FOOTER_YEAR` is `2026` (the year in today's baselines; a comment says why).
  2. `freezeYearText("\n  © 2031 Don Coleman. All rights reserved.\n")` returns the same string
     with `2031` replaced by `2026` and the whitespace untouched.
  3. A text with no `© <four digits>` returns `null`, so the helper can fail loudly rather than
     silently skip.
  4. Source check over `tests/e2e/visual.spec.ts` (read with `readFileSync`, as
     `config-files.test.ts` does for `tests/e2e/`): the body of `async function open(` contains
     `await freezeFooterYear(page)` after `page.goto(`, and `page.goto(` occurs exactly once in
     the file.
- Importing `tests/e2e/footer-year.ts` is safe in Vitest because that module imports only
  `type { Page }` from `@playwright/test`.

### W2: Add the helper and call it from `open()`

- [x] W2 done
- **Files:** `tests/e2e/footer-year.ts` (new), `tests/e2e/visual.spec.ts`.
- **Test:** existing: W1 turns green; `--project=visual` stays 50/50 (W3).
- **Shape:**
  - `export const FROZEN_FOOTER_YEAR = 2026;`
  - A year pattern (`/©\s*\d{4}/` or equivalent) and a pure
    `freezeYearText(text, year = FROZEN_FOOTER_YEAR): string | null`.
  - `export async function freezeFooterYear(page: Page)`: one `page.evaluate` that finds the
    `<footer>` paragraphs whose text matches, rewrites only the four digits in place, and
    returns the count. The Node side throws unless the count is exactly 1, so a footer copy
    change fails loudly instead of letting a real year slip back into the shots.
  - Pass the pattern source and year into `page.evaluate` as arguments (the browser cannot see
    the Node closure). Only `textContent` changes; no `setAttribute("style")` (the CSP blocks
    it).
- In `visual.spec.ts`, `open()` calls `await freezeFooterYear(page)` right after `page.goto`
  and before `settleImages`. Every test already goes through `open()`, so the header, menu and
  element-shot tests get it too; it has no effect on their pixels.
- Update the head comment with one line: the footer year is frozen to 2026 so a new calendar
  year cannot fail the shell, not-found or sections shots (issue #45). Reword the fixture-block
  comment that says the element shots keep "the footer's build-time year" out: the footer is
  still out of those shots, but the year clause is no longer the reason that matters, so drop
  it.

### W3: Prove it on pixels (scratch run, no commit of the scratch edit)

- [ ] W3 done
- **Files:** none committed. Scratch edit of `src/components/SiteFooter.astro` line 12,
  reverted in the same step.
- **Test:** existing visual project. **Layer: visual**, because only a screenshot shows the
  rendered year matches the baseline.
- **Steps** (through the wrapper, Playwright in the background; check `lsof -i :4321` first,
  because sibling worktrees share the port):
  1. `pnpm run build`, then `playwright test --project=visual`: 50 passed, no PNG changed
     (acceptance 3).
  2. Set `const year = 2027;`, `pnpm run build`, `--project=visual`: 50 passed (acceptance 4).
     Optionally, with W2's call commented out, the same run shows the 12 expected failures.
     Record the result in the implement summary either way.
  3. Revert, `pnpm run build`, and confirm `git status --porcelain src/` is empty.
- macOS run only. The Linux baselines are not touched; CI's `verify` compares them on the PR.

### W4: Note the frozen year in `docs/testing.md`

- [ ] W4 done
- **Files:** `docs/testing.md`, the "Visual coverage" paragraph (around line 117).
- **Test:** no behaviour: n/a (documentation).
- Add one sentence: the visual project sets the footer year to 2026 before every shot
  (`tests/e2e/footer-year.ts`), so a new calendar year cannot fail it, and the real year is
  checked by `SiteFooter.test.ts` and `shell.spec.ts`. Leave the Layers table, the "Where a test
  goes" bullets and every CLAUDE.md-aligned sentence byte-identical.

## Docs citations

Playwright (the tool whose usage changes):

- `page.evaluate(pageFunction, arg)`: https://playwright.dev/docs/api/class-page#page-evaluate
  and https://playwright.dev/docs/evaluating (arguments are passed explicitly; the function runs
  in the page). This is the chosen mechanism.
- `toHaveScreenshot` options `mask` and `stylePath`:
  https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1 and
  https://playwright.dev/docs/test-snapshots. Considered and rejected. `mask` paints a box over
  a locator; the year has no element of its own, and the box changes the pixels, so every
  year-bearing baseline would need a refresh. `stylePath` can hide the year with CSS but cannot
  change text, so it also changes the pixels.
- Clock API: https://playwright.dev/docs/clock. Considered and rejected: it fakes the page's
  runtime clock, but the year is fixed in static HTML at build time.

Astro: no Astro usage changes. The build-time alternative (an `astro:env` `envField` read in
`SiteFooter.astro`) was rejected on scope grounds above, so no Astro Docs MCP lookup is cited.

## Risks

- **Port 4321 is shared with sibling worktrees.** A collision gives spurious 404s or
  ECONNREFUSED. Check `lsof -i :4321` first and rerun when idle.
- **Stale `dist/`.** W3 needs a fresh `pnpm run build` before each visual run and after the
  revert. Skipping the last rebuild leaves a 2027 `dist/` that fails `shell.spec.ts` in the
  full gate.
- **Footer copy changes later.** If the © line is reworded, `freezeFooterYear` throws in every
  visual test. That is intended: loud, obvious, and a one-line fix in the helper. The helper's
  comment says so.
- **Glyph width.** Today's baselines say 2026, so freezing to 2026 is pixel-identical. If the
  frozen year were ever changed, every year-bearing baseline would need a refresh.
- **Linux baselines** are unchanged and not compared locally; CI is the check. No baseline step
  is expected, and any diff there is a regression to fix, not a baseline to refresh.
