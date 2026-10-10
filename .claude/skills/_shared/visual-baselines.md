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
   `AskUserQuestion` whose question text carries the instruction, then wait for him to
   start it. There is no other way to make the Linux baselines.
3. **Commit and push the images before opening the PR**, so `verify` is green. If CI's
   visual check then fails on images Docker made, stop and tell Don: Docker has drifted from CI,
   and fixing that is its own change. Do not refresh the images from a CI run.

A visual diff nobody predicted up front is a regression to fix, not a baseline to refresh.
