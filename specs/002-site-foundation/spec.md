# Feature Specification: Site foundation for doncoleman.ca

**Feature Branch**: `002-site-foundation`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "Site foundation for doncoleman.ca — build the foundation of the personal site for Don Coleman's writing, portfolio and independent consulting, carrying over the look and feel of the current site (the Flux theme) without the parts that only made sense on Ghost. Visitors get a consistent header, footer, navigation, dark and light themes, a not-found page, accurate sharing previews and discoverable pages; Don gets automatic testing, per-branch previews, automatic publishing from the main branch, privacy-respecting statistics and a written record of how the old theme maps to the new site. Page content, blog, portfolio and contact form are later features." (Full feature prompt, including its technical direction, is kept with the /deliver run; technical direction is summarised for planning at the end of this spec.)

## Context

doncoleman.ca currently runs on Ghost with Don's own theme, Flux. This feature replaces the
platform underneath the site while keeping its visual identity. It delivers the shell every later
feature builds on: the site-wide layout, the design system, the theme switch, the not-found page,
search and sharing metadata, visitor statistics, and the automated test-preview-publish pipeline.
It does not deliver page content, the blog, the portfolio or the contact form.

Because it changes the design system, site-wide layout, navigation, CI and deployment, this is a
major change under Constitution Principle III.

## Clarifications

### Session 2026-09-28

- Q: What accent colour and heading and body fonts are set in Ghost admin (Settings, Design)? → A: The accent colour is rust #d68844 (confirmed Ghost admin value). Headings and body use a system font stack for now; the real Ghost heading and body fonts are a follow-up to confirm.
- Q: Should the main build on the temporary address also tell search engines not to index it until the domain switch, or only branch previews? → A: Every deployment, main build included, asks search engines not to index it until the domain switch; removing that is part of the domain-switch follow-up.
- Q: Which address should canonical links, sharing previews and the search-engine page list use while the site is on the temporary address? → A: Whatever address each deployment is served from, so previews point to themselves; https://doncoleman.ca is the fallback when the build cannot determine its address.
- Q: With JavaScript turned off on a phone-width screen, how should the navigation behave? → A: Progressive enhancement: without script the links show as a plain wrapping list; with script they collapse behind a menu button that reports its open/closed state, closes on Escape and returns focus to the button.
- Q: How should the check that the new site matches the current site be done: by Don looking at it, by automated screenshot tests, or both? → A: Both. Don compares the preview against the Ghost reference screenshots by eye, and automated screenshot baselines of the new shell (header, footer, mobile menu, not-found page; phone and desktop widths; both themes) are committed so later features cannot quietly change the layout, using the browser test tool's built-in screenshot comparison (no new dependency).
- Q: Which deployments should record visitor statistics, and should the site's code contain the statistics script? → A: Only the main build records statistics, through the Cloudflare Web Analytics automatic setup already configured (setup item 18); the repository contains no analytics code or token, and preview traffic is not counted. Tests check that the content security policy allows the statistics beacon and that the site works when it is blocked.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recognisable site shell on every page (Priority: P1)

A visitor opens any page of the new site and sees the same look and feel as the current
doncoleman.ca: the site name and navigation (Home, Services, Speaking, Writing, Projects, About,
Contact) in the header, and a footer with links to the privacy, terms and technology pages,
GitHub and LinkedIn, a copyright line and the theme switch. On a phone the navigation collapses
into a menu that opens and closes. Everything can be reached and operated with a keyboard and is
announced correctly by a screen reader.

**Why this priority**: Every later feature (pages, blog, portfolio, contact) sits inside this
shell. Without it there is nothing to show and nothing to build on.

**Independent Test**: Publish a preview with only the shell and a placeholder home page; open it
on a phone, a tablet and a desktop, and with keyboard only, and compare it against the reference
screenshots of the current site.

**Acceptance Scenarios**:

1. **Given** a visitor on a desktop-width screen, **When** any page loads, **Then** the header
   shows the site name (linking to the home page) and all seven navigation links in the order
   Home, Services, Speaking, Writing, Projects, About, Contact.
2. **Given** a visitor on a phone-width screen with JavaScript available, **When** the page loads,
   **Then** the navigation links are hidden behind a menu button, and activating the button
   reveals them; activating it again, pressing Escape, or choosing a link closes the menu. With
   JavaScript turned off, the links are shown as a plain wrapping list and no menu button appears.
3. **Given** a keyboard-only visitor, **When** they press Tab from the top of the page, **Then**
   focus first reaches a "skip to content" link, then moves through the header, main content and
   footer in visual order, with a clearly visible focus ring at every step.
4. **Given** any page, **When** the visitor reaches the footer, **Then** it shows links to
   /privacy-policy/, /terms-of-use/, /technology/, Don's GitHub profile and Don's LinkedIn
   profile, a copyright line with the current year, and the theme switch.
5. **Given** the current page is one of the navigation destinations, **When** it loads, **Then**
   its navigation link is marked as the current page for both sighted and screen reader users.
6. **Given** the new site and the reference screenshots of the current site, **When** they are
   compared at the same width and theme, **Then** colours, typography, spacing, header and footer
   match closely, and no Ghost-only elements (subscribe, sign-in/account, member portal, search
   buttons) appear.
7. **Given** the committed screenshot baselines of the new shell, **When** the checks run,
   **Then** the header, footer and not-found page at phone and desktop widths, and the open
   mobile menu at phone width, in both themes, match their baselines, and any difference beyond
   the threshold in FR-005a fails the run.

---

### User Story 2 - Dark and light themes without a flash (Priority: P1)

A visitor sees the site in the dark theme by default. A theme switch in the footer cycles
through dark, light and "match my device". The choice is remembered on later visits and pages,
and the page never briefly shows the wrong theme while loading.

**Why this priority**: The dark-first look is a defining part of the current site's identity,
and a theme flash on every page load would be visible on every visit.

**Independent Test**: On a preview, load pages fresh, switch themes, reload and navigate, and
confirm the rendered theme at first paint in each case, including with the device set to light
and dark.

**Acceptance Scenarios**:

1. **Given** a first-time visitor with no stored choice, **When** any page loads, **Then** it
   renders in the dark theme regardless of the device setting.
2. **Given** the dark theme is active, **When** the visitor activates the theme switch, **Then**
   the site changes to light; activating it again selects "match my device"; activating it again
   returns to dark.
3. **Given** the visitor chose a theme, **When** they reload or open another page, **Then** the
   chosen theme is shown from the very first paint with no visible flash of the other theme.
4. **Given** "match my device" is selected, **When** the device's light/dark setting changes,
   **Then** the site follows it without a reload.
5. **Given** a screen reader user, **When** they reach the theme switch, **Then** it announces
   what it does and which theme is currently selected.
6. **Given** the browser blocks storage, **When** the visitor uses the switch, **Then** the theme
   still changes for the current page and nothing breaks; the site falls back to dark on the next
   load.

---

### User Story 3 - Every change tested, previewed and published automatically (Priority: P1)

Don (or an agent working for him) pushes a branch. The full automated check suite runs, a preview
link for that branch becomes available, and when the change reaches the main branch after all
checks pass, the live site updates by itself. A failing check blocks both the merge and the
release.

**Why this priority**: Constitution Principle II makes this gate a precondition for anything
reaching production; every later feature depends on it.

**Independent Test**: Open a pull request with a deliberate failing test and confirm it is
blocked and not published; fix it and confirm the preview link appears, then merge and confirm
the main build updates.

**Acceptance Scenarios**:

1. **Given** a pushed branch, **When** the checks run, **Then** they cover linting, type checks,
   unit and component tests, end-to-end tests in a real browser, automated accessibility checks
   on every page template, the build, and a performance budget.
2. **Given** a branch whose checks all pass, **When** it is pushed, **Then** a preview link for
   that branch is available to Don, and it shows that branch's version of the site.
3. **Given** any check fails, **When** Don looks at the pull request, **Then** the merge is
   blocked and nothing is published to the main site.
4. **Given** a change merged to the main branch, **When** all checks pass on main, **Then** the
   main site build updates automatically without any manual step.
5. **Given** a change that breaks the performance budget or an accessibility check, **When** the
   checks run, **Then** the run fails.

---

### User Story 4 - Found by search engines and shared well (Priority: P2)

A visitor shares a page on LinkedIn or another site and the preview shows the right title,
description and image. Search engines can discover every public page.

**Why this priority**: Important for Don's consulting reach, but the site is useful before this is
perfect, and there are few pages until later features add content.

**Independent Test**: Automated checks read the head tags of every built page and compare the
site's page list for search engines against the set of built public pages. In addition, running
the preview's home page through LinkedIn's Post Inspector and seeing the right title, description
and image is a [PREVIEW-CHECK].

**Acceptance Scenarios**:

1. **Given** any public page, **When** its metadata is inspected, **Then** it has a unique title,
   a description, a canonical address, and sharing-preview title, description, image and page
   type.
2. **Given** a page that sets no description or sharing image of its own, **When** it is shared,
   **Then** site-wide defaults are used, so the preview is never empty.
3. **Given** the built site, **When** a search engine reads it, **Then** a machine-readable list
   of every public page is available and referenced from the site's crawler instructions, and the
   not-found page is not in it.
4. **Given** any deployment (branch preview or the main build on the temporary address), **When**
   a search engine reaches it before the domain switch, **Then** it is told not to index it.
5. **Given** a page served from a given deployment's address, **When** its canonical address,
   sharing-preview address and page-list entries are inspected, **Then** they use that
   deployment's own address (a preview points to itself).

---

### User Story 5 - Helpful not-found page (Priority: P2)

A visitor follows a broken or outdated link (for example an old blog address) and lands on a page
that says plainly the page was not found, keeps the site header and footer, and offers ways back
(home and the main sections).

**Why this priority**: Blog addresses are changing with no redirects, so some old links will land
here.

**Independent Test**: Request an address that does not exist on a preview and check the response
and page.

**Acceptance Scenarios**:

1. **Given** an address that does not exist, **When** a visitor requests it, **Then** the site
   responds with a not-found status and shows the not-found page in the site's design and the
   visitor's chosen theme.
2. **Given** the not-found page, **When** it is shown, **Then** it explains in plain language that
   the page could not be found and links to the home page and the main navigation.

---

### User Story 6 - Privacy-respecting visitor statistics (Priority: P3)

Don can see simple visit counts (pages, referrers, countries, devices) for the site, collected
without tracking cookies or personal profiles.

**Why this priority**: Useful to Don but not needed for the site to work.

**Independent Test**: Visit the main build and confirm visits appear in the statistics view, that
no cookies are set by the site, and that visits to a branch preview are not counted.

**Acceptance Scenarios**:

1. **Given** a visitor loads a page, **When** the visit is recorded, **Then** no cookie or other
   persistent identifier is set for tracking.
2. **Given** statistics are collected, **When** Don opens the statistics view, **Then** he sees
   page views for the main build only; branch preview visits are not counted.
3. **Given** a visitor who blocks the statistics script, **When** they browse, **Then** the site
   works exactly the same.

---

### User Story 7 - Written record of how the old theme maps to the new site (Priority: P2)

A later feature (pages, blog, portfolio, contact), usually built by an agent, opens a single
document in the repository and learns where to get the old theme, which parts of it map to which
parts of the new site and which feature owns each, what does not carry over, and what the current
live addresses are.

**Why this priority**: It is the first deliverable of this feature and every later feature depends
on it, but visitors never see it.

**Independent Test**: Give the document to someone unfamiliar with Flux and ask them where the
contact form, code blocks and author card come from and which feature ports each.

**Acceptance Scenarios**:

1. **Given** the repository, **When** a reader opens the design source document, **Then** it
   explains how to obtain the old theme as a read-only reference kept out of the repository.
2. **Given** the document, **When** a reader looks up any part of the old theme named in this
   feature's input, **Then** it states what it becomes in the new site and which feature
   (Foundation, Pages, Blog, Contact, or "each feature") ports it.
3. **Given** the document, **When** a reader checks what is dropped, **Then** it lists every
   Ghost-only or retired part (member sign-up, subscribe and account buttons, portal, search,
   comments, call-to-action block, AI analysis, the Drift/Convergence/News categories and their
   templates, icons and routing, the Ghost deploy workflow and tooling, and retired libraries).
4. **Given** the document, **When** a reader checks addresses, **Then** it lists the current live
   URL patterns and states that page URLs are kept where the page still exists, blog URLs change,
   and there are no redirects.

---

### Edge Cases

- JavaScript disabled: the header, footer, navigation links, not-found page and core content still
  render and work; the site shows the dark theme; on small screens the navigation links are shown
  as a plain wrapping list with no menu button, so every link is reachable without script.
- Stored theme value is missing, corrupted or unrecognised: the site treats it as no choice and
  uses dark.
- Browser storage unavailable (private mode, blocked site data): theme switching works for the
  current page without errors.
- Mobile menu open when the window is resized to desktop width: the layout shows the desktop
  navigation and the menu does not remain stuck open over content.
- Mobile menu open and the visitor presses Escape or tabs past the last link: the menu closes;
  focus returns to the menu button after Escape and moves on normally after Tab (FR-007a).
- Very long page titles and narrow screens (320px wide): header, navigation and footer do not
  overflow horizontally.
- Reduced motion preference: theme and menu transitions respect it.
- Forced colours / high contrast mode: focus rings, links and the theme switch stay visible.
- Old blog addresses (/drift/…, /convergence/…, /news/…, /topic/…, /author/…): return the
  not-found page, since there are no redirects.
- Navigation links whose destination page does not exist yet (Services, Speaking, Writing,
  Projects, About, Contact and the footer legal pages until later features add them): see
  FR-006 for how they behave; they must not break the automated link or accessibility checks.
- The statistics service is unreachable or blocked: pages load normally with no errors shown.

## Requirements *(mandatory)*

### Functional Requirements

**Design system and visual identity**

- **FR-001**: The site MUST carry over the current site's design system from the Flux theme: its
  seven named colour palettes (dusk, rust, sage, lavender, mist, sand, mauve, shades 50–950), the
  dark variant, heading colours (H1/H2 rust, H3 sage, H4 lavender), accent prose styling, table
  styling and focus rings, closely enough that the new site matches the reference screenshots.
- **FR-001a**: Where a ported Flux colour pairing fails the contrast minimums in FR-020a,
  accessibility wins over matching the reference screenshots: the implementer uses the nearest
  shade of the same palette that passes, leaves the palette tokens themselves unchanged, and
  records the pairing, its failing ratio and the replacement shade in the "Accessibility
  adjustments" section of the design source document (FR-032). Don reviews and approves each
  adjustment as part of his approval of this major-change pull request; no separate approval
  step is needed.
- **FR-002**: Each palette MUST remain adjustable by changing a single base value, as in Flux.
- **FR-003**: The site MUST use the fixed accent colour rust #d68844 (the current site's Ghost
  admin value) and a system font stack for both headings and body text, loading no web fonts and
  using no third-party font service. Confirming the current site's real heading and body fonts is
  recorded as follow-up work.
- **FR-004**: The site MUST NOT include any Ghost-only elements: member sign-up, subscribe,
  sign-in or account buttons, the member portal, Ghost search, or comments.
- **FR-005**: Before any styling work, reference screenshots of the current live site (home page,
  one post, and /about/) MUST be captured at a mobile width and a desktop width in both the dark
  and light themes, stored in the repository, and used by Don to compare the new site against
  by eye when he reviews the preview.
- **FR-005a**: The repository MUST contain automated screenshot baselines of the new site's shell,
  checked on every run so that an unapproved layout change fails the checks. The set is closed:
  header, footer and not-found page at a phone width (390px) and a desktop width (1280px), and the
  open mobile menu at phone width only (it does not exist at desktop width), each in both themes
  — 14 images per operating system. A screenshot fails when more than 0.1% of its pixels differ
  from its baseline (each pixel compared with the tool's default colour tolerance), with
  animations and the text caret disabled. The baselines use the end-to-end browser test tool's
  built-in screenshot comparison; no new dependency is added. These automated baselines are a
  separate mechanism from the Ghost reference screenshots in FR-005, which are only compared by
  eye and never fail a run.
- **FR-005b**: Baselines are kept per operating system, because system fonts render differently;
  this is the only difference between local and CI runs (FR-027a). A missing baseline fails the
  run rather than passing vacuously; the CI run uploads the images it produced, and they are
  reviewed and committed in the same pull request before it can pass. An intentional change to
  any shell baseline is made by regenerating the baselines with the documented update command
  and committing them in the pull request that causes the change, where the image diff is
  visible; because it changes the site-wide layout or visual identity, that pull request is a
  major change needing Don's approval.

**Site shell**

- **FR-006**: Every page MUST share one header containing the site name (linking home) and the
  navigation links Home, Services, Speaking, Writing, Projects, About, Contact, in that order.
  Navigation and footer links to pages that later features will create MUST point at their final
  addresses; until those pages exist, requests for them show the not-found page with a 404
  status (no placeholder pages are built for them), and the automated checks MUST NOT fail
  because of these known future destinations. Each such link is an ordinary link: it is
  focusable and activated with Enter like any other, and following it loads the not-found page.
- **FR-007**: On small screens the navigation MUST use progressive enhancement. Without JavaScript,
  the navigation links MUST be shown as a plain wrapping list with no menu button. With
  JavaScript, they MUST collapse behind a menu button that exposes its open/closed state to
  assistive technology, can be operated by keyboard, closes on Escape (returning focus to the
  button) and closes when a link is chosen.
- **FR-007a**: The menu button MUST follow the disclosure pattern: a native button named "Menu"
  with `aria-expanded` reflecting the open/closed state and `aria-controls` pointing at the link
  list. The open menu is not modal and does not trap focus. Focus after each way of closing:
  Escape → the menu button; activating the button again → stays on the button; choosing a link →
  the browser navigates and the new page starts with focus at the top of the document, as on any
  load; Tab or Shift+Tab out of the navigation → the menu closes and focus moves on to the next
  or previous element as normal; a click or tap outside → the menu closes and focus goes where
  the visitor clicked; the viewport widening to desktop width (48rem) → the menu resets to
  closed, the desktop link list is shown, focus stays where it was, and if it was on the menu
  button (now hidden) it moves to the first navigation link.
- **FR-008**: Every page MUST share one footer containing links to /privacy-policy/,
  /terms-of-use/, /technology/, https://github.com/drcdev and
  https://www.linkedin.com/in/drcdev, a copyright line with Don's name and the current year, and
  the theme switch. Social links MUST use recognisable icons with accessible names; the icons
  are decorative and hidden from assistive technology.
- **FR-008a**: Controls shown only as an icon, or whose state is shown by an icon, MUST have these
  accessible names: menu button "Menu"; theme switch "Theme: Dark", "Theme: Light" or "Theme:
  Match device" for the current choice (FR-012a); GitHub link "GitHub"; LinkedIn link
  "LinkedIn". The footer appears once per page, so each name is unique on the page.
- **FR-009**: The navigation link for the current page MUST be identified as current, visually and
  to assistive technology: `aria-current="page"` on that link, plus a visible style difference
  that does not rely on colour alone (for example an underline).
- **FR-010**: Every page, including the not-found page, MUST provide a "Skip to main content" link
  as the first element in sequential focus order: no focusable element precedes it, and no
  element on the page uses a positive `tabindex`. It is visually hidden until it receives
  keyboard focus, then appears at the top of the page with the focus indicator and contrast of
  FR-020a in both themes, and hides again when focus leaves. Its destination is the page's main
  content region, which is programmatically focusable (`tabindex="-1"`); activating the link
  moves focus there, so the next Tab reaches the first focusable element after the header.
- **FR-010a**: Sequential focus order on every page MUST match the visual order: skip link; site
  name link; menu button (phone width with JavaScript only); the seven navigation links in
  order; focusable content in the main region in source order; then the footer's links and the
  theme switch (JavaScript only) in the footer's visual order. Every link and button MUST be
  reachable with Tab and Shift+Tab and operable with the keyboard (links with Enter; buttons with
  Enter and Space), with no keyboard trap. This includes the navigation links, the menu button,
  the theme switch, the footer links and the social links.

**Themes**

- **FR-011**: The site MUST offer dark and light themes, with dark as the default for visitors who
  have not made a choice: with no stored choice every page, including the not-found page, is
  dark whatever the device setting. "Default" means only the absence of a stored choice; a stored
  "match my device" choice is the visitor's choice, not the default, and is honoured on later
  loads.
- **FR-012**: A theme switch MUST cycle dark → light → match my device → dark, and MUST announce
  its purpose and current state to assistive technology. The switch is a single native button;
  each activation (click, tap, Enter or Space) advances exactly one step. After activation the
  button keeps keyboard focus and stays in the same place in the page (it is updated, not
  replaced).
- **FR-012a**: The three choices are named to visitors "Dark", "Light" and "Match device". The
  switch's accessible name states its purpose and the current choice ("Theme: Dark", "Theme:
  Light", "Theme: Match device"), and each change is announced politely to screen readers (for
  example "Theme: Light"). On every load the switch shows the stored choice, including "Match
  device", not only the theme currently applied.
- **FR-013**: The visitor's theme choice MUST be remembered in their own browser across pages and
  visits, without cookies, and MUST be applied before the page is first painted so the wrong theme
  never flashes. This covers every way a page is entered: first load, reload, following an
  in-site link, and back/forward navigation. With JavaScript turned off the page is always dark
  as sent by the server, so no flash is possible; the switch is not shown and switching theme
  without JavaScript is not provided (FR-022a).
- **FR-014**: In "match my device" mode the site MUST follow the device's light/dark setting,
  including changes made while the page is open: the new theme is applied as soon as the device
  reports the change (within 500 ms in the automated test), without a reload. A page in a
  background tab MUST show the current device setting when it is next visible. When the visitor
  has chosen dark or light, device setting changes MUST NOT change the theme.
- **FR-015**: If there is no stored choice, the stored value is not one of the three choices
  (corrupted or unrecognised), or storage cannot be read, the site MUST use dark without errors.
  If storage can be read but not written, a stored choice still applies on load, and a choice
  made with the switch applies to the current page only; the next load uses whatever is stored,
  or dark if nothing is. Storage failures MUST never show an error or stop the switch from
  changing the current page.

**Not-found page**

- **FR-016**: Requests for addresses that do not exist — including the old blog addresses listed
  in Edge Cases and the future destinations in FR-006 — MUST return HTTP status 404 and a
  not-found page in the site's design (the full shell, including the skip link, header, footer
  and theme) that explains the problem in plain language and links to the home page and main
  navigation. Addresses that are built MUST return 200. The 404 status comes from the hosting
  platform's static not-found handling serving the prerendered not-found page, so no page is
  rendered per request (FR-023). The status code and the page content are verified as separate
  checks.

**Search and sharing**

- **FR-017**: Every public page MUST have a unique title, a description, a canonical address, and
  sharing-preview metadata (title, description, image with alt text, page type, site name), with
  site-wide defaults for any value a page does not set. Canonical and sharing-preview addresses
  MUST use the address of the deployment the page is served from, determined at build time, with
  https://doncoleman.ca as the fallback when the build cannot determine it.
- **FR-017a**: The deployment address MUST come from the build environment, never from the
  request. For a build of the main branch by the hosting platform's build service it is the
  temporary main build address, https://new.doncoleman.ca (until the domain switch). For a build
  of any other branch by that service it is the branch's preview address, derived only from the
  branch name, so it stays the same across every rebuild of the same branch. In every other case
  — local builds, the CI check build, a branch name that cannot form a valid preview address, or
  missing or invalid address configuration — it is the fallback https://doncoleman.ca. Every
  absolute address in one build uses the same origin. Page addresses end with a trailing slash
  (for example https://new.doncoleman.ca/) and appear in exactly the same form in canonical
  links, sharing addresses and page-list entries. Per-deployment canonical addresses are a
  deliberate choice (Clarifications): a preview's canonical points at the preview rather than at
  one site-wide origin. This is harmless because no deployment is indexed (FR-019), and it MUST
  NOT be "corrected" to a single origin before the domain switch.
- **FR-017b**: Each metadata value can be overridden per page, field by field; a page that
  overrides only its image still inherits the default description, and so on. Page type is
  "website" for every page in this feature ("article" is reserved for the Blog feature). The
  site-wide default sharing image is a 1200×630 pixel PNG served from the site itself, referenced
  by an absolute address, with alt text.
- **FR-017c**: The not-found page is not a public page for search purposes. It has a title, a
  description, sharing title, description and image, and the no-index instruction, but no
  canonical link and no sharing address, and it is not in the page list.
- **FR-018**: The site MUST publish a machine-readable list of every public page for search
  engines, referenced from its crawler instructions, excluding the not-found page. Its entries and
  the crawler instructions' reference to it MUST use the same deployment address as FR-017.
  A public page is every prerendered HTML page except the not-found page; in this feature that
  is the home page only. The crawler instructions are served at `/robots.txt`, allow all
  crawling (no `Disallow` rule, which would hide the no-index signal) and contain the line
  `Sitemap: {origin}/sitemap-index.xml`. The page list and crawler instructions are regenerated
  on every build. Publishing a page list on a deployment that is not indexed is intentional: it
  keeps the page list tested now and ready for the domain switch.
- **FR-019**: Every deployment, including branch previews and the main build on the temporary
  address, MUST ask search engines not to index it on every path until the domain switch. Both
  mechanisms are required on every deployment: an `X-Robots-Tag: noindex` header on every
  response and a `noindex` robots meta tag on every HTML page. Both are driven by committed
  settings (the site configuration's "indexable" setting, currently off, and the headers file),
  which the domain-switch follow-up changes. Automated checks assert their current values in the
  build and in served responses, and a build made with the main-branch environment is checked in
  the same way as a preview build. That the live main build and a live preview both send the
  no-index header is a [PREVIEW-CHECK].

**Quality and accessibility**

- **FR-020**: Every page MUST meet WCAG 2.2 AA in both themes, including colour contrast, visible
  focus, keyboard operability, correct landmarks and headings, and a declared page language. In
  scope are at least these WCAG 2.2 success criteria: 1.1.1 Non-text Content, 1.3.1 Info and
  Relationships, 1.4.3 Contrast (Minimum), 1.4.4 Resize Text, 1.4.10 Reflow, 1.4.11 Non-text
  Contrast, 1.4.12 Text Spacing, 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.1 Bypass Blocks,
  2.4.2 Page Titled, 2.4.3 Focus Order, 2.4.4 Link Purpose (In Context), 2.4.7 Focus Visible,
  2.4.11 Focus Not Obscured (Minimum), 2.5.8 Target Size (Minimum), 3.1.1 Language of Page,
  4.1.2 Name, Role, Value and 4.1.3 Status Messages.
- **FR-020a**: In each theme, measured against the background it sits on: body text and links at
  least 4.5:1; large text (at least 24px, or at least 18.66px bold) at least 3:1, including
  headings in their Flux colours (H1/H2 rust, H3 sage, H4 lavender), and 4.5:1 for any heading
  smaller than large text; icons, control boundaries and focus indicators at least 3:1. The
  focus indicator on every link and button is a solid outline at least 2px thick, offset 2px, in
  the accent colour, with at least 3:1 contrast against the adjacent background in both themes.
  In forced-colours (high contrast) mode, focus outlines use a system colour and stay visible
  (outline style not `none`, at least 2px wide), and links, the menu button and the theme switch
  stay visible and identifiable; an automated test checks this with forced colours emulated.
- **FR-020b**: Every page, including the not-found page, MUST declare `lang="en"` on its root
  element and have one banner (header), a navigation landmark labelled "Main", one main
  landmark and one contentinfo (footer), exactly one level-1 heading and no skipped heading
  levels. Text sizes use relative units, so text can be enlarged to 200% without loss of content
  or function.
- **FR-021**: The layout MUST work without horizontal scrolling from 320px wide to large desktop
  widths, and MUST respect reduced-motion preferences.
- **FR-021a**: When the device asks for reduced motion, the mobile menu MUST open and close, the
  theme MUST change, and the skip link MUST move to the main content instantly, with no
  transition, animation or smooth scrolling: computed transition and animation durations of 0 on
  the menu, the theme-affected elements and the switch, and scroll behaviour `auto`. An automated
  test checks this with reduced motion emulated.
- **FR-022**: Pages MUST be readable and navigable with JavaScript turned off; only the theme
  switch, the theme-before-paint step and the collapsing of the mobile menu may use script.
- **FR-022a**: With JavaScript turned off, the skip link, focus order (without the menu button
  and theme switch, which are not shown), current-page indication, landmarks, headings and
  visible focus MUST still meet FR-009, FR-010, FR-010a, FR-020a and FR-020b, and the navigation
  links shown as a plain wrapping list MUST be keyboard-operable inside the "Main" navigation
  landmark. The automated accessibility check covers each template with JavaScript disabled at
  phone width. Without JavaScript the theme is dark and cannot be switched; this is intended.
- **FR-023**: Every public page MUST be generated ahead of time; no public page is rendered per
  request.

**Security**

- **FR-024**: The site MUST send security headers on every response, including a content security
  policy based on Flux's, tightened to remove the sources that no longer apply (the old form
  service, the public script CDN and the old database service) and allowing only the site itself
  and the privacy-respecting statistics service (including the Cloudflare Web Analytics beacon
  that is injected into the main build). "Every response" means every response of every
  deployment (branch previews and the main build), including the not-found page, `/robots.txt`,
  the page list and static files. The headers are: `Content-Security-Policy` carrying the
  directives only a header can carry (`frame-ancestors 'none'; object-src 'none'; base-uri
  'self'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone,
  geolocation, payment and USB, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy:
  same-origin`, `Strict-Transport-Security: max-age=31536000`, and `X-Robots-Tag: noindex`
  (FR-019). No response sets a cookie.
- **FR-024a**: Every HTML page MUST also carry the page content security policy, whose complete
  allow-list is: `default-src 'self'`; `script-src 'self' https://static.cloudflareinsights.com`
  plus build-time hashes of the site's own inline scripts (including the theme-before-paint
  script, FR-013); `style-src 'self'` plus build-time hashes; `img-src 'self' data:`; `font-src
  'self'`; `connect-src 'self' https://cloudflareinsights.com`; `object-src 'none'`; `base-uri
  'self'`; `form-action 'self'`. It MUST NOT contain `'unsafe-inline'`, `'unsafe-eval'`, a bare
  `https:` source, or any Flux-era origin: the old form service (`https://web3forms.com`,
  `https://api.web3forms.com`), the public script CDN (`https://cdn.jsdelivr.net`) or the old
  database service (any `supabase.co` host). No other origin is allowed (system fonts and
  in-repo icons need none); this closed list is how Constitution Principle X ("no third-party
  scripts, except privacy-focused analytics and the contact form's spam protection") is applied
  to this site. Development-server needs, such as live-reload connections, are not part of the
  built site and MUST NOT be added to its policy.
- **FR-024b**: The two Cloudflare Web Analytics origins in FR-024a (beacon script
  `https://static.cloudflareinsights.com`, reporting `https://cloudflareinsights.com`) are
  allowed in the same policy on every deployment, so previews run exactly the production policy;
  previews simply never receive the beacon. Because Cloudflare injects the beacon at its edge and
  it never appears in the repository or in any local or CI build, the automated checks verify
  what the build controls: the built policy lists these origins in `script-src` and
  `connect-src`, and a served page with a simulated beacon tag loads with no policy violation.
  That the real injected beacon loads on the live main build with no policy violation in the
  browser console, and that the visit appears in Web Analytics, is a [PREVIEW-CHECK] on the main
  build after merge.
- **FR-024c**: Automated checks MUST assert both the presence of every required header and
  directive and the absence of every forbidden source, on the built files and on responses
  served by the hosting platform's local runtime. A later feature that needs another origin (for
  example the Contact feature's API or spam protection) MUST name the origin and directive in
  its own spec, and adding it is a major change.

**Visitor statistics**

- **FR-025**: The site MUST collect privacy-respecting visitor statistics (page views, referrers,
  countries, device types) that set no tracking cookies and build no personal profiles, using the
  statistics service permitted by the constitution. Statistics MUST be recorded only for the main
  build, through the Cloudflare Web Analytics automatic setup already configured (setup item 18);
  the repository MUST NOT contain analytics code or an analytics token, and branch preview visits
  MUST NOT be counted.
- **FR-026**: If the statistics script is blocked or fails, the site MUST work exactly as before.
  This is a functional check (the beacon request is blocked and pages, navigation and the theme
  switch still work with no errors), separate from the policy checks in FR-024b.

**Release pipeline**

- **FR-027**: Every push MUST run an automated check suite covering linting, type checks, unit and
  component tests, end-to-end tests in a real browser, automated accessibility checks on every
  page template in both themes, a production build, and a performance budget. The suite also
  includes secret scanning, the security header and policy checks (FR-024c) and the shell
  screenshot baselines (FR-005a). "Every page template" means the placeholder home page and the
  not-found page, each at phone and desktop width in both themes, plus the open mobile menu and
  the no-JavaScript state (FR-022a). The constitution's contact-API integration test layer does
  not apply to this feature, which has no API; it starts with the Contact feature. End-to-end,
  accessibility, budget and screenshot checks run against the production build served by the
  hosting platform's local runtime, never a development server.
- **FR-027a**: One local command (`pnpm run verify`) MUST run exactly the checks of the required
  CI check, and the CI check MUST invoke that same command with the same browser (Chromium), so
  local and CI results mean the same thing. The only permitted difference is the per-OS
  screenshot baseline set (FR-005b). Checks run with no automatic retries: any failure,
  including an intermittent one, fails the run, and an intermittent test is fixed as its own
  reviewed change.
- **FR-028**: Every branch MUST get its own preview address showing that branch's build.
- **FR-029**: The main site build MUST update automatically when changes reach the main branch,
  and only after the full check suite passes there.
- **FR-030**: A failing check MUST block the merge and the release. Checks may not be skipped or
  weakened to get a change through.
- **FR-030a**: Branch protection on main MUST require the `verify` check to pass on the latest
  commit of an up-to-date branch, with no bypass, so a failed check cannot be overridden; this is
  confirmed by the existing setup check for main-branch protection before the pull request
  merges. Replacing a test with a successor is allowed only when the successor keeps every
  assertion that still applies and any dropped assertion is named, with its reason, in the pull
  request; loosening a threshold or removing a check without a matching spec change is a
  forbidden weakening.
- **FR-031**: The pipeline MUST build on the setup already completed (the existing hosting
  project, stored credentials, branch protection, the major-change label and the temporary main
  build address) rather than recreate it. Where the feature input's deployment description
  differs from the setup in place (Wrangler run from GitHub Actions with stored Cloudflare
  secrets, versus Cloudflare Workers Builds with no deploy secrets in GitHub), the setup in place
  wins.

**Design source record**

- **FR-032**: The repository MUST contain a design source document, written before any other
  implementation work, that includes: (1) how to obtain the Flux theme as a read-only local
  reference that is never committed or imported from; (2) a mapping of each Flux part named in
  this feature's input to what it becomes in the new site and which feature ports it; (3) what
  does not carry over; (4) the current live URL patterns and the rule that page URLs stay where
  the page still exists, blog URLs change, and there are no redirects.
- **FR-033**: The Flux reference copy MUST be kept outside version control, and the site MUST NOT
  import or bundle files from it.

### Key Entities

- **Theme preference**: The visitor's chosen theme — dark, light or match my device. Stored only
  in the visitor's own browser; absent means dark.
- **Navigation item**: A label and destination address in the header or footer, with a flag for
  whether it is the current page.
- **Page metadata**: Title, description, canonical address, sharing image and alt text, page type
  and whether the page should be indexed; each page may override site-wide defaults. Absolute
  addresses are built from the serving deployment's address (fallback https://doncoleman.ca).
- **Reference screenshot**: An image of the current live site for a given page, screen width and
  theme, used as the visual target for comparison.
- **Design source mapping entry**: A Flux source part, what it becomes in the new site, and the
  owning feature (Foundation, Pages, Blog, Contact, or each feature).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The preview deployment matches the reference screenshots closely in both themes at
  mobile and desktop widths, as confirmed by Don when he reviews the preview, and 100% of the
  committed shell screenshot baselines (the closed set of 14 per operating system in FR-005a)
  pass on every run within the FR-005a threshold.
- **SC-002**: 100% of page templates pass the automated accessibility checks with zero violations
  of any impact level, running the checker's WCAG 2.0, 2.1 and 2.2 level A and AA rules, in both
  themes, at phone and desktop widths, with the mobile menu open, and with JavaScript disabled at
  phone width (FR-027).
- **SC-003**: For each stored choice (dark, light, match device with the device set to light and
  to dark, none, and an invalid value), across first load, reload, following an in-site link and
  back/forward navigation, with at least 5 loads each, the theme applied when the page body is
  first inserted equals the expected theme in 100% of loads (zero frames of the wrong theme).
- **SC-004**: Every page template individually (home and not-found) meets the "good" Core Web
  Vitals thresholds and the page budget on a simulated mobile device — 390×844 viewport, 4× CPU
  slowdown, network of 150 ms round trip, 1.6 Mbps down and 750 kbps up: largest content shown
  within 2.5 seconds, layout shift below 0.1, total long-task time at most 200 ms, at most 10 KB
  of JavaScript and at most 100 KB in total transferred per page load. Any template breaching
  any limit fails the run; results are never averaged across templates. The check runs against
  the production build (FR-027).
- **SC-005**: A keyboard-only user can reach and operate every link and control in the header,
  mobile menu, footer and theme switch, with visible focus at every step.
- **SC-006**: Every public page (FR-018; in this feature, the home page) appears in the search
  engine page list and has complete sharing metadata; zero public pages are missing either.
- **SC-007**: A branch preview is available within 10 minutes of a push whose checks pass, and the
  main build updates within 10 minutes of a passing merge, with no manual step. Time is measured
  from the push to the branch (for a preview) or from the merge commit landing on main (for the
  main build) to the new version being served at its address.
- **SC-008**: A deliberately failing check (a deterministic failing test, run with no automatic
  retries per FR-027a) blocks the merge and prevents any release, every time.
- **SC-009**: Loading any page sets zero tracking cookies.
- **SC-010**: A reader of the design source document can identify, for every Flux part listed in
  this feature's input, what it becomes and which feature ports it, without opening Flux.
- **SC-011**: The feature is done only when every one of these separately verifiable conditions
  holds: (a) the `verify` check passes in CI on the pull request's final commit; (b) Don confirms
  the preview matches the reference screenshots closely in both themes; (c) the design source
  document is committed; (d) the pull request carries the major-change label and Don's approval;
  (e) after merge, the main branch build is live on the temporary address,
  https://new.doncoleman.ca; and (f) every [PREVIEW-CHECK] item in this spec is confirmed.
  Partial satisfaction is not done.

## Assumptions

- The Flux theme is available to clone from Don's GitHub account. If it cannot be obtained, work
  stops and Don is asked; the design is not guessed.
- The current live site remains reachable long enough to capture the reference screenshots.
- The home page in this feature is a placeholder inside the shell; its real content (including
  the introduction card) comes with the Pages feature.
- Destinations that later features will build (Services, Speaking, Writing, Projects, About,
  Contact, privacy, terms and technology pages) show the not-found page until then.
- "Current year" in the copyright line is the year the site is built.
- The site-wide default sharing image is derived from the current site's branding; a better image
  can be supplied later without a spec change.
- The live domain doncoleman.ca is not switched over in this feature; the main build is served on
  the temporary address set up earlier and, like every preview, is not indexed.
- The build platform makes enough information available at build time to know the deployment's
  own address. The plan found that Workers Builds provides the branch name but not the address,
  so the preview address is derived from the branch name (FR-017a) and the preview deploy step
  publishes to exactly that address. This needs a one-time setting change by Don in the
  Cloudflare dashboard; until it is made, a preview's metadata names its branch address but the
  preview is not served there, so confirming that the first preview's
  canonical equals its served address is a [PREVIEW-CHECK] and a precondition for merge. Because
  addresses follow the serving deployment, the domain switch needs only the main build address
  and no-index settings changed alongside serving the site at doncoleman.ca.
- The automated accessibility checker covers only the automatable part of WCAG 2.2 AA. Keyboard,
  focus, naming and announcement behaviour (FR-007a, FR-008a, FR-010, FR-010a, FR-012a, FR-020a,
  FR-021a) is covered by end-to-end tests, and the rest by Don's review of the preview with a
  keyboard.
- Current evergreen browsers report changes to the device's light/dark setting to an open page.
  If a browser does not, the theme catches up on the next load; this is acceptable.
- Cloudflare Web Analytics keeps its beacon origins stable. If Cloudflare changes them, the
  main-build [PREVIEW-CHECK] in FR-024b catches it, and the policy is updated as its own reviewed
  change.
- Statistics use Cloudflare Web Analytics, the only analytics option the constitution allows,
  with automatic setup on the main build's address (setup item 18), which injects the beacon at
  Cloudflare's edge; expected additional monthly cost is zero (free tier).
- Setup documentation lives in `docs/setup.md` (the feature input refers to `docs/setup/`).

## Out of Scope and Follow-up Work

Recorded per the constitution's Development Workflow rule; none of this is done in passing here.

- **Pages feature**: page content for Home (including the introduction card from
  layout-author-hero), Services, Speaking, Projects landing, About, Contact landing, privacy,
  terms, technology; the page layout; image components (wide, full-width, feature image) usable
  in content.
- **Blog feature**: posts, listing, topics, code highlighting with light and dark themes and code
  block component, table wrapping without client script, share component, and the kg-* and code
  colour rules from Flux.
- **Portfolio feature**: project stories and listing (designed fresh; Flux list patterns are
  reference only).
- **Contact feature**: contact form and contact API (Fly.io, Toronto), spam protection.
- **Icons**: each later feature ports the Flux icons it uses.
- **Domain switch**: pointing doncoleman.ca at the new site, and removing the site-wide
  "do not index" instruction (FR-019) for the live domain at that time.
- **Font confirmation**: confirm the current site's real heading and body fonts from Ghost admin
  and, if they differ from the system font stack, update the design system (the accent colour,
  rust #d68844, is already confirmed).
- **External links**: Don updates the few external links to old blog addresses himself; no
  redirects are built.

## Technical direction (for planning)

Not requirements; carried forward from the feature input for the plan phase.

- Stack as given in the input: Astro static output on Cloudflare Workers static assets, Tailwind
  v4 via its official Vite plugin, TypeScript strict; official Astro integrations for sitemap and
  SEO metadata; Astro's built-in font and SVG support; security headers via Cloudflare's
  `_headers` file; Cloudflare Web Analytics. Each Astro choice must cite the Astro docs (via the
  Astro Docs MCP) per the constitution.
- The full Flux-to-site mapping, the list of dropped parts and the URL list in the feature input
  are the required content of `docs/design-source.md`, which is the first task.
- The input asks for deployment with Wrangler from GitHub Actions using the GitHub secrets
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. `docs/setup.md` (items 7 and 10) instead
  describes Cloudflare Workers Builds connected to the repository, with no Cloudflare token stored
  in GitHub. The plan must reconcile these against the setup actually in place and the
  "build on existing setup, don't recreate" instruction.
