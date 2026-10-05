# Chore plan: single-approval-ruleset (issues #85 and #86)

Branch: `chore/single-approval-ruleset`. The PR says `Closes #85` and `Closes #86`.

## Goal

https://github.com/drcdev/dcc-web/issues/85 and https://github.com/drcdev/dcc-web/issues/86,
delivered together (decision 5). Today, `main` requires zero approvals, and Don's review is
enforced only through a two-layer "major change" flow: CODEOWNERS paths with required
code-owner review, plus a `major-change` label read by a custom gate workflow that posts the
`major-change-approval` status. The live ruleset has also drifted from the committed one:
`dismiss_stale_reviews_on_push` is false live and true in `setup/github-ruleset.json`. This chore
makes the `main` ruleset require **one approving review on every PR**. It retires the whole
major-change flow: the label, the gate workflow and script, CODEOWNERS and the code-owner rule,
the pipelines' pre-PR pause and the "auto-merge off for a major change" rule. It also restores
the ruleset (stale approvals dismissed). On the Actions side it sets `persist-credentials: false`
on every checkout, and it adds a scheduled, read-only job that runs the ruleset drift check.
Principle III is amended through the `speckit-constitution` skill: "major change" stays a
classification that PR bodies flag, so Don knows what to read closely. Approval itself becomes
a rule the ruleset enforces on every PR, with no label or separate gate. No visitor-facing
behaviour changes.

## Acceptance

Mechanical, in the repository:

1. `setup/github-ruleset.json` has `required_approving_review_count: 1`,
   `require_code_owner_review: false`, `dismiss_stale_reviews_on_push: true`,
   `require_last_push_approval: false` and `allowed_merge_methods: ["merge"]`. It requires
   exactly one status check, `verify`, pinned to the GitHub Actions app
   (`integration_id: 15368`), with `strict_required_status_checks_policy: true`. It carries every
   other parameter the live ruleset has today (see W1), so a `PUT` from it loosens nothing.
2. `scripts/setup-check/checks/github-main-protection.ts` compares the live ruleset with
   `setup/github-ruleset.json` itself, not a hard-coded list. It names each gap: a missing or
   weaker rule, a pull-request parameter that differs, a required check missing, or a required
   check that is not in the file. Its unit tests prove each of these.
3. None of these exist any more: `.github/workflows/major-change.yml`,
   `scripts/ci/major-change-gate.ts`, `tests/unit/ci/major-change-gate.test.ts`,
   `.github/CODEOWNERS`, the `github-codeowners` and `github-major-label` setup items and their
   checks, tests and orphaned fixtures. `grep -rn "major-change-approval\|--label major-change\|CODEOWNERS" --exclude-dir=specs --exclude-dir=.specify --exclude-dir=node_modules --exclude-dir=.reference .`
   finds nothing except the deliberate history lines this plan names (R9 is under `specs/`).
4. The registry still has 32 items with orders 1 to 32. Items 12 and 13 are replaced by
   `github-actions-settings` and `github-auto-merge` (W3).
5. Every `actions/checkout` step in every workflow sets `persist-credentials: false`, and a unit
   test enforces it for any future workflow.
6. `.github/workflows/ruleset-drift.yml` exists. It runs on `schedule` and `workflow_dispatch`
   with `permissions: contents: read` only, and runs
   `node scripts/setup-check/cli.ts --item github-main-protection` with `GH_TOKEN` set from
   `github.token`. Unit tests in `tests/unit/ci/workflows.test.ts` assert this.
7. The four pipeline skills (`deliver`, `tweak`, `squash`, `chore`) have no pre-PR major-change or
   merge-mode `AskUserQuestion` and no `--label major-change`. Auto-merge is armed by default and
   left off only for open `[PREVIEW-CHECK]` items. The PR author account block is identical in all
   four, keeps the drc-agents → `gh pr create` → drcdev sequence, and gives GitHub's
   author-approval rule as its rationale. `CLAUDE.md` Merging says the same and describes what the
   ruleset enforces.
8. `.specify/memory/constitution.md` Principle III is amended via `speckit-constitution` (W6)
   with a Sync Impact Report, a version bump and a new Last Amended date.
9. `specs/001-setup-walkthrough/research.md` R9 records the new decision and the decision-3
   rationale (W8).
10. `pnpm run verify:quick` is green after every work item, and the full `pnpm run verify` is green
    before the PR (orchestrator).

Live (Don, see "Live steps"): `pnpm setup:check --item github-main-protection` reports
complete, as do `github-actions-settings` and `github-auto-merge`. The `major-change` label is
deleted, and a manual `ruleset-drift` run is green.

There is no before/after timing measurement. The before-state is the live drift recorded in
exploration: `dismiss_stale_reviews_on_push: false`, `required_approving_review_count: 0`,
required checks `major-change-approval` + `verify`, `allowed_actions: "all"`,
`sha_pinning_required: false`, fork approval policy `first_time_contributors`.

## Scope

**In:** everything in the work items below.

**Out:**

- Any change to live GitHub settings by an agent. The ruleset `PUT`, the label deletion and the
  Actions settings are Don's steps ("Live steps").
- Historical feature documents in `specs/001-setup-walkthrough/` other than R9 (spec, plan,
  tasks, data-model, contracts, quickstart, checklists), and older `specs/*/plan.md` mentions of
  major changes. They record what was decided then.
- Renaming Principle III. Its title "Human Review for Major Changes" stays, because more than 20
  historical plans and `docs/setup.md` cite it by name (W6).
- A Deploy Hook, a Workers Builds trigger change or any Cloudflare credential in GitHub
  (decision 3).
- `require_last_push_approval` (stays false, decision 2).
- Issue #87 ("keep drcdev out of agent sessions") was closed won't-fix by Don. Local
  `gh auth switch` stays, the PR author block keeps switching back to `drcdev`, and no deny rules
  or token changes are added.

**Follow-ups for the PR body:**

1. After merge, confirm that the scheduled-run failure notification reaches Don. GitHub sends it
   to the user who last changed the cron line.
2. Consider `required_review_thread_resolution: true` later. It is not part of this decision set.

## Constitution Check

- **I. Test-First:** every work item names its test. W1, W3, W4 and W5 write the test first
  (unit). W2 and W3 remove tests with the coverage mapping below. W6 to W8 are documents, guarded
  by the existing alignment tests plus the new W7 assertions.
- **II. Automated Release Gate:** `verify` stays required and strict. The release gate is not
  weakened: one approval is added to every PR. Decision 3 accepts the strict status-check policy
  as the "deploy only after CI" mitigation, and R9 records it.
- **III. Human Review for Major Changes:** criteria that fire:
  - "changes CI, deployment or infrastructure configuration" (`.github/` workflows, ruleset
    file, setup checks);
  - "amends this constitution" (W6).

  Verdict: **major**. Under the flow this PR retires, that means auto-merge off. Under the flow
  it introduces, the PR has an open `[PREVIEW-CHECK]` item (live step L1 must run before the
  merge can go through), so auto-merge stays **off** either way. Don merges after L1 and his
  approval.
- **IV. First-Party Before Custom:**
  - Native ruleset approval replaces the custom gate script.
  - The drift job reuses the existing setup check through the runner's preinstalled `gh` CLI and
    `GITHUB_TOKEN`. That is the first-party route; no third-party Action is used.
  - `persist-credentials` is `actions/checkout`'s own input.
  - Custom code is limited to generalising one existing check.
  - First-party alternative considered for drift: GitHub has no native "alert when a ruleset
    changes" for a personal repository. The audit log needs an organisation, and ruleset history
    has no notifications.
- **V. Static by Default:** unaffected.
- **VI. Content as Files:** unaffected.
- **VII. Private Data:** no secrets added. The drift job uses only the automatic `GITHUB_TOKEN`,
  and `persist-credentials: false` keeps that token out of `.git/config`.
- **VIII. Cloudflare Best Practices:** unaffected; Workers Builds keeps deploying on push to
  `main` (decision 3).
- **IX. Cost Ceiling:** one scheduled job a day of about 1 to 2 minutes on a public repository's
  free Actions minutes, so $0.
- **X. Accessible, Fast and Private:** unaffected.
- **XI. Spec Kit Workflow:** chore pipeline, `chore/` branch, `.specify/chores/single-approval-ruleset/`,
  `after_chore_*` commits. The constitution is changed only through `speckit-constitution`.

## Decisions (recorded by Don, 2026-10-04; no `[NEEDS DECISION]` items)

1. One required approving review on every PR; the whole major-change flow is retired.
2. `dismiss_stale_reviews_on_push: true` restored; `require_last_push_approval` stays false.
3. `strict_required_status_checks_policy: true` is the accepted mitigation for "deploy only after
   CI". Residual risks: drift → scheduled drift check; a PR weakening `ci.yml` → required
   approval; a flaky test passing on the PR and failing on `main` → accepted, because rollback is
   one command.
4. Principle III is amended via `speckit-constitution` (text in W6).
5. #85 and #86 ship as one PR.
6. #87 is won't-fix: the PR author block keeps its account sequence; only its rationale changes.

Calls made by this plan (no user question needed; the review phase may challenge them):

- **P1. CODEOWNERS and code-owner review are removed.** The issue asks for this "if they no
  longer serve a purpose". Their purpose was marking paths as major. Once every PR needs an
  approval, the path list adds nothing. The one thing a catch-all `* @drcdev` owner would still
  add is refusing `drc-agents`' approval on a PR authored by `drcdev`. Every PR is authored by
  `drc-agents`, though, and both accounts sit in the same local keyring (#87 won't-fix), so that
  is no real boundary. R9 records the residual.
- **P2. The drift job reuses `setup:check --item github-main-protection`** rather than a second
  comparison script. There is one source of truth, the setup check already reads the ruleset
  through `gh api` (GET only), and `GET /repos/{owner}/{repo}/rulesets` and `/rulesets/{id}` are
  readable with `GITHUB_TOKEN` on a public repository (confirmed: they are even readable
  unauthenticated). The check is generalised to diff the committed file (W1), so "matches
  `setup/github-ruleset.json`" becomes literally true. `bypass_actors` is omitted from the
  response for readers without admin rights. The check treats an absent field as "not visible"
  (no gap). Don's admin sign-in still sees it in the local setup check.
- **P3. Setup items 12 and 13 are replaced, not deleted**, to avoid renumbering 18 items, their
  check constants, `items.test.ts` order literals and the 32 `docs/setup.md` headings:
  - 12 → `github-actions-settings`: confirms Don's #86 dashboard work, through the setup check
    the walkthrough already uses.
  - 13 → `github-auto-merge`: keeps the `allow_auto_merge` guarantee that `github-major-label`
    held, which auto-merge-by-default still needs.
- **P4. The committed ruleset gains the live-only parameters** so `PUT` is lossless:
  - `allowed_merge_methods: ["merge"]`;
  - `require_last_push_approval: false`;
  - `required_reviewers: []`;
  - `require_extra_approval_for_unattributed_changes: true`;
  - `do_not_enforce_on_create: false`;
  - the `verify` context's `integration_id: 15368`. Dropping it would let any status poster
    satisfy `verify`.

  `conditions.ref_name.include` stays `refs/heads/main`; the check already accepts
  `~DEFAULT_BRANCH` too.
- **P5. Constitution bump: MINOR (2.2.0 → 2.3.0).** Approval is extended to every PR and the
  major-change definition is unchanged, so this is "materially expanding" a principle rather than
  redefining it. `speckit-constitution` may raise it to MAJOR if its own rules say so; the review
  checks the bump is justified in the Sync Impact Report.

## Work items

Every implement subagent: run the named targeted vitest files before and after, then
`pnpm run verify:quick` (toolchain note in Risks). Each item leaves the suite green.

### [x] W1 Ruleset file and a main-protection check that diffs it

- **Files:**
  - `setup/github-ruleset.json` (Acceptance 1 and P4);
  - `scripts/setup-check/schemas.ts`: `githubRulesetSchema` accepts the added
    pull_request parameters and an optional `integration_id` per check, and still rejects
    unknown rule types;
  - `scripts/setup-check/checks/github-main-protection.ts`: read `setup/github-ruleset.json`
    through `ctx.fs.readJson`. Export a pure
    `evaluateGaps(expected: GithubRuleset, actual: FullRuleset | null): string[]` that keeps
    today's named gaps where they still apply:
    - protection active on main, pull request required, branch must be up to date before
      merging, force-pushes blocked, deletion blocked, no bypass actors (only when the field is
      present);
    - `required check <context>` for each committed context missing live, or live with a
      different `integration_id` when the file pins one;
    - `unexpected required check <context>` for live contexts not in the file;
    - for each pull_request parameter in the file whose live value differs, one gap each.
      Friendly names: `one approving review required` (count), `stale approvals dismissed on new
      commits`, `merge commits only`; otherwise `pull request setting <key> differs`.

    Fix the header comment: there is no longer a "closed list of 10 rules";
  - fixtures `tests/fixtures/providers/github/ruleset-{full,partial,excludes-main,wrong-branch}.json`
    re-shaped to the new rules (`ruleset-full` = the committed file as live returns it, with
    `integration_id` and `~DEFAULT_BRANCH`);
  - `tests/unit/setup/drift.test.ts`: the "ruleset contexts" block asserts the contexts are
    exactly `["verify"]` (with `integration_id` 15368), and `ci.yml` still has a `verify:` job.
    Drop the `STATUS_CONTEXT` import and the `major-change.yml` lines **in that block only**; the
    file is deleted in W2. Add: `required_approving_review_count` is 1,
    `dismiss_stale_reviews_on_push` is true and `require_code_owner_review` is false;
  - `items.ts` `github-main-protection` `confirmedBy` and `purpose` text; the `docs/setup.md`
    §14 "What it is for" and "How it will be confirmed" paragraphs (W3 finishes §14's "Where").
- **Test:** new-first, unit.
  - `tests/unit/setup-check/checks/github-main-protection.test.ts`: the `fs.readJson` fake
    returns the config or the ruleset by path. Cases:
    - no ruleset → every gap;
    - partial → exact gap list;
    - full → complete;
    - live `dismiss_stale_reviews_on_push: false` → `stale approvals dismissed on new commits`;
    - count 0 → `one approving review required`;
    - an extra live `major-change-approval` → `unexpected required check major-change-approval`;
    - `verify` without or with another `integration_id` → `required check verify`;
    - absent `bypass_actors` → no bypass gap;
    - excludes-main and wrong-branch keep their assertions.
  - `tests/unit/setup/schemas.test.ts`: the valid fixture gains the new fields; the
    unknown-type rejection stays.
- **Layer:** unit (pure function over JSON; no browser or build can observe more).
- **Coverage mapping:**
  - "code-owner review required" gap → retired by decision #85 (P1). Replaced by the equality
    gap that requires live `false` to match the file.
  - "required check major-change-approval" gap → retired by decision #85. The inverse,
    `unexpected required check`, now guards against it lingering.
  - The drift.test assertion that the contexts contain `STATUS_CONTEXT` → retired by decision
    #85. Replaced by "contexts are exactly `["verify"]`".

### [x] W2 Retire the major-change workflow and gate script

- **Files:**
  - delete `.github/workflows/major-change.yml`, `scripts/ci/major-change-gate.ts` and
    `tests/unit/ci/major-change-gate.test.ts`;
  - `tests/unit/ci/workflows.test.ts`: remove the `major-change.yml` describe block (l.236–288);
    keep the ci.yml assertions at l.59–60, which still guard against a job named
    `major-change-approval`, or drop them as obsolete (the implementer's choice; say which);
  - `tests/unit/setup/drift.test.ts`: the two secret loops read every
    `.github/workflows/*.yml` through `readdirSync` instead of `ci` + `major`;
  - `scripts/setup-check/checks/github-ci-workflow.ts`: `REQUIRED_WORKFLOW_PATHS` = `ci.yml`
    only for now (W5 adds `ruleset-drift.yml`); fix the messages;
  - `tests/unit/setup-check/checks/github-ci-workflow.test.ts`;
  - fixture `workflows-both-present.json` (drop the major-change entry; W5 adds ruleset-drift);
  - `items.ts` item 11 `where` and `confirmedBy`;
  - `docs/setup.md` §11 text;
  - check whether `scripts/ci/changed-paths.ts` or `tests/unit/ci/changed-paths.test.ts`
    name the gate script or the workflow, and update them if so.
- **Test:** existing tests must keep passing after the edits listed (unit).
  `github-ci-workflow.test.ts` is updated test-first to expect only `ci.yml`.
- **Layer:** unit.
- **Coverage mapping:**
  - `major-change-gate.test.ts` (`decide`, `toCommitStatus`, `statusApiArgs`, author-is-owner
    refusal) → retired by decision #85. Approval is now GitHub's native
    `required_approving_review_count: 1` (asserted in drift.test and the main-protection check
    from W1). The author refusal is GitHub's native "an author's approval does not count", which
    the pipelines handle in the PR author block (pipeline-pr-author.test.ts).
  - workflows.test `major-change.yml` block → retired by decision #85 (the workflow no longer
    exists).
  - drift.test secret-reference loops → kept, now over every workflow file (stronger).
  - github-ci-workflow "major-change.yml exists" → retired by decision #85 (W5 adds the drift
    workflow in its place).

### W3 Retire the CODEOWNERS and label items; add Actions-settings and auto-merge items

- **Files:**
  - delete `.github/CODEOWNERS`, `scripts/setup-check/checks/github-codeowners.ts`,
    `scripts/setup-check/checks/github-major-label.ts` and their tests;
  - delete orphaned fixtures after grepping each: `codeowners-valid.json`,
    `codeowners-errors.json`, `labels-with-major-change.json`,
    `labels-without-major-change.json`, `pr-open-authored-by-don.json` and
    `pr-open-authored-by-bot.json` (delete only if nothing else uses them);
  - new `scripts/setup-check/checks/github-actions-settings.ts` (order 12). It calls GET
    `repos/{o}/{r}/actions/permissions`, `.../actions/permissions/selected-actions` (only when
    `allowed_actions` is `selected`) and `.../actions/permissions/fork-pr-contributor-approval`.
    It is complete when:
    - `allowed_actions` is `selected`;
    - `sha_pinning_required` is true;
    - `github_owned_allowed` is true and `verified_allowed` is false;
    - `patterns_allowed` covers every non-GitHub-owned `uses:` owner/repo in the workflows
      (today only `pnpm/action-setup`; the expected list is a constant, and a unit test
      cross-checks it against the workflow files);
    - `approval_policy` is `all_external_contributors`.

    Each gap is named. `needsDon: true`, `phase: "after-merge"`, `principles: ["II", "VII"]`;
  - new `scripts/setup-check/checks/github-auto-merge.ts` (order 13): `allow_auto_merge` is true
    (the auto-merge half of the old label check). `needsDon: true`, `principles: ["II"]`;
  - `scripts/setup-check/items.ts`: imports, `checksById`, items 12 and 13 replaced, and their
    `requirements`. Reuse FR-014 or the FR the old items cited, and keep the arrays non-empty
    for `items.test.ts`;
  - `tests/unit/setup/docs-structure.test.ts` `ITEM_IDS`;
  - `tests/unit/setup-check/next-action.test.ts`: replace the codeowners and major-label
    scenarios with the two new checks;
  - `tests/unit/ci/workflows.test.ts` and `tests/unit/setup/drift.test.ts`: remove the
    CODEOWNERS blocks;
  - `docs/setup.md`:
    - §12 and §13 are rewritten for the new items, with anchors `{#github-actions-settings}` and
      `{#github-auto-merge}`;
    - §14 "Where to do it" now gives both commands: `POST` for a first import, and
      `PUT repos/drcdev/dcc-web/rulesets/<id>` to update;
    - the "Principle III" lines read "(Human Review for Major Changes)" unchanged;
  - `.claude/skills/setup-walkthrough/SKILL.md` l.109–119:
    - replace the `gh label create major-change` example with the "shown for Don" Actions
      settings commands (from L4 below);
    - add the ruleset `PUT` example next to the `POST`.

    `skill-behaviour.test.ts` checks that the skill never *runs* mutating patterns; keep these
    inside "Shown for Don to run himself" blocks, as today;
  - add new fixtures for the two checks.
- **Test:** new-first, unit:
  - `tests/unit/setup-check/checks/github-actions-settings.test.ts`: complete; each gap
    individually; selected-actions not called when `allowed_actions` is `all`; could-not-check on
    `gh` error; the `patterns_allowed` constant equals the non-`actions/` owners in
    `.github/workflows/*.yml`;
  - `tests/unit/setup-check/checks/github-auto-merge.test.ts`: complete, missing,
    could-not-check;
  - `items.test.ts` and `docs-structure.test.ts` stay green with 32 items.
- **Layer:** unit.
- **Coverage mapping:**
  - `github-codeowners.test.ts`, workflows.test CODEOWNERS block, drift.test "CODEOWNERS covers
    every major path" → retired by decision #85 (P1: every PR needs an approval, so there are
    no major paths to own).
  - `github-major-label.test.ts`: the label assertions → retired by decision #85. The
    `allow_auto_merge` assertions → `github-auto-merge.test.ts`.
  - next-action scenarios → the new checks' scenarios in the same file.

### W4 `persist-credentials: false` on every checkout

- **Files:** `.github/workflows/ci.yml` (5 checkouts) and `.github/workflows/visual-baselines.yml`
  (1). Add `persist-credentials: false` under each checkout's `with:` (create `with:` where it is
  missing; keep `fetch-depth: 2` and the visual-baselines `ref:`). Nothing in either workflow
  pushes or runs authenticated `git` (the `changes` job only diffs `HEAD^1` locally; confirm by
  grepping for `git push` and `git fetch`).
- **Test:** new-first, unit, in `tests/unit/ci/workflows.test.ts`: a describe block over every
  `.github/workflows/*.yml` (`readdirSync`) asserting that each `uses: actions/checkout@` step's
  `with:` block contains `persist-credentials: false`. Write it, see it fail on `ci.yml`, then
  edit.
- **Layer:** unit.
- **Coverage mapping:** none removed.

### W5 Scheduled read-only ruleset drift workflow

- **Files:**
  - new `.github/workflows/ruleset-drift.yml`:
    - `name: Ruleset drift`;
    - `on: schedule` (one daily cron at an off-peak minute, e.g. `'17 6 * * *'`) and
      `workflow_dispatch`;
    - top-level `permissions: contents: read` and nothing else;
    - `concurrency` group `ruleset-drift`;
    - one job `drift` on `ubuntu-latest`, `timeout-minutes: 10`;
    - steps (the same SHA-pinned actions as ci.yml): checkout (`persist-credentials: false`),
      `pnpm/action-setup`, `setup-node` (`.nvmrc`, `cache: pnpm`),
      `pnpm install --frozen-lockfile`, then
      `run: node scripts/setup-check/cli.ts --item github-main-protection` with
      `env: GH_TOKEN: ${{ github.token }}`.

    The CLI exits 1 when the item is not complete, which fails the run. That failure is the
    alert;
  - `scripts/setup-check/checks/github-ci-workflow.ts`: `REQUIRED_WORKFLOW_PATHS` adds
    `.github/workflows/ruleset-drift.yml`; update the fixture and test;
  - `items.ts` item 11 text and `docs/setup.md` §11 and §14 mention the scheduled check;
  - `specs/001-setup-walkthrough/research.md` l.176–177 says scheduled drift detection is a
    follow-up. Leave it; W8 notes it is now done in R9.
- **Test:** new-first, unit, in `tests/unit/ci/workflows.test.ts`, a new
  `describe(".github/workflows/ruleset-drift.yml")`:
  - triggers are exactly `schedule` and `workflow_dispatch` (never `push` or `pull_request`);
  - top-level permissions are exactly `contents: read`, with no job-level escalation;
  - every action is pinned to a 40-character SHA;
  - it installs with `--frozen-lockfile`;
  - it runs `scripts/setup-check/cli.ts --item github-main-protection`;
  - `GH_TOKEN` comes from `github.token`, and no `secrets.` other than `GITHUB_TOKEN` appears;
  - no `continue-on-error`.

  The W4 persist-credentials test covers its checkout. `github-ci-workflow.test.ts` expects
  both files.
- **Layer:** unit (the workflow file is config; the check's logic is already unit-tested in W1;
  the real scheduled run is L5 `[PREVIEW-CHECK]`).
- **Coverage mapping:** none removed.

### W6 Amend Principle III through `speckit-constitution`

- **Files:** `.specify/memory/constitution.md`, changed **only** by invoking the
  `speckit-constitution` skill. Never hand-edit it. Pass the skill this amendment as its
  principle input:

  > Amend Principle III "Human Review for Major Changes" (keep the title). Replace its body with:
  >
  > "Every pull request needs Don's approving review before it merges. The `main` branch ruleset
  > enforces this; there is no label or separate gate. Because GitHub does not count an author's
  > approval on their own pull request, agents open pull requests from a separate machine
  > account so Don's review can count.
  >
  > A change is a **major change** if it:
  > - adds, removes or replaces a dependency, integration or external service;
  > - touches how contact data is collected, stored, retrieved or deleted;
  > - changes the design system, site-wide layout, navigation or visual identity;
  > - could increase running costs;
  > - changes CI, deployment or infrastructure configuration;
  > - amends this constitution.
  >
  > A major change is classified in its plan and flagged in its pull request body, with the
  > criteria that apply, so Don reviews it closely and looks at the preview deployment before
  > approving. When in doubt, treat the change as major. Any pull request may have auto-merge
  > enabled; it merges only once Don has approved it and the release gate passes."
  >
  > Version: MINOR, 2.2.0 → 2.3.0 (Principle III materially expanded: approval extends from
  > major changes to every change; the major-change definition is unchanged). Last Amended
  > 2026-10-04. Sync Impact Report: Modified principles III. Other references to "major change"
  > (IX cost, Technology Constraints, Governance "reviewed as a major change") are unchanged and
  > still read correctly. Source: issues #85 and #86.

- **Test:** `no behaviour: n/a (governance text)`. Guards that read the file must stay green:
  `tests/unit/ci/changed-paths.test.ts` (READ_BY_CHECKS) and any unit test that greps
  `constitution.md` (implementer: `grep -rln constitution.md tests/`).
- **Layer:** n/a.
- **Coverage mapping:** none removed.

### W7 Pipeline skills and `CLAUDE.md`

- **Files:** `.claude/skills/{deliver,tweak,squash,chore}/SKILL.md` and `CLAUDE.md`. All four
  skills change together (alignment rule). Before editing, read
  `tests/unit/setup/pipeline-pr-author.test.ts`, `pipeline-verify-wording.test.ts`,
  `pipeline-visual-baselines.test.ts` and `pipeline-test-placement.test.ts`.
  - **Frontmatter `description`:** drop "and the major-change / merge decision before the PR" and
    its variants ("and for the merge decision before the PR", "and the merge decision before the
    PR").
  - **Rules "only user pauses" bullet:**
    - deliver: clarify only;
    - tweak: clarify only;
    - squash: the ambiguity gate only;
    - chore: the decision gate only.
  - **Finish step 3** keeps its number, so the PR author block still ends before `\n5. ` as the
    test expects. It becomes **"Major-change classification (no pause)."** Same wording in all
    four skills, with skill-specific detail kept only where it exists today (chore's
    "`package.json` or `.github/` is major"; tweak's "re-check triage condition 1; if a criterion
    fired, triage was wrong — say so in the PR body"):
    - run `git diff --stat main` and `git diff --name-only main...HEAD`;
    - decide against the Principle III list; when in doubt, it is major;
    - put the verdict and the criteria that fired in the PR body, so Don knows how closely to
      read it;
    - the verdict does not change how the PR merges: the `main` ruleset requires Don's
      approving review on every PR;
    - auto-merge is armed by default after the PR opens, and waits for that approval and a green
      `verify`;
    - leave auto-merge off only when the PR has open `[PREVIEW-CHECK]` items, and say so in the
      PR body;
    - no `AskUserQuestion` here.
  - **Finish step 4 PR body list:** "the label / auto-merge chosen in step 3" → "the major-change
    verdict and criteria and whether auto-merge is armed".
  - **PR author account block** (identical in all four). Change only:
    - the rationale sentence becomes: "The `main` ruleset requires an approving review on every
      PR, and GitHub does not count an author's approval on their own PR, so Don can only
      approve a PR he did not author.";
    - sub-step 3 → plain `gh pr create ...` (no label parenthetical);
    - sub-step 5 "do not work around the gate" → "do not work around the ruleset";
    - sub-step 6 → "Arm auto-merge (`gh pr merge --auto --merge`) as `drcdev`, unless step 3
      left it off for open `[PREVIEW-CHECK]` items."

    Keep the drc-agents → create → drcdev sequence, "whether it succeeded or failed", the
    `gh pr view <n> --json author` check and the denied/keyring/`AskUserQuestion` wording (#87
    won't-fix).
  - **Final report lines:** "merge mode chosen" → "whether auto-merge is armed".
  - **chore l.53–57:** a chore may be a major change. It is classified in the plan and again in
    Finish and flagged in the PR body. Like every PR, it merges only on Don's approval. Drop
    "the PR is held for Don's review" and "never promises an auto-merge".
  - **tweak l.35 and l.60:** keep condition 1 (a tweak is never major). Reword l.60–61: "safe to
    arm auto-merge, which still waits for Don's approval".
  - **deliver l.120** (plan phase flags major): unchanged.
  - **Visual-baselines shared sentence** ("…which is a major change under Principle III in any
    case."): unchanged in all five places.
  - **`CLAUDE.md` Merging:**
    - first bullet: open every PR from `drc-agents` because the `main` ruleset requires one
      approving review on every PR and GitHub does not count an author's own approval, so Don
      (`drcdev`) can approve only a PR he did not author. Keep the switch sequence and the
      "closed and reopened … do not work around the ruleset" sentence;
    - add one bullet on what branch protection enforces (`setup/github-ruleset.json`, ruleset
      `main-protection`):
      - a PR is required, with one approving review; stale approvals are dismissed on push;
      - the `verify` check is required and the branch must be up to date;
      - merge commits only;
      - no force-push or deletion, and no bypass actors;
      - a daily read-only workflow (`ruleset-drift`) runs the setup check against the live
        ruleset;
    - "Enable auto-merge by default" bullet: unchanged in substance;
    - "Leave auto-merge off" bullet becomes: only when Don must check something on the preview
      before it can merge (open `[PREVIEW-CHECK]` items); a major change is flagged in the PR
      body instead.
  - **`CLAUDE.md` "Keep the four pipelines aligned" list:** replace "the pre-PR major-change /
    merge-mode pause (one `AskUserQuestion` before `gh pr create`)" with "the Finish step 3
    major-change classification and auto-merge rule (no pause)".
- **Test:** new-first, unit. Extend `tests/unit/setup/pipeline-pr-author.test.ts` with:
  - for each skill, the author block mentions "does not count an author's approval" and not
    `major-change-approval`;
  - no skill text contains `--label major-change`;
  - no skill's Finish step 3 contains `AskUserQuestion`.

  All existing alignment tests (pr-author, verify-wording, visual-baselines, test-placement,
  changed-paths READ_BY_CHECKS) stay green.
- **Layer:** unit.
- **Coverage mapping:** none removed. The block-identity assertion stays, with new text.

### W8 Record the decision in research R9

- **Files:** `specs/001-setup-walkthrough/research.md` R9 (l.179–215) only. Retitle it to
  "GitHub branch protection, CI check names, and review on every PR". Rewrite it with:
  - **Decision (protection):** the ruleset as now committed, every parameter listed; created with
    `POST` and updated with `PUT repos/drcdev/dcc-web/rulesets/<id>`.
  - **Decision (review):** one approving review on every PR (#85, 2026-10-04); CODEOWNERS, the
    `major-change` label, the gate workflow and script are retired. "Major change" is now a
    classification flagged in PR bodies (Principle III, constitution 2.3.0).
  - **Decision (deploy only after CI), decision 3:**
    - Workers Builds keeps deploying on push to `main`;
    - there is no Deploy Hook, no Workers Builds trigger change and no Cloudflare credential in
      GitHub;
    - `strict_required_status_checks_policy: true` means a PR merges only when tested against
      the current `main`;
    - residual risks: drift → the daily read-only `ruleset-drift` workflow; a PR weakening
      `ci.yml` → the required approval; a flaky test passing on the PR and failing on `main` →
      accepted, because rollback is one command.
  - **Rationale:** replaces the CODEOWNERS + label rationale. Approval on every PR is native and
    needs no custom code. P1's reasoning about CODEOWNERS, and the residual it leaves:
    `drc-agents` could approve a `drcdev`-authored PR. That is accepted because agents author
    every PR and #87 is won't-fix.
  - **Alternatives:**
    - keep CODEOWNERS with `* @drcdev` (rejected, P1);
    - keep the label gate (rejected: custom code for what GitHub does natively);
    - a Deploy Hook (rejected, decision 3).
  - Keep the **Machine account** paragraph. Update its auto-merge sentence: `/deliver` and the
    other pipelines arm auto-merge on every PR. Drop the "Bootstrap exception" or mark it
    historical. Add one line saying the scheduled drift detection (the l.176–177 follow-up) is
    now `ruleset-drift.yml`.
- **Test:** `no behaviour: n/a (decision record)`. The changed-paths drift guard (no `specs/`
  path literals in tests) is unaffected because no test is added.
- **Layer:** n/a.
- **Coverage mapping:** none.

## Docs citations (Principle IV)

- Rulesets REST API (get, update with PUT, rules for a branch):
  https://docs.github.com/en/rest/repos/rules
- Available ruleset rules ("Require a pull request before merging", required approvals, dismiss
  stale approvals, required status checks, up to date before merging):
  https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- About protected-branch reviews (an author cannot approve their own pull request):
  https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews
- `schedule` and `workflow_dispatch` events (UTC cron; scheduled workflows in public repositories
  are disabled after 60 days without repository activity; notifications go to the user who last
  modified the cron syntax):
  https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- `permissions` for `GITHUB_TOKEN`:
  https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions
  and https://docs.github.com/en/actions/tutorials/authenticate-with-github_token
- Using the GitHub CLI in workflows (`GH_TOKEN`, preinstalled on GitHub-hosted runners):
  https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-github-cli
- `actions/checkout` `persist-credentials` input: https://github.com/actions/checkout#usage
- Security hardening (pin actions to a full SHA, least-privilege tokens):
  https://docs.github.com/en/actions/reference/security/secure-use
- Actions permissions REST (allowed actions, `sha_pinning_required`, selected actions, fork-PR
  contributor approval): https://docs.github.com/en/rest/actions/permissions

## Risks

- **Sequencing:** the live ruleset still requires `major-change-approval`, and this branch
  deletes the workflow that posts it. This PR (and any PR opened after it) cannot merge until
  Don runs L1. Auto-merge stays off, and the PR body must put L1 first.
- **Lossy PUT:** a `PUT` replaces the ruleset. P4 makes the committed file carry every live
  parameter. The review phase diffs the file against the live JSON captured in this plan's
  Acceptance before-state.
- **Unknown parameter:** `require_extra_approval_for_unattributed_changes` appears live but is
  not in older docs. If the `PUT` rejects it, Don drops the key from the file in a follow-up
  commit (not a loosening, because it then takes GitHub's default). L1 says so.
- **`bypass_actors` invisible to `GITHUB_TOKEN`:** the scheduled job cannot see bypass actors.
  Only an admin (Don) can add one, and the local setup check sees the field.
- **Scheduled-run failure notification** goes to the user who last edited the cron line. That
  may be the merge author, so L5 confirms Don gets it. Scheduled workflows also stop after 60
  days without repository activity; the repository is active.
- **Actions settings lockout:** with `allowed_actions: selected`, a workflow using an action
  outside `pnpm/action-setup@*` and GitHub-owned actions fails to start. The W3 cross-check
  test fails first when a workflow adds a new owner.
- **#87 won't-fix:** an agent session can still act as `drcdev` (and so approve a
  `drc-agents` PR) through the shared local `gh` keyring. Don has accepted this. The ruleset
  approval is a review gate, not a defence against a compromised local session.
- **Alignment drift:** W7 touches the shared blocks of four skills. The review phase diffs the
  four Finish sections.
- **Toolchain note for every implement subagent** (worktree guard): `source`,
  `perl -e … exec`, heredocs and compound git commands are blocked. Run node tools as
  `export PATH=/Users/doncoleman/.nvm/versions/node/v24.4.1/bin:/Users/doncoleman/.claude/jobs/f674a97c/tmp/bin:$PATH; corepack pnpm ...`
  (e.g. `... corepack pnpm exec vitest run <files>`, `... corepack pnpm run verify:quick`), and
  bound runs with the Bash tool's `timeout` parameter instead of the perl alarm. Run git
  commands one per call.

## Live steps (Don / post-merge)

Agents never run these. The PR body lists them in this order.

- [ ] L1 **Before merging this PR**, update the live ruleset from the branch's file. The ruleset
  must be updated before this PR can merge, because the PR deletes the gate that posts
  `major-change-approval`. From a checkout of `chore/single-approval-ruleset`:
  `gh api -X PUT repos/drcdev/dcc-web/rulesets/24156251 --input setup/github-ruleset.json`.
  If GitHub rejects `require_extra_approval_for_unattributed_changes`, tell the agent to drop
  that key and re-run. Effect: every open PR now needs one approval, and only `verify` is
  required. [PREVIEW-CHECK]
- [ ] L2 Run `pnpm setup:check --item github-main-protection` and confirm it is complete.
  [PREVIEW-CHECK]
- [ ] L3 Approve this PR and merge it (merge commit). Then delete the label:
  `gh label delete major-change --yes`. [PREVIEW-CHECK]
- [ ] L4 Actions settings (Settings → Actions → General, or):
  - `gh api -X PUT repos/drcdev/dcc-web/actions/permissions -F enabled=true -f allowed_actions=selected -F sha_pinning_required=true`
  - `gh api -X PUT repos/drcdev/dcc-web/actions/permissions/selected-actions -F github_owned_allowed=true -F verified_allowed=false -f 'patterns_allowed[]=pnpm/action-setup@*'`
  - `gh api -X PUT repos/drcdev/dcc-web/actions/permissions/fork-pr-contributor-approval -f approval_policy=all_external_contributors`

  Then confirm `pnpm setup:check --item github-actions-settings` and
  `--item github-auto-merge` are complete. [PREVIEW-CHECK]
- [ ] L5 Trigger the drift job once: `gh workflow run ruleset-drift.yml`. Confirm the run is
  green and that a failing run would notify Don (the cron-line author). [PREVIEW-CHECK]
