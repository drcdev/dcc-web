# Feature Specification: Footer at the Bottom

**Feature Branch**: `027-footer-at-bottom`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "when a page is shorter than the total page height, the footer sits mid screen. It should always sit at the bottom of the content or the bottom of the viewframe, whichever is lower. on a short page, it should not add any need to scroll."

## Context

Every page renders inside one site shell: the header, the page's main content, then the site
footer. The footer follows straight after the main content. When a page's content is shorter
than the browser window (the not-found page, a short page on a tall screen), the footer ends
part way down the window and the page background shows below it. The footer should instead sit
at the bottom of the window on a short page, and straight after the content on a long one.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Footer sits at the bottom of a short page (Priority: P1)

A visitor opens a page whose content does not fill the window. The footer sits against the
bottom edge of the window, with any spare space between the content and the footer, and the
page does not scroll. On a page longer than the window, the footer follows the content as it
does today.

**Why this priority**: This is the whole change. It fixes the footer floating mid-screen.

**Independent Test**: Open the not-found page in a tall window and check that the footer's
bottom edge meets the window's bottom edge and that the page cannot scroll; then open a long
post and check the footer still comes straight after the content.

**Acceptance Scenarios**:

1. **Given** a page whose content is shorter than the window, **When** a visitor opens it,
   **Then** the footer's bottom edge is at the bottom edge of the window.
2. **Given** the same short page, **When** the visitor opens it, **Then** the page has no
   vertical scroll (the document is no taller than the window).
3. **Given** a page whose content is taller than the window, **When** a visitor scrolls to the
   end, **Then** the footer follows the content with the same spacing as today, and the page is
   no taller than it is today.
4. **Given** a short page, **When** the visitor resizes the window taller or shorter, **Then**
   the footer stays at the bottom of the window until the content fills it, after which it
   follows the content.

---

### Edge Cases

- **Content exactly as tall as the window**: the footer sits at the bottom with no scroll.
- **Phone screens whose visible height changes** (the browser's address bar showing or hiding):
  a short page must not gain a scroll from the footer placement; a small shift as the bar
  moves is acceptable.
- **Mobile menu open**: opening the menu on a short page behaves as today; the footer
  placement does not cover or move the open menu.
- **Wide-image pages** (posts with wide or full-width images, which widen the page container):
  the footer placement does not change how those pages lay out.
- **Zoom to 400% and text-only resize to 200%**: the footer follows the content once the
  content outgrows the window, and nothing overlaps or is clipped.
- **JavaScript turned off**: the footer placement works the same (Principle V).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On every page, when the header, main content and footer together are shorter than
  the window, the footer MUST sit with its bottom edge at the bottom edge of the window, and the
  spare space MUST fall between the main content and the footer.
- **FR-002**: On such a short page, the page MUST NOT scroll vertically: the document height
  MUST equal the window height (within 1 px).
- **FR-003**: When the page content is taller than the window, the footer MUST follow the
  content exactly as today: same position, same spacing, and no added page height.
- **FR-004**: The header, main content and footer MUST keep their content, appearance, order
  and spacing; only the footer's vertical position on short pages changes. The placement MUST
  work without JavaScript.
- **FR-005**: Every page MUST continue to meet WCAG 2.2 AA (Principle X): the footer stays after
  the main content in reading and keyboard order, no content is hidden or overlapped, and there
  is no reflow failure at 320 px wide or at 400% zoom.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the not-found page at 390 x 844 and 1280 x 800, the footer's bottom edge is
  within 1 px of the window's bottom edge and the page has no vertical scroll.
- **SC-002**: On a long page (a writing post) at the same sizes, the footer's position relative
  to the end of the content and the total page height are unchanged from today.
- **SC-003**: The automated accessibility checks on every page template report no new
  violations.
- **SC-004**: The only visual differences in the visual baselines are the footer's position on
  pages shorter than the window; every other part of every page is pixel-identical.

## Visual Impact

This change alters how short pages look: the footer moves down to the bottom of the window. In
the visual project, the full-page shots are the ones that can move:

- the not-found page shots (phone and desktop, dark and light) will change, since the not-found
  page is shorter than both test windows;
- the sections fixture page shots change only if that page is shorter than the window at a
  given size; otherwise they must stay identical.

The element shots (header, footer, open menu and the fixture template subjects) capture single
elements and should not change. The macOS and Linux baselines for the shots that move need
refreshing in this change; any other diff is a regression to fix, not a baseline to refresh.

## Assumptions

- "Total page height" in the request means the browser window (viewport) height.
- The fix belongs in the site shell, so it applies to every page that uses it, including the
  not-found page; no page opts out.
- The spare space on a short page shows the page background, as today.
- Classification: this changes the site shell's layout on short pages but not the design
  system, navigation or visual identity. It is borderline under Principle III ("site-wide
  layout"); the plan classifies it, and if in doubt flags it as a major change in the pull
  request body (no extra gate, only Don's usual approval).
- Out of scope: any change to the footer's content or styling, or to the header.
