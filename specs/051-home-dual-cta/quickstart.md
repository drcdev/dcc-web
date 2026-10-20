# Quickstart: validate the second call to action

## Prerequisites

Node 24 per `.nvmrc` (CLAUDE.md, Local toolchain). In an agent shell for this worktree, prefix
commands with the PATH export the orchestrator gives (node 24 plus a pnpm shim). Docker Desktop
running only for the Linux visual baselines.

## Fast checks

```sh
pnpm vitest run tests/unit/content/page-schema.test.ts tests/component/HomeIntro.test.ts
pnpm playwright test tests/e2e/pages.spec.ts -g "home introduction card"
```

Expected: schema accepts the card with and without `secondaryCta` and rejects each invalid one;
the component renders GitHub, LinkedIn, main, second in that order; the e2e block passes at 375,
640, 768 and 1280 px in both themes (layout, 44 px equal heights, navigation to the content's
href, border and hover contrast).

## Template sweeps (no edits expected, must stay green)

```sh
pnpm playwright test tests/e2e/a11y.spec.ts tests/e2e/geometry.spec.ts tests/e2e/no-js.spec.ts tests/e2e/budget.spec.ts
```

## Visual baselines

The 8 `home-now-start-here-*` PNGs change. Refresh per `.claude/skills/_shared/visual-baselines.md`
(macOS update, then Linux via Docker), and compare `-previous.png` against the new image.

## Removal check (SC-004)

Delete `secondaryCta` from `src/content/pages/index.mdx`, run `pnpm astro build`: build succeeds
and the card shows one button. Restore it afterwards.

## Full gate

`pnpm run verify` (ask Don before running the full gate locally; see memory notes).

## Preview check for Don

On the branch preview: home card at phone and desktop width, light and dark; "Read my writing"
goes to `/writing/`; the main button is now slightly taller (44 px).
