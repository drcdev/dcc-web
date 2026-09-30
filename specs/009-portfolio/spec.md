# Feature Specification: The portfolio

**Feature Branch**: `009-portfolio`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "The portfolio — give Don a portfolio that shows how he thinks about solving problems and encourages visitors with a similar problem to get in touch, built to the design direction he chose: story pages use Direction C (Chapters); the index page uses Direction C but with the content layout of Direction A (two columns instead of three), as recorded in docs/design/portfolio.md under 'Decision'. Each project is a story in seven stages (the problem and who had it; the constraints; the options considered and why one was chosen, with every option viewable; what was built; what happened; what he would do differently; an invitation, 'Have a problem like this?', leading to the contact form with the project noted). Stories reveal as the reader scrolls, with visuals, diagrams and short demo clips next to the part they explain, and live demos on drc.dev can be opened or embedded. The index shows each project's title, one-line problem, visual, themes and status, and can be filtered by theme. Don adds a project with one text file plus its images, uses the story elements as building blocks in any project, and every story stays fully readable with reduced motion or JavaScript off. Hosting the demos is out of scope." (The full feature prompt also carries a technical-direction section for planning; it is deliberately not restated here as requirements.)

## Context

Feature 006 built three throwaway design directions for the portfolio and Don chose one. The
decision, recorded at the end of `docs/design/portfolio.md`, is:

- **Story pages: Direction C (Chapters).** Full-width chapters in a fixed order, a visual that
  stays in view beside its chapter text on wide screens, a reading-progress bar at the top of the
  page, options compared in a table of constraints against options, chapter headings that uncover
  as they scroll in, and a page transition between the index and a story.
- **Index page: Direction C, using Direction A's content layout.** The index keeps Direction C's
  look (one project per full-width ruled row) and its page transition, but each row uses Direction
  A's two-column split (title, one-line problem, status and themes on the left; the visual on the
  right) instead of Direction C's three columns within the row.

The site foundation already shows a "Projects" entry in the header navigation that points at
`/projects/`, which is currently reserved as a future address and shows the not-found page. The
contact form (feature 007) accepts a project named in its link. This feature builds the projects
index and the story pages, the way Don adds projects, and the reusable story building blocks, and
makes the existing Projects navigation entry lead to a real page.

Because it makes a navigation entry live, adds a new site-wide page type with its own layout and
visual treatment, adds page transitions, and changes the security policy (story pages that embed
a demo allow frames from drc.dev), it is a **major change** under Constitution Principle III: the pull request is labelled as such and waits for Don's approval after he has
looked at the preview deployment.

## Clarifications

### Session 2026-09-29

- Q: How should the projects index lay out each project? → A: One project per full-width row in
  Direction C's ruled style; inside each row, Direction A's two-column split (title, problem,
  status and themes on the left; visual on the right). Not a grid of cards.
- Q: Should the comparison table also show each option's points for and against? → A: Optional.
  Each option may list points for and against; those rows appear only when at least one option
  has them, and a missing list never fails the build.
- Q: Should each story page have an "In this story" list of the seven chapters? → A: Yes. A plain
  list of chapter links, with no script, placed after the title and problem line.
- Q: Apart from a live demo, should a project be able to link out to other places? → A: One
  optional source-code link (any HTTPS address), shown in the "What I built" chapter beside the
  demo or stand-in link. Index entries link only to their story.
- Q: With JavaScript off, what should the index's theme filter do? → A: It is not shown. The filter
  is a small script that sets `?theme=<theme>` in the address; with JavaScript off the filter
  controls are hidden and every project is listed. No per-theme pages are built.
- Q: Are themes free text in each project file or picked from a fixed list? → A: Free text, matched
  ignoring case and spacing; variants show under one label on the index. Adding a project still
  needs only one file.
- Q: Should draft projects appear on preview deployments? → A: Yes. Drafts appear on preview
  deployments and in local development with a visible "Draft" mark, and are left out of production
  builds only (no index entry, no story page, no sitemap entry).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor reads a project as a story (Priority: P1)

A visitor opens a project and reads it as a story in seven chapters, in a fixed order: the
problem and who had it; what made it hard (the constraints); the options Don considered and why
he chose one; what he built; what happened; what he would do differently; and an invitation,
"Have a problem like this?". After the title and problem line, a short "In this story" list links
to each chapter. A thin bar at the top of the page shows how far through the story
they are. On a wide screen, each chapter's visual (screenshot, diagram or short clip) stays in
view beside the text it explains; on a phone it sits after that text. Chapter headings uncover as
they scroll into view.

**Why this priority**: The story is the reason the portfolio exists: it shows how Don thinks.
Without it the index has nothing to link to.

**Independent Test**: On a preview deployment, open the Focus Pocus story in both themes at phone
and desktop widths and read it top to bottom; confirm the seven chapters appear in order with
their visuals next to the text they explain, and compare the page by eye with the Direction C
story screenshots in `docs/design/portfolio.md`.

**Acceptance Scenarios**:

1. **Given** a published project, **When** a visitor opens its story page, **Then** the page
   shows the project's title as its main heading and the seven chapters in the fixed order, each
   with its own heading.
2. **Given** a chapter that has a visual, **When** the page is viewed on a wide screen with
   motion allowed, **Then** the visual stays in view beside that chapter's text while the reader
   scrolls through the chapter, and never covers text or a focused element.
3. **Given** a chapter that has a visual, **When** the page is viewed on a narrow screen,
   **Then** the visual appears as an ordinary block after that chapter's text, with no
   horizontal page scrolling.
4. **Given** a chapter with no visual, **When** it renders, **Then** no empty space is left
   where a visual would go.
5. **Given** the story page with motion allowed, **When** the reader scrolls, **Then** the
   progress bar fills in step with how far through the page they are, and each chapter heading
   uncovers as it enters the viewport.
6. **Given** every visual, **When** it is read by assistive technology, **Then** it has a text
   alternative, and every diagram has a text description a reader can reach.
7. **Given** the story page, **When** automated accessibility checks run on it in both themes,
   **Then** they report no violations.
8. **Given** a story page, **When** it renders, **Then** an "In this story" list follows the title
   and problem line, with one link per chapter in order, each leading to that chapter's heading,
   and it works with JavaScript off.

---

### User Story 2 - A visitor compares the options Don weighed (Priority: P1)

In the options chapter, a visitor sees every option Don considered, not only the one he picked,
laid out in one table of the project's constraints against the options, with how well each option
met each constraint. Where Don has listed points for and against an option, those appear in the
table too. The chosen option is marked and the reason for choosing it is stated. On a
phone the table scrolls sideways inside its own labelled region, not the whole page.

**Why this priority**: Showing the options and the reasoning is what distinguishes these stories
from a list of finished work; it is the core of "how Don thinks".

**Independent Test**: Open the Focus Pocus story, reach the options chapter by keyboard, and
confirm every option and every constraint appear in the table, the chosen option is marked with
its reason, and on a phone the table scrolls within its region.

**Acceptance Scenarios**:

1. **Given** a project with several options, **When** the options chapter renders, **Then** every
   option appears in the comparison, each with its name and a short summary, and every constraint
   has a stated fit for every option.
2. **Given** the comparison, **When** it renders, **Then** exactly one option is marked as chosen,
   in text as well as visually (not by colour alone), and the reason it was chosen is shown
   without any interaction.
3. **Given** a phone-width screen, **When** the comparison is wider than the screen, **Then** it
   scrolls sideways inside its own region, the region can be reached and scrolled with the
   keyboard, and it has an accessible name.
4. **Given** the comparison, **When** it is read by a screen reader, **Then** it is announced as
   a table with row and column headers, so each fit is read with its option and constraint.
5. **Given** at least one option lists points for or against, **When** the comparison renders,
   **Then** it has an "In its favour" row and an "Against it" row, and an option with no list
   shows an empty cell there; **given** no option lists any, **Then** neither row appears and the
   build still succeeds.

---

### User Story 3 - A visitor with a similar problem gets in touch (Priority: P1)

At the end of a story, a visitor who has a problem like the one described follows the invitation,
"Have a problem like this?", to the contact form, which already knows which project they came
from.

**Why this priority**: Encouraging visitors with a similar problem to get in touch is the
business purpose of the portfolio.

**Independent Test**: Open a story, follow the invitation link, and confirm the contact page opens
with that project noted on the form.

**Acceptance Scenarios**:

1. **Given** any story page, **When** the reader reaches its last chapter, **Then** it is the
   invitation headed "Have a problem like this?" with a link to the contact form.
2. **Given** the invitation link on a project's story, **When** it is inspected, **Then** it
   points to `/contact/?project=<that project's slug>` and carries nothing else.
3. **Given** the invitation link, **When** it is read by assistive technology, **Then** its
   accessible name says which project it is about.
4. **Given** the invitation link, **When** it is followed, **Then** the contact page opens and
   the form shows the project it came from.
5. **Given** JavaScript is turned off, **When** the reader follows the invitation, **Then** the
   link still works and the contact page opens.

---

### User Story 4 - A visitor browses and filters the projects index (Priority: P1)

A visitor follows "Projects" in the header and reaches the projects index. Projects are listed one
per full-width ruled row. On wide screens each row is split in two: the title, one-line problem
statement, status (shipped, experiment or in progress) and themes on the left, and the project's
visual on the right; on a phone the visual follows the text. The visitor can narrow the list to one theme and clear the filter again. Choosing a
project opens its story, with a page transition that carries the project's title across.

**Why this priority**: The index is the entry point from the navigation and the only way to find
more than one project. It also fills a navigation link that currently leads to the not-found
page.

**Independent Test**: On a preview deployment, follow "Projects" in the header, confirm one
project per row with text left and visual right at desktop width and stacked on a phone, filter by a theme, clear it, and
open a story; compare the page by eye with the chosen direction.

**Acceptance Scenarios**:

1. **Given** the site is built, **When** a visitor requests `/projects/`, **Then** the index loads
   with a success status and the Projects navigation entry is marked as the current page, visually
   and to assistive technology.
2. **Given** the index on a wide screen, **When** it renders, **Then** each project takes one
   full-width ruled row, with its title, problem, status and themes in the left column and its
   visual in the right column; **given** a phone-width screen (320 px and up), **Then** the visual
   follows the text in a single column with no horizontal page scrolling.
3. **Given** each project on the index, **When** it renders, **Then** it shows the title, a
   one-line problem statement, a visual with a text alternative, one or more themes, and one
   status, with the status conveyed in text and not by colour alone. Its only link is to its
   story.
4. **Given** the index, **When** a visitor chooses a theme, **Then** only projects with that theme
   are shown, the chosen theme is indicated to sight and to assistive technology, and the number of
   projects shown is announced.
5. **Given** a theme filter is applied, **When** the visitor clears it, **Then** every project is
   shown again.
6. **Given** a filtered index, **When** the visitor shares or reloads the page address (which
   carries the theme as `?theme=<theme>`), **Then** the same theme filter is applied.
7. **Given** a project on the index, **When** the visitor chooses it, **Then** its story page
   opens; with motion allowed and a supporting browser, the change uses a page transition, and
   otherwise the page loads normally.
8. **Given** the index, **When** it is viewed in both themes, **Then** it matches the chosen
   direction and automated accessibility checks report no violations.

---

### User Story 5 - Every reader gets the whole story (Priority: P1)

A visitor who has asked their system for reduced motion, or who has JavaScript turned off, reads
the whole story and the whole index with nothing missing.

**Why this priority**: The constitution requires core content, including project stories, to be
readable with JavaScript off, and the site must meet WCAG 2.2 AA.

**Independent Test**: Load the index and a story with reduced motion requested, then with
JavaScript turned off, and confirm every chapter, visual, option, fit, reason and link is present
and readable.

**Acceptance Scenarios**:

1. **Given** reduced motion is requested, **When** a story loads, **Then** there is no progress
   bar movement, no heading uncover, no sticky visual and no page transition; every chapter shows
   in its final state as a plain block, with its visual after its text.
2. **Given** reduced motion is requested, **When** a story contains a short clip, **Then** the clip
   does not play by itself.
3. **Given** JavaScript is turned off, **When** a story loads, **Then** all seven chapters, every
   visual's text alternative, the full option comparison with the chosen option and its reason,
   any demo link and the invitation link are present and readable.
4. **Given** JavaScript is turned off, **When** the index loads, **Then** every project is listed
   with all its details, and the theme filter controls are not shown; no control is shown that
   does nothing.
5. **Given** a browser without support for scroll-linked effects or page transitions, **When** a
   story or the index loads, **Then** the content shows in its final state and pages load
   normally, with nothing hidden.

---

### User Story 6 - A visitor opens or sees a live demo (Priority: P2)

Where a project has a live demo hosted on drc.dev, a visitor can open it in its own page, or see it
embedded in the story next to the chapter it illustrates.

**Why this priority**: A working demo is strong evidence, but only some projects have one, and the
story reads fully without it.

**Independent Test**: Build a test project with a live demo marked for embedding and another with a
link only; confirm the embed shows beside the right chapter with an "open" link, and the link-only
demo shows a link and no embed.

**Acceptance Scenarios**:

1. **Given** a project with a live demo on drc.dev, **When** its story renders, **Then** there is a
   link that opens the demo, with link text saying what it opens.
2. **Given** a demo marked to be embedded, **When** the story renders, **Then** the demo appears
   embedded next to the chapter it illustrates, with a title that names it, and the "open" link
   is still offered.
3. **Given** an embedded demo, **When** the page first loads, **Then** the demo does not load or
   play until the reader reaches it or asks for it, and it never plays sound by itself.
4. **Given** JavaScript is turned off or the embed cannot load, **When** the story renders,
   **Then** the link to open the demo is still present and works.
5. **Given** a demo address that is not on drc.dev, **When** the site is built, **Then** the build
   fails naming the project file and the address.
6. **Given** a project with no live demo, **When** its story renders, **Then** no demo link or
   embed placeholder is shown, unless the project names a stand-in page, which is then linked with
   a note saying it is not a live demo.
7. **Given** a project that names a source-code address, **When** its story renders, **Then** a
   link to the source code appears in the "What I built" chapter beside any demo or stand-in link,
   and nowhere on the index; **given** that address is not HTTPS, **When** the site is built,
   **Then** the build fails naming the file and the address.

---

### User Story 7 - Don adds a project with one text file (Priority: P1)

Don wants to add a project. He adds one text file, containing the project's settings (title,
one-line problem, themes, status, index visual and optional demo) followed by its story, plus the
images it uses. He changes nothing else. After the next build the project is on the index and its
story is live at `/projects/<slug>/`. Mistakes in the file stop the build with a message naming the
file and the problem.

**Why this priority**: Without this, every project is a coding task. It also turns the sample
project from the design slice into real content.

**Independent Test**: On a branch, add one new project file and its images and nothing else, build,
and confirm the project appears on the index with its details and its story renders; then add a
deliberately broken project file and confirm the build fails naming the file and the problem.

**Acceptance Scenarios**:

1. **Given** a new project file and its images, **When** the site is built, **Then** the project
   appears on the index and its story page exists at `/projects/<slug>/`, with no other file
   changed.
2. **Given** a project file missing its title, problem statement, status, at least one theme or
   its index visual (or that visual's alternative text), **When** the site is built, **Then** the
   build fails with a plain-language message naming the file and what is missing.
3. **Given** a project file with a status other than shipped, experiment or in progress, or an
   unknown setting, **When** the site is built, **Then** the build fails naming the file and the
   setting.
4. **Given** a project file whose story is missing one of the seven chapters, has them out of
   order, or repeats one, **When** the site is built, **Then** the build fails naming the file and
   the chapter.
5. **Given** a project whose option comparison has no chosen option, more than one chosen option,
   a chosen option with no reason, or a constraint with no fit stated for some option, **When** the
   site is built, **Then** the build fails naming the file and the problem.
6. **Given** two project files with the same slug, or a slug that would clash with another part of
   the site, **When** the site is built, **Then** the build fails naming both.
7. **Given** a project file referencing an image that does not exist, **When** the site is built,
   **Then** the build fails naming the file and the image.
8. **Given** a project marked as a draft, **When** the site is built for production, **Then** it is
   not on the index, has no story page and is not in the sitemap; **When** the site is built for a
   preview deployment or local development, **Then** it is on the index and has its story page,
   both visibly marked "Draft".
9. **Given** a failed build, **When** it runs in CI, **Then** the check fails and nothing is
   deployed.

---

### User Story 8 - Don uses the story building blocks in any project (Priority: P2)

Writing a story, Don can use the story elements anywhere in any project: a chapter with an optional
visual beside it, a visual (image, diagram with description, or short clip), the option
comparison, a demo (link or embed) and the invitation. Each looks and behaves the same wherever it
is used, in both themes, at every width, and with reduced motion or JavaScript off. He can still use
the site's existing page sections (for example a figure with a caption) inside a chapter.

**Why this priority**: Building blocks make each new project a writing task, not a design task, and
keep every story consistent. The first project could ship with them hard-wired, so this follows the
core stories.

**Independent Test**: Build a test project that uses every building block at least once, view it in
both themes at phone and desktop widths with and without reduced motion, and confirm each renders as
described and passes the accessibility checks.

**Acceptance Scenarios**:

1. **Given** a project that uses every building block, **When** it renders, **Then** each block
   renders as described in User Stories 1, 2, 3 and 6.
2. **Given** a building block used with required information missing (a visual with no alternative
   text, a clip with no description, an option comparison with no options, a demo with no
   address), **When** the site is built, **Then** the build fails naming the file and the block.
3. **Given** a short clip, **When** it renders, **Then** it has visible controls, does not play
   sound, has a text description of what it shows, and does not play by itself when reduced motion
   is requested.
4. **Given** a building block name that does not exist, **When** the site is built, **Then** the
   build fails naming the file and the name.

---

### User Story 9 - Focus Pocus is the first real project (Priority: P2)

The Focus Pocus story drafted for the design slice becomes the first real project, built entirely
from a project file and the building blocks, so the portfolio launches with one complete story.

**Why this priority**: It proves the whole flow with real content and gives Don something to review
on the preview deployment. It is P2 because the content is Don's to finalise.

**Independent Test**: Open `/projects/` and `/projects/focus-pocus/` on the preview deployment and
confirm Focus Pocus is listed and its story renders all seven chapters, the option comparison, its
demo stand-in link and the invitation.

**Acceptance Scenarios**:

1. **Given** the built site, **When** a visitor opens `/projects/`, **Then** Focus Pocus is listed
   with its title, problem statement, visual, themes and status.
2. **Given** the Focus Pocus story, **When** it renders, **Then** it has the seven chapters, the
   option comparison with its options and constraints, a link to its page on drc.dev as a
   labelled stand-in for a live demo, and the invitation linking to
   `/contact/?project=focus-pocus`.
3. **Given** any Focus Pocus text or visual that is still a draft or a placeholder, **When** it
   renders, **Then** it is visibly marked as a draft or placeholder for Don's review.

---

### Edge Cases

- **Only one project, or none**: with one project the index shows it without looking broken; with
  no published projects the index shows a short plain-language message rather than an empty page,
  and the Projects navigation entry still works.
- **Tall or narrow index visuals**: every index row has its required visual; the right column never
  shows an empty placeholder, and a tall visual never makes a row overlap the next.
- **A theme filter with no matches**: a theme in the address that matches no project (for example
  from an old link) shows a plain message saying no projects match, with a way to clear the filter.
- **Theme spelling variants**: themes that differ only in case or spacing (for example
  "Accessibility" and "accessibility ") count as one theme and show as one filter choice under one
  label.
- **Many themes**: theme choices wrap onto more lines rather than overflowing the page.
- **Long titles and problem statements**: long words wrap; a problem statement longer than the
  one-line limit fails the build rather than being cut off.
- **Wide comparison**: a comparison with many options or constraints stays inside its scroll region
  at every width and never makes the whole page scroll sideways.
- **Tall visual beside short text**: the sticky visual stops at the end of its chapter and never
  overlaps the next chapter; a chapter whose text is shorter than its visual is as tall as the
  visual, so nothing overlaps and no gap is left below the visual.
- **Keyboard focus behind the sticky visual or the progress bar**: focused content is never hidden
  beneath them.
- **Forced colours / high contrast mode**: the chosen-option mark, status, progress bar and focus
  indicators remain visible.
- **Page transitions and the back button**: returning from a story to the index lands the visitor
  back on the index with the filter they had, and a transition never blocks navigation. Following
  the header's Projects link always opens the unfiltered index. Opening a story directly (typed
  address, bookmark or a link from elsewhere) loads it normally, with no transition.
- **Contact page reached with a project that no longer exists, or with an edited, malformed or
  overlong `project` value**: the contact form's own rules apply (feature 007: the value is
  untrusted plain text, shown as text, cut to its limit and never run as code); this feature only
  builds the link.
- **Printing a story**: printing shows every chapter and the full comparison, without the progress
  bar. Browser reader modes and text-only readers get the whole story because every chapter,
  visual text alternative and the comparison are in the page's HTML.

## Requirements *(mandatory)*

### Functional Requirements

**Design direction**

- **FR-001**: Story pages MUST follow Direction C (Chapters) as recorded in
  `docs/design/portfolio.md`: full-width chapters in a fixed order, a reading-progress bar at the
  top of the page, a visual that stays in view beside its chapter text on wide screens, a table of
  constraints against options, chapter headings that uncover as they scroll in, and a page
  transition between the index and a story.
- **FR-002**: The projects index MUST follow Direction C's visual treatment and page transition,
  listing one project per full-width ruled row, while using Direction A's content layout within each
  row: on wide screens a two-column split with title, one-line problem, status and themes on the left
  and the visual on the right; on narrow screens a single column with the visual after the text.
- **FR-003**: Both pages MUST use the site's existing design tokens, typography, header, footer and
  themes, and MUST work in the light and dark themes. Any new colour or typeface is a design-system
  change and MUST be called out in the plan.

**Projects index**

- **FR-010**: The site MUST serve a projects index at `/projects/`, reached from the existing
  Projects entry in the header navigation, which MUST be marked as the current page there and on
  every story page.
- **FR-011**: Each project on the index MUST show its title, a one-line problem statement, a visual
  with a text alternative, one to four themes and exactly one status from: shipped, experiment,
  in progress. Status MUST be conveyed in text, not by colour alone.
- **FR-012**: Each project on the index MUST link to its story page; that link MUST have the
  project's title as its accessible name and be reachable with the keyboard. Index entries MUST NOT
  carry any other link (no demo, stand-in or source-code link).
- **FR-013**: With JavaScript on (see FR-062), visitors MUST be able to filter the index by one
  theme at a time and clear the filter.
  Themes are free text in each project file. The list of themes MUST be derived from the published
  projects, matching themes ignoring case and spacing so that variants show as one choice under one
  label, with no duplicates, in a stable order.
- **FR-014**: The chosen theme MUST be reflected in the page address as `?theme=<theme>` on
  `/projects/` (no separate per-theme pages are built) so the filtered view can be shared and
  reloaded; an unknown theme in the address MUST show a no-match message with a way to
  clear it. The `theme` value is compared, after the same normalising as FR-013, only against the
  known themes; it MUST NOT be written into the page as markup, and the no-match message MUST NOT
  repeat it. Changing or clearing the filter replaces the address without adding a history entry,
  so the browser's Back button leaves the index rather than stepping through filter choices. The
  filter state stays in the browser: it is never sent to any service, stored in a cookie or
  counted.
- **FR-015**: Filtering MUST announce the number of projects shown to assistive technology and MUST
  indicate the chosen theme visually and programmatically. The controls are buttons in a group
  named "Filter by theme": one "All projects" button and one button per theme labelled with the
  theme, each exposing a pressed state (exactly one pressed at a time). A polite status message,
  updated once per change, says "Showing all N projects.", "Showing K projects about <theme>."
  ("project" when K is 1) or, when nothing matches, "No projects match this theme." Choosing a
  theme or "All projects" leaves focus on the button that was pressed; the no-match message's
  "Show all projects" button, which disappears once used, moves focus to the "All projects"
  button. Filtering never moves focus into the list, and hidden projects are removed from the
  reading and focus order.
- **FR-016**: Projects MUST be ordered on the index by an order Don sets in each project file,
  falling back to most recent first. The order is a whole number of 1 or more (lower first);
  gaps are allowed, and zero, negative or non-whole values fail the build. Projects with an order
  come before those without; ties and projects without an order fall back to date (most recent
  first, projects with a date before those without) and then title, so the order is always the
  same for the same files.
- **FR-017**: Theme and status labels MUST use one shared visual label style ("pill") across the
  index and story pages. If the blog feature has already delivered a pill on the main branch, the
  portfolio MUST reuse it rather than add a second one. A pill always shows its text; any colour
  or tone is additional and never the only way its meaning (theme or status) is conveyed. On the
  portfolio pages pills are labels, not links or controls.
- **FR-018**: The theme filter buttons MUST each have a target of at least 24 by 24 CSS pixels
  (WCAG 2.2 2.5.8), a visible focus indicator (2.4.7) that is never hidden by other content
  (2.4.11), and MUST wrap onto more lines rather than overflow when there are many themes.

**Story pages**

- **FR-020**: Each published project MUST have a story page at `/projects/<slug>/`, where the slug
  comes from the project file's name without its extension. A slug MUST be 1 to 64 characters of
  lower-case letters `a`–`z`, digits and hyphens, so it needs no escaping in an address; any other
  file name fails the build naming the file. Every address under `/projects/` belongs to the
  portfolio, so no other page can claim one.
- **FR-021**: Each story MUST contain exactly seven chapters in this order: the problem and who had
  it; what made it hard; the options considered; what was built; what happened; what I would do
  differently; and the invitation. Each chapter MUST have its own heading, and the headings MUST
  form a correct outline under the page's main heading: the project title is the only level-1
  heading, each chapter heading is level 2, and any heading Don writes inside a chapter (or a
  building block renders) is level 3 or lower, with no level skipped. The index's main heading is
  "Projects" (level 1) and each project title on it is level 2. Don writes each chapter as a
  chapter block naming its stage; the chapter headings, their numbers and the invitation link
  come from the site, and Don writes only the chapters' text (including the invitation's short
  lead-in).
- **FR-022**: The story page MUST show the project's title, its one-line problem, its themes and its
  status near the top of the page.
- **FR-023**: Any chapter MAY have one visual (image, diagram or short clip). On wide screens with
  motion allowed, it MUST stay in view beside its chapter's text while that chapter is on screen and
  MUST NOT extend into the next chapter; otherwise it MUST appear after its chapter's text. A chapter
  without a visual MUST leave no empty space. A "wide screen" for the story layout is a viewport at
  least 80rem wide (1280 CSS pixels at the default text size); the index's two-column rows start at
  64rem (1024 CSS pixels). In every layout the reading and focus order is the chapter's text first,
  then its visual. At 400% zoom (a 320 CSS pixel viewport) and with WCAG 1.4.12 text-spacing
  overrides, the narrow layout applies and no text is clipped, overlapped or hidden.
- **FR-024**: A reading-progress bar MUST show how far through the story page the reader is,
  measured over the whole page's scroll (empty at the top, full at the bottom, footer included).
  It is decorative, since the browser already conveys scroll position, and MUST be hidden from
  assistive technology. It uses no script: when reduced motion is requested, when scroll-linked
  effects are unsupported or when printing, it is not shown at all rather than shown frozen. When
  shown, it has at least 3:1 contrast against the page background in both themes and stays
  visible in forced-colours mode.
- **FR-025**: Chapter headings MUST uncover as they scroll into view. Content MUST never start
  hidden in a way that depends on the effect running: if the effect does not run, the content is
  visible. Headings and visuals MUST be visible from the first paint (no hidden-until-script
  state, so nothing flashes missing and then appears). A heading that is already in or above the
  viewport when the page opens (after following a chapter link, or reloading part-way down) MUST
  show fully uncovered.
- **FR-026**: Moving between the index and a story MUST use a page transition that carries the
  project's title across, where the browser supports it. "Carries the title" means the title text
  in the project's index row and the story's main heading are paired, so one appears to move into
  the other; the rest of the page changes as a plain cross-fade. The transition applies between
  portfolio pages only, including Back and Forward between them where the browser supports it;
  opening a story directly loads it normally. It is a normal page load underneath: the new page's
  title is announced as for any load, focus starts at the top of the new page, and an interrupted
  or skipped transition still completes the navigation.
- **FR-027**: After the title and problem line, the story page MUST show an "In this story" list
  of links to the seven chapters in order, each leading to its chapter's heading, working without
  script. The list is a navigation landmark named "In this story", placed after the story header
  and before the first chapter in reading order. It is a static list: it does not track or mark
  the chapter being read. Following a link moves to that chapter so its heading is fully visible,
  never beneath the header or the progress bar, and the next Tab continues from that chapter.

**Option comparison**

- **FR-030**: The options chapter MUST present every option Don considered in one comparison of the
  project's constraints against its options, with each option's name and short summary and a stated
  fit for every constraint (meets, partly meets, does not meet), conveyed in text as well as visually.
  Each fit shows its word ("Meets", "Partly meets", "Does not meet"); any icon or colour is
  additional and hidden from assistive technology.
  Each option MAY also list points in its favour and points against it; when at least one option has
  such a list, the comparison MUST show an "In its favour" row and an "Against it" row, and when none
  does, those rows MUST NOT appear. A missing list MUST NOT fail the build; an empty list counts as
  missing, and an option with only one of the two lists shows an empty cell in the other row. When
  shown, the two rows come after the summary row and before the constraint rows, each with its own
  row header.
- **FR-031**: Exactly one option MUST be marked as chosen, in text as well as visually, with the
  reason it was chosen shown without interaction.
- **FR-032**: The comparison MUST be a data table with row and column headers. When wider than its
  space it MUST scroll inside its own region, which MUST be keyboard-focusable and have an
  accessible name; the page itself MUST NOT scroll sideways. Specifically: the table has a caption
  naming it; each option's name is a column header (`scope="col"`) with the chosen option's header
  also saying "Chosen"; the summary, "In its favour", "Against it" and each constraint are row
  headers (`scope="row"`). The scroll region is a named region whose name is the table's caption,
  is one Tab stop in reading order after the options chapter's text that precedes it, shows a
  visible focus indicator, and scrolls with the arrow keys once focused. This holds at every width
  from 320 px, however many options or constraints there are.
- **FR-033**: Every option MUST be readable without interaction and without JavaScript. Any
  interactive enhancement of the comparison MUST leave the full comparison in the page's HTML. At
  launch the comparison has no enhancement and no script; the only keyboard interaction is
  scrolling its focused region.

**Demos**

- **FR-040**: A project MAY name a live demo hosted on drc.dev. When it does, the story MUST offer a
  link that opens the demo, with link text saying what it opens.
- **FR-041**: A demo MAY be marked for embedding. An embedded demo MUST appear beside the chapter it
  illustrates, have a title naming it, not load until the reader reaches it or asks for it, never
  play sound by itself, and keep the "open" link available. In detail:
  - "Not load" means no request is made to the demo address until the frame is near the viewport
    (the browser's own lazy loading, which also works with JavaScript off), or until the reader
    follows the "open" link.
  - The frame is sandboxed, allowing only scripts, same-origin access and forms; it is granted no
    camera, microphone, location, autoplay or other permission, and sends no more than the site's
    origin as its referrer.
  - Its title (its accessible name) names the demo. Keyboard users can Tab into the frame and out
    of it again (no keyboard trap).
  - The "open" link sits outside the frame, so a frame that is blocked, fails to load or shows an
    error from drc.dev never hides it; the site does not try to detect a failed frame.
  - With JavaScript off, the frame and the "open" link are both present.
- **FR-042**: Demo addresses MUST be on drc.dev (or a subdomain of it) over HTTPS; any other address
  MUST fail the build naming the file. The scheme is exactly `https`; the host is exactly `drc.dev`
  or ends in `.drc.dev`; there is no user name or password part and no port. Look-alikes such as
  `drc.dev.example.com`, `evildrc.dev` or `https://drc.dev@example.com/` fail.
- **FR-043**: A project without a live demo MAY name a stand-in page, which MUST be labelled as not
  a live demo, in text that assistive technology reads with the link. The stand-in address MUST be
  HTTPS (any host), or the build fails naming the file and the address. A project MUST NOT name
  both a demo and a stand-in. With neither, no demo link or placeholder is shown.
- **FR-044**: Short demo clips MUST have visible controls, no sound playing by itself, a text
  description of what they show, and MUST NOT play by themselves when reduced motion is requested.
  Clips never play by themselves under any motion setting, do not loop, and download nothing but
  their still poster image until the reader presses play (which also serves readers saving data).
  A clip file larger than 5 MB fails the build naming the file and the clip. Clips are served from
  this site, never from another host.
- **FR-045**: A project MAY name one source-code address, which MUST be HTTPS (any host); any other
  address MUST fail the build naming the file. When named, the story MUST link to it in the "What I
  built" chapter beside any demo or stand-in link, with link text saying it opens the source code.
  Any host is allowed (unlike demos) because source code usually lives on a code-hosting service
  and is only linked, never embedded.
- **FR-046**: Demo, stand-in and source-code links MUST open in the same tab (no new window, so no
  opener relationship), and send no more than the site's origin as the referrer (the site's
  existing referrer policy). They carry no tracking parameters.
- **FR-047**: Only story pages that embed a demo MAY allow frames, and only from `https://drc.dev`
  and its HTTPS subdomains, matching FR-042. The index, stories without an embed and every other
  page keep the site's default security policy unchanged. The same rule applies in production,
  preview and local builds. Any inline style or script the portfolio adds MUST be allowed by the
  site's policy through a hash, never by allowing inline code in general, and no element uses an
  inline `style` attribute.

**Contact invitation**

- **FR-050**: The last chapter of every story MUST be the invitation headed "Have a problem like
  this?", with a plain link to `/contact/?project=<slug>` carrying only the project's slug.
- **FR-051**: The invitation link's accessible name MUST include the project's title.
- **FR-052**: The link MUST work without JavaScript. Following it MUST open the contact page with the
  project noted on the form (behaviour provided by the contact feature).
- **FR-053**: Following the invitation MUST NOT set a cookie, send an analytics event, or add any
  tracking or other parameter to the link. What happens to the `project` value on the contact
  page is the contact feature's (feature 007, FR-004 and FR-015): it is treated as untrusted plain
  text and stored with the message under that feature's retention rule. This feature adds no new
  stored field and collects no personal data.

**Reduced motion, no JavaScript, and browser support**

- **FR-060**: When reduced motion is requested, the progress bar, heading uncover, sticky visuals and
  page transitions MUST be off, clips MUST NOT play by themselves, and every chapter MUST show in its
  final state. "Reduced motion is requested" means one signal, the reader's system or browser
  reduced-motion preference (`prefers-reduced-motion: reduce`), applied identically to all five
  effects. The "final state" is: every heading and visual fully visible (not clipped, transparent
  or offset), no visual pinned in place, and each visual in normal flow after its chapter's text.
  Changing the preference while a page is open takes effect without reloading. The option
  comparison and the theme filter have no animation under any setting: filtering shows and hides
  rows at once.
- **FR-061**: With JavaScript turned off, every story MUST be fully readable (the title, problem,
  status and themes; the "In this story" list; all chapters; visuals with their text alternatives
  and descriptions; the full comparison with the chosen option and reason; demo, stand-in and
  source-code links; any "Draft" or placeholder marks; and the invitation), and the index MUST list
  every project with all its details (title and story link, problem, visual with its text
  alternative, status and themes).
- **FR-062**: The theme filter is a script enhancement. With JavaScript turned off, the index MUST NOT
  show the filter controls, and MUST list every project. The same holds when the filter's script is
  blocked, fails to load or fails before it has finished setting up: the controls, status line and
  no-match message stay hidden until the filter is working, so no control is ever shown that does
  nothing.
- **FR-063**: Browsers without scroll-linked effects or page transitions MUST get the full content in
  its final state and normal page loads. The baseline is the static page (no script, no
  scroll-linked effects, no transitions); each effect is added on top only when the browser
  reports support for it and motion is allowed. Support is decided by feature detection, not by a
  list of browsers.
- **FR-064**: A story page MUST NOT need any script to be read. Script is allowed only for
  interactive pieces (the index filter and any comparison or demo enhancement), each loaded no
  earlier than it is needed. The visual effects (progress bar, heading uncover, sticky visual and
  page transition) are not interactive pieces and use no script. At launch the only portfolio
  script is the index filter, loaded as a deferred module that runs after the page's HTML has been
  read and never blocks the first paint; story pages ship no script beyond the site's shared one.

**Authoring**

- **FR-070**: Don MUST be able to add a project by adding one text file plus its images, with no
  other change. The file holds the project's settings followed by its story. The file sits in the
  projects content folder and is named after the slug; its images, diagrams, clips and posters sit
  in that folder's `images/<slug>/` folder and are referred to from the file by relative path. No
  other file (code, configuration, navigation or list of projects) changes.
- **FR-071**: Project settings MUST include: title, one-line problem statement (one sentence, at most
  140 characters), one to four themes, status, index visual with alternative text, a sharing
  description, and the option comparison (its constraints and options). They MAY include: an order,
  a date, a live demo address (and whether to embed it), a stand-in page, a source-code address, a
  sharing image, named visuals for use in the story, and a draft flag.
  - The problem statement is counted in characters as written, including spaces and punctuation,
    after trimming spaces at either end. "One sentence" means it ends with `.`, `?` or `!` and has
    no sentence-ending punctuation followed by a space inside it.
  - The date is a calendar date written `YYYY-MM-DD`. It is used only to order projects (FR-016)
    and is not shown on the pages.
  - Status is a closed list (shipped, experiment, in progress); adding a status is a spec change.
    Themes are deliberately open (clarification): Don adds a new theme by writing it in a project
    file, with no list to update.
- **FR-072**: The story building blocks (chapter with optional visual, visual, option comparison,
  demo, invitation) MUST be usable in any project, and the site's existing page sections MUST also
  be usable inside chapters. Chapters sit at the top level of the story, one after another, never
  inside each other or inside a page section. Every other block and page section sits inside a
  chapter: a visual in any chapter, the option comparison once in the options chapter, the demo
  block at most once in the "What I built" chapter (and required there when the project names a
  demo, stand-in or source-code address), and the invitation once in the invitation chapter. The
  inputs each block takes are listed in the authoring guide (FR-075).
- **FR-073**: Invalid project content MUST fail the build with a plain-language message naming the
  file and the problem. Each message contains the file's path, the setting or block concerned, and
  what was expected, plus the value found where there is one (for example the bad address). It
  contains nothing from outside the project file (no environment values or secrets). The checked
  classes are exactly these; any check added later follows the same message rule and is added to
  this list and to the authoring guide:
  - settings: a missing required setting; a setting of the wrong kind (for example text where a
    number is expected); an unknown setting; an unknown status; no themes, more than four, or the
    same theme twice after normalising; a problem statement that is not one sentence or is over
    the limit; an order that is not a whole number of 1 or more;
  - chapters: a missing, repeated or out-of-order chapter; a level-1 or level-2 heading in the
    story text;
  - comparison: no options or no constraints; not exactly one chosen option; a chosen option with
    no reason; a missing fit for some option and constraint;
  - blocks: an unknown building block; a comparison, demo or invitation block that is missing
    where required or placed outside its chapter; a visual name that the settings do not define;
    an embedded-demo visual on a project whose demo is not marked for embedding;
  - media: a missing, unreadable or unsupported image or clip file; an image (in the settings or
    the story text) with no alternative text; a diagram or clip with no description; a clip over
    5 MB;
  - addresses: a demo address not on drc.dev over HTTPS; a stand-in or source-code address that is
    not HTTPS; both a demo and a stand-in;
  - files: a file name that is not a valid slug (FR-020); a duplicate slug (two files with the same
    name and different extensions, or a file in a sub-folder); a page elsewhere on the site that
    claims an address under `/projects/`.

  The build stops at the first invalid project it meets and may report only that one; fixing it
  and building again shows the next. The same checks run, with the same messages, in local, CI,
  preview and production builds, and on draft projects as well as published ones.
- **FR-074**: Draft projects MUST be excluded from production builds (no index entry, no story page,
  not in the sitemap). On preview deployments and in local development they MUST appear on the index
  and have their story page, each visibly marked "Draft".
  - A production build is the build the host runs for the main branch; every other build (preview
    branches, local development, local and CI test builds) is non-production. The build decides
    this from the host's build settings, with no setting for Don to change.
  - In production, nothing from a draft reaches the output: no index row, story page, sitemap
    entry, sharing metadata, link-check entry, or image, clip or sharing image used only by that
    draft. (The site has no search or feed.) If every project is a draft, the production index
    shows the empty-index message.
  - Outside production, a draft keeps its place in the index order and its invitation link, like a
    published project.
  - The "Draft" mark is text that assistive technology reads, not only a visual style.
- **FR-075**: An authoring guide for projects MUST sit beside the existing guide for pages
  (`docs/pages.md`), covering the settings, the building blocks, and the build error messages. It
  lists every setting, every building block with its inputs, and every error class in FR-073. A
  test fails when a setting or block name exists in the code but not in the guide, and any change
  that adds or changes a setting, block or error updates the guide in the same change. The guide
  also tells Don to remove location and camera details from photos before adding them.
- **FR-076**: All wording the portfolio adds (labels, marks, status and empty messages, build
  errors, and placeholder copy) MUST be plain language with no hype or filler, as the constitution
  requires.

**Site integration**

- **FR-080**: `/projects/` and each story page MUST have their own title, description and sharing
  metadata, and MUST be listed in the sitemap. A story without its own sharing image uses the
  site's default sharing image.
- **FR-081**: `/projects/` MUST no longer be treated as a reserved future address; link checks MUST
  then require it and every story page to respond successfully.
- **FR-082**: Focus Pocus MUST be published as the first project, built only from a project file and
  the building blocks, with any draft or placeholder text or media visibly marked for Don's review.
  "Built only from a project file" means its file and images are the only Focus Pocus-specific
  files: no component, style, route or setting names it. Review marks are separate from the
  project-level draft flag (FR-074): a chapter can carry a "Draft for review" mark and a visual a
  "Placeholder" mark, and both show in every build, production included, until Don removes them
  from the file; Focus Pocus itself is not a draft. Both marks are text that assistive technology
  reads.
- **FR-083**: Every portfolio page MUST meet WCAG 2.2 AA and the site's performance budget, in both
  themes, at phone and desktop widths. This includes text and non-text contrast in both themes for
  the chosen-option mark, fits, pills, the progress bar and focus indicators.
- **FR-084**: Visual regression baselines MUST cover the index and the Focus Pocus story in both
  themes, captured with reduced motion requested so every chapter is in its final state.
- **FR-085**: The privacy policy needs no change for this feature: it collects no personal data,
  adds no cookie or tracking, and the project note on the contact form is already covered by the
  contact feature. No demo is embedded at launch; publishing the first embedded demo needs a
  privacy-policy review, since the reader's browser then contacts drc.dev (follow-up below).

### Key Entities

- **Project**: one piece of Don's work told as a story. Has a slug (from its file name), title,
  one-line problem statement, sharing description, themes, status, index visual, option
  comparison, optional order and date, optional live demo or stand-in page, optional source-code
  address, optional sharing image, optional named visuals, draft flag, and a story body.
- **Status**: one of shipped, experiment, in progress; shown as a labelled pill.
- **Theme**: a short free-text label shared across projects; themes that differ only in case or
  spacing are the same theme. The set of themes on the index is derived from the published projects.
- **Chapter**: one of the seven fixed story stages, in a fixed order, with a heading, body text and
  an optional visual.
- **Visual**: an image, diagram (with a text description) or short clip (with a text description),
  each with a text alternative.
- **Constraint**: something that made the problem hard; a row of the option comparison.
- **Option**: an approach Don considered; has a name, short summary, a fit for every constraint,
  optional points in its favour and against it, and whether it was chosen, with the reason when
  chosen.
- **Demo**: a live demo address on drc.dev, optionally embedded, or a stand-in page labelled as not
  a live demo.
- **Contact invitation**: the final chapter, linking to the contact form with the project's slug.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Following the header's Projects link reaches a working projects index in one step, from
  every page of the site, with no not-found response.
- **SC-002**: Every published project's story is fully readable, with all seven chapters, the full
  option comparison and the invitation, in each of four conditions: default, reduced motion
  requested, JavaScript off, and a browser without scroll-linked effects or page transitions.
- **SC-003**: Automated accessibility checks report zero violations on the index and on every story
  page, in both themes, at phone (390 px) and desktop (1280 px) widths. "Every story page" means
  every story in the built site (Focus Pocus at launch) plus the test project that uses every
  building block.
- **SC-004**: Don can add a new project by adding exactly one text file plus its images; comparing
  the repository before and after, no other file changes, and the project appears on the index and at
  its own address after the next build.
- **SC-005**: Each kind of invalid project content listed in FR-073 stops the build with a message
  that names the file, and no broken project page is ever deployed.
- **SC-006**: 100% of story invitation links point to the contact form with that project's slug, and
  following one opens the contact form with the project noted.
- **SC-007**: A visitor can narrow the index to one theme and back to all projects in two actions,
  and a shared filtered address reopens the same filtered view.
- **SC-008**: No portfolio page scrolls sideways at any width from 320 px upward, including story
  pages with a wide comparison.
- **SC-009**: The portfolio pages stay within the site's existing performance budget and meet the
  "good" Core Web Vitals thresholds on mobile.
- **SC-010**: Don, looking at the preview deployment in both themes, confirms the index and the Focus
  Pocus story match his chosen direction before the pull request merges.

## Assumptions

- The design decision in `docs/design/portfolio.md` is final for this feature. "Direction A's content
  layout (two columns instead of three)" means (confirmed in Clarifications): one project per
  Direction C ruled row, with Direction A's two-column split inside the row (text left, visual right)
  instead of Direction C's three columns, keeping Direction C's visual treatment and page transition.
- The chapter headings follow the prototype wording ("The problem", "What made it hard", "Options
  considered", "What I built", "How it turned out", "What I'd do differently", "Have a problem like
  this?"); Don can change the wording later without a spec change.
- The seven chapters are mandatory for every project. A project with little to say for a chapter
  still has it, with a short line; making chapters optional is follow-up work if Don wants it.
- The index shows every published project on one page; there is no pagination at launch, since Don
  expects a handful of projects.
- Theme filtering is single-select (one theme at a time), as in the design prototypes, and runs as a
  small script on the index only; without script the filter is hidden rather than replaced by
  per-theme pages.
- A build can tell whether it is for production or for a preview deployment or local development,
  so drafts are shown, marked, everywhere except production.
- The contact form (feature 007, merged to main) already reads the project named in its link and
  shows it on the form; this feature only builds the link. The form currently shows the slug;
  showing the project's title there is contact-feature follow-up work.
- Focus Pocus has no live demo; its page on drc.dev is linked as a labelled stand-in, as in the
  design slice. Its placeholder screenshots and clips stay visibly marked until Don supplies real
  captures.
- The four other sample index entries from the design slice (Tempo, Flux, drc.dev, Plunge Buddy) are
  not published at launch, because they have no stories; Don adds them as project files later. With
  only Focus Pocus published at launch, the filter and the multi-row index are also exercised by test
  fixture projects.
- Demos are hosted by Don on drc.dev and allow being embedded from this site; the site only links to
  or embeds them. Allowing drc.dev as an embed source is a security-header change and is covered by
  the major-change review. An embedded demo is Don's own site shown in a sandboxed frame, not a
  script running in this site's pages, so it does not breach the constitution's no-third-party-
  script rule; what drc.dev itself loads is Don's responsibility there.
- The blog feature may be built in parallel and may add a pill and change shared navigation or
  content-configuration files; the plan says how overlaps in shared files are merged.
- No new dependency, service or recurring cost is added; running cost stays within the
  constitution's ceiling.

## Out of Scope and Follow-up Work

- Hosting the demos themselves (they live on drc.dev and are Don's to build and run).
- Real screenshots, clips and final copy for Focus Pocus (Don supplies them; placeholders stay
  marked until then).
- Publishing Tempo, Flux, drc.dev and Plunge Buddy as projects (each needs its own story file).
- Showing the project's title, rather than its slug, on the contact form (contact feature).
- Multi-select theme filtering, search, pagination, or grouping the index by year or status.
- Optional or reorderable story chapters.
- A feed (RSS) of projects, and cross-links between blog posts and projects.
- A privacy-policy review when the first embedded demo is published (FR-085).
