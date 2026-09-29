# Bug Assessment: Pipelines open PRs under drcdev instead of drc-agents

- **Slug**: pr-author-account
- **Created**: 2026-09-29
- **Source**: https://github.com/drcdev/dcc-web/issues/9 (host: github.com; policy: allowlisted; issue content supplied inline by the orchestrator, no further fetch)
- **Verdict**: valid
- **Severity**: medium

## Report (summarized)

Issue #9, "Pipelines must open PRs from the drc-agents account" (label: enhancement).
The `/deliver`, `/tweak` and `/squash` pipelines run `gh pr create` under whatever `gh`
account is active, normally `drcdev`. Don is the sole maintainer, and GitHub does not count
an author's approval on their own PR, so the `major-change-approval` gate rejects a
`drcdev`-authored PR with "Don's approval will not count on his own pull request; reopen this
change from drc-agents". Seen on #7 (opened by `/deliver`), closed and reopened by hand as #8.
Requested fix: in each skill's Finish step, `gh auth switch --user drc-agents`, then
`gh pr create`, then `gh auth switch --user drcdev`; verify the author with
`gh pr view <n> --json author`; if the switch fails or `drc-agents` is not in the keyring,
stop and ask Don. Notes: a project permission rule for the two `gh auth switch` commands
would let pipelines run the switch unattended (the auto-mode classifier blocked it once).

## Symptom

A PR opened by any of the three pipelines is authored by `drcdev`. When the PR carries the
`major-change` label, the `major-change-approval` check fails permanently and the PR has to be
closed and reopened from `drc-agents` by hand. Expected: the pipelines open every PR as
`drc-agents` and leave `gh` active as `drcdev` afterwards.

## Reproduction

1. Have `drcdev` as the active `gh` account (the normal state).
2. Run `/deliver`, `/tweak` or `/squash` through to Finish step 4 and choose "Major — hold for
   my review" in step 3.
3. The PR is created by `drcdev`; `scripts/ci/major-change-gate.ts` `decide()` sees
   `author === owner` and fails with the message above (observed on #7).

The skill text alone proves step 2: none of the three Finish sections switches account.

## Suspected Code Paths

- `.claude/skills/deliver/SKILL.md:267` — Finish step 4 "Push the branch and open a PR with
  `gh pr create`"; no account switch anywhere in the file.
- `.claude/skills/tweak/SKILL.md:238` — same step 4, same omission.
- `.claude/skills/squash/SKILL.md:211` — same step 4, same omission.
- `scripts/ci/major-change-gate.ts:39-43` — `decide()` fails a labelled PR when
  `author === owner`; `setup/config.json` sets `owner: drcdev`, `machineAccount: drc-agents`.
  Working as designed; not to change.
- `docs/setup.md` §8 {#github-machine-account} and `CLAUDE.md` "Merging" — already state the
  rule; the skills never implemented it.
- `.reference/cadence/.claude/skills/{deliver,tweak,squash}/SKILL.md` — upstream has
  `gh pr create` with no account switch, so there is no upstream step to port.

## Root Cause Hypothesis

Omission (confidence: high). The pipelines were ported from cadence, which has no
machine-account concept. The drc-agents rule was later written into `docs/setup.md` and
`CLAUDE.md` but never into the Finish step of the three skills that actually run
`gh pr create`.

## Proposed Remediation

**Preferred**: In Finish step 4 of all three skills, with identical wording (CLAUDE.md
"Orchestration skills" requires the pipelines to stay aligned), replace the bare
"open a PR with `gh pr create`" with this sequence:

1. Push the branch (unchanged; runs as `drcdev`).
2. `gh auth switch --user drc-agents`. If the command is denied, fails, or `drc-agents` is
   not in the keyring, **stop and ask Don** (AskUserQuestion, instruction in the question
   text); never fall back to opening the PR as `drcdev`.
3. `gh pr create ...` (body as today; pass the `major-change` label here with `--label` when
   step 3 chose major).
4. `gh auth switch --user drcdev` **immediately after `gh pr create`, whether it succeeded
   or failed**, so the active account is never left as `drc-agents`.
5. `gh pr view <n> --json author` and confirm `author.login` is `drc-agents`. If not, stop
   with a clear message telling Don the PR must be closed and reopened from `drc-agents`
   (per CLAUDE.md); do not work around the gate.
6. Apply the auto-merge choice (`gh pr merge --auto --merge`) and any label not set at
   create time, as `drcdev`.

Placement of the switch-back (explicit decision): it goes directly after `gh pr create`,
before the author check, the label / `gh pr merge --auto --merge` step, the baselines
fallback (step 5) and `gh pr checks --watch` (step 6). Only authorship depends on the active
account; the gate reads the PR author, not who labelled it or enabled auto-merge, and the
setup check reads as Don. Keeping the `drc-agents` window to a single command also minimises
the chance of leaving `gh` on the wrong account. Step 3's wording "enable
`gh pr merge --auto --merge` after opening the PR" stays correct.

**Alternatives**:
- Run all of step 4 (create, label, auto-merge) as `drc-agents` and switch back before
  step 5. Works, but widens the window and has auto-merge enabled by the machine account
  for no benefit.
- `GH_TOKEN=$(gh auth token --user drc-agents) gh pr create ...` avoids changing the active
  account, but handles a token in the shell, which the setup skill forbids
  (`gh auth token`); rejected.

**Files likely to change**:
- `.claude/skills/deliver/SKILL.md`
- `.claude/skills/tweak/SKILL.md`
- `.claude/skills/squash/SKILL.md`
- `tests/unit/setup/pipeline-pr-author.test.ts` (new, sibling of `skill-behaviour.test.ts`)

**Tests to add or update** (vitest, reading skill text like
`tests/unit/setup/skill-behaviour.test.ts`; write first and see it fail):
- For each of deliver, tweak, squash: the Finish section contains
  `gh auth switch --user drc-agents` before `gh pr create`, and
  `gh auth switch --user drcdev` after `gh pr create`.
- Each contains the author check `gh pr view` with `--json author` and names `drc-agents`.
- Each says to stop and ask Don when the switch fails or `drc-agents` is missing, rather than
  opening the PR as `drcdev`.
- Alignment: the account-switch block is identical text in all three files.

## Scope decisions

- **Project permission rule in `.claude/settings.json`: out of scope, follow-up.** The fix
  works without it: when the permission layer allows `gh auth switch`, the pipeline runs
  unattended; when it blocks, the skill's stop-and-ask path fires and Don approves, which is
  the correct safe behaviour, not a failure of the fix. Creating `.claude/settings.json` is a
  harness permission change, not skill text, and belongs in its own change (for example via
  `/update-config`).
- Adding "the PR-author account switch" to CLAUDE.md's "Keep the three pipelines aligned"
  list: follow-up (documentation only; the new test enforces alignment meanwhile).
- The stale gate failure after a review-triggered pass (#3): unrelated, out of scope.

## Risks & Considerations

- If `gh` is also git's credential helper, the push stays under `drcdev` because the switch
  happens after the push; no change in push behaviour.
- A skipped switch-back would leave `gh` on `drc-agents`, making later `gh` calls (and the
  setup check) act as the machine account; hence switch back unconditionally right after
  create, including on failure.
- A permission denial of `gh auth switch` will pause the pipeline for Don until the
  follow-up permission rule exists.
- The change is skill text and a unit test only; not a major change under Principle III
  (no CI, deployment, dependency or design change).

## Open Questions

None blocking.
