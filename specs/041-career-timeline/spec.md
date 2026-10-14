# Feature Specification: Interactive career timeline

**Feature Branch**: `041-career-timeline`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description (GitHub issue #163, "Interactive career timeline"): "The About page
shows Don's career as a timeline from his early roles to Director, Data Infrastructure and
Architecture. Each step can be opened to show its scope, a key decision from that time, what
changed in how he worked, what he wishes he had known, and the skill that led to the next move.
Where there is writing or an award from that period, the step links to it. A filter can be used
to surface achievements, leadership themes, awards, etc. and their associated role/context.
Filtered items are collapsed and dithered, but still visible."

## Background

The About page today is a short introduction, an "About me" list (current role, education,
leadership, volunteer work, values), a "Recognition" section with three awards and profiles
shown as images with captions, and a note about the writing. It says nothing about the roles
Don held before his current one or how he moved between them.

Don's job title appears in site copy only on the About page; this feature stays on the About
page, so naming the title there is allowed.

The site is static by default (constitution Principle V): the page is prerendered, its core
content must be readable with JavaScript turned off, and any interactive piece is an isolated
island. Public content lives in the repository as files validated by a schema (Principle VI).

## Clarifications

### Session 2026-10-14

- Q: How does Don's career content get into the site? → A: Don pastes his CV, which becomes a
  draft content source; a later clarify round interviews him on the gaps and on his current role
  (Director, Data Infrastructure and Architecture at Island Health since 2026), which the CV does
  not yet include. Nothing is invented.
- Q: Which categories does the filter offer? → A: Exactly three: Achievements, Leadership,
  Awards.
- Q: Where does the timeline sit on the About page? → A: Directly after the "About me" list; the
  list's "Leadership" line is removed; "Recognition" stays as it is, and its awards are also
  linked from their matching steps.
- Q: Must every step have all five detail parts? → A: Scope is required; the other four parts
  are optional, and a part left out is simply not shown.
- Q: How do non-matching steps look when a category is chosen? → A: A dot (halftone) pattern
  over the collapsed step's background, made with CSS only; the text stays at full contrast and
  the treatment does not rely on colour alone.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the career as a timeline (Priority: P1)

A visitor on the About page sees Don's career as an ordered timeline of steps, from his earliest
listed role to his current role, Director, Data Infrastructure and Architecture. Each step
shows at a glance the role, the organization and the period. The visitor opens any step to
read its detail: the scope of the role and, where Don has written them, a key decision from that
time, what changed in how he worked, what he wishes he had known, and the skill that led to the
next move.

**Why this priority**: This is the feature. Without it there is no timeline to filter or link
from. On its own it already tells the story the issue asks for.

**Independent Test**: Open the About page, confirm the steps appear in career order ending with
the current role, open one step and read its detail parts, then close it.

**Acceptance Scenarios**:

1. **Given** the About page, **When** it loads, **Then** the timeline lists every career step in
   chronological order, earliest first, each showing its role, organization and period, and the
   last step is Director, Data Infrastructure and Architecture at Island Health.
2. **Given** a closed step, **When** the visitor opens it, **Then** it shows its scope and each
   other detail part the step has (key decision, what changed in how he worked, what he wishes
   he had known, the skill that led to the next move), each under its own label; a part the
   step does not have shows no label.
3. **Given** an open step, **When** the visitor closes it, **Then** only its summary line
   (role, organization, period) remains.
4. **Given** the current role (the last step), **When** it is opened, **Then** the "skill that
   led to the next move" part is never shown, because there is no next move yet.
5. **Given** JavaScript is turned off, **When** the visitor opens the About page, **Then** every
   step can still be opened and read.
6. **Given** a keyboard or screen reader user, **When** they move through the timeline, **Then**
   each step can be reached, opened and closed from the keyboard, and its open or closed state
   is announced.

---

### User Story 2 - Follow a step to its writing or award (Priority: P2)

Where Don wrote something or received an award during a step's period, the opened step links to
it. A visitor reading about a role can go straight to the post or the award that came out of
that time.

**Why this priority**: The links connect the timeline to the rest of the site and to evidence
of the work, but the timeline is useful without them.

**Independent Test**: Open a step that has a linked post or award and follow each link to its
destination.

**Acceptance Scenarios**:

1. **Given** a step with one or more related posts on this site, **When** it is opened, **Then**
   it lists each post by title, linking to the post.
2. **Given** a step with one or more awards, **When** it is opened, **Then** it lists each award
   by name and year, linking to the award's page where one exists.
3. **Given** a step with no related writing or awards, **When** it is opened, **Then** no empty
   "writing" or "awards" heading appears.
4. **Given** a step names a post that does not exist or is a draft, **When** the site is built,
   **Then** the build fails with an error naming the step and the missing post.

---

### User Story 3 - Filter the timeline by theme (Priority: P3)

A visitor uses a filter on the timeline to pick one kind of item, such as achievements,
leadership themes or awards. Items of that kind stay in place, open, and each shows the role
and context it belongs to. Every other step is collapsed and dithered (a dot pattern over its
background, with its text still at full contrast) but stays visible in its place, so the visitor still sees where the matching
items sit in the whole career.

**Why this priority**: It adds a second way to read the career, but depends on the timeline
(Story 1) and its tagged content existing first.

**Independent Test**: Choose one filter value and confirm the matching items are shown with
their role, the other steps are collapsed and dithered but still on screen, and clearing the
filter restores the timeline.

**Acceptance Scenarios**:

1. **Given** the timeline with no filter chosen, **When** it loads, **Then** "All" is selected
   and every step is shown normally (none dithered).
2. **Given** the filter, **When** the visitor chooses a category, **Then** each step holding at
   least one item of that category is opened with those items highlighted, and each highlighted
   item shows the role and organization of its step.
3. **Given** a category is chosen, **When** a step holds no item of that category, **Then** the
   step is collapsed to its summary line and dithered, stays in its place in the timeline, and
   can still be opened by the visitor.
4. **Given** a category is chosen, **When** the visitor chooses "All", **Then** no step is
   dithered and each step returns to its closed state.
5. **Given** a category is chosen, **When** a screen reader user reaches the filter, **Then** the
   number of matching steps is announced, and dithered steps are still readable (the dithering
   is visual only and the text still meets contrast requirements when opened).
6. **Given** JavaScript is turned off, **When** the visitor views the page, **Then** the filter
   is not shown and the full timeline is readable.
7. **Given** a category that no item uses, **When** the filter is built, **Then** that category
   is not offered.

---

### Edge Cases

- A step with only some detail parts filled: it renders the scope and the parts it has, with no
  label for a missing part. A step with no scope fails the build, naming the step.
- The current role has a "skill that led to the next move" part: the build fails, naming the
  step.
- Two steps that overlap in time (for example, a volunteer board role alongside a job): they
  are ordered by start date, and each shows its own period.
- A step whose period is still running (the current role): its period shows "present".
- An award or post that falls in no step's period: it is not forced onto the timeline; it stays
  where it is on the site.
- The visitor opens a step, then chooses a filter that does not match it: the step collapses
  and is dithered like any other non-matching step.
- Printing the page: every step prints open and undithered, whatever the filter state.
- Reduced motion: opening, closing and filtering do not animate when the visitor's system asks
  for reduced motion.
- Narrow screens: the timeline reads as a single column at 320 CSS pixels wide with no
  horizontal scrolling.

## Requirements *(mandatory)*

### Functional Requirements

**Timeline content**

- **FR-001**: The About page MUST show a career timeline of steps ordered by start date,
  earliest first, ending with Don's current role, Director, Data Infrastructure and
  Architecture at Island Health.
- **FR-002**: Each step MUST have a role title, an organization and a period (start, and end or
  "present").
- **FR-003**: Each step MUST have a scope, a short piece of plain text. Each step MAY also have
  any of these detail parts, each a short piece of plain text: a key decision from that time,
  what changed in how he worked, what he wishes he had known, and the skill that led to the next
  move. The last part MUST be absent for the current role. A part a step does not have is not
  shown.
- **FR-004**: Each step MAY list related posts on this site and related awards (name, year, and
  an optional link). It MAY also list other items tagged with a category (FR-009).
- **FR-005**: The timeline content MUST live in the repository as a file validated by a schema;
  invalid or incomplete content, a related post that does not exist or is a draft, or a
  category not in the allowed list MUST fail the build with an error naming the step.
- **FR-006**: The career content (which roles, organizations, periods, the text of each detail
  part, related posts, awards and categorized items) MUST come from Don and MUST NOT be
  invented. Its source is Don's CV, pasted in as a draft content source, completed by a later
  clarify round that interviews Don on the gaps and on his current role, Director, Data
  Infrastructure and Architecture at Island Health since 2026, which the CV does not yet
  include. Planning waits for that round.

**Opening and closing**

- **FR-007**: Every step MUST start closed, showing only its summary line, and MUST be openable
  and closable by mouse, touch and keyboard, with its state exposed to assistive technology. This
  MUST work with JavaScript turned off.
- **FR-008**: An opened step MUST show each detail part under its own visible label, then its
  related writing and awards (when present), each as a link. Sections with no items MUST NOT
  appear.

**Filter**

- **FR-009**: The timeline MUST offer a filter whose choices are "All" plus each category used
  by at least one item. The categories MUST come from one fixed list of exactly three:
  Achievements, Leadership, Awards. Leadership is one category, not a set of named themes.
- **FR-010**: Choosing a category MUST open each step that holds a matching item, highlight the
  matching items, and show the role and organization each matching item belongs to.
- **FR-011**: Choosing a category MUST collapse every step that holds no matching item to its
  summary line and dither it, while keeping it visible in its place in the timeline. Dithering
  is a dot (halftone) pattern over the step's background, made with CSS only; it MUST NOT lower
  the text's contrast below WCAG 2.2 AA, closed or open, and MUST NOT rely on colour alone. A
  dithered step MUST still be openable.
- **FR-012**: Choosing "All" MUST remove all dithering and return every step to closed.
- **FR-013**: After a filter change, the number of matching steps MUST be announced to
  assistive technology.
- **FR-014**: Without JavaScript, the filter MUST NOT be shown and the full timeline MUST be
  readable (FR-007).
- **FR-015**: Filtering, opening and closing MUST NOT animate when the visitor prefers reduced
  motion.

**Page and site**

- **FR-016**: The timeline MUST sit on the About page directly after the "About me" list. The
  list's "Leadership" line MUST be removed, because the timeline replaces it. The "Recognition"
  section MUST stay as it is; its awards are also linked from their matching steps (FR-004).
- **FR-017**: The page MUST meet WCAG 2.2 AA and the site's performance budget, and the timeline
  MUST read as one column at 320 CSS pixels with no horizontal scrolling.
- **FR-018**: When printed, every step MUST print open and undithered.
- **FR-019**: Don's job title MUST appear only on the About page; this feature MUST NOT add it
  anywhere else on the site.
- **FR-020**: Copy for labels and messages MUST be plain language.

### Key Entities

- **Career step**: one role in Don's career. Has a role title, organization, period (start, end
  or present), a required scope, up to four optional detail parts (never the "skill that led to
  the next move" for the current role), and optional related posts, awards and categorized
  items. Ordered by start date.
- **Related post**: a reference from a step to a published post on this site, shown by its
  title.
- **Award**: a recognition received during a step: name, year, optional link.
- **Categorized item**: a short statement attached to a step (for example, an achievement or a
  leadership theme) with one category from the fixed list. Awards count as items of the
  Awards category.
- **Category**: one value in the fixed list the filter offers: Achievements, Leadership or
  Awards (FR-009).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can find what Don did in any listed role and why he moved on in two
  actions or fewer from arriving at the About page (scroll to the step, open it).
- **SC-002**: 100% of steps are readable, with every detail part they have, with JavaScript
  turned off.
- **SC-003**: Choosing a category leaves 100% of steps on screen, with every non-matching step
  dithered and every matching item showing its role and organization.
- **SC-004**: The About page passes the automated accessibility checks with no violations, with
  no filter chosen and with a category chosen.
- **SC-005**: The About page stays within the site's performance budget and meets Core Web
  Vitals "good" thresholds on mobile.
- **SC-006**: Every broken reference to a post, or incomplete step, is caught by the build
  (zero such errors reach the live page).

## Assumptions

- "Dithered" means a CSS-only dot (halftone) pattern over a non-matching step's background
  (FR-011); the exact dot size and colour are a design decision for the plan, within the site's
  design system and contrast rules. The site's design system has no dither treatment yet.
- "Filtered items are collapsed and dithered" refers to the steps that do not match the chosen
  category; matching items are the ones surfaced.
- Only one category can be chosen at a time; the filter is a single choice with "All" as the
  default. Multi-select is out of scope.
- The filter choice is not kept in the address or between visits.
- Awards already on the About page (2026 Celebration of Excellence, 2024 CCHL Chapter Award for
  Distinguished Service, 2024 CCHL Member Profile) are candidates for the matching steps' award
  links; they stay in "Recognition" and are also linked from their matching steps (FR-016).
- Writing links point to posts on this site; links to outside writing are treated like award
  links (name, year, link).
- The timeline needs no server code, stores nothing and collects no personal data.
- The current role is a single step; education and volunteer roles are included only if Don
  lists them as steps in FR-006.

## Out of scope

- Writing or inventing any of Don's career history; the content comes from Don's CV and
  interview (FR-006).
- A timeline anywhere other than the About page (home page, project stories, writing).
- Sharing a filtered view by link.
- Showing Don's job title anywhere but the About page.
