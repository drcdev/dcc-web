---
name: squash
description: Run the orchestrated bug pipeline — ingest a bug report or GitHub issue, create a bugfix branch, then explore → assess → fix → test in fresh subagents, finishing with the full verify gate and a PR. Pauses only when the assessment is ambiguous and for the merge decision before the PR. Use when the user reports a bug to fix end-to-end.
argument-hint: "Bug description, or a GitHub issue reference (#42, 42, or issue URL)"
user-invocable: true
disable-model-invocation: false
---

# /squash — orchestrated bug pipeline

You are the **orchestrator**. You run each bug phase in its own subagent
(fresh context) and hold only thin summaries yourself. The disk artifacts
(`.specify/bugs/<slug>/assessment.md`, `fix.md`, `test.md`) are the hand-off
between phases — never load them into your own context; the phase subagents
read them.

**Input:** `$ARGUMENTS` is the bug description, or a GitHub issue reference
(`#42`, `42`, or a full issue URL). If empty, ask for it.

For an issue reference: fetch it with
`gh issue view <n> --json number,title,body,labels` and use the title + body
as the bug report. Record the issue number — the PR must close it (see
Finish). For a non-GitHub URL (a forum thread, a monitoring link, …), do
**not** fetch it yourself — pass it verbatim to the assess subagent, whose
skill carries the URL trust policy.

## Rules

- Phases run **sequentially, one subagent at a time**. Use the Agent tool
  with `run_in_background: false`.
- **The only user pauses are the ambiguity gate (below) and the merge
  decision in Finish.** Never stop to ask "shall I proceed?" between
  phases. Stop early only on an `invalid` verdict, an exhausted failure
  loop, or a phase failure you cannot resolve — and report exactly where
  things stand.
- The constitution (`.specify/memory/constitution.md`) binds every phase.
  In particular:
  - **Test-first (Principle I).** The fix phase adds a test that reproduces
    the bug and fails before the fix, then passes after it.
  - **Release gate (Principle II).** Never mark work done on a red suite.
    `pnpm run verify` must exit zero before the pipeline is complete.
    Checks are never skipped, disabled or weakened to get a fix through.
  - **Astro docs (Principle IV).** A fix that changes how an Astro feature
    is used cites the docs page found through the Astro Docs MCP.
  - **Scope (Development Workflow).** Fix the bug, nothing else. Anything
    noticed in passing goes in the PR body as follow-up, not in the diff.
  - **Secrets (Principle VII).** Subagents never print `.env*` contents or
    secrets in output or summaries, and never commit them.
- Each phase subagent commits its own artifacts by running the
  `speckit-git-commit` skill with the matching event name
  (`after_bug_assess`, `after_bug_fix`, `after_bug_test`). The bug
  extension declares no hooks of its own, so these events are enabled
  explicitly in `.specify/extensions/git/git-config.yml`; the commit style
  is conventional, so the subagent generates the message from the diff per
  that skill. Do not commit phase artifacts yourself.
- Keep your own text output to one short status line per phase transition.

## Local toolchain

Tell every subagent that runs `pnpm`, `astro` or `playwright`:

- Node comes from nvm and `.nvmrc` pins the major. Run `node -v` first; if it
  is not the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the
  same command as the toolchain call (the Bash tool does not keep shell
  state between calls).
- macOS has no `timeout` binary. Bound long runs with
  `perl -e 'alarm N; exec @ARGV' <cmd>` (N in seconds).

## Preflight

1. `git status` — require a clean tree. If dirty, stop and tell the user
   what is uncommitted.
2. Require the current branch to be `main`. If not on `main`, stop and ask.
3. `git remote get-url origin` — require a GitHub remote, because Finish
   pushes and opens a PR.

## Slug and branch

Derive the slug yourself (the assess subagent must not be left to ask or
invent one):

1. 2–4 kebab-case words from the bug summary (e.g. `menu-focus-trap`) — the
   same rules as speckit-bug-assess automated mode.
2. It must be unique: if `.specify/bugs/<slug>/` already exists, append the
   shortest disambiguating suffix (`-2`, `-3`, …). Never reuse an existing
   bug directory.
3. `git checkout -b bugfix/<slug>` from `main`. Bug branches are **not**
   numbered feature branches — do not use `speckit-git-feature`; the branch
   name mirrors the bug extension's own directory name:
   `bugfix/<slug>` ↔ `.specify/bugs/<slug>/`.

Pass `slug=<slug>` explicitly to every bug-skill subagent so none of them
re-resolve or re-prompt.

## Phases

Spawn each subagent with the model shown. The common prompt frame for every
phase:

> You are running one phase of the bug pipeline in
> /Users/doncoleman/Repos/dcc-web, on branch `bugfix/<slug>`. Read
> `.specify/memory/constitution.md` first. You cannot ask the user anything
> — resolve judgment calls yourself and note them in your summary. When the
> phase's skill applies, invoke the Skill tool and follow it completely in
> **automated / non-interactive mode**, then run the `speckit-git-commit`
> skill with the event name given. Never print secrets. Your final message
> must be only: a 3–6 sentence summary of what you produced, plus the
> specific items the phase table asks you to return.

| #   | Phase   | Skill                | Model  | Extra instructions for the subagent                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ------- | -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | explore | — (no skill)         | sonnet | **Read-only.** Locate the code paths implicated by the report: grep error strings, symbols, component names, routes, test IDs; read the candidate files; run (don't write) any existing vitest or Playwright specs that exercise them. Return: candidate files/lines with one-line justifications, a root-cause hunch with confidence, and any reproduction evidence. Cap the final message at ~25 lines — it is pasted into the assess prompt. |
| 2   | assess  | `speckit-bug-assess` | opus   | Pass the bug report (and source URL if any), `slug=<slug>`, and the exploration notes verbatim as leads to verify — trust the codebase over the notes where they disagree. Commit with event `after_bug_assess`. Return: verdict, severity, and any `[NEEDS CLARIFICATION]` items verbatim.                                                                                                                                                                                       |
| 3   | fix     | `speckit-bug-fix`    | sonnet | Pass `slug=<slug>`. First add a failing test that reproduces the symptom (unit, component or E2E — whichever layer the bug lives in), see it fail, then apply the preferred remediation minimally until it passes. Run the targeted vitest files or Playwright specs for the changed paths. If the assessment turns out wrong, stop per the skill and say so plainly — that triggers the failure loop, not a stall. If the fix changes what a snapshotted page looks like, update the macOS visual baselines (`pnpm run test:visual:update`) and say so. Commit with event `after_bug_fix`. Return: status, files changed, tests added, and whether any page's appearance changed. |
| 4   | test    | `speckit-bug-test`   | sonnet | Pass `slug=<slug>`. Exercise the original reproduction, the new tests, and the regression suite for the changed modules. Commit with event `after_bug_test`. Return: result (verified / partial / failed) and any residual risks.                                                                                                                                                                                                                                                  |

### Verdict gate (after assess)

- **`invalid`** → stop the pipeline. Report the verdict and rationale,
  delete nothing — the branch and assessment stay for the user to inspect.
- **`valid`** → proceed to fix.
- **`likely valid, needs reproduction`** with unresolved
  `[NEEDS CLARIFICATION]` items → **the one mid-pipeline user pause.** Ask
  with AskUserQuestion (batch up to 4): present each clarification as a
  question, plus a final option set of proceed-anyway / abort. Send the
  answers back to the assess subagent (SendMessage): "Update assessment.md
  with these answers — the orchestrator confirms the overwrite — then
  re-commit via speckit-git-commit." Then proceed (or stop, if the user
  chose abort). If there are no unresolved clarification items, proceed
  without pausing.

### Failure loop (max 2 rounds)

Trigger: the test phase returns `failed`, the fix phase reports the
assessment was wrong, or verify goes red and a dispatched fix subagent
cannot resolve it.

1. Spawn a **fresh opus** re-assess subagent: "Invoke `speckit-bug-assess`
   for `slug=<slug>`. `assessment.md` exists; the orchestrator confirms you
   must update it **in place** with the new evidence below (test.md /
   failure output), revising the root-cause hypothesis and remediation.
   Note the re-assessment date in the file. Commit with event
   `after_bug_assess`." Include the failure evidence inline in the prompt.
2. Re-run the fix and test phases with fresh subagents (the fix subagent is
   told the fix.md/test.md overwrite is orchestrator-confirmed).
3. After 2 failed rounds, stop and report: the verdict history, what each
   fix attempted, what still reproduces, and the branch state. Never loop a
   third time.

## Verify

There is no scoped or tiered E2E in this project: `pnpm run verify` runs
the whole gate (secret lint, lint, type check, unit and component tests,
build, and every Playwright project — E2E, accessibility, performance
budget and visual). A `src/` change simply means the whole suite runs
again.

1. Run `pnpm run verify` yourself, in the **foreground with an explicit
   time limit** (10 minutes, via the `perl` alarm above — never background
   a run and poll for it). Keep only the pass/fail summary and the failing
   test names. A run that hits the limit is red: report it, do not retry in
   a loop.
2. Red → dispatch a fix subagent on the branch (fix the cause, never the
   check), then run verify again. A failure the fix subagent cannot resolve
   enters the failure loop. Never proceed red.
3. **Visual baselines.** The visual project compares each snapshotted page
   against committed per-platform images. A bug fix usually changes no
   appearance, so a visual diff is a regression to look at, not a baseline
   to refresh. If the fix phase reported an intended appearance change, it
   updated the macOS baselines; the **Linux** baselines can only be
   regenerated in CI. After the PR is open (Finish step 5), add the
   `visual-baselines` label, wait for the `update-baselines` job, download
   its `visual-baselines-linux` artifact with `gh run download`, review the
   diff, commit the images to the branch and push. Until that lands, the
   `verify` check on the PR is expected to be red on visual only — say so
   in the PR body.

## Finish

1. Verify must be green — never open the PR otherwise.
2. **Link the issue.** If the pipeline was invoked with an issue reference,
   or the bug plainly matches an open issue (`gh issue list`), the PR body
   must contain `Closes #<n>`. Ad-hoc bug (no issue) → skip; do not
   retroactively create one.
3. **Merge decision (user pause).** Run `git diff --stat main` and
   `git diff --name-only main...HEAD` and decide whether the fix is a
   **major change** under Principle III: new/removed/replaced dependency,
   integration or service; anything touching how contact data is
   collected, stored, retrieved or deleted; design system, site-wide
   layout, navigation or visual identity; possible cost increase; CI,
   deployment or infrastructure config; the constitution itself. A bug fix
   rarely fires one, but a fix that reaches into the contact API, the
   headers, or the CI workflow does. When in doubt, it is major. Then ask
   the user with AskUserQuestion, showing the criteria that fired (or
   "none"), with options:
   - **Not major — auto-merge when green** (recommended when none fired):
     enable `gh pr merge --auto --squash` after opening the PR.
   - **Major — hold for my review** (recommended when any criterion fired):
     PR is labelled `major-change`; Don approves after viewing the preview.
   - **Not major — leave the PR open**: no auto-merge; Don merges by hand.
   This pause is mandatory — never open the PR without having asked.
4. Push the branch and open a PR with `gh pr create`: symptom and root
   cause (from the assessment), the fix summary, the test added and the
   verify results, the `Closes #<n>` line when step 2 applies, the
   major-change verdict and criteria, whether Linux visual baselines are
   pending, and any follow-ups noticed but deliberately left out. Apply the
   label / auto-merge chosen in step 3.
5. If Linux baselines are owed, run the visual-baselines step from Verify
   step 3 now, before watching the gate.
6. **Watch the release gate.** Run `gh pr checks --watch` with a time limit
   (20 minutes). Red → dispatch a fix subagent on the branch, which fixes
   the cause (never the check), commits and pushes; watch again. Record the
   preview deployment URL from the checks or the Cloudflare PR comment.
7. Final report to the user: verdict and severity, what was fixed, test
   counts, PR link, preview URL, the merge mode chosen, and any residual
   risks the test phase flagged.
