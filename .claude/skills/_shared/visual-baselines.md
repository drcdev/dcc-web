# Visual baselines (shared)

Included by `/deliver`, `/tweak`, `/squash`, `/chore` and `/content`, and pointed to from `CLAUDE.md`. These
rules are **mandatory** for the orchestrator and for every subagent told to read this file. Do not
paraphrase them into a subagent prompt; pass them by reference.

The visual project snapshots only the shell (header, footer and open mobile menu), the
not-found page and the fixture site, never real content, so a content edit cannot fail it, except
a menu change, which moves the shell and not-found shots taken on the real site.
Its per-platform baselines change only when the shell, a template or the design system
changes.

The baselines are committed in `tests/e2e/visual.spec.ts-snapshots/`, and a change to them
refreshes both sets.

1. **macOS.** The phase that changed a snapshotted surface on purpose runs
   `pnpm run test:visual:update`.
2. **Linux (what CI compares against).** Regenerate with `pnpm run test:visual:update:linux`.
   The script runs the Playwright image matching the installed `@playwright/test` version in
   Apple's `container` when `container system status` succeeds, and in Docker Desktop
   (`docker info`) otherwise. If neither succeeds, ask Don to start one (`container system start`,
   or Docker Desktop) with an `AskUserQuestion` whose question text carries the instruction,
   then wait for him to start it. There is no other way to make the Linux baselines.
3. **Commit and push the images before opening the PR**, so `verify` is green. If CI's
   visual check then fails on images the container runtime made, stop and tell Don: the container runtime has drifted from CI,
   and fixing that is its own change. Do not refresh the images from a CI run.

A visual diff nobody predicted up front is a regression to fix, not a baseline to refresh.
