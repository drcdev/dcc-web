# Implementation Plan: Contact form sends email instead of storing messages

**Branch**: `033-contact-form-email` | **Date**: 2026-10-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/033-contact-form-email/spec.md` (GitHub issue #145)

## Summary

Each accepted contact submission is sent as one plain-text email to a single fixed, verified
address (`contact@doncoleman.ca`) through the Worker's Cloudflare `send_email` binding, using the
structured `send()` builder API, from `contact-form@mail.doncoleman.ca` with the visitor as
Reply-To. Email Routing is turned on for the `mail.doncoleman.ca` subdomain only, so the apex
keeps its iCloud mail records. The site stops storing anything: a migration drops the `messages`
table, and the retrieval endpoint, its bearer token, the IP-fingerprint salt, the per-sender rate
limit, the retention job and its Cron Trigger are removed. The visitor's form is unchanged except
for the privacy wording. The slice starts by amending the constitution (I, V, VII, VIII,
Technology Constraints, Security Baseline), as constitution 4.0.0 on top of main's 3.0.0
(issue #143). The PR follows the single flow: auto-merge is armed, and Don approves only after the
pre-approval steps listed in the PR body are done.

## Technical Context

**Language/Version**: TypeScript (strict) on Node 24 (`.nvmrc`) for build and tests; Worker on
the Cloudflare Workers runtime, `compatibility_date` 2026-09-28.

**Primary Dependencies**: Astro 7.3.5 (static output, unchanged); wrangler 4.149.0; Cloudflare
`send_email` binding (Email Routing / Email Service, first-party, no package); Cloudflare Turnstile
(unchanged); `cloudflare` SDK 7.2.0 (setup check only). **No new npm dependency.**

**Storage**: none for contact data. D1 (`dcc-web`, `dcc-web-preview`) stays for the questions
feature only; migration `0003_drop_messages.sql` drops `messages`.

**Testing**: Vitest 5 (unit, component, build projects); Vitest 4 with
`@cloudflare/vitest-plugin` for the Worker (`worker/`), with an injected fake `CONTACT_EMAIL`
binding; Playwright E2E against `wrangler dev` (local `send_email` simulation, no real send);
axe a11y and visual projects unchanged.

**Target Platform**: Cloudflare Workers (static assets + `/api/*` Worker), production `dcc-web`
and preview `dcc-web-preview`.

**Project Type**: static web site with one Worker API.

**Performance Goals**: contact page unchanged and within the existing budget (FR-008); no new
client script. The send adds one binding call per accepted submission.

**Constraints**: Workers Free plan; Email Routing on a subdomain only; one fixed destination;
nothing about a submission or sender stored or logged; Turnstile + honeypot + same-origin as the
only spam controls.

**Scale/Scope**: a handful of messages a week. Touches about 45 files, mostly removals
(see Project Structure).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design (below).*

The spec conflicts with the current text of I, V, VII, VIII, Technology Constraints and the
Security Baseline. Per the spec and the constitution's Governance section, those conflicts are resolved by
amending the constitution **as the first task of this slice** through the `speckit-constitution`
skill, in the same pull request, before any other implementation task. The check below is against
the amended text, with the current-text conflicts listed so the reviewer sees each one.

| Principle | Status | How this plan complies |
|---|---|---|
| I. Test-First | Pass | Every task starts with failing tests at one named layer (see "Test placement"). Removed behaviour gets tests that prove absence (404s, no table, no cron, no secrets required). Amendment adjusts the layer wording "integration tests … against a real local database" to "against the local Workers runtime, with a real local database where the endpoint uses one", because the contact API no longer uses D1. |
| II. Automated Release Gate | Pass | `pnpm run verify` and CI `verify` unchanged; nothing skipped. Migration and config applied by the existing Workers Builds deploy scripts. |
| III. Human Review of Every Change | Pass | Single PR flow (issue #143 removed the major-change classification): opened from `drc-agents`, auto-merge armed after the final push, Don's approval is the hold. The PR body lists the `[PREVIEW-CHECK]` items and the pre-approval collection step (FR-017, FR-020) and states that it amends the constitution. |
| IV. First-Party Before Custom | Pass | Cloudflare `send_email` binding with the structured builder (not a MIME library or a third-party email API, R1); binding-level `destination_address` + `allowed_sender_addresses` restriction (R2); Email Routing for sender authentication (R3); D1 migrations for the drop (R8); wrangler `crons: []` to remove the cron (R9). Astro: no Astro capability changes; Astro Actions/server endpoints were considered and rejected because they need on-demand rendering (docs.astro.build/en/guides/actions/, /en/guides/on-demand-rendering/). Custom code is limited to the email text builder and header sanitising, which no first-party option provides. |
| V. Static by Default | Pass after amendment | Pages stay prerendered; the contact page and form island are unchanged apart from copy and one dead error branch. **Conflict with current text**: the Contact API entry says it "stores", "lets Don retrieve" and "rate-limits each sender". Amended to: receives submissions and emails each accepted one to one fixed verified address; stores nothing; verifies Turnstile. The endpoint list shrinks (retrieval endpoint removed). |
| VI. Content as Files | Pass | Privacy policy, contact and technology pages stay MDX in the repo; no CMS. |
| VII. Private Data: Minimal and Protected | Pass after amendment | No field is written to D1, a file or a log; no IP or fingerprint is computed. Logs carry outcome + error kind only. Destination is configuration, not data. **Conflict with current text**: "stored only in D1", "salted hash of IP", "preview messages stored separately", "deleted automatically after a retention period". Amended to the email model: not stored by the site; emailed to one fixed destination; no sender data stored; preview emails marked; Don keeps emails only as long as needed and deletes on request. The secrets bullet stays. |
| VIII. Cloudflare Best Practices | Pass after amendment | Binding, vars, `crons: []` and the migration are committed and CI-applied. HTTPS-only and same-origin checks unchanged. Email Routing setup (subdomain routing, destination verification) is a one-time dashboard action by Don, like the Turnstile widget today; the check verifies it. **Conflict with current text**: names message retrieval as the bearer-token example and says the contact API rate-limits submissions; list of products omits Email Routing. Amended accordingly. |
| IX. Cost Ceiling | Pass | Expected change **$0/month**: Email Routing is free; sends to verified destinations are free on all plans and outside the sending quota (R12). D1 use falls. Fallback 2 in R3 (separate domain, ≈ $1/month) would need a recorded decision first. |
| X. Accessible, Fast and Private | Pass | Form markup, focus handling and budget unchanged; no new third-party script (email is server-side). Visual baselines unaffected unless the contact note's wording changes line wrapping (checked by the visual project; refresh via the documented route if so). |
| XI. Spec Kit Workflow | Pass | Spec Kit branch `033-contact-form-email`, one feature, own worktree. Files shared with other open branches (wrangler.jsonc, setup items) are merged from `main` before the gate. |
| Technology Constraints | Pass after amendment | **Conflict**: "Contact API … with Cloudflare D1 for storage and a Cron Trigger for retention"; no email service listed. Amended: Contact API in the Worker with Cloudflare Email Routing's `send_email` binding to one verified destination from a sending subdomain; no storage, no Cron Trigger. |
| Security Baseline | Pass after amendment | **Conflict**: "the contact API's per-sender rate limit". Amended to "the contact API's Turnstile check, hidden trap field and same-origin check". The "untrusted data" bullet stays and now also covers contact emails read by any assistant. |
| Development Workflow | Pass | Constitution Check present; Astro decisions cite docs; tests before code; one primary layer per behaviour. |

**Gate result**: pass, conditional on task 1 (the amendment) landing first in the same PR. No
unjustified violations; Complexity Tracking is empty.

### Constitution amendment (task 1, via `speckit-constitution`; not performed in this phase)

Recommended bump: **MAJOR**, because Principle VII's rules and V's Contact API entry are
redefined (guarantees removed: D1 storage location, salted IP hash, preview store separation,
automatic retention). Made as **3.0.0 → 4.0.0**: main's issue #143 amendment had already taken
2.3.1 → 3.0.0, and this amendment sits on top of it. Changes:

- **I**: integration-test layer wording as in the table above (PATCH-level in isolation).
- **V**: Contact API entry → "receives contact form submissions, the site's only personal data
  (Principle VII), and sends each accepted one as a plain-text email to one fixed, verified
  address through the Worker's `send_email` binding. It stores nothing and has no retrieval
  endpoint. It verifies Turnstile." Questions API entry unchanged.
- **VII**: replace the hash, D1-location, preview-store and retention bullets with: submissions are
  never written to a database, file or log by the site; each is emailed to one destination fixed in
  committed configuration, never taken from a request; no IP address or fingerprint is stored or
  computed; preview emails are marked as preview; the privacy policy names the email service and
  states that Don keeps contact emails only as long as needed and deletes one on request. Keep the
  "collect only needed fields / never log" and secrets bullets.
- **VIII**: products list adds Email Routing; "Worker configuration, D1 migrations and Cron
  Triggers" stays generic; the bearer-token sentence loses "such as message retrieval"; "The contact
  API also verifies Turnstile server-side and rate-limits submissions" → "verifies Turnstile
  server-side"; free-plan bullet adds "contact email goes only to verified destination addresses";
  the CI-applied-configuration bullet states that turning on Email Routing for the sending
  subdomain and verifying the destination are one-time account setup by Don, confirmed by the
  setup check (like the Turnstile widget), not Worker configuration.
- **Technology Constraints**: Contact API line as above; add "**Email:** Cloudflare Email Routing
  on a sending subdomain, with the Worker's `send_email` binding restricted to one destination."
- **Security Baseline**: abuse bullet as above.
- Sync Impact Report lists the templates reviewed (no template change expected) and the follow-up
  to delete `CONTACT_READ_TOKEN` and `IP_HASH_SALT` from the secret stores after release.

## Design

### Request flow (`POST /api/contact`)

method → same-origin → content type → 10 KB cap → JSON → honeypot (fake `{ok:true}`, no send) →
validation (unchanged rules) → Turnstile (unchanged; `submission_id` still the idempotency key) →
`env.CONTACT_EMAIL.send(buildContactEmail(...))` → `{ok:true}`. A throw from Turnstile or the send
→ `503 unavailable`, log line with error name and `E_*` code only. Details: research R1, R4–R7;
contract: [contracts/contact-api.md](./contracts/contact-api.md); email shape:
[contracts/contact-email.md](./contracts/contact-email.md).

### Configuration

`wrangler.jsonc` (both environments): `send_email` block (R2), `triggers: { crons: [] }` (R9),
`secrets.required: ["TURNSTILE_SECRET_KEY"]`; preview adds `vars.SITE_ENVIRONMENT = "preview"`
(R6). `worker/worker-configuration.d.ts` regenerated. Contract:
[contracts/worker-config.md](./contracts/worker-config.md).

### Removal

Migration `0003_drop_messages.sql`; delete `worker/src/messages/`, `worker/src/retention.ts`,
`worker/src/contact/{ip-hash,rate-limit,queries}.ts`; drop the `scheduled` export and the
`/api/messages` route; drop the rate/retention constants. Data model:
[data-model.md](./data-model.md).

### Setup and operations

Setup item 17 `contact-email` (new) and item 16 changes, secret manifest, DNS baseline, docs and
walkthrough: research R11; contract: [contracts/setup-check.md](./contracts/setup-check.md).

### Pre-merge sequence (PR body; auto-merge armed, Don's approval is the hold)

1. **Before the first push that adds the binding** (R11 ordering): Don turns on Email Routing for
   `mail.doncoleman.ca` only and verifies `contact@doncoleman.ca` (walkthrough item 17). This is
   also the practical confirmation of research R3; if the dashboard insists on touching apex mail
   records, Don stops and picks a fallback, and the plan is updated before work continues.
2. Agent copies the subdomain records Cloudflare created into `setup/dns-baseline.json`;
   `pnpm run setup:check` passes items 4, 5 and 17.
3. `[PREVIEW-CHECK]` Don sends a message from the branch preview: it arrives within 5 minutes,
   subject starts `[Preview]`, Reply addresses the visitor (SC-002 on preview).
4. Immediately before approving: Don collects unread production messages through the retrieval
   endpoint and re-checks it once more (FR-017). Then approves; merge deploys the drop.
5. After merge (post-merge PR-body items, Don): one production test send (SC-002); list each
   remote database's tables and confirm `messages` is gone and the questions tables remain
   (FR-009, SC-004); delete `CONTACT_READ_TOKEN` and `IP_HASH_SALT` from both Workers **within 7
   days of release** (FR-017a; hygiene, not a security deadline).

Order: steps 1 and 2 happen before the first push of the binding (FR-016a); step 3 runs on the
preview that push creates; step 4 is immediately before approving (FR-017); step 5 after merge.

### Test placement (one primary layer per behaviour)

| Behaviour | Layer | File |
|---|---|---|
| Email text, subject sanitising, Reply-To safety, preview mark | Worker unit (pure functions) | `worker/test/contact-email.test.ts` (new) |
| One send per accepted submission; none for honeypot, invalid, Turnstile fail, forbidden, too large; fail closed on send error; nothing written to D1; log lines | Worker integration (fake binding) | `worker/test/contact.test.ts`, `worker/test/logging.test.ts` |
| Repeat sender not limited | Worker integration | `worker/test/contact.test.ts` (replaces `rate-limit.test.ts`) |
| Old `/api/messages*` → 404 with or without a token | Worker integration | `worker/test/router.test.ts` (replaces `retrieval.contract.test.ts`) |
| `messages` gone, questions tables intact after migrations | Worker integration (local D1) | `worker/test/schema.test.ts`, `query-plans.test.ts` trimmed |
| Preview env marks emails, production does not | Worker integration, both Vitest projects | `worker/test/environments.test.ts` |
| Binding restricted to the constants, `crons: []`, one required secret, both envs | Unit | `tests/unit/site/config-files.test.ts` |
| Visitor journey: send → confirmation; send failure keeps values | E2E | `tests/e2e/contact.spec.ts` (storage/retrieval journey removed) |
| Privacy policy, contact note and technology page wording | Unit (content) | `tests/unit/site/privacy-policy.test.ts`, `tests/unit/content/site-pages.test.ts` |
| Setup item 17, item 16 changes, manifest, baseline schema | Unit | `tests/unit/setup-check/checks/*.test.ts`, `tests/unit/setup/*.test.ts` |

## Project Structure

### Documentation (this feature)

```text
specs/033-contact-form-email/
├── spec.md
├── plan.md              # this file
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── contact-api.md       # POST /api/contact after the change; removed routes
│   ├── contact-email.md     # the email the Worker sends
│   ├── worker-config.md     # wrangler.jsonc contract (both environments)
│   └── setup-check.md       # setup item 17 and item 16 changes
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
.specify/memory/constitution.md          # amended first (speckit-constitution)
wrangler.jsonc                           # send_email, crons: [], one secret, preview var
migrations/0003_drop_messages.sql        # new
worker/
├── src/
│   ├── index.ts                         # /api/messages route and scheduled handler removed
│   ├── contact/
│   │   ├── email.ts                     # new: constants + buildContactEmail + sanitising
│   │   ├── submit.ts                    # send instead of store; outcomes updated
│   │   ├── rules.ts                     # rate/retention constants removed
│   │   ├── turnstile.ts                 # unchanged
│   │   ├── ip-hash.ts, rate-limit.ts, queries.ts   # deleted
│   ├── messages/                        # deleted
│   └── retention.ts                     # deleted
├── test/
│   ├── helpers.ts                       # fakeEmail(); store/retrieval helpers removed
│   ├── contact-email.test.ts            # new
│   ├── contact.test.ts, logging.test.ts, router.test.ts, schema.test.ts,
│   │   query-plans.test.ts, environments.test.ts, env.d.ts   # updated
│   └── ip-hash, rate-limit, retention, retrieval.contract tests   # deleted
├── vitest.config.ts                     # retired secret bindings removed
└── worker-configuration.d.ts            # regenerated
src/
├── components/sections/ContactForm.astro   # 429 branch and message removed
└── content/pages/{privacy-policy,contact,technology}.mdx   # wording, Last updated
scripts/
├── setup-check/{items.ts,secrets.ts,cli.ts,types.ts}
├── setup-check/checks/{contact-bindings.ts,contact-shared.ts,contact-email.ts(new)}
├── setup-check/providers/cloudflare.ts  # listEmailRoutingAddresses (read-only)
└── deploy/preview.ts                    # "additive only" comment corrected
setup/dns-baseline.json                  # subdomain routing records (after Don's step)
tests/
├── fixtures/worker/e2e.env              # two retired names removed
├── e2e/contact.spec.ts
├── unit/site/{config-files,privacy-policy}.test.ts
├── unit/content/site-pages.test.ts
└── unit/setup-check/**, unit/setup/**   # item 17, manifest, provider fixtures
docs/setup.md                            # item 16 trimmed, item 17 added, retired-secret note
.claude/skills/setup-walkthrough/SKILL.md
```

**Structure Decision**: the existing layout (Astro site in `src/`, Worker in `worker/`, setup
tooling in `scripts/setup-check/`) is kept. The only new source file is
`worker/src/contact/email.ts`; the only new setup check is `checks/contact-email.ts`.

## Post-design Constitution re-check

Re-checked after writing research, data model and contracts: no new dependency, no stored contact
data, no new endpoint, no cost. The design depends on one unconfirmed platform behaviour (research
R3: subdomain routing with the apex off), handled by putting Don's setup step first and naming
fallbacks that each need his decision. Gate still passes.

## Complexity Tracking

No violations to justify.
