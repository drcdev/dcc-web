# Feature Specification: Post Header Width

**Feature Branch**: `023-post-header-width`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "the new ai feature in writing posts moves the main content off center on large screens. that is fine, but the header block above now looks off because it is narrow. Make the width of the header block match the image above it."

## Context

On a writing post, the feature image spans the full width of the article. Below it sits the
header block (the title card: section name, title, summary, featured mark and post details).
The header block is narrower than the image and centred under it. Since the critical-thinking
questions panel arrived (feature 022), large screens show the post body in a left-hand column
beside the panel, so the body is no longer centred. The narrow, centred header block now lines
up with neither the image above it nor the body below it. The header block should span the same
width as the image, so its edges line up with the image's edges.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Header block lines up with the feature image (Priority: P1)

A reader opens a writing post on a large screen. The header block under the feature image is
exactly as wide as the image, with its left and right edges in line with the image's edges, so
the top of the post reads as one aligned unit above the off-centre body and questions panel.

**Why this priority**: This is the whole change. It fixes the misaligned look Don reported.

**Independent Test**: Open a post that has a feature image on a large screen and compare the
left and right edges of the header block with those of the image.

**Acceptance Scenarios**:

1. **Given** a post with a feature image and a questions panel, **When** a reader views it at a
   large-screen width (1280 px and wider), **Then** the header block's left and right edges are
   in line with the feature image's left and right edges.
2. **Given** the same post, **When** the reader views it, **Then** the header block's content
   (section name, title, summary, featured mark, post details, and the draft notice on a draft)
   is unchanged and in the same order.
3. **Given** a post with a feature image, **When** a reader views it at a width where the header
   block would be narrower than the image under the current layout, **Then** the header block
   follows the scope chosen in FR-002.

---

### Edge Cases

- **No feature image**: the header block uses the width the image would have had, so posts
  with and without an image share one header width (see Assumptions).
- **Caption under the image**: the header block still matches the image width, and the
  caption stays where it is now, between the image and the header block.
- **Header block overlapping the image**: where the header block currently overlaps the
  bottom of the image (no caption), the overlap stays. A full-width block now covers the whole
  bottom edge of the image, not only its middle.
- **Phone widths**: the image and the header block are already the same width at phone sizes,
  so nothing changes there.
- **Long titles and summaries**: they still wrap inside the header block and never overflow it
  or cause sideways scrolling at 320 px and up.
- **Post with no questions panel**: the header block width does not depend on whether the
  panel shows, unless FR-002 decides otherwise.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On a writing post, the header block MUST be the same width as the feature image
  above it, with left and right edges aligned to the image's edges within 1 px.
- **FR-002**: The matched width MUST apply [NEEDS CLARIFICATION: at every viewport where the
  image is wider than the header block today (from roughly 768 px up), or only from the
  large-screen breakpoint (1280 px) where the body moves off centre beside the questions panel?].
- **FR-003**: The text inside the header block MUST [NEEDS CLARIFICATION: run the full width of
  the widened block, or keep its current reading width (about 48rem) aligned to the block's
  left edge?].
- **FR-004**: The header block's content, order, colours, border, corner radius, shadow and
  vertical spacing MUST stay as they are; only its width (and, per FR-003, its text measure)
  changes. The post body, questions panel, feature image and caption MUST not move or resize.
- **FR-005**: The post page MUST continue to meet WCAG 2.2 AA (Principle X): no new contrast
  or reflow failures, no sideways scrolling at 320 px, and the header block's reading order
  and heading structure unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a post with a feature image at 1280 px and 1440 px wide, the header block's left
  and right edges sit within 1 px of the image's left and right edges.
- **SC-002**: At 320 px and 390 px wide, the post page shows no sideways scrolling and the header
  block looks the same as it does today.
- **SC-003**: The automated accessibility check on the post template reports no new violations.
- **SC-004**: The only visual difference in the post template snapshots is the header block's
  width (and, per FR-003, its text measure); every other part of the page is pixel-identical.

## Visual Impact

This change alters how a rendered page looks: the post template's header block. The visual
project snapshots the post template (fixture post at phone and desktop widths), so the macOS and
Linux visual baselines for the post template need refreshing as part of this change. Any other
visual diff is a regression to fix, not a baseline to refresh.

## Assumptions

- "Header block" means the title card under the feature image; "the image above it" means the
  post's feature image.
- A post without a feature image gets the same header width as one with an image (the article
  width), so header width is consistent across posts.
- The change touches the post template only, not the site-wide layout, navigation or design
  system. Whether that makes it a major change under Principle III is for the merge decision.
- Existing coverage to extend: the post layout component test and the questions panel
  placement end-to-end test, which already measures geometry at 320 to 1440 px.

## Follow-up (out of scope)

- Aligning the views note and share row under the body with the off-centre body column on
  large screens.
- Revisiting how far the header block overlaps the image now that it spans the full width.
