# Feature Specification: Home page with a Now section and Start here reading paths

**Feature Branch**: `040-home-now-start-here`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Home page with a Now section and Start here reading paths" (GitHub issue #162). The home page is reworked so it answers three questions for a first-time visitor without sending them to other pages: what Don is doing now, what he is open to, and where to start reading. A dated "Now" section says what Don is working on, what he is reading, how his MBA research is going and which AI experiments he is running, with a plain line on which conversations he is open to (such as advisory work, speaking or senior roles). Don updates it every few months, and the date shows how fresh it is. A "Start here" section offers a few reading paths for different readers (such as leading change in healthcare, practical AI in legacy environments, and building with AI agents). Each path is a short ordered list of posts and project stories with a reading time for each. The recent writing list stays below these sections.

## Clarifications

### Session 2026-10-11

- Q: What should happen to the home page's two existing paragraphs and its "What I do" section once Now and Start here are added? → A: Cut them; the Now "open to" line replaces them. Order is intro, Now, Start here, Recent writing.
- Q: Which reading paths should launch, and with which items in which order? → A: Two paths. "Leading change in healthcare": The Systems Leadership Wayfinder, then Starting something new. "Building with AI agents": Building Focus Pocus (post), Cadence, drc.dev the first portfolio, Flux (projects). "Practical AI in legacy environments" is follow-up content, not code.
- Q: Where should the first Now entry's text come from? → A: Agent drafts working on, MBA research and AI experiments from facts already on the site; reading is "Wool by Hugh Howey"; Don edits the wording in review.
- Q: Which conversations should the Now "open to" line say Don is open to? → A: Speaking and mentoring only: "I'm open to speaking and to mentoring conversations with healthcare and technology leaders. [Get in touch](/contact/)." Advisory work and workshops no longer appear on the home page.

- Checklist pass (2026-10-11, no user present; judgment calls resolved within the answers above): the date shows in the site's existing post date style ("Updated October 1, 2026"); the launch Now entry is dated 2026-10-11; reading paths carry a display position; the intro's call to action stays as the page's one button, and the Now "open to" link is an ordinary inline text link to the same contact page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what Don is doing now and what he is open to (Priority: P1)

A first-time visitor lands on the home page and, without leaving it, learns what Don is working on at the moment, what he is reading, how his MBA research is going and which AI experiments he is running. A plain line tells them which conversations he is open to, so they know whether it makes sense to get in touch. A visible date tells them how current this is.

**Why this priority**: This is the question the current home page answers least well, and it is the one that turns a visitor into a contact. It is useful on its own even with no reading paths.

**Independent Test**: Build the site with a Now entry and open the home page: the Now section shows its four topics, the "open to" line and its date, with no navigation needed.

**Acceptance Scenarios**:

1. **Given** Don has written a Now entry dated 2026-10-01, **When** a visitor opens the home page, **Then** a section headed "Now" shows the line "Updated October 1, 2026", followed by what he is working on, reading, his MBA research progress and his current AI experiments, each under its label.
2. **Given** the Now entry includes an "open to" line, **When** the visitor reads the Now section, **Then** that line names the kinds of conversation he is open to (at launch, speaking and mentoring) and links to the contact page.
3. **Given** Don edits the Now entry and changes its date, **When** the site is rebuilt, **Then** the home page shows the new text and the new date, and no other page or file needs to change.
4. **Given** JavaScript is turned off, **When** the visitor opens the home page, **Then** the Now section is fully readable.

---

### User Story 2 - Choose a reading path from "Start here" (Priority: P2)

A new visitor who wants to read something does not know where to begin. The "Start here" section offers a few named reading paths, each aimed at a different reader (for example leading change in healthcare, practical AI in legacy environments, building with AI agents). Each path is a short ordered list of posts and project stories, and each item shows its reading time, so the visitor can pick a path and know what they are committing to.

**Why this priority**: It turns a visit into reading. It depends on enough published writing to fill the paths, so it follows the Now section.

**Independent Test**: Build the site with two or more reading paths defined and open the home page: each path shows its name, a one-line description of who it is for, and its items in the set order, each with a title link and reading time.

**Acceptance Scenarios**:

1. **Given** Don has defined a reading path with three items (two posts and one project story), **When** a visitor opens the home page, **Then** the "Start here" section shows the path's name, its short description, and the three items in the order Don set, each linking to the post or project story and showing its reading time in minutes.
2. **Given** a reading path item is a project story, **When** it is listed, **Then** it shows a reading time worked out the same way as a post's reading time, and is marked as a project so the visitor knows what kind of page it is.
3. **Given** a reading path names a post or project that does not exist, **When** the site is built, **Then** the build fails with an error that names the path and the missing item.
4. **Given** a reading path names a post that is still a draft, **When** the production site is built, **Then** that item is left out of the path; and if no items in a path remain, the path is not shown.
5. **Given** no reading paths are defined, **When** the home page is built, **Then** the "Start here" section is not shown and the rest of the page is unaffected.
6. **Given** two reading paths with positions 2 and 1, **When** the home page is built, **Then** the path with position 1 is shown first.

---

### User Story 3 - Recent writing stays below (Priority: P3)

A returning visitor who wants the latest post still finds the recent writing list on the home page, now below the Now and Start here sections.

**Why this priority**: Existing behaviour that must survive the rework; it needs no new work beyond keeping its place.

**Independent Test**: Open the home page and confirm the section order and that the recent writing list behaves as before (three newest visible posts and a link to all writing).

**Acceptance Scenarios**:

1. **Given** the reworked home page, **When** a visitor scrolls it, **Then** the sections appear in this order: Don's intro, Now, Start here, Recent writing.
2. **Given** published posts exist, **When** the visitor reaches Recent writing, **Then** it shows the same posts and "All writing" link it shows today.

---

### Edge Cases

- The Now date is later than the build date: the build fails with a clear error. "Later" is compared with the build's date in UTC; a Now date equal to the build date is allowed. (The site has no such rule for post dates; this feature adds it for the Now entry only.)
- The Now date is not a real calendar day (for example 2026-02-30) or is not written `YYYY-MM-DD`: the build fails and names the field.
- The Now entry is missing one of its required parts (working on, reading, MBA research, AI experiments, open to): the build fails and names the missing part. A part with nothing new to say still needs a short plain statement (for example "Nothing new since the last update"); a topic cannot be left out or hidden.
- There is no Now entry, or there is more than one: the build fails and says there must be exactly one.
- The Now entry is old (for example more than six months): the date still shows as written; there is no automatic "stale" warning in this feature (see Follow-up work). This trade-off is accepted: the visible date is the reader's signal of freshness, and Don keeps it current by hand.
- The same post appears in two reading paths: allowed; each path lists it on its own.
- A reading path has only one visible item after drafts are removed: it is still shown, as a numbered list of one.
- A reading path lists the same item twice: the build fails and names the path and item.
- A post and a project story share the same file name: they are different items, and a path may list both.
- A narrow phone screen (320 px wide): the Now section and reading paths read top to bottom with no sideways scrolling.
- A very long post title, topic line or unbroken word: the text wraps inside its section and is not clipped or cut off, and the page does not scroll sideways.
- An item's reading time is under one minute: it shows as "1 min read", matching posts today.

## Requirements *(mandatory)*

### Functional Requirements

**Now section**

- **FR-001**: The home page MUST show a section headed "Now" below Don's intro and above "Start here".
- **FR-002**: The Now section MUST show the date it was last updated as the visible line "Updated <date>", with the date in the site's existing post date style (month name, day, year, for example "Updated October 1, 2026"). The date MUST also be given in machine-readable form (`YYYY-MM-DD`) on the date element; assistive technology reads the visible text.
- **FR-003**: The Now section MUST cover four topics, in this order and with these exact labels: "Working on", "Reading", "MBA research", "AI experiments". Each topic's text MUST be plain text (no links or formatting), one line of at most 200 characters. Each label MUST be programmatically paired with its text (for example as a term and its description), so assistive technology reads them together.
- **FR-004**: The Now section MUST include one plain line, a single paragraph, saying which conversations Don is open to, with a link whose address is the contact page (`/contact/`). The line MAY contain other links, but at least one MUST go to the contact page.
- **FR-005**: The Now content and its date MUST live in one content file in the repository that Don or an agent edits directly; updating the Now section MUST NOT need any source code, test or visual baseline change.
- **FR-006**: The build MUST fail with a clear message (FR-006a) when:
  - the date is missing, is not written `YYYY-MM-DD`, is not a real calendar day, or is later than the build date (UTC);
  - any of the four topics in FR-003 is missing, empty, whitespace only, or longer than its limit;
  - the "open to" line is missing, empty, more than one paragraph, or has no link to the contact page;
  - the entry has a field the format does not define (for example a misspelled topic name);
  - there is no Now entry, or more than one.
- **FR-006a**: Every build failure in this feature (FR-006, FR-012, FR-014) MUST name the file, the field or item at fault (an item by its position in the path and by its kind and file name), and the rule broken, in plain language that says what to change. The build MAY stop at the first failure it finds; it need not report every failure at once.

**Start here**

- **FR-007**: The home page MUST show a section headed "Start here" below the Now section and above "Recent writing" whenever at least one reading path has a visible item.
- **FR-008**: Each reading path MUST have a name, a description of who it is for, a display position, and an ordered list of items. The description MUST be one sentence ending in a full stop, at most 160 characters; by convention it reads "For <reader> …" (reviewed in the PR, not checked by the build). The position is a whole number from 1 to 4, unique across paths, and paths MUST show in position order. Items MUST show in the order the author set, as an ordered (numbered) list that assistive technology announces as a list; the numbering is the only signal of suggested reading order, with no extra "read in this order" text.
- **FR-009**: Each reading path item MUST refer to an existing post or project story by its file name, and MUST show that item's full title as the link text, linking to it, followed by its reading time as "N min read" (N a whole number, at least 1), the same wording posts use today.
- **FR-010**: Project stories listed in a reading path MUST show a reading time counted by the same rule as post reading times (FR-010a), and MUST carry the visible text label "Project", not colour or an icon alone. Apart from that label, posts and projects are shown the same way.
- **FR-010a**: Reading time for both posts and project stories MUST come from the site's one existing reading-time rule: the words of the body text (front matter, including a project's call to action and links, not counted) at 225 words a minute, rounded up, at least one minute. There MUST be one shared rule, so posts and projects cannot diverge.
- **FR-011**: Reading paths MUST be defined in content files in the repository; adding, removing or reordering a path or its items MUST NOT need any source code, test or visual baseline change.
- **FR-012**: The build MUST fail with a clear message (FR-006a) naming the path and item when:
  - an item refers to a post or project that does not exist ("does not exist" means no post or project file with that name at all; a draft exists and is handled by FR-013, never by this error);
  - a path lists the same item twice (same kind and same file name; a post and a project with the same file name are different items);
  - an item does not name exactly one post or one project.
- **FR-013**: In a production build, draft posts and draft project stories MUST be left out of reading paths. A path with no remaining items MUST NOT be shown; the other paths are unaffected; the "Start here" section is hidden only when no path remains. Every other build (branch previews, local development, CI and test builds) includes drafts, as it does for posts and projects elsewhere on the site.
- **FR-014**: The site MUST allow zero to four reading paths and one to five items per path. Zero paths hides the "Start here" section (US2-AS5). The build MUST fail with a clear message (FR-006a) when there are five or more path files, when a path has no items or more than five, when two paths share a position, when a position is outside 1–4, when a path's name, description or position is missing or its description breaks the FR-008 rule, or when a path file cannot be read. The path count is checked on the files as written, before drafts are removed.

**Page as a whole**

- **FR-015**: The Recent writing section MUST stay on the home page, below Start here, and behave as it does today.
- **FR-015a**: Now, Start here and Recent writing MUST be peer sections with the same visual weight: the same section heading style, spacing, colours, link styles and focus styles that Recent writing uses today, drawn from the site's existing theme tokens, in both light and dark themes. No new colours or type styles are introduced.
- **FR-015b**: Layout: the Now topics MUST show as one column below the site's medium breakpoint (768 px) and as a 2x2 grid from it, filled row by row in topic order (Working on, Reading / MBA research, AI experiments), each label above its text and topics top-aligned (Don, PR #174 review). Reading paths MUST show as one column below the site's medium breakpoint (768 px) and as two columns from it, filled row by row in position order; an odd last path sits alone in the first column. Paths in a row are top-aligned and each takes the height of its own content; a shorter path leaves space below it, which is accepted. The reading order and tab order MUST follow the source order at every width: no visual reordering of sections, paths or items.
- **FR-016**: Don's intro (photo, name, tagline, short bio and call to action) MUST stay at the top of the home page, unchanged. The two paragraphs and the "What I do" section that sit between the intro and Recent writing today MUST be removed; the Now "open to" line replaces them, and the home page MUST NOT mention advisory work or workshops. This deliberately removes the home page's only description of services; that loss is accepted (clarify answer 1). Nothing else on the site links to the removed content. The intro's call to action stays the page's one button-style call to action; the Now "open to" link is an ordinary inline text link to the same contact page, so the two do not compete.
  - *Superseded in part by `specs/051-home-dual-cta` (2026-10-19): the intro card now has an optional second, outlined call to action.*
- **FR-016a**: The home page's title, meta description and social preview image MUST stay as they are; none of them depends on the removed paragraphs.
- **FR-017**: The Now and Start here sections MUST add no client-side JavaScript (no new script on the page) and, as a separate requirement, MUST be fully readable and operable with JavaScript turned off, to the same accessibility bar as with it on.
- **FR-018**: The reworked home page MUST meet WCAG 2.2 AA, including:
  - Heading order: one page heading (Don's name in the intro, level 1); "Now", "Start here" and "Recent writing" as level 2; each reading path name as level 3, whether one path or several are shown.
  - Each new section, and each reading path, is a region labelled by its own heading.
  - Every new link is reachable by keyboard in reading order and shows the site's existing visible focus indicator, not hidden behind other content (WCAG 2.4.7, 2.4.11).
  - Reading path links meet the WCAG 2.5.8 target size (at least 24 by 24 CSS pixels, or enough spacing).
  - Link purpose: a reading path link's text is the item's full title; the "Get in touch" link's purpose is clear from the sentence it sits in (WCAG 2.4.4).
  - Text, including secondary text (the date line, reading times and the "Project" label), meets 4.5:1 contrast, and link and focus indicators meet 3:1 non-text contrast, in both light and dark themes.
  - In forced-colours (high-contrast) mode the sections stay readable, links and focus stay visible, and nothing relies on colour alone.
  - At 320 CSS px wide, at 200% zoom and with WCAG 1.4.12 text-spacing overrides, the page's content width does not exceed the viewport (no sideways scrolling), and no text in the new sections is clipped or overlaps.
  - The date and reading-time wording use the site's existing forms ("Updated October 1, 2026", "N min read"); "min read" is the site's established wording for posts and is kept for consistency.
- **FR-019**: The reworked home page MUST stay within the site's existing performance budget on mobile, which the release gate checks: largest contentful paint at most 2.5 s, layout shift at most 0.1, long tasks at most 200 ms, JavaScript at most 10 KB and total transfer at most 150 KB.
- **FR-020**: All copy MUST be plain language with no hype or filler: first person, short sentences, concrete facts, no superlatives or marketing words (such as "passionate", "world-class", "cutting-edge"). Where copy names Don's current role, it MUST name it as Director, Data Infrastructure and Architecture at Island Health; copy may describe the work without naming the title. No file under the site's source (`src/`) may contain "Cloud Architect".
- **FR-021**: The launch Now entry MUST be dated 2026-10-11 (the delivery date) and say, as a draft Don edits in review (listed as a preview check in the PR):
  - Working on: "Leading data warehousing, data modernization, and AI support and compliance at Island Health."
  - Reading: "Wool by Hugh Howey".
  - MBA research: "Researching the experienced value of the Certified Health Executive (CHE) designation for my MBA at Royal Roads University."
  - AI experiments: "Building this site with Claude Code and Spec Kit: agents write the specs, tests and code, and I review every change."
  - Open to: "I'm open to speaking and to mentoring conversations with healthcare and technology leaders. [Get in touch](/contact/)."
- **FR-022**: The site MUST launch with exactly two reading paths, six items in all (three posts and three project stories), in this order. Each item is named by its file name; all six are published today:
  - Position 1, "Leading change in healthcare" (for leaders taking a team through complex change): 1. The Systems Leadership Wayfinder (post `the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change`); 2. Starting something new (post `starting-something-new`).
  - Position 2, "Building with AI agents" (for people curious about letting AI do the build): 1. Building Focus Pocus (post `building-focus-pocus-what-i-learned-about-ai-coding-and-integration`); 2. Cadence (project `cadence`); 3. drc.dev, the first portfolio (project `drcdev-github-io`); 4. Flux (project `flux`).

### Key Entities

- **Now entry**: one dated snapshot of what Don is doing. Attributes: last-updated date; working on; reading; MBA research; AI experiments; open to. There is exactly one current entry; earlier versions live only in the repository history.
- **Reading path**: a named, ordered list for one kind of reader. Attributes: name; one-sentence description of who it is for; display position (1–4); ordered items.
- **Reading path item**: a reference to one existing post or project story by kind and file name. Its title, link, kind (post or project) and reading time come from the item itself at each build, never copied into the path, so a changed title or body shows on the next build with no path edit. Renaming the item's file breaks the reference and fails the build (FR-012).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can find, on the home page alone, by scrolling and with no click, tap, expanding control or navigation, what Don is doing now, what conversations he is open to, and at least one suggested place to start reading. All three are in the home page as delivered.
- **SC-002**: Don can update the Now section, including its date, by editing one content file, and the change is live after the normal release with no code, test or visual baseline change.
- **SC-003**: Every reading path item shows a reading time, and 100% of reading path links lead to a published page (no broken links in production).
- **SC-004**: The home page passes the automated accessibility check with no violations at phone and desktop widths, in light and dark themes, and with JavaScript turned off, with reading paths shown; and it stays within the existing performance budget on mobile (FR-019). The no-paths state renders no Start here markup, so it is checked by the build, not by the accessibility check.
- **SC-005**: The home page is fully readable with JavaScript turned off.

## Assumptions

- The Now section lives on the home page only; there is no separate /now page in this feature.
- The date shown is the date Don sets in the content file, not the file's last change date, so a typo fix does not make old news look fresh.
- Reading time uses the site's existing rule for posts (FR-010a); project stories use the same rule over their story body.
- The section headings are "Now" and "Start here", as in the issue.
- The "open to" line links to the existing contact page; it adds no new form or contact route. The contact page, its form and the contact API are not changed by this feature.
- The intro's existing call to action stays as it is (FR-016).
- The path descriptions in FR-022 are draft wording Don may edit in review.
- Current content: four published posts (plus one draft sample post) and five published project stories (plus a draft template). The launch paths use three of the posts and three of the projects. No existing site copy says "Cloud Architect", and the home intro already describes the Island Health work.
- Tests about real content read it from the content files, and visual baselines for the new sections are taken on the test fixture site with fixture Now and reading-path content, so editing the real Now entry or reading paths changes no test or baseline (FR-005, FR-011).

## Dependencies

- New visual baselines for the home page's Now and Start here sections (phone and desktop, light and dark, both platforms) are added on the fixture site. No existing baseline is expected to change; if the open-menu shot on the home page moves, it is refreshed and the PR says so.

## Follow-up work (out of scope)

- A separate /now page or an archive of earlier Now entries.
- An automatic notice, build warning or reminder when the Now entry is older than a set age.
- Showing reading time on project story pages and project cards (this feature only shows it inside reading paths).
- A "Practical AI in legacy environments" reading path, added as content once posts exist for it.
- Reading paths on pages other than the home page, or a dedicated reading paths page.
- A future-date rule for post dates (this feature adds one for the Now entry only).
