# Setup runbook

This is the plain-language record of every account-side setup item this repository depends on:
what each item is for, where Don does it, how it is confirmed, which constitution principle it
serves, and the names (never values) of any secrets involved. It is the no-agent fallback for
the `/setup-walkthrough` Claude Code skill, and the two must never disagree — both read the same
18-item registry in `scripts/setup-check/items.ts`, confirmed by `pnpm setup:check`.

Run `pnpm setup:check` at any time to see which of the 18 items below are complete. Each item's
step number and anchor match the setup item table in `specs/001-setup-walkthrough/spec.md`.

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
Zone: Read, Zone → DNS: Read, Account → Workers Scripts: Read, Account → Web Analytics: Read.
Then copy `.env.example` to `.env` in the repository root and fill in the values in your own
editor.

**How it will be confirmed**
`pnpm setup:check --item local-credentials` reports complete when `.env` has a non-empty value
for every required name and Cloudflare's token-verify endpoint reports the token active.

**Constitution principle**
VII (Private Data: Minimal, Protected, in Canada) — secrets live only in a gitignored local file,
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
DNS only (grey cloud), and set each record's TTL to the exact Squarespace value: Cloudflare's
"automatic" TTL does not count as a match, because the comparison requires the same TTL number.
Run `pnpm setup:dns-snapshot` to see any name in public DNS that is not yet in the baseline.

**How it will be confirmed**
`pnpm setup:check --item dns-records-parity` reports complete only when every `keep` record in
the baseline matches the Cloudflare zone exactly (type, name, content, TTL, and priority for
MX/SRV, proxy off) and no record is left without a decision. It stays `missing` with "record the
Squarespace baseline first" while the baseline has no records or no original nameservers, so
parity can never pass vacuously before the nameserver switch.

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
`originalNameservers` when Don fills in the baseline — see step 4): _not yet recorded_.

## 6. Live domain still Ghost {#live-domain-ghost}

**What it is for**
Throughout this setup, and especially right after the nameserver switch, `doncoleman.ca` must
keep serving the current Ghost site and mail unchanged — this item is the safety check that
confirms that.

**Where to do it**
Nothing to do here directly; this item is a read-only confirmation. If it reports a problem,
follow the rollback procedure in "DNS nameservers" above right away.

**How it will be confirmed**
`pnpm setup:check --item live-domain-ghost` reports complete when the public A/AAAA/CNAME answers
for the apex and `www` equal the Ghost target records recorded in the baseline, and every kept MX
and email TXT record resolves as in the baseline. Any difference — including the domain pointing
at Cloudflare's proxy or the new Worker — reports `missing` with a summary starting "Problem:".

**Constitution principle**
X (Accessible, Fast and Private), via success criterion SC-005 — the live domain must not change
behaviour mid-setup.

**Secrets**
None.

## 7. Cloudflare Worker {#cloudflare-worker}

**What it is for**
The new site is hosted as a Cloudflare Worker serving static assets; this item creates that
Worker and turns on its preview addresses.

**Where to do it**
Cloudflare dashboard → Workers & Pages → Create → Import a repository → `drcdev/dcc-web` (this
creates the Worker and connects Workers Builds in one step). Authorise Cloudflare's GitHub app
for the `drcdev/dcc-web` repository only, not all repositories. Then turn on its `workers.dev`
address and preview URLs.

**How it will be confirmed**
`pnpm setup:check --item cloudflare-worker` reports complete when Worker `dcc-web` exists with
its `workers.dev` address and preview URLs enabled.

**Constitution principle**
II (Automated Release Gate) — every branch gets a preview deployment.

**Secrets**
None — no Cloudflare deploy token is stored in GitHub; Workers Builds deploys directly.

## 8. GitHub machine account {#github-machine-account}

**What it is for**
Agents open pull requests as a dedicated machine account, separate from Don's own account, so
Don's review always counts as an independent approval.

**Where to do it**
Create a GitHub account named `dcc-bot` (the name recorded in `setup/config.json`), add it as a
`drcdev/dcc-web` collaborator with write permission (not admin), and sign it into the local `gh`
keyring (`gh auth login`). Switch the active `gh` account back to Don afterwards (`gh auth
switch`) — the check reads as Don.

Don is the sole maintainer, so his approval does not count as an independent review on a pull
request he authored himself — GitHub does not let an author approve their own pull request, and
this setup does not try to work around that. If an agent ever opens a pull request under Don's
own account by mistake, it must be closed and reopened from `dcc-bot` before Don can approve it;
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

## 9. GitHub secret scanning {#github-secret-scanning}

**What it is for**
GitHub's own secret scanning and push protection are a first-party, always-on backstop against
ever committing a secret, alongside the local `secretlint` gate.

**Where to do it**
Repository Settings → Code security → turn on Secret scanning and Push protection.

**How it will be confirmed**
`pnpm setup:check --item github-secret-scanning` reports complete when both
`security_and_analysis.secret_scanning` and `…secret_scanning_push_protection` are enabled.

**Constitution principle**
VII (Private Data: Minimal, Protected, in Canada).

**Secrets**
None.

## 10. Workers Builds {#workers-builds}

**What it is for**
Confirms that Workers Builds is actually building and deploying this repository — production
from `main`, and a preview for every other branch — once this slice's files are on `main`.

**Where to do it**
Nothing new to do here beyond step 7; this item confirms the pipeline that step 7 connected, once
this slice's pull request has merged.

**How it will be confirmed**
`pnpm setup:check --item workers-builds` reports complete when the latest commit on `main` has a
successful Workers Builds run, and the latest open pull request (if any) has one with a preview
URL. It reports `pending` while a build is queued or running.

**Constitution principle**
II (Automated Release Gate) — production only ever deploys code that passed the required checks
on `main`.

**Secrets**
None.

## 11. GitHub CI workflow {#github-ci-workflow}

**What it is for**
Confirms the automated `verify` gate is actually running in GitHub Actions on every pull request
and on `main`, not just locally.

**Where to do it**
Nothing new to do here; `.github/workflows/ci.yml` and `.github/workflows/major-change.yml` are
part of this slice's pull request. This item confirms they exist on `main` and that the latest
run succeeded, after the merge.

**How it will be confirmed**
`pnpm setup:check --item github-ci-workflow` reports complete when both workflow files exist on
`main` and the latest `verify` run on `main` succeeded.

**Constitution principle**
II (Automated Release Gate).

**Secrets**
None — the workflows use only the automatic per-run `GITHUB_TOKEN`.

## 12. GitHub CODEOWNERS {#github-codeowners}

**What it is for**
Confirms GitHub recognises `.github/CODEOWNERS` correctly, so the paths that are major by
definition require Don's review before they can merge.

**Where to do it**
Nothing new to do here; `.github/CODEOWNERS` is part of this slice's pull request. This item
confirms it on `main` after the merge.

**How it will be confirmed**
`pnpm setup:check --item github-codeowners` reports complete when the CODEOWNERS file on `main`
names `@drcdev` for every major path and GitHub reports no errors in it.

**Constitution principle**
III (Human Review for Major Changes).

**Secrets**
None.

## 13. GitHub major-change label {#github-major-label}

**What it is for**
The `major-change` label is the second way (alongside CODEOWNERS paths) of marking a pull request
as needing Don's review — for changes that are major but touch no CODEOWNERS path, such as design
or running-cost changes.

**Where to do it**
Repository → Labels → create a label named `major-change`. Repository Settings → General → turn
on "Allow auto-merge".

**How it will be confirmed**
`pnpm setup:check --item github-major-label` reports complete when the `major-change` label
exists and the repository allows auto-merge.

**Constitution principle**
III (Human Review for Major Changes).

**Secrets**
None.

## 14. GitHub main branch protection {#github-main-protection}

**What it is for**
This is what actually stops an unreviewed or failing change from reaching `main`: required pull
requests, required passing checks, required code-owner review, and no bypass.

**Where to do it**
Import `setup/github-ruleset.json` as a repository ruleset on `main`:
`gh api -X POST repos/drcdev/dcc-web/rulesets --input setup/github-ruleset.json`.

**How it will be confirmed**
`pnpm setup:check --item github-main-protection` reports complete when the active ruleset on
`main` matches `setup/github-ruleset.json` — pull request required, code-owner review required,
required checks `verify` and `major-change-approval` (strict), no force-push, no deletion, no
bypass actors — with each missing or weaker rule named individually if it does not.

**Constitution principle**
II (Automated Release Gate) and III (Human Review for Major Changes).

**Secrets**
None.

## 15. Pipeline secrets {#pipeline-secrets}

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

## 16. Review address {#review-address}

**What it is for**
Gives Don a stable HTTPS address to view this slice's deployment before the real domain switches
over.

**Where to do it**
Cloudflare dashboard → Workers & Pages → `dcc-web` → Settings → Domains & Routes → Add Custom
Domain → `new.doncoleman.ca`.

**How it will be confirmed**
`pnpm setup:check --item review-address` reports complete when `new.doncoleman.ca` is a Custom
Domain on Worker `dcc-web` and `https://new.doncoleman.ca/` returns 200 over HTTPS.

**Constitution principle**
X (Accessible, Fast and Private).

**Secrets**
None.

## 17. Review address no-index {#review-address-noindex}

**What it is for**
The review address must never be indexed by search engines while the real site is still
`doncoleman.ca`.

**Where to do it**
Nothing new to do here; `public/_headers` (part of this slice) sends `X-Robots-Tag: noindex` on
every path. This item confirms it is actually being served.

Never block crawling with `robots.txt` (a `Disallow` rule in `public/robots.txt`) as a substitute
for this — a crawl block can hide the no-index header's problem instead of fixing it, and search
engines that already indexed a page can still show it in results even when it is disallowed. If
`new.doncoleman.ca` was ever indexed before this header was in place, ask for those pages to be
removed directly: submit the URL through Google Search Console's Removals tool (and the
equivalent tool for any other search engine that indexed it), rather than waiting for the
crawler to notice the `noindex` header on its own. This is a manual step outside `pnpm
setup:check`'s reach — the check can only confirm the header is being served, not that a page
already in a search index has been removed from it.

**How it will be confirmed**
`pnpm setup:check --item review-address-noindex` reports complete when the response from
`https://new.doncoleman.ca/` has an `X-Robots-Tag` header containing `noindex`.

**Constitution principle**
X (Accessible, Fast and Private).

**Secrets**
None.

## 18. Web Analytics {#web-analytics}

**What it is for**
Gives Don basic, privacy-focused visitor statistics for the review address (and later the live
site) with no cookies and no personal data collected.

**Where to do it**
Cloudflare dashboard → Analytics & Logs → Web Analytics → Add a site → select
`new.doncoleman.ca` → Enable (automatic setup).

**How it will be confirmed**
`pnpm setup:check --item web-analytics` reports complete when a Web Analytics site for
`new.doncoleman.ca` exists with automatic setup on, and the served page references the Cloudflare
beacon.

**Constitution principle**
X (Accessible, Fast and Private) — Cloudflare Web Analytics is the constitution's named
privacy-focused analytics option.

**Secrets**
None.
