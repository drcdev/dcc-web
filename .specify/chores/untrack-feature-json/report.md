# Review report: untrack-feature-json

Reviewed `git diff main...HEAD` against `plan.md`. W1 (unit test) is withdrawn by Don's ruling and is not treated as a finding.

## Result

W2 is done as planned and nothing beyond it. Branch diff: `M .gitignore`, `A .specify/chores/untrack-feature-json/plan.md`, `D .specify/feature.json`. The W1 test added in 212b8909 was fully removed; `tests/` shows no change against `main`. No file under `src/`, `tests/`, `scripts/`, `.github/` or `.claude/` is touched, so no check is skipped or weakened (Principle II).

## Acceptance checks

| # | Criterion | Result |
|---|---|---|
| 1 | No test (W1 withdrawn) | Settled by Don; no test in the diff |
| 2 | Ignored | `git check-ignore -v --no-index` exits 0, names `.gitignore:67` |
| 3 | Untracked | `git ls-files` prints nothing; `git diff --name-status main...HEAD` shows `D .specify/feature.json` |
| 4 | Working copy kept | File on disk, content unchanged |
| 5 | Scripts still resolve | `check-prerequisites.sh --json --paths-only` prints `FEATURE_DIR=.../specs/049-post-card-full-click` |
| 6 | Diff scope | Only `.gitignore`, `.specify/feature.json` (D) and the chore folder |
| 7 | Local gate | `tests/unit/ci/changed-paths.test.ts`: 165/165 passed (vitest, node v24.4.1); full gate and CI `verify` belong to the next phase |

`.gitignore:66-67`: the entry sits directly after the `# Spec Kit extension catalog cache` group, with its own header comment and a blank line either side, matching the file's group style.

`tests/unit/ci/changed-paths.test.ts` uses `.specify/feature.json` only as a sample path string for the classifier. It does not read the file or depend on it being tracked.

## Findings

### CRITICAL
None.

### HIGH
None.

### LOW
- **L1 `.specify/scripts/bash/check-prerequisites.sh` output, `BRANCH` field.** On this chore branch the script reports `"BRANCH":"049-post-card-full-click"`, taken from the on-disk `feature.json` rather than the git branch. Existing Spec Kit behaviour the chore does not change; out of scope (Principle XI).
- **L2 `plan.md`, W1 section.** The original W1 test design is kept above the "Withdrawn" note as a record of the decision; no change needed.

## Measurement

| What | Before (a96b3dfe) | After |
|---|---|---|
| `git ls-files .specify/feature.json` | `.specify/feature.json` (tracked) | no output (untracked) |
| `git check-ignore -v --no-index .specify/feature.json` | no output, exit 1 | `.gitignore:67:.specify/feature.json`, exit 0 |
| File on disk in this worktree | present | present, content unchanged |

## Follow-ups for the PR body

- **One last conflict for in-flight PRs.** Feature PRs open when this merges hit a modify/delete conflict on `.specify/feature.json` the next time they merge `origin/main`. Resolve by keeping the deletion (`git rm --cached .specify/feature.json` keeps the local copy). After that the conflict cannot recur.
- **Pulling this deletes the local copy once.** Other worktrees that merge or pull this change lose their working-tree `feature.json`. A worktree mid-feature must re-run specify or set `SPECIFY_FEATURE_DIRECTORY` to resume; copy the file aside first if needed.
- **Resumed worktree with no feature.json.** A fresh worktree on an existing feature branch now has no `feature.json`, so plan, tasks and implement error until specify runs again or the env var is set. Before this chore it silently held a stale value. A branch-name fallback in Spec Kit's resolver would be a separate change.
