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
  Architecture at Island Health. Older wording that calls him a Cloud Architect is out of date and
  must not be used.
- Two series, Drift and Convergence, each with its own page. A post belongs to at most one series;
  some posts belong to none. The writing landing page lists every post.
- A Contact page with the contact form.

## Clarifications

### Session 2026-10-11

- Q: Where at the end of a post should the author card go? → A: Between the "views are my own" note and the Share area (order: post text, views note, author card, Share area, Related posts).
- Q: For a post in no series, where should the card's writing link go? → A: To the writing landing page (all posts), with link text such as "More of my writing"; a post in a series links to its series page instead.
- Q: Should the card also link to the About page? → A: Yes, as its own plain link with text such as "More about me".
- Q: What should the card's two lines say, and in what voice? → A: First person, kept in one blog-settings place: "I'm Director, Data Infrastructure and Architecture at Island Health." and "I write about systems thinking, practical AI and leading complex change." Don may revise the wording in review.
- Q: What heading should the card have? → A: A visible heading "Written by Don Coleman".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader learns who wrote the post (Priority: P1)

A reader arrives on a post from a LinkedIn link and reads to the end. Below the post text they
find a short card headed "Written by Don Coleman", with Don's photo and two first-person lines
saying who he is in his current role.
They know who wrote the post without leaving the page.

**Why this priority**: This is the problem the issue names. On its own it answers "who wrote
this?" for every reader who lands on a post.

**Independent Test**: Open any published post, scroll to the end and confirm the card shows the
photo, Don's name and the two lines on his current role, and that the role matches the About page.

**Acceptance Scenarios**:

1. **Given** any published post, **When** the reader scrolls past the post text, **Then** they see
   one author card, between the "views are my own" note and the Share area, with the visible
   heading "Written by Don Coleman", Don's photo and two short first-person lines on who he is in
   his current role.
2. **Given** the author card, **When** the reader reads its role text, **Then** it names his
   current role (Director, Data Infrastructure and Architecture at Island Health) and contains no
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
   **Then** they reach the Drift series. The same holds for Convergence.
2. **Given** a post in no series, **When** the reader looks at the card, **Then** it offers a link
   to the writing landing page (all posts), with link text such as "More of my writing", and no
   series link.
3. **Given** the card's series link, **When** the reader reads its link text, **Then** it names the
   series (for example "More in Drift") rather than a generic "Read more".

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
2. **Given** the contact link, **When** the reader reads its text, **Then** it says plainly what it
   does (for example "Get in touch") in the site's plain-language voice.
3. **Given** any published post, **When** the reader follows the card's "More about me" link,
   **Then** they reach the About page.

---

### Edge Cases

- A post in no series: see User Story 2, scenario 2.
- A draft post (seen only on previews): the card appears exactly as on a published post, so Don
  sees the finished end of the post before publishing.
- A post with the questions panel: the card sits in the end-of-post area and lines up with the
  views note and Share area, not inside the panel's column.
- Phone-width screens: the photo, text and links fit without sideways scrolling; the photo may sit
  above or beside the text.
- Light and dark themes: the card is readable, and its text and links meet contrast requirements,
  in both.
- The photo fails to load: the alt text and the rest of the card still make sense.
- The About or Contact page is hidden or a draft: the card's About and Contact links are part of
  every post, so both pages must stay visible while the card links to them (today both are
  visible).
- Don's role changes: the role text is changed in one place and every post's card updates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every post page MUST have exactly one author card, placed between the "views are my
  own" note and the Share area. The end-of-post order is: post text, views note, author card,
  Share area, Related posts.
- **FR-002**: The card MUST show the visible heading "Written by Don Coleman", Don's portrait photo
  with alt text that identifies him, and two short lines in the first person on who he is in his
  current role.
- **FR-003**: The role lines MUST name his current role and MUST NOT use "Cloud Architect" or other
  stale role wording. The draft lines are "I'm Director, Data Infrastructure and Architecture at
  Island Health." and "I write about systems thinking, practical AI and leading complex change."
  Don may revise the wording in review.
- **FR-004**: The card's photo, name and role lines MUST be the same on every post and MUST be
  maintained in one place, so a change of wording or photo updates every post at once.
- **FR-005**: On a post in a series, the card MUST link to that series' page, with link text that
  names the series.
- **FR-006**: On a post in no series, the card MUST link to the writing landing page (all posts),
  with link text such as "More of my writing", and MUST show no series link. A post in a series
  shows only its series link, not this one.
- **FR-007**: The card MUST link to the Contact page, with plain link text that says what the link
  does.
- **FR-008**: The card MUST link to the About page with its own plain link, with text such as
  "More about me". The heading and Don's name are not links.
- **FR-009**: The card MUST be part of the page as delivered, readable and usable with JavaScript
  turned off, and MUST add no client-side script.
- **FR-010**: The card MUST meet WCAG 2.2 AA in light and dark themes and at every supported
  screen width, with its visible heading "Written by Don Coleman" marked up as a heading.
- **FR-011**: The card MUST line up with the other end-of-post pieces (the views note and the Share
  area): same left and right edges at every width.
- **FR-012**: The card MUST use the site's existing visual language (its colours, type and card
  style) and MUST NOT push the post page past the site's performance budget; the photo is sized
  for the space it fills.
- **FR-013**: The card appears only on post pages. Pages, project stories and listing pages are
  unchanged.

### Key Entities

- **Author profile**: The one set of facts the card shows: name (in the heading "Written by Don
  Coleman"), portrait photo with alt text, two first-person role lines. Kept in one place and shared by every post.
- **Series**: Drift or Convergence. A post belongs to at most one; the card's series link depends
  on it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of post pages show the author card with photo, name and role lines; 0 non-post
  pages show it.
- **SC-002**: A reader landing on any post can name the author and his current role after
  scrolling to the end, without following a link.
- **SC-003**: From any post, a reader reaches the post's series page (or, for a post in no series,
  the writing landing page), the About page and the Contact page in one click each.
- **SC-004**: The card's text contains no "Cloud Architect" wording, and its role matches the About
  page.
- **SC-005**: Every post template passes the automated accessibility check in light and dark
  themes, and the post page stays within the existing performance budget.
- **SC-006**: Changing the role wording in its one place changes it on every post's card with no
  per-post edit.

## Assumptions

- The photo is the existing portrait already used on the home page; no new photo is needed.
- The two role lines are the first-person drafts in FR-003, kept with the blog's other settings.
  Don revises the wording in review; the draft is plain language with no hype.
- The site has a single author, so the card always describes Don and posts carry no author setting.
- "The rest of the series" means a link to the series page, not a list of the other posts in the
  series; the existing Related posts section already lists individual posts.
- Every post shows the card; there is no per-post setting to turn it off.
- The views note, Share area and Related posts stay as they are, apart from where the card sits
  among them.

## Out of Scope (follow-up work)

- Author information in search-engine structured data or link previews.
- An author card on project stories or pages.
- Multiple authors or guest posts.
- Updating other stale "Cloud Architect" wording elsewhere on the site, if any is found, beyond the
  card itself.
