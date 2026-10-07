# Feature Specification: Page visibility and draft flags, file-driven navigation

**Feature Branch**: `029-page-visible-draft`

**Created**: 2026-10-07

**Status**: Draft

**Input**: User description: "update the way pages are deployed to have a visible true/false AND a draft true/false. The visible notice will determine inclusion in the live site. The draft flag will determine the extent (fully published vs draft notice + noindex + removed from site map but still included in navigation. The we should also remove the fixedPrimaryNavigation object and use only the files and their built in flags and navigation order. If a file is included in the footerNavigation object, it would be excluded from the header, otherwise header is the default."

## Background: how pages work today

"Pages" are the standalone page files (home, About, Work with me, Contact, Privacy policy, Terms
of use, Technology, and the Tempo app privacy page under `/privacy/tempo/`). Each file becomes
one address on the site. Posts and project stories are separate collections with their own
draft rules and are not part of this feature.

- A page has one flag, `draft`. A draft page is still built and published on every build,
  production included. It shows a visible draft notice, asks search engines not to index it,
  and is left out of the sitemap. There is no way to keep a page off the live site.
- The header navigation is assembled from two sources: page files that declare a navigation
  position (today Home 1, Work with me 2, About 6), and a fixed list kept in code for
  Writing (4), Projects (5) and Contact (7). Writing and Projects are landing pages built by
  code routes rather than page files; Contact is a page file but gets its header entry from the
  fixed list. Two entries with one position fail the build.
- The footer links (Privacy policy, Terms of use, Technology) are a separate fixed list in
  code. A page in the footer list could also ask for a header position; nothing stops both.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep a page off the live site (Priority: P1)

Don marks a page as not visible while he works on it. The live site does not have the page at
all: no address, no header or footer link, no sitemap entry. When he marks it visible again,
it appears on the next production deploy.

**Why this priority**: Today a draft page is always public, only labelled. This is the one
capability the site has no way to express, and it blocks writing pages ahead of launch.

**Independent Test**: Mark one page not visible, run a production build, and confirm the
address is not served, no navigation links to it, and the sitemap does not list it.

**Acceptance Scenarios**:

1. **Given** a page marked not visible, **When** the production site is built, **Then** the
   page's address returns the not-found page, and no header link, footer link or sitemap entry
   points to it.
2. **Given** a page marked visible, **When** the production site is built, **Then** the page
   is built and behaves according to its draft flag (User Story 2).
3. **Given** a page with no visibility setting, **When** the site is built, **Then** it is
   treated as visible.
4. **Given** a page marked not visible, **When** a preview (non-production) build runs,
   **Then** [NEEDS CLARIFICATION: is a not-visible page built on preview deployments (so Don
   can review it there, as draft posts and projects are), or left out of every build?
   Suggested default: built on previews with the draft notice and noindex, left out of
   production only.]

---

### User Story 2 - Publish a visible page as a draft (Priority: P1)

Don marks a visible page as a draft. It is on the live site and in the navigation, so people
can reach it, but it carries a visible draft notice, asks search engines not to index it, and
is not in the sitemap. When he clears the draft flag, the page becomes fully published: no
notice, indexable, listed in the sitemap.

**Why this priority**: This is today's draft behaviour; it must keep working unchanged under
the new two-flag model.

**Independent Test**: Build with one visible draft page and one visible non-draft page and
compare notice, noindex, sitemap and navigation for each.

**Acceptance Scenarios**:

1. **Given** a visible page marked draft, **When** the site is built, **Then** the page shows
   the draft notice, carries a noindex instruction, is absent from the sitemap, and still
   appears in the header or footer navigation where it belongs.
2. **Given** a visible page not marked draft, **When** the site is built, **Then** the page
   has no draft notice, no noindex instruction, and is listed in the sitemap.
3. **Given** a page with no draft setting, **When** the site is built, **Then** it is treated
   as not a draft (fully published).
4. **Given** a page marked not visible and also marked draft, **When** the production site is
   built, **Then** visibility wins: the page is left out entirely.

---

### User Story 3 - Header navigation comes only from the pages themselves (Priority: P2)

Don controls the header by editing pages, not a separate list in code. Every visible page
appears in the header by default, in the order given by its navigation position, unless it is
one of the footer pages. The fixed list of header entries in code is gone.

**Why this priority**: Removes a second place to keep in step, but the site works without it.

**Independent Test**: Add a new visible page with a navigation position and confirm it appears
in the header at that position with no other edit; move a page into the footer list and
confirm it leaves the header.

**Acceptance Scenarios**:

1. **Given** a visible page that is not in the footer list, **When** the site is built,
   **Then** the page appears in the header at its navigation position, with its navigation
   label or, when it has none, its title.
2. **Given** a page that is in the footer list, **When** the site is built, **Then** it appears
   in the footer and not in the header, even if it declares a navigation position.
3. **Given** a page marked not visible, **When** the production site is built, **Then** it
   appears in neither the header nor the footer.
4. **Given** the Writing and Projects landing pages, **When** the site is built, **Then** they
   appear in the header in their current places, with their visibility, draft state and
   position declared in the same way as any page file. [NEEDS CLARIFICATION: Writing and
   Projects are built by code routes, not page files. Where do their header settings live once
   the fixed list is gone? Suggested default: each gets the same visible/draft/navigation
   settings declared alongside its route in the content files, so the header is still built
   from files only; their own lists of posts and projects are unchanged.]
5. **Given** two header pages with the same navigation position, **When** the site is built,
   **Then** the build fails with an error naming both files.
6. **Given** the header after this change, **When** the production site is built from today's
   content, **Then** the header shows the same entries in the same order as before (Home,
   Work with me, Writing, Projects, About, Contact, subject to each page's visibility).

---

### User Story 4 - Pages that belong in no menu (Priority: P3)

Some visible pages, such as the Tempo app privacy page, are reached by direct link and belong
in neither the header nor the footer.

**Why this priority**: Only one page needs it today, but making "header by default" literal
would put that page in the header.

**Independent Test**: Build and confirm the Tempo privacy page is served but not linked from
the header or footer.

**Acceptance Scenarios**:

1. **Given** the Tempo app privacy page, **When** the site is built, **Then** it is served and
   listed in the sitemap but appears in neither the header nor the footer.
   [NEEDS CLARIFICATION: how does a page say it belongs in no menu? Suggested default: a page
   with no navigation position and not in the footer list is in no menu; "header by default"
   then means any visible page that gives a position is in the header unless it is a footer
   page. Alternative: an explicit opt-out setting, with pages lacking a position failing the
   build.]

---

### Edge Cases

- A footer-list entry names a page that is marked not visible: on production the footer link
  is left out rather than pointing at a missing page.
- A footer-list entry names an address that has no page file: the build fails with a clear
  error naming the entry.
- The home page is marked not visible: the build fails with a clear error, because the site
  cannot go live without a home page.
- The Contact page is marked not visible: the contact page and its header link are left out;
  links to it from other pages are the author's responsibility (out of scope here).
- A page sets visibility or draft to something other than true or false: the build fails with
  a clear error naming the file.
- A not-visible page's images: they are not shipped on the production build, as with draft
  projects today.
- The not-found page uses the same header and footer as every other page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every page MUST accept two independent true/false settings: `visible` and
  `draft`. `visible` defaults to true; `draft` defaults to false.
- **FR-002**: A page marked not visible MUST be left out of the production site entirely: no
  built address, no header or footer link, no sitemap entry, and none of its own images
  shipped.
- **FR-003**: A visible page marked draft MUST be built with a visible draft notice and a
  noindex instruction, MUST be left out of the sitemap, and MUST still appear in the header or
  footer where it belongs.
- **FR-004**: A visible page not marked draft MUST be fully published: no draft notice, no
  noindex instruction, listed in the sitemap.
- **FR-005**: The fixed list of header entries in code MUST be removed. The header MUST be
  built only from the page settings (visibility, footer membership and navigation position).
- **FR-006**: A visible page MUST appear in the header at its navigation position unless it is
  in the footer list. A page in the footer list MUST NOT appear in the header.
- **FR-007**: The footer list MUST remain the one place that says which pages are footer
  links, in the order it gives. Its entries for not-visible pages MUST be left out of the
  production footer.
- **FR-008**: The Writing and Projects landing pages MUST take part in the header on the same
  terms as page files (see User Story 3, scenario 4).
- **FR-009**: Two header pages with one navigation position MUST fail the build with an error
  naming both files.
- **FR-010**: Invalid settings (non-boolean flags, a not-visible home page, a footer entry with
  no page) MUST fail the build with a plain-language error naming the file.
- **FR-011**: With today's content (all pages visible, current draft flags), the production
  header, footer, sitemap and draft notices MUST be the same as before the change.
- **FR-012**: Posts and project stories keep their existing draft behaviour; this feature does
  not change them.

### Key Entities

- **Page**: one standalone page file. Settings: title, optional navigation position and label,
  `visible` (default true), `draft` (default false).
- **Footer list**: the ordered list of pages linked from the footer. Membership removes a page
  from the header.
- **Header navigation**: derived, never hand-listed: every visible page with a position that is
  not in the footer list, plus the Writing and Projects landing pages, ordered by position.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Don can take a page off the live site, or put it back, by changing one setting in
  that page's file, with no other edit.
- **SC-002**: Don can add a page to the header, or move it between header and footer, by
  editing at most two places (the page file and, for the footer, the footer list).
- **SC-003**: On a production build, 0 not-visible pages are reachable, linked or listed in the
  sitemap.
- **SC-004**: On a production build, 100% of visible draft pages show the notice, carry noindex,
  are absent from the sitemap and are present in the navigation.
- **SC-005**: Building today's content produces the same header, footer and sitemap as before.

## Assumptions

- "Live site" means the production build. Preview builds follow FR-002 only as decided in
  User Story 1, scenario 4.
- Missing settings take the defaults in FR-001, so existing page files need no edit to keep
  working.
- The footer list stays in code as a list of pages; only the header's fixed list is removed.
- The social links in the footer are unchanged.
- The navigation label rule (label if given, else title) and the position-clash error are kept
  from today.
- Changing how the header is built is a navigation change, so it is a major change under
  Constitution Principle III and is flagged in the pull request.
- Out of scope: visibility for individual posts and project stories, and checking links inside
  page bodies that point at not-visible pages.
