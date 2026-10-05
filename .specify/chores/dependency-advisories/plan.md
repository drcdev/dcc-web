# Chore plan: dependency-advisories (issue #92)

Branch: `chore/dependency-advisories`, from `main` at d150380 (after #102 merged).
Issue: https://github.com/drcdev/dcc-web/issues/92. The PR body says `Closes #92`.

## Goal

GitHub should tell Don about vulnerable dependencies and open fix PRs for them. The one open
audit finding should be cleared, and the stale release-age exclusions should go
([#92](https://github.com/drcdev/dcc-web/issues/92), with the scope Don trimmed in the issue
comments). Advisories come from GitHub's own Dependabot alerts and security updates. There is
no scheduled `pnpm audit` job. The finding is GHSA-ch52-4w7c-c8xp (`http-cache-semantics`
<=4.2.0, high), which comes in through Astro. The fix is pnpm's own audit fix, reviewed in the
PR. All 14 `minimumReleaseAgeExclude` entries are stale and are deleted. pnpm 11's built-in
release-age delay and the `allowBuilds` list stay as they are. The setup check gains a
mechanical check that Dependabot security updates are on. Don chose (D1 below) monthly, grouped
Dependabot version updates for GitHub Actions only, set in `.github/dependabot.yml`. Nothing on the site changes: the built
pages are the same before and after.

## Acceptance

Mechanical criteria (the review phase checks each one):

1. **Audit is clean.** `corepack pnpm audit` exits 0 and prints no vulnerabilities (before: exit
   1, 1 high).
2. **Fixed version is in the lockfile.** `pnpm-lock.yaml` resolves `http-cache-semantics` only
   to a version >= 4.2.1 (expected `4.3.0`, the only patched release), on both paths
   (`astro>http-cache-semantics` and `@astrojs/mdx>astro>http-cache-semantics`). No `4.2.0`
   entry remains.
3. **No stale exclusions.** `pnpm-workspace.yaml` has no `minimumReleaseAgeExclude` key (or an
   empty one). `allowBuilds` (`esbuild`, `workerd`) and `packages` (`worker`) are
   byte-identical. No `minimumReleaseAge` key is added.
4. **Frozen install still works.** `corepack pnpm install --frozen-lockfile` succeeds locally
   without the exclusions (pnpm re-checks the release age of every lockfile entry on install),
   and so does CI's install step.
5. **Setup check covers Dependabot.** Unit tests for item 9 (W1) are seen failing before the
   check changes, then pass. `pnpm setup:check --item github-secret-scanning` reports
   **complete** against the live repository (where `dependabot_security_updates` is already
   `enabled`).
6. **Dependabot config (D1 = C).** `tests/unit/ci/dependabot.test.ts` is seen failing before
   `.github/dependabot.yml` exists, then passes. The file configures only `github-actions`,
   monthly, in one group.
7. **Nothing a reader sees changes.** No file under `src/`, `public/` or `worker/src/` changes,
   and no visual baseline changes.
8. **Scope of the diff:** `git diff --name-only main` lists only `pnpm-workspace.yaml`,
   `pnpm-lock.yaml`, `scripts/setup-check/checks/github-secret-scanning.ts`,
   `scripts/setup-check/items.ts`, `docs/setup.md`,
   `tests/unit/setup-check/checks/github-secret-scanning.test.ts`, the two
   `tests/fixtures/providers/github/repo-settings-secret-scanning-*.json` fixtures, and
   `.specify/chores/dependency-advisories/**`, `.github/dependabot.yml` and
   `tests/unit/ci/dependabot.test.ts`. Not `package.json`, `worker/package.json` or
   `CLAUDE.md`.
9. `pnpm run verify:quick` is green, then the full gate before the PR.

**Before measurement** (at d150380, Node 24.4.1, pnpm 11.15.1 through corepack, 2026-10-04):

| What | Before |
|---|---|
| `corepack pnpm audit` | exit 1: **1 high**, GHSA-ch52-4w7c-c8xp, `http-cache-semantics` vulnerable `<=4.2.0`, patched `>=4.2.1`, paths `.>astro>http-cache-semantics` and `.>@astrojs/mdx>astro>http-cache-semantics` |
| `http-cache-semantics` in the lockfile | `4.2.0` only, through `astro@7.3.5` (`^4.2.0`) |
| Published `http-cache-semantics` versions >= 4.2.1 | `4.3.0` only, published **2026-10-04T02:56Z**. It is within `^4.2.0`, so no override is needed to reach it. |
| Astro release that clears it | none: `astro@7.3.5` (latest stable) and `7.4.0-beta.1` both ask for `^4.2.0`, which already allows 4.3.0 |
| Runtime reach | none: `astro.config.mjs` sets no `image.domains` or `remotePatterns`, so Astro's remote-image cache never runs |
| `minimumReleaseAgeExclude` entries | **14, all stale**: 11 typescript-eslint `8.71.0` packages (published 2026-09-28), `wrangler@4.143.0 \|\| 4.144.0` (4.144.0 published 2026-09-29; 4.143.0 is not in the lockfile), `@cloudflare/vitest-plugin@1.3.3` and `miniflare@5.20260926.1-alpha` (2026-09-29). All are more than the 1-day window old. |
| `minimumReleaseAge` | not set anywhere (`pnpm-workspace.yaml`, `package.json`, no `.npmrc`); pnpm 11's built-in default of **1440 minutes** applies (non-strict, because it is not set explicitly) |
| Dependabot alerts (`GET repos/drcdev/dcc-web/vulnerability-alerts`) | **204: already on** |
| `security_and_analysis.dependabot_security_updates` | **already `enabled`** |
| `.github/dependabot.yml` | absent; no Dependabot PR has ever been opened (`gh pr list --author app/dependabot --state all` is empty) |
| Setup item 9 (`github-secret-scanning`) | checks secret scanning and push protection only |

Corrections to the issue: it says Dependabot alerts and security updates are off. Both are
already on, so Don's manual step comes down to confirming them, and the setup check (W1) now
does that. The audit notes said the patched version is 4.2.1. No 4.2.1 was ever published, and
the first patched release is 4.3.0. GitHub's advisory record lists `first_patched_version: null`
while the npm bulk advisory endpoint that `pnpm audit` reads says `>=4.2.1`.

## Scope

**In:**

- `pnpm-lock.yaml`: `http-cache-semantics` 4.2.0 → 4.3.0 (W2).
- `pnpm-workspace.yaml`: delete the 14 stale exclusions and add a short comment stating the
  policy (W3).
- Setup item 9: also require Dependabot security updates (`scripts/setup-check/checks/github-secret-scanning.ts`,
  `scripts/setup-check/items.ts`, `docs/setup.md` §9, its unit test and two fixtures) (W1).
- `.github/dependabot.yml` (GitHub Actions only, monthly, grouped) and its unit test (W4).
- This plan, and the review report later.

**Out:**

- A scheduled `pnpm audit` workflow or any audit step in CI (Don ruled it out).
- Bumping Astro, pnpm or any direct dependency. `package.json` and `worker/package.json` are
  not edited.
- Setting `minimumReleaseAge` explicitly, `minimumReleaseAgeStrict` or `trustLockfile`. The
  built-in default stays.
- A new numbered setup item. Item 9 is widened instead, so no item is renumbered (33 items would
  touch about ten tests and every "of 32" string).
- `CLAUDE.md` (it still describes the major-change flow that #85 retired) and the
  `major-change.yml` workflow.
- Repository settings: Dependabot alerts and security updates are already on. Nothing to
  toggle.

**Follow-ups for the PR body:**

- **First-party pruning of exclusions.** pnpm 11.22.0 added `minimumReleaseAgeExcludePrune`. With
  it on, every install drops `minimumReleaseAgeExclude` entries the lockfile no longer resolves,
  so the list cannot go stale again. It needs a `packageManager` bump from 11.15.1, which is a
  dependency change, so it is not done here.
- **Is 4.3.0 the real fix?** The npm advisory says `>=4.2.1` is patched, but GitHub's advisory
  lists no patched version. Upstream's 4.3.0 commits (2026-10-03/04) are "Fix: handle Vary
  wildcard and inherited headers", "Simplify vary vs inherited properties" and "Expose response
  status"; none names `max-stale`. The audit is clean either way, and the code path is
  unreachable here (no remote images). Watch the advisory for an update.
- **Bot PRs and the old major-change workflow.** `major-change.yml` posts a commit status with
  `statuses: write`. GitHub gives Dependabot-triggered workflows a read-only token unless the
  workflow asks for more, so that status may fail to post on a Dependabot PR. If the
  `major-change-approval` check is still required on `main`, a bot PR could get stuck. This
  applies to the security-update PRs that are already enabled, not only to D1's version
  updates. Retiring that workflow belongs with the #85 follow-up.
- **Dependabot and pnpm 11.** Dependabot's npm/pnpm updater has not run on this repo yet. Its
  support for pnpm 11 with settings in `pnpm-workspace.yaml` (lockfile v9) is unverified. CI's
  `--frozen-lockfile` install re-checks release age and the lockfile, so a bad bot lockfile
  fails the gate rather than merging.

## Decisions

### D1: Dependabot version updates (decided: C)

**Don's answer: C. Monthly, grouped, GitHub Actions only.** W4 is unconditional and the PR is a
major change (see the Constitution Check). The options as they were put to him:

Security updates are already on and need no config file. They open a PR only when an advisory
hits a dependency. The question is whether Dependabot should **also** open routine
version-update PRs. Every bot PR waits for Don's approval through the ruleset and runs the full
gate (about 6 minutes of CI, because `.github/` and lockfile changes are not skip-safe).

- **A. None.** No `dependabot.yml`. Only advisory-driven PRs arrive. Upgrades stay deliberate,
  done by hand or by an agent on request, which fits exact pins and the release-age delay. Cost:
  zero extra PRs. The SHA-pinned Actions (`actions/checkout`, `actions/setup-node`,
  `actions/upload-artifact`, `pnpm/action-setup`) only move when someone remembers.
- **B. Monthly, grouped, all ecosystems** (`npm` for `/` and `/worker`, plus `github-actions`):
  at most one npm group PR and one Actions group PR a month, plus separate PRs for majors if
  they are split out. This adds bot lockfile churn against exact pins, depends on Dependabot
  handling pnpm 11 correctly (unverified), and largely duplicates the hand upgrades Don already
  runs.
- **C. Monthly, grouped, GitHub Actions only** (`package-ecosystem: github-actions`,
  `directory: /`, `schedule.interval: monthly`, one group with `patterns: ["*"]`): at most one PR
  a month, and only when an Action has released. It keeps the SHA pins current (Dependabot
  rewrites the SHA and the `# vX.Y.Z` comment). It never touches the lockfile, so pnpm 11
  support does not matter. npm stays deliberate, with advisories covered by security updates.

**Chosen: C** (it was also the recommendation). It keeps Don's approval load to at most one
small PR a month, covers the one ecosystem nobody updates by hand, and stays out of the pnpm
lockfile, where exact pins and the release-age delay already govern upgrades.

### Judgment calls made in this plan (no decision needed unless Don disagrees)

- **J1: Lockfile update instead of an override.** The issue allows "a reviewed `pnpm.overrides`
  pin to `>=4.2.1`". The patched release 4.3.0 already satisfies Astro's own `^4.2.0`, so pnpm's
  first-party `pnpm audit --fix=update` clears the finding by updating the lockfile alone. That
  leaves no override in `pnpm-workspace.yaml` that would go stale and need removing later, which
  is the same kind of stale entry this chore cleans up. Fallback, only if `--fix=update` leaves
  4.2.0 in place: plain `pnpm audit --fix`, which writes the override, after deleting any
  `minimumReleaseAgeExclude` entry that `--fix` adds alongside it.
- **J2: Widen setup item 9 instead of adding item 33.** This is the same API call
  (`repos/{owner}/{repo}` → `security_and_analysis`) and the same Settings page (Code security).
  It changes the title to "GitHub secret scanning and Dependabot" and keeps the id and anchor
  `github-secret-scanning`, which tests and the walkthrough treat as fixed.
- **J3: Check `dependabot_security_updates` only, not the `vulnerability-alerts` endpoint.**
  That endpoint answers 204 with an empty body when alerts are on and 404 when they are off. The
  setup-check GitHub provider parses JSON and turns every 404 into "could not check", so reading
  it would mean changing the shared provider. GitHub's Code security settings only let security
  updates be on while Dependabot alerts are on, so `enabled` there implies alerts are on. The
  review phase confirms this against GitHub's docs (Docs citations). If the docs do not support
  it, the check stays as planned and the docs text in §9 tells Don to confirm alerts by hand.

## Constitution Check

- **I. Test-First:** W1 and W4 write unit tests first and see them fail. W2 and W3 change
  dependency resolution and config with no logic. Their checks are existing tool checks (`pnpm
  audit` exit code, `pnpm install --frozen-lockfile`, and the full gate, including the build that
  uses Astro), recorded red-then-green in the implement summary.
- **II. Automated Release Gate:** no check is skipped or weakened. The release-age delay stays
  in force, and with no exclusions left it applies to every package again. CI's frozen install
  and gate are unchanged.
- **III. Human Review for Major Changes:** "changes CI, deployment or infrastructure
  configuration" **fires**, because `.github/dependabot.yml` (D1 = C) makes GitHub open PRs on a
  schedule. No other criterion fires: no dependency is added, removed or replaced (one
  transitive version moves inside its declared range), and there is no contact-data, design,
  cost or constitution change. Repository settings are unchanged (already on), and
  `pnpm-workspace.yaml` loses only inert exclusions. Verdict: **major**. Auto-merge is off, and
  the PR body says why.
- **IV. First-Party Before Custom:** first-party options throughout: GitHub's Dependabot alerts
  and security updates (no custom audit job), pnpm's `audit --fix=update` (or `audit --fix`) to
  clear the finding instead of hand-editing the lockfile, pnpm's built-in `minimumReleaseAge`
  default, and pnpm's `minimumReleaseAgeExcludePrune` named as the follow-up instead of a
  custom stale-entry test. The setup-check change extends an existing check. No Astro usage
  changes, so no Astro Docs MCP lookup is needed.
- **V. Static by Default:** unchanged; nothing ships differently.
- **VI. Content as Files:** unchanged.
- **VII. Private Data:** unchanged. Item 9 still checks secret scanning and push protection, and
  no secret is read or printed.
- **VIII. Cloudflare Best Practices:** unchanged; no Worker config change.
- **IX. Cost Ceiling:** unchanged. Dependabot and Actions minutes on a public repository are
  free.
- **X. Accessible, Fast and Private:** unchanged; no page output changes.
- **XI. Spec Kit Workflow:** chore branch and `.specify/chores/dependency-advisories/` per
  `/chore`. Parallel risk: `pnpm-lock.yaml` and `pnpm-workspace.yaml` are shared by any sibling
  worktree that changes dependencies. Merge `origin/main` before the gate and regenerate the
  lockfile with `pnpm install` if it conflicts. Never hand-merge the lockfile.

## Work items

### W1: Setup item 9 also requires Dependabot security updates (test first)

- [x] W1 done
- **Files:** `tests/unit/setup-check/checks/github-secret-scanning.test.ts`,
  `tests/fixtures/providers/github/repo-settings-secret-scanning-on.json` and `…-off.json`,
  `scripts/setup-check/checks/github-secret-scanning.ts`, `scripts/setup-check/items.ts`
  (item 9's `title`, `purpose`, `where`, `confirmedBy`), `docs/setup.md` §9 (heading text,
  "What it is for", "Where to do it" and "How it will be confirmed"; the `{#github-secret-scanning}`
  anchor is unchanged).
- **Test:** new-first. **Layer: unit**, the cheapest layer that can observe it: the check is a
  pure function of a faked `ctx.github.api` response, the same pattern as the existing cases. No
  second layer.
- **Cases (written first, seen failing):**
  1. The "on" fixture gains `dependabot_security_updates: { status: "enabled" }`, and the
     existing complete case stays complete.
  2. New: secret scanning and push protection on, `dependabot_security_updates` `disabled` →
     `missing`, summary matches `/dependabot/i`, `nextAction` matches `/code security/i`.
  3. New: `dependabot_security_updates` absent → `missing` (absent is not enabled, same rule as
     the other two fields).
  4. The "off" fixture gains `dependabot_security_updates: { status: "disabled" }`; the existing
     off case still reports secret scanning.
  5. Update the `RepoSettingsFixture` interface in the test.
- **Check change:** add `dependabot_security_updates?: { status?: string }` to `RepoSettings`
  and push `"Dependabot security updates"` onto `off` when it is not `enabled`. Keep the
  existing summary and `nextAction` sentence shapes; the next action names both settings.
  Update the head comment.
- The `github-major-label` test and `next-action.test.ts` also load these fixtures. Adding a
  field is safe for them; confirm they still pass.
- Run `pnpm setup:check --item github-secret-scanning` against the live repo: expect complete
  (acceptance 5). Do not print any token.

### W2: Clear GHSA-ch52-4w7c-c8xp with pnpm's audit fix

- [ ] W2 done
- **Files:** `pnpm-lock.yaml` (and `pnpm-workspace.yaml` only on the J1 fallback).
- **Test:** existing tool check. `corepack pnpm audit` exit 1 (red, recorded above) → exit 0.
  No unit test: a test pinning one advisory's version would guard one CVE, not a behaviour, and
  Dependabot alerts are the standing guard. **Layer: n/a** (tool check, not a test file).
- **Timing (satisfied):** 4.3.0 was published at 2026-10-04T02:56Z and passed pnpm's
  1440-minute default at 2026-10-05T02:56Z, which has now gone by. W2 is not blocked. Do
  **not** add a `minimumReleaseAgeExclude` entry for it. If `--fix=update` still keeps 4.2.0,
  confirm the clock with `npm view http-cache-semantics time` before using the fallback.
- **Steps:** with the `.nvmrc` Node active (`node -v` → v24), run `corepack pnpm install
  --frozen-lockfile` (the worktree has no `node_modules`), then `corepack pnpm audit
  --fix=update`. Check that `git diff pnpm-lock.yaml` touches only `http-cache-semantics`
  (version and integrity, both snapshot lines). Check that `pnpm-workspace.yaml` is unchanged by
  the fix. Then run `corepack pnpm audit` (exit 0).
- **Fallback (J1):** if 4.2.0 remains, run `corepack pnpm audit --fix`, keep the override it
  writes (expected form `"http-cache-semantics@<=4.2.0": ">=4.2.1"`), delete any exclusion it
  adds, and re-run `corepack pnpm install`. Record which path was taken.

### W3: Delete the stale release-age exclusions

- [ ] W3 done
- **Files:** `pnpm-workspace.yaml`.
- **Test:** existing. `corepack pnpm install --frozen-lockfile` passes locally after the
  deletion (pnpm re-checks every lockfile entry's release age on install, unless
  `trustLockfile` is set, and it is not), and CI's install step does too. The existing
  `config-files.test.ts` "lists worker in pnpm-workspace.yaml packages" still passes. **Layer:
  n/a** (no behaviour: the exclusions name versions that are all older than the window, so
  removing them changes no resolution).
- Remove the whole `minimumReleaseAgeExclude` block. Above `allowBuilds`, add a two-line YAML
  comment: pnpm 11's built-in `minimumReleaseAge` (1 day) applies, and a
  `minimumReleaseAgeExclude` entry is added only for one specific upgrade and removed in the PR
  after it. Keep `packages` and `allowBuilds` byte-identical.
- If the frozen install unexpectedly fails on release age, stop and record which entry it
  names. The dates above say it should not.

### W4: `.github/dependabot.yml` (D1 = C: GitHub Actions only, monthly, grouped)

- [ ] W4 done
- **Files:** `tests/unit/ci/dependabot.test.ts` (new), `.github/dependabot.yml` (new).
- **Test:** new-first. **Layer: unit** (unit over config): the file's only observable effect
  before GitHub reads it is its text, and the repo's other workflow tests read YAML as text the
  same way (`tests/unit/ci/workflows.test.ts`, no YAML library). No second layer: GitHub
  validates the file on push, and the PR's "Dependabot" check shows parse errors.
- **Cases (C):** the file exists; `version: 2`; exactly one `package-ecosystem:` and it is
  `"github-actions"` with `directory: "/"`; `interval: "monthly"`; a `groups:` block with
  `patterns:` containing `"*"`; no `package-ecosystem: "npm"`.
- **Shape (C):**

  ```yaml
  version: 2
  updates:
    - package-ecosystem: "github-actions"
      directory: "/"
      schedule:
        interval: "monthly"
      groups:
        actions:
          patterns:
            - "*"
  ```

  Add a short head comment saying security updates need no config and are on in Settings, and
  that each bot PR waits for Don's approval through the ruleset. Do not add `cooldown` for
  `github-actions`; the options reference lists cooldown per ecosystem, so confirm support
  before using it. Leave `open-pull-requests-limit` at its default of 5; one group keeps it at
  one PR.
- `.github/` is in CODEOWNERS, so the review request is automatic.

## Docs citations

pnpm (the tool whose usage changes; pnpm 11.15.1 via `packageManager`):

- `overrides`, `minimumReleaseAge` (Default **1440 (since v11)**, minutes),
  `minimumReleaseAgeExclude` (names, patterns, and `pkg@a || b` version lists since v10.19.0),
  `minimumReleaseAgeExcludePrune` (added v11.22.0; follow-up), `minimumReleaseAgeStrict`
  (default true only when `minimumReleaseAge` is set explicitly; the built-in default is
  non-strict) and `trustLockfile` (default false: install re-applies `minimumReleaseAge` to
  every lockfile entry):
  https://pnpm.io/settings (dependency resolution:
  https://pnpm.io/settings#overrides, #minimumreleaseage, #minimumreleaseageexclude,
  #minimumreleaseageexcludeprune, #minimumreleaseagestrict, #trustlockfile). Fetched from
  `pnpm/pnpm.io` `docs/settings/dependency-resolution.md` on 2026-10-04. The page tracks the
  latest pnpm, so version notes were read against 11.15.1.
- `pnpm audit`, `--fix` (writes overrides to `pnpm-workspace.yaml`, and when
  `minimumReleaseAge` is set it also writes exclusions) and `--fix=update` (added v11.0.0,
  updates the lockfile instead): https://pnpm.io/cli/audit.
- Supply-chain defaults (1440-minute default, `minimumReleaseAge: 0` to opt out):
  https://pnpm.io/supply-chain-security.

GitHub:

- `dependabot.yml` options (`version: 2`, `package-ecosystem` values including `npm` and
  `github-actions`, `directory`/`directories`, `schedule.interval: monthly`, `groups` with
  `patterns` and `applies-to` (default `version-updates`), `open-pull-requests-limit` (default
  5; security updates are not subject to it), `cooldown`):
  https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference.
- Security updates work without a `dependabot.yml`, and grouped security updates need the
  dependency graph, alerts and security updates all on:
  https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/configuring-dependabot-security-updates.
- Alerts: https://docs.github.com/en/code-security/dependabot/dependabot-alerts/configuring-dependabot-alerts.
  The REST `security_and_analysis` object read by item 9:
  https://docs.github.com/en/rest/repos/repos#get-a-repository. J3's assumption (security
  updates on implies alerts on) is checked against these pages in review.

Astro: no Astro usage changes. The advisory is cleared below Astro, inside its declared range,
so no Astro Docs MCP lookup is cited.

## Risks

- **Release-age window (W2).** This has cleared: 4.3.0 turned a day old at 2026-10-05T02:56Z.
  Never add an exclusion for it.
- **4.3.0 is a minor release published today.** Its changes are in Vary handling plus a new
  `status` getter, all additive, so Astro's use (remote-image cache policy) should be
  unaffected, and the build and full gate exercise Astro. The path is unreachable at runtime
  here anyway.
- **Lockfile conflicts with sibling worktrees.** Merge `origin/main` before the gate and
  regenerate rather than hand-merge.
- **J3 assumption.** If GitHub ever allowed security updates on with alerts off, item 9 would
  report complete with alerts off. Low risk: the Settings UI ties them together, and alerts are
  on today (204).
- **Bot PRs and the major-change status (follow-up).** This could block Dependabot PRs in
  general, not only those from D1.
- **Worktree port collisions** (shared 4321/4322) during the full gate. Check with `lsof -i
  :4321` first.
