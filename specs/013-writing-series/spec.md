# Feature Specification: Frame the Writing pages around Drift & Convergence

**Feature Branch**: `013-writing-series`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Rework the Writing pages to frame Drift & Convergence" (GitHub issue #24). Closes #24.

**Stacks on**: `012-content-cleanup` (PR #25, open), which adds the "About the writing" section to the About page. This branch starts from that branch's head.

## Context

The writing on the site is called **Drift & Convergence** and runs in two series:

- **Convergence**: systems leadership. How to create alignment, work through complexity and lead change when the path forward isn't clear.
- **Drift**: hands-on exploration of emerging technology. Trying new tools, building real projects and writing up what worked and what didn't.

Today only the About page explains this. A visitor who lands on `/writing/` sees a lead story, a row of topic pills, Featured and Latest, with no sign that the writing is organised into two series. The feed, the topic pages, the "all posts" listing, post pages and the home page's "Recent writing" section are just as unframed.

This feature makes the two series the organising idea of the Writing pages, while keeping everything the blog feature (spec 008) built.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A visitor understands the two series from the Writing landing (Priority: P1)

A visitor opens `/writing/`. Before the lead story, a short framing lead says what Drift & Convergence is and how Drift and Convergence differ, and gives a visible way into each series. The lead story, the topic pill row, Featured and Latest are all still there below it.

**Why this priority**: The landing is where most readers arrive, and it is the page the issue says does nothing to frame the series. Without this, the rest of the feature has no entry point.

**Independent Test**: Build the site, open `/writing/` and check that the framing lead describes each series in one or two sentences, that each series has a link to its page, and that the lead story, pill row, Featured and Latest still render as before.

**Acceptance Scenarios**:

1. **Given** the site is built with visible posts, **When** a visitor opens `/writing/`, **Then** a framing lead appears between the page heading and the lead story, naming Drift & Convergence and describing each series in plain language.
2. **Given** the landing page, **When** the visitor follows the way into Convergence, **Then** they reach the Convergence series page, which lists only posts tagged into Convergence.
3. **Given** the landing page, **When** the visitor follows the way into Drift, **Then** they reach the Drift series page, which lists only posts tagged into Drift.
4. **Given** a series with no visible posts, **When** a visitor opens the landing, **Then** the way into that series is still shown, and its series page shows the existing empty-listing message instead of an error.
5. **Given** the landing page with JavaScript turned off, **When** a visitor reads it, **Then** the framing lead and both series links are present and usable.

---

### User Story 2 - Don tags a post into a series (Priority: P1)

Don writes or edits a post and adds `drift` or `convergence` to its topics, the same way he names any other topic. The post then appears on that series' page and shows a series marker wherever its topics are shown. A post with neither tag builds and displays as it does today.

**Why this priority**: Series membership is the data the rest of the feature reads. It has to exist, and be easy to write by hand, before any visual treatment means anything.

**Independent Test**: Add `drift` to one post's topics, build, and check that the post appears on the Drift series page and not on the Convergence page. Remove it and check the post builds and renders exactly as before.

**Acceptance Scenarios**:

1. **Given** a post whose topics include `drift`, **When** the site builds, **Then** the post appears on the Drift series page.
2. **Given** a post whose topics include `convergence`, **When** the site builds, **Then** the post appears on the Convergence series page.
3. **Given** a post with neither series tag, **When** the site builds, **Then** the build succeeds with no warning about the missing series, and the post renders with today's presentation.
4. **Given** a post that misspells a series tag (for example `convergance`), **When** the site builds, **Then** the outcome follows FR-011 (free-form topics) rather than silently creating a third series.

---

### User Story 3 - Series tags look different from ordinary topics everywhere pills appear (Priority: P2)

Wherever a post's topic pills are shown (the landing, `/writing/all/`, topic pages, post headers, the home page's "Recent writing"), a Drift or Convergence tag looks different from an ordinary topic pill, so the series reads as the organising idea and other topics as detail.

**Why this priority**: This carries the framing beyond the landing page. It depends on Story 2 and is worth most once the landing is framed.

**Independent Test**: Open each page type listed above with a post tagged into a series and a post with no series tag. Check the series marker is visually distinct from ordinary pills without relying on colour alone, and that the untagged post looks unchanged.

**Acceptance Scenarios**:

1. **Given** a post tagged `convergence` and `healthcare-leadership`, **When** its card appears on the landing, `/writing/all/`, a topic page or the home page, **Then** the Convergence marker is visually distinct from the Healthcare pill and appears before it.
2. **Given** the same post, **When** a visitor opens the post, **Then** a series marker appears beside the topic pills in the post header and links to the series page.
3. **Given** a post with no series tag, **When** it appears on any of these pages, **Then** its pills look exactly as they did before this feature.
4. **Given** forced-colours mode, or a visitor who cannot tell colours apart, **When** they view a series marker, **Then** they can still tell it is a series and not an ordinary topic (by its label or shape, not colour alone).
5. **Given** any page with a series marker, **When** an automated accessibility check runs, **Then** it reports no WCAG 2.2 AA failures, and the marker's text meets 4.5:1 contrast in both light and dark themes.

---

### User Story 4 - Series pages introduce their series (Priority: P2)

A visitor who follows a way into a series reaches a page that says what the series is about (a shorter form of the description now on the About page), lists its posts, and points to the other series.

**Why this priority**: The series pages are where the landing's links go. They come from the existing topic page route, so the extra work is the introduction and any short address.

**Independent Test**: Open the Drift and Convergence series pages, check the banner describes the series, the list contains only that series' posts, and there is a link to the other series.

**Acceptance Scenarios**:

1. **Given** the Drift series page, **When** a visitor opens it, **Then** it shows a banner that names Drift, describes it in one or two sentences, and carries more than an ordinary topic banner does: a link to the other series and a link back to the Writing landing.
2. **Given** either series page, **When** a visitor reads the post list, **Then** it uses the same listing and pagination as other topic pages.
3. **Given** the series page addresses decided under FR-008, **When** a visitor opens a short address, **Then** they reach the series page.

---

### User Story 5 - The framing carries through to the feed, home page and About page (Priority: P3)

The feed's title and description name the two series. The home page's "Recent writing" section says the writing is Drift & Convergence and shows each post's series marker. The About page's "About the writing" section keeps a short introduction and links to the two series pages instead of describing them at length.

**Why this priority**: These are smaller copy and linking changes that complete the framing once the landing and series pages exist.

**Independent Test**: Read the built feed, the home page and the About page and check each names the series and links where stated.

**Acceptance Scenarios**:

1. **Given** the built feed, **When** a feed reader reads it, **Then** its title is "Drift & Convergence" and its description names both series in plain language.
2. **Given** the home page, **When** a visitor reaches "Recent writing", **Then** the section names Drift & Convergence, and each post card shows its series marker if it has one.
3. **Given** the About page, **When** a visitor reaches "About the writing", **Then** it introduces Drift & Convergence briefly, links to the Drift and Convergence series pages, and no longer carries a long paragraph describing each series.

---

### Edge Cases

- A post carries both `drift` and `convergence`: see FR-004.
- A post carries no series tag: valid, no build error, no empty marker slot and no visual gap where a marker would be.
- A series has no visible posts (for example, only drafts): its page renders the existing empty-listing message, and the landing still links to it.
- Production builds hide drafts: a draft tagged into a series must not appear on the series page, the landing or the feed.
- A series page has more posts than one listing page holds: it paginates like any other topic page.
- A post's only topics are free-form (FR-011): it still builds and renders, with no series marker and no coloured pill.
- The landing's topic pill row: the series have their own way in and are not repeated as two ordinary pills in that row (FR-006).
- Long series names or many topics wrap without horizontal scroll at phone width.

## Requirements *(mandatory)*

### Functional Requirements

**Series membership**

- **FR-001**: The site MUST recognise exactly two series, Drift (id `drift`) and Convergence (id `convergence`), as entries in the controlled topic list, each with a name and a short description, and marked as a series.
- **FR-002**: A post MUST join a series by listing the series id in its topics, the same way it names any other topic. No new post setting is added for series.
- **FR-003**: A post with neither series tag MUST be valid: the build succeeds and the post renders with today's presentation.
- **FR-004**: A post MAY belong to at most [NEEDS CLARIFICATION: may a post be tagged into both Drift and Convergence? Proposed default: no; the build fails with a plain message naming the post, so each post has at most one series marker] one series.
- **FR-005**: Existing posts that clearly fit a series MUST be tagged; posts that do not clearly fit stay untagged. Proposed tagging, for Don to confirm in review: Convergence for "The Systems Leadership Wayfinder" and "Starting something new"; Drift for "Building Focus Pocus" and "Self-contained development for Ghost themes". The sample post stays untagged.

**Writing landing**

- **FR-006**: `/writing/` MUST show a short framing lead between the page heading and the lead story that names Drift & Convergence and describes each series in one or two sentences, in Don's voice and plain language, with a visible link into each series page. The lead story, topic pill row, Featured, Latest and the "All posts" link MUST remain. The series MUST NOT also appear as ordinary pills in the topic pill row.
- **FR-007**: The landing's page description (used in search results and link previews) MUST name Drift & Convergence and both series.

**Series pages**

- **FR-008**: Each series MUST have a page at its topic address (`/writing/topics/drift/` and `/writing/topics/convergence/`). [NEEDS CLARIFICATION: should each series also get a short address such as `/writing/drift/` and `/writing/convergence/`, and if so does it redirect to the topic address or replace it? Proposed default: add the short addresses as redirects, so the topic route stays the only listing route. Note `/writing/{slug}/` is the post address, so a short alias must not collide with a post slug.]
- **FR-009**: A series page MUST open with a banner richer than an ordinary topic banner: the series name, its description, a link to the other series and a link back to the Writing landing.

**Series markers**

- **FR-010**: Wherever a post's topics are shown (landing lead story and cards, `/writing/all/`, topic and series pages, post headers, home "Recent writing", related posts), a series tag MUST render as a series marker that is distinct from ordinary topic pills by more than colour, appears before the other topics, and links to its series page. Posts without a series tag MUST look the same as before this feature.

**Free-form topics**

- **FR-011**: Posts MUST be able to carry topics beyond the controlled list. Controlled topics (the four existing topics and the two series) keep their visual treatment: colours, banners and, for series, the series marker. Any other topic is used for filtering and shows only a minor, neutral visual identifier. [NEEDS CLARIFICATION: how does a free-form topic filter? (A) each free-form topic gets its own listing page with a plain banner, but is left out of the landing pill row; (B) free-form topics show as plain, unlinked labels with no page; (C) free-form topics get pages and also appear in a secondary row on the landing. This also decides whether a misspelt controlled id such as `convergance` becomes a free-form topic or fails the build. Proposed default: (A), and the build fails when a free-form topic is within two letters of a controlled id, naming the likely intended id.]
- **FR-012**: A free-form topic MUST follow the existing topic id rules (lower-case letters, digits and hyphens, at most 40 characters, named once per post) so its address and label are stable.

**Feed, home and About**

- **FR-013**: The feed title MUST be "Drift & Convergence" and its description MUST name both series in plain language.
- **FR-014**: The home page "Recent writing" section MUST name Drift & Convergence and show each post's series marker.
- **FR-015**: The About page "About the writing" section MUST keep a short introduction to Drift & Convergence and link to both series pages, replacing the two long series paragraphs. The closing invitation to get in touch stays.

**Quality**

- **FR-016**: Every changed page MUST meet WCAG 2.2 AA, read fully with JavaScript turned off, ship no new client-side JavaScript, and stay within the existing performance budget.
- **FR-017**: All new copy MUST follow `VOICE.md` and the constitution's plain-language rule: no hype, no filler.
- **FR-018**: The visual baselines for every snapshotted page whose appearance changes (at least the Writing landing, `/writing/all/`, the topic page, the post page and the home page) MUST be refreshed for both macOS and Linux. Any visual change this spec does not predict is a regression to fix, not a baseline to refresh.

### Key Entities

- **Series**: one of two named groupings of posts, Drift and Convergence. Has an id, a name, a short description and an address. Held as a controlled topic marked as a series.
- **Controlled topic**: a topic from the site's maintained list. Has an id, a name, a description and a colour. Drives coloured pills, banners and topic pages.
- **Free-form topic**: a topic a post names that is not in the controlled list. Has only an id and a label derived from it. Used for filtering; shown with a neutral identifier.
- **Post**: unchanged, except that its topics may now include the two series ids and free-form topics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor to `/writing/` can name both series and reach either series page in one click, without scrolling past the lead story on a desktop-width screen.
- **SC-002**: Every post tagged into a series shows a series marker on every page type listed in FR-010, and no untagged post shows one.
- **SC-003**: Every post shown on a series page carries that series tag, and every visible post with that tag is listed there.
- **SC-004**: A post with no series tag, and a post with only free-form topics, both build with no errors.
- **SC-005**: Automated accessibility checks report zero WCAG 2.2 AA failures on the landing, both series pages, `/writing/all/`, a post page, the home page and the About page.
- **SC-006**: The performance budget check passes with no change to its thresholds.
- **SC-007**: The only visual baseline differences are on the pages named in FR-018, and each matches a change this spec describes.

## Assumptions

- The four existing controlled topics stay as they are. The two series are the only additions to the controlled list.
- Series markers use colours from the site's existing palettes (`sand`, `mauve` and `dusk` are unused by topics today); no new colours are added.
- A distinct series marker and a richer series banner may count as a change to the design system or visual identity, which would make this a major change under Constitution Principle III. This spec treats it as possibly major; the pre-PR merge decision settles it.
- The landing framing copy is a shortened form of the About page's existing series descriptions. Don can revise wording in review.
- A post still needs at least one topic; a series tag or a free-form topic counts.
- The feed keeps its address; only its title and description text change.
- This branch stacks on `012-content-cleanup`; if that PR changes the About section before merging, FR-015 applies to whatever text lands.

## Out of Scope

- Rewriting posts.
- Changing the four existing controlled topics.
- Forcing every post into a series.
- A separate series setting in the post format, or a new route family beyond the optional short addresses in FR-008.

## Follow-up

- If free-form topics grow numerous, a topics index page may earn its own feature.
