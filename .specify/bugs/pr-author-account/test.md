# Bug Verification: Pipelines open PRs under drcdev instead of drc-agents

- **Slug**: pr-author-account
- **Tested**: 2026-09-29
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The bug was in pipeline instructions, not runtime code. Finish step 4 of deliver, tweak and squash now switches to `drc-agents` before `gh pr create`, switches back to `drcdev` afterwards on success and failure, verifies the PR author with `gh pr view <n> --json author`, and stops and asks Don on a denied switch or missing account. No regressions found.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Read Finish step 4 in each of the three SKILL.md files | pass | Order: switch to drc-agents (stop and ask on deny/missing), create, switch back to drcdev regardless of outcome, verify author is drc-agents else stop. Not exercised against real GitHub (would open a PR). |
| Scope | `git diff main --stat` | pass | Only the three skills, `tests/unit/setup/pipeline-pr-author.test.ts` and `.specify/bugs/`. |
| New test | `corepack pnpm vitest run tests/unit/setup/pipeline-pr-author.test.ts` | pass | 10 tests pass on the fixed tree. |
| Test guards the bug | `git checkout main -- .claude/skills/tweak/SKILL.md`, rerun test, restore with `git checkout HEAD -- ...` | pass | 4 failed / 6 passed with tweak reverted; tree clean after restore. |
| Setup suite | `corepack pnpm vitest run tests/unit/setup` | pass | 32 files, 308 tests. |
| Full unit script | `corepack pnpm run test` | pass | 78 files, 951 tests. |
| Lint | `corepack pnpm exec eslint tests/unit/setup/pipeline-pr-author.test.ts` | pass | Exit 0. |

## Residual Risks

- Live `gh auth switch` / `gh pr create` behaviour was not run (it would open a real PR); the first real pipeline PR is the end-to-end proof.
- The test checks instruction text, so it guards wording rather than agent behaviour.

## Recommendation

Close the bug. The orchestrator's full verify gate is still to run.
