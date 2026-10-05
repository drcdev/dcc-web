# Bug Assessment: Questions bucket sized for Granite, not Llama; forced regeneration can drain it

- **Slug**: questions-bucket-sizing
- **Created**: 2026-10-04
- **Source**: GitHub issue #90 (pasted text, supplied by the orchestrator; no URL fetched)
- **Verdict**: valid
- **Severity**: low (availability only, no cost and no data risk; matches the issue's "Low, A04")

## Report (summarized)

"Resize the questions bucket for the Llama model's worst case and cap forced regeneration."
The questions API's limits were sized for the Granite model at about 13 neurons per generation.
After the switch to Llama 3.2 3B (commit 2942810) the repo's own research puts the worst case at
about 39 neurons. Two full 200-token buckets (production and preview) on the longest post can
spend more than the account's 10,000 free neurons a day; on Workers Free that means production
generations fail for the rest of the day. The "New questions" action (`fresh: true`) skips the
cache and takes a token on every call, and the origin check does not stop scripts, so one caller
can spend the allowance quickly. The preview bucket is as large as production's.

Done when:
- bucket sizes satisfy 2 x capacity x worst-case neurons <= 10,000, or preview gets a much
  smaller per-environment bucket in `worker/src/questions/config.ts`;
- forced regeneration cannot use the whole bucket (a reserve, or its own small bucket row), with
  no reader identity;
- `specs/022-critical-thinking-questions/plan.md` and `research.md` state the Llama numbers and
  the corrected sizing rule;
- Worker tests cover the reserve and the sizes.

## Symptom

With `BUCKET_CAPACITY = BUCKET_REFILL_PER_DAY = 200` in both environments and a worst case of 39
neurons per generation, the two buckets can spend 2 x 200 x 39 = 15,600 neurons in a day (more,
counting refill, see below), over the 10,000/day free allocation, after which Workers AI refuses
production generations until the daily reset. Expected: the worst case of both environments
together stays inside the free allocation (Principle VIII), and "New questions" alone cannot
empty the bucket.

## Reproduction

Analytical (no live spend needed):

1. `worker/src/questions/config.ts:9-10`: capacity 200, refill 200/day, the same for both
   environments (nothing in `worker/src` distinguishes the environment; `wrangler.jsonc` has no
   `vars`).
2. `research.md:50`: worst case (input capped at 24,000 chars, 300 output tokens) is 39 neurons.
3. Send `POST /api/questions` with `{ slug, hash, fresh: true }` repeatedly from a script with
   the site's `Origin`: every call passes the origin check, skips the cache
   (`handler.ts:78`), takes a token (`handler.ts:98`) and stores nothing (`handler.ts:114`), so
   200 calls empty the bucket. Doing the same against preview spends the shared account
   allowance. `worker/test/questions.test.ts` Q21 already shows N fresh calls take N tokens.

## Suspected Code Paths

- `worker/src/questions/config.ts:8-10`: bucket sizes, one value for every environment, sized
  against the old 13-neuron worst case.
- `worker/src/questions/bucket.ts:20-35`: `takeToken` takes whenever `available >= 1`; it has no
  notion of a reserve. `limits` is already a parameter, so a reserve can be added without a
  schema change.
- `worker/src/questions/handler.ts:78-88,98,114`: `fresh` bypasses the cache and calls
  `takeToken` with the same defaults as a first generation.
- `specs/022-critical-thinking-questions/plan.md:23,56,77,235-237`: "200 a day", "worst case 13
  neurons", "2 x capacity x 13 <= 10,000".
- `specs/022-critical-thinking-questions/research.md:50-62,140,188-189`: gives 39 and 15,600
  neurons/day yet says "the bucket keeps usage under it anyway"; R4 still says "~13 neurons";
  the R-decision lists 200/200.
- `specs/022-critical-thinking-questions/spec.md:17,268-269` (Clarifications, FR-017): "about
  200 generations a day", "capacity of 200 tokens ... 200 tokens a day".
- `specs/022-critical-thinking-questions/data-model.md:82-83`: config table 200 / 200.
- `specs/022-critical-thinking-questions/contracts/questions-panel.md:70`: "At the default 200 a
  day one token refills every 432 s".
- `specs/022-critical-thinking-questions/contracts/questions-api.md:37,47,75`: the `fresh` step
  and Q08 need the reserve rule.

## Root Cause Hypothesis

Confidence: high. The bucket numbers and the sizing rule were derived from the Granite model's
~13-neuron worst case. Commit 2942810 switched to Llama 3.2 3B, whose worst case is ~39 neurons;
research.md and plan.md row IX were updated with the new neuron figures but the bucket size and
the sizing rule in plan.md Risks were not. Separately, `fresh` was designed to spend from the
same bucket with no limit of its own, which FR-026 accepts for the bucket as a whole but which
lets the uncached action alone exhaust it.

A further point the issue's own rule misses: the free allocation resets daily, while the bucket
refills continuously. In one calendar day an environment can spend a full bucket at the start
plus the whole day's refill, so the true bound is
**2 environments x (capacity + refill per day) x 39 <= 10,000**, not 2 x capacity x 39. At
200/200 that is 2 x 400 x 39 = 31,200 neurons/day.

## Proposed Remediation

**Preferred (chosen): equal, smaller buckets in `config.ts`, no wrangler change, plus a fresh
reserve.**

1. Sizes: `BUCKET_CAPACITY = 60`, `BUCKET_REFILL_PER_DAY = 60` (same in both environments).
   Worst case per environment per day: (60 + 60) x 39 = 4,680 neurons; both environments: 9,360
   <= 10,000. The issue's simpler rule also holds (2 x 60 x 39 = 4,680). Typical: 2 x 60 x 5.9 ≈
   710 neurons/day. 64/64 would fit (9,984) but leaves no margin for estimate error; 60 does.
2. Record the rule in code: add `WORST_CASE_NEURONS = 39` and `FREE_NEURONS_PER_DAY = 10_000`
   to `config.ts` with a comment stating the rule, so the config test can assert it and any
   future resize that breaks it fails.
3. Fresh reserve: add `FRESH_RESERVE = 20` to `config.ts`. `takeToken` gains an optional
   `reserve` argument (default 0): the atomic UPDATE takes only when `available >= 1 + reserve`;
   on refusal `retryAfter` is the time until `available` reaches `1 + reserve`. The handler
   passes `FRESH_RESERVE` only when `fresh` is true. "New questions" can therefore spend at most
   40 of a full bucket (plus refill above the reserve), and the last 20 tokens always remain for
   first-time generations, which are cached and so bounded by the number of post versions. A
   refused fresh call is the existing Q08 429 `limited` with `Retry-After`; no new error code,
   no reader identity, no schema change. Refunds are unchanged (`min(capacity, tokens + 1)`).
4. Docs: plan.md (Summary, Constraints, row IX, Risks "Shared allowance" with the corrected rule
   using 39 and capacity + refill), research.md (R1 bullets: drop "keeps usage under it anyway",
   state 60/60, 9,360 worst case, ~710 typical; R4 "~13" -> "~39"; config decision values),
   spec.md FR-017 and the Clarifications line (60 / 60, fresh reserve), data-model.md config
   table (add `FRESH_RESERVE`, `WORST_CASE_NEURONS`, `FREE_NEURONS_PER_DAY`),
   contracts/questions-api.md step 7 and Q08 (fresh takes only above the reserve; new contract
   row for it), contracts/questions-panel.md P15 note (one token every 1,440 s at 60 a day; a
   refused fresh call can reach the hours form).

**Decision and rationale (equal sizes vs per-environment var).** The issue allows either. A
per-environment size (for example production 100/100, preview 10/10) would need a new `vars`
entry under `env.preview` in `wrangler.jsonc` and regenerated `worker/worker-configuration.d.ts`.
That is a deployment configuration change, which makes the PR a major change under Principle III
and needs Don's preview review. Equal sizes that each fit half the free allocation fully meet the
issue: each environment's worst day (4,680) is below half the allowance, so preview traffic can
never spend production's half, which is what "preview cannot starve production" needs. Principle
V asks for one bucket per environment sized in one module, and the sizes stay in `config.ts`.
Lowering limits cannot increase cost, so the change is not major. Cost of the choice: production
gets 60 generations a day rather than ~100. For a site with a handful of posts, where every
first generation is cached and only "New questions" spends repeatedly, 60 is ample; if it proves
tight, a later major-change PR can add the per-environment var.

**Alternatives**:
- Per-environment var (production ~100/100, preview ~10/10): more production headroom, but a
  wrangler config change (major change, Principle III) and typegen churn. Rejected for this fix.
- A second `usage_bucket` row (id = 2) for fresh: needs a migration and changes the data model's
  "one row" invariant; the reserve gives the same guarantee with no schema change. Rejected.
- Keep 200/200 and rely on Workers Free refusing past the allocation: that is the bug
  (production outage for the rest of the day). Rejected.

**Files likely to change**:
- `worker/src/questions/config.ts`
- `worker/src/questions/bucket.ts`
- `worker/src/questions/handler.ts`
- `worker/test/questions-config.test.ts`
- `worker/test/questions-bucket.test.ts`
- `worker/test/questions.test.ts`
- `specs/022-critical-thinking-questions/plan.md`, `research.md`, `spec.md`, `data-model.md`,
  `contracts/questions-api.md`, `contracts/questions-panel.md`

**Tests to add or update** (layer: **Worker integration**, `pnpm run test:worker` on
`vitest-pool-workers` with local D1, the cheapest layer that can observe the atomic bucket
UPDATE and the handler's 429; the pure sizing-rule check sits in the same suite's
`questions-config.test.ts`, which already runs there; no second layer):
- `questions-config.test.ts`: the sizing rule holds,
  `2 x (BUCKET_CAPACITY + BUCKET_REFILL_PER_DAY) x WORST_CASE_NEURONS <= FREE_NEURONS_PER_DAY`;
  `FRESH_RESERVE`, `WORST_CASE_NEURONS`, `FREE_NEURONS_PER_DAY` join the positive-number list;
  `FRESH_RESERVE` is below `BUCKET_CAPACITY` (so fresh is not disabled outright).
- `questions-bucket.test.ts`: with a reserve R, a take succeeds while `available >= R + 1` and
  is refused (tokens unchanged) once `available < R + 1`; the refusal's `retryAfter` is the time
  to reach `R + 1`; a take with no reserve still spends down to 0; refund is unchanged.
- `questions.test.ts`: a fresh call with exactly `FRESH_RESERVE` tokens left is 429 `limited`
  with matching `Retry-After`, makes no model call and leaves the tokens unchanged, while a
  first generation (not fresh) at the same level still succeeds (new contract row); Q21 is
  rewritten to drive N first generations (different post versions or slugs) rather than `fresh`
  calls, or to set the bucket at `FRESH_RESERVE + N`, since fresh now stops at the reserve; the
  "New questions takes a token" test sets the bucket above the reserve (e.g.
  `FRESH_RESERVE + 5`).
- `environments.test.ts` (Q26) needs no change: both environments still use their own database
  and bucket row; equal sizes are asserted by the config test.

## Risks & Considerations

- 60 a day is a 70% cut in production capacity. Acceptable at today's traffic (every first
  generation is cached); revisit with a per-environment var if 429s appear in the outcome logs.
- The live `usage_bucket` rows may hold more than 60 tokens (up to 200) after deploy. The
  existing `MIN(capacity, ...)` in the take expression clamps available to the new capacity on
  the first take, so no migration is needed; the stored value is only an upper bound. The fix
  should confirm with a test that a row above capacity is read as `capacity`.
- A fresh refusal from an empty bucket can now say "about N hours" (up to ~8.4 h for 21 tokens at
  1,440 s each); P15 already handles the hours form.
- No new dependency, binding, migration or wrangler change; lowering limits cannot raise cost.
  Not a major change under Principle III.
- The recorded FR-026 decision (no per-reader bucket, no Turnstile; one caller can still drain
  the bucket through first generations of new post versions, which are few) is unchanged.

## Open Questions

None. Judgment calls made in automated mode, for Don to see in the PR: equal 60/60 sizes rather
than a per-environment var; the stricter capacity-plus-refill sizing rule; `FRESH_RESERVE = 20`.
