# Implementation Plan: Launch the new doncoleman.ca

**Branch**: `011-launch` | **Date**: 2026-09-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-launch/spec.md`

## Summary

This plan moves `doncoleman.ca` from Ghost to the new site. Every step is checked, there is a way
back for two weeks, and the old services are retired after that. The work has three parts:

1. **Code and CI, merged first.**
   - New and changed `setup:check` items, built before the walkthrough that relies on them
     (FR-008). They report readiness and the post-launch state as waiting, pending, complete or
     problem. Whether the switch has happened is worked out from the Cloudflare account (research
     R2, R3).
   - A dependency-free sitemap and internal-link crawler. It runs locally against the
     production build in `pnpm run verify`, and in CI against each pull request's real preview
     deployment as a blocking step of the `verify` job (R8, R9).
   - Main builds use `https://doncoleman.ca` as the site origin (R12).
   - The site-wide noindex is replaced: `_headers` rules keep `workers.dev` previews and the
     review address unindexed, and the robots meta tag now depends on the build (R6).
2. **A numbered walkthrough** in a new `docs/launch.md` (R1). It covers readiness, recording
   the Ghost records, the switch, post-launch checks, the external-links reminder, removing the
   review address, rollback, and the retirement steps for two weeks later. Every manual step is
   a pause for Don.
3. **The switch itself, done by Don in the Cloudflare dashboard after the merge.**
   - Apex: a Workers Custom Domain on `dcc-web` (R4).
   - `www`: a proxied placeholder record plus a 301 Single Redirect rule (R5).
   - Rollback restores the recorded Ghost records (R10).

**Major change: yes** (Principle III). The work changes CI (`ci.yml`), deployment and
infrastructure (DNS, Custom Domain, redirect rule, `_headers` indexing rules, site origin), and
retires external services (Ghost, the Flux Supabase project, the Mailgun DNS records). It also
changes the site-wide search metadata. The pull request carries the major-change label, auto-merge
stays off, and it waits for Don's approval after he checks the preview (`[PREVIEW-CHECK]`: the
preview sends `X-Robots-Tag: noindex`, and its pages carry the alias canonical).

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`); Astro 7.3.5 site; Worker unchanged.

**Primary Dependencies**: Existing only: `astro`, `@astrojs/sitemap`, `cloudflare` SDK (read-only setup checks), `vitest`, `@playwright/test`, `wrangler`. **No new dependency.**

**Storage**: None new. Contact D1 databases unchanged. `setup/dns-baseline.json` and `setup/config.json` are committed, public configuration.

**Testing**: Vitest for unit, schema, component and build tests; Playwright for e2e against `wrangler dev`; a CI crawl against the deployed preview.

**Target Platform**: Cloudflare Workers static assets (`dcc-web`, `dcc-web-preview`); Cloudflare DNS and Rules for the zone; GitHub Actions for CI.

**Project Type**: Static web site with one Worker, plus repository tooling (setup check, site check).

**Performance Goals**: The CI crawl finishes in under 3 minutes after the preview is ready (about 30 sitemap pages, 4 concurrent requests). `pnpm setup:check` stays under about 60 seconds including the live sitemap item. The Core Web Vitals budget is unaffected (only meta tags change).

**Constraints**: Free plans only: Workers Custom Domains, 10 Single Redirect rules, Universal SSL and Web Analytics are all free. No step handles a secret in chat. The agent never changes DNS or accounts. Mail records are unchanged through the switch.

**Scale/Scope**: About 30 public pages. 7 new setup items (26–32) and 5 changed items (4, 6, 16→`review-address-removed`, 17→`preview-noindex`, 18), giving a registry of 32 items. One new CI step and one new docs file.

No `NEEDS CLARIFICATION` remains. Research R1–R14 resolves every open technical choice.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | The tests below are written and seen to fail before each implementation task. **Unit** tests cover: the crawler (sitemap parsing, origin mapping, link extraction, redirect rules, failure naming); the preview waiter (check-run polling, timeout, failed build); every new or changed setup item, through fixture providers for each state (waiting, pending, complete, problem, could-not-check); `detectLaunchPhase`; report `ok` and counts with `waiting`; `resolveEach` and TLS error classification; `resolveSiteOrigin` for main; the `isIndexableBuild` helper; `_headers` content; docs structure for `docs/setup.md` (32 items, Launch part) and `docs/launch.md` (numbered steps, each with what, where and how to confirm, plus a pause marker, the Ghost records table equal to the baseline, the rollback, export before cancel, Supabase export then confirm then delete, the external-links step right after the post-launch checks, and no secret pasted in chat); the CI workflow step; and the `/setup-walkthrough` skill text. **Component**: `Seo.astro` indexable and noindex. **Build**: a main-build environment gives the `doncoleman.ca` origin and no robots meta; a branch build gives the alias origin and noindex. **E2E**: the local crawl, headers, and 404 for old Ghost paths. **Accessibility**: no new template, existing axe checks unchanged. **CI integration**: the preview crawl. |
| **II. Automated Release Gate** | `pnpm run verify` stays the gate and gains the local crawl spec. CI's `verify` job gains the preview crawl as a blocking final step on pull requests. It fails closed if the preview build fails or never reports. Nothing is skipped or weakened. Production still deploys only from `main` through Workers Builds. |
| **III. Human Review for Major Changes** | **Major.** The change touches CI, deployment and infrastructure (DNS, Custom Domain, Redirect Rule, `_headers`, site origin), retires external services (Ghost, Supabase, Mailgun records) and changes site-wide metadata. The pull request is labelled, auto-merge stays off, and Don approves after checking the preview. The DNS switch happens only after the merge, by Don, following `docs/launch.md`. |
| **IV. First-Party Before Custom** | **Astro**: `site` for the canonical, sitemap and robots URLs (configuration reference `#site`); `@astrojs/sitemap` for the sitemap; `astro:env` for the build-dependent indexing (environment-variables guide). **Cloudflare**: a Workers Custom Domain for the apex (R4); a Single Redirect rule with a proxied `100::` placeholder for `www` (R5); Universal SSL / Custom Domain certificates; absolute-URL `_headers` rules for noindex by host (R6); Web Analytics automatic setup (existing); Workers Builds' own GitHub check run as the "preview ready" signal (R9). **Custom code where no first-party option fits**: the sitemap and link crawler. Astro has no link checker and Cloudflare offers none. A third-party checker would add a dependency and still need custom origin mapping (R8). **Fly.io**: not used since constitution 2.0.0 (R13). **Ghost and Supabase**: their own export tools (R14). |
| **V. Static by Default** | Every page stays prerendered. The Worker still runs only for `/api/*`. The `www` redirect runs at the edge (a Redirect Rule), not in Worker code. No client JavaScript is added. |
| **VI. Content as Files** | No content model change. Don writes the replacement Services, Speaking and Focus Pocus copy himself, as files. Item 26 reads those files to confirm no placeholders remain. |
| **VII. Private Data** | D1 storage, retention and preview separation are unchanged. The old Flux Supabase contact submissions are exported by Don before deletion, and the Ghost members CSV is exported before cancellation. Both stay on Don's machine, are never committed, and the agent only checks that the files exist. No secret is added. No step asks for a secret in chat. Existing tokens are read only by name. |
| **VIII. Cloudflare Best Practices** | The site and API stay in one Worker. Only `/api/*` runs Worker code. HTTPS only: the Custom Domain plus the zone's "Always Use HTTPS", confirmed by item 28. The contact API's same-origin rule works unchanged on the apex. **Exception**: the apex Custom Domain and the Redirect Rule are added in the dashboard, not committed config. See Complexity Tracking. |
| **IX. Cost Ceiling** | **Expected new monthly cost: $0.** Workers Custom Domains, Single Redirect rules (10 on the free plan), Universal SSL and Web Analytics are free. The CI crawl adds about 1–3 Actions minutes per pull request, within the free allowance. Running costs **go down**: the Ghost hosting subscription ends, the Flux Supabase project goes away, and Mailgun stops being used. |
| **X. Accessible, Fast and Private** | WCAG and performance budgets are unchanged (no visual or markup change beyond meta tags). The live site becomes indexable and previews do not. Web Analytics reaches the apex once it is proxied through the Custom Domain. No new third-party script. |
| **XI. Spec Kit Workflow** | The feature is on branch `011-launch` with Spec Kit naming. Shared hot files are `docs/setup.md`, `scripts/setup-check/items.ts` and `.github/workflows/ci.yml`. If a sibling worktree touches them, this branch merges `main` before opening the pull request and resolves conflicts in favour of the registry order defined here. |

**Gate result: PASS**, with one justified exception (Principle VIII, below). The check was
re-evaluated after Phase 1 design with no change: the contracts add no dependency, no secret
and no recurring cost.

## Delivery sequence and manual steps

The work runs in three phases.

1. **Implement, before the pull request (agent).** Tests come first, then:
   - the setup-check changes (items and report), *before* `docs/launch.md` (FR-008);
   - the crawler and CI step;
   - the origin, indexing and `_headers` changes;
   - the `docs/setup.md` updates, then `docs/launch.md`;
   - the `/setup-walkthrough` skill update.
2. **Not in the pull request: Don's readiness steps.** The implement phase does not run any
   step that needs Don (Clarifications, decision on switch timing). The readiness steps L2
   (Don replaces the placeholder copy in his own words, through a normal small pull request to
   `main`; the agent does not draft it unless asked), L3 (Ghost posts migrated), L5 (contact
   test) and L8 (Ghost records and zone export) run after the merge, before the switch, as the
   first post-merge manual tasks. Item 26 failing until then blocks the switch, not this pull
   request. The agent never signs in, creates accounts, changes DNS or handles credentials. Don
   never pastes a secret.
3. **After the merge (Don, guided).** The switch can only happen once `main` serves the new
   origin and indexing rules. Before that, the live sitemap would name `new.doncoleman.ca` and
   every page would be noindex. All of `docs/launch.md` therefore runs after the merge: the
   readiness gate, the switch, the post-launch checks, external links and removing the review
   address. It is driven by `/setup-walkthrough`, which hands over to `docs/launch.md` at the
   Launch part. Tasks for these steps are marked as post-merge manual tasks. The retirement steps follow two
   weeks later, with a small follow-up pull request:
   - set the baseline's `drop` decisions;
   - update `docs/design-source.md` to say Flux is archived (superseded: Don chose to keep Flux unarchived (2026-10-09));
   - remove the `new.doncoleman.ca` `_headers` rule;
   - optionally move the apex Custom Domain into `wrangler.jsonc`.

## Requirements added when the checklists were resolved

The checklist pass added or sharpened FR-003 (Turnstile and privacy-policy readiness rows),
FR-003b, FR-010b, FR-011a, FR-015b, FR-016a, FR-017 (24-hour limit), FR-022, FR-023, FR-025b and
FR-026 output privacy. They need no new module and no new dependency. They are covered here:

| Requirement | Where it is designed |
|---|---|
| FR-003 privacy-policy row | Item 26's fourth rule (contracts/setup-items.md) |
| FR-003 Turnstile row | Existing item `contact-turnstile-widget`, cited at L5 |
| FR-003b production origin | L4 runs the site check with `--expect-origin https://doncoleman.ca` |
| FR-010 whole-zone comparison, FR-010b per half | Items 4 and 6 (contracts/setup-items.md); L11–L12 one-sitting rule |
| FR-011a rollback triggers, FR-017 24-hour limit | L13–L14; pending `nextAction` text on items 28–32 |
| FR-015b "Launch test" messages | L5 and L14 |
| FR-016a mail tests | L9, L14 and T4 |
| FR-021a private records, FR-022, FR-023, FR-025, FR-025a, FR-025b | Part F steps T1–T9 (contracts/launch-walkthrough.md) |
| FR-026 output privacy | Shared redaction assertion in every launch item's tests |

## Project Structure

### Documentation (this feature)

```text
specs/011-launch/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R14
├── data-model.md        # Phase 1: launch phase, statuses, items, crawl result, walkthrough step
├── quickstart.md        # Phase 1: validation scenarios
├── contracts/
│   ├── setup-items.md           # Items 4, 6, 16, 17, 18 changed; 26–32 new; `waiting` status
│   ├── site-check.md            # Crawler module, CLI, CI step, output and exit codes
│   ├── indexing-and-origin.md   # Site origin table, robots meta, _headers rules
│   └── launch-walkthrough.md    # docs/launch.md structure and step list
├── checklists/              # requirements, launch-ops, accessibility, privacy-security
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
.github/workflows/ci.yml                  # + preview crawl step in `verify`, + checks: read
.claude/skills/setup-walkthrough/SKILL.md # `waiting` handling; hands over to docs/launch.md at item 26
docs/
├── setup.md                              # items 6, 16, 17, 18 rewritten; "# Launch" part, items 26–32
├── launch.md                             # NEW: numbered walkthrough L1–L18, rollback R1–R5, retirement T1–T9
└── design-source.md                      # unchanged now; updated in the retirement follow-up (FR-023)
public/_headers                           # site-wide noindex removed; workers.dev + review-host noindex rules
setup/config.json                         # + launch.expectedPages; reviewHost kept as "address being removed"
setup/dns-baseline.json                   # unchanged now; Mailgun + Ghost web records -> drop at retirement
src/
├── config/site.ts                        # indexable no longer a constant
├── components/Seo.astro                  # default noindex from the build decision
└── lib/
    ├── build-mode.ts                     # + isIndexableBuild(env)
    └── site-origin.ts                    # main -> https://doncoleman.ca
scripts/
├── site-check/                           # NEW
│   ├── crawl.ts                          # pure crawler (injected fetcher)
│   ├── cli.ts                            # `pnpm run site:check -- --base <url> [...]`
│   └── preview.ts                        # CI: wait for Workers Builds check run, crawl preview alias
└── setup-check/
    ├── types.ts                          # + "waiting" status, ProviderAccessError.kind, DnsReader.resolveEach, HttpReader redirect option
    ├── report.ts, schemas.ts, cli.ts     # waiting counted, printed, non-failing
    ├── items.ts                          # registry: 16, 17 replaced; 26–32 added (32 items)
    ├── providers/dns.ts, providers/http.ts
    └── checks/
        ├── launch-phase.ts               # NEW shared detectLaunchPhase
        ├── live-domain-ghost.ts          # Ghost OR deliberately switched; mail moved out
        ├── dns-records-parity.ts         # skips Ghost web records once switched
        ├── web-analytics.ts              # apex when switched, review host before
        ├── review-address-removed.ts     # NEW (replaces review-address.ts, item 16)
        ├── preview-noindex.ts            # NEW (replaces review-address-noindex.ts, item 17)
        ├── launch-content-ready.ts       # NEW item 26 (four rules, incl. privacy policy)
        ├── launch-main-checks.ts         # NEW item 27
        ├── live-apex.ts                  # NEW item 28
        ├── live-www-redirect.ts          # NEW item 29
        ├── live-sitemap.ts               # NEW item 30 (uses site-check/crawl.ts)
        ├── live-contact-endpoint.ts      # NEW item 31
        └── mail-records.ts               # NEW item 32
tests/
├── unit/site-check/                      # NEW: crawl, cli, preview waiter
├── unit/setup-check/checks/              # new/changed item tests + launch-phase
├── unit/setup-check/redact.test.ts       # FR-026 shared redaction helper and assertions
├── unit/setup-check/providers/           # resolveEach, TLS kind, manual redirect
├── unit/setup/                           # docs-structure (32 items), launch-doc.test.ts (NEW), drift, schemas, skill-behaviour
├── unit/site/                            # site-origin, build-env, headers, sitemap, astro-config
├── unit/ci/workflows.test.ts             # preview crawl step
├── component/Seo.test.ts
├── build/indexing.test.ts                # NEW: main vs branch origin and robots meta
├── build/launch-paths.test.ts            # NEW: launch.expectedPages/Paths match the build
├── fixtures/providers/http|dns|cloudflare|github/  # live-domain fixtures
├── fixtures/site-check/                  # NEW: sitemap/page HTML fixtures incl. a broken link
└── e2e/
    ├── site-links.spec.ts                # NEW: crawler against wrangler dev
    ├── headers.spec.ts                   # no X-Robots-Tag on a non-preview host
    ├── not-found.spec.ts                 # + Ghost-only paths return 404, no redirect
    └── seo.spec.ts                       # noindex expectations follow the build decision
```

**Structure Decision**: Everything goes into the existing single-project layout. The setup check
grows inside `scripts/setup-check/`. The crawler is a new sibling tool, `scripts/site-check/`,
because three callers share it: the CI step, the e2e spec and setup item 30. The walkthrough is
a new doc beside `docs/setup.md` (R1). `package.json` gains a `site:check` script. `verify` stays
the gate unchanged; the new e2e spec runs inside its existing `test:e2e`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Principle VIII: the apex Custom Domain is added in the dashboard, not committed to `wrangler.jsonc` | The switch must be a deliberate step by Don after the readiness gate (FR-004, FR-006), and rollback must stay possible for two weeks (FR-011). | Committing `routes: [{ pattern: "doncoleman.ca", custom_domain: true }]` would perform the DNS switch on merge, and every later `main` deploy would undo a rollback. Follow-up: commit it once Ghost is cancelled. This matches the precedent of setup item 16 (`new.doncoleman.ca`, also added in the dashboard). |
| Principle VIII: the `www` Redirect Rule is set in the dashboard | Redirect Rules are zone settings, not Worker configuration. The repository has no zone-configuration pipeline, and adding one (Terraform or an API token with Rules: Edit in CI) would be a larger major change and a new secret. | Doing the redirect in the Worker would run Worker code for every `www` path, which breaks Principle VIII's `/api/*`-only rule. Item 29 confirms the rule's effect on every run of the setup check. |
| Custom crawler instead of a first-party option | No Astro or Cloudflare link checker exists (R8). | A third-party checker adds a dependency and a new tool under the Technology Constraints, and still needs custom origin mapping and the noindex assertion. |

## Risks and open questions

- **Post-merge execution.** The switch, the post-launch checks and the review-address removal
  can only run after the merge (see Delivery sequence), so SC-002, SC-003 and SC-007 are proved
  after the pull request lands. The orchestrator should keep these tasks visible, either in the
  pull request body or as a follow-up run of `/setup-walkthrough`.
- **The CI step fails closed on Workers Builds.** A Cloudflare build outage or a renamed check
  run blocks every merge. The step's failure message names the check run it waited for, and
  how to rerun it.
- **`_headers` host placeholders.** The `https://:worker.:subdomain.workers.dev/*` match is
  taken from Cloudflare's docs. It cannot be exercised by local `wrangler dev` (an http
  localhost host), so the CI preview crawl's `--expect-noindex` is the proof, and the first
  preview run of this branch must show it.
- **Mailgun tracking CNAME** (`email.mail.doncoleman.ca`). Decided by Don after the plan: it is
  deleted with the other four Mailgun records at retirement (spec FR-024, R11).
- **Placeholder readiness blocks the switch, not the merge.** Item 26 fails until Don replaces
  the Services, Speaking and Focus Pocus placeholders. It is a setup item, not part of
  `verify`, so it does not block this pull request.
- **Always Use HTTPS** is a zone-wide setting. Turning it on affects only proxied hostnames.
  The Ghost records are DNS only, so Ghost is unaffected during rollback.
