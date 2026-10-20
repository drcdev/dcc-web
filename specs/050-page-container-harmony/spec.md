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
  dark mode. Its own fields and borders, labels, error messages and focus order are unchanged.
- **Cards inside the card**: sections that draw their own boxes (the Now grid, Start here, tables,
  code blocks, the self-assessment accordion) keep their own styling unchanged. In light mode the
  colour behind them is white before and after (the white page, now the white card), so each keeps
  exactly the edge and contrast it has today; only its position shifts inward by the card's border
  and padding. In dark mode they sit on the dusk card, as today.
- **Wide and full-width images**: images marked wide or full-width break out past the content
  column. They keep doing so, extending past the card's edges as they already do in dark mode; the
  full-width image still spans the whole viewport.
  Where a wide or full-width image crosses the card's side edges it is drawn over the card's border
  (the border is not drawn across the image), and the image keeps its own corners; the card's
  rounded corners apply to the card only. This is today's dark-mode behaviour, now in both themes.
- **Tables and code blocks**: in the narrower text column they keep today's behaviour: a table or
  code block wider than the column scrolls sideways inside its own box (which is keyboard-focusable
  with a visible focus ring, as today); the page itself never scrolls sideways.
- **Long unbreakable strings**: a long web address or word in body text wraps inside the text
  column, as today, at every width including 320 px.
- **Draft notice**: on a draft page the draft notice stays the first thing inside the card. Its top
  edge sits on the card's inner padding (no extra gap above it), and its own bottom margin and box
  styling are unchanged.
- **Narrow phones (320 px)**: the card's border and padding take 2rem plus 2 px of width out of the
  text column; body text still wraps without horizontal scrolling.
- **Landscape phones and browser zoom**: the padding steps follow the viewport's CSS width, so a
  landscape phone (for example 844 px wide) gets the 2rem padding, and 200% or 400% browser zoom
  gets the step for the resulting CSS width (400% zoom of a 1280 px window is the 320 px case).
- **Very short pages (not-found)**: the card is only as tall as its content; it has no minimum
  height. The footer stays at the bottom of the viewport on a short page, as today.
- **Contact form at 320 px**: the form's labels, fields, error messages and focus order are
  unchanged; its fields fill the narrower text column and the page does not scroll sideways.
- **Forced colours / high contrast**: the card's edge comes from a real border, so it stays visible
  when the system replaces colours and drops shadows. The system's own colour pair (its canvas
  colour behind its text colour) replaces the card background and text colours; the feature sets
  no forced-colours override of its own.
- **Theme on first paint**: the card's colours follow the theme the site's existing theme script
  applies before first paint, whether chosen by the reader or taken from the system preference.
  The card adds nothing that could show the wrong theme's colours first.
- **Text spacing overrides**: the card has no fixed height and does not clip its content, so when
  a reader increases line height, letter, word or paragraph spacing (WCAG 1.4.12) the card grows
  and no text is cut off.

## Requirements *(mandatory)*

### Pages covered

The card applies to exactly these pages: the home page, About, Work with me, Technology, Contact,
Privacy policy, Terms of use, every app privacy page (`/privacy/<app>/`), and the not-found page.
That is every page the standard page layout draws, plus the not-found page. Blog posts, project
stories, and the writing and projects listings (including topic and series pages) are excluded.

### Card properties per theme

This table is the single authority for the card's look. Colours are named entries of the site's
existing theme; values in rem are the authority over any implementation name for them.

| Property | Light mode | Dark mode |
|---|---|---|
| Outer width and position | centred, capped at 64rem (unchanged) | same |
| Corner radius | 1rem | same |
| Border | 1 px solid, theme colour dusk-200 at 80% opacity | 1 px solid, dusk-700 at 80% opacity |
| Background | white | dusk-800 (unchanged) |
| Shadow | the theme's smallest blurred shadow: 0 1px 2px 0 black at 5% opacity | same value; may be invisible on the dusk page |
| Inner padding, viewport ≤ 639 px | 1rem every side | same |
| Inner padding, 640–767 px | 1.5rem every side | same |
| Inner padding, ≥ 768 px | 2rem every side | same |
| Space below the card | 2rem (unchanged) | same |

### Functional Requirements

- **FR-001**: The content section of every page listed under "Pages covered" MUST appear as a card
  in light mode with the light-mode values in the table: rounded corners (the same 1rem radius
  used in dark mode), a 1 px border in a light dusk tint, a white background and a subtle shadow.
- **FR-002**: In dark mode the same card MUST keep its dusk card background and gain a 1 px border in
  a dark dusk tint, so both themes have a visible edge of the same thickness. In dark mode the
  border is the only required edge; the shadow is allowed to be invisible against the dark page.
- **FR-003**: The card's inner padding MUST be 1rem at viewport widths up to and including 639 px,
  1.5rem from 640 px up to and including 767 px, and 2rem from 768 px upward with no upper limit
  (so also above the 64rem cap), and MUST be identical in light and dark mode at every width. This
  replaces today's fixed 1.5rem dark-only padding and is the single authority on padding (see
  Assumptions for why the issue's fixed 1.5rem value is not used).
- **FR-004**: The card's outer width and position MUST be unchanged from today: centred, capped at
  the article width (64rem), the same in both themes. The page gutter outside the card (1rem on
  each side between the viewport edge and the card on narrow screens) and the vertical spacing
  around the card (the gap to the title, introduction card or feature image above it, 2rem below
  it, and the distance to the header and footer) are unchanged at every width. Wide and
  full-width images that break out past the card (FR-009) are not part of the card's box and do
  not change it.
- **FR-005**: The width and left edge of the text column inside the card MUST be identical in light
  and dark mode at every viewport width. The text column is the card's width minus its two 1 px
  borders and its padding on both sides: at 320 px it is 254 px (320 − 2 × 16 gutter − 2 − 2 × 16
  padding), and at 1280 px it is 958 px (1024 − 2 − 2 × 32).
- **FR-006**: The not-found page's content section MUST use the same card treatment and padding as
  FR-001 to FR-003, in both themes, with no page-specific exception to the card's border,
  background, radius, shadow, padding, width or spacing. Its only difference is its content: its
  single `h1` ("Page not found") is inside the card, because the not-found page has no title
  section above it. The card sits inside the page's single main landmark, as on every other
  covered page, and is not itself a named landmark or region.
- **FR-007**: The page title, the home introduction card and the feature image above the content
  card MUST be unchanged. They and the card share the same 64rem cap and centring, so their left
  and right outer edges stay aligned at every width, as today.
- **FR-008**: Text and link colours inside the card MUST keep meeting WCAG 2.2 AA contrast against
  the card background in both themes. In light mode the colour behind the text is white before and
  after this change (body dusk-700, headings dusk-900, links and muted text in their existing light
  prose colours, on white); in dark mode it is dusk-800 before and after (the existing inverted
  prose colours on dusk-800). Because no text colour and no colour behind text changes, today's
  passing contrast carries over, and the accessibility checks (SC-005) confirm it. The card's border
  and shadow MUST be decorative only: they mark no state, focus, selection, error or boundary of an
  interactive control, and no meaning depends on seeing them. The card is not a user-interface
  component, so WCAG 1.4.11 (non-text contrast) does not apply to its edge, and the light border is
  not required to reach 3:1 against the page; the light card's required separation from the white
  page is the 1 px border with the shadow as a supplement, and no contrast ratio is set for either.
- **FR-009**: Wide and full-width images inside the card MUST keep their current break-out widths
  (wide wider than the text column, full-width equal to the viewport width).
- **FR-010**: The change MUST add no client-side JavaScript and no new colours outside the site's
  existing theme. "Existing theme" means the colour entries already defined in the site's theme
  (the dusk, mist, accent and other named scales and their shades) plus white, black and
  transparent; an opacity applied to an existing entry is not a new colour. The card MUST render
  identically with JavaScript turned off (it is drawn by styling alone), so every covered page
  stays readable without JavaScript.
- **FR-011**: The visual baselines whose screenshots change because of the card MUST be refreshed in
  the same change, on both platforms the visual suite runs on (macOS, and Linux generated in
  Docker). The expected set is: the full not-found page; the full test page that holds every
  content section (a standard-layout page with a feature image, wide and full-width images and a
  long web address, standing in for the standalone pages); the full home page with Now and Start
  here; and the contact form. Each is shot at phone (390 px) and desktop (1280 px) width in both
  themes. Dark-mode baselines change too, because dark padding moves from a fixed 1.5rem to the
  responsive scale. Every other baseline (header, footer, open menu, post, project story, lead
  story, listing cards, series, project row, retired story header) MUST stay unchanged; a change
  to one of them is a regression to investigate, not to refresh. The draft notice gets no new
  baseline: its place as the card's first child is a structure requirement checked without
  screenshots.
- **FR-012**: The reviewer of each refreshed baseline MUST compare it with the previous image and
  with the card properties table, and accept it only if the card's border, radius, shadow and
  padding match the table and nothing outside the card has changed beyond the card's own shift.
  A refreshed image passes the visual suite by construction, so it is not on its own evidence that
  the card is right; conformance comes from SC-001 to SC-003 and this review.
- **FR-013**: Focus indicators of links and form controls inside the card MUST be fully visible:
  the card MUST NOT clip its content (no hidden overflow), and the inner padding (at least 1rem)
  is wider than the site's existing focus ring (2 px outline offset 2 px), so a focus ring next to
  the card's edge or rounded corner is never cut off (WCAG 2.4.7, 2.4.11).
- **FR-014**: Document and reading order MUST be unchanged: the page title or home introduction
  card, then the feature image, then the card; inside the card, the draft notice (when present)
  first, then the page body.

## Success Criteria *(mandatory)*

### Measurable Outcomes

The browser geometry tests own the box rules (FR-003 to FR-005, SC-001 to SC-004) on two
representative pages. The visual suite owns the look of the other covered templates (FR-001,
FR-002, FR-011, SC-005), and the accessibility suite owns FR-008 and the accessibility parts of
SC-005.

- **SC-001**: On the About page (representing every page the standard layout draws) and on the
  not-found page, at 390 px, 640 px, 768 px and 1280 px, the content card's bounding box and inner
  padding are identical in light and dark mode (0 px difference). Both themes are measured in the
  same browser on the same page load by switching the theme in place, so no cross-engine sub-pixel
  rounding applies and the 0 px tolerance is exact. Browser tests measure these two pages only; the
  other layout pages are covered by the visual and accessibility suites (SC-005).
- **SC-002**: On the same two pages and at the same widths, the first paragraph of body text starts
  at the same x position and has the same width in light and dark mode (0 px difference, measured
  as in SC-001).
- **SC-003**: In light mode the content card's edge is visible against the page: on the About page
  and the not-found page its computed styles show a border width of at least 1 px and a box shadow
  other than none. This is read from computed styles, not screenshots, so it holds the same on
  every platform regardless of font or anti-aliasing differences.
- **SC-004**: Neither the About page nor the not-found page scrolls horizontally at 320 px wide in
  either theme. This is also the WCAG 1.4.10 reflow case (400% zoom of a 1280 px window), and the
  existing 320 px check on every page template, including Contact, keeps holding.
- **SC-005**: Automated accessibility checks (the site's axe suites, WCAG 2.2 A and AA rules) report
  zero violations on every page template in both themes: home, not-found, Work with me, About,
  Privacy policy, Terms of use, Technology, Contact, the writing listings, a post, the projects
  index and a project story. The visual regression suite passes with the refreshed baselines listed
  in FR-011.

## Assumptions

- **Scope covers every page the standard layout draws**, not only the five pages named in the
  issue. Home, Contact and the app privacy pages use the same layout and already get the dark card,
  so leaving them out would break the parity the issue asks for (confirmed in clarification). Blog
  posts, project stories and the writing and projects listings use their own layouts and are out
  of scope. The exact list is under "Pages covered".
- **Padding values**: the issue lists both a fixed 1.5rem padding and a 1rem / 1.5rem / 2rem
  responsive scale. The responsive scale is used for both themes, because the issue asks for
  "consistent padding across viewports" and the fixed value would contradict it. This changes dark
  mode too: padding shrinks to 1rem on phones and grows to 2rem from 768 px. FR-003 is the single
  authority; the issue's fixed value is superseded.
- **Breakpoints** are the site's existing small (640 px) and medium (768 px) breakpoints, the same
  ones the header, home introduction card and other components already use; no breakpoint is added
  or changed.
- **Border and shadow tints** are the ones named in the issue: dusk-200 at 80% opacity in light
  mode, dusk-700 at 80% opacity in dark mode, and the theme's smallest blurred shadow (values in
  the card properties table). The shadow may be invisible against the dark page; the dark border
  carries the edge there.
- **Text measure**: the issue's "comfortable text measure" is met by keeping the measure the reader
  has today: the card stays capped at the article width (64rem), and the prose styles keep their
  own type size and line height inside it, so line length is not otherwise changed. As a
  measurable limit, the text column is never wider than today's and is narrower than today's
  light-mode column by at most 4rem plus 2 px at any width; its narrowest is 254 px at a 320 px
  viewport (FR-005). This narrowing is accepted as the cost of the frame. No prose-width cap is
  added inside the card (confirmed in clarification).
- **The page background stays as it is**: white in light mode, the dusk base in dark mode. In light
  mode the white card is set apart from the white page only by its 1 px border and smallest shadow;
  no page background tint is added (confirmed in clarification).
- **Theme selection**: "light mode" and "dark mode" mean the theme in effect, however it was
  chosen: the reader's stored choice or, with no stored choice, the system preference. Every
  requirement here, contrast included, applies to both themes whichever way they were reached.
- **Design source**: the site's pages were ported from the Flux theme, whose content section has no
  card in light mode. The light-mode card is an accepted, deliberate departure from Flux, recorded
  in the site's design-source notes.

## Dependencies

- **Docker for Linux baselines**: refreshing the Linux visual baselines (FR-011) needs Docker
  Desktop running on Don's machine; it is normally off. If it is not running, the implementer asks
  Don to start it and waits. There is no other route to Linux baselines (the CI label fallback is
  retired), so the change does not open for review with only macOS baselines.
- **Sibling worktrees**: other features running in parallel may touch the standard page layout,
  the not-found page, the theme-token test or the same visual baselines. Before the final gate the
  branch merges the latest `main`, keeps both sides of any conflict in those files, and refreshes
  the visual baselines last, after the merge, so they reflect the combined result.

## Out of Scope (follow-up work)

- Card treatment for blog posts, project stories and the writing and projects listings.
- Any change to the home introduction card, header, footer or page title styling.
- A shared card component or design token for "content card" beyond these two callers; the plan
  may choose one for the standard layout and the not-found page, but this feature does not require
  it, and reusing it for posts, stories or listings is follow-up work.
- Print styling: the site has no print stylesheet for its page layouts, and how the card's border
  and shadow print is not specified or tested by this feature.
