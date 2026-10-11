# Review report: zone-hsts-setup-check (issue #155)

Reviewed 2026-10-11 with fresh eyes against `plan.md`, using `git diff origin/main...HEAD` (local `main` is stale, so a diff against it also shows #156 and #157). Five work commits on top of the plan commit. They change 7 files, every one named in a work item.

## Verdict

W1–W5 are done as planned, and the diff goes no further. The check logic is correct, every test the plan names is present at the layer it names, and all of them pass. **One HIGH finding blocks the gate:** `eslint .` (part of `verify` and of CI) fails on the new test helper. Fix it before the gate runs.

## Findings

### CRITICAL

None.

### HIGH

1. **Lint error in the new test helper.** `tests/unit/setup-check/checks/live-hosts.test.ts:23`: `const { [HSTS_HEADER]: _drop, ...headers } = reply.headers;` fails `@typescript-eslint/no-unused-vars` ("'_drop' is assigned a value but never used"). The eslint config has no ignore pattern for leading underscores, so `pnpm run lint` (in `verify`, `verify:quick` and CI) goes red. A fix that keeps the behaviour: `const headers = { ...reply.headers }; delete headers[HSTS_HEADER];`.

### LOW

1. `docs/setup.md:647` says "the zone value replaces the header the site sends" as plain fact. The plan (Docs citations) asked for this to read as observed behaviour, because Cloudflare's HSTS page does not document it. Suggested wording: "…and, as observed on 2026-10-11, the zone value replaces the header the site sends."
2. `scripts/setup-check/checks/live-hosts.ts:201`: the `max-age` regex runs over the whole value and is not anchored to the start of a directive, so a made-up directive such as `x-max-age=5` would match. Harmless in practice. Parsing `max-age` from the already-split `directives` array would make it exact.
3. `scripts/setup-check/checks/live-hosts.ts:131`: in the `nextAction`, "its Zone HSTS section" reads slightly ambiguously. "the Zone HSTS section of docs/setup.md#live-hosts" is clearer. The anchor `#live-hosts` exists (`docs/setup.md:625`), and the subsection sits under it.
4. `tests/unit/setup-check/checks/live-hosts.test.ts:191-211`: all five new `missing` cases share the regex `/Strict-Transport-Security|HSTS/i`. So the max-age=0 case and the no-includeSubDomains case do not prove which problem was found. Optional: match `/includeSubDomains/` and `/max-age/` there.
5. The red runs are not recorded in the commit bodies. The test commits (c0054cc, d5626ba) come before the fix commits, and the review reproduced the red run, so Principle I holds. The evidence lives only in the implement summary.

## Checks made

- **Scope (acceptance 9):** the diff lists only the plan, `docs/setup.md`, `scripts/setup-check/checks/live-hosts.ts`, `scripts/setup-check/items.ts`, `tests/unit/setup-check/checks/live-hosts.test.ts`, `tests/unit/site/headers.test.ts`, `worker/src/http.ts` and `worker/test/router.test.ts`. It touches no page, baseline, workflow, `wrangler.jsonc`, constitution or skill.
- **Red first (acceptance 1):** the tests were replayed at d5626ba, before W3/W4, in a scratch worktree. 6 failed out of 46: the five new `missing` cases and "the Worker's HSTS fallback matches the site's (#155)". The router assertion is red there by construction (the old value has no includeSubDomains).
- **Green now:** `vitest run tests/unit/setup-check/checks/live-hosts.test.ts tests/unit/site/headers.test.ts tests/unit/setup` → 36 files, 456 tests passed. From `worker/`, `vitest run test/router.test.ts` → 4 passed. The registry tests (items, docs-structure, skill-behaviour, cli, report) pass with no edits (acceptance 7).
- **Check logic (acceptance 2–5):** HSTS is checked on every hop whose URL is `https:` and on the final response when it is `https:`. `http:` hops are skipped. HSTS is checked after the routing and canonical rules, so routing faults are still reported first. includeSubDomains is matched as a `;`-separated directive, case-insensitively. max-age must be greater than 0 and is not pinned (31536000 is covered by a test). The rule reads headers from responses already fetched, so the call-count and `redirect: "manual"` test is unchanged. The provider lower-cases header keys, so the lookup is right. Every HTTPS hop of the bare→www Ghost chain is covered.
- **Coverage mapping (W2):** the router test no longer pins `max-age=31536000`. The agreement test compares the directive set of `SECURITY_HEADERS["Strict-Transport-Security"]` with the `/*` rule in `public/_headers`. Both are `max-age=31536000; includeSubDomains`, so the exact Worker value is still guarded, relative to the site's reviewed value. The router test still proves a real Worker response carries includeSubDomains. No check is weakened.
- **Project boundary:** the root test imports `worker/src/http` (without `.ts`, which the resolver accepts). Root tests already import from `worker/src` in `config-files.test.ts` and `source.test.ts`. `worker/src/http.ts` has no imports. Root `tsc --noEmit` reports nothing for the touched files. The eslint `worker/**` block only adds type-aware rules and imposes no boundary rule.
- **Shared wording / docs/testing.md:** no pipeline skill is touched, and no test layer moved, so `docs/testing.md` needs no change.
- **Docs prose:** `### Zone HSTS` sits between the "Since #156" paragraph and `### Live swap`. It covers the dashboard path, the four values, both hosts including the bare 301, that plain HTTP carries none, both fallbacks and that they must match, the preload reason and the rollback. The text is plain and accurate apart from LOW 1. "How it will be confirmed" and the `confirmedBy` seed each gain the planned clause.

## Before / after measurement

| Measure | Before (32ec29d, plan) | After (8d46962, 2026-10-11) |
| --- | --- | --- |
| `https://www.doncoleman.ca/` | 200, `max-age=15552000; includeSubDomains` | 200, `max-age=15552000; includeSubDomains` |
| `https://doncoleman.ca/` | 301, same HSTS | 301, `max-age=15552000; includeSubDomains` |
| www Ghost address | 301, same HSTS | 301, `max-age=15552000; includeSubDomains` |
| `https://www.doncoleman.ca/api/nope` | 404, same HSTS (zone replaces Worker's) | 404, `max-age=15552000; includeSubDomains` |
| `http://www.doncoleman.ca/`, `http://doncoleman.ca/` | 301, no HSTS | 301, no HSTS |
| `worker/src/http.ts` HSTS | `max-age=31536000` | `max-age=31536000; includeSubDomains` |
| `git grep -i strict-transport scripts/setup-check` | nothing | `live-hosts.ts` reads and checks it |
| `git grep -i "hsts\|strict-transport" docs/setup.md` | nothing | `### Zone HSTS` + confirmation sentence |
| `pnpm setup:check --item live-hosts` | complete (no HSTS rule) | complete, summary adds "every HTTPS response carries HSTS with includeSubDomains" |

## Follow-ups for the PR body

- **Deferred decision: HSTS preload.** Decide on HSTS preload once zone HSTS has run a few weeks without problems: raise max-age to ≥ 12 months, turn Preload on, submit to the preload list. Removing a domain from the list is slow, and the list covers every subdomain.
- The LOW items above (observed-behaviour wording, anchored max-age parse, `nextAction` wording, sharper test regexes). Optional, and not blocking.
