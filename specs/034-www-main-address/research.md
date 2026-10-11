# Research: Make www.doncoleman.ca the main address

Feature: [spec.md](./spec.md) · Plan: [plan.md](./plan.md) · Date: 2026-10-10

The Astro Docs MCP (`astro-docs`) was available and was used for R1. Cloudflare choices cite
developers.cloudflare.com. Live behaviour quoted below came from public `curl` probes of the
production hosts on 2026-10-10 (no credentials).

## R1. Where the site's own address comes from

- **Decision**: Change the single constant `FALLBACK_ORIGIN` in `src/lib/site-origin.ts` from
  `https://doncoleman.ca` to `https://www.doncoleman.ca`. `resolveSiteOrigin` already returns it
  for a `main` Workers Builds build and for any build that cannot tell where it is served
  (FR-001, FR-002), and `astro.config.mjs` passes the result to Astro's `site` option. Every
  absolute address the build writes (canonical, Open Graph, structured data, sitemap and sitemap
  index, `robots.txt`, RSS feed and items, share links) is already derived from `site` /
  `Astro.site`, so no other source file needs an address change.
- **Docs**: Astro configuration reference, `site`
  (docs.astro.build/en/reference/configuration-reference/#site): "Your final, deployed URL. Astro
  uses this full URL to generate your sitemap and canonical URLs in your final build."
  `@astrojs/sitemap` Usage (docs.astro.build/en/guides/integrations-guide/sitemap/#usage) and its
  dynamic `robots.txt` recipe (`new URL('sitemap-index.xml', site)`), which `src/pages/robots.txt.ts`
  already follows. `@astrojs/rss` takes `site` from the endpoint context
  (docs.astro.build/en/recipes/rss/).
- **Rename?** The constant keeps its name. It is both the production origin and the fallback;
  renaming touches unrelated callers for no behaviour gain.
- **Alternatives considered**: (a) a new `mainOrigin` key in `setup/config.json` read by
  `astro.config.mjs` — rejected: a second source for the same value, and the resolver's fallback
  would still need a constant; (b) a build-time env var — rejected: Workers Builds would need a
  new variable, and a missing variable would silently produce the wrong origin.

## R2. Setup-check code reads the main host from the same constant

- **Decision**: The new `live-hosts` item, `web-analytics` and `contact-bindings` derive the main
  host as `new URL(FALLBACK_ORIGIN).host` (`www.doncoleman.ca`), and the bare host from
  `setup/config.json` `zone` (`doncoleman.ca`). `scripts/deploy/preview.ts` and
  `scripts/site-check/preview.ts` already import from `src/lib/site-origin.ts`, so the dependency
  direction is established.
- **Rationale**: One committed value decides what the build names and what the check expects;
  they cannot drift.
- **Alternative**: a hard-coded `"www.doncoleman.ca"` in each check — rejected (three copies).

## R3. Bare-domain redirect: Cloudflare Single Redirects on a proxied placeholder record

- **Decision**: Don adds, in the dashboard, one **Single Redirect** rule (Rules → Redirect Rules)
  on the zone: custom filter `http.host eq "doncoleman.ca"`, dynamic target
  `concat("https://www.doncoleman.ca", http.request.uri.path)`, status **301**, **Preserve query
  string** on. The bare domain gets the proxied placeholder `AAAA doncoleman.ca 100::` so requests
  reach Cloudflare's edge where the rule runs.
- **Docs**: Single Redirects (developers.cloudflare.com/rules/url-forwarding/single-redirects/);
  "Redirect from root to WWW" example
  (developers.cloudflare.com/rules/url-forwarding/examples/redirect-root-to-www/: 301, preserve
  query string); originless proxied placeholder `100::`
  (developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/).
- **Why the host expression, not the documented `https://example.com/*` wildcard**: the wildcard
  matches HTTPS only, so `http://doncoleman.ca` would take two hops (Always Use HTTPS, then the
  rule). The spec accepts two (FR-006), but a host match gives one. Live probe on 2026-10-10: the
  current `www` rule already answers `http://www.doncoleman.ca/writing/?page=2` with a single 301
  straight to `https://doncoleman.ca/writing/?page=2`, so Single Redirects run before Always Use
  HTTPS on this zone and a host-only rule yields one hop on both schemes. The check accepts either.
- **Free plan**: Single Redirects allow 10 rules on Free; this replaces the existing `www` rule,
  so the count is unchanged. Cost $0.
- **Alternatives considered**:
  - *Worker code* (attach both hosts to the Worker, redirect bare in the Worker) — rejected:
    custom code where a platform feature exists (Principle IV), and Principle VIII says only
    `/api/*` invokes Worker code; static assets are served without the Worker running.
  - *`_redirects` in `public/`* — rejected: Workers static-asset redirects match paths, not
    hosts, so they cannot tell the bare domain from `www`.
  - *Bulk Redirects* — works, but needs a list plus a rule for one source; Single Redirects is
    the simpler first-party fit for one host.
  - *Page Rules* — legacy, superseded by Single Redirects.

## R4. `www` served by the Worker's Custom Domain (dashboard only)

- **Decision**: Attach the `dcc-web` Worker's Custom Domain to `www.doncoleman.ca` in the dashboard
  (Workers & Pages → dcc-web → Settings → Domains & Routes), as the bare one is today. No
  `wrangler.jsonc` change (clarification 2026-10-10; FR-005).
- **Docs**: Workers Custom Domains
  (developers.cloudflare.com/workers/configuration/routing/custom-domains/): Cloudflare creates the
  DNS record and certificate; a Custom Domain cannot be attached to a hostname that already has a
  DNS record. Hence the spec's order: remove the old `www` rule and its `AAAA www 100::` record
  before attaching.
- **Alternative**: declare `routes: [{ pattern: "www.doncoleman.ca", custom_domain: true }]` in
  `wrangler.jsonc` — first-party and CI-applied, but rejected by the clarification: it would
  change the Worker config while the bare Custom Domain stays dashboard-managed, and a deploy
  could attach `www` before Don has removed the conflicting record. Recorded as a possible
  follow-up (move both domains into config together).

## R5. HTTP on `www`: Always Use HTTPS

- **Decision**: Rely on the zone's existing **Always Use HTTPS** setting
  (developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/) for
  `http://www.doncoleman.ca` → `https://www.doncoleman.ca` (one 301, path and query kept). Live
  probe: `http://doncoleman.ca/writing/?page=2` → `301 https://doncoleman.ca/writing/?page=2`, so it
  is on. The swap steps include "confirm Always Use HTTPS is on" as a no-op check; the
  `live-hosts` item detects it being off from the public response.
- **Alternative**: a second Single Redirect for `http://www` — redundant while the zone setting
  is on.

## R6. The `live-hosts` check reads public responses only (FR-013)

- **Decision**: A new setup item `live-hosts` (order 18, phase `after-merge`) uses the existing
  read-only `ctx.http.get(url, { redirect: "manual" })` and follows redirects itself, hop by hop,
  up to a fixed limit, recording each status and `Location`. No Cloudflare API call, no token, no
  new permission. Reading the redirect rule or zone settings through the API was rejected: it
  would need `Zone → Single Redirect: Read` / `Zone Settings: Read` on `doncoleman.ca`, and the
  public response is the thing that matters anyway.
- **Relative `Location`**: Workers static-asset `_redirects` answer with a host-relative
  `Location` (live probe: `https://doncoleman.ca/drift/2025/self-contained-development-for-ghost-themes/`
  → `location: /writing/self-contained-development-for-ghost-themes/`). Each `Location` is resolved
  against the request URL (`new URL(location, requestUrl)`), so the next hop stays on the host
  that answered.
- **"Serves the site" marker**: a `200` whose body holds
  `<link rel="canonical" href="https://www.doncoleman.ca/`. That proves the response is this
  site's build and that the deployed build names `www` (so the merge has deployed).
- **Status mapping**:
  - TLS failure on `https://www` → `pending` ("certificate not issued yet; wait and run again"),
    matching the spec's edge case and the retired `live-www-redirect` precedent.
  - Any other wrong shape (old arrangement, half-switched, 302/307/308, path changed, query
    dropped, too many hops, loop, non-HTTPS end) → `missing`, summary starting "Problem:",
    details naming each failing URL and what it answered, next action pointing to
    `docs/setup.md#live-hosts` (swap steps) or the rollback.
  - Network/timeout → `could-not-check` through `fromProviderError`.
- **Hop limits**: `https://www/<p>` 0 hops (200); `http://www/<p>` exactly 1;
  `https://bare/<p>` exactly 1; `http://bare/<p>` 1, or 2 through `https://bare/<p>`; Ghost on
  `https://www` exactly 1; Ghost on `https://bare` at most 2 (bare→www, then old→new — or
  old→new on bare then bare→www is **not** accepted, because the spec requires the bare redirect
  to keep the path unchanged and `www` to serve). The follower stops after 3 hops, so a loop is
  reported as "more than N redirects" rather than spinning.
- **Fixed probes**: paths `/` and `/writing/?page=2`; Ghost address
  `/drift/2025/self-contained-development-for-ghost-themes/` → mapped
  `/writing/self-contained-development-for-ghost-themes/` (spec 030 table, `public/_redirects`).
  A unit test asserts that mapping line exists in `public/_redirects`, so removing it breaks the
  test, not the live check.

## R7. DNS baseline gains a proxied record

- **Decision**: `DnsBaselineRecord` gains an optional `proxied: boolean` (absent = `false`). The
  strict Zod schema accepts it. `evaluateDnsParity` compares `cf.proxied` with
  `record.proxied ?? false` and words the mismatch both ways ("proxied is off, expected proxied
  (orange cloud)" / the existing "proxied is on, expected DNS only"). The baseline adds
  `{ "type": "AAAA", "name": "doncoleman.ca", "content": "100::", "priority": null, "ttl": 1, "proxied": true }`.
- **Unaffected**: `mail-records` groups only MX, TXT and DKIM CNAME records, so the AAAA record
  never reaches the public-resolver comparison (a proxied record resolves to Cloudflare addresses,
  not `100::`). Records on `www` that the Custom Domain adds stay informational
  (`switchNames` already covers apex and `www`).
- **Alternative**: special-case the apex AAAA in code — rejected; the baseline is the committed
  source of truth (Principle VI).

## R8. Turnstile widget hostnames

- **Decision**: Follow FR-012 literally: `contact-bindings` requires `www.doncoleman.ca` in the
  widget's hostname list, and ignores whether `doncoleman.ca` is listed.
- **Finding**: Cloudflare's hostname-management page
  (developers.cloudflare.com/turnstile/concepts/hostname-management/) says "adding a root domain
  covers all subdomains beneath it", so the current widget (`doncoleman.ca`) already works on
  `www`. The explicit entry is therefore belt-and-braces, not a functional need. Kept because the
  spec requires it and it costs one dashboard edit; noted as an open question for Don (accept
  either `www.doncoleman.ca` or `doncoleman.ca` instead?).

## R9. Web Analytics on `www`

- **Decision**: `web-analytics` keeps finding the site by zone (automatic setup registers the
  zone, not a host) and fetches the beacon from `https://www.doncoleman.ca/` (FR-011). Automatic
  setup injects into every proxied HTML response in the zone, which includes the `www` Custom
  Domain (developers.cloudflare.com/web-analytics/get-started/#sites-proxied-through-cloudflare).
  No dashboard change.

## R10. Strict-transport policy after the swap

- **Finding**: `public/_headers` sends `Strict-Transport-Security: max-age=31536000;
  includeSubDomains` from the Worker's assets. After the swap, `www` responses carry it;
  bare-domain responses are now edge redirects and do not. Browsers that already visited the bare
  domain keep its cached policy (which covers `www`) for up to a year. Spec says the header
  contract does not change; no action. Enabling zone-level HSTS (SSL/TLS → Edge Certificates) to
  keep it on the bare domain is a possible follow-up, not in scope.

## R11. Search Console

- **Decision**: Manual step after the setup check is complete: Search Console → the domain
  property (verified by the apex `google-site-verification` TXT in the baseline, which covers
  `www`) → Sitemaps → submit `https://www.doncoleman.ca/sitemap-index.xml`. No API, no new token.

## R12. Cost

- **Decision**: $0/month. Single Redirects (within the Free plan's rule allowance, replacing one
  rule with one), a proxied DNS record, Workers Custom Domain and its certificate, Always Use
  HTTPS, Turnstile hostname entry and Search Console are all free. No new service.

## R13. Rollback

- **Decision**: Written in `docs/setup.md#live-hosts`: delete the bare→`www` rule and the
  `AAAA doncoleman.ca 100::` record; attach the Custom Domain to `doncoleman.ca` (wait until it
  serves); detach it from `www`; re-add `AAAA www 100::` (proxied) and the `www`→bare rule
  (host `www.doncoleman.ca`, target `concat("https://doncoleman.ca", http.request.uri.path)`,
  301, preserve query). Retry within 24 hours; if still not possible, open a revert PR of this
  change (clarification 2026-10-10). During a rollback the build still names `www`, which
  redirects to the bare domain, the same short-lived state as the merge-to-swap window.
