# Quickstart: check the Ghost redirects

## Automated

- Unit: `pnpm exec vitest run tests/unit/site/redirects.test.ts` — every Ghost rule is a 301, in
  both slash forms, to a built address; unmapped Ghost addresses match no rule.
- E2E: `pnpm exec playwright test tests/e2e/pages.spec.ts tests/e2e/not-found.spec.ts` — against
  `wrangler dev` on port 4321, each Ghost source answers 301 with the mapped `Location`, the
  target answers 200, and `/tag/x/`, `/author/x/`, `/rss/`, `/ghost/` and `/drift/2025/x/` still
  answer 404.

## By hand (local or preview)

With the site running (`wrangler dev` on 4321, or the branch preview URL):

```sh
curl -sI http://127.0.0.1:4321/cookie-policy | grep -iE '^(HTTP|location)'
# expect: HTTP/1.1 301 and location: /privacy-policy/
curl -sI http://127.0.0.1:4321/news/ | grep -iE '^(HTTP|location)'
# expect: 301 to /writing/
curl -sI http://127.0.0.1:4321/tag/x/ | head -1
# expect: 404
```

Repeat for any row of the spec's mapping table, with and without the trailing slash. After the
switch, the cutover plan's post-switch spot check covers the same addresses on `doncoleman.ca`
and through `www`.
