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
2. **Given** a visitor on a phone-width screen, **When** the page loads, **Then** the navigation
   links are hidden behind a menu button, and activating the button reveals them; activating it
   again, pressing Escape, or choosing a link closes the menu.
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

**Independent Test**: Run a built page through a sharing-preview inspector and check the site's
page list for search engines against the set of built public pages.

**Acceptance Scenarios**:

1. **Given** any public page, **When** its metadata is inspected, **Then** it has a unique title,
   a description, a canonical address, and sharing-preview title, description, image and page
   type.
2. **Given** a page that sets no description or sharing image of its own, **When** it is shared,
   **Then** site-wide defaults are used, so the preview is never empty.
3. **Given** the built site, **When** a search engine reads it, **Then** a machine-readable list
   of every public page is available and referenced from the site's crawler instructions, and the
   not-found page is not in it.
4. **Given** a preview (non-main) deployment, **When** a search engine reaches it, **Then** it is
   told not to index that preview.

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

**Independent Test**: Visit a preview or the main build and confirm visits appear in the
statistics view, and that no cookies are set by the site.

**Acceptance Scenarios**:

1. **Given** a visitor loads a page, **When** the visit is recorded, **Then** no cookie or other
   persistent identifier is set for tracking.
2. **Given** statistics are collected, **When** Don opens the statistics view, **Then** he sees
   page views for the main site.
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
  render and work; the site shows the dark theme; on small screens the navigation remains
  reachable (the menu must not depend on script to be usable, or its links must be otherwise
  reachable).
- Stored theme value is missing, corrupted or unrecognised: the site treats it as no choice and
  uses dark.
- Browser storage unavailable (private mode, blocked site data): theme switching works for the
  current page without errors.
- Mobile menu open when the window is resized to desktop width: the layout shows the desktop
  navigation and the menu does not remain stuck open over content.
- Mobile menu open and the visitor presses Escape or tabs past the last link: the menu closes or
  focus behaves predictably, and focus returns to the menu button when closed with Escape.
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
- **FR-002**: Each palette MUST remain adjustable by changing a single base value, as in Flux.
- **FR-003**: The site MUST use a fixed accent colour and a fixed heading font and body font
  matching the current site's settings, with fonts served from the site itself (no third-party
  font service). [NEEDS CLARIFICATION: What accent colour and heading and body fonts are set in
  Ghost admin (Settings → Design)? If unknown, use the rust base (#d68844) and a system font
  stack, and record a follow-up to confirm them.]
- **FR-004**: The site MUST NOT include any Ghost-only elements: member sign-up, subscribe,
  sign-in or account buttons, the member portal, Ghost search, or comments.
- **FR-005**: Before any styling work, reference screenshots of the current live site (home page,
  one post, and /about/) MUST be captured at a mobile width and a desktop width in both the dark
  and light themes, stored in the repository, and used to compare the new site against.

**Site shell**

- **FR-006**: Every page MUST share one header containing the site name (linking home) and the
  navigation links Home, Services, Speaking, Writing, Projects, About, Contact, in that order.
  Navigation and footer links to pages that later features will create MUST point at their final
  addresses; until those pages exist, requests for them show the not-found page, and the
  automated checks MUST NOT fail because of these known future destinations.
- **FR-007**: On small screens the navigation MUST collapse behind a menu button that exposes its
  open/closed state to assistive technology, can be operated by keyboard, closes on Escape
  (returning focus to the button) and closes when a link is chosen.
- **FR-008**: Every page MUST share one footer containing links to /privacy-policy/,
  /terms-of-use/, /technology/, https://github.com/drcdev and
  https://www.linkedin.com/in/drcdev, a copyright line with Don's name and the current year, and
  the theme switch. Social links MUST use recognisable icons with accessible names.
- **FR-009**: The navigation link for the current page MUST be identified as current, visually and
  to assistive technology.
- **FR-010**: Every page MUST provide a "skip to main content" link as the first focusable
  element.

**Themes**

- **FR-011**: The site MUST offer dark and light themes, with dark as the default for visitors who
  have not made a choice.
- **FR-012**: A theme switch MUST cycle dark → light → match my device → dark, and MUST announce
  its purpose and current state to assistive technology.
- **FR-013**: The visitor's theme choice MUST be remembered in their own browser across pages and
  visits, without cookies, and MUST be applied before the page is first painted so the wrong theme
  never flashes.
- **FR-014**: In "match my device" mode the site MUST follow the device's light/dark setting,
  including changes made while the page is open.
- **FR-015**: If the stored choice is missing, invalid or cannot be read or written, the site MUST
  fall back to dark without errors.

**Not-found page**

- **FR-016**: Requests for addresses that do not exist MUST return a not-found status and a
  not-found page in the site's design that explains the problem in plain language and links to
  the home page and main navigation.

**Search and sharing**

- **FR-017**: Every public page MUST have a unique title, a description, a canonical address, and
  sharing-preview metadata (title, description, image with alt text, page type, site name), with
  site-wide defaults for any value a page does not set.
- **FR-018**: The site MUST publish a machine-readable list of every public page for search
  engines, referenced from its crawler instructions, excluding the not-found page.
- **FR-019**: Preview (non-main) deployments MUST ask search engines not to index them.

**Quality and accessibility**

- **FR-020**: Every page MUST meet WCAG 2.2 AA in both themes, including colour contrast, visible
  focus, keyboard operability, correct landmarks and headings, and a declared page language.
- **FR-021**: The layout MUST work without horizontal scrolling from 320px wide to large desktop
  widths, and MUST respect reduced-motion preferences.
- **FR-022**: Pages MUST be readable and navigable with JavaScript turned off; only the theme
  switch, the theme-before-paint step and (if needed) the mobile menu may use script.
- **FR-023**: Every public page MUST be generated ahead of time; no public page is rendered per
  request.

**Security**

- **FR-024**: The site MUST send security headers on every response, including a content security
  policy based on Flux's, tightened to remove the sources that no longer apply (the old form
  service, the public script CDN and the old database service) and allowing only the site itself
  and the privacy-respecting statistics service.

**Visitor statistics**

- **FR-025**: The site MUST collect privacy-respecting visitor statistics (page views, referrers,
  countries, device types) that set no tracking cookies and build no personal profiles, using the
  statistics service permitted by the constitution.
- **FR-026**: If the statistics script is blocked or fails, the site MUST work exactly as before.

**Release pipeline**

- **FR-027**: Every push MUST run an automated check suite covering linting, type checks, unit and
  component tests, end-to-end tests in a real browser, automated accessibility checks on every
  page template in both themes, a production build, and a performance budget.
- **FR-028**: Every branch MUST get its own preview address showing that branch's build.
- **FR-029**: The main site build MUST update automatically when changes reach the main branch,
  and only after the full check suite passes there.
- **FR-030**: A failing check MUST block the merge and the release. Checks may not be skipped or
  weakened to get a change through.
- **FR-031**: The pipeline MUST build on the setup already completed (the existing hosting
  project, stored credentials, branch protection, the major-change label and the temporary main
  build address) rather than recreate it.

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
  and whether the page should be indexed; each page may override site-wide defaults.
- **Reference screenshot**: An image of the current live site for a given page, screen width and
  theme, used as the visual target for comparison.
- **Design source mapping entry**: A Flux source part, what it becomes in the new site, and the
  owning feature (Foundation, Pages, Blog, Contact, or each feature).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The preview deployment matches the reference screenshots closely in both themes at
  mobile and desktop widths, as confirmed by Don when he reviews the preview.
- **SC-002**: 100% of page templates pass the automated accessibility checks with zero WCAG 2.2 AA
  violations in both themes.
- **SC-003**: In repeated automated loads with each stored theme choice, the first painted frame
  shows the correct theme every time (zero flashes of the wrong theme).
- **SC-004**: Every page template meets the "good" Core Web Vitals thresholds on a simulated mobile
  device (largest content shown within 2.5 seconds, layout shift below 0.1), and the check fails
  the run if a budget is exceeded.
- **SC-005**: A keyboard-only user can reach and operate every link and control in the header,
  mobile menu, footer and theme switch, with visible focus at every step.
- **SC-006**: Every public page appears in the search engine page list and has complete sharing
  metadata; zero public pages are missing either.
- **SC-007**: A branch preview is available within 10 minutes of a push whose checks pass, and the
  main build updates within 10 minutes of a passing merge, with no manual step.
- **SC-008**: A deliberately failing check blocks the merge and prevents any release, every time.
- **SC-009**: Loading any page sets zero tracking cookies.
- **SC-010**: A reader of the design source document can identify, for every Flux part listed in
  this feature's input, what it becomes and which feature ports it, without opening Flux.
- **SC-011**: The feature is done when all checks pass in CI, the preview matches the reference
  screenshots closely in both themes, the design source document is committed, the main branch
  build is live on the temporary address, and Don has approved the pull request labelled as a
  major change.

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
  the temporary address set up earlier.
- Statistics use Cloudflare Web Analytics, the only analytics option the constitution allows;
  expected additional monthly cost is zero (free tier).
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
- **Domain switch**: pointing doncoleman.ca at the new site.
- **Font and accent confirmation**: if clarification falls back to the defaults, confirm the real
  accent colour and fonts from Ghost admin and update the design system.
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
