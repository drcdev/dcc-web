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
visual treatment, and adds page transitions, it is a **major change** under Constitution
Principle III: the pull request is labelled as such and waits for Don's approval after he has
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
6. **Given** a filtered index, **When** the visitor shares or reloads the page address, **Then**
   the same theme filter is applied.
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
   with all its details, and the theme filter either works without script or is not shown; no
   control is shown that does nothing.
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
   not on the index and has no story page.
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
- **Many themes**: theme choices wrap onto more lines rather than overflowing the page.
- **Long titles and problem statements**: long words wrap; a problem statement longer than the
  one-line limit fails the build rather than being cut off.
- **Wide comparison**: a comparison with many options or constraints stays inside its scroll region
  at every width and never makes the whole page scroll sideways.
- **Tall visual beside short text**: the sticky visual stops at the end of its chapter and never
  overlaps the next chapter.
- **Keyboard focus behind the sticky visual or the progress bar**: focused content is never hidden
  beneath them.
- **Forced colours / high contrast mode**: the chosen-option mark, status, progress bar and focus
  indicators remain visible.
- **Page transitions and the back button**: returning from a story to the index lands the visitor
  back on the index with the filter they had, and a transition never blocks navigation.
- **Contact page reached with a project that no longer exists**: the contact form's own rules
  apply (feature 007); this feature only builds the link.
- **Printing a story**: printing shows every chapter and the full comparison, without the progress
  bar.

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
- **FR-013**: Visitors MUST be able to filter the index by one theme at a time and clear the filter.
  The list of themes MUST be derived from the published projects, with no duplicates, in a stable
  order.
- **FR-014**: The chosen theme MUST be reflected in the page address so the filtered view can be
  shared and reloaded; an unknown theme in the address MUST show a no-match message with a way to
  clear it.
- **FR-015**: Filtering MUST announce the number of projects shown to assistive technology and MUST
  indicate the chosen theme visually and programmatically.
- **FR-016**: Projects MUST be ordered on the index by an order Don sets in each project file,
  falling back to most recent first.
- **FR-017**: Theme and status labels MUST use one shared visual label style ("pill") across the
  index and story pages. If the blog feature has already delivered a pill on the main branch, the
  portfolio MUST reuse it rather than add a second one.

**Story pages**

- **FR-020**: Each published project MUST have a story page at `/projects/<slug>/`, where the slug
  comes from the project file's name.
- **FR-021**: Each story MUST contain exactly seven chapters in this order: the problem and who had
  it; what made it hard; the options considered; what was built; what happened; what I would do
  differently; and the invitation. Each chapter MUST have its own heading, and the headings MUST
  form a correct outline under the page's main heading.
- **FR-022**: The story page MUST show the project's title, its one-line problem, its themes and its
  status near the top of the page.
- **FR-023**: Any chapter MAY have one visual (image, diagram or short clip). On wide screens with
  motion allowed, it MUST stay in view beside its chapter's text while that chapter is on screen and
  MUST NOT extend into the next chapter; otherwise it MUST appear after its chapter's text. A chapter
  without a visual MUST leave no empty space.
- **FR-024**: A reading-progress bar MUST show how far through the story page the reader is. It is
  decorative and MUST be hidden from assistive technology.
- **FR-025**: Chapter headings MUST uncover as they scroll into view. Content MUST never start
  hidden in a way that depends on the effect running: if the effect does not run, the content is
  visible.
- **FR-026**: Moving between the index and a story MUST use a page transition that carries the
  project's title across, where the browser supports it.
- **FR-027**: After the title and problem line, the story page MUST show an "In this story" list
  of links to the seven chapters in order, each leading to its chapter's heading, working without
  script.

**Option comparison**

- **FR-030**: The options chapter MUST present every option Don considered in one comparison of the
  project's constraints against its options, with each option's name and short summary and a stated
  fit for every constraint (meets, partly meets, does not meet), conveyed in text as well as visually.
  Each option MAY also list points in its favour and points against it; when at least one option has
  such a list, the comparison MUST show an "In its favour" row and an "Against it" row, and when none
  does, those rows MUST NOT appear. A missing list MUST NOT fail the build.
- **FR-031**: Exactly one option MUST be marked as chosen, in text as well as visually, with the
  reason it was chosen shown without interaction.
- **FR-032**: The comparison MUST be a data table with row and column headers. When wider than its
  space it MUST scroll inside its own region, which MUST be keyboard-focusable and have an
  accessible name; the page itself MUST NOT scroll sideways.
- **FR-033**: Every option MUST be readable without interaction and without JavaScript. Any
  interactive enhancement of the comparison MUST leave the full comparison in the page's HTML.

**Demos**

- **FR-040**: A project MAY name a live demo hosted on drc.dev. When it does, the story MUST offer a
  link that opens the demo, with link text saying what it opens.
- **FR-041**: A demo MAY be marked for embedding. An embedded demo MUST appear beside the chapter it
  illustrates, have a title naming it, not load until the reader reaches it or asks for it, never
  play sound by itself, and keep the "open" link available.
- **FR-042**: Demo addresses MUST be on drc.dev (or a subdomain of it) over HTTPS; any other address
  MUST fail the build naming the file.
- **FR-043**: A project without a live demo MAY name a stand-in page, which MUST be labelled as not
  a live demo. With neither, no demo link or placeholder is shown.
- **FR-044**: Short demo clips MUST have visible controls, no sound playing by itself, a text
  description of what they show, and MUST NOT play by themselves when reduced motion is requested.
- **FR-045**: A project MAY name one source-code address, which MUST be HTTPS (any host); any other
  address MUST fail the build naming the file. When named, the story MUST link to it in the "What I
  built" chapter beside any demo or stand-in link, with link text saying it opens the source code.

**Contact invitation**

- **FR-050**: The last chapter of every story MUST be the invitation headed "Have a problem like
  this?", with a plain link to `/contact/?project=<slug>` carrying only the project's slug.
- **FR-051**: The invitation link's accessible name MUST include the project's title.
- **FR-052**: The link MUST work without JavaScript. Following it MUST open the contact page with the
  project noted on the form (behaviour provided by the contact feature).

**Reduced motion, no JavaScript, and browser support**

- **FR-060**: When reduced motion is requested, the progress bar, heading uncover, sticky visuals and
  page transitions MUST be off, clips MUST NOT play by themselves, and every chapter MUST show in its
  final state.
- **FR-061**: With JavaScript turned off, every story MUST be fully readable (all chapters, visuals'
  text alternatives, the full comparison with the chosen option and reason, demo links and the
  invitation), and the index MUST list every project with all its details.
- **FR-062**: With JavaScript turned off, the index MUST NOT show a filter control that does nothing:
  it either works without script or is not shown.
- **FR-063**: Browsers without scroll-linked effects or page transitions MUST get the full content in
  its final state and normal page loads.
- **FR-064**: A story page MUST NOT need any script to be read. Script is allowed only for
  interactive pieces (the index filter and any comparison or demo enhancement), each loaded no
  earlier than it is needed.

**Authoring**

- **FR-070**: Don MUST be able to add a project by adding one text file plus its images, with no
  other change. The file holds the project's settings followed by its story.
- **FR-071**: Project settings MUST include: title, one-line problem statement (one sentence, at most
  140 characters), one to four themes, status, index visual with alternative text, and a sharing
  description. They MAY include: an order, a date, a live demo address (and whether to embed it), a
  stand-in page, a source-code address, a sharing image, and a draft flag.
- **FR-072**: The story building blocks (chapter with optional visual, visual, option comparison,
  demo, invitation) MUST be usable in any project, and the site's existing page sections MUST also
  be usable inside chapters.
- **FR-073**: Invalid project content MUST fail the build with a plain-language message naming the
  file and the problem, covering at least: a missing required setting, a setting of the wrong kind,
  an unknown setting, an unknown status, a problem statement over the limit, a missing, repeated or
  out-of-order chapter, an option comparison without exactly one chosen option or without a reason,
  a missing fit, a missing image or alternative text, a clip without a description, a demo address
  not on drc.dev, a source-code address that is not HTTPS, an unknown building block, and a duplicate or clashing slug.
- **FR-074**: Draft projects MUST be excluded from production builds (no index entry, no story page,
  not in the sitemap).
- **FR-075**: An authoring guide for projects MUST sit beside the existing guide for pages
  (`docs/pages.md`), covering the settings, the building blocks, and the build error messages.

**Site integration**

- **FR-080**: `/projects/` and each story page MUST have their own title, description and sharing
  metadata, and MUST be listed in the sitemap.
- **FR-081**: `/projects/` MUST no longer be treated as a reserved future address; link checks MUST
  then require it and every story page to respond successfully.
- **FR-082**: Focus Pocus MUST be published as the first project, built only from a project file and
  the building blocks, with any draft or placeholder text or media visibly marked for Don's review.
- **FR-083**: Every portfolio page MUST meet WCAG 2.2 AA and the site's performance budget, in both
  themes, at phone and desktop widths.
- **FR-084**: Visual regression baselines MUST cover the index and the Focus Pocus story in both
  themes, captured with reduced motion requested so every chapter is in its final state.

### Key Entities

- **Project**: one piece of Don's work told as a story. Has a slug (from its file name), title,
  one-line problem statement, themes, status, index visual, optional order and date, optional live
  demo or stand-in page, optional source-code address, optional sharing image, draft flag, and a
  story body.
- **Status**: one of shipped, experiment, in progress; shown as a labelled pill.
- **Theme**: a short label shared across projects; the set of themes on the index is derived from
  the published projects.
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
  page, in both themes, at phone (390 px) and desktop (1280 px) widths.
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
- Theme filtering is single-select (one theme at a time), as in the design prototypes.
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
  the major-change review.
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
