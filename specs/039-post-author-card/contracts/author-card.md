# Contract: Author card (post page DOM)

**Feature**: `039-post-author-card` | **Plan**: [../plan.md](../plan.md)

The card is part of the post page's HTML contract (`specs/008-blog/contracts/blog-pages.md`
"Post"). Rows are numbered `A1`... so tests can cite them.

## Placement

| Row | Rule |
|-----|------|
| A1 | Every post page has exactly one `section[data-author-card]`; no other page has one (FR-001, FR-013, SC-001). |
| A2 | It is a direct child of the post's `<article>`, after the views note wrapper and before `section[data-share]`. End-of-post DOM order: body, views note, author card, Share area; Related posts follow the article (FR-001). |
| A3 | Its left and right edges equal the title card's (`[data-title-card]`) within 1 px at 320, 375, 768, 1024 and 1440 px, with and without the questions panel (FR-011). |

## Content

| Row | Rule |
|-----|------|
| A4 | One `h2` whose text is `Written by {blog.author.name}`; the `h2` contains no link (FR-002, FR-008). |
| A5 | One `img` with `alt` = `blog.author.photoAlt`, `width`/`height` 96, a `srcset` with 1x and 2x WebP, `loading="lazy"`; the 2x file is at most 20 KB (FR-010c, FR-014, FR-014a). |
| A6 | Two `p` elements whose text is `blog.author.lines[0]` and `[1]`, in order (FR-002, FR-003). |
| A7 | One `ul` with exactly three links, in order: the writing link, `More about me` (`/about/`), `Get in touch` (`/contact/`). No link has an `aria-label`; each accessible name is its visible text (FR-007, FR-008, FR-008a). |
| A8 | Writing link: post in series `s` → text `More in {series name}`, `href` `/writing/{s}/`; post in no series → text `More of my writing`, `href` `/writing/`. Never both (FR-005, FR-006). |
| A9 | The card contains no `script`, no `button` and no `hidden` element. The `section` has no `aria-label`, `aria-labelledby` or `role` (FR-009, FR-010a). |

## Layout and accessibility

| Row | Rule |
|-----|------|
| A10 | Below 768 px: photo above the heading, photo, heading, lines and links centred (`text-align: center`), no horizontal page scroll at 320 px. |
| A11 | From 768 px: photo left of the text block, text left-aligned. |
| A12 | Every card link has a target of at least 24 x 24 px (WCAG 2.5.8) and the post templates pass the automated accessibility scan in light and dark themes (FR-010, SC-005). |
| A13 | The About and Contact pages are visible, so both links resolve on the production build (covered by the existing site-link crawl). |
| A14 | DOM (reading) order inside the card: `h2`, the two `p`, the `ul` of links, then the `img`; the photo is placed first visually by CSS only. The card has no `time` element, no topic pill and no post title or summary (FR-010b, FR-012a). |
| A15 | In forced-colours mode the card keeps a visible border in the system text colour, and its text, link underlines and focus indicator stay visible, in both themes (FR-010g). |
