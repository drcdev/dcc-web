# Cutover plan

This is the working checklist for moving `doncoleman.ca` from Ghost to this site and then clearing
the repository of everything that only existed for the move. It puts the open issues, the launch
walkthrough in [launch.md](launch.md) and the follow-up work in one order. `launch.md` stays the
source for how each manual step is done and confirmed; this file says what comes when, and which
pipeline (`/tweak`, `/chore`, manual) does it.

Tick each box as it is done. This file retires with the final clean-up (stage 6).

## Where things stand (2026-10-09)

- The switch has not happened. The bare domain still points at Ghost (`A 49.13.201.194`), `www`
  is still the Magic Pages CNAME, and `new.doncoleman.ca` serves this site with `noindex`.
- `pnpm setup:check`: every pre-switch item is complete except `launch-content-ready`, which fails
  only because Work with me is a draft. The live items (`live-apex`, `live-www-redirect`,
  `live-sitemap`, `live-contact-endpoint`) and `review-address-removed` are `waiting`, as expected.
- All four Ghost posts are on the new site under `/writing/<slug>/`. Five Ghost pages already
  exist at the same address (`/about/`, `/technology/`, `/privacy-policy/`, `/terms-of-use/`,
  `/contact/`).
- Web Analytics is set up on the zone, so it carries over to the bare domain with no extra step.
- `specs/011-launch/tasks.md` T089 to T104 (the manual launch and retirement steps) are open.

## Decisions (Don, 2026-10-09)

- **Work with me stays hidden through the switch.** The readiness check is changed to accept a
  page that is deliberately hidden. Issue #122 publishes the page whenever Don is ready, before or
  after the switch.
- **Old Ghost addresses get permanent redirects.** This reverses the spec 011 choice of no
  redirects, so inbound links and search results for the four posts keep working.
- **The edge rate limit (#91) goes in on switch day**, once the bare domain is live, because the
  rule only protects `doncoleman.ca`.

## Stage 1 — Repository work before the switch

Both pull requests must merge to `main` before Part A of the walkthrough starts.

- [x] **1a. `/chore` — readiness check accepts hidden pages.** `launch-content-ready` treats a page
  with `visible: false` as deliberately hidden rather than unfinished, and `launch.expectedPages` in
  `setup/config.json` drops `work-with-me`. The L2 step in `launch.md` is brought up to date: it
  still names the Services and Speaking pages (merged into Work with me in 026) and the Focus Pocus
  placeholders (Focus Pocus is retired and has none). Done when `pnpm setup:check` reports
  `launch-content-ready` complete on `main`.
- [x] **1b. `/tweak` — redirect old Ghost addresses.** Add 301s in `public/_redirects`:

  | Ghost address | New address |
  |---|---|
  | `/convergence/2025/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/` | `/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/` |
  | `/news/2025/starting-something-new/` | `/writing/starting-something-new/` |
  | `/drift/2025/self-contained-development-for-ghost-themes/` | `/writing/self-contained-development-for-ghost-themes/` |
  | `/drift/2025/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/` | `/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/` |
  | `/drift/` | `/writing/drift/` |
  | `/convergence/` | `/writing/convergence/` |
  | `/news/` | `/writing/` |
  | `/contact-thank-you/` | `/contact/` |

  Each with and without the trailing slash. The `www` Redirect Rule set up in L12 keeps the path,
  so `www` addresses reach these too. Clarify question for the tweak: does `/cookie-policy/` go to
  `/privacy-policy/`, or stay a 404 as `tests/e2e/not-found.spec.ts` asserts today? The
  `GHOST_ADDRESSES` list in that spec keeps `/tag/`, `/author/`, `/rss/` and `/ghost/` as 404s.

## Stage 2 — Readiness and preparation (manual, `launch.md` Parts A and B)

Run with an assistant using the **Pause:** answers in `launch.md`. Tick T090 and T091 in
`specs/011-launch/tasks.md` as each completes.

- [ ] **L1** — `git switch main && git pull`, then `pnpm setup:check`. Every item before the
  live items is complete, with `review-address-removed` `waiting`.
- [ ] **L2** — Satisfied by 1a with Work with me hidden. Confirm the privacy policy names Cloudflare
  D1 and no retired service.
- [ ] **L3** — Don compares Ghost Admin → Posts with `https://new.doncoleman.ca/writing/` (four
  posts, already matched by the agent on 2026-10-09).
- [ ] **L4** — `pnpm run site:check -- --base https://new.doncoleman.ca --expect-origin https://doncoleman.ca`
  exits 0.
- [ ] **L5** — "Launch test" message through `https://new.doncoleman.ca/contact/`, received and
  deleted.
- [ ] **L6** — `pnpm setup:check --item launch-main-checks` complete.
- [ ] **L7** — Readiness table filled in, every row confirmed.
- [ ] **L8** — Ghost records checked against the zone; whole-zone export saved outside the
  repository.
- [ ] **L9** — Part E read end to end; mail test to and from the domain address.
- [ ] **L10** — Always Use HTTPS on.

## Stage 3 — The switch (manual, `launch.md` Part C, one sitting)

Tick T092 to T094.

- [ ] **L11** — Delete the apex `A` record, add Custom Domain `doncoleman.ca` on `dcc-web`. Write
  down the **switch date** and **Ghost's next renewal date** here:
  - Switch date: ____
  - Ghost renewal date: ____
  - Earliest retirement date (switch + 14 days): ____
- [ ] **L12** — Delete the `www` CNAME, add `AAAA www 100::` (proxied) and the 301 Redirect Rule.
- [ ] **L13** — Re-run `pnpm setup:check` until the live items are complete. A `Problem:` that cannot
  be fixed in the sitting, or anything still pending after 24 hours, means Part E (rollback).

## Stage 4 — After the switch (manual, `launch.md` Part D, plus #91)

Tick T094 to T097.

- [ ] **L14** — Post-launch checks complete; "Launch test" message from `https://doncoleman.ca/contact/`;
  mail test again.
- [ ] **Redirect spot check** — open two old Ghost post addresses on `www` and on the bare domain
  and confirm each lands on the post (stage 1b).
- [ ] **#91 edge rate limit, same day.** In the dashboard: one WAF rate-limiting rule on
  `doncoleman.ca/api/*`, counted per IP, with thresholds Don picks (not published); turn on the
  HTTP DDoS attack alert. The assistant's daily run reports `limited`, `unauthorized` and refused
  contact counts and paces its `/api/messages` calls under the rule.
- [ ] **#91 follow-up `/chore`** — `docs/setup.md` records the WAF rule, the DDoS alert and the
  Workers Free tier. Closes #91.
- [ ] **L15** — Update external links (LinkedIn and other sites Don controls). With stage 1b in
  place a stale link still lands on the post, so this is tidying rather than urgent.
- [ ] **L16** — Remove `new.doncoleman.ca` from `dcc-web` and delete its DNS record.
- [ ] **Turnstile hostname** — remove `new.doncoleman.ca` from the "dcc-web contact" widget's
  hostname list (not in `launch.md`; keep `doncoleman.ca`).
- [ ] **L17** (optional) — Submit `https://doncoleman.ca/sitemap-index.xml` in Search Console.
- [ ] **L18** — Switch date written above.

Rollback (`launch.md` Part E, T098) stays possible until Ghost is cancelled in stage 5.

## Stage 5 — Retirement, no earlier than 14 days after the switch (`launch.md` Part F)

Tick T099 to T104. Steps marked **Irreversible** need their evidence first, as `launch.md` says.

- [ ] **T1** — Don satisfied with the live site; private-records rules read.
- [ ] **T2** — Ghost content (JSON) and members (CSV) exported outside the repository; agent checks
  both with `ls -l` only.
- [ ] **T3** — **Irreversible.** Cancel Ghost; revoke Ghost integration keys; remove leftover Ghost
  secrets. Rollback ends here.
- [ ] **T4** — **Irreversible.** Delete the five Mailgun records on `mail.doncoleman.ca`, the
  Mailgun sending domain and its keys. Mail test.
- [ ] **T5 to T7** — **Irreversible.** Review and export the Supabase submissions, confirm the
  project is Flux's, delete it, remove leftover Supabase secrets.
- [ ] **T8** — Scan `drcdev/flux` for secrets and personal data, then archive it.
- [ ] **#93 manual half** — list the zone's hostnames and confirm each browser-facing one serves
  HTTPS; add a `_dmarc` TXT at `p=none` with reporting (and for `mail.` if it still sends); add CAA
  records naming only the certificate authorities Cloudflare uses for the zone.
- [ ] **T9 + #93 repo half, one `/chore`** — `setup/dns-baseline.json` sets the five Mailgun records
  and the two Ghost web records to `drop` with dated reasons and adds the DMARC and CAA records as
  `keep`; `public/_headers` drops the `new.doncoleman.ca` noindex rule (and its assertions in
  `tests/unit/site/headers.test.ts` and `tests/build/indexing.test.ts`) and gains `includeSubDomains`
  on HSTS (preload decided separately); `docs/setup.md` DNSSEC text says the zone is signed;
  FR-010d in `specs/011-launch/spec.md` is reopened; `docs/design-source.md` says Flux is archived;
  optionally the apex Custom Domain moves into `wrangler.jsonc`. Done when `verify` passes and
  `mail-records` and `dns-records-parity` are complete against the new baseline. Closes #93.
- [ ] **DMARC tightening** (manual, about 4 weeks later) — after the reports show only iCloud
  sending, move `p=none` to `quarantine`, then `reject`, and update the baseline in a small `/chore`.

## Stage 6 — Remove the pre-migration structures (`/chore`, issue #101)

Starts once stage 5 is done, so the launch items can only ever report complete. Issue #101 has
the full scope; the sweep on 2026-10-09 adds the items marked *new*.

- [ ] **Setup check** — remove `live-domain-ghost`, `review-address-removed`,
  `launch-content-ready`, `launch-main-checks`, the `live-*` items, `mail-records`,
  `dns-nameservers`, `launch-phase.ts`, the one-shot `preview-builds` and `preview-deploy` items,
  and fold the contact migration items into one "contact bindings present" check. Keep
  `dns-records-parity` and the baseline (#93 relies on them). Remove the retired `dcc-web-contact`
  database branch and the `cloudflare` devDependency if nothing else needs it.
- [ ] *new* — Ghost-only helpers that go with those items: the Ghost-marker logic in
  `checks/live-apex.ts`, `ghostTargets` in `checks/live-shared.ts`, `GHOST_WEB_TYPES` and the
  "replaced at launch" branch in `checks/dns-records-parity.ts`, and
  `tests/fixtures/providers/dns/ghost-a-records-baseline.json`.
- [ ] *new* — `setup/config.json`: `reviewHost`, `ghostMarker`, `launch.expectedPages` and
  `launch.expectedPaths`, with their readers (`src/lib/site-origin.ts`,
  `scripts/setup-check/types.ts` and `schemas.ts`, `tests/build/indexing.test.ts`,
  `tests/build/local-site.test.ts`).
- [ ] *new* — `scripts/setup-check/dns-snapshot.ts` and the `setup:dns-snapshot` script, which only
  served rollback.
- [ ] **Site check** — remove `scripts/site-check/cli.ts` (step L4). Keep `crawl.ts` and
  `preview.ts`, which CI runs on every pull request.
- [ ] **Tests** — delete `tests/unit/setup/launch-doc.test.ts`; cut `docs-structure.test.ts` and
  `docs-dns.test.ts` down to anchor and link checks. *New:* fold
  `tests/unit/content/launch-content.test.ts` into the content tests and drop "launch" from the
  names in `tests/e2e/pages.spec.ts`, `tests/e2e/site-links.spec.ts` and
  `tests/unit/content/navigation.test.ts`.
- [ ] **Content schema** — remove the project `placeholder` picture option (schema, mark, CSS,
  fixtures).
- [ ] **Docs and skills** — mark `docs/launch.md` historical (or delete it, and its links from
  `docs/setup.md`); remove the launch sections and the Ghost and rollback text from
  `docs/setup.md`; remove the Ghost check and launch hand-over from
  `.claude/skills/setup-walkthrough/SKILL.md`, including its `new.doncoleman.ca` crawl command.
- [ ] *new* — tick or close out the stale `[PREVIEW-CHECK]` tasks T024, T043, T087 and T088 in
  `specs/011-launch/tasks.md` (PR #23 merged with them open).
- [ ] *new* — delete this file.

**Stays:** the preview Worker and its database, the `workers.dev` noindex rule in `_headers`, the
`/writing/topics/*` and Tempo privacy redirects, the stage 1b Ghost redirects, the not-found
assertions for `/tag/`, `/rss/` and `/ghost/`, the `drc.dev` demo-link rule, and the Ghost history
in the Flux story and `docs/design-source.md`.

## Not part of the cutover

- **#122 Publish Work with me** (`/tweak`) — whenever Don's copy is ready; independent of the
  switch.
- **#82 Single-Worker previews** — on hold until Worker Previews leaves open beta. If it lands
  before stage 6, the preview items in #101 change shape with it.
- **#77 Retire the CI-label baseline fallback** (`/chore`) — waits on more green Docker baseline
  runs; unrelated to the cutover.
