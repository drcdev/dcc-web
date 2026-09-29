# Bug Fix: Approval gate blocks merge when approval arrives after the last push

- **Slug**: approval-gate-stale-check
- **Fixed**: 2026-09-29
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

The `Major change` workflow now publishes its verdict as a commit status (context
`major-change-approval`) on the PR head SHA instead of through the job result, so a later approval
supersedes the earlier pending status. The job is renamed `gate` so its check run no longer shares
the required context's name.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `.github/workflows/major-change.yml` | modified | job id/name `gate`; `statuses: write` added; `RUN_URL` env |
| `scripts/ci/major-change-gate.ts` | modified | `STATUS_CONTEXT`, `toCommitStatus`, `statusApiArgs`; POST to `pr.head.sha`; exit 0 unless an error is thrown; header comment updated |
| `tests/unit/ci/workflows.test.ts` | updated tests | gate name, permissions, env, status-not-exit-code assertions |
| `tests/unit/ci/major-change-gate.test.ts` | added tests | `toCommitStatus` and `statusApiArgs` |
| `tests/unit/setup/drift.test.ts` | updated test | ruleset contexts map to `verify` job and `STATUS_CONTEXT`; no `major-change-approval` job |
| `docs/setup.md` | modified | item 14 says the context is a commit status |
| `scripts/setup-check/items.ts` | modified | item text wording only |
| `specs/001-setup-walkthrough/contracts/ci-and-gates.md` | modified | table, contract paragraph, gate job section, permissions, fork note |

## Tests Added or Updated

- `workflows.test.ts` — job key/name `gate` and no `major-change-approval` job; permissions exactly `pull-requests: read` + `statuses: write`; env names; script posts to `/statuses/` and no longer uses `process.exit(decision.pass ? 0 : 1)`.
- `major-change-gate.test.ts` — success/pending mapping, constant context, 140-char truncation, `target_url` passthrough, `statusApiArgs` argv shape.
- `drift.test.ts` — see above.

All were seen failing before the implementation (14 failures), then passing.

## Local Verification

- `vitest run tests/unit/ci tests/unit/setup tests/unit/setup-check` → 33 files, 344 tests pass.
- `pnpm run lint` clean; `pnpm run typecheck` 0 errors (one pre-existing hint in `eslint.config.js`).
- The real status behaviour (source pinning to integration 15368, pending to success on approval) can only be checked on GitHub, on this fix PR.

## Deviations from Assessment

None. `CLAUDE.md` was left unchanged, as the assessment concluded (line 41 stays accurate). The task brief mentioned it might need wording; it does not describe a job result.

## Follow-ups

- Don to verify on the fix PR: a `major-change-approval` status from `github-actions` goes pending to success after approval and the PR leaves `BLOCKED`. If it stays "expected", apply the "Any source" ruleset fallback (manual admin step).
- Auto-merge must stay off (major change, Principle III).
- `setup/github-ruleset.json` still omits `integration_id` while the live ruleset pins 15368; unchanged, could be reconciled separately.
- Open PRs need a fresh push after this merges to clear stale check runs.
