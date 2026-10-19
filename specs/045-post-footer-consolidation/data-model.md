# Data model: One footer block at the end of posts

No stored data, schema or content change. The block is rendered from values that already exist.

## Post footer block (`div[data-post-footer]`, `PostFooter.astro`)

| Input | Source | Used by |
|-------|--------|---------|
| `topics` | the post's frontmatter topics (`PostSummary.topics`) | author part: series link via `seriesOf()` |
| `title` | `PostSummary.title` | share part: share links and `data-share-title` |
| `href` | `PostSummary.href`, made absolute with `Astro.site` | share part: share links and `data-share-url` |
| author name, photo, alt, lines | `blog.author` in `src/config/blog.ts` (unchanged) | author part |
| views note wording | `blog.viewsNote` in `src/config/blog.ts` (unchanged) | views note |

Props: `{ topics: readonly string[]; title: string; href: string }`.

### Parts and order (DOM order = reading order, FR-014)

1. Author part `section[data-author-card]`
   1. text column: `h2` "Written by {name}", two `p` lines, `ul` of three links, `p[data-views-note]`
   2. photo `img` (last in the DOM, shown first visually with `order-first`)
2. Share part `section[data-share]` (its top border is the divider): `h2` "Share this post", two
   links, hidden `button`

### Rules

- Exactly one block per post page, inside the `<article>`, as its last child; none on any other page
  or in the feed (FR-001, FR-002).
- Exactly one `[data-views-note]`, `[data-author-card]` and `[data-share]` per post page, all inside
  the block.
- No state, no transitions. The only runtime change is the Share button's `hidden` attribute,
  cleared by the existing script when `navigator.share` exists.
