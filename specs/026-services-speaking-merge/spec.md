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
  against both pages, and some tests name both menu entries.
- The site's convention for a page that moves is a permanent (301) redirect from the old address
  to the new one, kept in the site's redirect rules (used for the old series topic addresses and
  the old Tempo privacy address).
- The sitemap lists every built page, drafts included; it is generated from the pages that
  exist, so a removed page leaves it on its own.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One place to see everything Don offers (Priority: P1)

A visitor who wants to work with Don, whether to hire him for advice, book a workshop, ask for a
plan review or invite him to speak, opens one page from the header menu and finds every offering
there, with how he works, what he will not do, the material event organizers need, and a way to
get in touch.

**Why this priority**: This is the change Don asked for. Without it nothing else in the feature
has a purpose.

**Independent Test**: Open the merged page and confirm every offering, block, the photo and the
call to action from both of today's pages appear on it, in a sensible order, under one main
heading.

**Acceptance Scenarios**:

1. **Given** the merged page, **When** a visitor reads it, **Then** they find all six offerings
   from today's two pages (advice on technology change, workshops, plan reviews, and the three
   talk topics), each with its title and description.
2. **Given** the merged page, **When** a visitor reads it, **Then** they find the "How I work",
   "What I do not do", "Past talks" and "For event organizers" content, the photo for event
   programs with its caption and alt text, and the note that Don has no consulting practice today.
3. **Given** the merged page, **When** a visitor wants to get in touch, **Then** a call to action
   takes them to the contact page.
4. **Given** the merged page with JavaScript turned off, **When** a visitor reads it, **Then**
   all of its content is readable.

---

### User Story 2 - The header menu has one entry for the merged page (Priority: P1)

A visitor scanning the header menu sees a single entry for Don's offerings instead of separate
Services and Speaking entries, and the entry is marked as the current page while they are on it.

**Why this priority**: A menu entry pointing to a page that no longer exists, or two entries for
one page, would be a visible defect the moment the merge lands.

**Independent Test**: Open any page and read the header menu; open the merged page and confirm
its entry is the only one marked current.

**Acceptance Scenarios**:

1. **Given** any page on the site, **When** a visitor opens the header menu (desktop or mobile),
   **Then** it lists Home, the merged page, Writing, Projects, About and Contact, in that order,
   with no Speaking entry.
2. **Given** the merged page, **When** it is open, **Then** its menu entry, and only that entry,
   is marked as the current page.

---

### User Story 3 - Old Speaking links still work (Priority: P2)

Someone following an old link or bookmark to the Speaking page lands on the merged page instead
of the not-found page.

**Why this priority**: The Speaking page is a draft and the site may not be widely linked yet,
but a permanent redirect is the site's convention for moved pages and costs almost nothing.

**Independent Test**: Request the old Speaking address with and without its trailing slash and
confirm a permanent redirect to the merged page.

**Acceptance Scenarios**:

1. **Given** the old address `/speaking/` (or `/speaking`), **When** it is requested, **Then**
   the site answers with a permanent (301) redirect to the merged page
   [NEEDS CLARIFICATION: should the old Speaking address land at the top of the merged page, or
   jump straight to its speaking section (for example `/services/#speaking`)?].
2. **Given** the site's sitemap, **When** it is read, **Then** it lists the merged page once and
   does not list `/speaking/`.

---

### User Story 4 - Launch checks and links follow the new structure (Priority: P2)

When Don runs the launch readiness check, or follows the launch runbook, they describe one
offerings page instead of two, and no link anywhere on the site points at the retired page.

**Why this priority**: Without this, the launch check would report a missing Speaking page that
was removed on purpose, and the runbook would send Don to edit a page that no longer exists.

**Independent Test**: Run the launch readiness check against the repository and confirm it no
longer expects a Speaking page or address; search the built site for links to `/speaking/`.

**Acceptance Scenarios**:

1. **Given** the merged structure, **When** the launch readiness check runs, **Then** it expects
   the merged page and does not report a missing Speaking page or address.
2. **Given** the built site, **When** every internal link is followed, **Then** none points at
   `/speaking/`.
3. **Given** the home page, **When** a visitor uses the introduction card's "See how I can help"
   button, **Then** it opens the merged page.

---

### Edge Cases

- A request for an address below the old Speaking page (for example `/speaking/anything/`) is
  not redirected; there were never pages there, so it gets the not-found page as it does today.
- The photo of Don is used both on the home page and on the event-organizer section; it stays
  available to both.
- The menu position freed by Speaking (3) is not taken by anything else; the remaining menu order
  is unchanged and no reserved position moves.
- The merged page stays a draft, with the draft notice, exactly as both pages are today. Going
  live remains Don's decision through the launch runbook.
- The merged page must not repeat the main heading or show two competing lead paragraphs; it has
  one title, one lead, and section headings below it.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST have one page that presents every offering from today's Services and
  Speaking pages: the three kinds of work and the three talk topics, each with its current title
  and description. It is published at `/services/` under the title and menu label "Services"
  [NEEDS CLARIFICATION: keep the "Services" name and `/services/` address, or give the merged page
  a new name and address that covers speaking too (for example "Work with me" at
  `/work-with-me/`, with both old addresses redirected)?].
- **FR-002**: The merged page MUST keep the rest of both pages' content: the no-practice-today
  note, the "How I work" and "What I do not do" blocks, the "Past talks" block, the "For event
  organizers" block with the bio, and the photo for event programs with its caption and alt text.
  Wording may be joined or trimmed only where the two pages repeat each other (for example two lead
  paragraphs becoming one); every change to copy is Don's to review.
- **FR-003**: The offerings MUST be presented [NEEDS CLARIFICATION: as two titled groups on the one
  page (kinds of work, then talks), or as one combined list of all six offerings?].
- **FR-004**: The merged page MUST end with a call to action that links to the contact page and
  speaks to both kinds of enquiry (a project and a speaking invitation).
- **FR-005**: The Speaking page MUST no longer exist as its own page, and the header menu MUST NOT
  list it. The menu order of the remaining entries MUST stay Home, Services, Writing, Projects,
  About, Contact.
- **FR-006**: Requests for `/speaking/` and `/speaking` MUST answer with a permanent (301)
  redirect to the merged page, using the site's existing redirect rules.
- **FR-007**: The sitemap MUST list the merged page and MUST NOT list `/speaking/`.
- **FR-008**: Internal links on the site MUST NOT point at `/speaking/`. The home page's
  introduction call to action MUST lead to the merged page.
- **FR-009**: The launch readiness check and its configuration MUST expect the merged page and
  MUST NOT expect a Speaking page or address. The launch runbook MUST describe the merged page
  instead of two pages.
- **FR-010**: The merged page MUST stay a draft, showing the draft notice, until Don publishes it.
- **FR-011**: The merged page MUST meet the site's existing page standards: WCAG 2.2 AA, the
  performance budget, readable with JavaScript off, and the header and menu behaviour every page
  template has. The per-template checks MUST cover the merged page and MUST no longer list a
  Speaking template.
- **FR-012**: The page guide for editors MUST still describe the menu positions correctly once
  position 3 is free.

### Key Entities

- **Offering**: one thing Don offers, with a title and a short description. Today there are six:
  three kinds of work and three talk topics.
- **Merged offerings page**: the single page that holds all offerings and the supporting blocks
  (how Don works, what he does not do, past talks, event-organizer material, call to action).
- **Redirect rule**: a permanent mapping from the retired Speaking address to the merged page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six offerings, the four supporting blocks, the photo and a contact call to
  action are on one page, and a visitor reaches any of them from the header menu in one click.
- **SC-002**: The header menu has six entries, down from seven, and none of them is Speaking.
- **SC-003**: 100% of requests to the old Speaking address (with or without the trailing slash)
  reach the merged page through a permanent redirect; none end on the not-found page.
- **SC-004**: Zero internal links in the built site point at `/speaking/`, and the sitemap lists
  no `/speaking/` entry.
- **SC-005**: The launch readiness check reports no problem caused by the removed Speaking page.
- **SC-006**: The merged page passes the same accessibility and performance checks every page
  template passes today.

## Assumptions

- `/services/` survives as the merged page's address unless the clarify phase decides otherwise:
  the home page button, the editor guide's examples and the launch runbook already point there,
  and it holds the earlier menu position.
- A permanent (301) redirect in the site's redirect rules is how a retired address is handled,
  matching the existing series and Tempo redirects.
- No speaking-only content is dropped. The "Past talks" placeholder stays as it is; filling it in
  is separate content work.
- The contact page's description ("a project, a speaking engagement or a question") and the terms
  of use's mention of "consulting and speaking work" stay as they are; they describe kinds of
  enquiry, not pages.
- The merged page uses the existing page sections; no new section type, design change or new
  dependency is needed.
- This is a **major change** under Constitution Principle III because it changes the site's
  navigation; the plan classifies it and the pull request flags it so Don checks the preview
  before approving.
- No other page, post or project links to `/speaking/` today (confirmed by search of the content).
- Out of scope: rewriting the offering copy, publishing the page (`draft: false`), adding past
  talks, and any change to the contact form.
