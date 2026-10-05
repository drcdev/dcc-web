# Review report: dependency-advisories (issue #92)

Reviewed 2026-10-04 with fresh eyes against `plan.md` and `git diff main...HEAD` (84d438c..923bbcd).
The review made no code changes. The harness blocked the review subagent from writing this file,
so the orchestrator saved its returned text and committed it.

## Verdict

All four work items (W1 to W4) are done as planned, and nothing beyond them was added. The diff
touches exactly the files that acceptance 8 allows. Nothing changes in `src/`, `public/`,
`worker/src/`, `package.json`, `worker/package.json`, `CLAUDE.md` or the visual baselines. No
check is weakened. The Principle III verdict still holds against the real diff: **major**,
because `.github/dependabot.yml` is CI and infrastructure config that makes GitHub open PRs on a
schedule. Auto-merge stays off.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **Fixed by the orchestrator.** `docs/setup.md:275` and `scripts/setup-check/items.ts:222` said
   "(which also turns on Dependabot alerts)", which GitHub's docs do not support.
   - GitHub's "About Dependabot security updates" page says only that the feature "is available
     for repositories where you have enabled the dependency graph and Dependabot alerts".
   - That prerequisite does support J3: if security updates are `enabled`, alerts are on.
   - Both places now read "(Dependabot alerts must be on first)", and the setup tests stay green.
2. **Git history does not show the W1 and W4 tests failing first.**
   - Commit 8329ced holds the item 9 tests together with the check change, and 923bbcd holds
     `dependabot.test.ts` together with `dependabot.yml`.
   - The implement summaries record the red runs: W1 had 2 failing cases against the old check,
     and W4 failed 6 of 6 tests with the config file missing. The PR body quotes both.
3. **The local frozen install did not re-check release age.**
   - `pnpm install --frozen-lockfile` printed "Already up to date" because `node_modules` already
     matched, so acceptance 4 is fully proven only by CI's clean install.
   - W3 also ran a `--force` frozen install, which re-fetched all 704 packages with no release-age
     failure.

## Checks performed

| Check | Result |
|---|---|
| W1: `dependabot_security_updates` read; absent or disabled gives `missing`; fixtures updated | yes; the check only got stricter |
| W1 tests at the unit layer, as planned | present and green |
| W2: lockfile moves `http-cache-semantics` 4.2.0 to 4.3.0; no 4.2.0 left; no override | yes (J1 main path, `pnpm audit --fix=update`) |
| W3: no `minimumReleaseAgeExclude`; `packages` and `allowBuilds` unchanged; no `minimumReleaseAge` added | yes; only a two-line policy comment added |
| W4: `version: 2`; one `github-actions` entry at `/`; `monthly`; one group `patterns: ["*"]`; no npm; no cooldown | yes |
| W4 test at the unit layer, as planned | present and green |
| `dependabot.yml` against GitHub's options reference | valid: `monthly` is allowed, `groups.<name>.patterns` accepts `*`, groups apply to version updates by default, cooldown is not listed for GitHub Actions |
| J3 (security updates need alerts) | confirmed by about-dependabot-security-updates |
| Targeted vitest (`tests/unit/setup-check`, `tests/unit/ci`) | 50 files, 574 tests passed |
| `pnpm setup:check --item github-secret-scanning` against the live repo | complete, exit 0 |
| Stale references | only the historical `specs/007-contact-form/*` records mention the exclusion list; left alone |

## Measurement

| What | Before (d150380) | After |
|---|---|---|
| `pnpm audit` | exit 1, **1 high**: GHSA-ch52-4w7c-c8xp (`http-cache-semantics` <=4.2.0) | exit 0, "No known vulnerabilities found" |
| `http-cache-semantics` in the lockfile | 4.2.0 | 4.3.0 |
| `minimumReleaseAgeExclude` entries | 14 (all stale) | 0 |
| Fields setup item 9 requires | 2 | 3 (adds `dependabot_security_updates`) |

## Follow-ups for the PR body

- **pnpm `minimumReleaseAgeExcludePrune`** (pnpm 11.22.0) drops exclusions the lockfile no longer
  resolves on every install. It needs a `packageManager` bump from 11.15.1, which is out of scope
  here.
- **The `major-change.yml` status on Dependabot PRs.** GitHub gives Dependabot-triggered workflows
  a read-only token, so a commit status that needs `statuses: write` may fail to post. If
  `major-change-approval` is still required on `main`, bot PRs could get stuck. Retire the
  workflow with the #85 follow-up.
- **GitHub's advisory record lists no patched version** (`first_patched_version: null`). The npm
  advisory, which `pnpm audit` reads, says `>=4.2.1`. 4.3.0 is the only release after 4.2.0. The
  vulnerable code path is never reached here (no remote images), so watch the advisory for an
  update.
- **Dependabot and pnpm 11** (lockfile v9, settings in `pnpm-workspace.yaml`) is untested for
  security-update PRs. CI's frozen install would fail a bad bot lockfile rather than merge it.
