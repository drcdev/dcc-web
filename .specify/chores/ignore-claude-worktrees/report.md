# Review report: ignore-claude-worktrees

Fresh-eyes review of `git diff main...HEAD` on `chore/ignore-claude-worktrees` (HEAD 50f437dc) against `plan.md`.

## Verdict

W1 is done as planned. One unplanned edit (the drift-guard skip in `tests/unit/ci/changed-paths.test.ts`) was needed for the suite to stay green. In its narrowed form it is correct and portable, and it weakens no check. Findings: 0 CRITICAL, 0 HIGH, 2 LOW.

## Measurement

| | `pnpm run lint` |
|---|---|
| Before (exploration, sibling worktree `.claude/worktrees/constitution-current-site` present) | 857 errors, non-zero exit |
| After (review, same worktree still present) | exit 0, no output past `eslint .` |

`pnpm exec vitest run tests/unit/ci/changed-paths.test.ts tests/unit/site/config-files.test.ts tests/unit/site/config-mdx.test.ts` → 3 files, 209 tests passed (3.0 s). Node v24.4.1.

## Plan conformance

- **Acceptance 1:** `eslint.config.js:36-38` adds `".claude/worktrees/**"` after `.reference/**`, with the comment the plan gives, word for word.
- **Acceptance 2:** the new `it("keeps ESLint out of Claude Code worktrees")` sits at the unit layer in the planned describe (`tests/unit/site/config-files.test.ts:373-378`). It uses `HEAVY_IMPORT_TIMEOUT` and asserts `configs.some((c) => c.ignores?.includes(...))`, as planned. It passes.
- **Acceptance 3:** with a sibling worktree present, lint exits 0 (table above).
- **Acceptance 4:** the existing ESLint tests are unchanged and still pass.
- Nothing under `.claude/worktrees/` was touched, and `git ls-files .claude/worktrees` is empty.

## The drift-guard skip (`tests/unit/ci/changed-paths.test.ts:355-362, 378-380`)

**Why it was needed.** The guard "no check reads a path the allowlist calls skip-safe" scans `eslint.config.js` for string literals starting with `.claude/`, `.specify/` or `specs/`. The new literal `.claude/worktrees/**` matches that scan.
- In CI, the directory is absent, so `expandPlaceholders` returns the literal unchanged. `isSkipSafe` then sees the `.claude/` prefix and flags it as an offender.
- Locally, the worktree exists, so the literal expands to every file under it. All of those files are skip-safe, so every one is flagged.

Either way the guard goes red. The plan's "Checked, not changed" list missed this file.

**Does the narrowed skip guard the same thing?** Yes. The guard exists so that a check never depends on a file whose change would put a PR in the skip-safe tier. A gitignored, untracked path never appears in `git diff --name-only`, so it cannot affect the tier. Skipping it removes no case the guard was meant to catch. The skip applies only when both conditions hold:
- the literal ends in `/**`;
- its directory is gitignored.

Every other `.claude/`, `.specify/` or `specs/` literal is still checked, including gitignored non-glob literals such as `.specify/feature.json`. The first version (28cd39aa) skipped *any* `/**` literal. It would have let a check that globs over the tracked `.claude/skills/**` or `specs/**` slip past, so the narrowing in 50f437dc was the right call.

**Correct and portable in CI?** Yes:
- `p.slice(0, -2)` keeps the trailing slash (`.claude/worktrees/`). Git can therefore match the directory-only `.gitignore` rule (`.gitignore:74 .claude/worktrees/`) even when the directory does not exist.
- This was confirmed in a scratch repo with no such directory. `check-ignore --no-index .claude/worktrees/` exits 0, while the form without the slash exits 1.
- `actions/checkout` brings `.gitignore` and `git`, and a shallow clone does not matter to `check-ignore`. `cwd: repoRoot` is set.
- The `try/catch` treats any git failure as "not ignored", so a missing git fails closed: the guard flags the path.

**Plan deviation?** Yes, at LOW severity. It is a test-only change forced by W1, it narrows nothing the guard was protecting, and it should be named in the PR body.

## Findings

### CRITICAL
None.

### HIGH
None.

### LOW
1. **Unplanned edit (plan deviation).** `tests/unit/ci/changed-paths.test.ts:355-362, 378-380` is outside the plan's stated scope ("W1 only (`eslint.config.js` plus one unit test)"). It is justified and correct, as explained above. Record it in the PR body. Also add a note to `plan.md`, so the plan matches what shipped.
2. **`--no-index` also counts force-added files as ignored** (`tests/unit/ci/changed-paths.test.ts:357`). With `--no-index`, `check-ignore` reports a tracked file that matches an ignore rule as ignored. If someone ever ran `git add -f` on a file under an ignored `/**` directory, that file could appear in a diff while the guard skips it. Nothing like that is tracked today (`git ls-files .claude/worktrees` is empty), and dropping `--no-index` would not help for a directory path. Note it only. No change is needed.

## Follow-ups for the PR body

- Name the drift-guard change as a deviation from the plan. It is a narrow skip for `/**` globs whose directory is gitignored, because those paths never appear in a diff.
- Lint before/after with a sibling worktree present: 857 errors → exit 0.
- No issue to close and no `[PREVIEW-CHECK]` items. `eslint.config.js` is code, so the PR runs the full CI tier, as the plan expected.
