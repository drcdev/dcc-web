# Feature Specification: Design directions for the blog

**Feature Branch**: `005-blog-design-directions`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Design directions for the blog — Don is replacing the blog on his current site with a new one, 'Drift & Convergence', for writing about systems leadership and technology. Before it is built, he wants to choose between two or three design directions. The blog is designed fresh: the current site's categories (Drift, Convergence, News) and their addresses do not carry over; it keeps the site's overall look (colours, typography, light and dark themes). The future blog must let readers find the newest writing and Don's most important posts, browse all posts newest first a page at a time, browse by topic, see each post's title, date, reading time, topics and summary, read posts with images and captions, code samples and tables, and move to related posts; posts get simple, stable addresses that survive topic reorganization. This feature delivers two or three distinct design directions (Writing landing page, a post listing and a post page, with realistic sample posts), each viewable on the preview deployment in both themes at phone and desktop widths, a description of each direction's topic presentation, addresses and trade-offs, and a decision document Don can use to choose. Building the real blog, content collections and feeds is out of scope." (The full feature brief, including technical direction, parallel-work rules and a definition of done, is kept with the /deliver run and is deliberately not restated here as requirements.)

## Context

The site foundation (feature 002) put a Writing entry in the header navigation that points at
/writing/, which currently shows the not-found page, and feature 003 reserved that address for
the blog. The current doncoleman.ca blog groups posts under three categories (Drift,
Convergence, News); those categories and their addresses are being retired, not migrated.

This feature does not build the blog. It produces the material Don needs to choose how the blog
will look and be organized: three working prototypes of the blog's three key screens, and
a decision document comparing them. The chosen direction then becomes the input for a later
feature that builds the real blog.

Because the directions propose the structure and visual treatment of a whole site section and
may propose new navigation or addresses, the work is treated as a major change under
Constitution Principle III: the pull request waits for Don's review of the preview deployment.
The order is fixed: the prototypes go up on the pull request's preview deployment; Don reviews
them and records his choice or asks for changes; only then are the prototypes removed on the
same branch; Don then approves the pull request and it merges. Auto-merge stays off throughout.

## Clarifications

### Session 2026-09-29

- Q: Are there blogs or sites whose writing pages Don likes, to inform the directions? → A: No. Design fresh from the site's current look and the Flux theme patterns; no reference sites.
- Q: Should "Drift & Convergence" stay as the blog's name, or should the directions propose a name for the Writing section? → A: Keep the name. Every direction presents the blog as "Drift & Convergence".
- Q: Should the feature deliver two design directions or three? → A: Three directions.
- Q: How does a post become one of Don's "most important" posts? → A: A hand-picked featured flag that Don sets on individual posts in their files.
- Q: Should a topic's page open with its own introduction, or only list that topic's posts? → A: A short introduction (a sentence or two describing the topic) above the topic's posts.

## User Scenarios & Testing *(mandatory)*

The primary user of this feature is Don, choosing a direction. The future reader of the blog is
the user each prototype is judged against.

### User Story 1 - Don compares the directions side by side (Priority: P1)

Don opens the preview deployment and, for each of the three directions, looks at the Writing
landing page, a post listing and a post page, filled with realistic sample posts. He can move
between the three screens of a direction and between directions without guessing addresses, and
the directions are clearly different in how they organize the writing, not just in colour or
decoration.

**Why this priority**: Seeing the directions working is the whole point of the feature. Without
them there is nothing to choose between.

**Independent Test**: On the preview deployment, open each direction's entry point, visit its
landing page, listing page and post page, and confirm each renders with sample content and that
the directions differ in layout and organization.

**Acceptance Scenarios**:

1. **Given** the preview deployment, **When** Don opens the directions index, **Then** he sees
   every direction listed with its name, a one-paragraph summary and links to its landing page,
   its post listing and a post page.
2. **Given** any direction's landing page, **When** Don follows its links, **Then** he reaches
   that direction's post listing and post page without typing an address.
3. **Given** any two directions, **When** Don compares their landing pages, **Then** they differ
   in structure (how posts are grouped, ordered, featured or laid out), not only in styling.
4. **Given** any direction, **When** Don reads its sample posts, **Then** the posts read as
   realistic writing on the blog's topics, with plausible titles, dates, summaries and lengths,
   not filler text.

---

### User Story 2 - Each direction shows everything a reader will need (Priority: P1)

For each direction, Don can check that a future reader could do everything the real blog must
support: find the newest writing quickly, see which posts Don considers most important, browse
all posts newest first a page at a time, browse by topic, see each post's title, date, reading
time, topics and summary, read a post with images and captions, code samples and tables, and
move to related posts from the end of a post.

**Why this priority**: A direction that looks good but cannot show a reader need is not a real
option. Each must be judged on the blog it will become.

**Independent Test**: For each direction, walk through the reader needs listed above on its
three screens and confirm each one is demonstrated.

**Acceptance Scenarios**:

1. **Given** a direction's landing page, **When** a reader arrives, **Then** the newest posts are
   visible without scrolling far, and posts Don marks as most important are visibly set apart.
2. **Given** a direction's listing page, **When** a reader views it, **Then** posts appear newest
   first, and the page shows how a reader would move to older and newer pages of posts.
3. **Given** a direction's listing page, **When** it is shown for a single topic, **Then** the
   page makes clear which topic is being shown, opens with a short introduction to that topic,
   and shows how to reach the other topics and all posts.
4. **Given** any post shown in a list or on a post page, **When** a reader looks at it, **Then**
   its title, date, reading time, topics and summary are shown.
5. **Given** a direction's post page, **When** a reader reads it, **Then** it contains at least
   one image with a caption, one code sample and one table, each readable at phone and desktop
   widths.
6. **Given** the end of a direction's post page, **When** a reader finishes the post, **Then**
   links to related posts are offered.

---

### User Story 3 - Each direction works in both themes, on a phone and a desktop (Priority: P1)

Don views each direction in the light and dark themes, at a phone width and a desktop width. Each
direction keeps the site's existing look (colours, typography, light and dark themes) and is
usable with a keyboard and a screen reader.

**Why this priority**: The blog must fit the rest of the site and meet the site's accessibility
standard; a direction that only works in one theme or at one width is not a real option.

**Independent Test**: For each screen of each direction, switch theme and resize between phone
and desktop widths; run the site's automated accessibility checks.

**Acceptance Scenarios**:

1. **Given** any screen of any direction, **When** it is viewed in the light theme and in the
   dark theme, **Then** body text, links, topic labels, pagination controls, captions and
   images are legible and meet the WCAG 2.2 AA contrast minimums: 4.5:1 for normal text, 3:1
   for large text (24 px, or 18.66 px bold), and 3:1 for user interface components, focus
   indicators and the meaningful parts of images and illustrations.
2. **Given** any screen of any direction, **When** it is viewed at the phone width or at a
   320 CSS pixel wide viewport, **Then** no content is cut off and the page does not scroll
   sideways (WCAG 2.2 reflow, 1.4.10).
3. **Given** any screen of any direction, **When** it is checked automatically for
   accessibility, **Then** it reports no WCAG 2.2 AA violations.
4. **Given** any screen of any direction, **When** it is loaded with JavaScript turned off,
   **Then** all of its content is readable.
5. **Given** a direction that needs a colour or font the site does not already have, **When**
   Don reads its description, **Then** the addition is named explicitly.

---

### User Story 4 - Don has a decision document to choose with (Priority: P2)

Don reads one document that, for each direction, summarizes the idea, links to its preview
pages, shows it in both themes, explains how topics are presented, proposes the addresses posts
and topic pages would use, and lists its trade-offs. The document ends with an empty Decision
section where Don records the chosen direction and notes.

**Why this priority**: The prototypes show what each direction looks like; the document explains
the consequences that are not visible on screen (addresses, reorganizing topics, effort) and
records the choice for the later build.

**Independent Test**: Open the decision document and confirm that every direction has each of
the listed parts and that the Decision section is present and unfilled.

**Acceptance Scenarios**:

1. **Given** the decision document, **When** Don reads a direction's entry, **Then** it has
   every part FR-019 lists.
2. **Given** the decision document, **When** Don reaches the end, **Then** there is a Decision
   section with a line for the chosen direction and space for notes, both left empty.
3. **Given** a direction's proposed addresses, **When** Don reads them, **Then** they show that a
   post's address does not depend on its topics, so renaming, merging or splitting topics would
   not change any post's address.
4. **Given** the decision document after the feature is merged, **When** the prototype pages are
   no longer on the site, **Then** the document still conveys each direction through its
   pictures and descriptions.

---

### Edge Cases

Every direction MUST demonstrate each of the following cases on its own screens, except the
"no post marked as most important" case, which each direction describes in words.

- A post with no image: each direction shows how a post without a feature image appears in lists
  and on its page. No empty image or placeholder picture is shown, and nothing is announced to
  assistive technology in place of the missing image.
- A post with many topics (three or more), or with a long title (90 characters or more): lists
  and post headers stay readable at the phone width and at 320 CSS pixels; titles and topic
  labels wrap onto further lines rather than being cut off, overlapping other content or
  making the page scroll sideways.
- A topic with only one post: the topic listing shows how it looks with very few posts.
- More posts than fit on one page: the listing shows the controls for moving to other pages,
  including how the first and last page look.
- No post marked as most important: the direction's description (on the directions index and
  in the decision document) says how the landing page presents the newest writing in that
  case; the landing page still shows the newest writing near the top.
- A wide table or long line of code on a phone: the table or code sample scrolls sideways inside
  its own labelled region, which can be reached and scrolled with the keyboard, so the whole
  page never scrolls sideways.
- While the prototype pages exist on preview deployments, they must not be mistaken for the real
  blog by search engines or visitors (see FR-017 for the mechanisms).

## Requirements *(mandatory)*

### Functional Requirements

**Directions**

- **FR-001**: The feature MUST provide exactly three design directions. They draw on the site's
  current look and the Flux theme patterns (as recorded in docs/design-source.md) only; no
  outside blogs, sites or design references are used.
- **FR-002**: Each direction MUST include three screens: a Writing landing page, a post listing
  (shown for all posts and for a single topic) and a post page.
- **FR-003**: The directions MUST differ from each other in structure, not only in styling.
  Structure is judged on five axes: (1) how posts are grouped (for example by date, by topic or
  not at all), (2) how they are ordered on the landing page, (3) how featured posts are set
  apart, (4) the page layout of the landing, listing and post screens, and (5) how topics are
  presented and browsed. Any two directions MUST differ on at least three of the five axes. The
  decision document MUST include one overview table with a row per axis and a column per
  direction, so overlap between directions can be seen at a glance.
- **FR-004**: Each direction MUST use realistic sample posts on the blog's subject (systems
  leadership and technology), covering every starting topic: high-compliance data and
  integration, high-performing technology teams, agentic AI in legacy environments, and
  healthcare technology leadership. The same sample set is used by all three directions. It
  MUST contain enough posts to fill at least three listing pages, give every topic at least
  one post, and give exactly one topic a single post (for the one-post edge case). Sample
  writing is realistic when: titles are specific to one of the four topics; dates are
  plausible and distinct; each summary is one or two complete sentences; reading times match
  the length of the text; and every body is written in real sentences with no placeholder
  ("lorem ipsum") text.
- **FR-005**: There MUST be an index that lists every direction with its name, a
  one-paragraph summary and direct links to its landing page, its post listing and a post page.
  Each direction's screens MUST link to each other and back to the index, and to the same
  screen in the other two directions.

**Reader needs each direction demonstrates**

- **FR-006**: Each landing page MUST show the newest writing near the top and MUST set apart the
  posts Don considers most important. A post is most important when Don has marked it as
  featured; the directions differ in how featured posts are shown, not in how they are chosen.
  Each direction MUST also state how its landing page looks when no post is featured.
- **FR-007**: Each listing MUST show posts newest first and MUST show how a reader moves between
  pages of posts.
- **FR-008**: Each direction MUST show how a reader browses posts by topic and moves between
  topics and back to all posts. Each topic's listing MUST open with a short introduction (one or
  two sentences describing the topic) placed directly after the topic's heading and before its
  first post, in every direction.
- **FR-009**: Wherever a post is presented, each direction MUST show its title, date, reading
  time, topics and summary.
- **FR-010**: Each post page MUST include at least one image with a caption, one code sample and
  one table.
- **FR-011**: Each post page MUST end with links to related posts.
- **FR-012**: Each direction MUST propose addresses for the landing page, the first page of all
  posts, later pages of all posts, topic pages and posts. A post's proposed address MUST NOT
  include any topic: the address pattern may contain only the post's own name and, at most,
  its year, and no sample post's proposed address may contain any topic's name. The decision
  document shows this with each direction's address table and a statement that renaming,
  merging or splitting topics changes no post's address, because topics appear only in topic
  page addresses.

**Look and quality**

- **FR-013**: Each direction MUST keep the site's existing colours, typography, and light and
  dark themes. The existing colours are the palettes defined in the site's theme tokens (dusk,
  rust, sage, lavender, mist, sand, mauve and the accent palette, as listed in
  docs/design-source.md), and the existing typography is the site's current font stack; any
  colour or font outside these is new. A direction that needs a new colour or font MUST name it
  in its description and in its "New colours or fonts" part of the decision document, which
  says "None" when nothing is added.
- **FR-014**: Each screen of each direction MUST be viewable in both themes and at phone
  (390 CSS pixels) and desktop (1280 CSS pixels) widths, and MUST meet WCAG 2.2 AA, in line
  with Constitution Principle X. FR-023 to FR-031 spell out what that means for these screens.
- **FR-015**: Each screen MUST be readable with JavaScript turned off, and every interactive
  element on it (topic navigation, pagination, related-post links, any disclosure such as a
  collapsible topic list, and the code and table scroll regions) MUST work without JavaScript,
  using plain links and native HTML controls.
- **FR-016**: The prototype screens MUST be available on the pull request's preview deployment
  for Don to review.
- **FR-017**: The prototype screens MUST NOT be indexed by search engines, listed in the site's
  navigation or sitemap, or presented as the real blog. This applies to every prototype page,
  including every generated listing, topic and post page. Every prototype page MUST: carry a
  "noindex" robots instruction of its own (not relying only on site-wide settings); declare no
  canonical address; be left out of the sitemap; have no link to it from the site's header,
  footer or any non-prototype page; open its main content with a visible notice saying it is a
  design prototype for review and not the published blog; and have a page title that starts
  with "Prototype".
- **FR-018**: The prototype screens MUST be removed before the feature merges to main; only the
  decision document, its pictures and the feature's Spec Kit documents merge. Removal is a
  defined step done by the agent on the same branch after Don's preview review (a task marked
  as waiting on Don). It removes the prototype pages, their sample data, sample images and
  components, the tests that cover only the prototypes, the picture-capture tooling, and any
  build configuration change made for the prototypes. The verifiable end state is: main has no
  prototype pages, no prototype tests, sample data or capture tooling, no build configuration
  change from this feature, and the site's full checks pass.

**Decision document**

- **FR-019**: The feature MUST produce one decision document that, for each direction, gives:
  (1) a summary; (2) links to its preview screens; (3) pictures of its screens in both themes
  and at both widths; (4) how topics are presented; (5) its proposed addresses; (6) how the
  landing page looks when no post is featured; (7) any new colours or fonts, or "None"; and
  (8) its trade-offs. This is the one list of required parts; User Story 4 and SC-005 refer to
  it. Trade-offs MUST be stated on the same dimensions for every direction so they can be
  compared: the reading experience, how the design copes as the number of posts grows, the
  effort to build it, the cost of renaming, merging or splitting topics later, how much it
  depends on feature images, and how it behaves on a phone.
- **FR-020**: The decision document MUST end with a Decision section containing a line for the
  chosen direction and a place for notes, both left empty for Don.
- **FR-021**: The pictures in the decision document MUST be enough to compare the directions
  after the prototype screens have been removed: for every direction, each of the three screens
  (landing, listing, post) in both themes at both widths, which is 12 pictures per direction
  and 36 in all, each with alt text naming the direction, screen, width and theme. When the
  prototypes are removed, the preview links in the document MUST be kept as plain text marked
  as removed after review, pointing the reader to the pictures, so no dead link remains.

**Blog name**

- **FR-022**: Every screen of every direction MUST present the blog under the name "Drift &
  Convergence". The directions do not propose other names, and none of them uses the retired
  categories (Drift, Convergence, News) as categories or topics.

**Accessibility of the prototype screens (WCAG 2.2 AA)**

- **FR-023**: Colour and contrast: text, links, topic labels, pagination controls, captions,
  focus indicators and the meaningful parts of images and illustrations MUST meet the ratios in
  User Story 3, scenario 1, in both themes, including text placed over or beside an image or
  illustration. A palette shade that fails a ratio on its background MUST NOT be used there; the
  nearest passing shade of the same palette is used instead, so no new colour is introduced.
  Colour MUST NOT be the only way a topic, a featured post, the current page or the current
  topic is shown; each also has a text label or marker (for example "Featured").
- **FR-024**: Keyboard and focus: every interactive element (topic navigation, pagination,
  related-post links, any disclosure, and the code and table scroll regions) MUST be reachable
  and operable with the keyboard alone, with a visible focus indicator in both themes. Focus
  order MUST follow the visual reading order of each direction's layout (for example, a
  featured region before the newest-posts region when it is shown first). Every prototype
  page MUST keep the site's "Skip to main content" link. Pagination and topic controls MUST
  have a target size of at least 24 by 24 CSS pixels, or the spacing WCAG 2.2 (2.5.8) allows,
  at the phone width.
- **FR-025**: Headings, landmarks and semantics: each screen MUST have exactly one top-level
  heading and no skipped heading levels. Each screen MUST have one main region, and each group
  of topic links, the pagination controls and the related posts MUST sit in its own labelled
  navigation region or section. The current page in pagination and the current topic in topic
  navigation MUST be exposed to assistive technology, not only shown visually. Dates MUST be
  given in a machine-readable form, and reading time and topics MUST be present as text.
  Links to posts MUST use the post title as their text (or include it), so no link reads only
  "Read more" or similar out of context.
- **FR-026**: Reflow and resizing: each screen MUST reflow at 320 CSS pixels wide without
  sideways page scrolling (only the code and table regions may scroll sideways, inside
  themselves), and MUST stay usable with no loss of content when text is resized to 200
  percent or the page is zoomed to 400 percent.
- **FR-027**: Motion and interaction: the prototypes MUST NOT add animation or transitions
  beyond those the site already has, and any motion MUST be turned off when the reader has
  asked for reduced motion. No content or control may be available only on hover, and nothing
  may need a path-based or multi-point pointer gesture.
- **FR-028**: Images and captions: every informative image MUST have alt text that describes
  it; purely decorative images MUST have empty alt text. Each caption MUST be programmatically
  tied to its image (a figure with its caption).
- **FR-029**: Code samples and tables: each code sample MUST sit in a region with an accessible
  name that can be focused and scrolled with the keyboard. The prototypes show code without
  syntax highlighting (highlighting is chosen by the later blog feature), and the code text
  MUST meet the text contrast ratio in both themes. The sample table MUST have a caption and
  header cells marked as headers for their rows or columns, and sit in its own named,
  keyboard-scrollable region.
- **FR-030**: Page language and titles: every prototype page MUST declare English as its
  language and have a unique page title that names the direction and the screen.
- **FR-031**: Verification: the site's automated accessibility checks MUST run on every
  prototype screen, including the index, the first and last listing pages, a topic with
  several posts, the one-post topic, and a post with and without a feature image, in both
  themes, at both widths and with JavaScript turned off. Criteria that automated checks cannot
  fully judge (meaningful alt text, focus order, link purpose, visible focus, reflow at
  400 percent zoom, no hover-only content) MUST be checked by a keyboard and zoom walk-through
  of each direction before the pull request is opened, noted in the pull request, and then
  seen by Don on the preview deployment.

### Key Entities

- **Design direction**: a named, distinct way of organizing and presenting the blog. Has a
  summary, three screens, a topic presentation, proposed addresses, any new colours or fonts it
  needs, and trade-offs.
- **Sample post**: realistic placeholder writing used by the prototypes. Has a title, date,
  reading time, one or more topics, a summary, an optional feature image, a featured flag (set by
  Don to mark it as most important), and (for the post page) a body with an image and caption, code sample and table.
- **Topic**: a subject grouping for posts, starting with the four named topics. A post may have
  several, and each has a short introduction of one or two sentences. Topics may be renamed or reorganized later without changing post addresses.
- **Decision document**: the single document comparing the directions, with an empty Decision
  section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Three directions are available on the preview deployment, each with all
  three screens (landing, listing, post), viewable in every combination of 2 themes and 2 widths.
- **SC-002**: For every direction, each reader need in FR-006 to FR-012 can be pointed to on its
  screens: the landing page shows FR-006, FR-008 (links to topics) and FR-009; the listing (all
  posts and a single topic) shows FR-007, FR-008 and FR-009; the post page shows FR-009, FR-010
  and FR-011; and the decision document gives FR-012.
- **SC-003**: Every prototype screen in the FR-031 scope passes the site's automated
  accessibility checks (WCAG 2.2 A and AA rules) with zero violations in both themes, at both
  widths and with JavaScript turned off, and the site builds with all its existing checks
  passing.
- **SC-004**: Don can reach any direction's three screens from the directions index in no more
  than two clicks each (the index links to each screen directly; a topic listing is reached
  through the direction's own topic links).
- **SC-005**: The decision document covers 100% of the directions with every part FR-019
  lists, and its Decision section is empty.
- **SC-006**: After merge, main contains no prototype screens, and the decision document's
  pictures show every direction in both themes.
- **SC-007**: Don can make a choice from the decision document and preview alone, without asking
  for further material. It is confirmed when Don, at review, records a chosen direction in the
  Decision section (or states it on the pull request) without asking for further material.

## Assumptions

- Don is the only audience for the prototypes; the future blog's readers are represented by the
  reader needs, not by user testing.
- "Phone width" and "desktop width" mean the same widths the site's existing visual checks use:
  390 CSS pixels and 1280 CSS pixels. Reflow is checked separately at 320 CSS pixels, the WCAG
  2.2 reflow width.
- The sample posts are written for this feature and are not published writing; they do not need
  to be Don's real posts, but must be plausible for his subject.
- Proposed addresses live under the /writing/ address that earlier features reserved for the
  blog; redirects from the current site's blog addresses are not part of this feature. The
  prototypes themselves live at separate prototype addresses, not under /writing/, and do not
  link to any /writing/ address; /writing/ stays a reserved not-found address, and the proposed
  addresses appear in the prototypes and the decision document as text only.
- Pagination, topic browsing and related posts are shown as they would appear, with working links
  within the prototype where practical; they do not need to be driven by real content.
- Feeds, content collections, content schemas, search and the real /writing/ pages are out of
  scope and belong to the later blog feature.
- The feature runs alongside the portfolio design and contact features in separate branches; any
  shared files are handled as the plan describes (Constitution Principle XI). The only shared
  file this feature expects to change is the build configuration's sitemap exclusion, written so
  the portfolio feature's equivalent change is identical, and restored to main's version at
  removal.

## Notes for later phases

The feature brief kept with the /deliver run holds guidance that is deliberately not a
requirement here: where the prototypes live and how they are built, which Flux reference
patterns they may draw on, where the decision document is written, the test approach, the
parallel-work rebase procedure, and the definition of done (preview shows every direction, the
decision document is complete with an empty Decision section, and the pull request is labelled a
major change and left for Don's review). Planning should read it alongside docs/design-source.md.

## Follow-up work

- Build the real blog from the chosen direction, including content collections, feeds and
  redirects from the current site's blog addresses (a later feature).
