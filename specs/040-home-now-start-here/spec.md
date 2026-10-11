# Feature Specification: Home page with a Now section and Start here reading paths

**Feature Branch**: `040-home-now-start-here`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Home page with a Now section and Start here reading paths" (GitHub issue #162). The home page is reworked so it answers three questions for a first-time visitor without sending them to other pages: what Don is doing now, what he is open to, and where to start reading. A dated "Now" section says what Don is working on, what he is reading, how his MBA research is going and which AI experiments he is running, with a plain line on which conversations he is open to (such as advisory work, speaking or senior roles). Don updates it every few months, and the date shows how fresh it is. A "Start here" section offers a few reading paths for different readers (such as leading change in healthcare, practical AI in legacy environments, and building with AI agents). Each path is a short ordered list of posts and project stories with a reading time for each. The recent writing list stays below these sections.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See what Don is doing now and what he is open to (Priority: P1)

A first-time visitor lands on the home page and, without leaving it, learns what Don is working on at the moment, what he is reading, how his MBA research is going and which AI experiments he is running. A plain line tells them which conversations he is open to, so they know whether it makes sense to get in touch. A visible date tells them how current this is.

**Why this priority**: This is the question the current home page answers least well, and it is the one that turns a visitor into a contact. It is useful on its own even with no reading paths.

**Independent Test**: Build the site with a Now entry and open the home page: the Now section shows its four topics, the "open to" line and its date, with no navigation needed.

**Acceptance Scenarios**:

1. **Given** Don has written a Now entry dated 2026-10-01, **When** a visitor opens the home page, **Then** a section headed "Now" shows the date as a readable date (for example "Updated 1 October 2026"), followed by what he is working on, reading, his MBA research progress and his current AI experiments.
2. **Given** the Now entry includes an "open to" line, **When** the visitor reads the Now section, **Then** that line names the kinds of conversation he is open to (for example advisory work, speaking or senior roles) and links to the contact page.
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

- The Now date is in the future: the build fails with a clear error, as a post date in the future would.
- The Now entry is missing one of its required parts (working on, reading, MBA research, AI experiments, open to): the build fails and names the missing part.
- The Now entry is old (for example more than six months): the date still shows as written; there is no automatic "stale" warning in this feature (see Follow-up work).
- The same post appears in two reading paths: allowed; each path lists it on its own.
- A reading path has only one visible item after drafts are removed: it is still shown.
- A reading path lists the same item twice: the build fails and names the path and item.
- A narrow phone screen (320 px wide): the Now section and reading paths read top to bottom with no sideways scrolling.
- An item's reading time is under one minute: it shows as "1 min read", matching posts today.

## Requirements *(mandatory)*

### Functional Requirements

**Now section**

- **FR-001**: The home page MUST show a section headed "Now" below Don's intro and above "Start here".
- **FR-002**: The Now section MUST show the date it was last updated, in a readable form, and the date MUST also be given in a machine-readable form.
- **FR-003**: The Now section MUST cover four topics, each with its own short label: what Don is working on, what he is reading, how his MBA research is going, and which AI experiments he is running.
- **FR-004**: The Now section MUST include one plain line saying which conversations Don is open to, with a link to the contact page.
- **FR-005**: The Now content and its date MUST live in a content file in the repository that Don or an agent edits directly; updating the Now section MUST NOT need any code change.
- **FR-006**: The build MUST fail with a clear message when the Now entry is missing its date or any of the parts in FR-003 and FR-004, or when its date is in the future.

**Start here**

- **FR-007**: The home page MUST show a section headed "Start here" below the Now section and above "Recent writing" whenever at least one reading path has a visible item.
- **FR-008**: Each reading path MUST have a name, a one-sentence description of who it is for, and an ordered list of items; it MUST show its items in the order the author set.
- **FR-009**: Each reading path item MUST refer to an existing post or project story and MUST show that item's title as a link to it and its reading time in whole minutes.
- **FR-010**: Project stories listed in a reading path MUST show a reading time counted the same way as post reading times, and MUST be labelled as projects.
- **FR-011**: Reading paths MUST be defined in a content file in the repository; adding, removing or reordering a path or its items MUST NOT need any code change.
- **FR-012**: The build MUST fail with a clear message naming the path and item when an item refers to a post or project that does not exist, or when a path lists the same item twice.
- **FR-013**: In a production build, draft posts and draft project stories MUST be left out of reading paths, and a path with no remaining items MUST NOT be shown.
- **FR-014**: The site MUST allow between one and four reading paths, each with between one and five items, and the build MUST fail with a clear message outside these limits.

**Page as a whole**

- **FR-015**: The Recent writing section MUST stay on the home page, below Start here, and behave as it does today.
- **FR-016**: Don's intro (photo, name, tagline, short bio and call to action) MUST stay at the top of the home page. [NEEDS CLARIFICATION: The home page today also has two paragraphs and a "What I do" section between the intro and Recent writing. Should these stay (above Now), be cut, or be folded into the Now "open to" line?]
- **FR-017**: The Now and Start here sections MUST be readable with JavaScript turned off and MUST add no client-side JavaScript.
- **FR-018**: The reworked home page MUST meet WCAG 2.2 AA, with a correct heading order (one page heading, then section headings, then path headings).
- **FR-019**: The reworked home page MUST stay within the site's performance budget.
- **FR-020**: All copy MUST be plain language with no hype or filler, and MUST describe Don's current role as Director, Data Infrastructure and Architecture at Island Health; no "Cloud Architect" wording may appear.
- **FR-021**: The launch content for the Now section MUST be Don's own words. [NEEDS CLARIFICATION: What should the first Now entry say for each topic (working on, reading, MBA research, AI experiments) and which conversations is Don open to? An agent can draft from the About page for Don to edit, or Don can supply the text.]
- **FR-022**: The site MUST launch with the reading paths Don chooses. [NEEDS CLARIFICATION: Which reading paths launch, and which posts and project stories go in each, in what order? Only four posts are published today, so the three paths in the issue would be short and share items. Options: launch with the paths that the current writing can fill, or launch all three and add items as posts are published.]

### Key Entities

- **Now entry**: one dated snapshot of what Don is doing. Attributes: last-updated date; working on; reading; MBA research; AI experiments; open to. There is exactly one current entry; earlier versions live only in the repository history.
- **Reading path**: a named, ordered list for one kind of reader. Attributes: name; one-sentence description of who it is for; ordered items.
- **Reading path item**: a reference to one existing post or project story. Its title, link, kind (post or project) and reading time come from the item itself, not from the path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can find, on the home page alone and without clicking, what Don is doing now, what conversations he is open to, and at least one suggested place to start reading.
- **SC-002**: Don can update the Now section, including its date, by editing one content file, and the change is live after the normal release with no code change.
- **SC-003**: Every reading path item shows a reading time, and 100% of reading path links lead to a published page (no broken links in production).
- **SC-004**: The home page passes the automated accessibility check with no violations and stays within the existing performance budget on mobile.
- **SC-005**: The home page is fully readable with JavaScript turned off.

## Assumptions

- The Now section lives on the home page only; there is no separate /now page in this feature.
- The date shown is the date Don sets in the content file, not the file's last change date, so a typo fix does not make old news look fresh.
- Reading time uses the site's existing rule for posts (words in the body at a fixed reading speed, rounded up, at least one minute); project stories use the same rule over their story text.
- The section headings are "Now" and "Start here", as in the issue.
- The "open to" line links to the existing contact page; it adds no new form or contact route.
- The intro's existing call to action stays as it is.
- Current published content: four posts and five project stories; no existing site copy says "Cloud Architect", and the home intro already describes the Island Health role.

## Follow-up work (out of scope)

- A separate /now page or an archive of earlier Now entries.
- An automatic notice, build warning or reminder when the Now entry is older than a set age.
- Showing reading time on project story pages and project cards (this feature only shows it inside reading paths).
- Reading paths on pages other than the home page, or a dedicated reading paths page.
