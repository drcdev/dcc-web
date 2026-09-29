# Bug Verification: Approval gate blocks merge when approval arrives after the last push

- **Slug**: approval-gate-stale-check
- **Tested**: 2026-09-29
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: partial

## Summary

The GitHub-side symptom (stale failed check run blocking merge) cannot be reproduced locally, so it was checked by diff review and unit tests. All local checks pass; the end-to-end behaviour still needs confirmation on the fix PR.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Diff review of `git diff main...HEAD` | pass (static only) | Both `pull_request` and `pull_request_review` triggers run one script that POSTs status context `major-change-approval` to `pr.head.sha`. Job renamed `gate`, so its check run no longer collides with the context. `statuses: write` added. Unlabelled PR gives `success`. Labelled PR without an approval on head commit (or authored by owner) gives `decide().pass=false`, mapped to `pending`, never `success`. API failure throws and `main().catch` exits 1. |
| New / updated tests | `vitest run tests/unit/ci` (workflows, major-change-gate) | pass | Included in the run below |
| Regression suite | `vitest run tests/unit/ci tests/unit/setup tests/unit/setup-check` | pass | 33 files, 344 tests |
| Lint / type-check | `pnpm run lint`, `pnpm run typecheck` | pass | 0 errors, 0 warnings, 1 pre-existing hint |
| Setup check | `pnpm setup:check --item github-main-protection` | pass | Reports complete; ruleset matches `setup/github-ruleset.json` |

## Output Excerpts

- `Test Files 33 passed (33) / Tests 344 passed (344)`
- `[x] complete  Step 14 of 18  GitHub main branch protection`

## Residual Risks

- The real behaviour (status source pinned to integration 15368, pending to success after approval, PR leaving BLOCKED) can only be observed on GitHub on the fix PR. If the required status stays "expected", the "Any source" ruleset fallback applies (manual admin step).
- The setup check only compares the ruleset config; it does not prove a status is posted.
- Open PRs need a fresh push after merge to clear stale check runs.

## Recommendation

Hold for the PR-level check: confirm on the fix PR that a `major-change-approval` status from `github-actions` goes pending then success after approval. Auto-merge stays off (major change).
