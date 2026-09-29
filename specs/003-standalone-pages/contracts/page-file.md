# Contract: page file format

The interface Don (and Claude Code) use to publish a page. Schema:
`src/content/schemas/page.ts`; field rules: [../data-model.md](../data-model.md#page-collection-pages).

## Location and address

| File | Address |
|---|---|
| `src/content/pages/index.mdx` | `/` |
| `src/content/pages/workshops.mdx` | `/workshops/` |
| `src/content/pages/legal/accessibility.mdx` | `/legal/accessibility/` |
| `src/content/pages/legal/index.mdx` | `/legal/` |

Every folder and file name (without the extension) uses only lower-case letters, digits and
hyphens; anything else fails the build (spec FR-003). `/writing/`, `/projects/` and `/contact/`
are reserved for later features and cannot be produced by a page file (spec FR-008).

Images used by pages live in `src/content/pages/images/` and are referenced by relative path.
Adding a file here is the only change needed to publish a page (FR-002). Nothing else in the
repository lists pages.

## Minimal page

```mdx
---
title: Workshops
description: Half-day and full-day workshops on systems leadership.
---

Workshop details go here, in ordinary Markdown.
```

## Every setting

```mdx
---
title: Speaking
description: Talks on systems leadership and public-sector technology.
image:                     # sharing image (both keys or neither)
  src: ./images/speaking-share.jpg
  alt: Don Coleman speaking at a conference
featureImage:              # shown at the top of the page content
  src: ./images/stage.jpg
  alt: A conference stage seen from the audience
  caption: Photo from a 2025 conference   # optional
nav:                       # present = listed in the header navigation
  position: 3              # required when nav is present; unique across the navigation
  label: Speaking          # optional; defaults to title
draft: true                # optional; shows the draft notice
---
```

## Home page only: `intro`

```yaml
intro:
  photo:
    src: ./images/don-coleman.jpg
    alt: Don Coleman, smiling, in front of a bookshelf
  name: Don Coleman
  tagline: <one line>
  bio: <two or three sentences>
  cta:
    label: See how I can help
    href: /services/
```

With `intro`, the introduction card replaces the title heading; `title` is still required (it is
used for the navigation label default and sharing metadata).

## Rendered output (per page)

- One `<h1>`: the `title`, or `intro.name` on the home page (FR-014).
- `<title>`, meta description, canonical link, Open Graph and Twitter tags from the settings,
  with site defaults for anything optional that is missing (FR-005).
- An entry in `sitemap-index.xml` (FR-006); no page-specific `noindex`.
- Header navigation entry when `nav` is set, marked `aria-current="page"` on its own page.
- No client-side script beyond what the foundation already ships (FR-030).
