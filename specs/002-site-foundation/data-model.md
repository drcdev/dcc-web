# Data Model: Site foundation

**Feature**: `002-site-foundation` | **Plan**: [plan.md](./plan.md)

There is no database. These are the typed values the shell is built from, where each lives, and
the rules tests enforce.

## ThemeChoice

- **Values**: `"dark" | "light" | "system"`.
- **Stored**: visitor's browser only, `localStorage["color-theme"]` (same key as Flux). No cookie.
- **Absent / unreadable / any other value** → treated as `"dark"` (FR-015). Not written on first
  visit.
- **Cycle** (`nextTheme`): `dark → light → system → dark` (FR-012).
- **Effective theme** (`isDark(choice, prefersDark)`): `dark` → true; `light` → false;
  `system` → `prefersDark`.
- **Rendered state**: `<html>` has class `dark` iff effective theme is dark; server-rendered
  default is `class="dark"` (so no-JS is dark).
- **Transitions**: toggle click → next value → write storage (ignore failure) → apply class →
  update button name and live region. In `system`, a `prefers-color-scheme` change re-applies the
  class without writing storage.

## NavigationItem

| Field | Type | Rule |
|---|---|---|
| `label` | string | Non-empty, plain language |
| `href` | string | Internal: starts with `/` and ends with `/`; external: `https://` |
| `kind` | `"primary" \| "footer" \| "social"` | |
| `icon` | SVG component (social only) | Decorative; link has accessible name |

- **Primary (in order)**: Home `/`, Services `/services/`, Speaking `/speaking/`, Writing
  `/writing/`, Projects `/projects/`, About `/about/`, Contact `/contact/`.
- **Footer**: Privacy policy `/privacy-policy/`, Terms of use `/terms-of-use/`, Technology
  `/technology/`.
- **Social**: GitHub `https://github.com/drcdev`, LinkedIn `https://www.linkedin.com/in/drcdev`.
- **Derived** `isCurrent(pathname, href)`: equal after normalising a trailing slash; `/` matches
  only `/`. Current item gets `aria-current="page"`.
- **`futureDestinations`**: the internal hrefs above that no page builds yet; link-check tests
  accept a 404 only for these.

## SiteConfig (`src/config/site.ts`)

| Field | Value |
|---|---|
| `name` | `Don Coleman` |
| `defaultDescription` | Plain-language one-liner about Don's writing, portfolio and consulting (final wording in implementation; no hype) |
| `defaultImage` | `/og-default.png` (1200×630) |
| `defaultImageAlt` | `Don Coleman` |
| `locale` | `en_CA` (`<html lang="en">`) |
| `indexable` | `false` until the domain switch (FR-019) |
| `copyrightName` | `Don Coleman` |

## PageMetadata (props of `Seo.astro`)

| Field | Type | Default | Rule |
|---|---|---|---|
| `title` | string? | — | Rendered `"{title} · Don Coleman"`; home renders `Don Coleman`; unique across built pages |
| `description` | string? | `defaultDescription` | Never empty |
| `image` | string? | `defaultImage` | Rendered absolute against `site` |
| `imageAlt` | string? | `defaultImageAlt` | Required whenever an image is set |
| `type` | `"website" \| "article"` | `website` | |
| `canonical` | boolean | `true` | `false` on the not-found page |
| `noindex` | boolean | `!indexable` | Always true in this feature |

Absolute URLs = `new URL(path, Astro.site)`.

## SiteOrigin (build-time)

- **Inputs**: `process.env.WORKERS_CI`, `process.env.WORKERS_CI_BRANCH`; `setup/config.json`
  `reviewHost`, `workerName`, `workersSubdomain` (new, optional, public).
- **Output**: an `https://` origin with no path, used as Astro `site`. Resolution table:
  [contracts/site-origin.md](./contracts/site-origin.md).
- **PreviewAlias** (`previewAlias(branch)`): `^[a-z][a-z0-9-]*[a-z0-9]$`, length ≤ 55, or `null`.

## SecurityPolicy

- **Meta CSP** (Astro `security.csp`, per page): script/style hashes + fixed directives.
- **Header set** (`public/_headers`, `/*`): see [contracts/http-responses.md](./contracts/http-responses.md).
- **Rule**: no source outside `'self'`, `https://static.cloudflareinsights.com` (scripts) and
  `https://cloudflareinsights.com` (connect); the strings `web3forms`, `jsdelivr`, `supabase` and
  `'unsafe-inline'` never appear.

## ReferenceScreenshot (Ghost site, for by-eye comparison)

| Field | Values |
|---|---|
| `page` | `home` (`/`), `post` (first post linked from home), `about` (`/about/`) |
| `width` | `phone` 390×844, `desktop` 1280×800 |
| `theme` | `dark`, `light` |
| `file` | `tests/reference/ghost/{page}-{width}-{theme}.png` (12 files) |

## VisualBaseline (new shell, automated)

| Field | Values |
|---|---|
| `subject` | `header`, `footer`, `menu-open` (phone only), `not-found` (full page) |
| `width` | `phone` 390, `desktop` 1280 |
| `theme` | `dark`, `light` |
| `platform` | `darwin`, `linux` (Playwright suffix) |

14 images per platform (4 subjects × 2 widths × 2 themes, minus menu-open at desktop).

## DesignSourceMappingEntry (`docs/design-source.md`)

| Field | Rule |
|---|---|
| `fluxPart` | Names the Flux file(s) or CSS block |
| `becomes` | What it is in the new site |
| `owner` | One of `Foundation`, `Pages`, `Blog`, `Portfolio`, `Contact`, `Each feature` |

Required rows are listed in [contracts/design-source-doc.md](./contracts/design-source-doc.md).
