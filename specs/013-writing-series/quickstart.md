# Quickstart: validate the Drift & Convergence framing

Run every command from the worktree root. Check `node -v` matches `.nvmrc` (24) first.

## Fast checks

```sh
pnpm exec vitest run tests/unit/content/topics.test.ts tests/unit/content/topic-ids.test.ts \
  tests/unit/content/post-schema.test.ts tests/unit/content/post-address.test.ts \
  tests/unit/site/redirects.test.ts tests/unit/site/feed.test.ts
pnpm exec vitest run tests/component/post tests/component/sections/RecentWriting.test.ts
pnpm exec vitest run tests/build/post-validation.test.ts tests/build/blog-listing.test.ts
```

Expected: the six-topic list with unique colours and ≥ 4.5:1 pairs (including marker, mauve,
sand and dusk); rows P6, P21, P23 to P26 behave as in [contracts/build-errors.md](./contracts/build-errors.md).

## Build and look

```sh
pnpm run build
ls dist/writing/drift dist/writing/convergence        # index.html present
test ! -e dist/writing/topics/drift                   # not built
cat dist/_redirects                                   # four rules
```

Then `pnpm exec wrangler dev --port 4321` and check by hand:

1. `/writing/`: framing lead between the heading and the lead story; links to both series;
   pill row has four topics and "All posts", no series pills.
2. `/writing/drift/`: Drift banner with links to Convergence and Writing; only the two Drift
   posts. `/writing/convergence/`: the two Convergence posts.
3. `curl -sI http://127.0.0.1:4321/writing/topics/drift/` → `301`, `Location: /writing/drift/`;
   same for `/writing/topics/drift/2/` and convergence.
4. Every card on `/writing/`, `/writing/all/`, a topic page, the home page and related posts
   shows "Series: …" first for tagged posts; the post header shows it too.
5. A text-only card of a tagged post has a lavender or sage border.
6. Agentic AI pills are mauve and Technology teams pills are sand.
7. Home "Recent writing" has one line naming Drift & Convergence with both series links.
8. About "About the writing" is short and links to both series pages.
9. `curl -s http://127.0.0.1:4321/writing/rss.xml | head` → title "Drift & Convergence",
   description naming both series.
10. With JavaScript disabled, the landing framing lead and links still work.

## Full gate

```sh
pnpm run verify          # in an agent shell: ASTRO_PREVIEW_BACKGROUND=1, bounded with perl alarm
pnpm run test:a11y
pnpm run test:budget
```

## Visual baselines (after implementation)

Expected changes only: `writing-landing`, `writing-all`, `writing-topic`, `writing-post`,
`home`, `about`, plus the new `writing-series`. Refresh both platforms:

```sh
pnpm run test:visual:update            # macOS
pnpm run test:visual:update:linux      # Linux, needs Docker Desktop (fallback: visual-baselines PR label)
```

Any other diff is a regression to fix.

## Preview check (`[PREVIEW-CHECK]`, Don)

On the PR's preview deployment: the landing framing, both series pages, the marker on cards
and post headers in both themes, the recoloured Agentic AI and Technology teams pills, and the
301 from `/writing/topics/drift/`. Auto-merge stays off (major change).
