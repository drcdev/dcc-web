# Contract: blog addresses and page structure

What each blog page must contain, for component, E2E, accessibility and visual tests. Visual
design follows Direction A (`docs/design/blog.md` and its pictures) using only existing tokens.
Every page is prerendered, uses `BaseLayout` (skip link, header, one `<main>`, footer), has one
`h1`, no skipped heading levels, advertises the feed in `<head>`, marks "Writing" as current in
the header, and works without JavaScript.

## Addresses

| Page | Address | Exists when |
|---|---|---|
| Landing | `/writing/` | always |
| All posts, page 1 | `/writing/all/` | always |
| All posts, page N ≥ 2 | `/writing/all/{n}/` | N ≤ last page |
| Topic, page 1 | `/writing/topics/{topic}/` | for every topic in the list |
| Topic, page N ≥ 2 | `/writing/topics/{topic}/{n}/` | N ≤ that topic's last page |
| Post | `/writing/{slug}/` | the post is visible in this build |
| Feed | `/writing/rss.xml` | always |

`/writing/all/1/`, `/writing/topics/{topic}/1/`, pages past the last, unknown topics and
unknown slugs return the site's not-found page with status 404. No redirects (FR-005).

## Header navigation

- The "Writing" link is `/writing/`. On `/writing/` it has `aria-current="page"`; on every other
  blog address it has `aria-current="true"`; both show the current style (FR-004).

## Head (every blog page)

- `<link rel="alternate" type="application/rss+xml" title="Drift & Convergence" href="{site}/writing/rss.xml">`.
- Canonical and `og:url` for the page's own address; listings page N canonicalise to themselves.
- Post pages add `og:type=article`, `article:published_time`, `article:modified_time` (when
  updated), `og:image` + alt from the feature image when present (FR-030).

## Post card (`PostCard`)

```text
<article data-post-card [data-featured] [data-text-only]>
  [image, when the post has one: <img alt="{featureImage.alt}">]
  <h2|h3><a href="/writing/{slug}/">{title}</a></h2|h3>     (level fits the page outline)
  <p>{summary}</p>
  [<span data-featured-mark>Featured</span>]
  <time datetime="YYYY-MM-DD">{Month D, YYYY}</time> · {n} min read
  <ul aria-label="Topics"> <li><a href="/writing/topics/{id}/" data-topic-pill>{name}</a> … </ul>
</article>
```

- Without a feature image: no image element or empty box; `data-text-only`; border in the main
  topic's colour (FR-011).
- Titles and addresses wrap; the card never causes sideways scrolling at 320 px.

## Topic pill row (`TopicPillRow`)

`<nav aria-label="Topics">` with one pill link per topic in list order, then an "All posts" link
to `/writing/all/`. Shown on the landing page (under the lead story) and on `/writing/all/`
pages; not on topic pages (FR-007, FR-012, FR-013).

## Landing `/writing/`

In order:

1. Eyebrow "Drift & Convergence", then `<h1>Writing</h1>`; a visible "Subscribe (RSS)" link to
   the feed (FR-010).
2. Lead story (`data-lead-story`): the newest visible post, large; its feature image when it has
   one (eager, `fetchpriority="high"`), otherwise a text-only card bordered in its main topic
   colour; title (`h2`) links to the post; summary, date, reading time, pills.
3. Topic pill row.
4. `<h2>Featured</h2>` + bento grid (`data-featured-grid`) of 1–3 cards, all marked Featured,
   never the lead story. Left out entirely when empty. Layout suits 1, 2 or 3 cards; no
   full-width fourth card.
5. `<h2>Latest</h2>` + grid (`data-latest-grid`) of up to 6 cards not already shown, then a link
   "All posts" to `/writing/all/`. Left out when empty (the "All posts" link stays in the pill
   row).
6. With no visible posts: a plain message "There are no posts yet." instead of 2–5 (the pill
   row still shows).

## All posts `/writing/all/[n/]`

`<h1>All posts</h1>` (page N ≥ 2: "All posts, page N"), the topic pill row, a card grid of up
to 12 posts newest first, and pagination. No posts: "There are no posts yet."

## Topic `/writing/topics/{topic}/[n/]`

Introduction banner (`data-topic-banner`) in the topic's colour: `<h1>{topic name}</h1>` and the
description (AA contrast in both themes). Then the card grid and pagination. No pill row. No
posts: "There are no posts on this topic yet." with a link to all posts (FR-013, FR-014).

## Pagination (`Pagination`)

`<nav aria-label="Pages">` with "Previous" and "Next" links where they exist and one link per
page number; the current page is a link-free item with `aria-current="page"`. Left out when
there is only one page.

## Post `/writing/{slug}/`

In order (FR-019–FR-030):

1. Hero feature image (only when the post has one), full width, its alt text.
2. Title card, overlapping the hero when there is one: eyebrow "Drift & Convergence", `<h1>`,
   summary, Featured mark (when featured), `<time>` publication date, "Updated {date}" in its
   own `<time>` when updated, "{n} min read", topic pills.
3. Draft notice (`data-draft-notice`) when the post is a draft (never in production).
4. Body in `prose dark:prose-invert prose-accent`: headings from `h2`; `Figure`/`WideImage`/
   `FullImage`; code blocks (below); tables (below).
5. Views note (`data-views-note`): the text from `src/config/blog.ts`, identical on every post.
6. Share (`data-share`): heading "Share this post"; always a LinkedIn link and an email link
   (visible text, work without scripts); a `button` "Share" that is `hidden` until a script
   finds `navigator.share`.
7. Related posts (`data-related`): `<h2>Related posts</h2>` + up to 3 cards (R5); left out when
   there are no other posts.

### Code block (`CodeBlock`, replaces `pre`)

```text
<figure class="code-card" data-code-block>
  <copy-code> <button type="button" hidden class="js:inline-flex">Copy code</button>
              <span role="status" class="sr-only"></span> </copy-code>
  <pre class="astro-code" tabindex="0" data-language="{lang}"> … <span class="hl-*"> … </pre>
  [<figcaption>{caption}</figcaption>]
</figure>
```

- No `style` attribute anywhere inside; no CSP violation on the page.
- Line breaks and indentation kept; long lines scroll inside the `pre`, never the page.
- Copy: clipboard gets the code exactly; status and button text say "Copied" or
  "Copy failed. Select the code to copy it."; reset after 2 s.
- Without scripts: the button is not shown; the code is readable and selectable.

### Table (`ScrollTable`, replaces `table`)

`<div class="table-wrapper" role="region" aria-label="{caption or 'Table'}" tabindex="0"><table>…</table></div>`;
the region scrolls sideways at phone width; the page does not.

## Home page section (`RecentWriting`)

After the home body: `<section aria-labelledby>` with `<h2>Recent writing</h2>`, the 3 newest
visible posts as `PostCard`s in a grid of 3 across from the `md` breakpoint, and a link
"All writing" to `/writing/`. Not rendered when there are no visible posts (FR-038).
