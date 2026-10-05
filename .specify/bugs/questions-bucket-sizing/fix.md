# Bug Fix: Questions bucket sized for Granite, not Llama; forced regeneration can drain it

- **Slug**: questions-bucket-sizing
- **Fixed**: 2026-10-04
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

The bucket is now 60 capacity / 60 a day in both environments, so both environments' worst day
(2 x (60 + 60) x 39 = 9,360 neurons) fits the 10,000 free allocation. "New questions" (`fresh`)
now takes a token only while more than `FRESH_RESERVE = 20` remain, so it cannot drain the
bucket that first generations need.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `worker/src/questions/config.ts` | modified | 60/60; added `WORST_CASE_NEURONS`, `FREE_NEURONS_PER_DAY`, `FRESH_RESERVE` and the sizing-rule comment |
| `worker/src/questions/bucket.ts` | modified | `takeToken` gains optional `reserve` (default 0); take needs `available >= 1 + reserve`; `retryAfter` is the time to reach `1 + reserve` |
| `worker/src/questions/handler.ts` | modified | passes `FRESH_RESERVE` only when `fresh` is true |
| `worker/test/questions-config.test.ts` | modified | sizing rule, new constants positive, reserve below capacity |
| `worker/test/questions-bucket.test.ts` | modified | reserve take/refuse, retryAfter to reserve + 1, no-reserve unchanged, stored value above capacity read as capacity |
| `worker/test/questions.test.ts` | modified | fresh at the reserve is 429 with no model call and tokens kept, first generation at that level succeeds; Q21 drives first generations; "New questions takes a token" starts above the reserve |
| `specs/022-critical-thinking-questions/` plan, research, spec, data-model, contracts (api, panel) | modified | Llama numbers (39 worst case, 710 typical), corrected sizing rule, 60/60, reserve |

## Tests Added or Updated

All at the Worker integration layer (`pnpm run test:worker`); no second layer.

- `questions-config.test.ts`: sizing rule holds; `FRESH_RESERVE < BUCKET_CAPACITY`.
- `questions-bucket.test.ts`: reserve behaviour, retryAfter, row above capacity clamped.
- `questions.test.ts`: fresh at the reserve is 429 `limited` (new Q21a), Q21 rewritten.

## Local Verification

- `pnpm run test:worker` first run red (missing constants), then 18 files / 258 tests green.
- `pnpm run verify:quick` → EXIT=0.

## Deviations from Assessment

None.

## Follow-ups

- Revisit with a per-environment var (major change) if 429s appear in outcome logs.
