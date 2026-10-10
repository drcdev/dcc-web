# Contract: site origin and search-engine indexing

## Site origin (`src/lib/site-origin.ts`, `resolveSiteOrigin`)

| Build | `WORKERS_CI` | `WORKERS_CI_BRANCH` | `site` |
|---|---|---|---|
| Workers Builds, main (both Workers) | `1` | `main` | `https://doncoleman.ca` (**changed**, was `https://new.doncoleman.ca`) |
| Workers Builds, other branch | `1` | `<branch>` | `https://<previewAlias(branch)>-dcc-web-preview.<workersSubdomain>.workers.dev` (unchanged) |
| Local, GitHub Actions, Playwright | unset | any | `https://doncoleman.ca` (unchanged fallback) |
| Invalid config or branch | `1` | any | `https://doncoleman.ca` (unchanged fallback) |

`reviewHost` is no longer read by `resolveSiteOrigin`. Canonical links, `og:url`, the sitemap
and `robots.txt` all follow `site`, so on the live domain they all name `https://doncoleman.ca`
(FR-010a).

## Robots meta tag (by build)

`src/lib/build-mode.ts` gains:

```ts
/** True only for a Cloudflare Workers Builds build of main. Fails toward noindex. */
export function isIndexableBuild(env: BuildEnv): boolean; // WORKERS_CI === "1" && WORKERS_CI_BRANCH?.trim() === "main"
```

- `src/config/site.ts` drops the constant `indexable: false`. `Seo.astro` defaults `noindex` to
  `!isIndexableBuild({ WORKERS_CI, WORKERS_CI_BRANCH })`, read from `astro:env/server`.
- An explicit `noindex: true` still wins in every build: draft posts, draft projects and the
  not-found page are noindex everywhere.

| Build | Public pages | Draft pages, 404 |
|---|---|---|
| main (Workers Builds) | no robots meta | `noindex` |
| Every other build | `noindex` | `noindex` |

## HTTP header (by host): `public/_headers`

```text
/*
  Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000

https://:worker.:subdomain.workers.dev/*
  X-Robots-Tag: noindex

https://new.doncoleman.ca/*
  X-Robots-Tag: noindex
```

| Host | `X-Robots-Tag` |
|---|---|
| `doncoleman.ca` | none (indexable) |
| `www.doncoleman.ca` | n/a. It is a 301 at the edge (Redirect Rule) |
| `*.drc-dev.workers.dev`: branch aliases, version previews, `dcc-web.…`, `dcc-web-preview.…` | `noindex` |
| `new.doncoleman.ca`, until it is removed | `noindex` |
| `/api/*` on any host | `noindex`, set by the Worker (`worker/src/http.ts`, unchanged) |

The `new.doncoleman.ca` rule is deleted in the retirement follow-up pull request. Done in #93's
chore (2026-10-09), which also added `includeSubDomains` to HSTS.

## Old Ghost addresses (FR-019)

There is no `_redirects` entry. Ghost-only paths (`/tag/<x>/`, `/author/<x>/`, `/rss/`,
`/ghost/`) return the site's 404 page with status 404 and no `Location` header. The existing
`not_found_handling: "404-page"` already does this, and e2e tests pin it.

## Tests that pin this contract

- `tests/unit/site/site-origin.test.ts` and `astro-config.test.ts`: a main build gives
  `https://doncoleman.ca`.
- `tests/unit/site/build-env.test.ts` and `tests/build/*`:
  - main env: no robots meta on public pages; canonical, `og:url`, sitemap and robots name
    `https://doncoleman.ca`; `_headers` has no `/*` noindex but has both host rules.
  - branch env: the alias origin and noindex meta.
- `tests/unit/site/headers.test.ts`: the `_headers` structure above, including the regression
  guard that robots.txt never disallows.
- `tests/component/Seo.test.ts`: the default follows the build decision, and explicit
  `noindex` wins.
- `tests/e2e/headers.spec.ts`: `wrangler dev` (a non-preview host) sends no `X-Robots-Tag`, and
  the security headers are unchanged.
- `tests/e2e/not-found.spec.ts`: Ghost-only paths return 404.
- The CI preview crawl (`--expect-noindex`) proves the workers.dev rule on a real preview host.
- Setup item 17 proves it for both Workers, and item 28 proves the apex is indexable.
