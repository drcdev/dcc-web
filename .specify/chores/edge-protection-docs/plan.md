# Chore plan: edge-protection-docs

Branch: `chore/edge-protection-docs`, from `main` at 8ea8c61 (after #130 merged).
Issue: [#91](https://github.com/drcdev/dcc-web/issues/91) ("Add an edge rate limit and outcome
alerts for the public API before launch"). Related: `docs/cutover-plan.md` stage 4, issue #89
(production `workers.dev` host off).

## Goal

On 2026-10-09, right after the domain switch, Don set up the edge protections that issue
[#91](https://github.com/drcdev/dcc-web/issues/91) asked for, by hand in the Cloudflare dashboard:
one zone WAF rate-limiting rule on paths under `/api/` counted per IP, and the HTTP DDoS Attack
Alert notification. The account stays on Workers Free. None of this is written down in the setup
runbook yet; `docs/cutover-plan.md` stage 4 carries an unticked "#91 follow-up `/chore`" line for
exactly this. This chore adds a short, unnumbered **Edge protections** part at the end of
`docs/setup.md` that records the rule (without its request threshold, which Don keeps
unpublished), the alert and the plan tier, states plainly that none of them is a `setup:check`
item, and ticks the cutover-plan line with a pointer to the new part. Nothing on the site, in the
Worker, in the setup check or in CI changes.

Note on the issue state: #91 is already **closed** (closed 2026-10-10 03:07 UTC, completed, linked
to PR #128). The PR therefore says `Refs #91`, not `Closes #91` (judgment; a `Closes` keyword on a
closed issue does nothing and would misstate what closed it). The orchestrator adds one comment on
#91 after the PR merges, naming the PR and the leftover assistant-side work (see Follow-ups).

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Registry structure unchanged.** `docs/setup.md` still has exactly 31 `## … {#id}` headings,
   in the same order (`grep -cE '^## .*\{#[a-z0-9-]+\}' docs/setup.md` = 31). The intro still
   contains `31-item registry` and `of the 31 items`.
2. **New part placement and shape.** A new H1 `# Edge protections` is the last H1 in the file and
   comes after `{#mail-records}`. Its subsections use `###` headings and carry **no** `{#…}`
   anchors. The new text contains neither the substring `# Launch` nor `# Contact form` (the
   structure tests locate those parts with `indexOf`).
3. **Not setup items.** The part's opening paragraph says these protections are dashboard settings
   recorded for reference, are not setup items, and are not checked by `pnpm setup:check`.
4. **Rate-limit rule recorded.** The part names: the zone-level WAF rate-limiting rule; the match
   "URI Path starts with `/api/`" and why (the Free plan matches on path only, not host and path);
   counted per IP; 10-second period; action Block (for 10 seconds, as `docs/cutover-plan.md`
   already records); that the request threshold is Don's choice, set in the dashboard and
   deliberately not published; that a burst test returned 429 once past the threshold
   (2026-10-09); and that it fully protects the API only because production's `workers.dev` host
   and Preview URLs are off (#89, item 7), so every request to the production Worker passes
   through the zone.
5. **No threshold published.** Review reads the diff and confirms no request count for the rule
   appears anywhere in it (the only numbers about the rule are the 10-second period and block
   time, and 429).
6. **DDoS alert recorded.** The part names the HTTP DDoS Attack Alert, saved under the account's
   Notifications, with the location written as `dash.cloudflare.com/<account-id>/notifications`
   (placeholder only). The diff contains no real account id (no 32-character hex string).
7. **Plan tier recorded.** The part states the account is on Workers Free (Don's decision,
   2026-10-04; the tier is changed only by Don, and billing tells him), and that there is no
   `setup:check` item for it.
8. **Intro pointer.** The intro gains one sentence pointing to the Edge protections part at the
   end, worded so the existing intro assertions still hold.
9. **Cutover plan.** `docs/cutover-plan.md` stage 4's "#91 follow-up `/chore`" line is ticked
   (`[x]`) and points to the Edge protections part of `docs/setup.md`. No other cutover-plan line
   changes.
10. **Scope of the diff.** `git diff --name-only main` lists only `docs/setup.md`,
    `docs/cutover-plan.md` and `.specify/chores/edge-protection-docs/**`.
11. **Unit tests green, unedited:** `tests/unit/setup/docs-structure.test.ts`,
    `tests/unit/setup/drift.test.ts`, `tests/unit/setup/docs-dns.test.ts`,
    `tests/unit/setup/items.test.ts` and `tests/unit/setup/launch-doc.test.ts`.
12. Full `pnpm run verify` is green (locally, or in CI per the usual load caveat). `docs/setup.md`
    is not skip-safe (`tests/unit/ci/changed-paths.test.ts` lists it under UNSAFE, because
    checks read it), so CI runs the full gate; that is expected, not a problem.

**Before measurement** (at 8ea8c61):

- `grep -nE 'WAF|DDoS|Workers Free|rate-limiting rule' docs/setup.md` → no matches.
- `grep -cE '^## .*\{#[a-z0-9-]+\}' docs/setup.md` → 31; H1 parts are `# Setup runbook`,
  `# Contact form` (l.506) and `# Launch` (l.757); item 31 `{#mail-records}` is last (l.892).
- `docs/cutover-plan.md` l.119: `- [ ] **#91 follow-up /chore** — docs/setup.md records the WAF
  rule, the DDoS alert and the Workers Free tier. Closes #91.` (unticked).

**After (target):** the grep finds the new part; 31 anchors unchanged; four H1 parts with
`# Edge protections` last; the cutover-plan line ticked.

## Scope

**In:**

- `docs/setup.md`:
  - one intro sentence pointing to the new part;
  - a new `# Edge protections` part after item 31 with an opening paragraph and three `###`
    subsections: the API rate-limiting rule, the HTTP DDoS attack alert, and the plan tier. Each
    subsection uses the runbook's familiar bold labels where they fit (**What it is for**,
    **Where it is**, **How it was confirmed**, **Constitution principle**) so it reads like the
    items without being one (judgment: the item labels "Where to do it" / "How it will be
    confirmed" imply a pending step and a `setup:check`, so the past-tense variants are used).
- `docs/cutover-plan.md`: tick the stage 4 "#91 follow-up `/chore`" line and add the pointer.

**Out:**

- Any `setup:check` item, registry entry or check for the rule, the alert or the tier (Don's
  scope trim on #91, 2026-10-04).
- The rule's request threshold (deliberately unpublished).
- The assistant's daily-run reporting of `limited`, `unauthorized` and refused-contact counts, and
  pacing of its `/api/messages` client under the edge rule: lives outside this repository.
- `specs/011-launch/research.md` l.147 ("the planned `api-per-ip` rate-limit rule") and
  `specs/007-contact-form/` mentions of Workers Free and of the request cap as the abuse ceiling:
  specs are historical records of their feature and are left as written (judgment). The rule's
  real dashboard name is not recorded either, since it is not known to the repo and adds nothing.
- `.claude/skills/setup-walkthrough/SKILL.md`: walks the 31 registry items only; the new part has
  nothing for it to walk.
- `docs/launch.md`: Part D already hands post-switch work to the cutover plan; no change.
- Any dashboard, Worker, `wrangler.jsonc` or CI change.

**Follow-ups for the PR body:**

- The assistant's daily run (outside this repo) still needs to report `limited`, `unauthorized`
  and refused-contact counts and pace its `/api/messages` calls under the edge rule; the cutover
  plan already lists this as "Still open". Note it on #91 after merge.
- `Refs #91`: the issue was already closed (by #128); the PR does not close it.

## Constitution Check

- **I. Test-First:** documentation only; no behaviour to drive with a new test. Existing
  structure tests (docs-structure, drift, docs-dns, items, launch-doc) guard the runbook and must
  stay green. No new test, per `docs/testing.md` "Invariants, not mirrors": a test that the part
  exists or that it never contains a threshold would restate wording, and a number regex would
  also trip on the 10-second period; the threshold rule is a review check (acceptance 5).
- **II. Automated Release Gate:** no check is skipped, disabled or weakened; the full gate runs
  (the change is not skip-safe).
- **III. Human Review for Major Changes:** no criterion fires. No dependency, integration or
  service is added, removed or replaced (the WAF rule and alert are existing Cloudflare features
  Don already turned on; this records them). No contact-data handling, design system, layout,
  navigation, cost or constitution change. The files are documentation, not CI, deployment or
  infrastructure configuration. Verdict: **not major**; auto-merge applies.
- **IV. First-Party Before Custom:** the documented controls are Cloudflare's own (WAF rate
  limiting, Notifications); no tool usage changes.
- **V. Static by Default:** unchanged; nothing ships.
- **VI. Content as Files:** unchanged; no public content touched.
- **VII. Private Data:** unchanged. No secrets or account id are written (placeholder only); the
  threshold stays out.
- **VIII. Cloudflare Best Practices:** unchanged in effect; the part records that the zone rule is
  not Worker configuration (so "never by hand in the dashboard" does not apply, per #91), and that
  usage stays on Workers Free.
- **IX. Cost Ceiling:** unchanged; Workers Free and the Free-plan rule cost nothing.
- **X. Accessible, Fast and Private:** unchanged; no page output changes.
- **XI. Spec Kit Workflow:** one chore on its own `chore/<slug>` branch via `/chore`.
- **Security Baseline:** unchanged; the new part documents the "Cloudflare's edge protections"
  the baseline already names.

## Work items

### [ ] W1 — Edge protections part in `docs/setup.md`

- **Files:** `docs/setup.md` (intro, lines 1–21: one sentence; end of file after item 31: the new
  part).
- **What:**
  - Intro: one sentence, e.g. "The edge protections set up in the Cloudflare dashboard after the
    switch are recorded in the Edge protections part at the end; they are not setup items." Keep
    `31-item registry` and `of the 31 items` untouched.
  - After item 31's **Secrets** block: `# Edge protections`, an opening paragraph (dashboard
    settings Don made by hand on 2026-10-09 for #91; recorded for reference; not setup items and
    not checked by `pnpm setup:check`), then:
    - `### API rate-limiting rule` — zone → Security → WAF → Rate limiting rules (implement
      confirms the current menu wording against the Cloudflare docs cited below and writes it
      without guessing a newer menu name); one rule, the Free plan's only one; match "URI Path
      starts with `/api/`" because the Free plan matches on path only; counted per IP; 10-second
      period; Block for 10 seconds; threshold set by Don in the dashboard and not published here;
      confirmed 2026-10-09 by a burst that returned 429 once past the threshold; works fully only
      because production's `workers.dev` host and Preview URLs are off (#89, item 7), so every
      request reaching the production Worker passes through the zone; it is a zone rule, not
      Worker configuration, which is why it is set in the dashboard. Principle VIII and the
      Security Baseline.
    - `### HTTP DDoS attack alert` — account → Notifications
      (`dash.cloudflare.com/<account-id>/notifications`), HTTP DDoS Attack Alert saved
      2026-10-09; emails Don when Cloudflare mitigates an HTTP DDoS attack on the zone. Principle
      VIII.
    - `### Plan tier` — the account is on Workers Free (Don's decision, 2026-10-04); only Don can
      change it and billing would tell him, so there is no `setup:check` item for it. Principles
      VIII (free-plan limits) and IX.
  - Plain language, no threshold number, no real account id, no `# Launch` / `# Contact form`
    substrings, no `{#…}` anchors.
- **Test:** existing — `tests/unit/setup/docs-structure.test.ts` (31 anchors in order, labels per
  item, intro counts, part order), `tests/unit/setup/drift.test.ts` (registry ↔ anchors one-to-one),
  `tests/unit/setup/docs-dns.test.ts`, `tests/unit/setup/items.test.ts`,
  `tests/unit/setup/launch-doc.test.ts`; all must stay green unedited. Verified by reading
  `extractSections`/`extractSection`: both split on `^##\s+`, so `###` headings and the H1 do not
  start a new section; item 31's body simply extends to end of file, and the tests only look for
  labels being present there. No new test (see Constitution Check I).
- **Layer:** unit (existing doc-structure tests); the new prose itself: n/a.

### [ ] W2 — Tick the cutover-plan line

- **Files:** `docs/cutover-plan.md` (stage 4, line ~119).
- **What:** `- [ ]` → `- [x]`; append "Done 2026-10-09: recorded in the Edge protections part at
  the end of `docs/setup.md`." Replace the trailing "Closes #91." with a note that #91 was closed
  by #128 and this PR refers to it (keeps the line true). Lines 111–118 stay as they are,
  including "Still open: the assistant's daily-run counts and pacing."
- **Test:** no behaviour: n/a (planning checklist wording; no test reads `docs/cutover-plan.md`
  beyond the full gate's general checks).
- **Layer:** n/a.

Work-item count: **2**.

## Docs citations

No tool usage changes. The rule description relies on Cloudflare's documented rate-limiting
availability for the Free plan (one rule; path-only matching; counted per IP; 10-second period
and 10-second mitigation; Block action):
developers.cloudflare.com/waf/rate-limiting-rules/ and its "Availability" section, and the
dashboard steps at developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/. The
alert is described at developers.cloudflare.com/ddos-protection/reference/alerts/ and
developers.cloudflare.com/notifications/. W1 checks its menu wording against these pages (via
the `cloudflare` skill or WebFetch); where they disagree with what Don reported, Don's
2026-10-09 record in `docs/cutover-plan.md` wins for the values, and the docs win for menu names.

## Risks

- **Structure tests depend on `##` splitting.** The new part must not add any `## ` heading (H2)
  or `{#…}` anchor, or the 31-item assertions fail; `###` and `#` are safe. Mitigation:
  acceptance 1–2.
- **`indexOf("# Launch")` / `indexOf("# Contact form")`.** Both find the first occurrence, so new
  text after item 31 cannot move them; the new text avoids those substrings anyway.
- **Threshold leak.** The only real risk of this chore is writing the request count; acceptance 5
  makes the reviewer check the diff for it.
- **Dashboard wording drift.** Cloudflare renames dashboard menus from time to time; the part
  names the menu once and the rule's content (path, per IP, period, action), which is what lets
  Don find and recognise it.
- **Issue already closed.** If the orchestrator writes `Closes #91` from the handoff, nothing
  breaks, but the PR body would misstate history; the plan says `Refs #91`.
