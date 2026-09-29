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
Before the pull request merges, the prototypes are removed, and only the decision document and
its screenshots land on main. The live site therefore gains no new public pages from this
feature.

Because the directions explore the visual identity and layout of a major section of the site,
this feature is treated as a major change under Constitution Principle III: the pull request
waits for Don's review of the preview deployment and his approval.

A blog design directions feature is being prepared in parallel. The two features produce
separate decision documents and separate prototypes and must not overwrite each other's work.

## Clarifications

### Session 2026-09-29

- Q: Which project from drc.dev should be the sample story used in every design direction? → A: Focus Pocus (the MCP server connecting Claude Desktop with OmniFocus). Whether it has a live demo on drc.dev is unconfirmed; treat the demo as "if one exists", otherwise use the project's public page or repository as the demo target and say so.
- Q: What is the story content for the sample project at each stage? → A: Claude drafts each stage from the project's drc.dev page and repository, marked "draft for review"; Don corrects it on the preview deployment.
- Q: Are there portfolios or case-study pages Don likes that should shape the directions? → A: None; the directions draw only on the site's current design and the Flux starting points.
- Q: How many design directions should be built? → A: Three.
- Q: Should the other projects on the index be the real drc.dev projects or invented placeholders? → A: The real drc.dev projects, as short index entries only with no story pages; only Focus Pocus links to a story.

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
the preview deployment, screenshots of the story page and index in both themes, how it handles
story stages, option comparison, demo embeds and scroll reveals, and its trade-offs. The
document ends with an empty Decision section for him to fill in.

**Why this priority**: The document turns the prototypes into a decision Don can make and
record. It depends on the directions existing, so it comes after them, and it is the only part
of the feature that remains on main after the prototypes are removed.

**Independent Test**: Read the decision document on its own, without the preview deployment,
and confirm that for every direction it gives the summary, preview address, screenshots in both
themes, the four behaviours and the trade-offs, and that the Decision section is present and
empty.

**Acceptance Scenarios**:

1. **Given** the decision document, **When** Don reads a direction's section, **Then** it states
   the direction's preview address, shows screenshots of its story page and its index in both
   the light and dark themes, explains how it handles story stages, option comparison, demo
   embeds and scroll reveals, and lists its trade-offs.
2. **Given** a direction needs a colour, typeface or other visual resource that the site does
   not already use, **When** Don reads its section, **Then** the document says so plainly.
3. **Given** the decision document, **When** Don reaches its end, **Then** there is a Decision
   section with no decision filled in.
4. **Given** the prototypes have been removed before merge, **When** Don reads the decision
   document on main, **Then** its screenshots still show every direction.

---

### Edge Cases

- A story stage has no visual: the stage still reads well on its own, and the layout does not
  leave an empty space where a visual would be.
- A live demo cannot be loaded (the demo site is down or refuses to be embedded): the reader
  still sees a description or still image of the demo and a link to open it, and the story is
  not broken.
- A short demo clip cannot play, or the reader has reduced motion requested: the clip does not
  play automatically, and a still frame or description stands in for it.
- The reader selects an index entry other than Focus Pocus: it has no story page, so the entry
  is not presented as a link to one (or links only to the project's existing public page).
- The theme filter matches no entries: the index says plainly that no projects match and offers
  a way to clear the filter.
- A project has more options than fit side by side on a phone: all options remain reachable at
  phone width without horizontal page scrolling.
- The reader switches theme partway through a story: the page updates without losing their
  place.
- The reader lands mid-story from a link to a specific stage: that stage and its visual are
  visible immediately rather than waiting for a reveal.

## Requirements *(mandatory)*

### Functional Requirements

**Directions**

- **FR-001**: The feature MUST deliver exactly three design directions that are visibly distinct from one another in how they present the project story and the projects
  index.
- **FR-002**: Each direction MUST include a project story page and a projects index.
- **FR-003**: Every direction MUST use the same real sample project as its story content, so the
  directions can be compared like for like. The sample project is Focus Pocus, the MCP server
  that connects Claude Desktop with OmniFocus. Its content for each stage is drafted from its
  drc.dev project page and its public repository, and every stage MUST be visibly marked as a
  draft for Don's review until he has corrected it on the preview deployment.
- **FR-004**: The directions MUST draw only on the site's current design baseline and the Flux
  theme starting points; no outside portfolios or case-study pages are used as references.
- **FR-005**: Each direction MUST use only the colours, palettes and typefaces the site already
  uses. A direction that needs anything new MUST say so in the decision document rather than
  adding it silently.
- **FR-006**: Each direction MUST be reachable on the pull request's preview deployment at its
  own stable address, and MUST work in both the light and dark themes and at phone and desktop
  widths.
- **FR-007**: The direction prototypes MUST NOT appear in the site's navigation and MUST NOT be
  offered to search engines.

**Project story page**

- **FR-010**: Each story page MUST present the sample project as seven stages, in this order:
  the problem and who had it; the constraints that made it hard; the options considered and why
  one was chosen; what was built; what happened; what Don would do differently; and an
  invitation reading "Have a problem like this?" or equivalent plain wording.
- **FR-011**: Each story page MUST let the reader look at every option the project weighed, not
  only the one chosen, and MUST make clear which option was chosen and why.
- **FR-012**: Each story page MUST place each visual, diagram or short demo clip next to the
  part of the story it explains.
- **FR-013**: Each story page MUST reveal the story progressively as the reader scrolls.
- **FR-014**: Each story page MUST let the reader open the sample project's demo on its own
  site, and MAY also show it embedded in the page; each direction MUST state which it does. If
  Focus Pocus has no live demo on drc.dev, the demo target is its public project page or
  repository, and the story page and decision document MUST say that it stands in for a demo.
- **FR-015**: The invitation MUST lead to the site's contact form address with the sample
  project identified, so the contact form can note which project the enquiry is about. Whether
  the contact form is live yet does not affect this requirement.
- **FR-016**: With reduced motion requested, each story page MUST show all content without
  movement-based reveal animations and MUST NOT auto-play demo clips.
- **FR-017**: With JavaScript turned off, each story page MUST show every stage, every option
  (chosen and not chosen), every visual or its text alternative, and the invitation.

**Projects index**

- **FR-020**: Each index MUST show, for each entry, its title, a one-line problem statement, a
  visual, its themes, and a status of shipped, experiment or in progress.
- **FR-021**: Each index MUST include the sample project and Don's other real drc.dev projects
  (Tempo, Flux, drc.dev and Plunge Buddy) as short entries with no story pages, so the index
  shows several projects, several themes and every status. Only the sample project links to a
  story page.
- **FR-022**: Each index MUST let the visitor filter entries by theme and clear the filter, and
  MUST say plainly when no entries match.
- **FR-023**: With JavaScript turned off, each index MUST show every entry in full.
- **FR-024**: Selecting the sample project in an index MUST lead to the same direction's story
  page.

**Quality**

- **FR-030**: Every direction's story page and index MUST meet WCAG 2.2 AA in both themes and
  MUST pass the site's automated accessibility checks, including checks with reduced motion
  requested and with JavaScript turned off.
- **FR-031**: Every direction MUST build and pass the site's full release gate while it is on
  the feature branch.
- **FR-032**: All visible writing in the prototypes (labels, placeholder copy, messages) MUST be
  plain language, with no hype or filler.

**Decision document and delivery**

- **FR-040**: The feature MUST produce one decision document for the portfolio design that, for
  each direction, gives: a short summary; its preview address; screenshots of its story page
  and its index in both the light and dark themes; how it handles story stages, option
  comparison, demo embeds and scroll reveals; its trade-offs; and any new visual resources it
  would need.
- **FR-041**: The decision document MUST end with a Decision section that is left empty for Don.
  The feature MUST NOT choose a direction.
- **FR-042**: The screenshots MUST be committed alongside the decision document so they remain
  viewable after the prototypes are removed.
- **FR-043**: Before the pull request merges, the direction prototypes MUST be removed, so that
  only the decision document and its screenshots reach main and the live site gains no new
  pages.
- **FR-044**: The pull request MUST be marked as a major change and left for Don's review and
  approval of the preview deployment.
- **FR-045**: The feature MUST NOT alter or remove work belonging to the parallel blog design
  directions feature or any other feature, including their decision documents and prototypes.

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
- **SC-003**: The automated accessibility checks report zero violations on every direction's
  story page and index in both themes.
- **SC-004**: Don can compare the directions and record a choice using the decision document and
  its screenshots alone, in one sitting of under 30 minutes, without needing to ask how any
  direction behaves.
- **SC-005**: After merge, main contains the decision document and its screenshots, with an
  empty Decision section, and none of the direction prototypes; the live site has no new pages.
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
- Visuals and demo clips for the sample project come from material Don provides or that is
  already public on drc.dev; creating new production-quality media is out of scope.
- "Phone width" and "desktop width" mean the same representative widths the site's existing
  visual tests use.
- The prototypes are internal review material, not public pages, so they are kept out of
  navigation and search engines for the short time they exist on the preview deployment.
- Out of scope: building the real portfolio, defining how projects are stored as content,
  hosting demos, and building the contact form. Choosing a direction is Don's decision and is
  also out of scope.
