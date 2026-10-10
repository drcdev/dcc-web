# Contract: setup check and walkthrough changes

All reads stay read-only and names-only (feature 001 rules). No check ever reads a secret value.

## New item 17: `contact-email` ("Contact email")

| Field | Value |
|---|---|
| order | 17 |
| phase | `before-merge` (the binding's destination must be verified before the first deploy that carries it) |
| needsDon | `true` |
| principles | `VII`, `VIII`, `IX` |
| dependsOn | `local-credentials`, `cloudflare-zone`, `mail-records` |
| secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (names only) |
| docs anchor | `docs/setup.md#contact-email` |

Parts (one run shows every gap, like item 16):

1. **Destination verified**: `cloudflare.listEmailRoutingAddresses(accountId)` (new read-only
   provider method over `client.emailRouting.addresses.list`) contains the address from
   `wrangler.jsonc` `send_email[0].destination_address` with a non-empty `verified` timestamp.
   Missing → "not added"; present but unverified → "waiting for the verification link".
   An authorisation error → could-not-check naming the **Email Routing Addresses: Read** permission.
2. **Sending subdomain records**: the DNS reader (public resolvers) answers MX for the subdomain of
   `allowed_sender_addresses[0]` (`mail.doncoleman.ca`) with Cloudflare routing hosts
   (`route1/2/3.mx.cloudflare.net`) and a TXT SPF record containing `include:_spf.mx.cloudflare.net`.
   Missing → "Email Routing is not on for mail.doncoleman.ca".
3. **Apex untouched** is not re-checked here: the item's text points to item 5 (`mail-records`),
   which fails if any apex iCloud record changes.

Complete summary: "Email Routing is on for mail.doncoleman.ca and contact@doncoleman.ca is
verified." Next action when missing: the walkthrough step for that part.

## Item 16 `contact-bindings` changes

- `REQUIRED_WORKER_SECRETS` → `["TURNSTILE_SECRET_KEY"]`; purpose/where/confirmedBy text says one
  secret.
- Production deploy part: no longer requires a cron. A cron still registered on `dcc-web` after
  the deploy is reported as a problem ("the Cron Trigger should have been removed by the last
  deploy; retry the latest main build").
- `ContactConfig.productionCron` and `DEFAULT_CRON` removed; `secrets` field drops the two names.
- Databases part unchanged (D1 serves the questions feature); its text stops calling them the
  contact databases.

## Secret manifest (`scripts/setup-check/secrets.ts`)

- Remove `CONTACT_READ_TOKEN` and `IP_HASH_SALT`.
- `CLOUDFLARE_API_TOKEN.permissions` adds "Email Routing Addresses Read"; `usedBy` adds
  `contact-email`. `CLOUDFLARE_ACCOUNT_ID.usedBy` adds `contact-email`.
- `tests/unit/setup/drift.test.ts` keeps proving every name in wrangler, workflows and
  `.env.example` is in the manifest.

## DNS baseline (`setup/dns-baseline.json`)

Adds the records Cloudflare created on `mail.doncoleman.ca` (MX ×3, SPF TXT, and the DKIM TXT
if routing adds one), copied exactly from the dashboard or `wrangler email routing dns get`
output after Don's step. Apex records unchanged. Items 4 (`dns-records-parity`) and 5
(`mail-records`) then cover them without code changes.

## Walkthrough and docs

`docs/setup.md` gains `## 17. Contact email {#contact-email}` and the walkthrough skill a matching
step, each saying what to do, where, and how to confirm:

1. Cloudflare dashboard → Compute → Email Service → Email Routing → `doncoleman.ca` → Settings →
   Subdomains: add `mail`. **Stop if the dashboard offers to add, change or remove any record on
   `doncoleman.ca` itself (MX, SPF, DKIM)**; report it, choose a fallback (research R3).
2. Email Routing → Destination addresses: add `contact@doncoleman.ca`; open the verification link
   in that mailbox.
3. Tell the agent; it copies the subdomain records into the DNS baseline.
4. `pnpm run setup:check`: items 4, 5 and 17 pass.
5. Token: add Account → Email Routing Addresses: Read to the read-only token.

After release (follow-up, Don): `pnpm exec wrangler secret delete CONTACT_READ_TOKEN` and
`IP_HASH_SALT`, each for both Workers (`--env preview` for the preview Worker), using the
`--env-file /dev/null` rule from the walkthrough.
