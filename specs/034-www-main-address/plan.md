# Implementation Plan: Make www.doncoleman.ca the main address

**Branch**: `034-www-main-address` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/034-www-main-address/spec.md` (GitHub issue #129)

## Summary

The production site names `https://www.doncoleman.ca` as its own address, and after merge Don
moves the live hosts to match in one dashboard sitting. In the repository this is one constant
(`FALLBACK_ORIGIN` in `src/lib/site-origin.ts`), from which Astro's `site` and therefore every
canonical, Open Graph, sitemap, `robots.txt` and feed address already derive (research R1). The
setup check gains item 18, **Live hosts**, which confirms from public HTTP(S) responses alone that
`www` serves the site and that the bare domain and `http://` redirect to it with 301s, keeping the
path and query string, and that an old Ghost address still lands on its page on `www` (R6). The
DNS baseline gains the proxied placeholder `AAAA doncoleman.ca 100::`, which needs an optional
`proxied` field in the baseline schema (R7). Web Analytics reads the beacon on `www` (R9), and the
Turnstile widget part requires `www.doncoleman.ca` (R8). `docs/setup.md` gets the ordered swap and
rollback steps. The swap itself (the Custom Domain on `www`, a Single Redirect on the bare domain
and the placeholder record) is dashboard-only. No Worker configuration changes (clarification
2026-10-10).

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`).

**Primary Dependencies**: Astro 7.3.5 (`site` option), `@astrojs/sitemap` 3.7.4, `@astrojs/rss`
4.0.19, Zod (setup-check schemas). Cloudflare dashboard features: Workers Custom Domains,
Single Redirects, proxied DNS, Always Use HTTPS, Turnstile hostname management. **No new
dependency, binding, secret or token permission.**

**Storage**: none. `setup/dns-baseline.json` (committed JSON) gains one record.

**Testing**: Vitest 5 `unit` project (resolver, setup-check items, registry, docs drift) and
`build` project (`tests/build/indexing.test.ts`, which builds with the `main` environment).
Playwright E2E, a11y, visual and budget projects need no new cases. `tests/e2e/seo.spec.ts` reads
its origin from `robots.txt`, so only a comment changes. No visual baseline should change, because
no page shows the address.

**Target Platform**: Cloudflare Workers static assets (`dcc-web`), zone `doncoleman.ca` on the
Free plan.

**Project Type**: static web site with one Worker API, plus a local Node setup-check CLI.

**Performance Goals**: unchanged pages and budget. Readers who follow a bare-domain link pay one
edge redirect. The setup check adds 10 probes (at most 40 GETs, 10 s timeout each).

**Constraints**: Free plan. Dashboard-only swap. The check must work with the existing read-only
token, and in fact uses no token (FR-013). Mail, verification, DMARC and CAA records are
untouched (FR-008).

**Scale/Scope**: about 20 files: 1 source constant, 5 setup-check modules, 2 committed setup
files, `docs/setup.md`, the setup-walkthrough skill, and about 10 test files.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

| Principle | Status | How this plan complies |
|---|---|---|
| I. Test-First | Pass | Every change starts with failing tests at one named layer: unit for the resolver table, the `live-hosts` probe cases (recorded HTTP responses, no network), parity's `proxied` rules, the Turnstile and analytics host, the 18-item registry and the docs drift; build for "production output names only `www`". Each task records its red run. |
| II. Automated Release Gate | Pass | `verify` unchanged and required. Nothing skipped. The live hosts are checked by the setup check after merge, not by CI, because CI cannot see the dashboard state. This is the same arrangement as items 9–16. |
| III. Human Review of Every Change | Pass | Single PR flow: opened from `drc-agents`, auto-merge armed after the final push, merged on Don's approval. The PR body lists the **post-merge** dashboard sitting (swap steps, setup check, Search Console) under its own heading. Because the swap follows the merge, these items do not block approval. |
| IV. First-Party Before Custom | Pass | **Astro**: the `site` option drives sitemap, canonical and `robots.txt` (docs.astro.build/en/reference/configuration-reference/#site; /en/guides/integrations-guide/sitemap/#usage; RSS via `site`, /en/recipes/rss/). Already in use, so only the value changes (R1). **Cloudflare**: www hosting uses a Workers Custom Domain, with no custom proxy (R4). The bare→www redirect is a Single Redirect plus the documented proxied `100::` placeholder. Rejected alternatives: Worker code (custom code, and it breaks the "only `/api/*` runs Worker code" rule); `_redirects` (path-only, cannot match on host); Bulk Redirects (more parts for one source); Page Rules (legacy) (R3). HTTP→HTTPS uses Always Use HTTPS (R5). Turnstile hostname management is used (R8). Analytics keeps automatic setup (R9). **Fly.io**: not used by this site and not needed; nothing here runs outside Cloudflare. **Custom code**: the `live-hosts` check is custom because no first-party feature reports "these public hosts redirect as intended". Cloudflare's Rules API could show the rule's configuration, but not the behaviour a reader sees, and it would need a new token permission (FR-013). |
| V. Static by Default | Pass | Pages stay prerendered. No endpoint is added or changed. `/api/*` on `www` keeps its same-origin checks, which compare against the request's own host. |
| VI. Content as Files | Pass | No content change. The DNS baseline stays a committed, reviewed file and gains its new record there rather than as a code special case (R7). |
| VII. Private Data: Minimal and Protected | Pass | Nothing is collected. The setup check sends no credentials for the new item and logs only public status codes and `Location` values. Contact email destination unchanged. |
| VIII. Cloudflare Best Practices | Pass (dashboard exception stated) | One Worker. Only `/api/*` invokes Worker code (unchanged). "Worker configuration … committed and applied through CI": the Worker configuration does not change. The Custom Domain move, redirect rule, placeholder record and Turnstile hostname are zone and account settings done by Don, as the bare Custom Domain and the old `www` rule are today (clarification 2026-10-10), and the setup check confirms them. HTTPS-only: `http://` on both hosts ends on HTTPS. Free plan limits are kept: one redirect rule replaces one. |
| IX. Cost Ceiling | Pass | **Expected change $0/month** (R12). Custom Domain, certificate, Single Redirect, proxied record, Always Use HTTPS, Turnstile and Search Console are all free. Stated in the PR body too. |
| X. Accessible, Fast and Private | Pass | No page, script or style change. a11y and budget are unaffected. Web Analytics stays the only analytics. The HSTS header still covers `www` (R10). |
| XI. Spec Kit Workflow | Pass | Spec Kit branch `034-www-main-address`, own worktree. Shared files (`scripts/setup-check/items.ts`, `docs/setup.md`, `setup/dns-baseline.json`) are merged from `main` before the gate. |
| Technology Constraints | Pass | No new tool, service or library. |
| Security Baseline | Pass | `_headers` unchanged. The ruleset is untouched. Abuse controls are unchanged: Turnstile now names `www`, and the same-origin check follows the request host. No visitor data is involved. |
| Development Workflow | Pass | Constitution Check present. Astro choices cite docs (R1). Tests come before code. Each behaviour has one primary layer (see Test placement). Out-of-scope items are listed as follow-ups. |

**Gate result**: pass. No violations; Complexity Tracking is empty.

## Design

### 1. Site address

`src/lib/site-origin.ts`: `FALLBACK_ORIGIN = "https://www.doncoleman.ca"`, and the comment cites
this spec. Nothing else in `src/` names the origin. `ContactForm.astro`'s "try again from
doncoleman.ca" is prose naming the site and stays (FR-003). Contract:
[contracts/site-origin.md](./contracts/site-origin.md).

### 2. Setup check

- **New** `scripts/setup-check/checks/live-hosts.ts`: the probe table, a manual redirect follower
  (max 3 redirects, `Location` resolved against the request URL), and the result mapping
  (`complete` / `pending` on a TLS failure at `www` / `missing` with per-probe details /
  `could-not-check`). It is wired in `items.ts` as order 18, `after-merge`. Contract:
  [contracts/setup-check.md](./contracts/setup-check.md).
- `web-analytics.ts`: the beacon is read from `https://<main host>/`.
- `contact-bindings.ts`: `PRODUCTION_HOST` comes from the main host, and the header comment and
  fix text are updated.
- `dns-records-parity.ts`, `types.ts`, `schemas.ts`: optional `proxied` on baseline records, with
  the comparison in both directions. Contract: [contracts/dns-baseline.md](./contracts/dns-baseline.md).
- `setup/dns-baseline.json`: adds the placeholder.
- `items.ts`: the item 4, 15 and 16 `confirmedBy` and `where` texts follow the new hosts.

### 3. Documentation

- `docs/setup.md`: the intro counts 18 items. Item 4 notes that the placeholder is proxied.
  Item 15 says the beacon is read on `www`. Item 16 says the widget hostnames include
  `www.doncoleman.ca`. New `## 18. Live hosts {#live-hosts}` goes under a new part heading
  `# Main address`, after the Contact form part and before Edge protections, and holds the
  `### Live swap` and `### Rollback` steps. Contract:
  [contracts/live-swap-runbook.md](./contracts/live-swap-runbook.md).
- `.claude/skills/setup-walkthrough/SKILL.md`: a short "Live hosts (item 18)" step that points to
  the docs steps. Dashboard actions are shown for Don to do himself, and the skill runs only
  `pnpm setup:check --item live-hosts`.
- `specs/011-launch` is not edited (FR-016). The supersession is recorded in this spec.

### Test placement

| Behaviour | Layer | File |
|---|---|---|
| Resolver returns `www` for main and fallback | unit | `tests/unit/site/astro-config.test.ts` (and the resolver test beside it) |
| Production output names only `https://www.doncoleman.ca` | build | `tests/build/indexing.test.ts` (expected origin and a "no bare-domain URL" assertion); `drafts.test.ts` and `local-site.test.ts` change their sitemap expectation only |
| `live-hosts` result for each arrangement | unit | `tests/unit/setup-check/checks/live-hosts.test.ts` (new) |
| Ghost probe mapping exists in `public/_redirects` | unit | same file |
| Parity `proxied` rules and baseline content | unit | `dns-records-parity.test.ts`, `tests/unit/setup/dns-baseline-schema.test.ts` |
| Analytics reads `www`; widget requires `www` | unit | `web-analytics.test.ts`, `contact-bindings.test.ts` |
| 18 items; docs section, anchor and order; swap and rollback phrases | unit | `tests/unit/setup/items.test.ts`, `docs-structure.test.ts`, `drift.test.ts`, `skill-behaviour.test.ts`, `tests/unit/setup-check/report.test.ts` |

Live behaviour after the swap is confirmed by item 18 itself, not by CI (see II).

## Project Structure

### Documentation (this feature)

```text
specs/034-www-main-address/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── site-origin.md
│   ├── dns-baseline.md
│   ├── setup-check.md
│   └── live-swap-runbook.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/lib/site-origin.ts                         # FALLBACK_ORIGIN → www
setup/dns-baseline.json                        # + AAAA doncoleman.ca 100:: proxied
scripts/setup-check/
├── items.ts                                   # item 18; texts for 4, 15, 16
├── types.ts / schemas.ts                      # optional proxied on baseline records
└── checks/
    ├── live-hosts.ts                          # new
    ├── dns-records-parity.ts
    ├── web-analytics.ts
    └── contact-bindings.ts
docs/setup.md                                  # 18 items, Main address part, swap + rollback
.claude/skills/setup-walkthrough/SKILL.md      # Live hosts step
tests/
├── build/{indexing,drafts,local-site}.test.ts
├── e2e/seo.spec.ts                            # comment only
└── unit/
    ├── site/astro-config.test.ts
    ├── setup/{items,docs-structure,drift,dns-baseline-schema,skill-behaviour}.test.ts
    └── setup-check/{report.test.ts, checks/{live-hosts,dns-records-parity,web-analytics,contact-bindings}.test.ts}
```

**Structure Decision**: the existing single-repository layout. There is no new directory apart
from the one new check module and its test.

## Post-merge (PR body, own heading)

1. Wait for the production deploy of the merge commit.
2. Do the live swap in `docs/setup.md#live-hosts` in one sitting, on the same day as the merge.
3. `pnpm setup:check` → 18/18.
4. Resubmit the sitemap in Search Console.
5. Submit the contact form once on `www` (SC-005).

## Risks and open questions

- **Merge-to-swap window**: the deployed build names `www` while `www` still redirects to the
  bare domain, so canonicals point at a redirecting host. Keep it to hours. Item 18 reports
  `missing` during the window, which is expected.
- **Turnstile (open question for Don)**: Cloudflare's hostname-management docs say the root
  `doncoleman.ca` entry already covers `www`. FR-012 still requires an explicit
  `www.doncoleman.ca` entry. The plan follows the spec. Relaxing FR-012 to accept either entry
  would remove swap step 1 (R8).
- **Hop count on `http://doncoleman.ca`**: the plan's host-match rule should give one hop, as the
  current `www` rule does, and two hops are also accepted (R3).
- **HSTS on the bare domain**: edge redirects do not carry the Worker's HSTS header. Turning on
  zone-level HSTS is a possible follow-up, not in scope (R10).
- **Custom Domains in config**: moving both Custom Domains into `wrangler.jsonc` is a possible
  follow-up. The clarification ruled it out here (R4).

## Complexity Tracking

None.
