# Research: Interactive architecture diagram on the Technology page

**Feature**: `036-technology-architecture-diagram` | **Date**: 2026-10-11 | **Plan**: [plan.md](./plan.md)

The Astro Docs MCP server (`astro-docs`) was available and was used for every Astro choice below.
Each decision names the documentation page it rests on.

## R1. How the diagram is drawn: inline SVG in an Astro component

- **Decision**: The diagram is an inline `<svg>` written by an Astro component
  (`src/components/sections/ArchitectureDiagram.astro`) from a pure TypeScript layout module.
  Each part is an SVG `<a href="#<part-id>">` element. Lines, arrowheads and boxes are SVG shapes
  coloured through CSS classes, never through `style` attributes.
- **Rationale**: An inline SVG is part of the page's DOM, so its links are real focusable links
  (keyboard, touch, screen reader, no-JS fragment navigation), its text uses the page's own Inter
  faces, and its colours follow the site's light and dark tokens through CSS. An Astro component
  renders it to static HTML at build time, so the page stays prerendered (Principle V).
- **First-party options considered (Principle IV)**:
  - *Astro's built-in image handling* (`<Image>` / Markdown image of an `.svg` file,
    docs.astro.build/en/guides/images/): this is how the project-story diagrams are shown today.
    It falls short: an SVG shown as an image is inert (no focusable links, no fragment
    navigation), cannot see the page's fonts (hence the embedded glyph subsets), cannot follow the
    theme, and is served under the sandboxed `/_astro/*.svg` CSP. `<object>`/`<embed>` are blocked
    by `object-src 'none'`.
  - *Astro UI framework islands* (docs.astro.build/en/guides/framework-components/): a React or
    Preact island would ship a framework runtime for a few lines of behaviour and would not work
    without JavaScript. Rejected.
  - *Astro has no first-party diagram integration.* Mermaid or similar would be a third-party
    library with either client-side rendering (third-party script, budget) or a headless-browser
    build step. Rejected.
  - *Cloudflare*: nothing to use; the diagram is a static asset served by Workers static assets
    like every other page. *Fly.io*: the site does not use Fly.io and the feature needs no server,
    so there is no Fly.io capability to consider.
- **Alternatives considered**: an HTML/CSS grid of boxes with CSS-drawn connectors (labels at
  true CSS sizes regardless of width, but branching lines and labelled arrows become fragile CSS
  and the result is less of a diagram); a static SVG image plus an HTML list of links (meets the
  no-JS requirement but the diagram itself would not be clickable, failing US2).

## R2. Fonts: no glyph subset for this diagram

- **Decision**: The diagram does **not** use `pnpm run fonts:diagrams` or an embedded Inter subset.
  Its `<text>` elements inherit the page font (`--font-inter`, loaded by the Astro Fonts API in
  `BaseLayout`), set through a CSS class.
- **Rationale**: The subset convention (feature 020, `scripts/fonts/diagram-fonts.ts`, 16 KB cap,
  gate `tests/unit/site/diagram-fonts.test.ts`) exists because an SVG file loaded as an image is
  an isolated document that cannot reach the page's `@font-face` rules (and its CSP allows only
  `font-src data:`). An inline SVG is part of the page and already gets Inter, so a subset would
  add bytes for nothing. The gate scans `.svg` files under `src/content/` only; this diagram is
  markup in a `.astro` component, so the gate neither sees nor needs to see it. The spec's
  assumption "Diagram text follows the site's existing approach to fonts" is met by using the
  site's Inter, as every other piece of page text does.
- **Docs**: docs.astro.build/en/guides/fonts/ (the `<Font />` component and CSS variable).
- **Consequence for tests**: `tests/e2e/fonts.spec.ts` already proves Inter on every template; the
  new E2E spec checks the diagram's computed `font-family` resolves to Inter and that label sizes
  meet the minimums (R4), not the subset rules.

## R3. Where parts, explanations and source paths live: a `architecture` content collection

- **Decision**: One Markdown file per part in `src/content/architecture/<part-id>.md`, loaded by
  Astro's `glob()` loader with a Zod schema. Front matter: `name` (the label and entry heading)
  and an optional `source` (repository-relative path). The body is the explanation. The file name
  is the part id and the page fragment. Geometry (positions, groups, connections, label line
  breaks, order) is code, in `src/lib/architecture/layout.ts`, keyed by the same ids.
- **Rationale**: Principle VI says public content is Markdown validated by collection schemas, so
  the explanations (the prose that used to be the Site, Hosting and Contact form sections) stay
  editable as Markdown. Geometry is not content: it is drawing code that only works with the
  shapes around it, so it belongs in a typed module where unit tests can check it. Keeping the
  id as the file name follows the posts and projects collections.
- **Docs**: docs.astro.build/en/guides/content-collections/#the-glob-loader,
  docs.astro.build/en/guides/content-collections/#defining-the-collection-schema,
  docs.astro.build/en/reference/content-loader-reference/#glob-loader (`generateId`),
  docs.astro.build/en/guides/content-collections/#rendering-body-content (`render()`).
- **Alternatives considered**: a single YAML file with the `file()` loader (explanations would be
  YAML strings, not Markdown, against Principle VI); explanations written inline in
  `technology.mdx` as child components (the diagram would have to parse rendered slot HTML to
  learn its parts, and cross-checking ids against the layout becomes string scraping); all data in
  the TypeScript layout module (prose in code, against Principle VI).

## R4. Size and readability at 320 px

- **Decision**: One vertical layout (FR-016). The SVG has a fixed `viewBox` 240 units wide, is
  drawn at `width: 100%` of its container with a CSS `max-width` (about 24rem) so it does not
  balloon on desktop, and is centred. Part labels are drawn at 15 units, connection labels at
  12.5 units.
- **Rationale**: The narrowest container at a 320 px viewport is 240 CSS px: `main` has `p-4`
  (16 px each side) and in dark mode `#content-section` adds `p-6` (24 px each side), so
  320 − 32 − 48 = 240. At that width one unit is one CSS px, so labels render at 15 px (≥ 14) and
  connection labels at 12.5 px (≥ 12) in the worst case; in light mode the container is 288 px
  and they are larger. At the `max-width` cap the scale is about 1.6 (labels ≈ 24 px), which stays
  proportionate on desktop. Changing the page template's padding was rejected (out of scope).
- **Verification**: an E2E test measures each label's rendered font size (`getBoundingClientRect`
  height ratio or `getScreenCTM()` scale × font size) at 320 px in both themes; the geometry smoke
  test already owns "no sideways scroll at 320/390/1280".

## R5. Interactivity: one processed Astro `<script>`, progressive enhancement

- **Decision**: The component has one processed `<script>` (bundled module, `type="module"`, served
  from `/_astro/`, so CSP `script-src 'self'` covers it). It:
  1. On `hashchange` and on load, if the fragment names a part, marks that part link with
     `aria-current="true"` and its entry with `data-selected`, clearing any previous selection
     (one selected at a time, FR-005), and on a hashchange moves focus to the entry
     (`tabindex="-1"`) so a screen reader reads its explanation (US2 AS4).
  2. Intercepts each entry's "Back to diagram" link: prevents the default jump, scrolls the
     entry's part into view and focuses it (FR-004). Without JS the link goes to
     `#architecture-diagram`.
  3. Uses no smooth scrolling (respects reduced motion by doing nothing animated).
- **Rationale**: Native fragment links do the navigation; the script only adds selection and focus
  return. No framework, no state outside the URL. The script is a few hundred bytes, far inside the
  10 KB JS budget (`tests/e2e/budget.spec.ts`).
- **Docs**: docs.astro.build/en/guides/client-side-scripts/#script-processing (processed, bundled,
  deduplicated, `type="module"`), docs.astro.build/en/reference/configuration-reference/#securitycsp
  (Astro hashes the scripts and styles it emits; the site's policy allows `'self'`).
- **Alternatives considered**: CSS `:target` for the highlight (works without JS, but the spec
  keeps the no-JS behaviour to "the link is the whole behaviour" and cannot return focus);
  `is:inline` script (would need its hash added to the CSP config by hand, like `theme-init.js`).

## R6. CSP: no inline style attributes

- **Decision**: All diagram styling is in the component's scoped `<style>` (Astro emits it as a
  hashed or external stylesheet) and Tailwind classes. SVG presentation is by class
  (`.arch-box`, `.arch-line`, …) whose CSS uses the theme tokens; no `style=""`, no
  `define:vars` on elements, and the script toggles attributes, never `element.style`.
- **Rationale**: The page CSP (`style-src 'self'` plus Astro's hashes) blocks `style` attributes;
  the memory note from #40 records that `setAttribute("style")` fails under it.
- **Verification**: a build test asserts the built Technology page has no element with a `style`
  attribute (the existing check in `tests/build/local-site.test.ts` covers only `projects/`);
  `tests/e2e/csp-violations.ts` reports violations during the E2E journeys.

## R7. Accessibility model

- **Decision**:
  - The diagram is a `<figure id="architecture-diagram">` whose `<figcaption>` says what it shows.
    The `<svg>` has `role="group"` and `aria-labelledby` the caption. Boxes, lines and connection
    labels are `aria-hidden`; each part link's accessible name is its visible label text (no
    `aria-label`), which satisfies WCAG 2.5.3 Label in Name.
  - Because the lines carry meaning, each entry ends with a short generated "Connects to" line
    naming the parts it sends to and what for (from the layout's connection labels). That is the
    text alternative for the lines (WCAG 1.1.1, 1.3.1) and is also what no-JS and screen-reader
    users read.
  - Focus is shown by a dedicated focus-ring shape inside each part link, styled on
    `a:focus-visible` (outline support on SVG elements is uneven across engines). Selected state
    adds a thicker accent border and a non-colour cue (a filled marker), so selection is not shown
    by colour alone (WCAG 1.4.1).
  - Colours come from existing tokens checked for 3:1 (non-text: lines, borders, focus ring) and
    4.5:1 (label text) in both themes; a `@media (forced-colors: active)` block maps strokes and
    text to system colours (`CanvasText`, `LinkText`, `Highlight`).
  - Tab order is the DOM order of the part links, set by the layout module's order (top to
    bottom, left to right).
- **Verification**: `a11y.spec.ts` already scans the `technology` template idle in both themes and
  widths; the selected state is scanned again in the new spec (second layer, because the selected
  markup exists only after an activation; same reason as the questions panel precedent).

## R8. Source links and the link check (FR-006, FR-007)

- **Decision**: A part's `source` is a repository-relative path. The URL is derived, never typed:
  `https://github.com/drcdev/dcc-web/blob/main/<path>` for a file and `/tree/main/<path>` for a
  folder, decided from the file system at build time. The check runs in the collection's
  `generateId` (like `assertImagesExist` for pages): the build fails with a message naming the
  part file when the path is absolute, contains `..`, or does not exist. A unit content test over
  the real entries also requires every `source` to be tracked by git (`git ls-files
  --error-unmatch`), so an untracked or gitignored local file cannot pass.
- **Rationale**: A missing path is invalid content and must fail the build (Principle VI, FR-007).
  Checking the local tree is equivalent to checking `main` once the PR merges, because `main` is
  then this tree; it is deterministic and needs no network in CI. GitHub URLs are external, so the
  existing site crawler (`tests/e2e/site-links.spec.ts`, internal links only) does not cover them.
- **Known gap**: on a PR preview, a link to a file added by the same PR returns 404 on GitHub until
  the PR merges, because links point at `main` (clarified choice). This is a `[PREVIEW-CHECK]`
  note in the PR body, not a defect.
- **Repository address**: one exported constant (`REPOSITORY_URL`) in `src/lib/architecture/source.ts`;
  no other code holds it.
- **Alternatives considered**: links pinned to the build commit (rejected in clarify); a CI job
  that requests every GitHub URL (network-dependent, rate-limited, flaky).

## R9. Page structure after the change (FR-001, FR-014)

- **Decision**: `src/content/pages/technology.mdx` body becomes: `<ArchitectureDiagram />` first,
  then `## Design`, `## Analytics`, `## Data locations` (table) and the closing note paragraph.
  The `ArchitectureDiagram` section renders the figure, then `## How each part works` with one
  `<article>` per part (`<h3>` heading, explanation, "Connects to" line, source link, "Back to
  diagram" link). The one-line intro "This page explains the technology behind this site." is
  folded into the figure caption.
- **Interpretation recorded**: FR-014 lists both "keep the closing note" and "remove the Questions
  section". Today the closing note *is* the body of the `## Questions` section ("Curious about how
  something works? …"). Resolution: keep the closing note paragraph, drop its `## Questions`
  heading (which would otherwise read as the questions panel). Site, Hosting and Contact form
  prose moves into the static-pages, worker-api, production/preview, contact-form, bot-check and
  email-path explanations, keeping only what is true today (FR-013).
- **Docs**: docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content
  (the page route passes `sectionComponents` to `<Content />`).

## R10. Cost (Principle IX)

- **Decision / finding**: Expected change **$0/month**. No new service, binding, storage, request
  path or dependency. The page is one more static HTML file of similar size (the SVG adds roughly
  10–20 KB of markup before compression) and one small `/_astro/` script, served by Workers static
  assets, which is free and not counted as Worker invocations.
