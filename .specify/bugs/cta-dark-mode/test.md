# Bug Verification: Call-to-action button has no dark-mode style

- **Slug**: cta-dark-mode
- **Tested**: 2026-10-03
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

Both call-to-action buttons now compute rust-300 fill and dusk-900 text in dark mode, and the light-mode pair is unchanged (rust-600 / white). The theme-token, accessibility and visual (macOS) checks all pass with no unexpected diffs.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `playwright test tests/e2e/theme-tokens.spec.ts` | pass | 8 passed; "CTA button" on `/sections/` and "home intro CTA button" on `/`, both toggle orders |
| Light-mode sanity | same spec | pass | light expectations in the probes are still `rust-600` / `white` |
| Component tests | `vitest run tests/component/sections/CallToAction.test.ts tests/component/HomeIntro.test.ts` | pass | 2 files, 15 tests |
| Accessibility + visual | `playwright test tests/e2e/a11y.spec.ts tests/e2e/visual.spec.ts` | pass | 478 passed, incl. dark `sections-*` against refreshed darwin baselines |
| Repo hygiene | `git status`, `git ls-files` | pass | clean apart from test.md; no tracked -previous/-actual/-diff PNGs |

## Output Excerpts

- theme-tokens: `8 passed (22.2s)`, `WT_EXIT=0`
- a11y + visual: `478 passed (1.2m)`, `WT_EXIT=0`

## Residual Risks

- Linux visual baselines are not regenerated here (orchestrator's job); CI will fail the two dark `sections-*` shots until they are.
- Hover state (rust-200) is not probed by any test.
- Earlier runs in this session failed from environment, not code: sibling worktrees held ports 4321/4322 (stale servers), and without `ASTRO_PREVIEW_BACKGROUND=1` the fixture `astro preview` exits at start in an agent shell. Passing runs used that variable with both ports free.

## Recommendation

Close the bug as verified locally; regenerate the Linux dark `sections-*` baselines, and treat the PR as a major change (Principle III) per the assessment.
