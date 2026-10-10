# Quickstart: validating the docs-only verify gate

## Local (unit layer)

Follow the Local toolchain section of `CLAUDE.md` (node from `.nvmrc`).

```sh
pnpm exec vitest run --project unit tests/unit/ci/
```

Expected: `changed-paths.test.ts`, `verify-needs.test.ts` and `workflows.test.ts` pass,
including the new docs-tier, push-diff, unknown-tier and concurrency cases.

Spot-check the sorter by hand (no network on a pull request diff):

```sh
GITHUB_EVENT_NAME=push BEFORE_SHA=0000000000000000000000000000000000000000 node scripts/ci/changed-paths.ts
```

Expected log: `tier=full: ...` naming the all-zeros `before`.

## On GitHub (post-merge verification, spec.md; the PR for this slice runs the full tier)

1. **Docs-only PR (US1, SC-001)**: open a PR changing only `docs/cutover-plan.md`. In the run,
   `changes` logs `tier=docs`, `static` runs secretlint and the unit tests only, `build-tests`
   and `e2e` are skipped, `verify` passes. Wall time (first job start to `verify` end) under
   2 minutes.
2. **Docs plus code (US1 scenario 4)**: a PR changing a `docs/` file and `src/` logs
   `tier=full` naming the `src/` file.
3. **Docs-only merge (US2, SC-002)**: after merging (1), the `main` push run logs `tier=docs`,
   lists the changed files from `before` to the pushed commit, and `verify` passes.
4. **No cancellation (SC-005)**: three merges in quick succession each end with a completed
   `verify` on their own commit (`gh run list --workflow ci.yml --branch main`).
5. **Setup check**: `pnpm setup:check --item launch-main-checks` still reports complete after a
   docs-tier `main` run.
