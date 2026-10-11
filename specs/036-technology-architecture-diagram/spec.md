# Feature Specification: Interactive architecture diagram on the Technology page

**Feature Branch**: `036-technology-architecture-diagram`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description (GitHub issue #171, "Interactive architecture diagram on the Technology page"): "The Technology page is built around an interactive diagram of how the site actually works: the static pages, the questions panel with its database and Workers AI model, the bot check, the contact form's email path, and the difference between preview and production. Clicking a part of the diagram explains it briefly and opens its source code in the public repository."

## Background

The site already has a Technology page (`/technology/`, linked from the footer). Today it is
plain prose: sections on the site, hosting, design, the contact form, analytics, a data
locations table and a closing note. It describes the parts of the site one at a time but does
not show how they connect.

How the site works today, which the diagram has to show truthfully:

- **Static pages.** Every public page is built ahead of time into plain files and served from
  Cloudflare's network by one Worker. Only requests to `/api/` run code; everything else is a
  static file.
- **Questions panel.** Posts can show critical-thinking questions. The panel asks the questions
  API in the same Worker, which returns a saved set from the database (Cloudflare D1) or, if
  none is saved and the site-wide budget has room, asks a Workers AI model to write one, saves
  it and returns it. The budget, also kept in the database, limits how often the model is
  called; when it is empty the model is not called.
- **Bot check.** The contact form carries a Cloudflare Turnstile check; the contact API
  verifies it with Cloudflare before going further.
- **Contact form email path.** An accepted message is emailed through the Worker's email
  binding, from a sending address on a separate domain, to one fixed, verified address. Nothing
  is stored.
- **Preview and production.** Production is the main Worker at www.doncoleman.ca with its own
  database. Every branch gets a preview deployment on a separate preview Worker with a separate
  database; preview emails are marked as preview and the bot check accepts test keys there.

The source code is in a public GitHub repository (github.com/drcdev/dcc-web).

## Clarifications

### Session 2026-10-11

- Q: When a visitor activates a part, what happens with the source link, and does the
  repository open in the same tab or a new one? → A: The explanation shows a clearly labelled
  source link; the link opens in a new tab and is marked as opening in a new tab. Activating a
  part never opens the repository by itself.
- Q: Should source links point at the main branch or at the exact build commit? → A: The main
  branch (`/blob/main/...` for files, `/tree/main/...` for folders); the automated link check
  catches files that move or disappear.
- Q: What happens to the Technology page's existing prose sections? → A: Keep only what the
  diagram does not cover (Design, Analytics, the Data locations table and the closing note);
  the content of the other sections (Site, Hosting, Contact form, Questions) moves into the
  part explanations.
- Q: On a phone-width screen, is the diagram scaled down or a separate layout? → A: One
  vertical, top-to-bottom layout used at every width.
- Q: Where do the explanations live on the page? → A: Every part's explanation is listed below
  the diagram, each entry with its own anchor; each diagram part links to its entry. With
  JavaScript, the selected part and its entry are highlighted.

### Session 2026-10-11 (round 2)

- Q: Must every part have a source link, even parts with no code in this repository? → A: Each
  external part links to the code or committed configuration that uses it (the AI model to the
  questions API, the inbox to the email configuration, Turnstile to the contact API or widget);
  a part with neither, the reader's browser, has no source link.
- Q: Should production and preview be drawn as two full copies, or the system once? → A: The
  full system is drawn once as production, plus a small preview group with its own Worker and
  database; production and preview are each one part with their own entry.
- Q: After the page moves to a part's entry, how does the visitor get back to the diagram? →
  A: Each entry has a "Back to diagram" link; with JavaScript it returns focus to the part just
  activated, without JavaScript it goes to the diagram.

### Session 2026-10-11 (round 3)

- Q: Is the contact form a clickable part of the diagram with its own entry, alongside the
  questions panel? → A: Yes. The contact form is its own part with an entry and a source link;
  the diagram has 12 parts.
- Q: What is the smallest rendered size diagram label text may have at 320 px wide for it to
  count as "readable"? → A: At least 14 CSS px for part labels and at least 12 CSS px for
  connection labels.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how the site fits together (Priority: P1)

A visitor opens the Technology page and sees, near the top, one diagram of how the site works:
a reader's browser, the static pages, the questions panel with its database and AI model, the
bot check, the contact form's email path, and the split between preview and production. The
diagram reads correctly on its own, before anything is clicked.

**Why this priority**: The diagram is what the page is built around. A correct, readable
diagram has value even before any part of it responds to a click.

**Independent Test**: Open `/technology/` at phone and desktop widths in light and dark themes
and confirm every named part is present, labelled and connected as described in Background,
with nothing cut off or scrolling sideways.

**Acceptance Scenarios**:

1. **Given** the Technology page, **When** it loads, **Then** a diagram appears before the
   page's other sections and shows each of these 12 parts with a visible label: the reader's
   browser, static pages, the Worker's API, the questions panel, the contact form, the
   database, the AI model, the bot check, the email path, the contact inbox, production, and
   preview.
2. **Given** the diagram, **When** a visitor follows the lines between parts, **Then** the
   connections match how a request actually flows (for example, the questions panel reaches the
   AI model only through the API, and the contact form reaches the inbox only after the bot
   check).
3. **Given** a screen 320 px wide (the narrowest supported width), **When** the page loads,
   **Then** the diagram fits the page width with readable labels (part labels at least
   14 CSS px, connection labels at least 12 CSS px, measured as in SC-006), and the page does
   not scroll sideways. The diagram uses the same vertical, top-to-bottom layout at every width.

---

### User Story 2 - Click a part to learn what it does (Priority: P1)

A visitor clicks (or taps, or selects with the keyboard) a part of the diagram. The page takes
them to that part's short explanation in the list of explanations below the diagram, saying
what it does and why, in plain language, and highlights both the part and its entry. The
visitor can move to another part and the highlight moves with them.

**Why this priority**: This is the interactive half of the issue and the reason the diagram is
more than a picture.

**Independent Test**: Activate each part in turn with a mouse and with the keyboard alone, and
confirm each shows its own explanation and that focus and the selected state are visible.

**Acceptance Scenarios**:

1. **Given** the diagram, **When** a visitor activates a part, **Then** the page moves to that
   part's entry in the list of explanations below the diagram (a short explanation within the
   length limit of FR-013), and both the part and its entry are visibly marked as selected.
2. **Given** a part's entry, **When** the visitor follows its "Back to diagram" link, **Then**
   the page returns to the diagram; with JavaScript, focus returns to the part just activated.
3. **Given** one part is selected, **When** the visitor activates a different part, **Then**
   the page moves to the new part's entry and only the new part and its entry are marked as
   selected.
4. **Given** a keyboard-only visitor, **When** they press Tab and Shift+Tab through the page,
   **Then** every part can be reached in the drawing's order (top to bottom, then left to right,
   as FR-010 defines) and activated with Enter, with a visible focus indicator; a screen reader
   announces each part's name (its visible label) on focus, and on activation (with JavaScript)
   focus moves to the part's entry, so the screen reader reads the entry's heading (the part's
   name) and then its explanation.

---

### User Story 3 - Go from a part to its source code (Priority: P2)

From a part's explanation, the visitor can open the code that implements that part in the
public repository.

**Why this priority**: The issue asks for it, and it is what makes the page credible to a
technical reader, but the diagram and explanations stand without it.

**Independent Test**: For each part that has a source link, follow it and confirm it lands on
an existing file or folder in the public repository that implements or configures that part.

**Acceptance Scenarios**:

1. **Given** a part's explanation, **When** the visitor follows its source link, **Then** the
   public repository opens in a new tab at the file or folder that implements that part, or
   for an external service the code or configuration that uses it, on the main branch. The
   reader's browser has no source link. The link is clearly labelled as a source link and marked, in its visible
   text or accessible name, as opening in a new tab. Activating a diagram part never opens the
   repository by itself.
2. **Given** the site's build, **When** a source link points at a file or folder that does not
   exist in the repository, **Then** the build or test suite fails rather than publishing a
   broken link.

---

### User Story 4 - Read it all without JavaScript (Priority: P2)

A visitor with JavaScript turned off, or using assistive technology that does not handle the
diagram, still gets every part's explanation and, where the part has one, its source link.

**Why this priority**: Required by the constitution (core content readable without JavaScript;
WCAG 2.2 AA), and it protects the page if the interactive layer fails.

**Independent Test**: Load the page with JavaScript disabled and confirm the diagram still shows
and every part's explanation and source link (where it has one) can be read and followed.

**Acceptance Scenarios**:

1. **Given** JavaScript is off, **When** the page loads, **Then** the diagram is visible and
   every part's name, explanation and source link (where it has one) is present on the page in a readable form.
2. **Given** JavaScript is off, **When** a visitor activates a part of the diagram, **Then**
   they reach that part's entry in the list of explanations on the same page (each part is a
   link to its entry's anchor).

---

### Edge Cases

- A visitor lands on the page with a link to a specific part (for example from a post): the
  browser scrolls to that part's entry in the list of explanations, as for any fragment link,
  and the browser's next Tab starts from there. When JavaScript is on, the part and its entry
  are highlighted; focus is not moved by the script and the scroll position is not changed.
- The fragment is not a part's id (another heading on the page such as `#design`, or an
  unknown or malformed fragment): the browser's normal fragment behaviour applies (it scrolls
  to a matching element, or stays at the top if none matches), no part is selected, and any
  previous selection is cleared. Nothing errors.
- The enhancement script fails to load or errors: the page behaves exactly as with JavaScript
  off (User Story 4); part links, entries, source links and back links all still work. If the
  script runs after the browser has already moved to a part's fragment, it applies the
  selection for that fragment without moving focus or the scroll position.
- "Back to diagram" without JavaScript: the link goes to the diagram's anchor, so the browser
  scrolls to the diagram and the next Tab starts at the diagram's first part. Every entry
  belongs to a part that is in the diagram (the build fails otherwise, FR-007 and FR-009), so
  there is never a back link whose part is missing.
- A part in the diagram has no single source file (for example "preview vs production" is
  configuration plus CI): its link goes to the configuration that defines it, not to a made-up
  location. An external service (the AI model, Turnstile, the contact inbox) links to the code
  or committed configuration that uses it; the reader's browser has no source link.
- Very narrow screens (320 px): the same vertical layout is used as on wider screens; labels
  stay readable (part labels at least 14 CSS px, connection labels at least 12 CSS px) and the
  diagram does not require sideways scrolling.
- Dark theme and the high-contrast needs of WCAG 2.2 AA: parts, lines, labels and the selected
  and focus states keep at least AA contrast in both themes, at the thresholds FR-010 sets per
  element, and stay visible in forced-colours (Windows High Contrast) mode.
- The site's architecture changes later (a part added, removed or moved in the repository):
  the source-link check in User Story 3 fails the build so the diagram cannot silently go
  stale on links. Diagram accuracy beyond links remains a review responsibility, with the
  trigger and owner set in FR-019.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Technology page MUST show an architecture diagram of the site before its other
  content sections.
- **FR-002**: The diagram MUST include, as distinct labelled parts: the reader's browser; the
  static pages served from Cloudflare's network; the Worker's API; the questions panel; the
  contact form; the
  database that caches questions and holds the usage budget; the Workers AI model; the bot
  check (Turnstile); the contact email path and the fixed inbox it delivers to; and the
  preview and production environments. The system is drawn once, as production; preview is a
  small separate group showing its own Worker and its own database. Every other part appears
  once, with one entry and one anchor. There are 12 parts in all, listed with their anchors and
  source locations in the Parts table below.
- **FR-003**: The diagram MUST show the connections between parts as they work today, where
  "today" means as described in Background and as implemented by the committed code and
  configuration each part's source link points to (the Worker under `worker/src/`,
  `wrangler.jsonc`, the database migrations). The diagram MUST show exactly the connections in
  the Connections table below, each as a directed line with its label, and no others. Together
  they show that only `/api/` requests run code, that the AI model is called only when no saved
  question set exists and the budget has room (the same two conditions as Background), that
  the contact message is checked with the bot check before it is emailed, and that preview and
  production each have their own Worker and database.
- **FR-004**: Every part's short plain-language explanation MUST be listed below the diagram,
  one entry per part, each entry with its own anchor. Each diagram part MUST be a link to its
  entry, activatable by mouse, touch and keyboard (Enter). Each entry MUST end with a link whose
  visible text is "Back to diagram", the same text in every entry because every one goes back
  to the same diagram; its purpose is clear from the entry it sits in (WCAG 2.4.4). After a
  part is activated, with JavaScript focus moves to the part's entry; without JavaScript the
  browser's fragment navigation moves to the entry and the next Tab starts from there. With
  JavaScript, "Back to diagram" returns focus to the part just activated; without JavaScript it
  goes to the diagram's anchor and the next Tab starts at the diagram.
- **FR-005**: With JavaScript on, activating a part MUST mark that part and its entry as the
  current selection; only one part and entry are selected at a time, and both MUST be visually
  distinguished from the others by a cue that does not rely on colour alone (for example a
  thicker border plus a marker shape), and the selected part MUST be exposed to assistive
  technology as the current item. Selection, scrolling and focus changes use no animation or
  smooth scrolling, so no reduced-motion handling is needed. Without JavaScript, the link to the
  entry is the whole behaviour.
- **FR-006**: Each part's explanation MUST include a link to the file or folder in the public
  repository (github.com/drcdev/dcc-web) that implements it or, for an external service (the
  AI model, Turnstile, the contact inbox), the code or committed configuration that uses it.
  The reader's browser has no source link, by design; its absence is not a missing link. Links
  point at the main branch (`/blob/main/...` for a file, `/tree/main/...` for a folder). A part
  links to a single file when one file implements or configures it, and to a folder when its
  code is spread across the files of one folder (for example the database's migrations). The
  link URL is built from the repository path, never typed by hand, and file or folder is
  decided from what the path is. Every source link has the same visible form,
  "Source: <repository path>", followed by "(opens in a new tab)" as visible or visually
  hidden text inside the link, so the new-tab warning is always in its accessible name; this
  wording cannot be confused with "Back to diagram". The link opens in a new tab with
  `rel="noopener"` so the new tab cannot reach this page, and sends only what the site's
  existing `Referrer-Policy` header (`strict-origin-when-cross-origin`) allows: the site's
  origin, never the page path or fragment.
- **FR-007**: Every source link MUST be checked automatically against the repository's files,
  and a link to a path that does not exist MUST fail the release gate. The check covers that
  the path is inside the repository, exists and is tracked by git; whether the path is the
  right one for the part is a review responsibility (FR-019), not an automated check. A path
  outside the repository or missing from it stops the site build (and so the release gate) with
  an error that names the part file and the path; a path that exists but is not tracked by git
  fails the unit content test over the real part files, which is also part of the release gate.
- **FR-008**: With JavaScript turned off, the diagram MUST still render and, for each of the 12
  parts, its diagram link, its entry's name, explanation, "Connects to" line (where it has
  outgoing connections), source link (where it has one) and "Back to diagram" link MUST be
  present, readable and working on the page. Without JavaScript the page meets the same
  accessibility requirements as with it (FR-010: accessible names, visible focus, contrast,
  keyboard reach); only the selected state and the focus return of FR-004 and FR-005 need
  JavaScript.
- **FR-009**: Each part MUST be addressable by a link to the page (a fragment), so a visitor
  can be sent straight to a part's entry; the fragment is the entry's anchor. Anchors are the
  ids in the Parts table: lower-case words joined by hyphens, unique on the page (no collision
  with any heading's id), and stable, because posts and other sites may link to them. An anchor
  changes only in a reviewed change that says so; the 12 anchors are pinned by an automated
  test, so a rename cannot happen silently, and the build fails if a diagram part and its
  entry do not share the same anchor.
- **FR-010**: The diagram and its explanations MUST meet WCAG 2.2 AA in light and dark themes
  at all supported widths (320 px and wider), including:
  - **Names and structure.** Each part's accessible name is its visible label text (WCAG 2.5.3
    Label in Name), with no separate hidden name. The diagram is a figure with a caption
    saying what it shows, and the caption names the drawing as a group for assistive
    technology; boxes, lines, arrowheads and connection labels are hidden from assistive
    technology, because each entry's "Connects to" line (FR-017) carries what they show.
  - **Headings.** The diagram has no heading of its own (its caption names it); the list of
    explanations has one level-2 heading ("How each part works"); each entry's heading is
    level 3 and is the part's name; the kept sections (FR-014) stay level-2 headings. No
    heading level is skipped.
  - **Keyboard.** Part links come in the drawing's order (top to bottom, then left to right)
    and before the entries, so Tab follows the picture. Every part, source link and back link
    is reachable with Tab and Shift+Tab and activated with Enter; focus can always leave the
    diagram with Tab or Shift+Tab (no keyboard trap).
  - **Focus.** Each part's focus indicator encloses the part (or a group's label tab), is at
    least 2 CSS px thick, and has at least 3:1 contrast with the colours next to it in both
    themes; the focused part is never fully hidden by other page content (WCAG 2.4.11).
  - **Target size.** Every part link's clickable area is at least 24 × 24 CSS px at 320 px
    wide; source and back links meet WCAG 2.5.8 (24 × 24 CSS px or the spacing exception).
  - **Contrast, per element and theme.** Part and connection label text and entry text at
    least 4.5:1 against its background; lines, arrowheads, part borders, group frames, the
    focus indicator and the selected-state cue at least 3:1 against what is next to them.
  - **Forced colours.** In forced-colours (Windows High Contrast) mode, parts, lines, labels,
    the focus indicator and the selected-state cue remain visible, using system colours.
  - **Reflow, zoom and text spacing.** At 200% browser zoom and at 400% zoom of a 1280 px
    window (equivalent to 320 px), nothing is cut off and the page does not scroll sideways
    (WCAG 1.4.4, 1.4.10). With WCAG 1.4.12 text-spacing overrides, the list of explanations
    loses no content; diagram labels, which are repeated as entry headings, may be crowded but
    are not clipped.
- **FR-011**: The page MUST NOT load any third-party script or resource for the diagram: no
  script, stylesheet, font, image, iframe or preview from another origin, and nothing is
  requested from GitHub until a visitor follows a source link. Fonts come from the site's own
  self-hosted Inter. Any script the diagram adds MUST be limited to its interactivity, MUST be
  one deferred module script from the site's own origin that does not block rendering and is
  included only on the Technology page, and MUST fit inside the existing JavaScript budget
  (FR-012). The diagram MUST work under the site's existing Content Security Policy unchanged:
  no inline `style` attributes, no inline scripts that need a new hash, and no `<object>` or
  `<embed>`.
- **FR-012**: The page MUST stay within the site's existing performance budget, as the budget
  check (`tests/e2e/budget.spec.ts`) enforces on simulated mobile: Largest Contentful Paint at
  most 2.5 s, Cumulative Layout Shift at most 0.1, at most 10 KB of JavaScript and at most
  150 KB transferred in total.
- **FR-013**: The explanations and labels MUST be plain language with no hype or filler, and
  MUST NOT state anything about the site's behaviour that is not true today (for example, they
  must not say the contact form stores messages). Measurably:
  - each explanation is two to five sentences and at most 100 words (the "Connects to" line,
    source link and back link are not counted);
  - a technical name (Worker, D1, Turnstile, Workers AI, binding) is followed by a short plain
    description the first time it appears in an entry;
  - no marketing words (for example "blazing", "seamless", "cutting-edge") and no claim that
    cannot be checked against the code or configuration the entry links to.
  The contact path statements MUST match the constitution's private-data rules: nothing is
  stored in a database, file or log; each accepted message is emailed to one fixed, verified
  address set in committed configuration; no IP address is kept; preview emails are marked as
  preview. The production entry MUST say it is the main Worker serving www.doncoleman.ca with
  its own database; the preview entry MUST say every branch gets a preview on a separate
  Worker with a separate database, that preview emails are marked as preview and that the bot
  check accepts Turnstile test keys there.
- **FR-014**: The page MUST keep only the existing sections the diagram does not cover:
  `## Design`, `## Analytics`, `## Data locations` (with its table) and the closing note
  paragraph ("Curious about how something works? …"), in that order, after the diagram and its
  explanations. The `## Site`, `## Hosting` and `## Contact form` sections MUST be removed, and
  the `## Questions` heading that today sits above the closing note MUST be removed while the
  closing note itself stays (the heading would read as the questions panel). The page's
  one-line introduction moves into the diagram's caption. Still-true content of the removed
  sections MUST be carried into explanations, section by section:
  - Site (Astro builds static files; pages readable without JavaScript; content is Markdown
    checked when the site is built) → static pages;
  - Hosting (Cloudflare serves the pages; every change gets a preview) → static pages,
    production and preview;
  - Contact form (API in the same Worker; Turnstile check; emailed through Cloudflare Email
    Routing; nothing stored, no IP address kept; link to the privacy policy) → contact form,
    Worker API, bot check, email path and contact inbox.
- **FR-015**: The page's visibility and place in the navigation MUST stay as they are today
  (published, linked from the footer).
- **FR-016**: The diagram MUST use one vertical, top-to-bottom layout at every screen width;
  there is no separate wide or phone layout.
- **FR-017**: Each entry MUST include a "Connects to" line, generated from the same connection
  data that draws the lines, naming each part it sends to and the connection's label (omitted
  for a part with no outgoing connection). This is the text alternative for the lines.
- **FR-018**: Diagram text MUST use the site's own self-hosted Inter font, inherited from the
  page as all other page text is; the diagram is markup in the page, not an image, so the
  embedded glyph subsets used for SVG image files do not apply. Because Inter renders slightly
  wider on Linux than on macOS, every label MUST fit inside its box with room to spare, checked
  in a real browser at 320 px and desktop widths.
- **FR-019**: Keeping the diagram and explanations true is part of review: any pull request that
  changes the Worker (`worker/src/`), `wrangler.jsonc`, the database migrations, or a file or
  folder a part links to MUST be checked against the diagram and its explanations in the same
  pull request, and the page's editing notes MUST say so.
- **FR-020**: The feature MUST NOT add an API endpoint, data store, binding, service, npm
  dependency or recurring cost; its expected running cost change is $0 a month, and the page
  stays prerendered (Principles V and IX).

### Parts

Names are indicative and may be reworded in review; the anchors are fixed (FR-009). Source
locations are the initial choice under the FR-006 rule.

| Anchor | Part | Source link |
|---|---|---|
| `browser` | Your browser (holds the questions panel and contact form) | none, by design |
| `questions-panel` | Questions panel | `src/components/post/QuestionsPanel.astro` |
| `contact-form` | Contact form | `src/components/sections/ContactForm.astro` |
| `production` | Production (holds static pages, Worker API and database) | `wrangler.jsonc` |
| `static-pages` | Static pages | `src/pages` (folder) |
| `worker-api` | Worker API | `worker/src/index.ts` |
| `database` | D1 database | `migrations` (folder) |
| `ai-model` | Workers AI model | `worker/src/questions/generate.ts` (the code that calls it) |
| `bot-check` | Turnstile bot check | `worker/src/contact/turnstile.ts` (the code that verifies it) |
| `email-path` | Email sending | `worker/src/contact/email.ts` |
| `inbox` | Contact inbox | `wrangler.jsonc` (the binding that fixes the address) |
| `preview` | Preview (its own Worker and database) | `wrangler.jsonc` |

### Connections

| From | To | Label (indicative) | Shows |
|---|---|---|---|
| browser | static pages | every other request | only `/api/` runs code |
| questions panel | Worker API | /api/questions | the panel reaches the model only through the API |
| contact form | Worker API | /api/contact | |
| contact form | bot check | widget token | the Turnstile widget runs in the page |
| Worker API | database | saved questions, budget | |
| Worker API | AI model | no saved set, budget left | the model is called only on a miss with budget left |
| Worker API | bot check | verify token | the message is checked before it is emailed |
| Worker API | email path | if accepted | |
| email path | contact inbox | one fixed address | nothing is stored |

The preview group has no connection to any production part; its explanation and its own
Worker and database marks show that it is separate.

### Key Entities

- **Diagram part**: one labelled element of the architecture. Has a name, a short explanation,
  at most one source location in the repository, a stable identifier usable in a page link, and its
  connections to other parts.
- **Connection**: a directed line between two parts showing that one calls, serves or sends to
  the other, with an optional short label (for example "no saved set, budget left").
- **Environment**: preview or production. The system is drawn once as production; preview is a
  small group holding its own Worker and database.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All parts listed in FR-002 appear in the diagram, each with an explanation, and
  every part except the reader's browser has a source link (the browser's lack of one is by
  design and is not counted as missing); 100% of source links resolve to an existing path in the
  public repository.
- **SC-002**: A keyboard-only visitor can reach every part with Tab and Shift+Tab and open its
  explanation with Enter, with no keyboard trap.
- **SC-003**: The page passes the site's automated accessibility checks with zero violations in
  each of these states: light and dark themes, at 320 px and desktop widths, with no part
  selected and with a part selected. Forced-colours mode, which automated checks cannot judge,
  is covered by SC-007.
- **SC-004**: With JavaScript disabled, 100% of the parts' explanations and source links are
  readable on the page.
- **SC-005**: The page stays inside the site's existing performance budget (FR-012) and Core
  Web Vitals "good" thresholds on mobile.
- **SC-006**: At 320 px wide the page has no horizontal scroll, every part label renders at
  14 CSS px or larger, and every connection label renders at 12 CSS px or larger, in both
  themes. "Renders at" is the size on screen after the diagram is scaled to its container (the
  authored font size times the drawing's scale at that width), measured in a real browser, not
  the size written in the drawing's own units.
- **SC-007**: Before approval, a manual check on the preview deployment, listed in the pull
  request as `[PREVIEW-CHECK]` items, confirms: a keyboard-only pass through every part and
  back link; a screen-reader pass (VoiceOver with Safari) hearing each part's name on focus and
  its entry on activation; forced-colours mode showing parts, lines, focus and selection; and a
  reading of every explanation against how the site works today (FR-013).

## Assumptions

- The Technology page already exists, is published and is linked from the footer; this feature
  rebuilds it around the diagram rather than creating a new page.
- The repository github.com/drcdev/dcc-web is public, so source links need no sign-in. Its
  address is held in one place in the code. If the repository is renamed, moved or made
  private, the source links break (GitHub's rename redirects are not relied on) and that one
  address is updated in the same change; the link check (FR-007) checks paths, not the
  repository address.
- Links point at `main`, so on a pull request's preview a link to a file added by that same
  pull request does not resolve until it merges. This is accepted (Clarifications) and is
  noted for review, not treated as a defect.
- Explanations are authored content kept in the repository with the page, in plain language,
  within the limits of FR-013.
- The diagram covers only the parts the issue names. Analytics, CI and the design system are
  not diagram parts; their existing prose stays on the page (FR-014).
- "Preview vs production" is shown as two environments with their own Worker and database,
  not as a deployment pipeline walkthrough.
- No new API endpoint, data store, service or recurring cost is introduced (FR-020).
- Diagram text uses the site's own Inter, as set out in FR-018.

## Out of Scope / Follow-up

- Live data in the diagram (request counts, budget level, deployment status).
- Animating request flows step by step.
- Diagrams of CI, the visual test setup or the content pipeline.
- Changing the privacy policy or the facts on the page beyond what the diagram needs.
