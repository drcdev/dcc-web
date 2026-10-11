# Feature Specification: Make www.doncoleman.ca the main address

**Feature Branch**: `034-www-main-address`

**Created**: 2026-10-10

**Status**: Draft

**Input**: User description: GitHub issue #129, "Make www.doncoleman.ca the main address". The
site's main address becomes `https://www.doncoleman.ca`. Every page's canonical link, the
sitemap, `robots.txt` and the social-card links use it, and the bare domain `doncoleman.ca`
permanently redirects to the same path on `www`, keeping the query string. Old Ghost addresses
still reach their posts, now ending on `www`. The setup check follows the new arrangement: `www`
serves the site, the bare domain redirects to it, and the DNS baseline matches. The live swap
happens after this merges, in one short dashboard sitting: the Custom Domain moves from the bare
domain to `www`, the bare domain gets a proxied placeholder record and a redirect rule to `www`,
the old `www` rule is removed, and the sitemap is resubmitted in Search Console. The contact
form's spam-protection widget allows `www`. Ghost's main address was `www.doncoleman.ca`, so
existing search results and inbound links already use it.

## Context

Today the site is served on the bare domain `doncoleman.ca` (the Worker's Custom Domain), and a
Cloudflare redirect rule sends `www.doncoleman.ca` to it. That arrangement came from spec 011
(launch, FR-010a), which chose the bare domain as the main address. This feature reverses that
choice: Ghost used `www.doncoleman.ca` for years, so search results and inbound links already
point there, and moving the main address back to `www` lets them land without a host change.

The change has two parts:

1. **In the repository (this pull request)**: the site's own address becomes
   `https://www.doncoleman.ca`, so every address the build writes uses it; the setup check
   confirms the new serving arrangement; the DNS baseline and the setup documentation describe
   it; and the steps for the live swap are written down.
2. **In the Cloudflare dashboard (after merge, by Don)**: one short sitting that moves the
   Custom Domain, adds the bare-domain placeholder record and redirect rule, removes the old
   `www` rule, adds `www` to the spam-protection widget, and resubmits the sitemap.

Between the merge and the end of the sitting, the deployed build already names `www` while the
live hosts still serve the old arrangement. That window is expected and short (see Edge Cases).

## Clarifications

### Session 2026-10-10

- Q: In what order should Don's live-swap steps run, given that Cloudflare will not attach a Custom Domain to a hostname that already has a DNS record? → A: `www` first: allow `www` in the widget; remove the old `www` rule and its record; attach the Custom Domain to `www` and wait until it serves; then detach the bare-domain Custom Domain, add the bare placeholder record (proxied) and the bare-to-`www` rule; run the setup check; resubmit the sitemap.
- Q: Which placeholder address record should the bare domain get (and the DNS baseline list exactly)? → A: `AAAA doncoleman.ca 100::`, proxied.
- Q: Should the live-hosts confirmation be a new setup-check item or folded into an existing one? → A: A new after-merge item, "Live hosts", making 18 items.
- Q: Should the live-hosts check also confirm `http://www` and which paths should it probe? → A: Yes, check `http://www` too, and probe both `/` and a fixed path with a query string (for example `/writing/?page=2`) on every host and scheme.
- Q: Should the `www` Custom Domain be a dashboard setting or declared in the Worker configuration? → A: Dashboard only, as now; no Worker configuration change.
- Q: Should `http://doncoleman.ca` be allowed to reach `www` in two permanent redirects (via `https://doncoleman.ca` through "Always Use HTTPS"), or must it always be one? → A: Either is accepted for `http://doncoleman.ca`: one hop to `https://www`, or two permanent hops through `https://doncoleman.ca`, with path and query kept. `https://doncoleman.ca` must be exactly one hop. SC-003's hop limit counts HTTPS requests only.
- Q: If the live swap is rolled back and cannot be retried soon, should the repository change also be reverted? → A: Roll back in the dashboard and retry within 24 hours; if the swap still cannot be done by then, open a revert pull request of this change.
- Q: How should SC-003 (old Ghost addresses reach their new pages on `www`) be confirmed? → A: The "Live hosts" item also checks one fixed old Ghost address on `www` and on the bare domain, each ending on its mapped page through permanent redirects within the hop limits.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Readers and search engines land on www (Priority: P1)

A reader follows a search result, a LinkedIn post or a bookmark to `www.doncoleman.ca` or to
`doncoleman.ca`. They end on the same page at `https://www.doncoleman.ca`. Search engines see one
consistent main address: every canonical link, sitemap entry, `robots.txt` sitemap line, feed link
and social-card link names `https://www.doncoleman.ca`.

**Why this priority**: It is the purpose of the change. The address the site names for itself and
the address that serves it must agree, or search engines receive conflicting signals.

**Independent Test**: Build the site as the production build and confirm every absolute address
on the site's own host uses `https://www.doncoleman.ca`. After the live swap, request pages on
both hosts and confirm `www` serves them and the bare domain redirects.

**Acceptance Scenarios**:

1. **Given** a production build, **When** any public page is inspected, **Then** its canonical
   link, its social-card (Open Graph and similar) URL and image addresses, and any feed link use
   `https://www.doncoleman.ca`.
2. **Given** a production build, **When** the sitemap and `robots.txt` are read, **Then** every
   sitemap entry and the `robots.txt` sitemap line use `https://www.doncoleman.ca`.
3. **Given** the live swap is done, **When** a reader requests `https://doncoleman.ca/<path>?<query>`,
   **Then** the response is a single permanent (301) redirect to
   `https://www.doncoleman.ca/<path>?<query>`, with the path and query string unchanged (no
   trailing slash added or removed). **When** a reader requests
   `http://doncoleman.ca/<path>?<query>`, **Then** they reach the same address either in one
   permanent redirect or in two permanent redirects through `https://doncoleman.ca/<path>?<query>`,
   with the path and query string unchanged at every hop.
4. **Given** the live swap is done, **When** a reader requests `https://www.doncoleman.ca/<path>`,
   **Then** the site serves the page directly over HTTPS, with no redirect to another host.
5. **Given** the live swap is done, **When** a reader requests `http://www.doncoleman.ca/<path>`,
   **Then** they are permanently redirected to `https://www.doncoleman.ca/<path>`.

---

### User Story 2 - Old Ghost addresses still reach their posts (Priority: P1)

A reader follows an old Ghost address (for example
`www.doncoleman.ca/drift/2025/self-contained-development-for-ghost-themes/`, or the same path on
the bare domain). They reach the matching post on the new site, ending on `www`.

**Why this priority**: Ghost's addresses were on `www`, so these are the links most likely to be
followed. Breaking them would undo the main benefit of the change.

**Independent Test**: After the live swap, request each old address in the spec 030 mapping on
both hosts and confirm it ends, through permanent redirects only, on the mapped page at
`https://www.doncoleman.ca`, which loads.

**Acceptance Scenarios**:

1. **Given** the live swap is done, **When** a reader requests an old Ghost address on
   `https://www.doncoleman.ca`, **Then** one permanent redirect sends them to the mapped new
   address on `https://www.doncoleman.ca`, which loads.
2. **Given** the live swap is done, **When** a reader requests an old Ghost address on
   `https://doncoleman.ca`, **Then** they reach the mapped new address on
   `https://www.doncoleman.ca` through at most two permanent redirects (bare to `www`, then old to
   new path), and it loads. Over `http://doncoleman.ca`, one extra permanent hop to
   `https://doncoleman.ca` is allowed.
3. **Given** an unmapped Ghost address on either host, **When** it is requested, **Then** the
   reader ends on the site's not-found page on `www` (unchanged from spec 030): on
   `https://www.doncoleman.ca` it is answered directly with the not-found page and status 404, no
   redirect; on `https://doncoleman.ca` one 301 to the same path on `www` comes first (plus the
   extra `http://` hop allowed by FR-006a).

---

### User Story 3 - The setup check confirms the new arrangement (Priority: P2)

Don runs the setup check after the live swap. It reports complete only when `www` serves the
site, the bare domain permanently redirects to `www`, the DNS zone matches the committed
baseline, Web Analytics sees the beacon on the served page, and the spam-protection widget allows
`www`. Anything left half-done in the sitting shows up as a problem with a clear next step.

**Why this priority**: The swap is done by hand in the dashboard. The setup check is how Don knows
it is complete and stays correct afterwards.

**Independent Test**: Run each affected setup-check item against recorded provider responses for
the correct arrangement, the old arrangement and each half-switched state, and confirm the result
and next action for each.

**Acceptance Scenarios**:

1. **Given** `www` serves the site, `http://www` and the bare domain redirect to it as required,
   **When** Don runs the setup check, **Then** the "Live hosts" item reports complete.
2. **Given** the old arrangement (bare domain serves, `www` redirects to bare), **When** Don runs
   the setup check, **Then** that item reports a problem naming what is wrong and the next step.
3. **Given** only half the swap is done (for example `www` serves the site but the bare domain
   has no redirect, or the bare domain redirects to a different path, drops the query string,
   uses a temporary redirect, or takes more hops than FR-009 allows), **When** Don runs the setup
   check, **Then** the item reports a problem naming the half that is missing.
4. **Given** the zone holds the bare-domain placeholder record exactly as the baseline lists it,
   proxied, **When** the DNS parity item runs, **Then** it reports complete; **Given** the
   placeholder record is missing, changed or not proxied, **Then** it reports a problem.
5. **Given** the spam-protection widget does not list `www.doncoleman.ca`, **When** the contact
   bindings item runs, **Then** it reports a problem telling Don to add `www.doncoleman.ca`.
6. **Given** Web Analytics is on and the page served at `https://www.doncoleman.ca/` references
   the beacon, **When** the Web Analytics item runs, **Then** it reports complete.

---

### User Story 4 - Don can do the live swap in one short sitting (Priority: P2)

After the pull request merges, Don follows written steps in the setup documentation to move the
live site to `www` in one sitting, then confirms it with the setup check. If something goes wrong
he can follow written rollback steps that restore the bare-domain arrangement.

**Why this priority**: The swap changes the live hosts. Without written, ordered steps, a
half-switched state could leave one host broken.

**Independent Test**: Read the written steps and confirm they cover, in order, every dashboard
change named in this spec, the setup-check run that confirms them, the Search Console
resubmission and a rollback.

**Acceptance Scenarios**:

1. **Given** the merged change, **When** Don reads the setup documentation, **Then** he finds
   ordered steps for the swap: (0) confirm "Always Use HTTPS" is on (a check, no change);
   (1) allow `www` in the spam-protection widget; (2) remove the old
   `www` to bare rule and its `www` record (Cloudflare will not attach a Custom Domain to a
   hostname that already has a DNS record); (3) attach the Worker's Custom Domain to `www` and wait
   until `https://www.doncoleman.ca/` serves the site; (4) detach the Custom Domain from the bare
   domain; (5) add the bare-domain placeholder record `AAAA doncoleman.ca 100::` (proxied) and a
   permanent redirect rule to `www` that keeps the path and query string; (6) run the setup check;
   (7) resubmit the sitemap in Search Console. The bare domain keeps serving the site until step 4,
   so only `www` (which until then only redirects) is briefly unavailable.
2. **Given** the swap cannot be completed in the sitting, **When** Don follows the rollback steps,
   **Then** the bare domain serves the site again and `www` redirects to it, as before the swap,
   and the steps tell him to retry the swap within 24 hours; if it still cannot be done by then,
   he opens a revert pull request of this change so the build names the bare domain again.

### Edge Cases

- **Window between merge and swap**: the deployed build names `www` while `www` still redirects
  to the bare domain. Readers are unaffected (pages still load on the bare domain, with or without
  JavaScript); search engines see canonical links pointing at a redirecting host. Don owns the
  swap and does it on the same day as the merge. The hard limit is 24 hours after the production
  deploy of the merge: if the swap is not done by then, Don opens a revert pull request of this
  change (the same rule as after a rollback, FR-015), so the canonical-to-redirecting-host state
  never lasts more than a day. The setup check reports the "Live hosts" item as a problem during
  this window, which is expected and is not a regression: item 18 runs only when Don runs the
  setup check, never in CI.
- **Downtime during the sitting**: between removing the old `www` rule and the `www`
  certificate being issued, `www` may fail (it only redirected before); this gap is at most
  15 minutes (step 2 plus the certificate wait bound in FR-015a). Between detaching the
  bare-domain Custom Domain and adding its placeholder record and redirect, the bare domain may
  fail; this gap is at most 5 minutes. The steps are ordered (`www` first, bare domain last) to
  keep each short, and the setup check reports a not-yet-issued certificate as `pending` with
  "wait and run again" as the next step.
- **Redirect loop**: if the old `www` to bare rule is left in place while the new bare to `www`
  rule is added, requests loop. The setup check detects a redirect that does not end on a served
  page and reports it.
- **Query strings and trailing slashes**: the bare-domain redirect keeps both exactly; for
  example `/writing/?page=2` stays `/writing/?page=2` and `/about` stays `/about` (the site's own
  trailing-slash handling then applies on `www`).
- **Paths under `/api/`**: the bare-domain redirect applies to every path. The contact form and
  questions panel are served from `www` and call `/api/` on `www`, so their same-origin checks
  pass without change: each API compares the request's `Origin` with the request's own origin, so
  on `www` only `https://www.doncoleman.ca` is accepted, and a request to `www` carrying an
  `Origin` of `https://doncoleman.ca` is rejected as any other cross-origin request is today. A
  request to the bare domain's `/api/` never reaches the Worker; it gets the 301. A 301 does not
  carry a POST body (clients may retry as GET), so a program must call `www` directly; no program
  calls the bare domain's `/api/` today. The APIs send no CORS headers and set no cookies, on
  either host, and this does not change.
- **Request methods, encoding and fragments on the bare domain**: the redirect answers every
  method (GET, HEAD, POST and others) with the same 301. Percent-encoded characters in the path
  and query are passed through as received, not decoded or re-encoded. Fragments (`#…`) are never
  sent to the server; browsers keep them across the redirect.
- **Site files on the bare domain**: `robots.txt`, the sitemap files, feeds, `favicon.ico` and
  every other file are redirected like any page, to the same path on `www`. The bare domain serves
  no file of its own.
- **Placeholder record with no origin**: `AAAA doncoleman.ca 100::` points at no server. Every
  request to the bare domain matches the redirect rule by host, so none is sent to that address.
  If the rule is missing or disabled, requests to the bare domain fail with a Cloudflare error
  instead of serving any content, and the "Live hosts" item reports it.
- **Open redirect**: the redirect's target host and scheme are fixed (`https://www.doncoleman.ca`);
  only the path and query come from the request, so no request can send a reader to another host.
- **After a rollback**: the deployed build still names `www` while `www` redirects to the bare
  domain, the same state (and the same search-engine consequence) as the merge-to-swap window. It
  is acceptable for the 24-hour retry window only. In that state the setup check is expected to
  report: "Live hosts" as a problem (old arrangement); DNS parity as a problem (the baseline's
  bare-domain placeholder is missing); Web Analytics possibly as a problem (`www` redirects); the
  contact bindings item complete (the `www` widget hostname may stay). No other item changes.
- **Branch previews**: unchanged. A non-main build still names its own preview address and stays
  noindex.
- **Local and test builds**: a build that cannot tell where it is served falls back to
  `https://www.doncoleman.ca` (today it falls back to the bare domain).
- **Mail**: the bare domain's mail, verification, DMARC and CAA records do not change. Adding a
  proxied placeholder address record on the bare domain does not affect mail.
- **Strict-transport policy**: the one-year policy with `includeSubDomains` is set by the
  site's header contract (`public/_headers`), so it is sent on responses the Worker's assets
  serve, which after the swap means `www`. It does not change. The bare domain's edge redirects
  carry no strict-transport header, so a first visit to `http://doncoleman.ca` makes one
  unprotected hop to HTTPS before reaching `www`, as a first visit to `http://www` does today;
  browsers that already hold the bare domain's policy keep it (covering `www`) for up to a year.
  This is accepted risk for this feature. Zone-level HSTS and HSTS preload are follow-up work
  (see Follow-up work), not in scope.
- **Accessibility**: no page markup, style, script, link text or alt text changes. The skip link
  and in-page anchors are fragment links (`#…`) and site navigation uses host-relative paths, so
  the host change cannot affect them. Principle X (WCAG 2.2 AA) is met by non-regression: the
  existing automated accessibility checks for every page template and the visual baselines run
  unchanged in the release gate, and no visual baseline changes. The redirects are server
  redirects (301) only, with no meta refresh, timed or script redirect, so they work for
  assistive technology, text-only clients and with JavaScript off. The not-found page reached
  from an unmapped Ghost address is the existing template, unchanged. The Turnstile widget,
  its embed, the form's focus order, error identification and error messages are unchanged on
  `www`; no new manual accessibility check is needed beyond Don's contact-form submission
  (SC-005).
- **User-visible text touched**: only the setup documentation (FR-014, FR-015) and the setup
  check's output for items 4, 15, 16 and 18, both read by Don. No text on the site changes. Prose
  that names the site "doncoleman.ca" (for example the contact form's "Please try again from
  doncoleman.ca.") is the site's name, not a link, and stays correct because `www.doncoleman.ca`
  is the same site.

## Requirements *(mandatory)*

### Functional Requirements

**Site address (repository)**

- **FR-001**: The production site's main address MUST be `https://www.doncoleman.ca`. Every
  absolute address the production build writes for the site's own host (canonical links,
  social-card URL and image addresses, structured data, sitemap entries, the sitemap index,
  the `robots.txt` sitemap line, feed and feed-item links, share links) MUST use it. The list
  names the kinds that exist today and is not a limit: by FR-003, any absolute address on the
  site's own host anywhere in the build output, including structured-data identifiers, `og:url`,
  feed item `<guid>` values and absolute links written in content files (Markdown or MDX), MUST
  use the main address. The site has no `hreflang` links (one language). `public/_headers` and
  `public/_redirects` hold no absolute addresses on the site's own host, and their redirect
  targets MUST stay host-relative.
- **FR-002**: A build that cannot determine where it is served MUST fall back to
  `https://www.doncoleman.ca`. Only the production build (the `main` branch build, selected by
  the site's existing build-environment resolution) names the main address; a branch (preview)
  build keeps naming its own preview address and MUST NOT name `https://www.doncoleman.ca` as its
  own address. The fallback applies only when the environment is unknown (local and test builds),
  never to a branch build whose preview address can be derived.
- **FR-003**: No production build output MUST name `https://doncoleman.ca` (the bare domain) as
  an address on the site's own host. An "address on the site's own host" is an absolute URL, in
  any build output file, whose host is `doncoleman.ca` or `www.doncoleman.ca`, with or without a
  scheme. Off-host links, email addresses on the domain (`…@doncoleman.ca`) and prose that names
  "doncoleman.ca" as the site's name are not addresses on the site's own host and do not change.
  Content files hold no bare-domain links today; one added later would break this requirement.
- **FR-004**: The old Ghost redirects (spec 030) MUST keep working unchanged on whichever host
  serves the site. Their targets stay host-relative, so on `www` each mapped old address answers
  one permanent redirect to its new address on `www`.

**Serving arrangement (live, after the swap)**

- **FR-005**: `https://www.doncoleman.ca` MUST serve the site directly over HTTPS with a valid
  certificate, as the Worker's Custom Domain. The Custom Domain stays a dashboard setting, as the
  bare-domain one is today; the Worker configuration in the repository does not change.
  `https://doncoleman.ca` MUST also present a valid certificate, so its redirect is answered over
  HTTPS without a warning. Both certificates are Cloudflare-managed edge certificates that
  Cloudflare issues and renews automatically; no manual renewal step exists, and the "Live hosts"
  item reports a certificate failure on either host.
- **FR-006**: `https://doncoleman.ca` MUST answer every request, for every method, with a single
  permanent (301) redirect to `https://www.doncoleman.ca` with the same path and query string,
  unchanged (no trailing slash added or removed, no re-encoding). The target scheme and host are
  fixed; only the path and query come from the request. `http://doncoleman.ca` MUST reach the
  same address either in one permanent redirect or in two permanent redirects through
  `https://doncoleman.ca`, with the path and query string unchanged at every hop. The rule matches
  on the host alone, on both schemes, so one hop is expected (on 2026-10-10 the zone's existing
  redirect rule ran before "Always Use HTTPS"); if Cloudflare runs "Always Use HTTPS" first, the
  two-hop chain is accepted. There MUST be no redirect loop and no interstitial page: every
  response before the final page is a 301 with a `Location` header, never a `200`, a meta
  refresh or a script redirect.
- **FR-006a**: Hop limits are defined here once, and every other section refers to them. Counts
  are redirects before the final response; HTTPS requests set the limit, and a request over
  `http://` to the bare domain may take one extra 301 to HTTPS.

  | Start | Ends on | Redirects |
  |---|---|---|
  | `https://www.doncoleman.ca/<p>` | the same URL | 0 |
  | `http://www.doncoleman.ca/<p>` | `https://www.doncoleman.ca/<p>` | exactly 1 |
  | `https://doncoleman.ca/<p>` | `https://www.doncoleman.ca/<p>` | exactly 1 |
  | `http://doncoleman.ca/<p>` | `https://www.doncoleman.ca/<p>` | 1, or 2 through `https://doncoleman.ca/<p>` |
  | old Ghost address on `https://www.doncoleman.ca` | its mapped page on `www` | exactly 1 |
  | old Ghost address on `https://doncoleman.ca` | its mapped page on `www` | at most 2 (bare to `www` keeping the path, then old to new) |

  `<p>` is the path and query string, unchanged at every hop. Every redirect is a 301.
- **FR-007**: The bare domain MUST have the proxied placeholder record `AAAA doncoleman.ca 100::`
  so that its redirect rule applies. `100::` is Cloudflare's documented originless placeholder
  and is the record the old `www` rule already uses; the other documented placeholder,
  `A 192.0.2.1`, works the same and is not used, so the zone keeps one placeholder form. The
  same record appears in FR-010, the Key Entities and the DNS baseline. The old `www` arrangement
  MUST be removed completely: the Single Redirect rule whose filter matches the host
  `www.doncoleman.ca` and whose target is the bare domain, and the proxied record
  `AAAA www.doncoleman.ca 100::`. If any other record exists on `www`, it MUST be removed too
  before the Custom Domain is attached (Cloudflare refuses to attach otherwise); after attaching,
  the only records on `www` are the ones the Custom Domain manages.
- **FR-008**: Every other DNS record (mail, verification, DMARC, CAA) MUST stay unchanged. This is
  confirmed by comparison, not by statement: the DNS parity item compares every record in the
  zone against the committed baseline (type, name, content, priority where it applies, and the
  proxied flag); any record on a name other than the apex and `www` that is not in the baseline
  is a difference. The baseline lists every mail, verification, DMARC and CAA record unchanged
  from before this feature. A complete DNS parity result after the swap proves FR-008 and SC-006.

**Setup check**

- **FR-009**: The setup check MUST gain a new after-merge item, "Live hosts" (making 18 items),
  confirming that the live hosts follow FR-005 and FR-006. It probes two paths, `/` and a fixed
  path with a query string (for example `/writing/?page=2`), on every host and scheme:
  `https://www.doncoleman.ca` returns the site's page over HTTPS without redirecting to another
  host; `http://www.doncoleman.ca` answers a single permanent redirect to the same path and query
  on `https://www.doncoleman.ca`; `https://doncoleman.ca` answers a single permanent redirect to
  the same path and query string on `https://www.doncoleman.ca`; and `http://doncoleman.ca`
  reaches that address in one permanent redirect or in two through `https://doncoleman.ca`
  (FR-006). It also requests one fixed old Ghost address from the spec 030 mapping on
  `https://www.doncoleman.ca` and on `https://doncoleman.ca`, and confirms each ends on its mapped
  page on `www` through permanent redirects only, within the FR-006a hop limits. The fixed
  address is `/drift/2025/self-contained-development-for-ghost-themes/`, mapped to
  `/writing/self-contained-development-for-ghost-themes/`; a repository test asserts that this
  mapping is still in the spec 030 redirect table, so a change to the mapping fails the release
  gate rather than the live check. "Serves the site" means a `200` whose page carries the site's
  canonical link on `https://www.doncoleman.ca`. It MUST report a problem, naming the failing
  host and the next step, for the old arrangement, a half-switched arrangement, a temporary
  redirect, a changed path or dropped query string, more hops than allowed here, a looping
  redirect, or a host that does not answer over HTTPS.
- **FR-009a**: The "Live hosts" item's results MUST be distinct and each carry a next step:
  - `complete`: every probe passes.
  - `pending`: `https://www.doncoleman.ca` fails the TLS handshake (certificate not issued yet);
    next step "wait a few minutes, then run the check again".
  - `missing` (reported as "Problem:"): any probe breaks a rule above. One detail line per failing
    probe names the start URL, each hop's status and `Location`, and the rule broken (temporary
    redirect, path changed, query dropped, too many redirects or loop, ends on the wrong host,
    a `200` that is not the site, a certificate failure on the bare domain). The next step points
    to the live-swap steps or the rollback steps in the setup documentation.
  - `could-not-check`: a request times out or the network fails. This is never reported as a
    misconfiguration; the next step is to check the connection and run the check again.
- **FR-009b**: The "Live hosts" item MUST be safe and bounded. It sends no credentials, cookies
  or tokens, and calls no Cloudflare API. It follows redirects itself, at most 3 per probe, so a
  looping or hostile chain ends as a "too many redirects" problem instead of hanging. It never
  requests a `Location` whose host is not `www.doncoleman.ca` or `doncoleman.ca`; such a redirect
  is reported as a problem and not followed. Each request has a 10-second timeout, and the item
  does not retry automatically (Don reruns it). Its output and logs hold only URLs, status codes
  and `Location` values; no secret appears in the setup-check output or in the documentation's
  examples for this item or the swap and rollback steps.
- **FR-010**: The committed DNS baseline MUST list the bare-domain placeholder record
  (`AAAA doncoleman.ca 100::`), and the
  DNS parity item MUST accept it only when it is proxied (all other baseline records stay DNS
  only). Records on the apex and `www` that are not in the baseline, which is where the Worker's
  Custom Domain adds its records, stay informational: they are neither required nor reported as
  problems, as today. A baseline record that exists with the wrong proxied flag is a problem in
  either direction (placeholder not proxied, or any other record proxied).
- **FR-011**: The Web Analytics item MUST check the beacon on the page served at
  `https://www.doncoleman.ca/`, not on the bare domain (which now only redirects).
- **FR-012**: The contact bindings item MUST require the spam-protection widget's hostnames to
  include `www.doncoleman.ca` (plus the existing preview host or its fallback). Whether the
  widget also lists the bare domain MUST NOT affect the result. Decision recorded: Cloudflare's
  Turnstile hostname documentation says a root-domain entry covers its subdomains, so the
  existing `doncoleman.ca` entry already allows `www`; the explicit `www.doncoleman.ca` entry is
  kept anyway because it names the served host directly, is checkable, and costs one dashboard
  edit (clarify answer and plan open question, 2026-10-10). Don need not remove the bare domain
  from the widget after the swap. The preview rules are unchanged: the widget lists the preview
  host `drc-dev.workers.dev`, or, if the dashboard refuses it, the existing preview fallback
  (preview-only test keys, recognised by the preview site-key build variable) is in use.
- **FR-013**: The setup check MUST confirm the new arrangement with the access it already has.
  It MUST NOT need a new Cloudflare token permission unless the plan shows the confirmation
  cannot be made from public responses. The data sources are, and are limited to: public HTTP(S)
  responses for "Live hosts" and the Web Analytics beacon; the existing read-only Cloudflare API
  reads for DNS records (which include each record's proxied flag), the Web Analytics site and
  the Turnstile widget's hostnames. Each of these reads is already granted to the existing
  read-only token, whose permission set does not widen.

**Documentation**

- **FR-014**: The setup documentation MUST describe `www.doncoleman.ca` as the main address,
  the bare domain as a redirect to it, and each changed setup-check item's "how it will be
  confirmed" text.
- **FR-015**: The setup documentation MUST give the ordered live-swap steps (User Story 4,
  scenario 1) and the rollback steps (User Story 4, scenario 2), including the Search Console
  sitemap resubmission and, after a rollback, the 24-hour retry window followed by a revert pull
  request if the swap still cannot be done. Don owns both the retry and the revert; the trigger is
  a rollback, or the swap not being complete 24 hours after the merge's production deploy. The
  steps follow the setup documentation's conventions: the item's usual headings, numbered lists
  for ordered steps, code formatting for record values, rule expressions and commands, and links
  named by their destination.
- **FR-015a**: Each live-swap step in the documentation MUST state its precondition, the signal
  Don sees when it is done, and its time bound:

  | Step | Precondition | Done when | Time bound |
  |---|---|---|---|
  | 0 Always Use HTTPS | merge deployed (production build names `www`) | setting shows on | 1 min |
  | 1 widget hostname | — | widget lists `www.doncoleman.ca` | 2 min |
  | 2 remove old `www` rule and record | step 1 | no rule matches `www`; no record on `www` | 3 min |
  | 3 attach Custom Domain to `www` | no record on `www` | `https://www.doncoleman.ca/` loads the site | 2 min plus up to 10 min certificate wait |
  | 4 detach bare Custom Domain | step 3 done | bare domain no longer listed under the Worker's domains | 2 min |
  | 5 bare placeholder and redirect | step 4 | record shows proxied; rule enabled | 5 min |
  | 6 setup check | step 5 | 18/18 complete | 3 min, including one rerun |
  | 7 Search Console | step 6 complete | sitemap shows submitted | 2 min, outside SC-004 |

  If `www` does not serve within 10 minutes of attaching the Custom Domain in step 3, Don stops
  and follows the rollback for the "after step 3" state.
- **FR-015b**: The rollback steps MUST cover every partial state, each undoing only what was done,
  in this order:
  - after step 1: nothing to undo (the `www` widget hostname is harmless and may stay);
  - after step 2: re-add `AAAA www.doncoleman.ca 100::` (proxied) and the `www` to bare rule
    (host `www.doncoleman.ca`, target `https://doncoleman.ca` plus the request path, 301, query
    kept);
  - after step 3: detach the Custom Domain from `www`, then as after step 2;
  - after step 4: re-attach the Custom Domain to the bare domain (no record exists there yet) and
    wait until it serves, then as after step 3;
  - after step 5 (full rollback): delete the bare-to-`www` rule and the bare placeholder record
    first (Cloudflare will not attach a Custom Domain to a hostname that has a record), then as
    after step 4.
  There is no point of no return: every dashboard step is reversible. The Search Console sitemap
  resubmission is not undone; after a rollback Search Console finds `www` redirecting until the
  retried swap, which does no lasting harm. After a rollback the setup check's expected results
  are those in the Edge Cases ("After a rollback").
- **FR-016**: Spec 011's statement that the bare domain is the main address (FR-010a) is
  superseded by this spec; per-issue history under `specs/` is not rewritten.

### Key Entities

- **Main address**: `https://www.doncoleman.ca`, the single origin the production site names
  for itself.
- **Bare-domain redirect**: a Cloudflare redirect rule on `doncoleman.ca`, applied through the
  proxied placeholder record `AAAA doncoleman.ca 100::`, sending every request to the same path and query on the main
  address. Reproducible definition: a Single Redirect rule whose filter matches the host
  `doncoleman.ca` exactly (any scheme), with a dynamic target of `https://www.doncoleman.ca`
  followed by the request path, status 301, and "preserve query string" on.
- **DNS baseline**: the committed list of records that must exist in the zone; gains the
  bare-domain placeholder record.
- **Spam-protection widget**: the contact form's widget, whose allowed hostnames must include
  `www.doncoleman.ca`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a production build, 100% of absolute addresses on the site's own host (FR-003)
  use `https://www.doncoleman.ca`, and 0 use the bare domain. The set measured is every text file
  in the production build output: every HTML page, the sitemap index and sitemaps, `robots.txt`,
  the feeds, and any other XML, JSON or text file. Image and font files hold no addresses and are
  not measured; the addresses that point at images are inside the measured files.
- **SC-002**: After the swap, 100% of addresses in the live sitemap load on `www`, and 100% of
  the same paths requested on `https://doncoleman.ca` reach them through exactly one permanent
  redirect with the path and query string unchanged (over `http://doncoleman.ca`, one or two
  permanent redirects, per FR-006 and FR-006a).
- **SC-003**: After the swap, 100% of the old Ghost addresses in the spec 030 mapping reach their
  new page on `www`: in one redirect from `https://www.doncoleman.ca`, in at most two from
  `https://doncoleman.ca` (the hop limit counts HTTPS requests only; a request over `http://`
  may take one extra permanent hop to HTTPS; FR-006a). The "Live hosts" item confirms this for one fixed
  old address on each host.
- **SC-004**: After the swap, the setup check reports every item complete on its first run once
  certificates are issued, and the sitting from first dashboard change to a complete setup check
  takes under 30 minutes. Budget by step (FR-015a): steps 0–2 about 6 minutes, step 3 up to
  12 minutes including the certificate wait, step 4 about 2 minutes, step 5 about 5 minutes,
  step 6 about 3 minutes; about 28 minutes in total. The Search Console step comes after the
  complete check and is outside this budget.
- **SC-005**: The contact form submits successfully from `https://www.doncoleman.ca/contact/`
  after the swap, end to end: the Turnstile challenge passes on `www`, the API's same-origin check
  accepts the request, the form shows its success message, and the email arrives at the fixed
  destination address, not marked as preview. Don does this once, by hand, as a post-merge step
  after the setup check is complete; any other outcome is a failed swap and is fixed or rolled
  back.
- **SC-006**: No DNS record outside the bare domain and `www` changes in the swap, confirmed by
  the DNS parity item reporting complete after the swap (FR-008).

## Assumptions

- Ghost's main address was `www.doncoleman.ca`, so moving to `www` needs no new redirect for
  inbound links beyond the bare-domain rule; Search Console already holds a property that covers
  `www` (the domain is verified by the zone's verification record). The Search Console action is
  a sitemap resubmission on that Domain property only
  (`https://www.doncoleman.ca/sitemap-index.xml`); the Change of Address tool is not used, because
  the site stays on the same domain. If Search Console turns out to hold only a URL-prefix
  property for the bare domain, Don adds a Domain property for `doncoleman.ca`, verified by the
  zone's existing verification record (no DNS change), and resubmits there.
- The Worker's Custom Domain can be attached to `www` in the dashboard the same way it is attached
  to the bare domain today, once no other DNS record exists on `www`; Cloudflare issues the `www`
  certificate automatically.
- The setup check confirms the live hosts from public HTTPS and HTTP responses, the same way it
  reads the served page for Web Analytics today; no new secret is needed.
- The contact and questions APIs compare a request's origin with its own host, so they work on
  `www` without change.
- The response-header contract (`public/_headers`), including the strict-transport policy, does
  not change.
- The live swap, the widget hostname change and the Search Console resubmission are done by Don
  in the dashboard after merge; the pull request lists them as post-merge steps.
- Preview deployments, the preview Worker and its addresses are out of scope and unchanged.

## Dependencies

- Spec 011 (launch) FR-010a is reversed: the bare domain is no longer the main address.
- Spec 030 (Ghost redirects): its host-relative redirect table is reused unchanged.
- Spec 033 (contact form email): unaffected; contact email still goes to the same fixed address.

## Follow-up work (out of scope)

- **Zone-level HSTS** (SSL/TLS → Edge Certificates) so the bare domain's edge redirects also carry
  the strict-transport policy, closing the unprotected first hop over `http://doncoleman.ca`.
  Owner: Don, as a separate reviewed change.
- **HSTS preload** for `doncoleman.ca`: not requested here; it would need zone-level HSTS first and
  is hard to undo.
- **Custom Domains in Worker configuration**: moving both Custom Domains into the committed Worker
  configuration together (ruled out for this feature by the 2026-10-10 clarification).
