# Chore plan: drop-up-to-date-rule (refs #147)

Branch: `chore/drop-up-to-date-rule`. The PR says **`Refs #147`**. It does **not** close #147:
that issue is the decision record for the deferred merge queue and stays open.

## Goal

Issue https://github.com/drcdev/dcc-web/issues/147 records Don's decision of 2026-10-10. A merge
queue needs an organization-owned repository, so there is no queue for now. Instead, the
`main-protection` ruleset stops requiring branches to be up to date before merging
(`strict_required_status_checks_policy: false`). A PR that falls behind `main` can then merge
without being caught up, re-run and re-approved. Only real merge conflicts still need fixing.
The CI run on every push to `main` catches two PRs that break only when they are combined.

This chore does four things:

- commits that setting to `setup/github-ruleset.json`;
- stops the `github-main-protection` setup check from demanding strict mode;
- removes the "must be up to date" wording from `CLAUDE.md`, the setup item and `docs/setup.md`;
- adds dated notes to the two design records whose rationale relied on strict mode.

Don applies the live ruleset change himself (see "Live change for Don"). Visitors see no
change.

## Acceptance

Before:

- `setup/github-ruleset.json:26` has `"strict_required_status_checks_policy": true`;
- live ruleset 24156251 (`gh api repos/drcdev/dcc-web/rulesets/24156251`) has the same `true`;
- the check has a gap `branch must be up to date before merging`
  (`scripts/setup-check/checks/github-main-protection.ts:91-93`).

After:

1. `setup/github-ruleset.json` differs from `main` in exactly one value:
   `strict_required_status_checks_policy` is `false`. Nothing else changes: no live-only
   parameters are added, and `verify` stays pinned to `integration_id` 15368.
2. `grep -n "up to date before merging" scripts/` finds nothing. The header comments in
   `github-main-protection.ts` say "closed list of 9 gaps" (they say 10 today).
   `evaluateGaps` reads no `strict_required_status_checks_policy` field.
3. `tests/fixtures/providers/github/ruleset-full.json` has `strict_required_status_checks_policy: false`,
   and the "complete" test still passes against it. That shows strict mode is not required.
   The partial-ruleset test's expected list no longer contains
   `branch must be up to date before merging`.
4. `scripts/setup-check/schemas.ts` still accepts the field as a boolean (unchanged).
5. Neither `scripts/setup-check/items.ts` (`confirmedBy`) nor `docs/setup.md` (#github-main-protection,
   "How it will be confirmed") contains `(strict)`.
6. `CLAUDE.md` Merging no longer says the branch must be up to date. It says a PR that falls
   behind `main` can merge without catching up, that only real conflicts need resolving, and
   that the CI run on the push to `main` catches breakage that only appears when two PRs are
   combined.
7. `specs/001-setup-walkthrough/research.md` (R9, "Decision, deploy only after CI") and
   `specs/031-docs-only-gate/spec.md` (rationale paragraph, about lines 43-48) each gain a dated
   note (2026-10-10, #147). The note says strict mode is off and records D1
   (option A): the Principle II exception is accepted and the CI run on `main` is the backstop. Their existing text is not rewritten.
8. Every test is green under `pnpm run verify:quick` after each item. The orchestrator runs the
   full `pnpm run verify` before the PR.
9. After Don's live change, `pnpm setup:check --item github-main-protection` reports complete.
   It is also complete before his change, because the check no longer reads the field.

## Scope

**In:** W1 to W3 below.

**Out:**

- Closing #147, or any merge-queue work (`merge_group` trigger, `merge_queue` rule, moving to
  an organization).
- Adding the live-only ruleset parameters to the file: `allowed_merge_methods`,
  `require_extra_approval_for_unattributed_changes`, `require_last_push_approval`,
  `required_reviewers`, `do_not_enforce_on_create`, and the `~DEFAULT_BRANCH` include.
  #86 is closed, but the file still lacks them (checked 2026-10-10).
- A ruleset drift check that compares the live ruleset with the file.
- Changing `scripts/ci/changed-paths.ts` or `.github/workflows/ci.yml` (see Risks: the tiers
  stay safe).
- Historical records that mention strict mode: specs 001 (other than R9), 002 and 015,
  `specs/001-setup-walkthrough/spec.md`'s closed list (already stale, since it still names
  `major-change-approval`), `.specify/chores/*`, `.specify/bugs/*`, and
  `specs/031-docs-only-gate/checklists/release-gate.md` CHK021 (a ticked review record).
- `tests/unit/setup/schemas.test.ts:120` and `tests/unit/setup/drift.test.ts`. One only checks
  the shape and the other only compares contexts, so neither changes.

**Follow-ups for the PR body:**

1. Put the live-only parameters into `setup/github-ruleset.json`, so a plain
   `PUT --input setup/github-ruleset.json` becomes safe. This needs a new issue, because #86 is
   closed.
2. Revisit a merge queue under #147 if hand-holding is still a problem.

## Constitution Check

- **I. Test-First:** W1 changes the fixture and the expected gap list first, and both fail
  against today's check before the code changes. W2 and W3 are documents, with
  `no behaviour` lines.
- **II. Automated Release Gate:** **recorded exception (D1, option A, Don 2026-10-10).** `verify` stays required, pinned and
  unweakened on every PR and every push to `main`. R9 named strict mode as *the* way Principle
  II's "production deploys only after CI passes" is met. Workers Builds deploys every push to
  `main` independently of CI. Without strict mode, a PR that is behind `main` merges a combined
  tree that no CI run has checked, and that tree can deploy before the CI run on `main` finishes.
- **III. Human Review for Major Changes:** one criterion fires: "changes CI, deployment or
  infrastructure configuration" (the branch ruleset file and the setup check that confirms
  it). Verdict: **major**. The PR body flags it and names that criterion. No other criterion
  applies: no dependency, contact data, design, cost or constitution change. Auto-merge may be
  armed. Don's approval is the gate, and the live change is his own step, independent of the
  merge.
- **IV. First-Party Before Custom:** this uses GitHub's own ruleset setting. No custom code is
  added.
- **V. Static by Default:** not affected.
- **VI. Content as Files:** not affected.
- **VII. Private Data:** no secrets are touched or printed.
- **VIII. Cloudflare Best Practices:** not affected.
- **IX. Cost Ceiling:** not affected (no queue, no organization, no new runner use beyond
  existing pushes to `main`).
- **X. Accessible, Fast and Private:** not affected. No page changes.
- **XI. Spec Kit Workflow:** chore pipeline on a `chore/` branch, with the plan in
  `.specify/chores/drop-up-to-date-rule/`. No other worktree edits these files.

### Complexity / exceptions

Principle II exception (D1): with strict mode off, the tree that lands on `main` may not be the
tree `verify` passed on the PR. Mitigations:

- `verify` runs on every push to `main` at the tier of the push diff;
- every PR still has its own green `verify` and Don's approval;
- merge commits only;
- rollback is one command.

Don accepted this trade-off in #147 ("CI on every push to `main` catches two PRs that break only
when combined"). The constitution still says production deploys happen "only after CI passes",
so the exception was put to him explicitly. He confirmed it on 2026-10-10 (D1, option A): it is
recorded here and in the dated notes (W3), with no constitution change.

## Decisions

**D1 — Principle II and deploys of an unchecked combined tree. Decided 2026-10-10: option A.**
Don chose to record the exception: dated notes in R9 and the 031 spec cite #147, the CI run on
`main` is the backstop, and the constitution is not changed. The original question and options
are kept below for the record.

R9 (`specs/001-setup-walkthrough/research.md`,
"Decision, deploy only after CI") says strict mode is how "production deploys only after CI
passes" is met, because Workers Builds deploys every push to `main` without waiting for CI.
Turning strict mode off means a PR that is behind `main` can put a combined tree on `main` that
no `verify` run checked, and production may deploy it before the CI run on `main` reports.
Options:

- **A (recommended):** accept this as a recorded exception. The plan's Complexity section and
  the dated note in R9 and the 031 spec cite #147, and the CI run on `main` is the backstop. No
  constitution change; this PR proceeds as planned.
- **B:** keep Principle II literal by gating the production deploy on `verify` for the `main`
  SHA, for example by having `deploy:production` wait for the check run. This is a deployment
  change, outside this chore, so it becomes a follow-up issue and this PR waits for it or ships
  with A in the meantime.
- **C:** amend Principle II through `speckit-constitution` so it allows a merged tree that is
  checked after the merge, as a separate major-change PR before this one.

## Work items

### [x] W1 Setup check, fixture, test and committed ruleset stop requiring strict mode

- **Files:**
  - `tests/fixtures/providers/github/ruleset-full.json`: strict `true` → `false`;
  - `tests/unit/setup-check/checks/github-main-protection.test.ts`: remove
    `"branch must be up to date before merging"` from the partial-ruleset expected list (line 51);
  - `scripts/setup-check/checks/github-main-protection.ts`: delete lines 91-93, and change "10
    gaps" to "9 gaps" in the comments on lines 3 and 70;
  - `setup/github-ruleset.json`: line 26 `true` → `false`;
  - `scripts/setup-check/items.ts:231`: drop `(strict)` from `confirmedBy`;
  - `docs/setup.md` (about lines 319-321): drop `(strict)`.

  `ruleset-wrong-branch.json` and `ruleset-excludes-main.json` keep `true`, so the check is also
  shown to accept strict mode on.
- **Test:** existing, edited first. Flip the fixture and edit the expected list, then run the
  file. The "complete" test (strict gap fires) and the partial test (extra gap) both fail. Then
  remove the gap and see them pass.
- **Layer:** unit (`docs/testing.md` "Where a test goes": the check's logic is pure evaluation
  of a recorded provider response, the cheapest layer that observes it).
- **Coverage mapping:** the removed assertion (partial ruleset lists
  `branch must be up to date before merging`) tested a rule that is retired on purpose, so it
  gets no replacement. The "complete" test against a fixture with strict mode `false` now
  shows the rule is not required. No new test restates the config value (#97).

### [x] W2 CLAUDE.md Merging wording

- **Files:** `CLAUDE.md` (lines 37-40, "What branch protection enforces").
- **Change:** drop "and the branch must be up to date". Add one sentence: a PR that falls
  behind `main` can merge without catching up; only real conflicts need resolving; the CI run
  on the push to `main` catches breakage that only shows when two PRs are combined (#147).
- **Test:** `no behaviour: n/a (agent working notes; skip-safe file read by no check)`.
- **Layer:** n/a.

### W3 Dated notes on the strict-mode rationale records

- **Files:**
  - `specs/001-setup-walkthrough/research.md`: R9, a dated sub-bullet under "Decision, deploy
    only after CI";
  - `specs/031-docs-only-gate/spec.md`: a dated note after the rationale paragraph that says
    the ruleset requires an up-to-date PR.

  Each note gives the date, #147 and the D1 outcome (option A: the exception is accepted, the CI run on `main` is the
  backstop, no constitution change). For 031 it also records the tier-safety
  conclusion under Risks. The original text stays as written.
- **Test:** `no behaviour: n/a (design records under specs/; skip-safe, and the drift guard keeps specs/ paths out of tests)`.
- **Layer:** n/a.

## Docs citations

- GitHub Docs, "Available rules for rulesets", section "Require status checks to pass before
  merging":
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.
  The Strict setting means "The **Require branches to be up to date before merging** checkbox is
  checked" and "The topic branch **must** be up to date with the base branch before merging".
  The Loose setting means the checkbox is not checked and "The branch **does not** have to be up
  to date with the base branch before merging". In the REST ruleset shape this checkbox is
  `parameters.strict_required_status_checks_policy` on the `required_status_checks` rule.
- No Astro choice is involved, so no Astro docs are cited.

## Live change for Don

**Do not** run `gh api -X PUT repos/drcdev/dcc-web/rulesets/24156251 --input setup/github-ruleset.json`.
A ruleset `PUT` replaces the whole `rules` array. The committed file lacks parameters that only
the live ruleset has, and they would be dropped:

- `allowed_merge_methods: ["merge"]`;
- `require_extra_approval_for_unattributed_changes: true`;
- `require_last_push_approval`, `required_reviewers` and `do_not_enforce_on_create`;
- the live condition `~DEFAULT_BRANCH`.

Build the `PUT` body from the live ruleset instead, so only the one value changes. Don runs
this himself, signed in as `drcdev`:

```sh
gh api repos/drcdev/dcc-web/rulesets/24156251 \
  | jq '{name, target, enforcement, conditions, rules, bypass_actors}
        | (.rules[] | select(.type == "required_status_checks")
           | .parameters.strict_required_status_checks_policy) = false' \
  | gh api -X PUT repos/drcdev/dcc-web/rulesets/24156251 --input -
```

The jq transform was dry-run against the live ruleset on 2026-10-10, without the `PUT`. It
changed only `strict_required_status_checks_policy` to `false` and kept
`allowed_merge_methods: ["merge"]`. Afterwards, confirm with:

```sh
gh api repos/drcdev/dcc-web/rulesets/24156251 \
  --jq '.rules[] | select(.type=="required_status_checks") | .parameters.strict_required_status_checks_policy'
```

It should print `false`. Then run `pnpm setup:check --item github-main-protection`, which should
report complete.

The dashboard route does the same: Settings → Rules → Rulesets → `main-protection` →
"Require status checks to pass" → untick "Require branches to be up to date before merging" →
Save. Either route can run before or after this PR merges, and the setup check is green either
way.

## Risks

- **Principle II (D1):** the deploy of a combined tree that no CI run checked, described above.
  `verify` on the push to `main` reports soon after the deploy, and the fix is a rollback or a
  forward fix.
- **Do the CI tiers stay safe once PRs need not be up to date?** Yes, with one residual gap
  that already exists.
  - **How `main` pushes are tiered.** A push to `main` is tiered by `BEFORE_SHA..sha`, the
    previous tip of `main` against the new merge commit. That diff is the merged PR's own net
    change, so a stale PR's push to `main` is tiered by its own files but tested on the
    combined tree.
  - **Docs-tier PR merging second.** It runs secretlint and the whole unit and component suite
    on the combined tree. Only unit checks read `docs/`, so any interaction between the docs
    change and a sibling's code is caught.
  - **Docs-tier PR merging first.** The later code PR's push to `main` runs the full tier on
    the combined tree.
  - **Skip-safe files.** No check reads them, so combining them cannot break anything. If a
    sibling code PR starts reading one, it must add it to `READ_BY_CHECKS`. That list ships in
    the same tree, so a later skip-safe edit to that file sorts to the full tier on `main`.
    Forgetting that entry is an existing risk, not a new one.
  - **Content-only PR merging second.** It runs the full gate on the combined tree, except that
    the build project is narrowed to the content-reading build tests. Before, the PR's own run
    on the current `main` covered that combination with the full build project. This is the
    one small new gap. It is accepted because a content file can only break build tests that
    read content, and those still run.
  - **Conclusion:** `main` stays verified after every merge, at the tier of its own diff,
    against the combined tree. The 031 rationale sentence "the tree that lands on `main` is
    one CI already checked on its pull request" becomes untrue, and W3 notes that.
- **Live/file drift:** until Don applies the live change, live is stricter than the file, and
  the setup check cannot tell, since it no longer reads the field. That is harmless (stricter),
  and Don can check it with the command above.
- **Wrong `PUT`:** a `PUT` of the committed file would silently drop live-only parameters,
  including `allowed_merge_methods`. The "Live change for Don" section warns against it and
  gives a transform built from the live ruleset instead.
- **This PR itself:** it must be up to date to merge until Don applies the live change. If he
  applies it first, it need not be.
