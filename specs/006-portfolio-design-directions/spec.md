# Feature Specification: Design directions for the portfolio

**Feature Branch**: `006-portfolio-design-directions`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Design directions for the portfolio. Don wants a portfolio that shows how he thinks about solving problems and encourages visitors with a similar problem to get in touch. Before it is built, he wants to choose between two or three design directions. Each project is told as a story the reader moves through: the problem and who had it; the constraints; the options considered and why one was chosen (readers can look at each option, not just the chosen one); what was built; what happened; what he would do differently; and an invitation ('Have a problem like this?') leading to the contact form with the project already noted. Stories reveal themselves as the reader scrolls, with visuals, diagrams and short demo clips beside the part of the story they explain; live demos hosted on drc.dev can be opened or embedded; stories stay fully readable with reduced motion or JavaScript turned off. The projects index shows each project's title, one-line problem statement, visual, themes and status (shipped, experiment, in progress), and visitors can filter by theme. This feature delivers two or three distinct design directions covering the story page and the index, using one real project as sample content; each viewable on the preview deployment in both themes at phone and desktop widths; for each, how story stages, option comparison, demo embeds and scroll reveals work, and its trade-offs; and a decision document Don can use to choose. Out of scope: building the real portfolio, content collections, and hosting demos." (The full feature prompt, including a technical-direction section for planning, is kept with the /deliver run and is deliberately not restated here as requirements.)

## Context

The site has its foundation (feature 002) and standalone pages (feature 003). The header already
links to Projects, which has no page yet. Before the real portfolio is built, Don wants to see
three concrete, working design directions for it and pick one. This feature produces
those directions as throwaway prototypes and a decision document; it does not build the
portfolio itself.

The directions are temporary. They exist so Don can review them on the preview deployment.
Before the pull request merges, the prototypes are removed, and of the site's source only the
decision document and its screenshots land on main. The feature's Spec Kit folder
(`specs/006-portfolio-design-directions/`, including its plan and checklists) merges to main as
every feature's spec folder does; it is project documentation, not site source. The live site
therefore gains no new public pages from this feature.

Because the directions explore the visual identity and layout of a major section of the site,
this feature is treated as a major change under Constitution Principle III: the pull request
waits for Don's review of the preview deployment and his approval. The prototypes being
throwaway does not change this: the direction Don picks from them sets the visual identity of
the portfolio, and while they exist the branch temporarily changes shared site configuration
and the shared test list (see FR-053). Auto-merge stays off for this pull request.

A blog design directions feature is being prepared in parallel. The two features produce
separate decision documents and separate prototypes and must not overwrite each other's work.

## Clarifications

### Session 2026-09-29

- Q: Which project from drc.dev should be the sample story used in every design direction? → A: Focus Pocus (the MCP server connecting Claude Desktop with OmniFocus). Whether it has a live demo on drc.dev is unconfirmed; treat the demo as "if one exists", otherwise use the project's public page or repository as the demo target and say so.
- Q: What is the story content for the sample project at each stage? → A: Claude drafts each stage from the project's drc.dev page and repository, marked "draft for review"; Don corrects it on the preview deployment.
- Q: Are there portfolios or case-study pages Don likes that should shape the directions? → A: None; the directions draw only on the site's current design and the Flux starting points.
- Q: How many design directions should be built? → A: Three.
- Q: Should the other projects on the index be the real drc.dev projects or invented placeholders? → A: The real drc.dev projects, as short index entries only with no story pages; only Focus Pocus links to a story.
- Q: Where do the Focus Pocus visuals, diagrams and demo clips come from? → A: Claude draws simple diagrams (the architecture and the option comparison) from the repository; screenshots and clips are clearly labelled placeholder frames with a text description, and Don swaps in real media later.
- Q: Is correcting the draft story content part of this feature? → A: No. The "draft for review" marking stays for the whole feature, content accuracy is not a merge condition, and corrections carry over to the real portfolio feature.
- Q: Which widths do the decision document's screenshots cover? → A: Phone and desktop: 3 directions × 2 pages × 2 themes × 2 widths = 24 images.
- Q: What do the decision document's preview addresses point to once the prototypes are removed? → A: The preview of the last commit that still had the prototypes, so the links keep working after removal; the document says each address is pinned to that commit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Don compares the directions for the project story page (Priority: P1)

Don opens the preview deployment and views each design direction's version of the project story
page, all using the same real sample project. For each, he reads the story from the problem
through to the invitation, looks at every option the project weighed, sees how visuals and demos
sit beside the part of the story they explain, and sees how the story reveals itself as he
scrolls. He does this in both themes and at phone and desktop widths.

**Why this priority**: The story page is where the portfolio does its job: showing how Don
thinks and prompting a visitor to get in touch. Choosing its direction is the main decision this
feature exists to support.

**Independent Test**: On the preview deployment, open each direction's story page in the light
and dark themes at a phone width and a desktop width, and confirm the full story (all seven
stages, every option, the visuals, the demo and the invitation) is present and usable.

**Acceptance Scenarios**:

1. **Given** the preview deployment, **When** Don opens any direction's story page, **Then** the
   sample project's story appears in this order: the problem and who had it; the constraints;
   the options considered and the reason for the choice; what was built; what happened; what
   Don would do differently; and the invitation.
2. **Given** a direction's story page, **When** Don reaches the options stage, **Then** he can
   view every option the project weighed, including those not chosen, and can tell which option
   was chosen and why.
3. **Given** a direction's story page, **When** Don scrolls through it, **Then** story content
   and its accompanying visuals appear progressively as he reaches them, and each visual,
   diagram or demo clip sits next to the part of the story it explains.
4. **Given** the sample project has a live demo, **When** Don reaches it on a story page,
   **Then** he can open the demo on its own site, and, where the direction embeds it, see it
   inside the page.
5. **Given** a direction's story page, **When** Don activates the invitation, **Then** he is
   taken towards the contact form with the sample project identified as the subject of his
   enquiry.
6. **Given** any direction's story page, **When** it is viewed in the dark theme and in the
   light theme, at a phone width and at a desktop width, **Then** all content is legible,
   nothing is cut off, and there is no horizontal scrolling of the page.

---

### User Story 2 - Don compares the directions for the projects index (Priority: P2)

Don opens each direction's version of the projects index. Each shows the sample project (Focus
Pocus) and Don's other real drc.dev projects (Tempo, Flux, drc.dev and Plunge Buddy) as short
entries, with its title, a one-line
problem statement, a visual, its themes and its status. He filters the index by theme and
follows an entry to that direction's story page.

**Why this priority**: The index is what makes a visitor curious enough to open a story. It
matters, but the story page carries the portfolio's main purpose, so the index decision comes
second.

**Independent Test**: On the preview deployment, open each direction's index in both themes at
phone and desktop widths, confirm every entry shows its title, problem statement, visual, themes
and status, apply a theme filter, and follow the sample project to its story page.

**Acceptance Scenarios**:

1. **Given** a direction's projects index, **When** it loads, **Then** each entry shows its
   title, a one-line problem statement, a visual, its themes and a status of shipped,
   experiment or in progress.
2. **Given** a direction's projects index, **When** Don chooses a theme to filter by, **Then**
   only entries with that theme are shown, and he can clear the filter to see every entry
   again.
3. **Given** a direction's projects index, **When** Don selects the sample project, **Then** he
   reaches the same direction's story page for that project.
4. **Given** a direction's projects index, **When** it is loaded with JavaScript turned off,
   **Then** every entry is visible and readable, even if filtering is unavailable.

---

### User Story 3 - A visitor who prefers less motion, or has no JavaScript, can read every story (Priority: P2)

A visitor who has asked their device for reduced motion, or whose browser runs no JavaScript,
opens any direction's story page and can still read the whole story, see every option and every
visual, and reach the invitation.

**Why this priority**: Constitution Principles V and X require core content to be readable
without JavaScript and every page to meet WCAG 2.2 AA. A direction that fails this cannot be
chosen, so every direction must prove it.

**Independent Test**: Open each direction's story page and index with reduced motion requested,
and again with JavaScript turned off, and confirm all content is present and readable and
nothing is hidden waiting for an animation or script.

**Acceptance Scenarios**:

1. **Given** reduced motion is requested, **When** a visitor scrolls a story page, **Then**
   content appears without movement-based reveal animations and nothing stays hidden.
2. **Given** JavaScript is turned off, **When** a visitor opens a story page, **Then** every
   stage, every option (chosen and not chosen), every visual and the invitation are visible and
   readable.
3. **Given** any direction's story page or index, **When** the automated accessibility checks
   run, **Then** they report no violations in either theme.

---

### User Story 4 - Don chooses a direction from the decision document (Priority: P3)

Don reads one decision document that summarises every direction: what it is, where to see it on
the preview deployment, screenshots of the story page and index in both themes at phone and
desktop widths, how it handles
story stages, option comparison, demo embeds and scroll reveals, and its trade-offs. The
document ends with an empty Decision section for him to fill in.

**Why this priority**: The document turns the prototypes into a decision Don can make and
record. It depends on the directions existing, so it comes after them, and it is the only part
of the feature's site output that remains on main after the prototypes are removed.

**Independent Test**: Read the decision document on its own, without the preview deployment,
and confirm that for every direction it gives the name and summary, the pinned preview
addresses of its story page and index, screenshots in both themes at phone and desktop widths,
the four behaviours, the trade-offs and the new visual resources, and that the Decision section
is present and empty.

**Acceptance Scenarios**:

1. **Given** the decision document, **When** Don reads a direction's section, **Then** it states
   the direction's preview address, shows screenshots of its story page and its index in both
   the light and dark themes at phone and desktop widths, explains how it handles story stages, option comparison, demo
   embeds and scroll reveals, and lists its trade-offs.
2. **Given** a direction needs a colour, typeface or other visual resource that the site does
   not already use, **When** Don reads its section, **Then** the document says so plainly.
3. **Given** the decision document, **When** Don reaches its end, **Then** there is a Decision
   section with no decision filled in.
4. **Given** the prototypes have been removed before merge, **When** Don reads the decision
   document on main, **Then** its screenshots still show every direction: all 24 images it
   references exist in the repository next to the document and display.

---

### Edge Cases

- A story stage has no visual: the stage still reads well on its own, and the layout does not
  leave an empty space where a visual would be.
- A live demo cannot be loaded (the demo site is down or refuses to be embedded): the reader
  still sees a description or still image of the demo and a link to open it, and the story is
  not broken.
- A short demo clip cannot play, or the reader has reduced motion requested: the clip does not
  play automatically, and a still frame with its text description stands in for it (the same
  rule as FR-016).
- The reader selects an index entry other than Focus Pocus: it has no story page, so the entry
  is not presented as a link to one (or links only to the project's existing public page).
- The theme filter matches no entries: the index says plainly that no projects match and offers
  a way to clear the filter.
- A project has more options than fit side by side on a phone: all options remain reachable at
  phone width without horizontal page scrolling. The options either restack into a single
  column, or the comparison scrolls sideways inside its own clearly bounded region that can be
  reached and scrolled with the keyboard; the page itself never scrolls sideways.
- The reader switches theme partway through a story: the page updates without losing their
  place. The scroll position stays where it was, keyboard focus stays on the theme control
  that was used, and no reveal replays.
- The reader lands mid-story from a link to a specific stage: that stage's heading is at the
  top of the viewport, the stage and its visual are fully visible at once rather than waiting
  for a reveal, and the next Tab press moves into or after that stage rather than back to the
  top of the page.
- Don rejects all three directions or asks for a fourth: requests made during review of the
  pull request are handled on the branch (the prototypes are restored, revised, recaptured and
  re-pinned, then removed again). A rejection of all three, or a new direction wanted after
  merge, is recorded in the Decision section and becomes follow-up work, not part of this
  feature.

## Requirements *(mandatory)*

### Functional Requirements

**Directions**

- **FR-001**: The feature MUST deliver exactly three design directions that are visibly distinct from one another in how they present the project story and the projects
  index. "Visibly distinct" means that any two directions differ in at least three of these
  five dimensions: the page layout of the story; how the stages are presented and moved
  through; the option comparison pattern; the structure of the index; and the style of scroll
  reveal. Because every direction uses the same content and the site's existing colours and
  typefaces (FR-003, FR-005), the difference comes from layout, structure and interaction, not
  from new visual resources. The four compared behaviours (story stages, option comparison,
  demo embeds, scroll reveals) are described for every direction (FR-040); they need not all
  differ between directions as long as this rule holds.
- **FR-002**: Each direction MUST include a project story page and a projects index, and MUST
  have a short name (for example "Timeline") and a one-line summary so it can be told apart
  without opening it.
- **FR-008**: So that differences between directions come from design alone, every direction
  MUST show the same shared content: the same seven stages with the same text, the same options
  with the same chosen option and reason, the same visuals and placeholders, and the same five
  index entries with the same fields.
- **FR-003**: Every direction MUST use the same real sample project as its story content, so the
  directions can be compared like for like. The sample project is Focus Pocus, the MCP server
  that connects Claude Desktop with OmniFocus. Its content for each stage is drafted from its
  drc.dev project page and its public repository, and every stage MUST be visibly marked as a
  draft for Don's review for as long as the prototypes exist. The accuracy of this content is not
  a merge condition; Don's corrections carry over to the real portfolio feature.
- **FR-004**: The directions MUST draw only on the site's current design baseline and the Flux
  theme starting points; no outside portfolios or case-study pages are used as references.
- **FR-005**: Each direction MUST use only the colours, palettes and typefaces the site already
  uses. A direction that needs anything new MUST say so in the decision document rather than
  adding it silently.
- **FR-006**: Each direction MUST be reachable on the pull request's preview deployment at its
  own stable address, and MUST work in both the light and dark themes and at phone and desktop
  widths. One review page on the preview deployment links to every direction's story page and
  index. All prototype addresses sit under `/design/portfolio/`.
- **FR-007**: The direction prototypes MUST NOT appear in the site's navigation and MUST NOT be
  offered to search engines, by any discovery route: they are absent from the header, footer
  and every non-prototype page; absent from the sitemap and any feed; and each prototype page
  asks search engines not to index it. Prototype pages may link to each other.

**Project story page**

- **FR-010**: Each story page MUST present the sample project as seven stages, in this order:
  the problem and who had it; the constraints that made it hard; the options considered and why
  one was chosen; what was built; what happened; what Don would do differently; and an
  invitation reading "Have a problem like this?" or equivalent plain wording. The heading
  structure is the same in every direction: the project title is the page's only top-level
  heading, and each of the seven stages has a second-level heading, with no heading levels
  skipped.
- **FR-011**: Each story page MUST let the reader look at every option the project weighed, not
  only the one chosen, and MUST make clear which option was chosen and why.
- **FR-012**: Each story page MUST place each visual, diagram or short demo clip next to the
  part of the story it explains. Claude draws simple diagrams (at least the architecture and the
  option comparison) from the project's repository. Screenshots and demo clips are placeholder
  frames, each clearly labelled as a placeholder and carrying a text description of what the
  real media will show, so Don can swap in real media later. Every diagram has a text
  alternative that names what it shows and states its parts and how they connect (for the
  option comparison, each option and which was chosen); every placeholder frame's text
  alternative says it is a placeholder and gives its description.
- **FR-013**: Each story page MUST reveal the story progressively as the reader scrolls.
- **FR-014**: Each story page MUST let the reader open the sample project's demo on its own
  site, and MAY also show it embedded in the page; each direction MUST state which it does. If
  Focus Pocus has no live demo on drc.dev, the demo target is its public project page or
  repository, and the story page and decision document MUST say that it stands in for a demo.
  Live demos stay on drc.dev: this feature neither changes nor re-hosts them. Where a direction
  embeds a demo, the embed has an accessible title, does not trap keyboard focus, and, when it
  is blocked or fails to load, is replaced by the demo's description and the link to open it.
- **FR-015**: The invitation MUST lead to the site's contact form address with the sample
  project identified, so the contact form can note which project the enquiry is about. Whether
  the contact form is live yet does not affect this requirement.
- **FR-016**: With reduced motion requested, each story page and index MUST show all content in
  its final state with no reveal animation of any kind, including fades and opacity changes as
  well as any change of position, size, scale or rotation. The same applies to every other
  motion source in the prototypes: transitions between an index and a story page, the theme
  switch, filter changes and changes in the option comparison happen instantly. Demo clips MUST
  NOT auto-play; a still frame with its text description stands in for each clip. The
  preference is honoured when the page loads and, if it changes during a visit, from that
  moment on. (Constitution Principle X.)
- **FR-017**: With JavaScript turned off, each story page MUST show every stage, every option
  (chosen and not chosen), every visual or its text alternative, and the invitation. This holds
  whatever comparison pattern a direction uses (for example, options behind tabs or collapsed
  panels are all shown expanded). The demo is shown as its description and the link to open
  it. Controls that cannot work without JavaScript are not shown. The page follows the
  device's light or dark preference, so both themes remain reviewable by changing that
  preference. (Constitution Principle V.)
- **FR-018**: "Hidden" content, for FR-016, FR-017 and User Story 3, means any content that is
  not displayed, is fully or almost fully transparent, is positioned or clipped out of view, or
  is collapsed so it cannot be read without an action the reader cannot take in that state.
  None of the story's content may be hidden in the reduced-motion or no-JavaScript state.

**Projects index**

- **FR-020**: Each index MUST show, for each entry, its title, a one-line problem statement, a
  visual, its themes, and a status of shipped, experiment or in progress.
- **FR-021**: Each index MUST include the sample project and Don's other real drc.dev projects
  (Tempo, Flux, drc.dev and Plunge Buddy) as short entries with no story pages, so the index
  shows several projects, several themes and every status. Only the sample project links to a
  story page. Treating the other four projects as index-only entries is final for this
  feature; their story pages are follow-up work for the real portfolio.
- **FR-022**: Each index MUST let the visitor filter entries by theme and clear the filter, and
  MUST say plainly when no entries match. Each change in the filter result, including the
  "no projects match" message, is announced to assistive technology without moving focus.
- **FR-023**: With JavaScript turned off, each index MUST show every entry in full, and filter
  controls, which cannot work without JavaScript, are not shown.
- **FR-024**: Selecting the sample project in an index MUST lead to the same direction's story
  page.
- **FR-025**: Each entry's status (shipped, experiment or in progress) and themes MUST be shown
  as text, not by colour, shape or position alone.

**Quality**

- **FR-030**: Every direction's story page and index, and the review page, MUST meet WCAG 2.2
  AA (Constitution Principle X) and MUST pass the site's automated accessibility checks, which
  test against the WCAG 2.2 A and AA rules and report zero violations. The checks run on each
  page in every one of these states: light and dark theme at phone and desktop width (four
  combinations); with reduced motion requested; with JavaScript turned off; in forced-colours
  (high contrast) mode; and reflowed at 320 px width and at 200% zoom. Success criteria that an
  automated rule cannot decide are covered by the manual checks in FR-039.
- **FR-031**: Every direction MUST build and pass the site's full release gate while it is on
  the feature branch, and the branch MUST pass the full release gate again after the
  prototypes are removed, before it merges.
- **FR-032**: All visible writing in the prototypes (labels, placeholder copy, messages) MUST be
  plain language, with no hype or filler.
- **FR-033**: Text and meaningful graphics MUST meet WCAG 2.2 AA contrast in both themes,
  including status labels, theme tags, draft marks, placeholder labels, diagram labels and the
  focus indicator.
- **FR-034**: Every page MUST reflow at 320 px width and at 200% zoom with no loss of content
  or function and no horizontal page scrolling; content that is wide by nature (a comparison
  table or diagram) may scroll inside its own keyboard-reachable region.
- **FR-035**: Every interactive control (theme filter, option comparison controls, demo link
  or embed, invitation, theme switch) MUST be reachable and operable with the keyboard alone,
  in a logical order, and MUST have a visible focus indicator. A focused element is never
  fully hidden behind a sticky or overlaid part of the story, such as a sticky visual panel or
  progress rail.
- **FR-036**: Filter controls, option comparison controls and the invitation MUST meet the
  WCAG 2.2 minimum target size of 24 by 24 CSS pixels, or the spacing exception.
- **FR-037**: The "draft for review" mark on each stage and the "placeholder" label on each
  placeholder frame MUST be text that assistive technology reads, not only a visual badge.
- **FR-038**: In forced-colours mode, all content, controls, focus indicators, statuses and
  diagram parts MUST remain visible and distinguishable. Print styling is out of scope for the
  prototypes and is not reviewed.
- **FR-039**: Because automated checks cover only part of WCAG 2.2 AA, each direction MUST
  also be checked by hand for: keyboard-only use of every control, including the option
  comparison and the filter; reading order matching the story order; focus not obscured by
  sticky elements; meaningful text alternatives for diagrams and placeholders; and the filter
  announcements. The results are recorded in the pull request description.

**Scope and parallel work**

- **FR-050**: The feature MUST NOT add, remove or replace any dependency, service, font, or
  other external resource, and MUST NOT add any recurring cost; its expected monthly running
  cost is $0 (Constitution Principle IX).
- **FR-051**: The feature owns only these paths: prototype pages under the
  `/design/portfolio/` address namespace and their source and test folders named for the
  portfolio prototypes; the decision document `docs/design/portfolio.md`; its screenshot
  folder `docs/design/portfolio/`; and its spec folder. The parallel blog feature owns the
  `/design/blog/` namespace, `docs/design/blog.md` and `docs/design/blog/`. Apart from the
  shared files named in FR-053, the feature MUST NOT create, edit or delete any file outside
  the paths it owns.
- **FR-052**: The feature MUST NOT alter any other feature's work, including its content,
  pages, components, tests, visual baselines, decision documents and prototypes, and MUST NOT
  change the package manifest or the lockfile.
- **FR-053**: The only shared files the feature may edit are the site configuration's sitemap
  filter (to keep the prototypes out of the sitemap) and the shared list of page templates the
  accessibility, no-JavaScript and performance checks run against (to put the prototypes under
  those checks). Each edit is a single added condition or entry that the blog feature can make
  alongside its own without conflict; if the two edits conflict, both are kept. Both edits are
  reverted in the commit that removes the prototypes, so main never carries them, whichever
  feature merges first. A feature that merges second brings main into its branch and keeps its
  own edits only until its own removal commit.
- **FR-054**: The prototypes MUST NOT add or change any committed visual regression baseline;
  the existing baselines must still match on the branch.

**Decision document and delivery**

- **FR-040**: The feature MUST produce one decision document for the portfolio design, at
  `docs/design/portfolio.md`, that is complete and readable on its own, without the preview
  deployment, the prototypes or the spec folder. For each direction it gives: its name and a
  short summary; the preview addresses of its story page and of its index; screenshots of its
  story page and its index in both the light and dark themes at both phone and desktop widths
  (3 directions × 2 pages × 2 themes × 2 widths = 24 images in all); how it handles story
  stages, option comparison, demo embeds (stating whether the demo is embedded or only linked)
  and scroll reveals, each including its behaviour with reduced motion and with JavaScript
  off; its trade-offs; and its new visual resources.
- **FR-041**: The decision document MUST end with a Decision section that is left empty for Don:
  the heading, followed by at most a prompt to Don that does not show when the document is
  rendered, and no other content. The feature MUST NOT choose a direction: the document
  presents the comparison and trade-offs even-handedly and does not recommend, rank or score
  the directions.
- **FR-042**: The screenshots MUST be committed alongside the decision document, in
  `docs/design/portfolio/`, so they remain viewable after the prototypes are removed. Each
  image's file name and position in the document identify its direction, page, width and
  theme; each image has alt text or a caption that states the same four facts. Screenshots
  are comparable: each is a full-page capture with every reveal in its final state, the index
  filter cleared, the same content in every direction, and phone and desktop at the widths
  given in Assumptions. Each is a compressed web image under 600 KB.
- **FR-043**: Before the pull request merges, the direction prototypes MUST be removed. The
  removal covers the prototype pages, their source, their sample data, their tests, the review
  page, the screenshot tooling, and the two shared edits of FR-053, which are reverted. The only
  changes the pull request brings to main are the decision document, its 24 screenshots, the
  feature's spec folder, and Spec Kit's own record of the current feature; the live site gains
  no new pages.
- **FR-044**: The pull request MUST be marked as a major change under Constitution Principle
  III, and its description MUST say so. Auto-merge MUST stay off, and the pull request waits
  for Don's review of the pinned preview addresses and his approval.
- **FR-045**: The feature MUST NOT alter or remove work belonging to the parallel blog design
  directions feature or any other feature, including their decision documents and prototypes
  (see FR-051 to FR-053).
- **FR-046**: Each preview address in the decision document MUST point to the preview
  deployment of the pinned commit, so the link keeps working after the prototypes are
  removed. The pinned commit is the last commit that contains the prototypes: the one from
  which the screenshots were captured, and the one immediately before the removal. If a
  prototype changes after that, the screenshots are recaptured and a new commit is pinned. The
  outcome that matters is that the pinned commit is pushed and its preview deployment exists
  before the document's addresses are filled in, and the removal comes in a later commit. The
  document MUST name the commit and state, in a sentence next to the addresses, that every
  address is pinned to that commit and keeps working after the prototypes were removed.
- **FR-047**: The decision document MUST state that the pinned preview deployments are kept by
  the hosting platform only for a limited time and may stop working, and that the committed
  screenshots are the lasting record.
- **FR-048**: The decision document MUST help Don judge the directions by comparing them, in
  one place, on: fit with the site's current look; how clearly the options are shown; reading
  on a phone; accessibility risk; JavaScript shipped; behaviour in browsers without the newer
  scroll and transition features; whether the demo is embedded or linked; and effort to build
  and maintain for real. Each direction's trade-offs list at least what it does well, what it
  does poorly, its build and maintenance effort, and its risks (accessibility, browser
  support, how it holds real media, and how it scales to many projects).
- **FR-049**: The decision document MUST disclose that the story content is a draft for Don's
  review, that the screenshots and clips are placeholders, and, if it applies, that the demo
  is a stand-in, so none of these is judged as final. Each direction's new visual resources
  section MUST say "None." when the direction needs none, rather than being left out.

### Key Entities

- **Design direction**: One candidate visual and interaction approach for the portfolio. Has a
  name, a short summary, a story page, an index, a preview address, screenshots in both themes,
  a description of its four key behaviours (story stages, option comparison, demo embeds,
  scroll reveals), trade-offs, and any new visual resources it would need.
- **Sample project**: The one real project used as content in every direction. Has a title, a
  one-line problem statement, a visual, themes, a status, content for each of the seven story
  stages, a set of options considered (one marked as chosen, with the reason), supporting
  visuals and clips, and optionally a live demo address.
- **Other project entry**: One of Don's other real drc.dev projects, shown only on the index as
  a short entry with a title, problem statement, visual, themes and status, and no story page.
- **Decision document**: The lasting output of the feature. Summarises every direction with its
  screenshots and trade-offs and holds an empty Decision section for Don.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Three directions are available on the preview deployment, each with a story
  page and an index, and each page can be viewed in 2 themes at 2 widths (8 views per
  direction) with no content cut off and no horizontal page scrolling.
- **SC-002**: In every direction, a reader can reach all seven story stages and every one of the
  sample project's options, both with reduced motion requested and with JavaScript turned off.
- **SC-003**: The automated accessibility checks report zero WCAG 2.2 A or AA violations on
  every direction's story page and index in every state listed in FR-030.
- **SC-004**: Don can compare the directions and record a choice using the decision document and
  its screenshots alone, in one sitting of under 30 minutes, without needing to ask how any
  direction behaves. This is checked objectively before review by confirming that the document
  contains, for every direction, every element FR-040, FR-048 and FR-049 require, and that
  every one of its 24 image references resolves to a committed image; the 30-minute sitting is
  then confirmed by Don's review.
- **SC-005**: After merge, main contains the decision document and its 24 screenshots, with an
  empty Decision section, and none of the direction prototypes, their tests or the shared
  edits. The list of pages in the built site and in its sitemap after merge is identical to
  the list on main before the feature.
- **SC-006**: Every theme filter on every index shows exactly the entries tagged with that
  theme.

## Assumptions

- The short entries for Don's other drc.dev projects take their title, one-line description and
  visual from drc.dev; their themes and statuses are Claude's best reading of that page and are
  corrected by Don on review.
- The invitation points at the site's planned contact address. The contact form is being built
  in a separate feature; if it is not live on the preview deployment, the invitation still
  carries the project reference even if the link leads to the not-found page there.
- Live demos stay hosted on drc.dev; this feature does not host or change them. If Focus Pocus
  has no live demo, the directions show how a demo would be presented using a still image and a
  link to its public page or repository, and the decision document says so.
- The sample project's diagrams are drawn by Claude from its repository; its screenshots and
  demo clips are labelled placeholder frames with text descriptions. Creating production-quality
  media is out of scope.
- "Phone width" means 390 CSS pixels and "desktop width" means 1280 CSS pixels, the widths the
  site's existing visual tests use. Reflow is also checked at 320 CSS pixels (FR-034).
- The prototypes are internal review material, not public pages, so they are kept out of
  navigation and search engines for the short time they exist on the preview deployment.
- The sample project's data is throwaway prototype data shared by the three directions. It is
  not the real portfolio's content model and does not decide how projects will be stored as
  content; that is designed by the real portfolio feature.
- Automated accessibility checks alone do not show WCAG 2.2 AA conformance; the manual checks
  in FR-039 fill that gap.
- The order of delivery is: the prototypes pass the release gate; the screenshots are
  captured; the pinned commit is pushed and its preview deployment is recorded; the decision
  document's addresses are filled in; the prototypes are removed and the release gate passes
  again; the pull request waits for Don to review the pinned previews and approve; it merges.

## Out of Scope

- Building the real portfolio, including story pages for the four other projects.
- Content collections, or any other definition of how projects are stored as content.
- Hosting, changing or re-hosting demos; live demos stay on drc.dev.
- Building the contact form, or any behaviour of it beyond receiving the project reference in
  its address.
- Choosing a direction; that is Don's decision.
- Correcting the draft story content; it is not a merge condition.
- Production-quality screenshots, clips or other media.
- Print styling of the prototypes.

## Follow-up Work

- Don's corrections to the Focus Pocus story content carry over to the real portfolio feature.
- Story pages for Tempo, Flux, drc.dev and Plunge Buddy belong to the real portfolio feature.
- Real screenshots and demo clips replace the placeholder frames in the real portfolio.
- The contact form's handling of the project reference belongs to the contact feature.
- A fourth direction, or a revised set after all three are rejected, would be a new feature.
