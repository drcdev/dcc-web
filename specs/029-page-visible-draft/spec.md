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

1. **Given** a page marked not visible, **When** the production site is built, **Then** a
   request for the page's address is answered with HTTP status 404 and the site's not-found
   page, and no header link, footer link or sitemap entry points to it.
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
2. **Given** a visible page not marked draft, **When** the production site is built, **Then**
   the page has no draft notice, no noindex instruction, and is listed in the sitemap. (On a
   non-production build it has no draft notice and is listed in that build's sitemap, but
   carries noindex like every page of that build; see FR-004.)
3. **Given** a page with no draft setting, **When** the site is built, **Then** it is treated
   as not a draft (fully published).
4. **Given** a page marked not visible and also marked draft, **When** any site is built,
   **Then** visibility wins: on the production build the page is left out entirely, and on a
   non-production build it is treated exactly as a not-visible page that is not a draft
   (User Story 1, scenario 4). The draft flag changes nothing for a not-visible page.

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
   production site is built, **Then** the header shows exactly, in this order: Home (`/`),
   Work with me (`/work-with-me/`), Writing (`/writing/`), Projects (`/projects/`), About
   (`/about/`), Contact (`/contact/`); and the footer page links are exactly, in this order:
   Privacy policy (`/privacy-policy/`), Terms of use (`/terms-of-use/`), Technology
   (`/technology/`), followed by the unchanged social links.

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

The build-error rows (V1 to V12) are those in
[contracts/page-settings.md](./contracts/page-settings.md) "Build errors".

- A page with a menu location is marked not visible: on production its menu link is left out
  rather than pointing at a missing page.
- The home page is marked not visible: every build (preview, local dev and production) fails
  with a clear error, because the site cannot go live without a home page (V5). The home page
  may be a draft (it is one today); only `visible: false` is refused.
- The Contact page is marked not visible: the contact page and its header link are left out;
  links to it from other pages are the author's responsibility (out of scope here, a known
  limitation, not a guarantee).
- A page sets `visible` or `draft` to anything other than the unquoted YAML words `true` or
  `false` (including a quoted `"true"`, a number such as `0` or `1`, a word such as `no`, or an
  empty value): the build fails naming the file and the setting (V1).
- A page sets a location other than "header" or "footer": the build fails naming the file and
  `location` (V2).
- A page gives a position but no location, or an empty `nav` (no keys): the build fails naming
  the file and the missing setting (V3). A location with no position fails the same way (V4).
- A page gives a position that is not a whole number from 1 (zero, negative, fractional or
  text): the build fails naming the file and `position`, as today. There is no upper limit.
- A page gives an empty or whitespace-only `label`: the build fails naming the file and
  `label`, as today.
- Two pages in one menu share a position (V6), or two entries in one menu would show the same
  link text (V11): the build fails naming both files.
- The Writing or Projects landing page file sets `visible`, `draft`, `description` or any key
  other than `title` and `nav`: the build fails naming the file and the key, because these
  pages are always visible and published (V7).
- The Writing or Projects landing page file has a body (V8), has no `nav` (V10), or puts
  itself in the footer (V12): the build fails naming the file.
- The Writing or Projects landing page file is missing: the build fails naming the missing
  file (V9).
- A not-visible page's images: they are not shipped on the production build, as with draft
  projects today (FR-002).
- The not-found page uses the same header and footer as every other page of that build, so on
  production its menus also leave out not-visible pages.
- Every page in the footer is not visible on a production build: the footer shows no page
  links (and no empty list); its site name, copyright, theme switch and social links are
  unchanged. The header cannot be empty, because the Writing and Projects landing pages are
  always visible and always in the header.
- A redirect in the site's redirect rules (for example the old Tempo privacy addresses, which
  point at `/privacy/tempo/`) targets a page marked not visible: on production the redirect
  still answers and leads to the not-found page (404). The build does not check redirect
  targets against visibility; keeping them pointed at visible pages is the author's
  responsibility (known limitation, follow-up).
- A page is changed from not visible to visible, or from draft to published (or back): the
  change takes effect on the next production deploy and on no earlier one. Each build
  produces its output from scratch and the deploy replaces the whole site, so no page, link,
  sitemap entry or image from the earlier state remains. (Search engines may keep an old
  copy until they next crawl; that is outside the site's control.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every page MUST accept two independent true/false settings: `visible` and
  `draft`. `visible` defaults to true; `draft` defaults to false. When a page is not visible,
  its draft setting has no effect on any build (visibility wins).
- **FR-002**: A page marked not visible MUST be left out of the production site entirely: no
  HTML file for its address in the build output (a request for the address gets HTTP 404 and
  the site's not-found page), no header or footer link on any built page, no sitemap entry,
  and no image file in the build output that only it uses (an image also used by a built page
  stays). No other generated output refers to standalone pages today (the feed lists posts
  only; the site has no search index or structured data; a page's sharing image is its own
  image or the site default), so nothing else needs excluding. On every non-production build
  (FR-014) it MUST be built with the draft notice and a noindex instruction, left out of the
  sitemap, and shown in its menu.
- **FR-003**: A visible page marked draft MUST be built with the draft notice and a noindex
  instruction, MUST be left out of the sitemap, and MUST still appear in its menu, on every
  build.
- **FR-003a** (draft notice): The draft notice is today's notice, unchanged. It reads
  "**Draft.** This page is a placeholder and will change." It is plain static text (a
  paragraph: no alert or live-region role, no heading, no landmark, not focusable) at the top
  of the page's content, after the page heading (or the home page's introduction) in reading
  order. It is in the built HTML, so it shows with JavaScript off, and its meaning is carried
  by its words, not by colour. Its text meets 4.5:1 contrast in both light and dark themes;
  its border and background are decorative (the words carry the meaning), so the 3:1
  non-text contrast rule does not apply to them. A not-visible page on a non-production build shows exactly the same notice,
  with the same wording, as a visible draft page.
- **FR-003b** (noindex): The noindex instruction is a `<meta name="robots" content="noindex">`
  tag in the page's head, as today. No per-page response header is added. Draft pages, and
  not-visible pages on non-production builds, keep their canonical link to their own address,
  as draft pages do today. `robots.txt` is unchanged: it allows all crawling, so crawlers can
  read the noindex tag.
- **FR-004**: On the production build, a visible page not marked draft MUST be fully
  published: no draft notice, no noindex instruction, listed in the sitemap. On a
  non-production build the same page has no draft notice and is listed in that build's
  sitemap, but carries the noindex tag, because today every page of a non-production build
  does (the build is not indexable; the preview host also sends an `X-Robots-Tag: noindex`
  header). This feature does not change that.
- **FR-005**: The fixed list of header entries and the footer list in code MUST both be
  removed: no source file outside the page files names a header or footer page link's label,
  position or menu. The only page addresses left in code are the two landing routes'
  addresses (`/writing/`, `/projects/`), which name where those routes are built, not menu
  settings. The header and footer MUST be built only by the rule in FR-006.
- **FR-006**: A page's navigation settings MUST accept a `location` of "header" or "footer". A
  menu MUST contain exactly the entries that are in this build (every visible page; on a
  non-production build, also every not-visible page) plus the two landing page files, whose
  location names that menu, ordered by position (lowest first). A page with no location MUST
  appear in no menu. Positions need not be consecutive; because they are unique within a menu
  (FR-009), the order is never ambiguous. Each entry's link text is its label, or its title
  when it has no label.
- **FR-006a** (menu markup and accessibility): The menus keep today's markup.
  - The header links sit in the page's one navigation landmark (`<nav aria-label="Main">`
    inside the header), whose first link is the site name, so the landmark is never empty.
    The footer page links stay a plain list inside the footer (contentinfo) landmark, with no
    second navigation landmark, as today.
  - Links appear in the HTML in position order, so reading order and Tab order follow
    position. A link that is not in a build is absent from the HTML, never hidden with CSS.
  - In the header, the link to the current page carries `aria-current="page"`, and the
    Writing and Projects links carry `aria-current="true"` on every address inside their
    section; the current link is shown by an underline as well as colour. A page that is not
    in the header (such as the Tempo privacy page) marks no header link, apart from that
    section rule. Footer links mark no current page, as today.
  - Menu links are plain links with today's visible focus style and spacing, which pass the
    WCAG 2.2 AA target-size check at phone width. The narrow-screen menu (the Menu button and
    collapsible list) works the same whatever the number of header entries.
  - A menu with no entries in a build renders no link list. Only the footer can be empty
    (see Edge Cases).
- **FR-007**: A page with a location MUST give a position, and a page with a position MUST give
  a location; otherwise the build MUST fail with an error naming the file. A position is a
  whole number from 1.
- **FR-008**: The Writing and Projects landing pages MUST each have a page file in the pages
  folder, `src/content/pages/writing.mdx` and `src/content/pages/projects.mdx` (`.md` also
  accepted), holding only a `title` and `nav`, read by their code routes for the header entry.
  `nav` is required and is the same object as on any page (`location`, `position`, optional
  `label`; any other key inside `nav` fails), except that its location MUST be "header". A
  body or any other setting (including `visible`, `draft` and a description) MUST fail the
  build. They are always visible and published. Their link addresses (`/writing/`,
  `/projects/`) come from their code routes, not from the files, so a file cannot point the
  menu at the wrong address. Their headings, document titles and descriptions stay in code;
  the file's `title` is used only as the menu's link text when there is no label, and may
  differ from the heading. These two file names are reserved for landing files: the general
  page route never builds an address from them (this replaces their "reserved for a later
  feature" status in the standalone-pages contract, row 14).
- **FR-009**: Two pages in the same menu with one position MUST fail the build with an error
  naming both files (in file-path order), the menu and the position, and saying to change the
  position in one of them. When three or more share a position, the build stops at the first
  pair in file-path order; the next build reports any that remain.
- **FR-009a**: Two entries in the same menu whose link text (label, or title when there is no
  label) is the same, ignoring case and surrounding spaces, MUST fail the build with an error
  naming both files and the text, so every link name in a menu is unique.
- **FR-010**: Invalid settings (non-boolean flags, an unknown location, a not-visible home
  page on any build, a missing landing page file, and the other cases in Edge Cases) MUST fail
  the build with a plain-language error. Every error names the file path (both paths for a
  clash, the missing path for a missing landing file) and the setting involved. Errors from
  the content schema use Astro's content error format, which names the file, the setting and
  the expected value, and list every schema problem in that file at once. Errors from the
  site's own checks (home page visibility, landing body, missing landing file, menu clashes)
  use today's form, "Page file <path>: <problem>. <what to change>". Every error stops the
  build; a writer fixes it and builds again, and the next build reports the next problem.
- **FR-011**: With today's content (all pages visible, current draft flags, menu settings
  moved into the page files), the production header, footer, sitemap and draft notices MUST be
  the same as the production build of `main` before the change: the same header and footer
  link texts and addresses in the same order (User Story 3, scenario 7), the same sitemap
  address list, and the draft notice on the same pages.
- **FR-012**: Posts and project stories keep their existing draft behaviour; this feature does
  not change them. They share the build-type rule (FR-014) and the production image pruning
  with pages; both keep working for posts and projects exactly as today. The sitemap rule
  differs by design and stays as it is: a draft post or project is not built on production at
  all, while a draft page is built on every build, so the sitemap leaves draft and not-visible
  pages out by their addresses on every build.
- **FR-013**: The not-found page MUST keep today's structure on every build: the same header
  and footer as other pages of that build, one main landmark, one level-one heading "Page not
  found", the document title "Page not found · <site name>", `lang="en"`, no canonical link and
  noindex, whatever address was requested.
- **FR-014** (build type): The production build is a Cloudflare Workers Builds build of
  `main`: the build environment says it is a Workers Builds build (`WORKERS_CI` is `1`) and the
  branch is `main`. Every other build (branch previews, local dev, local and CI builds, the
  test servers) is non-production. When the Workers Builds signal is present but the branch
  cannot be read, the build counts as production for visibility (not-visible pages are left
  out) and as not indexable (every page carries noindex): it fails safe on both counts, as it
  does for draft posts and projects today. With no Workers Builds signal, the build is
  non-production.

### Key Entities

- **Page**: one standalone page file. Settings: title, `visible` (default true), `draft`
  (default false), and optional navigation settings: `location` ("header" or "footer"),
  position, label.
- **Landing page file**: the page file for Writing or Projects. Holds a title and navigation
  settings (location always "header") only, with no body; its address, heading and description
  are built by a code route.
- **Header / footer navigation**: derived, never hand-listed: the entries in this build whose
  location is that menu, ordered by position (FR-006).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Don can take a page off the live site, or put it back, by changing one setting in
  that page's file, with no other edit.
- **SC-002**: Don can add a page to a menu, move it between header and footer, or take it out of
  every menu by editing only that page's file.
- **SC-003**: On a production build, 0 not-visible pages are reachable, linked or listed in the
  sitemap. Measured over the build output: no HTML file exists for a not-visible page's
  address, no built HTML file has a header or footer link to it, and the sitemap does not list
  it. (The build output is the full set of reachable addresses, apart from the redirect rules,
  which are covered in Edge Cases.)
- **SC-004**: On a production build, 100% of visible draft page files in `src/content/pages/`
  (and in the test fixture pages) show the notice, carry noindex, are absent from the sitemap
  and are present in their menu.
- **SC-005**: Building today's content produces the same header, footer and sitemap as the
  production build of `main` before the change (FR-011).
- **SC-006**: Every page template, including the Writing and Projects landing routes and the
  not-found page, passes the automated WCAG 2.2 AA accessibility checks with no new
  violations; a footer with no page links is covered by a component test that it renders no
  empty list.

## Assumptions

- "Live site" means the production build, defined in FR-014. Preview deployments and local
  dev build not-visible pages with the draft notice and noindex (FR-002), as they do draft
  projects today.
- The Tempo app privacy page is a file in the pages collection (`privacy/tempo.mdx`), so every
  setting here applies to it. Its old addresses are redirect rules, not page files; the
  settings do not reach them (see Edge Cases).
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
  follow-up; checking links inside page bodies that point at not-visible pages; and checking
  redirect targets against visibility (follow-up).
