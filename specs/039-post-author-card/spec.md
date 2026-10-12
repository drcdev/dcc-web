# Feature Specification: Author card at the end of posts

**Feature Branch**: `039-post-author-card`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Author card at the end of posts (GitHub issue #166). Each post ends with a short author card: a photo, two lines on who Don is in his current role, and links to the rest of the series and to the Contact page. A reader who arrives on a post from LinkedIn learns who wrote it without hunting for the About page."

## Background

Posts are often shared on LinkedIn, and a reader who follows that link lands straight on a post.
Today nothing on a post says who wrote it beyond the site name: the title card shows the blog
name ("Drift & Convergence"), the title, the summary and the dates. The end of a post has, in
order, the "views are my own" note, the Share area and up to three Related posts. To learn who Don
is, a reader has to find the About page from the header menu.

The site already has what a short introduction needs:

- A portrait photo of Don with alt text, shown on the home page.
- Don's current role, which the About page gives as Director, Data Infrastructure and
  Architecture at Island Health. That page is the only place on the site that states his job
  title. Older wording that calls him a Cloud Architect is out of date and must not be used.
- Two series, Drift and Convergence, each with its own page. A post belongs to at most one series;
  some posts belong to none. The writing landing page (`/writing/`) introduces the writing and
  leads to both series and to the list of all posts.
- A Contact page with the contact form.

## Clarifications

### Session 2026-10-11

- Q: Where at the end of a post should the author card go? → A: Between the "views are my own" note and the Share area (order: post text, views note, author card, Share area, Related posts).
- Q: For a post in no series, where should the card's writing link go? → A: To the writing landing page (all posts), with link text such as "More of my writing"; a post in a series links to its series page instead.
- Q: Should the card also link to the About page? → A: Yes, as its own plain link with text such as "More about me".
- Q: What should the card's two lines say, and in what voice? → A: First person, kept in one blog-settings place: "I'm Director, Data Infrastructure and Architecture at Island Health." and "I write about systems thinking, practical AI and leading complex change." Don may revise the wording in review.
- 2026-10-11 (Don, in review): The site states his job title only on the About page. The card's first line no longer gives the title and now reads "I lead teams in data infrastructure and architecture, and in AI support and compliance." (what he does, not his title); the second line is unchanged. FR-004a changed to match.
- Q: What heading should the card have? → A: A visible heading "Written by Don Coleman".

### Checklist resolution 2026-10-11

The checklist phase pinned what the clarify answers left as examples, without changing any
decision: the link texts are exactly "More in {series name}", "More of my writing", "More about
me" and "Get in touch"; the heading is a level-2 heading; the no-series link goes to the writing
landing page (`/writing/`), as Don confirmed. Layout, photo, accessibility and performance details
the checklists asked for are recorded in the requirements below.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader learns who wrote the post (Priority: P1)

A reader arrives on a post from a LinkedIn link and reads to the end. Below the post text they
find a short card headed "Written by Don Coleman", with Don's photo and two first-person lines
saying who he is in his current role.
They know who wrote the post without leaving the page.

**Why this priority**: This is the problem the issue names. On its own it answers "who wrote
this?" for every reader who lands on a post.

**Independent Test**: Open any published post, scroll to the end and confirm the card shows the
photo, Don's name and the two lines on who he is and what he does, and that the card states no job title (the About page is the only place that does).

**Acceptance Scenarios**:

1. **Given** any published post, **When** the reader scrolls past the post text, **Then** they see
   one author card, between the "views are my own" note and the Share area, with the visible
   heading "Written by Don Coleman", Don's photo and two short first-person lines on who he is in
   who he is and what he does.
2. **Given** the author card, **When** the reader reads its text, **Then** it describes what he
   does without stating his job title (that is on the About page only) and contains no
   "Cloud Architect" wording.
3. **Given** a reader using a screen reader, **When** they reach the card, **Then** the photo is
   announced with meaningful alt text and the card's heading, "Written by Don Coleman", is
   announced as a heading.
4. **Given** a reader with JavaScript turned off, **When** they open a post, **Then** the card and
   all of its links are present and work.

---

### User Story 2 - A reader goes on to more of Don's writing (Priority: P2)

Having finished a post, the reader wants more from the same writer. The card links to the rest of
the series the post belongs to, so they can keep reading.

**Why this priority**: It turns a one-post visit into further reading, but the card already has
value without it.

**Independent Test**: Open a Drift post, a Convergence post and a post in no series; follow the
card's writing link on each and confirm it leads to the right place.

**Acceptance Scenarios**:

1. **Given** a post in the Drift series, **When** the reader follows the card's series link,
   **Then** they reach the Drift series page. The same holds for Convergence.
2. **Given** a post in no series, **When** the reader looks at the card, **Then** it offers the
   link "More of my writing" to the writing landing page (`/writing/`), and no series link.
3. **Given** the card's series link, **When** the reader reads its link text, **Then** it is
   "More in Drift" or "More in Convergence", naming the series rather than a generic "Read
   more".

---

### User Story 3 - A reader gets in touch (Priority: P2)

A reader who finds the post relevant to their own work wants to reach Don. The card has a link to
the Contact page.

**Why this priority**: The Contact link is a stated part of the issue and supports Don's
consulting practice; it is a single link with no new behaviour.

**Independent Test**: Follow the card's contact link from any post and confirm it opens the
Contact page.

**Acceptance Scenarios**:

1. **Given** any published post, **When** the reader follows the card's contact link, **Then**
   they reach the Contact page.
2. **Given** the contact link, **When** the reader reads its text, **Then** it is "Get in touch",
   which says plainly what it does in the site's plain-language voice.
3. **Given** any published post, **When** the reader follows the card's "More about me" link,
   **Then** they reach the About page.

---

### Edge Cases

- A post in no series: see User Story 2, scenario 2.
- A draft post (seen only on previews): the card appears exactly as on a published post, with the
  same content, layout and accessibility, so Don sees the finished end of the post before
  publishing.
- A post with the questions panel: the card sits in the end-of-post area and lines up with the
  views note and Share area, not inside the panel's column. Its content, order and accessibility
  are the same as on a post without the panel.
- A post with no Related posts: the end of the post is post text, views note, author card, Share
  area; nothing else changes.
- Phone-width screens: see FR-011 and FR-015. The photo sits above the text below 768 px and to
  its left from 768 px; nothing scrolls sideways at 320 px.
- Long text: a role line or link text that is longer than the space (including a future series
  with a long name, giving a long "More in {series name}") wraps onto further lines. Nothing is
  truncated, hidden or scrolled sideways, at any width down to 320 px.
- Light and dark themes: see FR-016.
- The photo fails to load: the browser shows the alt text in the photo's reserved square; the
  heading, both lines and all three links are unaffected and the card does not collapse or shift.
- A link destination is hidden, a draft or renamed: the card's links are on every post, so the
  About page, the Contact page, the writing landing page and both series pages must stay visible
  at their current addresses while the card links to them (today all are). If one is hidden,
  made a draft or moved, the site's existing link check fails the release gate rather than
  shipping a dead link, and the card's link is updated in the same change.
- Don's role changes: the About page's title is changed; the card states no title, so it needs
  no change unless its description of what he does is out of date (FR-004a).

## Requirements *(mandatory)*

### Functional Requirements

**Placement and content**

- **FR-001**: Every post page MUST have exactly one author card, placed between the "views are my
  own" note and the Share area. The end-of-post order is: post text, views note, author card,
  Share area, Related posts (when the post has any). The order is the same on every post: with or
  without the questions panel, with or without Related posts, published or draft.
- **FR-002**: The card MUST show the visible heading "Written by Don Coleman", Don's portrait photo,
  and two short lines in the first person on who he is and what he does. "Two lines" means two
  sentences, each its own paragraph and each at most 100 characters; either may wrap onto more
  than one rendered line on a narrow screen.
- **FR-003**: The lines MUST describe what he does now and MUST NOT use stale role wording. The
  banned phrase is "Cloud Architect" in any letter case; any other out-of-date role is caught by
  FR-004a. The lines are "I lead teams in data infrastructure and architecture, and in AI support and compliance." and "I write about systems thinking, practical AI and leading complex change." Don may
  revise the wording in review: the final text is whatever is in the one settings place when Don
  approves the pull request. Tests check the rules in this requirement and FR-002 (two
  sentences, length, banned phrase, no job title) and read the text from the settings place;
  no test repeats the exact wording.
- **FR-004**: The card's name, photo, photo alt text and role lines MUST be the same on every post
  and MUST be kept in one place (the blog's settings), so a change to any of them updates every
  post at once. The link texts and destinations are fixed site wording that belongs to the card
  itself, not to that place.
- **FR-004a**: The card MUST NOT state a job title. The About page is the only place on the site
  that does ("Director, Data Infrastructure and Architecture" at Island Health). A test reads the
  title from the About page and checks that no card line contains it.

**Links**

- **FR-005**: On a post in a series, the card MUST link to that series' page with the exact text
  "More in {series name}": "More in Drift" to the Drift series page (`/writing/drift/`) and "More
  in Convergence" to the Convergence series page (`/writing/convergence/`). A post's series is
  the one series among its topics (a post belongs to at most one); its other topics do not
  affect the link.
- **FR-006**: On a post in no series, the card MUST link to the writing landing page
  (`/writing/`) with the exact text "More of my writing", and MUST show no series link. A post in
  a series shows only its series link, not this one.
- **FR-007**: The card MUST link to the Contact page (`/contact/`) with the exact text "Get in
  touch".
- **FR-008**: The card MUST link to the About page (`/about/`) with its own plain link, with the
  exact text "More about me". The heading and Don's name are not links.
- **FR-008a**: The card MUST have exactly three links, in this order in both the reading order and
  the visual order: the writing link (FR-005 or FR-006), "More about me", "Get in touch". All
  three have the same visual weight; none is styled as a primary button. Each link's accessible
  name is its visible text, with no override, and the four possible link texts are all different,
  so each link makes sense on its own, out of context.

**No script**

- **FR-009**: The card MUST be part of the page as delivered and MUST add no client-side script.
  With JavaScript turned off, the delivered page contains the heading, both lines, the photo with
  its alt text and all three links, none of them hidden, so a sighted reader, a keyboard user and
  a screen reader user all get the whole card.

**Accessibility**

- **FR-010**: The card MUST meet WCAG 2.2 AA in light and dark themes and at every supported width
  (FR-015). Its visible heading "Written by Don Coleman" MUST be a level-2 heading, a sibling of
  the "Share this post" and "Related posts" headings under the post title's level-1 heading.
- **FR-010a**: The card is a plain section, not a landmark: it has no accessible name of its own
  and no landmark role, the same as the Share area. Its heading is how assistive technology finds
  it.
- **FR-010b**: Reading order, whatever the visual order: heading, first line, second line, the
  three links in FR-008a order, then the photo. Keyboard order: the three card links, in that
  order, after any link in the post text and views note and before the Share area's links.
- **FR-010c**: The photo's alt text MUST identify Don by his full name and nothing else: "Don
  Coleman". It has no "photo of" or "image of" prefix and no role or description, because the
  photo's purpose on the card is to show who wrote the post. The name is heard twice (in the
  heading and as the last item, the photo) by design; the photo is not marked decorative because
  it carries the author's likeness. The home page's longer alt text is written for its own
  context and is not reused.
- **FR-010d**: Each card link MUST have a target of at least 24 by 24 CSS px (WCAG 2.5.8), also
  when the links wrap onto several lines or sit side by side at 320 px.
- **FR-010e**: Each card link MUST show the site's visible focus indicator when focused by
  keyboard, in both themes, with at least 3:1 contrast against the card's background, and the
  focused link MUST NOT be entirely hidden by the site's sticky header or any other content
  (WCAG 2.4.11).
- **FR-010f**: Contrast, in both light and dark themes: the heading, both lines and the link text,
  in their normal and hover states, MUST each have at least 4.5:1 contrast against the card's
  background; the focus indicator at least 3:1 (FR-010e). The links are underlined, so their
  purpose is not shown by colour alone.
- **FR-010g**: In forced-colours (high-contrast) mode, the card's text, links, underlines, focus
  indicator and its boundary MUST remain visible, using the system colours as the rest of the
  site does. The card has no animation or motion, so reduced-motion settings need nothing from
  it.

**Layout and look**

- **FR-011**: The card MUST line up with the other end-of-post pieces: its left and right edges
  equal the post title card's (and so the views note's and Share area's) within 1 px at 320,
  375, 768, 1024 and 1440 px, with and without the questions panel.
- **FR-012**: The card MUST use the site's existing visual language: the post title card's box
  (border, background, rounded corners, padding and shadow) in both themes, the Share area's
  heading style and the site's existing plain underlined link style.
- **FR-012a**: The card MUST be clearly distinct from the title card and the Related posts cards
  that look similar: it has its own heading "Written by Don Coleman" and a round portrait, and it
  carries no post title, summary, date, feature image or topic pill.
- **FR-013**: The card appears only on post pages. No other page has it: the home page, other
  Markdown pages (About, Contact, Work with me, Technology, Projects, the privacy and terms
  pages), project stories, every writing listing (the writing landing page, series pages, the
  all-posts list and its pages) and the not-found page. It is not added to the RSS feed's post
  content.

**Photo and performance**

- **FR-014**: The photo MUST be shown as a circle 96 CSS px across, cropped from Don's existing
  square portrait, served at one and two times that size in a modern compressed image format, and
  loaded lazily (it is below the fold on every post). Its width and height MUST be reserved
  before it loads, so the card causes no layout shift.
- **FR-014a**: The post page MUST stay within the site's existing performance budget (on a 390 x
  844 phone viewport: Largest Contentful Paint at most 2.5 s, Cumulative Layout Shift at most 0.1,
  at most 10 KB of JavaScript and at most 150 KB transferred in total). The card's allowed share
  of that budget is: 0 bytes of JavaScript, no layout shift, the photo outside the initial load
  (lazy), and the photo file at most 20 KB at its larger size.
- **FR-015**: Supported widths are 320 px to 1440 px and beyond, checked at 320, 375, 768, 1024
  and 1440 px. Below 768 px the photo sits centred above the text, and the heading, lines and
  links are centred, matching the views note and Share area. From 768 px the photo sits to the
  left of the text, top-aligned, and the text and links are left-aligned. At 320 px and at 200%
  text zoom nothing scrolls sideways and no content or link is lost or overlapped (WCAG 1.4.4,
  1.4.10).
- **FR-016**: The card is readable in both light and dark themes and meets FR-010f in both.

### Key Entities

- **Author profile**: The one set of facts the card shows: name (in the heading "Written by Don
  Coleman"), portrait photo, its alt text ("Don Coleman") and two first-person role lines. Kept
  in one place and shared by every post. Link texts are not part of it (FR-004).
- **Series**: Drift or Convergence. A post belongs to at most one; the card's series link depends
  on it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of post pages show the author card with photo, name and role lines; 0 non-post
  pages show it.
- **SC-002**: A reader landing on any post can name the author and his current role after
  scrolling to the end, without following a link.
- **SC-003**: From any post, a reader reaches the post's series page (or, for a post in no series,
  the writing landing page `/writing/`), the About page and the Contact page in one click each.
- **SC-004**: The card's text contains no "Cloud Architect" wording, and it states no job title (the
  About page is the only place that does).
- **SC-005**: Every post template passes the automated accessibility check in light and dark
  themes, every card link has a target of at least 24 x 24 px, and the post page stays within the
  existing performance budget (FR-014a). The automated check covers contrast, heading markup,
  alt text presence, link names and target size; the remainder is checked by Don on the preview
  before approving: alt text and link wording make sense, keyboard focus moves through the three
  card links in order and stays visible, and the card reflows at 320 px and at 200% text zoom.
- **SC-006**: Changing the role wording in its one place changes it on every post's card with no
  per-post edit.

## Assumptions

- The photo is the existing square portrait already used on the home page, shown as a circle;
  no new photo is needed. Only the image file is shared: the card has its own alt text
  (FR-010c), because the home page's is worded for that page.
- The two lines are the first-person wording in FR-003, kept with the blog's other settings.
  Don revises the wording in review; the draft is plain language with no hype.
- The site has a single author, so the card always describes Don and posts carry no author setting.
- "The rest of the series" means a link to the series page, not a list of the other posts in the
  series; the existing Related posts section already lists individual posts.
- Every post shows the card; there is no per-post setting to turn it off.
- The views note, Share area and Related posts stay as they are, apart from where the card sits
  among them.

## Out of Scope (follow-up work)

Each item below is listed under a "Follow-up" heading in the pull request body, so Don can file
it as an issue and it is not lost.

- Author information in search-engine structured data or link previews.
- An author card on project stories or pages.
- Multiple authors or guest posts.
- Updating other stale "Cloud Architect" wording elsewhere on the site, if any is found, beyond the
  card itself.
