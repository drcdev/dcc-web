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
  none is saved, asks a Workers AI model to write one, saves it and returns it. A site-wide
  budget, also kept in the database, limits how often the model is called.
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
   page's other sections and shows each of these parts with a visible label: static pages, the
   Worker's API, the questions panel, the database, the AI model, the bot check, the email
   path, the contact inbox, preview, and production.
2. **Given** the diagram, **When** a visitor follows the lines between parts, **Then** the
   connections match how a request actually flows (for example, the questions panel reaches the
   AI model only through the API, and the contact form reaches the inbox only after the bot
   check).
3. **Given** a phone-width screen, **When** the page loads, **Then** the diagram fits the page
   width with readable labels, and the page does not scroll sideways. The diagram uses the
   same vertical, top-to-bottom layout at every width.

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
   part's entry in the list of explanations below the diagram (a short explanation of no more
   than a few sentences), and both the part and its entry are visibly marked as selected.
2. **Given** one part is selected, **When** the visitor activates a different part, **Then**
   the page moves to the new part's entry and only the new part and its entry are marked as
   selected.
3. **Given** a keyboard-only visitor, **When** they tab through the page, **Then** every
   interactive part can be reached and activated, in a sensible order, with a visible focus
   indicator; a screen reader announces each part's name and, on activation, its explanation.

---

### User Story 3 - Go from a part to its source code (Priority: P2)

From a part's explanation, the visitor can open the code that implements that part in the
public repository.

**Why this priority**: The issue asks for it, and it is what makes the page credible to a
technical reader, but the diagram and explanations stand without it.

**Independent Test**: For each part, follow its source link and confirm it lands on an existing
file or folder in the public repository that implements that part.

**Acceptance Scenarios**:

1. **Given** a part's explanation, **When** the visitor follows its source link, **Then** the
   public repository opens in a new tab at the file or folder that implements that part on
   the main branch. The link is clearly labelled as a source link and marked, in its visible
   text or accessible name, as opening in a new tab. Activating a diagram part never opens the
   repository by itself.
2. **Given** the site's build, **When** a source link points at a file or folder that does not
   exist in the repository, **Then** the build or test suite fails rather than publishing a
   broken link.

---

### User Story 4 - Read it all without JavaScript (Priority: P2)

A visitor with JavaScript turned off, or using assistive technology that does not handle the
diagram, still gets every part's explanation and source link.

**Why this priority**: Required by the constitution (core content readable without JavaScript;
WCAG 2.2 AA), and it protects the page if the interactive layer fails.

**Independent Test**: Load the page with JavaScript disabled and confirm the diagram still shows
and every part's explanation and source link can be read and followed.

**Acceptance Scenarios**:

1. **Given** JavaScript is off, **When** the page loads, **Then** the diagram is visible and
   every part's name, explanation and source link is present on the page in a readable form.
2. **Given** JavaScript is off, **When** a visitor activates a part of the diagram, **Then**
   they reach that part's entry in the list of explanations on the same page (each part is a
   link to its entry's anchor).

---

### Edge Cases

- A visitor lands on the page with a link to a specific part (for example from a post): the
  page opens at that part's entry in the list of explanations, with the part and its entry
  highlighted when JavaScript is on.
- A part in the diagram has no single source file (for example "preview vs production" is
  configuration plus CI): its link goes to the configuration that defines it, not to a made-up
  location.
- Very narrow screens (320 px): the same vertical layout is used as on wider screens; labels
  stay readable and the diagram does not shrink text below a readable size or require
  sideways scrolling.
- Dark theme and the high-contrast needs of WCAG 2.2 AA: parts, lines, labels and the selected
  and focus states keep at least AA contrast in both themes.
- The site's architecture changes later (a part added, removed or moved in the repository):
  the source-link check in User Story 3 fails the build so the diagram cannot silently go
  stale on links. Diagram accuracy beyond links remains a review responsibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Technology page MUST show an architecture diagram of the site before its other
  content sections.
- **FR-002**: The diagram MUST include, as distinct labelled parts: the reader's browser; the
  static pages served from Cloudflare's network; the Worker's API; the questions panel; the
  database that caches questions and holds the usage budget; the Workers AI model; the bot
  check (Turnstile); the contact email path and the fixed inbox it delivers to; and the
  preview and production environments.
- **FR-003**: The diagram MUST show the connections between parts as they work today (as
  described in Background), including that only `/api/` requests run code, that the AI model is
  called only when no saved question set exists and the budget allows, that the contact
  message is checked before it is emailed, and that preview and production each have their
  own Worker and database.
- **FR-004**: Every part's short plain-language explanation MUST be listed below the diagram,
  one entry per part, each entry with its own anchor. Each diagram part MUST be a link to its
  entry, activatable by mouse, touch and keyboard.
- **FR-005**: With JavaScript on, activating a part MUST mark that part and its entry as the
  current selection; only one part and entry are selected at a time, and both MUST be visually
  distinguished from the others. Without JavaScript, the link to the entry is the whole
  behaviour.
- **FR-006**: Each part's explanation MUST include a link to the file or folder in the public
  repository (github.com/drcdev/dcc-web) that implements it, on the main branch
  (`/blob/main/...` for a file, `/tree/main/...` for a folder). The link is clearly labelled as
  a source link, opens in a new tab, and is marked in its visible text or accessible name as
  opening in a new tab.
- **FR-007**: Every source link MUST be checked automatically against the repository's files,
  and a link to a path that does not exist MUST fail the release gate.
- **FR-008**: With JavaScript turned off, the diagram MUST still render and every part's name,
  explanation and source link MUST be readable on the page.
- **FR-009**: Each part MUST be addressable by a link to the page (a fragment), so a visitor
  can be sent straight to a part's entry; the fragment is the entry's anchor.
- **FR-010**: The diagram and its explanations MUST meet WCAG 2.2 AA in light and dark themes
  at all supported widths, including visible focus, sufficient contrast and accessible names
  for every part.
- **FR-011**: The page MUST NOT load any third-party script or resource for the diagram, and any
  script it adds MUST be limited to the diagram's interactivity and loaded no earlier than
  needed.
- **FR-012**: The page MUST stay within the site's existing performance budget.
- **FR-013**: The explanations and labels MUST be plain language with no hype or filler, and
  MUST NOT state anything about the site's behaviour that is not true today (for example, they
  must not say the contact form stores messages).
- **FR-014**: The page MUST keep only the existing sections the diagram does not cover:
  Design, Analytics, the Data locations table and the closing note, after the diagram and its
  explanations. The Site, Hosting, Contact form and Questions sections MUST be removed, with
  their still-true content carried into the relevant part explanations.
- **FR-015**: The page's visibility and place in the navigation MUST stay as they are today
  (published, linked from the footer).
- **FR-016**: The diagram MUST use one vertical, top-to-bottom layout at every screen width;
  there is no separate wide or phone layout.

### Key Entities

- **Diagram part**: one labelled element of the architecture. Has a name, a short explanation,
  one source location in the repository, a stable identifier usable in a page link, and its
  connections to other parts.
- **Connection**: a directed line between two parts showing that one calls, serves or sends to
  the other, with an optional short label (for example "on a cache miss").
- **Environment**: preview or production; groups the parts that exist separately in each.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All parts listed in FR-002 appear in the diagram, each with an explanation and a
  source link; 100% of source links resolve to an existing path in the public repository.
- **SC-002**: A keyboard-only visitor can reach and open every part's explanation using only
  Tab and Enter, with no keyboard trap.
- **SC-003**: The page passes the site's automated accessibility checks with zero violations in
  both themes, with and without a part selected.
- **SC-004**: With JavaScript disabled, 100% of the parts' explanations and source links are
  readable on the page.
- **SC-005**: The page stays inside the site's existing performance budget and Core Web Vitals
  "good" thresholds on mobile.
- **SC-006**: At 320 px wide the page has no horizontal scroll and every diagram label remains
  readable.

## Assumptions

- The Technology page already exists, is published and is linked from the footer; this feature
  rebuilds it around the diagram rather than creating a new page.
- The repository github.com/drcdev/dcc-web is public, so source links need no sign-in.
- Explanations are authored content kept in the repository with the page, in plain language,
  a few sentences each.
- The diagram covers only the parts the issue names. Analytics, CI and the design system are
  not diagram parts; their existing prose stays on the page (FR-014).
- "Preview vs production" is shown as two environments with their own Worker and database,
  not as a deployment pipeline walkthrough.
- No new API endpoint, data store, service or recurring cost is introduced; the page stays
  prerendered (Principle V).
- Diagram text follows the site's existing approach to fonts in diagrams.

## Out of Scope / Follow-up

- Live data in the diagram (request counts, budget level, deployment status).
- Animating request flows step by step.
- Diagrams of CI, the visual test setup or the content pipeline.
- Changing the privacy policy or the facts on the page beyond what the diagram needs.
