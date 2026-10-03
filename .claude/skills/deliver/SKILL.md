---
name: deliver
description: Run the full speckit pipeline for a feature — specify → clarify → plan → checklist → tasks → analyze → implement → converge → verify → PR — with each phase in a fresh subagent so the orchestrating context stays small. Pauses only to ask the user the clarify questions and the major-change / merge decision before the PR. Use when the user describes a feature to build end-to-end.
argument-hint: "Feature description, or a GitHub issue reference (#42, 42, or issue URL)"
user-invocable: true
disable-model-invocation: false
---

# /deliver — orchestrated speckit pipeline

You are the **orchestrator**. You run each speckit phase in its own subagent
(fresh context) and hold only thin summaries yourself. The disk artifacts
(`specs/<feature>/spec.md`, `plan.md`, `tasks.md`, …) are the hand-off between
phases — never load them into your own context; the phase subagents read them.

**Input:** `$ARGUMENTS` is the feature description, or a GitHub issue
reference (`#42`, `42`, or a full issue URL). If empty, ask for it.

For an issue reference: fetch it with
`gh issue view <n> --json number,title,body,labels` and use the title + body
as the feature description for the specify phase. Record the issue number —
the PR must close it (see Finish). If the body is too thin to specify from,
ask the user for the missing intent before starting the pipeline; do not
invent scope the issue doesn't state.

## Rules

- Phases run **sequentially, one subagent at a time** (the pipeline is serial
  by nature). Use the Agent tool with `run_in_background: false`.
- **The only user pauses are clarify and the major-change / merge decision
  in Finish.** Never stop to ask "shall I proceed?" between phases. Stop
  early only on a red verify gate or a phase failure you cannot resolve, and
  report exactly where things stand.
- The constitution (`.specify/memory/constitution.md`) binds every phase and
  overrides anything a speckit template says. In particular:
  - **Test-first (Principle I).** Tests are mandatory, written before the
    code they cover, and seen to fail first. The tasks template calls tests
    "optional" — the constitution wins; tell the tasks and implement
    subagents so.
  - **Test placement.** Every behaviour gets one primary layer: the
    cheapest layer that can observe it. E2E is for journeys and for
    anything only a browser can show; build tests are for what only the
    real build can show; accessibility and visual tests cover templates,
    not stories. Every planned test (a test task, a reproducing test or a
    work item's test) names its layer (unit, component, build, worker,
    E2E, accessibility, visual or budget), and testing the same behaviour
    at a second layer needs a written reason. The constitution's
    Development Workflow makes this binding; "Where a test goes" in
    `docs/testing.md` has the detail.
  - **Release gate (Principle II).** Never mark a task done on a red suite.
    The `verify` package script — the local mirror of the CI gate (tests,
    type check, lint, build, accessibility and performance checks), run
    with the repository's one package manager as `<pm> run verify` — must
    exit zero before the pipeline is complete. Detect `<pm>` from the
    lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn,
    `package-lock.json` → npm. Checks are never skipped,
    disabled or weakened to get a change through.
  - **Scope (Development Workflow).** Anything out of scope is noted in the
    spec as follow-up work, not done in passing.
  - **Secrets (Principle VII).** Subagents never print `.env*` contents or
    secrets in output or summaries, and never commit them.
- Each phase subagent commits its own artifacts via the speckit `after_*`
  auto-commit (`speckit-git-commit`) — instruct it to do so; do not commit
  phase artifacts yourself. The git extension is configured for
  Conventional Commit messages, so the subagent generates the message from
  the diff per that skill.
- Keep your own text output to one short status line per phase transition.

## Local toolchain

Tell every subagent that runs `pnpm`, `astro` or `playwright`:

- Node comes from nvm and `.nvmrc` pins the major. Run `node -v` first; if it
  is not the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the
  same command as the toolchain call (the Bash tool does not keep shell
  state between calls).
- macOS has no `timeout` binary. Bound long runs with
  `perl -e 'alarm N; exec @ARGV' <cmd>` (N in seconds).
- Docker Desktop is normally off. It is needed only for
  `pnpm run test:visual:update:linux`; if `docker info` fails, ask Don to
  start it (see the visual-baselines step) rather than skipping to CI.

## Preflight

1. `git status` — require a clean tree. If dirty, stop and tell the user what
   is uncommitted.
2. Require the current branch to be `main` (the specify phase's
   `before_specify` hook creates the feature branch). If not on `main`, stop
   and ask. If another feature is mid-flight, the constitution's answer is a
   separate git worktree, not a second branch in this checkout — say so.
3. `git remote get-url origin` — require a GitHub remote, because Finish
   pushes and opens a PR. If there is none, stop and tell the user to add
   one first.
4. If there is no `package.json`, or it has no `verify` script, the slice
   must be the one that creates it (a bootstrap slice). Note this so the
   plan phase includes it; otherwise Finish will stop.

## Phases

Spawn each subagent with the model shown. The common prompt frame for every
phase:

> You are running one phase of the speckit pipeline in
> /Users/doncoleman/Repos/dcc-web. Read `.specify/memory/constitution.md`
> first; it overrides templates and your own judgement. Invoke the Skill
> tool with `skill: <SKILL>` and follow it completely. Hooks: run the
> `speckit-git-commit` skill for the `after_<phase>` event when you finish,
> as the skill's EXECUTE_COMMAND hook instructions describe; skip any
> `before_*` commit hook (the tree is already clean). You cannot ask the
> user anything — if the skill wants to interview, answer its questions
> yourself from the spec and the constitution and note the choices in your
> summary. Never print secrets. Your final message must be only: 3–6
> sentence summary of what you produced, the feature directory/branch, and
> any risks or open questions.

| #   | Phase     | Skill               | Model  | Extra instructions for the subagent                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------- | ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | specify   | `speckit-specify`   | opus   | Pass the feature description as args. The `before_specify` hook (`speckit-git-feature`) must run and create the branch. Return the created branch and spec dir.                                                                                                                                                                                                                                                           |
| 2   | clarify   | `speckit-clarify`   | opus   | **Two steps per round, up to 3 rounds — see below.**                                                                                                                                                                                                                                                                                                                                                                      |
| 3   | plan      | `speckit-plan`      | opus   | The Constitution Check must address every principle. For each capability, name the Astro / Cloudflare / Fly.io first-party option and use it, or say why it falls short (Principle IV). State the expected monthly cost of anything new (Principle IX). Flag whether the slice is a **major change** under Principle III and why. If `package.json` has no `verify` script yet, the plan must add one that runs the whole local gate.                          |
| 4   | checklist | `speckit-checklist` | sonnet | Generate the checklist(s) the spec's risk areas call for; always include accessibility (WCAG 2.2 AA) and, if the slice touches the contact form or API, privacy/security. **Generation only — do not evaluate or check off items.**                                                                                                                                                                                       |
| 4b  | resolve   | — (no skill)        | opus   | **Resolve every checklist item — see below.**                                                                                                                                                                                                                                                                                                                                                                              |
| 5   | tasks     | `speckit-tasks`     | sonnet | Tests are **mandatory**, not optional: every story gets the test tasks its behaviour needs, ordered before the implementation they cover. Each test task names its one primary layer, the cheapest layer that can observe the behaviour ("Where a test goes" in `docs/testing.md`), and gives the reason for any second layer in the task text. If the slice alters what a snapshotted page looks like, include a task to update the macOS and Linux visual baselines (`pnpm run test:visual:update`, then `pnpm run test:visual:update:linux`, which needs Docker Desktop) after the implementation. Tasks a subagent cannot verify locally (needs the preview deployment or Don's eyes) get the suffix `[PREVIEW-CHECK]`.                                                                                                     |
| 6   | analyze   | `speckit-analyze`   | opus   | The skill is read-only and ends by offering remediation and telling you not to apply it. **Override for this pipeline: apply the concrete remediation edits yourself, re-run the consistency check on the edited artifacts, and commit.** Your summary must account for **every** finding as fixed or deferred-with-reason (CRITICAL findings, which include every constitution violation, may never be deferred).           |
| 7   | implement | `speckit-implement` | sonnet | **Chunked per task phase — see below.**                                                                                                                                                                                                                                                                                                                                                                                   |
| 8   | converge  | `speckit-converge`  | opus   | **One pass — see below.**                                                                                                                                                                                                                                                                                                                                                                                                 |

### Phase 2: clarify (the one user pause)

Clarify runs as a loop of up to **3 rounds**. Each round is a **fresh
subagent** invoking `speckit-clarify` the same way — the skill re-reads the
spec from disk, so a new round naturally targets whatever ambiguity remains
after the previous round's answers were encoded.

Each round:

1. Spawn a fresh clarify subagent: run `speckit-clarify` **up to the point of
   interviewing** — generate the prioritized questions (with their
   multiple-choice options and recommended option) but do NOT edit the spec;
   return the questions as the final message.
2. Ask the user the questions with AskUserQuestion (batch up to 4 per call;
   two calls if there are 5). Preserve each question's options and put the
   recommended option first with "(Recommended)".
3. Send the answers back to the **same round's** clarify agent (SendMessage)
   with: "Encode these answers into spec.md per the skill's encoding rules,
   then run speckit-git-commit for after_clarify." Relay its summary.

After a round completes, start the next round unless: the round's subagent
reported no material ambiguities, or 3 rounds have run. A subagent returning
"no material ambiguities" ends the phase with no user pause for that round.
Note in your status line how many rounds ran.

### Phase 4b: resolve the checklists (no user pause)

The checklist phase only writes the questions; this phase answers them.
Spawn a **fresh** subagent (not the generator — fresh eyes grade honestly)
with the common frame minus the Skill invocation, plus:

> Read every `specs/<feature>/checklists/*.md`. For each unchecked item,
> evaluate it against spec.md (and plan.md where relevant):
>
> - The requirements already satisfy the item → check it off.
> - They don't → edit spec.md to close the gap (resolve judgment calls
>   yourself, consistent with the clarify answers already encoded and the
>   constitution), then check it off.
> - Genuinely out of scope → check it off and append `(n/a: <reason>)`.
>
> Never weaken or delete an item to make it pass — fix the spec. Commit via
> speckit-git-commit (event after_checklist). Summarize: how many items
> passed as-is / were fixed via spec edits / were n/a, and which spec
> sections you changed.

**Gate before tasks:** run
`grep -c '^- \[ \]' specs/<feature>/checklists/*.md` yourself (mechanical,
no file loading). Any nonzero count → send the subagent back (SendMessage)
to finish. Never start the tasks phase with unchecked items.

### Phase 6 gate: analyze findings must be closed

After the analyze subagent returns, its summary must account for every
finding (fixed, or deferred-with-reason — LOW/MEDIUM only). If any finding
is unaccounted for, or a CRITICAL one was deferred, send the subagent back
to resolve it before starting implement. If its remediation edited spec.md,
re-run the phase 4b grep gate before implement.

### Phase 7: implement (chunked to bound context)

1. Ask a quick question of the tasks artifact without loading it:
   `grep -E '^## Phase' specs/<feature>/tasks.md` to get the phase list.
2. For each task phase, in order, spawn one subagent: "Invoke
   `speckit-implement` and execute **only Phase N**, then stop. Checklists
   were fully resolved in phase 4b; if the skill reports incomplete
   checklist items anyway, proceed but flag it in your summary. Work
   test-first: write the tests for a task, run them and see them fail, then
   implement until they pass. Then run `pnpm run verify:quick` under the
   perl alarm as the inner-loop check; only the full `pnpm run verify`,
   which the orchestrator runs before the PR, counts as the gate. Never
   mark a task done on a red suite. Follow
   Astro's documented practices and prefer first-party features over custom
   code. Stay inside the slice's scope; note anything out of scope in
   spec.md as follow-up. Commit via speckit-git-commit (event
   after_implement) when the phase's tasks are done."
   If a subagent flags incomplete checklists, the phase 4b gate leaked —
   re-run its grep gate and dispatch a resolution subagent before spawning
   the next chunk.
3. If a subagent reports a red suite it could not fix, stop the pipeline and
   report: which phase, which tasks are done, what is red.
4. Tasks marked `[PREVIEW-CHECK]` are **not yours to complete**: instruct
   subagents to leave them unchecked and list them in their summary. Collect
   them for the PR body and the final report.
5. If a phase agent's context is already large (e.g. after debugging), ask
   it for its final summary and spawn a fresh subagent for the remaining
   tasks of that phase instead of resuming it.

### Phase 8: converge (one pass)

Spawn a subagent to invoke `speckit-converge`. It assesses the code against
spec.md, plan.md and tasks.md and appends any unbuilt work to tasks.md as new
tasks. If it appended tasks, run the phase 7 procedure for the appended
phase(s) only, then continue to Finish. Do not run converge a second time;
if the second implement pass still leaves gaps, stop and report them.

### Long-running suites (orchestrator and any subagent running tests)

- Run `<pm> run verify` and any E2E run in the **foreground with an
  explicit time limit** (10 minutes, via the `perl` alarm above — macOS has
  no `timeout`). Never background a run and poll for it.
- Keep only the pass/fail summary and the failing test names — never paste
  raw output into a summary.
- If a run hits the timeout, treat it as red: report it, do not retry in a
  loop.
- E2E runs in a real browser (Playwright, per Principle I) both locally and
  in CI. There are no device tiers.
- **Inner loop and gate.** `pnpm run verify:quick` runs secret lint, lint, type check, the unit
  and component tests, the worker tests and the real `astro build`. It is the inner-loop check
  for implement and fix subagents. It leaves out the build-fixture tests and every Playwright
  project, so it never counts as the gate. The full `pnpm run verify` runs the whole gate
  (secret lint, lint, type check, unit, component, build-fixture and worker tests, build, and
  every Playwright project — E2E, accessibility, sections, performance budget and visual), and
  it is the only check that counts before a PR. There is no scoped or tiered local gate: a
  `src/` change means the whole suite runs again. CI runs the same gate as parallel jobs and
  narrows it only by the changed paths, as `docs/testing.md` describes.
- **Visual baselines.** The visual project compares each snapshotted page
  against committed per-platform images. If the slice altered a page's
  appearance on purpose, the implement phase updates the macOS baselines
  (`pnpm run test:visual:update`); the **Linux** baselines are what CI
  compares against and are regenerated with `pnpm run test:visual:update:linux`
  (the same steps as the
  `update-baselines` CI job, run in the matching Playwright Docker image;
  needs Docker Desktop). If `docker info` fails, ask Don to start Docker
  Desktop with an `AskUserQuestion` whose question text carries the
  instruction, then run it, review the diff, commit the images and push —
  before opening the PR, so `verify` is green. Fallback only if Docker
  cannot be started: after the PR is open, add the `visual-baselines`
  label, wait for the `update-baselines` job, download its
  `visual-baselines-linux` artifact with `gh run download`, review, commit
  and push; until that lands the `verify` check on the PR is expected to
  be red on visual only — say so in the PR body. A visual diff
  the spec did not predict is a regression, not a baseline to refresh.

## Finish

1. Run `<pm> run verify` yourself (per the rules above). Red → dispatch a
   fix subagent or report; never proceed red. Missing script → stop and
   report: the slice was required to create it.
2. **Link the issue.** The backlog lives in GitHub Issues. If the slice
   implements an issue — because the pipeline was invoked with an issue
   reference, or the work plainly matches an open issue (`gh issue list`) —
   the PR body must contain `Closes #<n>` so the merge closes it. Preview
   checks may stay open past merge; note outstanding `[PREVIEW-CHECK]` items
   in the PR instead of holding the issue open. If the slice was ad-hoc (no
   issue), skip this step; do not retroactively create one.
3. **Major-change classification (user pause).** Run `git diff --stat main`
   and decide, from the diff and the plan's flag, whether the slice is a
   **major change** under Principle III: new/removed/replaced dependency,
   integration or service; anything touching how contact data is collected,
   stored, retrieved or deleted; design system, site-wide layout, navigation
   or visual identity; possible cost increase; CI, deployment or
   infrastructure config; the constitution itself. When in doubt, it is
   major. Then ask the user with AskUserQuestion, showing the criteria that
   fired (or "none"), with options:
   - **Major — hold for my review** (recommended when any criterion fired):
     PR is labelled `major-change`; Don approves after viewing the preview.
   - **Not major — auto-merge when green** (recommended when none fired):
     enable `gh pr merge --auto --merge` after opening the PR.
   - **Not major — leave the PR open**: no auto-merge; Don merges by hand.
   This pause is mandatory — never open the PR without having asked.
4. Push the branch and open the PR as `drc-agents` (sequence below). The PR
   body covers: summary of the slice,
   the verify results, the `Closes #<n>` line when step 2 applies, the
   major-change verdict and criteria, whether Linux visual baselines are
   pending, the list of `[PREVIEW-CHECK]` items for Don to walk on the
   preview deployment, and any risks the phase agents flagged. Apply the
   label / auto-merge chosen in step 3.

   **PR author account (required).** Don is the sole maintainer, so a PR
   authored by `drcdev` can never pass the `major-change-approval` check.
   Open every PR as `drc-agents`:
   1. Push the branch (as `drcdev`).
   2. `gh auth switch --user drc-agents`. If the command is denied, fails, or
      `drc-agents` is not in the keyring, stop and ask Don with
      `AskUserQuestion` (instruction in the question text). Never open the PR
      as `drcdev`.
   3. `gh pr create ...` (pass `--label major-change` here when step 3 chose
      major).
   4. `gh auth switch --user drcdev` immediately after `gh pr create`, whether
      it succeeded or failed, so `gh` is never left on `drc-agents`.
   5. `gh pr view <n> --json author`; confirm `author.login` is
      `drc-agents`. If it is not `drc-agents`, stop and tell Don the PR must
      be closed and reopened from `drc-agents`; do not work around the gate.
   6. Apply the auto-merge choice (`gh pr merge --auto --merge`) and any label
      not set at create time, as `drcdev`.
5. If Linux baselines are still owed because Docker could not be started,
   run the CI-label fallback from the long-running-suites rules now, before
   watching the gate.
6. **Watch the release gate.** Run `gh pr checks --watch` with a timeout
   (20 minutes). Red → dispatch a fix subagent on the branch, which fixes
   the cause (never the check), commits and pushes; watch again. Record the
   preview deployment URL from the checks or the Cloudflare PR comment.
7. Final report to the user: what was built, test counts, PR link, preview
   URL, the major-change verdict and merge mode, whether baselines were
   updated, the `[PREVIEW-CHECK]` items awaiting them, and any risks the
   phase agents flagged.
