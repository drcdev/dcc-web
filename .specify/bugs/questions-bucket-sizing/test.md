# Bug Verification: Questions bucket sized for Granite, not Llama; fresh can drain it

- **Slug**: questions-bucket-sizing
- **Tested**: 2026-10-04
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The sizing rule now holds with the Llama worst case (2 x (60 + 60) x 39 = 9,360 <= 10,000; the old 20/20 sizing used the Granite 13 figure). `fresh` is refused at or below the reserve, so it cannot drain the bucket. The worker suite is green and the spec docs match `worker/src/questions/config.ts`.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction: sizing arithmetic | 2 x (60+60) x 39 | pass | 9,360 <= 10,000 |
| Reproduction: fresh drain | questions.test.ts Q21/Q21a, bucket reserve tests | pass | fresh at reserve is 429, no model call, tokens kept; first generation still succeeds |
| New / updated tests | `pnpm run test:worker` | pass | 18 files, 258 tests |
| Regression (unit, questions) | `vitest run tests/unit/questions` | pass | 12 tests |
| Docs check | grep specs/022 for "x 13", "keeps usage under" | pass | Only remaining 13 is the Granite alternative in research.md R1 (correct) |
| Config vs docs | config.ts 60/60, 39, 10,000, reserve 20 vs plan.md | pass | matches |

## Residual Risks

- Real Llama cost is not sampled here; 39 is a computed worst case.
- Reserve of 20 may yield 429s on "New questions" under heavy use; watch outcome logs.
- Full verify gate is run by the orchestrator, not here.

## Recommendation

Close the bug; verified.
