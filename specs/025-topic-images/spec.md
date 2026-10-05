# Feature Specification: Series Images and Dark-Mode Card Outlines

**Feature Branch**: `025-topic-images`

**Created**: 2026-10-05

**Status**: Draft

**Input**: User description: "add an image to the drift and convergence tiles on the writing home page. the image should also show up above the card on the /writing/drift and /writing/convergence topic pages. other topics won't have images. the two images are here: '/Users/doncoleman/Downloads/drift.png' '/Users/doncoleman/Downloads/convergence.png'

the cards also suffer in dark mode. the card color is very close to the background color, so add a thin outline like the series pill has to make it pop more."

## Context

Drift and Convergence are the site's two writing **series**. They are topics marked as series
in the controlled topic list, with their own short addresses, `/writing/drift/` and
`/writing/convergence/`. Every other topic lives at `/writing/topics/<topic>/` and is not part
of this change.

Where the series appear today:

- **Series tiles** on the writing landing page, `/writing/`. Under the "Drift & Convergence"
  heading, the series lead shows one tile per series (Convergence first, then Drift). Each tile
  carries the series name, its description and a "Read <series>" link, on the series colour
  (Convergence sage, Drift lavender). Tiles have no image today.
- **Series banner** on each series page, `/writing/drift/` and `/writing/convergence/` (and
  their later pages, `/writing/<series>/2/` and on). The banner is "the card" at the top of the
  page: an eyebrow ("Series"), the series name as the page heading, its description and links to
  the other series and all writing, on the series colour. The series' post cards follow below it.
- **Series marker**: the pill-shaped "Series: Drift" / "Series: Convergence" link on post cards
  and posts. It is told apart from ordinary topic pills by a solid outline in a light shade of
  the series colour in dark mode (a darker shade in light mode). This is the "outline like the
  series pill has" that the request points to.

The dark-mode problem: the page background in dark mode is the site's darkest neutral. The
series tiles and banners use a very dark shade of the series colour, and post cards and the
lead story use a dark neutral one step lighter than the page. Both read as nearly the same
colour as the page, so the card's edge is hard to see. The series tiles and banners have no
edge at all; post cards and the lead story have a faint neutral edge that does not help much.

Source images supplied by Don (not yet in the repository; the plan decides where they live):

| Series      | Source file                                   | Pixel size  | Shape | File size |
|-------------|-----------------------------------------------|-------------|-------|-----------|
| Drift       | `/Users/doncoleman/Downloads/drift.png`       | 1536 × 768  | 2:1   | ~1.6 MB   |
| Convergence | `/Users/doncoleman/Downloads/convergence.png` | 1536 × 768  | 2:1   | ~1.5 MB   |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Series tiles show their image on the writing landing page (Priority: P1)

A reader opens `/writing/`. In the "Drift & Convergence" lead, the Convergence tile shows the
Convergence image and the Drift tile shows the Drift image, at the top of each tile, above the
series name, description and link. The images make the two series recognisable at a glance.

**Why this priority**: The landing page is where readers first meet the two series; this is the
main thing Don asked for.

**Independent Test**: Build the site and open `/writing/`; each series tile shows its own image
above its text, and the rest of the page is unchanged.

**Acceptance Scenarios**:

1. **Given** the writing landing page, **When** a reader views the series lead, **Then** the
   Convergence tile shows the Convergence image and the Drift tile shows the Drift image, each
   at the top of its tile and spanning the tile's full width.
2. **Given** a narrow phone screen where the tiles stack, **When** a reader views the series
   lead, **Then** each image fits its tile's width with no horizontal scrolling, keeps its 2:1
   shape and is not cropped.
3. **Given** the topic pill row and every post card on the landing page, **When** the page
   renders, **Then** none of them gains a series image (only the two series tiles do).

---

### User Story 2 - Series pages show their image above the banner (Priority: P1)

A reader opens `/writing/drift/` or `/writing/convergence/`. Above the series banner, the page
shows that series' image, so the page opens with the same picture the reader saw on the landing
tile.

**Why this priority**: Don asked for both places together; the image ties the landing tile to
the page it links to.

**Independent Test**: Open `/writing/drift/` and `/writing/convergence/`; each shows its own
image directly above its banner. Open any `/writing/topics/<topic>/` page; it shows no image.

**Acceptance Scenarios**:

1. **Given** the Drift series page, **When** it loads, **Then** the Drift image appears directly
   above the series banner, as wide as the banner, and the banner still carries the page heading.
2. **Given** the Convergence series page, **When** it loads, **Then** the Convergence image
   appears directly above its banner in the same way.
3. **Given** a later page of a series (for example `/writing/drift/2/`), **When** it loads,
   **Then** it shows the same series image above the banner as page 1.
4. **Given** any non-series topic page (`/writing/topics/<topic>/`), **When** it loads, **Then**
   it shows no image above its banner.
5. **Given** JavaScript is turned off, **When** a reader opens a series page or the landing
   page, **Then** the images still show.

---

### User Story 3 - Cards stand out from the page in dark mode (Priority: P2)

A reader using dark mode browses `/writing/` and the series pages. Each card has a thin outline
that stands out against the page background, in the same spirit as the series marker's outline,
so the cards no longer blur into the page.

**Why this priority**: It fixes a visible weakness Don reported, but the pages work without it.

**Independent Test**: Switch to dark mode and view `/writing/` and a series page; each card in
scope has a visible outline. Switch to light mode; cards look as they do today.

**Acceptance Scenarios**:

1. **Given** dark mode, **When** a reader views the series tiles on `/writing/`, **Then** each
   tile has a thin outline in a light shade of its series colour, as the series marker does.
2. **Given** dark mode, **When** a reader views a series page, **Then** the series banner has the
   same thin outline in its series colour.
3. **Given** dark mode, **When** a reader views the other cards in scope (see FR-010), **Then**
   each has a thin outline with at least 3:1 contrast against the page background.
4. **Given** light mode, **When** a reader views the same pages, **Then** the cards look as they
   do today.
5. **Given** forced-colours (high-contrast) mode, **When** a reader views the cards, **Then**
   each card's edge is still visible.

### Edge Cases

- A series with no posts yet: its series page still shows the image above the banner, then the
  existing "no posts in this series yet" message.
- The image fails to load: the tile and banner text stay readable and the layout does not
  collapse or overlap; nothing important is lost because the image is decorative.
- Very wide screens: the series page image is never wider than the banner below it.
- Dark-mode outline on a card that already has a coloured edge (a text-only post card bordered
  in its main topic's colour): it keeps one clear edge, not two stacked outlines.
- Adding a new non-series topic later must not require an image (images are tied to the two
  series only).

## Requirements *(mandatory)*

### Functional Requirements

**Series images**

- **FR-001**: The Drift and Convergence series MUST each have one image, taken from the source
  files Don supplied (see Context), stored in the repository with the site's content.
- **FR-002**: The writing landing page's series tiles MUST each show their series' image at the
  top of the tile, above the series name, spanning the tile's full width.
- **FR-003**: Each series page, `/writing/<series>/` and every later page of it, MUST show the
  series' image directly above the series banner, no wider than the banner.
- **FR-004**: No other topic, page or card MUST show a series image as part of this feature;
  non-series topic pages stay as they are.
- **FR-005**: The images MUST keep their 2:1 shape at every screen width, with no cropping,
  distortion or horizontal page scrolling, from a 320 px wide phone up.
- **FR-006**: The images are decorative: the series name sits right next to each one, so the
  images MUST carry no text alternative that repeats it, and MUST NOT be links of their own
  (the tile's existing "Read <series>" link stays the only link).
- **FR-007**: The images MUST be served in sizes suited to where they appear (the source files
  are about 1.5 MB each and MUST NOT be sent to readers as they are), so the landing page and
  series pages stay within the site's performance budget and Core Web Vitals "good" thresholds
  on mobile.
- **FR-008**: The images MUST reserve their space before they load, so the page does not shift
  when they arrive.
- **FR-009**: The images MUST show with JavaScript turned off.

**Dark-mode card outlines**

- **FR-010**: In dark mode, the following cards MUST have a thin, solid outline that stands out
  from the page background: the series tiles on `/writing/` and the series banners on the series
  pages. [NEEDS CLARIFICATION: Should the outline also go on the other dark-mode cards that sit
  close to the page colour — the post cards, the lead story on `/writing/`, and the topic banners
  on `/writing/topics/<topic>/` — or only on the two series' tiles and banners?]
- **FR-011**: The outline on a series tile or series banner MUST be in a light shade of that
  series' colour, matching the series marker's dark-mode outline colour, so a tile, its banner
  and its marker read as one family. It is thin (thinner than or equal to the series marker's
  outline).
- **FR-012**: Any outline added under FR-010 MUST have at least 3:1 contrast against the page
  background in dark mode (WCAG 2.2 non-text contrast), and text on each card MUST keep at least
  4.5:1 contrast against the card.
- **FR-013**: Cards MUST look as they do today in light mode.
- **FR-014**: In forced-colours mode, each outlined card MUST keep a visible edge.
- **FR-015**: The change MUST use only the site's existing palette colours; no new colour is
  introduced.

### Key Entities

- **Series**: one of the two topics marked as a series (Drift, Convergence). Gains one image.
  Has a name, description, colour, short address, landing tile and series page banner.
- **Series image**: a 2:1 decorative picture belonging to exactly one series, shown on that
  series' landing tile and above its series page banner.
- **Card**: a raised surface on the writing pages (series tile, series banner, and, depending on
  FR-010, post card, lead story and topic banner) whose dark-mode edge this feature strengthens.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On `/writing/`, both series tiles show their own image; on `/writing/drift/` and
  `/writing/convergence/` (and their later pages), the matching image shows above the banner;
  on every `/writing/topics/<topic>/` page, no image shows above the banner.
- **SC-002**: In dark mode, every card in scope has an outline measured at 3:1 or more against
  the page background, and every text-on-card pair stays at 4.5:1 or more.
- **SC-003**: Light-mode screenshots of the writing pages show no change to the cards apart from
  the added series images.
- **SC-004**: The landing page and series pages still pass the site's performance budget and
  automated accessibility checks, with no layout shift caused by the images.
- **SC-005**: Each delivered series image weighs a small fraction of its 1.5 MB source (the plan
  sets the exact figure within the existing page budget).

## Assumptions

- "The drift and convergence tiles on the writing home page" means the two tiles in the
  "Drift & Convergence" series lead on `/writing/`; "the card" on the topic pages means the
  series banner at the top of `/writing/drift/` and `/writing/convergence/`.
- "Other topics won't have images" means only the two series get images; non-series topic
  pages and pills are untouched, and no general per-topic image mechanism is needed.
- The image sits above the tile's text inside the tile (like a post card's feature image), and
  above the banner as a separate element on the series page; the banner keeps the page heading.
- The images are decorative (empty text alternative), because the series name is right next to
  each one and the images carry no information of their own.
- Later pages of a series show the same image as page 1, so the series page looks the same on
  every page.
- "Thin outline like the series pill has" means a solid outline in the series colour's light
  shade, as on the series marker in dark mode; "thin" is read as no thicker than the marker's
  outline, and likely thinner (the plan picks the width).
- The outline is a dark-mode fix only; light-mode cards already stand out against the white page.
- The images are used as supplied; no editing or recropping beyond resizing and format
  conversion for delivery.
- Visual baselines for the writing landing page and series pages will change and need
  refreshing on both platforms.
- This change probably counts as a **major change** under Constitution Principle III, because
  outlining cards changes the design system's look in dark mode; the plan confirms the
  classification and the PR flags it.

## Out of Scope / Follow-up

- Images for non-series topics, or a general way to give any topic an image.
- Using the series images in social previews (Open Graph), the RSS feed or on post pages.
- Any light-mode change to cards.
- Dark-mode surface changes on pages outside `/writing/` (home page, projects, posts' own
  title card) unless the FR-010 clarification widens the scope.
