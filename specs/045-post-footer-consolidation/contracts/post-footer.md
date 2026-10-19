# Contract: post footer block

The end of every post's `<article>`. Replaces the end-of-post items 5, 5a and 6 of
`specs/008-blog/contracts/blog-pages.md` ("Post") and the placement rules of
`specs/039-post-author-card/contracts/author-card.md` (rows A2, A3); the card's content rows
(A4 to A9, A14) still hold.

## Markup (outline)

```text
article
  … title card, body/questions row …
  div[data-post-footer]   title-card box: rounded-xl border bg p-6 shadow-sm; mt-10; no role, no aria-*
    section[data-author-card]   no box of its own; flex-col centred, md: row, text-left
      div (text column)
        h2  "Written by {author.name}"
        p   line 1
        p   line 2
        ul  three links (writing link, "More about me", "Get in touch")
        p[data-views-note]   text-sm italic, dusk-600 / dusk-300, mt-4, no border
      img (96 x 96, order-first)
    section[data-share data-share-title data-share-url]   mt-6 border-t pt-6; no bg, no radius, no side borders
      h2  "Share this post"
      div  "Share on LinkedIn", "Share by email", button[hidden] "Share"
section[data-related]   (outside the article, unchanged, mt-10)
```

## Rows

| Row | Rule | Spec |
|-----|------|------|
| F1 | Every post page has exactly one `[data-post-footer]`, the last element child of the `<article>`; no other page and not the feed has one. | FR-001, FR-002, SC-001 |
| F2 | `[data-views-note]`, `[data-author-card]` and `[data-share]` each appear exactly once on a post page, all inside `[data-post-footer]`, in that DOM order for author card then share; the views note is inside the author card's text column after its `ul` and before its `img`. | FR-001, FR-003, FR-014 |
| F3 | The wrapper is a `div` with no `role`, `aria-label` or `aria-labelledby`; both parts are `section`s without them; no `<footer>`, `<aside>` or `<hr>` is added. Heading levels: both `h2`. | FR-013 |
| F4 | The wrapper carries the title card's box (border colour, background, radius, padding, shadow) in both themes; `[data-author-card]` and `[data-share]` have no background image, no radius, and no border except the share part's top border. | FR-004 |
| F5 | The share part's top border uses the box's border colour; the space from the bottom of the author part to the divider and from the divider to the share part's content are each 24 px (±1) at the default text size; the views note has no top border. | FR-005 |
| F6 | The wrapper's left and right edges equal the title card's within 1 px at 320, 375, 768, 1024 and 1440 px, with and without the questions panel. | FR-006, SC-002 |
| F7 | Wrapper top minus the bottom of its previous sibling, and the "Related posts" heading's top minus the wrapper's bottom, are each 40 px (±1) at 375 and 1440 px. | FR-007, SC-003 |
| F8 | Below 768 px: photo above centred author text, views note, share heading and centred share links. From 768 px: photo left of left-aligned author text; views note left-aligned and starting at the author text's left edge; share heading's left edge at the box's inner left edge (the photo's left edge, ±1 px); share links right-aligned on the same row, vertically centred with the heading. | FR-008 |
| F9 | Views note: `font-size` smaller than the author lines', italic; contrast against the box ≥ 4.5:1 in both themes (axe). | FR-003, FR-015, SC-004 |
| F10 | Links, Share button and script behaviour unchanged (specs/039 A7, A8; 008 Share rules); no new script, inline style or external resource; `public/_headers` unchanged. | FR-009 to FR-011, SC-005 |
| F11 | With scripts off, every part of the block is present and both share links work. | FR-012 |
| F12 | Forced colours: the wrapper's border, the divider, the views note and all links are visible. | FR-015 |
