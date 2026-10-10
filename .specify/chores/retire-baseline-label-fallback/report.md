# Review report: retire-baseline-label-fallback

Fresh-eyes review of `chore/retire-baseline-label-fallback` against `plan.md` and `git diff main...HEAD` (commits 558a68c, 7715ab2, 984cd55, 0da48a2, 5af64c7). Closes #77.

## Verdict

Ready for verify. W1–W5 are done as planned and nothing beyond them. W6 (delete the `visual-baselines` label) is correctly still pending for the orchestrator after merge. No CRITICAL or HIGH findings; three LOW findings, none blocking.

## Work items

| Item | Status | Notes |
| ---- | ------ | ----- |
| W1 shared doc | Done | Old step 4 removed. Step 2 ends "then wait for him to start it. There is no other way to make the Linux baselines." Step 3 adds the stop-and-tell-Don rule on CI drift and "Do not refresh the images from a CI run". Closing sentence kept. |
| W2 CLAUDE.md | Done | The Docker bullet ends at "…carries the instruction." The Visual baselines section reads "(macOS, and Linux via Docker)". |
| W3 four skills | Done | Old step 5 removed from deliver, tweak, squash and chore. Each Finish list now reads 1–6 in order. The only "step N" references (`step 2`, and `Finish step 3` in preflight) point at unchanged numbers. No shared block is restated in a skill. |
| W4 workflow + tests | Done | `.github/workflows/visual-baselines.yml` deleted. Only its `describe` block was removed from `tests/unit/ci/workflows.test.ts`. `USES_PATTERN` and `read` are still used by the ci.yml blocks. |
| W5 setup guide + script | Done | `docs/setup.md` item 10 keeps one Docker sentence and says "the workflow uses only". The script header is rewritten; no command changed. |
| W6 label deletion | **Pending (post-merge, orchestrator)** | Run `gh label delete visual-baselines --repo drcdev/dcc-web --yes`. If the shell is refused, hand Don the command. |

`git diff --name-only main...HEAD` lists exactly the W1–W5 files plus `plan.md`. There are no `src/`, `worker/`, `public/`, `tests/e2e/` or snapshot changes.

## Tests and coverage mapping

- Re-run in review with node v24.4.1:
  - `vitest run tests/unit/ci`: 188/188 passed (W4).
  - `vitest run tests/unit/ci tests/unit/setup tests/unit/site/docs-content-structure.test.ts`: 631/631 passed (W5).
- The coverage mapping holds. Each removed assertion read only `visual-baselines.yml`. The ci.yml block still asserts `permissions: contents: read`, no job write permission, SHA-pinned actions, `--frozen-lockfile`, no continue-on-error, no `if: false`, and no secret other than GITHUB_TOKEN (`tests/unit/ci/workflows.test.ts` lines 39–80 and 132). "Never commits or pushes" guarded a job that no longer exists. No check is weakened; `ci.yml` and `verify` are untouched.

## Dangling references

Pattern: `visual-baselines\.yml`, `` `visual-baselines` label ``, `update-baselines`, `` visual-baselines-linux` artifact ``, `name: visual-baselines-linux`, `CI-label`, `CI label fallback`, `fall back to CI`, `gh run download`; excluding `.specify/chores`, `.specify/bugs` and `specs`.

- **Before (main):** 20 matching lines in 10 files (workflow 4, shared doc 3, CLAUDE.md 2, docs/setup.md 2, script 2, workflows.test.ts 2, each of the four skills 1). The fallback was documented in 7 places.
- **After (HEAD):** 0 matches. The only `visual-baselines` strings left are the script name (`package.json:31`, `scripts/build-fixture-site.ts:141`) and the shared doc's own file name.
- **Condition evidence:** since PR #72, PRs #80, #112, #114 and #115 committed Docker-made Linux baselines that passed CI first time without the label.

## Principle III

Major change: "changes CI, deployment or infrastructure configuration" (a GitHub Actions workflow is deleted). No other criterion fires. Flag it in the PR body; it merges on Don's approval, so auto-merge may be armed.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **"Pending baselines" wording is mostly obsolete.** The PR-body lists still include "whether Linux visual baselines are pending" (`.claude/skills/deliver/SKILL.md:233`, `.claude/skills/tweak/SKILL.md:208`, `.claude/skills/squash/SKILL.md:173`, `.claude/skills/chore/SKILL.md:275`) and `CLAUDE.md:45` lists "no pending baselines" as an auto-merge condition. "Pending" can now only happen in the drift case (shared doc step 3). Harmless, out of scope.
2. **The fix-subagent step does not point at the drift rule.** Finish step 5 in all four skills dispatches a fix subagent on a red gate; the shared doc's step 3 says a visual failure on Docker-made images means stop and tell Don. The fix-subagent prompt does not point at it.
3. **Line wrapping.** `docs/setup.md:267` (106 chars) and `scripts/visual-baselines-linux.sh:6` (90 chars) exceed the surrounding wrap width. Cosmetic.

## Follow-ups for the PR body

- **W6, after merge:** `gh label delete visual-baselines --repo drcdev/dcc-web --yes`.
- **Agent memory notes:** update or retire `visual-baselines-ci-fallback-flow.md` and `docker-linux-baselines-can-differ-from-ci.md`.
- **Historical records** under `specs/`, `.specify/chores/` and `.specify/bugs/` still mention the label; left as the record.
- **If Docker drifts from CI again,** fix the cause or restore a CI route from git history as a reviewed change.
- LOW 1–3 are optional tidy-ups.
