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

The visual Playwright project compares each snapshotted page against committed per-platform
images in `tests/e2e/visual.spec.ts-snapshots/`. An intended appearance change needs both sets
refreshed:

- **macOS:** `pnpm run test:visual:update`.
- **Linux (what CI compares against):** `pnpm run test:visual:update:linux`. It runs the same
  steps as the `update-baselines` CI job inside the Playwright Docker image that matches the
  installed `@playwright/test` version, and needs Docker Desktop running. Fallback when Docker
  is unavailable: add the `visual-baselines` label to the open PR, download the
  `visual-baselines-linux` artifact from the `update-baselines` run with `gh run download`,
  and commit the images.

A visual diff the spec did not predict is a regression to fix, not a baseline to refresh.

## Merging

The repository allows **merge commits only**; squash and rebase merges are disabled. Auto-merge
is `gh pr merge --auto --merge`. Any other `--squash` or `--rebase` form fails.

## Orchestration skills

`/deliver`, `/tweak` and `/squash` in `.claude/skills/` are the end-to-end pipelines Don uses
for feature, small-change and bug work. They were ported from Don's `cadence` project, whose
read-only clone lives at `.reference/cadence` (gitignored, like `.reference/flux` for the
design theme). Diff against it when porting further changes.

Keep the three pipelines aligned. A change to any of these goes into all three together:

- the "Local toolchain" section;
- the pre-PR major-change / merge-mode pause (one `AskUserQuestion` before `gh pr create`);
- the `[PREVIEW-CHECK]` task marker;
- the visual-baselines step.

## Spec Kit extensions

The Spec Kit `git` extension creates feature branches and auto-commits after each phase with
conventional commit messages (`.specify/extensions/git/git-config.yml`). The `bug` extension
used by `/squash` declares no hooks and `auto_commit.default` is `false`, so the
`after_bug_assess`, `after_bug_fix` and `after_bug_test` events are enabled **by hand** in
that config file. Do not remove them as unused, and re-add them if the git extension is ever
reinstalled from its template.
