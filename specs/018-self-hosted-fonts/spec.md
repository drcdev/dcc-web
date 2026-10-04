# Feature Specification: Self-hosted Inter web fonts

**Feature Branch**: `018-self-hosted-fonts`

**Created**: 2026-10-03

**Status**: Draft

**Input**: User description: "Find a better way to keep Linux visual baselines in step with CI (GitHub issue #62). Linux visual baselines regenerated locally in Docker keep failing the CI visual project on the fixture post template by about 1% of pixels, because CI's browser renders the post page's text slightly differently from the Docker image. Don decided the fix is to self-host the Inter web font site-wide, with real italic and bold-italic faces, so Docker, CI, macOS and every visitor render the same glyphs."

This feature implements GitHub issue #62, and the pull request closes it.

## Background

The site ships no web fonts today: headings and body text use the visitor's system font, and
code and preformatted blocks use that same body font. The only visual subject with italic text
is the fixture post page (block quotes, emphasis, bold italic and the views note). The Linux
image used to regenerate visual baselines locally has a system font with no true italic face,
so the browser fakes the slant, and it fakes it slightly differently from the CI runner. The
result is a roughly 1% pixel mismatch on that one subject, and the only remedy is a slow round
trip through CI to fetch CI-rendered images.

Shipping the site's own font files, including real italic faces, removes the dependence on
whatever fonts each machine happens to have installed. Every environment and every visitor
then draws text from the same glyphs.

This is a change to the design system and visual identity, so it is a **major change** under
Constitution Principle III: Don approves the pull request after checking the preview
deployment. It also supersedes the "system font stack, no web fonts" part of the site
foundation's FR-003 (feature 002, site foundation).

## Clarifications

### Session 2026-10-03

- Q: Should medium-weight text (weight 500) render in Inter Regular 400 or Inter Bold 700, now that only 400 and 700 ship? → A: Standard CSS font matching decides, with no class changes: 500 renders as 400; 600 and 800 render as 700. The plan lists the affected components.
- Q: Which characters must the shipped Inter files contain? → A: Printable ASCII, all of Latin-1 (U+00A0–U+00FF), the common typographic punctuation – — ‘ ’ “ ” … •, and → ✓ ✗ where Inter has those glyphs. Size savings come from dropping OpenType features, keeping kerning.
- Q: Should a test fail when a visual-test subject draws a character the shipped Inter files do not contain? → A: Yes, for the visual subjects only (shell, not-found page and fixture site). Fixture text with uncovered characters is changed or explicitly excluded; real content is not checked.
- Q: How should font files be cached between page views? → A: Fingerprinted filenames emitted by the Astro build, served with `Cache-Control: public, max-age=31536000, immutable`.
- Q: Should the "never synthesize a slant or weight" rule also apply when text is shown in the system fallback font? → A: No. The rule covers Inter only: all four faces are declared, so Inter text always uses real faces, and tests check the rendered face. Fallback text keeps the browser's default synthesis so emphasis still shows.
- Q: Should the one-year immutable cache header apply only to the font files, or to every fingerprinted build file under `/_astro/`? → A: Only the four fingerprinted Inter files. Other build files keep today's caching; a long cache for all of `/_astro/` is follow-up work.
- Q: Should the project architecture diagrams (SVG images whose text uses the system font) switch to Inter as part of this feature? → A: No. Text inside images (the SVG diagrams and the og image) is out of scope and keeps its current font; converting it is follow-up work.
- Q: What happens if Linux baselines regenerated locally in Docker still fail CI's visual project on the first run after the font change? → A: First investigate the remaining cause within this feature (Docker image fonts, rendering flags). If the Docker-to-CI match still cannot be shown, stop and report the diff details to Don. CI-artifact baselines are never landed for this PR, and issue #62 is not closed until the match is shown.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A predicted visual change lands green first time (Priority: P1)

Don (or an agent working for him) makes a change that is expected to alter the look of a page
template, regenerates the Linux visual baselines locally in Docker, commits them, and opens a
pull request. The CI visual check passes on the first run, with no need to label the pull
request, wait for CI to produce images, download them and push again.

**Why this priority**: This is the problem in issue #62. Every predicted visual change today
costs an extra CI round trip and a red first run, and it has recurred on several pull requests.

**Independent Test**: Regenerate the Linux baselines in Docker on this branch, push, and confirm
the CI visual project passes on the first run for every subject, including the fixture post
page with its italic and bold-italic text.

**Acceptance Scenarios**:

1. **Given** Linux baselines regenerated locally in Docker from this branch, **When** CI runs
   the visual project, **Then** every subject, including the fixture post page, matches with no
   diff beyond the existing comparison threshold.
2. **Given** the fixture post page with block quotes, emphasis, bold italic and the views note,
   **When** it is rendered in Docker and in CI, **Then** its italic text is drawn from a real
   italic face in both, not a synthesized slant.

---

### User Story 2 - A reader sees the same typeface everywhere (Priority: P2)

A visitor opens any page on the site, on any device or operating system, and reads headings and
body text in Inter. Italic and bold-italic text uses true italic letterforms. Until the font
arrives, the page shows text in the current system font, and when Inter arrives the page does
not jump or reflow noticeably.

**Why this priority**: The font is the mechanism for Story 1, and it changes what every visitor
sees, so it must be correct, fast and accessible in its own right.

**Independent Test**: Load each page template in a browser and confirm the computed font for
headings, body text, italic, bold and bold-italic text is Inter, the font files come from the
site's own origin, no request goes to any other origin for fonts, and the page budget test still
passes.

**Acceptance Scenarios**:

1. **Given** any page template, **When** it loads, **Then** headings and body text render in
   Inter at regular (400) and bold (700) weights, and italic and bold-italic text render in
   Inter's italic faces.
2. **Given** any page, **When** its network requests are inspected, **Then** every font file
   comes from the site's own origin and no request goes to a font service or other third party.
3. **Given** a slow connection, **When** a page loads, **Then** text is visible immediately in
   the current system font stack and swaps to Inter without layout shift beyond the existing
   cumulative layout shift budget.
4. **Given** code and preformatted blocks, **When** they render, **Then** they use the same
   body font as the surrounding text, exactly as today (now Inter).
5. **Given** the site's Content Security Policy, **When** any page loads, **Then** the fonts load
   with no policy violation and the policy is not loosened.

---

### User Story 3 - Baselines refreshed as one predicted change (Priority: P3)

Because the typeface changes on every page, every visual baseline changes. Don reviews one
pull request that refreshes all baselines for both platforms as a predicted change, with the
preview deployment available to check the new look.

**Why this priority**: It is a necessary consequence of Story 2 rather than a goal, but the
baselines must be complete and correct for the gate to stay meaningful.

**Independent Test**: Count the refreshed baseline images in the pull request and confirm all
132 (66 macOS, 66 Linux) were regenerated, and that the visual project passes on both platforms.

**Acceptance Scenarios**:

1. **Given** the font change, **When** the baselines are regenerated, **Then** all 66 macOS and
   all 66 Linux baselines are updated in the same pull request, and no other visual diff
   appears.
2. **Given** the refreshed baselines, **When** the visual project runs locally on macOS and in
   CI on Linux, **Then** it passes on both.

### Edge Cases

- **Font fails to load** (blocked, offline, slow): text stays readable in the current system
  font stack; nothing is hidden or blank while waiting.
- **Characters outside the shipped character set** (for example a letter outside Latin-1, an
  emoji or a box-drawing symbol in a post): the browser falls back to the system stack for those
  characters only; the page still renders and the build does not fail. Visual-test subjects are
  the exception: a guard test fails if they draw an uncovered character, unless that character
  is explicitly excluded (FR-016).
- **Unshipped weights**: weights the site does not ship resolve to a shipped face through
  standard CSS font matching, with no class changes and no synthesized weight: medium (500)
  renders as regular (400); semibold (600) and extrabold (800) render as bold (700). The plan
  lists the affected components.
- **Heaviest page**: the page with the most content transferred must still fit the 100 KB total
  transfer budget with the fonts included. If any page cannot fit, the work stops and is reported
  to Don; the budget is not raised.
- **Repeat visits**: font files are cached by the browser so a second page view does not
  download them again. Only the font files get the long cache; other build files keep today's
  caching.
- **Emphasis in the fallback font**: while Inter loads, if it fails, or for characters outside
  the shipped set, italic and bold text in the fallback stack keeps the browser's default
  synthesis, so emphasis still shows even where the system font has no real italic or bold
  face.
- **Docker baselines still fail CI**: if Linux baselines regenerated in Docker still fail CI's
  visual project on the first run, the remaining cause is investigated within this feature; if
  the match still cannot be shown, the work stops and the diff is reported to Don (FR-011).
- **Text inside images**: the SVG architecture diagrams and the og image keep their current font
  (FR-001).
- **Forced colours and dark mode**: the font change does not affect contrast, focus indicators
  or forced-colours rendering.
- **JavaScript off**: fonts load and apply without any client-side script.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every public page MUST render headings and body text in the Inter typeface. Text
  inside images (the SVG architecture diagrams and the og image) is out of scope and keeps its
  current font.
- **FR-002**: The site MUST ship exactly four Inter faces: regular (400), italic (400),
  bold (700) and bold italic (700). Each MUST contain exactly the shipped character set:
  printable ASCII, all of Latin-1 (U+00A0–U+00FF), the typographic punctuation – — ‘ ’ “ ” … •,
  and → ✓ ✗ where Inter has those glyphs. OpenType features MAY be dropped to save bytes, but
  kerning MUST be kept.
- **FR-003**: Italic and bold-italic text MUST render with Inter's real italic faces, never a
  browser-synthesized slant or weight. This applies to text drawn in Inter only: text drawn in
  the fallback stack (while Inter loads, if it fails, or for characters outside the shipped
  character set) keeps the browser's default synthesis, so emphasis stays visible.
- **FR-004**: Font files MUST be committed to the repository and served from the site's own
  origin. The site MUST NOT request fonts, stylesheets or anything else from a font service or
  any third party.
- **FR-005**: While Inter is loading, or if it fails to load, text MUST be visible in the current
  system font stack (the stack the site uses today).
- **FR-006**: Swapping from the fallback font to Inter MUST NOT push any page over the existing
  cumulative layout shift budget.
- **FR-007**: Every page MUST stay within the existing performance budget, including 100 KB
  total transfer per page on simulated slow 4G, with fonts counted. The budget MUST NOT be
  raised; if a page cannot fit, the work stops and is reported.
- **FR-008**: Code and preformatted blocks MUST continue to use the body font, exactly as today.
- **FR-009**: The site's Content Security Policy MUST continue to allow the fonts with no
  violation and MUST NOT be loosened for this change.
- **FR-010**: Every page MUST continue to meet WCAG 2.2 AA and Core Web Vitals "good"
  thresholds on mobile.
- **FR-011**: All 132 visual baselines (66 macOS, 66 Linux) MUST be regenerated as a predicted
  change, and the visual project MUST pass on both platforms. Linux baselines regenerated
  locally in Docker MUST pass CI's visual project on the first run. If they do not, the
  remaining cause is investigated within this feature (Docker image fonts, rendering flags); if
  the Docker-to-CI match still cannot be shown, the work stops and the diff details are reported
  to Don. Baselines produced by CI (the `visual-baselines` label artifact) MUST NOT be landed
  for this pull request, and issue #62 is not closed until the match is shown.
- **FR-012**: Fonts MUST load and apply with JavaScript turned off and MUST add no client-side
  script.
- **FR-013**: The Inter licence (SIL Open Font License) MUST be included alongside the font files
  in the repository, as the licence requires.
- **FR-014**: The change MUST add no recurring cost and no new external service.
- **FR-015**: Font files MUST be emitted by the Astro build with fingerprinted (content-hashed)
  filenames and served with `Cache-Control: public, max-age=31536000, immutable`, so browsers
  cache them across page views. The header applies to the four Inter files only; other build
  files keep today's caching.
- **FR-016**: A guard test MUST fail when any visual-test subject (shell, not-found page or
  fixture site) draws a character outside the shipped character set. Fixture text with an
  uncovered character is changed, or the character is explicitly excluded in the test. Real
  site content is not checked.
- **FR-017**: Weights other than 400 and 700 MUST resolve through standard CSS font matching
  with no class changes (500 renders as 400; 600 and 800 render as 700), and the browser MUST
  NOT synthesize a weight or slant for text drawn in Inter. Synthesis is not turned off for
  fallback text (FR-003).

### Key Entities

- **Font face**: one of the four shipped Inter files, defined by its weight (400 or 700), style
  (normal or italic), the shipped character set (FR-002), its fingerprinted filename and its size
  in bytes, which counts against the page budget.
- **Shipped character set**: printable ASCII, Latin-1, – — ‘ ’ “ ” … • and → ✓ ✗ (where Inter
  has them); the same set in all four faces.
- **Fallback stack**: the current system font stack, used while Inter loads, if it fails, and
  for characters outside the shipped character set.
- **Visual baseline**: a committed reference screenshot per subject and platform; 66 per
  platform, 132 in total.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pull request whose Linux baselines were regenerated locally in Docker passes the
  CI visual project on its first run, including the fixture post page (0 subjects failing,
  compared with 1 failing at about 1% of pixels today), using only Docker-generated Linux
  baselines, never CI-artifact images.
- **SC-002**: 100% of page templates render headings, body, italic, bold and bold-italic text in
  Inter, with zero synthesized italic or bold faces. Text inside images (SVG diagrams, og image)
  is not counted.
- **SC-003**: Zero font requests leave the site's own origin on any page.
- **SC-004**: Every page measured by the budget test stays at or under 100 KB total transfer and
  under the existing layout shift budget on simulated slow 4G, with fonts included.
- **SC-005**: Accessibility checks report zero WCAG 2.2 AA violations on every page template,
  unchanged from today.
- **SC-006**: All 132 visual baselines are refreshed in one pull request, and no other visual
  diff appears.
- **SC-007**: Running costs are unchanged (no new service, $0 added per month).
- **SC-008**: The guard test finds zero uncovered characters in the visual-test subjects, apart
  from characters it explicitly excludes.
- **SC-009**: A second page view downloads zero font bytes, because the font files carry
  fingerprinted names and a one-year immutable cache header; no other build file's caching
  changes.

## Decisions

These were settled by Don before the specification and are not open for clarification.

- **D1 - Typeface**: Inter, under the SIL Open Font License, self-hosted from files committed to
  the repository. Four static latin-subset faces: 400, 400 italic, 700, 700 italic. Headings and
  body both use Inter. No font service, no third-party request, no new recurring cost.
- **D2 - Code font**: code and preformatted blocks keep inheriting the body font exactly as
  today. A monospace code font is out of scope (see Follow-up work).
- **D3 - Budget**: the performance budget, including 100 KB total transfer per page on slow 4G
  enforced by the budget test, is fixed. Fonts must fit inside it. If a page cannot fit, the work
  stops and reports rather than raising the limit.

## Assumptions

- Root cause (from the /chore investigation on issue #62, 2026-10-03): the drift is confined to
  the fixture post visual subject because it is the only subject with italic text, and the Docker
  baseline image's only installed font has no italic face, so the browser synthesizes the slant
  differently from the CI runner. Shipping real italic faces removes the cause.
- Text before Inter loads uses the current system stack and swaps to Inter when the font is
  ready (the fallback is shown immediately rather than hiding text).
- Only the faces a page actually renders count against its transfer budget. The plan measures
  the heaviest pages with fonts included before committing to an approach.
- The site's existing Content Security Policy already permits same-origin fonts, so no policy
  change is expected.
- After this change, no visual subject depends on fonts installed on the machine running the
  tests for the shipped weights and styles.
- Any weight other than 400 and 700 that components request resolves through standard CSS font
  matching (FR-017); the plan lists any such usage.
- Docker remains the local way to regenerate Linux baselines; the CI label fallback stays
  available for other work but should no longer be needed for a predicted change, and it is not
  used to land this pull request's baselines (FR-011).
- This is a major change under Constitution Principle III (design system and visual identity);
  auto-merge stays off and Don approves after checking the preview deployment.

## Out of Scope

- A monospace font for code and preformatted blocks.
- Weights other than 400 and 700, variable fonts, and non-latin subsets.
- Changes to colours, spacing, type scale or layout beyond what the new typeface itself causes.
- Changes to the visual comparison threshold or how baselines are generated.
- Text inside images: the SVG architecture diagrams and the og image keep their current font.

## Follow-up work

- Consider a one-year immutable cache header for all fingerprinted build files under
  `/_astro/` (CSS and scripts), not only the font files (FR-015).
- Consider a self-hosted monospace font for code and preformatted blocks (D2).
- Consider drawing text inside images (the SVG architecture diagrams and the og image) in Inter,
  for example by embedding the subset font or converting the text to outlines, within the page
  budget.
- Revisit the "Visual baselines" guidance in the agent notes and pipeline skills if the CI-label
  fallback proves unnecessary for predicted changes over the next few pull requests.
