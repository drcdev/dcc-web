# Data Model: Setup Walkthrough and Setup Check

**Feature**: `001-setup-walkthrough` | **Date**: 2026-09-28 | **Plan**: [plan.md](./plan.md)

All entities are TypeScript types in `scripts/setup-check/types.ts`. Nothing is stored in a
database; the registry and manifest are committed source, and results are computed on each run.

## SetupItem (registry entry)

Defined once in `scripts/setup-check/items.ts`; the check, the walkthrough skill and the runbook
drift test all read this list.

| Field | Type | Rules |
|---|---|---|
| `id` | kebab-case string | Unique. Matches a `docs/setup.md` heading anchor `{#id}`. |
| `order` | integer | Unique, ascending = walkthrough order (safe order, see below). |
| `title` | string | Plain language, <= 60 chars. |
| `purpose` | string | Why the item exists (one sentence). |
| `where` | string | Site/screen or command where Don acts. |
| `confirmedBy` | string | Plain description of what the check looks at. |
| `needsDon` | boolean | `true` if the step needs Don to act (walkthrough pauses). |
| `principles` | `('I'…'XI')[]` | At least one. |
| `requirements` | `string[]` | FR ids it satisfies, e.g. `["FR-019"]`. |
| `secrets` | `SecretRef['name'][]` | Names only; must exist in the manifest. |
| `dependsOn` | `id[]` | Items that must be complete first; used to report `missing` with "do step X first" rather than a confusing failure. |
| `phase` | `'before-merge' \| 'after-merge'` | Whether it can be done before this slice's PR is merged. |
| `check` | `(ctx) => Promise<CheckResult>` | Pure function over injected providers. |

**Validation**: a unit test asserts unique `id`/`order`, non-empty text fields, every `secrets`
name exists in the manifest, `dependsOn` refers to earlier items only (acyclic), and every item has
a docs section.

### Registry (this slice)

| # | id | Confirmed by (read-only) | Phase | FR |
|---|---|---|---|---|
| 1 | `local-tools` | Node >= 24, pnpm version matches `packageManager`, `gh` signed in as Don | before | FR-025 |
| 2 | `local-credentials` | `.env` has every required name non-empty; Cloudflare token-verify says `active` | before | FR-025 |
| 3 | `cloudflare-zone` | Zone `doncoleman.ca` exists on Free plan (id matches `CLOUDFLARE_ZONE_ID`) | before | FR-019 |
| 4 | `dns-records-parity` | Every `keep` record in `setup/dns-baseline.json` exists in the Cloudflare zone with identical type/name/content/priority and `proxied: false`; every record without a decision is flagged | before | FR-019 |
| 5 | `dns-nameservers` | Public NS for `doncoleman.ca` equal the zone's assigned nameservers and zone `status: active`; `pending` while delegation propagates | before | FR-019 |
| 6 | `live-domain-ghost` | `https://doncoleman.ca/` serves Ghost (generator meta), is not a Worker custom domain, and MX/SPF/DMARC resolve as in the baseline | before | FR-019, SC-005 |
| 7 | `cloudflare-worker` | Worker `dcc-web` exists; `workers.dev` and preview URLs enabled | before | FR-017 |
| 8 | `github-machine-account` | `dcc-bot` collaborator permission is `write` (or `maintain`), not `admin` | before | FR-013 |
| 9 | `github-secret-scanning` | `security_and_analysis.secret_scanning` and `…secret_scanning_push_protection` are `enabled` | before | FR-024 |
| 10 | `workers-builds` | Latest commit on `main` has a successful Workers Builds check run; latest open PR head has one with a preview URL (when a PR exists) | after | FR-017, FR-018 |
| 11 | `github-ci-workflow` | `.github/workflows/ci.yml` and `major-change.yml` exist on `main`; latest `verify` run on `main` succeeded | after | FR-015, FR-016 |
| 12 | `github-codeowners` | `.github/CODEOWNERS` on `main` lists `@drcdev` for every major path; `codeowners/errors` is empty | after | FR-014 |
| 13 | `github-major-label` | Label `major-change` exists; repo `allow_auto_merge` is true | after | FR-014 |
| 14 | `github-main-protection` | Active ruleset on `main` matches `setup/github-ruleset.json`: PR required, code-owner review, required checks `verify` + `major-change-approval` (strict), no force-push, no deletion, no bypass actors; each gap named | after | FR-013, FR-014 |
| 15 | `pipeline-secrets` | GitHub Actions secret and variable **names** equal the manifest's GitHub entries (currently none); no extras, none missing | after | FR-021 |
| 16 | `review-address` | `new.doncoleman.ca` is a Custom Domain on `dcc-web`; `https://new.doncoleman.ca/` returns 200 over HTTPS | after | FR-020 |
| 17 | `review-address-noindex` | Response header `X-Robots-Tag` contains `noindex` | after | FR-020 |
| 18 | `web-analytics` | Web Analytics site for `new.doncoleman.ca` exists with automatic setup on; served HTML references the Cloudflare beacon | after | FR-022 |

Safe order rationale: DNS parity (4) must pass before nameservers change (5); the live-site check
(6) runs right after the switch; everything that needs this slice's files on `main` (10–15) comes
after this slice's PR merges; the review address and analytics (16–18) need the zone active and
the production deployment in place.

## CheckResult

| Field | Type | Rules |
|---|---|---|
| `id` | SetupItem id | |
| `status` | `'complete' \| 'missing' \| 'pending' \| 'could-not-check'` | Exactly these four (FR-001). |
| `summary` | string | One line, plain language. Never contains a secret value. |
| `details` | `string[]` | Optional specifics, e.g. each missing ruleset rule or DNS record. |
| `nextAction` | string \| null | **Required** when `status !== 'complete'` (FR-002, SC-003). |
| `step` | string | Walkthrough step label, e.g. `Step 4 of 18`. |
| `docs` | string | `docs/setup.md#<id>`. |
| `reason` | string \| null | For `could-not-check`: the access problem and how to fix it (Story 1 scenario 4). |

### Status transitions (per item, across runs)

```
missing ──(Don acts)──▶ pending ──(propagation done)──▶ complete
   ▲                        │                               │
   └──────(regression)──────┴───────────(regression)────────┘
any ──(provider unreachable / credentials invalid)──▶ could-not-check
```

`pending` is used only by `dns-nameservers` (delegation in progress) and `workers-builds` (a build
is queued or running). A problem such as "live domain points at the new site" is `missing` with
the problem in `summary` and a corrective `nextAction`, never `complete`.

## CheckReport

| Field | Type | Rules |
|---|---|---|
| `generatedAt` | ISO 8601 string | |
| `results` | `CheckResult[]` | Registry order. |
| `counts` | `{ complete, missing, pending, couldNotCheck, total }` | Summary line: "`N` of `total` complete" (Story 1 scenario 5). |
| `ok` | boolean | `true` only if `counts.complete === counts.total` (FR-003). |

## SecretRef (secret manifest)

Defined in `scripts/setup-check/secrets.ts`. Values are never part of the model.

| Field | Type | Rules |
|---|---|---|
| `name` | UPPER_SNAKE string | Unique. |
| `kind` | `'secret' \| 'variable'` | Variables are non-secret but still reported by name only. |
| `store` | `'local-env' \| 'github-actions' \| 'cloudflare-worker' \| 'gh-keyring'` | Where it lives. |
| `purpose` | string | |
| `permissions` | string \| null | Minimum scope, e.g. "Cloudflare: Zone Read, DNS Read, Workers Scripts Read, Web Analytics Read". |
| `usedBy` | string[] | Files or items that reference it (checked by the drift test). |

### Manifest (this slice)

| name | kind | store | purpose |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | local-env | Read-only token the setup check uses for Cloudflare reads |
| `CLOUDFLARE_ACCOUNT_ID` | variable | local-env | Account the check reads |
| `CLOUDFLARE_ZONE_ID` | variable | local-env | Zone the check reads |
| `DCC_BOT_GITHUB_CREDENTIAL` | secret | gh-keyring | Machine account credential used by agents to open PRs (named, never stored in the repo) |

GitHub Actions secrets expected: **none**. Workers Builds build variables expected: **none**.

## DnsBaselineRecord (`setup/dns-baseline.json`)

| Field | Type | Rules |
|---|---|---|
| `type` | `'A' \| 'AAAA' \| 'CNAME' \| 'MX' \| 'TXT' \| 'SRV' \| 'CAA' \| 'NS'` | |
| `name` | FQDN | Lower-case, ends in `doncoleman.ca`. |
| `content` | string | Exact value (TXT unquoted-normalised). |
| `priority` | integer \| null | MX/SRV only. |
| `ttl` | integer | Informational; not compared. |
| `source` | `'squarespace'` | |
| `decision` | `'keep' \| 'drop' \| null` | `null` = undecided → reported by `dns-records-parity`. |
| `reason` | string \| null | Required when `decision === 'drop'`. |

Validated by a Zod schema imported from `astro/zod` (Zod as re-exported by Astro, so no new
dependency), with schema tests for valid and invalid files. The same approach validates
`setup/config.json` (`{ owner, repo, machineAccount, workerName, zone, reviewHost }`) and the
`--json` report shape.

## ProviderContext (test seam)

`{ github: GitHubReader, cloudflare: CloudflareReader, dns: DnsReader, http: HttpReader, env: EnvReader, fs: RepoReader, now: () => Date }`.
Each reader exposes read methods only. Tests inject fakes backed by recorded JSON fixtures in
`tests/fixtures/providers/` (FR-006).

## MajorGateInput / MajorGateDecision (`scripts/ci/major-change-gate.ts`)

- Input: `{ labels: string[], author: string, headSha: string, reviews: { user: string, state: string, commitId: string, submittedAt: string }[], owner: 'drcdev' }`.
- Output: `{ pass: boolean, message: string }`.
- Rules: no `major-change` label → pass; label and author is owner → fail ("reopen from dcc-bot");
  label and owner's latest review is `APPROVED` with `commitId === headSha` → pass; otherwise fail
  ("waiting for Don's approval after he views the preview").
