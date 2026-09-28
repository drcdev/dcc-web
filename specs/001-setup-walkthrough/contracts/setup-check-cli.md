# Contract: `pnpm setup:check` CLI

**Entry point**: `package.json` script `"setup:check": "node scripts/setup-check/cli.ts"`

## Invocation

```text
pnpm setup:check [--json] [--item <id> ...] [--no-network]
```

| Flag | Meaning |
|---|---|
| *(none)* | Check every registry item, print the human report. |
| `--json` | Print one JSON document matching [`check-report.schema.json`](./check-report.schema.json) to stdout; nothing else on stdout. |
| `--item <id>` | Check only the named item(s) (repeatable). Unknown id → exit 2. Used by the walkthrough to confirm one step. |
| `--no-network` | Run only checks that need no network (local tools, `.env` names); every other item is `could-not-check` with reason "skipped: --no-network". Used by tests of the CLI wiring. |

## Inputs (read-only)

- `setup/config.json` — non-secret settings: `owner` (`drcdev`), `repo` (`dcc-web`),
  `machineAccount` (`dcc-bot`), `workerName` (`dcc-web`), `zone` (`doncoleman.ca`),
  `reviewHost` (`new.doncoleman.ca`), `ghostMarker` (`Ghost`).
- `setup/dns-baseline.json`, `setup/github-ruleset.json` — committed expectations.
- `.env` (gitignored) — `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`.
- `gh` CLI sign-in (Don's account).

## Outputs

### Human report (stdout)

```text
Setup check — doncoleman.ca                      2026-09-28 14:05

  ✓ complete         1  Local tools
  ✗ missing          4  DNS records copied to Cloudflare
                        2 records at Squarespace are not in Cloudflare:
                          TXT doncoleman.ca "google-site-verification=…"   (public DNS value, not a secret)
                          MX  doncoleman.ca 10 mx1.example.net
                        Next: add them in Cloudflare → DNS → Records, or mark them "drop" in
                        setup/dns-baseline.json with a reason.  See docs/setup.md#dns-records-parity (Step 4 of 18)
  … pending          5  Nameservers point to Cloudflare
                        Next: nothing to do; delegation can take up to 24 hours. Run the check later.
  ? could-not-check  7  Cloudflare Worker exists
                        Reason: CLOUDFLARE_API_TOKEN is not set in .env.
                        Next: create a read-only token (docs/setup.md#local-credentials) and add it to .env.

  6 of 18 complete · 8 missing · 1 pending · 3 could not check
```

Symbols are paired with words so the report reads the same without colour; colour is off when
stdout is not a TTY or `NO_COLOR` is set.

### Exit codes

| Code | When |
|---|---|
| `0` | Every checked item is `complete` (FR-003). |
| `1` | Any item is `missing`, `pending` or `could-not-check`. |
| `2` | Usage error (unknown flag or item id, invalid `setup/*.json`). |

## Guarantees (each covered by a unit test)

1. **Read-only (FR-004)**: no provider call uses a mutating method; `gh api` is only ever called
   without `-X/--method`, `-f`, `-F`, `--field`, `--raw-field` or `--input`.
2. **No secret values (FR-005, SC-004)**: output never contains the value of any manifest secret
   present in the environment (canary test injects a random value and asserts absence in both
   formats and in thrown-error paths).
3. **Every non-complete item has `nextAction`, `docs` and `step` (FR-002, SC-003)**.
4. **Provider failures map to `could-not-check` with a reason**, never to `complete` or silence
   (Story 1 scenario 4).
5. **Finishes in under 30 s** (SC-002): per-call timeout 10 s, checks run concurrently.
