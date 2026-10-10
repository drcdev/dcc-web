---
name: tweak
description: Run the short speckit pipeline for a small user-visible change — specify → clarify (one round) → plan → tasks → implement → verify → PR — with each phase in a fresh subagent. Skips the checklist, resolve, analyze and converge phases that a small change does not earn, but still produces a spec, a plan and tests. Pauses only for the clarify questions. Use for a copy change, a spacing or colour fix, a small component adjustment — not for a feature slice and never for a dependency, CI, deployment, design-system or constitution change.
argument-hint: "Change description, or a GitHub issue reference (#42, 42, or issue URL)"
user-invocable: true
disable-model-invocation: false
---

# /tweak — short speckit pipeline

You are the **orchestrator**. You run each phase in its own subagent (fresh
context) and hold only thin summaries yourself. The disk artifacts
(`specs/<feature>/spec.md`, `plan.md`, `tasks.md`) are the hand-off between
phases — never load them into your own context; the phase subagents read them.

This is `/deliver` with the checklist, checklist-resolution, analyze and
converge phases removed. Everything the constitution requires is still
produced: a spec with testable requirements, a plan that passes the
Constitution Check and cites the Astro docs, tests written first, and a green
`verify` gate. What is removed is ceremony, not governance.

**Input:** `$ARGUMENTS` is the change description, or a GitHub issue
reference (`#42`, `42`, or a full issue URL). If empty, ask for it.

For an issue reference: fetch it with
`gh issue view <n> --json number,title,body,labels` and use the title + body
as the description. Record the issue number — the PR must close it (see
Finish).

## Triage gate — is this actually a tweak?

Run this **before** the preflight, against the change as described. `/tweak`
is correct only when **all** of these hold:

1. **No platform change.** The change does not add,
   remove or replace a dependency, integration or external service; does
   not touch how contact data is collected, stored, retrieved or deleted;
   does not change the design system, site-wide layout, navigation or
   visual identity; cannot increase running costs; does not change CI,
   deployment or infrastructure configuration (`.github/`,
   `wrangler.jsonc`, `fly.toml`, the Astro adapter or integrations); and
   does not amend the constitution.
2. No new or changed content collection schema, and no new content type.
3. No new route or page — no new file under `src/pages/`, no redirect
   change. Editing an existing page is fine.
4. No new E2E spec file, and no edit to the shared test helpers
   (`tests/e2e/templates.ts`, `tests/e2e/csp-violations.ts`,
   `tests/component/html.ts`, `tests/fixtures/`) or to
   `playwright.config.ts` / `vitest.config.ts`. Adding cases to an existing
   spec is fine.
5. No client-side JavaScript added to a page that ships none today
   (Principle V) — a new island is a feature, not a tweak.
6. The whole change states in **five or fewer** functional requirements.

Any one false → **stop and tell the user to run `/deliver` instead**, naming
the condition that failed. Do not run a reduced pipeline on a change that
earned the full one; the phases you would skip are exactly the ones that
catch what makes it large.

Condition 1 keeps `/tweak` to changes the short pipeline can cover; re-check it
against the real diff in Finish, because an implementation can reach further than
its spec predicted.

### Promotion is one-way

If clarify or plan reveals that a triage condition is actually false — the
copy change needs a new page, the layout fix needs a design-token change —
**stop the pipeline and hand off to `/deliver`**. The spec and branch already
on disk carry over; tell the user which condition broke and that `/deliver`
should resume from the existing feature directory. Never demote a slice the
other way: a `/deliver` run does not get shortened into `/tweak` partway
through.

## Rules

- Phases run **sequentially, one subagent at a time**. Use the Agent tool
  with `run_in_background: false`.
- **The only user pause is clarify.**
  Never stop to ask "shall I proceed?" between phases. Stop early only on a
  red verify gate, a broken triage condition, or a phase failure you cannot
  resolve — and report exactly where things stand.
- The constitution (`.specify/memory/constitution.md`) binds every phase and
  overrides anything a speckit template says. In particular:
  - **Test-first (Principle I).** Tests are mandatory, written before the
    code they cover, and seen to fail first — however small the change. The
    tasks template calls tests "optional"; the constitution wins.
  - **Test placement.** Follow the test-placement rule in the constitution's Development
    Workflow; "Where a test goes" in `docs/testing.md` has the detail and the layer names.
  - **Release gate (Principle II).** Never mark a task done on a red suite.
    The `verify` package script, run as `pnpm run verify`, is the local
    mirror of the CI gate and must exit zero before the pipeline is
    complete. Checks are never skipped, disabled or weakened to get a change
    through.
  - **Astro docs (Principle IV).** Any Astro choice in the plan cites the
    docs page found through the Astro Docs MCP (`astro-docs`).
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
- Follow the Local toolchain section of `CLAUDE.md` for every `pnpm`, `astro`, `playwright` or
  `wrangler` call, and tell every subagent that runs one to do the same.

## Preflight

1. `git status` — require a clean tree. If dirty, stop and tell the user
   what is uncommitted.
2. Require the current branch to be `main` (the specify phase creates the
   feature branch via the `before_specify` hook). If not on `main`, stop and
   ask. If another feature is mid-flight, the constitution's answer is a
   separate git worktree, not a second branch in this checkout — say so.
3. `git remote get-url origin` — require a GitHub remote, because Finish
   pushes and opens a PR.

## Phases

Spawn each subagent with the model shown. The common prompt frame for every
phase:

> You are running one phase of the /tweak pipeline in
> /Users/doncoleman/Repos/dcc-web. Read `.specify/memory/constitution.md`
> first; it overrides templates and your own judgement. Invoke the Skill
> tool with `skill: <SKILL>` and follow it completely. Hooks: run the
> `speckit-git-commit` skill for the `after_<phase>` event when you finish,
> as the skill's EXECUTE_COMMAND hook instructions describe; skip any
> `before_*` commit hook (the tree is already clean). This is a
> deliberately small change — do not expand its scope, and do not generate
> artifacts the skill does not require. You cannot ask the user anything —
> resolve judgment calls yourself and note them in your summary. Follow the
> Local toolchain section of `CLAUDE.md` for every `pnpm`, `astro`, `playwright`
> or `wrangler` call. Never print secrets. Your final message must be only: a 3–6 sentence summary
> of what you produced, the feature directory/branch, and any risks or
> open questions.

| #   | Phase     | Skill               | Model  | Extra instructions for the subagent                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | --------- | ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | specify   | `speckit-specify`   | opus   | Pass the change description as args. The `before_specify` hook (`speckit-git-feature`) must run and create the branch. Keep it to five or fewer functional requirements — if it will not fit, say so rather than padding. However small the change: state the accessibility expectation (WCAG 2.2 AA, Principle X) and whether any rendered page changes appearance (that decides the visual-baseline step in Finish). Copy is plain language, no hype. Return the created branch and spec dir. |
| 2   | clarify   | `speckit-clarify`   | opus   | **One round only, two steps — see below.**                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3   | plan      | `speckit-plan`      | opus   | The Constitution Check is not optional here; address every principle, briefly. Every Astro choice cites its docs page via the Astro Docs MCP (Principle IV). Confirm in the plan that triage condition 1 still holds — if it does not, say so plainly so the orchestrator can promote to `/deliver`. If the plan rules out a plausible alternative (say, a CSS-only fix vs. a component change), record the decision and the rejected option in plan.md. Skip `research.md`, `data-model.md` and `contracts/` unless the change genuinely needs them. |
| 4   | tasks     | `speckit-tasks`     | sonnet | Tests are **mandatory**, not optional, and ordered before the implementation they cover: usually a unit or component test for the changed code, and an E2E case only where the change is something only a browser can show. Each test task names its one primary layer, the cheapest layer that can observe the behaviour ("Where a test goes" in `docs/testing.md`), and gives the reason for any second layer in the task text. If the change alters the shell, a template or the design system (what the visual project snapshots), include a task to update the macOS and Linux visual baselines (`pnpm run test:visual:update`, then `pnpm run test:visual:update:linux`, which needs Docker Desktop) after the implementation. Tasks a subagent cannot verify locally carry the `[PREVIEW-CHECK]` marker in tasks.md: read `.claude/skills/_shared/preview-check.md` and follow it exactly. |
| 5   | implement | `speckit-implement` | sonnet | Execute the whole task list unless it has more than one `## Phase` heading, in which case take one phase per subagent as `/deliver` does. Work test-first: write the tests, run them and see them fail, then implement until they pass. Read `.claude/skills/_shared/verify-gate.md` and follow it exactly. Never mark a task done on a red suite. Follow the Astro docs and prefer first-party features over custom code. For `[PREVIEW-CHECK]` tasks, read `.claude/skills/_shared/preview-check.md` and follow it exactly. Commit via `speckit-git-commit` (event `after_implement`). |

### Phase 2: clarify (the one mid-pipeline user pause)

One round, no loop — a change this size does not have three rounds of
ambiguity in it, and asking for them trains you to answer on autopilot.

1. Spawn a clarify subagent: run `speckit-clarify` **up to the point of
   interviewing** — generate the prioritized questions with their
   multiple-choice options and recommended option, but do NOT edit the
   spec; return the questions as the final message.
2. Ask the user with AskUserQuestion (batch up to 4; two calls if there are
   5). Preserve each question's options and put the recommended option
   first with "(Recommended)".
3. Send the answers back to the **same** subagent (SendMessage): "Encode
   these answers into spec.md per the skill's encoding rules, then run
   speckit-git-commit for after_clarify." Relay its summary.

If the subagent reports no material ambiguities, the phase ends with **no
user pause** — do not manufacture a question to fill it.

If an answer breaks a triage condition, take the promotion path above.

### Phase 5 gate

If an implement subagent reports a red suite it cannot fix, stop the
pipeline and report: which tasks are done, what is red. If it flags
incomplete checklist items, ignore the flag — this pipeline generates no
checklists by design; note it in the final report and continue.

## Verify

**Inner loop and gate.** Read `.claude/skills/_shared/verify-gate.md` and follow it exactly.

1. Run the gate yourself, following the local tier in
   `.claude/skills/_shared/verify-gate.md`. When the tier is full, run `pnpm run verify` in the **foreground with an explicit
   time limit** (10 minutes, via the `perl` alarm (CLAUDE.md, Local toolchain) — never background
   a run and poll for it). Keep only the pass/fail summary and the failing
   test names. A run that hits the limit is red: report it, do not retry in
   a loop.
2. Red → dispatch a fix subagent on the branch (told to read
   `.claude/skills/_shared/verify-gate.md`; fix the cause, never the
   check), then run verify again. Never proceed red.
3. **Visual baselines.** If the change altered the shell, a template or the design system on
   purpose, the implement phase updated the macOS baselines. Read
   `.claude/skills/_shared/visual-baselines.md` and follow it exactly.

## Finish

1. Verify green — never open the PR otherwise.
2. **Link the issue.** If the pipeline was invoked with an issue reference,
   or the change plainly matches an open issue (`gh issue list`), the PR
   body must contain `Closes #<n>`. Ad-hoc change (no issue) → skip; do not
   retroactively create one.
3. Re-check triage condition 1 against the real diff (`git diff --stat main`
   and `git diff --name-only main...HEAD`). If it fails, triage was wrong: say
   so in the PR body.
4. Push the branch and open the PR. The PR body covers: what changed and why, the verify
   results, the `Closes #<n>` line when step 2 applies,
   whether Linux visual baselines are pending, the list of `[PREVIEW-CHECK]` items for Don to
   walk on the preview deployment, any risks the phase agents flagged, and whether auto-merge
   is armed. Open the PR and arm auto-merge: read `.claude/skills/_shared/open-pr.md` and
   follow it exactly.
5. **Watch the release gate.** Run `gh pr checks --watch` with a time limit
   (20 minutes). Red → dispatch a fix subagent on the branch, which fixes
   the cause (never the check), commits and pushes; watch again. Record the
   preview deployment URL from the checks or the Cloudflare PR comment.
6. Final report to the user: what changed, test counts, PR link, preview
   URL, whether auto-merge is armed, whether baselines were updated, the
   `[PREVIEW-CHECK]` items awaiting them, and any risks the phase agents
   flagged.
