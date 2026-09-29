# Bug Verification: CI runs the full verify gate for changes no check reads

- **Slug**: ci-skip-docs-only
- **Tested**: 2026-09-29
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The detector classifies the reproduction cases correctly and fails closed on every error path, and
`ci.yml` has the required structure. The unit suites, lint, typecheck and secretlint pass. The
real GitHub merge-commit behaviour can only be confirmed on the PR run itself. Slug resolved from
explicit input (automated mode).

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction: bug-docs-only commit | CLI, event `pull_request`, HEAD at `721490a` (touches only `.specify/bugs/**`) | pass | `full=false`, exit 0 |
| Reproduction: `CLAUDE.md`-only commit | CLI, HEAD at `08f85fd` | pass | `full=false`, exit 0 |
| Fix commit itself | CLI, HEAD at `b6e253f` (ci.yml, scripts/ci, tests, docs/setup.md) | pass | `full=true`, reason names `.github/workflows/ci.yml` |
| Fail closed: `push` event | CLI, HEAD at `721490a` | pass | `full=true`, exit 0 |
| Fail closed: unset output file | CLI, `pull_request`, no `GITHUB_OUTPUT` | pass | prints decision, exit 0, no file written |
| Fail closed: git failure | CLI run from a directory where `HEAD^1` is unreachable | pass | `full=true`, "could not compute the changed files", exit 0 |
| New / updated tests | `vitest run tests/unit/ci tests/unit/setup` | pass | 34 files, 398 tests |
| Lint / type-check | `pnpm run lint`, `pnpm run typecheck` | pass | 0 errors; typecheck 0 warnings, 1 hint |
| Secret lint | `pnpm run lint:secrets` | pass | exit 0 |
| ci.yml review by eye | read `.github/workflows/ci.yml` | pass | see below |

ci.yml constraints confirmed: job named `verify`; no job-level `if:`; checkout `fetch-depth: 2`;
`changes` step after setup-node and before install; `pnpm install --frozen-lockfile` unconditional;
`lint:secrets` gated on `== 'false'`; Playwright install and `pnpm run verify` gated on
`!= 'false'`; upload step keeps `if: failure()`; every `uses:` is SHA-pinned; no `paths` filters.

## Output Excerpts

```
full=false: all 1 changed file(s) are skip-safe, running secretlint only   (CLAUDE.md, 08f85fd)
full=true: .github/workflows/ci.yml is not skip-safe, running the full gate (b6e253f)
full=true: could not compute the changed files, running the full gate       (git failure)
Test Files 34 passed (34) / Tests 398 passed (398)
```

The detector does not exist at the older commits, so a copy of it (taken from the branch) was run
against each detached HEAD. The worktree was returned to `bugfix/ci-skip-docs-only` with a clean
tree.

## Residual Risks

- The real `pull_request` checkout uses GitHub's test merge commit with `HEAD^1` as the base tip.
  Locally `HEAD^1` was each commit's parent, which has the same shape, but the actual behaviour
  can only be confirmed on the PR's own run (which should be `full=true`) and on a later
  docs-only PR (where `verify` should be green with the heavy steps skipped).
- The skip-safe allowlist and deny list are maintained by hand. The drift guard test catches new
  reads of skip-safe paths from `src`, `scripts`, `tests` and the root configs only, not from
  other config files or package scripts.
- The skip path still needs `pnpm install` before secretlint, so the saving is the Playwright
  install and the heavy checks, not the whole job.
- The e2e / build / visual steps were not run here (the orchestrator runs `pnpm run verify`).
- This is a major change (CI config, Principle III): label `major-change`, no auto-merge.

## Recommendation

Close the bug as verified locally. Keep the PR labelled `major-change` with auto-merge off, and
have Don confirm on a docs-only follow-up PR that `verify` reports green with the heavy steps
skipped.
