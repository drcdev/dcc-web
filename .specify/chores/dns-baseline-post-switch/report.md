# Review report: dns-baseline-post-switch

Reviewed 2026-10-09 against plan.md and `git diff main...HEAD` (0c60fa7, 882c360, 322fb79, f9de25f).
No source, test, script or doc file was edited by the review. Saved by the orchestrator because the
review subagent could not write this file.

## Work items

- **W1 done.** `tests/unit/setup/schemas.test.ts:130-152` adds two cases: accepts `cloudflare` and
  rejects an unknown source. Unit layer, as planned; committed red before W2.
- **W2 done.** `scripts/setup-check/schemas.ts:37` uses `z.enum(["squarespace","cloudflare"])` and
  `scripts/setup-check/types.ts:118` uses `"squarespace" | "cloudflare"`.
- **W3 done.** The baseline has 14 records. The five Mailgun records are `drop` with a dated reason.
  The Google TXT is `keep`, `source: "cloudflare"`, `ttl: 1`, null priority and reason. No other
  record changed.
- **W4 done.** `docs/cutover-plan.md`: T4 (140-142), T9 + #93 line (149-150), stage 6 setup-check
  line (165-170), new stage 6 item (171-175). `docs/setup.md`: item 4 (110-111), item 31 (897).
- **Scope.** `git diff --name-only main` lists only the files acceptance 7 allows.

## Tests and checks

- `vitest run tests/unit/setup tests/unit/setup-check`: 51 files, 652 tests passed (every test named
  in acceptance 5).
- `pnpm run typecheck`: exit 0.
- The full verify gate was not run in this phase.

## Principles

- **II:** one named enum value added, no `z.string()`, drop-needs-reason refinement unchanged. Nothing
  reads `source`.
- **III:** not major, confirmed against the diff.

## Docs against the code

- **mail-records** (`mail-records.ts:61,102-106`): only `keep` groups are compared; a `drop` group
  that still answers is information only. Matches `docs/setup.md:896-897`.
- **dns-records-parity** (`dns-records-parity.ts:114-152`): `drop` records are not content-checked;
  they only absorb a Cloudflare record of the same type and name.
- **Stage 6:** consistent with the rest of the file. Taking `mail-records` off the removal list
  changes #101's scope.

## Findings

### CRITICAL

None.

### HIGH

1. **The Google TXT's baseline TTL does not match the zone.** `setup/dns-baseline.json:64` has
   `ttl: 1` (Auto), but the live record's TTL is 3600; `setup:check --item dns-records-parity` prints
   "TTL differs (informational): Cloudflare 3600". The plan chose `1` to avoid exactly this note, and
   `docs/setup.md:110-111` says a Cloudflare-added record records `1`. The item still passes. Fix:
   set `ttl` to 3600 and reword setup.md to "records the TTL Cloudflare's API reports (`1` when on
   Auto)"; update acceptance 3.

### LOW

1. `scripts/setup-check/checks/mail-records.ts:6-7` header comment still says the Mailgun records
   move to `drop` "when Ghost is retired". Out of scope (checks folder); follow-up for the T9 + #93
   chore.
2. `docs/cutover-plan.md:171-173` must-exist list omits the apex `apple-domain` TXT, an iCloud record
   `mail-records` guards. Suggest "iCloud mail MX, SPF, `apple-domain` and DKIM records".
3. plan.md dates the before-measurement 2026-10-10 03:07 UTC while decisions are dated 2026-10-09
   local; time zone only.

## Measurement

| | item 4 | item 5 | item 31 | summary |
|---|---|---|---|---|
| Before (7212795) | missing | missing (held by 4) | missing | 28 of 31 |
| After (f9de25f) | complete | complete | complete | 31 of 31, 0 missing, 0 pending, 0 could not check |

Items 11 and 26 depend on main's latest verify run and were complete on the after run.

## Follow-ups for the PR body

- T4 still removes the Mailgun sending domain and API keys and runs the mail test; only its DNS half
  is done.
- The rest of T9 / #93 stays for its own chore (Ghost web records to `drop`, DMARC and CAA `keep`,
  `_headers`, DNSSEC text, FR-010d, design-source); it can also fix LOW 1.
- Update #101 for the new slimming item and `mail-records` being kept.
- Serving `www` as the main host is issue #129, not touched here.

## Round 2

Reviewed 2026-10-09 against plan.md, round 1, `git diff main...HEAD` and fix commit 4c1a4c1. Saved by
the orchestrator.

- **HIGH 1 fixed.** `setup/dns-baseline.json:64` has `ttl: 3600`; `dns-records-parity` shows no TTL
  note for the Google TXT. `docs/setup.md:110-111` ("records the TTL Cloudflare's API reports (`1`
  when the record is on Auto)") matches `dns-records-parity.ts:66-69`. Plan acceptance 3 and W3
  say 3600.
- **LOW 2 fixed.** `docs/cutover-plan.md:171-172` names the apex `apple-domain` TXT.
- Nothing else changed; the diff stays within acceptance 7; no check weakened.

### Findings

- CRITICAL: none. HIGH: none.
- LOW 1: `plan.md:103` and `plan.md:222-225` still describe `ttl: 1` (plan text only).
- LOW 2: `plan.md:43` and `docs/cutover-plan.md:172` run past the ~100-column wrap (cosmetic).
- LOW 3 (carried, out of scope): `scripts/setup-check/checks/mail-records.ts:6-7` header comment says
  the Mailgun records move to `drop` "when Ghost is retired"; follow-up for the T9 + #93 chore.

### Tests and measurement

- `vitest run tests/unit/setup tests/unit/setup-check`: 51 files, 652 tests passed.
- `pnpm run typecheck`: exit 0.
- `pnpm setup:check` at 4c1a4c1: **31 of 31 complete**; items 4, 5 and 31 complete.
