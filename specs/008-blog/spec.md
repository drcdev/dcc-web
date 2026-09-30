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
- **Post page**: a large feature image (when the post has one) with the title card
  overlapping it, carrying the section name, title, summary, a "Featured" mark when featured, date, reading time and topic
  pills; then the body in the site's reading column.
- **Topics** appear as colour-coded pills on every card; each topic keeps a distinct colour.
- **Posts without a feature image** appear as text-only cards bordered in their main topic's
  colour, as in the Direction A pictures; there is no fallback graphic anywhere.
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
- Q: What does a post without a feature image look like? → A: Superseded by Don's answer
  below: a text-only card bordered in its main topic's colour, and no fallback graphic. A
  feature image is optional.
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
  blog's own post card (feature image when present, title, date, reading time, topic pills,
  summary, "Featured" mark) in a grid of 3 across on wide screens.
- Q: How should a post with no feature image look on cards and on its own page? → A:
  Text-only everywhere. Every card without an image (Featured, Latest, listings, topic pages,
  related posts, home "Recent writing") is a text-only card bordered in its main topic's
  colour, as in the Direction A pictures; the post page opens straight with the title card and
  no hero image. The fallback graphic is dropped entirely.
- Q: Should the all posts listing and the topic pages also show the topic pill row? → A: The
  landing page and the all posts listing only. Topic pages rely on their introduction banner
  and the pills on each card.

Resolved during the requirements-quality checklist review (no interview possible; consistent
with the answers above and the constitution):

- Q: Can an author mark an image as decorative with an empty description? → A: No. Every
  image an author places in a post (feature image or body image) carries meaning and needs a
  non-empty description; an empty one fails the build. Decoration on blog pages comes only
  from the design itself (borders, colours), never from author-supplied images, so there is no
  decorative-image case to exempt.
- Q: Should draft pages on preview deployments be kept out of search engines? → A: Yes. Every
  draft post page carries a "do not index" instruction on every build, in addition to the
  site-wide "do not index" that preview deployments already send.
- Q: What happens when a build cannot tell whether it is production? → A: It leaves drafts
  out. Drafts are included only when the build is positively identified as non-production.
- Q: Must the site's content security policy stay as it is? → A: Yes; it is a requirement
  (FR-053), not only a planning constraint.
- Q: How does a draft look on a card? → A: On non-production builds a draft's card carries a
  text "Draft" label beside the "Featured" mark position, in the same style as the post page's
  Draft notice.

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
   the feature image (when it has one), the section name, title, summary, publication
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
   post, each of its cards shows a "Draft" label, and its page shows a visible "Draft" notice
   and tells search engines not to index it.

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
   `/writing/all/`, **Then** they see the row of topic pills with its "All posts" link, then
   the first 12 posts newest first as cards, with links to the next page and to numbered pages.
2. **Given** page N of the listing, **When** it is shown at `/writing/all/{n}/`, **Then** it
   shows the Nth set of posts, with links to the previous and next pages where they exist,
   and the current page identified to assistive technology.
3. **Given** a topic, **When** a reader opens `/writing/topics/{topic}/`, **Then** they see an
   introduction banner in the topic's colour with its name and a short description, followed
   by that topic's published posts, newest first; the topic pill row is not shown there.
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
2. **Given** any device, with scripts on or off, **When** the reader looks at the share area,
   **Then** they see plain share links (at least LinkedIn and email) that work without the
   system share feature; without scripts or without a system share feature there is no
   "Share" button.
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
   when present, otherwise a text-only card bordered in the main topic's colour, title, date, reading time, topic pills and summary), 3 across on wide
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
  scheduling), including in the feed and the sitemap; Don uses the draft mark to hold a post
  back.
- **Two posts with the same publication date**: ordered by title so the order is stable from
  build to build (FR-015).
- **Post without a feature image**: every card for it is a text-only card bordered in its main
  topic's colour (no empty image box, no fallback graphic), and its post page opens with the
  title card and no hero image.
- **Very long title or unbroken word or address**: wraps, breaking inside the word where
  needed, with all of its text visible (never cut off, faded out or hidden behind an ellipsis)
  and without the page scrolling sideways at 320 px.
- **Very short post**: reading time is shown as at least 1 minute.
- **Code sample without a language, or naming a language the highlighter does not know**:
  shown as plain, unhighlighted text in the same box, still with the copy button and caption;
  the build does not fail.
- **An image fails to load**: its description is available in its place and the card or page
  layout does not collapse or scroll sideways.
- **Copy fails** (clipboard unavailable or refused): the button says in words that copying did
  not work; the code stays selectable.
- **Page number beyond the last page** (for example `/writing/all/99/`): the site's not-found
  page.
- **`/writing/all/1/` and `/writing/topics/{topic}/1/`**: not pages (the site's not-found
  page); page 1 of each listing is its bare address, `/writing/all/` or
  `/writing/topics/{topic}/`.
- **A topic removed from the list while posts still name it**: the build fails, naming the
  posts, the same as a typo.

## Requirements *(mandatory)*

### Functional Requirements

**Addresses and navigation**

- **FR-001**: The blog MUST use Direction A's addresses: Writing landing page `/writing/`; all
  posts `/writing/all/`; page N (N ≥ 2) of all posts `/writing/all/{n}/`; topic page
  `/writing/topics/{topic}/` (page N ≥ 2: `/writing/topics/{topic}/{n}/`); post
  `/writing/{slug}/`; feed `/writing/rss.xml`. Every blog page address is lower-case and ends
  with a slash, following the site's existing address rules; the feed is the only blog address
  without a trailing slash.
- **FR-002**: A post's address MUST come from its file name (the slug: the file name without
  its `.mdx` extension, unchanged) and MUST NOT contain its topic or date, so changing a post's
  topics or dates never changes its address. Renaming a post file changes its address; the old
  address then shows the site's not-found page, and no redirect is added (FR-005), so the
  authoring guide warns against renaming a post once it is published.
- **FR-003**: The slugs `all` and `topics` MUST be reserved; a post that would take a reserved
  address, or two posts that would share one, MUST fail the build with a clear message. No
  other slug can clash with a blog address: page numbers only occur under `all/` and
  `topics/{topic}/`, so a numeric slug such as `2024` is allowed, and a slug cannot contain a
  dot, so it cannot clash with `rss.xml`.
- **FR-004**: The existing "Writing" entry in the site navigation MUST lead to `/writing/` and
  be marked as current on every blog page, both visually and as a current state that assistive
  technology announces (not by colour alone): "current page" on `/writing/` itself and
  "current item" on every other blog page.
- **FR-005**: No redirects from the old site's post, category or topic addresses are added.

**Writing landing page**

- **FR-006**: The landing page MUST show the section name "Drift & Convergence" and the
  heading "Writing", then the newest published post as a lead story with its title, summary,
  publication date, reading time and topic pills. The lead story MUST show the post's feature
  image when it has one; without one it MUST be a text-only card bordered in the post's main
  topic colour, with no fallback graphic.
- **FR-007**: Beneath the lead story the landing page MUST show a row of topic pills, one per
  topic in the controlled list in list order (including topics with no published posts yet),
  each linking to its topic page, plus a link to all posts. The row is a navigation region
  labelled "Topics"; the "All posts" link comes last and is styled as a plain link, not as a
  topic pill, so it is not mistaken for a topic.
- **FR-008**: The landing page MUST show a "Featured" grid of up to 3 published featured posts,
  most recently published first, excluding the lead story; the grid and its heading MUST be
  left out when there are none. The bento layout MUST suit 1, 2 or 3 cards; the prototype's
  full-width fourth card is not used.
- **FR-009**: The landing page MUST show a "Latest" grid of up to 6 of the newest published
  posts not already shown on the page, and a link to all posts.
- **FR-010**: The landing page MUST show a visible link to the feed whose visible text and
  accessible name are both "Subscribe (RSS)". This link is separate from the feed
  advertisement in every blog page's metadata (FR-037).

**Cards and listings**

- **FR-011**: Every post card MUST show the post's feature image when it has one, title,
  publication date, reading time, topic pills and summary, and a "Featured" mark when the post
  is featured. A card for a post without a feature image MUST be a text-only card bordered in
  the post's main topic colour, with no empty image area and no fallback graphic. The title
  MUST link to the post; each topic pill MUST link to its topic page. On a card:
  - the title link is the only link to the post, and its accessible name is the post title;
    the image is not a link and the card as a whole is not a link, so each card has exactly one
    link to its post plus one link per topic pill;
  - the image, when present, carries the feature image's description (FR-033);
  - the "Featured" mark is the visible word "Featured" (never an icon or colour alone);
  - the publication date is a machine-readable date whose visible text is the full date (for
    example "August 27, 2026"), and the reading time reads "{n} min read";
  - the topic pills form a list labelled "Topics";
  - the topic-colour border of a text-only card is decoration: the main topic is also named by
    the card's first topic pill, so the border is never the only way the topic is conveyed and
    needs no contrast ratio of its own;
  - on non-production builds a draft's card carries a visible text label "Draft", placed with
    the "Featured" mark and styled like the post page's Draft notice (FR-032).
- **FR-012**: The all posts listing MUST show the topic pill row described in FR-007 under its
  heading, then every published post, newest first, 12 per page,
  with previous, next and numbered page links; the current page MUST be identified to
  assistive technology. Pagination MUST:
  - be a navigation region labelled "Pages", left out entirely when there is only one page;
  - use the link text "Previous page" and "Next page"; "Previous page" is left out (not shown
    disabled) on the first page and "Next page" on the last;
  - show a link for every page number, with the visible text of the number and the accessible
    name "Page {n}"; the list wraps onto more lines rather than scrolling sideways, and no page
    numbers are hidden (truncating long ranges is follow-up work once there are more than about
    10 pages);
  - link page 1 to the listing's bare address (`/writing/all/` or `/writing/topics/{topic}/`),
    never to `…/1/`;
  - show the current page as plain text, not a link, carrying a "current page" state that
    assistive technology announces;
  - count pages from the posts visible in that build only, so on the production build drafts
    add no pages and page numbers past the last visible page are not built.
- **FR-013**: Each topic MUST have a page that opens with an introduction banner in the topic's
  colour (its name and a short description) followed by that topic's published posts, newest
  first, paged the same way as the all posts listing. Topic pages do not show the topic pill
  row.
- **FR-014**: Listings with no posts MUST show a plain-language "no posts yet" message instead
  of an empty grid. An empty page keeps its page title, its `h1`, its landmarks and (on the
  landing and all posts pages) the topic pill row; only the grid is replaced.
- **FR-015**: Posts with the same publication date MUST be ordered by title in alphabetical
  order (English collation, ignoring case), and posts whose titles are also equal by slug, so
  every listing's order is identical between builds. The same order applies to every listing,
  the Featured grid, the Latest grid, related posts, the home page section and the feed.

**Topics**

- **FR-016**: Topics MUST come from one controlled list, kept in one site configuration file
  (never in post files). Each topic has a name (shown on pills and the banner), an identifier
  (used in its address and in post files), a one- or two-sentence description (shown on its
  banner) and a colour (one of the site's existing named palettes). The list starts with:

  | Name | Identifier | Colour palette |
  |---|---|---|
  | High-compliance data and integration | `compliant-data` | rust |
  | High-performing technology teams | `technology-teams` | sage |
  | Agentic AI in legacy environments | `agentic-ai` | lavender |
  | Healthcare technology leadership | `healthcare-leadership` | mist |

  Identifiers use only lower-case letters, digits and hyphens, are unique, and at most 40
  characters. Because an identifier forms a public address, it is kept once any post uses it.
- **FR-017**: Each topic's colour MUST be a different named palette from every other topic's
  (so no two topics share a colour, in either theme). Every topic pill, topic banner, the
  "Featured" mark and the "Draft" label and notice MUST give their text a contrast of at least
  4.5:1 against its background (3:1 for large text), measured separately in the light and dark
  themes by the automated accessibility checks run on every template in each theme (SC-005),
  with any pair they cannot measure (such as text over an image) checked by computing the
  ratio of the two palette colours.
- **FR-018**: A post MUST have at least one topic; every topic it names MUST be in the
  controlled list, or the build fails naming the file, the unknown topic and the allowed
  identifiers in list order. Naming the same topic twice in one post fails the build. There
  is no maximum number of topics per post; pills wrap onto more lines on cards and the title
  card and never cause sideways scrolling.
- **FR-042**: Topics are maintained as follows, and the authoring guide explains each step:
  - adding a topic is one new entry in the topic list (with an unused palette); its page and
    pill appear on the next build even before any post names it;
  - renaming a topic's name changes only its label; its address stays the same;
  - changing a topic's identifier changes its page address with no redirect, and fails the
    build until every post naming the old identifier is updated;
  - removing a topic fails the build while any post still names it (naming those posts); once
    none does, its page, pill and sitemap entry disappear.
  A topic with no published posts keeps its pill in the pill row, its topic page (with the
  "no posts on this topic yet" message) and its sitemap entry on every build.

**Post page**

- **FR-019**: The post page MUST show the feature image when the post has one (without one, the
  page opens directly with the title card and no hero image or fallback graphic), then a title
  card with the section name, title, summary, "Featured" mark when featured, publication date,
  reading time and topic pills, followed by the body. The feature image is informative: it
  carries the post's feature image description as its text alternative. The title card's
  overlap with the image is visual only: in reading and focus order the image comes first,
  then the title card, then the body. The title card's text is never clipped or hidden behind
  the image at 200% zoom, at 320 px wide, or with increased text spacing (WCAG 1.4.12); when
  space runs short the card grows and moves down instead of overlapping further.
- **FR-020**: When a post is marked as updated, the post page MUST show the update date next to
  the publication date, labelled as an update (for example "Updated September 30, 2026"), and
  the page metadata and feed MUST carry the update date.
- **FR-021**: Reading time MUST be worked out when the site is built from the length of the
  post's text, shown in whole minutes, at least 1: the number of words in the body's readable
  text (runs of characters between spaces, counting the text of headings, paragraphs, lists,
  captions, tables and code samples, and not counting the settings or any markup) divided by
  225 words a minute and rounded up.
- **FR-022**: The body MUST use the site's existing reading typography and heading colours in
  both themes.
- **FR-023**: Authors MUST be able to place images in a post with a caption and a text
  description, at normal, wide or full width, with the same wide and full-width behaviour as
  the site's other pages; wide and full images MUST never cause sideways page scrolling.
  Authors use the same image sections and attributes as the site's pages (`Figure`,
  `WideImage`, `FullImage`, each with the image written as `![description](./images/file)`
  and an optional `caption`), and the authoring guide shows one example of each. Every
  captioned image is presented as a figure whose caption is programmatically associated with
  it, at every width.
- **FR-024**: Code samples MUST be shown in a box with syntax colours matched to the site's
  palette in both themes, keeping line breaks and indentation, scrolling sideways inside the
  box when long, with an optional caption. Every syntax colour (and the plain text colour) MUST
  have a contrast of at least 4.5:1 against the code box background, measured separately in
  the light and dark themes. A code box that scrolls MUST be reachable and scrollable with the
  keyboard (it takes focus and shows the site's focus indicator). A caption is presented as the
  caption of the figure that holds the code, so it is associated with the code for assistive
  technology.
- **FR-025**: Each code sample MUST have a copy button that copies the code exactly and
  announces success or failure in words. The copy button MUST be the only script the post body
  needs; without scripts the button is not shown and the code remains readable and selectable.
  The button:
  - has the visible text and accessible name "Copy code"; when the sample has a caption its
    accessible name is "Copy code: {caption}", so several buttons on one page can be told
    apart;
  - after activation, announces through a polite live region and shows as its text either
    "Copied" or "Copy failed. Select the code to copy it.", then returns to "Copy code" after
    2 seconds;
  - keeps keyboard focus on itself after activation.
- **FR-026**: Tables MUST scroll sideways within their own area on narrow screens, with no
  script needed, and remain exposed to assistive technology as tables (an automated check
  finds a table with its header cells inside the region). The scrolling area is a
  keyboard-focusable region named "Table" that shows the site's focus indicator. Tables are
  written as Markdown tables, whose required first row becomes the column header cells; no
  table caption is required, and the authoring guide asks authors to introduce each table in
  the text before it.
- **FR-027**: Every published post MUST show the standard "views are my own" note, whose
  wording is kept in one place so a change to it changes every post. The note is ordinary
  visible text after the body: not an alert, live region or visually hidden element.
- **FR-028**: Each post MUST offer sharing: the device's own share feature where available
  (with the post's title and address), and plain share links (at least LinkedIn and email)
  in every case, so sharing works without scripts through the plain links. The share area:
  - has the heading "Share this post";
  - always shows the plain links, as links, with visible text that says where each goes:
    "Share on LinkedIn" and "Share by email";
  - adds a "Share" button (a button, not a link) at the end of the same row only when a script
    finds the device's share feature; because it is added after the links, its appearance
    moves no other content and nothing is announced twice;
  - puts only the post's title and full address in any share link or share sheet, with no
    tracking or campaign parameters.
- **FR-029**: The end of each post MUST show up to 3 related published posts as cards, chosen
  by most shared topics, then newest; when none share a topic, the newest other posts are
  shown; the section is left out when there are no other posts. The section has the heading
  "Related posts" and its cards form a list, like every card grid (FR-044).
- **FR-030**: Each post page MUST carry page metadata for search engines and link previews
  (title, summary, address, publication and update dates, and the feature image with its
  description when present). The landing, all posts and topic pages MUST also carry a unique
  page title, a description (the blog's description on the landing and all posts pages; the
  topic's description on its page), their own canonical address and the site's default sharing
  image. Page N ≥ 2 of a listing is canonical to itself (not to page 1) and has "page N" in its
  title and description; listing pages are otherwise treated like any other page by search
  engines.

**Authoring**

- **FR-031**: Don MUST be able to publish a post by adding one text file to the repository,
  with settings at the top (title, summary, publication date, topics, and optionally a feature
  image with description, featured mark, update date and draft mark) and the body below. The
  settings are exactly these; any other or misspelled setting fails the build, naming it:

  | Setting | Required | Allowed values |
  |---|---|---|
  | `title` | yes | plain text, not empty or only spaces; no length limit (long titles wrap) |
  | `summary` | yes | plain text, not empty or only spaces; no length limit (the guide recommends one or two sentences) |
  | `date` | yes | a calendar date written `YYYY-MM-DD` (no time or time zone; shown as that calendar day everywhere) |
  | `updated` | no | a calendar date written `YYYY-MM-DD`, on or after `date` (the same day is allowed and shown as an update) |
  | `topics` | yes | a list of one or more topic identifiers from the controlled list, no repeats; the first is the main topic |
  | `featureImage` | no | `src` (an image file in the posts' images folder), `alt` (a non-empty description) and optional `caption` |
  | `featured` | no | `true` or `false` (default `false`) |
  | `draft` | no | `true` or `false` (default `false`) |

  A date is unreadable when it is not a real calendar date in the `YYYY-MM-DD` form (for
  example `next tuesday`, `2026-02-30` or `27/08/2026`). The data model and the post-file
  contract repeat this table and must match it.
- **FR-032**: Posts marked as drafts MUST NOT appear anywhere on the production site: no page,
  landing page lead story, Featured or Latest grid, listing, topic page, related list, home
  page section, feed entry or sitemap entry, and they add nothing to any page count. A post
  that is both a draft and featured is treated as a draft: it is absent from production. On
  preview (non-production) deployments and in development and test builds, drafts MUST be
  built and listed exactly like published posts (they can be the lead story, appear in the
  Featured and Latest grids, related posts, listings, topic pages and the home page section,
  and count towards pages), each draft's card MUST carry a "Draft" label (FR-011), and each
  draft's post page MUST show a visible Draft notice: text beginning with the word "Draft"
  (never colour alone), placed at the start of the title card so it is read before the title.
  The feed never contains drafts on any build (FR-036). The sitemap lists exactly the blog
  pages built in that build: on production that means no drafts; on non-production builds it
  includes draft pages, which are kept out of search engines by FR-045 and the site-wide "do
  not index" signal on previews.
- **FR-033**: A post missing required information (title, summary, publication date, at least
  one topic, or a description for the feature image or a body image) or with invalid values
  (an unknown topic, an update date before the publication date, an unreadable date) MUST fail
  the build with a message naming the file and the problem in plain language. Every post-file
  error message MUST contain at least the file name, the setting or part of the body at fault,
  and, where the allowed values are a list (topics, sections), that list. The messages for a
  missing feature image description and a missing body image description both use the words
  "alt text". The same failure MUST occur wherever the site is built: locally, in the CI
  checks and in the Cloudflare deploy build. There is no warning tier: every rule in this
  specification stops the build, and nothing else about a post (such as a long summary or a
  large image) is checked or reported. The build reports at least the first problem it finds;
  each problem is reported when it is the only one.
- **FR-034**: An authoring guide for posts MUST explain every setting (FR-031), file naming and
  addresses and the effect of renaming (FR-002, FR-043), the topic list and how to add, rename
  or remove a topic (FR-042), image widths, captions and descriptions with examples (FR-023),
  tables (FR-026), code samples with a language and a caption (FR-024), the draft and featured
  marks, the update date, that drafts are visible to anyone who has a preview address (so
  nothing confidential goes in a draft), and every build error Don may see (each row of the
  build-errors contract) with how to fix it.
- **FR-035**: The feature MUST include three or four sample posts, each marked as a draft and
  clearly labelled as a sample, together covering every kind of body content (captioned, wide
  and full-width images, code with and without a caption, a wide table, all heading levels) and
  at least one featured post and one post without a feature image, so the pages can be tested
  and checked on the preview deployment without being published on the live site. Each sample
  post's title begins with "Sample:" and its summary says it is a sample post used to check the
  blog's pages, so it cannot be mistaken for a real draft. The samples stay in the repository
  as drafts after real posts exist, because the blog's end-to-end and visual tests on
  non-production builds depend on them; changing or removing one requires the tests and visual
  baselines to be updated in the same change.
- **FR-043**: A post file MUST be an `.mdx` file placed directly in the posts folder (not in a
  sub-folder), and its file name (without `.mdx`) MUST use only lower-case letters, digits and
  hyphens. A `.md` file, a file in a sub-folder or a file name with other characters fails the
  build, naming the file and saying how to fix it.
- **FR-044**: A post body MUST follow these rules, or the build fails naming the file and the
  problem: headings use levels 2 to 6 only (the title is the page's only level-1 heading); the
  body is not empty; every image has a non-empty description; and only the site's existing
  sections (the same ones pages use) may be used as tags, with an unknown tag failing the build
  and the message listing the allowed sections. Every card grid on blog pages and the home page
  is a list of cards.
- **FR-045**: Draft post pages MUST tell search engines not to index them on every build,
  whatever the site-wide indexing setting. (Preview deployments already send a site-wide "do
  not index" signal; this keeps drafts out of search results even if that changes.)
- **FR-046**: Drafts MUST be included only when the build is positively identified as
  non-production. A build is production when it is the Cloudflare Workers Builds build of the
  `main` branch, which deploys the live site. Local builds, development servers, CI checks and
  test builds (which are not Workers Builds) and Workers Builds of any other named branch
  (preview deployments) are non-production. If a Workers Builds build cannot tell which branch
  it is building, it MUST treat itself as production and leave drafts out.

**Feed**

- **FR-036**: The blog MUST publish a feed at `/writing/rss.xml` that feed readers accept,
  listing every published post newest first (FR-015) with title, full absolute address (also
  used as the item's permanent identifier), publication date, the update date when the post
  has one, and summary, and excluding drafts on every build. Titles and summaries are escaped
  as plain text, so characters such as `&` and `<` in them never break the feed. With no
  published posts the feed is valid and has no items.
- **FR-037**: Every blog page MUST advertise the feed's address so browsers and feed readers
  can find it.

**Home page**

- **FR-038**: The home page MUST show a "Recent writing" section with the 3 newest published
  posts, shown with the blog's post card (FR-011) in a grid of 3 across on wide screens, and a
  link to `/writing/`, and MUST leave the section out when there are no published posts.

**Quality**

- **FR-039**: Every blog page MUST be prerendered, readable with scripts turned off, meet
  WCAG 2.2 AA, and never scroll sideways at 320 px wide (WCAG 1.4.10 reflow). "Meets WCAG 2.2
  AA" applies to each of these templates individually: the landing page (with posts and
  empty), the all posts listing (page 1, a page N ≥ 2 and empty), a topic page (with posts, a
  page N ≥ 2 and empty), a post page (with and without a feature image, and as a draft), and
  the home page with its "Recent writing" section. For each, it holds under every combination
  of: light and dark theme; phone and desktop width; scripts on and off; and the site menu
  open. The same conditions are used in SC-005 and in the plan.
- **FR-040**: Blog pages MUST use only the colours and fonts already in the site's design
  system, and MUST match Direction A in both themes.
- **FR-041**: Blog pages MUST stay within the site's existing performance budget, measured on
  simulated mobile for each template in FR-039: Largest Contentful Paint at most 2.5 s,
  Cumulative Layout Shift under 0.1, no long task over 200 ms, at most 10 KB of JavaScript and
  at most 100 KB transferred on initial load. The budget is measured on the richest sample post
  (with wide and full-width images, code and a table) and on a listing page showing a full 12
  cards with images; a failure is fixed with smaller or later-loading images, never a looser
  budget.
- **FR-047**: Every blog page MUST have exactly one level-1 heading and no skipped heading
  levels, in this structure:
  - landing: `h1` "Writing"; the lead story's title `h2`; `h2` "Featured" and "Latest" with
    their card titles as `h3`;
  - all posts and topic pages: `h1` "All posts" or the topic name; card titles as `h2`;
  - post page: `h1` the post title; body headings from `h2`; `h2` "Share this post" and
    "Related posts", with related card titles as `h3`;
  - home page: `h2` "Recent writing" with its card titles as `h3`.
- **FR-048**: Every blog page MUST use the site's existing landmarks (skip link, header,
  one main region, footer) and a unique page title that names the page: "Writing", "All
  posts", the topic name or the post title, with ", page N" added on listing pages N ≥ 2,
  followed by the site's usual title suffix.
- **FR-049**: Reading and focus order on every blog page MUST follow the visual order. Every
  link and button (cards, pills, pagination, the feed link, share and copy buttons) MUST show
  the site's existing visible focus indicator, with at least 3:1 contrast against its
  surroundings in both themes, and hover styles never be the only indication of a link. Every
  pill, pagination link, the share and copy buttons and the feed link MUST have a target at
  least 24 by 24 CSS pixels (or the spacing WCAG 2.5.8 allows).
- **FR-050**: Blog pages MUST add no animation beyond the site's existing short colour
  transitions on hover and focus, and those transitions MUST be turned off when the reader
  asks for reduced motion. The overlap of the title card on the feature image is static.
- **FR-051**: Blog pages MUST stay usable at 400% zoom (equivalent to 320 px wide) and in the
  operating system's forced-colours (high-contrast) mode: text, pills, the "Featured" mark,
  the "Draft" label and notice, focus indicators and the edges of cards and code boxes remain
  visible. If an image fails to load, its description is available in its place and the
  layout neither collapses nor scrolls sideways.
- **FR-052**: Images on blog pages MUST protect loading speed and layout stability: every
  image is served in the sizes the layout needs from the site's build-time image processing,
  with its width and height known in advance so nothing moves as it loads; the landing page's
  lead story image and a post's feature image load first with high priority; every other card,
  body, wide and full-width image loads lazily. Feature and body images are stored beside the
  posts in the posts' images folder, in any format the site's image processing accepts; a
  missing image file fails the build naming the post and the image path.
- **FR-053**: The blog MUST work under the site's existing content security policy, which MUST
  NOT change: no new allowed sources, no `'unsafe-inline'` and no other loosening, in either
  the build configuration's policy or the deployed headers. Any edit to either counts as a
  change. On every blog page, including a post with code samples, the browser reports no
  policy violations, and no highlighted code contains an inline `style` attribute (checked on
  the built pages and in the browser).
- **FR-054**: The only scripts a blog page adds to the site's existing ones (theme and menu)
  are the copy button (inside the post body) and the share button (after the body); no other
  blog page adds any script.

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
- **SC-002**: Don publishes a new post that uses existing topics by adding exactly 1 file (plus
  any images it uses), with no other file edited. Adding a new topic (FR-042) or changing the
  shared "views are my own" wording (FR-027) are separate one-place edits, not part of
  publishing a post.
- **SC-003**: 100% of the invalid post cases listed in FR-003 and FR-033 fail the build with a
  message that names the file and the problem.
- **SC-004**: 0 draft posts appear in any page, listing, feed or sitemap of the production
  build, and 100% of draft posts appear, marked "Draft", on the preview deployment.
- **SC-005**: Every blog page template listed in FR-039 passes automated accessibility checks
  with no WCAG 2.2 AA violations under every FR-039 condition (light and dark themes, phone and
  desktop widths, scripts on and off, menu open).
- **SC-006**: No blog page template listed in FR-039 scrolls sideways at 320 px wide (the
  page's scroll width never exceeds the viewport width), including a post with a wide table,
  a long code line, a very long title and wide and full-width images.
- **SC-007**: Every blog page is fully readable with scripts turned off.
- **SC-008**: The feed parses as well-formed RSS 2.0 in the automated build tests, and the W3C
  Feed Validation Service reports it as valid (no errors) when checked against the preview
  deployment.
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
- The first topic a post names is its main topic, used for the border colour of its text-only
  cards and lead story.
- Share links cover LinkedIn and email, matching the site's existing social presence; other
  networks can be added later.
- The "views are my own" wording is plain placeholder copy until Don supplies his own;
  changing it later is a one-place edit.
- "Production build" means the Cloudflare Workers Builds build of `main` that deploys the live
  site; every other build is non-production, and an undetectable Workers Builds branch counts
  as production (FR-046). A production build made anywhere else is not expected: the live site
  is only ever deployed by Workers Builds from `main`.
- Drafts on a preview deployment can be read by anyone who has its address. That is accepted
  because drafts are writing meant for publication; the authoring guide says not to put
  confidential material in a draft (FR-034), and draft pages are never indexed (FR-045).
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
- Shortening long lists of page numbers in pagination (FR-012 shows every number for now).
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
