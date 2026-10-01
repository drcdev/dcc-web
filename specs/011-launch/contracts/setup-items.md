# Contract: setup-check items for the launch

This contract covers the setup-check items that change and the items that are new. Every item
keeps the existing `CheckResult` shape (see `scripts/setup-check/types.ts`). Each result is
labelled `Step N of 32`, and its `docs` points to `docs/setup.md#<id>`.

All public-DNS reads in these items use `dns.resolveEach(name, type)` and query 1.1.1.1 and
8.8.8.8 separately (research R7). A **settling** answer is one of two things: the two resolvers
disagree, or either resolver still returns a Ghost web target from the baseline. A **TLS
failure** is an `HttpReader` error with `kind: "tls"`. HTTP probes that need a redirect's raw
`Location` header use `http.get(url, { redirect: "manual" })`.

`detectLaunchPhase(ctx)` is described in data-model.md. When it cannot read the phase, every
item that depends on it returns `could-not-check`. The reason names the missing `.env` name or
the access problem.

## New status: `waiting`

- Only items with `postLaunch: true` return it, and only while the phase is `before-switch`.
- The summary starts with `Waiting for the switch: …`. The `nextAction` is
  `Nothing to do yet. Follow docs/launch.md Part C when the readiness checklist is complete.`
- The report counts it in `counts.waiting`, the human output prints it as `waiting`, and
  `ok` does not count it as a failure.

## Changed items

### 4. `dns-records-parity`

The existing rules are unchanged, with one exception. When the phase is `switched`, the Ghost
web records are not expected in the zone. Each one adds a detail:
`<TYPE> <name> <content>: replaced at launch, kept in the baseline for rollback`. Cloudflare
records that the switch adds, such as `AAAA www 100::` (proxied), stay informational
(`Cloudflare-only, not in baseline: …`). When the phase cannot be read, the item is
`could-not-check`.

### 6. `live-domain-ghost`, titled "Live domain: Ghost or switched"

| Condition | Status | Summary |
|---|---|---|
| Phase `switched` | complete | `Switched to the new site on purpose (Custom Domain doncoleman.ca on dcc-web); the Ghost comparison applies again only during a rollback.` |
| Phase `before-switch`, apex and `www` A/AAAA/CNAME answers equal the Ghost baseline | complete | `The live domain still resolves to the recorded Ghost targets.` |
| Phase `before-switch`, any difference | missing | `Problem: the live domain does not match the recorded Ghost baseline.` The details list each difference. `nextAction` points to `docs/launch.md#rollback` |
| No Ghost web records in the baseline and phase `before-switch` | missing | Unchanged |

The MX and TXT comparison is removed from this item and moves to item 32. The Ghost-marker
detail stays informational.

### 16. `review-address-removed` (replaces `review-address`)

| Condition | Status |
|---|---|
| Phase `before-switch` | waiting (`Waiting for the switch: new.doncoleman.ca stays until the bare domain is live.`) |
| A Custom Domain for `reviewHost` still exists on any Worker | missing, `nextAction` gives the dashboard path to remove it |
| No Custom Domain, but a resolver still answers A/AAAA/CNAME for `reviewHost` | pending (cached answers expire within the record's TTL) |
| No Custom Domain, and both resolvers return no answer | complete |

`postLaunch: true`. `dependsOn: ["dns-nameservers"]`.

### 17. `preview-noindex` (replaces `review-address-noindex`)

The item sends GET requests to `https://<workerName>.<workersSubdomain>.workers.dev/` and
`/projects/`, and to the same paths on `https://<previewWorkerName>.<workersSubdomain>.workers.dev`.
It is complete when every response carries `X-Robots-Tag` containing `noindex`. It is missing
when any response lacks it, and the details list each host and path.
`nextAction`: `Confirm public/_headers has the https://:worker.:subdomain.workers.dev/* noindex rule and redeploy.`
The item keeps the existing docs guidance (Search Console removal, never block crawling with
robots.txt), now framed for previews. It does not depend on the phase.

### 18. `web-analytics`

The host checked is the zone apex when the phase is `switched`, and `reviewHost` otherwise. The
rest of the item is unchanged. `dependsOn` becomes `[]`.

## New items (the "Launch" part of `docs/setup.md`)

### 26. `launch-content-ready`, titled "Launch content ready" (FR-003, FR-003a)

This item reads repository files only, through `RepoReader`.

- Every id in `setup/config.json` `launch.expectedPages` has a file
  `src/content/pages/<id>.mdx` whose frontmatter does not set `draft: true`.
- No non-draft file in `src/content/pages/*.mdx` contains `placeholder copy`
  (case-insensitive).
- No non-draft file in `src/content/projects/*.mdx` has a frontmatter line
  `placeholder: true`.

Results:

| Condition | Status |
|---|---|
| All three rules pass | complete |
| Any rule fails | missing. Summary: `<n> launch content problem(s).` The details have one line per problem, for example `services: page is still a draft`, `speaking: still says "placeholder copy"` or `focus-pocus: project visual marked placeholder`. `nextAction`: `Replace the placeholder copy and publish the page (draft: false), then run this check again.` |
| `launch.expectedPages` is missing | missing, naming the config field |

### 27. `launch-main-checks`, titled "Main branch checks passing" (FR-003, FR-004)

The item reads `GET repos/{owner}/{repo}/commits/main/check-runs?check_name=verify` and takes the
newest run.

| Condition | Status |
|---|---|
| The newest `verify` run on main is completed with conclusion `success` | complete |
| The newest run is still in progress | pending |
| Any other conclusion | missing, with the run URL |
| No run, or the read failed | missing or could-not-check |

### 28. `live-apex`, titled "Bare domain serves the new site" (FR-013, FR-018, FR-010a)

`postLaunch: true`. Checks run in this order once the phase is `switched`:

1. Public A/AAAA/CNAME for the apex is settling → pending (`DNS for doncoleman.ca is still settling.`).
2. `GET https://doncoleman.ca/` (manual redirect) fails with a TLS error → pending
   (`The certificate for doncoleman.ca is not issued yet.`). Any other network failure →
   could-not-check.
3. Problem (missing, `Problem: …`) unless all of these hold:
   - the status is 200;
   - the body has `<link rel="canonical" href="https://doncoleman.ca/">`;
   - there is no `X-Robots-Tag` header containing `noindex`;
   - there is no `<meta name="robots" content="noindex">`;
   - the body does not contain the Ghost marker.

   The details name each failed condition. `nextAction` points to `docs/launch.md#rollback` when
   the page is not the new site, and to the indexing contract when only the noindex rule fails.
4. `GET http://doncoleman.ca/` (manual redirect) must return 301 or 308 to
   `https://doncoleman.ca/`. If not, the item is missing, and `nextAction` is "turn on Always
   Use HTTPS".
5. Otherwise → complete.

### 29. `live-www-redirect`, titled "www redirects to the bare domain" (FR-010a, FR-013)

`postLaunch: true`. Once switched:

1. `www.` + zone is settling (a resolver still returns the Ghost CNAME) → pending.
2. `GET https://www.doncoleman.ca/about/?launch-check=1` (manual redirect) fails with a TLS
   error → pending.
3. Status 301 with `Location` exactly `https://doncoleman.ca/about/?launch-check=1` → complete.
   Anything else → missing (`Problem: www does not permanently redirect to the bare domain.`),
   with the status and `Location` found. `nextAction` gives the Redirect Rule settings from
   docs/launch.md L12.

### 30. `live-sitemap`, titled "Live sitemap pages load" (FR-014, FR-010a)

`postLaunch: true`. Once switched, and unless DNS is settling (pending), the item runs the
crawler (contracts/site-check.md) with `base = expectOrigin = https://doncoleman.ca`,
`checkLinks: false`, through an `HttpReader` adapter. It also checks two more things:

- `robots.txt` names `Sitemap: https://doncoleman.ca/sitemap-index.xml`;
- every path in `launch.expectedPaths` appears in the sitemap.

| Condition | Status |
|---|---|
| No failures | complete (`All <n> sitemap pages on doncoleman.ca return a page.`) |
| Any failure | missing, with one detail per failure (`/path/: returned 404`) |

### 31. `live-contact-endpoint`, titled "Live contact endpoint responds" (FR-015)

`postLaunch: true`. Once switched, the item sends `GET https://doncoleman.ca/api/contact`
(manual redirect). It is complete when all of these hold:

- the status is 405;
- `Allow` is `POST`;
- the body parses as JSON `{ ok: false, error: "method_not_allowed" }`.

That response proves the Worker answers `/api/*` on the apex. It never sends a POST. A TLS
failure → pending. Anything else → missing (`Problem: …`), naming the status received.

### 32. `mail-records`, titled "Mail records unchanged" (FR-016, SC-004)

The item always applies, before and after the switch. For each mail record group in the
baseline (data-model.md), each resolver's answer set must equal the baseline set: MX is compared
as `priority:host`, TXT is joined and normalised, CNAME has no trailing dot and is lower-case.

| Condition | Status |
|---|---|
| Every group matches at both resolvers | complete. The details list any dropped baseline record that still answers, as information |
| The resolvers disagree for a group, and one of them matches the baseline | pending |
| Any other difference | missing (`Problem: mail records differ from the baseline.`), one detail per difference. `nextAction`: `Restore the record in Cloudflare → DNS exactly as listed; if the switch caused it, follow docs/launch.md#rollback.` |

## Report and schema changes

- `CheckStatus` adds `waiting`. `CheckReportCounts` adds `waiting`. `ok` treats `waiting` as
  not failing.
- The human formatter prints `waiting` in its own colour and adds `<w> waiting for the switch`
  to the summary line.
- `--json` output follows the updated zod schema in `scripts/setup-check/schemas.ts`. That
  schema now supersedes `specs/001-setup-walkthrough/contracts/check-report.schema.json` for the
  status enum and counts.
- The `/setup-walkthrough` skill treats `waiting` like a completed step: one line, no pause.
  When it reaches item 26 it hands over to `docs/launch.md`, walking those steps in order with
  the same three-answer pause (`Done — check it`, `Skip for now`, `Stop here`).
