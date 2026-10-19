# Research: One footer block at the end of posts

All Technical Context items were known from the codebase; there were no NEEDS CLARIFICATION
markers. The Astro Docs MCP server (`astro-docs`) was available and was used for R1.

## R1. How to build the block: compose the existing components

- **Decision**: A new `PostFooter.astro` in `src/components/post/` renders one wrapper box and,
  inside it, the existing `AuthorCard` and `Share` components. `AuthorCard` renders the existing
  `ViewsNote` component inside its text column, after the link list. `PostLayout.astro` renders
  `<PostFooter>` in place of the views-note wrapper, `<AuthorCard>` and `<Share>`.
- **Rationale**: Astro components are meant to be composed: "You can use components inside of
  other components to build more and more advanced UI"
  (docs.astro.build/en/basics/astro-components/#component-based-design). Keeping the three
  components keeps their wording sources (`blog.viewsNote`, `blog.author`, `shareLinks()`), their
  data hooks (`data-views-note`, `data-author-card`, `data-share`) and the Share button's bundled
  script (docs.astro.build/en/guides/client-side-scripts/) exactly as they are, so FR-010 and FR-011
  hold by construction. The views note must sit in the author text column (FR-008: in line with the
  author text, not under the photo) and before the photo in the DOM (FR-014), so it has to be
  inside `AuthorCard`'s text `div`; a direct import is simpler than a slot because there is only
  one caller.
- **Alternatives considered**: (a) one merged component replacing all three: more churn, loses the
  per-piece component tests, and moves the Share script. (b) A `<slot />` in `AuthorCard` filled by
  `PostFooter`: adds indirection for a single caller. (c) Wrapping inline in `PostLayout` with no
  new component: the box and its spacing could not be component-tested on their own.

## R2. The wrapper element (FR-013: no new landmark)

- **Decision**: `<div data-post-footer>`. The author part and the share part stay unnamed
  `<section>` elements, as today.
- **Rationale**: A `div` has no role, so the block adds no landmark and no accessible name. An
  unnamed `section` maps to the generic role (no region landmark), which is what the two parts
  already are and what the axe scan already accepts. A `<footer>` inside an `<article>` is not a
  `contentinfo` landmark either, but the test suite selects the site footer by tag in several places
  (`tests/e2e/a11y.spec.ts`: `"footer a"`, `"footer button[data-theme-toggle]"` and a bare
  `"footer"` selector; `tests/e2e/footer-year.ts`: `footer p`; `blog.a11y.spec.ts`: "one footer
  landmark"). A second `<footer>` on post pages would make `page.locator("footer a").first()` hit a
  post link and could make the year-freeze helper see a second footer. `geometry.spec.ts` uses
  `body > footer` and would be safe, but the others would not.
- **Alternatives considered**: `<footer>` (rejected above); `<aside>` (a complementary landmark,
  breaks FR-013); a named `<section aria-labelledby>` (a region landmark, breaks FR-013).

## R3. Box style, divider and spacing

- **Decision**:
  - Wrapper: the title card's box, `rounded-xl border border-dusk-200 bg-white p-6 shadow-sm
    dark:border-dusk-700 dark:bg-dusk-800`, plus `mt-10`. No width cap, a direct child of the
    `<article>` (so its edges equal the title card's, as 035 and 039 arranged).
  - Author part (`section[data-author-card]`): loses its own box classes (border, background,
    radius, padding, shadow, `mt-8`); keeps its flex layout (`flex flex-col items-center gap-4
    text-center md:flex-row md:items-start md:gap-6 md:text-left`).
  - Share part (`section[data-share]`): loses its gradient, rust border, `rounded-lg`, `p-4` and
    `mt-8`; gains `mt-6 border-t border-dusk-200 pt-6 dark:border-dusk-700`. The top border is the
    divider: it spans the wrapper's content box (the box's inner width) and uses the box's border
    colour. `mt-6` and `pt-6` give 1.5 rem above and below it, the same as the box's `p-6`
    (FR-005). It keeps `text-center md:flex md:items-center md:justify-between md:gap-x-6
    md:text-left`, so from 768 px the heading starts at the box's inner left edge, in line with the
    photo, and the links sit right (FR-008).
  - Views note: loses `border-t`, `pt-4`, its own `text-center md:text-left` (it inherits the
    author part's alignment) and gains `mt-4` (1 rem below the link row).
- **Rationale**: FR-004 asks for the title card's box; FR-005 for one divider with 1.5 rem each side;
  the clarify session ruled out two boxes. A border on the share part is a CSS border, so it stays
  visible in forced-colours mode (FR-015) without any extra rule, unlike a background-colour rule.
  `mt-6` on the share part does not collapse with anything because the author part above it is a
  flex container whose bottom has no margin.
- **Alternatives considered**: an `<hr>` element for the divider (adds a `separator` role that
  screen readers announce between the parts; the divider is decorative, FR-015); a `divide-y`
  utility on the wrapper (works, but hides which element carries the border from the tests).

## R4. The gap above and below the block (FR-007)

- **Decision**: `mt-10` (2.5 rem) on the wrapper. Below it, the existing `mt-10` on
  `section[data-related]` (outside the article) already gives 2.5 rem: the article has no bottom
  padding or margin, `<main>` is a plain block (`container mx-auto p-4 mt-4`), and the "Related
  posts" `h2` has `mt-0`, so its top is the section's top.
- **Where the gap above is measured**: from the bottom edge of the wrapper's previous sibling to the
  wrapper's top edge. The previous sibling is the `div` that holds the post body and, when the post
  has one, the questions panel. Below 1280 px the panel is a block above the body, so that `div`
  ends where the body ends; from 1280 px (`xl`) the panel and the body share a grid row, so the
  `div` ends at the bottom of the taller column. The test measures the `div`, not the panel itself,
  because the panel is sticky and its box moves with scrolling. The prose body ends its last child
  with no bottom margin (Tailwind Typography's `> :last-child { margin-bottom: 0 }`), so on a post
  without the panel, or with a body taller than the panel, the measured gap is the gap from the last
  line of post text.
- **Rationale**: 2.5 rem is the larger of today's two spacings (spec clarification). Measuring the
  container keeps the test stable with and without the panel.
- **Alternatives considered**: measuring from `[data-post-body]` (wrong when a short body sits
  beside a taller panel at `xl`); adding a new data hook to the container (unneeded:
  `previousElementSibling` finds it).

## R5. Font sizes and colour tokens (FR-003, FR-015)

Contrast values below are computed from the theme's `hsl(from …)` steps in `src/styles/global.css`
(WCAG relative luminance); the axe scan in both themes is the check that enforces them.

| Text | Size | Light (on `white`) | Dark (on `dusk-800`) |
|------|------|--------------------|----------------------|
| "Written by Don Coleman" (`h2`) | `text-lg` (1.125 rem), bold | `dusk-900`, 18.2:1 | `white`, 14.3:1 |
| Author lines | base (1 rem) | `dusk-700`, 10.4:1 | `mist-300`, 6.6:1 |
| Author links | base, `font-medium`, underlined | `dusk-900`, 18.2:1; hover `rust-700`, 7.4:1 | `white`, 14.3:1; hover `rust-400`, 5.7:1 |
| **Views note** | **`text-sm` (0.875 rem), italic** | **`dusk-600`, 7.5:1** | **`dusk-300`, 5.8:1** |
| "Share this post" (`h2`) | `text-lg`, bold | `dusk-900`, 18.2:1 | `white`, 14.3:1 |
| Share pills | `text-sm`, `font-medium` | `rust-800`, 11.6:1; hover bg `rust-50`, 10.4:1 | `rust-300`, 7.3:1; hover bg `rust-950`, 9.9:1 |
| Share pill border / focus ring | — | `rust-600`, 4.8:1 (needs 3:1) | `rust-300`, 7.3:1 |

- **Decision**: the views note keeps its current tokens (`text-sm italic text-dusk-600
  dark:text-dusk-300`). It is smaller than the author lines (0.875 rem against 1 rem) and a lighter
  grey than them, so it reads as a caption, and it clears 4.5:1 in both themes. The share pills keep
  their classes; their background changes from the rust gradient to the box's `white` / `dusk-800`,
  and every pair above still clears 4.5:1 (text) and 3:1 (focus ring).
- **Alternatives considered**: `text-xs` for the note (0.75 rem is too small for a stated
  requirement every reader may look for); `mist-400` in dark (4.8:1, too close to the line).

## R6. First-party options (Principle IV)

| Capability | First-party option | Used? |
|------------|--------------------|-------|
| Composing the block | Astro components (docs.astro.build/en/basics/astro-components/#component-based-design) | Yes |
| Share button script | Astro's bundled `<script>` (docs.astro.build/en/guides/client-side-scripts/) | Yes, unchanged |
| Photo | `astro:assets` `<Image />` (docs.astro.build/en/guides/images/) | Yes, unchanged |
| Styling | Tailwind theme tokens (the site's design system) | Yes |
| Component tests | Astro Container API (docs.astro.build/en/guides/testing/#vitest-and-container-api) | Yes |
| Hosting | Cloudflare Workers static assets | Yes, no Worker or binding change |
| Fly.io | Not used by this site; nothing here needs a server | N/A |

No custom code replaces a first-party feature. No dependency is added.

## R7. Parallel worktrees

Sibling branches 046 (mobile questions disclosure), 049 (post card full click), 050 (page
container harmony) and 051 (home dual CTA) have no `src/` changes yet. By name, 046 may touch
`PostLayout.astro` and `QuestionsPanel.astro`, 049 the cards inside Related posts, and 050 the
card box classes the wrapper copies. Any of them may also refresh the `post-template` baselines.
Handling: whichever branch merges second merges `origin/main`, resolves `PostLayout.astro` by hand
(keeping both changes) and regenerates the `post-template` baselines on both platforms.
