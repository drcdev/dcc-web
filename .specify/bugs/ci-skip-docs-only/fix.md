# Bug Fix: CI runs the full verify gate for changes no check reads

- **Slug**: ci-skip-docs-only
- **Fixed**: 2026-09-29
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Added a tested detector (`scripts/ci/changed-paths.ts`) and wired it into `ci.yml`. A pull request
whose changed files are all on an explicit skip-safe allowlist runs `pnpm run lint:secrets` and
skips the Playwright install and `pnpm run verify`. Everything else, including any error, runs the
full gate. Slug resolved from explicit input.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `scripts/ci/changed-paths.ts` | added | `isSkipSafe`, `decide`, `toOutput`, guarded CLI |
| `.github/workflows/ci.yml` | modified | `fetch-depth: 2`, `changes` step after setup-node, skip-path secretlint, heavy steps gated on `!= 'false'` |
| `tests/unit/ci/changed-paths.test.ts` | added test | table-driven tests and drift guard |
| `tests/unit/ci/workflows.test.ts` | modified | new ci.yml structure assertions |
| `docs/setup.md` | modified | one paragraph in section 11 |

## Tests Added or Updated

- `changed-paths.test.ts`: `isSkipSafe` safe and unsafe tables, `decide` rules, `toOutput`, drift guard scanning `src`, `scripts`, `tests` and root configs for reads of skip-safe paths.
- `workflows.test.ts` "ci.yml change detection": fetch-depth, step order, step conditions, no job-level `if:`, no `paths` filters.

Written first and seen failing (module missing, workflow lacking steps) before implementing.

## Local Verification

- `vitest run tests/unit/ci tests/unit/setup` → 34 files, 398 tests passed.
- `pnpm run lint` → 0 errors; `pnpm run typecheck` → 0 errors, 0 warnings.
- YAML parsed with Ruby's YAML; step order confirmed.
- `GITHUB_EVENT_NAME=pull_request node scripts/ci/changed-paths.ts` locally → `full=false` for the assessment-only diff.

## Deviations from Assessment

None. The CLI additionally wraps `main()` in a try/catch that logs and exits 0 so a detector failure leaves the output unset, which the `!= 'false'` gates treat as a full run.

## Follow-ups

- Major change (CI config): label the PR `major-change`, leave auto-merge off.
- After merge, confirm on a docs-only PR that `verify` is green with the heavy steps skipped.

## Post-merge adjustment

2026-09-29: merging `main` (PR #11) brought `tests/unit/setup/pipeline-pr-author.test.ts`, which reads the deliver, tweak and squash skill files. The drift guard caught it, as designed: those files are now read by a check, so they must run the full gate.

- `READ_BY_CHECKS` now lists `.claude/skills/deliver/SKILL.md`, `.claude/skills/squash/SKILL.md` and `.claude/skills/tweak/SKILL.md`; new unit cases assert each is not skip-safe (seen failing first).
- The drift guard now expands literals holding `${...}`, `%s` or `%d` against the repository files under the literal's fixed directory. A matched file counts as read only when the values the placeholders took also appear as quoted strings in the reading file, so the guard flags exactly the three skills and not every skill. A placeholder literal that matches nothing is reported as an offender.
