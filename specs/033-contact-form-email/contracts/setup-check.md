# Contract: setup check and walkthrough changes

All reads stay read-only and names-only (feature 001 rules). No check ever reads a secret value.

## New item 17: `contact-email` ("Contact email")

| Field | Value |
|---|---|
| order | 17 |
| phase | `before-merge` (the binding's destination must be verified before the first deploy that carries it) |
| needsDon | `true` |
| principles | `VII`, `VIII`, `IX` |
| dependsOn | `local-credentials` |
| secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (names only) |
| docs anchor | `docs/setup.md#contact-email` |

Parts (one run shows every gap, like item 16):

1. **Destination verified**: `cloudflare.listEmailRoutingAddresses(accountId)` (new read-only
   provider method over `client.emailRouting.addresses.list`) contains the address from
   `wrangler.jsonc` `send_email[0].destination_address` with a non-empty `verified` timestamp.
   Missing → "not added"; present but unverified → "waiting for the verification link".
   An authorisation error → could-not-check naming the **Email Routing Addresses: Read** permission.
2. **Sending domain routing on**: the domain of `allowed_sender_addresses[0]` (`drc.dev`) is found
   with `cloudflare.listZones(domain)`, and `cloudflare.getEmailRoutingSettings(zoneId)` (new
   read-only provider method over `client.emailRouting.get`, returning only `enabled` and `status`)
   reports `enabled: true` and status `ready`. No zone found → "drc.dev is not a zone this token
   can read"; disabled → "Email Routing is not on for drc.dev"; another status → named. An
   authorisation error → could-not-check naming **Zone Settings: Read**. Public DNS is not
   read.
3. **doncoleman.ca untouched** is not re-checked here: item 5 (`mail-records`) fails if any apex
   iCloud record changes, and item 17 adds no record.

Complete summary: "Email Routing is on for drc.dev and contact@doncoleman.ca is verified." Next
action when missing: the walkthrough step for that part.

(Revised 2026-10-10: the sender moved from `mail.doncoleman.ca` to `drc.dev`, research R3.)

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
- `CLOUDFLARE_API_TOKEN.permissions` adds "Email Routing Addresses Read" and "Zone Settings
  Read (drc.dev zone)"; `usedBy` adds
  `contact-email`. `CLOUDFLARE_ACCOUNT_ID.usedBy` adds `contact-email`.
- `tests/unit/setup/drift.test.ts` keeps proving every name in wrangler, workflows and
  `.env.example` is in the manifest.

## DNS baseline (`setup/dns-baseline.json`)

Unchanged. No record is added to doncoleman.ca, so items 4 and 5 need no change.

## Walkthrough and docs

`docs/setup.md` gains `## 17. Contact email {#contact-email}` and the walkthrough skill a matching
step, each saying what to do, where, and how to confirm:

1. Email Routing → Destination addresses: add `contact@doncoleman.ca` if it is not there yet;
   open the verification link in that mailbox.
2. `drc.dev` → Email → Email Routing: confirm routing is enabled with no DNS warnings.
3. Token: add Account → Email Routing Addresses: Read, and the `drc.dev` zone with Zone: Read and
   Zone Settings: Read, to the read-only token.
4. `pnpm run setup:check`: items 4, 5 and 17 pass.

After release (follow-up, Don): `pnpm exec wrangler secret delete CONTACT_READ_TOKEN` and
`IP_HASH_SALT`, each for both Workers (`--env preview` for the preview Worker), using the
`--env-file /dev/null` rule from the walkthrough.
