# Feature Specification: One Page for Services and Speaking

**Feature Branch**: `026-services-speaking-merge`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "I want to merge the Services and Speaking pages, which will alter the structure of the site. We will also need to merge the content and present all offerings under a single page."

## Context

Today the site has two separate pages for the work Don offers outside his day job. Both are
drafts (they show the draft notice) and both are in the header menu.

- **Services**, at `/services/`, menu position 2. It opens with a note that Don has no consulting
  practice today and is testing whether these services would be useful, then a lead paragraph,
  a "Kinds of work" list of three offerings (advice on technology change, workshops, plan
  reviews), a "How I work" block, a "What I do not do" block, and a "Talk about your project"
  call to action linking to the contact page.
- **Speaking**, at `/speaking/`, menu position 3. It has a lead paragraph, a "Talk topics" list
  of three talks (systems thinking for technology leaders, practical AI in healthcare, leading
  change without formal authority), a "Past talks" block (a placeholder saying the list is being
  gathered), a "For event organizers" block with a short bio, a captioned photo of Don for event
  programs, and an "Invite me to speak" call to action linking to the contact page.

Both pages already use the same page sections (lead, offerings list, text block, figure, call to
action), so the merged page needs no new kind of section.

Other places that depend on the two pages today:

- The header menu lists Home, Services, Speaking, Writing, Projects, About and Contact, in that
  order. Writing, Projects and Contact hold reserved positions 4, 5 and 7; About is at 6.
- The home page's introduction card has a "See how I can help" button linking to `/services/`.
- The launch readiness check and its configuration list `services` and `speaking` as pages that
  must exist and be published before launch, and `/speaking/` as an expected address. The launch
  runbook tells Don to replace "the Services and Speaking placeholder copy" before going live.
- The per-template checks (accessibility, performance budget, header and menu behaviour) run
  against both pages, and some tests name both menu entries or count seven menu links.
- The editors' page guide (`docs/pages.md`) uses `/services/` in its address table and
  examples, and a code comment in the menu code uses `/services` as an example.
- The site's visual checks photograph the header menu (desktop row, open phone menu) and full
  pages that include it, so those images show the Services and Speaking entries today.
- The site's usual convention for a page that moves is a permanent (301) redirect in the site's
  redirect rules. For this feature Don has decided against it: both old pages are drafts, so the
  old addresses are removed outright with no redirect.
- The sitemap lists every built page, drafts included; it is generated from the pages that
  exist, so a removed page leaves it on its own.

## Clarifications

### Session 2026-10-05

- Q: Should the merged page keep the name "Services" and the address `/services/`, or get a new name and address that also covers speaking? → A: New name "Work with me" at the new address `/work-with-me/`. `/services/` and `/speaking/` are removed with no redirects and no stub pages; every internal link (home page button, menu, docs, launch check, its configuration and the runbook) points to `/work-with-me/`.
- Q: Should the six offerings appear as two titled groups, or as one combined list? → A: Two titled groups, "Kinds of work" then "Talk topics".
- Q: Should the old Speaking address land at the top of the merged page, or jump straight to its speaking section? → A: Neither; no redirects are needed (follows from the first answer). A stable id on the speaking heading is optional, not required.
- Q: In what order should the sections appear on the merged page? → A: Consulting first: the no-practice note and one lead, then Kinds of work, How I work, What I do not do, then Talk topics, Past talks, For event organizers, the photo, then one call to action.
- Q: Should the page end with one call to action covering both kinds of enquiry, or keep one at the end of each half? → A: One call to action at the end, with wording that covers both a project and a speaking invitation (wording for Don to review).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One place to see everything Don offers (Priority: P1)

A visitor who wants to work with Don, whether to hire him for advice, book a workshop, ask for a
plan review or invite him to speak, opens the "Work with me" page from the header menu and finds
every offering there, with how he works, what he will not do, the material event organizers need,
and a way to get in touch.

**Why this priority**: This is the change Don asked for. Without it nothing else in the feature
has a purpose.

**Independent Test**: Open `/work-with-me/` and confirm every offering, block, the photo and the
call to action from both of today's pages appear on it, in the agreed order, under one main
heading.

**Acceptance Scenarios**:

1. **Given** the merged page, **When** a visitor reads it, **Then** they find the "Kinds of work"
   group (advice on technology change, workshops, plan reviews) followed later by the "Talk
   topics" group (the three talks), each offering with its title and description.
2. **Given** the merged page, **When** a visitor reads it, **Then** they find the "How I work",
   "What I do not do", "Past talks" and "For event organizers" content, the photo for event
   programs with its caption and alt text, and the note that Don has no consulting practice today.
3. **Given** the merged page, **When** a visitor reads it from top to bottom, **Then** the
   sections appear in this order: the no-practice note, the lead, Kinds of work, How I work,
   What I do not do, Talk topics, Past talks, For event organizers, the photo, the call to action.
4. **Given** the merged page, **When** a visitor wants to get in touch, **Then** a single call to
   action at the end takes them to the contact page.
5. **Given** the merged page with JavaScript turned off, **When** a visitor reads it, **Then**
   all of its content is readable, every header menu entry is reachable and the call to action
   works as a plain link.

---

### User Story 2 - The header menu has one entry for the merged page (Priority: P1)

A visitor scanning the header menu sees a single "Work with me" entry instead of separate
Services and Speaking entries, and the entry is marked as the current page while they are on it.

**Why this priority**: A menu entry pointing to a page that no longer exists, or two entries for
one page, would be a visible defect the moment the merge lands.

**Independent Test**: Open any page and read the header menu; open the merged page and confirm
its entry is the only one marked current.

**Acceptance Scenarios**:

1. **Given** any page on the site, **When** a visitor opens the header menu (desktop or mobile),
   **Then** it lists Home, Work with me, Writing, Projects, About and Contact, in that order,
   with no Services or Speaking entry.
2. **Given** the merged page, **When** it is open, **Then** its menu entry, and only that entry,
   is marked as the current page, in both the desktop menu row and the phone menu. The marking is
   exposed to assistive technology as the current page, not shown by colour alone.

---

### User Story 3 - Launch checks and links follow the new structure (Priority: P2)

When Don runs the launch readiness check, or follows the launch runbook, they describe one
"Work with me" page instead of two, and no link anywhere on the site points at a removed page.

**Why this priority**: Without this, the launch check would report missing Services and Speaking
pages that were removed on purpose, and links would lead visitors to the not-found page.

**Independent Test**: Run the launch readiness check against the repository and confirm it
expects `/work-with-me/` and no longer expects a Services or Speaking page or address; search the
built site and the sitemap for `/services/` and `/speaking/`.

**Acceptance Scenarios**:

1. **Given** the merged structure, **When** the launch readiness check runs, **Then** it expects
   the "Work with me" page and does not report a missing Services or Speaking page or address.
2. **Given** the built site, **When** every internal link is followed, **Then** none points at
   `/services/` or `/speaking/`.
3. **Given** the home page, **When** a visitor uses the introduction card's "See how I can help"
   button, **Then** it opens `/work-with-me/`.
4. **Given** the site's sitemap, **When** it is read, **Then** it lists `/work-with-me/` once and
   lists neither `/services/` nor `/speaking/`.

---

### Edge Cases

- A request for `/services/`, `/speaking/` (with or without the trailing slash) or any address
  below them gets the site's not-found page. There are no redirects and no stub pages.
- The photo of Don is used both on the home page and on the event-organizer section; it stays
  available to both.
- The menu positions: "Work with me" takes position 2. Position 3, freed by Speaking, is not taken
  by anything else; the remaining menu order is unchanged and no reserved position moves.
- The merged page stays a draft, with the draft notice, exactly as both pages are today. Going
  live remains Don's decision through the launch runbook.
- The merged page must not repeat the main heading or show two competing lead paragraphs; it has
  one title, one lead, and section headings below it.
- The "Work with me" label is longer than any single label it replaces. It must fit the desktop
  menu row on one line and the phone menu without horizontal scrolling, including at 320 px wide
  and at 200 % text size.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST have one page that presents every offering from today's Services and
  Speaking pages, each with its current title and description: the three kinds of work ("Advice
  on technology change", "Workshops", "Plan reviews") and the three talk topics ("Systems thinking
  for technology leaders", "Practical AI in healthcare", "Leading change without formal
  authority"). It is published at `/work-with-me/` under the title and menu label
  "Work with me".
- **FR-002**: The merged page MUST keep the rest of both pages' content: the no-practice-today
  note, the "How I work" and "What I do not do" blocks, the "Past talks" block, the "For event
  organizers" block with the bio, and the photo for event programs with its caption and alt text
  unchanged from the Speaking page. Every block of both pages has a place in the FR-004 order;
  only the two leads and the two calls to action are combined, one each. Copy may change only in
  these places: (a) the two leads become one, which keeps the Services lead and closes with one
  sentence saying the page covers both the work Don is considering and the talks he gives (the
  Speaking lead's list of subjects is dropped, because the Talk topics group carries it); (b) the
  two calls to action become one (FR-005); (c) the no-practice note may be reworded only so it
  reads as being about the consulting work, not the talks; (d) the page's description (FR-014).
  Every offering, the four blocks and the photo's caption and alt text stay word for word. Every
  change to copy is Don's to review.
- **FR-003**: The offerings MUST be presented as two titled groups on the one page: "Kinds of
  work" (the three kinds of work), then "Talk topics" (the three talks). Each group is its own
  list under its own section heading, so assistive technology announces them as two separate
  groups. A stable id on the Talk topics heading is optional; if one is added it is
  `talk-topics`, and no test or link may depend on it.
- **FR-004**: The merged page MUST present its sections in this order: the no-practice note, one
  lead, Kinds of work, How I work, What I do not do, Talk topics, Past talks, For event organizers,
  the photo for event programs, and the call to action.
- **FR-005**: The merged page MUST end with exactly one call to action (today's pages have one
  each, two in all), linking to the contact page, whose wording speaks to both kinds of enquiry (a
  project and a speaking invitation). Its link text MUST make sense out of context, naming the
  action of getting in touch rather than "click here" or "more". The wording is Don's to review.
- **FR-006**: The Services and Speaking pages MUST no longer exist, and the header menu MUST NOT
  list either. The menu order MUST be Home (1), Work with me (2), Writing (4), Projects (5),
  About (6), Contact (7). Writing, Projects and Contact keep their reserved positions and About
  keeps 6; position 3 is left empty and nothing moves into it. On the merged page its entry is
  the only one marked current, exposed to assistive technology as the current page, in the
  desktop row and the phone menu.
- **FR-007**: `/services/` and `/speaking/` MUST NOT be redirected and MUST NOT have stub pages;
  requests for them, with or without the trailing slash, and for any address below them get the
  not-found page with a 404 status.
- **FR-008**: The sitemap MUST list `/work-with-me/` exactly once, while the page is a draft as
  well as after (the sitemap lists draft pages today), and MUST NOT list `/services/` or
  `/speaking/`.
- **FR-009**: Internal links MUST NOT point at `/services/` or `/speaking/`. "Internal links"
  covers every link in the built site (page content, menu, components and layouts), the
  repository's docs (including the page guide and the launch runbook), the launch check's
  configuration, code comments that give the old addresses as examples, and tests that describe
  the real site's pages or menu. Example addresses used as made-up inputs in component or schema
  tests, which describe no real page, are not links and may stay. The home page's introduction
  call to action MUST lead to `/work-with-me/`.
- **FR-010**: The launch readiness check and its configuration MUST expect the "Work with me" page
  in their list of pages and `/work-with-me/` in their list of addresses, and MUST NOT expect a
  Services or Speaking page or address. The launch runbook's step to replace "the Services and
  Speaking placeholder copy" MUST instead name the Work with me placeholder copy, as one page.
- **FR-011**: The merged page MUST stay a draft, showing the draft notice in the same place and
  form as every other draft page, until Don publishes it.
- **FR-012**: The merged page MUST meet the site's existing page standards, with no exception or
  raised limit for it:
  - WCAG 2.2 AA, confirmed by the automated accessibility check every page template runs.
  - Headings: one level-1 heading (the page title); the section titles Kinds of work, How I work,
    What I do not do, Talk topics, Past talks and For event organizers as level-2 headings in page
    order; each offering title one level below its group's heading; no level skipped.
  - The same per-template performance budget as every page template today, and Core Web Vitals
    "good" on mobile; the photo reserves its space so it causes no layout shift.
  - Readable with JavaScript off, including the menu and the call to action.
  - The header and menu behaviour every page template has, inherited unchanged: every menu entry
    is reachable by keyboard in order with a visible focus indicator, and the phone menu opens and
    closes from the keyboard.
  The per-template checks MUST cover the merged page and MUST no longer list a Services or
  Speaking template. Tests that name the Services or Speaking menu entries, or count seven menu
  links, MUST be changed to the six-entry menu; no check is removed or loosened to make this pass.
- **FR-013**: The page guide for editors MUST say that menu position 3 is unused and free for a
  future page, that positions 4, 5 and 7 stay reserved for Writing, Projects and Contact, and
  that About is at 6. Its address table and examples MUST use `work-with-me` and
  `/work-with-me/` where they used `services` and `/services/`, with the front-matter example
  showing the title "Work with me" at position 2.
- **FR-014**: The merged page MUST have the title "Work with me" (page heading and browser tab)
  and one meta description covering both the work Don is considering and his talks, wording for
  Don to review. While it is a draft it is marked not to be indexed by search engines, like every
  draft page today.
- **FR-015**: The visual checks that show the header menu MUST be refreshed to the six-entry menu
  for every platform and theme they cover. No other visual check's image may change.
- **FR-016**: The pull request MUST be flagged as a major change (navigation) under Constitution
  Principle III. Before approving, Don checks on the preview deployment: the desktop menu row, the
  open phone menu, the merged page, and the not-found page at `/services/` and `/speaking/`.

### Key Entities

- **Offering**: one thing Don offers, with a title and a short description. Today there are six:
  three kinds of work and three talk topics.
- **Offering group**: a titled set of offerings on the page ("Kinds of work", "Talk topics").
- **Work with me page**: the single page at `/work-with-me/` that holds both offering groups and
  the supporting blocks (how Don works, what he does not do, past talks, event-organizer material,
  call to action).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six offerings, in two titled groups, the four supporting blocks, the photo and
  one contact call to action are on one page, and a visitor reaches it from the header menu in one
  click.
- **SC-002**: The header menu has six entries, down from seven; one is "Work with me", and none is
  Services or Speaking.
- **SC-003**: Requests for `/services/` and `/speaking/` (with and without the trailing slash)
  return the not-found page with a 404 status; no redirect rule mentions either address.
- **SC-004**: Zero internal links in the built site point at `/services/` or `/speaking/`, and the
  sitemap lists neither.
- **SC-005**: The launch readiness check reports no problem caused by the removed Services and
  Speaking pages.
- **SC-006**: The merged page passes the same accessibility and performance checks every page
  template passes today.

## Assumptions

- The merged page's address is `/work-with-me/` and its title and menu label are "Work with me"
  (decided in clarification). It takes the Services page's menu position, 2.
- Both old pages are drafts and the site is not yet live under them, so removing their addresses
  without redirects is acceptable; this departs from the site's usual 301 convention by Don's
  decision. Drafts are marked not to be indexed, so search engines are not expected to hold
  either address; anyone with a bookmark to either lands on the not-found page, which Don
  accepts.
- No speaking-only content is dropped. The "Past talks" placeholder stays as it is; filling it in
  is separate content work.
- The contact page's description ("a project, a speaking engagement or a question") and the terms
  of use's mention of "consulting and speaking work" stay as they are; they describe kinds of
  enquiry, not pages.
- The merged page uses the existing page sections; no new section type, design change or new
  dependency is needed. No text gets new or changed styling, so colour contrast is unchanged from
  today's pages and is confirmed again by the accessibility check on the merged page.
- This is a **major change** under Constitution Principle III because it changes the site's
  navigation; the plan classifies it and the pull request flags it so Don checks the preview
  before approving (FR-016).
- No page, post or project other than the home page links to `/services/` or `/speaking/` today
  (confirmed by search of the content for both addresses). Outside the content, only the page
  guide, the launch check's configuration, the launch runbook, a code comment and the tests name
  them.
- Out of scope: rewriting the offering copy beyond joining the two leads and the single call to
  action, publishing the page (`draft: false`), adding past talks, and any change to the contact
  form.
