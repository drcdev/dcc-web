# Contract: page settings, visibility and menus (029)

What a writer puts in a page file and what each build makes of it. Extends
`specs/003-standalone-pages/contracts/page-file.md`; where the two differ, this contract wins.

## Page file front matter

```yaml
---
title: Workshops
description: Half-day and full-day workshops on systems leadership.
visible: true        # optional, default true. false: off the live site, kept on previews
draft: false         # optional, default false. true: notice + noindex + out of the sitemap
nav:                 # optional. Leave it out to keep the page out of both menus
  location: header   # required with nav: header | footer
  position: 8        # required with nav: whole number from 1, unique within that menu
  label: Workshops   # optional, defaults to title
---
```

## Landing page file (`src/content/pages/writing.mdx`, `src/content/pages/projects.mdx`)

```yaml
---
title: Writing
nav:
  location: header
  position: 4
---
```

Only `title` and `nav`; no body. The address, heading, description and lists are built by the
code route (`src/pages/writing/index.astro`, `src/pages/projects/index.astro`).

## What each build produces

"Production" is the Cloudflare Workers Builds build of `main`; every other build (branch
previews, `astro dev`, local and CI builds, the Playwright servers) is "non-production".

| Page | Production | Non-production |
|---|---|---|
| visible, not draft | `/<address>/` built; no draft notice; no robots meta; in sitemap; in its menu | built; in sitemap; in its menu (robots noindex comes from the build, as today) |
| visible, draft | built; `data-draft-notice`; `<meta name="robots" content="noindex">`; not in sitemap; in its menu | same |
| not visible (any draft) | no file in `dist/`; address serves the not-found page (404); no menu link; not in sitemap; images used only by it absent from `dist/_astro/` | built with `data-draft-notice` and noindex; not in sitemap; in its menu |
| landing file | the code route's page; header entry from the file | same |

The header lists the `nav.location: header` entries in position order; the footer lists the
`nav.location: footer` entries in position order, then the social links (unchanged). The
not-found page uses the same `getNavigation()` result as every other page.

## Build errors

New rows, numbered after `specs/003-standalone-pages/contracts/build-errors.md`. Row 15 of that
contract is replaced by V6 (no fixed entries remain), and row 14 no longer lists `writing.mdx` or
`projects.mdx` as reserved: those two names are the landing files and are never routed by
`[...slug]`. Every message names the file.

| # | Mistake | Detected by | Message must contain |
|---|---|---|---|
| V1 | `visible` or `draft` not true/false (`visible: "no"`) | schema | file name, `visible` (or `draft`) |
| V2 | `nav.location` other than header/footer (`location: sidebar`) | schema | file name, `location` |
| V3 | `nav` without `location` (a position with no location) | schema | file name, `location` |
| V4 | `nav` without `position` (a location with no position) | schema | file name, `position` |
| V5 | Home page (`index.mdx`) with `visible: false`, on any build | `generateId` check | `src/content/pages/index.mdx`, "home page" |
| V6 | Two pages in one menu with one position | menu build | both file names, the menu, the position |
| V7 | Landing file with `visible`, `draft`, `description` or any key other than `title` and `nav` | strict `landing` schema | file name, the key |
| V8 | Landing file with a body | `generateId` check | file name, "no body" |
| V9 | Landing file missing (`writing.mdx` or `projects.mdx`) | `getNavigation()` | the missing file path |
| V10 | Landing file without `nav` | strict `landing` schema | file name, `nav` |

Two pages in different menus with one position build normally.
