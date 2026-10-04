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
request after checking the preview deployment. Whether it also adds a dependency or tool is a
plan decision; if it does, that is a further Principle III trigger covered by the same review.

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
   **Then** the wording, layout, colours, box sizes, arrows, image dimensions, accessible name
   and visible description are unchanged; only the lettering differs, and every label still
   fits inside its box.

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

- **Small display sizes**: diagrams are shown about 26rem wide on large screens and full width on
  phones. Labels in Inter must stay at least as legible as today at the smallest width the page
  shows them.
- **Wider or narrower glyphs**: Inter's letters are not the same width as each system font's.
  Every label must fit inside its box with at least 16 units (in the diagram's own coordinates)
  of clear space on each side. Measured from Inter's metrics, five detail labels do not fit their
  300-unit boxes: Cadence "sync and AI routines, when online", "via a Shortcuts handoff,
  optional" and "local store and write queue", Tempo "or Health Connect, optional", and Flux
  "Supabase Edge Functions". Each of these wraps onto two lines at the same size and weight,
  and that box grows taller (with its arrows moved) only where the extra line needs room. Labels
  are never shrunk, reworded, clipped or allowed to overlap a border.
- **Dark mode**: the diagrams keep their own light background in both site themes, as today.
  The lettering change does not alter diagram colours or contrast.
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

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every architecture diagram on a published project story MUST draw all of its text in
  Inter: box titles in Inter Bold (700) and other labels in Inter Regular (400), matching the
  weights each label uses today.
- **FR-002**: Diagram text MUST draw in Inter regardless of the fonts installed on the viewer's
  device, including when the diagram image is opened on its own, outside the page.
- **FR-003**: Each diagram MUST keep its current wording, layout, colours, arrows, image
  dimensions, accessible name (the alt text and the diagram's own label) and visible
  description. Only the lettering changes, except where a label no longer fits its box with
  16 units of clear space on each side (Edge Cases). Such a label wraps onto two lines at the
  same size and weight, its box grows taller and its arrows move only as far as needed, and the
  plan lists every such adjustment.
- **FR-003a**: Each diagram MUST carry its Inter lettering inside the file as an inline data-URI
  `@font-face` holding Inter Regular and Inter Bold subset to only the characters that diagram's
  labels use. The labels MUST remain real text, not outlines.
- **FR-004**: The project template's starter diagram MUST follow FR-001 and FR-002, so a new
  project story's diagram starts in Inter.
- **FR-005**: The site's default sharing image MUST show "Don Coleman" in Inter Bold, keeping its
  current size (1200 by 630), colours, layout, rule and wording. Every page MUST keep naming the
  same sharing image address and alt text.
- **FR-006**: Producing the sharing image again from its source MUST give Inter lettering on any
  machine, without relying on fonts installed on that machine: `scripts/og-image/render.ts` loads
  `src/assets/fonts/Inter-Bold.woff2` through an inline `@font-face` and names no system font. A
  unit test checks this. The committed `public/og-default.png` is re-rendered once by hand, and
  Don confirms it on the preview deployment.
- **FR-007**: Changing a diagram's wording MUST remain a plain file edit in the repository
  (Constitution Principle VI): the label is edited in the published SVG itself, then one script
  (fonttools through `uvx`, as `scripts/fonts/subset-inter.ts` uses) rewrites that file's
  embedded font block. Nothing runs at build time. The plan says where that path is documented.
- **FR-008**: The release gate MUST fail, naming the file, when a diagram on a published project
  story or the template's starter diagram would draw any text in a font other than Inter.
- **FR-009**: The release gate MUST fail, naming the diagram and the character, when a diagram
  label uses a character that the Inter glyphs embedded in that diagram do not contain (for
  example, after a label edit without re-running the font script).
- **FR-009a**: Each published diagram and the template's starter diagram MUST be at most 16 KB,
  enforced by a unit test.
- **FR-010**: The per-page performance budget MUST NOT be raised. Every page template, including
  the project story template, MUST stay within today's limits (150 KB total transfer, and the
  unchanged LCP, CLS, long-task and JavaScript limits) under the existing measurement
  conditions.
- **FR-011**: The plan MUST record each diagram's transferred size before and after the change,
  and the project story page's total transfer before and after, so the cost of the Inter
  lettering is visible in review.
- **FR-012**: Diagrams MUST NOT need any network request beyond the image itself (no separately
  fetched font), and the site's Content Security Policy MUST NOT be loosened.
- **FR-013**: The site's Inter font files and their licence stay as feature 018 shipped them. Any
  Inter glyphs carried into the images come from the same Inter release, and the Inter
  licence's redistribution terms are met for the images too.
- **FR-014**: No other image changes: photographs, screenshots, post feature images and card
  images keep their current files.

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
  Linux CI and Linux Docker browsers the project tests in.
- **SC-002**: The sharing image's lettering is Inter Bold: a unit test confirms the render script
  embeds the site's own Inter Bold face and names no system font, and Don confirms the committed
  image on the preview deployment (a `[PREVIEW-CHECK]` item).
- **SC-003**: Every page template, including the project story template, stays within the
  150 KB total-transfer budget and the other budget limits, with no limit raised.
- **SC-004**: An automated check fails when a diagram asks for a non-Inter font, uses a
  character outside its embedded Inter glyphs, or exceeds 16 KB, and passes on all current
  diagrams.
- **SC-005**: No visual baseline changes, and the accessibility checks on the project story
  template still pass with no new violations.
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
  made from the same Inter 4.1 files as feature 018. Measured: a subset covering every current
  diagram label is about 4 KB per weight, so each diagram stays well under the 16 KB ceiling.

## Follow-up work (out of scope)

- A monospace code font (carried over from feature 018).
- Right-sizing or re-encoding post card and feature images, and lowering the 150 KB budget again
  afterwards (carried over from feature 018).
- Per-page sharing images (for example a generated image per post or project showing its title).
- A long cache lifetime for all fingerprinted build files, not only the font files (carried over
  from feature 018).
- Restyling the diagrams themselves (colours, dark-mode variants, new layouts) beyond what is
  needed to keep labels inside their boxes.
