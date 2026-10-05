# Review report — single-approval-ruleset (#85, #94)

## Verdict

No CRITICAL or HIGH findings. W2–W9 plus the sanctioned W4b are done as planned, nothing beyond.
All eight of Don's #85 points are honoured: (1) ruleset file count 1, code-owner review stays on;
(2) CODEOWNERS is one comment plus `* @drcdev` and the `github-codeowners` check is reduced to the
catch-all; (3) the whole major-change flow is gone (workflow, gate script, label item, required
status, pause, CLAUDE.md rules); (4) PRs are still authored from `drc-agents`; (5) auto-merge is the
default; (6) only gate, label, pause and CODEOWNERS-path tests were deleted, and the one new test is
W4b's behaviour case; (7) one `speckit-constitution` amendment, combined with #94; (8) nothing from
#86 is in the diff. Principle III verdict stays **major**: CI and infra config (`.github/`,
`setup/github-ruleset.json`, setup checks) plus the constitution.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. `tests/unit/ci/workflows.test.ts:59-60` — two leftover assertions check there is no
   `major-change-approval` job. Harmless, but acceptance 5 says nothing should mention
   `major-change-approval`. Remove or accept.
2. `docs/setup.md:343` — §11 "How it will be confirmed" still says "both workflow files"; only
   `ci.yml` is required now.
3. `tests/unit/setup/skill-behaviour.test.ts:96` — `/gh label create/` was also dropped from the
   second (per-occurrence) list. Dropping it from the line 18 list was required; dropping it from
   the second list was not (that loop passes with zero occurrences), so it is a small unneeded
   weakening. The `docs-structure.test.ts` narrowing is not a weakening: the intro must now say
   "items 18 to 24", and the new pattern still rejects the old "18-item" count.
4. `plan.md:82-83` and L1 (`plan.md:607-625`) — the before-state is stale. Live already has count 1
   and stale-review dismissal on, so the only change left is removing `major-change-approval`. The
   jq `PUT` is idempotent and keeps the `verify` pin and the `~DEFAULT_BRANCH` include. The warning
   against a plain file `PUT` still holds: the file lacks `allowed_merge_methods`,
   `require_extra_approval_for_unattributed_changes`, `required_reviewers`,
   `require_last_push_approval` and `do_not_enforce_on_create`.
5. `docs/setup.md:381` and `.claude/skills/setup-walkthrough/SKILL.md:112` — the `gh api -X POST`
   import is fine as a first-time bootstrap (it carries the `verify` pin, the repo already allows
   merge commits only, and the walkthrough shows it only while the item is missing). It would be
   wrong as a way to edit the existing ruleset. Optional note: "once the ruleset exists, change it
   in the dashboard or with a `PUT` built from the live ruleset (R9)".
6. `docs/setup.md` §12/§13 — deleting the label item removed the only instruction to turn on
   "Allow auto-merge". It is on in the live repo and the plan accepts the gap; an optional one-line
   note in §13 would cover a fresh setup.
7. `scripts/setup-check/checks/github-main-protection.ts:3,70` — the comment "closed list of 10
   rules from spec.md" no longer matches spec.md's list; the count is still 10.
8. `.claude/skills/squash/SKILL.md:226`, `.claude/skills/chore/SKILL.md:336` — the PR-body sentence
   has a doubled "and … and whether auto-merge is armed". Wording only.
9. `tests/fixtures/providers/github/pr-open-authored-by-don.json:6` — still carries an inert
   `major-change` label. `workers-builds.test.ts` uses the fixture and ignores labels.

## Checks performed

- **Alignment:** the PR author block is identical in all four skills (new reason sentence, plain
  `gh pr create ...`, "do not work around the ruleset", new sub-step 6). The shared step 3 bullets
  are identical too; the per-skill lead-ins already differed. No `--label`, "merge mode" or "merge
  decision" text remains. CLAUDE.md "Merging" and the aligned-pipelines list match.
- **Leftovers:** a grep of live code, docs and skills found only LOW 1 and LOW 9. `.specify/bugs/`
  and `specs/` history are out of scope.
- **Renumbering:** the registry has 31 contiguous items. Item and step references in
  `docs/setup.md`, `docs/launch.md`, the walkthrough skill and the check comments were spot-checked
  and are consistent.
- **Coverage mappings:** all hold. W3 set the `wrong-branch` and `excludes-main` fixture counts to 1:
  the plan text said to leave them, but the exact isolation test (`toEqual`) needs the change.
  `partial` stays at 0 and shows the new gap. The `next-action` and `github-ci-workflow` tests use an
  `other.yml` fixture, so they still exercise a real "missing" case.
- **Constitution 2.3.0:** the Sync Impact Report is present and the MINOR bump is justified. There
  is no drift claim (#86 listed as a follow-up) and no least-privilege-credential line. Each
  Security Baseline control exists: `_headers`, Dependabot alerts (GET 204), the contact rate limit
  and the questions token bucket.
- **Retrieval contract (W7) and R9 (W9):** done as planned.

## Test result

`vitest run tests/unit`: 128 files, 2300 tests passed. No timing measurement applies: acceptance
is mechanical.

## Follow-ups for the PR body

1. #86: `persist-credentials`, the drift workflow, the Actions settings, and the live-only ruleset
   parameters in the file. A `PUT` from the file is safe once these are in it.
2. #97: config-test pruning.
3. Live steps: L1 only removes `major-change-approval`; L2 and L3 run the setup checks; L4 is
   `gh label delete major-change --yes` after the merge.

_Report text produced by the review subagent and saved by the orchestrator, because the harness
blocks subagent writes._
