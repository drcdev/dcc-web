# Feature Specification: Self-hosted monospace font for code

**Feature Branch**: `019-code-monospace-font`

**Created**: 2026-10-04

**Status**: Draft

**Input**: User description: "Give code blocks a self-hosted monospace font (GitHub issue #75). Code and preformatted blocks render in the body font, Inter, because the site has no monospace font at all. Code would read better in a real monospace face that matches Inter's tone, self-hosted the same way so it renders identically everywhere. Pick a face with a real italic, subset it like Inter, keep it inside the page budget, and refresh the visual baselines that show code."

This feature implements GitHub issue #75, and the pull request closes it.

## Background

Feature 018 (self-hosted fonts, PR #72) made Inter the site's only typeface and kept code and
preformatted blocks in the body font on purpose (its D2 and FR-008), listing a monospace code
font as follow-up work. Today inline code, code blocks and preformatted text are drawn in Inter,
a proportional face: columns in code do not line up, and similar characters such as capital I,
lowercase l and the digit 1, or capital O and zero, are hard to tell apart.

Feature 018 also showed why the face must be self-hosted with real italic and bold faces: the
Linux image used to regenerate visual baselines has no true italic in its system font, so a
browser-synthesized slant renders differently in Docker and in CI (issue #62). A code font
that depends on what each machine has installed would bring that drift back for every subject
that shows code.

This feature supersedes feature 018's D2 and FR-008 ("code keeps the body font"). Feature 018's
spec is not rewritten; from this feature on, code text is governed by this spec.

This is a change to the design system and visual identity, so it is a **major change** under
Constitution Principle III: Don approves the pull request after checking the preview
deployment, and auto-merge stays off.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A reader reads code in a real monospace face (Priority: P1)

A visitor reads a post that contains a code block or inline code. The code is drawn in a
monospace face that sits comfortably beside Inter: characters line up in columns, indentation
is even, and look-alike characters (I l 1, O 0) are easy to tell apart. Prose around the code
stays in Inter.

**Why this priority**: This is the reader-facing value in issue #75.

**Independent Test**: Load a post with a code block and inline code and confirm the browser
reports the monospace face as the face that drew the code text, while paragraphs and headings
are still drawn in Inter.

**Acceptance Scenarios**:

1. **Given** a post with a fenced code block, **When** it loads, **Then** every character in
   the block is drawn in the shipped monospace face at regular weight, and every character
   advances by the same width.
2. **Given** a paragraph with inline code, **When** it loads, **Then** the inline code is drawn
   in the monospace face and the rest of the paragraph in Inter.
3. **Given** inline code inside emphasis, bold text or a heading, **When** it loads, **Then** it
   is drawn in the monospace face's real italic, bold or bold-italic face, never a
   browser-synthesized slant or weight.
4. **Given** code text, **When** it renders, **Then** its size, colours, syntax-highlight
   colours, background, padding and line height are the same as today; only the typeface
   changes.

---

### User Story 2 - The code font loads like Inter: same origin, small, no layout cost (Priority: P2)

A visitor on a slow connection opens a page with code. The code is readable from first paint in
a monospace system fallback, swaps to the shipped face without a noticeable jump, and every
font file comes from the site itself. A page without code downloads no code font at all.

**Why this priority**: The font must not cost readers speed, privacy or accessibility; the
constitution's budget and privacy rules apply to it in full.

**Independent Test**: Run the page budget test and the network checks on every page template,
including a page with code, and confirm no font request leaves the origin, pages without code
make no code-font request, and every page stays within the 150 KB budget.

**Acceptance Scenarios**:

1. **Given** any page, **When** its network requests are inspected, **Then** every font file
   comes from the site's own origin and no request goes to a font service or any third party.
2. **Given** a page that draws no code, **When** it loads, **Then** it requests no monospace
   font file.
3. **Given** a page with code on a slow connection, **When** it loads, **Then** code text is
   visible from first paint in a monospace fallback and swaps to the shipped face without
   pushing the page over the existing layout-shift budget.
4. **Given** any page template, **When** the accessibility checks run (phone and desktop, light
   and dark, forced colours, 200% zoom, 320 CSS px with text-spacing overrides), **Then** they
   report zero WCAG 2.2 AA violations, as today.

---

### User Story 3 - Baselines that show code are refreshed as one predicted change (Priority: P3)

Don reviews one pull request in which only the visual baselines that show code change, for both
platforms, with Linux baselines regenerated locally in Docker passing CI on the first run.

**Why this priority**: A consequence of Story 1, but the visual gate stays meaningful only if
the refreshed set is exactly the predicted one.

**Independent Test**: List the changed baseline images in the pull request and confirm they are
exactly the subjects that draw code text, on both platforms, and that the visual project passes
locally on macOS and in CI on Linux on the first run.

**Acceptance Scenarios**:

1. **Given** the font change, **When** baselines are regenerated, **Then** every baseline whose
   subject draws code text is refreshed on both platforms and no other baseline changes.
2. **Given** Linux baselines regenerated locally in Docker, **When** CI runs the visual project,
   **Then** every subject passes on the first run.

### Edge Cases

- **Code font fails to load** (blocked, offline, slow): code stays readable in the system
  monospace fallback; nothing is hidden. Each face loads or fails on its own.
- **Characters outside the shipped set** in code (for example box-drawing characters in a
  directory tree, or emoji): those characters fall back to the system stack only, as Inter's
  uncovered characters do today; the page still renders and the build does not fail. Visual-test
  subjects must not draw an uncovered code character unless it is explicitly excluded in the
  guard test.
- **Code inside a heading or bold text**: heading weight is bold, so code there uses the bold
  monospace face; weights the site does not ship resolve to a shipped face through standard CSS
  font matching (500 to 400; 600 and 800 to 700), with no synthesized weight.
- **Italic code**: code inside emphasis uses the real italic face. Syntax-highlight colours are
  unchanged and no highlight class gains an italic or bold style.
- **Long lines**: code blocks keep scrolling sideways inside their card as today; a monospace face
  is usually wider than Inter, so more lines may scroll, and focus on a scrollable block stays
  visible. No page may scroll sideways at 320 CSS px or 200% zoom.
- **Keyboard and sample text** (`kbd`, `samp`): these monospace roles use the same shipped face,
  so no text on the site depends on a monospace font installed on the visitor's machine.
- **Heaviest page**: the page with the most transfer must still fit the 150 KB budget with every
  face it draws, Inter and monospace. The budget is not raised in this feature; if a page cannot
  fit, the work stops and Don is told the page, its bytes and their breakdown.
- **Repeat visits**: code-font files get the same fingerprinted names and one-year immutable
  cache header as Inter, so a second page view downloads no font bytes.
- **JavaScript off**: the code font loads and applies with no client-side script.
- **Forced colours and dark mode**: no colour token, size or spacing changes, so contrast is
  unchanged; the existing checks must still pass.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Inline code, code blocks, preformatted text, and keyboard and sample text (`code`,
  `pre`, `kbd`, `samp`) on every public page MUST render in one self-hosted monospace typeface.
  Prose, headings and every other text stay in Inter. Text inside images is out of scope.
- **FR-002**: The monospace typeface MUST be released under the SIL Open Font License (or an
  equally permissive font licence that allows self-hosting, subsetting and commercial use), MUST
  have true italic designs (not only an oblique of the upright), and MUST be chosen to sit with
  Inter: neutral, sans-serif letterforms, an x-height close to Inter's, and clearly distinct
  I l 1 | and O 0. The plan records the candidates considered, the face chosen and why.
- **FR-003**: The site MUST ship exactly four monospace faces: regular (400), italic (400),
  bold (700) and bold italic (700). Each MUST contain exactly the same shipped character set as
  the Inter faces (printable ASCII, all of Latin-1, – — ‘ ’ “ ” … • and → ✓ ✗ where the face has
  those glyphs). OpenType features MAY be dropped to save bytes, except any the face needs to
  draw the shipped characters correctly; programming ligatures MUST NOT be shipped or enabled, so code shows the characters
  typed. The four files together MUST be at most 60,000 bytes; the plan records the measured
  sizes.
- **FR-004**: Code text drawn in the monospace face MUST use its real italic and bold faces,
  never a browser-synthesized slant or weight. Fallback text keeps the browser's default
  synthesis, as for Inter.
- **FR-005**: Font files MUST be committed to the repository and served from the site's own
  origin, through the same first-party mechanism the site already uses for Inter. The site MUST
  NOT request fonts or stylesheets from a font service or any third party.
- **FR-006**: While the monospace face loads, or if it fails, code MUST be visible in a system
  monospace fallback stack, using `font-display: swap`. Metric-adjusted fallback faces SHOULD
  be used where the platform supports them for this face, so the swap does not shift layout; the
  swap MUST NOT push any page over the existing cumulative layout shift budget (CLS below 0.1).
- **FR-007**: The monospace faces MUST NOT be preloaded, because most pages draw no code. A page
  that draws no code MUST request no monospace font file, and a page MUST request each face at
  most once. Inter's preloads are unchanged.
- **FR-008**: Every page MUST stay within the existing performance budget (150 KB total transfer
  per page on simulated slow 4G, LCP 2.5 s, CLS below 0.1, long tasks 200 ms, JavaScript 10 KB),
  measured exactly as feature 018's FR-007 defines, with every face a page draws counted. No
  budget limit is raised in this feature. If a page cannot fit, implementation halts before the
  pull request and Don is told which page failed, its measured bytes and their breakdown.
- **FR-009**: Code size, colours, syntax-highlight colours, background, padding, border and line
  height MUST stay as they are today. No highlight class gains a font style or weight.
- **FR-010**: The Content Security Policy MUST continue to allow the fonts with no violation and
  MUST NOT be loosened. The only permitted change in the built policy is any `sha256-` hash for
  the generated font style; no source, keyword or directive is added or changed in either the
  page policy or the header policy.
- **FR-011**: Monospace font files MUST be emitted with fingerprinted filenames and served with
  the same one-year immutable cache header as the Inter files, through the existing
  font-directory rule; no other build file's caching changes.
- **FR-012**: Every page MUST continue to meet WCAG 2.2 AA, including reflow at 320 CSS px and
  200% zoom with no horizontal page scroll, resize text, the 1.4.12 text-spacing overrides, and
  visible, unobscured focus on scrollable code blocks, in light and dark themes and in
  forced-colours mode.
- **FR-013**: The font licence MUST be committed alongside the font files, unmodified and with
  its copyright notice, kept distinct from Inter's licence file.
- **FR-014**: The character guard test from feature 018 MUST also cover code text in the visual
  subjects: it fails when a visual subject draws, in code, a character outside the monospace
  shipped set, naming the character, its code point and its file, unless the character is in the
  test's named exclusion list with a reason. Real site content is not checked.
- **FR-015**: Every visual baseline whose subject draws code text MUST be regenerated on both
  platforms as a predicted change, and no other baseline may change. macOS baselines come from
  `pnpm run test:visual:update` and Linux baselines from `pnpm run test:visual:update:linux` in
  Docker; the visual project MUST pass on both, and the Docker-generated Linux baselines MUST
  pass CI on the first run. Visual shots MUST wait for the monospace faces a subject draws, as
  they already wait for Inter, so no shot is taken mid-swap. If the Docker baselines fail CI,
  the cause is investigated within this feature as feature 018's FR-011 describes; CI-artifact
  baselines are not landed without telling Don.
- **FR-016**: Fonts MUST load and apply with JavaScript turned off and MUST add no client-side
  script.
- **FR-017**: The change MUST add no recurring cost, no new external service and no new package
  dependency, and MUST NOT touch the contact form, the contact API, any data collection or
  storage, or any secret.

### Key Entities

- **Monospace face**: one of the four shipped code-font files, defined by weight (400 or 700),
  style (normal or italic), the shipped character set, its fingerprinted filename and its size
  in bytes, which counts against the budget of pages that draw it.
- **Monospace fallback stack**: the system monospace families used while the face loads, if it
  fails, and for characters outside the shipped set.
- **Shipped character set**: the same set Inter ships (feature 018 FR-002), in all eight faces.
- **Code-bearing visual subject**: a visual-test subject that draws code text; its baselines
  are the only ones this feature refreshes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every page template that shows code, 100% of code text is drawn by the shipped
  monospace faces, as reported by the browser for the face that actually drew it, with zero
  synthesized italic or bold faces; 100% of non-code text is still drawn by Inter.
- **SC-002**: Zero font or stylesheet requests leave the site's own origin on any page template.
- **SC-003**: Pages that draw no code make zero monospace font requests.
- **SC-004**: Every page measured by the budget test stays at or under 150 KB (153,600 bytes)
  total transfer, with LCP, CLS, long-task and JavaScript limits unchanged.
- **SC-005**: The four monospace files total at most 60,000 bytes.
- **SC-006**: The accessibility checks report zero violations on every page template, at both
  widths and in both themes, unchanged from today.
- **SC-007**: The refreshed baselines are exactly the code-bearing subjects on both platforms
  (zero other baselines changed), and Docker-generated Linux baselines pass CI's visual project
  on the first run at the unchanged comparison threshold. Every changed region is explained by
  the code typeface (glyph shapes and widths, and the wrapping and box sizes they cause).
- **SC-008**: Running costs are unchanged ($0 added per month).

## Assumptions

- The working candidate is JetBrains Mono (SIL OFL 1.1, true italics, neutral sans letterforms,
  commonly paired with Inter). IBM Plex Mono and Source Code Pro are the alternatives. The plan
  confirms the choice against FR-002 and FR-003 by measuring the subset sizes; if no candidate
  meets the 60,000-byte cap, the work stops and Don is told the measured sizes.
- Comments and other syntax-highlighted tokens keep their current non-italic style; the italic
  face exists for code inside emphasis and for consistency, not to restyle highlighting.
- From a scan of the fixture site, only the fixture post template subject draws code (inline
  code and one code block); the plan confirms the exact list of code-bearing subjects and
  baseline images before regenerating.
- Real content with code (three posts on 2026-10-04) uses ASCII code text; box drawing and emoji
  in code fall back by design.
- Feature 018's font loading, cache header rule, CSP set-up and visual-test font settling are
  reused; this feature adds a second family, not a new mechanism.
- Docker remains the local way to regenerate Linux baselines; if Docker Desktop is off, Don is
  asked to start it.

## Out of Scope

- Changing the size, colour, spacing or highlighting of code, beyond what the new typeface's
  widths cause.
- Programming ligatures, variable fonts, weights other than 400 and 700, and non-latin subsets.
- Adding box-drawing or other symbol ranges to either typeface.
- Text inside images (SVG diagrams, og image).
- Changes to Inter, the budget limits, the visual comparison threshold or how baselines are
  generated.

## Follow-up work

- Consider adding box-drawing characters to the monospace subset, so directory trees in code
  blocks line up, if real content needs it and the budget allows.
- The follow-ups listed in feature 018 (card-image right-sizing, a long cache for all of
  `/_astro/`, Inter in SVG text) remain open and are unaffected.
