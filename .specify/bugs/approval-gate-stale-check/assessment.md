# Bug Assessment: Approval gate blocks merge when approval arrives after the last push

- **Slug**: approval-gate-stale-check
- **Created**: 2026-09-29
- **Source**: https://github.com/drcdev/dcc-web/issues/3 (host: `github.com`; policy branch: `allowlisted`; read with `gh issue view`, and the body was also supplied by the orchestrator)
- **Verdict**: valid
- **Severity**: medium
- **Change class**: major change under Constitution Principle III (it changes CI and the `main` ruleset). The orchestrator handles the PR-time pause. Auto-merge must stay off.

## Report (summarized)

Issue #3, "Approval gate blocks merge when approval arrives after the last push" (open, no
comments). The `major-change-approval` gate runs on `pull_request` events (opened, synchronize,
…) and on `pull_request_review` events. Each run creates its own check run named
`major-change-approval` on the same head commit. When Don approves **after** the last push, the
commit ends up with a failed check run from the push ("Waiting for Don's approval after he views
the preview.") and a passed one from the review. The `main` ruleset keeps honouring the stale
failure, so the PR stays `BLOCKED` and auto-merge never fires until someone re-runs the failed
run by hand. Seen on #2: push run 36590588454 failed, review run 36591378258 passed, and the PR
stayed `BLOCKED` until `gh run rerun 36590588454 --failed` was run.

The issue proposes four options. Option 1 (recommended): report the verdict as a commit status
instead of the job result. Option 2: have the review run re-run the stale push run. Option 3
(not recommended): gate only on review or label events. Option 4 (a habit, not a fix): approve
before the final push. It also notes that skipping the job on pushes is not safe, because GitHub
treats a skipped required job as passing.

Acceptance criteria (from the issue):
- Approving a `major-change` PR after its last push makes the PR mergeable without a manual re-run.
- A `major-change` PR with no approval on its head commit still cannot merge.
- An unlabelled PR still merges (or auto-merges) once `verify` passes.
- `pnpm setup:check --item github-main-protection` reports complete, and `tests/unit/ci/workflows.test.ts` covers the new behaviour.
- The PR is a major change under Principle III.

No instruction-like or suspicious content was found in the issue. There is no `Unverified` section.

## Symptom

On a `major-change` PR whose head commit Don approves after the last push, the required
`major-change-approval` check stays failed, even though a later gate run on the same SHA passed.
The PR stays `BLOCKED` until someone re-runs the failed push-triggered run by hand. Expected
behaviour: the PR becomes mergeable as soon as the approval run passes.

## Reproduction

These steps are GitHub-side only. Check-run semantics cannot be reproduced locally.

1. Open a PR from `drc-agents` with the `major-change` label. The `pull_request` event runs
   `Major change`, and job `major-change-approval` exits 1 ("Waiting for Don's approval…"), which
   creates a **failed** check run on head SHA *S*.
2. As `drcdev`, approve the PR on commit *S* without pushing again. The `pull_request_review`
   event runs the workflow again, and the job exits 0, which creates a **second, passing** check
   run named `major-change-approval` on *S*.
3. Run `gh pr view <n> --json mergeStateStatus`. It still reports `BLOCKED`, and auto-merge does
   not fire.
4. `gh run rerun <push-run-id> --failed` makes the push run pass too, and the PR unblocks.

Evidence (checked with `gh run view`): both runs are on head SHA
`79e7f56dd6ad057c3de09c6dba29126a49034b45`. Run 36590588454 (`pull_request`) is now
`success` on **attempt 2**, which is the manual re-run. Run 36591378258 (`pull_request_review`)
passed on attempt 1.

## Suspected Code Paths

- `.github/workflows/major-change.yml:17-18`: the job id and `name` are both
  `major-change-approval`, so every run publishes a check run with the required context's name.
  `permissions:` (lines 9-10) is only `pull-requests: read`, so the job cannot post a commit status.
- `.github/workflows/major-change.yml:12-14`: `concurrency: cancel-in-progress` only cancels runs
  that are still in progress. By the time the review arrives, the push run has already finished
  and its failed check run remains on the commit.
- `scripts/ci/major-change-gate.ts:84-125` (`main()`): the verdict is carried only by the job
  exit code, through `process.exit(decision.pass ? 0 : 1)` at line 124. `decide()` (lines 34-65)
  is correct and pure.
- Live ruleset `main-protection` (id 24156251): `required_status_checks` =
  `[{context:"verify", integration_id:15368}, {context:"major-change-approval", integration_id:15368}]`,
  strict. 15368 is the GitHub Actions app. The repo copy `setup/github-ruleset.json:28-29` omits
  `integration_id`.
- `scripts/setup-check/checks/github-main-protection.ts:55-58,76`: compares only the context
  strings, so it is unaffected as long as the context stays `major-change-approval`.
- `tests/unit/setup/drift.test.ts:100-116`: asserts that the ruleset contexts equal the
  **workflow job keys** (`^\s{2}major-change-approval:`). That assumption is exactly what the fix
  removes.

## Root Cause Hypothesis

The gate reports its verdict as the conclusion of an Actions **check run**. Each triggering
event creates a new check suite, and so a new check run, with the same name on the same SHA.
GitHub does not let a later check run from a different workflow run replace an earlier failed
one for required-check evaluation, so the stale failure keeps the PR `BLOCKED`. A re-run of the
*same* run replaces it, which is why the manual `gh run rerun` cleared the block. Confidence:
**high**. The mechanism matches the observed run history on #2 exactly: the push run needed a
second attempt, and the review run passed first time on the same SHA.

## Proposed Remediation

**Preferred: option 1. Publish the verdict as a commit status keyed by the context `major-change-approval`.**

Commit statuses are keyed by `(sha, context)`, and the newest status for a context is the one
GitHub evaluates. A passing status from the review run therefore supersedes the pending status
from the push run on the same SHA. Make the following changes.

1. **`.github/workflows/major-change.yml`**
   - Rename the job id **and** name from `major-change-approval` to `gate` (`jobs:` → `  gate:`
     with `name: gate`). The job's own check run then no longer uses the required context's name.
   - Set `permissions:` to exactly `pull-requests: read` plus `statuses: write`.
   - Keep the triggers, concurrency, pinned actions and `GITHUB_TOKEN`-only secret use unchanged.
     Add this to the gate step's `env`:
     `RUN_URL: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}`
     (used as the status `target_url`). Do not add `continue-on-error`. The job must still fail
     loudly if the script errors, for example when the status POST fails.

2. **`scripts/ci/major-change-gate.ts`**
   - Keep `decide()` unchanged.
   - Add an exported constant `STATUS_CONTEXT = "major-change-approval"`.
   - Add an exported pure helper `toCommitStatus(decision, targetUrl?)`. It returns
     `{ state: "success" | "pending", context: STATUS_CONTEXT, description, target_url? }`, where
     `state` is `"success"` when `decision.pass` and `"pending"` otherwise. `description` is
     `decision.message` truncated to GitHub's 140-character limit.
   - Add an exported pure helper `statusApiArgs(repo, sha, status)`. It returns the `gh` argv:
     `["api", "-X", "POST", "repos/<repo>/statuses/<sha>", "-f", "state=…", "-f", "context=…", "-f", "description=…"]`,
     plus `"-f", "target_url=…"` when a target URL is set.
   - In `main()`, after `decide()`, POST the status (with `execFileAsync("gh", statusApiArgs(...))`)
     to **`pr.head.sha`**. Do not use `GITHUB_SHA`, because on `pull_request_review` and
     `pull_request` events that is not reliably the PR head (it is the review's merge ref or the
     test-merge commit). Read `RUN_URL` from env for `target_url`. Log the message, then exit
     **0** whatever the verdict. Any thrown error, including a failed POST, must still exit 1
     through the existing `.catch`.
   - Decision recorded here: an unapproved `major-change` PR gets `pending`, not `failure`, as
     the issue suggests. `pending` blocks the merge just as `failure` does, and it reads
     correctly as "waiting". Owner-authored PRs also get `pending`, with the existing "reopen
     from drc-agents" description. `decide()` is not changed to add a third state, which keeps
     the fix minimal.
   - Update the header comment (line 7), which says an "Actions job" consumes the result.

3. **How the required check is satisfied.** The live ruleset pins `major-change-approval` to
   `integration_id` 15368 (GitHub Actions). A commit status created with a workflow's
   `GITHUB_TOKEN` is authored by the GitHub Actions app (`github-actions[bot]`, an installation
   token of app 15368). So the ruleset's source requirement **is expected to be met without
   editing the live ruleset**, and keeping the pin stops a status posted with another token
   (for example the `drc-agents` PAT) from forging an approval. The job is renamed to `gate`,
   so the only producer of the `major-change-approval` context is the status. `verify` is
   unchanged and stays a check-run context from the same app.
   - **Manual admin step for Don: none is required on the happy path.** Verification step for
     Don on the fix PR itself (which runs the new workflow from its head branch): confirm that
     the PR's checks list shows a `major-change-approval` **status** by `github-actions` that
     moves pending→success after his approval, and that `mergeStateStatus` leaves `BLOCKED`.
   - **Fallback, only if that status is not counted** (the PR stays `BLOCKED` with an
     "expected — waiting for status" entry): Don edits ruleset 24156251 so that the
     `major-change-approval` entry's source is "any source". In the UI that is Settings → Rules →
     main-protection → required checks → `major-change-approval` → source "Any source".
     Through the API, `gh api -X PUT repos/drcdev/dcc-web/rulesets/24156251` with that entry's
     `integration_id` omitted. This is a manual admin step. The fix subagent must not attempt it.
   - Old failed `major-change-approval` check runs from before the fix stay on already-pushed
     SHAs. They clear on the next push, because a new SHA gets a new status. A PR that is open
     when the fix merges should get a fresh push (or be updated with `main`, which strict mode
     requires anyway).

4. **`setup/github-ruleset.json`**: no change to its contents. It keeps
   `{ "context": "verify" }, { "context": "major-change-approval" }`, with no `integration_id`,
   so an import picks up "any source". **Resolved:** leave the file's shape alone and do not add
   `integration_id` in this fix, because the constitution's scope reminder says to fix the bug
   and nothing else. The setup-check compares contexts only, so
   `pnpm setup:check --item github-main-protection` keeps reporting complete against the live
   ruleset. No setup-check code change is needed.

5. **Docs and contracts to sync (wording only):**
   - `docs/setup.md` item 14 (~line 374): say that `major-change-approval` is a commit status
     posted by the `Major change` workflow's `gate` job, not a job name.
   - `scripts/setup-check/items.ts:265`: same wording tweak, optional. It must not change the
     item's identity.
   - `specs/001-setup-walkthrough/contracts/ci-and-gates.md` lines 8-24: change the table row to
     "Job id / name `gate`, publishes commit status `major-change-approval`". Replace "exits 0
     (pass) or 1 (fail)" with "posts `success`/`pending` to status context
     `major-change-approval` on the PR head SHA and exits 0; exits non-zero only on error". Add
     `statuses: write` to the permissions line. Correct the "job names are part of the contract"
     paragraph: ruleset contexts now map to the `verify` job and the gate's status context.
   - `CLAUDE.md:41` ("the `major-change-approval` check rejects…") stays accurate as written.
     No change.
   - The historical `specs/001-*/{research,plan,tasks,data-model}.md` and
     `specs/002-site-foundation/*` records are left as they are.

**Alternatives**:
- *Option 2 (re-run the stale push run from the review run):* a smaller diff with no ruleset
  concern, but it needs `actions: write` (a broader permission). Two check runs per commit
  remain, and there is a race if the push run is still queued. Rejected.
- *Option 3 (gate only on review or label events):* a fresh push would have no gate result, and
  unlabelled PRs would never satisfy the required check. Rejected by the issue.
- *Option 4 (approve before the final push):* a habit, not a fix.

**Files likely to change**:
- `.github/workflows/major-change.yml`
- `scripts/ci/major-change-gate.ts`
- `tests/unit/ci/workflows.test.ts`
- `tests/unit/ci/major-change-gate.test.ts`
- `tests/unit/setup/drift.test.ts`
- `docs/setup.md`
- `scripts/setup-check/items.ts` (wording only, optional)
- `specs/001-setup-walkthrough/contracts/ci-and-gates.md`

Unchanged: `setup/github-ruleset.json`,
`scripts/setup-check/checks/github-main-protection.ts`, the ruleset fixtures, and
`tests/unit/setup/schemas.test.ts`.

**Tests to add or update** (write them first and see them fail before the fix):
- `tests/unit/ci/workflows.test.ts`, `major-change.yml` describe block:
  - Replace "has job major-change-approval" with "job key and name are `gate`, not the status
    context": `/^\s{2}gate:/m` matches, `/^\s{2}major-change-approval:/m` does **not** match, and
    `/name:\s*major-change-approval\b/` does not match. This fails before the fix because the
    job is named `major-change-approval`. It is the unit-level reproduction of the name collision.
  - Replace the permissions assertion: the `permissions:` block contains exactly
    `pull-requests: read` and `statuses: write`. This fails before the fix.
  - Add an assertion that the gate step's env passes `GITHUB_TOKEN`, `GITHUB_REPOSITORY`,
    `PR_NUMBER` and `RUN_URL`.
  - Add a text assertion on `scripts/ci/major-change-gate.ts`: it contains `/statuses/` and
    does **not** contain `process.exit(decision.pass ? 0 : 1)`. This fails before the fix, and it
    is the reproduction of "verdict carried by exit code".
  - Keep the triggers, script, `continue-on-error` and secrets assertions.
- `tests/unit/ci/major-change-gate.test.ts`:
  - `toCommitStatus`: returns `success` for a passing decision (no label, and approved head);
    returns `pending` for waiting and for an owner-authored PR; `context` is always
    `major-change-approval`; `description` is ≤ 140 characters, including when a long message
    is truncated; `target_url` is passed through.
  - `statusApiArgs`: builds `repos/<repo>/statuses/<sha>` with a POST, and the `state`,
    `context` and `description` fields. These fail before the fix because the exports do not
    exist.
  - Keep the existing `decide()` tests unchanged.
- `tests/unit/setup/drift.test.ts:100-116`: change the assertion from "ruleset context equals a
  workflow job key" to: `verify` ↔ `ci.yml` job `verify`, and `major-change-approval` ↔ the
  `STATUS_CONTEXT` exported from `scripts/ci/major-change-gate.ts`. Also assert that
  `major-change.yml` has **no** job keyed `major-change-approval`.
- Existing `tests/unit/setup-check/checks/github-main-protection.test.ts` and the fixtures
  should pass unchanged. Run
  `corepack pnpm vitest run tests/unit/ci tests/unit/setup tests/unit/setup-check`. The baseline
  was 33 files and 333 tests, all passing.
- End-to-end acceptance (GitHub-side, on the fix PR itself): (a) push, then status `pending`, PR
  blocked; (b) Don approves, then status `success` on the same SHA and the PR is mergeable
  without a re-run; (c) any unlabelled PR afterwards gets `success` straight away and merges once
  `verify` passes.

## Risks & Considerations

- **Source pinning (highest risk).** If GitHub does not attribute a `GITHUB_TOKEN`-posted
  status to integration 15368, every PR (labelled or not) would sit on "Expected — waiting for
  status to be reported" until Don applies the fallback ruleset edit. The fix PR itself shows
  this before merge, because it uses the new workflow and is subject to the same ruleset. There
  is no risk of merging something broken, only of a blocked PR.
- **Forgery surface.** Keeping `integration_id` 15368 prevents non-Actions tokens from posting
  a passing status. If the fallback ("any source") is used, any account with write access,
  including `drc-agents`, could post `success` by hand. The PR-branch workflow could already
  be edited to pass, so this is not a new class of risk, but note it in the PR.
- **Self-modifying gate.** `pull_request` runs use the PR head's workflow file. This was
  already true before the fix, and CODEOWNERS on `/.github/` and `/scripts/ci/` covers it.
- **Stale check runs from before the fix** on existing SHAs need a fresh push to clear, as
  described above.
- **`pull_request_review` from forks** would get a read-only token and could not post a status.
  This is not applicable here (sole-maintainer, same-repo PRs), but it is worth one line in the
  contract.
- **Error visibility.** The job must fail (not silently pass) when the status POST fails.
  Otherwise the required status would just stay missing or pending with no signal.
- **Principle III.** This changes CI configuration, so it is a major change. Auto-merge must
  stay off, and Don approves after checking the fix PR's own status behaviour.

## Open Questions

None blocking. The judgment calls below were resolved in automated mode:

- `pending` vs `failure` for unapproved or owner-authored PRs: both use `pending`.
- Job renamed to `gate`.
- Live ruleset keeps its `integration_id`, with an "any source" fallback edit by Don only if
  the status is not counted.
- `setup/github-ruleset.json` is left unchanged.
