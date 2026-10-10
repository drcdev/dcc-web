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
  baselines locally (see `.claude/skills/_shared/visual-baselines.md`). If `docker info` fails, ask Don to start Docker Desktop with an
  `AskUserQuestion` whose question text carries the instruction.

## Visual baselines

The visual project, its per-platform baselines and how to refresh them (macOS, and Linux via Docker)
are in `.claude/skills/_shared/visual-baselines.md`. Read it before
changing or refreshing a baseline.

## Merging

- **Open every PR from the `drc-agents` account.** The `main` ruleset requires an approving
  review on every PR, with code-owner review and CODEOWNERS `* @drcdev`. GitHub does not count
  an author's approval on their own PR, so Don (`drcdev`) can approve only a PR he did not
  author. Both accounts are in the local `gh` keyring. Run
  `gh auth switch --user drc-agents` immediately before `gh pr create`, and
  `gh auth switch --user drcdev` straight after (the setup check reads as Don). A PR opened
  under `drcdev` by mistake must be closed and reopened from `drc-agents`; do not work around
  the ruleset.
- **What branch protection enforces** (ruleset `main-protection`, committed as
  `setup/github-ruleset.json`): a PR is required, with one approving review from a code owner
  (Don); stale approvals are dismissed on push; the `verify` check is required; merge commits
  are the only merge method, and a Copilot PR not attributed to a person needs one extra
  approval; no force-push or deletion, and no bypass actors. A PR that falls behind `main` can merge without
  catching up, and only real conflicts need resolving. The CI run on the push to `main` catches
  breakage that only shows when two PRs are combined (#147).
- The repository allows **merge commits only**; squash and rebase merges are disabled. Any
  `--squash` or `--rebase` form of `gh pr merge` fails.
- **Arm auto-merge on every PR.** Run `gh pr merge --auto --merge` right after the final push
  (`.claude/skills/_shared/open-pr.md`). Branch protection holds the merge until Don approves
  and `verify` is green, then it lands on its own.
- Open `[PREVIEW-CHECK]` items are listed in the PR body under their own heading. Don checks
  them on the preview before approving, so they do not hold back auto-merge.
- **Clean up after the merge.** Once the PR has merged, switch to `main`, pull, and delete the
  local feature branch (`git branch -d <branch>`; the remote branch is removed by GitHub's
  delete-on-merge setting, or remove it with `git push origin --delete <branch>` if it
  lingers). Do not leave merged branches behind.

## Orchestration skills

`/deliver`, `/tweak`, `/squash` and `/chore` in `.claude/skills/` are the end-to-end pipelines
Don uses for feature, small-change, bug and maintenance work. The first three began as ports
from Don's `cadence` project (read-only clone at `.reference/cadence`, gitignored like
`.reference/flux` for the design theme).
`/chore` is local to this repository: it has no spec phase (a chore changes no user-visible
behaviour), plans into `.specify/chores/<slug>/` on a `chore/<slug>` branch, and adds a
fresh-eyes review phase before verify.

Wording the four pipelines share lives once in `.claude/skills/_shared/`. Each skill reads it at
the point of use, and no skill restates it; the Local toolchain rules live above in this file.

## Spec Kit extensions

The Spec Kit `git` extension creates feature branches and auto-commits after each phase with
conventional commit messages (`.specify/extensions/git/git-config.yml`). The `bug` extension
used by `/squash` declares no hooks and `auto_commit.default` is `false`, so the
`after_bug_assess`, `after_bug_fix` and `after_bug_test` events are enabled **by hand** in
that config file, as are the `after_chore_plan`, `after_chore_implement` and
`after_chore_review` events used by `/chore`. Do not remove them as unused, and re-add them if
the git extension is ever reinstalled from its template.
