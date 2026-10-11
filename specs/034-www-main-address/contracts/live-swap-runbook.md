# Contract: live-swap and rollback steps (docs/setup.md#live-hosts) — FR-014, FR-015, FR-015a, FR-015b

The section `## 18. Live hosts {#live-hosts}` follows the usual five headings (What it is for,
Where to do it, How it will be confirmed, Constitution principle, Secrets). "Where to do it"
holds two ordered lists under `### Live swap` and `### Rollback`. The docs-structure test asserts
the order of the key phrases below.

## Live swap (one sitting, after the PR merges and its production deploy has finished)

Each step states its precondition, the signal Don sees when it is done, and its time bound
(FR-015a):

0. Confirm SSL/TLS → Edge Certificates → **Always Use HTTPS** is on (it is today; a check, no
   change). Precondition: merge deployed (production build names `www`). Done when: the setting
   shows on. 1 min.
1. Turnstile → widget "dcc-web contact" → add hostname `www.doncoleman.ca`. Done when: the widget
   lists `www.doncoleman.ca`. 2 min.
2. Rules → Redirect Rules: delete the `www` → bare rule. DNS: delete `AAAA www 100::` and any
   other record on `www` (Cloudflare will not attach a Custom Domain otherwise). Precondition:
   step 1. Done when: no rule matches `www` and no record is on `www`. 3 min.
3. Workers & Pages → dcc-web → Settings → Domains & Routes → add Custom Domain
   `www.doncoleman.ca`. Precondition: no record on `www`. Done when:
   `https://www.doncoleman.ca/` loads the site. 2 min plus up to 10 min certificate wait. If `www`
   does not serve within 10 minutes, stop and follow the rollback for "after step 3".
4. Same page: remove the Custom Domain `doncoleman.ca`. Precondition: step 3 done. Done when: the
   bare domain is no longer listed under the Worker's domains. 2 min.
5. DNS: add `AAAA doncoleman.ca 100::`, **Proxied**. Rules → Redirect Rules → create rule:
   custom filter `http.host eq "doncoleman.ca"`; type Dynamic; expression
   `concat("https://www.doncoleman.ca", http.request.uri.path)`; status 301; Preserve query
   string on. Precondition: step 4. Done when: the record shows proxied and the rule is enabled.
   5 min.
6. Run `pnpm setup:check`. Precondition: step 5. Done when: 18/18 complete (item 18 may be
   `pending` for a few minutes while the `www` certificate issues; rerun). 3 min, including one
   rerun.
7. Search Console → domain property → Sitemaps → submit
   `https://www.doncoleman.ca/sitemap-index.xml`. Precondition: step 6 complete. Done when: the
   sitemap shows submitted. 2 min, outside the SC-004 budget.

Expected downtime: `www` between steps 2 and 3 (it only redirected before), at most 15 minutes;
the bare domain between steps 4 and 5, at most 5 minutes.

Deadline: the swap is done on the same day as the merge. If it is not complete 24 hours after the
merge's production deploy, Don opens a revert pull request of this change (FR-015).

## Rollback (FR-015b)

Undo only what was done, from the last completed step back. Every step is reversible; there is no
point of no return.

- **After step 1**: nothing to undo (the `www` widget hostname is harmless and may stay).
- **After step 2**: re-add `AAAA www.doncoleman.ca 100::` (proxied) and the `www` → bare rule:
  filter `http.host eq "www.doncoleman.ca"`, expression
  `concat("https://doncoleman.ca", http.request.uri.path)`, 301, preserve query string.
- **After step 3**: remove the Custom Domain `www.doncoleman.ca`, then as after step 2.
- **After step 4**: add the Custom Domain `doncoleman.ca` again (no record exists there yet) and
  wait until it serves, then as after step 3.
- **After step 5 (full rollback)**: delete the bare → `www` rule and `AAAA doncoleman.ca 100::`
  first (Cloudflare will not attach a Custom Domain to a hostname that has a record), then as
  after step 4.

Then: retry the swap within 24 hours. If it still cannot be done, open a revert pull request of
this change so the build names the bare domain again. The Search Console resubmission is not
undone. After a rollback, the setup check's expected results are those in spec Edge Cases
("After a rollback").
