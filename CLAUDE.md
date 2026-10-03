# CLAUDE.md

Working notes for agents in this repository. The constitution at
`.specify/memory/constitution.md` governs what gets built and how it is reviewed; this file
records the local conventions that are not written down anywhere else. When the two conflict,
the constitution wins.

## Local toolchain

- **Node comes from nvm.** `.nvmrc` pins the major and `package.json` `engines` enforces it.
  Before any `pnpm`, `astro`, `playwright` or `wrangler` command, run `node -v`. If it is not
  the `.nvmrc` version, run `source ~/.nvm/nvm.sh && nvm use` in the **same** Bash command as
  the toolchain call. The Bash tool does not keep shell state between calls, and a shell that
  inherited an older node keeps it. Never hard-code an nvm version path.
- **macOS has no `timeout` binary.** Bound a long run with
  `perl -e 'alarm N; exec @ARGV' <cmd...>` instead.
- **Docker Desktop is normally off.** It is only needed to regenerate the Linux visual
  baselines locally (below). If `docker info` fails, ask Don to start Docker Desktop with an
  `AskUserQuestion` whose question text carries the instruction; do not fall back to CI
  without asking.

## Visual baselines

The visual project snapshots only the shell (header, footer and open mobile menu), the
not-found page and the fixture site, never real content, so a content edit cannot fail it. Its per-platform baselines change only when the shell, a template or the design system
changes, which is a major change under Principle III in any case.
The baselines are committed in `tests/e2e/visual.spec.ts-snapshots/`, and a change to them
refreshes both sets:

- **macOS:** `pnpm run test:visual:update`.
- **Linux (what CI compares against):** `pnpm run test:visual:update:linux`, which needs Docker
  Desktop and runs in the Docker image matching the installed `@playwright/test` version.
  Fallback when Docker is unavailable: add the `visual-baselines` label to the open PR, which
  runs `update-baselines`, download the `visual-baselines-linux` artifact with
  `gh run download`, and commit the images.

A visual diff nobody predicted up front is a regression to fix, not a baseline to refresh.

## Merging

- **Open every PR from the `drc-agents` account.** Don is the sole maintainer and GitHub does
  not count an author's approval on their own PR, so the `major-change-approval` check rejects
  any PR authored by `drcdev`. Both accounts are in the local `gh` keyring. Run
  `gh auth switch --user drc-agents` immediately before `gh pr create`, and
  `gh auth switch --user drcdev` straight after (the setup check reads as Don). A PR opened
  under `drcdev` by mistake must be closed and reopened from `drc-agents`; do not work around
  the gate.
- The repository allows **merge commits only**; squash and rebase merges are disabled. Any
  `--squash` or `--rebase` form of `gh pr merge` fails.
- **Enable auto-merge by default.** When the work is done and nothing is left that needs Don's
  input beyond approving the PR (no open `[PREVIEW-CHECK]` items, no unresolved questions, no
  pending baselines), run `gh pr merge --auto --merge` right after the final push. Branch
  protection still requires Don's review, so the merge waits for his approval and a green
  `verify` check, then lands on its own.
- Leave auto-merge off only when the PR is a **major change** under Constitution Principle III,
  or when Don must check something on the preview deployment before it can merge. Say which in
  the PR body.
- **Clean up after the merge.** Once the PR has merged, switch to `main`, pull, and delete the
  local feature branch (`git branch -d <branch>`; the remote branch is removed by GitHub's
  delete-on-merge setting, or remove it with `git push origin --delete <branch>` if it
  lingers). Do not leave merged branches behind.

## Orchestration skills

`/deliver`, `/tweak`, `/squash` and `/chore` in `.claude/skills/` are the end-to-end pipelines
Don uses for feature, small-change, bug and maintenance work. The first three were ported from
Don's `cadence` project, whose read-only clone lives at `.reference/cadence` (gitignored, like
`.reference/flux` for the design theme). Diff against it when porting further changes.
`/chore` is local to this repository: it has no spec phase (a chore changes no user-visible
behaviour), plans into `.specify/chores/<slug>/` on a `chore/<slug>` branch, and adds a
fresh-eyes review phase before verify.

Keep the four pipelines aligned. A change to any of these goes into all four together:

- the "Local toolchain" section;
- the pre-PR major-change / merge-mode pause (one `AskUserQuestion` before `gh pr create`);
- the `[PREVIEW-CHECK]` task marker;
- the visual-baselines step and the "Visual baselines" section above (a unit test checks their
  shared sentences are identical in all five);
- the "PR author account" block (a unit test checks it is identical in all four);
- the "Inner loop and gate" paragraph and the `verify:quick` sentence in the implement or fix
  phase (a unit test checks both are identical in all four).
- the "Test placement" bullet in the Rules section and the layer-naming phrase where each
  pipeline plans its tests (tasks row, fix and assess rows, or plan, implement and review
  steps); a unit test checks the bullet is identical in all four.

## Spec Kit extensions

The Spec Kit `git` extension creates feature branches and auto-commits after each phase with
conventional commit messages (`.specify/extensions/git/git-config.yml`). The `bug` extension
used by `/squash` declares no hooks and `auto_commit.default` is `false`, so the
`after_bug_assess`, `after_bug_fix` and `after_bug_test` events are enabled **by hand** in
that config file, as are the `after_chore_plan`, `after_chore_implement` and
`after_chore_review` events used by `/chore`. Do not remove them as unused, and re-add them if
the git extension is ever reinstalled from its template.
