# Design source: porting Flux into dcc-web

This document is the required first artifact of the site foundation feature (FR-032). It
explains where the visual and structural design for doncoleman.ca comes from, how to fetch that
source for reference, what is intentionally left behind, and how the site's current live URLs
map onto the new build. Nothing in this document changes code or configuration.

## How to get Flux

The design baseline is Don's existing Ghost theme, [Flux](https://github.com/drcdev/flux). Clone
it into the repository-local reference folder from the repository root:

```sh
gh repo clone drcdev/flux .reference/flux -- --depth 1
```

`.reference/` is gitignored — the clone never gets committed. Treat `.reference/flux` as
**read-only**: read it to understand markup, styles and behaviour, and port what's needed by
hand into this repository's Astro components and Tailwind styles. It is never imported as a
dependency and never copied into this project.

## Mapping

Each row below names a piece of Flux, what it becomes in the Astro rebuild, and which feature
owns porting it.

| Flux part | Becomes | Owner |
|---|---|---|
| `@theme` palettes dusk, rust, sage, lavender, mist, sand, mauve (50–950) | Tailwind theme tokens in `src/styles/global.css`, ported as-is, keeping "change the BASE value to update the palette" | Foundation |
| `accent-*` palette from Ghost's `--ghost-accent-color` | Fixed accent palette derived from rust `#d68844` | Foundation |
| `--gh-font-body` / `--gh-font-heading` | System font stack now; follow-up for the real Ghost fonts, self-hosted later via Astro's built-in font support | Foundation (follow-up: fonts) |
| `@custom-variant dark`, `.prose-accent`, heading colours (H1/H2 rust, H3 sage, H4 lavender), `.table-wrapper`, focus rings | Global styles, as-is | Foundation |
| Prism token colours + `kg-code-card` | Shiki with one semantic theme whose colours become `hl-*` classes (no inline styles, so the CSP is unchanged), coloured in `src/styles/global.css` for light and dark, plus the `CodeBlock` component (done; spec 008 R7, R8) | Blog |
| `kg-width-wide` / `kg-width-full` + `content-feature-image.hbs` | `WideImage` and `FullImage` sections, `FeatureImage` page component, and `.kg-width-*` rules in `src/styles/global.css` (done) | Pages |
| `table-wrapper.js` | `ScrollTable` component replacing the Markdown `table`, scrolling inside a focusable region; no client script (done; spec 008 R9) | Blog |
| `theme-toggle.js` + `ui-theme-toggle.hbs` | Inline head script + toggle component | Foundation |
| `navigation-toggle.js` | Native HTML if accessible, else tiny script; progressive enhancement per spec (tiny script chosen, research R6) | Foundation |
| `default.hbs`, `layout-header.hbs`, `layout-footer.hbs`, `navigation.hbs` | Base layout, header, footer, navigation | Foundation |
| `partials/Icons/*` | SVG components via Astro's built-in SVG imports; each feature ports what it uses | Each feature |
| `layout-author-hero.hbs` | `HomeIntro` card in `src/components/page/` (done) | Pages |
| `page.hbs` + `content-section.hbs` | `src/layouts/PageLayout.astro` (done) | Pages |
| `ui-share.hbs` | `Share` component in `src/components/post/`: plain LinkedIn and email links, plus a Share button that a bundled script shows when `navigator.share` exists; Flux's Ghost `#/share` link is not ported (done; spec 008 R10) | Blog |
| `post.hbs`, `content-post-list.hbs` (timeline), `content-post-list-featured.hbs` (bento grid), `content-post-meta.hbs`, `ui-tag-pill.hbs` | Reference patterns only; blog and portfolio designed fresh | Blog / Portfolio |
| `ui-contact-form.hbs`, `contact-form.js`, `supabase/functions/contact/index.ts`, `supabase/migrations/*contact*` | Contact form and API | Contact |
| `error.hbs` | Not-found page | Foundation |
| CSP meta tag in `default.hbs` | Cloudflare `_headers` security headers (plus Astro's CSP meta for hashes), tightened: remove Web3Forms, jsDelivr, Supabase; allow the Cloudflare Web Analytics beacon | Foundation |

## Content structure

Feature 003 set up one shared layout for content. The blog, portfolio and contact features add
siblings to these paths instead of new conventions.

| Path | Holds | Later features add |
|---|---|---|
| `src/content.config.ts` | Every collection definition (`pages`, `posts` and `projects`) | Nothing; add a collection here |
| `src/content/schemas/shared.ts` | Reusable Zod pieces: `imageWithAlt`, `seoFields`, `navField` | Nothing; reuse |
| `src/content/schemas/page.ts` | `pageSchema({ image })` | `post.ts`, `project.ts` beside it |
| `src/content/pages/` (+ `images/`) | Page files and their images | Nothing; add a file |
| `src/content/posts/` (+ `images/`) | One MDX file per blog post, with its images (`docs/posts.md`) | Nothing; add a file |
| `src/content/projects/` (+ `images/`) | One MDX file per project, with its images and clips (`docs/projects.md`) | Nothing; add a file |
| `src/content/schemas/project.ts` | `projectSchema({ image })`: the settings, comparison and visuals rules | Nothing; extend here |
| `src/components/project/` (`ProjectPart`, `OptionsTable`, `PartPicture`, `BuildLinks`, `ProjectInvitation`) | The four-part story: `src/lib/markdown/project-parts.ts` wraps each `##` part and the Options table, and the route hands `ProjectPart` and `OptionsTable` to `<Content components>` | Parts are fixed (`src/lib/content/parts.ts`); the body is plain Markdown |
| `src/pages/projects/` | The Projects index and the one story route `[slug].astro` | Nothing |
| `src/components/Pill.astro` and `src/components/post/TopicPill.astro` | Two pills on purpose, not one: `Pill` is the bordered rectangular text label the portfolio uses for a project's status and themes (`project/StatusPill.astro`, `project/ThemePills.astro`), with a decorative tone and an optional link; `TopicPill` is the blog's rounded, topic-coloured link to a topic page (`post/topic-styles.ts`), used on post cards, the post header and the topic pill row | Reuse the one that matches: a label takes `Pill`, a topic link takes `TopicPill` |
| `src/lib/content/project-*.ts` | Project build checks: address, body, images, order | Reused |
| `src/components/sections/` | Sections usable in any MDX body: one `.astro` file each, `index.ts` (the registry, a closed list of names) and `schemas.ts` (prop rules) | New sections register in `index.ts` and `schemas.ts` |
| `src/components/page/` | `HomeIntro`, `FeatureImage`, `DraftNotice` | Post and project furniture in `src/components/post/` and similar |
| `src/layouts/PageLayout.astro` | Standard page layout inside `BaseLayout` | `PostLayout`, `ProjectLayout` |
| `src/lib/content/` | `address.ts`, `body.ts`, `navigation.ts`, `images.ts`, `errors.ts`: build-time checks that raise `PageContentError` | Reused for posts and projects |
| `src/pages/[...slug].astro` | The one route that renders every page file | `src/pages/writing/` and `src/pages/projects/` routes; the address check reserves their addresses |
| `docs/pages.md`, `docs/posts.md`, `docs/projects.md` | Don's authoring guides (pages, posts and projects, all done) | Nothing; add a guide beside them |

Test support for this structure:

- `tests/build/` holds the fixture-site harness (`fixture-site.ts`, `run-astro.ts`) and the
  build-level tests (`page-validation.test.ts`, `local-site.test.ts`; see [testing.md](testing.md)).
  The harness copies the site into `.cache/`, adds fixture page files and runs an Astro build or sync.
- `tests/fixtures/pages/` holds the fixture pages: `sections.mdx`, `workshops.mdx`, and
  `broken/` with the files that must fail the build. `pnpm run build:fixtures` builds the site with
  the sections fixture for the `sections` Playwright project.

### Flux deviations

- `.kg-width-wide` caps its margin at `max(calc(-12vw + 2rem), calc(50% - 50cqw))` so a wide
  image goes a little past the text column and never past the page.
- `.kg-width-full` and the wide cap measure `cqw`, the width of the page without the scrollbar,
  because `100vw` would scroll sideways on desktop. `cqw` needs a size container, so
  `BaseLayout` wraps `<main>` in `.page-container`, which becomes a container
  (`container-type: inline-size`) only when the page holds a wide or full image
  (`:has(.kg-width-wide, .kg-width-full)`). Putting the container on `<body>` stopped the dark
  background reaching the whole window, and an always-on container made Chromium run every
  colour transition in `<main>` on load, which axe caught mid-fade on the home call to action.
- `.prose-accent` has `overflow-wrap: anywhere` so a long unbroken address wraps instead of
  scrolling sideways.

## What doesn't carry over

The following Flux/Ghost features are intentionally left behind and are not ported:

- Ghost member sign-up, subscribe and account buttons, and the Ghost member portal.
- Ghost search.
- Comments (`ui-comment.hbs`).
- The call-to-action block (`content-cta.hbs`).
- The AI post-analysis feature: `ui-post-ai.hbs`, `post-ai.js`, and the Supabase functions
  `analyze`, `auth-bridge`, `feedback` and their migrations.
- The Drift, Convergence and News blog categories as distinct routed sections: `drift.hbs`,
  `convergence.hbs`, `news.hbs`, `newsletter-*.hbs`, `newsletter-description.js`, their icons
  under `Icons/types/*`, the `routes.yaml` routing table and `redirects.json`.
- The Ghost deploy workflow, `gscan`, and the `.scripts` content scripts.
- Prism, `marked`, `dompurify`, `terser`, and the SRI hash script (`inject-hashes.js`) that adds
  subresource integrity attributes.
- Supabase as a service: Supabase functions and migrations are reference material for the new
  contact API only; nothing connects to Supabase itself.

## Current live URLs

These are the URL patterns live today on doncoleman.ca. The new build keeps a page's URL where
that page still exists; blog post and category URLs change shape because the Drift/Convergence/
News categories are not carried over (see above). There are no redirects — Don updates his own
external links himself where a URL changes.

- Posts: `/drift/{year}/{slug}/`, `/convergence/{year}/{slug}/`, `/news/{year}/{slug}/`
- Category pages: `/drift/`, `/convergence/`, `/news/`
- Topics: `/topic/{slug}/`
- Author: `/author/{slug}/`
- Pages: `/about/`, `/contact/`, `/privacy-policy/`, `/cookie-policy/`, `/terms-of-use/`,
  `/technology/`

## Accessibility adjustments

Where a ported Flux colour pairing fails the WCAG 2.2 AA contrast minimums (FR-020a), the
failing utility is replaced with the nearest passing shade of the same palette. The palette
tokens in `src/styles/global.css` are unchanged; only the class on the element changes (FR-001a).
Ratios are measured against the background the text sits on, as reported by axe-core.

| Pairing | Where used | Failing ratio | Replacement | New ratio |
|---|---|---|---|---|
| `text-mauve-500` (#857788) on `bg-white` (#ffffff), light theme, 14px normal text | Footer copyright line (`src/components/SiteFooter.astro`; Flux `layout-footer.hbs`) | 4.19:1 (needs 4.5:1) | `text-mauve-600` (#6b606c) | 6.01:1 |
| `text-mauve-400` (#9e939f) on `bg-white`, light theme | Home card tagline (`src/components/page/HomeIntro.astro`; Flux `layout-author-hero.hbs`) | 2.94:1 | `text-mauve-600` (#6b606c) | 6.01:1 |
| `dark:text-mauve-500` (#857788) on `dusk-800` (#2b283e), dark theme | Home card tagline (`HomeIntro.astro`) | 3.38:1 | `dark:text-mauve-400` (#9e939f) | 4.83:1 |
| `bg-rust-500` (#d17a2e) with white text, both themes | Home card call to action (`HomeIntro.astro`) | 3.21:1 | `bg-rust-600` (#a76225), hover `bg-rust-700` | 4.75:1 (hover 7.39:1) |
| `.dark .prose-accent h4` `lavender-400` (#8b6ac8) on `dusk-800` (#2b283e) | Level-4 headings in page content (`src/styles/global.css`) | 3.38:1 | `lavender-300` (#a88fd6) | 5.13:1 |

The dark-theme half of the same line (`dark:text-mauve-400` on `dusk-900`) passes and is
unchanged.

Not a colour change, but found by the same check: the first port rendered page content with no
text colour, so in the dark theme it showed black on `dusk-BASE` (1.22:1). Flux always wraps
page content in its `content-section.hbs` classes (`prose dark:prose-invert prose-accent`,
`dark:bg-dusk-800`), which supply the body, link and heading colours; the home and not-found
pages now use that wrapper, as Flux does.

