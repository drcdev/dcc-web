# Contract: the site's own origin

Supersedes the fallback value in `specs/002-site-foundation/contracts/site-origin.md` and
`specs/011-launch` FR-010a. The resolution table is otherwise unchanged.

## Resolution (`resolveSiteOrigin(env, config)`)

| Build | Origin |
|---|---|
| `WORKERS_CI=1`, `WORKERS_CI_BRANCH=main` | `https://www.doncoleman.ca` |
| `WORKERS_CI=1`, other branch, valid preview config | `https://<alias>-dcc-web-preview.drc-dev.workers.dev` (unchanged) |
| anything else (local, test, missing values) | `https://www.doncoleman.ca` |

## Guarantees of a production build (FR-001, FR-003, SC-001)

- Every absolute URL on a site host (`doncoleman.ca`, any `*.doncoleman.ca`, `*.workers.dev`) in
  every built HTML file, `sitemap-index.xml`, `sitemap-*.xml`, `robots.txt` and
  `writing/rss.xml` has origin `https://www.doncoleman.ca`.
- No built file contains the string `https://doncoleman.ca` or `http://doncoleman.ca`.
- Mail addresses (`…@doncoleman.ca`) and prose naming "doncoleman.ca" are not addresses and are
  not matched by the above.
- The not-found page stays `noindex`; public pages have no robots meta (unchanged).

## Test layer

Build (`tests/build/indexing.test.ts`, which already builds with the `main` environment): primary
for every guarantee above. Unit (`tests/unit/site/…` resolver tests): the resolution table. No E2E
duplicate; `tests/e2e/seo.spec.ts` reads the origin from `robots.txt` and needs only its comment
updated.
