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

## Clarifications

### Session 2026-10-19

- Q: Should the author part and the share part sit in one box with a thin line between them, or in two boxes that look the same? → A: One box, with a thin divider between the author part and the share part.
- Q: Where should the views note go? → A: In the author part, under the three author links and above the divider to the share part.
- Q: How should the views note look? → A: Small italic grey text, smaller than the author lines, meeting AA contrast.
- Q: How big should the space between the footer box and the "Related posts" heading be? → A: The same gap above and below the box, about 40 px (2.5 rem, the larger of today's two spacings).
- Q: From 768 px up, where should the "Share this post" heading start? → A: At the box's left edge, in line with the photo, with the share links on the right.
- Q: How much space should be above and below the divider between the author part and the share part? → A: 1.5 rem (about 24 px) each side, the same as the box's inner padding.
- Q: Should the photo's description be read before or after the views note? → A: After it: author heading, lines, links, views note, photo description, then "Share this post".

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
   author's lines and links, before the photo's description and the "Share this post" heading.

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
   they get the same share addresses as before: the LinkedIn address carries only the post's
   address, and the email address carries only the post's title (subject) and address (body).
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
  edges), under both the post text and the panel from 1280 px, as the three pieces do today. A post
  without the panel: the block spans the same full article width (the title card's edges) at every
  width. The sticky panel sits beside the post text, never over the block.
- A draft post (seen only on previews): the footer block appears exactly as on a published post.
- A post in no series: the author part shows "More of my writing"; the rest of the block is the
  same.
- Phone-width screens: below 768 px the author content, the views note and the share content are
  centred and stacked; nothing scrolls sideways at 320 px or at 200% text zoom (FR-016a).
- The photo fails to load: the alt text shows in the photo's reserved square; the views note and
  the share part do not move. The alt text comes from the blog settings and is never empty, so a
  screen reader announces the same description whether or not the image loads.
- The Share button appears after scripts run: it joins the end of the share link row, as today, and
  moves nothing vertically; the views note and the author part do not shift. Its appearance never
  moves keyboard focus, scrolls the page or interrupts a screen reader (it is not announced as a
  live change).
- Long text: a long series name, a revised author line or a revised views note wraps at word
  boundaries onto as many lines as it needs (no line limit), and a long word with no break point
  breaks inside the box; nothing is truncated, ellipsised, hidden or pushed past the box's edge.
- Forced-colours (high-contrast) mode: each of these stays visible in system colours: the block's
  outer border, the divider between the author and share parts, the views note, the two headings,
  the author lines, the three author links (with their underline), the share pills' outlines and
  text, and the focus indicator on every link and button.
- Reduced motion: the block adds no animation, transition or scroll effect; the only state change
  is the links' existing hover colour, which is instant.
- Print: this feature sets no print rules for the block; it prints with the site's existing print
  styles (excluded from scope).

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
  the divider to the share part, as a small caption line: italic, grey and smaller than the author
  lines. Its colour is the site's secondary caption colour it uses today (the theme's `dusk-600` on
  the light box, `dusk-300` on the dark box), with at least 4.5:1 contrast (FR-015). Its size is
  0.875 rem (14 px at the default text size), its size today: smaller than the author lines' 1 rem
  and never below 0.875 rem. Its wording MUST stay exactly as it is today and stay in the one
  blog-settings place it comes from now. The italic and small size are presentation only: the note
  stays one plain paragraph (US2 scenario 3).

**Look**

- **FR-004**: The footer block MUST have one outer box using the post title card's box style in
  both themes, as the author card uses today. These values are the requirement (they equal the
  title card's today; a later change to the title card does not change them without its own spec):
  a 1 px solid border in `dusk-200` (light) / `dusk-700` (dark); a solid background of `white`
  (light) / `dusk-800` (dark); a 0.75 rem corner radius; 1.5 rem inner padding on all sides; and
  the small card shadow. The share part MUST NOT have its own separate box: in both themes its
  gradient (light `rust-50` to `white`, dark `rust-800` to `dusk-700`), its border (light
  `rust-200`, dark `dusk-600`), its 0.5 rem corner radius and its 1 rem padding are removed; it
  sits in the same box as the author part. The author part likewise has no box of its own.
- **FR-005**: The author part and the share part MUST be separated by one horizontal divider inside
  the box, 1 px solid, in the box's border colour (`dusk-200` light / `dusk-700` dark), spanning
  the box's inner width (padding edge to padding edge). The space above and below that divider MUST
  be equal, 1.5 rem (24 px at the default text size) each, the same as the box's inner padding
  (FR-004). "Above" is measured from the bottom of the author part's content (the views note, the
  last thing in it at every width) to the divider; "below" from the divider to the top of the share
  part's content (the "Share this post" heading below 768 px; from 768 px the top of the row holding
  the heading and the share links). The views note has no rule of its own above it.
- **FR-006**: The footer block's left and right edges MUST each equal the post title card's within
  1 px at 320, 375, 768, 1024 and 1440 px, with and without the questions panel (as 035 FR-001 and
  039 require of the pieces today). The 1 px allows for sub-pixel rounding of layout values; the
  edges are designed to be identical, so any larger difference is a defect. The rule holds at every
  width; the five listed widths are the ones tests sample.
- **FR-007**: The gap from the end of the post text to the footer block's top edge and the gap from
  the footer block's bottom edge to the "Related posts" heading MUST be equal, and both MUST be
  2.5 rem (40 px at the default text size), the larger of the two spacings the post end uses today.
  "The end of the post text" is the bottom edge of the block that holds the post body and, when
  present, the questions panel (from 1280 px, the taller of the two columns), not the last line of
  text inside it and not the sticky panel's current position. The lower gap runs from the block's
  bottom edge to the top edge of the "Related posts" heading box; any margin of the Related posts
  section and of its heading counts toward the 40 px, so nothing adds space beyond it. The rule
  holds at every width from 320 px; tests sample 375 and 1440 px with a 1 px tolerance for
  sub-pixel rounding. A post with no Related posts keeps the same 40 px top gap; a post with the
  questions panel measures the top gap as defined here.
- **FR-008**: Alignment by width MUST stay as today: below 768 px the photo sits centred above the
  author text and the author text, views note, share heading and share links are centred; from
  768 px the photo sits left of the author text, the author text and views note are left-aligned,
  and the share heading sits left with the share links right, on one row and vertically centred.
  The views note lines up with the author text (not under the photo) from 768 px; the share
  heading starts at the box's inner left edge, in line with the photo, not indented to the author
  text. From 768 px, when the share links (and the Share button) do not fit on one line beside the
  heading (for example at 200% text zoom), the heading stays left and does not shrink, and the
  links wrap onto further lines within the space to its right, still right-aligned; nothing
  overflows the box.
- **FR-009**: The share links and the Share button MUST keep their current appearance (rust
  outlined pills), size, order and text, including their hover and focus appearance as defined
  today (except the dark-theme focus ring colour, FR-015a) (specs/035-share-area-width FR-004; specs/008-blog FR-028). The author links MUST keep
  their current plain underlined style, text, and hover and focus appearance
  (specs/039-post-author-card). Only their container's box changes.

**Behaviour**

- **FR-010**: Every author link and share link MUST keep its current destination, text and
  accessible name, and the Share button its current behaviour (hidden in the delivered page, shown
  and working only when scripts run on a device that offers the system share feature). The share
  addresses carry nothing but the post's data: the LinkedIn address has one parameter, the post's
  full address; the email address has two, the post's title as the subject and its full address as
  the body. Each value is percent-encoded as a URI component, so a title or address containing
  `&`, `?`, `#`, `=`, quotes, spaces or non-ASCII characters arrives intact and cannot add or
  change a parameter.
- **FR-010a**: The LinkedIn link keeps its current opening behaviour: an ordinary link that opens
  in the same tab (no new window), so the destination gets no handle on the post page. The referrer
  it sends is governed by the site-wide `Referrer-Policy: strict-origin-when-cross-origin` in the
  header contract, so LinkedIn receives at most the site's origin, never the post's path. The link
  adds no `target`, `rel`, `ping` or `referrerpolicy` attribute of its own.
- **FR-011**: The change MUST add no client-side script beyond the Share button's existing
  bundled script (the same module, the same number of bytes, loaded from the site's own origin), no
  inline script (including event-handler attributes) and no inline style (including `style`
  attributes in the generated markup, not only in authored source), no third-party resource and no
  tracking. "No tracking" means: no analytics or click events, no tracking or campaign parameters
  (such as `utm_*`) in any link, no beacons, pings or pixel requests, and no cookies. This follows
  Principle X (no tracking; privacy-focused analytics or none). Every asset the block uses,
  including the author photo, is built by the site and served from its own origin; the block causes
  no third-party request on page load. The header contract file `public/_headers`, including the
  content security policy, MUST stay byte-for-byte unchanged.
- **FR-011a**: The footer block collects, stores, sends and logs no personal data (Principle VII);
  it has no form and no input. All its content comes from committed files (the blog settings and
  the post's own content entry), never from visitor-supplied input.
- **FR-012**: With JavaScript turned off, the delivered page MUST contain the whole footer block:
  both headings, the photo with its alt text, both author lines, the three author links, the views
  note and the two share links.

**Accessibility**

- **FR-013**: The footer block MUST meet WCAG 2.2 AA in light and dark themes at every width from
  320 px. "Written by Don Coleman" and "Share this post" MUST stay level-2 headings, siblings of
  "Related posts", under the post's single level-1 title, with no level skipped and no other
  heading added inside the block. The block adds no landmark and no accessible name of its own:
  its wrapper is a generic element (not `footer`, `aside`, `nav` or `section` with a name, and with
  no `role` such as `region`, `group` or `contentinfo`, and no `aria-label` or `aria-labelledby`).
  The author part and the share part may stay unnamed `section` elements, which expose no landmark
  without a name.
- **FR-014**: Reading order (the DOM order) MUST be: author heading, the two author lines, the
  three author links, the views note, the photo (its alt text), the "Share this post" heading, the
  share links, the Share button (when shown). The photo is shown first visually (above the author
  text below 768 px, left of it from 768 px) while it comes after the views note in the reading
  order, as it does today (039). This difference is allowed under WCAG 1.3.2 because the photo is a
  non-interactive illustration of the author named in the heading just read: reading its
  description after the author's text does not change the meaning, and every part still reads in a
  meaningful sequence. It does not affect WCAG 2.4.3 because the photo is not focusable. No other
  item's visual order may differ from its reading order. Keyboard order: the three author links,
  then "Share on LinkedIn", "Share by email", then the Share button only when it is shown, with
  nothing focusable added. While the button is hidden (delivered page, scripts off, or no system
  share feature) it is not in the tab order and the order ends at "Share by email"; when a script
  shows it, it joins the end of the order.
- **FR-015**: The views note text, both headings, the author lines and all link text MUST each have
  at least 4.5:1 contrast against the block's own background (`white` in the light theme,
  `dusk-800` in the dark theme), not the page background, in both themes, measured separately for
  each theme, in normal, hover and focused states. Visited links keep the unvisited colours (no
  visited style). The share pills' outlines (the boundary that identifies each control) and every
  focus indicator MUST have at least 3:1 contrast against the box background in both themes (WCAG
  1.4.11). The divider and the outer border only group content that the two headings already
  separate; they are not needed to identify a control or understand content, so WCAG 1.4.11 does
  not require a minimum contrast for them. They MUST remain visible in forced-colours mode.
- **FR-015a**: Focus indicators stay as they are today: author links use the site-wide focus ring
  (a 2 px solid outline, offset 2 px, in the accent colour `accent-500` light / `accent-400` dark);
  the share links and the Share button use their own 2 px solid outline, offset 2 px, in
  `rust-600` in the light theme. One change is required: today the share controls' ring is
  `rust-600` in the dark theme too, which measures 3.0:1 (just under 3:1) on the dark box
  background `dusk-800`, so in the dark theme it becomes `rust-300` (7.3:1), the colour of the
  pills' own dark outline. In forced-colours mode every focus ring uses the system colour
  (`CanvasText`).
- **FR-016**: Each author link and each share control is a target of at least 24 by 24 CSS px on
  its own box (the author links are inline blocks padded to at least that size, not bare inline
  text), and the share controls keep their current 44 px minimum height. Post pages have no sticky
  or fixed site header, and the block adds no sticky or fixed element, so a focused control in the
  block is never hidden by other content (WCAG 2.4.11); the questions panel, sticky from 1280 px,
  sits beside the post text and never overlaps the block.
- **FR-016a**: The block MUST reflow without loss of content or function and without sideways
  scrolling at 320 px width, at 200% text zoom, and with the WCAG 1.4.12 text-spacing overrides
  (line height 1.5, paragraph spacing 2x, letter spacing 0.12 em, word spacing 0.16 em): text and
  pills are never clipped or overlapped, and the share row wraps onto more lines (FR-008).

**Performance and look elsewhere**

- **FR-017**: The post page MUST stay within the site's performance budget (including its
  cumulative layout shift limit of 0.1) and add no bytes of JavaScript. The block adds no vertical
  layout shift: its height is fixed by the delivered HTML and the photo's reserved 96 px square.
  The Share button's late appearance may move the share links sideways within their row, as it does
  today; no space is reserved for it, and nothing above, below or in the author part moves.
- **FR-018**: Only post pages change appearance. The post-page template baselines are refreshed in
  the same change: the desktop and phone shots, each in the light and dark themes, on both macOS and
  Linux (eight images, `post-template-*`). Every other visual baseline stays byte-for-byte the same.
  The visual shot covers one published post's article; the draft and no-Related-posts variants
  render the same block (FR-001) and are covered by the component and end-to-end tests, not by
  extra baselines.
- **FR-019**: No site copy added by this feature states Don's job title (the About page is the only
  place that does). The feature adds no copy at all; the views note's existing wording mentions
  "any employer or client" generically, names no employer or title, and is out of scope here.

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
  address, series), all committed files in the repository; no part of it comes from visitor input.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every post, the end of the article has exactly 1 bordered box after the post text
  (down from 3 separate pieces with 2 different box styles), and the views note appears exactly
  once, inside it.
- **SC-002**: The footer block's edges match the title card's within 1 px at 320, 375, 768, 1024
  and 1440 px, with and without the questions panel.
- **SC-003**: The gap above the footer block and the gap between it and the "Related posts" heading
  are each 40 px (2.5 rem) and differ by at most 1 px at 375 and 1440 px.
- **SC-004**: The views note measures at least 4.5:1 contrast against the block background in
  both themes, and the post page passes the site's automated accessibility check (axe with the
  WCAG 2.0, 2.1 and 2.2 level A and AA rule tags, in both themes) with zero violations, as it does
  on `main` before this change, and no sideways scroll at 320 px.
- **SC-005**: Every author link and share link reaches the same address as before on a Drift post,
  a Convergence post and a post in no series, and the content security policy and JavaScript size
  of the post page are unchanged.
- **SC-006**: Only post-page visual baselines change; all others stay byte-for-byte the same.

### Checks that need a person

Automated tests cannot fully judge these, so they are preview checks for Don before approval:
the reading order with a screen reader (FR-014), that a focused control is never hidden while
tabbing through the block (FR-016), the block at 200% text zoom at 320 px and with text-spacing
overrides (FR-016a), the block in forced-colours mode (Edge Cases), and the overall "one footer"
look in both themes at 375 and 1440 px (User Story 1).

## Assumptions

- "A single, well-structured author and sharing footer block" means one box holding both parts
  with an internal divider, not two matching boxes (confirmed in Clarifications).
- The block takes the author card's current look (the title card's box), not the Share area's
  gradient, because it then echoes the title card at the top of the post and keeps the site's
  existing visual language (specs/039-post-author-card FR-012).
- The views note sits after the author links, not between the author lines and links, so it reads
  as a caption to the author part and does not split the author's details from his links
  (confirmed in Clarifications).
- "Consistent vertical spacing" means the same 2.5 rem gap above and below the footer block, a
  spacing step the site already uses (today the pieces use 2 rem and Related posts 2.5 rem;
  confirmed in Clarifications).
- "Analytics compliance" means the share links stay free of tracking: the site uses only
  privacy-focused analytics or none (Principle X), and the share links carry no tracking today.
- The headings "Written by Don Coleman" and "Share this post" stay visible; merging them into one
  heading would change copy and the page outline, which the issue does not ask for.
- Tests that check the views note, the author card and the Share area today are updated to the new
  structure in this change; behaviour they check (wording, links, Share button) stays the same.
