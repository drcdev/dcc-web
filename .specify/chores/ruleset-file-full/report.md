# Review report: ruleset-file-full (closes #149)

Reviewer: fresh-eyes review phase, 2026-10-10. Scope: `git diff origin/main...HEAD` on
`chore/ruleset-file-full` (commits `b4eadcf`..`42c8b0a`), against `plan.md`.

## Summary

All three work items are done as planned, and nothing was added beyond them. The committed
ruleset file now equals the writable fields of the live `main-protection` ruleset (id 24156251)
exactly. The new unit guard is at the layer the plan names (unit, `tests/unit/setup/drift.test.ts`)
and passes. No check was weakened, `scripts/setup-check/schemas.ts` is unchanged, no pipeline
skill restates a shared block, and no mutating `gh api` call was made. The prose about
`require_extra_approval_for_unattributed_changes` matches GitHub's documentation. Two
low-severity wording and format nits remain.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **`CLAUDE.md:41`: line is 108 characters.** The W3 edit left "approval; no force-push or
   deletion, and no bypass actors. A PR that falls behind `main` can merge without" unwrapped,
   while the paragraph around it wraps at about 100. This is cosmetic only, and no gate checks
   it. Rewrapping lines 39-43 would fix it.
2. **`specs/001-setup-walkthrough/research.md:193`: "extra approval for unattributed changes" is
   vaguer than GitHub's wording.** GitHub describes the setting only for **Copilot** pull
   requests that Copilot opens "under its own app identity instead of on behalf of a person". In
   those PRs it requires one more approval than the configured count. It has no effect when the
   ruleset requires zero approvals. The phrase echoes the field name, so it is not wrong, but
   "extra approval for unattributed Copilot pull requests" would match the docs. The
   `CLAUDE.md:39-41` wording is accurate and does not overstate the setting. GitHub also marks
   the setting as **public preview** and on by default. Neither file mentions that. The plan's
   Risks already cover the fact that the field is missing from the REST reference.

### Checked and fine

- **W1**: the file has `include: ["~DEFAULT_BRANCH"]`, the four `pull_request` keys and
  `do_not_enforce_on_create: false`, in the live key order, with no read-only fields. The new
  describe block asserts the exact `pull_request` key set, `allowed_merge_methods == ["merge"]`,
  `require_extra_approval_for_unattributed_changes === true` and a boolean
  `do_not_enforce_on_create`. The test has no `specs/` path literal. It would fail against the
  `origin/main` file, so it is a valid red-first guard.
- **W2**: `ruleset-full.json` carries the same edits and keeps its `id`. The "complete" and
  verify-pin tests pass, and they now exercise the `~DEFAULT_BRANCH` branch of `coversMain`.
- **W3**: `docs/setup.md` §12, the setup-walkthrough SKILL.md and the dated R9 sub-bullet match
  the plan. The R9 original text is kept and the anchors are unchanged. The `PUT` is only shown
  for Don, never run.
- `eslint` on `drift.test.ts` is clean.
- `npx vitest run tests/unit/setup tests/unit/setup-check tests/unit/ci`: 38 files, 590 tests,
  all passed.
- GitHub docs: "Available rules for rulesets"
  (https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
  fetched 2026-10-10. It confirms the unattributed-Copilot behaviour above, and that allowed merge
  methods restrict merges to the listed types.

## Measurement

- **Before** (file at `origin/main` vs live writable fields): the file differed in 6 fields:
  - `conditions.ref_name.include` was `["refs/heads/main"]`, live is `["~DEFAULT_BRANCH"]`.
  - `pull_request.parameters` was missing `required_reviewers: []`.
  - `pull_request.parameters` was missing `require_last_push_approval: false`.
  - `pull_request.parameters` was missing `require_extra_approval_for_unattributed_changes: true`.
  - `pull_request.parameters` was missing `allowed_merge_methods: ["merge"]`.
  - `required_status_checks.parameters` was missing `do_not_enforce_on_create: false`.
- **After** (re-run in review, read-only `gh api repos/drcdev/dcc-web/rulesets/24156251` projected
  to `{name, target, enforcement, conditions, rules, bypass_actors}`, key-sorted deep equality
  against the file): **EQUAL**, 0 differing fields.

## Follow-ups for the PR body

1. Consider a scheduled read-only drift check (live ruleset vs file). This is the residual risk R9
   still lists, and the W1 guard does not read the live state.
2. Consider adding "merge commits only" to the setup check's closed gap list through a spec
   change, if Don wants the live setting confirmed, not just recorded.
3. `require_extra_approval_for_unattributed_changes` is a public-preview setting that is not in
   the REST reference. If a future `PUT` returns 422 on it, drop it from the file and record why.
4. Optional polish: rewrap `CLAUDE.md:39-43`, and say "unattributed Copilot pull requests" in
   research.md R9 (LOW 1-2).

Note: the review subagent was blocked from writing this file; the orchestrator saved its returned
text verbatim apart from line wrapping.
