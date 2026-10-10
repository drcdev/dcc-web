# Setup runbook

This is the plain-language record of every account-side setup item this repository depends on:
what each item is for, where Don does it, how it is confirmed, which constitution principle it
serves, and the names (never values) of any secrets involved. It is the no-agent fallback for
the `/setup-walkthrough` Claude Code skill, and the two must never disagree — both read the same
16-item registry in `scripts/setup-check/items.ts`, confirmed by `pnpm setup:check`.

Run `pnpm setup:check` at any time to see which of the 16 items below are complete. Each item's
step number and anchor match the registry in `scripts/setup-check/items.ts`; item 16 is the
"Contact form" part. The edge protections Don set up in the Cloudflare dashboard are recorded
in the Edge protections part at the end; they are not setup items.

A term used below: a **ruleset** is GitHub's mechanism for protecting a branch (blocking force-pushes, requiring
checks, requiring review) — `setup/github-ruleset.json` is the one this repository imports.

## 1. Local tools {#local-tools}

**What it is for**
Everything else in this setup depends on Node 24 and pnpm being installed correctly, and on
Don's own GitHub sign-in, so the setup check and the site's tooling can run at all.

**Where to do it**
On Don's own machine, in a terminal: `nvm install 24 && nvm use 24` (or your Node version
manager's equivalent), then `gh auth login` if not already signed in.

**How it will be confirmed**
`pnpm setup:check --item local-tools` reports complete when Node is 24 or later, the installed
pnpm version matches the `packageManager` field in `package.json`, and `gh auth status` shows Don
signed in.

**Constitution principle**
II (Automated Release Gate) — the whole `verify` gate depends on the right tool versions being
installed locally.

**Secrets**
None.

## 2. Local credentials {#local-credentials}

**What it is for**
The setup check reads Cloudflare state with a token that only Don holds; that token and the
account/zone IDs live in a local file the check reads, never in the repository.

**Where to do it**
Create a read-only Cloudflare API token first (Cloudflare dashboard → My Profile → API Tokens →
Create Token), scoped to Don's account and the `doncoleman.ca` zone only, with permissions Zone →
Zone: Read, Zone → DNS: Read, Account → Workers Scripts: Read, Account → Account Settings: Read
(the permission Cloudflare's API requires to list Web Analytics sites; there is no "Web
Analytics" token permission), and, for the contact form (item 16), Account → D1: Read,
Account → Workers Builds Configuration: Read and Account → Turnstile Sites: Read. If you made
the token before the contact form, edit it and add those three. Then copy `.env.example` to `.env` in the repository root and fill in the values in your own
editor.

**How it will be confirmed**
`pnpm setup:check --item local-credentials` reports complete when `.env` has a non-empty value
for every required name and Cloudflare's token-verify endpoint reports the token active.

**Constitution principle**
VII (Private Data: Minimal and Protected) — secrets live only in a gitignored local file,
never committed.

**Secrets**
`CLOUDFLARE_API_TOKEN` (secret, read-only), `CLOUDFLARE_ACCOUNT_ID` (variable),
`CLOUDFLARE_ZONE_ID` (variable).

## 3. Cloudflare zone {#cloudflare-zone}

**What it is for**
The site's DNS and hosting live in a Cloudflare zone for `doncoleman.ca`; nothing else in this
setup can happen until the zone exists.

**Where to do it**
Cloudflare dashboard → Add a site → `doncoleman.ca` → choose the Free plan. DNSSEC is on: the zone
is signed and the registry holds its DS record.

**How it will be confirmed**
`pnpm setup:check --item cloudflare-zone` reports complete when zone `doncoleman.ca` exists on the
Free plan and its ID equals `CLOUDFLARE_ZONE_ID` in `.env`.

**Constitution principle**
IX (Cost Ceiling) — the Free plan keeps this item at $0/month.

**Secrets**
None beyond the `CLOUDFLARE_ZONE_ID` variable recorded under "Local credentials" above.

## 4. DNS records parity {#dns-records-parity}

**What it is for**
Every DNS record the site and its email depend on (mail, verification, DMARC and CAA records) must
exist in the Cloudflare zone with identical values, and the zone must hold nothing else off the
apex and `www`.

**Where to do it**
`setup/dns-baseline.json` is the list of records that must exist: `type`, `name`, `content`,
`priority` and `ttl` for each. Keep each of them in the Cloudflare zone as DNS only (grey cloud).
Leave each record's TTL on Cloudflare's "Auto" preset: the Cloudflare dashboard offers only TTL
presets, not a custom value, so an exact TTL match isn't possible. The baseline records the TTL
Cloudflare's API reports (`1` when the record is on Auto), and the check reports a difference
between it and Cloudflare's TTL as an informational detail only, never a mismatch. To add or
change a record, edit the baseline in the same reviewed change as the Cloudflare dashboard change.

**How it will be confirmed**
`pnpm setup:check --item dns-records-parity` reports complete only when every record in the
baseline matches the Cloudflare zone (type, name, content, and priority for MX/SRV, proxy off) and
the zone holds no other record on a name besides the apex and `www`. A TTL difference is shown as
an informational detail and does not block completion. The records Cloudflare adds on the apex and
`www` for the Worker's Custom Domain stay informational. Any other added, removed or changed record
reports `missing` with a summary starting "Problem:". It stays `missing` while the baseline has no
records, so parity can never pass vacuously.

**Constitution principle**
VI (Content as Files) and X (Accessible, Fast and Private) — the baseline is a committed,
reviewed file, not a one-time manual comparison.

**Secrets**
None — DNS records are public data, not secrets.

## 5. Mail records unchanged {#mail-records}

**What it is for**
The domain's mail keeps working: every mail record recorded in `setup/dns-baseline.json` still answers
unchanged.

**Where to do it**
Cloudflare dashboard → the zone → DNS. Restore any MX, TXT or DKIM CNAME record the details list, exactly as
recorded in the baseline.

**How it will be confirmed**
`pnpm setup:check --item mail-records` asks both public resolvers (1.1.1.1 and 8.8.8.8) and reports complete
when each returns the baseline MX, TXT and DKIM CNAME records for every mail group (order and TTL
ignored). It is `pending` when only one resolver matches (wait for DNS to finish updating, then run it
again), and a `Problem:` otherwise.

The `_dmarc` record is at `p=none`, with reports through Cloudflare DMARC Management
(developers.cloudflare.com/dmarc-management/). Tightening it to `quarantine` and then `reject` is
tracked in #136. When the policy changes, update the `_dmarc` record in `setup/dns-baseline.json` in
the same reviewed change, or `dns-records-parity` reports the difference.

**Constitution principle**
VII (Private Data: Minimal and Protected).

**Secrets**
None.

## 6. Cloudflare Worker {#cloudflare-worker}

**What it is for**
The new site is hosted as a Cloudflare Worker serving static assets; this item creates that
Worker. Production is served only on the zone's Custom Domain, so `workers.dev` and Preview URLs stay
off for `dcc-web`.

**Where to do it**
Cloudflare dashboard → Workers & Pages → Create → Import a repository → `drcdev/dcc-web` (this
creates the Worker and connects Workers Builds in one step). Authorise Cloudflare's GitHub app
for the `drcdev/dcc-web` repository only, not all repositories. Then leave `workers.dev` and
Preview URLs off for `dcc-web`: `wrangler.jsonc` sets both to `false` and Wrangler applies them on each
deploy. The account's `workers.dev` subdomain must be on, because the preview Worker uses it.

**How it will be confirmed**
`pnpm setup:check --item cloudflare-worker` reports complete when Worker `dcc-web` exists and
the account's `workers.dev` subdomain is on (used by the preview Worker).

**Constitution principle**
VIII (Secure by Default) — production runs on the zone's Custom Domain, not `workers.dev`.

**Secrets**
None — no Cloudflare deploy token is stored in GitHub; Workers Builds deploys directly.

## 7. GitHub machine account {#github-machine-account}

**What it is for**
Agents open pull requests as a dedicated machine account, separate from Don's own account, so
Don's review always counts as an independent approval.

**Where to do it**
Create a GitHub account named `drc-agents` (the name recorded in `setup/config.json`), add it as a
`drcdev/dcc-web` collaborator with write permission (not admin), and sign it into the local `gh`
keyring (`gh auth login`). Switch the active `gh` account back to Don afterwards (`gh auth
switch`) — the check reads as Don.

Don is the sole maintainer, so his approval does not count as an independent review on a pull
request he authored himself — GitHub does not let an author approve their own pull request, and
this setup does not try to work around that. If an agent ever opens a pull request under Don's
own account by mistake, it must be closed and reopened from `drc-agents` before Don can approve it;
a pull request authored by Don cannot be merged through the normal review gate.

**How it will be confirmed**
`pnpm setup:check --item github-machine-account` reports complete when the machine account's
collaborator permission is write or maintain, and not admin.

**Constitution principle**
III (Human Review for Major Changes) and VII (Private Data) — the machine account's credential
lives only in the agent's sign-in store.

**Secrets**
`DCC_BOT_GITHUB_CREDENTIAL` (kept only in the agent's `gh` keyring; never stored in the
repository).

## 8. GitHub secret scanning and Dependabot {#github-secret-scanning}

**What it is for**
GitHub's own secret scanning and push protection are a first-party, always-on backstop against
ever committing a secret, alongside the local `secretlint` gate. Dependabot security updates
open a fix PR when an advisory hits a dependency.

**Where to do it**
Repository Settings → Code security → turn on Secret scanning, Push protection and Dependabot
security updates (Dependabot alerts must be on first).

**How it will be confirmed**
`pnpm setup:check --item github-secret-scanning` reports complete when
`security_and_analysis.secret_scanning`, `…secret_scanning_push_protection` and
`…dependabot_security_updates` are all enabled.

**Constitution principle**
VII (Private Data: Minimal and Protected).

**Secrets**
None.

## 9. Workers Builds {#workers-builds}

**What it is for**
Confirms that Workers Builds is actually building and deploying this repository — production
from `main` on the `dcc-web` Worker, and a preview for every other branch on the separate
`dcc-web-preview` Worker — once this slice's files are on `main`. A preview build needs to know
its own served address (for its canonical link, `og:url` and `robots.txt`), and Cloudflare does
not hand a non-aliased preview upload a predictable URL, so the preview deploy command uploads an
aliased preview instead of a plain one. Previews live on their own Worker so they use the preview
database and the preview secrets, never production's (see step 16).

**Where to do it**
Nothing new beyond step 6 for the `dcc-web` Worker, and the preview Worker is connected to the same repository under Workers & Pages → `dcc-web-preview` → Settings → Build.
On `dcc-web`, the **build command stays `pnpm run build`, unchanged**. Its production deploy command
is `pnpm run deploy:production` (confirmed by step 16, Contact bindings). Non-production branch builds are turned **off** on `dcc-web`
— they now belong to `dcc-web-preview`, whose Workers Builds connection uses `pnpm run build` and
`pnpm run deploy:preview` for every branch. No secret or token is involved in the deploy command:
`pnpm run deploy:preview` runs `scripts/deploy/preview.ts`, which derives a stable alias from the
branch name (the same function `astro.config.mjs` uses to resolve the build's own address) and
calls `wrangler versions upload --env preview --preview-alias <alias>` after applying the preview
database migrations.

**How it will be confirmed**
`pnpm setup:check --item workers-builds` reports complete when the latest commit on `main` has a
successful Workers Builds run, and the latest open pull request (if any) has one with a preview
URL. It matches check runs by the "Workers Builds" prefix, which covers both Workers. It reports
`pending` while a build is queued or running.

**Constitution principle**
II (Automated Release Gate) — production only ever deploys code that passed the required checks
on `main`.

**Secrets**
None.

## 10. GitHub CI workflow {#github-ci-workflow}

**What it is for**
Confirms the automated `verify` gate is actually running in GitHub Actions on every pull request
and on `main`, not just locally. The workflow runs `changes`, `static`, `build-tests` and `e2e`
in parallel, and a final `verify` job reports the result that branch protection requires.

**Where to do it**
Nothing new to do here; `.github/workflows/ci.yml` is part of this slice's pull request. This
item confirms it exists on `main` and that the latest run succeeded, after the merge. `.github/workflows/visual-baselines.yml` is a separate workflow
that regenerates the Linux visual baselines for a human or agent to review and commit — it is not
part of the `verify` gate and never runs on push; before it exists on `main` it can only be
triggered by adding the `visual-baselines` label to a pull request (`workflow_dispatch` isn't
registered until the file is on the default branch), and afterwards `gh workflow run` works too.
The same baselines can be regenerated locally with `pnpm run test:visual:update:linux`, which
runs the job's steps in the matching Playwright Docker image and needs Docker Desktop running.
A pull request that changes only skip-safe paths (agent instructions and Spec Kit documents that
no check reads, listed in `scripts/ci/changed-paths.ts`) runs secretlint in the `static` job and
skips `build-tests` and `e2e`; the `verify` job still reports success. A pull request that changes
only `.md` files under `docs/` (plus skip-safe files) runs the docs tier: secretlint and the unit and
component tests, skipping lint, type-check, worker tests, `build-tests` and `e2e`; `verify` still reports. Pushes to `main` are sorted by
the same rules, from the commit before the push to the pushed commit, and runs on `main` are never cancelled.

**How it will be confirmed**
`pnpm setup:check --item github-ci-workflow` reports complete when `ci.yml` exists on
`main` and the latest `verify` run on `main` succeeded.

**Constitution principle**
II (Automated Release Gate).

**Secrets**
None — the workflows use only the automatic per-run `GITHUB_TOKEN`.

## 11. GitHub CODEOWNERS {#github-codeowners}

**What it is for**
Confirms GitHub recognises `.github/CODEOWNERS` correctly, so the one required approval on every
pull request is always Don's.

**Where to do it**
Nothing new to do here; `.github/CODEOWNERS` is part of this slice's pull request. This item
confirms it on `main` after the merge.

**How it will be confirmed**
`pnpm setup:check --item github-codeowners` reports complete when the CODEOWNERS file on `main`
has the catch-all line `* @drcdev` and GitHub reports no errors in it.

**Constitution principle**
III (Human Review for Major Changes).

**Secrets**
None.

## 12. GitHub main branch protection {#github-main-protection}

**What it is for**
This is what actually stops an unreviewed or failing change from reaching `main`: required pull
requests, one approving review on every pull request, required code-owner review, a required
passing `verify` check, and no bypass.

**Where to do it**
Import `setup/github-ruleset.json` as a repository ruleset on `main`:
`gh api -X POST repos/drcdev/dcc-web/rulesets --input setup/github-ruleset.json`.

**How it will be confirmed**
`pnpm setup:check --item github-main-protection` reports complete when the active ruleset on
`main` matches `setup/github-ruleset.json` — pull request required with one approving review,
code-owner review required, stale approvals dismissed on new commits, required check `verify`
(strict), no force-push, no deletion, no bypass actors — with each missing or weaker rule named
individually if it does not.

**Constitution principle**
II (Automated Release Gate) and III (Human Review for Major Changes).

**Secrets**
None.

## 13. Pipeline secrets {#pipeline-secrets}

**What it is for**
Confirms the pipeline has exactly the secrets and variables this slice documents — none more,
none fewer — so nothing is silently missing or left over.

**Where to do it**
Nothing to add: this slice needs no GitHub Actions secrets or variables. If any exist, remove
them in Repository Settings → Secrets and variables → Actions.

**How it will be confirmed**
`pnpm setup:check --item pipeline-secrets` reports complete when the GitHub Actions secret and
variable names equal the documented list for this slice (none), with none missing and none extra.

**Constitution principle**
VII (Private Data) and the minimum-scope-credentials rule (FR-021).

**Secrets**
None defined for GitHub Actions in this slice.

## 14. Preview no-index {#preview-noindex}

**What it is for**
Preview addresses on `workers.dev` must never be indexed by search engines, so only
`doncoleman.ca` appears in search results.

**Where to do it**
Nothing new to do here; `public/_headers` sends `X-Robots-Tag: noindex` for the preview `workers.dev`
host (production is not on `workers.dev`). This item confirms it is actually being served.

Never block crawling with `robots.txt` (a `Disallow` rule in `public/robots.txt`) as a substitute
for this — a crawl block can hide the no-index header's problem instead of fixing it, and search
engines that already indexed a page can still show it in results even when it is disallowed. If a
preview address was ever indexed before this header was in place, ask for those pages to be
removed directly: submit the URL through Google Search Console's Removals tool (and the
equivalent tool for any other search engine that indexed it), rather than waiting for the
crawler to notice the `noindex` header on its own. This is a manual step outside `pnpm
setup:check`'s reach — the check can only confirm the header is being served, not that a page
already in a search index has been removed from it.

**How it will be confirmed**
`pnpm setup:check --item preview-noindex` reports complete when the responses for `/` and
`/projects/` from the `dcc-web-preview` `workers.dev` host have an
`X-Robots-Tag` header containing `noindex`. When a
response lacks the header, the details list each host and path.

**Constitution principle**
X (Accessible, Fast and Private).

**Secrets**
None.

## 15. Web Analytics {#web-analytics}

**What it is for**
Gives Don basic, privacy-focused visitor statistics for the site with no cookies and no personal
data collected.

**Where to do it**
Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → select `doncoleman.ca`
→ Enable (automatic setup). The dashboard offers the zone, not an individual hostname, and
records the site against the zone. Automatic setup injects the beacon only into responses
Cloudflare proxies for the zone, so it reaches `doncoleman.ca`. Branch previews live on the preview Worker's `workers.dev` host, outside the zone, and
never get the beacon. Injection starts up to half an hour after enabling, and only for requests
that accept HTML (as every browser's page request does).

**How it will be confirmed**
`pnpm setup:check --item web-analytics` reports complete when a Web Analytics site with
automatic setup on exists for the `doncoleman.ca` zone, and the served page references the
Cloudflare beacon. The item does not depend on any other item.

**Constitution principle**
X (Accessible, Fast and Private) — Cloudflare Web Analytics is the constitution's named
privacy-focused analytics option.

**Secrets**
None.

# Contact form

Item 16 covers the contact form's storage, spam protection, secrets and deployment. Its parts are
done in the order shown. Two rules apply throughout:

- **You never paste a secret into the chat or into a repository file.** Type or pipe secrets straight
  into `wrangler secret put`, or paste them into a Cloudflare dashboard field yourself. The setup
  check only ever confirms a secret by name; it cannot read a value.
- **Every step can be repeated safely.** The check names what is still missing, per database, per
  Worker or per trigger, so a half-done step shows exactly what is left. A check that cannot reach
  Cloudflare, or whose token lacks a permission, says "could not check" with the permission to add;
  it is never shown as complete.

## 16. Contact bindings present {#contact-bindings}

**What it is for**
The contact form needs five Cloudflare pieces in place: the two D1 databases, the Turnstile
widget, three Worker secrets, the site key build variable and a production deploy that applies the
database migrations. One check reads all five and names every gap in a single run.

**Where to do it**
Work through the parts in this order.

### Databases

The site's Worker keeps its data in Cloudflare D1: contact messages, and the cached critical
thinking questions and their usage bucket. Production (`dcc-web`) and preview (`dcc-web-preview`)
are separate databases so a test message never lands in the real one.

Read this first. Both databases are created in Western North America (`wnam`). D1 cannot keep
data only in Canada, and the location **cannot be changed** after the databases are created. If you
do not confirm this, stop here: nothing is created until you do, and a different region needs a
reviewed change to the spec, plan and privacy policy first.

Then, in a terminal in the repository, run these yourself (Wrangler asks you to sign in first if
needed):

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create dcc-web --location wnam --env-file /dev/null
pnpm exec wrangler d1 create dcc-web-preview --location wnam --env-file /dev/null
```

Choose **no** if Wrangler offers to add the binding to the config. The database IDs are not secret;
once you confirm, the agent runs `pnpm exec wrangler d1 list --json`, copies the two IDs into
`wrangler.jsonc` (`dcc-web` at the top level, `dcc-web-preview` under `env.preview`), commits and
pushes. If a database was created with the wrong name or location and is still empty, remove it and
create it again:

```sh
pnpm exec wrangler d1 delete dcc-web --env-file /dev/null
```

### Turnstile widget

A Cloudflare Turnstile widget keeps bots from filling the contact form, without a visible puzzle for
real visitors. In the Cloudflare dashboard go to Turnstile → Add widget. Name it `dcc-web contact`;
hostnames `doncoleman.ca` and `drc-dev.workers.dev` (this covers preview addresses); mode
**Managed**; no pre-clearance. Keep the page open, because the next two parts need the secret key
and the site key. If the dashboard refuses `drc-dev.workers.dev`, use Turnstile's always-pass test
keys for **preview only** (research R6 in `specs/007-contact-form/research.md`).

### Worker secrets

The contact form's Workers need three secrets, stored as Worker secrets and never in the
repository: the Turnstile secret key, a read token for the scheduled assistant that fetches new
messages, and a salt used to hash visitor addresses for rate limiting.

In a terminal in the repository, run these yourself and type or paste each value at the prompt.
Never paste a value into the chat. For the read token, generate a new random value in your password
manager first. The repository's `.env` holds the read-only token from step 2, and Wrangler would use
it instead of your dashboard login, so every command passes `--env-file /dev/null`. Production
(`dcc-web`, `--env ""` selects the top-level environment):

```sh
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY --env "" --env-file /dev/null
pnpm exec wrangler secret put CONTACT_READ_TOKEN --env "" --env-file /dev/null
openssl rand -hex 32 | pnpm exec wrangler secret put IP_HASH_SALT --env "" --env-file /dev/null
```

Preview (`dcc-web-preview`): the same three commands with `--env preview` in place of `--env ""`,
using a **different** read token and salt. The first preview command offers to create the Worker
`dcc-web-preview`; answer yes. "No access to the specified resource" means the read-only token was
used: check that `--env-file /dev/null` is on the command.
Give each read token only to the scheduled assistant for that environment.

**Replacing a secret.** If a read token, salt or Turnstile secret leaks, run the same
`wrangler secret put` command again with a new value. On `dcc-web` it takes effect on the next
request with no redeploy. On `dcc-web-preview`, plain `secret put` refuses once a branch build has
uploaded a preview-alias version ("the latest version of your Worker isn't currently deployed"), so
use the versions form, deploy it, then rebuild the branch so its alias inherits the new value:

```sh
pnpm exec wrangler versions secret put CONTACT_READ_TOKEN --env preview --env-file /dev/null
pnpm exec wrangler versions deploy --env preview --env-file /dev/null
```

then choose **Retry build** on the latest `dcc-web-preview` build (or push a commit). After replacing
a read token, give the new value to the scheduled assistant. A value from `openssl rand -hex 32`
avoids shell-quoting trouble when the assistant sends it as a bearer token.

### Site key build variable

The page needs the widget's public site key at build time. It is public, but it is set in the build
settings rather than committed, so preview and production can differ under the Turnstile preview
fallback. For each of `dcc-web` and `dcc-web-preview`: Settings → Build → Variables and secrets →
add a **build** variable named `PUBLIC_TURNSTILE_SITE_KEY` (plain text) with the widget's site key.

### Production deploy

`dcc-web`'s production deploy command is `pnpm run deploy:production`, which applies the database
migrations and registers the daily clean-up schedule on every build of `main`. If the command is
wrong: `dcc-web` → Settings → Build → production deploy command →
`pnpm run deploy:production`, then Retry the latest `main` build. Until it has run, production's
contact form answers "service unavailable".

`dcc-web-preview` builds branches with `pnpm run deploy:preview` (see
[Workers Builds](#workers-builds)); its migrations and clean-up schedule come from that deploy, and
the CI preview check fails the pull request if the preview deploy fails. The Workers Builds API token
may need the **Workers AI** permission for the preview build to deploy the `AI` binding.

**How it will be confirmed**
`pnpm setup:check --item contact-bindings` reports complete when all five parts pass. Any failing
line is prefixed with its part (Databases, Turnstile widget, Worker secrets, Site key, Production
deploy), and the next action is the fix for the first failing part.

- **Databases:** both exist by name, their IDs equal the `database_id` values in `wrangler.jsonc`,
  and each reports region `WNAM`. If Cloudflare does not report a region, the check says "region
  could not be confirmed" and stays missing.
- **Turnstile widget:** a widget named `dcc-web contact` exists in managed mode and its domains
  include `doncoleman.ca`, plus either `drc-dev.workers.dev` or the preview fallback.
- **Worker secrets:** `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN` and `IP_HASH_SALT` exist on both
  `dcc-web` and `dcc-web-preview`. Only the secret **names** are read.
- **Site key:** the name `PUBLIC_TURNSTILE_SITE_KEY` exists on every build trigger of both Workers.
- **Production deploy:** `dcc-web`'s production trigger uses `pnpm run deploy:production`, its
  database has applied every file in `migrations/`, and it has the cron `17 3 * * *`.

It needs the D1: Read, Turnstile Sites: Read, Workers Builds Configuration: Read and Workers Scripts:
Read permissions (step 2), and never reads a key or a secret value.

**Constitution principle**
VII (Private Data: Minimal and Protected), VIII (Secure by Default) and IX (Free-Tier First).

**Secrets**
`TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN` and `IP_HASH_SALT` (Worker secrets, on both Workers),
and `PUBLIC_TURNSTILE_SITE_KEY` (a public build variable, not a secret).

# Edge protections

These are dashboard settings Don made by hand on 2026-10-09, right after the domain switch, for
issue #91. They are recorded here for reference. They are not setup items, they are not in the
16-item registry, and `pnpm setup:check` does not check them.

### API rate-limiting rule

**What it is for**
Stops one address from hammering the public API. The site's own cap on contact-form messages is the
last line of defence; this rule keeps abusive traffic from reaching the Worker at all.

**Where it is**
Cloudflare dashboard → the zone → Security → WAF → Rate limiting rules. There is one rule, which is
all the Free plan allows. It matches "URI Path starts with `/api/`" (the Free plan matches on path
only, not on host and path together), counts requests per IP over a 10-second period, and blocks the
address for 10 seconds once it is past the limit. The request threshold is Don's choice, set in the
dashboard, and is deliberately not published here.

**How it was confirmed**
On 2026-10-09 a burst of requests to an `/api/` path returned 429 once it went past the threshold.

**Why it covers the whole API**
It is a rule on the zone, so it only sees requests that arrive through the zone. That is true of
every request to the production Worker only because production's `workers.dev` host and Preview
URLs are off (issue #89, item 6). Turn either back on and that traffic would bypass the rule.

**Constitution principle**
VIII (Cloudflare Best Practices) and the Security Baseline. A zone rule is not Worker
configuration, which is why it is set in the dashboard rather than in `wrangler.jsonc`.

### HTTP DDoS attack alert

**What it is for**
Emails Don when Cloudflare mitigates an HTTP DDoS attack on the zone.

**Where it is**
Cloudflare dashboard → the account's Notifications (`dash.cloudflare.com/<account-id>/notifications`).
The HTTP DDoS Attack Alert was saved there on 2026-10-09.

**Constitution principle**
VIII (Cloudflare Best Practices).

### Plan tier

**What it is**
The account is on Workers Free. That was Don's decision on 2026-10-04.

**Where it is**
Only Don changes the tier, and billing would tell him if it changed, so there is no `setup:check`
item for it.

**Constitution principle**
VIII (the free-plan limits apply) and IX (Cost Ceiling: Workers Free costs nothing).
