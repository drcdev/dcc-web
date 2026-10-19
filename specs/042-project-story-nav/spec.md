# Feature Specification: Previous, next and index links on project stories

**Feature Branch**: `042-project-story-nav`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: GitHub issue #186, "Add Previous / Next / Index navigation to project story pages". A reader who finishes a project story reaches the invitation block and has no way on except scrolling back to the header menu. Add links to the previous project, the projects index and the next project, after the four-part story and before the invitation, handling the first and last project cleanly and leaving drafts out of production.

## Clarifications

### Session 2026-10-19

- Q: Should "Next" go to the project listed directly below on the projects index (the next older one), so that "Previous" is the newer project above it? → A: Yes. Previous is the project above on the index (newer), Next is the one below (older).
- Q: Should the index link read "All projects" (sentence case) or "All Projects" (title case, as the issue wrote it)? → A: "All projects", sentence case.
- Q: At phone width, should the three links stack in one column or stay on one row and wrap? → A: Stack vertically as full-width links below 640 px (Tailwind `sm`); one row from 640 px up.
- Q: Should the Previous and Next links show only the direction and the project title, or also the project's status? → A: Direction and title only, for example "← Previous: Flux"; no status.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move to the next or previous project from the end of a story (Priority: P1)

A reader finishes a project story. Below the last part of the story, before the invitation, they see a short set of links: the previous project by title, a link to all projects, and the next project by title. They follow one and land on that story or on the projects index, without going back to the header menu.

**Why this priority**: This is the whole change. Without it the story is a dead end.

**Independent Test**: Open any published project story in the middle of the index order, follow "Next" until the last project, then "Previous" back to the first, and check that each step lands on the project the projects index lists next to it.

**Acceptance Scenarios**:

1. **Given** a story that has projects listed both before and after it on the projects index, **When** the reader reaches the end of the four parts, **Then** they see, in this order, a link naming the previous project, a link to all projects, and a link naming the next project, all placed before the invitation.
2. **Given** that story, **When** the reader follows the next-project link, **Then** they land on the story the projects index lists directly after the current one.
3. **Given** that story, **When** the reader follows the all-projects link, **Then** they land on the projects index.
4. **Given** the first project on the projects index, **When** the reader reaches the end of its story, **Then** there is no previous-project link and no empty placeholder control; the all-projects and next-project links still show.
5. **Given** the last project on the projects index, **When** the reader reaches the end of its story, **Then** there is no next-project link and no empty placeholder control; the previous-project and all-projects links still show.

---

### User Story 2 - Use the links with a keyboard, screen reader or touch screen (Priority: P2)

A reader who uses a keyboard, a screen reader or a phone can find and use the same links.

**Why this priority**: Required by WCAG 2.2 AA (Principle X), but it refines the links from Story 1 rather than adding a separate journey.

**Independent Test**: Tab through the end of a story with a keyboard, listen to it with a screen reader, and measure the links at phone width.

**Acceptance Scenarios**:

1. **Given** a project story, **When** a screen reader lists the page's navigation regions, **Then** the links sit in their own labelled navigation region (for example "Projects"), separate from the site menu, and each link's accessible name states its direction and the project title (for example "Previous project: Flux").
2. **Given** a keyboard user tabbing past the last part of the story, **When** each link receives focus, **Then** a visible focus indicator shows on it, and the focus order is previous, all projects, next.
3. **Given** a phone-width screen, **When** the reader taps a link, **Then** the links are stacked in one column as full-width links, each link's target is at least 44 by 44 CSS pixels, and the links fit without horizontal scrolling, with a long title wrapping inside its link.

---

### Edge Cases

- **Only one published project**: neither a previous nor a next link shows; the all-projects link still shows.
- **Drafts**: in the production build a draft project has no page and never appears as a previous or next target, so its published neighbours link straight past it. In preview and local builds, where drafts are built and listed on the index, drafts take their place in the sequence exactly as the index lists them.
- **Retired projects**: they are listed on the projects index, so they take part in the sequence like any other listed project.
- **Long titles**: the link text wraps; it is not cut off.
- **No wrap-around**: the last project does not link forward to the first, nor the first back to the last.
- **JavaScript off**: the links are plain links and work without JavaScript (Principle V).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every project story MUST show a navigation block after the last of its four parts and before the closing invitation. The block holds, in this order: a link to the previous project labelled "Previous" with that project's title, a link to the projects index labelled "All projects", and a link to the next project labelled "Next" with that project's title. The previous and next links show only the direction and the project title (for example "← Previous: Flux"); they MUST NOT show the project's status or any other metadata.
- **FR-002**: "Previous" and "Next" MUST follow the exact order in which the projects index lists projects in the same build: newest date first, then title, then file name, with drafts included only in builds that list them on the index and retired projects included because the index lists them. "Previous" is the project listed directly above the current one (the newer neighbour); "Next" is the one listed directly below (the older neighbour).
- **FR-003**: When a story has no project before it (or after it) in that order, the corresponding link MUST be left out entirely, with no disabled or empty control in its place, and the sequence MUST NOT wrap around. The all-projects link MUST always show.
- **FR-004**: The production build MUST NOT link to a draft project from any story's navigation block.
- **FR-005**: The block MUST meet WCAG 2.2 AA: it is a navigation landmark with its own accessible label distinct from the site menu; each link's accessible name includes its direction and, for previous and next, the project title; each link shows a visible focus indicator; each link's target is at least 44 by 44 CSS pixels; the block works without JavaScript and without horizontal scrolling at phone width. Below 640 CSS pixels (Tailwind `sm`) the links stack in one column, in the order previous, all projects, next, each spanning the full width of the block; from 640 CSS pixels up they sit in a single row.

### Key Entities

- **Project sequence**: the published projects of a build in projects-index order. Each story's previous and next neighbours are read from it. It is derived from the existing project content; no new content fields are added.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From any published project story, a reader reaches every other published project using only the links at the end of the stories, in no more steps than the number of projects listed on the index.
- **SC-002**: For every published project, the previous and next targets in its story match its neighbours on the projects index of the same build, with zero mismatches.
- **SC-003**: The production build contains zero links from a story's navigation block to a draft project.
- **SC-004**: Automated accessibility checks on the project story template report no new WCAG 2.2 AA violations, and every link in the block measures at least 44 by 44 CSS pixels at phone width.

## Appearance and visual baselines

Every project story page changes appearance: a new block appears between the last part and the invitation. The project story visual baselines (macOS and Linux) must be refreshed in this change. The projects index and all other pages do not change appearance.

## Assumptions

- Labels are plain text: "Previous: <title>", "All projects" and "Next: <title>", with left and right arrows as decoration hidden from assistive technology. The issue wrote "All Projects"; Don confirmed sentence case ("All projects") to match the site's other labels.
- The block reuses the site's existing link, focus and spacing styles from the Tailwind theme; no new colours or fonts.
- The theme filter on the projects index (shown only above ten projects) does not affect the sequence; the sequence is the full, unfiltered index order.
- No client-side JavaScript is added; the block is part of the prerendered page.

## Out of Scope

- Previous and next links on writing posts or other pages.
- Changes to the projects index, its order, or the invitation block.
