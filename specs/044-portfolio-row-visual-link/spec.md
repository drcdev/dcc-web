# Feature Specification: Clickable project row visuals

**Feature Branch**: `044-portfolio-row-visual-link`

**Created**: 2026-10-19

**Status**: Draft

**Input**: GitHub issue #187, "Make portfolio row visuals clickable": each row on the projects
index shows a large visual (a screenshot or an architecture diagram) next to the project's
title, but only the title is a link. Readers click the visual expecting to open the project
story and nothing happens. Make the visual open the same story, keep one link per row for
screen readers, and add a subtle hover effect that signals the visual can be clicked without
moving anything on the page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a project story from its visual (Priority: P1)

A reader scanning the projects index sees a screenshot or diagram that interests them and
clicks it. The project's story opens, exactly as if they had clicked the title.

**Why this priority**: This is the whole change. The visual is the largest thing in each row,
and a click on it currently does nothing.

**Independent Test**: On the projects index, click the visual in any row and confirm the
browser opens that project's story page.

**Acceptance Scenarios**:

1. **Given** the projects index with at least one listed project, **When** a reader clicks the
   visual in a row, **Then** that project's story opens.
2. **Given** a reader points at a row's visual with a mouse, **When** the pointer rests on it,
   **Then** the pointer shows the visual is a link and a subtle hover effect appears, and no
   text, pill or other row moves.
3. **Given** a reader has asked their system to reduce motion, **When** they point at a visual,
   **Then** any hover change appears without animated movement or scaling.

---

### User Story 2 - Screen reader and keyboard users meet one link per row (Priority: P1)

A screen reader user moves through the projects index. Each row still offers exactly one link,
the title, so they do not hear the same destination announced twice. A keyboard user tabbing
through the page stops once per row, on the title.

**Why this priority**: The site must meet WCAG 2.2 AA (Principle X). A second, duplicate link
per row would double the tab stops and the announcements without adding anything.

**Independent Test**: With a screen reader or the browser's accessibility tree, and with the
Tab key, confirm each row exposes one link (the title) and that the visual's description is
still available.

**Acceptance Scenarios**:

1. **Given** the projects index, **When** a keyboard user presses Tab through the rows,
   **Then** focus lands once per row, on the title link, and never on the visual.
2. **Given** the projects index, **When** a screen reader lists the page's links, **Then**
   each project appears once, by its title.
3. **Given** a row's visual has a text description, **When** a screen reader reaches the row,
   **Then** the description of the screenshot or diagram is still announced as it is today.

---

### Edge Cases

- The first row's visual loads eagerly and later rows load lazily; making the visual a link
  must not change how or when images load.
- A draft project, listed only outside the production build, behaves the same way as a
  published one.
- With JavaScript turned off, clicking the visual still opens the story (it is a plain link).
- In Windows high-contrast (forced colours) mode, the visual and the row look as they do today.
- On narrow screens, where the visual spans the full width under the text, a tap on it opens
  the story.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On the projects index, each row's visual MUST be a link to the same project story
  that the row's title links to, working without JavaScript.
- **FR-002**: The visual's link MUST be hidden from assistive technology and left out of the
  keyboard tab order, so each row exposes exactly one link to screen readers and keyboard users:
  the title.
- **FR-003**: The visual's text description MUST remain available to screen readers exactly as
  it is today; hiding the duplicate link must not hide the description of the screenshot or
  diagram.
- **FR-004**: Pointing at the visual MUST show a link pointer and a subtle hover effect (for
  example a slight change in opacity or scale) that causes no layout shift. When the reader
  prefers reduced motion, the effect MUST appear without any animated transition or scaling.
- **FR-005**: The row at rest (not hovered) MUST look exactly as it does today, and the page
  MUST ship no new client-side JavaScript.

### Key Entities

- **Project row**: one listed project on the projects index, with a title link, a short problem
  statement, status and theme pills, and a visual with a text description.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clicking or tapping the visual in every listed row opens that row's project story
  (100% of rows).
- **SC-002**: Each row exposes exactly one link to the accessibility tree and one keyboard tab
  stop, the same counts as today.
- **SC-003**: The projects index passes the site's automated accessibility check (WCAG 2.2 AA)
  with no new violations.
- **SC-004**: Screenshots of the projects index at rest are unchanged, at every width the site
  already checks, so no stored visual baseline needs updating.
- **SC-005**: Hovering a visual moves no other element on the page (no layout shift).

## Assumptions

- Only the projects index uses the project row. Project story pages, the home page and other
  listings are out of scope.
- "Subtle" means a small change that does not alter the visual's footprint in the layout, such
  as lowering opacity slightly or scaling the image within its own box. The exact values are a
  plan decision.
- The hover effect is pointer-only. Keyboard users get no focus style on the visual because it
  is not focusable; their single stop is the title, which keeps its existing focus style.
- Because rows at rest do not change, visual baselines are not expected to change. If the
  implementation turns out to alter the resting appearance, baselines change too and the plan
  must say so.
- The existing component test that asserts a row has exactly one link will need to account for
  the new hidden link; what it protects (one link exposed to assistive technology) stays the
  same.
- Linking a whole card or row with an overlay, or adding a visible "Read the story" link, is
  out of scope.
