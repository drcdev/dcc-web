# Chore plan: dns-baseline-post-switch

Branch: `chore/dns-baseline-post-switch`, from `main` at 7212795 (after #128 merged).
No GitHub issue (ad-hoc chore). Related context: `docs/cutover-plan.md` stages 4, 5 and 6 (T4,
the T9 + #93 repo-half line, the stage 6 setup-check line), issue #93.

Decisions already made by Don (2026-10-09): the Mailgun DNS deletion was intentional and stays;
the Google Search Console TXT stays and is recorded in the baseline as `keep`; this is done now as
a small chore rather than waiting for the T9 chore. Later the same day Don added: stage 6 of the
cutover plan gains an item to slim the DNS baseline to a short must-exist list once Ghost is gone,
with `dns-records-parity` and `mail-records` still guarding it.

## Goal

On 2026-10-09, after the domain switch, Don changed two things in the Cloudflare zone by hand: he
deleted the five Mailgun records on `mail.doncoleman.ca` (Ghost's newsletter sending, retired
early), and he added an apex TXT record for Google Search Console verification. The committed
baseline `setup/dns-baseline.json` still marks the Mailgun records `keep` and does not know the
Google TXT, so the setup check reports `dns-records-parity` (item 4) and `mail-records` (item 31)
as missing, which in turn holds `dns-nameservers` (item 5) at missing. This chore brings the
baseline in line with the zone: the five Mailgun records become `drop` with a dated reason, and
the Google TXT is added as `keep` with a new `source: "cloudflare"`, which the baseline schema and
type must first accept. It records in the cutover plan that T4's DNS half is already done, takes
the Mailgun drop off the pending T9 line, and adds a stage 6 item that slims the baseline to a
must-exist list once Ghost is gone. Nothing on the site changes; only setup-check data, its
schema and type, one schema test and docs change.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Schema test seen failing first.** The new `dnsBaselineSchema` case accepting
   `source: "cloudflare"` in `tests/unit/setup/schemas.test.ts` (W1) fails before W2 and passes
   after. The implement summary records the red run. (The companion "rejects an unknown source"
   case passes before and after; it pins the enum so the widening cannot become `z.string()`.)
2. **Schema and type agree.** `scripts/setup-check/schemas.ts` uses
   `z.enum(["squarespace", "cloudflare"])` for `source`, and `DnsBaselineRecord.source` in
   `scripts/setup-check/types.ts` is `"squarespace" | "cloudflare"`. The gate's typecheck is green.
3. **Baseline content.** `setup/dns-baseline.json` has 14 records: the five Mailgun records
   (`MX mail.` x2, `TXT mail.` SPF, `TXT mta._domainkey.mail.`, `CNAME email.mail.`) have
   `decision: "drop"` and a non-empty dated reason; the apex TXT
   `google-site-verification=Fm2OA7X4UZwI7o4GLpWhUy23kctO23d63m8F8dSxr6g` is present with
   `decision: "keep"`, `source: "cloudflare"`, `priority: null`, `reason: null`, `ttl: 1`. Every
   other record is unchanged (`git diff main -- setup/dns-baseline.json` shows only those six
   records).
4. **Setup check.** `pnpm setup:check` (run with the local Cloudflare credentials; the agent never
   prints them) reports `dns-records-parity` (4), `dns-nameservers` (5) and `mail-records` (31)
   complete, and the summary reads **31 of 31** complete. The implement summary records the run.
5. **Unit tests green:** `tests/unit/setup/schemas.test.ts`,
   `tests/unit/setup/dns-baseline-schema.test.ts` and `tests/unit/setup/launch-doc.test.ts` pass;
   so do `tests/unit/setup-check/checks/{dns-records-parity,mail-records,dns-nameservers,live-domain-ghost,web-analytics}.test.ts`,
   `dns-snapshot.test.ts` and `next-action.test.ts`, with no edits other than W1.
6. **Cutover plan stage 6.** `docs/cutover-plan.md` stage 6 has a new unticked item for slimming
   the baseline (W4), and its "Setup check" line no longer says to keep the baseline unchanged
   and no longer lists `mail-records` for removal. Docs only; no stage 6 work is done here.
7. **Scope of the diff:** `git diff --name-only main` lists only `setup/dns-baseline.json`,
   `scripts/setup-check/schemas.ts`, `scripts/setup-check/types.ts`,
   `tests/unit/setup/schemas.test.ts`, `docs/cutover-plan.md` (T4, T9 + #93 line, stage 6),
   `docs/setup.md` and `.specify/chores/dns-baseline-post-switch/**`. Nothing under `src/`,
   `public/`, `.github/`, `.claude/`, `wrangler.jsonc` or `package.json`.
8. Full `pnpm run verify` is green (locally, or in CI per the usual load caveat).

**Before measurement** (2026-10-10 03:07 UTC, at 7212795, `pnpm setup:check`):

- `dns-records-parity` (4): missing, 5 differences, every one a Mailgun `keep` record "not found
  in Cloudflare".
- `mail-records` (31): missing; apex TXT expected 2 got 3 (the extra is
  `google-site-verification=…`), and the `mail.*` Mailgun groups return nothing.
- `dns-nameservers` (5): missing, only because item 4 is incomplete.
- Summary: **28 of 31** complete.

**After (target):** items 4, 5 and 31 complete; **31 of 31**.

## Scope

**In:**

- `scripts/setup-check/schemas.ts`: `source` becomes `z.enum(["squarespace", "cloudflare"])`.
- `scripts/setup-check/types.ts`: `DnsBaselineRecord.source` becomes
  `"squarespace" | "cloudflare"`.
- `tests/unit/setup/schemas.test.ts`: two new `dnsBaselineSchema` cases (accept `cloudflare`,
  reject an unknown source such as `"registrar"`), neutral example data.
- `setup/dns-baseline.json`: the five Mailgun records to `drop`; the Google TXT added as `keep`,
  placed after the existing apex TXT records.
- `docs/cutover-plan.md`:
  - T4 records that its DNS half was done early on 2026-10-09 and the baseline now drops those
    records, with the Mailgun sending domain and API keys still to remove at T4 (box stays
    unticked).
  - The T9 + #93 line no longer lists the five Mailgun records as a pending drop (the two Ghost
    web records, DMARC and CAA stay).
  - Stage 6 gains a new unticked item: slim `setup/dns-baseline.json` to a short list of records
    that must exist (iCloud mail MX, SPF and DKIM; the Google verification TXT; the DMARC and CAA
    records #93 adds), retiring its Squarespace-inventory and rollback roles (the Ghost web
    records, `originalNameservers`, the `source` field and the drop records) once Ghost is gone;
    `dns-records-parity` and `mail-records` keep guarding those records.
  - The stage 6 "Setup check" line: "Keep `dns-records-parity` and the baseline (#93 relies on
    them)" changes so it no longer says to keep the baseline unchanged (it now points at the new
    slimming item and keeps `dns-records-parity` and `mail-records`), and `mail-records` comes off
    that line's removal list, because Don's decision keeps it as a guard.
- `docs/setup.md`:
  - item 4 ("Squarespace baseline" text near lines 104–116): one sentence saying a record added
    in Cloudflare after the move carries `source: "cloudflare"` and records Cloudflare's TTL
    (`1`, the API's value for Auto). Judgment: the text says to list "every record from
    Squarespace's DNS screen", so without this sentence a reader would not know how a
    Cloudflare-only record belongs in the file, and the schema now permits it.
  - item 31: "(after Ghost is retired)" becomes "(once Mailgun sending is retired)", because the
    drop now happened before Ghost's retirement and the old wording is no longer true.

**Out:**

- The two Ghost web records (A apex, CNAME `www`): they stay `keep` for rollback until T3; their
  drop is part of the T9 + #93 chore.
- The rest of T9 / #93 (DMARC and CAA records, `_headers` noindex and HSTS changes, DNSSEC text,
  FR-010d, `docs/design-source.md`, Custom Domain in `wrangler.jsonc`): its own chore.
- Doing any stage 6 work (slimming the baseline, removing fields or checks): only the plan item is
  written here.
- `docs/launch.md` T4 and T9: T4's instructions still read correctly (the records are gone; the
  Mailgun sending domain and keys remain), and lines ~589 and ~699 already say the baseline drops
  the Mailgun records. `tests/unit/setup/launch-doc.test.ts` guards the T4 wording, so it is left
  alone.
- Any check logic in `scripts/setup-check/checks/`: no reader branches on `source`.
- Any change in the Cloudflare zone or Mailgun dashboard.

**Follow-ups for the PR body:**

- T4 at stage 5 still removes the Mailgun sending domain and its API keys and runs the mail test;
  only its DNS half is done.
- The rest of T9 / #93 stays for its own chore (Ghost web records to `drop`, DMARC and CAA as
  `keep`, `_headers`, DNSSEC text, FR-010d, design-source).
- Stage 6 (issue #101) now carries the baseline-slimming item; `mail-records` is no longer on its
  removal list.
- Serving `www` as the main host is issue #129, not touched here.

## Constitution Check

- **I. Test-First:** W1 adds the schema cases and runs the `cloudflare` case red before W2 widens
  the schema; the baseline edit (W3) is then covered by the existing real-baseline parse test.
- **II. Automated Release Gate:** no check is skipped, disabled or weakened. The schema widens by
  one named value only, and the drop-needs-reason rule is unchanged and exercised by the five new
  drops. The full gate runs before the PR.
- **III. Human Review for Major Changes:** no criterion fires. No dependency, integration or
  service is added or removed (the Mailgun DNS deletion already happened in the dashboard by
  Don's decision; this only records it). No contact data, design system, layout, navigation,
  cost or constitution change. The files touched are setup-tooling data and its schema/type
  (`setup/dns-baseline.json`, `scripts/setup-check/`) and docs, not CI, deployment or
  infrastructure configuration: no workflow, Wrangler config, ruleset or dependency changes.
  Verdict: **not major**; auto-merge applies.
- **IV. First-Party Before Custom:** no new tool usage. `z.enum` is already used in the same
  schema file; no Astro or Cloudflare API is touched.
- **V. Static by Default:** unchanged; nothing ships.
- **VI. Content as Files:** unchanged; the baseline stays a committed, schema-validated file.
- **VII. Private Data:** unchanged. DNS records are public data; the verification token is a
  public TXT value, not a secret.
- **VIII. Cloudflare Best Practices:** unchanged; no Worker, D1 or Cron change.
- **IX. Cost Ceiling:** unchanged; no recurring cost.
- **X. Accessible, Fast and Private:** unchanged; no page output changes.
- **XI. Spec Kit Workflow:** one chore on its own `chore/<slug>` branch via `/chore`.
- **Security Baseline:** unchanged; `_headers`, Dependabot and the ruleset are untouched.

## Work items

### [x] W1 — Schema cases for `source` (test first)

- **Files:** `tests/unit/setup/schemas.test.ts` (the `dnsBaselineSchema` describe block).
- **What:** add "accepts a record added in Cloudflare (`source: "cloudflare"`)" and "rejects an
  unknown source", both spreading `validRecord` with neutral example data. Run the file and record
  the accept case failing.
- **Test:** new-first.
- **Layer:** unit (schema tests are unit tests; the cheapest layer that observes parsing).

### [x] W2 — Widen `source` in schema and type

- **Files:** `scripts/setup-check/schemas.ts` (line ~37), `scripts/setup-check/types.ts`
  (line ~118).
- **What:** `z.literal("squarespace")` → `z.enum(["squarespace", "cloudflare"])`;
  `source: "squarespace"` → `source: "squarespace" | "cloudflare"`. Schema, type and W1 change
  together.
- **Test:** existing (W1 turns green; typecheck covers the type).
- **Layer:** unit.

### [x] W3 — Update the baseline

- **Files:** `setup/dns-baseline.json`.
- **What:**
  - The five Mailgun records (`MX mail.doncoleman.ca mxa.eu.mailgun.org`,
    `MX mail.doncoleman.ca mxb.eu.mailgun.org`, `TXT mail.doncoleman.ca "v=spf1 include:mailgun.org ~all"`,
    `TXT mta._domainkey.mail.doncoleman.ca`, `CNAME email.mail.doncoleman.ca eu.mailgun.org`):
    `decision: "drop"`, reason
    `"Ghost newsletter sending retired early; deleted from Cloudflare after the switch (Don, 2026-10-09)"`.
    Other fields unchanged.
  - New record after the apex TXT records: `type: "TXT"`, `name: "doncoleman.ca"`,
    `content: "google-site-verification=Fm2OA7X4UZwI7o4GLpWhUy23kctO23d63m8F8dSxr6g"`,
    `priority: null`, `ttl: 1`, `source: "cloudflare"`, `decision: "keep"`, `reason: null`.
  - **TTL judgment:** `1` is the value Cloudflare's API returns for a record left on "Auto"
    (300 s for DNS-only records). `dns-records-parity` compares the baseline TTL with the API
    value and already renders `1` as "auto", so `1` records exactly what the zone holds and adds
    no informational TTL note; it is positive, so the schema accepts it. `300` was considered
    (the effective TTL) but would show a spurious "TTL differs" note on every run.
- **Test:** existing — `tests/unit/setup/dns-baseline-schema.test.ts` parses the real baseline
  (kept Ghost web records exactly A apex + CNAME `www`; kept mail non-empty with iCloud MX) and
  `tests/unit/setup/launch-doc.test.ts` reads it; both must stay green. Live confirmation is
  acceptance 4 (`pnpm setup:check`), an operational check, not a test layer.
- **Layer:** unit (schema parse of the real file).

### W4 — Docs

- **Files:** `docs/cutover-plan.md` (T4 line ~140, T9 + #93 line ~148, stage 6 "Setup check"
  line ~164–169 and a new stage 6 item), `docs/setup.md` (item 4 text near lines 104–116; item
  31 "What it is for").
- **What:** as listed under Scope → In. T4's box stays unticked; the T9 line keeps the Ghost web
  records, DMARC and CAA and drops only the Mailgun mention. The new stage 6 item is unticked and
  marked *new* like the other 2026-10-09 additions; the "Setup check" line keeps
  `dns-records-parity` and `mail-records` and refers to the slimming item instead of keeping the
  baseline as it is.
- **Test:** no behaviour: n/a (documentation wording only; `tests/unit/setup/docs-structure.test.ts`
  and `launch-doc.test.ts` still run in the gate and guard structure).
- **Layer:** n/a.

Work-item count: **4**.

## Docs citations

No tool usage changes. Zod `z.enum` is already used in `scripts/setup-check/schemas.ts` (e.g.
`dnsRecordTypeSchema`). The TTL choice relies on Cloudflare's documented behaviour that "Auto" TTL
is 300 seconds for unproxied records and is represented as `ttl: 1` in the DNS records API
(developers.cloudflare.com/dns/manage-dns-records/reference/ttl/), which the existing
`dns-records-parity.ts` already encodes (`cf.ttl === 1 ? "auto"`).

## Risks

- **Live check depends on the zone and resolvers.** Acceptance 4 needs Cloudflare credentials and
  public DNS. If a resolver still caches a deleted Mailgun record, the drop groups are info-only,
  so this cannot block; if the Google TXT has not propagated to one resolver, `mail-records` is
  `pending`, and the run is repeated later.
- **Apex TXT grouping.** `mail-records` compares the whole apex TXT group (now SPF, `apple-domain`
  and Google) against both resolvers; any further hand-added apex TXT will trip it again. That is
  intended: such records belong in the baseline.
- **`launch.md` says T9 edits are not made before Part F.** This chore makes one of them early by
  Don's explicit decision; the cutover plan records why. `launch.md` itself is left unchanged.
- **Stage 6 wording drift.** Taking `mail-records` off the stage 6 removal list changes issue
  #101's scope as written in the plan; the PR body names it so #101 can be updated to match.
- **`source` semantics.** Widening to an enum keeps the field closed; nothing reads `source`, so
  no check behaviour changes. Stage 6 later removes the field with the slimming item.
- **Token in the repo.** The `google-site-verification` value is public in DNS and not a secret;
  committing it is consistent with the other public TXT values in the baseline.
