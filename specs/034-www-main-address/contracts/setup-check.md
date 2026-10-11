# Contract: setup-check changes

The registry grows from 17 to 18 items. Items 1–17 keep their ids, orders and phases.

## Item 18 `live-hosts` (new, after-merge) — FR-009, FR-013

Needs no credentials and no Cloudflare API call. Uses `ctx.http.get(url, { redirect: "manual" })`
only. Main host = `new URL(FALLBACK_ORIGIN).host`; bare host = `setup/config.json` `zone`.

### Probes

The ten probes in [data-model.md](../data-model.md#probe-table-fixed). For each, the check
requests the start URL, and while the response is a redirect (301, 302, 303, 307, 308) resolves
`Location` against the request URL and requests it, stopping after 3 redirects.

A probe passes only when:

1. every redirect in the chain is **301**;
2. the number of redirects is one the probe allows, and a 2-hop `http://doncoleman.ca` chain goes
   through `https://doncoleman.ca` with the same path and query;
3. each redirect from the bare host to `www` keeps the path and query string byte for byte;
4. the chain ends on the expected URL exactly (scheme, host, path, query);
5. the final response is `200` and its body contains
   `<link rel="canonical" href="https://www.doncoleman.ca/`.

### Results

| Situation | Status | Summary / next action |
|---|---|---|
| all ten probes pass | `complete` | "www.doncoleman.ca serves the site; the bare domain and http redirect to it permanently, keeping the path and query; the old Ghost address reaches its page on www." |
| `https://www.doncoleman.ca/` fails the TLS handshake | `pending` | "The certificate for www.doncoleman.ca is not issued yet." / "Wait a few minutes for Cloudflare to issue it, then run the check again." |
| any probe fails otherwise | `missing` | "Problem: the live hosts do not match the main-address arrangement." / "Finish the live swap in docs/setup.md#live-hosts (or roll back as described there), then run the check again." Details: one line per failing probe: start URL, each hop's status and Location, and the rule broken (e.g. "302, expected 301", "query string dropped", "ends on https://doncoleman.ca/, expected https://www.doncoleman.ca/", "more than 3 redirects (loop?)", "200 without the site's canonical link"). |
| request times out or the network fails | `could-not-check` | via `fromProviderError`, "Check the network connection, then run this check again." |

Named cases that must be `missing` (spec US3 scenarios 2–3): old arrangement; `www` serves but
bare still serves (no redirect); bare redirects to a different path; bare drops the query; bare
uses 302; bare takes 2 HTTPS hops; loop between bare and `www`; `http://www` not redirected.

### Registry text

- `purpose`: "The site's main address is www.doncoleman.ca: www serves the site, and the bare domain and http requests redirect to it permanently."
- `where`: "Cloudflare dashboard, in one sitting after the pull request merges: the live swap steps in docs/setup.md#live-hosts."
- `confirmedBy`: "https://www.doncoleman.ca serves / and /writing/?page=2 directly; http://www, https://doncoleman.ca and http://doncoleman.ca redirect there with 301s within the hop limits, keeping the path and query; the old Ghost address /drift/2025/self-contained-development-for-ghost-themes/ reaches its new page on www from both hosts"

## Item 15 `web-analytics` — FR-011

Site lookup unchanged (zone). The beacon probe fetches `https://www.doncoleman.ca/` (was
`https://doncoleman.ca/`). Summary texts name `www.doncoleman.ca` for the served page.
`confirmedBy`: "…; the served HTML of https://www.doncoleman.ca/ references the Cloudflare beacon".

## Item 16 `contact-bindings` (Turnstile part) — FR-012

`PRODUCTION_HOST` becomes the main host (`www.doncoleman.ca`). Rules:

| Widget hostnames | Result for this part |
|---|---|
| include `www.doncoleman.ca` (with or without `doncoleman.ca`) | pass |
| `doncoleman.ca` only, no `www.doncoleman.ca` | problem: "The widget's hostnames do not include www.doncoleman.ca." |

Preview-host rules unchanged. The fix text names `www.doncoleman.ca` and `drc-dev.workers.dev`.

## Item 4 `dns-records-parity` — FR-010

See [dns-baseline.md](./dns-baseline.md).

## Unchanged

`local-credentials` token permissions (FR-013), `mail-records`, all other items.

## Test layer

Unit, with injected `http` readers returning recorded responses (no network):
`tests/unit/setup-check/checks/live-hosts.test.ts` (new), updated `web-analytics.test.ts`,
`contact-bindings.test.ts`, `dns-records-parity.test.ts`; registry and docs drift in
`tests/unit/setup/items.test.ts`, `docs-structure.test.ts`, `drift.test.ts`;
`report.test.ts` for 18 items. A unit test also asserts the Ghost probe's mapping line exists in
`public/_redirects`.
