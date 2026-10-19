# Feature Specification: One footer block at the end of posts

**Feature Branch**: `045-post-footer-consolidation`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Consolidate post footer modules (Views note, Author card, Share area) (GitHub issue #185). At the bottom of every blog post four separate blocks are stacked: the views note (a lone italic line with a top border), the author card (a white or dark card), the Share area (a gradient card with a different border and padding) and the Related posts grid. The step from the end of the post text to the related posts feels cluttered and fragmented because the blocks use different backgrounds, borders and margins. Fold the views note into the author card as a discreet caption line, give the author card and the Share area one shared look (corners, border colour, padding), and separate the author and share block from Related posts with consistent spacing. Acceptance: the end of the post reads as one well-structured author and sharing footer; the views note stays legible and meets WCAG AA contrast; share and author links keep all their behaviour and stay within the content security policy; the visual order leads smoothly into Related posts."

## Background

Today the end of every post, after the post text, is four pieces in a column:

1. **Views note**: one centred (left-aligned from 768 px) italic sentence, "The views in this post
   are my own and do not represent any employer or client.", with a thin rule above it.
2. **Author card** (specs/039-post-author-card): a white card in light mode and a dark card in dark
   mode, using the post title card's box (border, rounded corners, padding, shadow), with the
   heading "Written by Don Coleman", a round photo, two first-person lines, and three links
   ("More in {series}" or "More of my writing", "More about me", "Get in touch").
3. **Share area** (specs/035-share-area-width): a box with a rust-tinted gradient background, a
   rust border, smaller corners and smaller padding, holding the heading "Share this post" and the
   links "Share on LinkedIn", "Share by email" and (only on devices that offer it, when scripts
   run) a "Share" button.
4. **Related posts**: up to three post cards under the heading "Related posts", outside the
   article.

Each of the first three has its own border, background, corner radius, padding and top margin, so
the end of a post reads as three unrelated scraps before the Related posts grid. This feature makes
the views note, the author card and the Share area one footer block with one look, and gives the
step from that block to Related posts a clear, consistent space. What each piece says and does
does not change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The end of a post reads as one footer (Priority: P1)

A reader finishes a post and scrolls on. Below the post text they meet one footer block: who wrote
the post, the "views are my own" note as a small caption, and the ways to share the post, all in
one box with one border and one background. Below that block, after a clear gap, come the Related
posts.

**Why this priority**: This is the problem the issue names. On its own it removes the cluttered,
fragmented look at the end of every post.

**Independent Test**: Open any published post with Related posts, in light and dark themes, at
375 px and 1440 px. Confirm that the author content, the views note and the share links sit inside
one bordered box, that there is no separate views-note line and no separate gradient Share box,
and that the Related posts heading follows after the footer's standard gap.

**Acceptance Scenarios**:

1. **Given** any post, **When** the reader scrolls past the post text, **Then** they see exactly
   one footer block holding, in order, the author content, the views note and the share content,
   and no views note, author card or Share area outside it.
2. **Given** the footer block, **When** the reader looks at it, **Then** it has one outer border,
   one background and one corner radius, matching the post title card's box in both themes, and
   the author part and the share part are separated by a thin divider inside the box rather than
   by a gap between two boxes.
3. **Given** a post with Related posts, **When** the reader looks at the end of the page, **Then**
   the gap between the footer block and the "Related posts" heading is the same as the gap between
   the end of the post text and the footer block.
4. **Given** a reader with JavaScript turned off, **When** they open a post, **Then** the whole
   footer block, its views note and all its links are present and work.

---

### User Story 2 - The views note is still there and easy to read (Priority: P1)

A reader, or someone checking Don's posts for an employer, looks for the statement that the views
are Don's own. It is there on every post, inside the footer block, as a small caption under the
author's details, and it is easy to read in both themes.

**Why this priority**: The note is a stated requirement for every post (it was FR-027 of the blog
feature). Folding it into the card must not make it harder to find or read.

**Independent Test**: Open any post in light and dark themes; confirm the note's exact wording
appears once, inside the footer block, under the author's links and above the share content, and
measure its contrast against the box background.

**Acceptance Scenarios**:

1. **Given** any post, **When** the reader reads the footer block, **Then** the views note appears
   exactly once on the page, with its current wording unchanged, inside the author part of the
   block after the author's links.
2. **Given** either theme, **When** the views note's contrast is measured against the block's
   background, **Then** it is at least 4.5:1.
3. **Given** a screen reader user, **When** they read through the footer block, **Then** the views
   note is read as an ordinary paragraph (not hidden, not a heading, no special role), after the
   author's lines and links and before the "Share this post" heading.

---

### User Story 3 - Author and share links work as before (Priority: P2)

A reader uses the footer to read more of Don's writing, learn about him, get in touch or share the
post. Every link and the Share button do exactly what they did before.

**Why this priority**: The change is visual. Breaking a link or the Share button would be a
regression, but the links already exist and are tested.

**Independent Test**: From a Drift post, a Convergence post and a post in no series, follow each
author link and each share link; on a device with the system share feature, use the Share button.

**Acceptance Scenarios**:

1. **Given** any post, **When** the reader uses the author links, **Then** they reach the same
   destinations with the same link texts as before (specs/039-post-author-card FR-005 to FR-008a).
2. **Given** any post, **When** the reader uses "Share on LinkedIn" or "Share by email", **Then**
   they get the same share addresses as before, carrying the post's title and address.
3. **Given** a device that offers the system share feature and scripts running, **When** the reader
   presses "Share", **Then** the system share sheet opens with the post's title and address; on a
   device without it, or with scripts off, the button stays hidden and the two links still work.
4. **Given** the page's content security policy, **When** the post loads, **Then** the footer adds
   no inline script, inline style, third-party resource or tracking, and the policy is unchanged.

---

### Edge Cases

- A post with no Related posts: the page ends with the footer block; nothing else changes, and the
  block's own top gap is unchanged.
- A post with the questions panel: the footer block spans the full article width (the title card's
  edges), under both the post text and the panel from 1280 px, as the three pieces do today.
- A draft post (seen only on previews): the footer block appears exactly as on a published post.
- A post in no series: the author part shows "More of my writing"; the rest of the block is the
  same.
- Phone-width screens: below 768 px the author content, the views note and the share content are
  centred and stacked; nothing scrolls sideways at 320 px or at 200% text zoom.
- The photo fails to load: the alt text shows in the photo's reserved square; the views note and
  the share part do not move.
- The Share button appears after scripts run: it joins the end of the share link row, as today, and
  moves nothing vertically; the views note and the author part do not shift.
- Long text: a long series name, a revised author line or a revised views note wraps; nothing is
  truncated or hidden.
- Forced-colours (high-contrast) mode: the block's outer border, the divider between the author
  and share parts, the views note and all links stay visible in system colours.

## Requirements *(mandatory)*

### Functional Requirements

**Structure and order**

- **FR-001**: Every post page MUST end its article with exactly one footer block that holds, in
  this order, the author part (heading "Written by Don Coleman", photo, two lines, three links),
  the views note, and the share part (heading "Share this post", the share links and the
  conditional Share button). The end-of-post order is: post text, footer block, Related posts
  (when the post has any). It is the same on every post, with or without the questions panel,
  with or without Related posts, published or draft.
- **FR-002**: There MUST be no views note, author card or Share area anywhere on a post page
  outside the footer block, and no other page gains any of them (specs/039-post-author-card
  FR-013 still holds).
- **FR-003**: The views note MUST sit inside the author part, after the author's links and before
  the divider to the share part, as a small caption line in the style of a secondary note (smaller
  than the author lines; it may stay italic). Its wording MUST stay exactly as it is today and stay
  in the one blog-settings place it comes from now.

**Look**

- **FR-004**: The footer block MUST have one outer box using the post title card's box style in
  both themes (border colour, background, corner radius, padding and shadow, as the author card
  uses today). The share part MUST NOT have its own separate box, gradient background, border or
  corner radius; it sits in the same box as the author part.
- **FR-005**: The author part and the share part MUST be separated by one thin horizontal divider
  inside the box, using the box's border colour, spanning the box's inner width. The space above
  and below that divider MUST be equal. The views note has no rule of its own above it.
- **FR-006**: The footer block's left and right edges MUST equal the post title card's within 1 px
  at 320, 375, 768, 1024 and 1440 px, with and without the questions panel (as 035 and 039 require
  of the pieces today).
- **FR-007**: The gap from the end of the post text to the footer block's top edge and the gap from
  the footer block's bottom edge to the "Related posts" heading MUST be equal, within 1 px, at 375
  and 1440 px.
- **FR-008**: Alignment by width MUST stay as today: below 768 px the photo sits centred above the
  author text and the author text, views note, share heading and share links are centred; from
  768 px the photo sits left of the author text, the author text and views note are left-aligned,
  and the share heading sits left with the share links right, on one row and vertically centred.
  The views note lines up with the author text (not under the photo) from 768 px.
- **FR-009**: The share links and the Share button MUST keep their current appearance (rust
  outlined pills), size, order and text. The author links MUST keep their current plain
  underlined style and text.

**Behaviour**

- **FR-010**: Every author link and share link MUST keep its current destination, text and
  accessible name, and the Share button its current behaviour (hidden in the delivered page, shown
  and working only when scripts run on a device that offers the system share feature).
- **FR-011**: The change MUST add no client-side script beyond the Share button's existing
  bundled script, no inline script or style, no third-party resource and no tracking. The site's
  header contract and content security policy MUST stay unchanged.
- **FR-012**: With JavaScript turned off, the delivered page MUST contain the whole footer block:
  both headings, the photo with its alt text, both author lines, the three author links, the views
  note and the two share links.

**Accessibility**

- **FR-013**: The footer block MUST meet WCAG 2.2 AA in light and dark themes at every width from
  320 px. "Written by Don Coleman" and "Share this post" MUST stay level-2 headings, siblings of
  "Related posts". The block adds no landmark and no accessible name of its own.
- **FR-014**: Reading order MUST be: author heading, the two author lines, the three author links,
  the photo, the views note, the "Share this post" heading, the share links, the Share button (when
  shown). Keyboard order: the three author links, then the share links and the Share button, in
  that order, with nothing focusable added.
- **FR-015**: The views note text, both headings, the author lines and all link text MUST each have
  at least 4.5:1 contrast against the block's background in both themes, in normal and hover
  states; focus indicators at least 3:1. The divider and the outer border are decorative and need
  no minimum contrast, but MUST remain visible in forced-colours mode.
- **FR-016**: Link targets stay at least 24 by 24 CSS px and the share controls keep their current
  minimum height; focused controls are never entirely hidden by the sticky header.

**Performance and look elsewhere**

- **FR-017**: The post page MUST stay within the site's performance budget, add no layout shift and
  add no bytes of JavaScript.
- **FR-018**: Only post pages change appearance. The post-page visual baselines are refreshed in
  the same change (macOS and Linux); every other visual baseline stays the same.
- **FR-019**: No site copy added by this feature states Don's job title (the About page is the only
  place that does).

### Out of scope (follow-up)

- Changing the views note wording, the author card's wording, photo or links, or the set of share
  services.
- Changing the Related posts section's heading, cards or width.
- Adding a footer block to project stories or any other page.
- Adding share counts, analytics events or any tracking to the share links.

### Key Entities

- **Post footer block**: the one box at the end of each post's article, made of the author part
  (with the views note as its caption) and the share part. Its content comes from the existing
  blog settings (author name, photo, alt text, lines, views note wording) and from the post (title,
  address, series).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every post, the end of the article has exactly 1 bordered box after the post text
  (down from 3 separate pieces with 2 different box styles), and the views note appears exactly
  once, inside it.
- **SC-002**: The footer block's edges match the title card's within 1 px at 320, 375, 768, 1024
  and 1440 px, with and without the questions panel.
- **SC-003**: The gap above the footer block and the gap between it and the "Related posts" heading
  differ by at most 1 px at 375 and 1440 px.
- **SC-004**: The views note measures at least 4.5:1 contrast against the block background in
  both themes, and the post page passes the site's automated accessibility check with no new
  violations and no sideways scroll at 320 px.
- **SC-005**: Every author link and share link reaches the same address as before on a Drift post,
  a Convergence post and a post in no series, and the content security policy and JavaScript size
  of the post page are unchanged.
- **SC-006**: Only post-page visual baselines change; all others stay byte-for-byte the same.

## Assumptions

- "A single, well-structured author and sharing footer block" is read as one box holding both
  parts with an internal divider, rather than two matching boxes stacked with a gap. One box removes
  the most clutter and is the plainest reading of "single block"; the clarify phase may revisit
  this.
- The block takes the author card's current look (the title card's box), not the Share area's
  gradient, because it then echoes the title card at the top of the post and keeps the site's
  existing visual language (specs/039-post-author-card FR-012).
- The views note sits after the author links, not between the author lines and links, so it reads
  as a caption to the author part and does not split the author's details from his links.
- "Consistent vertical spacing" is read as the same gap above and below the footer block, using a
  spacing step the site already uses (today the pieces use 2 rem and Related posts 2.5 rem).
- "Analytics compliance" means the share links stay free of tracking: the site uses only
  privacy-focused analytics or none (Principle X), and the share links carry no tracking today.
- The headings "Written by Don Coleman" and "Share this post" stay visible; merging them into one
  heading would change copy and the page outline, which the issue does not ask for.
- Tests that check the views note, the author card and the Share area today are updated to the new
  structure in this change; behaviour they check (wording, links, Share button) stays the same.
