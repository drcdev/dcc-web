# Bug Fix: Pipelines open PRs under drcdev instead of drc-agents

- **Slug**: pr-author-account
- **Fixed**: 2026-09-29
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Finish step 4 of `/deliver`, `/tweak` and `/squash` now runs a six-step PR author account
sequence (identical text in all three): switch to `drc-agents`, `gh pr create`, switch back to
`drcdev` straight after, verify the author with `gh pr view <n> --json author`, then apply
auto-merge and labels as `drcdev`. A denied or failed switch, or a missing `drc-agents`
account, stops the pipeline and asks Don; the PR is never opened as `drcdev`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `.claude/skills/deliver/SKILL.md` | modified | Finish step 4 lead-in reworded; account block added |
| `.claude/skills/tweak/SKILL.md` | modified | same |
| `.claude/skills/squash/SKILL.md` | modified | same |
| `tests/unit/setup/pipeline-pr-author.test.ts` | added test | reads the three skills; written first, seen failing (10 failed) |

## Tests Added or Updated

- `tests/unit/setup/pipeline-pr-author.test.ts` — per skill: switch order around `gh pr create`
  and switch-back on success or failure; `gh pr view <n> --json author` check that stops unless
  `drc-agents`; stop-and-ask on denied/missing account; and one test that the block is
  byte-identical across the three skills.

## Local Verification

- `corepack pnpm vitest run tests/unit/setup/pipeline-pr-author.test.ts` → 10 failed before
  the skill edits.
- `corepack pnpm vitest run tests/unit/setup` → 32 files, 308 tests passed after.
- `corepack pnpm eslint tests/unit/setup/pipeline-pr-author.test.ts` → clean.

## Deviations from Assessment

None. The step 4 lead-in sentence no longer says "open a PR with `gh pr create`" so that the
first `gh pr create` in the step sits inside the account block.

## Follow-ups

- Project permission rule in `.claude/settings.json` for the two `gh auth switch` commands
  (out of scope per assessment).
- Add "the PR-author account switch" to CLAUDE.md's "Keep the three pipelines aligned" list.
