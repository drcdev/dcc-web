# Review report: retire-launch-checks

Reviewer: fresh-eyes review phase, 2026-10-09, against `git diff main...HEAD` (13 commits, W1–W13).
Saved by the orchestrator: the review subagent could not write this file.

## Verdict

**No CRITICAL or HIGH findings.** All 13 work items are done as planned, with nothing beyond them.
No check is weakened. The Principle III verdict (not major) holds against the real diff. The LOW
findings are stale comments, leftover names and one optional note improvement. All nine were fixed
on the branch after the review (see "Resolution").

| Severity | Count |
| --- | ---: |
| CRITICAL | 0 |
| HIGH | 0 |
| LOW | 9 |

## Test and tool runs (local, this phase)

- `corepack pnpm exec vitest run tests/unit tests/component`: **158 files, 2,437 tests, all
  passed**.
- `corepack pnpm exec tsc --noEmit`: the only errors are the known `TS2307 Cannot find module
  '*.astro'` noise. There are none in `scripts/`, `tests/unit/` or `src/lib/`.
- `corepack pnpm exec eslint scripts tests/unit tests/build tests/e2e src/lib`: clean.
- The full verify gate and Playwright were not run locally. Don chose CI as the gate.

## Checklist

- **W1–W13 done as planned, nothing beyond:** yes.
  - The registry has 16 items in the acceptance-2 order.
  - `docs/setup.md` has exactly the 16 `## N. … {#id}` sections in that order.
  - Every file in acceptance 6 is deleted.
  - These stay: `scripts/site-check/crawl.ts`, `scripts/site-check/preview.ts` and their tests,
    the `cloudflare` devDependency, the setup-walkthrough skill and `READ_BY_CHECKS`.
- **New-first tests present and green, all at the unit layer as the plan names:**
  - W2: the web-analytics apex case.
  - W3: the parity "compares the whole zone without reading the launch phase" case.
  - W5: the config schema case.
  - W7: the strict baseline schema and the must-exist invariants.
  - W8: `contact-bindings.test.ts`.
- **Coverage mappings, spot-checked against the five folded contact tests at `main`:**
  - Every case maps to the new test, or is retired as the plan says.
  - The preview builds and deploy wait is pinned in `tests/unit/site-check/preview.test.ts`.
  - The preview cron is pinned in `tests/unit/site/config-files.test.ts`.
  - The sitemap derivation is pinned in `tests/build/indexing.test.ts`.
  - The page files are pinned in `tests/unit/content/site-pages.test.ts`.
- **No check weakened:**
  - `dns-records-parity` now reports an unbaselined record on any name other than the apex and
    `www` as a Problem.
  - `mail-records` still checks every baseline MX, TXT and `_domainkey` CNAME group at both
    resolvers.
  - The baseline schema is now `.strict()` at both levels, which is stricter than before.
- **Baseline:** `setup/dns-baseline.json` holds exactly the 11 must-exist records, with only
  `type/name/content/priority/ttl`. The live `setup:check --item dns-records-parity` and
  `--item mail-records` both reported complete during W7.
- **Shared wording:** no pipeline skill changed. The only skill edit is `setup-walkthrough`.
- **`docs/testing.md`:** no update needed. No test changed layer.
- **Principle III (not major):** confirmed.
  - `package.json` loses only the `site:check` and `setup:dns-snapshot` scripts, and its
    dependencies are unchanged.
  - `pnpm-lock.yaml`, `.github/`, `wrangler.jsonc`, `astro.config.mjs` and `public/` are unchanged.
- **No visitor-visible change:** under `src/`, the diff is an optional type field in
  `src/lib/site-origin.ts` and an MDX comment in `flux.mdx`. Neither renders, and no visual
  baseline changed.
- **Stale references:** the sweep found one comment (LOW-1), plus the intended negative schema
  test.
- **`docs/setup.md`:** reads coherently as a 16-item steady-state doc. The DMARC note cites #136.

## Findings

### LOW

1. `scripts/setup-check/checks/shared.ts:124`: the comment names `live-domain-ghost` among the TXT
   comparers.
2. `scripts/setup-check/checks/dns-records-parity.ts:8–9`: the header says Cloudflare-only records
   never block completion, which contradicts lines 10–11.
3. Launch-era comments remain in `providers/http.ts:2`, `checks/preview-noindex.ts:3` and
   `types.ts:36,169`.
4. `tests/unit/content/site-pages.test.ts` still uses the `LAUNCH` constant name.
5. Fixture wording: the `redact.test.ts` waiting fixture is titled "Bare domain…", and
   `web-analytics.test.ts` still has a `reviewAddressCompleteContext` helper.
6. `contact-bindings.test.ts`: the "migrations not applied" case dropped the `nextAction` `/Retry/`
   assertion.
7. `docs/setup.md:14–16`: the glossary defines **nameserver**, which nothing uses now.
8. Redundant wording in `docs/setup.md` §15 and §5, and in `SKILL.md` (after-merge scope).
9. The T024/T088 close-out note can cite the confirming CI run, 37998017533.

## Resolution

All nine LOW findings were fixed in a follow-up commit on the branch before the PR opened.

## Measurement (before at e6bf21b, after at HEAD)

| What | Before | After |
| --- | ---: | ---: |
| `scripts/setup-check/**/*.ts` (lines) | 5,597 | 3,840 |
| `tests/unit/setup-check/**` + `tests/unit/setup/**` (lines) | 7,371 | 4,959 |
| `tests/fixtures/providers/**/*.json` (files) | 76 | 58 |
| `docs/launch.md` | 714 | deleted |
| `docs/setup.md` | 973 | 615 |
| `docs/cutover-plan.md` | 223 | deleted |
| `.claude/skills/setup-walkthrough/SKILL.md` | 207 | 156 |
| `setup/dns-baseline.json` | 200 | 81 |
| `scripts/site-check/cli.ts` + test | 111 + 88 | deleted |
| `scripts/setup-check/dns-snapshot.ts` | 137 | deleted |
| `tests/unit/setup/launch-doc.test.ts` | 417 | deleted |
| Test files under `tests/` | 219 | 200 |
| Registry items | 31 | 16 |

Whole branch (W1–W13) is 133 files changed, with 1,899 insertions and 7,018 deletions.

## Follow-ups for the PR body

- **DMARC tightening:** #136.
- **Project `placeholder` picture option:** #137, a separate `/tweak` with a visual-baseline
  refresh.
- **Retire the `waiting` status from the setup-check report contract.** Nothing produces it now.
- **#82, single-Worker previews:** when it lands, revisit the preview half of `contact-bindings`.
- **Scope change:** `mail-records` stays, alongside `dns-records-parity`, as Don decided on
  2026-10-09.
