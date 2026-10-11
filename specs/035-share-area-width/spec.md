# Feature Specification: Share area and views note match the post width

**Feature Branch**: `035-share-area-width`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: "the share section and disclaimer at the bottom of a blog article is too narrow. it should match the width of the content above. on larger screens, the buttons should float to the right of the \"share this post\" text. on smaller screens, it should collapse in underneath and become centered (text and buttons)"

## Background

At the end of every blog post sit two pieces: the "views are my own" note (the disclaimer) and
the Share area, a box with the heading "Share this post" and the share links underneath it.
Both are capped at the reading-column width of the post text (48rem), centred. The post's title
card and hero image above them use the full article width (64rem).

The cap only shows on screens 1024 px wide and above. On narrower screens the page itself is
narrower than the reading column, so the views note, the Share area and the title card already
share the same edges. From 1024 px the end of the post looks pinched next to the title card. On a
post with the questions panel, from 1280 px the post text becomes a left-hand column beside the
panel, and the centred end-of-post pieces no longer line up with the text either.

The Share area also always stacks its heading above its links, which leaves a lot of empty space
on a wide screen.

## Clarifications

### Session 2026-10-10

- Q: How wide should the views note and Share area be on wide screens? → A: The full article width, with the same edges as the title card (64rem); on a post with the questions panel at 1280 px and up, they span under both the text and the panel.
- Q: On small screens, should the views note be centred too? → A: Yes. Below the switch point the views note text is centred as well as the Share area's heading and links.
- Q: At what width should the Share area switch between "heading left, links right" and the centred stack? → A: 768 px, the site's medium breakpoint; the views note switches at the same width.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The end of a post lines up with the post (Priority: P1)

A reader finishes a post. The views note and the Share area below it are as wide as the title
card at the top of the post, so the page reads as one column from top to bottom.

**Why this priority**: This is the reported problem. On its own it fixes the pinched look.

**Independent Test**: Open any post at 1024 px and 1440 px wide and compare the left and right
edges of the views note and the Share area with the edges of the title card; repeat at a phone
width to confirm they still match there.

**Acceptance Scenarios**:

1. **Given** a post open at 1024 px wide or more, **When** the reader scrolls to the end,
   **Then** the views note and the Share area have the same left and right edges as the post's
   title card.
2. **Given** a post with the questions panel open at 1280 px wide or more, **When** the reader
   scrolls to the end, **Then** the views note and the Share area span the whole row under both
   the post text and the panel, with the same edges as the title card.
3. **Given** a post open on a phone-width screen, **When** the reader scrolls to the end,
   **Then** the views note and the Share area still have the same left and right edges as the
   title card, and nothing scrolls sideways.

---

### User Story 2 - Share links sit beside the heading on wide screens (Priority: P2)

On a wide screen, the reader sees "Share this post" on the left of the Share area and the share
links on the right, on one line, with the views note left-aligned above it. On a narrow screen,
the links move under the heading, and the views note, the heading and the links are all centred.

**Why this priority**: It makes the wider box look intentional rather than empty, but the width
fix stands without it.

**Independent Test**: Open a post, resize the window across 768 px, and watch the Share area
switch between one row (heading left, links right) and a centred stack, and the views note
switch between left-aligned and centred.

**Acceptance Scenarios**:

1. **Given** a post open at 768 px wide or more, **When** the reader looks at the end of the
   post, **Then** the views note text is left-aligned, and in the Share area the heading is at the
   left and the share links are at the right, on the same line and vertically centred with each
   other.
2. **Given** a post open narrower than 768 px, **When** the reader looks at the end of the post,
   **Then** the views note text is centred, and in the Share area the share links are below the
   heading, and the heading and each row of links are centred in the box.
3. **Given** a device that offers the system share feature, **When** the extra Share button
   appears, **Then** it joins the other links (at the right on a wide screen, in the centred
   group on a narrow one) and the heading does not move.

---

### Edge Cases

- A post with the questions panel, on a screen wide enough for the panel to sit beside the
  text (1280 px and up): the views note and the Share area span the full row (text plus panel),
  matching the title card.
- A post with no feature image: the title card is still full width, so the end of the post
  still matches it.
- With scripts turned off, the extra Share button stays hidden; the LinkedIn and email links
  still work and keep the same placement.
- Large text (browser zoom up to 200 percent, or a narrow screen where three links do not fit on
  one line): the links wrap onto more lines and nothing is cut off or overlaps; on the narrow
  layout every line of links, and every line of the views note, stays centred.
- Keyboard users reach the share links in the same order as before (LinkedIn, email, then
  Share), whatever the layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On every blog post, the views note and the Share area MUST have the same left and
  right edges as the post's title card (the full article width) at every screen width,
  including on a post with the questions panel, where from 1280 px they span under both the
  post text and the panel.
- **FR-002**: At 768 px wide and above, the views note text MUST be left-aligned, and the Share
  area MUST show the "Share this post" heading at the left and the share links at the right, on
  one row and vertically centred with each other.
- **FR-003**: Below 768 px wide, the views note text MUST be centred, and the Share area MUST show
  the share links below the heading, with the heading text and the links centred in the box.
- **FR-004**: The change MUST keep the views note wording and style and the Share area's content,
  link order, link targets, styling of the links, and its behaviour without scripts exactly as
  they are today; only the width, the arrangement and the text alignment change.
- **FR-005**: The end of the post MUST meet WCAG 2.2 AA (Principle X) in both arrangements: the
  reading and focus order stays views note, heading, LinkedIn, email, Share; content reflows at
  320 px wide and at 200 percent zoom without sideways scrolling or overlap; touch targets and
  contrast are unchanged.

### Out of scope (follow-up)

- Changing the views note wording, the Share area's colours, the set of share services, or the
  Related posts section below the article.
- Changing the width of the post text itself, which stays at the reading-column width.
- Applying the same layout to project stories or other pages that do not use the post template.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every post, at 1024 px and 1440 px wide (with and without the questions panel),
  the left and right edges of the views note and the Share area are within 1 px of the title
  card's edges, where today they are inset; at 375 px and 768 px, where the edges already match
  today, they still match within 1 px.
- **SC-002**: At 768 px and above, the heading and the first share link sit on the same line and
  the views note is left-aligned; below 768 px, every share link is below the heading, and the
  views note text and the box's content are centred.
- **SC-003**: The post page passes the site's automated accessibility check with no new
  violations, and the page has no sideways scroll at 320 px wide.
- **SC-004**: Rendered post pages change appearance, at wide widths (width and Share row) and at
  narrow widths (centred views note and Share area), so the post-page visual baselines are
  refreshed in the same change (macOS and Linux) and every other visual baseline stays the same.

## Assumptions

- "The content above" means the full article width used by the title card and hero image (and,
  on a post with the questions panel at 1280 px and up, the row holding the text and the panel),
  as confirmed in Clarifications. The post text and the end-of-post pieces share the
  reading-column width today, so matching the text alone would change nothing.
- The visible width change happens only from 1024 px; below that the end-of-post pieces already
  fill the page width. Below 768 px the visible change is the centring of the views note and the
  Share area.
- 768 px is the switch point because it is the site's medium breakpoint, and the heading and the
  three links fit on one line there.
- Only blog posts are affected. The Share area is used nowhere else.
- No new copy is added; the heading, link labels and views note wording stay as they are.
