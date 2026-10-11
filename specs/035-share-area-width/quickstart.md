# Quickstart: Share area and views note match the post width

Validation guide for [spec.md](./spec.md); the design is in [plan.md](./plan.md).

## Prerequisites

Follow the Local toolchain section of `CLAUDE.md` (node from `.nvmrc` via nvm).

## Automated

```sh
pnpm exec playwright test --project=e2e tests/e2e/blog.spec.ts -g share # new edge and arrangement tests
pnpm exec playwright test --project=e2e tests/e2e/geometry.spec.ts # no sideways scroll at 320/390/1280
pnpm run test:visual                                       # only post-template-* differ before refresh
```

Expected: the share tests pass; geometry passes; after the macOS and Linux baseline refresh
(`.claude/skills/_shared/visual-baselines.md`) the visual project passes and only
`post-template-*` images changed.

## Manual (dev server or the PR preview)

Open any post and scroll to the end.

1. At 1024 px and 1440 px: the views note's top rule and the Share box line up with the title
   card's left and right edges; at 1440 px they span under the text and the questions panel.
2. At 768 px and up: "Share this post" on the left, the links on the right on the same line; the
   views note left-aligned.
3. Below 768 px (375 px, 320 px): the links under the heading, the heading, each line of links and
   the views note centred; no sideways scroll.
4. Tab through: views note is not focusable; focus goes LinkedIn, email, then Share (if shown).
5. With JavaScript off: no Share button; LinkedIn and email links in the same place.
