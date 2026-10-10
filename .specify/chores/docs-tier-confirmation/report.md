# Review report: docs-tier-confirmation

Reviewed 2026-10-09 against `plan.md` and `git diff main...HEAD` (commits 9f9ae85, 60b7a65).
Read-only review; saved by the orchestrator because the review subagent may not write files.
Every run claim was re-checked against `gh run view <id> --json jobs` and the `changes` job logs
(`tier=` line and "Changed files:").

## Verdict

W1 is done as planned and nothing beyond it. W2 (the comment on #127) is for the orchestrator at
Finish and has no file. The diff touches only `specs/031-docs-only-gate/spec.md` and
`.specify/chores/docs-tier-confirmation/plan.md`. Every factual claim in the five new Result lines
matches the real runs. No check is weakened, no shared `_shared/` block is restated, and the
Principle III verdict (not major) holds. Findings: **0 CRITICAL, 0 HIGH, 3 LOW**.

## Acceptance check

| #   | Criterion                                                                                          | Result                                                    |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Spec marks all five checks with run ids, tier line, wall time where limited                        | Pass (spec l.377–417)                                     |
| 2   | Check 2 says the reason named the `.claude/` skill, not the `src/` file; #135 run as corroboration | Pass (l.389–395)                                          |
| 3   | Check 4: both overlapping `main` runs completed `verify`; #134 failure named as a flake            | Pass (l.404–411)                                          |
| 4   | #127 comment drafted in plan W2                                                                    | Pass (plan W2); posting is the orchestrator's job         |
| 5   | Diff lists only the spec and `.specify/chores/docs-tier-confirmation/**`                           | Pass: `git diff --stat main...HEAD` shows 2 files         |
| 6   | This PR's own CI logs `tier=skip-safe`                                                             | Left to the PR run                                        |

## Claims checked against run data

- 38023035528 (PR #132): `tier=docs: 2 documentation file(s) and 2 skip-safe file(s), running
  secretlint and the unit tests`, four files one per line; `changes` and `static` success,
  `build-tests` and `e2e` skipped; 04:08:54Z to 04:10:09Z = 75 s. Verified.
- 38029587425 (PR #138): `tier=full: .claude/skills/setup-walkthrough/SKILL.md is not skip-safe,
  documentation or content-only, running the full gate`; file list includes `docs/…` and `src/…`;
  `build-tests` and `e2e` ran. Verified.
- 38024829035 (PR #135): `tier=full: public/_headers is not skip-safe, …`. Verified.
- 38024085668 (#132 merge on `main`): `tier=docs`, same four files, skips; 04:26:47Z to 04:28:07Z
  = 80 s. Verified.
- Code merges ran full: 38022980128 (#131), 38024788337 (#134, `package.json`, 6 files),
  38025226789 (#135, 16 files). Verified.
- #134 merged 04:38:44Z, #135 04:46:24Z; their `main` runs overlapped and both `verify` jobs
  completed (failure and success), neither cancelled. Verified.
- Concurrency keys non-PR events on `github.sha`, cancel-in-progress for PRs only
  (`.github/workflows/ci.yml` l.11–13). Verified.
- #134 flake: `projects-fixtures.spec.ts:112` goBack, "Not attached to an active page", 1 failed
  / 1463 passed; passed on PR run 38024136289 and the next `main` run. Verified.
- `launch-main-checks` reads the newest `verify` check run on `main` and passes on success
  (`scripts/setup-check/checks/launch-main-checks.ts` l.29, l.51, l.60). Verified.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **Check 4 time ranges use a different convention** (`specs/031-docs-only-gate/spec.md` l.405):
   they start at the run's `createdAt` rather than the first job's start, and omit the `Z`. Both
   are accurate and check 4 has no time limit; consistency note only.
2. **Check 2's evidence run was still in progress** (l.389): `e2e` in run 38029587425 had not
   finished at review time. The check concerns the tier the run sorted to, which the log settles.
3. **Check 2 is met in intent, not to the letter** (l.392–394): no PR changing exactly one `docs/`
   and one `src/` file was observed; the result says the reason names the first non-docs path in
   order. The parenthetical #138 path list is not exhaustive.

## Before and after

Docs-tier wall time, first job start to the end of `verify`, against the 2-minute targets in
SC-001 and SC-002.

- **Before:** no docs-tier run had been seen; every run took the full gate (for example #135's
  `main` run 38025226789, about 10 min).
- **After (re-confirmed):** PR run 38023035528 **75 s**; `main` run 38024085668 **80 s**.

## Principle III

Not major. Documentation record in `specs/` and `.specify/` only; CI configuration was only read.

## Follow-ups for the PR body

- Open an issue for the e2e flake in `tests/e2e/projects-fixtures.spec.ts:112` (`page.goBack:
  Protocol error (Page.getNavigationHistory): Not attached to an active page`, `main` run
  38024788337) and fill its number into the W2 comment.
- Optional: make the `tier=full` reason name every path that forces the full gate.
- Confirm this PR's own run logs `tier=skip-safe` and passes `verify`; quote it in the #127
  comment.
- PR #138 retires `launch-main-checks`; check 5 records the state on 2026-10-09.
