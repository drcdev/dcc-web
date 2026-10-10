# Chore plan: retirement-dns-headers

Branch: `chore/retirement-dns-headers`, from `main` at 67fc616 (after #131 merged).
Closes #93. This is `docs/launch.md` T9 ("Follow-up pull request and final check") and the
"T9 + #93 repo half" line of `docs/cutover-plan.md` stage 5, prepared as `specs/011-launch/tasks.md`
T104.

## Goal

Ghost is retired. On 2026-10-09 Don cancelled Ghost and revoked its keys (T3), deleted the Mailgun
records, sending domain and keys and passed the mail test (T4), and confirmed there was no Supabase
data to export and that the Flux Supabase project was already gone (T5 to T7). He waived the Ghost
export (T2). For the #93 manual half he checked the zone's hostnames: only the apex (200) and `www`
(301) resolve; `mail.` and `new.` do not. He added a `_dmarc` TXT at `p=none` with reporting
through Cloudflare DMARC Management and four CAA `issue` records. DNSSEC was already on (the zone is
signed and has a DS record). Don started stage 5 on 2026-10-09, earlier than the cutover plan's "no
earlier than 14 days after the switch".

The rollback-safety carve-outs no longer have a reason. This chore brings the repository in line:

- HSTS gains `includeSubDomains`, with no `preload`.
- The `new.doncoleman.ca` noindex rule leaves `public/_headers`.
- The DNS baseline drops the two Ghost web records with dated reasons and keeps the DMARC and CAA
  records, so `dns-records-parity` catches them going missing.
- The specs and docs that recorded the carve-outs are corrected: FR-010d, the 002 research note,
  the indexing contract, the DNSSEC text in setup, and the Flux note in design-source.
- The stage 5 ticks are recorded in the cutover plan and in tasks T099 to T102 and T104.

No page changes. HSTS is a response header that browsers act on and visitors do not see, and the
removed noindex rule is for a host that no longer resolves.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Tests seen failing first.** Three tests fail before their implementation and pass after,
   and the implement summary records each red run:
   - the new HSTS `includeSubDomains` case in `tests/unit/site/headers.test.ts` (W1), before W2;
   - the rewritten Ghost web case in `tests/unit/setup/dns-baseline-schema.test.ts` (W4), before W5;
   - the new DMARC and CAA case in the same file (W4), before W5.
2. **`public/_headers`.** Line 8 reads `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   (no `preload`). The `https://new.doncoleman.ca/*` block is gone, along with the blank line
   before it. Every other rule is unchanged: `git diff main -- public/_headers` shows only those
   two hunks.
3. **Baseline.** `setup/dns-baseline.json` has 19 records (14 + 5):
   - `A doncoleman.ca 49.13.201.194` and `CNAME www.doncoleman.ca drift-and-convergence.mymagic.page`
     have `decision: "drop"` and a non-empty dated reason. Their other fields are unchanged.
   - Five new `keep` records with `source: "cloudflare"`, `priority: null` and `reason: null`:
     - `TXT _dmarc.doncoleman.ca` with content
       `v=DMARC1; p=none; rua=mailto:a689ba2b4e8e46018da5c62d5df6361c@dmarc-reports.cloudflare.net`
       (stored unquoted, like the other TXT records);
     - `CAA doncoleman.ca` four times, with contents `0 issue "letsencrypt.org"`,
       `0 issue "pki.goog"`, `0 issue "sectigo.com"` and `0 issue "ssl.com"`.
   - Each new record's TTL is the value Cloudflare reports (3600 expected, as the Google TXT
     already has). If the parity run reports "TTL differs" for a new record, the baseline takes
     the Cloudflare value.
   - No `AAAA 100::` record is added. The apex and `www` are switch names, so those records are
     Cloudflare-only information, not a difference.
   - No other record changes.
4. **Setup check (live, read-only).** After W5, three commands report complete:
   `pnpm setup:check --item dns-records-parity` (with no "replaced at launch" or "not in the
   baseline" lines), `pnpm setup:check --item mail-records` and
   `pnpm setup:check --item live-domain-ghost`. The implement summary records the runs and never
   prints credentials.
   **Before** (2026-10-10 04:25 UTC, at 67fc616): `dns-records-parity` is missing with one
   difference, the `_dmarc` TXT "not in the baseline". It also lists the two Ghost web records as
   "replaced at launch" and the four CAA and two `AAAA 100::` records as Cloudflare-only.
5. **Unit and build tests green.** These pass:
   - `tests/unit/site/headers.test.ts`, `tests/build/indexing.test.ts`,
     `tests/unit/setup/dns-baseline-schema.test.ts`, `tests/unit/setup/launch-doc.test.ts`,
     `tests/unit/setup/schemas.test.ts`, `tests/unit/setup/docs-dns.test.ts`,
     `tests/unit/site/design-source.test.ts` and `tests/unit/site/docs-content-structure.test.ts`;
   - `tests/unit/setup-check/checks/{dns-records-parity,mail-records,live-domain-ghost,dns-nameservers,web-analytics}.test.ts`
     and `tests/unit/setup-check/next-action.test.ts`, with no edits. Those use fixtures, not the
     real baseline.
6. **`docs/launch.md` is not edited.** It is the dated walkthrough, and the L8 and Part E rows are
   the rollback record. `launch-doc.test.ts` still pins them through the type-and-name filters
   in W4.
7. **Scope of the diff.** `git diff --name-only main` lists only:
   - `public/_headers` and `setup/dns-baseline.json`;
   - `scripts/setup-check/checks/mail-records.ts` (comment only);
   - `tests/unit/site/headers.test.ts`, `tests/build/indexing.test.ts`,
     `tests/unit/setup/dns-baseline-schema.test.ts` and `tests/unit/setup/launch-doc.test.ts`;
   - `docs/setup.md`, `docs/design-source.md` and `docs/cutover-plan.md`;
   - `specs/011-launch/spec.md`, `specs/011-launch/tasks.md`,
     `specs/011-launch/contracts/indexing-and-origin.md` and
     `specs/002-site-foundation/research.md`;
   - `.specify/chores/retirement-dns-headers/**`.

   Nothing under `src/`, `worker/`, `.github/` or `.claude/`, and no change to `wrangler*.json*`,
   `package.json` or `setup/config.json`.
8. Full `pnpm run verify` is green, locally or in CI per the usual load caveat. After the deploy,
   the preview's `/` response carries `strict-transport-security: max-age=31536000; includeSubDomains`.
   The agent checks this with `curl -sI`, so it needs no `[PREVIEW-CHECK]`.

## Scope

**In:** the work items below.

**Out (follow-ups for the PR body):**

- **T8 (`specs/011-launch/tasks.md` T103):** scan and archive `drcdev/flux`. Don did not run it.
  `docs/design-source.md` therefore does not say Flux is archived (W7), and T103 stays open. When
  T8 is done, a one-line docs change can say it is archived.
- **DMARC tightening** (cutover plan, about 4 weeks later): `p=none` to `quarantine`, then
  `reject`, with a small baseline `/chore`.
- **HSTS `preload`:** to be decided separately, because removal from the preload list is slow
  (#93).
- **Apex Custom Domain in `wrangler.jsonc`** (optional in T9): left out. `wrangler.jsonc` has no
  `routes` or `custom_domain` today, and adding one affects the deploy, preview and e2e configs.
  The custom domain set in the dashboard stays the source. Named as a follow-up.
- **Stage 6 (#101):** removes the review-host and Ghost plumbing that goes idle here.
  - `setup/config.json` `reviewHost` and its `launchConfig.reviewHost` test in
    `tests/build/indexing.test.ts`.
  - The `review-address-removed` and `live-domain-ghost` items.
  - `GHOST_WEB_TYPES` and "replaced at launch" in `checks/dns-records-parity.ts`, and
    `ghostTargets` in `checks/live-shared.ts` (empty once no Ghost web record is kept).
  - `docs/launch.md`, and baseline slimming.
- **The cutover plan's "Where things stand (2026-10-09)" section** is stale (pre-switch). It is
  left alone, because the file retires in stage 6 and the stage boxes carry the current state.
- **Issue #93's mail half for `mail.`:** `mail.` no longer resolves or sends, so it gets no
  `_dmarc`. The apex record's default subdomain policy covers it.

## Constitution Check

- **I. Test-First:** W1 and W4 add the failing cases first: HSTS `includeSubDomains`, the Ghost
  web records dropped with reasons, and DMARC and CAA kept. W2 and W5 turn them green. The removed
  assertions are covered by the mapping under each work item.
- **II. Automated Release Gate:** no check is skipped or weakened. The headers test still asserts
  noindex on every host rule other than the live domain, and HSTS gains a stronger assertion. The
  full gate runs before the PR.
- **III. Human Review for Major Changes:** **fires** on "changes CI, deployment or infrastructure
  configuration". `public/_headers` is the response-header configuration the Worker's static
  assets serve, and the Security Baseline names it as the header contract. Issue #93 also says
  "DNS and header changes are infrastructure, so major", and the precedents agree: the
  `svg-csp-link-schema` and `cache-fingerprinted-assets` chores both classified a `_headers` edit
  as major. No other criterion fires: no dependency, service, contact-data, design, layout,
  navigation, cost or constitution change. The DNS records were changed by Don in the dashboard;
  the baseline only records them.
  **Verdict: major.** The PR body flags it with that criterion and asks Don to look at the
  preview's HSTS header. Auto-merge is allowed under 2.3.0, because the merge still waits for
  Don's approval and a green gate, and there is no `[PREVIEW-CHECK]` (acceptance 8 is
  agent-checkable).
- **IV. First-Party Before Custom:** uses Cloudflare's own `_headers` file for static assets and
  Cloudflare DMARC Management, with no custom code. No Astro choice is made, so no Astro docs
  citation is needed and the Astro Docs MCP is not consulted.
- **V. Static by Default:** unchanged; no endpoint or page rendering changes.
- **VI. Content as Files:** unchanged; no content changes.
- **VII. Private Data:** unchanged. DMARC aggregate reports go to Cloudflare's report address and
  hold no visitor data. The `rua` mailbox id is a public DNS value, not a secret.
- **VIII. Cloudflare Best Practices:** favoured. HSTS covering subdomains and DMARC/CAA records
  follow Cloudflare's and MDN's guidance (Docs citations), and the header stays in the committed
  `_headers` file, not a dashboard setting.
- **IX. Cost Ceiling:** unchanged. DMARC Management is free, and nothing new recurs.
- **X. Accessible, Fast and Private:** unchanged; no page output changes and no new script.
- **XI. Spec Kit Workflow:** one chore on its own `chore/<slug>` branch via `/chore`. Open PR #132
  edits `docs/cutover-plan.md` stage 4 (lines ~116–124) and `docs/setup.md`. Its hunks do not
  overlap this chore's (stage 5, the DNSSEC note), so a merge from `origin/main` resolves them;
  see Risks.
- **Security Baseline:** strengthened. The header contract keeps every header, and HSTS widens to
  subdomains.

## Work items

### [x] W1 — Headers test: HSTS covers subdomains; review-host rule gone (test first)

- **Files:** `tests/unit/site/headers.test.ts`.
- **What:**
  - Add a case: "HSTS on /* covers subdomains (#93)". It checks that `starRule().get("strict-transport-security")`
    has a directive equal to `includeSubDomains`, ignoring case and after splitting on `;`.
    Comment: this is a security invariant (#93, FR-010d reopened), like "no `'unsafe-inline'`",
    not a mirror of the value. `max-age` and `preload` are not asserted.
  - Delete the `REVIEW_HOST_RULE` constant (line 16) and `expect(targets).toContain(REVIEW_HOST_RULE)`
    (line 61).
  - Run the file and record the new case failing.
- **Coverage mapping for the removed assertion:** it pinned a rule that W2 deletes on purpose,
  because its host no longer resolves. Two tests still guard the noindex invariant: "sets
  X-Robots-Tag: noindex on every host rule other than the live domain" loops over every
  `https://` rule, and "does not set X-Robots-Tag on /*" stays as it is.
- **Test:** new-first.
- **Layer:** unit. Parsing `public/_headers` is the cheapest layer that observes the rule.

### [x] W2 — `public/_headers`

- **Files:** `public/_headers`.
- **What:** line 8 becomes `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
  Delete lines 21–23 (the blank line, `https://new.doncoleman.ca/*` and its `X-Robots-Tag`), so
  the file ends after the `workers.dev` block.
- **Test:** existing (W1 turns green).
- **Layer:** unit.

### [x] W3 — Build test: copied `_headers` keeps the workers.dev noindex rule

- **Files:** `tests/build/indexing.test.ts` (lines ~227–233).
- **What:** delete the `new.doncoleman.ca` regexp (line 232). Retitle "copies _headers with the
  two host noindex rules and no site-wide noindex" to "copies _headers with the workers.dev
  noindex rule and no site-wide noindex". Leave the `launchConfig.reviewHost` test (lines
  ~237–240); `setup/config.json` keeps `reviewHost` until stage 6.
- **Coverage mapping:** the removed regexp pinned the deleted rule (see W1). This build test
  stays a second layer for the copy into `dist/`. Its reason is unchanged: only the real build
  shows that `public/_headers` reaches the output.
- **Test:** existing (edited; it passes after W2 and would fail with W2 alone).
- **Layer:** build (second layer for the copy only, reason above).

### [x] W4 — Baseline tests: Ghost web records dropped, DMARC and CAA kept (test first)

- **Files:** `tests/unit/setup/dns-baseline-schema.test.ts` (the "launch subsets derivable by
  name and type (T007)" block, lines ~62–86) and `tests/unit/setup/launch-doc.test.ts` (lines
  ~132–134 and ~237–239).
- **What:**
  - `dns-baseline-schema.test.ts`:
    - The Ghost web case selects A, AAAA and CNAME records on the apex or `www` **by type and
      name only** (no `decision` filter). It still expects exactly the two records
      (`A doncoleman.ca 49.13.201.194`, `CNAME www.doncoleman.ca drift-and-convergence.mymagic.page`).
      It adds that every one has `decision: "drop"` and a non-empty `reason`. Retitle it "has
      the retired Ghost web records: A, AAAA and CNAME on the apex or www, all dropped with a
      reason".
    - New case: "keeps the DMARC and CAA records, so dns-records-parity guards them (#93)". The
      baseline has a `keep` TXT on `_dmarc.doncoleman.ca` whose content starts with `v=DMARC1`,
      and at least one `keep` CAA record on the apex whose content matches `/^\d+ issue "/`. These
      are invariants; the authority list is not pinned.
    - Run both and record them failing.
    - The mail case keeps its `decision === "keep"` filter. The new `_dmarc` TXT joins it, which
      its assertions allow.
  - `launch-doc.test.ts`: in the `web` filter (line ~133) and the Part E filter (line ~238),
    remove `r.decision === "keep" &&` and `x.decision === "keep" &&`. The selection stays the
    Ghost web records by type and name. Then `web.length` stays 2, the L8 table comparison
    stays live, and the Part E content check does not become an empty loop. These cases pass
    before and after W5.
- **Coverage mapping:** no assertion is removed. The `keep` filters are widened, so the existing
  checks keep their subject after the decisions flip.
- **Test:** new-first (`dns-baseline-schema.test.ts`). The `launch-doc.test.ts` filter edit is
  existing; it keeps the tests from going vacuous.
- **Layer:** unit (the real baseline file parsed; the docs read as text).

### [x] W5 — Update the baseline

- **Files:** `setup/dns-baseline.json`.
- **What:**
  - `A doncoleman.ca 49.13.201.194`: `decision: "drop"`, reason
    `"Ghost web hosting retired: replaced at the switch by the dcc-web Worker and deleted from Cloudflare; Ghost cancelled (Don, 2026-10-09)"`.
  - `CNAME www.doncoleman.ca drift-and-convergence.mymagic.page`: `decision: "drop"`, same reason.
  - Add the `_dmarc` TXT after the apex TXT records. Add the four CAA records after it, in the
    order letsencrypt.org, pki.goog, sectigo.com, ssl.com. Fields are as in acceptance 3.
  - Run `pnpm setup:check --item dns-records-parity`, `--item mail-records` and
    `--item live-domain-ghost`. If a new record shows "TTL differs", set its `ttl` to the
    Cloudflare value (`1` means Auto) and run again.
- **Test:** existing. W4 turns green, and the real-baseline schema parse in
  `dns-baseline-schema.test.ts` still passes. It enforces the rule that a drop needs a reason.
  The live confirmation is acceptance 4, an operational check, not a test layer.
- **Layer:** unit.

### [x] W6 — `mail-records.ts` header comment

- **Files:** `scripts/setup-check/checks/mail-records.ts` (lines ~5–7).
- **What:** the sentence "…so the item keeps passing once the Mailgun records move to `drop`
  when Ghost is retired" becomes present tense, for example "…so the item keeps passing for the
  retired Mailgun records, which the baseline marks `drop`". Comment only; no code change.
- **Test:** no behaviour: n/a.
- **Layer:** n/a.

### [x] W7 — Specs and docs

- **Files and what:**
  - `docs/setup.md` (lines ~151–159, "Before the switch: DNSSEC"). Keep the heading:
    `.claude/skills/setup-walkthrough/SKILL.md:50` cites it. Replace the last sentence
    ("Cloudflare DNSSEC can be turned on later, from the Cloudflare dashboard, once the zone is
    active.") with one sentence: DNSSEC is now on in Cloudflare, the zone is signed, and the
    registry holds its DS record (`dig +short DS doncoleman.ca` returns a key-tag 2371,
    algorithm 13 record).
  - `docs/design-source.md` ("How to get Flux", after the clone command paragraph). Add one
    sentence: Flux is being retired with Ghost (`docs/launch.md` T8). Archiving keeps the
    repository readable, so the same command still clones it. It must not say Flux is
    archived, because T8 is not done. The test-pinned phrases stay: the clone command,
    "read-only", "gitignored" and "never imported".
  - `specs/011-launch/spec.md` FR-010d (lines ~340–342). Keep the HTTPS-only requirement. The
    strict-transport sentence becomes: after Ghost was retired (2026-10-09, #93) the policy is
    one year **with** `includeSubDomains` and no preload list (preload is decided separately). Add a
    short note that the original bare-domain-only policy held while rollback to Ghost was
    possible.
  - `specs/002-site-foundation/research.md` (lines ~228–229). Leave the dated rationale as it
    is and add one line after the bullet: "Superseded 2026-10-09 (#93): Ghost retired; HSTS now
    has `includeSubDomains`, still no preload."
  - `specs/011-launch/contracts/indexing-and-origin.md` (lines ~38–62). Leave the dated
    contract block. The closing sentence "The `new.doncoleman.ca` rule is deleted in the
    retirement follow-up pull request." gains: "Done in #93's chore (2026-10-09), which also
    added `includeSubDomains` to HSTS." The `headers.test.ts` header cites this contract, so the
    note keeps the two consistent.
  - `docs/cutover-plan.md` stage 5:
    - Under the heading, note that Don started stage 5 on 2026-10-09, before the 14-day mark.
    - Tick T1.
    - Tick T2 as **waived by Don, 2026-10-09 (no Ghost export)**.
    - Tick T3.
    - Tick T4, replacing the "sending domain and keys remain" sentence with: the sending domain
      and keys deleted and the mail test passed on 2026-10-09.
    - Tick T5 to T7 with: no Supabase export needed; the Flux Supabase project was already gone;
      no Supabase secrets left.
    - Tick the #93 manual half with: only the apex and `www` resolve; DMARC via Cloudflare DMARC
      Management at `p=none`; four CAA `issue` records; DNSSEC already on.
    - Tick the T9 + #93 repo half and replace its "says Flux is archived" with "notes Flux is
      being retired (archive pending T8)". The optional Custom Domain stays out.
    - T8 and DMARC tightening stay unticked.
  - `specs/011-launch/tasks.md` (lines ~194–199):
    - Tick T099 with "(T2 export waived by Don, 2026-10-09)".
    - Tick T100 and T101.
    - Tick T102 with "(no export needed; the Flux Supabase project was already gone, 2026-10-09)".
    - Tick T104 with "(Ghost web records dropped here; Mailgun records dropped earlier; Custom
      Domain not moved)".
    - T103 stays open.
- **Test:** no behaviour: n/a (wording). `design-source.test.ts`, `docs-content-structure.test.ts`,
  `docs-dns.test.ts` and `launch-doc.test.ts` run in the gate and guard structure.
- **Layer:** n/a.

Work-item count: **7**.

## Docs citations

- **HSTS `includeSubDomains`:**
  - MDN, `Strict-Transport-Security`
    (developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security):
    the directive applies the policy to every subdomain. Preload needs a separate opt-in and
    is hard to undo.
  - RFC 6797 §6.1.2.
  - Cloudflare, "HTTP Strict Transport Security (HSTS)"
    (developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/):
    warns that every subdomain must serve HTTPS before `includeSubDomains` is enabled. Don's #93
    manual check found that only the apex and `www` resolve, and both serve HTTPS (`http://` to
    `https://` is a 301; apex 200). The DKIM CNAME and mail records are not browser-facing.
- **Cloudflare `_headers` for Workers static assets**
  (developers.cloudflare.com/workers/static-assets/headers/): the file format, absolute-URL host
  rules such as the remaining `https://:worker.:subdomain.workers.dev/*`, and `/*` rules. The
  change uses the existing syntax only.
- **DMARC and CAA:**
  - Cloudflare DMARC Management (developers.cloudflare.com/dmarc-management/) created the
    `_dmarc` record and its `rua` address.
  - Cloudflare "CAA records" (developers.cloudflare.com/ssl/edge-certificates/caa-records/):
    Cloudflare adds the CAA records for its own certificate authorities to public answers. That
    is why `dig CAA` shows more authorities, and `issuewild`, than the zone holds. The baseline
    records only the zone's own four, which is what `dns-records-parity` compares through the
    Cloudflare API.

## Risks

- **`includeSubDomains` is sticky for a year.** A future subdomain that must serve plain HTTP
  would fail in browsers that saw the header. Today only the apex and `www` resolve. Every
  Cloudflare-proxied hostname gets HTTPS from Universal SSL, and the `.dev` TLD of the preview
  hosts is already HSTS-preloaded. No `preload` keeps the change reversible: shortening
  `max-age` takes effect at the next visit.
- **Live check depends on the zone and resolvers.** If a resolver still caches something,
  `mail-records` may be `pending`; repeat later. If Don edits DMARC from the dashboard (for
  example to tighten it), `dns-records-parity` will flag the content change. That is intended:
  the baseline changes with it in the DMARC-tightening chore.
- **Cloudflare DMARC Management may rewrite the record.** If it changes the `rua` string or the
  TTL, parity reports a difference. A fresh `--item dns-records-parity` run shows the exact value
  to record.
- **Idle Ghost branches.** With no kept Ghost web record, `ghostTargets` in `live-shared.ts`
  is empty and "replaced at launch" never fires. Nothing behaves differently from what stage 5
  intends, because Ghost is gone. Removal is stage 6.
- **Early stage 5.** `docs/launch.md` T9 says "None of these edits are made before Part F". Part F
  has now happened, on Don's early start date, which the cutover plan records. `launch.md` is
  not edited.
- **Concurrent PR #132** edits `docs/cutover-plan.md` stage 4 and `docs/setup.md` (new section
  near line 13 and at the end). The hunks are separate from this chore's. Merge `origin/main`
  before the gate whichever lands first, and re-check the stage 5 lines.
- **Major change.** The PR body must flag Principle III ("changes CI, deployment or
  infrastructure configuration", `public/_headers`) and name the preview HSTS check.
