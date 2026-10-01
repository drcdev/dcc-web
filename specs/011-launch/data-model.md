# Data Model: Launch the new doncoleman.ca

This feature does not create database tables. Its "data" is committed configuration, results
computed fresh on every run, and the structure of the walkthrough. Nothing here stores state at
run time.

## LaunchPhase (computed)

| Value | Meaning | How it is known |
|---|---|---|
| `before-switch` | The apex is not on the new site. This is the state before launch, and also during a rollback. | No Workers Custom Domain for the zone apex on `workerName` |
| `switched` | Don has deliberately pointed the apex at the Worker | `cloudflare.listWorkerDomains(accountId, zone)` contains `{ hostname: zone, service: workerName }` |

- Computed by `detectLaunchPhase(ctx)` in `scripts/setup-check/checks/launch-phase.ts`
  (research R2).
- If `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` is missing, or the read fails, it throws
  `ProviderAccessError`. Each caller maps that to `could-not-check`. It never guesses.
- Transitions: `before-switch → switched` when Don adds the apex Custom Domain (docs/launch.md
  L11). `switched → before-switch` when Don removes it (rollback R1). After the retirement step
  (Ghost cancelled), `switched` is permanent in practice.

## CheckStatus (extended)

`"complete" | "missing" | "pending" | "could-not-check" | "waiting"`

- `waiting` is new (research R3). It is returned only by items flagged `postLaunch` in the
  registry, and only while the phase is `before-switch`. The summary starts with
  `Waiting for the switch:`, and `nextAction` points to `docs/launch.md#switch`.
- `CheckReportCounts` gains `waiting`.
- `CheckReport.ok` is true when every result is `complete`, `waiting`, or a
  `deferredUntilMerge` item.
- Validation: the zod mirror in `scripts/setup-check/schemas.ts` adds `waiting` to the status
  enum and to the counts. `nextAction` is required for `waiting`, as it is for every other
  non-complete status.

## SetupItem (registry entry, extended)

Existing fields are unchanged. One optional field is added:

| Field | Type | Rule |
|---|---|---|
| `postLaunch` | `boolean?` | When true, the item's check returns `waiting` before the switch. Set on items 16, 28, 29, 30 and 31 |

The registry order after this feature (32 items):

| # | id | Title | Phase | needsDon | Change |
|---|---|---|---|---|---|
| 4 | `dns-records-parity` | DNS records parity | before-merge | yes | Once switched, the Ghost web records (apex and `www`, types A/AAAA/CNAME) are not expected in the zone. They are listed as "replaced at launch, kept for rollback" |
| 6 | `live-domain-ghost` | Live domain: Ghost or switched | before-merge | no | Complete when the apex and `www` match the Ghost baseline (before the switch or after a rollback), **or** the phase is `switched`. The mail comparison moves to item 32 |
| 16 | `review-address-removed` | Review address removed | after-merge | yes | **Replaces `review-address`.** Waiting before the switch. Complete when there is no Custom Domain for `reviewHost` and neither resolver answers for it |
| 17 | `preview-noindex` | Preview addresses not indexed | after-merge | no | **Replaces `review-address-noindex`.** The workers.dev addresses of both Workers send `X-Robots-Tag: noindex`, checked on two paths |
| 18 | `web-analytics` | Web Analytics | after-merge | yes | Checks the apex when switched and `reviewHost` before. `dependsOn` no longer includes `review-address` |
| 26 | `launch-content-ready` | Launch content ready | before-merge | yes | NEW |
| 27 | `launch-main-checks` | Main branch checks passing | after-merge | no | NEW |
| 28 | `live-apex` | Bare domain serves the new site | after-merge | no | NEW, postLaunch |
| 29 | `live-www-redirect` | www redirects to the bare domain | after-merge | yes | NEW, postLaunch |
| 30 | `live-sitemap` | Live sitemap pages load | after-merge | no | NEW, postLaunch |
| 31 | `live-contact-endpoint` | Live contact endpoint responds | after-merge | no | NEW, postLaunch |
| 32 | `mail-records` | Mail records unchanged | before-merge | no | NEW (always applies) |

Completion conditions are in [contracts/setup-items.md](./contracts/setup-items.md).

## SetupConfig (`setup/config.json`, extended)

| Field | Type | Rule |
|---|---|---|
| `reviewHost` | string | Kept. It now names the address being **removed** at launch. `src/lib/site-origin.ts` no longer reads it |
| `launch.expectedPages` | string[] | Page content ids (file names in `src/content/pages/` without `.mdx`) that must exist and be `draft: false` for launch. Initial value: `index`, `about`, `services`, `speaking`, `technology`, `contact`, `privacy-policy`, `terms-of-use` |
| `launch.expectedPaths` | string[] | Site paths that must appear in the sitemap: `/`, `/about/`, `/services/`, `/speaking/`, `/technology/`, `/blog/`, `/projects/`, `/contact/`, `/privacy-policy/`, `/terms-of-use/`. The implement phase confirms these against the build |

Validation: `configSchema` in `scripts/setup-check/schemas.ts` gains an optional `launch` object
with non-empty string arrays. Ids match `^[a-z0-9-]+$` and paths match `^/([a-z0-9-]+/)*$`.

## DnsBaselineRecord (`setup/dns-baseline.json`, unchanged shape)

Two derived subsets are defined by name and type. No schema field is added:

- **Ghost web records**: `decision: "keep"`, type A/AAAA/CNAME, name equal to the zone apex or
  `www.` + zone. Today these are `A doncoleman.ca 49.13.201.194` and
  `CNAME www.doncoleman.ca drift-and-convergence.mymagic.page`. They are the rollback source
  (FR-009) and the targets that mean "still settling" (research R7).
- **Mail records**: `decision: "keep"` and type MX or TXT, plus CNAMEs whose name contains
  `._domainkey.`. Checked by item 32.

State transitions at retirement, all in the follow-up pull request:

- The Mailgun records (`MX mail…` ×2, `TXT mail…` SPF, `TXT mta._domainkey.mail…` and
  `CNAME email.mail…`) change from `keep` to `drop`, with the reason
  `"Mailgun, used only by Ghost's newsletter; deleted after Ghost was cancelled (YYYY-MM-DD)"`.
- The Ghost web records change from `keep` to `drop`, with the reason
  `"Ghost cancelled YYYY-MM-DD; rollback no longer possible"`.
- The iCloud records never change (SC-004).

## Crawl (site check, computed)

```ts
interface CrawlOptions {
  base: string;                 // origin to request, e.g. http://127.0.0.1:4321
  expectOrigin?: string;        // declared sitemap origin must equal this
  expectNoindex?: boolean;      // every page response must carry X-Robots-Tag: noindex
  checkLinks: boolean;          // false for setup item 30
  concurrency: number;          // default 4
  fetcher: (url: string) => Promise<{ status: number; headers: Record<string, string>; body: string; location: string | null }>; // never follows redirects itself
}

interface CrawlFailure {
  kind: "sitemap" | "page" | "link" | "origin" | "noindex";
  target: string;               // path relative to the site, e.g. /blog/missing/
  status: number | null;        // null for a network failure
  reason: string;               // plain language, e.g. "returned 404", "redirected to /x/"
  linkedFrom: string[];         // pages that link to the target (kind "link"), sorted
}

interface CrawlResult {
  declaredOrigin: string | null;
  pagesChecked: number;
  linksChecked: number;
  failures: CrawlFailure[];     // empty means pass
}
```

Rules (research R8):

- Sitemap entries must return 200 with no redirect.
- A link counts as same-site when it has the base origin or the declared origin. Fragments are
  stripped, and each unique target is checked once.
- A same-site redirect is followed for up to 5 hops and must end in 200.
- These are ignored: other sites, `mailto:`, `tel:`, `javascript:`, and links that are only a
  fragment.
- A 5xx response or a network error is retried once.

## Readiness item (walkthrough view)

These are the readiness checklist rows in `docs/launch.md` (FR-003). Each row has:

| Field | Values |
|---|---|
| `what` | Plain-language statement of what must be true |
| `confirmedBy` | `automatic` (names the `pnpm setup:check --item …` or `pnpm run site:check …` command), or `Don` (says what he looks at) |
| `result` | Recorded by running the confirmation at the time. Never pre-filled |

The rows:

| Row | Confirmed by |
|---|---|
| All expected pages present | Automatic: items 26 and 30 / the site check |
| Ghost content migrated | Don |
| Placeholders replaced | Automatic: item 26 |
| No broken internal links | Automatic: the site check against the review address, plus the last pull request's CI crawl |
| Contact form works end to end | Don sends a test message |
| Main checks passing | Automatic: item 27 |

## WalkthroughStep (`docs/launch.md`)

| Field | Rule |
|---|---|
| `id` | `L1`…`L18`, `R1`…`R5`, `T1`…`T9`. Headings are `### L11. Point the bare domain at the new site {#l11}` |
| `what` | A "**What to do**" paragraph |
| `where` | A "**Where**" paragraph (dashboard path, file or command) |
| `confirm` | A "**How to confirm**" paragraph naming a command or an observable result |
| `pause` | A line starting `**Pause:**` when the step needs Don. Every step that needs Don has one |
| `phase` | Part heading: `## Part A — Readiness`, `## Part B — Before the switch`, `## Part C — The switch`, `## Part D — After the switch`, `## Part E — Rollback`, `## Part F — Retirement (two weeks after the switch)` |

The full step list is in [contracts/launch-walkthrough.md](./contracts/launch-walkthrough.md).
