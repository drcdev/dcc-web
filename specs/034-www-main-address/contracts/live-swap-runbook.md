# Contract: live-swap and rollback steps (docs/setup.md#live-hosts) — FR-014, FR-015

The section `## 18. Live hosts {#live-hosts}` follows the usual five headings (What it is for,
Where to do it, How it will be confirmed, Constitution principle, Secrets). "Where to do it"
holds two ordered lists under `### Live swap` and `### Rollback`. The docs-structure test asserts
the order of the key phrases below.

## Live swap (one sitting, after the PR merges and its production deploy has finished)

0. Confirm SSL/TLS → Edge Certificates → **Always Use HTTPS** is on (it is today).
1. Turnstile → widget "dcc-web contact" → add hostname `www.doncoleman.ca`.
2. Rules → Redirect Rules: delete the `www` → bare rule. DNS: delete `AAAA www 100::`.
3. Workers & Pages → dcc-web → Settings → Domains & Routes → add Custom Domain
   `www.doncoleman.ca`. Wait until `https://www.doncoleman.ca/` loads the site.
4. Same page: remove the Custom Domain `doncoleman.ca`.
5. DNS: add `AAAA doncoleman.ca 100::`, **Proxied**. Rules → Redirect Rules → create rule:
   custom filter `http.host eq "doncoleman.ca"`; type Dynamic; expression
   `concat("https://www.doncoleman.ca", http.request.uri.path)`; status 301; Preserve query
   string on.
6. Run `pnpm setup:check`. Expect 18/18 (item 18 may be `pending` for a few minutes while the
   `www` certificate issues).
7. Search Console → domain property → Sitemaps → submit
   `https://www.doncoleman.ca/sitemap-index.xml`.

Expected downtime: `www` between steps 2 and 3 (it only redirected before); the bare domain
between steps 4 and 5. Each is minutes.

## Rollback

1. Delete the bare → `www` rule and `AAAA doncoleman.ca 100::`.
2. Add Custom Domain `doncoleman.ca`; wait until it serves.
3. Remove Custom Domain `www.doncoleman.ca`.
4. Add `AAAA www 100::` (proxied) and the rule: filter `http.host eq "www.doncoleman.ca"`,
   expression `concat("https://doncoleman.ca", http.request.uri.path)`, 301, preserve query.
5. Retry the swap within 24 hours. If it still cannot be done, open a revert pull request of this
   change so the build names the bare domain again.

The Turnstile `www` hostname can stay; it does no harm.
