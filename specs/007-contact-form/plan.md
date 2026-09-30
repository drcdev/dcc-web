# Implementation Plan: Contact Form and Message Retrieval

**Branch**: `007-contact-form` | **Date**: 2026-09-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-contact-form/spec.md`, plus the "Technical
direction" of the feature prompt (Don's chosen architecture, followed as given).

## Summary

Visitors send a message from a prerendered `/contact/` page, ported from Flux's contact form.
Its small island posts JSON to `/api/contact` on the same origin. The site's existing Worker
gains a script entry (`worker/src/index.ts`) that runs **only** for `/api/*`
(`run_worker_first: ["/api/*"]`). Every other path stays a free static asset. The Worker checks
the origin, size and fields (Flux's rules), the `website` honeypot and Cloudflare Turnstile
(server-side). It rate-limits exactly by counting D1 rows per HMAC-salted IP hash (3/hour,
5/day), then stores the message in D1. Don's assistant lists new messages and marks them read
with a bearer token, and can do nothing else. A daily Cron Trigger deletes messages older than
12 months. Production (`dcc-web` → D1 `contact`) and previews (`dcc-web-preview`, a Wrangler
`preview` environment → D1 `contact-preview`) are separate Workers with separate secrets, so
preview data and keys never touch production. Both databases use location hint `wnam`. The
privacy policy placeholders are filled in. The one-time setup is seven new registry-driven
items (19–25) in `docs/setup.md`, `setup:check` and `/setup-walkthrough`. Expected cost:
**$0/month** (research R10).

## Technical Context

**Language/Version**: TypeScript 6.0.3 (strict) on Node 24 (`.nvmrc`) for the site, tools and
setup check. TypeScript for the Worker on the workerd runtime, compatibility date 2026-09-28.

**Primary Dependencies**: Astro 7.3.5 (static, no adapter), Tailwind 4.3.3, Wrangler (bumped
4.143.0 → 4.144.0, the version `@cloudflare/vitest-plugin` pins). New, dev only, in the `worker/`
workspace package: `@cloudflare/vitest-plugin` 1.3.3 and `vitest` 4.1.11 (the plugin's peer range
is `^4.1.0`; the root keeps `vitest` 5.0.2; research R5). No runtime npm dependency is added to
the Worker. No `@cloudflare/workers-types`: types come from `wrangler types`. Final exact
versions are subject to pnpm's `minimumReleaseAge` (research R5).

**Storage**: Cloudflare D1. `contact` (production) and `contact-preview` (preview), both with
location hint `wnam`, one `messages` table, Wrangler migrations in `migrations/`
([data-model.md](./data-model.md)).

**Testing**: Cloudflare's Vitest integration for Worker integration, contract, retention,
logging and query-plan tests (`worker/test/`, real local D1 through Miniflare). Root Vitest 5
for units, config, setup-check and Astro component tests (Container API). Playwright for E2E,
a11y (axe), budget and visual, against `wrangler dev` serving the built site plus the Worker.

**Target Platform**: Cloudflare Workers static assets plus one Worker script (Workers Free
plan). Modern evergreen browsers.

**Project Type**: static website with one edge API (the Worker) in the same repository.

**Performance Goals**: `/contact/` within the existing mobile budget (LCP ≤ 2.5 s, CLS ≤ 0.1,
≤ 10 KB JS and ≤ 100 KB total before interaction). Confirmation or error within 5 s of Send
(SC-001). Worker CPU well under the 10 ms Free limit (only JSON parsing, one HMAC, one SHA-256).

**Constraints**: $0 added cost. D1 queries indexed, with no full scans (asserted by test). No
personal data in logs. HTTPS only. Same-origin only. 10 KB body cap. Secrets only in Cloudflare
secret stores. The site-wide CSP is unchanged; Turnstile's sources are added on `/contact/`
only.

**Scale/Scope**: a personal consulting site, at most tens of messages a day (the capacity table
assumes 20/day plus abuse). One page, one island, four API operations (submit, list-new,
mark-read, cron), seven setup items.

No NEEDS CLARIFICATION remains. Every open point is resolved in [research.md](./research.md).

## Constitution Check

*GATE: checked before Phase 0 and re-checked after Phase 1 design (below). Result: **PASS**, no
unjustified violations.*

| Principle | How this plan complies |
|---|---|
| **I. Test-First** | Every layer has tests written and seen to fail first: Worker integration and contract tests with Cloudflare's Vitest integration on a real local D1 (submit, retrieval, retention, logging privacy, query plans); unit tests for the shared rules, deploy scripts, site origin, config files, CSP and each new setup check; an Astro component test for `ContactForm`; Playwright E2E for the form journeys; axe on the new template. The config test accepts either real, distinct D1 UUIDs or the committed placeholder, so the suite stays green before setup; `setup:check` item 19 fails on a placeholder, and when the agent commits the real IDs during the walkthrough it removes the placeholder allowance so only real IDs pass from then on. Tasks order tests before implementation. |
| **II. Automated Release Gate** | `verify` gains `tsc -p worker`, `wrangler types --check` and the `worker` package's tests. GitHub Actions `ci.yml` is otherwise unchanged (it already runs `pnpm run verify`). Production deploys only from `main` through Workers Builds (`deploy:production`). Every branch still gets a preview, now on `dcc-web-preview`. D1 migrations run only in Workers Builds deploy commands, before the deploy (research R3). No check is skipped or weakened. |
| **III. Human Review for Major Changes** | **This is a major change** on five counts: it (1) collects, stores, retrieves and deletes contact data; (2) adds external services and integrations (D1, Turnstile, a Cron Trigger, a second Worker and Workers Builds connection) and new dev dependencies; (3) changes the site's Worker and its CI/deploy and infrastructure configuration (`wrangler.jsonc`, deploy scripts, `pnpm-workspace.yaml`, Workers Builds settings); (4) could in principle increase running costs (analysed as $0); (5) touches CODEOWNERS paths (`wrangler.jsonc`, `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `setup/`). The PR carries the `major-change` label, auto-merge stays **off**, and Don approves after checking the preview (the prompt's "done when" is a preview check). |
| **IV. First-Party Before Custom** | Astro: prerendered MDX page plus a registered section component (content collections); processed `<script>` island (docs.astro.build/en/guides/client-side-scripts/); per-page CSP through `Astro.csp` (docs.astro.build/en/reference/api-reference/#csp); typed `astro:env` for the site key (docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables). Astro Docs MCP was available and used. Cloudflare: Workers static assets with `run_worker_first`; D1 plus Wrangler migrations; Wrangler environments; Worker secrets plus `secrets.required`; Cron Triggers; Turnstile; Workers Builds; `wrangler types`; `@cloudflare/vitest-plugin`. **Considered and rejected, with reasons**: the `@astrojs/cloudflare` adapter and Astro Actions (Astro says a static site "doesn't need an adapter"; the adapter adds server rendering, falls back to the Worker for unmatched paths and still needs a custom entry for cron; research R1). The Workers Rate Limiting binding ("per location and approximate", rejected in the technical direction; research R7). Cloudflare Access for retrieval (does not cover `workers.dev` previews and adds a policy surface; research R9). **Custom code** remains only where no first-party feature exists: request validation, the rate-limit query, bearer-token checking and the retention query. |
| **V. Static by Default** | `/contact/` is prerendered. The form's markup and the privacy note render without JavaScript, and a visible notice says sending needs JavaScript. The only JS is one island, plus Turnstile loaded on first interaction. The only server-side code is under `/api/`. |
| **VI. Content as Files** | Page copy lives in `src/content/pages/contact.mdx` and `privacy-policy.mdx`. Messages are private data in D1, not public content, which is the constitution's own exception for the contact API. |
| **VII. Private Data: Minimal and Protected** | Collects only name, email, optional organization, optional project and message. Stores an HMAC-SHA-256 of the IP with a secret salt, never the IP, and the daily cron clears it once the row is older than 24 hours. Structured logs carry outcomes only, Workers invocation logs are off, and a test asserts no value leaks. Every dependency failure fails closed (503, nothing stored). Location is stated: D1 `wnam` (Western North America), recorded here and in the privacy policy. Preview messages go to a separate database, Worker and secrets. A daily cron deletes messages after 12 months. Secrets live only in Worker secrets (`wrangler secret put`), Workers Builds variables and gitignored local files; E2E uses public test values. |
| **VIII. Cloudflare Best Practices** | One Worker per environment serves the site and the API. Only `/api/*` invokes code. Config, migrations and crons are committed and applied by Workers Builds, never in the dashboard (dashboard steps are limited to credentials, the Turnstile widget and build settings, which Wrangler cannot express). The API is same-origin only, verifies Turnstile server-side (with action and hostname checks), rate-limits exactly and refuses non-HTTPS. Workers rules followed: generated `Env` types, Web Crypto, timing-safe token comparison, no floating promises, no module-level request state, observability on, explicit headers because `_headers` does not apply to Worker responses. All D1 queries indexed, with no-scan assertions. |
| **IX. Cost Ceiling** | New items: D1 (2 databases), Turnstile (1 widget), a second Worker, 2 Cron Triggers, Workers Builds minutes, Workers Logs. **Expected monthly cost: $0.** At a generous 20 messages/day: about 240 Worker requests/day of 100,000 (0.24%); about 2,300 D1 rows read/day of 5,000,000 (<0.05%); about 320 rows written/day of 100,000 (0.32%, including clearing fingerprints); ≤ 73 MB storage after 12 months of 500 MB per database; 2 of 5 cron triggers; 2 of 10 databases; about 400–800 build minutes/month of 3,000. Under abuse, the Worker's own 100,000-request cap limits D1 to ≤ 700,000 reads/day (14%). The Free plan errors instead of billing. Full table: research R10. Assumes the account stays on Workers Free. |
| **X. Accessible, Fast and Private** | The form meets WCAG 2.2 AA: labels, `aria-describedby` and `aria-invalid` errors, a polite live region, managed focus, colour pairs from the design-source adjustments table, and axe in CI. The budget is enforced on `/contact/`, with Turnstile loaded late. No tracking. Turnstile is the constitution's allowed spam-protection exception, and the privacy policy names it and what it receives. |
| **XI. Spec Kit Workflow** | Spec Kit branch `007-contact-form` in its own worktree. Parallel-work handling is below. Out-of-scope items (email, newsletter, booking, migration, admin UI) stay out. |

### Parallel work (Principle XI)

This branch runs beside the blog-design and portfolio-design features and will be rebased onto
`origin/main` before the PR, and again before auto-merge would be considered (auto-merge stays
off here). Files this feature edits that are likely to conflict, and how to resolve each:

| File | Expected overlap | Resolution rule |
|---|---|---|
| `wrangler.jsonc` | others may add assets or headers settings | keep both. This feature owns `main`, `run_worker_first`, `d1_databases`, `triggers`, `secrets`, `env.preview`, `observability` |
| `worker/src/index.ts` (new) | none expected | if another feature adds Worker code, route by path inside one `fetch` |
| `public/_headers` | others may add headers | this feature does not edit it (the Worker sets its own headers; research R1) |
| `astro.config.mjs` | CSP resources or integrations from others | this feature adds only the `env.schema` entry. Keep both sides |
| `.github/workflows/*.yml` | unlikely | this feature makes no workflow change unless a step for the worker package is needed. Keep both |
| `docs/setup.md`, `scripts/setup-check/**`, `.claude/skills/setup-walkthrough/SKILL.md`, `tests/unit/setup/**` | another feature adding items would collide on item numbers | renumber the later-merged feature's items to follow; the registry length drives every count |
| `src/content/pages/privacy-policy.mdx` | others may edit other sections | this feature edits only "The contact form", "Spam protection", "Your choices" and the "Last updated" date |
| `src/config/navigation.ts` | others remove their `futureDestinations` entries too | remove only `/contact/`; keep the others' removals |
| `src/components/sections/index.ts`, `schemas.ts` | others may register sections | keep all registrations |
| `tests/e2e/templates.ts` | others add templates | keep all |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | dependency and script changes | merge `package.json` by hand; **regenerate** the lockfile with `corepack pnpm install`, never hand-merge it |
| `src/lib/site-origin.ts`, `setup/config.json`, `scripts/deploy/preview.ts` | unlikely | keep both |
| `tests/e2e/visual.spec.ts-snapshots/` | others add baselines | regenerate only this feature's contact baselines after the rebase |

After each rebase, run the full `verify` locally before pushing (`--force-with-lease`). If a
conflict falls in a file this feature does not own and the right resolution is not obvious,
stop and ask Don.

## Project Structure

### Documentation (this feature)

```text
specs/007-contact-form/
├── spec.md
├── plan.md                  # this file
├── research.md              # Phase 0: decisions R1–R13
├── data-model.md            # Phase 1: messages table, indexes, secrets manifest
├── quickstart.md            # Phase 1: validation guide
├── contracts/
│   ├── contact-api.md       # POST /api/contact
│   ├── retrieval-api.md     # GET /api/messages/new, POST /api/messages/{id}/read
│   ├── worker-config.md     # wrangler.jsonc, deploy scripts, cron, site origin
│   ├── contact-page.md      # DOM, island behaviour, CSP
│   └── setup-items.md       # items 19–25, reader methods, skill changes
├── checklists/              # existing
└── tasks.md                 # Phase 2 (/speckit-tasks, not created here)
```

### Source code (repository root)

```text
wrangler.jsonc                         # + main, run_worker_first, D1, crons, secrets.required, env.preview
pnpm-workspace.yaml                    # + packages: ["worker"]
package.json                           # scripts: test (+ worker), typecheck (+ worker, types --check),
                                       #   types:worker, deploy:production; wrangler 4.144.0
migrations/
└── 0001_create_messages.sql
worker/                                # workspace package "@dcc-web/worker" (private)
├── package.json                       # devDeps: vitest 4.1.x, @cloudflare/vitest-plugin
├── tsconfig.json                      # types: ./worker-configuration.d.ts
├── vitest.config.ts                   # cloudflareTest({ wrangler: { configPath: "../wrangler.jsonc" } })
├── worker-configuration.d.ts          # generated by `wrangler types`, committed
├── src/
│   ├── index.ts                       # fetch (/api/* router) + scheduled
│   ├── http.ts                        # JSON responses + security headers
│   ├── contact/
│   │   ├── rules.ts                   # shared limits + validateSubmission() (runtime-agnostic)
│   │   ├── submit.ts                  # POST /api/contact pipeline
│   │   ├── turnstile.ts               # siteverify
│   │   ├── ip-hash.ts                 # HMAC-SHA-256
│   │   └── rate-limit.ts
│   ├── messages/
│   │   ├── auth.ts                    # bearer, timing-safe
│   │   ├── list-new.ts
│   │   └── mark-read.ts
│   └── retention.ts
└── test/
    ├── setup.ts                       # applyD1Migrations per file
    ├── schema.test.ts
    ├── router.test.ts
    ├── contact.test.ts
    ├── ip-hash.test.ts
    ├── rate-limit.test.ts
    ├── environments.test.ts           # production vs preview project
    ├── retrieval.contract.test.ts
    ├── retention.test.ts
    ├── logging.test.ts
    ├── query-plans.test.ts
    └── rules.test.ts
src/
├── content/pages/contact.mdx          # new page copy + <ContactForm />
├── content/pages/privacy-policy.mdx   # placeholders replaced
├── components/sections/ContactForm.astro  # markup + island <script> + Astro.csp
├── components/sections/index.ts, schemas.ts  # register ContactForm
├── config/navigation.ts               # drop /contact/ from futureDestinations
└── lib/site-origin.ts                 # previewWorkerName for branch previews
astro.config.mjs                       # + env.schema PUBLIC_TURNSTILE_SITE_KEY
setup/config.json                      # + previewWorkerName
scripts/deploy/preview.ts              # rewritten (env preview, migrations, guard)
scripts/deploy/production.ts           # new
scripts/setup-check/                   # items 19–25, checks/*.ts, reader methods, secrets manifest
docs/setup.md                          # part "Contact form", sections 19–25; items 2 and 10 text
.claude/skills/setup-walkthrough/SKILL.md  # region restatement, shown-only commands, counts
.env.example                           # token permission comment
tests/
├── fixtures/worker/e2e.env            # public test values only
├── e2e/contact.spec.ts, templates.ts  # + contact template
├── component/sections/ContactForm.test.ts
├── unit/site/…                        # config-files, csp, site-origin, deploy-*, navigation, privacy-policy
└── unit/setup-check/…, unit/setup/…   # new checks, reader redaction, counts, skill text
playwright.config.ts                   # wrangler dev web server: fresh state, local migrations, --env-file
tsconfig.json                          # exclude worker/ (it has its own tsconfig)
```

**Structure Decision**: a single repository with the static Astro site at the root and the
Worker in a top-level `worker/` workspace package. The package exists so the Worker's tests can
run on the Vitest major the Cloudflare plugin supports. The Worker source lives outside Astro's
`src/`, so `astro check` and the Worker's own `tsc` each type-check against the right runtime
types. The one exception is `worker/src/contact/rules.ts`: it is runtime-agnostic, and the Astro
component imports it, so form and server limits have one source.

## How the new test layers plug into `verify`

`verify` keeps its order: secrets lint → lint → typecheck → test → build → E2E.

| Script | Change |
|---|---|
| `typecheck` | `astro check && tsc -p worker && wrangler types worker/worker-configuration.d.ts --check` |
| `test` | `vitest run && pnpm --filter ./worker test` (root Vitest 5 projects, then the Worker package's Vitest 4 with `@cloudflare/vitest-plugin`) |
| `test:e2e` | unchanged command. Playwright's first web server becomes: remove `.cache/e2e-state`, `wrangler d1 migrations apply contact --local --persist-to .cache/e2e-state`, `wrangler dev --ip 127.0.0.1 --port 4321 --persist-to .cache/e2e-state --env-file tests/fixtures/worker/e2e.env`. E2E stays on `wrangler dev`, not `astro dev` (research R4) |
| `lint` | ESLint also covers `worker/` (typescript-eslint `projectService` picks up `worker/tsconfig.json`). The `no-floating-promises` rule is on for `worker/**` |

GitHub Actions `ci.yml` needs no new step: `pnpm install --frozen-lockfile` installs the
workspace package, and `pnpm run verify` runs everything. `scripts/ci/changed-paths.ts` needs
no change (`worker/` and `migrations/` are not skip-safe, so they run the full gate). **D1
migrations are never applied from GitHub Actions.** Locally and in CI they are applied only to
Miniflare's local D1. Remotely they are applied only by the Workers Builds deploy commands
(`deploy:production` → `contact`, `deploy:preview` → `contact-preview`) using the Workers Builds
token with D1 Edit. `pipeline-secrets` (item 15) therefore still expects no GitHub Actions
secrets.

## Preview deployment mechanics

- `wrangler.jsonc` top level = production (`dcc-web`, `DB` → `contact`). `env.preview` = Worker
  `dcc-web-preview`, `DB` → `contact-preview`, same cron, same required secret names.
- Workers Builds: `dcc-web` builds only `main` and runs `pnpm run deploy:production`.
  `dcc-web-preview` has its own connection and builds every branch with
  `pnpm run deploy:preview` (on `main` it redeploys the preview Worker; on other branches it also
  uploads an aliased version). Both guard `WRANGLER_CI_OVERRIDE_NAME` so a misconfigured
  connection fails instead of crossing environments (research R3; contracts/worker-config.md).
- Secrets are set per Worker (`wrangler secret put NAME` and `… --env preview`), so FR-024's
  "different access keys" holds by construction.
- The preview address becomes `https://<alias>-dcc-web-preview.drc-dev.workers.dev`. This
  branch's address is `https://br-007-contact-form-dcc-web-preview.drc-dev.workers.dev/`.

## Manual setup and `setup:check`

Seven new registry items, all specified in [contracts/setup-items.md](./contracts/setup-items.md):

1. **19 `contact-d1-databases`**: Don runs the two `wrangler d1 create … --location wnam`
   commands after the region restatement (FR-027a). The agent commits the IDs.
2. **20 `contact-turnstile-widget`**: dashboard widget for `doncoleman.ca` and
   `drc-dev.workers.dev`.
3. **21 `contact-worker-secrets`**: three secrets on each Worker. The preview command creates
   `dcc-web-preview`.
4. **22 `contact-preview-builds`**: connect `dcc-web-preview` to the repository; turn off
   `dcc-web` non-production builds.
5. **23 `contact-turnstile-site-key`**: build variable on both connections.
6. **24 `contact-preview-deploy`**: D1 Edit on the Workers Builds token. Confirmed by the
   migrations applied to `contact-preview` and the preview cron being registered.
7. **25 `contact-production-deploy`** (after merge): the production deploy command becomes
   `pnpm run deploy:production`. Confirmed by the migrations on `contact` and the production
   cron.

Checks run through the existing `CloudflareReader` with the read-only local token, which gains
D1 Read, Workers Builds Configuration Read and Turnstile Sites Read. They read names only: D1
database list and region, `d1_migrations` through a fixed read-only `SELECT`, Worker secret
**names**, Worker schedules, Workers Builds triggers and build-variable **keys**, and Turnstile
widget name/domains/mode. Every reader drops value, secret and sitekey fields before returning,
and tests prove it. `setup:check` is extended **first**, so it fails on items 19–25 until each is
done.

The walkthrough stays in `docs/setup.md` rather than a new `docs/setup/` directory. The
prompt itself names `docs/setup.md` as the current location, and the existing drift tests
require the runbook, registry and skill to agree (research R13).

## Privacy policy text (FR-019)

Replace the placeholders in `src/content/pages/privacy-policy.mdx`:

- **The contact form**: the fields (name, email, optional organization, message, and the project
  you came from, if any) and why (to reply to you). The IP address is used only to limit repeat
  sending and is stored only as a one-way salted fingerprint, which is removed after about two
  days. Messages are stored in Cloudflare
  D1 in Western North America (Cloudflare places the database as close to that region as it
  can; it cannot be limited to Canada). They are deleted automatically 12 months after they
  arrive, whether read or not. No email or other notification is sent.
- **Spam protection**: Cloudflare Turnstile. It loads when you start filling in the form and
  receives your IP address and the browser and device signals its own script collects, plus a
  one-time token, to tell people from automated submissions. No form field is sent to it
  (FR-012b). It sets no tracking cookies. Link to Cloudflare's Turnstile privacy addendum.
- **Your choices**: how to ask what is held or to have a message deleted (a new contact-form
  message or Don's listed email, answered by hand within 30 days). Deletion removes the message
  at once, but Cloudflare's D1 recovery history (Time Travel, 7 days on the Free plan) keeps it
  for up to 7 more days. "Last updated" is set to the merge date.

Every fact above comes from spec FR-019 (the single source). `tests/unit/site/privacy-policy.test.ts`
asserts the page states `RETENTION_MONTHS` from the shared rules and "Western North America",
so the policy and the code cannot drift (FR-019a). The retention value changes only through a
major change that edits the policy in the same PR (FR-018a).

`draft: true` stays as it is. Publishing the policy is outside this feature.

## Risks and follow-ups

| Risk | Mitigation |
|---|---|
| D1 region cannot be read from a documented API field | The check fails closed (`missing`) unless `running_in_region` is `WNAM`. The creation command's `--location wnam` is the real guarantee, restated at the step |
| Turnstile may refuse a `workers.dev` hostname | Documented fallback: preview only uses Turnstile's always-pass test keys (research R6) |
| `@cloudflare/vitest-plugin` does not support Vitest 5 yet | Isolated `worker/` workspace on Vitest 4. Revisit when the plugin supports Vitest 5 (follow-up) |
| pnpm `minimumReleaseAge` may block same-day releases (plugin 1.3.3, wrangler 4.144.0) | Pick the newest aligned versions outside the window, or add exact `minimumReleaseAgeExclude` entries as the file already does |
| E2E depends on `challenges.cloudflare.com` | Official test keys; one clearly named spec file. A Cloudflare outage shows up as a network failure in CI, never as a silent pass |
| Between merge and item 25, production has no `messages` table | The API answers 503 with the message kept. The walkthrough's after-merge step comes right after the merge. Production is still only the review address |
| A branch with a new migration applies it to the shared `contact-preview` | Migrations must be additive (config test). Previews are test data |
| Workers Paid plan would turn D1 overage into charges | The plan assumes Workers Free. Changing it is its own major change |
| First `main` build on `dcc-web-preview` fails before merge | Expected and stated in item 22 |
| Visual baselines need Linux regeneration (Docker) | Per CLAUDE.md: ask Don to start Docker Desktop; CI label is the fallback |

## Rollback

- **Failed migration**: both deploy scripts apply migrations first and stop at the first failing
  step, so the old code keeps running against the old schema. Migrations are additive only
  (config test), so the previous code is always compatible with a partly applied schema. Fix
  forward with a new migration in a reviewed PR.
- **Failed or bad Worker deploy**: `wrangler deploy` is atomic; a failed upload leaves the
  previous version active. A deployed version that misbehaves is rolled back by reverting the
  merge commit in a reviewed PR (merge commits only), which redeploys the previous code through
  Workers Builds. In an emergency, Don can run `pnpm exec wrangler rollback` (production) or
  `… --env preview`, then land the revert PR so the repository matches.
- **Data**: D1 Time Travel (7 days on the Free plan) can restore a database to a point in time
  if a bad change corrupts messages. Restoring is a manual, reviewed step for Don.

## Post-design Constitution re-check

Re-checked after writing data-model.md and the contracts: no new service, dependency or cost
beyond those listed above. Every query has an index, pinned by `query-plans.test.ts`. No
personal data leaves D1 except to the bearer-authenticated assistant and, for the IP, to
Turnstile siteverify, which the privacy policy states. The dashboard steps are all credentials,
widget or build settings that Wrangler config cannot hold. Worker code, bindings, crons and
migrations are all committed and applied by Workers Builds (VIII). **Gate: PASS.**

## Complexity Tracking

No constitution violations to justify. Two deliberate complexities are recorded for reviewers:

| Choice | Why needed | Simpler alternative rejected because |
|---|---|---|
| A second Worker (`dcc-web-preview`) with its own Workers Builds connection | FR-017/FR-024 need separate data **and** keys, and a preview cron | Per-version bindings on `dcc-web` share secrets across versions and give the preview database no cron (research R3) |
| A `worker/` pnpm workspace package on Vitest 4 | Cloudflare's Vitest integration supports only Vitest `^4.1.0` | Downgrading the whole repository to Vitest 4 regresses shared tooling; forcing peers is unsupported (research R5) |
