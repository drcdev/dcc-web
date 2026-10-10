# Chore plan: retire-launch-checks

Branch: `chore/retire-launch-checks`, from `main` at e6bf21b (after #135 merged).
Closes #101. This is stage 6 of `docs/cutover-plan.md` ("Remove the pre-migration structures").
The open DMARC tightening item moves to issue #136.

## Goal

Issue [#101](https://github.com/drcdev/dcc-web/issues/101) asks for the launch-only machinery to
go once Ghost is retired. Stage 5 is done: Ghost, Mailgun and Supabase are retired, the site is
live on `doncoleman.ca`, and `pnpm setup:check` reports 31 of 31 on `main`. The launch, Ghost and
nameserver items can now only report complete. Their runbook tests guard steps that will never
run again. This chore removes them:

- the nine launch and live items, `launch-phase.ts` and `live-shared.ts`;
- the review-host and Ghost config keys, with their readers;
- the two launch-only scripts (`setup:dns-snapshot`, `site:check`);
- `docs/launch.md` with its test, and finally `docs/cutover-plan.md`.

It also reshapes what stays:

- the contact items fold into one `contact-bindings` item;
- `setup/dns-baseline.json` becomes a short list of records that must exist;
- `dns-records-parity`, `mail-records` and `web-analytics` stop asking which launch phase the
  domain is in;
- the setup-walkthrough skill is trimmed.

No page changes. Everything removed is developer tooling, tests or docs, and the one `src/` edit
removes an unused optional type field. The project `placeholder` picture option is split out to
a follow-up `/tweak` (Don, 2026-10-09).

**Scope change from the issue body (Don, 2026-10-09):** `mail-records` stays, like
`dns-records-parity`. The slimmed baseline relies on both. The PR body says so, and the
orchestrator has posted the note on #101.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Tests seen failing first.** Each new-first case fails before its implementation and passes
   after, and the implement summary records each red run:
   - W2: web-analytics checks the zone apex without reading Custom Domains;
   - W3: dns-records-parity compares the whole zone with no launch phase;
   - W5: `configSchema` accepts a config without `reviewHost` or `ghostMarker`;
   - W7: the strict must-exist baseline schema and its invariants;
   - W8: `contact-bindings`.
2. **Registry.** `setupItems` has **16** items, with orders 1 to 16 in this order:
   1. `local-tools`
   2. `local-credentials`
   3. `cloudflare-zone`
   4. `dns-records-parity`
   5. `mail-records`
   6. `cloudflare-worker`
   7. `github-machine-account`
   8. `github-secret-scanning`
   9. `workers-builds`
   10. `github-ci-workflow`
   11. `github-codeowners`
   12. `github-main-protection`
   13. `pipeline-secrets`
   14. `preview-noindex`
   15. `web-analytics`
   16. `contact-bindings`

   `docs/setup.md` has exactly these 16 `## N. … {#id}` sections in the same order. Its intro says
   "16-item registry" and "of the 16 items". `items.test.ts`, `docs-structure.test.ts` and
   `drift.test.ts` pin 16; the pins are updated, not deleted.
3. **Live run (read-only).** After W8 and again after W13, `pnpm setup:check` reports
   `16 of 16 complete`. The implement summary also records these runs, each reporting complete:
   - `--item dns-records-parity` (no "TTL differs", "replaced at launch" or "not in the baseline"
     lines);
   - `--item mail-records`, `--item web-analytics` and `--item contact-bindings`.

   Credentials are never printed.
4. **Baseline.** `setup/dns-baseline.json` is `{ "records": [...] }` with exactly 11 records. Each
   record has only `type`, `name`, `content`, `priority` and `ttl`. The records:
   - MX `doncoleman.ca` `mx01.mail.icloud.com` and `mx02.mail.icloud.com` (priority 0);
   - TXT `doncoleman.ca` `v=spf1 include:icloud.com ~all`, `apple-domain=…` and
     `google-site-verification=…`;
   - CNAME `sig1._domainkey.doncoleman.ca`;
   - TXT `_dmarc.doncoleman.ca` (p=none, Cloudflare `rua`), TTL 1;
   - CAA `doncoleman.ca` × 4 (`letsencrypt.org`, `pki.goog`, `ssl.com`, `sectigo.com`), TTL 1.

   Every other TTL is the value Cloudflare reports, so the parity run shows no TTL lines. There is
   no `originalNameservers`, `source`, `decision`, `reason` or `drop` record, and no Ghost,
   Mailgun or Squarespace content.
5. **Stale names gone.** `git grep -nE` for the pattern below over `scripts src tests docs setup
   public worker .github .claude/skills/setup-walkthrough package.json astro.config.mjs`
   returns nothing:

   ```
   reviewHost|ghostMarker|expectedPages|expectedPaths|detectLaunchPhase|launch-phase|GHOST_WEB_TYPES|replacedAtLaunch|replaced at launch|ghostTargets|RETIRED_DB_NAMES|dcc-web-contact|dns-snapshot|site:check|site-check/cli|new\.doncoleman\.ca|docs/launch\.md|cutover-plan|postLaunch|deferredUntilMerge|originalNameservers
   ```

   History under `specs/` and `.specify/` is not touched by this criterion.
6. **Files gone:**
   - `docs/launch.md`, `docs/cutover-plan.md` and `tests/unit/setup/launch-doc.test.ts`;
   - `scripts/setup-check/dns-snapshot.ts` and `scripts/site-check/cli.ts`, with their tests;
   - `scripts/setup-check/checks/{launch-phase,live-shared,live-*,dns-nameservers,review-address-removed,launch-content-ready,launch-main-checks}.ts`;
   - the seven old `contact-*.ts` item checks (`contact-shared.ts` stays);
   - the matching tests, `live-helpers.ts`, and every fixture no remaining test loads. The W4
     and W8 implementers check each fixture with `git grep` before deleting it.
7. **Kept:** `scripts/site-check/crawl.ts` and `preview.ts` and their tests; the `cloudflare`
   devDependency; `READ_BY_CHECKS` in `scripts/ci/changed-paths.ts`; the setup-walkthrough skill;
   `package.json` dependencies unchanged (only the `site:check` and `setup:dns-snapshot`
   scripts go).
8. **No page output change:** `git diff --name-only main -- src public worker`
   lists at most `src/lib/site-origin.ts` (a type field and comment) and
   `src/content/projects/flux.mdx` (an MDX comment, W12). No visual baseline changes.
9. **Spec 011 close-out.** In `specs/011-launch/tasks.md`, T024, T043, T087 and T088 are ticked,
   each with a dated note (W11). The spec 011 Flux-archive lines carry the "superseded" note (W11).
10. Each work item's targeted tests pass locally. The full `pnpm run verify` gate is green in CI
    (no local full verify, Don 2026-10-09).

**Before** (at e6bf21b, `wc -l`):

| What | Lines |
| --- | ---: |
| `scripts/setup-check/**/*.ts` | 5,597 |
| `tests/unit/setup-check/**` + `tests/unit/setup/**` (.ts) | 7,371 |
| `tests/fixtures/providers/**/*.json` (files) | 76 files |
| `docs/launch.md` | 714 |
| `docs/setup.md` | 973 |
| `docs/cutover-plan.md` | 223 |
| `.claude/skills/setup-walkthrough/SKILL.md` | 207 |
| `setup/dns-baseline.json` | 200 |
| `scripts/site-check/cli.ts` + test | 111 + 88 |
| `scripts/setup-check/dns-snapshot.ts` | 137 |
| `tests/unit/setup/launch-doc.test.ts` | 417 |
| Test files under `tests/` (`*.test.ts` + `*.spec.ts`) | 219 |
| Registry items | 31 |

The review phase records the same measures after the change.

## Scope

**In:** the work items below.

**Out:**

- **The `cloudflare` devDependency stays.** The issue drops it only "if no remaining item needs
  it". Seven kept items need it: `local-credentials`, `cloudflare-zone`, `dns-records-parity`,
  `cloudflare-worker`, `web-analytics`, `mail-records` (zone reads) and `contact-bindings`. They
  all read through `scripts/setup-check/providers/cloudflare.ts`. Replacing the SDK with plain
  `fetch` is a separate chore. It would also be a dependency removal, so a major change. It is
  not listed as a follow-up unless Don wants one.
- **The `waiting` status** stays in the report contract (`CheckStatus`, `checkReportSchema`,
  `counts.waiting`, the report formatter) with nothing producing it. Removing it changes the
  `--json` report shape. Follow-up.
- **Preview Worker, preview database, the `workers.dev` noindex rule, the `/writing/topics/*` and
  Tempo redirects, the stage 1b Ghost redirects, the not-found assertions for Ghost paths, and
  the Ghost history in the Flux story and `docs/design-source.md`** all stay (cutover plan
  "Stays").
- **Flux stays unarchived** (Don, 2026-10-09). Nothing here proposes archiving it.
- History in `specs/` and `.specify/` is left as written, apart from W11.

**Follow-ups for the PR body:**

- DMARC tightening, #136 (moved from the cutover plan before its deletion).
- Retire the `waiting` status from the setup-check report contract.
- Remove the project `placeholder` picture option in its own `/tweak` with a
  visual-baseline refresh.
- #82 (single-Worker previews), when it lands, revisits `contact-bindings`'s preview half.

## Constitution Check

- **I. Test-First:** W2, W3, W5, W7 and W8 add failing cases first. Each removed assertion has a
  coverage mapping under its work item. Every new or moved test names its layer.
- **II. Automated Release Gate:** no check is weakened to get a change through. Removed tests
  guard steps that can no longer run (the coverage mappings say why). The full gate runs in CI.
- **III. Human Review for Major Changes:** no criterion fires.
  - No dependency, integration or service is added, removed or replaced: `package.json`
    dependencies are unchanged, and two `scripts` entries are removed, which is not a dependency.
  - Contact data collection, storage, retrieval and deletion are untouched; the new item only
    reads binding names.
  - No design, layout, navigation or visual identity change. The placeholder option, which
    would touch fixture shots, is split out.
  - No running cost.
  - No CI, deployment or infrastructure configuration: `.github/`, `wrangler*.json*`,
    `public/_headers`, `public/_redirects` and `astro.config.mjs` are untouched.
    `setup/config.json` loses three keys no build or deploy path reads (W5), and
    `setup/dns-baseline.json` is setup-check data that records the zone without changing it.
  - No constitution amendment.

  **Verdict: not major.** Auto-merge is armed after the final push; no baselines are pending.
- **IV. First-Party Before Custom:** no new custom code. No Astro approach is chosen (the content
  schema is untouched), so the Astro Docs MCP is not consulted. Cloudflare DMARC Management stays the source for the DMARC record.
- **V. Static by Default:** unchanged.
- **VI. Content as Files:** unchanged. The only content edit is an MDX comment in `flux.mdx` (W12).
- **VII. Private Data:** unchanged. `contact-bindings` keeps the names-only rule: secrets and
  variables are read by name, never by value.
- **VIII. Cloudflare Best Practices:** unchanged. The preview cron and migrations stay committed
  in `wrangler.jsonc` and are pinned by `tests/unit/site/config-files.test.ts`.
- **IX. Cost Ceiling:** unchanged.
- **X. Accessible, Fast and Private:** unchanged; no page output changes.
- **XI. Spec Kit Workflow:** one chore on `chore/retire-launch-checks` via `/chore`. Before the
  gate, merge `origin/main` and re-check the `docs/setup.md` hunks.
- **Security Baseline:** unchanged.

## Work items

Order rule: rewrite the readers before deleting what they read. The suite is green after every
item. Two items renumber the registry (W4 to 22 items, W8 to 16); each updates the
`Step N of T` pins it shifts.

### W1 — Retire the launch runbook tests [x]

- **Files:**
  - `tests/unit/setup/launch-doc.test.ts` (delete);
  - `tests/unit/setup/drift.test.ts` (delete the `describe("registry, docs/setup.md and
    docs/launch.md agree (011-launch)")` block, lines ~115–135).
- **Why first:** both read `setupItems` and the baseline. They would break as soon as W3, W4 or
  W7 changes either. `docs/launch.md` itself stays until W12.
- **Test:** existing (removal only).
- **Coverage mapping:**
  - `launch-doc.test.ts`: steps L1–L18, R1–R5, T1–T9, pause steps, Part order, the Part E and L8
    baseline tables, `--item` ids and the Part F ordering.
    → **Guarantee retired:** the runbook can never run again. Ghost was cancelled and its keys
    revoked on 2026-10-09 (stage 5 T3), so there is no rollback target, and the doc is deleted
    in W12.
  - drift "every `--item` id in launch.md is a registry id" → **retired** with the doc. Docs to
    registry agreement stays in `drift.test.ts` ("registry <-> docs/setup.md one-to-one").
  - drift "setup.md links launch.md and every link target exists" → **retired**, because W12
    removes every link. The `setup.md` count assertion stays in `docs-structure.test.ts`.
- **Layer:** n/a (removal).

### W2 — web-analytics checks the zone apex (test first) [x]

- **Files:**
  - `scripts/setup-check/checks/web-analytics.ts`;
  - `tests/unit/setup-check/checks/web-analytics.test.ts`;
  - `tests/fixtures/providers/cloudflare/web-analytics-site-present.json` (host becomes
    `doncoleman.ca`);
  - the `web-analytics` seed's `confirmedBy` in `scripts/setup-check/items.ts`.
- **What:**
  - Delete the `detectLaunchPhase` import and call and the `config.reviewHost` fallback. The
    checked host is always `config.zone` (default `doncoleman.ca`).
  - The site match stays the same: host equals the zone, or a zone-level automatic site with
    `host: null`.
  - The header comment loses the review-host and phase sentences.
  - The `confirmedBy` text becomes "Web Analytics site for the doncoleman.ca zone exists with
    automatic setup on; the served HTML of doncoleman.ca references the Cloudflare beacon".
- **Test:** new-first. Add "checks https://doncoleman.ca/ without reading the Worker's Custom
  Domains". Its context has no `listWorkerDomains` (the method throws if called), and its config
  has no `reviewHost`. It expects `complete` and the `https://doncoleman.ca/` GET. Record it red,
  then delete the phase-dependent cases ("before the switch checks the review host", "phase
  unreadable → could-not-check").
- **Coverage mapping:**
  - review-host case → **retired**: `new.doncoleman.ca` was removed at L16 and no longer
    resolves.
  - phase-unreadable could-not-check → **retired**: the item no longer reads the phase.
    Credential could-not-check cases stay.
- **Layer:** unit.

### W3 — DNS checks drop the launch phase (test first) [x]

- **Files:**
  - `scripts/setup-check/checks/dns-records-parity.ts` and `mail-records.ts`;
  - `scripts/setup-check/checks/shared.ts` (a neutral pending helper, if needed);
  - `tests/unit/setup-check/checks/dns-records-parity.test.ts` and `mail-records.test.ts`;
  - the `dns-records-parity` and `mail-records` seeds in `items.ts` (`purpose`, `where`,
    `confirmedBy`);
  - `scripts/setup-check/secrets.ts`: `dns-records-parity` leaves `CLOUDFLARE_ACCOUNT_ID`'s
    `usedBy`.
- **What, dns-records-parity:**
  - Delete `GHOST_WEB_TYPES`, the `LaunchPhase` import and the `detectLaunchPhase` call, the
    `phase` parameter of `evaluateDnsParity`, the `replacedAtLaunch` field, and both phase
    branches.
  - Delete the stale "the Ghost web records were replaced at launch" summary (line ~266).
  - The former switched rules become the only rules. A Cloudflare record matched by no baseline
    entry is informational on the apex and `www`, where the Worker Custom Domain adds its own
    records. On any other name it is a difference ("not in the baseline").
  - `ROLLBACK_NEXT_ACTION` becomes: "Restore the record in Cloudflare → DNS exactly as in
    setup/dns-baseline.json, or delete the unexpected record (or add it to the baseline in a
    reviewed change)."
  - The header comment describes only steady state.
  - The baseline shape (`decision`, `originalNameservers`) is **not** changed here; W7 does it.
- **What, mail-records:**
  - It no longer imports `live-shared.ts`. Its pending result uses `pending()` from `shared.ts`,
    with nextAction "Wait for DNS to finish updating, then run this check again." (no 24-hour
    rollback sentence).
  - `ROLLBACK_NEXT` loses the `docs/launch.md#rollback` clause.
  - Order and `ITEM` stay until W4.
- **Test:** new-first.
  - Parity: "compares the whole zone without reading the launch phase". Its context has no
    `listWorkerDomains` and no `CLOUDFLARE_ACCOUNT_ID`. A stray record on `mail.doncoleman.ca`
    is a Problem, and an `AAAA www 100::` is informational. Record it red: today it reports
    could-not-check.
  - Then fold the `once switched` describe into the top level, drop `phase` from `contextWith`,
    and delete "is could-not-check when the launch phase cannot be read" and "still reports a
    Cloudflare-only record on another name as information only before the switch".
  - mail-records: the pending case asserts the new nextAction (existing, edited).
- **Coverage mapping:**
  - parity "launch phase cannot be read" → **retired**: no phase is read.
  - parity "before the switch, another-name record is information only" → **retired**: there is
    no before-switch state any more. The stricter rule is now always on and pinned by the new
    case.
  - "Ghost web records not expected, noted as replaced" → **retired**: W7 removes the Ghost web
    records from the baseline, so the branch can never fire.
  - mail-records "24-hour sentence" → **retired**: there is no rollback. The `pending` status for
    resolver disagreement stays pinned.
- **Layer:** unit.

### W4 — Remove the launch, live and nameserver items [x]

- **Files:**
  - Sources to delete: `scripts/setup-check/checks/` `dns-nameservers.ts`,
    `live-domain-ghost.ts`, `review-address-removed.ts`, `launch-content-ready.ts`,
    `launch-main-checks.ts`, `live-apex.ts`, `live-www-redirect.ts`, `live-sitemap.ts`,
    `live-contact-endpoint.ts`, `launch-phase.ts` and `live-shared.ts`.
  - Tests to delete: the matching `tests/unit/setup-check/checks/*.test.ts`, plus
    `launch-phase.test.ts` and `live-helpers.ts`.
  - Fixtures no remaining test loads (`git grep` each name first):
    - `dns/`: `ghost-a-records-*`, `live-domain-switched-away-from-ghost`, `nameservers-*` and
      `squarespace-only-record-not-in-cloudflare`;
    - `http/`: `live-*` and `review-host-*`;
    - `cloudflare/`: `worker-domains-*`.
    - `dns/unbaselined-answers-found-by-snapshot.json` stays until W6.
  - `scripts/setup-check/items.ts`: imports, `checksById`, seeds, and the renumber to 22.
  - `scripts/setup-check/types.ts`: delete `postLaunch`. Delete `listWorkerDomains` from the
    Cloudflare reader interface if `git grep` finds no caller left in `scripts/`.
  - `scripts/setup-check/providers/cloudflare.ts`: delete the `listWorkerDomains` reader under
    the same condition.
  - `scripts/setup-check/checks/shared.ts`: delete `waiting()` and `WAITING_NEXT_ACTION`. The
    `waiting` status type stays (Scope).
  - `scripts/setup-check/secrets.ts`: `usedBy` lists.
  - Each kept check's `ITEM.order`.
  - Tests: `tests/unit/setup/items.test.ts`, `docs-structure.test.ts` and `docs-dns.test.ts`;
    `tests/unit/setup-check/next-action.test.ts`, `redact.test.ts` and `cli.test.ts` (only if
    it names a removed id); `tests/unit/setup-check/providers/*.test.ts` (any
    `listWorkerDomains` case); and every kept check test that pins `Step N of 31`.
  - `docs/setup.md`.
- **What:**
  - **Registry.** Remove the nine items. Move `mail-records` to order 5, directly after
    `dns-records-parity`. The new orders:
    1. `local-tools`
    2. `local-credentials`
    3. `cloudflare-zone`
    4. `dns-records-parity`
    5. `mail-records`
    6. `cloudflare-worker`
    7. `github-machine-account`
    8. `github-secret-scanning`
    9. `workers-builds`
    10. `github-ci-workflow`
    11. `github-codeowners`
    12. `github-main-protection`
    13. `pipeline-secrets`
    14. `preview-noindex`
    15. `web-analytics`
    16. `contact-d1-databases`
    17. `contact-turnstile-widget`
    18. `contact-worker-secrets`
    19. `contact-preview-builds`
    20. `contact-turnstile-site-key`
    21. `contact-preview-deploy`
    22. `contact-production-deploy`

    Update every check's `ITEM.order` to match. The `docs/launch.md` strings in `items.ts`
    (lines ~175 and ~511) leave with the deleted `live-domain-ghost` and `live-apex` seeds.
  - **`docs/setup.md`:**
    - Delete sections 5 (`dns-nameservers`), 6 (`live-domain-ghost`), 15
      (`review-address-removed`) and 25–30, and the `# Launch` part heading with its intro
      (lines ~762–766).
    - Move the `mail-records` section to sit after `dns-records-parity` as `## 5.`, then
      renumber every `## N.` heading.
    - Intro: "31" becomes "22". Delete the sentence that hands the launch items to
      `docs/launch.md` (line ~15).
    - Move one steady-state sentence from the deleted "Before the switch: DNSSEC" note into the
      `cloudflare-zone` section: "DNSSEC is on: the zone is signed and the registry holds its DS
      record."
    - The `web-analytics` section loses the review-host and launch-switch text (lines
      ~492–501).
    - The skill's links to `#dns-nameservers` are fixed in W9.
  - **Pinned tests:**
    - `items.test.ts`:
      - 22 items, with contact at slice 15–22 and `mail-records` at index 4;
      - phases: 1–8 before-merge, 9–15 after-merge, 16–21 before-merge, 22 after-merge and
        deferred;
      - delete every `postLaunch` assertion and the "items 15 to 17 follow the switch" and "item
        25/26/27–30" cases;
      - the `site:check` case stays until W6.
    - `docs-structure.test.ts`:
      - `ITEM_IDS` matches the registry, and the count test reads "exactly 22";
      - delete the `launch part (items 25 to 31)` describe;
      - the contact describe's title loses the old numbers.
    - `docs-dns.test.ts`: delete the three `dns-nameservers` cases (rollback, DNSSEC pre-check,
      original nameservers).
    - `redact.test.ts`: the waiting fixture item loses `postLaunch`, and its `docs` link becomes
      `docs/setup.md#web-analytics`. The redaction assertions stay.
    - `next-action.test.ts`: delete the removed checks' cases and imports.
- **Test:** existing (edited pins and removals). No new behaviour.
- **Coverage mapping:**
  - Removed `dns-nameservers`, `live-domain-ghost`, `review-address-removed`,
    `launch-content-ready`, `launch-main-checks` and `live-*` check tests → **guarantee
    retired**. Each item can only ever report complete: the nameservers moved, the Ghost site
    and the review host are gone, and the launch has happened.
  - The live serving guarantees live elsewhere:
    - apex serves the site → `tests/e2e/pages.spec.ts` against the production build, plus the
      CI preview crawl (`scripts/site-check/preview.ts`);
    - sitemap pages load → `tests/build/indexing.test.ts` sitemap entries and the e2e
      `site-links.spec.ts` crawl;
    - contact endpoint → the contact integration and e2e tests.
  - `launch-phase.test.ts` → **retired**: no caller remains after W2 and W3.
  - `docs-dns` nameserver, DNSSEC and original-nameserver cases → **retired**: the switch
    happened, Cloudflare is authoritative and DNSSEC is on. The new `cloudflare-zone` sentence
    records the steady state.
  - `items.test` `postLaunch` pins → **retired**: no item has the field, and TypeScript rejects
    it once it leaves `SetupItem`.
  - The `waiting` helper → **retired**: it had no producer left. The `waiting` status is still
    pinned by `report.test.ts` and `schemas.test.ts`.
- **Layer:** unit.

### W5 — Remove `reviewHost`, `ghostMarker` and `launch` from the setup config (test first) [x]

- **Files:**
  - `setup/config.json`;
  - `scripts/setup-check/schemas.ts` (`configSchema`) and `types.ts` (`SetupConfig`);
  - `src/lib/site-origin.ts` (delete the `reviewHost?` field and its comment);
  - `tests/unit/setup/schemas.test.ts`;
  - `tests/unit/site/site-origin.test.ts`;
  - `tests/build/indexing.test.ts`;
  - `tests/build/local-site.test.ts` (line ~115);
  - `tests/unit/setup-check/next-action.test.ts` (`CONFIG.reviewHost` and the `web-analytics`
    case's host);
  - any other `SetupConfig` fixture `git grep reviewHost` finds.
- **What:** delete the three keys from the file, the schema and the type. `isSiteHost` in
  `indexing.test.ts` drops its `setupConfig.reviewHost` clause; `.endsWith(".doncoleman.ca")`
  already covers subdomains.
- **Test:** new-first. In `schemas.test.ts`, add "accepts a config without reviewHost and
  ghostMarker". It fails today because both keys are required. Record it red. Then:
  - delete the `configSchema: the optional launch object (T007)` describe;
  - drop `reviewHost` and `ghostMarker` from the valid fixtures;
  - in `site-origin.test.ts`, delete "no longer reads reviewHost for a main build" and drop
    `reviewHost` from `baseConfig`;
  - in `indexing.test.ts`, delete the "lists every launch.expectedPaths entry" case and the
    `describe("launch.expectedPages and launch.expectedPaths")` block;
  - in `local-site.test.ts`, delete the `not.toContain("new.doncoleman.ca")` assertion.
- **Coverage mapping:**
  - `launch.expectedPaths` in the production sitemap → **lives in**
    `tests/build/indexing.test.ts`. "sitemap entries equal `sitemapPaths({ production })`"
    derives the full expected set from content, which is stronger than a fixed list.
  - `expectedPages` files exist → **lives in** `tests/unit/content/launch-content.test.ts`
    (renamed in W10), which loads each page file and fails if it is missing.
  - "reviewHost is kept" / "no longer reads reviewHost" → **retired**: the field is gone from
    the type, so `pnpm astro check`/`tsc` in the gate rejects any read of it.
  - `launch` object schema rules → **retired** with the object.
  - sitemap has no `new.doncoleman.ca` → **lives in** `indexing.test.ts`, which pins every
    sitemap and canonical URL to the build's own origin.
- **Layer:** unit (schema). The build-test edits are removals only.

### W6 — Remove the two launch-only scripts [x]

- **Files:**
  - delete `scripts/setup-check/dns-snapshot.ts`, `tests/unit/setup-check/dns-snapshot.test.ts`
    and `tests/fixtures/providers/dns/unbaselined-answers-found-by-snapshot.json`;
  - delete `scripts/site-check/cli.ts` and `tests/unit/site-check/cli.test.ts`;
  - `package.json`: remove the `site:check` and `setup:dns-snapshot` scripts;
  - `tests/unit/setup/items.test.ts`: delete the `package.json scripts for the launch (T002)`
    describe;
  - `tests/unit/setup/skill-behaviour.test.ts`: remove `pnpm setup:dns-snapshot` from the
    allowed list;
  - `.claude/skills/setup-walkthrough/SKILL.md`: delete the `pnpm setup:dns-snapshot` and
    `pnpm run site:check …` lines under "Allowed commands";
  - `docs/setup.md`: delete the `pnpm setup:dns-snapshot` sentence in `dns-records-parity`;
  - `.gitignore`: delete any `dns-snapshot` entry (none found at e6bf21b).
- **What:** keep `scripts/site-check/crawl.ts` and `preview.ts`. If `crawl.ts`'s header comment
  names `cli.ts`, reword it to name `preview.ts` and `tests/e2e/site-links.spec.ts` as its
  callers. No export changes.
- **Test:** existing (removals).
- **Coverage mapping:**
  - `dns-snapshot.test.ts` → **retired**: the snapshot only served the Squarespace inventory
    and rollback, and W7 removes the baseline's inventory role.
  - `cli.test.ts` (L4 crawl CLI) → **retired**. The crawl logic stays covered by
    `tests/unit/site-check/crawl.test.ts`, `preview.test.ts` and the e2e `site-links.spec.ts`.
  - items.test `site:check` script pin → **retired** with the script.
  - skill-behaviour `setup:dns-snapshot` → **retired**. The other allowed commands stay pinned.
- **Layer:** n/a (removal).

### W7 — Slim the DNS baseline to a must-exist list (test first) [x]

- **Files:**
  - `setup/dns-baseline.json`;
  - `scripts/setup-check/schemas.ts` (`dnsBaselineSchema`) and `types.ts` (`DnsBaseline`,
    `DnsBaselineRecord`);
  - `scripts/setup-check/checks/dns-records-parity.ts` and `mail-records.ts`;
  - the seeds for both items in `items.ts`;
  - `scripts/setup-check/cli.ts` (the baseline schema validation at line ~204 stays, only the
    shape changes);
  - tests: `tests/unit/setup/dns-baseline-schema.test.ts` and `docs-dns.test.ts`;
    `tests/unit/setup-check/checks/dns-records-parity.test.ts`, `mail-records.test.ts` and
    `next-action.test.ts` (baseline fixtures); any `tests/fixtures/providers/dns/mx-txt-*`
    baseline fixture carrying the old fields;
  - `docs/setup.md`: the `dns-records-parity` and `mail-records` sections.
- **Shape decision:** `{ "records": [ { type, name, content, priority, ttl } ] }`, with
  `.strict()` on the record and the top-level objects, so a leftover `source`, `decision`,
  `reason` or `originalNameservers` fails validation loudly.
  - `decision` and `reason` go as well as the fields Don named. With no `drop` record left,
    every record is one that must exist, so `decision` would always be `keep` and `reason`
    always `null`.
  - `ttl` stays: Don's handoff fixes DMARC and CAA at TTL 1. It remains informational in the
    parity comparison.
  - The MX/SRV priority rule stays.
- **What:**
  - **The baseline file.** The 11 records of acceptance 4. Before writing it, run
    `pnpm setup:check --item dns-records-parity` (read-only). Set each record's `ttl` to the
    value Cloudflare reports (the "TTL differs (informational)" lines; `1` means Auto), so the
    run after has no TTL lines.
  - **Parity:**
    - delete the `undecided` and `otherRecords` paths and the `missingBaseline` nameserver
      clause;
    - an empty `records` stays `missing` ("The DNS baseline has no records."), so parity never
      passes vacuously;
    - every baseline record is compared as `keep` records were;
    - the W3 unmatched-record rule is unchanged;
    - the seed `where` and `confirmedBy` describe the must-exist list. Drop the Squarespace
      wording.
  - **mail-records:** every baseline mail record is expected. Delete the `drop`
    "still answers (information only)" loop. The "No mail records" missing text drops "Record
    the Squarespace baseline first (step 4)" in favour of "Add the iCloud MX, SPF and DKIM
    records to setup/dns-baseline.json".
  - **`docs/setup.md`:**
    - `dns-records-parity`: rewrite "What / Where / How" for the must-exist list. Keep the
      sentence that TTL is informational and Cloudflare's dashboard stays on Auto
      (`docs-dns.test.ts` pins "ttl", "informational" and "auto"). Delete the Squarespace,
      `originalNameservers`, delegated-NS, `source` and switch paragraphs.
    - `mail-records`: delete the Mailgun `drop` sentence and the 24-hour/`docs/launch.md`
      clause.
    - **DMARC steady-state note** (in `mail-records`, after "Where to do it"): "The `_dmarc`
      record is at `p=none`, with reports through Cloudflare DMARC Management. Tightening it to
      `quarantine` and then `reject` is tracked in #136. When the policy changes, update the
      `_dmarc` record in `setup/dns-baseline.json` in the same reviewed change, or
      `dns-records-parity` reports the difference."
- **Test:** new-first in `dns-baseline-schema.test.ts`. Record these red before the file and
  schema change:
  - The real baseline parses with the new strict schema.
  - The schema rejects a record carrying `decision`, and rejects a top-level
    `originalNameservers`.
  - Must-exist invariants on the real file:
    - an MX to `mx01.mail.icloud.com` and to `mx02.mail.icloud.com`;
    - an apex TXT starting `v=spf1` and including `include:icloud.com`;
    - an apex TXT starting `apple-domain=`;
    - an apex TXT starting `google-site-verification=`;
    - a CNAME on `sig1._domainkey.doncoleman.ca`;
    - a `_dmarc.doncoleman.ca` TXT starting `v=DMARC1`;
    - at least one apex CAA matching `/^\d+ issue "/`.
  - No record's content mentions `mailgun`, `mymagic.page` or `squarespace`.

  Then update the existing suites:
  - Parity: delete "originalNameservers is empty", "no keep/drop decision" and the drop-matching
    cases. Rebuild `keepRecord()` on the new shape.
  - mail-records: delete "lists a dropped baseline record that still answers as information
    only…". Rebuild the fixture records on the new shape.
  - `docs-dns.test.ts`: delete "baseline-nameserver / delegated-subdomain-NS recording note".
    The TTL case stays.
  - `dns-baseline-schema.test.ts`: delete "rejects a drop decision without a reason", the two
    Ghost web cases and "is schema-valid starting empty".
- **Coverage mapping:**
  - parity "no decision → missing" and schema "drop needs a reason" → **retired**: the fields no
    longer exist, and `.strict()` rejects them.
  - parity "originalNameservers empty → missing" → **retired**: nameservers are no longer
    recorded. The empty-records missing case stays.
  - The drop-record matching (a drop entry hides a Cloudflare record from the Cloudflare-only
    list) → **replaced**: a record not in the baseline is now a difference off the apex and
    `www` (W3 case), which is stricter.
  - mail-records "dropped record still answers is information only" → **retired**: there are no
    drop records. A retired Mailgun record reappearing in the zone is now caught by
    `dns-records-parity` as "not in the baseline".
  - "Ghost web records dropped with a reason" and "DMARC and CAA kept" (dns-baseline-schema) →
    the latter **lives in** the new invariants; the former is **retired** (the records are gone).
  - `docs-dns` delegated-NS note → **retired** with the inventory role.
- **Layer:** unit.

### W8 — Fold the contact items into `contact-bindings` (test first) [x]

- **Files:**
  - new `scripts/setup-check/checks/contact-bindings.ts` and
    `tests/unit/setup-check/checks/contact-bindings.test.ts`;
  - delete `contact-{d1-databases,turnstile-widget,worker-secrets,preview-builds,turnstile-site-key,preview-deploy,production-deploy}.ts`
    and their seven tests;
  - `scripts/setup-check/checks/contact-shared.ts`: delete `RETIRED_DB_NAMES`,
    `PREVIEW_DEPLOY_COMMAND` and `previewCron`, and refresh the header comment;
  - `tests/unit/setup-check/checks/contact-helpers.ts` (the default databases are `dcc-web` and
    `dcc-web-preview`, with no `dcc-web-contact`);
  - `scripts/setup-check/items.ts` (seven seeds become one; total 16);
  - `scripts/setup-check/types.ts` (delete `deferredUntilMerge`);
  - `scripts/setup-check/report.ts` (delete the deferred-until-merge label and `ok` clause,
    lines ~72 and ~92–94);
  - `tests/unit/setup-check/report.test.ts` (delete the deferred cases; rename the
    `contact-worker-secrets` fixture id to `contact-bindings`);
  - `scripts/setup-check/secrets.ts` (`usedBy`);
  - `tests/unit/setup/items.test.ts` and `docs-structure.test.ts`;
  - `tests/unit/setup-check/providers/contact-readers.test.ts` (only if it imports a deleted
    module; the readers themselves stay);
  - every kept check test pinning `Step N of 22`;
  - `docs/setup.md` (the Contact form part).
- **The item:**
  - id `contact-bindings`, order 16, title "Contact bindings present", `phase: "after-merge"`;
  - `dependsOn: ["local-credentials", "cloudflare-worker"]`, `needsDon: true`;
  - principles VII, VIII and IX; requirements FR-012, FR-017, FR-018, FR-023, FR-024, FR-027a
    and FR-028;
  - secrets `TURNSTILE_SECRET_KEY`, `CONTACT_READ_TOKEN`, `IP_HASH_SALT` and
    `PUBLIC_TURNSTILE_SITE_KEY`.
- **The check:**
  1. Run one `requireCloudflareAccess` gate and one `readContactConfig`; an unreadable
     `wrangler.jsonc` → `could-not-check`.
  2. Then, inside one `try`, run five parts in order. Each returns problem lines and notes, and
     each problem line is prefixed by its part:
     - **Databases:** both `dcc-web` and `dcc-web-preview` exist; the IDs equal
       `wrangler.jsonc` (a placeholder counts as missing); the region is WNAM, and an absent
       region is "could not be confirmed".
     - **Turnstile widget:** "dcc-web contact" exists in managed mode and covers
       `doncoleman.ca`. It covers `drc-dev.workers.dev`, unless the preview site-key fallback is
       in use, which is a note. A missing widget is a problem line, not an early return.
     - **Worker secrets:** the three names exist on both Workers, names only. A missing Worker
       is a problem line.
     - **Site key:** `PUBLIC_TURNSTILE_SITE_KEY` exists on every build trigger of both Workers.
       A Worker with no trigger is a problem line.
     - **Production deploy:** `dcc-web`'s production trigger uses
       `pnpm run deploy:production`; `dcc-web` has every migration in `migrations/` applied; and
       `dcc-web` has the cron from `wrangler.jsonc` (default `17 3 * * *`).
  3. Any problem → `missing`, with summary "Some contact bindings are not in place." The details
     are the problems, then the notes. The nextAction is the first failing part's fix text from
     the old item, with the link `docs/setup.md#contact-bindings`.
  4. No problem → `complete`, with the notes as details.
  5. A provider error → `fromProviderError`. Its nextAction names every read permission used:
     D1 Read, Turnstile Sites Read, Workers Builds Configuration Read and Workers Scripts Read.
- **Test:** new-first. Write `contact-bindings.test.ts` from `contact-helpers.ts` first; it fails
  on the missing module. The assertion mapping below is the checklist. Then write the check,
  then delete the seven old tests. Every kept assertion's `result.id` and `result.docs` become
  `contact-bindings` and `docs/setup.md#contact-bindings`.
- **Coverage mapping (old test → new home):**
  - `contact-d1-databases.test.ts`:
    - complete case, missing database, placeholder id, id mismatch, region not WNAM and region
      absent → **contact-bindings "Databases" cases**;
    - could-not-check without token or account id → **contact-bindings access cases**
      (once, not per part);
    - retired `dcc-web-contact` still present is a note → **guarantee retired**: Don deleted
      the retired databases after the production deploy (item 24, 2026-10), and
      `RETIRED_DB_NAMES` is gone, so the note can never fire.
  - `contact-turnstile-widget.test.ts`: widget absent, not managed, missing `doncoleman.ca`,
    missing preview host without fallback (problem) and with fallback (note) →
    **"Turnstile widget" cases**.
  - `contact-worker-secrets.test.ts`: all present, a missing name per Worker and a Worker that
    does not exist → **"Worker secrets" cases**; the names-only assertion (no value read) →
    kept as one case.
  - `contact-turnstile-site-key.test.ts`: a trigger without the variable and a Worker without a
    trigger → **"Site key" cases**.
  - `contact-production-deploy.test.ts`: wrong production deploy command, no production
    trigger, unapplied migration, missing production database and missing cron →
    **"Production deploy" cases**.
  - `contact-preview-builds.test.ts` (the preview Worker builds with `pnpm run deploy:preview`,
    and `dcc-web` has no non-production trigger) → **guarantee moves to CI**. The `verify`
    job's preview step (`scripts/site-check/preview.ts`, pinned by
    `tests/unit/site-check/preview.test.ts` and `tests/unit/ci/workflows.test.ts`) waits for
    the `Workers Builds: dcc-web-preview` check on every PR and fails if no preview deploys.
    This is the one-shot item retirement Don agreed on #101.
  - `contact-preview-deploy.test.ts`:
    - preview migrations applied → **guarantee moves to the deploy**: `deploy:preview` applies
      migrations on every branch build, and a failed migration fails that build, which fails
      the CI preview wait;
    - preview cron registered → **lives in** `tests/unit/site/config-files.test.ts`, which pins
      the `env.preview` crons in `wrangler.jsonc`. Cron Triggers are deployed from that
      committed config (Principle VIII).
  - `items.test` "item 24 deferredUntilMerge" and `report.test` deferred cases → **retired**: no
    item is deferred, and the field is removed from the type.
  - `docs-structure.test`:
    - "item 18 region and commands", "item 20 secret put commands", "items 21 to 24 name the
      deploy commands …" and "item 23 Workers AI" → **rewritten against the
      `contact-bindings` section**, which keeps each phrase;
    - the two "item 24 deletes the retired dcc-web-contact databases" cases → **retired**: the
      databases are deleted, and the delete commands leave the docs.
- **`docs/setup.md`:**
  - Replace sections `## 16.`–`## 22.` with one `## 16. Contact bindings present
    {#contact-bindings}`. Its **What / Where / How / Constitution principle / Secrets** parts are
    built from the old sections, with one `###` subsection per part (databases, Turnstile
    widget, Worker secrets, site key build variable, production deploy).
  - Keep the phrases the rewritten tests pin: Western North America, `` `wnam` ``, "cannot be
    changed", both `d1 create` commands, `pnpm exec wrangler d1 delete` (the wrong-name
    recreate), "usage bucket", the three `wrangler secret put` names with `--env preview`, the
    replacement rule, "never … chat", `PUBLIC_TURNSTILE_SITE_KEY`, `pnpm run deploy:production`,
    "after", and the Workers AI note on the Workers Builds token.
  - Delete:
    - the preview-builds and preview-deploy walkthrough text, keeping one sentence that
      `dcc-web-preview` builds branches with `pnpm run deploy:preview` (see `workers-builds`);
    - the item-24 `dcc-web-contact` delete procedure;
    - "(this covers `new.doncoleman.ca`)" in the Turnstile text (line ~578).
  - Fix "steps 20 and 22" style cross-references, and update the intro count to 16.
  - The `# Contact form` part heading stays before `{#contact-bindings}`.
- **Layer:** unit.

### W9 — Trim the setup-walkthrough skill [x]

- **Files:** `.claude/skills/setup-walkthrough/SKILL.md`, and
  `tests/unit/setup/skill-behaviour.test.ts` if a pinned phrase moves.
- **What:**
  - **Behaviour step 1:** keep "Run `pnpm setup:check --json`" and delete the
    `live-domain-ghost` Problem check.
  - **The `waiting` bullet:** delete it; nothing produces `waiting`.
  - **Behaviour step 4:** delete it (the `dns-nameservers` gate, rollback and DNSSEC), and
    renumber the following steps.
  - **Launch hand-over:** delete the section, including the `new.doncoleman.ca` crawl command.
    Move its rule "never signs in, never creates accounts, never changes DNS and never handles
    or asks for a credential" into "Secret handling" verbatim. `skill-behaviour.test.ts` pins
    those phrases.
  - **"Contact form order (items 18 to 24)":** becomes "Contact bindings (item 16)". It is one
    step, walked part by part in the order databases → widget → secrets → site key →
    production deploy. Delete:
    - the preview-builds and preview-deploy steps;
    - the retired-database delete procedure;
    - the D1 Edit reminder tied to old item 23.

    Keep the "Item 18: region confirmation" and "Item 20: secrets by name only" subsections,
    retitled to the `contact-bindings` parts. Their fenced `d1 create`, `d1 delete dcc-web` and
    `secret put` blocks stay "shown for Don to run himself". `skill-behaviour.test.ts` requires
    one of each.
  - **Item numbers:** update every remaining item number to the new registry.
  - `READ_BY_CHECKS` is not touched.
- **Test:** existing (`skill-behaviour.test.ts` stays green and unedited, apart from W6's
  removal). Not a behaviour change to the site.
- **Coverage mapping:** no assertion removed in this item.
- **Layer:** unit.

### W10 — Drop "launch" from the content test names [x]

- **Files:**
  - `git mv tests/unit/content/launch-content.test.ts tests/unit/content/site-pages.test.ts`;
    rename its `LAUNCH` constant to `PAGES` and the "launch page files" describe to "site page
    files";
  - `tests/unit/content/navigation.test.ts`: `launchPages` becomes `sitePages`;
  - first-line comments in `tests/e2e/pages.spec.ts` and `tests/e2e/site-links.spec.ts`;
  - the comment at `tests/build/local-site.test.ts:161`, which names the old file.
- **What:** names and comments only. No assertion changes.
  - No Playwright test title changes, so no snapshot file names change.
  - Check `docs/testing.md` and `tests/helpers/` for the old file name with `git grep
    launch-content` and update any hit.
- **Test:** no behaviour: n/a (rename; the same assertions run).
- **Layer:** unit (unchanged).

### W11 — Close out spec 011's stale tasks

- **Files:**
  - `specs/011-launch/tasks.md`;
  - `specs/011-launch/spec.md`, `plan.md`, `contracts/launch-walkthrough.md` and
    `checklists/privacy-security.md` (the Flux lines).
- **What:**
  - **Flux-archive lines (Don, 2026-10-09: annotate).** Append "superseded: Don chose to keep
    Flux unarchived (2026-10-09)" to each line that requires archiving Flux, leaving the
    original text as written:
    - FR-023 (`spec.md:440–443`) and the user story at `spec.md:197–213`;
    - `plan.md:109`;
    - `contracts/launch-walkthrough.md:91–92`;
    - `checklists/privacy-security.md:37` (CHK021);
    - T079 in `tasks.md`.

    The spec then no longer contradicts `docs/design-source.md`.
  - **T024 and T088** (preview crawl proved noindex on `workers.dev`): find a recent green PR
    `verify` run whose preview step printed `Preview site check passed`, using `gh run list`
    and `gh run view --log` on `ci.yml`. Tick both with "(confirmed by run <id>, 2026-10-09,
    #101)". If no such log is found, tick them with "(closed out, #101: the preview crawl step
    has gated every PR since #23 merged)".
  - **T043 and T087** (Don's preview checks for PR #23): tick them with "(closed out 2026-10-09,
    #101: PR #23 merged; the launch then passed the live checks, and setup:check was 31 of 31
    before stage 6)".
- **Test:** no behaviour: n/a (history notes).
- **Layer:** n/a.

### W12 — Delete `docs/launch.md` and every link to it

- **Decision:** delete, rather than mark historical. Git history keeps the file, and the
  cutover is finished. Spec 011 and the `.specify/chores/` records keep their own paths as
  history.
- **Files:**
  - `docs/launch.md` (delete);
  - remaining links in `docs/setup.md` (`git grep -n "launch.md" docs/setup.md`) and
    `docs/design-source.md:17` (the Flux sentence becomes "Flux's site is retired with Ghost,
    but the repository stays where it is and …", with no path; `design-source.test.ts` pins
    other phrases);
  - `src/content/projects/flux.mdx:28` (the MDX comment drops "(docs/launch.md)");
  - leftover string fixtures in `tests/unit/setup-check/report.test.ts`,
    `tests/unit/setup/schemas.test.ts` and `redact.test.ts`. Their `nextAction` texts that cite
    `docs/launch.md Part C` become a neutral sentence, such as "Nothing to do yet." The status
    assertions stay;
  - any other hit from acceptance 5's pattern outside `docs/cutover-plan.md`.
- **Test:** no behaviour: n/a (deletion and wording). `drift.test.ts`, `docs-structure.test.ts`
  and `design-source.test.ts` run in the gate.
- **Layer:** n/a.

### W13 — Delete `docs/cutover-plan.md` (last)

- **Precondition:** the DMARC tightening item is carried in #136 (done by the orchestrator), and
  W7's `docs/setup.md` note cites #136.
- **Files:** `docs/cutover-plan.md` (delete). `git grep cutover-plan` outside `specs/` and
  `.specify/` returns nothing.
- **What:** the `Stage 6` checklist is fully covered by W1–W12 and the placeholder follow-up. #136 is the only item still
  open. Every other box was ticked in stage 5.
- **Test:** no behaviour: n/a.
- **Layer:** n/a.

Work-item count: **13**. The project `placeholder` picture option is dropped from this chore: Don
split it to a follow-up `/tweak` with its own visual-baseline refresh (2026-10-09).

## Decisions recorded (Don, 2026-10-09)

1. **Project `placeholder` picture option:** split out to a follow-up `/tweak`. This PR changes
   no page and no visual baseline.
2. **Spec 011's Flux-archive lines:** annotated in W11 with "superseded: Don chose to keep Flux
   unarchived (2026-10-09)".
3. **Verification:** each work item runs its targeted tests locally (the files it touches, plus
   `tests/unit/setup` and `tests/unit/setup-check` for registry items). CI is the full gate;
   no local full `pnpm run verify` is run.

## Docs citations

- **Cloudflare DMARC Management** (developers.cloudflare.com/dmarc-management/) manages the
  `_dmarc` record and its `rua` address. The W7 setup note cites it for the steady state.
  Tightening is #136.
- **Cloudflare DNS records API** (developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/).
  `dns-records-parity` keeps reading it through the existing provider. TTL `1` means "automatic"
  in that API, which is why the baseline records `1` for Auto records.
- **Workers Builds** (developers.cloudflare.com/workers/ci-cd/builds/) and **Cron Triggers**
  (developers.cloudflare.com/workers/configuration/cron-triggers/) back the W8 mapping:
  - the preview deploy command and migrations run on every branch build;
  - crons come from the committed `wrangler.jsonc` on deploy.
- No new tool usage: no Wrangler, pnpm or Astro command changes beyond removing two
  `package.json` scripts. No Astro approach is chosen, so no Astro docs page is cited.

## Risks

- **Stricter DNS parity.** With the `drop` records gone, a leftover Cloudflare record on a name
  other than the apex and `www` is a difference. The old `_domainconnect` CNAME (dropped
  2026-09-28) and any Mailgun leftovers are examples. The W7 implementer runs the read-only
  parity check before and after the change. If it reports such a record, the summary names it.
  Don deletes it in the dashboard, or the orchestrator asks him. The baseline never re-adds a
  retired record.
- **Two registry renumbers.** W4 and W8 each shift every `Step N of T` pin and the docs heading
  numbers. Each item updates them mechanically (`git grep -n "of 31"`, then `"of 22"`), and the
  `items.test.ts` contiguity test catches a miss.
- **Drift tests couple registry and docs.** `drift.test.ts`, `docs-structure.test.ts` and
  `items.test.ts` require the registry and `docs/setup.md` to change in the same commit. W4 and
  W8 each carry both.
- **The skill is stale between W4 and W9.** It is only read by `skill-behaviour.test.ts`, which
  does not pin item numbers or ids, so the suite stays green. W9 fixes the text before the PR.
- **Folding loses per-part status.** `contact-bindings` reports one status for five parts. Each
  problem line is prefixed by its part, and nextAction names the first failing part, so a
  single run still shows every gap.
- **Report contract.** Removing `deferredUntilMerge` changes when `report.ok` is true only for
  an item that no longer exists. The `waiting` status stays (Scope).
- **Targeted local tests only.** No local full verify is run (Don, 2026-10-09). Any build,
  e2e or visual regression first shows up in CI; it is fixed on the branch before the merge.
