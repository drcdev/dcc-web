# Feature Specification: Standalone pages use the same content card in light and dark mode

**Feature Branch**: `050-page-container-harmony`

**Created**: 2026-10-19

**Status**: Draft

**Issue**: [#181](https://github.com/drcdev/dcc-web/issues/181) "Harmonize dark and light mode container architecture in PageLayout"

**Input**: User description: "In the standard page layout, the content container applies an elevated card background and padding in dark mode, but has no card styling or padding in light mode (bare white page). The 404 page mirrors this asymmetry. This creates an inconsistent reading frame and differing horizontal margins between light and dark themes across all standalone pages (/about/, /work-with-me/, /technology/, /privacy-policy/, /terms-of-use/, and /404). Standardize the container treatment across both themes: matching card framing in light mode (rounded corners, a light border, white background, a subtle shadow; the dark card keeps its dusk background with a matching dark border) and consistent padding across viewports (smaller on phones, larger on wide screens). Update the standard page layout and the 404 page. Keep the text column measure comfortable on mobile and desktop. Acceptance: matching framing and padding in both modes; the 404 page mirrors it; reading column width and padding are identical when toggling themes; visual regression and accessibility checks pass."

## Background

Every page written as a file in the site's pages folder (home, About, Work with me, Technology,
Contact, Privacy policy, Terms of use, and the app privacy pages) is drawn by one standard page
layout: a title (or the home introduction card), an optional feature image, then the page body in
a content section capped at the article width (64rem), centred.

In dark mode that content section is a card: a rounded, slightly lighter dusk panel with 1.5rem of
padding on every side. In light mode it is nothing at all: the text sits straight on the white
page with no edge and no padding. The not-found page copies the same split.

So the same page has a different reading frame in each theme. In dark mode the text starts 1.5rem
inside a visible panel; in light mode it starts at the panel's outer edge. Switching theme moves
the text sideways and changes the line length, and light mode looks unfinished next to dark.

## Clarifications

### Session 2026-10-19

- Q: Should the home page body get the new light-mode card too, or only the standalone content pages and the not-found page? → A: Every page the standard layout draws gets the card, including home, contact and the app privacy pages.
- Q: Should the text inside the card be held to a prose reading width (about 65 characters), or fill the card up to the 64rem article width as today? → A: Keep the card at 64rem with today's prose styles inside it; lines shorten by at most 4rem from the padding.
- Q: In light mode, should the page behind the card stay plain white, or change to a light dusk tint? → A: Keep the white page; the 1 px border and smallest shadow set the card apart.
- Q: How much should automated tests cover when checking the card is identical across themes? → A: Browser tests measure About and the not-found page at 390, 640, 768 and 1280 px in both themes; the existing visual and accessibility suites cover the other templates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A standalone page reads inside the same card in either theme (Priority: P1)

A reader opens a standalone page, such as About, in light mode. The page body sits inside a card
with rounded corners, a fine border and a soft shadow, lifted off the page. They switch to dark
mode: the card is now dusk-coloured with a dark border, but it is in the same place, the same size,
and the text inside it starts and wraps at exactly the same points.

**Why this priority**: This is the whole point of the issue: one reading frame for both themes on
every standalone page.

**Independent Test**: Open any standalone page at a phone width and a desktop width, in light and
then dark mode, and compare the content card's position, size and inner padding, and where the
first line of body text starts.

**Acceptance Scenarios**:

1. **Given** a standalone page in light mode, **When** it loads, **Then** its body sits in a card
   with rounded corners, a visible light border, a white background and a subtle shadow, set apart
   from the page background.
2. **Given** a standalone page in dark mode, **When** it loads, **Then** its body sits in a card of
   the same shape, with the dusk card background and a matching dark border.
3. **Given** a standalone page at any viewport width, **When** the reader switches between light
   and dark mode, **Then** the card's width, its inner padding, and the position and width of the
   text column inside it do not change.

---

### User Story 2 - Padding suits the screen size (Priority: P2)

A reader on a phone gets a card with modest padding, so the text keeps most of the narrow screen.
A reader on a tablet or desktop gets more generous padding, so the card feels framed rather than
cramped.

**Why this priority**: The card must not cost phone readers line length, but it should breathe on
wide screens. It refines Story 1 rather than standing alone.

**Independent Test**: Measure the card's inner padding at 390 px, 640 px and 1280 px in each
theme.

**Acceptance Scenarios**:

1. **Given** a viewport narrower than 640 px, **When** a standalone page loads, **Then** the card's
   inner padding is 1rem on every side, in both themes.
2. **Given** a viewport from 640 px to under 768 px, **When** a standalone page loads, **Then** the
   inner padding is 1.5rem on every side, in both themes.
3. **Given** a viewport 768 px or wider, **When** a standalone page loads, **Then** the inner
   padding is 2rem on every side, in both themes.

---

### User Story 3 - The not-found page matches (Priority: P2)

A reader follows a dead link and lands on the not-found page. Its message sits in the same card,
with the same framing and padding, as every other standalone page, in both themes.

**Why this priority**: The not-found page is drawn separately from the standard layout, so it must
be changed on its own or it will be the one page left behind.

**Independent Test**: Open an address that does not exist, in each theme, and compare its content
card with a standalone page's at the same viewport width.

**Acceptance Scenarios**:

1. **Given** the not-found page in either theme, **When** it loads, **Then** its content card has
   the same shape, border, background, shadow and padding as a standalone page's card in that
   theme.

---

### Edge Cases

- **Home page**: the home page is drawn by the same layout, below its introduction card. Its body
  section (Now, Start here, Recent writing) gets the card too, as it already does in dark mode.
  The introduction card above it is unchanged.
- **Contact page**: the contact form sits inside the card in both themes, as it already does in
  dark mode. Its own fields and borders are unchanged.
- **Cards inside the card**: sections that draw their own boxes (the Now grid, tables, code blocks,
  the self-assessment accordion) keep their own styling; they now sit on a white card in light mode
  instead of the white page, which looks the same, and on the dusk card in dark mode, as today.
- **Wide and full-width images**: images marked wide or full-width break out past the content
  column. They keep doing so, extending past the card's edges as they already do in dark mode; the
  full-width image still spans the whole viewport.
- **Draft notice**: on a draft page the draft notice stays the first thing inside the card.
- **Narrow phones (320 px)**: the card's border and padding take 2rem plus 2 px of width out of the
  text column; body text still wraps without horizontal scrolling.
- **Forced colours / high contrast**: the card's edge comes from a real border, so it stays visible
  when the system replaces colours and drops shadows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The content section of every page drawn by the standard page layout MUST appear as a
  card in light mode: rounded corners (the same 1rem radius used in dark mode), a 1 px border in a
  light dusk tint, a white background and a subtle shadow.
- **FR-002**: In dark mode the same card MUST keep its dusk card background and gain a 1 px border in
  a dark dusk tint, so both themes have a visible edge of the same thickness.
- **FR-003**: The card's inner padding MUST be 1rem below 640 px, 1.5rem from 640 px, and 2rem from
  768 px, and MUST be identical in light and dark mode at every width. This replaces today's fixed
  1.5rem dark-only padding.
- **FR-004**: The card's outer width and position MUST be unchanged from today: centred, capped at
  the article width (64rem), the same in both themes.
- **FR-005**: The width and left edge of the text column inside the card MUST be identical in light
  and dark mode at every viewport width.
- **FR-006**: The not-found page's content section MUST use the same card treatment and padding as
  FR-001 to FR-003, in both themes.
- **FR-007**: The page title, the home introduction card and the feature image above the content
  card MUST be unchanged.
- **FR-008**: Text and link colours inside the card MUST keep meeting WCAG 2.2 AA contrast against
  the card background in both themes, and the card's border MUST be a decorative edge only (no
  meaning is carried by it alone).
- **FR-009**: Wide and full-width images inside the card MUST keep their current break-out widths
  (wide wider than the text column, full-width equal to the viewport width).
- **FR-010**: The change MUST add no client-side JavaScript and no new colours outside the site's
  existing theme.
- **FR-011**: Page templates whose screenshots change because of the card (standalone pages, the
  home page, the contact page and the not-found page, in each theme) MUST have their visual
  baselines refreshed in the same change, and the accessibility checks on every page template MUST
  pass.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the About page (representing every page the standard layout draws) and on the
  not-found page, at 390 px, 640 px, 768 px and 1280 px, the content card's bounding box and inner
  padding are identical in light and dark mode (0 px difference). Browser tests measure these two
  pages only; the other layout pages are covered by the visual and accessibility suites (SC-005).
- **SC-002**: On the same two pages and at the same widths, the first paragraph of body text starts
  at the same x position and has the same width in light and dark mode (0 px difference).
- **SC-003**: In light mode the content card's edge is visible against the page: it has a non-zero
  border and a non-transparent shadow on the About page and the not-found page.
- **SC-004**: Neither the About page nor the not-found page scrolls horizontally at 320 px wide in
  either theme.
- **SC-005**: Automated accessibility checks report zero violations on every page template in both
  themes, and the visual regression suite passes with the refreshed baselines.

## Assumptions

- **Scope covers every page the standard layout draws**, not only the five pages named in the
  issue. Home, Contact and the app privacy pages use the same layout and already get the dark card,
  so leaving them out would break the parity the issue asks for (confirmed in clarification). Blog posts, project stories and the
  writing and projects listings use their own layouts and are out of scope.
- **Padding values**: the issue lists both a fixed 1.5rem padding and a 1rem / 1.5rem / 2rem
  responsive scale. The responsive scale is used for both themes, because the issue asks for
  "consistent padding across viewports" and the fixed value would contradict it. This changes dark
  mode too: padding shrinks to 1rem on phones and grows to 2rem from 768 px.
- **Breakpoints** are the site's existing small (640 px) and medium (768 px) breakpoints.
- **Border and shadow tints** are the ones named in the issue: a light dusk tint at 80% opacity in
  light mode, a dark dusk tint at 80% opacity in dark mode, and the theme's smallest shadow. The
  shadow may be invisible against the dark page; the dark border carries the edge there.
- **Text measure**: the card stays capped at the article width (64rem) as today, and the prose
  styles keep their own measure inside it, so line length is not otherwise changed. The extra
  padding narrows the text column by at most 4rem at desktop widths and by 2rem on phones; this is
  accepted as the cost of the frame. No prose-width cap is added inside the card (confirmed in
  clarification).
- **The page background stays as it is**: white in light mode, the dusk base in dark mode. In light
  mode the white card is set apart from the white page only by its 1 px border and smallest shadow;
  no page background tint is added (confirmed in clarification).

## Out of Scope (follow-up work)

- Card treatment for blog posts, project stories and the writing and projects listings.
- Any change to the home introduction card, header, footer or page title styling.
- A shared card component or design token for "content card"; the plan may choose one, but this
  feature does not require it.
