# Quickstart: validating the blog

How to prove the feature works, locally and on the preview. Details of what each page must
contain are in [contracts/blog-pages.md](./contracts/blog-pages.md); settings and errors in
[contracts/post-file.md](./contracts/post-file.md) and
[contracts/build-errors.md](./contracts/build-errors.md).

## Prerequisites

- Node from nvm matching `.nvmrc` (24): `node -v`; if not, `source ~/.nvm/nvm.sh && nvm use`
  in the same command as the tool call.
- Dependencies: `corepack pnpm install` (adds `@astrojs/rss` and `satteri`).
- In a worktree, `.reference/flux` copied in if you need the Flux source; it is never committed.
- Visual baselines on Linux need Docker Desktop running (`docker info`).

## 1. Unit, schema, component and build tests

```sh
corepack pnpm run test
```

Expect green for the new files under `tests/unit/` (post schema, topics, post order, reading
time, build mode, Shiki classes, share links, feed items, navigation), `tests/component/post/`
and `tests/build/` (post validation wiring runs, the local site, listings and feed, drafts; row-level
validation is in `tests/unit/content`, see `docs/testing.md`).

## 2. Build and look

```sh
corepack pnpm run build && corepack pnpm exec wrangler dev --ip 127.0.0.1 --port 4321
```

This is a non-production build, so the sample drafts are built and marked "Draft". Open:

| Address | Check |
|---|---|
| `/` | "Recent writing" shows 3 sample posts as cards, 3 across on desktop, and links to `/writing/` |
| `/writing/` | eyebrow, "Writing", lead story = newest sample, pill row, Featured grid, Latest grid, "Subscribe (RSS)" |
| `/writing/all/` | pill row, cards newest first; no pagination with fewer than 13 posts |
| `/writing/topics/agentic-ai/` | topic banner in its colour, cards, no pill row |
| `/writing/{sample slug}/` | hero (if any), title card, Draft notice, highlighted code with caption, Copy button, scrolling table, wide and full images, views note, Share, Related |
| `/writing/all/1/`, `/writing/all/99/` | not-found page, status 404 |
| `/writing/rss.xml` | valid XML; **no items** (all samples are drafts) |

Toggle the theme and repeat on a phone-width window. Turn JavaScript off: every page reads in
full, the Copy and Share buttons are gone, the LinkedIn and email links remain. The browser
console shows no content security policy errors.

## 3. Production behaviour

```sh
WORKERS_CI=1 WORKERS_CI_BRANCH=main corepack pnpm run build
```

Expect: no `dist/writing/sample-*` pages; `/writing/` shows "There are no posts yet."; the home
page has no "Recent writing"; `dist/sitemap-*.xml` lists no sample post; the feed has no items.
(`tests/unit/site/build-env.test.ts` asserts the same.)

## 4. Full gate

```sh
ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 1200; exec @ARGV' corepack pnpm run verify
```

Runs secrets scan, lint, type check, Vitest, build and every Playwright project (`e2e`,
`a11y`, `budget`, `visual`, `sections`). The `a11y` and `budget` projects now include the blog
templates (landing, all posts, a topic, a post with and without a feature image); the `a11y`
project also runs `blog.a11y.spec.ts` (headings, focus, targets, reduced motion, forced colours,
zoom and text spacing, scripts) and `blog-fixture.a11y.spec.ts` (listing page 2 and the empty
pages of a production-mode build).

## 5. Visual baselines (intended appearance change)

New and changed snapshots (see plan § Visual baselines) need both platforms:

```sh
corepack pnpm run test:visual:update          # macOS
corepack pnpm run test:visual:update:linux    # Linux, needs Docker Desktop
```

Review every new and changed image against the Direction A pictures before committing. A diff
on any other snapshot is a regression to fix.

## 6. On the preview deployment (Don)

- Compare `/writing/`, `/writing/all/`, a topic page and a sample post with Direction A in both
  themes at phone and desktop widths (SC-010).
- On a phone with a share sheet, "Share" opens it with the post title and address.
- Paste `https://{preview}/writing/rss.xml` into the W3C feed validator
  (validator.w3.org/feed): no errors (SC-008; it will have no items while every post is a
  draft).
- Publishing check for later: flipping one sample to `draft: false` on a branch makes it appear
  in the feed and on production once merged.
