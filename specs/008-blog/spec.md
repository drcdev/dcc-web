# Feature Specification: The blog ("Drift & Convergence")

**Feature Branch**: `008-blog`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "The blog, 'Drift & Convergence', for Don's writing on systems leadership and technology, built to the chosen design direction, Direction A ('Front page'), recorded in `docs/design/blog.md` § Decision (Don's note: 'I prefer this format with the ability to add pictures/graphics'). Posts organized by topic; readers find, browse, read, share and subscribe; Don writes a post as a single text file, with drafts, featured posts, update dates, a shared 'views are my own' note and a 'recent writing' section on the home page. Out of scope: comments, newsletter, search, AI analysis of posts, and migrating existing posts."

## Design reference

The appearance and structure of every blog screen follow **Direction A: Front page** in
`docs/design/blog.md` (its summary, pictures, topic presentation, proposed addresses, "When no
post is featured" rule and trade-offs). In short:

- **Writing landing page**: the section name "Drift & Convergence" above the heading
  "Writing"; the newest post as a large lead story (with its feature image when it has one,
  otherwise the prototype's text-only card); a row of colour-coded topic pills with a
  link to all posts; a "Featured" bento grid of up to 3 larger image cards (the prototype's full-width fourth
  card is not used); then a "Latest" card grid
  of recent posts.
- **Listings** (all posts, and each topic): card grids, newest first. A topic page opens with
  an introduction banner in the topic's colour.
- **Post page**: a large feature image with the title card overlapping it, carrying the
  section name, title, summary, a "Featured" mark when featured, date, reading time and topic
  pills; then the body in the site's reading column.
- **Topics** appear as colour-coded pills on every card; each topic keeps a distinct colour.
- No new colours or fonts: only those already in the site's design system.

## Clarifications

### Session 2026-09-29

Answered by the specify agent from the feature description, `docs/design/blog.md` and the
constitution (no interview was possible). `/speckit-clarify` may revisit any of these.

- Q: Which design direction? → A: Direction A ("Front page"), per the recorded decision.
- Q: What addresses do blog pages use? → A: Direction A's proposed addresses: landing
  `/writing/`, all posts `/writing/all/`, page N of all posts `/writing/all/{n}/`, topic
  `/writing/topics/{topic}/`, post `/writing/{slug}/`. No post address contains a topic or a
  date.
- Q: What if no post is featured? → A: The featured grid is left out and the lead story is the
  newest post (Direction A rule).
- Q: Is the lead story ever a featured post? → A: The lead story is always the newest
  published post. If that post is also featured, it appears only as the lead story and not
  again in the featured grid.
- Q: How many posts per listing page, and how many on the landing page? → A: Defaults, which
  planning may tune: 12 posts per listing page; up to 3 featured posts in the grid (the most
  recently published featured posts); up to 6 posts in "Latest"; 3 posts in the home page
  "Recent writing" section; up to 3 related posts at the end of a post.
- Q: What makes a post "related"? → A: Other published posts that share the most topics with
  it, most shared topics first, then newest first.
- Q: What does a post without a feature image look like? → A: It gets a deliberate fallback
  graphic in its first topic's colour (Direction A trade-off: "posts without one need a
  fallback that still looks deliberate"). A feature image is optional.
- Q: What does the feed contain? → A: Every published post, newest first, with title,
  address, publication date and summary. Drafts never appear.

Answered by Don in `/speckit-clarify`:

- Q: Do sample posts (all drafts) show on the branch preview deployment, which Don uses to
  check the pages against Direction A? → A: Yes. Drafts are built and shown with a visible
  "Draft" notice on preview (non-production) deployments and in development and test builds,
  and are left out of the production build only.
- Q: Should the landing page's lead story show the post's feature image? → A: Only when the
  post has one. Without a feature image the lead story is the prototype's text-only card with
  a topic-coloured border, with no large fallback graphic.
- Q: How many featured posts should the "Featured" bento grid hold? → A: Up to 3 (the spec
  default, chosen over the prototype's 4); the prototype's full-width fourth card is not used.
- Q: What should each post in the home page's "Recent writing" section look like? → A: The
  blog's own post card (feature image or fallback, title, date, reading time, topic pills,
  summary, "Featured" mark) in a grid of 3 across on wide screens.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a post (Priority: P1)

A reader opens a post and reads it comfortably on any screen and in either theme: a feature
image, the title card with date, reading time and topics, then the body with the site's
typography, captioned images (including wide and full-width ones), code samples they can read
and copy, and tables that scroll sideways on a small screen instead of breaking the page. At
the end they see Don's standard "views are my own" note.

**Why this priority**: Reading a post is the reason the blog exists. Every other story depends
on posts being readable.

**Independent Test**: Publish one post containing every kind of content (headings, captioned
image, wide image, full-width image, code sample with caption, wide table) and open it at phone
and desktop widths in both themes, with and without scripts enabled.

**Acceptance Scenarios**:

1. **Given** a published post, **When** a reader opens `/writing/{slug}/`, **Then** they see
   the feature image (or the fallback graphic), the section name, title, summary, publication
   date, reading time in minutes and a pill for each of its topics, followed by the body.
2. **Given** a post with a captioned image, a wide image and a full-width image, **When** it is
   shown on a desktop screen, **Then** the wide image extends a little past the text column,
   the full-width image spans the page, each caption appears below its image, and the page
   never scrolls sideways.
3. **Given** a post with a code sample, **When** a reader views it, **Then** the code is
   highlighted in colours that read clearly in both themes, keeps its line breaks and
   indentation, scrolls sideways within its own box if long, and shows its caption if one was
   given.
4. **Given** a code sample and scripts enabled, **When** the reader activates its copy button,
   **Then** the code is placed on the clipboard exactly as written and the button confirms it
   in words that assistive technology announces.
5. **Given** scripts are turned off, **When** a reader opens a post, **Then** the whole post,
   including code samples, is readable; the copy button is not shown.
6. **Given** a post with a table wider than a phone screen, **When** it is viewed at phone
   width, **Then** the table scrolls sideways inside its own area and the page does not.
7. **Given** any published post, **When** it is shown, **Then** the standard "views are my own"
   note appears on it, with the same wording as on every other post.
8. **Given** a post Don has marked as updated, **When** it is shown, **Then** the update date
   appears alongside the original publication date, labelled as an update.

---

### User Story 2 - Find the newest and most important writing (Priority: P1)

A reader opens the Writing section from the site navigation and immediately sees the newest
post as the lead story, the posts Don considers most important in a "Featured" grid, and the
latest posts after that, each card showing title, date, reading time, topics and summary.

**Why this priority**: This is the front door to the blog and the chosen design's defining
screen.

**Independent Test**: With a set of published posts, some featured, open `/writing/` and check
the lead story, the topic pill row, the featured grid and the latest grid against the rules
below.

**Acceptance Scenarios**:

1. **Given** published posts, **When** a reader opens `/writing/`, **Then** the newest
   published post is the lead story, showing its title, summary, date, reading time and topic
   pills, and linking to the post.
2. **Given** the newest post has a feature image, **When** the landing page is shown, **Then**
   the lead story shows that image; **given** it has none, the lead story is a text-only card
   with a border in its main topic's colour and no fallback graphic.
3. **Given** some published posts are marked featured, **When** the landing page is shown,
   **Then** a "Featured" grid shows up to 3 of them (most recently published first, never
   repeating the lead story), each marked "Featured".
4. **Given** no published post is featured apart from the lead story, **When** the landing
   page is shown, **Then** the featured grid and its heading are left out.
5. **Given** published posts, **When** the landing page is shown, **Then** a "Latest" grid
   shows up to 6 of the newest posts not already shown as the lead story or in the featured
   grid, and a link leads to all posts.
6. **Given** the landing page, **When** a reader looks under the lead story, **Then** a row of
   topic pills links to each topic's page, plus a link to all posts.
7. **Given** the site navigation, **When** a reader activates "Writing", **Then** they arrive at
   `/writing/`, and the "Writing" entry is marked as the current section on every blog page.

---

### User Story 3 - Write and publish a post as one file (Priority: P1)

Don writes a new post by adding a single text file: a few settings at the top (title, summary,
publication date, topics, optional feature image with its description, optional featured mark,
optional update date, optional draft mark) and the body below. Drafts stay off the live site.
If he leaves out required information or names a topic that does not exist, the build stops
with a message that names the file and the problem.

**Why this priority**: Without a way to add posts there is no blog; the file-based authoring
flow is required by the constitution (Principle VI, Content as Files).

**Independent Test**: Add one valid post file and confirm it appears everywhere it should; add
one draft and confirm it appears nowhere on the production build but does appear, marked
"Draft", on a preview build; add invalid files and
confirm each fails the build with a clear message.

**Acceptance Scenarios**:

1. **Given** Don adds a valid post file, **When** the site is built, **Then** the post has its
   own page at `/writing/{slug}/` and appears in the landing page, the all posts listing, each
   of its topics' pages, the feed and (if among the newest) the home page.
2. **Given** a post file marked as a draft, **When** the production site is built, **Then** the
   post has no page and appears in no listing, topic page, related list, home page section,
   feed or sitemap.
3. **Given** a post file missing its title, summary, publication date or at least one topic,
   **When** the site is built, **Then** the build fails with a message naming the file and the
   missing field.
4. **Given** a post file naming a topic that is not in the controlled topic list (for example
   a typo), **When** the site is built, **Then** the build fails with a message naming the
   file, the unknown topic and the allowed topics.
5. **Given** a post with a feature image but no description of it, **When** the site is built,
   **Then** the build fails with a message asking for the description.
6. **Given** two post files that would produce the same address, or a post whose address
   clashes with a reserved blog address (`all` or `topics`), **When** the site is built,
   **Then** the build fails with a message naming both files or the clash.
7. **Given** Don marks a post as featured, **When** the site is built, **Then** it carries the
   "Featured" mark wherever it is shown and is eligible for the featured grid.
8. **Given** Don sets an update date earlier than the publication date, **When** the site is
   built, **Then** the build fails with a clear message.
9. **Given** a post file marked as a draft, **When** a preview (non-production) deployment,
   development or test build is made, **Then** the post is built and listed like a published
   post and its page shows a visible "Draft" notice.

---

### User Story 4 - Browse all posts and browse by topic (Priority: P2)

A reader who wants more than the landing page shows goes to all posts, newest first, a page at
a time, or opens a topic to see only its posts.

**Why this priority**: Older writing is only reachable through these listings once the landing
page fills up.

**Independent Test**: With more posts than fit on one listing page, open `/writing/all/`, move
through the pages, and open each topic page.

**Acceptance Scenarios**:

1. **Given** more published posts than fit on one page, **When** a reader opens
   `/writing/all/`, **Then** they see the first 12 posts newest first as cards, with links to
   the next page and to numbered pages.
2. **Given** page N of the listing, **When** it is shown at `/writing/all/{n}/`, **Then** it
   shows the Nth set of posts, with links to the previous and next pages where they exist,
   and the current page identified to assistive technology.
3. **Given** a topic, **When** a reader opens `/writing/topics/{topic}/`, **Then** they see an
   introduction banner in the topic's colour with its name and a short description, followed
   by that topic's published posts, newest first.
4. **Given** a topic with more posts than fit on one page, **When** its page is shown, **Then**
   its posts are split into pages the same way as the all posts listing.
5. **Given** a topic with no published posts, **When** a reader opens its page, **Then** the
   page says in plain language that there are no posts on this topic yet and links to all
   posts.
6. **Given** any card, **When** a reader activates a topic pill on it, **Then** they arrive at
   that topic's page.

---

### User Story 5 - Share a post and continue reading (Priority: P2)

At the end of a post a reader can share it and move on to related posts.

**Why this priority**: Sharing and related posts extend a reading session and spread Don's
writing, but the blog works without them.

**Independent Test**: Open a post on a device with a system share feature and on one without,
with scripts on and off, and check the share options and related posts.

**Acceptance Scenarios**:

1. **Given** a reader on a device that offers a system share feature, with scripts enabled,
   **When** they activate "Share", **Then** the device's share sheet opens with the post's
   title and address.
2. **Given** a device without a system share feature, or scripts turned off, **When** the
   reader looks at the share area, **Then** they see plain share links (at least LinkedIn and
   email) that work without the system share feature.
3. **Given** a post that shares topics with other published posts, **When** the reader reaches
   the end, **Then** up to 3 related posts are shown as cards, most shared topics first, then
   newest first, never including the post itself or drafts.
4. **Given** a post with no other post sharing a topic, **When** the reader reaches the end,
   **Then** the related section shows the newest other posts instead, or is left out if there
   are none.

---

### User Story 6 - Subscribe with a feed reader (Priority: P2)

A reader adds the blog to their feed reader and gets new posts as they are published.

**Why this priority**: The only subscription route in scope (no newsletter).

**Independent Test**: Validate the feed and load it in a feed reader.

**Acceptance Scenarios**:

1. **Given** published posts, **When** a feed reader requests the blog's feed, **Then** it gets
   a valid feed listing every published post, newest first, with title, full address,
   publication date and summary.
2. **Given** any blog page, **When** a feed reader or browser looks for a feed, **Then** the
   page advertises the feed's address, and the Writing landing page shows a visible
   "Subscribe (RSS)" link.
3. **Given** a draft post, **When** the feed is built, **Then** the draft is not in it.

---

### User Story 7 - Recent writing on the home page (Priority: P3)

A visitor to the home page sees a short "Recent writing" section with the newest posts and a
link to the Writing section.

**Why this priority**: It connects the home page to the blog, but the blog stands on its own.

**Independent Test**: Build with published posts and check the home page section; build with
no published posts and check it is left out.

**Acceptance Scenarios**:

1. **Given** published posts, **When** a visitor opens the home page, **Then** a "Recent
   writing" section shows the 3 newest published posts as the blog's post cards (feature image
   or fallback graphic, title, date, reading time, topic pills and summary), 3 across on wide
   screens, each linking to its post, and a link to `/writing/`.
2. **Given** no published posts, **When** the home page is shown, **Then** the "Recent
   writing" section is left out entirely.

---

### Edge Cases

- **No published posts at all**: the Writing landing page and the all posts listing show a
  plain-language message that there are no posts yet, the feed is valid and empty, and the
  home page section is left out.
- **Exactly one published post**: it is the lead story; the featured and latest grids are
  left out.
- **Only featured posts**: the featured grid shows up to 3; the latest grid shows whatever
  remains, and is left out if nothing remains.
- **Post dated in the future**: treated as published and shown with the date as written (no
  scheduling); Don uses the draft mark to hold a post back.
- **Two posts with the same publication date**: ordered by title so the order is stable from
  build to build.
- **Post without a feature image**: the card and post page show the topic-coloured fallback
  graphic, not an empty box.
- **Very long title or unbroken word or address**: wraps without the page scrolling sideways.
- **Very short post**: reading time is shown as at least 1 minute.
- **Code sample without a language**: shown as plain, unhighlighted text in the same box, still
  with the copy button.
- **Copy fails** (clipboard unavailable or refused): the button says in words that copying did
  not work; the code stays selectable.
- **Page number beyond the last page** (for example `/writing/all/99/`): the site's not-found
  page.
- **`/writing/all/1/`**: not a page; page 1 of the listing is `/writing/all/`.
- **A topic removed from the list while posts still name it**: the build fails, naming the
  posts, the same as a typo.

## Requirements *(mandatory)*

### Functional Requirements

**Addresses and navigation**

- **FR-001**: The blog MUST use Direction A's addresses: Writing landing page `/writing/`; all
  posts `/writing/all/`; page N (N ≥ 2) of all posts `/writing/all/{n}/`; topic page
  `/writing/topics/{topic}/` (page N ≥ 2: `/writing/topics/{topic}/{n}/`); post
  `/writing/{slug}/`.
- **FR-002**: A post's address MUST come from its file name (the slug) and MUST NOT contain its
  topic or date, so changing a post's topics or dates never changes its address.
- **FR-003**: The slugs `all` and `topics` MUST be reserved; a post that would take a reserved
  address, or two posts that would share one, MUST fail the build with a clear message.
- **FR-004**: The existing "Writing" entry in the site navigation MUST lead to `/writing/` and
  be marked as current on every blog page.
- **FR-005**: No redirects from the old site's post, category or topic addresses are added.

**Writing landing page**

- **FR-006**: The landing page MUST show the section name "Drift & Convergence" and the
  heading "Writing", then the newest published post as a lead story with its title, summary,
  publication date, reading time and topic pills. The lead story MUST show the post's feature
  image when it has one; without one it MUST be a text-only card bordered in the post's main
  topic colour, with no fallback graphic.
- **FR-007**: Beneath the lead story the landing page MUST show a row of topic pills, one per
  topic in the controlled list, each linking to its topic page, plus a link to all posts.
- **FR-008**: The landing page MUST show a "Featured" grid of up to 3 published featured posts,
  most recently published first, excluding the lead story; the grid and its heading MUST be
  left out when there are none. The bento layout MUST suit 1, 2 or 3 cards; the prototype's
  full-width fourth card is not used.
- **FR-009**: The landing page MUST show a "Latest" grid of up to 6 of the newest published
  posts not already shown on the page, and a link to all posts.
- **FR-010**: The landing page MUST show a visible link to the feed.

**Cards and listings**

- **FR-011**: Every post card MUST show the post's feature image (or fallback graphic), title,
  publication date, reading time, topic pills and summary, and a "Featured" mark when the post
  is featured. The title MUST link to the post; each topic pill MUST link to its topic page.
- **FR-012**: The all posts listing MUST show every published post, newest first, 12 per page,
  with previous, next and numbered page links; the current page MUST be identified to
  assistive technology.
- **FR-013**: Each topic MUST have a page that opens with an introduction banner in the topic's
  colour (its name and a short description) followed by that topic's published posts, newest
  first, paged the same way as the all posts listing.
- **FR-014**: Listings with no posts MUST show a plain-language "no posts yet" message instead
  of an empty grid.
- **FR-015**: Posts with the same publication date MUST be ordered by title, so every listing's
  order is stable between builds.

**Topics**

- **FR-016**: Topics MUST come from one controlled list, kept in one place, that starts with:
  High-compliance data and integration; High-performing technology teams; Agentic AI in legacy
  environments; Healthcare technology leadership. Each topic has a name, a short address-safe
  identifier, a short description and a colour from the existing palette.
- **FR-017**: Each topic's colour MUST be distinct from every other topic's, and every topic
  pill and banner MUST meet WCAG 2.2 AA text contrast in both themes.
- **FR-018**: A post MUST have at least one topic; every topic it names MUST be in the
  controlled list, or the build fails naming the file, the unknown topic and the allowed ones.

**Post page**

- **FR-019**: The post page MUST show the feature image (or fallback graphic), then a title
  card with the section name, title, summary, "Featured" mark when featured, publication date,
  reading time and topic pills, followed by the body.
- **FR-020**: When a post is marked as updated, the post page MUST show the update date next to
  the publication date, labelled as an update (for example "Updated September 30, 2026"), and
  the page metadata and feed MUST carry the update date.
- **FR-021**: Reading time MUST be worked out when the site is built from the length of the
  post's text, shown in whole minutes, at least 1.
- **FR-022**: The body MUST use the site's existing reading typography and heading colours in
  both themes.
- **FR-023**: Authors MUST be able to place images in a post with a caption and a text
  description, at normal, wide or full width, with the same wide and full-width behaviour as
  the site's other pages; wide and full images MUST never cause sideways page scrolling.
- **FR-024**: Code samples MUST be shown in a box with syntax colours matched to the site's
  palette in both themes (readable at WCAG 2.2 AA contrast), keeping line breaks and
  indentation, scrolling sideways inside the box when long, with an optional caption.
- **FR-025**: Each code sample MUST have a copy button that copies the code exactly and
  announces success or failure in words. The copy button MUST be the only script the post body
  needs; without scripts the button is not shown and the code remains readable and selectable.
- **FR-026**: Tables MUST scroll sideways within their own area on narrow screens, with no
  script needed, and remain exposed to assistive technology as tables.
- **FR-027**: Every published post MUST show the standard "views are my own" note, whose
  wording is kept in one place so a change to it changes every post.
- **FR-028**: Each post MUST offer sharing: the device's own share feature where available
  (with the post's title and address), and plain share links (at least LinkedIn and email)
  otherwise, so sharing works without scripts through the plain links.
- **FR-029**: The end of each post MUST show up to 3 related published posts as cards, chosen
  by most shared topics, then newest; when none share a topic, the newest other posts are
  shown; the section is left out when there are no other posts.
- **FR-030**: Each post page MUST carry page metadata for search engines and link previews
  (title, summary, address, publication and update dates, and the feature image with its
  description when present).

**Authoring**

- **FR-031**: Don MUST be able to publish a post by adding one text file to the repository,
  with settings at the top (title, summary, publication date, topics, and optionally a feature
  image with description, featured mark, update date and draft mark) and the body below.
- **FR-032**: Posts marked as drafts MUST NOT appear anywhere on the production site: no page,
  listing, topic page, related list, home page section, feed entry or sitemap entry. On
  preview (non-production) deployments and in development and test builds, drafts MUST be
  built and listed like published posts, and each draft's post page MUST show a visible
  "Draft" notice.
- **FR-033**: A post missing required information (title, summary, publication date, at least
  one topic, or a description for the feature image or a body image) or with invalid values
  (an unknown topic, an update date before the publication date, an unreadable date) MUST fail
  the build with a message naming the file and the problem in plain language.
- **FR-034**: An authoring guide for posts MUST explain every setting, the topic list and how
  to add a topic, image widths and captions, code samples, the draft and featured marks, the
  update date, and the build errors Don may see.
- **FR-035**: The feature MUST include three or four sample posts, each marked as a draft and
  clearly labelled as a sample, together covering every kind of body content (captioned, wide
  and full-width images, code with and without a caption, a wide table, all heading levels) and
  at least one featured post and one post without a feature image, so the pages can be tested
  and checked on the preview deployment without being published on the live site.

**Feed**

- **FR-036**: The blog MUST publish a feed that feed readers accept, listing every published
  post newest first with title, full address, publication date and summary, and excluding
  drafts.
- **FR-037**: Every blog page MUST advertise the feed's address so browsers and feed readers
  can find it.

**Home page**

- **FR-038**: The home page MUST show a "Recent writing" section with the 3 newest published
  posts, shown with the blog's post card (FR-011) in a grid of 3 across on wide screens, and a
  link to `/writing/`, and MUST leave the section out when there are no published posts.

**Quality**

- **FR-039**: Every blog page MUST be prerendered, readable with scripts turned off, meet
  WCAG 2.2 AA in both themes at phone and desktop widths, and never scroll sideways at 320 px
  wide.
- **FR-040**: Blog pages MUST use only the colours and fonts already in the site's design
  system, and MUST match Direction A in both themes.
- **FR-041**: Blog pages MUST stay within the site's existing performance budget.

### Key Entities

- **Post**: one piece of writing. Title, summary, publication date, optional update date, one
  or more topics, optional feature image with description, featured mark, draft mark, body,
  and a slug from its file name. Derived: address, reading time, related posts.
- **Topic**: an entry in the controlled list. Name, identifier used in its address, short
  description, colour. A topic has many posts; a post has one or more topics, the first being
  its main topic.
- **"Views are my own" note**: one shared piece of text shown on every post.
- **Feed**: the list of published posts for feed readers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the home page, a reader reaches the newest post in 2 selections or fewer
  (through "Recent writing", or "Writing" then the lead story).
- **SC-002**: Don publishes a new post by adding exactly 1 file (plus any images it uses), with
  no other file edited.
- **SC-003**: 100% of the invalid post cases listed in FR-003 and FR-033 fail the build with a
  message that names the file and the problem.
- **SC-004**: 0 draft posts appear in any page, listing, feed or sitemap of the production
  build, and 100% of draft posts appear, marked "Draft", on the preview deployment.
- **SC-005**: Every blog page template passes automated accessibility checks with no WCAG 2.2
  AA violations in both themes, at phone and desktop widths.
- **SC-006**: No blog page scrolls sideways at 320 px wide, including a post with a wide table,
  a long code line and wide and full-width images.
- **SC-007**: Every blog page is fully readable with scripts turned off.
- **SC-008**: The feed passes a standard feed validator with no errors.
- **SC-009**: Blog pages meet Core Web Vitals "good" thresholds on mobile and the site's
  performance budget in CI.
- **SC-010**: On the preview deployment, Don confirms the landing page, listings, topic pages
  and post page match Direction A in both themes.

## Assumptions

- Direction A in `docs/design/blog.md` is the visual reference; its pictures are the record.
  Details they do not show (pagination controls, empty states, share area, related posts,
  "views are my own" note, update date, "Recent writing" section) follow the same card, pill
  and typography style.
- "Drift & Convergence" is the section name shown on blog pages; the navigation label stays
  "Writing".
- The counts (12 per listing page, up to 3 featured, up to 6 latest, 3 on the home page, up to
  3 related) are defaults that planning may tune without changing the design.
- The first topic a post names is its main topic, used for the fallback graphic's colour.
- Share links cover LinkedIn and email, matching the site's existing social presence; other
  networks can be added later.
- The "views are my own" wording is plain placeholder copy until Don supplies his own;
  changing it later is a one-place edit.
- "Production build" means the build deployed to the live site; how a build knows it is
  production or preview is settled in planning.
- Posts use the same image and section conventions already set up for the site's pages.
- Sample posts are drafts, so they appear in development and test builds and on preview
  deployments (marked "Draft") but never on the live site.

### Dependencies and parallel work

- The site foundation (layout, navigation, themes, reading typography, wide and full image
  rules, security headers) and the page structure from feature 003 are in place.
- The portfolio build and the contact form run at the same time in their own branches. Files
  likely to be touched by more than one of them (the site navigation, the shared content
  collection definitions and the Home page) are called out in the plan, which says how
  conflicts are handled; the branch is rebased onto `main` before the pull request opens.
- This is a **major change** under Constitution Principle III (it changes navigation and the
  Home page, and adds an integration), so the pull request is labelled and waits for Don's
  approval after he checks the preview deployment.

## Out of Scope (follow-up work)

- Comments.
- Newsletter or email subscription.
- Search.
- AI analysis of posts (the Flux post-analysis feature).
- Migrating existing posts from the current site (Don will do this himself).
- Redirects from the old site's `/drift/`, `/convergence/`, `/news/` and `/topic/` addresses.
- Scheduled publishing (posts appearing automatically on a future date).
- Separate feeds per topic.
- Self-hosting the real Ghost fonts (existing foundation follow-up).

## Technical direction (for planning)

Not requirements; guidance from the feature description for `/speckit-plan`:

- Read `docs/design-source.md` and `docs/design/blog.md` first; `.reference/flux` is available.
- Posts as a content collection with a schema; topics as a controlled list so typos fail the
  build; static paths and Astro's built-in pagination for listings.
- Port from Flux: `partials/ui-share.hbs` (Web Share API with plain links fallback);
  `kg-code-card` and the Prism styles in `assets/css/screen.css`, re-created with Astro's
  built-in Shiki highlighting (light and dark themes matched to the palette) and a code block
  component with caption and copy button, the copy button being the only script, loaded as a
  small island; `assets/js/table-wrapper.js`, replaced by CSS or a build-time Markdown plugin.
- `docs/design/blog.md` notes that Astro's built-in highlighter's inline styles conflict with
  the site's content security policy; the plan must resolve this (see research R8 referenced in
  `docs/design-source.md`).
- Reading time calculated at build time; the official RSS integration for the feed.
- The "Recent writing" section edits the Home page; navigation, content config and Home are
  shared with the parallel portfolio build.
- Follow the content structure in `docs/design-source.md` (`src/content/posts/`, a post schema
  beside `page.ts`, `src/components/post/`, a `PostLayout`, `src/pages/writing/`, the
  `src/lib/content/` checks, and a posts guide beside `docs/pages.md`).
