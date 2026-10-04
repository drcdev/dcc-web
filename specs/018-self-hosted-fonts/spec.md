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
foundation's FR-003 (feature 002, site foundation), and the 100 KB total-transfer figure in
that feature's SC-004 and the budget test, which becomes 150 KB (D3). The other budget limits
are unchanged. Feature 002's spec is not rewritten: from this feature on, the 150 KB figure here
and in the budget test is the only total-transfer budget, and the 100 KB figure in feature 002
is historical.

The change also adds one rule to the committed `public/_headers` file (the font cache header,
FR-015). That is serving configuration, a further Principle III trigger covered by the same
major-change review. It changes no CI workflow, no Worker code, no dependency, no contact-form
path, no data collection and no secret.

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
- Q: The planned measurement shows `/writing/convergence/` at 97,374 bytes today (78,604 of them two real card images) and 121,654 bytes with Inter Regular and Bold, over the 100 KB total-transfer limit. Shrink the card images first, or change the budget? (2026-10-03) → A: Raise the per-page total-transfer budget to 150 KB (153,600 bytes) as a deliberate design decision recorded here (D3, FR-007); do not shrink or re-encode any image in this feature. LCP, CLS, long-task and JavaScript limits and the slow-4G measurement conditions stay exactly as they are. Right-sizing card images is follow-up work.
- Q: Should the fallback shown while Inter loads use Astro's metric-adjusted (optimized) fallback faces, so the swap does not shift layout? (2026-10-03) → A: Yes. Astro's optimized fallbacks are turned on: it generates metric-adjusted fallback faces from local system fonts that are already in today's stack, so fallback text takes up the same space as Inter. The fallback family list keeps today's system fonts; only their metrics are adjusted (FR-005, FR-006).

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
3. **Given** a slow connection, **When** a page loads, **Then** text is visible from first
   paint in the system font stack (`font-display: swap`, so no text is hidden beyond the very
   short block period `swap` allows; FR-005), drawn with metric-adjusted fallback faces where the visitor has those
   fonts, and swaps to Inter without layout shift beyond the existing cumulative layout shift
   budget.
4. **Given** code and preformatted blocks, **When** they render, **Then** they use the same
   body font as the surrounding text, exactly as today (now Inter).
5. **Given** the site's Content Security Policy, **When** any page template loads (including
   the not-found page), **Then** the fonts load with no policy violation (no CSP violation
   reported in the browser console) and the policy is not loosened (FR-009).
6. **Given** any page template, **When** the accessibility checks run at phone and desktop
   widths, in light and dark themes, in forced-colours mode, at 200% zoom and at 320 CSS px with
   WCAG 1.4.12 text spacing, **Then** they report zero WCAG 2.2 AA violations, as today (FR-010,
   SC-005).

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

- **Font fails to load** (blocked, offline, slow): text stays readable in the system font
  stack, through the metric-adjusted fallback faces where the visitor has those fonts; nothing
  is hidden or blank while waiting. Each face loads or fails on its own: text that needs a
  failed face stays in the fallback stack (with synthesized emphasis, FR-003) for the rest of
  the page view, while text whose face did load is drawn in Inter.
- **Visitor without the fallback's source font** (Arial; most Linux machines, likely the CI
  runner): the metric-adjusted faces do not apply, text shows in the rest of today's stack at
  its normal metrics, and the swap to Inter is unadjusted. The CLS limit (FR-006) still applies
  to that case.
- **Characters outside the shipped character set** (for example a letter outside Latin-1, an
  emoji or a box-drawing symbol in a post): the browser falls back to the system stack for those
  characters only, drawing them with the same system families as today at their normal metrics
  (the metric-adjusted faces carry Inter's unicode-range, so they skip these characters), so
  they stay as legible as today; the page still renders and the build does not fail. Visual-test subjects are
  the exception: a guard test fails if they draw an uncovered character, unless that character
  is explicitly excluded (FR-016).
- **Unshipped weights**: weights the site does not ship resolve to a shipped face through
  standard CSS font matching, with no class changes and no synthesized weight: medium (500)
  renders as regular (400); semibold (600) and extrabold (800) render as bold (700). The plan
  lists the affected components (research R7). Medium (500) text, such as header and footer
  links, pills and buttons, loses its slight weight difference from body text; weight must not
  be the only cue that sets such an element apart (FR-017).
- **Heaviest page**: the page with the most content transferred must fit the 150 KB total
  transfer budget with the fonts included (D3). Today that is `/writing/convergence/`, whose
  weight is dominated by two real posts' card images; with Inter it measures 121,654 of
  153,600 bytes. If any page still cannot fit, the work stops and is reported to Don; the budget
  is not raised again within this feature and images are not shrunk here (follow-up work).
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
- **Forced colours and dark mode**: the change alters no colour token, font size or type
  scale, so contrast ratios are unchanged. The accessibility checks that run today in light and
  dark themes and in forced-colours mode (axe colour contrast, visible focus outlines, borders on
  pills, marks and code) MUST still pass with Inter (FR-010). Forced-colours mode does not change
  the font family, so Inter is used there as well.
- **Changed text widths**: Inter's glyph widths differ from the system font, so some labels and
  lines wrap differently. Focus indicators MUST stay fully visible and unobscured wherever an
  element moves or wraps (WCAG 2.4.7, 2.4.11), and no page may scroll sideways at 320 CSS px or
  200% zoom (FR-010).
- **A face's content changes** (Inter upgraded or re-subset later): its content hash, and so its
  URL, changes; pages reference only the new URL, the old URL drops out of the build, and a
  stale cached copy is never used (FR-015).
- **JavaScript off**: fonts load and apply without any client-side script.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every public page MUST render headings and body text in the Inter typeface. Text
  inside images (the SVG architecture diagrams and the og image) is out of scope and keeps its
  current font. Those images, their alt text and their legibility are unchanged by this feature.
- **FR-002**: The site MUST ship exactly four Inter faces: regular (400), italic (400),
  bold (700) and bold italic (700). Each MUST contain exactly the shipped character set:
  printable ASCII, all of Latin-1 (U+00A0–U+00FF), the typographic punctuation – — ‘ ’ “ ” … •,
  and → ✓ ✗ where Inter has those glyphs. OpenType features MAY be dropped to save bytes, but
  kerning MUST be kept. The four files together MUST be at most 50,000 bytes (measured at
  47,748, from 11,364 for Regular to 12,560 for Bold Italic; research R3).
- **FR-003**: Italic and bold-italic text MUST render with Inter's real italic faces, never a
  browser-synthesized slant or weight. This applies to text drawn in Inter only: text drawn in
  the fallback stack (while Inter loads, if it fails, or for characters outside the shipped
  character set) keeps the browser's default synthesis, so emphasis stays visible.
- **FR-004**: Font files MUST be committed to the repository and served from the site's own
  origin. The site MUST NOT request fonts, stylesheets or anything else from a font service or
  any third party.
- **FR-005**: While Inter is loading, or if it fails to load, text MUST be visible in the
  system font stack: the same system font families the site uses today. Every Inter face MUST
  use `font-display: swap`: text is drawn in the fallback from first paint, with no invisible
  text beyond the very short block period `swap` allows, and is redrawn in Inter when the face
  arrives; text whose face fails stays in the fallback for the rest of the page view.
  Metric-adjusted fallback faces (Astro's optimized fallbacks) generated from local system
  fonts in that stack MAY come first, so fallback text occupies the same space as Inter. They
  change only the rendered glyph size (`size-adjust`) and the ascent, descent and line gap used
  by `line-height: normal`; they set no `font-size` or `line-height`, so the visitor's text size,
  zoom, minimum font size and text-spacing settings apply to them exactly as to Inter. The only
  permitted reordering of the stack is moving the generic `sans-serif` from before the emoji
  families to the end, which Astro needs to generate the fallback faces; no family is added or
  removed, and the plan states the exact order (research R6).
- **FR-006**: Swapping from the fallback font to Inter MUST NOT push any page over the existing
  cumulative layout shift budget (CLS below 0.1), which is unchanged. Metric-adjusted fallback
  faces MUST be used to keep that swap from shifting layout. The measure is each page's own CLS
  in the budget test under the FR-007 conditions, including runs on machines without the
  adjusted faces' source font; the adjusted faces' presence is checked in the page head
  (contract F01 to F03).
- **FR-007**: Every page MUST stay within the performance budget on simulated slow 4G, with
  fonts counted. The total-transfer limit is **150 KB (153,600 bytes) per page**, raised from
  100 KB by Don's decision D3; the LCP (2.5 s), CLS (below 0.1), long-task (200 ms) and
  JavaScript (10 KB) limits and the measurement conditions are unchanged. Total transfer means
  the sum of the encoded bytes, headers included, of every response a page makes on one load
  with the browser cache disabled, in Chromium at a 390 × 844 viewport on simulated slow 4G
  (150 ms round trip, 1.6 Mbps down, 750 kbps up), exactly as the budget test measures it; D3,
  SC-004 and the plan use this one definition. Images MUST NOT be shrunk or re-encoded in this
  feature. If a page still cannot fit, implementation halts before the pull request is opened
  and Don is told which page failed, its measured bytes and their breakdown; the budget is not
  raised again within this feature.
- **FR-008**: Code and preformatted blocks MUST continue to use the body font, exactly as today,
  at today's size, colour and background. Inter, like today's system sans fonts, does not
  strongly separate some similar characters (for example capital I and lowercase l); that is
  the trade-off D2 accepts, and a monospace code font is follow-up work.
- **FR-009**: The site's Content Security Policy MUST continue to allow the fonts with no
  violation and MUST NOT be loosened for this change. The current policy is the page CSP meta
  tag built from `security.csp` in `astro.config.mjs` (including `default-src 'self'`,
  `font-src 'self'` and `style-src 'self'` plus `sha256-` hashes) and the header policy in
  `public/_headers` (`frame-ancestors 'none'; object-src 'none'; base-uri 'self'`). The
  directives that govern fonts are `font-src` (the font files), `style-src` (the inline
  `@font-face` style that `<Font />` emits, allowed by its `sha256-` hash, never by
  `'unsafe-inline'`) and `default-src` (the fallback for both). The only permitted difference in
  the built policy is the added `sha256-` hash for that style; no source, keyword or directive
  is added or changed in either policy. A violation is any CSP error the browser reports on a
  page template.
- **FR-010**: Every page MUST continue to meet WCAG 2.2 AA and Core Web Vitals "good"
  thresholds on mobile. For this change that explicitly includes, with Inter and with the
  fallback: text and non-text contrast (1.4.3, 1.4.11), with no colour token, font size or type
  scale changed to keep it; resize text (1.4.4), since the fonts set no size of their own and
  browser text-size and minimum-size settings apply as today; reflow with no horizontal scroll
  at 320 CSS px and at 200% zoom (1.4.10); no loss of content under the 1.4.12 text-spacing
  overrides; and visible, unobscured focus (2.4.7, 2.4.11), in light and dark themes and in
  forced-colours mode.
- **FR-011**: All 132 visual baselines (66 macOS, 66 Linux) MUST be regenerated as a predicted
  change, and the visual project MUST pass on both platforms. The count is every image in
  `tests/e2e/visual.spec.ts-snapshots/` (132 on 2026-10-03); if a merged change alters the
  subject list first, the count follows that directory and every image in it is refreshed.
  macOS baselines are produced with `pnpm run test:visual:update` on a Mac and Linux baselines
  only with `pnpm run test:visual:update:linux` in Docker. Linux baselines regenerated
  locally in Docker MUST pass CI's visual project on the first run. If they do not, the
  remaining cause is investigated within this feature, in this order: (1) read the CI job's
  diff images to find the failing subjects and regions; (2) compare the fonts installed and
  matched in the Docker image and on the CI runner; (3) compare browser versions and rendering
  flags. If a cause is found and fixed within this feature's scope, the Linux baselines are
  regenerated in Docker and pushed once more. If no cause is found, or that run also fails, the
  Docker-to-CI match cannot be shown: the work stops and the diff details are reported
  to Don. Baselines produced by CI (the `visual-baselines` label artifact) MUST NOT be landed
  for this pull request, and issue #62 is not closed until the match is shown.
- **FR-012**: Fonts MUST load and apply with JavaScript turned off and MUST add no client-side
  script.
- **FR-013**: The Inter licence (SIL Open Font License) MUST be included alongside the font files
  in the repository, as the licence requires: `src/assets/fonts/LICENSE.txt`, the unmodified
  SIL Open Font License 1.1 text from the Inter 4.1 release, including its copyright notice.
- **FR-014**: The change MUST add no recurring cost and no new external service, and MUST NOT
  touch the contact form, the contact API, any data collection or storage, or any secret.
- **FR-015**: Font files MUST be emitted by the Astro build with fingerprinted (content-hashed)
  filenames and served with `Cache-Control: public, max-age=31536000, immutable`, so browsers
  cache them across page views. The header applies to the four Inter files only; other build
  files keep today's caching. The rule matches the directory `/_astro/fonts/*` in
  `public/_headers`, not individual filenames, so it keeps matching when a hash changes; Astro
  writes only Fonts API files to that directory. It combines with the existing rules: font
  responses keep every `/*` security header unchanged (and the `noindex` header on preview
  hosts), no other rule sets `Cache-Control`, and the served `Cache-Control` is exactly this one
  value, replacing the platform default rather than adding to it. When a face's content
  changes, its hash and URL change and the old URL drops out of the build. The served header is
  checked by the end-to-end header test against `wrangler dev` and confirmed on the preview
  deployment during Don's preview check; production serves the same `_headers` file.
- **FR-016**: A guard test MUST fail when any visual-test subject (shell, not-found page or
  fixture site) draws a character outside the shipped character set. Its scope is the source
  of those subjects: the shell, layout, page, config and script sources, and the fixture site's
  pages, posts (including generated ones) and projects as the fixture-site build lists them.
  Fixture text with an uncovered character is changed, or the character is explicitly excluded
  in the test: exclusions are one named list in the test, each entry with its reason (emoji,
  box drawing, the soft hyphen and line-break whitespace today; research R5). A failure names
  each uncovered character, its code point and its file. Real site content is not checked.
- **FR-017**: Weights other than 400 and 700 MUST resolve through standard CSS font matching
  with no class changes (500 renders as 400; 600 and 800 render as 700), and the browser MUST
  NOT synthesize a weight or slant for text drawn in Inter. Synthesis is not turned off for
  fallback text (FR-003). Font weight MUST NOT be the only cue that sets an element apart: each
  500 → 400 element listed in the plan keeps another cue (colour, underline, size, position or
  a border), and Don confirms the mapping on the preview.
- **FR-018**: Only the regular (400) and bold (700) faces MUST be preloaded, because every page
  draws them; the italic faces MUST NOT be preloaded. A page MUST request each face at most
  once, so at most four font requests, and a page that draws no italic text MUST NOT request
  an italic face.

### Key Entities

- **Font face**: one of the four shipped Inter files, defined by its weight (400 or 700), style
  (normal or italic), the shipped character set (FR-002), its fingerprinted filename and its size
  in bytes, which counts against the page budget.
- **Shipped character set**: printable ASCII, Latin-1, – — ‘ ’ “ ” … • and → ✓ ✗ (where Inter
  has them); the same set in all four faces.
- **Fallback stack**: the system font families the site uses today, used while Inter loads, if
  it fails, and for characters outside the shipped character set, preceded by metric-adjusted
  fallback faces generated from local system fonts in that stack (FR-005).
- **Visual baseline**: a committed reference screenshot per subject and platform; 66 per
  platform, 132 in total.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pull request whose Linux baselines were regenerated locally in Docker passes the
  CI visual project on its first run, for every subject in `tests/e2e/visual.spec.ts` at the
  project's existing comparison threshold (`maxDiffPixelRatio` 0.001, unchanged), including the
  fixture post page (0 subjects failing,
  compared with 1 failing at about 1% of pixels today), using only Docker-generated Linux
  baselines, never CI-artifact images.
- **SC-002**: 100% of page templates render headings, body, italic, bold and bold-italic text in
  Inter, with zero synthesized italic or bold faces, as reported by the browser for the face
  that actually drew each element (its PostScript name, for example `Inter-Italic` rather than
  `Inter-Regular` on italic text), not only by the CSS. Text inside images (SVG diagrams, og
  image) is not counted.
- **SC-003**: Zero font or stylesheet requests leave the site's own origin on any page template,
  including the not-found page.
- **SC-004**: Every page measured by the budget test stays at or under 150 KB (153,600 bytes)
  total transfer, with LCP, CLS, long-task and JavaScript limits unchanged, on simulated slow 4G
  with fonts included, measured as FR-007 defines. The heaviest page, `/writing/convergence/`,
  measured about 121,654 bytes by that method (research R4; about 31,900 bytes of headroom).
- **SC-005**: The accessibility checks (axe-core through `@axe-core/playwright` with every
  WCAG 2.0, 2.1 and 2.2 A and AA tag, plus the existing reflow, zoom, text-spacing,
  forced-colours and focus checks) report zero violations on every page template in the shared
  template list, at phone and desktop widths in both themes, unchanged from today.
- **SC-006**: All 132 visual baselines (every image in the snapshot directory, FR-011) are
  refreshed in one pull request, and no other visual diff appears: every changed region is
  explained by text rendering (glyph shapes, widths, and the line breaks and box sizes those
  cause). A change to colour, borders, images or spacing that text reflow does not explain is a
  regression to fix, not a baseline to refresh.
- **SC-007**: Running costs are unchanged (no new service, $0 added per month).
- **SC-008**: The guard test finds zero uncovered characters in the visual-test subjects, apart
  from characters it explicitly excludes.
- **SC-009**: In a browser with its cache enabled, after a first page view has downloaded the
  faces it draws, a second page view (another page or the same page by navigation or a normal
  reload) downloads zero font bytes and sends no revalidation request for them, because the font
  files carry fingerprinted names and a one-year immutable cache header; no other build file's
  caching changes. A first view with a cold cache, a hard reload and a disabled cache still
  download the faces.

## Decisions

These were settled by Don before the specification and are not open for clarification.

- **D1 - Typeface**: Inter, under the SIL Open Font License, self-hosted from files committed to
  the repository. Four static latin-subset faces: 400, 400 italic, 700, 700 italic. Headings and
  body both use Inter. No font service, no third-party request, no new recurring cost.
- **D2 - Code font**: code and preformatted blocks keep inheriting the body font exactly as
  today. A monospace code font is out of scope (see Follow-up work).
- **D3 - Budget** (revised by Don, 2026-10-03): the per-page total-transfer limit in the budget
  test is raised from 100 KB to **150 KB** (150 × 1024 = 153,600 bytes) on slow 4G, so the site
  can carry its own typeface. The LCP, CLS, long-task and JavaScript limits and the slow-4G
  conditions are unchanged. The raise stands until a later reviewed change lowers it; lowering
  it after the card-image follow-up is follow-up work, not part of this feature.

  Rationale: the budget is a design decision owned by the maintainer, not a check this feature
  can bend. It is raised deliberately, here in the specification and reviewed with this
  major-change pull request, to make room for self-hosted type; it is not weakened to get a red
  check through. The original D3 ("budget is fixed; fonts must fit") stopped the plan because
  `/writing/convergence/` was already 97,374 bytes, of which 78,604 bytes are two real posts'
  card images; with Inter Regular and Bold (24,280 bytes) it is 121,654 bytes. The page's weight
  is dominated by those images, which can be optimised as follow-up work; this feature does not
  touch images. Core Web Vitals "good" stays enforced through the unchanged LCP and CLS limits.

## Assumptions

- Root cause (from the /chore investigation on issue #62, 2026-10-03): the drift is confined to
  the fixture post visual subject because it is the only subject with italic text, and the Docker
  baseline image's only installed font has no italic face, so the browser synthesizes the slant
  differently from the CI runner. Shipping real italic faces removes the cause.
- Text before Inter loads uses the system stack, through metric-adjusted fallback faces where
  the visitor has those fonts, and swaps to Inter when the font is ready (the fallback is shown
  immediately rather than hiding text).
- Only the faces a page actually renders count against its transfer budget. The plan measures
  the heaviest pages with fonts included before committing to an approach.
- The site's existing Content Security Policy already permits same-origin fonts, so no policy
  change is expected: the page CSP meta built from `astro.config.mjs` carries `font-src 'self'`,
  and the header policy in `public/_headers` sets only `frame-ancestors`, `object-src` and
  `base-uri`, none of which governs fonts (checked 2026-10-03).
- Fonts are same-origin. The preload links carry `crossorigin` (font requests are always made
  in CORS mode), and a same-origin CORS request needs no `Access-Control-Allow-Origin` header, so
  no CORS header is added.
- The change has no screen-reader impact: it alters no markup, text, accessible name, role or
  reading order, only the glyphs drawn.
- The shipped character set covers the site's real content as measured on 2026-10-03: its
  non-ASCII text is © · É ä é – — … → ✓ ✗ (all covered) plus box drawing, ⚠ ✅ ❌ and emoji,
  which fall back by design (research R5). A future name with letters outside Latin-1 (for
  example ā, ł or č) draws those letters in the fallback stack.
- After this change, no visual subject depends on fonts installed on the machine running the
  tests for the shipped weights and styles.
- Any weight other than 400 and 700 that components request resolves through standard CSS font
  matching (FR-017); the plan lists any such usage.
- Docker remains the local way to regenerate Linux baselines; the CI label fallback stays
  available for other work but should no longer be needed for a predicted change, and it is not
  used to land this pull request's baselines (FR-011). If Docker is unavailable, Don is asked to
  start Docker Desktop, as the agent notes already require; this restriction applies to this
  pull request only and leaves the notes' general fallback in place for other work.
- This is a major change under Constitution Principle III (design system and visual identity);
  auto-merge stays off and Don approves after checking the preview deployment.

## Out of Scope

- A monospace font for code and preformatted blocks.
- Weights other than 400 and 700, variable fonts, and non-latin subsets.
- Changes to colours, spacing, type scale or layout beyond what the new typeface itself causes.
- Changes to the visual comparison threshold or how baselines are generated.
- Text inside images: the SVG architecture diagrams and the og image keep their current font.

## Follow-up work

- Right-size listing-card images (for example a 400w candidate and a lower WebP quality for
  card images), which dominate `/writing/convergence/` (78,604 of its 97,374 bytes today) and
  grow with every post in a series; then consider whether the 150 KB budget (D3) can come back
  down.
- Consider a one-year immutable cache header for all fingerprinted build files under
  `/_astro/` (CSS and scripts), not only the font files (FR-015).
- Consider a self-hosted monospace font for code and preformatted blocks (D2).
- Consider drawing text inside images (the SVG architecture diagrams and the og image) in Inter,
  for example by embedding the subset font or converting the text to outlines, within the page
  budget.
- Revisit the "Visual baselines" guidance in the agent notes and pipeline skills if the CI-label
  fallback proves unnecessary for predicted changes over the next few pull requests.
