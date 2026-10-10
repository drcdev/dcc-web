# Review report: retirement-dns-headers (#93, launch.md T9)

Two review rounds on 2026-10-09/10; saved by the orchestrator because review subagents may not
write files. Range: `67fc616...HEAD` (54da898 plan, c609b75 headers, 28629a3 dns, 2236f1a docs,
7f12058 round 1 fixes).

## Round 1 — CRITICAL 0, HIGH 1, LOW 4

- W1–W7 done as planned; the diff touches exactly the files acceptance 7 lists.
- Test-first cases assert the real guarantees: HSTS `includeSubDomains` on `/*`; the Ghost web records
  `drop` with a reason; `_dmarc` TXT and apex CAA kept. Each fails against the 67fc616 inputs by
  construction.
- **Coverage mapping, all true:**
  - `REVIEW_HOST_RULE`: the rule was deleted on purpose. The loop over every https:// host rule
    still requires noindex, and `/*` still has no X-Robots-Tag.
  - `new.doncoleman.ca` regexp in `indexing.test.ts`: the workers.dev rule and the site-wide check
    remain at the build layer.
  - `launch-doc.test.ts` keep filters: widened, not removed. L8 and Part E still iterate the two
    Ghost web records, and `web.length === 2` is asserted.
- Live checks: `dns-records-parity`, `mail-records` and `live-domain-ghost` are all complete.
- Unit tests: 85 files, 1278 tests. Build indexing test: 29 passed, 1 skipped (main-only skip,
  already there).
- **HIGH-1** (fixed in 7f12058): the five new baseline records had `ttl: 3600`, but Cloudflare
  reports Auto. The plan takes the Cloudflare value, so they now carry `ttl: 1`.
- **LOW-1:** `scripts/setup-check/checks/dns-records-parity.ts:266`. The switched-phase summary
  still says "the Ghost web records were replaced at launch". Stage 6 (#101) cleanup.
- **LOW-2:** `tests/unit/setup/launch-doc.test.ts:237-242`. The Part E loop has no non-empty
  guard; L8's length check covers it today.
- **LOW-3:** the implement-phase red runs are recorded in the orchestrator output only.
- **LOW-4:** the `docs/cutover-plan.md` wrap width; partly fixed in 7f12058.
- Out of scope: `docs/setup.md:576` still mentions `new.doncoleman.ca` in the Turnstile item (stage 6).

## Round 2 — CRITICAL 0, HIGH 0, LOW 3

- HIGH-1 is fixed: exactly the `_dmarc` TXT and four CAA records moved from 3600 to 1. The
  google-site-verification TXT stays at 3600, and nothing else in the baseline changed.
- Don's decision (2026-10-09): Flux stays in place, unarchived, and T8 is complete.
  `docs/cutover-plan.md` ticks T8, `tasks.md` ticks T103, and `docs/design-source.md` no longer
  says "being retired" or "archived". The pinned phrases still pass.
- **L1:** `plan.md` still has pre-decision T8 wording at lines 102-104, 272-274, 300-302 and 309;
  the "Review round 1 fixes" section overrides it.
- **L2:** `docs/cutover-plan.md:160` is 124 characters long.
- **L3** (information only): spec 011 still requires that Flux be archived:
  - `spec.md` 197-213, 440-443, 543, 595 (FR-023);
  - `plan.md:109`;
  - `contracts/launch-walkthrough.md:91-92`;
  - `checklists/privacy-security.md:37`;
  - `tasks.md` T079.

  These are historical requirements; Don's decision departs from them. Noted in the PR body, not
  edited.
- Unit tests: 85 files, 1278 tests. `dns-records-parity`: complete, with no TTL notes for the new
  records.

## Before / after

- **Before (main):** `dns-records-parity` is **missing**: `_dmarc` TXT is not in the baseline. HSTS
  covers the bare domain only. A `new.doncoleman.ca` noindex rule exists for a host that no longer
  resolves.
- **After:** parity is complete, and the only informational lines left are:
  - TTL notes on five iCloud records (14400 against Auto);
  - the Cloudflare-only `AAAA 100::` records on the apex and www.

  HSTS has `includeSubDomains` (no preload), and the dead noindex rule is gone.

## Principle III

**Major:** this changes deployment/infrastructure configuration (`public/_headers`, the header
contract). No other criterion fires. No `[PREVIEW-CHECK]` items: the preview's HSTS header can be
checked with `curl -sI`.

## Follow-ups for the PR body

- DMARC tightening, about 4 weeks after 2026-10-09: `p=none` → `quarantine` → `reject`, each a
  small baseline `/chore`.
- Optional: move the apex Custom Domain into `wrangler.jsonc`. It is out of scope because of the
  risk to the deploy, preview and e2e configs.
- Stage 6 (#101):
  - remove `reviewHost`, `review-address-removed`, `live-domain-ghost`, `GHOST_WEB_TYPES`,
    `replacedAtLaunch` and its summary sentence, and `ghostTargets`;
  - slim the baseline to the must-exist records;
  - delete `docs/cutover-plan.md`.
- HSTS `preload` is decided separately.
