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

## Round 2

Reviewed 2026-10-02 against fix commit 6feefca (fresh eyes, read-only outside this file).

### Verdicts on round 1

- **H1: closed.** `docs/testing.md:342` now reads "`build-tests` is next (245 to 393 s)", which
  matches the five-run table above (min 245 s #32, max 393 s #31). The only number changed in
  `docs/testing.md` between 4468375 and HEAD is 338 to 245 (`grep -o` number diff). Issue #37
  (open) now says "with `build-tests` next (245 to 393 s)"; "338" no longer appears in it.
- **L1: closed.** `docs/testing.md:10-11` is re-wrapped at the paragraph's width. With
  `tr -s ' \n' ' '`, the intro paragraph (old lines 5-10, new lines 5-11) is word-for-word the
  same as before.
- **L2: closed.** `plan.md:54-55` now says every `main` push is full tier, with #32 (245 s) and
  #33 (252 s) as the short runs. The W1 draft (`plan.md:184`) and the #37 draft (`plan.md:244`)
  say 245 to 393 s. The judgment call at `plan.md:291-292` says the best `build-tests` on `main`
  is 245 s and #37 should re-check the target after measuring. `plan.md:231` has `- [x] W3 done`.

Scope of 6feefca: only `docs/testing.md` and `plan.md` changed. Heading lists in both files are
the same as before the fix.

### New findings

**LOW**

**L3. `docs/testing.md:342-343`: one sentence was added beyond the described fix.** The
measured-times sentence is not whitespace-only. It now also says "`e2e` is longer than
`build-tests` in every run." The round-1 fix asked only for the range to change, with the
conclusion left as it was. The new sentence is true for all five runs (427>393, 434>245, 356>252,
451>377, 341>338), and it says what H1 noted: the conclusion still holds with the wider range.
It also differs from the W1 wording in `plan.md:183-185`. No change needed; mention it in the PR
body or leave it.

**L4. `plan.md:292`: the rewritten judgment call is not wrapped** (130 characters, while the
plan wraps at about 100). It is only in the plan, so this is cosmetic.

### Tests

`perl -e 'alarm 300; exec @ARGV' corepack pnpm vitest run tests/unit/setup tests/unit/ci` on
node v24.4.1: **59 files, 878 passed**, 2.47 s. No full gate and no Playwright project was run.

### Scope and Principle III

`git diff --name-only main...HEAD`: `.specify/chores/verify-gate-phase-6/plan.md`,
`.specify/chores/verify-gate-phase-6/report.md` and `docs/testing.md` only. No dependency, CI,
deploy, design, skill or constitution change. Verdict stays **not major**.

### Final counts

Round 1 open: 0 (H1, L1, L2 closed). Round 2 new: **0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW**
(L3, L4, neither blocking).
