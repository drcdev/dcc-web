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
| Prism token colours + `kg-code-card` | Shiki light/dark themes + code block component (note Astro CSP + Shiki inline styles, research R8) | Blog |
| `kg-width-wide` / `kg-width-full` + `content-feature-image.hbs` | MDX image components | Pages |
| `table-wrapper.js` | CSS or build-time Markdown plugin; no client script | Blog |
| `theme-toggle.js` + `ui-theme-toggle.hbs` | Inline head script + toggle component | Foundation |
| `navigation-toggle.js` | Native HTML if accessible, else tiny script; progressive enhancement per spec (tiny script chosen, research R6) | Foundation |
| `default.hbs`, `layout-header.hbs`, `layout-footer.hbs`, `navigation.hbs` | Base layout, header, footer, navigation | Foundation |
| `partials/Icons/*` | SVG components via Astro's built-in SVG imports; each feature ports what it uses | Each feature |
| `layout-author-hero.hbs` | Home introduction card | Pages |
| `page.hbs` + `content-section.hbs` | Page layout | Pages |
| `ui-share.hbs` | Share component with Web Share API + plain links fallback | Blog |
| `post.hbs`, `content-post-list.hbs` (timeline), `content-post-list-featured.hbs` (bento grid), `content-post-meta.hbs`, `ui-tag-pill.hbs` | Reference patterns only; blog and portfolio designed fresh | Blog / Portfolio |
| `ui-contact-form.hbs`, `contact-form.js`, `supabase/functions/contact/index.ts`, `supabase/migrations/*contact*` | Contact form and API | Contact |
| `error.hbs` | Not-found page | Foundation |
| CSP meta tag in `default.hbs` | Cloudflare `_headers` security headers (plus Astro's CSP meta for hashes), tightened: remove Web3Forms, jsDelivr, Supabase; allow the Cloudflare Web Analytics beacon | Foundation |

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

None. No accessibility deviations from the ported Flux design have been identified yet; this
section will be updated if a later phase finds one needed.
