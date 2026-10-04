# Quickstart: Right-size listing card images

**Feature**: `021-card-image-size` | **Contract**: [contracts/post-card-image.md](./contracts/post-card-image.md)

## Prerequisites

- Node from `.nvmrc` (`node -v`; if it differs, `source ~/.nvm/nvm.sh && nvm use` in the same
  command as the toolchain call). macOS has no `timeout`; bound long runs with
  `perl -e 'alarm N; exec @ARGV' <cmd...>`.
- `pnpm install` done. Nothing new to install.

## 1. Component checks (C1 to C5)

```sh
pnpm exec vitest run --project unit tests/component/post/PostCard.test.ts \
  tests/component/post/LeadStory.test.ts tests/component/post/PostHero.test.ts
```

Expected: the card renders `320w, 400w, 640w`, the new `sizes`, and `q=65&f=webp` on every
candidate; the lead story and hero carry no `q=`.

## 2. Phone-width download check (C6)

```sh
pnpm run build:fixtures   # if the fixture site is not already built
pnpm exec playwright test --project=sections tests/e2e/blog-fixtures.spec.ts
```

Expected: the card-image test passes on all five fixture pages; every chosen candidate is at
most 400w. Before the change it fails on the 480w pick.

## 3. Budget (C7) and the SC-002 figures

```sh
pnpm run build
pnpm run test:budget
```

Expected: every template passes the unchanged 150 KB budget. Read the `budget` annotation of
`writing-series-convergence` for the after figure (total bytes) and compare with the baseline
in [research.md](./research.md) R4 (121,654 bytes total, 78,604 of them card images). To get the
card-image bytes alone:

```sh
grep -o 'srcset="[^"]*"' dist/writing/convergence/index.html
ls -l dist/_astro/ | grep -E 'starting-new-hero|wayfinder-hero'
```

The 400w files should total about 41 KB (research R3). Both figures go in the PR body.

## 4. Visual check

```sh
pnpm run test:visual
```

Only `listing-cards` may differ. If it does, refresh both platforms (macOS
`pnpm run test:visual:update`; Linux `pnpm run test:visual:update:linux` with Docker Desktop,
or the `visual-baselines` PR label as the fallback). Any other subject that differs is a
regression.

## 5. Manual look

Serve the real-site build locally (`pnpm run preview` after `pnpm run build`) and open
`/writing/convergence/` at a 390 px wide window (devtools device mode, 1x): the Network
panel (cache disabled) shows each card image as the 400w file, its transferred size is the
card-image figure for SC-002, and the cards look as before (SC-004).
