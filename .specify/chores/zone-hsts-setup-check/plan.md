# Chore plan: zone-hsts-setup-check (issue #155)

Branch: `chore/zone-hsts-setup-check`, from `main` at 32ec29d (after #158, worker custom domains).
Issue: https://github.com/drcdev/dcc-web/issues/155. The PR body says `Closes #155`.

## Goal

Don turned on HSTS for the whole `doncoleman.ca` zone in the Cloudflare dashboard (SSL/TLS → Edge
Certificates → HTTP Strict Transport Security), using Cloudflare's defaults: max-age 6 months,
subdomains included, preload off. Every HTTPS response on both hosts now carries
`strict-transport-security: max-age=15552000; includeSubDomains`, including the bare-domain 301,
and the zone value replaces the header the site sends itself. Nothing in the repository records
this, and nothing notices if it is switched off. This chore
([#155](https://github.com/drcdev/dcc-web/issues/155)) does three things. It records the zone
setting and its values in `docs/setup.md` item 18 (`live-hosts`, the main-address setup). It extends
the existing `live-hosts` setup check so every HTTPS response it already fetches from both hosts
must carry HSTS with `includeSubDomains`, and it reports a problem when one does not. And it makes
the Worker's own fallback header (`worker/src/http.ts`) the same as the site's (`public/_headers`),
so the policy keeps covering subdomains if the zone setting is ever turned off. This uses
Cloudflare's own zone HSTS setting and the setup check's existing HTTP probes. It adds no custom
script, no new setup item and no Cloudflare API call (Principle IV).

## Acceptance

**Before state (32ec29d, measured 2026-10-11 with `curl -sI`):**

- `https://www.doncoleman.ca/` (200), `https://doncoleman.ca/` (301), the www Ghost 301 and
  `https://www.doncoleman.ca/api/nope` (404, Worker) all send
  `strict-transport-security: max-age=15552000; includeSubDomains`. `http://www.doncoleman.ca/` and
  `http://doncoleman.ca/` (301) send no HSTS header.
- `public/_headers` line 8 (`/*`): `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- `worker/src/http.ts` line 11: `"Strict-Transport-Security": "max-age=31536000"`, with no
  `includeSubDomains`.
- `scripts/setup-check/checks/live-hosts.ts` never reads a `strict-transport-security` header.
  `git grep -n -i "strict-transport" scripts/setup-check` prints nothing.
- `docs/setup.md` never names HSTS. `git grep -n -i "hsts\|strict-transport" docs/setup.md`
  prints nothing.

**Mechanical criteria (the review phase checks each one):**

1. **Tests seen failing first.** The new and changed assertions in W1 and W2 are run red against
   the before state, before W3 and W4 change any code, and the implement summary records each red run.
2. **Check fails without HSTS.** With recorded responses, `live-hosts` reports `missing` when any
   HTTPS response in a probe has no `strict-transport-security` header. It also reports `missing`
   when that header lacks the `includeSubDomains` directive (case-insensitive, matched as a
   `;`-separated directive) or has no positive `max-age`. "Any HTTPS response" covers both the
   final 200 on `www` and the HTTPS redirect hops: the bare domain's 301s and the www Ghost 301.
   Each detail names the probe start URL and the response that broke the rule.
3. **Plain HTTP is not required to carry HSTS.** The "complete" fixture sends no HSTS on
   `http://` replies, and the check reports `complete`. Browsers ignore HSTS over plain HTTP, and
   Cloudflare does not send it there.
4. **The value is not pinned.** The check accepts any positive `max-age` (both 15552000 and
   31536000 pass, covered by a test case), so raising max-age for preload later is not a check edit.
5. **No new request.** The call count and `{ redirect: "manual" }` options test passes unchanged.
   The HSTS rule reads headers from the responses the 10 probes already fetch.
6. **Fallbacks agree.** A unit test shows that the Worker's `SECURITY_HEADERS["Strict-Transport-Security"]`
   and the `/*` rule's value in `public/_headers` have the same directive set once directives are
   split on `;`, trimmed and lower-cased. After W4, both read `max-age=31536000; includeSubDomains`.
   `worker/test/router.test.ts` checks that the Worker's response carries `includeSubDomains`.
7. **Registry unchanged.** The registry still has 18 items. `tests/unit/setup/items.test.ts`,
   `tests/unit/setup/docs-structure.test.ts`, `tests/unit/setup/skill-behaviour.test.ts`,
   `cli.test.ts` and `report.test.ts` pass with no edits.
8. **Docs.** `docs/setup.md` item 18 has a `### Zone HSTS` subsection between the "Where to do it"
   text and `### Live swap`. It gives the dashboard path, the three values (6 months,
   `includeSubDomains` on, preload off), that the zone value replaces the site's own header on
   HTTPS responses, that plain HTTP responses carry none, the two fallbacks, and that preload is a
   separate decision. "How it will be confirmed" says the check also requires HSTS with
   `includeSubDomains` on every HTTPS response from both hosts. The `live-hosts` seed's
   `confirmedBy` text in `scripts/setup-check/items.ts` says the same in one clause.
9. **Diff scope:** `git diff --name-only main` lists only files named in the work items and
   `.specify/chores/zone-hsts-setup-check/**`. It touches no page, component, visual baseline,
   CI workflow, `wrangler.jsonc` or constitution.
10. **Live check.** After W3, `pnpm setup:check --item live-hosts` against the live hosts reports
    `complete`. This is a read-only public GET, run once by implement and recorded in its summary.
11. The changed-paths gate tier (`changed-paths.ts --base origin/main`) is green locally, then in CI.

No `[PREVIEW-CHECK]` items: no page or response changes in a way a preview can show. The Worker
header change is overridden by the zone setting on production, and preview responses on
`workers.dev` are outside the zone.

## Scope

**In:**

- `scripts/setup-check/checks/live-hosts.ts`: keep each hop's HSTS header, and add an HSTS rule
  for HTTPS responses.
- `tests/unit/setup-check/checks/live-hosts.test.ts`: HSTS on the HTTPS fixture replies, plus new
  failing cases.
- `worker/src/http.ts`: the fallback value becomes `max-age=31536000; includeSubDomains`.
- `worker/test/router.test.ts` line 29: the exact-value assertion becomes an `includeSubDomains`
  invariant.
- `tests/unit/site/headers.test.ts`: a new "Worker and site fallbacks agree" case.
- `docs/setup.md` item 18, and the `live-hosts` seed's `confirmedBy` text in
  `scripts/setup-check/items.ts`.

**Out:**

- **HSTS preload** (submitting to hstspreload.org, raising max-age to at least 12 months, turning
  Preload on). Removing a domain from the preload list is slow and hard to undo. The issue makes it
  a separate decision that waits until zone HSTS has run a few weeks with no problems and no
  subdomain needs plain HTTP. **Follow-up for the PR body:** "Decide on HSTS preload once zone
  HSTS has run a few weeks without problems: raise max-age to ≥ 12 months, turn Preload on, submit
  to the preload list."
- Changing the zone setting or any dashboard value. The agent makes no dashboard change.
- A 19th setup item, or reading the zone setting through the Cloudflare API
  (`GET /zones/{id}/settings/security_header`). The HTTP probe observes what browsers actually
  receive, needs no token, and the existing `live-hosts` item already fetches every relevant
  response. A new item would touch the hard-coded count of 18 in several tests and docs.
- Asserting the exact max-age anywhere. Values are reviewed config, not test literals
  (`docs/testing.md` "Invariants, not mirrors").
- The `# Edge protections` part of `docs/setup.md`. It is not checked, and the zone HSTS belongs
  with the main address, as the issue says.
- `.claude/skills/setup-walkthrough/SKILL.md`. The confirmation command and anchor are unchanged,
  and the swap steps are unchanged.
- Changing the max-age of `public/_headers` (stays at 1 year).

## Constitution Check

- **I. Test-First:** W1 and W2 add or tighten assertions and run them red before W3 and W4 change
  code. W5 is docs and seed text only, and says why no new test applies.
- **II. Automated Release Gate:** no check is skipped or weakened. One exact-value Worker assertion
  becomes an invariant, and the fallback-agreement test is stronger than the value it replaces.
- **III. Human Review of Every Change:** normal flow. Don approves, and auto-merge is armed after
  the final push. There are no `[PREVIEW-CHECK]` items.
- **IV. First-Party Before Custom:** Cloudflare's zone HSTS setting (docs cited below) and the
  setup check's existing HTTP probes. No custom script, no API integration, no new dependency.
- **V. Static by Default:** unchanged. No endpoint, and `run_worker_first` is untouched.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** unchanged. The probes are public GETs with no credentials.
- **VIII. Cloudflare Best Practices:** favoured. A hand-set zone setting is recorded in the setup
  guide and watched by the setup check, and the Worker fallback matches the site policy.
- **IX. Cost Ceiling:** no cost. The zone HSTS setting is free, and the probes add no requests.
- **X. Accessible, Fast and Private:** unchanged for visitors. HSTS is a header browsers act on,
  and the subdomain coverage it records strengthens transport security.
- **XI. Spec Kit Workflow:** `/chore` branch and `.specify/chores/zone-hsts-setup-check/`.
  `docs/setup.md` is a shared hot file, so implement merges `origin/main` before the gate.
- **Security Baseline:** strengthened. The Worker's HSTS gains `includeSubDomains`, and loss of
  zone HSTS becomes detectable.

## Work items

### [x] W1 — live-hosts test: HSTS on HTTPS responses (new-first)

- **Files:** `tests/unit/setup-check/checks/live-hosts.test.ts`.
- **Test:** new-first. **Layer: unit** (recorded responses through `fakeProviderContext`). This is
  the cheapest layer that observes the check's verdict. No second layer: the live run in
  acceptance 10 is a one-off confirmation, not a test.
- **What:**
  - Fixtures: add an `HSTS` constant (`max-age=15552000; includeSubDomains`). `page()` and
    `redirect()` take an optional headers argument. `newArrangement()` gives every `https://`
    reply `strict-transport-security: HSTS` and every `http://` reply none. A small helper
    (for example `secure(url, reply)`) keeps this to one place. The existing "complete" cases then
    also prove acceptance 3.
  - New `missing` cases in the `cases` table, each with a detail regex matching
    `/Strict-Transport-Security|HSTS/i`:
    - `www` final 200 without the header;
    - `www` final 200 with `max-age=15552000` (no `includeSubDomains`);
    - bare `https://doncoleman.ca/` 301 without the header (the redirect hop);
    - the www Ghost 301 without the header;
    - a header with `max-age=0; includeSubDomains`.
  - New `complete` case: a `max-age=31536000; includeSubDomains` value is accepted, and
    `includesubdomains` in lower case is accepted.
  - New `complete` case: an `http://` reply that does carry HSTS is still fine (the check neither
    requires nor rejects it).
- **Red run:** before W3, the five new `missing` cases fail (the check reports `complete`).
  Record the run.
- **Coverage mapping:** no test removed or moved. Existing cases keep their assertions. Only the
  fixture builders gain the header.

### W2 — Fallback headers agree; Worker header covers subdomains (new-first / existing changed)

- **Files:** `tests/unit/site/headers.test.ts`, `worker/test/router.test.ts`.
- **Test:**
  - `headers.test.ts`: new case "the Worker's HSTS fallback matches the site's (#155)". It imports
    `SECURITY_HEADERS` from `worker/src/http.ts` (precedent: `tests/unit/site/config-files.test.ts`
    and `tests/unit/questions/source.test.ts` already import from `worker/src`). It compares the
    normalized directive set with the `/*` rule's `strict-transport-security`. **Layer: unit over
    config:** both values are static config, and no runtime is needed to compare them. No second
    layer.
  - `router.test.ts` line 29: replace `toBe("max-age=31536000")` with a split-on-`;`
    directive check that contains `includesubdomains`, in the style of the "HSTS on /* covers
    subdomains (#93)" case. **Layer: Worker Vitest (existing):** it is the only layer that sees
    the header on a real Worker response. It stays the primary layer for "the Worker sends HSTS".
    The comment cites #155, and max-age is not asserted.
- **Red run:** both fail against the before state (the Worker value lacks `includeSubDomains`).
- **Coverage mapping:** the router test's exact `max-age=31536000` value is no longer pinned. The
  max-age is covered by the new agreement test (it must equal the site's `/*` value). The header's
  presence stays covered by the edited router assertion.

### W3 — live-hosts check: HSTS rule

- **Files:** `scripts/setup-check/checks/live-hosts.ts`.
- **Test:** existing W1 cases go green.
- **What:**
  - `Hop` gains `hsts: string | null`, read from `response.headers["strict-transport-security"]`
    (the provider gives lower-case keys). Keep the final response's HSTS value alongside
    `finalStatus` and `finalBody`.
  - A pure helper `hstsProblem(value: string | null): string | null` splits on `;`, trims and
    lower-cases. It returns `"no Strict-Transport-Security header"`, `"Strict-Transport-Security
    without includeSubDomains"` or `"Strict-Transport-Security without a positive max-age"`, or
    null.
  - In `rule()`, after the existing routing and canonical checks (so a routing fault is still
    reported first), apply the helper to each hop whose `url` is `https:` and to the final response
    when `end` is `https:`. Return the first problem, prefixed with the response URL (for example
    `https://doncoleman.ca/: no Strict-Transport-Security header`). Plain `http:` responses are
    skipped.
  - Update the file header comment, the `complete()` summary (add "every HTTPS response carries
    HSTS with includeSubDomains") and the `missing()` `nextAction`, which also points to the
    `### Zone HSTS` subsection in `docs/setup.md#live-hosts`. The summary line keeps "do not match
    the main-address arrangement".
- **Judgment call:** HSTS problems are reported through the same `missing` result and details
  list as routing problems, not as a new status or a new item. One item keeps the 18-item registry
  and its tests unchanged (acceptance 7).

### W4 — Worker fallback value

- **Files:** `worker/src/http.ts`.
- **Test:** existing W2 cases go green.
- **What:** `"Strict-Transport-Security": "max-age=31536000; includeSubDomains"`, identical to
  `public/_headers` `/*`. Add one comment line: the zone HSTS setting replaces this on production,
  and it must match `public/_headers` (#155). The `worker/test/questions.test.ts:142`
  `toBeTruthy` stays as is.
- **Judgment call:** an identical value, rather than only adding `includeSubDomains`, so the
  fallback policy is one policy wherever it applies. The 1-year max-age is kept in both fallbacks
  (stronger than the zone's 6 months, and the zone value wins while it is on).

### W5 — Setup guide and seed text

- **Files:** `docs/setup.md` (item 18), `scripts/setup-check/items.ts` (`live-hosts`
  `confirmedBy` only).
- **Test:** no behaviour: n/a (setup documentation and report wording. The structure of item 18
  stays guarded by `tests/unit/setup/docs-structure.test.ts`, which must pass unedited, and
  `items.test.ts` only requires non-empty text).
- **What:**
  - Add `### Zone HSTS` after the "Since #156 …" paragraph and before `### Live swap`. This keeps
    it outside the Live swap → Rollback slice the structure test reads. It covers: the dashboard
    path (SSL/TLS → Edge Certificates → HTTP Strict Transport Security), set by Don on the zone
    with Cloudflare's defaults (Max Age 6 months, Apply HSTS policy to subdomains on, Preload off,
    No-Sniff left as is). It says the header goes on every HTTPS response on both hosts, including
    the bare-domain 301, and that the zone value replaces the header the site sends. It says plain
    HTTP responses carry none, as Cloudflare documents. It names the two fallbacks
    (`public/_headers` and `worker/src/http.ts`), which carry the same 1-year value with
    `includeSubDomains` and must stay identical. It says preload is a separate decision, and why.
    It includes a one-line rollback: turning the setting off leaves the fallbacks in force on site
    and Worker responses, but not on the bare-domain redirect. The setup check will then report
    item 18 as a problem.
  - "How it will be confirmed": add one sentence. The check also requires every HTTPS response it
    fetches from both hosts (the `www` pages and the HTTPS redirects) to carry HSTS with
    `includeSubDomains` and a positive max-age. Plain HTTP responses are not required to.
  - `items.ts` `confirmedBy`: append "; every HTTPS response from both hosts carries HSTS with
    includeSubDomains". `purpose`, `where` and the other fields stay unchanged.
- Do not renumber items, and keep "item 18" and "18 items" wording intact.

## Docs citations (Principle IV)

- Cloudflare, "HTTP Strict Transport Security (HSTS)":
  https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/
  (fetched 2026-10-11). It covers the setting under Edge Certificates → Enable HSTS, with Max Age
  from 1 to 12 months, includeSubDomains, Preload (requires ≥ 12 months for list inclusion) and
  No-Sniff. It states the header is served on HTTPS requests and that "HTTP (non-secure) requests
  will not contain the header". This is the basis for acceptance 3. The page does not say whether
  the zone value overrides an origin header. That is taken from the live measurement above: the
  Worker's own `max-age=31536000` is replaced by `15552000; includeSubDomains` on
  `/api/nope`. The setup guide states this as observed behaviour, not as a documented guarantee.
- Cloudflare Workers static assets `_headers`: unchanged usage, no new citation needed.
- No Astro decision is made, so no Astro docs page applies.

## Risks

- **Override behaviour not documented.** If Cloudflare ever stops replacing the origin header and
  appends instead, responses could carry two HSTS values. The check reads the joined header value,
  and the directive split still finds `includeSubDomains`, so it would not falsely fail. Low.
- **Header joining in the provider.** `scripts/setup-check/providers/http.ts` builds the header
  map from fetch `Headers`, which joins repeated headers with `, `. A joined value such as
  `max-age=1; includeSubDomains, max-age=2` still contains the directive. The max-age parse takes
  the first `max-age=` number. Acceptable.
- **Check turns red for a routing-correct site.** By design: if zone HSTS is switched off, the bare
  301 loses HSTS and item 18 reports `missing`. The `nextAction` points to the Zone HSTS subsection
  so the cause is clear.
- **Hot file conflict.** `docs/setup.md` and `items.ts` change often. Implement merges
  `origin/main` before the gate.
- **Parallel worktree port collisions** during the local gate (known). The changed tier here is
  unit and Worker Vitest, with no Playwright, so the risk is low.

## Decisions

None required. The issue has no decision checkboxes, and preload is out of scope by the issue's
own text. Judgment calls made in this plan: extend `live-hosts` rather than add item 19 (W3); the
Worker fallback is identical to `public/_headers` (W4); the router test asserts the invariant, not
the exact value, and exactness moves to the agreement test (W2).
