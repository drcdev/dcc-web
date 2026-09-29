# Feature Specification: Standalone pages for doncoleman.ca

**Feature Branch**: `003-standalone-pages`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Standalone pages for doncoleman.ca — let Don create and edit the site's standalone pages as text files, without writing code for each page. Launch pages with placeholder content: Home (with an introduction card in the style of the current home page), Services, Speaking, About, Privacy policy, Terms of use and Technology. Existing addresses are kept; the cookie policy is folded into the privacy policy. Don adds a page by adding one text file, composes pages from a small set of reusable sections, controls each page's title, description, sharing image and navigation visibility, and gets a clear error when a page file is missing required information. Blog posts, project pages and the contact form are out of scope." (The full feature prompt, including a technical-direction section for planning, is kept with the /deliver run and is deliberately not restated here as requirements.)

## Context

The site foundation (feature 002) delivered the shell: header, navigation, footer, themes, the
not-found page and sharing metadata. Its navigation and footer already link to /services/,
/speaking/, /about/, /privacy-policy/, /terms-of-use/ and /technology/, which currently show the
not-found page. This feature builds those pages and replaces the foundation's placeholder home
page, and it sets up the way every later content feature (blog, portfolio, contact) will add
content: as text files in the repository, checked when the site is built.

Because it introduces the shared page layout and the Home introduction card, and gives pages a
say in whether they appear in navigation, it touches site-wide layout and navigation and is
treated as a major change under Constitution Principle III.

## Clarifications

### Session 2026-09-29

- Q: Should page files be able to add themselves to the header navigation, with a label and position, or should the navigation stay a fixed list in code? → A: Page files opt in; their entries are merged with the fixed Writing, Projects and Contact entries, and the build fails on duplicate positions.
- Q: On the home page, is the introduction card's call to action the page's one primary call to action, and where does it link at launch? → A: The card's call to action is the page's only primary call to action; it links to /services/ until the Contact feature switches it to /contact/.
- Q: Can Don's photo be copied from the current doncoleman.ca site for the Home card and Speaking page? → A: Yes; copy it from the current site and commit it as a site image.
- Q: Should draft (placeholder) pages be hidden from search engines until Don replaces the copy? → A: No; drafts are indexed and listed in the sitemap as normal, and the visible draft notice is the only marker.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitors can read the launch pages (Priority: P1)

A visitor follows the header or footer links, or an old link to /about/, /privacy-policy/,
/terms-of-use/ or /technology/, and reaches a real page instead of the not-found page. Each page
has a clear title, readable body text in the site's existing style, and works in both themes, on
a phone and a desktop, with a keyboard and a screen reader, and with JavaScript turned off.

**Why this priority**: Every navigation and footer link that exists today leads to a not-found
page. Filling them is the smallest change that makes the site usable, and it proves the page
layout that every other story relies on.

**Independent Test**: On a preview deployment, follow every header and footer link (except
Writing, Projects and Contact) and each preserved old address, in both themes and at phone and
desktop widths, and confirm each returns a real page with the expected title and content.

**Acceptance Scenarios**:

1. **Given** the site is built, **When** a visitor requests /services/, /speaking/, /about/,
   /privacy-policy/, /terms-of-use/ or /technology/, **Then** the page loads with a success
   status, its own title as the main heading, and its body content.
2. **Given** an old link to /about/, /privacy-policy/, /terms-of-use/ or /technology/ from the
   current site, **When** it is followed, **Then** it reaches the new page at the same address.
3. **Given** any launch page, **When** it is viewed in the dark theme and in the light theme,
   **Then** headings, body text, links and images are legible and meet the contrast minimums.
4. **Given** any launch page, **When** it is loaded with JavaScript turned off, **Then** all of
   its content is readable.
5. **Given** any launch page, **When** automated accessibility checks run on it, **Then** they
   report no violations.
6. **Given** the navigation link for Services, Speaking or About, **When** the visitor is on
   that page, **Then** that link is marked as the current page.

---

### User Story 2 - Home introduces Don and gives one next step (Priority: P1)

A visitor lands on the home page and immediately sees an introduction card, in the style of the
current doncoleman.ca home page: Don's photo, name, tagline, a short bio and his social links,
framed by the gradient border the current site uses. Below it, the page says who Don helps and
what he does, and offers one clear next step.

**Why this priority**: The home page is the most visited page and the first impression of the
practice. It replaces the foundation's placeholder home page.

**Independent Test**: Open the preview's home page in both themes at phone and desktop widths and
compare it by eye with the current site's home page; confirm the card's contents, the social
links and the single call to action.

**Acceptance Scenarios**:

1. **Given** the home page, **When** it loads, **Then** the first content in the main region is
   the introduction card with Don's photo (with meaningful alternative text), his name as the
   page's main heading, a tagline, a short bio and links to his GitHub and LinkedIn profiles.
2. **Given** the introduction card, **When** it is compared with the current site's home page,
   **Then** it matches its layout and gradient border, except that the current site's subscribe
   button is replaced by a call to action linking to /services/ (the Contact feature later
   switches it to /contact/).
3. **Given** the home page, **When** a visitor reads past the card, **Then** they find who Don
   helps and what he does, and the card's call to action is the page's only primary call to
   action (no second primary call to action below the card).
4. **Given** a phone-width screen (320px and up), **When** the home page loads, **Then** the card
   and its contents fit without horizontal scrolling or overlapping text.

---

### User Story 3 - Don adds or edits a page with one text file (Priority: P1)

Don wants a new page, for example /workshops/. He adds one text file containing the page's
settings (title, description, and optionally a sharing image and whether it appears in
navigation) followed by its content. He changes nothing else. After the next build, the page is
live at an address taken from the file, with the site's header, footer, page layout, sharing
metadata and an entry in the search engines' page list. Editing an existing page is the same:
change the text in its file.

**Why this priority**: This is the reason for the feature. Without it every page is a coding
task, and the blog, portfolio and contact features build on the same approach.

**Independent Test**: On a branch, add one new page file and nothing else, build, and confirm the
new page renders at the expected address with correct title, description, sharing metadata and
page-list entry; then change a word in an existing page file and confirm only that page changes.

**Acceptance Scenarios**:

1. **Given** a new page file with a title, description and body, **When** the site is built,
   **Then** a page exists at the address derived from the file's name and location, with no
   other file changed.
2. **Given** a page file with no sharing image, **When** the page is shared, **Then** the
   site-wide default sharing image is used; **Given** one that sets a sharing image and its
   alternative text, **Then** that image is used.
3. **Given** a page file that does not ask to appear in navigation, **When** the site is built,
   **Then** the page is reachable by its address but is not added to the header navigation.
4. **Given** a page file that asks to appear in navigation, **When** the site is built, **Then**
   the header navigation includes it with the label and position the file gives.
5. **Given** an edit to one page file, **When** the site is rebuilt, **Then** only that page's
   output changes.

---

### User Story 4 - Don composes pages from reusable sections (Priority: P2)

Writing a page, Don can use a small set of named sections anywhere in the content, alongside
ordinary text: a lead section, a text block, a list of offerings, a call to action, an image
with a caption, and an image set wide or full-width. Each looks consistent wherever it is used,
in both themes and at every screen width.

**Why this priority**: Plain text alone makes every page look the same. The sections let the
Services, Speaking and Home pages be structured without code, but the pages are still usable
without them.

**Independent Test**: Build a test page that uses every section once, view it in both themes at
phone and desktop widths, and confirm each section renders as described and passes the
accessibility checks.

**Acceptance Scenarios**:

1. **Given** a page that uses a lead section, **When** it renders, **Then** the lead text is
   visually emphasised above the body text.
2. **Given** a list of offerings with a title and short description for each item, **When** it
   renders, **Then** each offering appears as a distinct item in the order given, and the list
   is announced as a list to screen readers.
3. **Given** a call to action with a label and a destination, **When** it renders, **Then** it
   appears as a single prominent link that works with the keyboard and has a visible focus
   indicator.
4. **Given** an image with a caption, **When** it renders, **Then** the image has alternative
   text and the caption is associated with it.
5. **Given** a wide image, **When** it renders on a desktop screen, **Then** it extends beyond the
   text column; **given** a full-width image, **Then** it spans the full width of the window; and
   on a phone both fit the screen without horizontal scrolling.
6. **Given** a page with an optional feature image set in its settings, **When** it renders,
   **Then** the image appears at the top of the page content with its alternative text; with no
   feature image, the page renders without one and without an empty gap.

---

### User Story 5 - Broken page files fail clearly, not quietly (Priority: P2)

Don makes a mistake in a page file: he leaves out the title, misspells a setting, uses a section
that does not exist, or forgets an image's alternative text. Instead of a broken or half-empty
page appearing on the site, the build stops and tells him which file is wrong and what is missing
or invalid, in plain language.

**Why this priority**: The constitution requires invalid content to fail the build. It protects
the live site from Don's (and Claude Code's) editing mistakes.

**Independent Test**: For each kind of mistake, create a deliberately broken page file, run the
build, and confirm it fails with a message naming the file and the problem; remove the file and
confirm the build passes.

**Acceptance Scenarios**:

1. **Given** a page file with no title or no description, **When** the site is built, **Then**
   the build fails with a message naming the file and the missing setting.
2. **Given** a page file with a setting of the wrong kind (for example a navigation position that
   is not a number) or an unknown setting, **When** the site is built, **Then** the build fails
   with a message naming the file and the setting.
3. **Given** a page that uses a section name that does not exist, or a section missing required
   information (such as an image's alternative text or a call to action's destination), **When**
   the site is built, **Then** the build fails with a message naming the file and the section.
4. **Given** two page files that would produce the same address, or a page file whose address is
   already used by another part of the site, **When** the site is built, **Then** the build
   fails naming both.
5. **Given** a failed build, **When** it runs in CI, **Then** the check fails and nothing is
   deployed.

---

### User Story 6 - Legal and technology pages carried over (Priority: P2)

A visitor reads the privacy policy, terms of use and technology pages. The privacy policy
describes what the new site actually does: it sets no cookies, what the contact form will
collect, where that is stored and how long it is kept, and how visitor statistics are gathered.
The terms of use and technology pages start from the current site's versions.

**Why this priority**: These pages are linked from every page's footer and are expected on a site
that collects contact details. Their accuracy matters more than their polish.

**Independent Test**: Read the three pages on the preview and compare them with the current
site's versions and with how the new site actually behaves.

**Acceptance Scenarios**:

1. **Given** the privacy policy, **When** it is read, **Then** it states that the site sets no
   cookies, and includes the relevant content from the current cookie policy.
2. **Given** the privacy policy, **When** it is read, **Then** it states which fields the contact
   form collects, that submissions are stored in Canada, how long they are kept before automatic
   deletion, and that visitor statistics are collected without cookies or personal tracking.
3. **Given** the terms of use and technology pages, **When** they are compared with the current
   site's pages at the same addresses, **Then** their content starts from those versions, with
   anything that no longer applies to the new site (Ghost, member accounts, comments, the old
   blog categories) removed or corrected.
4. **Given** /cookie-policy/, **When** it is requested, **Then** the not-found page is shown
   (no redirect), consistent with the site's no-redirect policy.

---

### Edge Cases

- A page file sets a description longer than sharing previews show: the page still builds; the
  full description is used as given (length guidance is documented for Don, not enforced).
- A page's title is very long, or a narrow screen (320px): the title wraps and nothing overflows
  horizontally.
- A page has a feature image but no title shown: the page still has exactly one main heading for
  accessibility.
- A page asks to appear in navigation but gives no label: its title is used as the label.
- Two navigation pages ask for the same position: the build fails naming both files.
- A page image file is missing or the path is wrong: the build fails naming the page and the
  image.
- A wide or full-width image inside a list or narrow container: it does not cause horizontal
  scrolling on any screen width.
- Placeholder pages: every page whose copy is still a placeholder shows a visible draft notice,
  so no placeholder text is mistaken for Don's final words.
- The Writing, Projects and Contact links: still show the not-found page until their features
  land, and the automated checks keep accepting that for those three addresses only.
- A page file with no body content: the build fails, since a page with only a title is
  almost certainly a mistake.

## Requirements *(mandatory)*

### Functional Requirements

**Page files**

- **FR-001**: Each standalone page MUST be defined by exactly one text file in the repository,
  containing the page's settings followed by its content in Markdown, optionally using the
  reusable sections (FR-010).
- **FR-002**: Adding a page file MUST be the only change needed to publish a new page: no route,
  list, configuration or code change.
- **FR-003**: A page's address MUST be derived from its file's name (and folder, if nested), with
  a trailing slash, matching the site's existing address style. The home page is the file that
  maps to `/`.
- **FR-004**: Each page file MUST declare: a title (required), a description (required), a
  sharing image with alternative text (optional; both or neither), a feature image with
  alternative text (optional; both or neither), whether the page appears in the header
  navigation (optional, default no), a navigation label (optional, defaults to the title) and a
  navigation position (required only when the page appears in navigation), and whether the page
  is a draft (optional, default no).
- **FR-005**: Each page MUST use its settings for its document title, description, canonical
  address and sharing-preview metadata, falling back to the site-wide defaults from the
  foundation for any optional value it does not set.
- **FR-006**: Every page built from a page file MUST appear in the search engines' page list,
  including pages marked as drafts, and MUST be indexable (no "noindex" marker).

**Validation**

- **FR-007**: The build MUST fail, with a plain-language message naming the file and the problem,
  when a page file: is missing a required setting; has a setting of the wrong kind or an unknown
  setting; has an image without alternative text; refers to an image that does not exist; has
  no body content; uses a section that does not exist; or uses a section without its required
  information.
- **FR-008**: The build MUST fail, naming the files involved, when two page files would produce
  the same address, when a page's address is already produced by another part of the site, or
  when two navigation pages ask for the same navigation position.
- **FR-009**: No page with invalid content may be published: a failing build blocks the merge
  and the deployment, as for any other failed check.

**Reusable sections**

- **FR-010**: Page content MUST be able to use these named sections, in any order and any number
  of times, alongside ordinary text:
  - **Lead**: an emphasised introductory paragraph.
  - **Text block**: a titled block of ordinary text, for grouping content under a heading.
  - **Offerings list**: a list of items, each with a title, a short description and an optional
    link.
  - **Call to action**: a short message with one prominent link (label and destination
    required).
  - **Image with caption**: an image with required alternative text and an optional caption.
  - **Wide image** and **full-width image**: an image that extends beyond the text column, or
    across the full window width on larger screens, with required alternative text and an
    optional caption, fitting the screen on phones.
- **FR-011**: Each section MUST render consistently on every page, meet WCAG 2.2 AA in both
  themes, work without JavaScript, and cause no horizontal scrolling at widths of 320px and up.
- **FR-012**: The set of sections MUST be documented for Don with a short example of each, in the
  repository's documentation.

**Page layout**

- **FR-013**: Standard pages MUST use one shared page layout carried over from the current site's
  page template: the page title as the main heading, an optional feature image, and body text in
  the site's existing accent prose style, inside the foundation's header and footer.
- **FR-014**: Every page MUST have exactly one main heading. Headings in page content MUST follow
  the design system's heading colours.
- **FR-015**: A page marked as a draft MUST show a visible notice near the top of its content
  saying the text is a draft and subject to change; removing the draft setting removes the
  notice. Drafts are still published and indexed like any other page (they are placeholders for
  launch, not hidden pages); the visible notice is the only thing that marks them.

**Home page**

- **FR-016**: The home page MUST open with an introduction card carried over from the current
  site's home page: Don's photo with alternative text, his name as the page's main heading, a
  tagline, a short bio, and links to GitHub and LinkedIn using the same icons and accessible
  names as the footer, framed by the current site's gradient border in both themes.
- **FR-017**: The introduction card MUST NOT include a subscribe or sign-up button. In its place
  it MUST show a call to action linking to /services/ at launch; the Contact feature switches it
  to /contact/.
- **FR-018**: The card's photo, name, tagline, bio and call to action MUST be editable as text in
  the home page's file, without code changes.
- **FR-019**: Below the card, the home page MUST say who Don helps and what he does. The card's
  call to action MUST be the page's only primary call to action; the content below the card
  MUST NOT add another.

**Launch pages and content**

- **FR-020**: The site MUST publish these pages at these addresses: Home (`/`), Services
  (`/services/`), Speaking (`/speaking/`), About (`/about/`), Privacy policy
  (`/privacy-policy/`), Terms of use (`/terms-of-use/`), Technology (`/technology/`).
- **FR-021**: Services MUST cover the kinds of work Don offers, how he works, and what he does not
  do. Speaking MUST cover talk topics, past talks, and a short bio and photo for event
  organisers. About MUST cover Don's background, credentials, and how the practice fits
  alongside his full-time role.
- **FR-022**: The Privacy policy MUST cover what the contact form collects, where submissions are
  stored (Canada), how long they are kept before automatic deletion, that the site sets no
  cookies, and how visitor statistics are collected. It MUST absorb the relevant content of the
  current cookie policy. No page is published at /cookie-policy/.
- **FR-023**: Terms of use and Technology MUST start from the current site's pages at the same
  addresses, with statements that no longer apply to the new site removed or corrected.
- **FR-024**: Home, Services, Speaking, About and Privacy policy MUST launch with short, plain
  placeholder copy marked as drafts (FR-015). Terms of use and Technology are marked as drafts
  until Don has reviewed the carried-over text. All copy follows the constitution's plain-language
  rule: no hype or filler.

**Navigation and existing links**

- **FR-025**: The header navigation MUST keep the foundation's seven links in the same order
  (Home, Services, Speaking, Writing, Projects, About, Contact). Page files for Home, Services,
  Speaking and About control their own labels and positions, which launch with the current
  values, so the rendered navigation is unchanged. Writing, Projects and Contact remain fixed
  entries until their features land.
- **FR-026**: The footer MUST remain as the foundation defined it; its privacy, terms and
  technology links now reach real pages.
- **FR-027**: The automated link checks MUST stop treating the six addresses built here (/services/, /speaking/, /about/,
  /privacy-policy/, /terms-of-use/, /technology/) as
  future destinations; only /writing/, /projects/ and /contact/ remain accepted as not-found.

**Quality**

- **FR-028**: Every launch page MUST pass the automated accessibility checks in both themes, and
  be readable with JavaScript turned off.
- **FR-029**: The automated screenshot baselines MUST be extended to cover the home page and one
  standard page at phone (390px) and desktop (1280px) widths in both themes, and the existing
  shell baselines MUST continue to pass unchanged, or any difference MUST be explained and
  approved in the pull request.
- **FR-030**: Launch pages MUST stay within the site's existing performance budget and ship no
  client-side script beyond what the foundation already loads.
- **FR-031**: The way page files, sections and shared content settings are organised MUST be
  documented in the repository's design-source document, so the blog, portfolio and contact
  features extend the same structure rather than inventing their own.

### Key Entities

- **Page**: One standalone page. Settings: title, description, optional sharing image and alt
  text, optional feature image and alt text, navigation visibility, navigation label and
  position, draft flag. Content: Markdown body with optional sections. Its address comes from
  its file.
- **Section**: A named, reusable block usable inside any page's content (lead, text block,
  offerings list, call to action, image with caption, wide image, full-width image), each with
  its own required and optional information.
- **Introduction card**: The Home page's opening block: photo and alt text, name, tagline, bio,
  social links, call to action.
- **Navigation entry**: A label, address and position in the header navigation; either from a
  page file that opts in, or a fixed entry for a destination owned by a later feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All seven launch pages return a success status on the preview deployment, and every
  header and footer link except Writing, Projects and Contact leads to a real page (0 not-found
  results).
- **SC-002**: A new page can be published by adding exactly one file; in a test, the change set
  for a new page is one file and the page appears after one build.
- **SC-003**: 100% of the deliberately broken page files in the validation tests (one per rule in
  FR-007 and FR-008) fail the build, and each failure message names the file and the problem.
- **SC-004**: 0 accessibility violations on every launch page and on the section test page, in
  both themes.
- **SC-005**: Every launch page renders with no horizontal scrolling at 320px, 390px and 1280px
  widths, in both themes.
- **SC-006**: Don, comparing the preview's home page with the current site's home page, judges the
  introduction card recognisably the same design, with the subscribe button replaced by the call
  to action.
- **SC-007**: Launch pages meet the site's existing performance budget in CI, with no new
  client-side script.
- **SC-008**: Every placeholder page visibly shows the draft notice; no page shows it once its
  draft setting is removed.

## Assumptions

- **Photo**: Don's photo is copied from the current site and committed as a site image, and is
  used for the Home card and the Speaking page until he supplies a different one (confirmed by
  Don in clarification).
- **Contact data wording**: The contact form and its retention period are built in the Contact
  feature. The privacy policy describes them from the constitution (fields typed into the form
  only, stored in Toronto, deleted after a set retention period), with the specific field list
  and retention period as draft placeholders for the Contact feature to confirm.
- **Statistics**: Visitor statistics are Cloudflare Web Analytics on the main build only, as set
  up by the foundation, and set no cookies.
- **No redirects**: Following the foundation's decision, /cookie-policy/ is not redirected; Don
  updates any external links himself.
- **Navigation choice**: "Whether it appears in navigation" is interpreted as page files opting in
  to the header navigation with a label and position, while the rendered navigation at launch
  stays exactly as the foundation defined it. The footer stays fixed. Confirmed by Don in
  clarification.
- **Home call to action**: The introduction card's call to action is the home page's only
  primary call to action. It links to /services/ at launch, because /contact/ does not exist
  until the Contact feature, which switches it to /contact/.
- **Addresses from files**: Page addresses come from file names; a separate address setting is
  not needed for launch.
- **Launch copy**: Placeholder copy is written by Claude Code and replaced by Don later; content
  quality beyond "plain, accurate and marked as draft" is not a launch requirement.
- **Major change**: This feature adds a shared page layout and the Home introduction card and lets
  pages take part in navigation, so it is treated as a major change needing Don's review of the
  preview before merge.

## Follow-up work (out of scope)

- **Blog feature**: blog posts, listing and topics (Writing).
- **Portfolio feature**: project pages and the Projects landing page.
- **Contact feature**: the contact form, the /contact/ page, and confirming the privacy policy's
  field list and retention period; switches the Home call to action to /contact/.
- **Final copy**: Don replaces placeholder copy and removes draft settings page by page.
- **Photo**: a new photo, if Don wants one.
