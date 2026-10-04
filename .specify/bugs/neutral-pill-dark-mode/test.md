# Bug Verification: Neutral topic pill visible in dark mode

- **Slug**: neutral-pill-dark-mode
- **Tested**: 2026-10-03
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The dusk pill now carries `dark:border-dusk-400` (4.00:1 against the dusk-800 card, 4.78:1 against the page, per the assessment arithmetic the unit test recomputes from `global.css`). The new unit test fails without the class and passes with it, the browser computed style shows the border token in dark mode, and the unit, component and visual suites pass. No regressions found.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Read `topic-styles.ts` and `global.css`; theme-tokens probe on `/writing/every-part/` (title-card free-form pill) | pass | Pill has `dark:border-dusk-400`; computed `border-top-color` is dusk-400 in dark, transparent in light |
| Fails without the fix | Temporarily removed the class, `vitest run tests/unit/content/topics.test.ts` | pass (2 failed, 53 passed as expected) | Source restored afterwards; `git status` clean |
| New / updated tests | `vitest run topics.test.ts TopicPill.test.ts` | pass | 62 passed |
| E2E token probe | `playwright test tests/e2e/theme-tokens.spec.ts` | pass | 6 passed (after port collision rerun) |
| Unit + component regression | `pnpm run test:unit` (project includes component tests) | pass | 170 files, 2442 tests |
| Visual | `pnpm run test:visual` | pass | 50 passed on macOS baselines |

## Output Excerpts

- Without the class: `Tests 2 failed | 53 passed (55)`; `expect(edge).toBeDefined()` fails.
- Visual: `50 passed (1.7m)`.

## Residual Risks

- Two earlier runs failed only because sibling worktree `chore-playwright-theme-layout-tidy` (and `cta-dark-mode`) held ports 4321/4322 and served their unfixed site (the pill lacked the class; one visual diff on listing-cards-phone-dark). Reruns once the ports were free passed. A wrangler "Address already in use" message on the last run is the same collision on 4321 and does not affect the visual project.
- Linux baselines are not covered here; the orchestrator regenerates them.
- Full `pnpm run verify` not run (orchestrator gate).
- Major-change candidate per the assessment: Don should check dark mode on the preview.

## Recommendation

Close the bug as verified, subject to the orchestrator's full verify gate and the Linux baselines.
