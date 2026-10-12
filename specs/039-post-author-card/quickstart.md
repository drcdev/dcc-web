# Quickstart: validate the author card

**Feature**: `039-post-author-card` | **Plan**: [plan.md](./plan.md) |
**Contract**: [contracts/author-card.md](./contracts/author-card.md)

## Prerequisites

Follow `CLAUDE.md` "Local toolchain": run `node -v`, and if it is not the `.nvmrc` version, put
`source ~/.nvm/nvm.sh && nvm use` in the same command as each `pnpm` call. In a worktree, use the
pnpm shim and wrapper described in the shared pipeline notes.

## 1. Fast checks (unit and component)

```bash
pnpm run test:unit
```

Expect green: `seriesOf()` (topics unit test), the author settings rules (blog settings unit
test: two one-line lines, no "Cloud Architect"), `AuthorCard` component tests (rows A4 to A9)
and the `PostLayout` order test (row A2).

## 2. Build and look at it

```bash
pnpm run build && pnpm run preview
```

Open a Drift post, a Convergence post and a post in no series. On each, at the end of the post:

- Order is views note, then the card "Written by Don Coleman", then "Share this post", then
  Related posts.
- The photo is a small circle; the two lines read in the first person and describe his work
  without naming his job title.
- Links: "More in Drift" / "More in Convergence" / "More of my writing" (no-series post),
  "More about me", "Get in touch"; each opens the right page.
- Resize to 320 px: photo on top, everything centred, no sideways scroll. At 768 px and wider:
  photo left, text left-aligned. The card's edges match the title card's.
- Toggle dark theme: text and links readable.
- Turn JavaScript off: card and links unchanged.
- Open the home page, About, a project story and `/writing/`: no card.

## 3. Browser checks

```bash
pnpm run test:e2e        # blog.spec.ts order and edge tests, a11y scan, 24 px targets, site-link crawl
pnpm run test:budget     # post page stays within 150 KB total / 10 KB JS
```

## 4. Visual baselines

The card is inside `#main > article`, which the `post-template` fixture shot captures, so its
eight baselines (desktop and phone, light and dark, darwin and linux) change on purpose. Refresh
both sets as `.claude/skills/_shared/visual-baselines.md` says (`test:visual:update`, then
`test:visual:update:linux` with Docker). No other visual subject should change.
