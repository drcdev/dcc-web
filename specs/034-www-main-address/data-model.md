# Data model: Make www.doncoleman.ca the main address

No database, content collection or Worker binding changes. The entities are configuration
values, one committed JSON file, one setup-registry entry and the check's internal probe records.

## Main origin (constant)

| Field | Value | Where |
|---|---|---|
| `FALLBACK_ORIGIN` | `https://www.doncoleman.ca` (was `https://doncoleman.ca`) | `src/lib/site-origin.ts` |

- Returned by `resolveSiteOrigin` for a `main` Workers Builds build and for every build that
  cannot determine its address; preview builds keep `https://<alias>-dcc-web-preview.drc-dev.workers.dev`.
- Read by `astro.config.mjs` (`site`) and, new, by the setup check (`new URL(FALLBACK_ORIGIN).host`
  = main host). Contract: [contracts/site-origin.md](./contracts/site-origin.md).

## Bare host

`setup/config.json` `zone` (`doncoleman.ca`), unchanged. The bare host is the zone apex.

## DNS baseline record (`setup/dns-baseline.json`)

| Field | Type | Rule |
|---|---|---|
| `type` | `A` · `AAAA` · `CNAME` · `MX` · `TXT` · `SRV` · `CAA` · `NS` | unchanged |
| `name` | string | unchanged |
| `content` | string | unchanged |
| `priority` | integer or null | required for MX/SRV (unchanged) |
| `ttl` | positive integer | informational only (unchanged) |
| `proxied` | boolean, **optional, new** | absent means `false`; the parity item requires the zone record's proxy state to equal it |

New record: `{ "type": "AAAA", "name": "doncoleman.ca", "content": "100::", "priority": null, "ttl": 1, "proxied": true }`.
All other records stay without `proxied` (DNS only). Contract:
[contracts/dns-baseline.md](./contracts/dns-baseline.md).

## Setup item `live-hosts` (registry entry)

| Field | Value |
|---|---|
| `id` | `live-hosts` |
| `order` | 18 (last; `contact-email` stays 17) |
| `title` | Live hosts |
| `phase` | `after-merge` |
| `needsDon` | `true` (the swap is a dashboard sitting) |
| `principles` | `VIII`, `X` |
| `requirements` | `FR-005`, `FR-006`, `FR-007`, `FR-009`, `SC-002`, `SC-003` |
| `secrets` | none |
| `dependsOn` | none |

Registry total becomes **18** items. Contract: [contracts/setup-check.md](./contracts/setup-check.md).

## Probe (internal to the check)

| Field | Meaning |
|---|---|
| `start` | absolute URL requested first, e.g. `https://doncoleman.ca/writing/?page=2` |
| `expectedEnd` | absolute URL the chain must end on, on `https://www.doncoleman.ca` |
| `allowedHops` | the accepted redirect counts, e.g. `[1]` or `[1, 2]` |
| `via` | for a 2-hop allowance, the required middle URL (e.g. `https://doncoleman.ca/<p>?<q>`); absent means any 2-hop chain is rejected |
| `hops` | recorded `{ url, status, location }` per response, up to 3 redirects |

Outcome per probe: `ok`, `tls` (certificate not issued on the start host), or a problem string
naming the start URL and what it answered.

### Probe table (fixed)

Paths `P` = `/` and `/writing/?page=2`; Ghost `G` = `/drift/2025/self-contained-development-for-ghost-themes/`,
mapped `M` = `/writing/self-contained-development-for-ghost-themes/`.

| Start | Expected end | Hops | Final response |
|---|---|---|---|
| `https://www.doncoleman.ca{P}` | same URL | 0 | 200 + canonical on `https://www.doncoleman.ca/` |
| `http://www.doncoleman.ca{P}` | `https://www.doncoleman.ca{P}` | 1 | 301 then 200 |
| `https://doncoleman.ca{P}` | `https://www.doncoleman.ca{P}` | 1 | 301 then 200 |
| `http://doncoleman.ca{P}` | `https://www.doncoleman.ca{P}` | 1, or 2 via `https://doncoleman.ca{P}` | all 301, then 200 |
| `https://www.doncoleman.ca{G}` | `https://www.doncoleman.ca{M}` | 1 | 301 then 200 |
| `https://doncoleman.ca{G}` | `https://www.doncoleman.ca{M}` | ≤ 2 | all 301, then 200 |

That is 10 probes, each at most 4 requests (3 redirects + final), all GET with `redirect: "manual"`.

## State transitions (live hosts)

```text
old (bare serves, www→bare) ──swap steps 1–3──▶ both serve-ish (www serves, bare serves)
   ──step 4–5──▶ new (www serves, bare→www) ──setup check──▶ live-hosts complete
any state ──rollback──▶ old
```

The check reports `missing` for every state except "new", and `pending` while the `www`
certificate is not yet issued.
