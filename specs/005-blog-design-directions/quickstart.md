# Quickstart: validating the blog design directions

**Feature**: 005-blog-design-directions | **Plan**: [plan.md](./plan.md)

Run everything from the worktree root
(`/Users/doncoleman/Repos/dcc-web/.claude/worktrees/blog-design-directions`).

## Prerequisites

- `node -v` prints v24. In this worktree use `corepack pnpm …` rather than bare `pnpm` (the
  worktree guard refuses `source ~/.nvm/nvm.sh`; node 24 is already active). Outside the
  worktree, follow CLAUDE.md "Local toolchain".
- Bound long runs with `perl -e 'alarm 1800; exec @ARGV' <cmd…>` (macOS has no `timeout`).
- From an agent shell, set `ASTRO_PREVIEW_BACKGROUND=1` for `verify` (see memory note "Verify
  from agent shell").
- Docker is **not** needed: this feature adds no visual baselines.

## 1. Tests fail first (Principle I)

```sh
corepack pnpm exec vitest run tests/unit/design/blog-samples.test.ts
corepack pnpm run build && corepack pnpm exec playwright test tests/e2e/design-blog.a11y.spec.ts --project=a11y
```

Expected before implementation: the unit test fails (module `samples.ts` missing) and every
prototype page test fails with 404.

## 2. The prototypes build and pass their checks

```sh
corepack pnpm exec vitest run tests/unit/design/blog-samples.test.ts
corepack pnpm run build
corepack pnpm exec playwright test tests/e2e/design-blog.a11y.spec.ts --project=a11y
```

Expected: all pass: zero axe violations on all 22 pages at both widths in both themes and with
JavaScript off, no horizontal scroll at 320 px, no CSP violations, noindex and prototype notice
present, every internal link 200 ([contracts/prototype-routes.md](./contracts/prototype-routes.md)).

## 3. Nothing else changed

```sh
ASTRO_PREVIEW_BACKGROUND=1 perl -e 'alarm 2400; exec @ARGV' corepack pnpm run verify
```

Expected: green, including the unchanged `seo.spec.ts` / `pages.spec.ts` sitemap assertions
(proves `/design/` is kept out of the sitemap) and the unchanged visual baselines (proves the
shared shell did not move).

## 4. Look at the directions by eye

```sh
corepack pnpm run build && corepack pnpm exec wrangler dev --ip 127.0.0.1 --port 4321
```

Open `http://127.0.0.1:4321/design/blog/`. For each direction, reach landing, listing and a
post in at most two clicks from the index; switch theme with the footer toggle; narrow the
window to phone width. Walk the reader needs in spec User Story 2 on each direction. Then do the FR-031 keyboard
and zoom walk-through: Tab through each screen (focus order follows the visual order, focus
is visible in both themes, link text names its target), check alt text is meaningful, resize
text to 200 percent and zoom to 400 percent with no loss of content, turn on reduced motion,
and confirm nothing is available only on hover. Note the results for the pull request.

## 5. Capture the pictures

```sh
corepack pnpm run build
corepack pnpm exec playwright test --config tests/design/playwright.config.ts
```

Expected: 36 JPEGs in `docs/design/blog/`, named as in
[contracts/decision-document.md](./contracts/decision-document.md), total under about 6 MB.

## 6. Decision document check

Open `docs/design/blog.md`: every direction has summary, preview links, 12 pictures, topic
presentation, proposed addresses, no-featured behaviour, new colours or fonts, and trade-offs;
the `## Decision` section is last and both lines are empty.

## 7. Preview deployment (pull request)

After the pull request is opened (major change, auto-merge off), open the branch preview at
`/design/blog/` and repeat step 4 there. Confirm the response carries `X-Robots-Tag: noindex`
and `/sitemap-index.xml` lists no `/design/` address.

## 8. Removal after Don's review ([PREVIEW-CHECK])

Only after Don has reviewed the preview:

```sh
git rm -r src/pages/design/blog tests/design tests/unit/design tests/e2e/design-blog.a11y.spec.ts
git fetch origin main
git checkout origin/main -- astro.config.mjs
```

Edit `docs/design/blog.md` so preview links read "(removed after review; see the pictures)".
Re-run step 3. Expected: green; `git diff origin/main --stat` lists only `docs/design/blog.md`,
`docs/design/blog/*.jpg` and `specs/005-blog-design-directions/*`.
