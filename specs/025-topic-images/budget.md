# Budget measurements (T026)

`pnpm exec playwright test --project=budget --workers=1`, the existing budget project, unchanged
(simulated slow-4G mobile, 390 px wide). `main` is origin/main at 2d57cb9, measured in a separate
detached worktree on the same machine. Limits: total 150 KB (153,600 bytes), LCP 2,500 ms, CLS
below 0.1. Every page passed on both. LCP is noisy under machine load (several siblings running),
so read it as "well under the limit", not as a delta.

| Page | main totalBytes | branch totalBytes | change | main LCP (ms) | branch LCP (ms) | main CLS | branch CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | 74,235 | 74,267 | +32 | 732 | 832 | 0 | 0 |
| writing-landing | 63,065 | 75,778 | +12,713 | 668 | 724 | 0 | 0 |
| writing-series-drift | 53,958 | 58,506 | +4,548 | 900 | 876 | 0 | 0 |
| writing-series-convergence | 87,466 | 91,755 | +4,289 | 1,020 | 956 | 0 | 0 |

Decision: LCP is at most 956 ms on the branch, below the 2.0 s trigger, so the plan's lever
(`fetchpriority="low"` on the Drift tile, then quality 60) is not applied. The plan estimated
about +10 KB on `/writing/` and +3 to 4 KB on series pages; `/writing/` is slightly above that
(+12.7 KB, 75.8 KB in total) and still half the limit.
