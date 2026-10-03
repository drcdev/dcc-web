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
   bar at the top of the page still tracks their position (as today, it is not shown when the
   visitor has asked for reduced motion or the browser cannot drive it).
10. **Given** the project list, **When** the visitor opens a project, **Then** the project title
    still carries over from the list row into the page heading as it does today (without
    animation when the visitor has asked for reduced motion).
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
- **The chosen option is bolded only in part** (for example one word of its name), or is in
  italic only: treated as not bold; the check names the rule.
- **A project with only one option**: allowed; the table has one row, which is in bold.
- **A table with a header row but no option rows, or with no constraint columns**: the build
  fails (no option is in bold; at least one constraint column is needed).
- **Two options with the same name, or two constraint columns with the same heading**: the
  build fails naming the file and the repeated name.
- **The "Why" line runs to more than one sentence**: allowed; it only has to begin with the word
  "Why".
- **A review note (comment) sits between the table and the "Why" line**: allowed; comments and
  blank lines are skipped when finding the first block after the table.
- **A picture fails to load in the browser**: its alternative text shows in its place and the
  part's text still reads in full.
- **A table appears in a part other than Options**: allowed, and not checked against the
  options rules.
- **No live version and no source**: the Build part shows no link area.
- **Every project is a draft in production**: the list shows its existing empty state, and the
  home page, navigation and site map carry no links to project pages that do not exist.

## Requirements *(mandatory)*

### Functional Requirements

#### Project page

- **FR-001**: A project page MUST open with a compact heading that shows the project's name
  (the page's only level-1 heading), its one-line problem, its status and its themes. The
  status is shown as the word Shipped, Experiment or In progress, and each theme as its name;
  colour is never the only signal, and the text meets 4.5:1 contrast in both themes.
- **FR-002**: A project page MUST show exactly four parts, headed Problem, Options, Build and
  Lessons, in that order. Each part heading is a level-2 heading whose text, with surrounding
  spaces trimmed, is exactly one of those four words, capitalised as shown, with nothing else
  in it. Sub-headings inside a part are level 3 or lower and do not count as parts; a level-1
  heading in the body is not allowed. Writers start sub-headings at level 3 and do not skip
  levels, so the outline runs title (level 1), parts (level 2), sub-headings (level 3 and
  below); the automated accessibility checks catch a skipped level on the pages they check.
- **FR-003**: Part headings MUST be the same size as section headings on a writing post. The
  page MUST NOT show a table of contents, chapter numbers, or any animation on part headings,
  whatever the visitor's motion preference; nothing in a part moves.
- **FR-004**: No part may be sized to fill the screen; the vertical gap between parts MUST be
  about the gap between sections on a writing post.
- **FR-005**: Each part MAY carry at most one picture or diagram, shown beside the part's text
  (text first, picture to its right) when the viewport is at least 64rem (1024 CSS pixels)
  wide, and below the text when it is narrower. The page source keeps the text before the
  picture, so reading order matches the visual order at every width. The part a picture sits
  beside MUST be chosen in the project's details at the top by naming one of the four parts;
  naming anything else, or giving two pictures the same part, fails the build naming the file
  and the picture. A picture with no part is allowed and is not shown in the story. The body
  MUST NOT need any picture tag, and a picture placed in the body fails the build. Every part
  picture is informative (there is no decorative option): its written alternative text is
  required and non-empty, and a diagram also needs a written description, shown as a visible
  caption under it and tied to it for screen readers; a missing one fails the build. A part's
  text MUST read in full without its picture.
- **FR-006**: The Options part MUST be shown as written: a paragraph on the routes that were
  open, a list of constraints (each a bold label followed by a one-line explanation), the
  options table, and a closing line beginning "Why".
- **FR-007**: Options table cells MUST be tinted by their answer (yes, partly, no) using
  existing site palette colours, with no new design token (today's comparison has no
  per-answer colours, so the tints are chosen in this feature and seen by Don at review). Each
  cell MUST show its answer as the written word Yes, Partly or No, which assistive technology
  reads; any symbol beside the word is hidden from assistive technology. The word and the tint
  come from the same checked answer, so they cannot disagree whatever capitalisation the
  writer used. Cell text MUST meet 4.5:1 contrast against its tint in light and dark themes.
  The chosen option's row MUST be marked by the visible word "Chosen" and a heavier row edge
  that meets 3:1 contrast with its surroundings, as well as by colour; the tints carry nothing
  the words do not, so they need not meet 3:1. In forced-colours mode the tints drop away and
  the words and the chosen marker stay. The table MUST have a caption naming the project, the
  option and constraint headings as column header cells, and each option name as a row header
  cell.
- **FR-008**: When a project has a live version, its source, or both, links to them MUST
  appear with the Build part without the writer placing them in the text. A project with
  neither MUST show no link area. Each link's text MUST say what it opens and name the
  project (for example "Source code for <name>"), so it makes sense out of context.
- **FR-009**: Every project page MUST end with a short invitation to get in touch about a
  similar problem, linking to the contact page as today, without the writer placing it. When
  the project's details hold an optional one-line invitation sentence, that sentence MUST be
  shown before the standard contact link; otherwise a standard sentence MUST be shown. The
  link text names the project ("Tell me about a problem like <name>"). The invitation sentence
  is plain text on one line: surrounding spaces are trimmed, Markdown in it is shown as
  written rather than formatted, an empty or space-only sentence counts as absent, and no
  length limit is enforced beyond keeping it to one sentence.
- **FR-010**: The thin reading progress bar at the top of the page MUST remain, and the project
  title MUST still carry over from the list to the page when a story is opened from the list.
  Both stay as they are today: visual effects only, needing no script. The progress bar is
  hidden from assistive technology and is not shown when the visitor has asked for reduced
  motion or the browser cannot drive it; the title carry-over does not animate under reduced
  motion. Neither is needed to read the page.
- **FR-011**: The whole page (heading, four parts, table, links, invitation) MUST be readable
  with JavaScript turned off, and MUST meet WCAG 2.2 AA.
- **FR-025**: The page MUST be one article inside the page's main content: the heading in a
  header, each part a section labelled by its own heading, and the invitation closing the
  article. The order in the page source MUST match the visual order at every width.
- **FR-026**: The options table MUST NOT make the page scroll sideways. When it is wider than
  the text column it scrolls sideways inside its own region, which is named by the table
  caption and can be reached and scrolled with the keyboard, and it keeps its header cells so
  every answer stays tied to its option and constraint. The rest of the page, including the
  picture layout, MUST reflow to one column at 320 CSS pixels wide (400 percent zoom) and keep
  all text visible when text is enlarged to 200 percent.
- **FR-027**: Keyboard focus on the Build links, the invitation link, the table region and the
  list's theme filter MUST stay visible, and the progress bar (a 4 CSS pixel strip that never
  takes pointer input) MUST NOT hide a focused element. After the list's row spacing is
  reduced, its row links and theme filter buttons MUST still have targets of at least 24 by
  24 CSS pixels, or the spacing WCAG 2.2 success criterion 2.5.8 allows; the filter's keyboard
  behaviour is unchanged (009 FR-013, FR-018, FR-062).

#### Writing a project

- **FR-012**: A project MUST be written as one file: details at the top followed by the four
  parts as ordinary headed text. Required details: name; one-line problem (one sentence of at
  most 140 characters); description; status (shipped, experiment or in-progress); themes (one
  to four, none repeated); date; the picture shown on the list, with its alternative text.
  Optional details: pictures used in parts (each with alternative text, a description for a
  diagram, and the part it sits beside); live link; stand-in link; source link; sharing image;
  invitation sentence; draft flag (not a draft when absent). Any other detail fails the build
  naming it.
- **FR-013**: The options table MUST be written as an ordinary table in the Options part, in
  one fixed shape:
  - the first header cell heads the option column: any non-empty text, shown as written (the
    template uses "Option"), and each row's first cell names one option;
  - every other header cell is one constraint, and there is at least one;
  - there is at least one option row, every row has exactly one cell per header cell, and
    there is no upper limit on options or constraints;
  - no two options share a name and no two constraint headings are the same;
  - every answer cell, with surrounding spaces trimmed and any formatting inside it (bold,
    italic, a link) ignored, is yes, partly or no in any capitalisation; anything else fails,
    including an empty cell or trailing punctuation ("yes.");
  - exactly one option's name is in bold (the chosen option): its whole first cell is a single
    bold run (bold that is also italic counts); a name bolded only in part, or in italic only,
    is not bold;
  - the first block after the table, skipping blank lines and comments, is a paragraph whose
    text begins with the word "Why" with a capital W (for example "Why the custom app won:
    …"); a heading, list or table there, a lower-case "why", or a longer word such as
    "Whyever" fails.

  The Options part, including any sub-sections in it, holds exactly one table. Tables in the
  other parts are allowed and not checked.
- **FR-014**: The constraint list is the last list (bulleted or numbered) before the table in
  the Options part; an Options part with no list before its table fails the build. Each item
  MUST start with a bold label followed by a colon (at the end of the bold text or straight
  after it), then a one-line explanation. A label is compared with its column heading by its
  text, with surrounding spaces and the colon removed and any formatting inside it ignored; the
  comparison is otherwise exact, including capitalisation and punctuation. The labels MUST
  match the table's constraint column headings one for one, in the same order; the
  explanations are not checked.
- **FR-015**: A check that runs with every build (preview and production, drafts included) MUST
  reject a project whose Options part breaks any rule in FR-013 or FR-014, or whose parts break
  FR-002, with a message naming the project file and the rule broken, plus what is needed to
  find the mistake: the part heading for a part rule, the option and constraint for a cell,
  both lists of names for a label mismatch, the repeated name for a duplicate, and the count
  for the bold-option rule. The check reports the first broken rule in a file and the build
  stops at the first failing file. Details at the top are checked before the body; in the
  body, the plain-text rules (no tags, imports or body pictures) and the part rules come
  before the Options rules, so a file breaking both reports the part error. The page renders
  the table from exactly what the check accepted, so a passing build cannot show a table
  different from the one checked.
- **FR-016**: The writer MUST only have to assign pictures to parts in the details at the top;
  the heading, pictures, links and closing invitation are placed by the page.
- **FR-017**: The project settings for display order, embedded demos, video clips, and pros
  and cons MUST be removed, and a project file that still uses one MUST fail the build naming
  the setting. The structured comparison settings and the hand-placed chapter wrappers are
  replaced by the plain table and headings and MUST likewise be rejected if used: a body
  that still holds a chapter wrapper or any other tag fails naming the tag and saying the body
  must be plain Markdown.
- **FR-018**: With display order gone, the project list MUST order projects by date, newest
  first, then by name (A to Z), then by file name when both match. Every project has a date
  (FR-012). Drafts shown on the preview are ordered by the same rule.

#### Template

- **FR-019**: A template file MUST sit beside the projects, marked as a draft, holding
  placeholder details at the top (including an example picture assigned to a part and an
  example invitation sentence), the four headed parts, a constraint list in the label-and-
  explanation form and an example options table in the required shape followed by a "Why"
  line. Placeholder text is written as instructions to the writer (for example "Say in one
  sentence what problem the project solved"), and placeholder links use example.com
  addresses, so nothing in it can be mistaken for a real project once copied. Its example
  picture has placeholder alternative text and a diagram description that meet the same
  rules as a real project's. Notes in the template, never shown on a page, say which details
  are optional and what to replace or delete; the author guide says the same.
- **FR-020**: Any file in the projects folder whose name starts with an underscore is not a
  project: on every build it is never listed, gets no page, is left out of the site map and
  navigation, and is not part of the build's part and table check. The template is such a
  file. Automated tests MUST check the template against every detail, part and table rule,
  and a copy of it that is only renamed (still a draft) MUST build cleanly and show on the
  preview with four parts, links and the invitation.

#### Project list

- **FR-021**: The project list MUST keep its current rows and theme filter, with the vertical
  space between rows reduced to match the tighter project pages.

#### Existing projects

- **FR-022**: The five existing projects MUST be rewritten into the four-part shape using only
  their current text. All five have text in each of today's seven chapters, so no part is
  left empty. The mapping:
  - Problem: the problem chapter.
  - Options: the options chapter's paragraph, plus any constraints-chapter text that does not
    repeat a constraint's explanation; then one list item per current constraint, in current
    order (its label in bold, a colon, its current one-line explanation); then the table; then
    the current reason for the choice as the "Why" line, reworded only so it starts with "Why".
  - The table: first column headed "Option"; one row per current option, in current order,
    named by its current name; one column per current constraint, in current order, headed by
    its current label; each current answer mapped meets → yes, partly → partly, misses → no;
    the option currently marked chosen is the one in bold.
  - Build: the built chapter, then the outcome chapter.
  - Lessons: the lessons chapter.
  - Pictures: each chapter picture is assigned to the part its chapter moves into. Where two
    land in one part (Focus Pocus's built and outcome pictures), the built chapter's picture
    keeps the part and the other stays in the details with no part, for Don to place at review.
  - Each project's current invitation sentence moves to its optional invitation detail.

  Text may be dropped only where it lived in the removed pros and cons, option summaries or
  comparison caption, or where it repeats a constraint's explanation, and every dropped piece
  is listed per project in the pull request description. No new claims may be added: every
  sentence in a rewritten project is current text or a rewording of it that adds no fact, which
  Don checks at review (SC-007).
- **FR-023**: All five existing projects, Focus Pocus included, MUST be marked as drafts, so
  that none appears in production until Don publishes it, and all five appear on the preview.
- **FR-024**: Existing review notes in the migrated projects (the "draft for review" comments)
  MUST be kept so Don can still see what needs his correction.

### Key Entities

- **Project**: one story file. Details (required and optional as listed in FR-012): name,
  one-line problem, description, status, themes, date, the picture shown on the list, the
  pictures used in parts (each with alternative text, a description for a diagram, and the
  part it sits beside), optional live or stand-in link, optional source link, optional sharing
  image, optional invitation sentence, draft flag. Body: the four parts.
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
- **SC-002**: Each of the five rewritten project pages is shorter, measured as the full
  document height at a 390 CSS pixel wide viewport in the light theme on a non-production
  build, than the same project's page built from the main branch before this change, measured
  the same way. Both sets of numbers are recorded in the pull request description.
- **SC-003**: A new project can be started by copying, renaming and filling in the template,
  with no other file touched, and it builds without error on the first try when the table
  follows the template's shape.
- **SC-004**: Each table and part rule (option column, constraint columns, cell answers,
  exactly one bold option, unique option and constraint names, "Why" line, constraint list
  matching the headings, the four parts in order) has a deliberate violation that fails the build with a message naming both the file
  and that rule.
- **SC-005**: The production build lists no projects and builds no project pages, while the
  preview build lists and builds all five.
- **SC-006**: Every project page and the project list pass the site's automated accessibility
  checks and stay within the existing performance budget. The checks cover a project page
  with a picture in every part, an options table, all three kinds of link and the invitation;
  the Focus Pocus page; and the project list, including its filtered and empty states (the
  production empty state, unchanged by this feature, keeps its existing component test).
- **SC-007**: Don has reviewed the project list and each of the five project pages on the
  preview deployment and approved the pull request before it merges. In that review he also
  checks what automated checks cannot: that reading order matches the layout, that
  alternative text and diagram descriptions are meaningful, that the table scrolls in its own
  region on a phone without the page scrolling sideways, that the new cell tints read well in
  both themes, and that no rewritten project makes a new claim.

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
- The draft notice that a draft project page shows on the preview stays, as written text
  rather than colour alone; the per-chapter draft marks go away with the chapters.
- The picture shown on a project's list row stays as today.
- The template is left out of the site because its file name starts with an underscore,
  which marks it as not a project (FR-020); automated tests still check it so it stays a valid
  starting point.
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
