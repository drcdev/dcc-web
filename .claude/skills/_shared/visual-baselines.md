# Visual baselines (shared)

Included by `/deliver`, `/tweak`, `/squash` and `/chore`, and pointed to from `CLAUDE.md`. These
rules are **mandatory** for the orchestrator and for every subagent told to read this file. Do not
paraphrase them into a subagent prompt; pass them by reference.

The visual project snapshots only the shell (header, footer and open mobile menu), the
not-found page and the fixture site, never real content, so a content edit cannot fail it.
Its per-platform baselines change only when the shell, a template or the design system
changes, which is a major change under Principle III in any case.

The baselines are committed in `tests/e2e/visual.spec.ts-snapshots/`, and a change to them
refreshes both sets.

1. **macOS.** The phase that changed a snapshotted surface on purpose runs
   `pnpm run test:visual:update`.
2. **Linux (what CI compares against).** Regenerate with `pnpm run test:visual:update:linux`,
   which needs Docker Desktop and runs in the Docker image matching the installed
   `@playwright/test` version. If `docker info` fails, ask Don to start Docker Desktop with an
   `AskUserQuestion` whose question text carries the instruction. Do not fall back to CI without
   asking.
3. **Commit and push the images before opening the PR**, so `verify` is green.
4. **Fallback only if Docker cannot be started.** After the PR is open, add the
   `visual-baselines` label, wait for the `update-baselines` job, and download its
   `visual-baselines-linux` artifact with `gh run download`. The artifact holds both platforms,
   so copy only the `*-linux.png` files. Review, commit and push. Until that lands, the `verify`
   check on the PR is expected to be red on visual only, so say so in the PR body.

A visual diff nobody predicted up front is a regression to fix, not a baseline to refresh.
