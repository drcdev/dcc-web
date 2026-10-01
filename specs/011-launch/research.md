# Research: Launch the new doncoleman.ca

Phase 0 output for `specs/011-launch/plan.md`. Each entry records the decision, the rationale,
and the alternatives considered. Astro choices cite the Astro documentation found through the
Astro Docs MCP server (`astro-docs`), which was available for this plan. Cloudflare choices cite
the developers.cloudflare.com pages read while planning.

## R1. Where the numbered launch walkthrough lives

- **Decision**: A new file, `docs/launch.md`, holds the numbered launch walkthrough: steps
  `L1`…, rollback `R1`… and retirement `T1`…. `docs/setup.md` stays the item reference. It
  gains a "Launch" part with one section per new setup item (26 to 32), in the same five-part
  format as every other item, and its intro links to `docs/launch.md`. The feature brief said
  `docs/setup/`, but the repository has a single `docs/setup.md` runbook and no `docs/setup/`
  folder. The walkthrough therefore sits beside the runbook instead of in a new folder for one
  file.
- **Rationale**: `docs/setup.md` is a one-to-one mirror of the setup item registry, enforced by
  `tests/unit/setup/drift.test.ts` and `docs-structure.test.ts`: every `## … {#id}` section is
  a registry item, in order. The launch walkthrough mixes item confirmations with manual steps
  that are not items (recording records, the switch, rollback, reminders, retirement). It is
  also read on two separate occasions: launch day, and again two weeks later. Adding those
  steps to `docs/setup.md` would either break the one-section-per-item rule or need anchors the
  drift test rejects. Both files count as setup documentation (FR-005).
- **Alternatives considered**: (a) a `docs/setup/` folder with `setup.md` moved into it. This
  breaks every existing `docs/setup.md#…` link that `setup:check` prints, for no gain. (b) `###`
  steps appended to `docs/setup.md`. The tests would allow it, but the walkthrough would end up
  inside item 25's section.

## R2. How the setup check knows the switch has happened (FR-012, FR-017)

- **Decision**: The setup check works out the launch phase on every run, with no stored flag.
  The phase is **switched** when the Cloudflare API lists a Workers Custom Domain for the zone
  apex (`doncoleman.ca`) on Worker `dcc-web` (`listWorkerDomains(accountId, zone)`). Otherwise
  it is **before switch**. One shared function, `detectLaunchPhase(ctx)` in
  `scripts/setup-check/checks/launch-phase.ts`, is used by items 4, 6, 16, 18 and 28 to 31.
- **Rationale**: Adding the apex Custom Domain is the one deliberate act that makes the switch
  (R4). Only Don can do it, so it is the "deliberate switch" signal that FR-012 asks for. In a
  rollback Don removes the Custom Domain first (R10). The phase then returns to "before switch"
  and item 6 checks the Ghost records again. A committed flag would need a commit at the moment
  of the switch, and it would drift from reality during a rollback. This approach reuses the
  read that the existing `review-address` check already makes, so no new token permission is
  needed.
- **Alternatives considered**: (a) a `launch.switched` flag in `setup/config.json`, rejected
  for the drift and commit-timing reasons above. (b) Inferring the switch from public DNS
  alone, rejected because any DNS answer that is neither Ghost nor Cloudflare would look like a
  switch. DNS is still used to tell "settled" from "pending" (R7).

## R3. Reporting "waiting for the switch" (FR-017)

- **Decision**: Add a fifth check status, `waiting`. Post-launch items (16 and 28 to 31) return
  it before the switch, with a summary starting "Waiting for the switch:". The report counts it
  separately (`counts.waiting`) and prints it as "waiting". `ok` treats it as not failing, in
  the same way it treats `deferredUntilMerge` items today. After the switch these items return
  `complete`, `pending` (still settling) or `missing` with a summary starting "Problem:", as
  usual.
- **Rationale**: FR-017 names three states before "complete": waiting, pending and problem.
  `pending` already means "settling, no action needed", and after the switch it must count as
  not done, so it cannot also mean "not applicable yet". A separate status is clearer, both for
  Don and for the `/setup-walkthrough` skill, than a convention in the summary text.
- **Alternatives considered**: a registry flag `deferredUntilSwitch`, like `deferredUntilMerge`.
  Rejected because the report cannot know the phase, so it could not tell "waiting" from
  "pending after the switch".

## R4. Pointing the apex at the Worker

- **Decision**: Don deletes the Ghost `A` record and then, straight away, adds `doncoleman.ca`
  as a **Workers Custom Domain** on `dcc-web` in the dashboard (Workers & Pages → `dcc-web` →
  Settings → Domains & Routes → Add → Custom Domain). This is how `new.doncoleman.ca` was added
  (setup item 16). Cloudflare creates the proxied DNS record and issues the certificate.
- **Rationale**: Custom Domains are Cloudflare's first-party way to attach a Worker to a
  hostname you own, apex included, with an automatic certificate. Cloudflare's docs say a Custom
  Domain cannot be created on a hostname that already has a DNS record
  (developers.cloudflare.com/workers/configuration/routing/custom-domains/), so the Ghost `A`
  record has to go first. With the default TTL the gap is a minute or less, and Don does both
  actions in one sitting.
- **Why it is not committed in `wrangler.jsonc` now**: Principle VIII says Worker configuration
  is committed and applied through CI. A `routes: [{ pattern: "doncoleman.ca", custom_domain:
  true }]` entry would make merging this pull request perform the DNS switch, before the
  readiness gate and outside Don's control (against FR-004 and FR-006). During a rollback, every
  later deploy from `main` would also take the apex back. Deploys from `main` have left the
  dashboard-added `new.doncoleman.ca` Custom Domain in place ever since setup item 16, so a
  config without `routes` does not remove dashboard Custom Domains. This is recorded as a
  justified exception in the plan's Complexity Tracking. Follow-up: once Ghost is cancelled and
  rollback is no longer possible, the apex Custom Domain moves into `wrangler.jsonc`.
- **Alternatives considered**: (a) a Worker route `doncoleman.ca/*` on a proxied placeholder
  record. It has more moving parts and is no better than a Custom Domain. (b) Committing the
  route, rejected above.

## R5. `www` permanently redirects to the bare domain (FR-010a)

- **Decision**: Replace the Ghost `CNAME www` with a proxied `AAAA www 100::` placeholder record,
  and add one **Single Redirect rule** (Rules → Redirect Rules) with these settings:
  - wildcard request URL `*://www.doncoleman.ca/*`
  - target `https://doncoleman.ca/${2}`
  - status 301
  - preserve query string

  Cloudflare documents exactly this setup in two places: the "Redirect www to root" example
  (developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/), and the
  Custom Domains page, which describes the proxied `100::` placeholder for a hostname with no
  origin.
- **Rationale**: Redirect Rules run at the edge before any Worker, are included in the free
  plan, and keep the path and query. A redirect in the Worker would mean every `www` path runs
  Worker code. That breaks Principle VIII ("only `/api/*` invokes Worker code") and Principle V.
  The Workers static-assets `_redirects` file matches paths only, not hosts.
- **Alternatives considered**: a second Custom Domain for `www` plus a redirect in the Worker
  (rejected above), and Bulk Redirects, which are meant for lists of URLs and take more setup
  for a single rule.

## R6. Search-engine indexing: live site indexable, previews not (FR-018)

- **Decision**: Two layers.
  1. **HTTP header, by host.** `public/_headers` drops the site-wide `X-Robots-Tag: noindex`
     and adds two host-scoped rules instead, `https://:worker.:subdomain.workers.dev/*` and
     `https://new.doncoleman.ca/*`, each sending `X-Robots-Tag: noindex`. Workers static assets
     support absolute-URL rules with placeholders in `_headers`, and Cloudflare's own example is
     this workers.dev noindex rule (developers.cloudflare.com/workers/static-assets/headers/).
     The first rule covers every branch alias, every version preview URL, and both Workers' own
     `workers.dev` addresses. The `new.doncoleman.ca` rule keeps the review address unindexed
     between the merge and its removal (FR-019a), and is deleted in the retirement follow-up.
  2. **Robots meta tag, by build.** The constant `indexable: false` in `src/config/site.ts`
     becomes a build-time decision. A build is indexable only when it is a Cloudflare Workers
     Builds build of `main`: `WORKERS_CI === "1"` and `WORKERS_CI_BRANCH === "main"`, exactly.
     Every other build (branch previews, local, GitHub Actions, Playwright) keeps
     `<meta name="robots" content="noindex">`. Draft posts and the not-found page stay noindex
     in every build. The value is read through `astro:env/server`, which already has
     `WORKERS_CI` and `WORKERS_CI_BRANCH` in its schema, via a pure helper beside
     `isProductionBuild` in `src/lib/build-mode.ts`. Unlike the draft rule, it fails toward
     noindex when the branch cannot be read.
- **Rationale**: A main build is served from three hosts: the live apex (indexable),
  `dcc-web.drc-dev.workers.dev`, and `dcc-web-preview.drc-dev.workers.dev` (the preview Worker
  also builds `main`). Static HTML cannot tell these hosts apart, so the host decision has to be
  an HTTP header. The meta tag is a second guard for branch previews, which are the only builds
  that can hold unreviewed content.
- **Astro docs**: typed environment variables
  (docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables). This is
  the same pattern `src/lib/posts.ts` already uses.
- **Alternatives considered**: (a) a robots.txt `Disallow`. This is ruled out by the existing
  rule in `docs/setup.md` item 17 and in `src/pages/robots.txt.ts`: a crawl block hides the
  noindex signal. (b) A Worker that adds the header by host. It would need `run_worker_first`
  on every path, which Principle VIII rules out.

## R7. Telling "pending" from "problem" after the switch (FR-017, edge cases)

- **Decision**: A post-launch item is **pending** in either of these cases:
  - The two public resolvers (1.1.1.1 and 8.8.8.8, queried separately) disagree, or either one
    still returns a Ghost target from the baseline (`49.13.201.194` or
    `drift-and-convergence.mymagic.page`).
  - The HTTPS request fails during the TLS handshake, meaning the certificate is not issued
    yet.

  Any other failure is `missing`, with a summary starting "Problem:".
- **How**:
  - `DnsReader` gains `resolveEach(name, type)`, which returns the answers from each resolver
    separately.
  - `ProviderAccessError` gains an optional `kind` (`"tls" | "timeout" | "network"`).
    `providers/http.ts` sets it from the fetch error's `cause.code`: `ERR_TLS_*`,
    `UNABLE_TO_VERIFY_*`, `CERT_*`, `EPROTO`, or a reset during the handshake.
- **Alternatives considered**: a fixed wait after the switch. It would be either too long or too
  short, and it is not a check.

## R8. Sitemap and internal link check (FR-001, FR-002, FR-014)

- **Decision**: A small TypeScript module with no dependencies, `scripts/site-check/crawl.ts`.
  The fetcher is injected so tests can replace it.
  - **Sitemap**: it reads `robots.txt`, then `sitemap-index.xml`, follows each child sitemap
    and collects every `<loc>`. All `<loc>` entries must share one declared origin. When
    `--expect-origin` is given, that origin must equal it.
  - **Pages**: it maps the declared origin onto the base being checked, so the same build can
    be checked on `127.0.0.1`, on a preview alias or on the live domain. Each page must return
    **200 with no redirect**.
  - **Links**: it collects every `<a href>` from those pages and resolves it against the page.
    It keeps only same-site targets (the base origin or the declared origin), drops the
    fragment, and checks each unique target once. A same-site redirect is followed for up to 5
    hops and must end in 200.
  - **Reporting**: each failure names the target, the status (or the network reason) and every
    page that links to it.
  - **Load**: at most 4 requests at a time. A 5xx or network error is retried once.
  - **Ignored**: other sites, `mailto:`, `tel:`, `javascript:`, and links that are only a
    fragment. The spec's edge cases say links to other sites are never checked.
- **Rationale (Principle IV)**: Astro has no first-party link checker. `@astrojs/sitemap` only
  generates the sitemap (docs.astro.build/en/guides/integrations-guide/sitemap/). An Astro Docs
  MCP search for link checking found no build feature or official integration, and Cloudflare
  offers none either. A third-party checker such as linkinator or lychee would add a
  dependency, which is a major change and a new tool under the Technology Constraints. It would
  still need custom code for the origin mapping, the rule that sitemap entries must not
  redirect, and the preview noindex check. The module is about 200 lines and uses Node's
  built-in `fetch`. Astro writes well-formed, quoted attributes, so a narrow `href` and `<loc>`
  extractor is enough. It does not try to be a general HTML parser.
- **Reuse**: The same module backs three things: the local e2e spec, the CLI that CI runs
  against the preview, and setup item 30 (live sitemap, with link checking off, through an
  adapter over `HttpReader`).

## R9. Running the crawl in CI against the preview build (FR-001, US1 scenario 2)

- **Decision**: A new last step in the existing `verify` job of `.github/workflows/ci.yml`,
  named `Check the preview's sitemap and links`. It runs `node scripts/site-check/preview.ts`,
  only on `pull_request` and only when the full gate runs
  (`steps.changes.outputs.full != 'false'`). The script does four things:
  1. **Waits for the preview build.** It polls the check-runs REST API with `GITHUB_TOKEN`
     every 20 seconds, for up to 20 minutes, until the check run named
     `Workers Builds: dcc-web-preview` on the pull request's head SHA
     (`github.event.pull_request.head.sha`) completes. Cloudflare's Git integration posts that
     check run on every pull request (it is on PR #22). If the run fails, is cancelled or never
     appears, the step fails with a plain message.
  2. **Works out the preview address** the same way the build does: `previewAlias(head_ref)`
     from `src/lib/site-origin.ts`, plus `previewWorkerName` and `workersSubdomain` from
     `setup/config.json`. For this branch that gives
     `https://br-011-launch-dcc-web-preview.drc-dev.workers.dev`.
  3. **Crawls** with `--expect-origin` set to that address and with `--expect-noindex`, which
     requires every crawled page response to carry `X-Robots-Tag: noindex`. This checks the
     preview half of FR-018 against the real host-scoped `_headers` rule (R6). Local
     `wrangler dev` on `http://127.0.0.1` cannot match that rule.
  4. **Reports failures** three ways: one per line in the log, as `::error::` annotations, and
     as a table in `$GITHUB_STEP_SUMMARY`. The step exits 1, so `verify` fails and the merge is
     blocked (branch protection already requires `verify`).

  The job gains `checks: read` permission. No new secret is added.
- **Rationale**: Putting the step inside `verify` makes it blocking without changing the GitHub
  ruleset or setup item 14. The verify gate takes about 8 minutes, so the preview build has
  normally finished by the time the step starts. The step fails closed (Principle II), so a
  Workers Builds outage blocks merges. That trade-off is accepted and listed as a risk.
- **Alternatives considered**:
  - A separate job or workflow triggered by `check_run`. That event only runs workflows from
    the default branch, and it would need a new required check.
  - Reading the build status from the Cloudflare API. This needs a new GitHub secret and a
    broader token.
  - Parsing the Cloudflare bot's comment on the pull request, which is brittle.
- **Local layer**: `tests/e2e/site-links.spec.ts` runs the same crawler against the local
  `wrangler dev` server (port 4321) as part of `pnpm run verify`. A broken internal link
  therefore fails locally before it is pushed.

## R10. Rollback

- **Decision**: Rollback reverses the switch, in this order:
  1. Remove the `doncoleman.ca` Custom Domain from `dcc-web`. Cloudflare deletes its DNS record.
  2. Recreate `A doncoleman.ca 49.13.201.194` as DNS only.
  3. Delete `AAAA www 100::` and recreate `CNAME www drift-and-convergence.mymagic.page` as DNS
     only.
  4. Turn off the www redirect rule.

  To confirm, `pnpm setup:check --item live-domain-ghost` reports complete ("still on Ghost")
  and `--item dns-records-parity` reports complete. The four actions are all in the dashboard
  and fit inside SC-005's 15 minutes.
- **Source of the records**: `setup/dns-baseline.json` already holds both Ghost web records.
  They were recorded from Squarespace during setup and confirmed in Cloudflare by item 4. The
  walkthrough shows them as a table (type, name, value, proxy, TTL), and a unit test fails if
  the table and the baseline ever disagree. Before the switch, Don also confirms them in the
  dashboard and saves a zone export to his own machine (DNS → Records → Import and Export →
  Export).

## R11. Mail records and the Mailgun clean-up (FR-016, FR-024)

- **Decision**: The mail comparison moves out of item 6 into a new item 32, `mail-records`. It
  covers every `keep` baseline record of type MX or TXT, plus DKIM `CNAME` records (names that
  contain `._domainkey.`). Each record is checked against both public resolvers, both before and
  after the switch.

  After Ghost is cancelled, Don deletes the Mailgun records. The agent then sets those baseline
  entries to `decision: "drop"` with a dated reason instead of deleting them. That keeps the
  history readable, and item 4 does not report them as unaccounted for. From then on,
  `mail-records` checks only the iCloud records. A dropped record that still answers in public
  DNS is shown as a detail.
- **Open point flagged for Don**: the baseline also holds `CNAME email.mail.doncoleman.ca →
  eu.mailgun.org`. This is Mailgun's click-tracking host, used only by Ghost's newsletter. The
  spec lists four Mailgun records: two MX, the SPF TXT and the DKIM TXT. The walkthrough adds
  this CNAME as a fifth record to delete at the same time, marked as Don's decision. A CNAME
  left pointing at a Mailgun host Don no longer controls is a subdomain-takeover risk.

## R12. Main-branch site origin (FR-010a)

- **Decision**: For Workers Builds builds of `main`, `resolveSiteOrigin` returns
  `https://doncoleman.ca` (the existing `FALLBACK_ORIGIN`) instead of `https://${reviewHost}`.
  Branch builds keep their alias origin. `site-origin.ts` no longer reads `reviewHost`.
  `reviewHost` stays in `setup/config.json` only as the name of the address being removed, used
  by items 16 and 17 and by the `_headers` rule.
- **Astro docs**: `site` drives canonical URLs, the sitemap and `Astro.site`
  (docs.astro.build/en/reference/configuration-reference/#site;
  docs.astro.build/en/guides/integrations-guide/sitemap/).
- **Consequence**: Between the merge and the switch, `new.doncoleman.ca` serves pages whose
  canonical link, sitemap and robots.txt all name `https://doncoleman.ca`. This does no harm,
  because the review address still sends `X-Robots-Tag: noindex` (R6). The readiness crawl of
  the review address maps the declared origin onto the base it is checking (R8).

## R13. Fly.io

Constitution 2.0.0 removed Fly.io: the contact API and its storage run on Cloudflare Workers and
D1. Nothing in this feature runs on Fly.io, so no Fly.io option applies.

## R14. Exports from the old services

- **Ghost**: Ghost's own export tools. Content: Ghost Admin → Settings → Advanced →
  Import/Export → Export content (JSON). Members: Members → Export all members (CSV).
- **Supabase (Flux)**: Supabase's own tools. Export: Supabase dashboard → Table Editor → the
  contact submissions table → Export to CSV. Delete: Project Settings → General → Delete
  project. Before deleting, Don confirms the project's name, and that it holds Flux's `contact`
  table and `contact` edge function (`.reference/flux/supabase/`), so it is not his other
  project.
- **Handling**: Exports stay on Don's machine and are never committed. The agent only checks
  that each file exists (`ls -l` on a path Don gives). It never opens the members file or the
  submissions file, because both hold personal data (Principle VII).
