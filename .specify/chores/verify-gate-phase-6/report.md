# Review report: verify-gate-phase-6 (issue #26, phase 6, final)

Reviewed 2026-10-02 on branch `chore/verify-gate-phase-6` against `main` (fresh eyes, read-only
outside this file). The review subagent could not write this file itself; the orchestrator saved
its returned text here verbatim and appended the round-2 section.

## Summary

W1 is done as planned and nothing beyond it. The diff touches only `docs/testing.md` and
`.specify/chores/verify-gate-phase-6/plan.md`. The new `## Measured gate times` section matches
the plan's content, and every headline figure checks out against `gh run view --json jobs`. One
secondary range in the record is wrong: the `build-tests` "full tier" range leaves out two
full-tier runs.

Findings: **0 CRITICAL, 1 HIGH, 2 LOW.**

## Findings

### HIGH

**H1. `docs/testing.md:341-342`: the `build-tests` range "338 to 393 s on the full tier" is
wrong.** Every `main` push run since #31 ran "Run the build tests" and skipped "Run the build
tests that read the real content", so all of them are full tier, as the record's own Method line
says ("A push to `main` is always the full tier"):

| Run | Merge | `build-tests` | `e2e` | Wall |
|---|---|---|---|---|
| 37040715545 | #31 | 393 s | 427 s | 450 s |
| 37054250009 | #32 | 245 s | 434 s | 464 s |
| 37067125483 | #33 | 252 s | 356 s | 396 s |
| 37080153727 | #34 | 377 s | 451 s | 479 s |
| 37090465334 | #36 | 338 s | 341 s | 375 s |

The full-tier `build-tests` range is **245 to 393 s**, not 338 to 393 s. The plan's guess that
#33 and #34 took the content-only path (plan.md line 54) does not hold either: #34 was 377 s, and
the short runs were #32 and #33, both full tier. The conclusion still stands, because `e2e` is
longer than `build-tests` in every run. Fix: in `docs/testing.md:341-342`, change "(338 to 393 s
on the full tier)" to "(245 to 393 s)". The issue #37 body repeats "338 to 393 s" (plan.md line
244), so correct it there too. The plan's judgment call that the 300 s `e2e` target "sits just
under today's best `build-tests` (338 s)" (plan.md line 291) also rests on this figure. It is the
orchestrator's and #37's call whether 300 s still holds.

### LOW

**L1. `docs/testing.md:10`: the appended intro clause is not wrapped.** The line is about 130
characters, while the paragraph wraps at about 95. The wording is exactly the plan's, so it is in
scope. Fix it by re-wrapping the line; the text stays the same.

**L2. `plan.md:53-56`: the content-only inference is wrong** (see H1). It is only in the plan, and
the record does not rely on it, as the plan's Risks section intended. Note it in the PR body, or
correct it with H1.

## Checks

- **W1 content against the plan:** every planned element is present and matches:
  - the date and commit line;
  - the before/after table: CI 31 min (run 36814114154) to 6 min 15 s (run 37090465334), range
    6:15 to 7:59; local 8 to 10 min to 5 min 39 s (339 s); targets ≤ 10 min met, ≤ 4 min not met
    and revised to ≤ 6 min under N1, with 4 min moving to #37;
  - the per-job table;
  - the local stage table: Vitest 180 files, 2570 passed, 1 skipped, 156.45 s; worker 12 files,
    132 passed, 3.47 s; Playwright 1388 passed, 144 s; total 339 s, VERIFY_EXIT=0;
  - the Vitest-versus-`e2e` sentence;
  - the three-item Method list.

  No em dashes in the new text. The load average is not recorded, which the plan allows ("if the
  orchestrator gave one").
- **Intro and Layers edits:** line 10 appends the plan's exact clause. Line 23 changes
  "(issue #26, D8)" to "(#37, from D8 in #26)", which is the plan's text with
  `FOLLOWUP_ISSUE=37`. Both are within W1.
- **Headings:** `grep -n '^## \|^### '` shows the `main` list unchanged, plus
  `## Measured gate times` at line 321 after `## Build budget` (line 288).
- **CI figures checked independently** (`gh run view 37090465334 --json jobs`): `changes`
  02:37:50 to 02:38:05 (15 s), `static` 93 s, `build-tests` 338 s, `e2e` 02:38:08 to 02:43:49
  (341 s), `verify` 02:43:52 to 02:44:05 (13 s). Wall time is 02:37:50 to 02:44:05 = **375 s**
  (6 min 15 s). All match. The `main` wall range, 375 to 479 s (6:15 to 7:59), and the `e2e`
  range, 341 to 451 s, match. Baseline run 36814114154 ran 04:13:42 to 04:45:28 (31 min 46 s),
  which the record rounds to 31 min.
- **Tests:** `corepack pnpm vitest run tests/unit/setup` under a 300 s perl alarm: 54 files, 707
  passed, 2.41 s. The docs-structure, placement and wording guards are green. The implement run
  (`tests/unit/setup tests/unit/ci`, 59 files, 878 passed) and the orchestrator's `verify:quick`
  (exit 0, 38 s) cover the rest.
- **Coverage mapping:** unchanged, as expected. No test was added or moved.
- **Alignment rule:** no file under `.claude/skills/` changed, so the four pipelines are still
  aligned.
- **Principle III:** `git diff --name-only main...HEAD` lists only
  `.specify/chores/verify-gate-phase-6/plan.md` and `docs/testing.md`, plus this report once
  committed. No dependency, CI, deploy, design or constitution change. Verdict: **not major**, so
  auto-merge applies.
- **No check weakened:** no test, config or CI file is touched. The record gives the method, the
  `main` range next to the single fast run, and that PR runs differ from `main` pushes. It could
  say outright that the local figure is load-sensitive. "nothing else running" implies it, and
  the plan's Risks section states it, so no finding was raised.
- **`[ORCHESTRATOR]` items:** W3 is done (issue #37, open, "Playwright is the long pole of
  verify: measure, then trim the a11y and no-js matrices"), although plan.md still showed it
  unticked at review time. W2 and W4 are for Finish and are not faulted.

## Measurement

| Gate | Before | After |
|---|---|---|
| CI `verify` on `main` | 31 min (run 36814114154, 2026-10-01) | 375 s = 6 min 15 s (run 37090465334, #36 merge, full tier); `main` range 6:15 to 7:59 |
| Local `pnpm run verify`, Mac | 8 to 10 min (issue #26 text) | 339 s = 5 min 39 s (orchestrator's single run on commit 75e73fc, VERIFY_EXIT=0) |

The review did not re-run the local gate. The after figure is the orchestrator's measurement.
Since then, `verify:quick` has passed (exit 0, 38 s: 172 unit files / 2422 tests, 12 worker
files / 132 tests, build ok), and so has the `tests/unit/setup` re-run above.

## Follow-ups for the PR body

1. Issue #37 (D8 follow-up): Playwright stage time, the a11y and no-js matrix decisions, the
   fixture web server when only `budget` runs, local `test:e2e` run the CI way, and the 4 min
   local target.
2. The #36 governance items, carried in #37's "Also carried from #26" list: a layer field in the
   tasks template, Principle I's layer list, an analyze-phase check, and the cadence divergence.
3. Correct the `build-tests` range in the #37 body from "338 to 393 s" to "245 to 393 s" (H1),
   and recheck #37's `e2e` ≤ 300 s target against it.
4. Tick W3 in plan.md, since #37 exists.
