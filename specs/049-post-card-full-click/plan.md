# Implementation Plan: Full-card click and hover feedback on post cards

**Branch**: `049-post-card-full-click` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/049-post-card-full-click/spec.md` (issue #184)

## Summary

Make the whole of a post card (`PostCard`) and the lead story (`LeadStory`) open the post, keep
topic pills and series markers as their own links, move the keyboard focus outline from the title
to the card's rounded edge, and add a small hover lift, shadow and image enlargement that only
shows on hover-capable pointers and never moves anything under reduced motion. The approach is
CSS only, through Tailwind utilities in the two components: the existing title link gets a
stretched `::after` overlay that covers the card, the topic list items sit above it, and the card
draws its outline with a `has-[…:focus-visible]` variant. No client-side JavaScript, no new
component, no change to `global.css` or the theme.

## Technical Context

**Language/Version**: TypeScript (strict), Astro 7.3.5 components

**Primary Dependencies**: Astro, Tailwind CSS 4.3.3 through `@tailwindcss/vite` (no change)

**Storage**: N/A

**Testing**: Vitest with the Astro Container API (component layer); Playwright (E2E on the
fixture site, forced-colours spec); existing a11y and visual projects unchanged

**Target Platform**: Static pages served from Cloudflare Workers static assets

**Project Type**: Static website (Astro)

**Performance Goals**: No change to page weight beyond a few bytes of CSS; no layout shift
(transform and shadow only, no box-size change)

**Constraints**: No client-side JS (Principle V); WCAG 2.2 AA (Principle X); static appearance
unchanged so visual baselines pass without refresh (SC-005)

**Scale/Scope**: Two components (`src/components/post/PostCard.astro`,
`src/components/post/LeadStory.astro`) and their tests

## Design decisions

### D1. Stretched `::after` on the title link (chosen) vs wrapping the card in `<a>`

- **Chosen**: the title link gets `after:absolute after:inset-0 after:content-['']` and the
  `<article>` gets `relative`, so the link's pseudo-element covers the whole card. The link stays
  the only link to the post, its accessible name stays the title, and the list, article and
  heading structure is untouched (FR-003). Hit-testing on the image, summary, labels, date line
  and empty space lands on the `::after`, which belongs to the link (FR-001). Text under the
  overlay can no longer be mouse-selected on the card, which the spec accepts.
- **Topic and series links above the overlay (FR-002)**: each topic list item in the two
  components gets `relative`. A positioned element later in the DOM paints above an earlier
  positioned one at `z-index: auto`, so the pills and the series marker sit over the overlay with
  no z-index. Only the `<li>` wrappers in `PostCard`/`LeadStory` change; the shared `TopicPill`
  and `SeriesMarker` components are not touched. The gaps between pills still open the post.
- **Rejected: wrap the card in `<a>`.** Nested interactive content (topic links inside a link) is
  invalid HTML, the accessible name would become the whole card's text, and FR-003 forbids it.
- **Rejected: a second, hidden link over the card.** Duplicate links to the same post in the tab
  order and accessibility tree (fails US3 scenario 2).
- **Rejected: client-side click handler on the card.** Adds JavaScript (Principle V), does not
  work with scripts off, and breaks middle-click / open-in-new-tab.

### D2. Focus outline on the card through `has-[…]` (chosen) vs on the title

- **Chosen**: the title link carries `data-post-link`. The article gets
  `has-[[data-post-link]:focus-visible]:outline-2 …:outline-offset-2 …:outline-accent-500`
  and `dark:…:outline-accent-400`, the same width, offset and colours as the site-wide rule in
  `global.css`, plus `forced-colors:…:outline-[CanvasText]` to match that rule's forced-colours
  branch (FR-004). `focus-visible` keeps mouse clicks from drawing it. The outline sits outside the
  border box, so the article's `overflow-hidden` does not clip it, and the 2 px offset plus 2 px
  width fits inside the grid's `gap-6`.
- **Suppressing the title's own outline**: the site-wide `a:focus-visible` rule in
  `src/styles/global.css` is unlayered, so it beats Tailwind's `@layer utilities`. The title link
  therefore uses the important modifier, `focus-visible:outline-none!`, scoped to this one link.
- **Rejected: `focus-within`** on the card. It would also fire when a topic pill has focus, drawing
  a card outline around a pill's focus ring.
- **Rejected: keep the outline on the title.** The clarify session chose the whole card.
- **Rejected: editing the `global.css` focus rule** (for example `:not([data-post-link])`). It is a
  shared, site-wide accessibility rule; changing it widens the change beyond two components.
- **Rejected: an Astro scoped `<style>` block** for the override. It would work (scoped styles
  keep their specificity, per the Astro styling guide), but these components style only with
  Tailwind utilities and one mechanism is easier to read.

### D3. Hover gating: Tailwind 4's `hover:` already means `(hover: hover)`

Tailwind 4 compiles `hover:` to `@media (hover: hover) { &:hover }` (confirmed in the installed
`node_modules/tailwindcss/dist`, 4.3.3). Touch screens with no hover pointer therefore never
match, and a tapped card is never left lifted (FR-005, US4 scenario 3). No custom variant and no
extra media query are needed. The card uses `group`, and the image uses `group-hover:`, which is
gated the same way.

### D4. Motion and values

- Lift: `motion-safe:hover:-translate-y-1` (4 px). Shadow: `hover:shadow-lg` (a default Tailwind
  theme shadow already used by `HomeIntro`; no new token). Image:
  `motion-safe:group-hover:scale-[1.02]`. Transition: `motion-safe:transition motion-safe:duration-200
  motion-safe:ease-out` on the article and `motion-safe:transition-transform motion-safe:duration-200`
  on the image. These follow the existing `motion-safe:` pattern in `SiteHeader`, `ThemeToggle`
  and `HomeIntro`.
- Under `prefers-reduced-motion: reduce` nothing moves or scales and nothing animates; the shadow
  still appears instantly as non-motion feedback (allowed by US4 scenario 2 and SC-004, which
  speak only of position, size and scale).
- Focus never lifts the card: the lift is tied to `hover:` only (FR-004).
- Stacking: all articles become `position: relative`. A hovered card gets `hover:z-1` so its
  shadow paints above the next card in the grid. `z-1` stays below the sticky site header
  (`z-10` in `global.css`), so a hovered card never paints over the header while scrolled.
- No layout shift: transform, scale and shadow do not change box sizes.

### D5. Image enlargement stays inside the card

The `<Image>` is wrapped in a `<div class="overflow-hidden">` (the article's `overflow-hidden`
alone would let a 2 % scale bleed a few pixels into the text padding below the image). The wrapper
takes over the layout role the image had: in `PostCard` it is a plain block with the 16:9 image
inside; in `LeadStory` the wrapper gets `md:min-h-64` and the image keeps `md:h-full`, filling the
stretched grid cell. Static rendering must be pixel-identical; the visual project is the check
(SC-005). Text-only cards have no image and no wrapper.

- **Rejected: scale the image without a wrapper.** Bleeds into the padding and over the title
  area by about 2 % of the image height.
- **Rejected: `clip-path` on the image.** Clip paths transform with the element, so they do not
  contain its own scale.

### Astro documentation (Principle IV, via the Astro Docs MCP)

- Styling with Tailwind 4 through the Vite plugin and combining classes with `class:list`:
  docs.astro.build/en/guides/styling/#tailwind and
  docs.astro.build/en/guides/styling/#combining-classes-with-classlist.
- `class` on `<Image />` applies to the rendered `<img>`, and `<Image />` keeps width/height so the
  wrapper causes no CLS: docs.astro.build/en/guides/images/#astro-components-for-images.
- Scoped styles keep their specificity (considered and rejected in D2):
  docs.astro.build/en/guides/styling/#scoped-styles.
- Component tests render through the Container API `renderToString()`:
  docs.astro.build/en/reference/container-reference/#rendertostring.

## Tests (each names its layer; Test-First)

Written first and seen to fail before the component edits.

1. **Component (Vitest, `tests/component/post/PostCard.test.ts`, `LeadStory.test.ts`)**
   - The card still has exactly one link to the post, the title link, now marked
     `data-post-link`; the image sits outside any link (existing tests stay).
   - Replace the obsolete test "adds no hover, focus or active classes to the card" (it encodes
     the old behaviour this feature reverses) with the invariant: every movement class on the card
     and image (`translate`, `scale`, `transition`) is `motion-safe:`-prefixed, and the card has no
     `focus:`/`focus-visible:` lift. Primary layer for the reduced-motion rule; a second check in
     E2E below is justified because only a browser shows computed transforms.
2. **E2E (Playwright, existing `tests/e2e/blog-fixtures.spec.ts`, fixture site)**: primary layer
   for hit-testing, focus and hover, which only a browser can show.
   - Full-card click: on a listing, the post link is hit (via `elementFromPoint(...).closest("a")`)
     at the image, summary, date line and an empty area of an image card and of the text-only
     card, and on the lead story; one real click on the image navigates to the post (SC-001).
   - A topic pill and a series marker on a card open their own pages (SC-002).
   - Keyboard: Tab to a card's post link draws a solid outline on the article, none on the link,
     and the article's transform stays `none` (FR-004).
   - Hover with motion allowed: the article lifts and the image scales; with
     `reducedMotion: "reduce"` both stay at rest (SC-004); under a touch device context
     (`hasTouch`/`isMobile`, `hover: none`) hover shows no lift or shadow.
3. **E2E forced colours (existing `tests/e2e/blog-forced-colors.spec.ts`)**: the focused card's
   outline is visible in `CanvasText` (FR-004 forced-colours clause).
4. **A11y and visual**: existing projects, no edits; must pass unchanged (SC-003, SC-005).

No new spec file, no edit to shared helpers (`tests/e2e/templates.ts`,
`tests/e2e/csp-violations.ts`, `tests/component/html.ts`, `tests/fixtures/`) and no change to the
Playwright or Vitest config. A touch context is set with `test.use` inside a `describe` in the
existing spec.

## /tweak triage condition 1 (still holds)

- No dependency, integration or service change (Tailwind and Astro versions unchanged).
- No design-system, site-wide layout, navigation or visual-identity change: no new token, no
  `global.css` edit, only existing theme utilities (`shadow-lg`, accent outline colours) used in
  two components; static look unchanged.
- No cost increase; no CI, deploy or infrastructure config change; no constitution amendment.
- No client-side JavaScript added; no new route; no new E2E spec file; no edit to shared test
  helpers or Playwright/Vitest config.

## Constitution Check

*GATE: passed before design and re-checked after it; no exceptions.*

| Principle | Status |
|-----------|--------|
| I. Test-First | Pass. Component and E2E tests above are written and seen failing before the edits; each names its layer, and the one second-layer check carries its reason. |
| II. Automated Release Gate | Pass. No check skipped or weakened; the obsolete component test is replaced because the spec reverses its behaviour, not to get the change through. |
| III. Human Review | Pass. Normal PR flow, Don approves; preview check for hover feel listed in the PR body. |
| IV. First-Party Before Custom | Pass. Tailwind (the stack's styling tool) and Astro `<Image>`; Astro choices cite the docs pages above, found through the Astro Docs MCP. No custom code beyond utility classes. |
| V. Static by Default | Pass. CSS only, no JS, pages still prerendered; cards work with scripts off. |
| VI. Content as Files | Pass. No content or schema change. |
| VII. Private Data | Pass. Not touched. |
| VIII. Cloudflare Best Practices | Pass. No Worker or config change. |
| IX. Cost Ceiling | Pass. No cost. |
| X. Accessible, Fast and Private | Pass. One named link per card, focus visible (incl. forced colours), reduced motion honoured, hover only on hover pointers; no layout shift, negligible CSS. |
| XI. Spec Kit Workflow | Pass. Spec Kit branch and directory; no other worktree edits these two components. |

## Project Structure

### Documentation (this feature)

```text
specs/049-post-card-full-click/
├── spec.md
├── plan.md          # this file
├── quickstart.md    # validation guide
├── checklists/
└── tasks.md         # next phase (/speckit-tasks)
```

`research.md`, `data-model.md` and `contracts/` are not produced: there are no unknowns left after
the decisions above, no data and no external interface.

### Source Code (repository root)

```text
src/components/post/
├── PostCard.astro     # stretched link, card outline, hover classes, image wrapper
└── LeadStory.astro    # same treatment
tests/component/post/
├── PostCard.test.ts   # one-link invariant, motion-safe invariant
└── LeadStory.test.ts
tests/e2e/
├── blog-fixtures.spec.ts      # hit-testing, pills, focus, hover, reduced motion, touch
└── blog-forced-colors.spec.ts # focused card outline in CanvasText
```

**Structure Decision**: Existing single Astro project; edits stay in the two card components and
their existing test files.

## Risks

- `LeadStory` image wrapper at `md:` widths must keep the image filling the grid cell; the visual
  baselines (fixture lead story) catch any drift. If they move, fix the wrapper rather than refresh.
- The `outline-none!` important modifier is a deliberate, local override of the unlayered global
  focus rule; a reviewer should see the D2 note.
- The stretched overlay makes summary text unselectable on cards (accepted in clarify).

## Complexity Tracking

No constitution violations to justify.
