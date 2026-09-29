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
   every direction listed with its name and a link to its landing page.
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
   dark theme, **Then** text, links, topic labels and images are legible and meet contrast
   minimums.
2. **Given** any screen of any direction, **When** it is viewed at a phone width, **Then** no
   content is cut off and the page does not scroll sideways.
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

1. **Given** the decision document, **When** Don reads a direction's entry, **Then** it has a
   summary, links to its preview pages, pictures of it in both themes, how topics are presented,
   proposed addresses for posts and topic pages, and trade-offs.
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

- A post with no image: each direction shows how a post without a feature image appears in lists
  and on its page.
- A post with many topics, or with a long title: lists and post headers stay readable and do not
  overflow at phone width.
- A topic with only one post: the topic listing shows how it looks with very few posts.
- More posts than fit on one page: the listing shows the controls for moving to other pages,
  including how the first and last page look.
- No post marked as most important: the direction's description says how the landing page
  presents the newest writing in that case.
- A wide table or long line of code on a phone: it can be read without the whole page scrolling
  sideways.
- While the prototype pages exist on preview deployments, they must not be mistaken for the real
  blog by search engines or visitors.

## Requirements *(mandatory)*

### Functional Requirements

**Directions**

- **FR-001**: The feature MUST provide exactly three design directions. They draw on the site's
  current look and the Flux theme patterns only; no outside blogs or sites are used as references.
- **FR-002**: Each direction MUST include three screens: a Writing landing page, a post listing
  (shown for all posts and for a single topic) and a post page.
- **FR-003**: The directions MUST differ from each other in structure (how posts are grouped,
  ordered, featured and laid out, and how topics are presented), not only in styling.
- **FR-004**: Each direction MUST use realistic sample posts on the blog's subject (systems
  leadership and technology), covering every starting topic: high-compliance data and
  integration, high-performing technology teams, agentic AI in legacy environments, and
  healthcare technology leadership.
- **FR-005**: There MUST be an index that lists every direction with a link to its landing page,
  and each direction's screens MUST link to each other.

**Reader needs each direction demonstrates**

- **FR-006**: Each landing page MUST show the newest writing near the top and MUST set apart the
  posts Don considers most important. A post is most important when Don has marked it as
  featured; the directions differ in how featured posts are shown, not in how they are chosen.
- **FR-007**: Each listing MUST show posts newest first and MUST show how a reader moves between
  pages of posts.
- **FR-008**: Each direction MUST show how a reader browses posts by topic and moves between
  topics and back to all posts. Each topic's listing MUST open with a short introduction (one or
  two sentences describing the topic) above its posts.
- **FR-009**: Wherever a post is presented, each direction MUST show its title, date, reading
  time, topics and summary.
- **FR-010**: Each post page MUST include at least one image with a caption, one code sample and
  one table.
- **FR-011**: Each post page MUST end with links to related posts.
- **FR-012**: Each direction MUST propose addresses for posts, topic pages and the listing pages,
  and a post's proposed address MUST NOT include its topics.

**Look and quality**

- **FR-013**: Each direction MUST keep the site's existing colours, typography, and light and
  dark themes. A direction that needs a new colour or font MUST name it in its description.
- **FR-014**: Each screen of each direction MUST be viewable in both themes and at phone and
  desktop widths, and MUST meet WCAG 2.2 AA.
- **FR-015**: Each screen MUST be readable with JavaScript turned off.
- **FR-016**: The prototype screens MUST be available on the pull request's preview deployment
  for Don to review.
- **FR-017**: The prototype screens MUST NOT be indexed by search engines, listed in the site's
  navigation or sitemap, or presented as the real blog.
- **FR-018**: The prototype screens MUST be removed before the feature merges to main; only the
  decision document and its pictures merge.

**Decision document**

- **FR-019**: The feature MUST produce one decision document that, for each direction, gives a
  summary, links to its preview screens, pictures of its screens in both themes, how topics are
  presented, its proposed addresses, and its trade-offs.
- **FR-020**: The decision document MUST end with a Decision section containing a line for the
  chosen direction and a place for notes, both left empty for Don.
- **FR-021**: The pictures in the decision document MUST be enough to compare the directions
  after the prototype screens have been removed.

**Blog name**

- **FR-022**: Each direction MUST present the blog under the name "Drift & Convergence". The
  directions do not propose other names.

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
  screens.
- **SC-003**: Every prototype screen passes the site's automated accessibility checks with zero
  violations, and the site builds with all its existing checks passing.
- **SC-004**: Don can reach any direction's three screens from the directions index in no more
  than two clicks each.
- **SC-005**: The decision document covers 100% of the directions with every required part, and
  its Decision section is empty.
- **SC-006**: After merge, main contains no prototype screens, and the decision document's
  pictures show every direction in both themes.
- **SC-007**: Don can make a choice from the decision document and preview alone, without asking
  for further material (confirmed by Don at review).

## Assumptions

- Don is the only audience for the prototypes; the future blog's readers are represented by the
  reader needs, not by user testing.
- "Phone width" and "desktop width" mean the same widths the site's existing visual checks use.
- The sample posts are written for this feature and are not published writing; they do not need
  to be Don's real posts, but must be plausible for his subject.
- Proposed addresses live under the /writing/ address that earlier features reserved for the
  blog; redirects from the current site's blog addresses are not part of this feature.
- Pagination, topic browsing and related posts are shown as they would appear, with working links
  within the prototype where practical; they do not need to be driven by real content.
- Feeds, content collections, content schemas, search and the real /writing/ pages are out of
  scope and belong to the later blog feature.
- The feature runs alongside the portfolio design and contact features in separate branches; any
  shared files are handled as the plan describes (Constitution Principle XI).

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
