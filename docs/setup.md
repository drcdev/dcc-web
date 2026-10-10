# Setup runbook

This is the plain-language record of every account-side setup item this repository depends on:
what each item is for, where Don does it, how it is confirmed, which constitution principle it
serves, and the names (never values) of any secrets involved. It is the no-agent fallback for
the `/setup-walkthrough` Claude Code skill, and the two must never disagree — both read the same
31-item registry in `scripts/setup-check/items.ts`, confirmed by `pnpm setup:check`.

Run `pnpm setup:check` at any time to see which of the 31 items below are complete. Each item's
step number and anchor match the setup item table in `specs/001-setup-walkthrough/spec.md` (the first eighteen items) and
`specs/007-contact-form/contracts/setup-items.md` (items 18 to 24, the "Contact form" part) and
`specs/011-launch/contracts/setup-items.md` (items 25 to 31, the "Launch" part at the end).

The domain switch itself, its rollback and the later retirement of the old services are not
setup items; they are walked through step by step in `docs/launch.md`, which the `/setup-walkthrough`
skill hands over to once items 1 to 24 are done.

A few terms used below: a **nameserver** is the server that answers "where is doncoleman.ca's
DNS?" — moving it to Cloudflare is what puts Cloudflare in charge of the domain's DNS records. A
**ruleset** is GitHub's mechanism for protecting a branch (blocking force-pushes, requiring
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
Analytics" token permission), and, for the contact form (items 18 to 24), Account → D1: Read,
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
Cloudflare dashboard → Add a site → `doncoleman.ca` → choose the Free plan.

**How it will be confirmed**
`pnpm setup:check --item cloudflare-zone` reports complete when zone `doncoleman.ca` exists on the
Free plan and its ID equals `CLOUDFLARE_ZONE_ID` in `.env`.

**Constitution principle**
IX (Cost Ceiling) — the Free plan keeps this item at $0/month.

**Secrets**
None beyond the `CLOUDFLARE_ZONE_ID` variable recorded under "Local credentials" above.

## 4. DNS records parity {#dns-records-parity}

**What it is for**
Before the domain's nameservers move to Cloudflare, every DNS record Squarespace serves today
(the Ghost site, mail records, verification records) must exist in Cloudflare with identical
values, so the live site and email keep working through the switch.

**Where to do it**
List every record from Squarespace's DNS screen for `doncoleman.ca` and its subdomains — of any
type (A, AAAA, CNAME, MX, TXT, SRV, CAA, and NS for any delegated subdomain) — into
`setup/dns-baseline.json`, with a keep or drop decision (and a reason for drop) for each. The
domain's own apex nameservers are not copied as records (Cloudflare supplies them), but the
original nameservers must be recorded in `originalNameservers` for rollback — see "DNS
nameservers" below. Then create or import the matching `keep` records in the Cloudflare zone as
DNS only (grey cloud). Leave each record's TTL on Cloudflare's "Auto" preset: the Cloudflare
dashboard offers only TTL presets, not a custom value, so an exact TTL match isn't possible. The
baseline still records each record's Squarespace TTL for the audit trail; the check reports a
difference between it and Cloudflare's TTL as an informational detail only, never a mismatch.
Run `pnpm setup:dns-snapshot` to see any name in public DNS that is not yet in the baseline.

**How it will be confirmed**
`pnpm setup:check --item dns-records-parity` reports complete only when every `keep` record in
the baseline matches the Cloudflare zone (type, name, content, and priority for MX/SRV, proxy
off) and no record is left without a decision. A TTL difference is shown as an informational
detail and does not block completion. It stays `missing` with "record the Squarespace baseline
first" while the baseline has no records or no original nameservers, so parity can never pass
vacuously before the nameserver switch.

After the launch switch (Custom Domain `doncoleman.ca` on `dcc-web`, see `docs/launch.md`) the
check changes in three ways. The Ghost web records (A, AAAA and CNAME on the apex and `www`) are
no longer expected in the zone; each shows a detail "replaced at launch, kept in the baseline for
rollback". The records the switch adds on the apex and `www` (the Custom Domain's managed apex
record and `AAAA www 100::`) stay informational. And the whole zone is compared: any other added,
removed or changed record, on any name other than the apex and `www`, is a difference and reports
`missing` with a summary starting "Problem:" and the rollback next action. If the launch phase
cannot be read (no `CLOUDFLARE_ACCOUNT_ID`, or Cloudflare cannot be reached) it reports
`could-not-check`.

**Constitution principle**
VI (Content as Files) and X (Accessible, Fast and Private) — the baseline is a committed,
reviewed file, not a one-time manual comparison.

**Secrets**
None — DNS records are public data, not secrets.

## 5. DNS nameservers {#dns-nameservers}

**What it is for**
Moving the domain's nameservers from Squarespace to Cloudflare is what actually puts Cloudflare
in charge of DNS; it is the one step with real risk to the live site and email, so it only
happens after DNS parity (step 4) is confirmed complete.

**Where to do it**
At Squarespace's domain settings for `doncoleman.ca`, change the nameservers to the two
Cloudflare assigns for the zone. Do this only after `pnpm setup:check --item dns-records-parity`
reports complete, and only after reading the rollback procedure below.

**Before the switch: DNSSEC**
If Squarespace shows the generic error "We were not able to add the nameservers," the usual
cause for a domain that came from Google Domains on `ns-cloud-*.googledomains.com` is DNSSEC
still being enabled at Squarespace; it must be disabled — Domains → `doncoleman.ca` → DNS → DNS
Settings → DNSSEC — with the DS record cleared from the registry (up to 24 hours) before
Squarespace will accept the nameserver change. Make the switch itself at Domains →
`doncoleman.ca` → DNS → Nameservers → "Use custom nameservers" — never "Transfer domain", which
is a different, unwanted action. Cloudflare DNSSEC can be turned on later, from the Cloudflare
dashboard, once the zone is active.

**How it will be confirmed**
`pnpm setup:check --item dns-nameservers` reports complete when the public NS records for
`doncoleman.ca` equal the zone's assigned Cloudflare nameservers and Cloudflare reports the zone
active. It reports `pending` while delegation is still propagating (up to 24 hours), and stays
`missing` with "complete DNS parity first" until step 4 is complete.

**Constitution principle**
II (Automated Release Gate) and VII (Private Data) — the switch is gated on a passing check, not
eyeballed.

**Secrets**
None.

**Rollback procedure (FR-039)**
If, after the switch, the live site or email stops working and the cause cannot be fixed within
Cloudflare in minutes, change the nameservers for `doncoleman.ca` back at Squarespace to the
original nameservers recorded below. This is the same rollback the `/setup-walkthrough` skill
shows before Don makes the switch.

Original Squarespace nameservers (recorded from `setup/dns-baseline.json`'s
`originalNameservers`, filled in at step 4):

- `ns-cloud-b1.googledomains.com`
- `ns-cloud-b2.googledomains.com`
- `ns-cloud-b3.googledomains.com`
- `ns-cloud-b4.googledomains.com`

## 6. Live domain: Ghost or switched {#live-domain-ghost}

**What it is for**
Until the launch switch, `doncoleman.ca` must keep serving the current Ghost site; after a
deliberate switch it must serve the new site. This item is the safety check that tells the two
apart, so an accident is never mistaken for the plan.

**Where to do it**
Nothing to do here directly; this item is a read-only confirmation. If it reports a problem,
follow the rollback in `docs/launch.md#rollback` right away.

**How it will be confirmed**
`pnpm setup:check --item live-domain-ghost` reads Cloudflare's Custom Domain list to learn whether
the switch has happened. It never decides that from DNS answers. Once `doncoleman.ca` is a Custom
Domain on `dcc-web` it reports complete ("Switched to the new site on purpose"). Before the switch
it reports complete when the public A/AAAA/CNAME answers for the apex and `www` equal the Ghost
target records in the baseline, and after a rollback it confirms Ghost again. Any difference
reports `missing` with a summary starting "Problem:". The details report the apex and `www`
separately (`apex: …`, `www: …`), so a half-switched domain is visible. Mail records are checked
by item 31, not here. If the phase cannot be read it reports `could-not-check`.

**Constitution principle**
X (Accessible, Fast and Private), via success criterion SC-005 — the live domain must not change
behaviour except on purpose.

**Secrets**
None.

## 7. Cloudflare Worker {#cloudflare-worker}

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

## 8. GitHub machine account {#github-machine-account}

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

## 9. GitHub secret scanning and Dependabot {#github-secret-scanning}

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

## 10. Workers Builds {#workers-builds}

**What it is for**
Confirms that Workers Builds is actually building and deploying this repository — production
from `main` on the `dcc-web` Worker, and a preview for every other branch on the separate
`dcc-web-preview` Worker — once this slice's files are on `main`. A preview build needs to know
its own served address (for its canonical link, `og:url` and `robots.txt`), and Cloudflare does
not hand a non-aliased preview upload a predictable URL, so the preview deploy command uploads an
aliased preview instead of a plain one. Previews live on their own Worker so they use the preview
database and the preview secrets, never production's (see step 21).

**Where to do it**
Nothing new beyond step 7 for the `dcc-web` Worker, and the preview Worker is connected in step 21.
On `dcc-web`, the **build command stays `pnpm run build`, unchanged**. Its production deploy command
is `pnpm run deploy:production` once this feature has merged (step 24); until then it stays
`pnpm exec wrangler deploy`. Non-production branch builds are turned **off** on `dcc-web` (step 21)
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

## 11. GitHub CI workflow {#github-ci-workflow}

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

## 12. GitHub CODEOWNERS {#github-codeowners}

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

## 13. GitHub main branch protection {#github-main-protection}

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

## 14. Pipeline secrets {#pipeline-secrets}

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

## 15. Review address removed {#review-address-removed}

**What it is for**
Once the bare domain is live, the temporary review address `new.doncoleman.ca` goes away so only
one address serves the site.

**Where to do it**
After the switch: Cloudflare dashboard → Workers & Pages → `dcc-web` → Settings → Domains &
Routes → delete the Custom Domain `new.doncoleman.ca`. Before the switch there is nothing to do.

**How it will be confirmed**
`pnpm setup:check --item review-address-removed` reports `waiting` before the switch. After it, the
item is `missing` while a Custom Domain for `new.doncoleman.ca` still exists, `pending` while a
public resolver still answers for it (cached answers expire within the record's TTL), and complete
when there is no Custom Domain and both resolvers return no answer.

**Constitution principle**
X (Accessible, Fast and Private).

**Secrets**
None.

## 16. Preview no-index {#preview-noindex}

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
`X-Robots-Tag` header containing `noindex`. It does not depend on the launch phase; when a
response lacks the header, the details list each host and path.

**Constitution principle**
X (Accessible, Fast and Private).

**Secrets**
None.

## 17. Web Analytics {#web-analytics}

**What it is for**
Gives Don basic, privacy-focused visitor statistics for the site with no cookies and no personal
data collected.

**Where to do it**
Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → select `doncoleman.ca`
→ Enable (automatic setup). The dashboard offers the zone, not an individual hostname, and
records the site against the zone. Automatic setup injects the beacon only into responses
Cloudflare proxies for the zone, so it reaches `new.doncoleman.ca` (a Custom Domain) and, once
the switch is done, `doncoleman.ca`. Branch previews live on the preview Worker's `workers.dev` host, outside the zone, and
never get the beacon. Injection starts up to half an hour after enabling, and only for requests
that accept HTML (as every browser's page request does).

**How it will be confirmed**
`pnpm setup:check --item web-analytics` reports complete when a Web Analytics site with
automatic setup on exists for the host being checked or for the `doncoleman.ca` zone, and the
served page references the Cloudflare beacon. The host checked is `doncoleman.ca` once the
launch switch has happened and `new.doncoleman.ca` before. The item does not depend on any other
item.

**Constitution principle**
X (Accessible, Fast and Private) — Cloudflare Web Analytics is the constitution's named
privacy-focused analytics option.

**Secrets**
None.

# Contact form

Items 18 to 24 set up the contact form's storage, spam protection, secrets and deployments. They
are done in the order shown. Two rules apply to every step:

- **You never paste a secret into the chat or into a repository file.** Type or pipe secrets straight
  into `wrangler secret put`, or paste them into a Cloudflare dashboard field yourself. The setup
  check only ever confirms a secret by name; it cannot read a value.
- **Every step can be repeated safely.** The check names what is still missing, per database, per
  Worker or per trigger, so a half-done step shows exactly what is left. A check that cannot reach
  Cloudflare, or whose token lacks a permission, says "could not check" with the permission to add;
  it is never shown as complete.

## 18. Site databases {#contact-d1-databases}

**What it is for**
The site's Worker keeps its data in Cloudflare D1: contact messages, and the cached critical
thinking questions and their usage bucket. Production (`dcc-web`) and preview (`dcc-web-preview`)
are separate databases so a test message never lands in the real one. These replace the earlier
`dcc-web-contact` and `dcc-web-contact-preview` databases, which item 24 deletes after the
production deploy.

**Where to do it**
Read this first. Both databases will be created in Western North America (`wnam`). D1 cannot keep
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

**How it will be confirmed**
`pnpm setup:check --item contact-d1-databases` reports complete when both databases exist by name,
their IDs equal the `database_id` values in `wrangler.jsonc`, and each reports region `WNAM`. If
Cloudflare does not report a region, the check says "region could not be confirmed" and stays
missing.

**Constitution principle**
VII (Private Data: Minimal and Protected), VIII (Secure by Default) and IX (Free-Tier First).

**Secrets**
None.

## 19. Spam-protection widget {#contact-turnstile-widget}

**What it is for**
A Cloudflare Turnstile widget keeps bots from filling the contact form, without a visible puzzle for
real visitors.

**Where to do it**
Cloudflare dashboard → Turnstile → Add widget. Name it `dcc-web contact`; hostnames `doncoleman.ca`
(this covers `new.doncoleman.ca`) and `drc-dev.workers.dev` (this covers preview addresses); mode
**Managed**; no pre-clearance. Keep the page open, because steps 20 and 22 need the secret key and
the site key. If the dashboard refuses `drc-dev.workers.dev`, use Turnstile's always-pass test keys
for **preview only** (research R6 in `specs/007-contact-form/research.md`).

**How it will be confirmed**
`pnpm setup:check --item contact-turnstile-widget` reports complete when a widget named
`dcc-web contact` exists in managed mode and its domains include `doncoleman.ca`, plus either
`drc-dev.workers.dev` or the preview fallback. It needs the Account → Turnstile Sites: Read
permission (step 2), and reads only the widget's name, domains and mode, never its keys.

**Constitution principle**
VIII (Secure by Default) and X (Accessible, Fast and Private).

**Secrets**
None read. The widget's secret key is used in step 20.

## 20. Contact secrets {#contact-worker-secrets}

**What it is for**
The contact form's Workers need three secrets, stored as Worker secrets and never in the repository:
the Turnstile secret key, a read token for the scheduled assistant that fetches new messages, and a
salt used to hash visitor addresses for rate limiting.

**Where to do it**
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

**How it will be confirmed**
`pnpm setup:check --item contact-worker-secrets` reports complete when `TURNSTILE_SECRET_KEY`,
`CONTACT_READ_TOKEN` and `IP_HASH_SALT` exist on both `dcc-web` and `dcc-web-preview`. It reads the
secret **names** only and lists any missing name per Worker.

**Constitution principle**
VII (Private Data: Minimal and Protected) and VIII (Secure by Default).

**Secrets**
`TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN` and `IP_HASH_SALT` (Worker secrets, on both Workers).

## 21. Preview Worker builds {#contact-preview-builds}

**What it is for**
Branch previews are built and deployed by their own Worker, `dcc-web-preview`, so a preview uses the
preview database and preview secrets and never touches production's.

**Where to do it**
Cloudflare dashboard → Workers & Pages → `dcc-web-preview` → Settings → Build → Connect →
`drcdev/dcc-web`. Build command `pnpm run build`. Production branch `main`, with deploy command
`pnpm run deploy:preview`. Turn **on** non-production branch builds, also with deploy command
`pnpm run deploy:preview`. Then Settings → Domains & Routes: turn on the `workers.dev` address and
preview URLs; `wrangler.jsonc` `env.preview` now sets both explicitly. Only `main` replaces the active
deployment on `dcc-web-preview`; every other branch uploads an aliased version. Finally open `dcc-web` → Settings → Build → Branch control and turn **off**
non-production branch builds. The first build of `main` on `dcc-web-preview` fails until this feature
merges; that failure is expected.

**How it will be confirmed**
`pnpm setup:check --item contact-preview-builds` reports complete when `dcc-web-preview` exists, its
Workers Builds triggers use `pnpm run deploy:preview` for both branch kinds, and `dcc-web` has no
non-production trigger. It needs the Account → Workers Builds Configuration: Read permission (step 2).

**Constitution principle**
II (Automated Release Gate), VII (Private Data: Minimal and Protected) and VIII (Secure by Default).

**Secrets**
None.

## 22. Site key build variable {#contact-turnstile-site-key}

**What it is for**
The page needs the widget's public site key at build time. It is public, but it is set in the build
settings rather than committed, so preview and production can differ under the Turnstile preview
fallback.

**Where to do it**
For each of `dcc-web` and `dcc-web-preview`: Settings → Build → Variables and secrets → add a
**build** variable named `PUBLIC_TURNSTILE_SITE_KEY` (plain text) with the widget's site key from
step 19.

**How it will be confirmed**
`pnpm setup:check --item contact-turnstile-site-key` reports complete when the name
`PUBLIC_TURNSTILE_SITE_KEY` exists on every build trigger of both Workers. Only names are read.

**Constitution principle**
VIII (Secure by Default) and X (Accessible, Fast and Private).

**Secrets**
`PUBLIC_TURNSTILE_SITE_KEY` (a public build variable, not a secret).

## 23. Preview migrations and clean-up schedule {#contact-preview-deploy}

**What it is for**
The preview deployment applies the database migrations to the `dcc-web-preview` database and registers the daily
clean-up schedule, so a test submission on the preview address works end to end.

**Where to do it**
Cloudflare dashboard → My Profile → API Tokens → the token Workers Builds uses (named in each
Worker's Settings → Build → API token) → Edit → add Account → **D1: Edit**. The same token may also
need the **Workers AI** permission for the preview build to deploy the `AI` binding. Then push the
branch (the agent does this) or choose Retry build on `dcc-web-preview`.

The `dcc-web-preview` database is disposable: Don may wipe or recreate it, and nothing in it is kept.
Branch migrations are applied to it before merge, so every migration must be additive only (the "only
additive migrations" unit test enforces this).

**How it will be confirmed**
`pnpm setup:check --item contact-preview-deploy` reports complete when the `dcc-web-preview` database has applied
every file in `migrations/` and the `dcc-web-preview` Worker has the cron `17 3 * * *`. That is also how the
Workers Builds token's D1 permission is confirmed, indirectly. It reports `pending` while a
`dcc-web-preview` build is running.

**Constitution principle**
II (Automated Release Gate), VII (Private Data: Minimal and Protected) and VIII (Secure by Default).

**Secrets**
None.

## 24. Production migrations and clean-up schedule {#contact-production-deploy}

**What it is for**
After the merge, production applies its migrations and registers the clean-up schedule, so the live
contact form has a table to write to.

**Where to do it**
Right after this feature's pull request merges (this is an after-merge step): `dcc-web` → Settings →
Build → production deploy command → `pnpm run deploy:production`, then Retry the latest `main`
build. Until this is done, production's contact form answers "service unavailable". Production
traffic is still only the review address.

Delete the retired databases only after the production deploy is green,
`pnpm exec wrangler d1 migrations list dcc-web --remote --env-file /dev/null` shows nothing pending
and `pnpm setup:check --item contact-d1-databases` passes. Contact data is not migrated to the new
databases; the count below proves the old ones hold none. These are shown for Don to run himself.
Delete `dcc-web-contact-preview` first, then `dcc-web-contact`. Before each delete, run the count and
stop and export the rows if it is not 0:

```sh
pnpm exec wrangler d1 execute dcc-web-contact-preview --remote --env-file /dev/null --command "SELECT count(*) FROM messages"
pnpm exec wrangler d1 delete dcc-web-contact-preview --env-file /dev/null
pnpm exec wrangler d1 execute dcc-web-contact --remote --env-file /dev/null --command "SELECT count(*) FROM messages"
pnpm exec wrangler d1 delete dcc-web-contact --env-file /dev/null
```

**How it will be confirmed**
`pnpm setup:check --item contact-production-deploy` reports complete when `dcc-web`'s production
trigger uses `pnpm run deploy:production`, the `dcc-web` database has applied every file in `migrations/`, and
`dcc-web` has the cron `17 3 * * *`. Before the merge it is shown as an after-merge item and does not
fail the check.

**Constitution principle**
II (Automated Release Gate), VII (Private Data: Minimal and Protected) and VIII (Secure by Default).

**Secrets**
None.

# Launch

Items 25 and 26 confirm the site is ready to go live, item 31 guards the mail records throughout, and items 27 to 30 prove the live domain after the switch. The domain switch itself is walked through in
`docs/launch.md`.

## 25. Launch content ready {#launch-content-ready}

**What it is for**
Every page the launch needs is published with real copy, and the privacy policy matches how the site
works today (messages stored in Cloudflare D1, none of the retired services).

**Where to do it**
In the repository: replace any placeholder text in `src/content/pages/` and `src/content/projects/`,
remove `draft: true` from each page listed in `setup/config.json` under `launch.expectedPages` (a page
kept hidden with `visible: false` is accepted as it is), and make `src/content/pages/privacy-policy.mdx` state that contact messages are stored in Cloudflare D1.

**How it will be confirmed**
`pnpm setup:check --item launch-content-ready` reports complete when every expected page exists and is
published or deliberately hidden with `visible: false`, no published page says "placeholder copy", no published project visual is marked
`placeholder: true`, and the privacy policy states Cloudflare D1 storage and names none of Ghost,
Supabase, Mailgun or Fly.io. Spam protection accepting the bare domain is confirmed by item 19
(`contact-turnstile-widget`).

**Constitution principle**
VII (Private Data: Minimal and Protected).

**Secrets**
None.

## 26. Main branch checks passing {#launch-main-checks}

**What it is for**
The newest commit on `main` passes the full verify gate before the domain switch.

**Where to do it**
GitHub → Actions → the `verify` check on `main`. If it failed, fix it and push a new commit to `main`.

**How it will be confirmed**
`pnpm setup:check --item launch-main-checks` reports complete when the newest `verify` check run on
`main` has finished with the conclusion `success`, and pending while it is still running.

**Constitution principle**
II (Automated Release Gate).

**Secrets**
None.

## 27. Bare domain serves the new site {#live-apex}

**What it is for**
After the switch, `doncoleman.ca` serves the new site over https, is open to search engines, and plain
http redirects to https. Until the switch the item reads `waiting`; while DNS or the certificate is
still settling it reads `pending`.

**Where to do it**
Nothing to build. Turn on Always Use HTTPS in the Cloudflare dashboard (zone → SSL/TLS → Edge
Certificates) as part of the switch steps in `docs/launch.md`.

**How it will be confirmed**
`pnpm setup:check --item live-apex` reports complete when `https://doncoleman.ca/` returns 200 with the
canonical link `https://doncoleman.ca/`, carries no `noindex` header or meta tag and no Ghost marker, and
`http://doncoleman.ca/` answers 301 or 308 to `https://doncoleman.ca/`. A `pending` result ends with the
24-hour rule: if it is still pending 24 hours after the switch, treat it as a problem and follow the
rollback in `docs/launch.md`.

**Constitution principle**
V (Static by Default).

**Secrets**
None.

## 28. www redirects to the bare domain {#live-www-redirect}

**What it is for**
After the switch, `www.doncoleman.ca` sends every visitor to the same page on `doncoleman.ca` with one
permanent redirect.

**Where to do it**
Cloudflare dashboard → the zone → Rules → Redirect Rules, the `www` rule described in
`docs/launch.md` step L12.

**How it will be confirmed**
`pnpm setup:check --item live-www-redirect` reports complete when `https://www.doncoleman.ca/about/?launch-check=1`
and its `http://` form each answer one 301 with `Location` exactly
`https://doncoleman.ca/about/?launch-check=1`. `waiting` before the switch; a `pending` result ends with the
24-hour rule (still pending 24 hours after the switch means rollback, see `docs/launch.md`).

**Constitution principle**
V (Static by Default).

**Secrets**
None.

## 29. Live sitemap pages load {#live-sitemap}

**What it is for**
After the switch, every page the live sitemap lists returns a page, and every path the launch expects is
listed.

**Where to do it**
Nothing to set up. Fix any page the details list and redeploy.

**How it will be confirmed**
`pnpm setup:check --item live-sitemap` crawls `https://doncoleman.ca/sitemap-index.xml` (without checking
links) and reports complete when every page returns 200, `robots.txt` names that sitemap, and every
`launch.expectedPaths` entry in `setup/config.json` is listed. `waiting` before the switch; a `pending`
result ends with the 24-hour rule (still pending 24 hours after the switch means rollback, see
`docs/launch.md`).

**Constitution principle**
V (Static by Default).

**Secrets**
None.

## 30. Live contact endpoint responds {#live-contact-endpoint}

**What it is for**
After the switch, the Worker answers `/api/contact` on `doncoleman.ca`, proven without sending a message.

**Where to do it**
Nothing to set up: the Custom Domain on the `dcc-web` Worker routes `/api/*` to the contact form's API.

**How it will be confirmed**
`pnpm setup:check --item live-contact-endpoint` sends one GET (never a POST) to
`https://doncoleman.ca/api/contact` and reports complete when it answers 405 with `Allow: POST` and the JSON
`{ "ok": false, "error": "method_not_allowed" }`. `waiting` before the switch; a `pending` result ends with the
24-hour rule (still pending 24 hours after the switch means rollback, see `docs/launch.md`).

**Constitution principle**
VII (Private Data: Minimal and Protected).

**Secrets**
None.

## 31. Mail records unchanged {#mail-records}

**What it is for**
The domain's mail keeps working: every mail record recorded in `setup/dns-baseline.json` still answers
unchanged, before and after the switch. The iCloud records must always match. The Mailgun records match
while they are marked `keep`; once they move to `drop` (after Ghost is retired) they are information only.

**Where to do it**
Cloudflare dashboard → the zone → DNS. Restore any MX, TXT or DKIM CNAME record the details list, exactly as
recorded in the baseline.

**How it will be confirmed**
`pnpm setup:check --item mail-records` asks both public resolvers (1.1.1.1 and 8.8.8.8) and reports complete
when each returns the baseline MX, TXT and DKIM CNAME records for every group marked `keep` (order and TTL
ignored). It is `pending` when only one resolver matches, with the 24-hour rule (still pending 24 hours after
the switch means rollback, see `docs/launch.md`), and a `Problem:` otherwise.

**Constitution principle**
VII (Private Data: Minimal and Protected).

**Secrets**
None.
