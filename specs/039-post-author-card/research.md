# Research: Author card at the end of posts

**Feature**: `039-post-author-card` | **Date**: 2026-10-11 | **Plan**: [plan.md](./plan.md)

The Astro Docs MCP server (`astro-docs`) was available and was used for every Astro choice below.
No Technical Context item was left as NEEDS CLARIFICATION; the entries record each decision, the
reason and what was rejected.

## R1. Where the author facts live (FR-004, SC-006)

- **Decision**: One `author` object in `src/config/blog.ts`, next to the views note: `name`,
  `photo` (the imported image), `photoAlt` and `lines` (a tuple of exactly two strings). The
  photo is imported in that file from the home page's existing file,
  `src/content/pages/images/don-coleman.jpg`.
- **Rationale**: The spec puts the role lines "with the blog's other settings", and
  `blog.viewsNote` is the precedent for wording shown on every post and changed in one place.
  Importing an image into a config module has a precedent in `src/config/series-images.ts`.
  Every consumer of `blog.ts` runs inside Vite (pages, `feed.ts`, Vitest through
  `getViteConfig()`); no Node script or Worker file imports it, so an image import is safe.
  Reusing the same file means a new home-page photo also updates every card.
- **Alternatives considered**:
  - Read the home page entry (`getEntry("pages", "index")`) and use `intro.photo`. Rejected: it
    ties every post to the home page's frontmatter shape and makes `PostLayout` (and its
    component tests) depend on the content layer for a fixed fact.
  - Add an `author` field to post frontmatter or a new content collection. Rejected: the site
    has one author (spec Assumptions); a collection with one entry is more machinery than a
    constant, and Principle VI is about public content, not settings.
  - Copy the photo into `src/assets/`. Rejected: two copies of one photo drift apart.

## R2. Rendering the photo (FR-002, FR-012)

- **Decision**: Astro's `<Image />` from `astro:assets` with `width={96}`, `height={96}`,
  `densities={[1, 2]}`, `format="webp"`, default `loading="lazy"`, shown as a 96 px circle
  (`size-24 rounded-full object-cover`). The source is 645 x 645, so the 2x file (192 px) is a
  downscale.
- **Docs**: [Images, "Astro components for images"](https://docs.astro.build/en/guides/images/#astro-components-for-images)
  (local images in `src/` are imported and optimised at build time, width and height set to
  avoid layout shift);
  [Image and Assets API, `densities`](https://docs.astro.build/en/reference/modules/astro-assets/#densities)
  (1x/2x `srcset`; not combined with `widths` or `layout`; the site sets no global
  `image.layout`).
- **Rationale**: First-party image pipeline (Principle IV). A fixed-size avatar wants density
  descriptors, not width descriptors. Lazy loading keeps the image out of the initial load: the
  card is far below the fold at the budget's 390 x 844 viewport, so the post page budget
  (150 KB total, 10 KB JS) is unaffected. A 96/192 px WebP portrait is a few kilobytes.
- **Alternatives considered**: `widths` + `sizes` (meant for fluid images); the
  `layout="fixed"` responsive mode (adds inline style and `data-astro-image` styling the site
  does not use elsewhere); a plain `<img>` of the original JPEG (80 KB, no optimisation).

## R3. Card layout at phone width (left open by clarify)

- **Decision**: Below the `md` breakpoint (768 px) the card stacks: photo centred on top, then
  the heading, the two lines and the links, all centred, with the links wrapping as centred
  lines. From `md` the photo sits left of the text block (flex row, `gap-6`, photo top-aligned)
  and the text and links are left-aligned.
- **Rationale**: Feature 035 (merged) made the views note and the Share area centred below
  `md` and left-aligned (heading left, links right) from `md`. The author card sits between
  them, so it switches at the same breakpoint and the three end-of-post pieces read as one
  block at every width. A 96 px photo beside text at 320 px would leave about 150 px for the
  heading and lines, which wraps "Written by Don Coleman" awkwardly; stacking avoids that and
  any sideways scroll (WCAG 1.4.10 reflow).
- **Alternatives considered**: photo beside text at every width (cramped at 320 px); switching
  at `sm` (640 px) like the home intro (the card would then disagree with the Share area
  between 640 and 767 px).

## R4. Link wording and targets (FR-005 to FR-008; Contact text left open by clarify)

- **Decision**: Three links, in this DOM and visual order:
  1. Writing link: on a post in a series, "More in {series name}" to the series page
     (`topicHref(id)`, so `/writing/drift/` or `/writing/convergence/`); on a post in no
     series, "More of my writing" to `/writing/`.
  2. "More about me" to `/about/`.
  3. "Get in touch" to `/contact/`.
- **Rationale**: "Get in touch" is the spec's own example, says what the link does, and is
  already the site's wording for the same link (the Work with me page's call to action and the
  Technology page both use it), so the card adds no new voice. "More in Drift" names the series
  (FR-005, scenario 2.3). All three are first person or plain imperatives matching the card's
  first-person lines.
- **Writing landing page**: `/writing/` is the page the code and navigation call the writing
  landing page (`landingPages` in `src/config/navigation.ts`); it leads to both series and to
  "All posts" (`/writing/all/`). The spec's "(all posts)" is read as describing the landing
  page's scope; if Don wants the flat list instead, the link changes to `/writing/all/` in one
  place in the component (noted as an open question in the plan).
- **Alternatives considered**: "Contact me" (fine, but the site already says "Get in touch");
  "Contact" (a label, not an action); "Read more" (forbidden by scenario 2.3).

## R5. How the card knows a post's series (FR-005, FR-006)

- **Decision**: A small pure function `seriesOf(topics)` in `src/config/topics.ts` returns the
  post's series id (the first topic that is in `seriesIds`) or `undefined`. `PostLayout`
  passes `post.topics` to the card, which calls it and uses `findTopic()` and `topicHref()`.
- **Rationale**: The post schema already guarantees at most one series per post
  (`src/content/schemas/post.ts`), and `topics.ts` already holds the series helpers
  (`seriesIds`, `topicHref`, `otherSeries`). No existing helper answers "which series is this
  post in", so one five-line function is added beside them, with a unit test.
- **Alternatives considered**: pass the series from the route (`[...slug].astro`) as a new
  `PostLayout` prop (spreads one fact over two files); compute inline in the component (works,
  but the rule then has no unit test).

## R6. Markup and accessibility (FR-002, FR-009, FR-010)

- **Decision**: `<section data-author-card>` with a visible `<h2>` "Written by {name}" (not a
  link), two `<p>` lines and a `<ul>` of the three links. In the DOM the heading and text come
  first and the photo last; CSS `order-first` shows the photo first (above below `md`, left
  from `md`). No `aria-label` and no `role`, like the Share section. No script.
- **Rationale**: A heading-first DOM means a screen reader user who jumps to the heading hears
  the heading, the lines, the links and then the photo's alt text; nothing is skipped. The
  image is not focusable, so a visual order that differs from the DOM order does not affect
  focus order (WCAG 2.4.3). `h2` matches the sibling "Share this post" and "Related posts"
  headings under the post's `h1`. Link style reuses the landing page's "All posts" link
  (`inline-block px-1 py-1 font-medium underline underline-offset-4`, dusk/white text, rust
  hover), which gives a target taller than 24 px (WCAG 2.5.8) and existing, tested contrast.
- **Alternatives considered**: `aria-labelledby` on the section (makes it a landmark; the
  Share section is not one, and a landmark per card adds noise); photo first in the DOM like
  the home intro (screen readers navigating by heading would pass the photo).

## R7. Card look (FR-011, FR-012)

- **Decision**: The title card's box: `rounded-xl border border-dusk-200 bg-white p-6
  shadow-sm dark:border-dusk-700 dark:bg-dusk-800`, `mt-8`, as a direct child of the
  `<article>`. Heading `text-lg font-bold text-dusk-900 dark:text-white` (as the Share
  heading); lines `text-dusk-700 dark:text-mist-300` (as the title card's summary).
- **Rationale**: Reuses existing colour pairs that already pass the contrast checks in both
  themes. As a direct child of the article, outside the questions-panel grid, the card gets the
  title card's left and right edges at every width, the same way feature 035 aligned the views
  note and Share area.

## R8. First-party options (Principle IV)

| Capability | First-party option | Used? |
|------------|--------------------|-------|
| Component | Astro component (`.astro`) | Yes |
| Image resize and format | Astro `<Image />` (`astro:assets`, sharp at build) | Yes |
| Styling | Tailwind theme (the site's design system) | Yes |
| Hosting the card and photo | Cloudflare Workers static assets (existing) | Yes, unchanged |
| Server code | Cloudflare Worker `/api/*` | Not needed (static) |
| Fly.io | None in this site (retired in feature 004) | Not applicable |

No third-party package and no custom code where a first-party option exists.
