# Review report: playwright-theme-layout-tidy (issue #49)

Reviewed `git diff main...HEAD` (commits 43e400f, 7de110e, 8380ef4, 2ceeb5d, 35f7974) against
`plan.md`, with a fresh `playwright test --list` run per project on HEAD.

## Verdict

All four implement items (W1 to W4) are done as planned. There is no scope creep, no weakened
check and no site change. The Principle III verdict, **not major**, still holds. Findings:
**0 CRITICAL, 0 HIGH, 3 LOW**.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **`docs/testing.md:427`: the gate-times row names the wrong number of projects.** The row is
   labelled "All Playwright tests (`--list`, four local projects)", but 1419 and 1395 are totals
   over **five** projects: 609 + 608 + 50 + 55 + 73 = 1395, counting e2e, a11y, visual, sections
   and budget. Change it to "five local projects" when W5 fills in the `pending` cells.
   _Fixed by the orchestrator in the review commit._
2. **`tests/e2e/theme-tokens.spec.ts:36-37`: two blank lines** are left where the local `Theme`
   type was removed. Cosmetic only, and `verify:quick` passes. Fold the fix into W5.
   _Fixed by the orchestrator in the review commit._
3. **The plan names two focus probes; the code has three.** Plan acceptance 3 and W3 say "both
   focus probes (prose link and build link)". `theme-tokens.spec.ts` actually has three probes
   with `focus: true`: the CTA button focus ring (line 106), the prose link (179) and the build
   link (210). `expectRealRing` runs on every focus probe, which is what W3's own "every probe
   with `focus: true`" rule says. So the plan miscounted; this is not scope creep. No probe or
   test was added (the file still has 6 tests). No code change is needed; name all three probes
   in the PR body.

## Checks made

- **Scope (acceptance 7).**
  - The diff touches only `tests/e2e/**` (12 files, one new: `color-theme.ts`),
    `docs/testing.md` and the plan.
  - Nothing changed under `src/`, `.github/`, `.claude/`, `public/`, `tests/unit/` or
    `tests/e2e/visual.spec.ts-snapshots/`.
  - `package.json`, `pnpm-lock.yaml`, `wrangler.jsonc`, `playwright.config.ts` and `CLAUDE.md`
    are untouched.
  - No pipeline skill changed, so the alignment rule does not apply.
- **W1, the theme helper (acceptance 1).**
  - `grep '"color-theme"'` finds only `color-theme.ts:12` and the `KEY` constant at
    `theme.spec.ts:10`. `grep '(?!.*\bdark'` finds only `color-theme.ts:21`.
  - The helper is identical to the copies it replaces: same key, same `try`/`catch`, same
    "falls back to dark" comment. `expectThemeClass` uses the same pair of regexes.
  - All eight specs now use it, and `theme.spec.ts` is untouched.
  - `not-found.spec.ts` switched from `not.toHaveClass(/\bdark\b/)` to the light-theme regex.
    The two are equivalent. Its theme setup also gains the storage fallback, which cannot
    change a passing run.
  - `sections.spec.ts` dropped an unused `Page` import. `blog.a11y.spec.ts` keeps its `Page`
    import because `noSidewaysScroll` still uses it.
- **W2, folding the sideways-scroll checks into geometry (acceptance 2).**
  - **What geometry now runs.** `WIDTHS` holds narrow 320x640, phone 390x844 and desktop
    1280x800, over the same 18 `TEMPLATES` (all built), with JavaScript on. The narrow case
    makes the same `scrollWidth <= clientWidth` assertion as the removed tests. It also runs
    the element walk and checks the header, main and footer order. `--list` shows 18 "at narrow
    width" tests.
  - **a11y.** The 18 removed "320 CSS px" tests used the same viewport and the same assertion
    as geometry's narrow case. The 200% zoom test (`a11y.spec.ts:168`), the 1.4.12
    text-spacing test (260) and the 400% zoom story test (403) are still there, and so is
    `expectNoHorizontalScroll`.
  - **pages.spec.ts.** The scroll checks now run only for paths outside `TEMPLATES`, and
    `--list` shows them for `/privacy/tempo/` alone. All seven removed paths (21 tests) are
    templates, and geometry covers them at the same three widths.
  - **projects.spec.ts.** The `/projects/` loop (3 tests) is gone. `/projects/` is a template,
    so geometry covers it at all three widths.
  - **Kept as planned.** The sideways-scroll checks in shell, no-js, blog (lines 113, 125, 316
    and 356), blog.a11y text spacing, `sections.spec.ts`, `projects-fixtures` and
    `blog-fixtures` are all still there. These files show no diff beyond the W1 imports.
  - Geometry's head comment is accurate.
- **W3, the focus ring (acceptance 3).**
  - **The real rule** is `global.css:282-285`:
    `outline-2 outline-offset-2 outline-accent-500 dark:outline-accent-400`.
  - **What the test checks.** Before focus, `outline-style` is `none`. After focus, the ring is
    `solid`, `2px`, offset `2px`. The test then sets the element's inline colour to
    `rgb(1, 2, 3)`, checks that `outline-color` still equals the token, and removes the inline
    colour before `blur()`.
  - **Passes with the real CSS:** the ring colour is an explicit token, so the text colour does
    not affect it.
  - **Fails if the ring falls back to `currentColor`:** the ring turns `rgb(1, 2, 3)`. The old
    token assertion would still pass in dark mode, where link and ring share `accent-400`.
  - **Fails with Chromium's default ring** (`auto`, 1px, offset 0), on the shape checks.
  - `design-tokens.test.ts` and all CSS are unchanged.
- **W4, docs.**
  - The E2E row now says "at 320, 390 and 1280 px".
  - The theme-tokens paragraph and the helper sentence are accurate.
  - The gate-times entry has the before figures (run 37161130853: e2e job 445 s, step 318 s),
    the after counts, and the times still pending. The only problem is the wording in LOW 1.
  - The "Where a test goes" bullets are untouched.
- **No test lost silently.**
  - Per-file counts on HEAD match the plan: geometry 54, pages 50, projects 18, theme-tokens 6.
  - Files with no diff keep their counts.
  - The project totals move by exactly -24 (e2e -6, a11y -18), all accounted for by the mapping.

## Before/after measurement (local `playwright test --list`)

| Project  | Before (fb9dd8e)  | After (HEAD 35f7974) |
| -------- | ----------------- | -------------------- |
| e2e      | 615               | 609 (19 files)       |
| a11y     | 626               | 608 (3 files)        |
| visual   | 50                | 50                   |
| sections | 55                | 55                   |
| budget   | 73                | 73                   |
| All      | 1419 in 28 files  | 1395 in 28 files     |

The CI times (before: e2e job 445 s, `test:e2e:parallel` step 318 s) come from the PR run in W5.

## Follow-ups for the PR body

- `Closes #49`.
- LOW 1 ("four" becomes "five") and LOW 2 (the double blank line) are fixed in the review commit.
- Say that `expectRealRing` covers all three focus probes (CTA button, prose link, build link).
- Say that `blog-fixture.a11y.spec.ts` held a copy of the theme snippet that the issue did not
  count.
- Include the W2 coverage mapping and the before/after table.
- Principle III: not major. Turn auto-merge on after the after-figures push.
