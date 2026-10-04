# Review report: freeze-footer-year (issue #45)

Reviewed `git diff fb9dd8e...HEAD` (5 commits, 19de00d..7be8818) against plan.md.

## Verdict

All four work items done as planned, nothing beyond. No CRITICAL or HIGH findings.
Principle III: not major (test code, one docs sentence, chore dir only; no dependency,
config, CI, design-system, layout or baseline change).

## Checks

- Scope: only tests/e2e/footer-year.ts (new), tests/e2e/visual.spec.ts,
  tests/unit/site/visual-footer-year.test.ts (new), docs/testing.md, the chore plan.
  Nothing under src/, scripts/, .github/, .claude/; no PNG; no config; CLAUDE.md untouched.
- W1 test-first: 3f40724 commits the test red; 0f4799a turns it green. Re-run: 5/5 pass.
- Layers: unit for the pure rewrite and source check; existing visual project is the pixel
  proof (W3). No duplicate layer.
- W3: 50/50 x3 on a 2027 build, no update flag, scratch edit reverted, dist rebuilt (recorded
  in plan; not re-run).
- Real year: tests/component/SiteFooter.test.ts:84 and tests/e2e/shell.spec.ts:288 unchanged.
- Helper: pattern `(©\s*)\d{4}` -> `$1<year>` rewrites only the digits; the copyright `<p>`
  (SiteFooter.astro:38-40) is text-only so textContent drops nothing; args passed to
  page.evaluate; no setAttribute("style"); throws unless exactly one footer p matches.
- No leak: `page.goto(` once (visual.spec.ts:42 in open()); every toHaveScreenshot (79, 84, 89,
  100, 110, 220) follows open(); menu click (98) does not navigate. Freeze precedes the theme
  assertion, settleImages and every shot.
- 2026 documented: footer-year.ts:3-6, visual.spec.ts:21-22, docs/testing.md:125-127, unit case 1.
- Alignment rule: n/a (no pipeline skill or CLAUDE.md sentence changed).
- No check weakened: every footer pixel is still compared; only the digit values are fixed.
- Drift guard: no specs/, .specify/, .claude/ or CLAUDE.md literal in the test files.
- eslint on the three files: exit 0.

## Findings (CRITICAL 0, HIGH 0, LOW 2)

- LOW tests/unit/site/visual-footer-year.test.ts:30-36: open() body slice runs to end of file,
  so a freeze call elsewhere would satisfy it; harmless given the single-goto case.
- LOW tests/e2e/footer-year.ts:24-41: page-side rewrite duplicates freezeYearText (unavoidable);
  unit test covers the Node copy, W3 covers the page copy.

## Measurement

| What                                  | Before (fb9dd8e)               | After (HEAD)                      |
| ------------------------------------- | ------------------------------ | --------------------------------- |
| Visual PNGs                           | 100                            | 100, none changed                 |
| Year-bearing PNGs                     | 24 (footer/not-found/sections) | 24, rendered with frozen 2026     |
| Visual tests failing on a 2027 build  | 12 (analysis)                  | 0 (W3 50/50 x3)                   |
| visual-footer-year.test.ts            | red at 3f40724                 | 5/5 pass                          |

## Follow-ups for the PR body

- SiteFooter.test.ts and shell.spec.ts compare the build year with the test-run year; a build
  on 31 December tested on 1 January would fail them. Rare, separate flake; not fixed here.
- Changing FROZEN_FOOTER_YEAR from 2026 requires refreshing all 24 year-bearing baselines on
  both platforms.
