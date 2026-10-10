# Review report: drop-up-to-date-rule (refs #147)

Reviewer: fresh-eyes review phase, 2026-10-10. Read-only on everything but this file.

## Verdict

Ready for the verify gate. **0 CRITICAL, 0 HIGH, 4 LOW.** Every work item (W1 to W3) is done as planned and nothing beyond it. The targeted unit tests are green. No check is weakened beyond the intended removal of the strict requirement.

## Before / after

|                                                     | Before (`origin/main`)                                                                                    | After (this branch)                                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `setup/github-ruleset.json:26`                      | `"strict_required_status_checks_policy": true`                                                            | `false` (the only changed line in the file)                                                                    |
| `github-main-protection.ts` `evaluateGaps`          | gap `branch must be up to date before merging` when strict is not `true`; "closed list of 10 gaps"        | gap and field read removed; "closed list of 9 gaps" (lines 3 and 70)                                           |
| `tests/fixtures/providers/github/ruleset-full.json:22` | strict `true`                                                                                          | strict `false`; the "complete" test still passes, so strict is not required                                    |
| partial-ruleset expected list (test lines 47-53)    | contains the up-to-date gap                                                                               | gap removed                                                                                                    |
| `scripts/setup-check/items.ts:231`, `docs/setup.md:320` | "required check verify (strict)"                                                                      | "required check verify"                                                                                        |
| `CLAUDE.md` Merging (lines 37-42)                   | "the branch must be up to date"                                                                           | PR behind `main` can merge; only real conflicts need resolving; CI on the push to `main` is the backstop (#147) |
| Live ruleset 24156251                               | strict `true`                                                                                             | unchanged until Don runs "Live change for Don"                                                                 |

## Checks performed

- **Diff base.** `git diff main...HEAD` also shows `.specify/memory/constitution.md` (2.3.0 to 2.3.1). That comes from PR #146, already on `origin/main`; the local `main` ref is stale (`d9de5a5`). `git diff origin/main...HEAD` shows only the 10 planned files.
- **Work items.** W1: all six files changed exactly as listed. W2: the `CLAUDE.md` wording matches acceptance item 6. W3: dated notes are appended to R9 (`specs/001-setup-walkthrough/research.md:209-214`) and the 031 spec (`specs/031-docs-only-gate/spec.md:51-58`). They cite #147 and D1 option A, and the existing text is not rewritten.
- **Acceptance greps.** `grep -rn "up to date before merging" scripts/` finds nothing. `(strict)` is absent from `items.ts` and `docs/setup.md`. `schemas.ts:68` still has `z.boolean()`.
- **Gap count.** There are 9 slots: active on main, PR required, one approval, code-owner, stale dismissal, verify (+ pin), force-push, deletion, bypass actors.
- **Tests.** `corepack pnpm exec vitest run tests/unit/setup-check tests/unit/setup` (node v24.4.1): 33 files, 358 tests passed. The wrong-branch fixture keeps strict `true`, and its test expects exactly `["protection active on main"]`, so strict on is also accepted.
- **Coverage mapping.** True. The retired rule gets no replacement, and the "complete" test against strict `false` proves it is gone.
- **No check weakened beyond intent.** All other gaps are unchanged, and `ci.yml` and `changed-paths.ts` are untouched.
- **Shared blocks.** Nothing under `.claude/` changed.
- **Principle III.** Major ("changes CI, deployment or infrastructure configuration"), which is correct. Flag it in the PR body. Auto-merge may be armed.
- **Principle II (D1).** The exception is recorded in the plan and in both dated notes, and the constitution is unchanged.
- **Live change dry run (read-only, no PUT).** I applied the plan's jq filter to the output of `gh api repos/drcdev/dcc-web/rulesets/24156251`. Against the same projection without the assignment, the body differs only in the strict flag (`true` to `false`). It keeps every live-only field:
  - `allowed_merge_methods ["merge"]`;
  - `require_extra_approval_for_unattributed_changes true`;
  - `require_last_push_approval false`, `required_reviewers []` and `required_review_thread_resolution false`;
  - `do_not_enforce_on_create false`;
  - conditions `include ["~DEFAULT_BRANCH"]`;
  - `bypass_actors []`;
  - the `deletion` and `non_fast_forward` rules, which have no parameters key.

  Read-only fields are dropped. The command is correct and safe.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **Stale local `main` ref:** `git diff main...HEAD` shows the constitution change from PR #146. Diff and merge against `origin/main`. This is not a defect in the branch.
2. **`specs/001-setup-walkthrough/spec.md` closed list:** it still names the up-to-date gap, and the comments in `scripts/setup-check/checks/github-main-protection.ts:2-4,70-72` point to it. It was already stale (`major-change-approval`) and the plan leaves it out of scope.
3. **Committed ruleset file:** `setup/github-ruleset.json` lacks the live-only parameters, while `CLAUDE.md:37-38` says the ruleset is "committed as" it. A plain PUT of the file is unsafe. This predates the branch (follow-up 1).
4. **This PR and the live change:** until Don changes the live ruleset, this PR must be up to date to merge (plan Risks). Say so in the PR body.

## Follow-ups for the PR body

- Flag it as a major change (Principle III: "changes CI, deployment or infrastructure configuration"). Write **Refs #147**, not Closes.
- Note the recorded Principle II exception (D1, option A): the CI run on every push to `main` is the backstop, and the constitution is unchanged.
- Live change for Don: the jq-from-live PUT command, the confirm command and the dashboard route from plan.md. Never `PUT --input setup/github-ruleset.json`. The command was dry-run read-only on 2026-10-10.
- Until the live change is applied, this PR must be up to date with `main` to merge.
- New issue: add the live-only ruleset parameters to `setup/github-ruleset.json` (#86 is closed).
- Revisit a merge queue under #147 if catching up PRs by hand is still a problem.
