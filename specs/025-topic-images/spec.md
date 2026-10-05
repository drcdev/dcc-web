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

## Clarifications

### Session 2026-10-05

- Q: In dark mode, which cards should get the new thin outline? → A: The series tiles and
  series banners, in their series colour, plus the post cards and the lead story, with a
  neutral outline of at least 3:1 that replaces today's faint edge. Text-only post cards keep
  their topic-colour border as their outline. Topic banners and cards outside `/writing/` are
  not changed.
- Q: On the series pages, should the image show at its full 2:1 shape above the banner, or as
  a shorter crop? → A: A wide strip of about 4:1, cropped from the centre of the image, above
  the banner. Cropping is allowed on the series pages only.
- Q: Should the series image show on every page of a series, or only on page 1? → A: On every
  page of the series.
- Q: How should the image sit in each series tile on `/writing/`? → A: Edge to edge at the
  top of the tile, at full 2:1 with no crop, with the tile's rounded corners clipping it. The
  text keeps its padding below the image.
- Q: On the series pages, should the image strip and the series banner read as one joined card
  or as two separate pieces? → A: Joined. The strip sits flush on top of the banner with no
  gap and takes the banner's rounded top corners, so the banner's top corners go square. In
  dark mode one thin series-colour outline wraps the strip and the banner together.

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
   edge to edge at the top of its tile (no padding around it, the tile's rounded top corners
   clipping it), at full 2:1 with no crop, above the padded text.
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
   above the series banner as a wide strip of 4:1 (see FR-003 for the tolerance), cropped from
   the centre of the 2:1 image, as wide as the banner, flush on top of it with no gap (the strip takes the rounded
   top corners and the banner's top corners are square), and the banner still carries the page
   heading.
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

A reader using dark mode browses `/writing/`, the series pages and the topic pages. Each card
in scope (series tiles, series banners, post cards and the lead story) has a thin outline
that stands out against the page background, in the same spirit as the series marker's outline,
so the cards no longer blur into the page.

**Why this priority**: It fixes a visible weakness Don reported, but the pages work without it.

**Independent Test**: Switch to dark mode and view `/writing/` and a series page; each card in
scope has a visible outline. Switch to light mode; cards look as they do today.

**Acceptance Scenarios**:

1. **Given** dark mode, **When** a reader views the series tiles on `/writing/`, **Then** each
   tile has a thin outline in a light shade of its series colour, as the series marker does.
2. **Given** dark mode, **When** a reader views a series page, **Then** one thin outline in its
   series colour wraps the image strip and the series banner together, with no outline between
   them.
3. **Given** dark mode, **When** a reader views a post card with a feature image or the lead
   story on `/writing/`, **Then** it has a thin neutral outline with at least 3:1 contrast
   against the page background, in place of today's faint edge.
4. **Given** dark mode, **When** a reader views a text-only post card, **Then** it keeps its
   existing topic-colour border as its one outline.
5. **Given** dark mode, **When** a reader views a non-series topic banner on
   `/writing/topics/<topic>/`, **Then** it looks as it does today.
6. **Given** light mode, **When** a reader views the same pages, **Then** the cards look as they
   do today.
7. **Given** forced-colours (high-contrast) mode, **When** a reader views the cards, **Then**
   each card's edge is still visible.

### Edge Cases

- A series with no posts yet: its series page still shows the image above the banner, then the
  existing "no posts in this series yet" message.
- The image fails to load: its space stays reserved at the same shape (the layout neither
  collapses nor shifts), the tile and banner text stay readable below it, and no broken-image
  text is shown or announced (the empty text alternative). Nothing is lost for a reader who
  relies on the text alone, because the image carries no information of its own.
- Very wide screens: the series page image is never wider than the banner below it.
- Narrow phones: the series page strip keeps its 4:1 shape (the crop stays centred), so
  it gets shorter rather than taller as the screen narrows.
- Dark-mode outline on a card that already has a coloured edge (a text-only post card bordered
  in its main topic's colour): it keeps one clear edge, not two stacked outlines.
- Adding a new non-series topic later must not require an image (images are tied to the two
  series only).

## Requirements *(mandatory)*

### Functional Requirements

**Series images**

- **FR-001**: The Drift and Convergence series MUST each have one image, taken from the source
  files Don supplied (see Context), stored in the repository with the site's content.
- **FR-002**: The writing landing page's series tiles MUST each show their series' image edge to
  edge at the top of the tile (outside the tile's text padding, with the tile's rounded top
  corners clipping it), above the series name, at full 2:1 with no crop. The tile is the image
  first, then the padded text (name, description, "Read <series>" link), in both arrangements:
  stacked on phones and side by side from tablet width up. The tile order stays as today,
  Convergence then Drift. When the tiles sit side by side, both tiles in the row are the same
  height, their images line up at the top, and any spare height falls below the shorter tile's
  text. No text is laid over the image.
- **FR-003**: Each series page, `/writing/<series>/` and every later page of it, MUST show the
  series' image directly above the series banner as a wide strip of 4:1 (the strip's rendered
  height within 1 px of a quarter of its width), cropped from the centre of the image (the
  middle half of its height is kept, the top and bottom quarters are dropped, the full width is
  kept), as wide as the banner and never wider. The strip and banner form one joined card: the
  strip sits flush on top of the banner with no gap and takes the card's rounded top corners,
  the banner's top corners are square, and the banner's bottom corners stay rounded as today.
  No text is laid over the strip. The banner's eyebrow, `h1` and description keep their order,
  and the `h1` stays the page's only top-level heading: the strip adds no heading and nothing to
  the reading order. The space between the joined card and the content below it (the first
  post card, or the "no posts" message) stays as it is today.
- **FR-004**: No other topic, page or card MUST show a series image as part of this feature;
  non-series topic pages stay as they are.
- **FR-005**: At every screen width from a 320 px wide phone up, the tile images MUST keep their
  full 2:1 shape with no cropping, and the series page images MUST keep their centred strip of
  4:1 (cropping is allowed on the series pages only). No image may be distorted or cause
  horizontal page scrolling (WCAG 1.4.10 reflow). At 200 percent browser zoom and with enlarged
  text or text spacing (WCAG 1.4.4, 1.4.12), the tile and banner text MUST wrap and the card
  grow taller to fit it: no text is clipped by the card's rounded-corner clipping, cut off or
  overlapped by the image.
- **FR-006**: The images are decorative: the series name sits right next to each one, so the
  images MUST carry an empty text alternative on both the tile and the strip, MUST NOT be
  announced by screen readers, MUST NOT be focusable and MUST NOT be links of their own (the
  tile's existing "Read <series>" link stays the only link). No information is carried by an
  image alone, so a reader who hides images, or whose browser blocks them, loses nothing.
- **FR-007**: The images MUST be served in sizes suited to where they appear, so the landing
  page and series pages stay within the site's performance budget and Core Web Vitals "good"
  thresholds on mobile. Each placement is offered in widths that cover its largest display size
  at up to 2x pixel density, never larger than the 1536 px source, in a modern compressed
  format. The source files are about 1.5 MB each and MUST NOT be sent to readers: no built page
  may reference the original PNG files or any full-size PNG copy of them, which can be checked
  in the built output. Compression MUST NOT show visible banding, blockiness or blur at normal
  viewing size compared with the source scaled to the same size; Don judges this on the preview
  as part of the major-change review.
- **FR-008**: The images MUST reserve their space before they load, at their final shape and at
  every screen width (including the strip as it narrows), from the page's HTML alone, whether
  the styles or the image arrive first. They MUST cause no measurable layout shift: the
  landing page and series pages keep cumulative layout shift below 0.1 in the budget run, with
  none of it from the images.
- **FR-009**: The images MUST show with JavaScript turned off.

**Dark-mode card outlines**

- **FR-010**: In dark mode, exactly these cards MUST have a thin, solid outline that stands out
  from the page background:
  - the two series tiles on `/writing/`;
  - the series banner (joined to its image strip) on every series page;
  - the post card, wherever that one card component is used: the writing landing, all-posts,
    topic and series listings, the home page's "Recent writing" section and the related posts
    on post pages (the same card, so its edge changes everywhere at once);
  - the lead story on `/writing/`.

  A post card or lead story *with a feature image* gets a 1 px neutral outline in place of
  today's faint edge. A *text-only* card (a post with no feature image) keeps its existing 2 px
  topic-colour border as its one outline and gains no second one. Nothing else changes:
  the topic banners on `/writing/topics/<topic>/`, the post page's own title card, the home
  page's other sections, project cards and project pages, and every other surface outside the
  writing pages keep their dark-mode look (see Out of Scope).
- **FR-011**: The outline on a series tile or series banner MUST be in the light (300) shade of
  that series' colour, the same colour token as the series marker's dark-mode outline (Drift
  lavender-300, Convergence sage-300), so a tile, its banner and its marker read as one family.
  It is 1 px wide, thinner than the marker's 2 px outline. The outline is the card's own edge:
  it runs round the card's rounded corners, and the image is clipped inside it, so the outline
  is drawn over the image's top corners rather than hidden by them. On a series page the one
  outline wraps the joined image strip and banner together, with no line between them.
- **FR-012**: Every card edge visible in dark mode under FR-010, including the series outlines
  (measured for this feature, not assumed from the marker) and the text-only cards' kept
  topic-colour borders, MUST have at least 3:1 contrast against the page background, the site's
  darkest neutral (dusk-BASE), not against the card's own fill (WCAG 2.2 1.4.11 non-text
  contrast: the edge sits on the card-to-page boundary, so contrast against the card fill is
  not required). Text on each card MUST keep at least 4.5:1 contrast against the card fill in
  both themes: on the series tiles the name, description and "Read <series>" link; on the
  series banner the eyebrow, `h1`, description and both links; on post cards and the lead story
  every text pair they carry today. Fills and text colours do not change, so these pairs keep
  today's values.
- **FR-013**: Cards MUST look as they do today in light mode: card fill, border width and
  colour (or no border), corner radius, padding and text styles are identical to today. The
  only light-mode change is the added series image, with the tile's or banner's text moved down
  below it at today's padding.
- **FR-014**: In forced-colours mode, in both the light and dark site themes, every outlined
  card type (series tile, joined series banner, post card and lead story with or without an
  image) MUST keep an edge at least 1 px wide, solid, in the system text colour the forced
  palette supplies. The series images stay shown as they are; forced-colours mode does not
  hide or recolour them.
- **FR-015**: The change MUST use only the site's existing palette colours; no new colour is
  introduced. The colour tokens the outlines use are lavender-300, sage-300 and dusk-500 (dark
  mode) and dusk-200 (light mode, unchanged), all already in the palette.
- **FR-016**: The outlines MUST NOT change on hover, focus or press: the cards have no
  interactive state of their own, and a text-only card still shows one edge in every state.
  The links inside the cards keep their existing hover and the site's focus indicator, which
  stays fully visible inside the tile and banner (not clipped by the rounded-corner clipping)
  and does not merge with the outline.
- **FR-017**: The series images appear the same in both themes, as supplied: they are not
  dimmed, inverted or filtered in dark mode. Their dark backgrounds sit against the light
  series fills in light mode and next to the dark fills, inside the outline, in dark mode; as
  decorative pictures they carry no contrast requirement of their own.
- **FR-018**: The site's writing design notes MUST record the series images and the dark-mode
  card outline as part of the writing design, since this is a design-system change.

### Key Entities

- **Series**: one of the two topics marked as a series (Drift, Convergence). Gains one image.
  Has a name, description, colour, short address, landing tile and series page banner.
- **Series image**: a 2:1 decorative picture belonging to exactly one series, shown in full on
  that series' landing tile and as a centred 4:1 strip joined flush to the top of its series
  page banner.
- **Card**: a raised surface on the writing pages (series tile, series banner, post card and
  lead story; the post card also wherever it is reused, per FR-010) whose dark-mode edge this
  feature strengthens. Topic banners are not in scope.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On `/writing/`, both series tiles show their own image; on `/writing/drift/` and
  `/writing/convergence/` (and their later pages), the matching image shows above the banner;
  on every `/writing/topics/<topic>/` page, no image shows above the banner.
- **SC-002**: In dark mode, every card in scope (series tiles, series banners, post cards and the
  lead story) has an outline measured at 3:1 or more against the page background, and every
  text-on-card pair stays at 4.5:1 or more.
- **SC-003**: Light-mode screenshots of the writing pages show no change to the cards apart from
  the added series images.
- **SC-004**: These templates still pass the site's performance budget (total size, script,
  long tasks, LCP and CLS on mobile) and automated WCAG 2.2 AA checks, with no layout shift
  caused by the images: `/writing/`, `/writing/drift/`, `/writing/convergence/`, an empty
  series page, a non-series topic page and the home page (whose "Recent writing" cards change
  edge). A later series page (`/writing/<series>/2/`) is the same template with the same image
  and banner, so it is covered by the component and end-to-end checks rather than a separate
  budget or accessibility run.
- **SC-005**: Every delivered series image file is at most 25 KB (under 2% of its 1.5 MB
  source), and the image file a 390 px wide phone at 1x density downloads for a tile or a strip
  is at most 8 KB.

## Assumptions

- "The drift and convergence tiles on the writing home page" means the two tiles in the
  "Drift & Convergence" series lead on `/writing/`; "the card" on the topic pages means the
  series banner at the top of `/writing/drift/` and `/writing/convergence/`.
- "Other topics won't have images" means only the two series get images; non-series topic
  pages and pills are untouched, and no general per-topic image mechanism is needed.
- The image sits edge to edge at the top of the tile (like a post card's feature image), and
  flush on top of the banner on the series page, joined to it as one card; the banner keeps the
  page heading.
- The images are decorative (empty text alternative), because the series name is right next to
  each one and the images carry no information of their own.
- Later pages of a series show the same image as page 1, so the series page looks the same on
  every page.
- "Thin outline like the series pill has" means a solid outline in the series colour's light
  shade, as on the series marker in dark mode; "thin" is read as no thicker than the marker's
  outline; FR-011 sets it at 1 px, thinner than the marker's 2 px.
- The outline is a dark-mode fix only; light-mode cards already stand out against the white page.
- The images are used as supplied; no editing beyond resizing, format conversion and the
  centred 4:1 crop for the series pages. Both pictures have their focal point (the orange dot
  where the lines meet) near the centre, so the centred crop keeps it; Don confirms the crop on
  the preview as part of the major-change review.
- Visual baselines for the writing landing page and series pages will change and need
  refreshing on both platforms (macOS and Linux) together, in the same pull request; the plan
  lists which baselines change and which must not.
- `prefers-contrast: more` gets no separate treatment: the site has none today, and the
  dark-mode outlines already meet 3:1 for every reader. Forced-colours mode is covered by
  FR-014.
- This change is a **major change** under Constitution Principle III (design system / visual
  identity), because the series gain pictures and outlining cards changes the design system's
  look in dark mode; the plan records the classification and the PR flags it.

## Out of Scope / Follow-up

- Images for non-series topics, or a general way to give any topic an image.
- Using the series images in social previews (Open Graph), the RSS feed or on post pages.
- Any light-mode change to cards.
- A `prefers-contrast: more` variant of the cards or outlines.
- Dark-mode surface changes on pages outside `/writing/` (home page, projects, posts' own
  title card, topic banners), except that a post card keeps its new outline wherever the same
  card is reused.
