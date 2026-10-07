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

## Clarifications

### Session 2026-10-07

- Q: Is a page marked not visible built on preview deployments, or left out of every build? → A: Built on previews. Previews and local dev build a not-visible page with the draft notice and noindex; only the production build leaves it out.
- Q: Where do the header settings for the Writing and Projects landing pages live once the fixed header list is gone? → A: Each gets a page file in the pages collection holding its navigation settings (intro copy later ruled out, see below); the code routes read it, so every menu entry comes from a page file.
- Q: Should footer membership stay as a list in code, or become a page setting? → A: A page setting. The navigation settings gain a `location` of "header" or "footer", which replaces both the fixed header list and the footer list in code. A page with no location is in no menu (this supersedes "header is the default" in the original description).
- Q: How does a visible page say it belongs in no menu? → A: By giving no location. A page in a menu must give a position; a location without a position fails the build.
- Q: Can the Writing and Projects landing pages be marked not visible or draft? → A: No. They take navigation settings only and are always visible and published; hiding a whole section is out of scope (follow-up).
- Q: What should the Writing and Projects landing page files control, beyond their header entry? → A: Menu settings only. The file holds a title and navigation settings; a body or any other setting fails the build. The landing pages' headings and descriptions stay in code.
- Q: Should marking the home page not visible fail every build, or only the production build? → A: Every build. Previews, local dev and production all refuse a home page marked not visible.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep a page off the live site (Priority: P1)

Don marks a page as not visible while he works on it. The live site does not have the page at
all: no address, no header or footer link, no sitemap entry. He can still review it on a
preview deployment. When he marks it visible again, it appears on the next production deploy.

**Why this priority**: Today a draft page is always public, only labelled. This is the one
capability the site has no way to express, and it blocks writing pages ahead of launch.

**Independent Test**: Mark one page not visible, run a production build, and confirm the
address is not served, no navigation links to it, and the sitemap does not list it; run a
preview build and confirm the page is built with the draft notice and noindex.

**Acceptance Scenarios**:

1. **Given** a page marked not visible, **When** the production site is built, **Then** the
   page's address returns the not-found page, and no header link, footer link or sitemap entry
   points to it.
2. **Given** a page marked visible, **When** the production site is built, **Then** the page
   is built and behaves according to its draft flag (User Story 2).
3. **Given** a page with no visibility setting, **When** the site is built, **Then** it is
   treated as visible.
4. **Given** a page marked not visible, **When** a preview deployment or local dev build runs,
   **Then** the page is built with the draft notice and a noindex instruction, is absent from
   the sitemap, and appears in its menu (if it gives a location) so Don can review it, as draft
   projects are today.

---

### User Story 2 - Publish a visible page as a draft (Priority: P1)

Don marks a visible page as a draft. It is on the live site and in its menu, so people can
reach it, but it carries a visible draft notice, asks search engines not to index it, and is
not in the sitemap. When he clears the draft flag, the page becomes fully published: no
notice, indexable, listed in the sitemap.

**Why this priority**: This is today's draft behaviour; it must keep working unchanged under
the new two-flag model.

**Independent Test**: Build with one visible draft page and one visible non-draft page and
compare notice, noindex, sitemap and navigation for each.

**Acceptance Scenarios**:

1. **Given** a visible page marked draft, **When** the site is built, **Then** the page shows
   the draft notice, carries a noindex instruction, is absent from the sitemap, and still
   appears in the header or footer if it gives a location.
2. **Given** a visible page not marked draft, **When** the site is built, **Then** the page
   has no draft notice, no noindex instruction, and is listed in the sitemap.
3. **Given** a page with no draft setting, **When** the site is built, **Then** it is treated
   as not a draft (fully published).
4. **Given** a page marked not visible and also marked draft, **When** the production site is
   built, **Then** visibility wins: the page is left out entirely.

---

### User Story 3 - Menus come only from the page files (Priority: P2)

Don controls the header and footer by editing pages, not lists in code. Each page's navigation
settings say which menu it is in (`location`: header or footer), its position in that menu and,
optionally, its label. The fixed header list and the footer list in code are gone. The Writing
and Projects landing pages each get a page file that holds their title and navigation settings
only, which their code routes read for the header entry.

**Why this priority**: Removes a second place to keep in step, but the site works without it.

**Independent Test**: Add a new visible page with location "header" and a position and confirm
it appears in the header at that position with no other edit; change its location to "footer"
and confirm it moves to the footer at its position; remove its location and confirm it is in
no menu.

**Acceptance Scenarios**:

1. **Given** a visible page with location "header" and a position, **When** the site is built,
   **Then** it appears in the header at that position, with its navigation label or, when it
   has none, its title.
2. **Given** a visible page with location "footer" and a position, **When** the site is built,
   **Then** it appears in the footer at that position and not in the header.
3. **Given** a page marked not visible, **When** the production site is built, **Then** it
   appears in neither the header nor the footer, whatever its location.
4. **Given** the Writing and Projects landing pages, **When** the site is built, **Then** each
   takes its header entry (location, position, label) from its own page file in the pages
   collection; its address is still built by its code route, and its lists of posts and
   projects are unchanged.
5. **Given** two pages in the same menu with the same position, **When** the site is built,
   **Then** the build fails with an error naming both files. The same position in different
   menus is allowed.
6. **Given** a page with a location but no position, or a position but no location, **When**
   the site is built, **Then** the build fails with an error naming the file.
7. **Given** today's content with its menu settings moved into the page files, **When** the
   production site is built, **Then** the header shows Home, Work with me, Writing, Projects,
   About, Contact and the footer shows Privacy policy, Terms of use, Technology, in the same
   order as before.

---

### User Story 4 - Pages that belong in no menu (Priority: P3)

Some visible pages, such as the Tempo app privacy page, are reached by direct link and belong
in neither the header nor the footer.

**Why this priority**: Only one page needs it today.

**Independent Test**: Build and confirm the Tempo privacy page is served but not linked from
the header or footer.

**Acceptance Scenarios**:

1. **Given** a visible page with no navigation location, such as the Tempo app privacy page,
   **When** the site is built, **Then** it is served and listed in the sitemap (unless it is a
   draft) but appears in neither the header nor the footer.

---

### Edge Cases

- A page with a menu location is marked not visible: on production its menu link is left out
  rather than pointing at a missing page.
- The home page is marked not visible: every build (preview, local dev and production) fails
  with a clear error, because the site cannot go live without a home page.
- The Contact page is marked not visible: the contact page and its header link are left out;
  links to it from other pages are the author's responsibility (out of scope here).
- A page sets visibility or draft to something other than true or false, or a location other
  than "header" or "footer": the build fails with a clear error naming the file.
- The Writing or Projects landing page file sets `visible: false` or `draft: true`: the build
  fails with a clear error, because these pages are always visible and published.
- The Writing or Projects landing page file is missing: the build fails with a clear error.
- The Writing or Projects landing page file has a body, or any setting other than its title and
  navigation settings: the build fails with a clear error naming the file.
- A not-visible page's images: they are not shipped on the production build, as with draft
  projects today.
- The not-found page uses the same header and footer as every other page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every page MUST accept two independent true/false settings: `visible` and
  `draft`. `visible` defaults to true; `draft` defaults to false.
- **FR-002**: A page marked not visible MUST be left out of the production site entirely: no
  built address, no header or footer link, no sitemap entry, and none of its own images
  shipped. On preview deployments and local dev it MUST be built with the draft notice and a
  noindex instruction, left out of the sitemap, and shown in its menu.
- **FR-003**: A visible page marked draft MUST be built with a visible draft notice and a
  noindex instruction, MUST be left out of the sitemap, and MUST still appear in its menu.
- **FR-004**: A visible page not marked draft MUST be fully published: no draft notice, no
  noindex instruction, listed in the sitemap.
- **FR-005**: The fixed list of header entries and the footer list in code MUST both be
  removed. The header and footer MUST be built only from page files' settings (visibility and
  navigation location, position and label).
- **FR-006**: A page's navigation settings MUST accept a `location` of "header" or "footer". A
  page with location "header" appears only in the header and one with "footer" only in the
  footer, each menu ordered by position. A page with no location MUST appear in no menu.
- **FR-007**: A page with a location MUST give a position, and a page with a position MUST give
  a location; otherwise the build MUST fail with an error naming the file.
- **FR-008**: The Writing and Projects landing pages MUST each have a page file in the pages
  collection holding only a title and navigation settings, read by their code routes for the
  header entry. A body or any other setting (including `visible`, `draft` and a description)
  MUST fail the build. They are always visible and published, and their headings and
  descriptions stay in code.
- **FR-009**: Two pages in the same menu with one position MUST fail the build with an error
  naming both files.
- **FR-010**: Invalid settings (non-boolean flags, an unknown location, a not-visible home
  page on any build, a missing landing page file) MUST fail the build with a plain-language error naming the
  file.
- **FR-011**: With today's content (all pages visible, current draft flags, menu settings
  moved into the page files), the production header, footer, sitemap and draft notices MUST be
  the same as before the change.
- **FR-012**: Posts and project stories keep their existing draft behaviour; this feature does
  not change them.

### Key Entities

- **Page**: one standalone page file. Settings: title, `visible` (default true), `draft`
  (default false), and optional navigation settings: `location` ("header" or "footer"),
  position, label.
- **Landing page file**: the page file for Writing or Projects. Holds a title and navigation
  settings only, with no body; its address, heading and description are built by a code route.
- **Header / footer navigation**: derived, never hand-listed: the visible pages whose location
  is that menu, ordered by position.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Don can take a page off the live site, or put it back, by changing one setting in
  that page's file, with no other edit.
- **SC-002**: Don can add a page to a menu, move it between header and footer, or take it out of
  every menu by editing only that page's file.
- **SC-003**: On a production build, 0 not-visible pages are reachable, linked or listed in the
  sitemap.
- **SC-004**: On a production build, 100% of visible draft pages show the notice, carry noindex,
  are absent from the sitemap and are present in their menu.
- **SC-005**: Building today's content produces the same header, footer and sitemap as before.

## Assumptions

- "Live site" means the production build. Preview deployments and local dev build not-visible
  pages with the draft notice and noindex (FR-002), as they do draft projects today.
- Missing `visible` and `draft` settings take the defaults in FR-001. Pages in a menu today
  (Home, Work with me, About, Contact, Privacy policy, Terms of use, Technology) get a location
  and position in their files as part of this change; Writing and Projects get new page files.
- The social links in the footer are unchanged and stay in code.
- The navigation label rule (label if given, else title) and the position-clash error are kept
  from today, with positions now unique within each menu.
- Changing how the header and footer are built is a navigation change, so it is a major change
  under Constitution Principle III and is flagged in the pull request.
- Out of scope: visibility for individual posts and project stories; hiding a whole section
  (the Writing or Projects landing page together with its posts or projects), noted as a
  follow-up; and checking links inside page bodies that point at not-visible pages.
