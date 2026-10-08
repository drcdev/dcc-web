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
  label: Workshops   # optional, defaults to title; non-empty; link text unique within that menu
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

Only `title` and `nav` (required); no body. `nav` is the same strict object as a page's
(`location`, `position`, optional `label`), except that `location` must be `header`. The
address, heading, document title, description and lists are built by the code route
(`src/pages/writing/index.astro`, `src/pages/projects/index.astro`); the link address comes
from `landingPages` in code, never from the file. `title` is only the default link text and may
differ from the route's heading.

## What each build produces

"Production" is the Cloudflare Workers Builds build of `main` (`WORKERS_CI=1` and
`WORKERS_CI_BRANCH=main`); every other build (branch previews, `astro dev`, local and CI builds,
the Playwright servers) is "non-production". A Workers Builds build whose branch cannot be read
counts as production for visibility and as not indexable (spec FR-014; `src/lib/build-mode.ts`).

Non-production builds are never indexable: `Seo.astro` gives **every** page of such a build
`<meta name="robots" content="noindex">` (`isIndexableBuild()` is false), and `public/_headers`
adds `X-Robots-Tag: noindex` on the preview workers.dev host. This is today's behaviour and is
unchanged; spec FR-004's "no noindex instruction" is the production rule. The table's
non-production column therefore lists noindex only where the page itself asks for it.

| Page | Production | Non-production |
|---|---|---|
| visible, not draft | `/<address>/` built; no draft notice; no robots meta; in sitemap; in its menu | built; no draft notice; in sitemap; in its menu; robots noindex meta from the build-wide rule above (not from the page) |
| visible, draft | built; `data-draft-notice`; `<meta name="robots" content="noindex">`; not in sitemap; in its menu | same |
| not visible (any draft) | no file in `dist/`; address answers HTTP 404 with `dist/404.html` (`not_found_handling: "404-page"`); no menu link in any built page; not in sitemap; images used only by it absent from `dist/` (an image shared with a built page stays) | built with the same `data-draft-notice` as a draft page and noindex; not in sitemap; in its menu |
| landing file | the code route's page; header entry from the file | same |

The header lists the `nav.location: header` entries in position order inside
`<nav aria-label="Main">`, after the site-name link, with today's `aria-current` marking; it is
never empty (both landing files are always in it). The footer lists the `nav.location: footer`
entries in position order in its top row beside the site name, as a plain list inside
`<footer>` (no `<nav>`), and keeps the copyright, theme switch and social links (unchanged) in
its bottom row. When the footer has no page entries in a build it renders no `<ul>` for them.
The not-found page uses the same `getNavigation()` result as every other page of that build.

Canonical links and `robots.txt` are unchanged: a draft page (and a not-visible page on
non-production builds) keeps its canonical link; `robots.txt` allows all crawling.

Redirect rules in `public/_redirects` are not checked against visibility. A rule whose target
is a not-visible page leads to the 404 page on production (spec Edge Cases; follow-up).

## Build errors

New rows, numbered after `specs/003-standalone-pages/contracts/build-errors.md`. Row 15 of that
contract is replaced by V6 (no fixed entries remain), and row 14 no longer lists `writing.mdx` or
`projects.mdx` as reserved: those two names are the landing files and are never routed by
`[...slug]`. Every message names the file and the setting.

Message form (spec FR-010): schema rows use Astro's content error, which names the file, the
setting and the expected value and lists every schema problem in the file at once. The other
rows use `contentError()`: `Page file <path>: <problem>. <what to change>` (or
`Page files <a> and <b>: ...`, paths in file-path order). Every row stops the build at the
first failure; the next build reports the next.

| # | Mistake | Detected by | Message must contain |
|---|---|---|---|
| V1 | `visible` or `draft` not true/false (`visible: "no"`) | schema | file name, `visible` (or `draft`) |
| V2 | `nav.location` other than header/footer (`location: sidebar`) | schema | file name, `location` |
| V3 | `nav` without `location` (a position with no location), or an empty `nav` | schema | file name, `location` (or `nav` when it is empty) |
| V4 | `nav` without `position` (a location with no position) | schema | file name, `position` |
| V5 | Home page (`index.mdx`) with `visible: false`, on any build | `generateId` check | `src/content/pages/index.mdx`, "home page" |
| V6 | Two pages in one menu with one position (three or more: the first pair in file-path order) | menu build | both file names in file-path order, the menu, the position, "change the position in one of them" |
| V7 | Landing file with `visible`, `draft`, `description` or any key other than `title` and `nav` | strict `landing` schema | file name, the key |
| V8 | Landing file with a body | `generateId` check | file name, "no body" |
| V9 | Landing file missing (`writing.mdx` or `projects.mdx`) | `getNavigation()` | the missing file path |
| V10 | Landing file without `nav` | strict `landing` schema | file name, `nav` |
| V11 | Two entries in one menu with the same link text (label, else title; case and surrounding spaces ignored) | menu build | both file names in file-path order, the menu, the text |
| V12 | Landing file with `nav.location: footer` | strict `landing` schema | file name, `location` |

Existing rows that still apply to the new fields: row 3 (wrong type) covers a `position` that is
not a whole number from 1; the existing non-empty text rule covers an empty or whitespace-only
`label`. A `visible` or `draft` value that is not an unquoted YAML boolean (a quoted string,
number, `null` or empty value) is V1.

Two pages in different menus with one position build normally.
