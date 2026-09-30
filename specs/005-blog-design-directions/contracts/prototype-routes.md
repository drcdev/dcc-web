# Contract: prototype routes and page furniture

**Feature**: 005-blog-design-directions | Research R1, R2, R3, R9

All prototype pages are prerendered static pages under `/design/blog/`, built from
`src/pages/design/blog/`. They exist only on this feature's branch and its preview deployment
(removed before merge, research R10).

## Route files

```text
src/pages/design/blog/
├── index.astro                       → /design/blog/                 directions index
├── _data/samples.ts                  (not routed) topics, posts, directions, helpers
├── _components/                      (not routed) PrototypeNotice, SampleBody, per-direction pieces
├── _images/                          (not routed) five SVG sample illustrations
├── a/
│   ├── index.astro                   → /design/blog/a/               landing
│   ├── all/[...page].astro           → /design/blog/a/all/, /all/2/, /all/3/   listing (paginate, size 5)
│   ├── topics/[topic].astro          → /design/blog/a/topics/{topic}/          topic listing
│   └── [slug].astro                  → /design/blog/a/{slug}/                  post page
├── b/                                (same four files and shapes as a/)
└── c/
    ├── index.astro                   → /design/blog/c/
    ├── all/[...page].astro           → /design/blog/c/all/, /all/2/, /all/3/
    ├── [topic].astro                 → /design/blog/c/{topic}/                 topic hub
    └── [year]/[slug].astro           → /design/blog/c/{year}/{slug}/           post page
```

Topic slugs never start with a digit and years are four digits, so `c/[topic].astro` and
`c/[year]/[slug].astro` cannot claim the same address. Post slugs never equal `all` or
`topics` (checked by the unit test).

## Proposed real-blog addresses (FR-012)

| Page | A. Front page | B. Timeline | C. Topic hubs |
|---|---|---|---|
| Landing | `/writing/` | `/writing/` | `/writing/` |
| All posts, page 1 | `/writing/all/` | `/writing/all/` | `/writing/all/` |
| All posts, page N | `/writing/all/{n}/` | `/writing/all/{n}/` | `/writing/all/{n}/` |
| Topic | `/writing/topics/{topic}/` | `/writing/topics/{topic}/` | `/writing/{topic}/` |
| Post | `/writing/{slug}/` | `/writing/{slug}/` | `/writing/{year}/{slug}/` |

Prototype address = `/design/blog/{direction}` + the part after `/writing`.

## Pages the tests cover (per direction; 7 × 3 + index = 22 pages)

| Name | A | B | C |
|---|---|---|---|
| landing | `/design/blog/a/` | `/design/blog/b/` | `/design/blog/c/` |
| listing, first page | `/design/blog/a/all/` | `/design/blog/b/all/` | `/design/blog/c/all/` |
| listing, last page | `/design/blog/a/all/3/` | `/design/blog/b/all/3/` | `/design/blog/c/all/3/` |
| topic, several posts | `/design/blog/a/topics/agentic-ai-legacy/` | `/design/blog/b/topics/agentic-ai-legacy/` | `/design/blog/c/agentic-ai-legacy/` |
| topic, one post | `/design/blog/a/topics/healthcare-leadership/` | `/design/blog/b/topics/healthcare-leadership/` | `/design/blog/c/healthcare-leadership/` |
| post with image | `/design/blog/a/{full-with-image slug}/` | `/design/blog/b/{…}/` | `/design/blog/c/{year}/{…}/` |
| post without image | `/design/blog/a/{full-no-image slug}/` | `/design/blog/b/{…}/` | `/design/blog/c/{year}/{…}/` |

Plus `/design/blog/` (index). The slugs are taken from `samples.ts` by the spec, not
hard-coded twice.

## Every prototype page MUST

1. Render inside `BaseLayout` with `navigation={await getNavigation()}` (unchanged header and
   footer; nothing added to navigation).
2. Pass `noindex` and `canonical={false}` to the SEO props, and a title starting with
   `Prototype` (for example `Prototype A · Topic: Agentic AI in legacy environments`).
3. Open `main` with the `PrototypeNotice`: a short bordered note, "Design prototype for review.
   This is not the published blog.", with links to the directions index and to the same screen
   in the other two directions.
4. Present the blog as "Drift & Convergence" (FR-022).
5. Contain exactly one `h1` and no skipped heading levels.
6. Ship no client-side JavaScript beyond the site's existing theme and menu scripts; any
   disclosure uses `<details>`/`<summary>` (Principle V, FR-015).
7. Use no inline `style` attributes and no `define:vars` (CSP, research R4 and R5).
8. Link only to addresses that exist in the build (other prototype pages, the site's own
   pages). No link to `/writing/…`; proposed addresses appear as text, not links.

## Every post presentation (card, list row, timeline entry, post header) MUST show

Title (linked, except in the post's own header), date (`<time datetime>`), reading time,
topics (each linked to that direction's topic page) and summary (FR-009). Featured posts carry
a visible text marker ("Featured"), not colour alone.

## Landing page MUST

- Show the newest posts within the first desktop viewport and the first two phone viewports.
- Set featured posts apart (direction-specific, see data-model.md).
- Link to the listing and to every topic page.

## Listing page MUST

- Show posts newest first, 5 per page.
- Show pagination controls in a `<nav aria-label="Pagination">`, with the current page marked
  `aria-current="page"`; the first page has no "Newer"/"Previous" link and the last page no
  "Older"/"Next" link (edge case).
- For a topic: name the topic in the `h1`, show its introduction above its posts, and link to
  the other topics and to all posts (FR-008).

## Post page MUST

- Show title, date, reading time, topics and summary in its header.
- Render the sample body (image with caption, code sample, table; FR-010).
- End with a "Related posts" section of three posts (FR-011).
- Keep the page free of horizontal scroll at 320 px: the table and code block scroll inside
  their own focusable regions.

## Directions index (`/design/blog/`) MUST

List the three directions with name, one-paragraph summary and links to each direction's
landing, listing and a post page (SC-004: every screen within two clicks).
