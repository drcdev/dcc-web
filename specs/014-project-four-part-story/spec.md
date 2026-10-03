# Feature Specification: Simplify the project pages to a four-part story

**Feature Branch**: `014-project-four-part-story`

**Created**: 2026-10-02

**Status**: Draft

**Input**: User description: "Simplify the project pages to a four-part story" (GitHub issue #35). Closes #35.

## Context

Today a project page tells its story in seven numbered chapters (problem, constraints, options,
built, outcome, lessons, invitation), each placed by hand in the project file, with the options
comparison written as structured settings at the top of the file rather than in the text.
Pages are long, chapters stretch to fill the screen, and starting a new project means copying a
lot of structure correctly.

This feature replaces that with one short story in four parts (Problem, Options, Build,
Lessons), written as ordinary headed text in a single file, with the options comparison written
as an ordinary table that a build check keeps in shape. It changes the look of a whole section
of the site, so it is a **major change** under Constitution Principle III: Don reviews it on the
preview deployment before it merges.

## Clarifications

### Session 2026-10-02

- Q: What does each item in the constraint list above the options table contain? → A: The bold
  label, a colon, then a one-line explanation; only the bold label must match the table's column
  heading, in order.
- Q: How does a writer put a picture beside a part? → A: Each picture in the details at the top
  names the part it sits beside; the body stays pure headed text with no picture tags.
- Q: Should the closing invitation be the same on every project, or keep each project's own
  invitation sentence? → A: An optional one-line invitation sentence in the details at the top,
  shown before the standard contact link when present; a standard sentence is used when it is
  absent. The five existing projects keep their current sentences.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a project as a short four-part story (Priority: P1)

A visitor opens a project and reads, in order: a compact heading with the project's name, the
one-line problem it solved, its status and its themes; then four short parts headed Problem,
Options, Build and Lessons; then a short invitation to get in touch about a similar problem.
The parts sit close together and read like a writing post, not a series of full-screen
chapters.

**Why this priority**: This is the reason for the change. Every other story supports it.

**Independent Test**: Open any project page on a preview build and check the heading, the four
parts in order, the options table, the links and the closing invitation, on a wide screen and
on a phone.

**Acceptance Scenarios**:

1. **Given** a project, **When** a visitor opens its page, **Then** the heading shows the
   project's name, its one-line problem, its status and its themes.
2. **Given** a project page, **When** the visitor reads down it, **Then** they see exactly four
   parts headed Problem, Options, Build and Lessons, in that order, followed by the closing
   invitation.
3. **Given** a project page, **When** it is shown, **Then** there is no table of contents, no
   chapter numbering ("Chapter 1 of 7" or similar) and no animation on the part headings, and
   the part headings are the same size as the section headings on a writing post.
4. **Given** a project page on any screen size, **When** it is shown, **Then** no part is
   stretched to fill the height of the screen; the space between parts is about the space
   between sections on a writing post.
5. **Given** a part that has a picture or diagram, **When** the page is shown on a wide screen,
   **Then** the picture sits beside the part's text; **When** it is shown on a phone, **Then**
   the picture sits below the part's text.
6. **Given** the Options part, **When** it is shown, **Then** it reads as: a paragraph on the
   routes that were open, a short list of the constraints, a table showing how each option
   measured up against each constraint, and a closing line on why the chosen option won.
7. **Given** the options table, **When** it is shown, **Then** each cell is coloured by its
   answer (yes, partly, no) in the same way the comparison is coloured today, the answer is
   also written as text so colour is not the only signal, and the chosen option stands out.
8. **Given** a project that has a live version or published source, **When** the Build part is
   shown, **Then** links to them appear with it without the writer placing them by hand; a
   project with neither shows no empty link area.
9. **Given** any project page, **When** the visitor scrolls, **Then** the thin reading progress
   bar at the top of the page still tracks their position.
10. **Given** the project list, **When** the visitor opens a project, **Then** the project title
    still carries over from the list row into the page heading as it does today.
11. **Given** any project page, **When** JavaScript is turned off, **Then** the whole story,
    the table, the links and the invitation are still readable.

---

### User Story 2 - Write a new project from the template (Priority: P1)

Don (or Claude Code) starts a new project by copying the template that sits beside the
projects, renaming it, and filling it in: a few details at the top (name, problem line,
description, status, themes, date, pictures with the part each sits beside, any links and an
optional invitation sentence), then the four parts as ordinary headed text. Nothing has to be
placed in the body by hand.

**Why this priority**: The point of simplifying is that a project is quick and safe to write.
Without the template and the plain-text format, the reading improvement does not last.

**Independent Test**: Copy the template, rename it, fill in real details and text, and build:
it appears in the project list on the preview and renders as a four-part story with no other
file changed.

**Acceptance Scenarios**:

1. **Given** the projects folder, **When** a writer looks in it, **Then** they find a template
   file, marked as a draft, holding placeholder details at the top, the four headed parts, a
   constraint list and an example options table in the required shape.
2. **Given** the template as it stands, **When** the site is built, **Then** the template does
   not appear in the project list, has no page of its own, and does not break the build.
3. **Given** a copy of the template that has been renamed and filled in, **When** the site is
   built, **Then** the new project appears in the list (on the preview while it is a draft, in
   production once it is not) and its page shows the four parts with the links and the
   closing invitation added automatically.
4. **Given** a project file, **When** the writer wants a picture beside a part, **Then** they
   name the picture in the details at the top and choose which part it sits beside there,
   without placing anything in the body; at most one picture is allowed per part.
5. **Given** a project file with an invitation sentence in its details, **When** the page is
   shown, **Then** that sentence appears before the standard contact link; **Given** a project
   file without one, **Then** a standard sentence appears instead.

---

### User Story 3 - The build rejects a malformed options table (Priority: P1)

When a project's options table breaks the fixed shape, the build fails with a message that
names the project file and the rule that was broken, so the writer can fix it without
guessing.

**Why this priority**: Constitution Principle VI requires invalid content to fail the build
with a clear error. Moving the comparison from checked settings into a plain table must not
lose the checking it has today.

**Independent Test**: Introduce each kind of mistake into a project's table in turn and build;
each one fails with the file name and the specific rule.

**Acceptance Scenarios**:

1. **Given** an options table whose first column does not name the options, or whose other
   column headings are not the constraints, **When** the site is built, **Then** the build
   fails naming the file and the rule.
2. **Given** a table with a cell that is not yes, partly or no, **When** the site is built,
   **Then** the build fails naming the file, the cell's option and constraint, and the allowed
   answers.
3. **Given** a table with no option in bold, or more than one option in bold, **When** the
   site is built, **Then** the build fails naming the file and saying exactly one option must
   be in bold.
4. **Given** a table that is not followed by a line beginning "Why", **When** the site is
   built, **Then** the build fails naming the file and the rule.
5. **Given** a constraint list whose bold labels do not match the table's column headings in
   name and order, or an item with no bold label, **When** the site is built, **Then** the
   build fails naming the file and the names that differ.
6. **Given** an Options part with no table, or with more than one table, **When** the site is
   built, **Then** the build fails naming the file and the rule.
7. **Given** a project that is a draft, **When** the production site is built, **Then** its
   table is still checked, so a broken draft cannot reach production later unnoticed.

---

### User Story 4 - Browse the project list (Priority: P2)

A visitor on the project list sees the same rows and theme filter as today, with the rows
brought closer together to match the shorter pages.

**Why this priority**: The list is the way in, but its behaviour does not change; only its
spacing does.

**Independent Test**: Open the project list on a preview build, filter by a theme, and check
that rows, filter behaviour and the title carry-over are unchanged while the gap between rows
is smaller.

**Acceptance Scenarios**:

1. **Given** the project list, **When** it is shown, **Then** each project keeps its row
   content and the theme filter works as today.
2. **Given** the project list, **When** it is compared with today's, **Then** the vertical
   space between rows is visibly smaller.
3. **Given** a production build in which every project is a draft, **When** the list is
   opened, **Then** the existing empty-list state is shown rather than an error.

---

### User Story 5 - The five existing projects in the new shape, as drafts (Priority: P2)

All five existing projects (Focus Pocus and the four migrated from the old site) are rewritten
into the four-part shape using only their current text, and all five are marked as drafts so
Don can reread each one on the preview before publishing it.

**Why this priority**: The new design has to be seen with real content before it ships, and no
old-format project may be left behind once the old format is gone.

**Independent Test**: Build the preview and open each of the five projects; each is a
four-part story with a valid table. Build production and confirm none of the five is listed or
has a page.

**Acceptance Scenarios**:

1. **Given** each of the five existing projects, **When** it is opened on the preview, **Then**
   it shows the four parts, a constraint list and a valid options table drawn from its current
   constraints and options, and no claim that was not already in the project.
2. **Given** the production build, **When** the project list is opened, **Then** none of the
   five projects appears and none has a page, Focus Pocus included.
3. **Given** the project settings, **When** a project file uses display order, an embedded
   demo, a video clip, or pros and cons, **Then** the build fails naming the setting, because
   those settings no longer exist.

### Edge Cases

- **A part is missing, renamed, repeated or out of order**: the build fails naming the file
  and saying which of Problem, Options, Build and Lessons is wrong, since a page with three or
  five parts would not match the design.
- **Extra headings inside a part**: smaller sub-headings within a part are allowed and do not
  count as parts.
- **A picture is assigned to a part that does not exist, or two pictures to one part**: the
  build fails naming the file and the picture.
- **A picture is named in the details but not assigned to any part**: allowed (for example the
  picture shown on the list row).
- **A constraint item's explanation is missing or runs to more than one line**: allowed; only
  the bold label is checked.
- **The invitation sentence is empty or absent**: the standard sentence is shown.
- **Cell answers written with different capitalisation** ("Yes", "PARTLY"): accepted; the
  answer is case-insensitive.
- **The chosen option is bolded only in part** (for example one word of its name): treated as
  not bold; the check names the rule.
- **A project with only one option**: allowed; the table has one row, which is in bold.
- **The "Why" line runs to more than one sentence**: allowed; it only has to begin with "Why".
- **A table appears in a part other than Options**: allowed, and not checked against the
  options rules.
- **No live version and no source**: the Build part shows no link area.
- **Every project is a draft in production**: the list shows its existing empty state, and the
  home page, navigation and site map carry no links to project pages that do not exist.

## Requirements *(mandatory)*

### Functional Requirements

#### Project page

- **FR-001**: A project page MUST open with a compact heading that shows the project's name,
  its one-line problem, its status and its themes.
- **FR-002**: A project page MUST show exactly four parts, headed Problem, Options, Build and
  Lessons, in that order.
- **FR-003**: Part headings MUST be the same size as section headings on a writing post. The
  page MUST NOT show a table of contents, chapter numbers, or any animation on part headings.
- **FR-004**: No part may be sized to fill the screen; the vertical gap between parts MUST be
  about the gap between sections on a writing post.
- **FR-005**: Each part MAY carry one picture or diagram, shown beside the part's text on a
  wide screen and below it on a phone. Pictures keep their written alternative text, and a
  diagram keeps its written description. The part a picture sits beside MUST be chosen in the
  project's details at the top; the body MUST NOT need any picture tag.
- **FR-006**: The Options part MUST be shown as written: a paragraph on the routes that were
  open, a list of constraints (each a bold label followed by a one-line explanation), the
  options table, and a closing line beginning "Why".
- **FR-007**: Options table cells MUST be coloured by their answer (yes, partly, no) using the
  site's existing comparison colours, MUST keep the answer as visible text, and the chosen
  option's row MUST be distinguishable without relying on colour alone.
- **FR-008**: When a project has a live version, its source, or both, links to them MUST
  appear with the Build part without the writer placing them in the text. A project with
  neither MUST show no link area.
- **FR-009**: Every project page MUST end with a short invitation to get in touch about a
  similar problem, linking to the contact page as today, without the writer placing it. When
  the project's details hold an optional one-line invitation sentence, that sentence MUST be
  shown before the standard contact link; otherwise a standard sentence MUST be shown.
- **FR-010**: The thin reading progress bar at the top of the page MUST remain, and the project
  title MUST still carry over from the list to the page when a story is opened from the list.
- **FR-011**: The whole page (heading, four parts, table, links, invitation) MUST be readable
  with JavaScript turned off, and MUST meet WCAG 2.2 AA.

#### Writing a project

- **FR-012**: A project MUST be written as one file: details at the top (name, problem line,
  description, status, themes, date, pictures with the part each sits beside, any links and an
  optional invitation sentence) followed by the four parts as ordinary headed text.
- **FR-013**: The options table MUST be written as an ordinary table in the Options part, in
  one fixed shape: the first column names each option; every other column is one constraint;
  every cell is yes, partly or no; exactly one option's name is in bold (the chosen option);
  and the first line after the table begins "Why".
- **FR-014**: Each item in the constraint list above the table MUST be a bold label, a colon,
  then a one-line explanation. The bold labels MUST use the same names, in the same order, as
  the table's constraint column headings; the explanations are not checked.
- **FR-015**: A check that runs with every build (preview and production, drafts included) MUST
  reject a project whose Options part breaks any rule in FR-013 or FR-014, or whose parts break
  FR-002, with a message naming the project file and the rule broken.
- **FR-016**: The writer MUST only have to assign pictures to parts in the details at the top;
  the heading, pictures, links and closing invitation are placed by the page.
- **FR-017**: The project settings for display order, embedded demos, video clips, and pros
  and cons MUST be removed, and a project file that still uses one MUST fail the build naming
  the setting. The structured comparison settings and the hand-placed chapter wrappers are
  replaced by the plain table and headings and MUST likewise be rejected if used.
- **FR-018**: With display order gone, the project list MUST order projects by date, newest
  first, then by name.

#### Template

- **FR-019**: A template file MUST sit beside the projects, marked as a draft, holding
  placeholder details at the top (including an example picture assigned to a part and an
  example invitation sentence), the four headed parts, a constraint list in the label-and-
  explanation form and an example options table in the required shape followed by a "Why"
  line.
- **FR-020**: The template MUST NOT appear in the project list or get a page of its own on any
  build, and MUST itself satisfy the part and table rules so a fresh copy builds cleanly.

#### Project list

- **FR-021**: The project list MUST keep its current rows and theme filter, with the vertical
  space between rows reduced to match the tighter project pages.

#### Existing projects

- **FR-022**: The five existing projects MUST be rewritten into the four-part shape using only
  their current text: the problem text goes in Problem; each constraint's label and one-line
  explanation become a constraint list item; the options and the reason for the choice become the Options paragraph, table and
  "Why" line; what was built and how it turned out go in Build; the lessons go in Lessons.
  Each project's current invitation sentence moves to its optional invitation detail. Text
  that lived only in the removed pros and cons may be dropped, but no new claims may be added.
- **FR-023**: All five existing projects, Focus Pocus included, MUST be marked as drafts, so
  that none appears in production until Don publishes it, and all five appear on the preview.
- **FR-024**: Existing review notes in the migrated projects (the "draft for review" comments)
  MUST be kept so Don can still see what needs his correction.

### Key Entities

- **Project**: one story file. Details: name, one-line problem, description, status, themes,
  date, the picture shown on the list, the pictures used in parts (each with alternative text,
  a description for a diagram, and the part it sits beside), optional live link, optional
  source link, optional invitation sentence, draft flag. Body:
  the four parts.
- **Part**: one of Problem, Options, Build, Lessons; a heading, ordinary text and at most one
  picture.
- **Options table**: rows are options, columns are constraints, cells are yes, partly or no;
  one chosen option in bold; followed by a "Why" line. Tied by name and order to the bold
  labels of the constraint list, whose items each add a one-line explanation.
- **Template**: a draft project file that is never listed or published and shows the shape to
  copy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every project page shows exactly four parts in the fixed order, a heading with
  name, problem, status and themes, and the closing invitation, with no table of contents,
  chapter numbering or heading animation.
- **SC-002**: Each of the five rewritten project pages is shorter, measured as total page
  height at phone width, than the same project's page before this change.
- **SC-003**: A new project can be started by copying, renaming and filling in the template,
  with no other file touched, and it builds without error on the first try when the table
  follows the template's shape.
- **SC-004**: Each table and part rule (option column, constraint columns, cell answers,
  exactly one bold option, "Why" line, constraint list matching the headings, the four parts in
  order) has a deliberate violation that fails the build with a message naming both the file
  and that rule.
- **SC-005**: The production build lists no projects and builds no project pages, while the
  preview build lists and builds all five.
- **SC-006**: Every project page and the project list pass the site's automated accessibility
  checks and stay within the existing performance budget.
- **SC-007**: Don has reviewed the project list and each of the five project pages on the
  preview deployment and approved the pull request before it merges.

## Assumptions

- The four part headings use exactly the words Problem, Options, Build and Lessons. Smaller
  sub-headings inside a part are allowed.
- The constraint list's bold labels must match the table headings in both names and order, so
  the list and the table read the same way and the check is simple to explain.
- Cell answers are case-insensitive: yes, partly or no in any capitalisation.
- The closing invitation keeps today's link to the contact page with the project named; an
  optional per-project sentence comes before it, and a standard sentence is used when none is
  given.
- The links shown with the Build part are the existing live link (an address on drc.dev or a
  stand-in page) and the source link; only the embedded form of the demo goes away.
- The draft mark that a draft project page shows on the preview stays; the per-chapter draft
  marks go away with the chapters.
- The picture shown on a project's list row stays as today.
- The template is left out of the site because its file name marks it as not a project; it is
  still checked so it stays a valid starting point.
- Making Focus Pocus a draft leaves the production project list empty until Don publishes a
  project; the existing empty-list state covers this, and nothing else on the site links to a
  project page.
- The rest of the site (writing posts, home page, navigation, contact) is unchanged.

## Out of Scope / Follow-up Work

- Publishing any of the five projects (turning a draft into a published project) after Don
  rereads them on the preview; this is Don's call per project.
- Correcting the facts flagged in the migrated projects' review notes.
- Any redesign of the project list rows beyond tightening their spacing.
- Bringing back embedded demos or video clips in a new form, if a future project needs them.
- The setup check that waits on published project content stays red until Don publishes
  projects; changing that check is not part of this feature.
