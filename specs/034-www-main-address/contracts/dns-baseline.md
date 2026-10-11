# Contract: DNS baseline and the parity item (setup item 4)

## Schema (`dnsBaselineSchema`, strict)

Each record: `type`, `name`, `content`, `priority` (required for MX/SRV), `ttl`, and optional
`proxied: boolean`. Unknown keys are still rejected.

## Baseline content (FR-007, FR-008, FR-010)

The eleven existing records are unchanged and carry no `proxied` key. One record is added:

```json
{ "type": "AAAA", "name": "doncoleman.ca", "content": "100::", "priority": null, "ttl": 1, "proxied": true }
```

The baseline lists no record on `www`.

## Matching rules (`evaluateDnsParity`)

| Baseline `proxied` | Zone record proxied | Result |
|---|---|---|
| absent / `false` | `false` | match |
| absent / `false` | `true` | problem: "proxied is on, expected DNS only (grey cloud)" (unchanged) |
| `true` | `true` | match |
| `true` | `false` | problem: "proxied is off, expected proxied (orange cloud)" |

- Missing placeholder → "AAAA doncoleman.ca 100::: not found in Cloudflare"; different content →
  "no Cloudflare record with this content (found: …)". Both make the item `missing`.
- Unmatched zone records on the apex and `www` (Custom Domain records) stay informational, listed
  as "Cloudflare-only, not in baseline: …". Any other unmatched name is a problem (unchanged).
- TTL stays informational.

## Docs

`docs/setup.md#dns-records-parity` "Where to do it" and "How it will be confirmed" say every
record is DNS only **except** the bare-domain placeholder, which must be proxied; the registry
`confirmedBy` text says the same.

## Test layer

Unit: `tests/unit/setup/dns-baseline-schema.test.ts` (schema accepts `proxied`; real baseline has
the placeholder, proxied, and no `www` record) and
`tests/unit/setup-check/checks/dns-records-parity.test.ts` (the four table rows, missing and
changed placeholder).
