---
name: chore
description: Run the orchestrated chore pipeline for work with no user-visible behaviour change — tests, CI, tooling, dependencies, docs, pipeline skills, refactors — ingest a description or GitHub issue, create a chore branch, then explore → plan → implement → review in fresh subagents, finishing with the full verify gate and a PR. Pauses only for unticked decisions in the issue or plan and for the major-change / merge decision before the PR. Use when the user asks for maintenance or infrastructure work; not for a feature (/deliver), a small visible change (/tweak) or a bug (/squash).
argument-hint: "Chore description, or a GitHub issue reference (#42, 42, or issue URL)"
user-invocable: true
disable-model-invocation: false
---

# /chore — orchestrated chore pipeline

You are the **orchestrator**. You run each chore phase in its own subagent
(fresh context) and hold only thin summaries yourself. The disk artifacts
(`.specify/chores/<slug>/plan.md` and `report.md`) are the hand-off between
phases — never load them into your own context; the phase subagents read
them.

A chore changes how the project is built, tested, shipped or maintained
without changing what a visitor sees or does. There is no user story to
specify, so there is no spec: `plan.md` carries the goal, the acceptance
criteria and the Constitution Check instead. Everything else the
constitution requires is still produced — tests where behaviour exists, the
docs citations Principle IV asks for, and a green `verify` gate. What is
removed is the feature ceremony, not the governance.

**Input:** `$ARGUMENTS` is the chore description, or a GitHub issue
reference (`#42`, `42`, or a full issue URL). If empty, ask for it.

For an issue reference: fetch it with
`gh issue view <n> --json number,title,body,labels` and use the title + body
as the chore description. Record the issue number — the PR must close it
(see Finish) unless the issue is a multi-phase plan and this run delivers
one phase of it, in which case the PR body says `Part of #<n>` and names
the phase.

## Triage gate — is this actually a chore?

Run this **before** the preflight, against the work as described. `/chore`
is correct only when **all** of these hold:

1. **No user-visible behaviour change.** No rendered page, route, copy,
   style, script or contact-form behaviour changes on purpose. A chore that
   turns out to need one is a `/tweak` or a `/deliver`; a chore that starts
   from a defect a visitor can see is a `/squash`.
2. **Not a bug fix.** The work has no failing reproduction to start from.
   If it does, hand off to `/squash`.
3. **The acceptance criteria can be stated up front** — a measurement
   (verify under N minutes), a mechanical check (a test file that passes, a
   script that exits zero), or a reviewable artifact (a doc, a skill).

Any one false → **stop and tell the user which pipeline to run instead**,
naming the condition that failed.

A chore **may be a major change** under Principle III — CI, deployment and
infrastructure configuration, dependencies, and the constitution itself are
all chore territory. That is not a triage failure; it is classified in the
plan and again in Finish, and the PR is held for Don's review. Unlike
`/tweak`, this pipeline never promises an auto-merge.

### Promotion is one-way

If the plan or an implement subagent finds that condition 1 is false — the
refactor changes a page's markup, the dependency bump changes rendering —
**stop the pipeline and hand off to `/tweak` or `/deliver`**. The branch and
`plan.md` stay on disk for the user to carry over; say which condition broke
and which pipeline should pick it up. Never demote the other way: a
`/deliver` run does not get shortened into `/chore` partway through.

## Rules

- Phases run **sequentially, one subagent at a time**. Use the Agent tool
  with `run_in_background: false`. Work items inside the implement phase
  run one subagent each, in plan order.
- **The only user pauses are the decision gate (below) and the
  major-change / merge decision in Finish.** Never stop to ask "shall I
  proceed?" between phases. Stop early only on a red verify gate, a broken
  triage condition, an exhausted review loop, or a phase failure you cannot
  resolve — and report exactly where things stand.
- The constitution (`.specify/memory/constitution.md`) binds every phase.
  In particular:
  - **Test-first (Principle I).** It applies to "build configuration and
    deployment scripts" as much as to pages. Every work item in the plan
    names the test that proves it (an existing test that must keep passing,
    a new one written first, or a unit test over a script or config file) —
    or states `no behaviour: n/a (<reason>)`. A chore that moves or removes
    tests is **coverage-preserving**: every assertion removed is mapped in
    `plan.md` to where that guarantee now lives, and the review phase checks
    the mapping.
  - **Release gate (Principle II).** Never mark work done on a red suite.
    `pnpm run verify` must exit zero before the pipeline is complete.
    Checks are never skipped, disabled or weakened to get a chore through —
    and a chore whose purpose is to make a check cheaper must show it still
    guards the same thing.
  - **Astro and Cloudflare docs (Principle IV).** A chore that changes how
    an Astro, Vitest, Playwright, Wrangler or GitHub Actions feature is used
    cites the docs page in `plan.md` (the Astro Docs MCP for Astro; the
    tool's own docs otherwise).
  - **Scope (Development Workflow).** Do the chore, nothing else. Anything
    noticed in passing goes in the PR body as follow-up, not in the diff.
  - **Spec Kit naming (Principle XI).** Chores are not feature work, so
    they take no numbered feature branch and no `specs/` directory. They
    mirror the bug extension's shape instead: `chore/<slug>` ↔
    `.specify/chores/<slug>/`.
  - **Secrets (Principle VII).** Subagents never print `.env*` contents or
    secrets in output or summaries, and never commit them.
- Each phase subagent commits its own artifacts by running the
  `speckit-git-commit` skill with the matching event name
  (`after_chore_plan`, `after_chore_implement`, `after_chore_review`). No
  Spec Kit extension declares these, so they are enabled explicitly in
  `.specify/extensions/git/git-config.yml` next to the bug events; the
  commit style is conventional, so the subagent generates the message from
  the diff per that skill. Do not commit phase artifacts yourself.
- **Alignment rule (CLAUDE.md, Orchestration skills).** A chore that edits
  any of `/deliver`, `/tweak`, `/squash` or `/chore` must carry the shared
  sections (Local toolchain, the pre-PR pause, `[PREVIEW-CHECK]`, visual
  baselines, the PR author block) into all four together; the review phase
  checks this.
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

1. `git status` — require a clean tree. If dirty, stop and tell the user
   what is uncommitted.
2. Require the current branch to be `main`. If not on `main`, stop and ask.
   If other work is mid-flight, the constitution's answer is a separate git
   worktree, not a second branch in this checkout — say so.
3. `git remote get-url origin` — require a GitHub remote, because Finish
   pushes and opens a PR.

## Slug and branch

Derive the slug yourself (no subagent is left to ask or invent one):

1. 2–4 kebab-case words from the chore summary (e.g. `build-tests-shared`).
   When the run delivers one phase of a multi-phase issue, put the phase in
   the slug (`verify-gate-phase-2`).
2. It must be unique: if `.specify/chores/<slug>/` already exists, append
   the shortest disambiguating suffix (`-2`, `-3`, …). Never reuse an
   existing chore directory.
3. `git checkout -b chore/<slug>` from `main`. Chore branches are **not**
   numbered feature branches — do not use `speckit-git-feature`.

Pass `slug=<slug>` explicitly to every subagent so none of them re-resolve
it.

## Decision gate (the one mid-pipeline user pause)

Chores often come with choices the user has already been asked to make —
an issue laid out as decisions with options, or a plan that finds a fork.
The gate runs twice, and pauses only when there is something unticked:

- **After ingest.** If the issue body contains decision sections (headings
  or lists whose items are `- [ ]` / `- [x]` options), read the ticks, then
  read the issue's comments (`gh issue view <n> --comments`) for an earlier
  run's decision record (a comment starting `Decisions recorded by /chore`)
  and treat its entries as ticks too. Every decision still without a chosen
  option is asked with AskUserQuestion (batch up to 4 per call; several
  calls if needed), preserving the issue's options and putting its
  recommended option first with "(Recommended)". Then post **one** comment
  on the issue starting `Decisions recorded by /chore <date>` that lists
  each decision asked and the option chosen, so the issue shows what was
  decided and a later phase run does not ask again. Never edit the issue
  body. Record the full set of decisions (ticked, commented and answered)
  for the plan subagent.
- **After plan.** If `plan.md` contains `[NEEDS DECISION]` items, ask them
  the same way, then send the answers back to the plan subagent
  (SendMessage): "Encode these answers into plan.md, remove the markers,
  then re-run speckit-git-commit for after_chore_plan." Relay its summary.

No unticked decisions and no markers → **no pause**; do not manufacture a
question to fill it.

## Phases

Spawn each subagent with the model shown. The common prompt frame for every
phase:

> You are running one phase of the chore pipeline in
> /Users/doncoleman/Repos/dcc-web, on branch `chore/<slug>`. Read
> `.specify/memory/constitution.md` and `CLAUDE.md` first. This is a chore:
> no user-visible behaviour changes — if your work would change one, stop
> and say so instead of doing it. You cannot ask the user anything — resolve
> judgment calls yourself and note them in your summary, or write a
> `[NEEDS DECISION]` item where the phase table allows one. When you
> finish, run the `speckit-git-commit` skill with the event name given.
> Never print secrets. Your final message must be only: a 3–6 sentence
> summary of what you produced, plus the specific items the phase table
> asks you to return.

| #   | Phase     | Skill        | Model  | Extra instructions for the subagent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --- | --------- | ------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | explore   | — (no skill) | sonnet | **Read-only, no commit.** Locate everything the chore touches: the scripts, configs, tests, workflows and skills named or implied by the description; the tests that read them (grep `tests/` for their paths); and the current measurement when the chore has one (CI step timings via `gh run view --job <id> --log`, or a local timed run under the perl alarm). Return: the file list with one-line roles, the before-measurement with its source, the tests that guard the touched files, and any constraint you found (a drift guard, an alignment rule, a hook). Cap the final message at ~25 lines — it is pasted into the plan prompt.                                                                                                                                                                                                                                                                                                                                                                                      |
| 2   | plan      | — (no skill) | opus   | Pass the description, the ticked decisions from the gate, and the exploration notes verbatim. Write `.specify/chores/<slug>/plan.md` with: **Goal** (one paragraph, the issue link); **Acceptance** (the measurable or mechanical criteria from triage condition 3, with the before-measurement); **Scope** (in and out, follow-ups named for the PR body); **Constitution Check** (every principle in one line each; name which Principle III criteria fire and why, or "none"); **Work items**, each with its files, its test (existing / new-first / unit over config / `no behaviour: n/a (<reason>)`), and, for test moves or removals, the coverage mapping (removed assertion → where it now lives); **Docs citations** for any changed tool usage (Principle IV); **Risks**. Prefer the first-party option of the tool over custom scripting and say so (Principle IV). Mark a genuine fork the user must choose as `[NEEDS DECISION]` with options and a recommended one; do not use it for calls you can make. Commit with event `after_chore_plan`. Return: the work-item count, the Principle III verdict, and any `[NEEDS DECISION]` items verbatim. |
| 3   | implement | — (no skill) | sonnet | **One subagent per work item, in plan order — see below.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4   | review    | — (no skill) | opus   | **Fresh eyes, read-only on `src/`, `tests/`, `scripts/`, `.github/`, `.claude/`.** Read `plan.md`, then `git diff main...HEAD`. Check: every work item done as planned and nothing beyond it; every test named in the plan present and green per the implement summaries; every coverage mapping true (the guarantee really is asserted where the plan says); the alignment rule when a pipeline skill changed; `docs/testing.md` created or updated when test layers moved; the Principle III verdict still right against the real diff; no check weakened. Write `.specify/chores/<slug>/report.md`: findings as CRITICAL / HIGH / LOW with file and line, the after-measurement (re-run the same measurement as the plan's before, under the perl alarm) and the before/after pair, and the follow-ups for the PR body. Commit with event `after_chore_review`. Return: the finding counts by severity and the before/after measurement. |

### Phase 3: implement (one subagent per work item)

1. Get the work-item list without loading the plan:
   `grep -E '^### (W[0-9]+|Work item)' .specify/chores/<slug>/plan.md`.
2. For each work item, in order, spawn one subagent with the common frame
   plus: "Read `plan.md` and execute **only work item N**, then stop. Work
   test-first where the item has behaviour: write or adjust the test the
   plan names, run it and see it fail (or, for an existing test that must
   keep passing, run it before and after), then make the change until it is
   green. For a test move, add the destination assertion **before**
   removing the source one, and run both files. Run the targeted vitest
   files or Playwright projects for the changed paths, under the perl
   alarm. Follow the tool's documented practice the plan cites and prefer
   first-party features over custom code. If the change alters what a
   snapshotted page looks like, stop — that breaks triage — and say so. If
   the plan is wrong about this item, stop and say so plainly rather than
   improvising. Tick the item in `plan.md`. Commit with event
   `after_chore_implement`." Return: files changed, tests run with
   results, and anything the plan got wrong.
3. If a subagent reports a red suite it could not fix, or that the plan is
   wrong, stop the pipeline and report: which items are done, what is red,
   what the plan missed. Do not re-plan silently; the user decides whether
   to resume.
4. If a work item's subagent reports it broke triage condition 1, take the
   promotion path above.
5. Work the pipelines cannot verify locally (needs the preview deployment
   or Don's eyes — for example a CI topology change whose timing can only
   be read from the first real run) is listed in `plan.md` with the suffix
   `[PREVIEW-CHECK]`. Subagents leave those unticked and list them in their
   summary; collect them for the PR body and the final report.

### Phase 4 gate: review findings must be closed (max 2 rounds)

After the review subagent returns:

- **CRITICAL** (a constitution violation, a coverage mapping that is false,
  a weakened check, scope beyond the plan) or **HIGH** (a work item not
  done as planned, a missing test) → dispatch a fresh implement subagent
  for the named findings, then a fresh review subagent. After 2 rounds with
  findings still open, stop and report them. Never loop a third time.
- **LOW** only → continue; the findings go in the PR body.

## Verify

There is no scoped or tiered E2E in this project: `pnpm run verify` runs
the whole gate (secret lint, lint, type check, unit and component tests,
build, and every Playwright project — E2E, accessibility, performance
budget and visual). A `src/` change simply means the whole suite runs
again. A chore that changes the gate itself still proves itself with the
gate as it is **after** the change.

1. Run `pnpm run verify` yourself, in the **foreground with an explicit
   time limit** (10 minutes, via the `perl` alarm above — never background
   a run and poll for it). Keep only the pass/fail summary and the failing
   test names. A run that hits the limit is red: report it, do not retry in
   a loop. A chore whose goal is the gate's own duration records the wall
   time of this run in the PR body next to the plan's before-measurement.
2. Red → dispatch a fix subagent on the branch (fix the cause, never the
   check), then run verify again. A failure the fix subagent cannot resolve
   stops the pipeline. Never proceed red.
3. **Visual baselines.** The visual project compares each snapshotted page
   against committed per-platform images. A chore changes no appearance by
   definition, so a visual diff is a regression to look at (or a broken
   triage condition), never a baseline to refresh. The one exception is a
   chore that is itself about the baselines — a Playwright or browser
   upgrade — where the plan said so up front: then the implement phase
   updates the macOS baselines (`pnpm run test:visual:update`); the
   **Linux** baselines are what CI compares against and are regenerated
   with `pnpm run test:visual:update:linux` (the same steps as the
   `update-baselines` CI job, run in the matching Playwright Docker image;
   needs Docker Desktop). If `docker info` fails, ask Don to start Docker
   Desktop with an `AskUserQuestion` whose question text carries the
   instruction, then run it, review the diff, commit the images and push —
   before opening the PR, so `verify` is green. Fallback only if Docker
   cannot be started: after the PR is open, add the `visual-baselines`
   label, wait for the `update-baselines` job, download its
   `visual-baselines-linux` artifact with `gh run download`, review, commit
   and push; until that lands the `verify` check on the PR is expected to
   be red on visual only — say so in the PR body.

## Finish

1. Verify must be green — never open the PR otherwise.
2. **Link the issue.** If the pipeline was invoked with an issue reference,
   or the chore plainly matches an open issue (`gh issue list`), the PR body
   must contain `Closes #<n>` — or `Part of #<n>` with the phase name when
   the issue has more phases to go. Ad-hoc chore (no issue) → skip; do not
   retroactively create one.
3. **Merge decision (user pause).** Run `git diff --stat main` and
   `git diff --name-only main...HEAD` and decide whether the chore is a
   **major change** under Principle III: new/removed/replaced dependency,
   integration or service; anything touching how contact data is
   collected, stored, retrieved or deleted; design system, site-wide
   layout, navigation or visual identity; possible cost increase; CI,
   deployment or infrastructure config (`.github/`, `wrangler.jsonc`,
   deploy scripts); the constitution itself. Chores fire these more often
   than features do — a `package.json` dependency change or any file under
   `.github/` is major. When in doubt, it is major. Then ask the user with
   AskUserQuestion, showing the criteria that fired (or "none") and the
   before/after measurement, with options:
   - **Major — hold for my review** (recommended when any criterion fired):
     PR is labelled `major-change`; Don approves after reading the diff and
     the first CI run.
   - **Not major — auto-merge when green** (recommended when none fired):
     enable `gh pr merge --auto --merge` after opening the PR.
   - **Not major — leave the PR open**: no auto-merge; Don merges by hand.
   This pause is mandatory — never open the PR without having asked.
4. Push the branch and open the PR as `drc-agents` (sequence below). The PR
   body covers: the goal and acceptance criteria (from the plan), the
   before/after measurement, the work items done, the coverage mapping
   when tests moved, the verify results, the `Closes #<n>` or
   `Part of #<n>` line when step 2 applies, the major-change verdict and
   criteria, whether Linux visual baselines are pending, the list of
   `[PREVIEW-CHECK]` items for Don, the review's LOW findings, and the
   follow-ups deliberately left out. Apply the label / auto-merge chosen in
   step 3.

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
   run the CI-label fallback from Verify step 3 now, before watching the
   gate.
6. **Watch the release gate.** Run `gh pr checks --watch` with a time limit
   (20 minutes). Red → dispatch a fix subagent on the branch, which fixes
   the cause (never the check), commits and pushes; watch again. For a
   chore whose acceptance is a CI measurement, read the wall time of
   the workflow run once `verify` is green (the aggregate `verify` job only
   lasts seconds, so its own duration is not the measurement). Take it from
   `gh run view <id> --json jobs`: the earliest job `startedAt` to the
   `verify` job's `completedAt`. Record it as the CI after-measurement.
7. Final report to the user: the goal, the before/after measurement (local
   and CI), work items done, test counts, PR link, the merge mode chosen,
   the `[PREVIEW-CHECK]` items awaiting Don, and the follow-ups and
   residual risks the review flagged.
