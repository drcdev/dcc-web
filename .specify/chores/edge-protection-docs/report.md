# Review report: edge-protection-docs

Reviewed 2026-10-09 against `plan.md` and `git diff 8ea8c61...HEAD` (commits 425b2f1, 9d1bca3,
b8ed90b). Read-only review; saved by the orchestrator because the review subagent may not write
files.

## Verdict

Both work items are done as planned and nothing beyond them. The setup unit tests are green and
unedited. No check is weakened, and no threshold or account id is published. The Principle III
verdict (not major) holds against the real diff. Findings: **0 CRITICAL, 0 HIGH, 3 LOW**.

## Acceptance check

| #   | Criterion | Result |
| --- | --------- | ------ |
| 1   | 31 `## … {#id}` headings, intro counts intact | Pass: 31 found; `31-item registry` and `of the 31 items` unchanged |
| 2   | `# Edge protections` is the last H1, after `{#mail-records}`, `###` subsections, no anchors | Pass: H1s at l.1, 508, 759, 917; three `###`, no `{#…}` |
| 3   | Opening paragraph: reference only, not setup items, not checked by `setup:check` | Pass (l.919–921) |
| 4   | Rule facts: zone WAF rule, URI Path starts with `/api/`, Free plan path-only, per IP, 10 s period, Block for 10 s, threshold not published, 429 burst on 2026-10-09, depends on #89 and item 7 | Pass (l.923–946) |
| 5   | No threshold in the diff | Pass: only dates, issue/PR numbers, item numbers, 10 and 429 |
| 6   | HTTP DDoS Attack Alert in account Notifications, `<account-id>` placeholder only | Pass; no 32-character hex string in the diff |
| 7   | Workers Free, Don's decision 2026-10-04, no `setup:check` item | Pass (l.961–967) |
| 8   | Intro pointer sentence | Pass (l.16–18) |
| 9   | Cutover plan stage 4 line ticked with a pointer, no other line changed | Pass (l.119–121); `Closes #91` replaced by a note that #128 closed it |
| 10  | Diff touches only the two docs and `.specify/chores/edge-protection-docs/**` | Pass |
| 11  | Setup unit tests green and unedited | Pass: 51 files, 652 tests |
| 12  | Full `pnpm run verify` | Left to the verify phase |

## Before and after

- **Before (8ea8c61):** `grep -nE 'WAF|DDoS|Workers Free|rate-limiting rule' docs/setup.md` found
  nothing; three H1 parts; cutover plan l.119 unticked with `Closes #91`.
- **After (HEAD):** the grep finds the new part; the 31 anchors are unchanged; four H1 parts with
  `# Edge protections` last; the cutover-plan line is ticked and points to the new part.

## Principle III

Not major. Documentation only: no dependency, service, integration, CI, deployment or
infrastructure config changes; the WAF rule and the alert already exist in the dashboard and the
docs only record them.

## Fact check against Cloudflare docs

- developers.cloudflare.com/waf/rate-limiting-rules/ (Availability): Free plan has 1 rule, Path and
  Verified Bot fields only, counted by IP, 10 s period and 10 s mitigation timeout. Matches.
- developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/: the current flow is
  "Security rules" → Create rule → Rate limiting rules (see LOW-1).

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

- **LOW-1** (`docs/setup.md` l.930): "Security → WAF → Rate limiting rules" is the older menu name;
  Cloudflare now calls the page "Security rules". Cosmetic; the rule's contents are described in
  full.
- **LOW-2** (`docs/setup.md` l.926–927): "The site's own cap on contact-form messages is the last
  line of defence" — `/api/` also serves the questions panel with its own bucket (#90); "the site's
  own caps (contact messages and questions)" would match the rule's scope better. Optional.
- **LOW-3** (`docs/setup.md` l.964–966): the Plan tier "Where it is" label holds a reason, not a
  location; **Why it is not checked** would read better. Optional.

## Follow-ups for the PR body

- The assistant's daily run still has to report `limited`, `unauthorized` and refused-contact
  counts and pace its `/api/messages` calls under the edge rule. That lives outside this
  repository; note it on #91 after the merge.
- Use `Refs #91`, not `Closes #91`: #128 already closed the issue.
- LOW-1 to LOW-3 can be fixed later or left as they are.
