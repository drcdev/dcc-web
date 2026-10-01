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

## Clarifications

### Session 2026-09-30

- Q: How should a topic that is not on the controlled list (a free-form topic) work, and what should happen when a post misspells a controlled topic id such as `convergance`? → A: Each free-form topic gets its own plain listing page at `/writing/topics/{id}/` with a neutral pill and is left out of the landing pill row. The build fails when a free-form id is within two letters of a controlled id, and the error names the id it probably meant.
- Q: Can a single post be tagged into both Drift and Convergence? → A: No. The build fails with a plain message naming the post, so each post shows at most one series marker.
- Q: Should each series also get a short address (`/writing/drift/` and `/writing/convergence/`)? → A: Yes, and the short address is the canonical series page. `/writing/topics/drift/` and `/writing/topics/convergence/` redirect to it. The build fails if a post slug is ever `drift` or `convergence`.
- Q: Which of the existing posts should be tagged into a series? → A: As proposed. Convergence: "The Systems Leadership Wayfinder" and "Starting something new". Drift: "Building Focus Pocus" and "Self-contained development for Ghost themes". The sample post stays untagged.
- Q: Is this feature a major change under Constitution Principle III? → A: Yes (design system and visual identity, content model). Auto-merge stays off, and the tasks include a `[PREVIEW-CHECK]` task for Don to review the preview deployment before merge.

### Session 2026-10-01

- Q: How should a series marker look different from an ordinary topic pill, apart from colour? → A: By a label prefix. The marker is pill-shaped and reads "Series: Drift" or "Series: Convergence", in a heavier weight with a visible outline. The difference is in the text, so it holds in forced-colours mode and for screen readers.
- Q: Which colour should each series use, and which should a free-form topic pill use? → A: Use the flux design theme's colours (`.reference/flux`, the theme the site's palette was ported from). Flux assigns Drift to lavender and Convergence to sage, and the series markers and banners use those palettes. Flux colours other tags rust, but the site's free-form pills must be neutral and rust already belongs to a controlled topic, so free-form pills use flux's neutral dusk palette. Flux is the source of truth for these assignments, and no new colours are added.
- Q: On a text-only post card (no feature image), which topic should colour the card's border when the post is in a series? → A: The series colour. This is an intended visual change for tagged posts, and the FR-018 baseline refresh covers it.
- Q: How should a free-form topic's display label be made from its id? → A: Sentence case. Hyphens become spaces and the first letter is capitalised (`cloud-cost` → "Cloud cost").
- Q: How should the home page's "Recent writing" section name Drift & Convergence? → A: Keep the "Recent writing" heading and add one short line under it that names Drift & Convergence and links to both series pages.
- Q: Drift (lavender) and Convergence (sage) share their colours with the Agentic AI and Technology teams topics. What should the series colours be? → A: Recolour the two clashing topics. Drift keeps flux's `lavender` and Convergence keeps `sage`; Agentic AI moves to `mauve` and Technology teams moves to `sand`, the two flux palettes no topic used. Free-form topics stay `dusk`. Every controlled topic and series has a unique colour again.

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
4. **Given** a post that misspells a series tag (for example `convergance`), **When** the site builds, **Then** the build fails with a plain message naming the post and the likely intended id (`convergence`), rather than silently creating a third series or a free-form topic (FR-011).

---

### User Story 3 - Series tags look different from ordinary topics everywhere pills appear (Priority: P2)

Wherever a post's topic pills are shown (the landing, `/writing/all/`, topic pages, post headers, the home page's "Recent writing"), a Drift or Convergence tag looks different from an ordinary topic pill, so the series reads as the organising idea and other topics as detail.

**Why this priority**: This carries the framing beyond the landing page. It depends on Story 2 and is worth most once the landing is framed.

**Independent Test**: Open each page type listed above with a post tagged into a series and a post with no series tag. Check the series marker is visually distinct from ordinary pills without relying on colour alone, and that the untagged post looks unchanged.

**Acceptance Scenarios**:

1. **Given** a post tagged `convergence` and `healthcare-leadership`, **When** its card appears on the landing, `/writing/all/`, a topic page or the home page, **Then** the Convergence marker is visually distinct from the Healthcare pill and appears before it.
2. **Given** the same post, **When** a visitor opens the post, **Then** a series marker appears beside the topic pills in the post header and links to the series page.
3. **Given** a post with no series tag, **When** it appears on any of these pages, **Then** its pills look exactly as they did before this feature, except that Agentic AI and Technology teams pills take their new colours (FR-010a).
4. **Given** forced-colours mode, a screen reader, or a visitor who cannot tell colours apart, **When** they meet a series marker, **Then** they can still tell it is a series and not an ordinary topic, because its text reads "Series: Drift" or "Series: Convergence".
5. **Given** any page with a series marker, **When** an automated accessibility check runs, **Then** it reports no WCAG 2.2 AA failures, and the marker's text meets 4.5:1 contrast in both light and dark themes.
6. **Given** a post tagged into a series with no feature image, **When** its text-only card appears on any listing, **Then** the card's border is in the series colour (lavender for Drift, sage for Convergence).

---

### User Story 4 - Series pages introduce their series (Priority: P2)

A visitor who follows a way into a series reaches a page that says what the series is about (a shorter form of the description now on the About page), lists its posts, and points to the other series.

**Why this priority**: The series pages are where the landing's links go. They come from the existing topic page route, so the extra work is the introduction and any short address.

**Independent Test**: Open the Drift and Convergence series pages, check the banner describes the series, the list contains only that series' posts, and there is a link to the other series.

**Acceptance Scenarios**:

1. **Given** the Drift series page, **When** a visitor opens it, **Then** it shows a banner that names Drift, describes it in one or two sentences, and carries more than an ordinary topic banner does: a link to the other series and a link back to the Writing landing.
2. **Given** either series page, **When** a visitor reads the post list, **Then** it uses the same listing and pagination as other topic pages.
3. **Given** the series page addresses in FR-008, **When** a visitor opens `/writing/drift/` or `/writing/convergence/`, **Then** they reach the series page; **When** they open `/writing/topics/drift/` or `/writing/topics/convergence/`, **Then** they are redirected to the matching series page.

---

### User Story 5 - The framing carries through to the feed, home page and About page (Priority: P3)

The feed's title and description name the two series. The home page's "Recent writing" section says the writing is Drift & Convergence and shows each post's series marker. The About page's "About the writing" section keeps a short introduction and links to the two series pages instead of describing them at length.

**Why this priority**: These are smaller copy and linking changes that complete the framing once the landing and series pages exist.

**Independent Test**: Read the built feed, the home page and the About page and check each names the series and links where stated.

**Acceptance Scenarios**:

1. **Given** the built feed, **When** a feed reader reads it, **Then** its title is "Drift & Convergence" and its description names both series in plain language.
2. **Given** the home page, **When** a visitor reaches "Recent writing", **Then** the section keeps its "Recent writing" heading, a short line under it names Drift & Convergence and links to both series pages, and each post card shows its series marker if it has one.
3. **Given** the About page, **When** a visitor reaches "About the writing", **Then** it introduces Drift & Convergence briefly, links to the Drift and Convergence series pages, and no longer carries a long paragraph describing each series.

---

### Edge Cases

- A post carries both `drift` and `convergence`: the build fails with a plain message naming the post (FR-004).
- A post's slug is `drift` or `convergence`: the build fails, because it would collide with a series address (FR-008).
- A post names a free-form topic within two letters of a controlled id (for example `convergance`): the build fails, naming the id it probably meant (FR-011).
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
- **FR-004**: A post MAY belong to at most one series. A post tagged with both `drift` and `convergence` MUST fail the build with a plain message naming the post, so each post shows at most one series marker.
- **FR-005**: Existing posts that clearly fit a series MUST be tagged; posts that do not clearly fit stay untagged. Tagging: Convergence for "The Systems Leadership Wayfinder" and "Starting something new"; Drift for "Building Focus Pocus" and "Self-contained development for Ghost themes". The sample post stays untagged.

**Writing landing**

- **FR-006**: `/writing/` MUST show a short framing lead between the page heading and the lead story that names Drift & Convergence and describes each series in one or two sentences, in Don's voice and plain language, with a visible link into each series page. The lead story, topic pill row, Featured, Latest and the "All posts" link MUST remain. The series MUST NOT also appear as ordinary pills in the topic pill row.
- **FR-007**: The landing's page description (used in search results and link previews) MUST name Drift & Convergence and both series.

**Series pages**

- **FR-008**: Each series MUST have its canonical page at a short address, `/writing/drift/` and `/writing/convergence/` (later listing pages paginate under the same address). The topic addresses `/writing/topics/drift/` and `/writing/topics/convergence/`, including their paginated pages, MUST redirect to the matching series address. Every link to a series (landing, markers, series banners, About page) MUST point to the short address. Because `/writing/{slug}/` is the post address, the build MUST fail with a plain message if any post's slug is `drift` or `convergence`.
- **FR-009**: A series page MUST open with a banner richer than an ordinary topic banner: the series name, its description, a link to the other series and a link back to the Writing landing.

**Series markers**

- **FR-010**: Wherever a post's topics are shown (landing lead story and cards, `/writing/all/`, topic and series pages, post headers, home "Recent writing", related posts), a series tag MUST render as a series marker that appears before the other topics and links to its series page. The marker is pill-shaped, reads "Series: Drift" or "Series: Convergence", and has a heavier weight and a visible outline, so it differs from ordinary topic pills by its text and not by colour alone. The series is the post's main topic: a text-only card (no feature image) for a post in a series takes its border colour from the series. Posts without a series tag MUST look the same as before this feature, apart from the Agentic AI and Technology teams recolour in FR-010a.
- **FR-010a**: Series colours MUST come from the flux design theme's palette assignments: Drift uses `lavender` and Convergence uses `sage`, for markers, banners and text-only card borders. Agentic AI (`agentic-ai`) moves from `lavender` to `mauve` and Technology teams (`technology-teams`) moves from `sage` to `sand`, so every controlled topic and series has a unique colour (the existing unique-colour rule covers series and ordinary topics together). Free-form topic pills use the neutral `dusk` palette. Every text and background pair meets 4.5:1 contrast in both themes. No new colours are added.

**Free-form topics**

- **FR-011**: Posts MUST be able to carry topics beyond the controlled list. Controlled topics (the four existing topics and the two series) keep their visual treatment: coloured pills, banners and, for series, the series marker. Any other topic shows as a neutral (`dusk`) pill, labelled in sentence case from its id (hyphens become spaces and the first letter is capitalised, so `cloud-cost` reads "Cloud cost"), that links to its own listing page at `/writing/topics/{id}/`, with a plain banner and the same listing and pagination as other topic pages. Free-form topics MUST NOT appear in the landing's topic pill row. The build MUST fail when a free-form topic id is within two letters (edit distance two or less) of a controlled id, with a plain message naming the post and the controlled id it probably meant.
- **FR-012**: A free-form topic MUST follow the existing topic id rules (lower-case letters, digits and hyphens, at most 40 characters, named once per post) so its address and label are stable.

**Feed, home and About**

- **FR-013**: The feed title MUST be "Drift & Convergence" and its description MUST name both series in plain language.
- **FR-014**: The home page "Recent writing" section MUST keep its heading and add one short line under it that names Drift & Convergence and links to both series pages (`/writing/drift/` and `/writing/convergence/`). Each post card MUST show its series marker.
- **FR-015**: The About page "About the writing" section MUST keep a short introduction to Drift & Convergence and link to both series pages, replacing the two long series paragraphs. The closing invitation to get in touch stays.

**Quality**

- **FR-016**: Every changed page MUST meet WCAG 2.2 AA, read fully with JavaScript turned off, ship no new client-side JavaScript, and stay within the existing performance budget.
- **FR-017**: All new copy MUST follow `VOICE.md` and the constitution's plain-language rule: no hype, no filler.
- **FR-018**: The visual baselines for every snapshotted page whose appearance changes (at least the Writing landing, `/writing/all/`, the topic page, the post page and the home page, including the series-coloured border on text-only cards of tagged posts, and the recoloured pills, banners and card borders of posts tagged Agentic AI or Technology teams) MUST be refreshed for both macOS and Linux. Any visual change this spec does not predict is a regression to fix, not a baseline to refresh.

### Key Entities

- **Series**: one of two named groupings of posts, Drift and Convergence. Has an id, a name, a short description, a colour from the flux theme (Drift `lavender`, Convergence `sage`) and a short canonical address (`/writing/{id}/`). Held as a controlled topic marked as a series.
- **Controlled topic**: a topic from the site's maintained list. Has an id, a name, a description and a colour. Drives coloured pills, banners and topic pages.
- **Free-form topic**: a topic a post names that is not in the controlled list. Has only an id and a sentence-case label derived from it (`cloud-cost` → "Cloud cost"). Has its own plain listing page at `/writing/topics/{id}/`; shown as a neutral pill.
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

- The four existing controlled topics keep their ids, names and descriptions. The only change to them is that Agentic AI is recoloured to `mauve` and Technology teams to `sand` (FR-010a). The two series are the only additions to the controlled list.
- Series colours follow the flux design theme (`.reference/flux`, whose palette the site already uses): Drift is `lavender` and Convergence is `sage`. These palettes were the pill colours of the existing Agentic AI and Technology teams topics, so those two topics move to `mauve` and `sand`, the two flux palettes no topic used, and every controlled topic and series keeps a unique colour. Free-form pills use `dusk`, flux's neutral palette, in place of flux's default rust for other tags, because rust is the Compliant data topic's colour.
- This is a major change under Constitution Principle III: the series marker and series banner change the design system and visual identity, and free-form topics change the content model. Auto-merge stays off, and the tasks MUST include a `[PREVIEW-CHECK]` task for Don to review the preview deployment before merge.
- The landing framing copy is a shortened form of the About page's existing series descriptions. Don can revise wording in review.
- A post still needs at least one topic; a series tag or a free-form topic counts.
- The feed keeps its address; only its title and description text change.
- This branch stacks on `012-content-cleanup`; if that PR changes the About section before merging, FR-015 applies to whatever text lands.

## Out of Scope

- Rewriting posts.
- Changing the four existing controlled topics, beyond recolouring Agentic AI to `mauve` and Technology teams to `sand` (FR-010a).
- Forcing every post into a series.
- A separate series setting in the post format, or a new route family beyond the two series addresses in FR-008.

## Follow-up

- If free-form topics grow numerous, a topics index page may earn its own feature.
