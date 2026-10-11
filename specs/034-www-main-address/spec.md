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
3. **Given** the live swap is done, **When** a reader requests `https://doncoleman.ca/<path>?<query>`
   or `http://doncoleman.ca/<path>?<query>`, **Then** the response is a single permanent (301)
   redirect to `https://www.doncoleman.ca/<path>?<query>`, with the path and query string
   unchanged (no trailing slash added or removed).
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
2. **Given** the live swap is done, **When** a reader requests an old Ghost address on the bare
   domain, **Then** they reach the mapped new address on `https://www.doncoleman.ca` through at
   most two permanent redirects (bare to `www`, then old to new path), and it loads.
3. **Given** an unmapped Ghost address on either host, **When** it is requested, **Then** the
   reader ends on the site's not-found page on `www` (unchanged from spec 030).

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

1. **Given** `www` serves the site and the bare domain redirects to it as required, **When** Don
   runs the setup check, **Then** the item confirming the live hosts reports complete.
2. **Given** the old arrangement (bare domain serves, `www` redirects to bare), **When** Don runs
   the setup check, **Then** that item reports a problem naming what is wrong and the next step.
3. **Given** only half the swap is done (for example `www` serves the site but the bare domain
   has no redirect, or the bare domain redirects to a different path, drops the query string,
   uses a temporary redirect, or redirects in more than one hop), **When** Don runs the setup
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
   ordered steps for the swap: allow `www` in the spam-protection widget; move the Custom Domain
   from the bare domain to `www`; add the bare-domain placeholder record (proxied) and a permanent
   redirect rule to `www` that keeps the path and query string; remove the old `www` to bare rule
   and its record; run the setup check; resubmit the sitemap in Search Console.
2. **Given** the swap cannot be completed in the sitting, **When** Don follows the rollback steps,
   **Then** the bare domain serves the site again and `www` redirects to it, as before the swap.

### Edge Cases

- **Window between merge and swap**: the deployed build names `www` while `www` still redirects
  to the bare domain. Readers are unaffected (pages still load on the bare domain); search engines
  briefly see canonical links pointing at a redirecting host. The swap should follow the merge
  within the same day. The setup check reports the live-hosts item as a problem during this
  window, which is expected.
- **Downtime during the sitting**: between removing the Custom Domain from the bare domain and
  adding its redirect, or before the `www` certificate is issued, one host may briefly fail. The
  steps are ordered to keep this to minutes, and the setup check reports a not-yet-issued
  certificate as a problem with "wait and run again" as the next step.
- **Redirect loop**: if the old `www` to bare rule is left in place while the new bare to `www`
  rule is added, requests loop. The setup check detects a redirect that does not end on a served
  page and reports it.
- **Query strings and trailing slashes**: the bare-domain redirect keeps both exactly; for
  example `/writing/?page=2` stays `/writing/?page=2` and `/about` stays `/about` (the site's own
  trailing-slash handling then applies on `www`).
- **Paths under `/api/`**: the bare-domain redirect applies to every path. The contact form and
  questions panel are served from `www` and call `/api/` on `www`, so their same-origin checks
  pass without change. A program calling the bare domain's `/api/` gets a redirect and must use
  `www`.
- **Branch previews**: unchanged. A non-main build still names its own preview address and stays
  noindex.
- **Local and test builds**: a build that cannot tell where it is served falls back to
  `https://www.doncoleman.ca` (today it falls back to the bare domain).
- **Mail**: the bare domain's mail, verification, DMARC and CAA records do not change. Adding a
  proxied placeholder address record on the bare domain does not affect mail.
- **Strict-transport policy**: the existing one-year policy with `includeSubDomains` already
  covers `www`; it does not change.

## Requirements *(mandatory)*

### Functional Requirements

**Site address (repository)**

- **FR-001**: The production site's main address MUST be `https://www.doncoleman.ca`. Every
  absolute address the production build writes for the site's own host (canonical links,
  social-card URL and image addresses, structured data, sitemap entries, the sitemap index,
  the `robots.txt` sitemap line, feed and feed-item links, share links) MUST use it.
- **FR-002**: A build that cannot determine where it is served MUST fall back to
  `https://www.doncoleman.ca`. Branch (preview) builds keep naming their own preview address.
- **FR-003**: No production build output MUST name `https://doncoleman.ca` (the bare domain) as
  an address on the site's own host. Prose that names "doncoleman.ca" as the site's name, and
  email addresses on the domain, are not addresses and do not change.
- **FR-004**: The old Ghost redirects (spec 030) MUST keep working unchanged on whichever host
  serves the site. Their targets stay host-relative, so on `www` each mapped old address answers
  one permanent redirect to its new address on `www`.

**Serving arrangement (live, after the swap)**

- **FR-005**: `https://www.doncoleman.ca` MUST serve the site directly over HTTPS with a valid
  certificate, as the Worker's Custom Domain.
- **FR-006**: `https://doncoleman.ca` and `http://doncoleman.ca` MUST answer every request with
  a single permanent (301) redirect to `https://www.doncoleman.ca` with the same path and query
  string, unchanged. There MUST be no redirect loop and no interstitial page.
- **FR-007**: The bare domain MUST have a proxied placeholder address record so that its redirect
  rule applies. The old `www` to bare redirect rule and its placeholder record MUST be removed.
- **FR-008**: Every other DNS record (mail, verification, DMARC, CAA) MUST stay unchanged.

**Setup check**

- **FR-009**: The setup check MUST include a confirmation that the live hosts follow FR-005 and
  FR-006: `https://www.doncoleman.ca/` returns the site's page over HTTPS without redirecting
  to another host, and the bare domain (over both `https://` and `http://`) answers a single
  permanent redirect to the same path and query string on `https://www.doncoleman.ca`. It MUST
  report a problem, naming the failing host and the next step, for the old arrangement, a
  half-switched arrangement, a temporary redirect, a changed path or dropped query string, a
  multi-hop or looping redirect, or a host that does not answer over HTTPS.
- **FR-010**: The committed DNS baseline MUST list the bare-domain placeholder record, and the
  DNS parity item MUST accept it only when it is proxied (all other baseline records stay DNS
  only). Records the Worker's Custom Domain adds on `www` stay informational, as Custom Domain
  records on the apex and `www` are today.
- **FR-011**: The Web Analytics item MUST check the beacon on the page served at
  `https://www.doncoleman.ca/`, not on the bare domain (which now only redirects).
- **FR-012**: The contact bindings item MUST require the spam-protection widget's hostnames to
  include `www.doncoleman.ca` (plus the existing preview host or its fallback). Whether the
  widget also lists the bare domain MUST NOT affect the result.
- **FR-013**: The setup check MUST confirm the new arrangement with the access it already has.
  It MUST NOT need a new Cloudflare token permission unless the plan shows the confirmation
  cannot be made from public responses.

**Documentation**

- **FR-014**: The setup documentation MUST describe `www.doncoleman.ca` as the main address,
  the bare domain as a redirect to it, and each changed setup-check item's "how it will be
  confirmed" text.
- **FR-015**: The setup documentation MUST give the ordered live-swap steps (User Story 4,
  scenario 1) and the rollback steps (User Story 4, scenario 2), including the Search Console
  sitemap resubmission.
- **FR-016**: Spec 011's statement that the bare domain is the main address (FR-010a) is
  superseded by this spec; per-issue history under `specs/` is not rewritten.

### Key Entities

- **Main address**: `https://www.doncoleman.ca`, the single origin the production site names
  for itself.
- **Bare-domain redirect**: a Cloudflare redirect rule on `doncoleman.ca`, applied through a
  proxied placeholder record, sending every request to the same path and query on the main
  address.
- **DNS baseline**: the committed list of records that must exist in the zone; gains the
  bare-domain placeholder record.
- **Spam-protection widget**: the contact form's widget, whose allowed hostnames must include
  `www.doncoleman.ca`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a production build, 100% of absolute addresses on the site's own host use
  `https://www.doncoleman.ca`, and 0 use the bare domain.
- **SC-002**: After the swap, 100% of addresses in the live sitemap load on `www`, and 100% of
  the same paths requested on the bare domain reach them through exactly one permanent redirect
  with the path and query string unchanged.
- **SC-003**: After the swap, 100% of the old Ghost addresses in the spec 030 mapping reach their
  new page on `www`: in one redirect from `www`, in at most two from the bare domain.
- **SC-004**: After the swap, the setup check reports every item complete on its first run once
  certificates are issued, and the sitting from first dashboard change to a complete setup check
  takes under 30 minutes.
- **SC-005**: The contact form submits successfully from `https://www.doncoleman.ca/contact/`
  after the swap.
- **SC-006**: No DNS record outside the bare domain and `www` changes in the swap.

## Assumptions

- Ghost's main address was `www.doncoleman.ca`, so moving to `www` needs no new redirect for
  inbound links beyond the bare-domain rule; Search Console already holds a property that covers
  `www` (the domain is verified by the zone's verification record).
- The Worker's Custom Domain can be attached to `www` the same way it is attached to the bare
  domain today; Cloudflare issues the `www` certificate automatically.
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
