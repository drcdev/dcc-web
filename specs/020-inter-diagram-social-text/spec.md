# Feature Specification: Inter text in diagrams and the sharing image

**Feature Branch**: `020-inter-diagram-social-text`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Draw the text inside diagrams and the social image in Inter. The project architecture diagrams are SVG images whose text still uses the system font, and the social preview image is a static picture, so their text does not match the Inter typeface the rest of the site now uses. Make that text render in Inter everywhere, for example by embedding the subset font in the SVGs or converting their text to outlines, without pushing the pages over the budget."

This feature implements GitHub issue #76, and the pull request closes it.

## Background

Feature 018 (self-hosted fonts, PR #72) made Inter the site's typeface: four subset faces
(regular, italic, bold, bold italic) served by the site itself. That feature left two kinds of
text out of scope, because they are drawn inside images rather than in the page:

- **Project architecture diagrams.** Each published project story (Cadence, drcdev.github.io,
  Flux, Focus Pocus, Tempo) shows one architecture diagram, a vector image of labelled boxes and
  arrows. Their labels are bold (box titles) and regular (box details) text that asks for the
  system font. A diagram shown as an image cannot use the page's web fonts, so each visitor sees
  the labels in whatever sans-serif font their device has: San Francisco on Apple devices,
  Segoe UI on Windows, Roboto or DejaVu elsewhere. The labels never match the Inter text beside
  them, and they look different on every platform. The project story template also ships a
  starter diagram that asks for a generic sans-serif font.
- **The sharing image.** Every page names one site-wide default sharing image (the picture link
  previews show on social sites and in chat apps): "Don Coleman" in bold rust on the dusk
  background, with a short rust rule underneath. It is a fixed picture, rendered once from a
  small template that asked for the system font, so its lettering is whatever font the machine
  that rendered it had, not Inter.

This feature makes the lettering in both kinds of image Inter, so the images match the site's
typeface and look the same on every device, without raising the page budget.

Under Constitution Principle III this touches the site's visual identity (the lettering of the
diagrams and the sharing image), so it is treated as a **major change**: Don approves the pull
request after checking the preview deployment. The font step reuses feature 018's pinned
fonttools recipe (run through `uvx`, outside `package.json`) and adds no npm dependency, service
or build step; the plan records that reuse as a Principle III decision, and Don approves it as
part of this same major-change review.

## Clarifications

### Session 2026-10-04

- Q: How should the Inter lettering get into the architecture diagrams? → A: Each diagram carries
  its own glyph subset: an inline data-URI `@font-face` with Inter Regular and Inter Bold cut down
  to only the characters that diagram uses, and the labels stay real text.
- Q: What should the editing path for a diagram label be, and when should the font step run? →
  A: Edit the label in the published SVG itself, then run one script (fonttools through `uvx`,
  like `scripts/fonts/subset-inter.ts`) that rewrites that file's embedded font block. Nothing
  runs at build time. The gate fails, naming the file and the character, if a label uses a glyph
  the embedded font does not contain.
- Q: How should the labels that do not fit their boxes in Inter be fixed (Cadence "sync and AI
  routines, when online", "via a Shortcuts handoff, optional", "local store and write queue";
  Tempo "or Health Connect, optional"; Flux "Supabase Edge Functions")? → A: Wrap each
  overflowing detail label onto two lines at the same size and weight, growing that box's height
  and moving arrows only where needed. Every label keeps at least 16 units of clear space on each
  side.
- Q: Should each diagram have its own file-size ceiling, beyond the page budget? → A: Yes. Each
  published diagram and the template's starter diagram is at most 16 KB, enforced by a unit test.
- Q: How should the gate confirm the sharing image's lettering is Inter Bold? → A: A unit test
  checks that `scripts/og-image/render.ts` loads `src/assets/fonts/Inter-Bold.woff2` through an
  inline `@font-face` and names no system font. The committed `public/og-default.png` is
  re-rendered once by hand, and Don confirms it on the preview (a `[PREVIEW-CHECK]` item).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Diagram labels match the page (Priority: P1)

A visitor reading a project story reaches its architecture diagram. The box titles and details
inside the diagram are set in Inter, bold for titles and regular for details, the same typeface
as the story text around it. The diagram looks the same on a Mac, a Windows laptop, an Android
phone and a Linux machine, whatever fonts those devices have installed.

**Why this priority**: the diagrams sit directly beside Inter body text on every published
project story, so the mismatch is visible on real pages today. This is the bulk of the issue.

**Independent Test**: open each published project story's diagram on its own (the image file the
page serves) in a browser on a machine that does not have Inter installed, and confirm the
labels draw in Inter, at the same weights and positions as before.

**Acceptance Scenarios**:

1. **Given** a published project story with an architecture diagram, **When** a visitor views the
   page on any device, **Then** every label in the diagram is drawn in Inter, box titles in bold
   and details in regular.
2. **Given** a device with no Inter font installed, **When** the diagram image is opened directly,
   **Then** its labels are still drawn in Inter, not a fallback font.
3. **Given** a diagram before and after this change, **When** they are compared side by side,
   **Then** the wording, colours, arrows, canvas (its width, height and `viewBox`, for example
   1200 by 480), accessible name and visible description are unchanged, and the layout and box
   sizes are unchanged except for the boxes whose labels wrap (FR-003b, listed in the plan);
   the lettering differs, and every label fits inside its box.

---

### User Story 2 - Sharing image lettering in Inter (Priority: P2)

Someone shares a link to the site in a chat app or on a social site. The preview card shows the
site's sharing image, and "Don Coleman" on it is set in Inter Bold, matching the site's type.

**Why this priority**: the sharing image is seen off-site, once per share, and is a single
picture, so it is less visible day to day than the diagrams, but it is the site's first
impression in a link preview.

**Independent Test**: open the sharing image file and compare its lettering with Inter Bold; check
that its size, colours, layout and wording are unchanged.

**Acceptance Scenarios**:

1. **Given** the site's default sharing image, **When** it is viewed, **Then** "Don Coleman" is set
   in Inter Bold in the rust colour on the dusk background, with the rule underneath, at the
   same 1200 by 630 size.
2. **Given** the sharing image is produced again from its source by anyone on any machine,
   **When** the new image is compared with the committed one, **Then** the lettering is Inter
   and does not depend on the fonts installed on that machine.
3. **Given** any page, **When** its sharing metadata is read, **Then** it still names the same
   default sharing image address and alt text as today.

---

### User Story 3 - New and edited diagrams stay in Inter (Priority: P3)

Don, or an agent working for him, adds a new project story with a diagram started from the
project template, or changes the wording of a label in an existing diagram. The result is still
drawn in Inter without any manual font work, and if a diagram would fall back to a system font,
the gate says so and names the file.

**Why this priority**: it keeps the first two stories true over time. Without it the next diagram
or wording change quietly brings the system font back.

**Independent Test**: change one label in a copy of a diagram through the documented editing path
and confirm the new label draws in Inter; separately, introduce a diagram whose text asks for a
system font and confirm the gate fails with a message naming that diagram.

**Acceptance Scenarios**:

1. **Given** the project template's starter diagram, **When** a new project story starts from it,
   **Then** its text is drawn in Inter.
2. **Given** an existing diagram, **When** the wording of one label is changed through the
   documented editing path, **Then** the published diagram shows the new wording in Inter.
3. **Given** a diagram whose text would be drawn in a system font, **When** the release gate
   runs, **Then** it fails with a clear message naming the diagram file.
4. **Given** a diagram label that uses a character the available Inter glyphs do not contain,
   **When** the release gate runs, **Then** it fails with a clear message naming the diagram and
   the character, rather than shipping a fallback glyph.

---

### Edge Cases

- **Small display sizes**: diagrams are shown about 26rem (416 CSS px) wide on large screens and
  full width on phones, down to a 320 CSS px viewport (which is also 1280 px at 400% zoom). The
  label sizes (titles 30 units, details 24 units) and the canvas are unchanged, so each label
  renders at exactly today's size at every width: the rendered size is the label size times the
  displayed width over the canvas width (at 416 px a 1200-unit diagram shows details at about
  8.3 CSS px and titles at about 10.4 px; the 16-unit clear space is about 5.5 px). Inter is not
  allowed to make a label smaller than today. The image scales with the page and never causes
  horizontal scrolling. Text inside an image cannot be resized or respaced by the reader
  (WCAG 2.2 1.4.4 and 1.4.12), so the diagram's content is also given as page text in its
  visible description, which reflows, resizes and takes text-spacing overrides; the vector
  image can also be opened on its own and zoomed without loss.
- **Wider or narrower glyphs**: Inter's letters are not the same width as each system font's.
  Every label, titles and details alike, in every box of every diagram (the template starter
  included), must fit inside its box with at least 16 units (in the diagram's own coordinates)
  of clear space on each side (FR-003b). Measured from Inter's metrics, five detail labels do
  not fit their 300-unit boxes: Cadence "sync and AI routines, when online", "via a Shortcuts
  handoff, optional" and "local store and write queue", Tempo "or Health Connect, optional", and
  Flux "Supabase Edge Functions". The same rule also catches a sixth, Flux "Handlebars,
  Tailwind v4" (13.6 units each side), so it wraps too; any other label found not to fit is
  wrapped the same way, and the plan lists every wrap. Each wraps onto two lines at the same
  size and weight, and that box grows taller only where the extra line needs room. Labels are
  never shrunk, reworded, clipped or allowed to overlap a border.
- **A label that does not fit on two lines**: none of today's labels needs more than two lines.
  If a later edit gives a label that does not fit on two lines, it takes a third line under the
  same rules (FR-003b); it is still never shrunk or clipped.
- **Canvas bounds**: wrapping never changes a diagram's canvas. Each diagram keeps its width,
  height and `viewBox` (1200 by 480 for the five published diagrams), so its aspect ratio, the
  width and height the page gives the image, its displayed height at every width, and the
  page's layout shift are all unchanged. A grown box that would come within 30 units of the
  canvas bottom moves up instead: the Cadence Apple Watch and Tempo Apple Health boxes each move
  up 24 units, staying inside the same canvas.
- **Dark mode**: the diagrams keep their own light background in both site themes, as today:
  each published diagram fills its whole canvas with its light background, so in the dark theme
  it reads as a light panel on the dark page, unchanged by this feature. The lettering change
  does not alter diagram colours or contrast (FR-015). Contrast ratios depend only on colour,
  so Inter's different stroke weight does not change them; Don's preview check confirms the
  lettering reads well.
- **Meaning not carried by colour**: the diagrams show relationships with arrows and labels, and
  mark optional or online-only services with a dashed border (a line pattern, not a colour).
  This feature keeps that; no meaning depends on colour alone.
- **Downloadable fonts turned off**: a browser that refuses downloadable fonts (for example iOS
  Lockdown Mode) draws the labels in its generic sans-serif face, the last entry of the
  diagram's font stack (FR-008). That is the only fallback, and it is expected, not a defect.
- **Characters outside the site's Inter set**: a diagram can only use characters the site's own
  Inter faces from feature 018 contain (printable ASCII plus the common punctuation 018 ships,
  such as curly quotes, dashes and the ellipsis). A character outside that set fails the gate
  (FR-009); widening the site's character set is a change to feature 018's fonts, not part of
  this feature.
- **Caching**: each diagram carries its own copy of the glyphs it needs, so it does not share the
  page's cached font files. That costs at most 16 KB per diagram (FR-009a), loaded lazily below
  the fold, and the diagram file keeps the caching it has today. A longer cache lifetime for
  built files is follow-up work.
- **Images with no text**: project photos and screenshots (raster pictures such as Focus Pocus's
  tools and packing-list images) are not diagrams and are untouched.
- **Fixture site**: the fixture project stories used by the visual tests point at a raster sample
  picture, not a vector diagram, so this feature is expected to change no visual baseline. Any
  visual diff that was not predicted up front is a regression (CLAUDE.md "Visual baselines").
- **Content Security Policy**: a diagram must not need any request the current policy blocks
  (for example a font fetched from another address), and the policy is not loosened.
- **Images that fail to load**: if a diagram does not load, the visible description under it and
  its accessible name still describe it, as today.
- **Link-preview caching**: social sites and chat apps cache a sharing image for a while after it
  changes. A preview showing the old lettering for a time after release is expected and not a
  defect.
- **A stale sharing image**: the committed `public/og-default.png` is a rendered picture, and the
  release gate does not compare it with its source. If the render script changes and the PNG is
  not rendered again, the gate does not detect it. The guards are the documented re-render step
  (FR-006: run the script and commit the PNG whenever its source changes) and Don's check of the
  image on the preview deployment.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every architecture diagram on a published project story MUST draw all of its text in
  Inter: box titles in Inter Bold (700) and other labels in Inter Regular (400), matching the
  weights each label uses today.
- **FR-002**: Diagram text MUST draw in Inter regardless of the fonts installed on the viewer's
  device, including when the diagram image is opened on its own, outside the page.
- **FR-003**: Each diagram MUST keep its current wording, layout, colours, arrows, canvas (width,
  height and `viewBox`), accessible name (the alt text and the diagram's own `aria-label`) and
  visible description, byte for byte for the alt text, `aria-label` and description. Only the
  lettering changes, except where a label no longer fits its box with 16 units of clear space on
  each side (Edge Cases). Such a label wraps under FR-003b, and the plan lists every such
  adjustment with before and after coordinates. The canvas never grows: a box that needs room
  moves within it (Edge Cases, "Canvas bounds"). Diagrams with no wrapped label (today
  drcdev.github.io, Focus Pocus and the template starter) keep identical geometry.
- **FR-003b**: Label fit and wrapping rules, for every label in every diagram:
  - **Clear space** is measured horizontally from the label's rendered text box (its shaped,
    kerned advance width in Inter at the label's own size and weight, as the browser draws it) to
    the left and right geometric edges of the `<rect>` containing it (`x` and `x + width`), and
    must be at least 16 units on each side. Each line of a wrapped label meets this on its own.
  - **Wrapping** splits a label at a word space, after a comma where the label has one, otherwise
    at the natural phrase break that lets both lines fit; the plan names each break. Each line is
    its own `<text>` element centred on the box's `x`, at the label's size and weight, with the
    lines in reading order.
  - **Line spacing** of a wrapped label is 34 units baseline to baseline, the spacing the existing
    two-line boxes already use for 24-unit detail text, so the lines read as one phrase.
  - **Box growth**: a box grows by 34 units of height for each added line, keeping the space below
    its last line and above its title exactly as before. A box that would come within 30 units of
    the canvas bottom moves up just enough to keep that margin. No other box moves, boxes never
    overlap, and boxes stay at least 16 units apart.
  - **Arrows** keep their paths where both ends still land on the edge of the box they point to
    (the plan confirms this for every arrow it touches); otherwise only the end that touches the
    changed box moves, to the nearest point on that box's new edge. Arrowheads never overlap a
    label or cross into a box.
  - An automated browser check (SC-004) measures every label in every diagram against its box and
    fails, naming the file and the label, when a label breaks the clear space or overlaps another.
- **FR-003c**: Wrapping changes only the line layout of a label, never its wording, so no alt text,
  `aria-label` or visible description needs to change. When a diagram is shown as an image,
  assistive technology reads its alt text and visible description, not the labels inside it, so
  a label split across two text elements is still announced as one description. Opened on its
  own, the diagram's `role="img"` and `aria-label` name it.
- **FR-003a**: Each diagram MUST carry its Inter lettering inside the file as an inline data-URI
  `@font-face` holding Inter Regular and Inter Bold subset to only the characters that diagram's
  labels use. "The characters that diagram uses" means the decoded character data of every
  `<text>` and `<tspan>` in the file (every line of a wrapped label included) plus the space;
  the `aria-label`, `<title>` and `<desc>` are not drawn, so they are not counted. The labels
  MUST remain real text, not outlines, so a diagram opened on its own keeps selectable,
  searchable text, stays a small file, and is edited as plain text (Principle VI).
- **FR-004**: The project template's starter diagram MUST meet the same rules as the published
  diagrams: FR-001, FR-002, FR-003 (its `aria-label` is kept), FR-003a, FR-003b (its placeholder
  labels, "Input" and "Result", fit their boxes with at least 16 units each side in Inter),
  FR-008, FR-009 and FR-009a, so a new project story's diagram starts valid and in Inter. The
  starter is never published as it stands; its colours (the image's default text and stroke
  colour on a transparent canvas) stay as today, and a story author replaces it with a real
  diagram that meets FR-015 before publishing.
- **FR-005**: The site's default sharing image MUST show "Don Coleman" in Inter Bold, keeping its
  current size (1200 by 630), colours, layout, rule, lettering size (112 px, which stays about
  28 px tall in a 300 px wide link-preview thumbnail) and wording. Every page MUST keep naming
  the same sharing image address (`/og-default.png`) and the same alt text, "Don Coleman", which
  is the wording the image shows.
- **FR-006**: Producing the sharing image again from its source MUST give Inter lettering on any
  machine, without relying on fonts installed on that machine: `scripts/og-image/render.ts` loads
  `src/assets/fonts/Inter-Bold.woff2` through an inline `@font-face` (family `Inter`, weight
  700), and every `font-family` in the template it renders names `Inter` only: no system font
  name, no system font list, and no generic family as a fallback. The script refuses to write the
  PNG if that face has not loaded. A unit test checks the template it renders. The committed
  `public/og-default.png` is re-rendered once by hand in this feature, and again whenever the
  script changes (the documented re-render step: run the script and commit the PNG). Don
  confirms the image on the preview deployment. The gate checks the script, not the PNG: a PNG
  left stale after a script change is caught by that re-render step and the preview check, not
  by the gate (Edge Cases, "A stale sharing image").
- **FR-007**: Changing a diagram's wording MUST remain a plain file edit in the repository
  (Constitution Principle VI): the label is edited in the published SVG itself, then one script
  (fonttools through `uvx`, as `scripts/fonts/subset-inter.ts` uses) rewrites that file's
  embedded font block. Nothing runs at build time. The path is documented in `docs/projects.md`,
  beside the `diagram` picture kind, and that guidance states the fit rules of FR-003b (16 units
  each side; wrap rather than shrink or reword) and the 16 KB limit; label width is checked by
  the gate rather than by a character count, because widths vary by letter. The script checks
  its result against the gate's file rules (FR-008, FR-009, FR-009a, FR-012 and the FR-013
  notice) before writing; label fit (FR-003b) needs a browser, so it is checked by the gate's
  browser check (SC-004), not by the script. On any file-rule problem the script prints the
  messages, writes nothing for that file and exits with an error. Running it again on an
  unchanged file gives a byte-identical file. The guidance also tells the author that when a
  label edit changes what the diagram says, the alt text, the SVG's `aria-label` and the visible
  description are updated in the same change; the gate does not check meaning.
- **FR-008**: The release gate MUST fail, naming the file, when a diagram on a published project
  story or the template's starter diagram would draw any text in a font other than Inter. The
  only font stack a diagram may ask for is `Inter, sans-serif`, set once on the root `<svg>`
  element; its embedded `@font-face` rules MUST use the family name `Inter`, so the requested
  name and the embedded faces match. "A font other than Inter" covers: a different or missing
  root stack, a `font-family` on any other element, any `style` attribute, a `font-family` in
  CSS other than the two embedded `@font-face` rules, and any named system family (such as
  `system-ui`, `ui-sans-serif`, `-apple-system`, `Segoe UI`, `Roboto`, `Helvetica` or `Arial`),
  whether alone, inherited or inside a fallback list. The trailing generic `sans-serif` is
  allowed only as the last fallback for browsers that refuse downloadable fonts. Diagram text
  MUST use only weights 400 and 700 and no `font-style`; any other weight, or italic, fails the
  gate because no face for it is embedded.
- **FR-009**: The release gate MUST fail, naming the diagram and the character, when a diagram
  label uses a character that the Inter glyphs embedded in that diagram do not contain (for
  example, after a label edit without re-running the font script). Detection reads the
  character map of each embedded face (Regular and Bold) from the font data itself, not from
  how the label looks, and checks every label character against both. The message names the
  file, the character's code point as `U+XXXX`, the character itself and the face it is missing
  from, and says to re-run the font script.
- **FR-009a**: Each published diagram and the template's starter diagram MUST be at most 16 KB
  (16,384 bytes) as the committed file on disk, uncompressed, which is also the size the site
  serves before transfer compression. The figure includes the base64-encoded font data. A unit
  test enforces it.
- **FR-010**: The per-page performance budget MUST NOT be raised. Every page template, including
  the project story template, MUST stay within today's limits (150 KB total transfer, and the
  unchanged LCP, CLS, long-task and JavaScript limits) under the existing measurement
  conditions: the `budget` test project (`tests/e2e/budget.spec.ts`) on a production build, at
  its simulated mobile viewport and network, for every page template it measures. If the
  diagrams pushed a page over a limit, the fix is to make the diagrams or the page smaller,
  never to raise the limit, and the pull request does not merge until the page is back within
  it. At today's figures (project story page about 65 KB, each diagram at most 16 KB) this
  cannot happen.
- **FR-011**: The plan MUST record each diagram's transferred size before and after the change,
  and the project story page's total transfer before and after, so the cost of the Inter
  lettering is visible in review.
- **FR-012**: Diagrams MUST NOT need any network request beyond the image itself (no separately
  fetched font), and the site's Content Security Policy MUST NOT be loosened: neither the page
  policy in `astro.config.mjs` (`security.csp`) nor the response headers in `public/_headers`
  change, and the existing header and CSP unit tests keep passing unchanged. The page policy does
  not govern what happens inside an image, and a diagram served on its own gets the site-wide
  response policy (`frame-ancestors`, `object-src`, `base-uri`), which does not restrict fonts,
  so the embedded `data:` fonts load in both cases with no policy change. The browser check of
  FR-002 confirms the faces load, and Don's preview check confirms it on the served site.
- **FR-013**: The site's Inter font files and their licence stay as feature 018 shipped them. Any
  Inter glyphs carried into the images are cut from the committed
  `src/assets/fonts/Inter-Regular.woff2` and `Inter-Bold.woff2` (Inter 4.1, held to recorded
  checksums by feature 018's tests). Inter is licensed under the SIL Open Font License 1.1 with
  no Reserved Font Name, so a subset may keep the name Inter. The licence's redistribution terms
  are met inside each diagram: the embedded subsets keep the font's copyright notice in their
  name table ("Copyright 2016 The Inter Project Authors"), and an XML comment directly before
  the `<style>` that holds the embedded faces names Inter 4.1, that copyright holder, the SIL Open Font License 1.1 with its
  address, and the full licence text in `src/assets/fonts/LICENSE.txt`. The subsets are only
  distributed inside the diagrams, never sold on their own, and stay under the same licence.
  The sharing image is a picture of rendered text, not a font, so the licence places no
  condition on it and it needs no attribution.
- **FR-014**: No other image changes: photographs, screenshots, post feature images and card
  images keep their current files.
- **FR-015**: Diagram label colours and box fills stay as they are, and every label keeps at
  least the WCAG 2.2 AA 4.5:1 contrast ratio against what is behind it. Today the published
  diagrams draw all labels in `#2a2540` on `#ffffff` boxes (14.6:1), `#e4dff0` boxes (11.2:1) and
  the `#f4f1ec` canvas (13.0:1). The sharing image's rust `#d68844` lettering on the dusk
  `#1c1a29` background is 6.1:1, above the 3:1 needed for large text and the 4.5:1 for normal
  text. The project story template's automated accessibility checks run with the new diagrams
  and pass with no new violations (SC-005).

### Key Entities

- **Architecture diagram**: a vector image attached to a project story as its diagram picture,
  with an accessible name, a visible description and text labels at two weights. Five are
  published today, plus the project template's starter diagram.
- **Default sharing image**: the single site-wide 1200 by 630 picture every page names for link
  previews, with fixed alt text.
- **Inter faces**: the regular and bold Inter faces from feature 018, the reference the image
  lettering must match.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five published architecture diagrams and the template's starter diagram draw
  100% of their labels in Inter, and each diagram renders with the same glyphs in the macOS,
  Linux CI and Linux Docker browsers the project tests in. The supported browsers are current
  Chromium-based browsers, Safari (WebKit) and Firefox (Gecko), all of which load data-URI WOFF2
  fonts inside an SVG shown as an image. The automated check runs in Chromium; Don opens a
  diagram in Safari and one other browser as part of the preview check.
- **SC-002**: The sharing image's lettering is Inter Bold: a unit test confirms the render script
  embeds the site's own Inter Bold face and names no system font, and Don confirms the committed
  image on the preview deployment (a `[PREVIEW-CHECK]` item).
- **SC-003**: Every page template, including the project story template, stays within the
  150 KB total-transfer budget and the other budget limits, with no limit raised.
- **SC-004**: An automated check fails when a diagram asks for a non-Inter font, uses a
  character outside its embedded Inter glyphs, exceeds 16 KB, lacks the licence notice, or has
  a label that breaks the 16-unit clear space or overlaps another label, and passes on all
  current diagrams.
- **SC-005**: No visual baseline changes (the visual tests use raster fixture pictures, so the
  diagrams' new geometry cannot reach them), and the existing automated accessibility checks on
  the project story template, run with the new diagrams, pass with no new violations.
- **SC-006**: Don confirms on the preview deployment that the diagrams and the sharing image look
  right and match the site's type.

## Assumptions

- The five published project stories and the template's starter diagram are the only vector
  diagrams on the site. Raster images (photos, screenshots, card and feature images) contain no
  text this feature needs to change.
- Current diagram labels use only characters already in the Inter character set shipped by
  feature 018 (printable ASCII plus common punctuation), so no new glyph coverage is needed.
- Diagrams use only regular and bold text; no diagram uses italic today, so the italic faces are
  not needed in images.
- The site has a single default sharing image; pages do not have their own sharing images, and
  adding per-page images is not part of this feature.
- Diagrams are shown as images, not inlined into the page, and that stays as it is.
- The Inter lettering is carried inside each diagram as a per-diagram glyph subset (FR-003a),
  cut from feature 018's committed Inter 4.1 files (FR-013). Measured: the largest diagram's
  subset is under 3 KB per weight as a font file and under 4 KB per weight once base64-encoded
  into the SVG, so a diagram is about 9 to 10 KB in all, well under the 16 KB ceiling.

## Follow-up work (out of scope)

- A monospace code font (carried over from feature 018).
- Right-sizing or re-encoding post card and feature images, and lowering the 150 KB budget again
  afterwards (carried over from feature 018).
- Per-page sharing images (for example a generated image per post or project showing its title).
- A long cache lifetime for all fingerprinted build files, not only the font files (carried over
  from feature 018).
- Restyling the diagrams themselves (colours, dark-mode variants, new layouts) beyond what is
  needed to keep labels inside their boxes.
- Running the automated diagram font and fit check in WebKit and Firefox as well as Chromium
  (this feature covers those engines by Don's preview check, SC-001).
