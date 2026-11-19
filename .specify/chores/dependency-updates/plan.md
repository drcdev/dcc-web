# Chore plan: dependency-updates (ad-hoc, no issue)

Branch: `chore/dependency-updates`, from `main` at 553cb617 (after #210 merged).
No issue. The PR absorbs Dependabot PRs
[#211](https://github.com/drcdev/dcc-web/pull/211) and
[#212](https://github.com/drcdev/dcc-web/pull/212). Both are closed as superseded after this
PR merges (see Scope, Finish step).

**Visual-baseline exception, stated up front.** This chore upgrades the browser that the
visual project runs in: `@playwright/test` 1.63.0 → 1.65.1 moves Chromium from
153.0.8010.12 to 159.0.8154.6. Don approved regenerating the macOS **and** Linux baselines in
this PR (decision at the gate). The prediction, made before any image is regenerated, is
this: some or all of the 78 shots per platform may move from Chromium's text rasterisation,
anti-aliasing and compositing alone. The HTML diff gate (Acceptance 5) proves the markup did
not change. A baseline diff that the HTML or CSS diff can explain is a regression. It stops
the chore and is not refreshed.

## Goal

Bring every npm dependency in the root package and the `worker` workspace up to the newest
release that pnpm 11's built-in one-day `minimumReleaseAge` allows. Exact pins stay. Node
stays on `.nvmrc` 24. Bring every SHA-pinned GitHub Action in `.github/workflows/ci.yml` up to
its latest release. The PR absorbs Dependabot #211 (setup-node v7.1.0, upload-artifact
v7.0.2) and #212 (astro and vite; it failed only because three transitive packages were under
a day old on 2026-11-14, and those are old enough now). It also adds pnpm/action-setup
v6.1.1. Majors follow Don's gate decisions:

- worker Vitest 5 with `@cloudflare/vitest-plugin` 1.8.x is in;
- secretlint 14 is in, and the preset package it no longer needs is removed;
- Sätteri 0.11 is in only if the built HTML is unchanged;
- Playwright 1.65 is in, with fresh baselines on both platforms;
- TypeScript stays at 6.0.3. The evidence is below, and no decision is needed.

Nothing a reader sees changes. The built HTML of every page is the same before and after,
apart from hashed asset names.

## Investigation findings (planning, 2026-11-19 ~15:15Z)

### Release age: what is eligible

pnpm 11 refuses any version published less than 1440 minutes ago. Some "latest" tags are too
new right now. Each work item uses the **newest version that is at least 24 h old when the
item runs**. It checks this with `npm view <pkg> time --json` and never adds a
`minimumReleaseAgeExclude`.

| Package | From | Target (latest) | Published | Fallback if target < 24 h old |
|---|---|---|---|---|
| astro | 7.3.5 | 7.4.13 | 2026-11-18T17:35Z (eligible after 11-19 17:36Z) | 7.4.12 (11-13) |
| @astrojs/mdx | 8.0.2 | 8.1.6 | 2026-11-13 | — |
| @astrojs/markdown-satteri | 0.4.2 | 0.4.10 | 2026-11-13 | — |
| satteri | 0.10.5 | 0.11.7 | 2026-11-07 | — |
| @astrojs/sitemap | 3.7.4 | 3.7.6 | 2026-11-18T17:34Z (eligible after 11-19 17:35Z) | 3.7.5 (11-13) |
| @astrojs/check | 0.9.10 | 0.9.12 | 2026-10-21 | — |
| tailwindcss, @tailwindcss/vite | 4.3.3 | 4.3.5 | 2026-11-06 | — |
| eslint | 10.11.0 | 10.15.0 | 2026-11-13 | — |
| typescript-eslint | 8.71.0 | 8.73.0 | 2026-11-16 | — |
| vitest (root) | 5.0.2 | 5.1.1 | 2026-11-18T07:35Z (eligible now) | — |
| @types/node | 24.19.0 | 24.19.2 (latest 24.x; 26.x excluded on purpose) | 2026-10-09 | — |
| wrangler | 4.149.0 | 4.165.0 | 2026-11-18T21:44Z (eligible after 11-19 21:45Z) | 4.164.0 (11-17) |
| @cloudflare/vitest-plugin (worker) | 1.4.0 | 1.8.5 | 2026-11-18T21:51Z (eligible after 11-19 21:52Z) | 1.8.4 (11-17) |
| vitest (worker) | 4.1.11 | 5.1.1 | 2026-11-18T07:35Z | — |
| cloudflare | 7.2.0 | 7.3.0 | 2026-10-03 | — |
| secretlint | 13.0.6 | 14.0.1 | 2026-11-16 | — |
| @secretlint/secretlint-rule-preset-recommend | 13.0.6 | **removed** (see W5) | — | — |
| @playwright/test | 1.63.0 | 1.65.1 | 2026-11-13 | — |
| @axe-core/playwright | 4.13.0 | 4.14.0 | 2026-10-15 | — |
| typescript | 6.0.3 | **hold 6.0.3** (latest 6.x) | — | — |
| Unchanged, already latest | | `@astrojs/rss` 4.0.19, `sharp` 0.35.5, `eslint-plugin-astro` 3.2.1, `@tailwindcss/typography` 0.5.20 | | |

**Wrangler and the vitest plugin move as a pair.** Every plugin release pins one exact
wrangler (`1.4.0` → `4.149.0`, `1.8.4` → `4.164.0`, `1.8.5` → `4.165.0`). Root `wrangler` takes
the version the chosen plugin pins, so the lockfile holds one wrangler and one miniflare. If
one half of a pair is too new, use the older pair.

### Sätteri is coupled to Astro (changes the W2/W6 split)

`@astrojs/markdown-satteri` moved from `satteri ^0.10.x` to `^0.11.6` at **0.4.7**. Astro and
MDX depend on it, so Sätteri 0.11 cannot be held back alone:

- astro 7.4.0–7.4.6 depend on markdown-satteri 0.4.4–0.4.6 (Sätteri 0.10). From 7.4.7 they
  depend on 0.4.7 or later (Sätteri 0.11). 7.4.12 and 7.4.13 need `^0.4.10`.
- @astrojs/mdx 8.1.0–8.1.2 pin markdown-satteri 0.4.4–0.4.6. 8.1.3 and later need 0.4.7 or
  later.

So the newest Sätteri-0.10 set is **astro 7.4.6, @astrojs/mdx 8.1.2,
@astrojs/markdown-satteri 0.4.6, satteri 0.10.5**. W2 moves to that set first, and the HTML
diff then isolates Astro's own changes. W6 then moves to astro 7.4.13 (or 7.4.12), mdx 8.1.6,
markdown-satteri 0.4.10 and satteri 0.11.7, and diffs again. That isolates Sätteri 0.11. If
W6's diff is not clean, the chore stays on the W2 set. #212's astro 7.4.7 is already on
Sätteri 0.11, so in that case this PR ends on a *lower* astro than #212. #212 is still closed
as superseded, and the Sätteri/Astro move becomes the /tweak follow-up.

The cost of the fallback is that astro ≤ 7.4.6 keeps GHSA-r3h5-4585-7x3w (moderate). That
advisory concerns the image endpoint in `@astrojs/node`, which this static site does not use,
so it cannot be reached here. The PR body must say this, because the Security Baseline
requires an open alert to be explained.

### TypeScript 7: hold at 6.0.3 (no decision needed)

The consumers exclude TS 7, and TS 7.0 does not ship the JS compiler API they call:

- `@astrojs/check@0.9.12` (latest) peers on `typescript: ^5.0.0 || ^6.0.0`.
- `typescript-eslint@8.73.0` (latest) and `@typescript-eslint/typescript-estree@8.73.0` peer on
  `typescript: >=4.8.4 <6.1.0`. typescript-estree adds an optional
  `@typescript/native: npm:typescript@>=7.1.0-dev…` peer. That is experimental support for a
  **7.1 dev** native API, not 7.0.
- `@volar/kit` (latest, used by `@astrojs/check` and the language server) peers on
  `typescript: <7`.
- `typescript@7.0.2` exports only `"."` → `./lib/version.cjs` plus `./unstable/*` (fs, ast,
  sync/async API, proto) and the `tsc` bin. The classic `ts.createProgram` /
  language-service JS API that `@astrojs/language-server`, Volar and typescript-estree load is
  not there.
- `pnpm why typescript` shows these consumers: `@astrojs/check`, the `@typescript-eslint/*`
  packages, `@volar/kit`, `ts-api-utils` (`>=4.8.4`, open) and the root manifest. vitest and
  astro do not peer on typescript.

6.0.3 is the newest 6.x release, so `typescript` does not change. The revisit point is when
`@astrojs/check`, Volar and typescript-eslint publish TS 7 ranges. That is listed as a
follow-up.

### secretlint 14: the preset is built in

`@secretlint/secretlint-rule-preset-recommend@13.1.0` is deprecated with the message: "Built
into secretlint v14 and later. Remove this package; the rule id still works." The v14 release
notes and the
[v13→v14 migration guide](https://github.com/secretlint/secretlint/blob/HEAD/docs/migrations/v13-to-v14.md)
confirm three things. Official rules now live in `@secretlint/core`. Rule ids are unchanged,
so `.secretlintrc.json` (`{"id": "@secretlint/secretlint-rule-preset-recommend"}`) keeps
working unedited. An installed old preset package is no longer loaded. **There is no
replacement preset package.** The step is to bump `secretlint` and remove the preset. v14
also replaces its file matcher with a Git-style one of its own, so W5 checks that
`.secretlintignore` still excludes the same paths. secretlint 14's engine range is
`node >=22`.

### @emnapi prereleases

The lockfile now holds `@emnapi/{core,runtime}` 1.11.1 and 1.11.3 (stable). The latest
`@napi-rs/wasm-runtime` (1.2.7) peers on `^1.7.1 || 2.0.0-beta.2 || 2.0.0-beta.3`, and the
`beta` dist-tag is 2.0.0-beta.3. #212 resolved the beta through auto-installed peers. Stable
1.11.3 satisfies every range, so dedupe should settle on it (W7).

### Audit before (2026-11-19, `corepack pnpm audit`, current lockfile)

36 advisories: **10 high, 21 moderate, 5 low, 0 critical**. By package:

- vite 8.3.0–8.3.2 (1 high, 4 moderate, 1 low; fixed ≥ 8.3.3);
- zod < 4.6.6 (1 high);
- undici 7.x < 7.30.1 / 8.x < 8.12.2 (8 high, 6 moderate; via `astro>unifont` and
  `wrangler>miniflare`);
- @vitest/mocker (4 moderate);
- fast-uri < 3.1.9 (2 moderate, 2 low);
- postcss-selector-parser < 6.1.5 (1 moderate);
- minimatch 7.x–11.0.0 (1 moderate);
- fast-xml-parser ≤ 5.11.2 (1 low);
- astro ≤ 7.4.4 (1 low, GHSA-mh32-jxcr-mh9f) and ≤ 7.4.6 (1 moderate, GHSA-r3h5-4585-7x3w).

The full JSON is at
`/private/tmp/claude-501/-Users-doncoleman-orca-workspaces-dcc-web-package-updates/3828b8ba-51f2-4ee4-bb6a-421347bc04c4/scratchpad/audit-before.json`.
W7 re-runs the audit, and the report records it again.

### GitHub Actions (all in `.github/workflows/ci.yml`, the only workflow)

Latest releases and the commit SHAs their tags point to, from `gh api repos/<r>/releases/latest`
and `gh api repos/<r>/commits/<tag>`:

| Action | From | To | Commit SHA |
|---|---|---|---|
| actions/checkout | v7.0.1 | v7.0.1 (already latest) | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| actions/setup-node | v7.0.0 | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` (matches #211) |
| actions/upload-artifact | v7.0.1 | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` (matches #211) |
| pnpm/action-setup | v6.1.0 | v6.1.1 | `73e46992e05b19abd31f2f3c20e0e7370d762115` |

### pnpm itself: held at 11.15.1 (judgment call)

`packageManager` stays at `pnpm@11.15.1`. The latest 11.x is 11.28.12 (`next-11` is
11.28.13), and pnpm 12 is a major. Moving pnpm changes the resolver and the release-age
check that this chore relies on to prove the lockfile is sound. That belongs in its own
change. A pnpm bump would also let the repo adopt `minimumReleaseAgeExcludePrune` (11.22.0+),
which was already listed as a follow-up in the dependency-advisories chore. As a result,
`tests/unit/setup-check/checks/local-tools.test.ts` and its `pnpm@11.15.1` fixture are
untouched.

## Acceptance

The review phase checks each criterion mechanically:

1. **Frozen install passes the supply-chain check.** On a clean `node_modules`,
   `corepack pnpm install --frozen-lockfile` exits 0 with no
   `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, locally and in CI's `static` job.
   `pnpm-workspace.yaml` is byte-identical to `main`: no `minimumReleaseAgeExclude`, no
   `overrides`, and no `minimumReleaseAge`. The one exception is an `@emnapi` override, if W7
   needs it as a last resort; it must be explained in the report.
2. **Only deliberate holds are outdated.** `corepack pnpm outdated -r` lists only:
   - `typescript` (7.x, held);
   - `@types/node` (25+/26.x, held at 24.x);
   - any package whose newer release is under 24 h old at that moment (named, with its
     publish time);
   - if W6 fell back, `astro`, `@astrojs/mdx`, `@astrojs/markdown-satteri` and `satteri`
     (held for the /tweak follow-up).
   `packageManager` (pnpm) is not reported by `outdated` and is held by decision.
3. **Exact pins.** Every version in `package.json` and `worker/package.json` matches
   `^\d+\.\d+\.\d+$`. `engines.node` stays `>=24`, and `.nvmrc` stays `24`.
4. **No @emnapi prereleases.** `grep -E "@emnapi/[a-z-]+@[0-9.]+-" pnpm-lock.yaml` finds nothing.
5. **Built HTML is unchanged across the whole chore.** This is the triage-condition-1 proof
   for the chore, not only for Sätteri. Build `dist/` on the `main` versions into
   `…/scratchpad/dist-before` (W2), then normalise and diff (method in W2). The final
   `dist/`, after W7, must show:
   - the same set of `.html` files;
   - no diff in any `.html` file after hashed asset names are normalised.
   The only allowed residual difference is non-markup bytes inside inlined `<style>` or
   `<script>` blocks, where the diff shows the same declarations or statements re-ordered or
   re-minified. Each such hunk must be listed in the report with its explanation. Any change to
   elements, attributes, text or the set of declared CSS properties fails this criterion.
6. **Baselines refreshed only for Chromium drift.**
   - `git diff --name-only main -- tests/e2e/visual.spec.ts-snapshots/` lists only `*-darwin.png`
     and `*-linux.png` files that the pre-update run in W8 reported as failing under
     Playwright 1.65.1.
   - W8's run takes place after criterion 5 holds, so markup cannot be the cause.
   - No `.spec.ts`, `playwright.config.ts` or threshold changes.
   - CI's visual check passes on the committed Linux images.
7. **Audit recorded.** The report gives the before counts (10 high / 21 moderate / 5 low) and
   the after counts from `corepack pnpm audit`. Each residual advisory is listed with its path
   and why it remains, and residuals go into the PR body as follow-ups. The after high count
   is expected to be 0, because vite, zod and undici are fixed by the bumps or by in-range
   re-resolution. That expectation is not a gate.
8. **Actions.** `ci.yml` uses only the four SHAs in the table above, each with its `# vX.Y.Z`
   comment. `tests/unit/ci/workflows.test.ts` passes.
9. **Scope of the diff.** `git diff --name-only main` lists only:
   - `package.json`, `worker/package.json`, `pnpm-lock.yaml`;
   - `.github/workflows/ci.yml`;
   - `worker/worker-configuration.d.ts`, only if `wrangler types --check` requires
     regeneration after the wrangler bump;
   - `tests/e2e/visual.spec.ts-snapshots/*.png`;
   - `.specify/chores/dependency-updates/**`.
   No file under `src/`, `public/`, `worker/src/`, `scripts/` or `tests/` (other than the
   snapshot PNGs) changes. Neither do `.secretlintrc.json`, `.secretlintignore`,
   `pnpm-workspace.yaml` or `astro.config.mjs`.
10. **Full verify is green.** The orchestrator runs it after asking Don, and CI's `verify` is
    green.

## Scope

**In:**

- GitHub Actions SHA bumps in `.github/workflows/ci.yml` (W1, which absorbs #211 and adds
  pnpm/action-setup v6.1.1).
- Root dependencies and devDependencies, and `worker` devDependencies, per the table above
  (W2–W8). This absorbs #212.
- Removing `@secretlint/secretlint-rule-preset-recommend` (W5).
- Regenerating `worker/worker-configuration.d.ts`, only if the wrangler bump makes
  `wrangler types --check` fail (W4).
- macOS and Linux visual baselines, for the Chromium 153 → 159 move only (W8).
- Re-resolving transitive dependencies within their ranges to clear the audit and keep
  `@emnapi` stable (W7).

**Out:**

- TypeScript 7 (held; see the findings).
- `@types/node` 25 and 26 (held at 24.x to match Node 24).
- Bumping pnpm (`packageManager`) or Node.
- Any `astro.config.mjs`, source, content, test-spec or threshold change. If a bump needs
  one, stop: it is either a behaviour change or its own reviewed change.
- Adopting secretlint 14's zero-config mode. `.secretlintrc.json` stays.
- Fixing anything a new axe 4.14 rule reports. If one does, hold `@axe-core/playwright` at
  4.13.0 and list the finding as a follow-up, because fixing it would change markup.

**Finish step (orchestrator):** after this PR merges, close #211 and #212 with a comment
"Superseded by #<this PR>". Dependabot deletes its own branches.

**Follow-ups for the PR body:**

- TypeScript 7: revisit when `@astrojs/check`, `@volar/kit` and `typescript-eslint` publish
  TS 7 peer ranges. typescript-estree already has experimental `@typescript/native` support
  for 7.1-dev.
- pnpm 11.28.x and `minimumReleaseAgeExcludePrune`, as a separate chore that also updates the
  `local-tools` test fixture.
- Only if W6 fell back: a /tweak to adopt Sätteri 0.11 with Astro ≥ 7.4.7, listing the HTML
  changes found. The same follow-up clears the moderate astro advisory GHSA-r3h5-4585-7x3w,
  which cannot be reached here because there is no `@astrojs/node`.
- Each residual audit advisory from W7.
- Only if W8 held axe: the axe 4.14 finding.

## Constitution Check

- **I. Test-First:** this chore adds no new behaviour. Each item's test is the existing suite
  for the layer the package touches, plus mechanical checks (the HTML diff, the frozen
  install, the secretlint probe, the lockfile grep). The HTML diff stands in for the
  "seen failing" step: it is captured before any bump.
- **II. Automated Release Gate:** no check is skipped or weakened. Thresholds, specs and CI
  steps are unchanged, and the full verify plus CI `verify` gate the PR.
- **III. Human Review of Every Change:** a normal PR from `drc-agents` with auto-merge armed.
  Don approves after reading the baseline-exception note and the audit table.
- **IV. First-Party Before Custom:** the Astro Docs MCP was consulted (Upgrade Astro, the
  Sätteri processor reference, the v7 upgrade guide). The plan follows Astro's own upgrade
  path for Astro and its official integrations, secretlint's own migration guide, and
  Cloudflare's paired vitest-plugin and wrangler releases. It adds no new package.
- **V. Static by Default:** unchanged. Acceptance 5 proves the prerendered HTML is the same.
- **VI. Content as Files:** unchanged. No content or schema edits.
- **VII. Private Data:** unchanged. No Worker source changes, and secretlint still guards
  commits (W5 probe).
- **VIII. Cloudflare Best Practices:** wrangler and the vitest plugin move as Cloudflare's
  matched pair. Worker config is untouched, and generated types are regenerated only through
  `wrangler types`.
- **IX. Cost Ceiling:** no new service and no recurring cost. Expected monthly cost change is
  $0.
- **X. Accessible, Fast and Private:** the a11y (axe 4.14) and budget projects run unchanged.
  A new axe finding holds axe back rather than loosening anything.
- **XI. Spec Kit Workflow:** a /chore on `chore/dependency-updates`, with plan, review and
  report under `.specify/chores/dependency-updates/`.
- **Technology Constraints:** Astro current stable (7.4.x), strict TypeScript (6.0.3),
  Tailwind 4, one package manager with its lockfile committed.
- **Security Baseline:** headers, ruleset and Dependabot are unchanged. Every audit residual,
  including the astro advisory under the W6 fallback, is explained in the PR body.

## Work items

Common rules for every item:

- Follow the CLAUDE.md Local toolchain: `node -v` must be 24, run `source ~/.nvm/nvm.sh &&
  nvm use` in the same command if it is not, and bound long runs with
  `perl -e 'alarm N; exec @ARGV' …`.
- Use `corepack pnpm` (or the worktree pnpm shim).
- Add exact versions with `corepack pnpm add -E <pkg>@<version>`, and for the worker,
  `corepack pnpm --filter ./worker add -D -E …`. Pick each version with
  `npm view <pkg> time --json` per the release-age rule, and never with `@latest` alone.
- Never add a `minimumReleaseAgeExclude`.
- Do **not** run the full `pnpm run verify`; that is the orchestrator's call.
- Check `lsof -i :4321` before any e2e run.
- Commit after each item so a fallback is a clean revert.

### W1. GitHub Actions bumps (absorbs #211, adds pnpm/action-setup)

- **Files:** `.github/workflows/ci.yml`.
- **Change:** move setup-node to `949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0` (5
  places), upload-artifact to `cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2` (1) and
  pnpm/action-setup to `73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1` (3). checkout is
  already latest. Re-confirm each tag's SHA with
  `gh api repos/<owner>/<repo>/commits/<tag> -q .sha` just before editing.
- **Test:** existing tests must keep passing: `vitest run tests/unit/ci/` (workflows,
  dependabot, changed-paths, verify-needs). Then
  `grep -c "<old sha>" .github/workflows/ci.yml` returns 0 for each of the three old SHAs.
- **Layer:** unit (config).
- **Risk:** low. Patch and minor releases, the same SHAs Dependabot proposed, and CI exercises
  them.

### W2. Baseline dist snapshot, then the Astro stack on the Sätteri-0.10 line

- **Step 1, capture before (current `main` versions, before touching any manifest):**
  1. `corepack pnpm install --frozen-lockfile`.
  2. `corepack pnpm run build`.
  3. Copy `dist/` to
     `/private/tmp/claude-501/-Users-doncoleman-orca-workspaces-dcc-web-package-updates/3828b8ba-51f2-4ee4-bb6a-421347bc04c4/scratchpad/dist-before`.
  4. Write a normaliser script in the scratchpad (outside the repo), `normalize-dist.sh <in>
     <out>`. It copies only `*.html` and rewrites hashed asset references with
     `sed -E 's#(/_astro/[^"'"'"' ),]*)\.[A-Za-z0-9_-]{8}(_[A-Za-z0-9_-]+)?\.([a-z0-9]+)#\1.HASH.\3#g'`.
     The regex may be refined, but every rule it applies is listed in the report.
  5. Normalise `dist-before` into `…/scratchpad/html-before`.
  Every later diff is `diff -r html-before html-after` plus a comparison of the
  `find … -name '*.html' | sort` lists.
- **Step 2, bump:** `astro` 7.4.6, `@astrojs/mdx` 8.1.2, `@astrojs/markdown-satteri` 0.4.6,
  `satteri` stays 0.10.5, `@astrojs/sitemap` 3.7.6 (or 3.7.5), `@astrojs/check` 0.9.12,
  `tailwindcss` and `@tailwindcss/vite` 4.3.5.
  - Confirm `pnpm why satteri` shows only 0.10.x and `pnpm why vite` shows only ≥ 8.3.3
    (expected 8.3.8).
  - If vite resolves lower, run `corepack pnpm update vite` within ranges.
- **Files:** `package.json`, `pnpm-lock.yaml`.
- **Test:** existing tests must keep passing:
  - `pnpm run typecheck` (`astro check` on the new language server);
  - `pnpm run test:unit`;
  - `pnpm run test:build`;
  - `playwright test tests/e2e/fonts.spec.ts` (Astro Fonts API output).
  Then build, normalise into `html-after-w2` and diff against `html-before`. The diff must be
  empty, or meet Acceptance 5's residual rule. A diff caused by Astro 7.4.6 itself means
  stop: write it up and do not continue the Astro bump.
- **Layer:** build (the real `astro build` plus the HTML diff) and the existing unit, build and
  e2e font tests.
- **Risk:** medium. Astro minor releases can change rendered output, inlined CSS or the Fonts
  API, and Tailwind patches can change generated CSS. The HTML diff catches these.

### W3. Lint, type and test tooling (TypeScript held)

- **Change:** `eslint` 10.15.0, `typescript-eslint` 8.73.0, root `vitest` 5.1.1,
  `@types/node` 24.19.2. `typescript` stays 6.0.3. Record the TS 7 findings above in the report.
- **Files:** `package.json`, `pnpm-lock.yaml`.
- **Test:** existing tests must keep passing: `pnpm run lint`, `pnpm run typecheck`,
  `pnpm run test:unit`, `pnpm run test:build`. A new lint error from an eslint or
  typescript-eslint rule change is fixed only if the fix leaves the source behaviour
  unchanged. Otherwise hold that package one version back and record why.
- **Layer:** unit (tooling); no behaviour.
- **Risk:** low. Minor versions within the same majors, and the root is already on Vitest 5.

### W4. Wrangler, Cloudflare SDK, and worker Vitest 5 with the plugin

- **Change:**
  - Root: `wrangler` 4.165.0 and `cloudflare` 7.3.0.
  - Worker: `@cloudflare/vitest-plugin` 1.8.5 and `vitest` 5.1.1.
  - If wrangler 4.165.0 or plugin 1.8.5 is under 24 h old, use the pair 4.164.0 + 1.8.4.
    Plugin 1.8.4 and 1.8.5 peer on `vitest: ^4.1.0 || ^5.0.0`, and Vitest 5 support landed in
    plugin 1.4.0 (changelog #16132), so the condition Don set is met.
  - `worker/vitest.config.ts` is not edited. It already uses the `cloudflareTest()` plugin
    form and `defineConfig` from `vitest/config`.
- **Files:** `package.json`, `worker/package.json`, `pnpm-lock.yaml`, and
  `worker/worker-configuration.d.ts` only if needed.
- **Test:** existing tests must keep passing:
  - `pnpm run test:worker` (both the `production` and `preview` projects);
  - `pnpm run typecheck`, including `wrangler types … --check`. If `--check` fails only
    because the generated types changed with the new wrangler or workerd, run
    `pnpm run types:worker`, confirm the diff is generated runtime-type churn only, and
    commit it;
  - `vitest run tests/unit/` for the deploy and setup-check tests that shell out to or parse
    wrangler.
  - Confirm `pnpm why wrangler` and `pnpm why miniflare` each show a single version.
- **Layer:** integration (Workers runtime tests) and unit (config).
- **Risk:** medium. This is a major Vitest move in the worker. Known Vitest 5 plugin fixes are
  in 1.6.1 (vi.mock factories under 5.1) and 1.8.0 (CJS deps in inline projects), so target
  ≥ 1.8.4. If the worker suite fails in a way that needs a test-code change beyond a renamed
  API, hold the worker at vitest 4.1.x (latest 4.1 patch, ≥ 4.1.12 for the @vitest/mocker
  advisory) with plugin 1.8.x, and record why.

### W5. secretlint 14; remove the built-in preset package

- **Change:** `secretlint` 14.0.1, and `corepack pnpm remove @secretlint/secretlint-rule-preset-recommend`.
  `.secretlintrc.json` and `.secretlintignore` are not edited.
- **Files:** `package.json`, `pnpm-lock.yaml`.
- **Test:** no new tests. Mechanical checks:
  1. `pnpm run lint:secrets` exits 0 on the repo.
  2. **The rule still runs.** Write a probe file in the scratchpad containing a well-known
     fake credential shape. Use the AWS docs example key `AKIAIOSFODNN7EXAMPLE` with its
     documented example secret, or a GitHub token-shaped string, but never a real value. Run
     `corepack pnpm exec secretlint --secretlintrc .secretlintrc.json <probe>`. It must exit
     non-zero and name a preset-recommend rule. Delete the probe.
  3. **The ignore file still applies.** Run
     `corepack pnpm exec secretlint --profile "**/*"` before (on 13.0.6, at the start of the
     item) and after, and compare the scanned-file counts. Equal is expected. A difference
     must be explained by v14's Git-style matcher and must not newly scan `node_modules`,
     `dist`, `.astro`, `pnpm-lock.yaml` or `.env`.
  `.env` is never printed or opened. The counts are read from the profile summary.
- **Layer:** unit (tooling); no behaviour.
- **Risk:** low to medium. The migration guide says "most users can upgrade without changing
  anything", and the matcher change is the one thing to watch.

### W6. Sätteri 0.11 with Astro 7.4.13 — HTML diff gate

- **Change:** `astro` 7.4.13 (or 7.4.12), `@astrojs/mdx` 8.1.6, `@astrojs/markdown-satteri`
  0.4.10, `satteri` 0.11.7. Confirm `pnpm why satteri` shows only 0.11.7. The custom
  `mdastPlugins` (`readingTimePlugin` and `projectPartsPlugin` in `astro.config.mjs`) must
  still load. Their unit tests import `mdxToJs` from `satteri` directly.
- **Files:** `package.json`, `pnpm-lock.yaml`.
- **Test, the gate:**
  1. Build, normalise into `html-after-w6`, then `diff -r html-after-w2 html-after-w6` (to
     isolate this step) and `diff -r html-before html-after-w6`. Both must be empty or meet
     Acceptance 5's residual rule.
  2. Existing tests must keep passing: `vitest run tests/unit/markdown/`
     (reading-time, project-parts, shiki-classes), `tests/unit/assessment/lookup.test.ts`,
     `tests/unit/site/astro-config.test.ts`, `pnpm run test:build`, `pnpm run typecheck`,
     and `playwright test tests/e2e/fonts.spec.ts`.
- **If any HTML differs:** revert W6's commit (`git revert`, not a reset), so the chore stays on
  the W2 set. Save the diff to
  `…/scratchpad/satteri-0.11-html.diff` and summarise it in the report. Then add the /tweak
  follow-up and the astro advisory note (see Scope).
- **Layer:** build (real build plus HTML diff) and unit (Markdown plugins).
- **Risk:** medium to high. Sätteri is a 0.x renderer, and a minor bump can change smart
  punctuation, heading ids, footnotes or code-block markup. The gate is strict by design.

### W7. Transitive refresh, audit, @emnapi and the frozen-install proof

- **Change:** re-resolve transitive dependencies within their declared ranges, to pick up the
  audit fixes.
  - Run `corepack pnpm update <name>` for undici, zod, fast-uri, minimatch,
    postcss-selector-parser, fast-xml-parser and @vitest/mocker, where the advisory is still
    reported. Then run `corepack pnpm dedupe`.
  - If an advisory remains whose patched version is in range but was not picked,
    `pnpm audit --fix=update` may be used. It is known to add a bogus
    `minimumReleaseAgeExclude`, so delete any such entry from `pnpm-workspace.yaml` afterwards
    and re-run step 2.
  - **@emnapi:** `grep -E "@emnapi/[a-z-]+@[0-9.]+-" pnpm-lock.yaml` must be empty. If a beta
    appears, try `corepack pnpm dedupe`, then `corepack pnpm update @emnapi/core
    @emnapi/runtime`. Only as a last resort, add an `overrides` entry pinning
    `@emnapi/core` and `@emnapi/runtime` to the stable `1.11.3` (in `pnpm-workspace.yaml`),
    with a comment, and explain it in the report. This is the only permitted change to
    `pnpm-workspace.yaml`.
  - Run `corepack pnpm audit` and record the after counts and the residuals (Acceptance 7).
- **Frozen-install proof:** `rm -rf node_modules worker/node_modules`, then
  `corepack pnpm install --frozen-lockfile` must exit 0 with no release-age error (Acceptance
  1). Then run `corepack pnpm outdated -r` (Acceptance 2).
- **Files:** `pnpm-lock.yaml`, and only in the @emnapi last-resort case, `pnpm-workspace.yaml`.
- **Test:** existing tests must keep passing: `pnpm run verify:quick` (secrets, lint,
  typecheck, unit, worker, build), then the final build normalised into `html-final` and
  `diff -r html-before html-final` (Acceptance 5, the chore-wide proof).
- **Layer:** build plus the existing quick gate.
- **Risk:** medium. Transitive re-resolution can pull in a shiki, unifont or lightningcss patch
  that changes output. The final HTML diff catches it. Revert the specific `update` if it does.

### W8. Playwright 1.65 and axe 4.14, then macOS and Linux baselines

Read `.claude/skills/_shared/visual-baselines.md` first. Its rules apply as written.

- **Change:** `@playwright/test` 1.65.1 and `@axe-core/playwright` 4.14.0. Then run
  `corepack pnpm exec playwright install chromium`.
- **Steps:**
  1. **Predict before refreshing.** With Acceptance 5 already holding (after W7), run
     `pnpm run test:visual` *without* updating, and save the list of failing shots and their
     diff images to `…/scratchpad/visual-pre-update/`. Every failure must be a pixel-level
     rendering change, with no layout shift a markup or CSS diff would explain (the HTML diff
     is empty, and CSS is checked by W2/W6/W7). A layout-level change stops the item, and the
     orchestrator asks Don.
  2. Run `pnpm run test:visual:update` (macOS), in the background via the nvm+shim wrapper per
     the memory notes. Do not run it while a Linux build is writing `dist`.
  3. Run `pnpm run test:visual:update:linux`. The script derives
     `mcr.microsoft.com/playwright:v1.65.1-noble` from the installed version, and runs in
     `container` if `container system status` succeeds, else in Docker. If neither is
     running, the item reports this to the orchestrator, which asks Don to start one. This
     subagent cannot ask.
  4. Confirm `git status` shows only `*-darwin.png` and `*-linux.png` changes, and that each
     changed name was in step 1's failing list (Acceptance 6).
  5. Existing tests must keep passing: `pnpm run test:a11y` and `playwright test
     tests/e2e/fonts.spec.ts`. Also run `vitest run tests/unit/site/config-files.test.ts`,
     which checks Playwright project wiring.
  6. **If axe 4.14 adds a violation:** hold `@axe-core/playwright` at 4.13.0, keep Playwright
     1.65.1, and record the rule and page as a follow-up. Fixing the violation would change
     markup.
- **Files:** `package.json`, `pnpm-lock.yaml`, `tests/e2e/visual.spec.ts-snapshots/*.png`.
- **Test:** existing visual, a11y and font e2e must pass after the refresh; no behaviour test
  changes.
- **Layer:** e2e (visual and a11y projects).
- **Risk:** medium.
  - The Chromium 153 → 159 jump may move many shots, and CI's runner may differ from the local
    `container` image. If CI's visual check fails on the committed Linux images, stop and tell
    Don, per the shared file. Do not refresh from CI.
  - The budget project (`--workers=1`) also runs on the new Chromium. A budget failure is not
    loosened; it is reported.

## Docs citations (Principle IV)

- **Astro Docs MCP (`astro-docs`), consulted 2026-11-19:**
  - [Upgrade Astro](https://docs.astro.build/en/upgrade-astro/): semantic versioning (minor
    releases "require no changes to your code"), and Astro plus its official integrations are
    upgraded together. The latest release listed there is v7.4.12; npm has 7.4.13.
  - [Upgrade to v7 — Sätteri default processor](https://docs.astro.build/en/guides/upgrade-to/v7/#new-default-markdown-processor-s%C3%A4tteri).
  - [`markdown.processor`](https://docs.astro.build/en/reference/configuration-reference/#markdownprocessor)
    and [Sätteri API reference](https://docs.astro.build/en/reference/markdown-processors/satteri/#satteri)
    (`mdastPlugins`): confirm the current `astro.config.mjs` usage stays valid, with no config
    change.
  - [Astro changelog](https://github.com/withastro/astro/blob/main/packages/astro/CHANGELOG.md),
    for 7.3.5 → 7.4.13 patch and minor notes, which the implementer reads for Fonts API and
    Markdown entries.
- **Playwright:** [release notes](https://playwright.dev/docs/release-notes) for 1.64 and 1.65.
  The Chromium versions above come from `playwright-core@{1.63.0,1.65.1}/browsers.json`.
- **pnpm:** [settings: minimumReleaseAge / minimumReleaseAgeExclude](https://pnpm.io/settings#minimumreleaseage)
  and [pnpm update](https://pnpm.io/cli/update), [pnpm dedupe](https://pnpm.io/cli/dedupe)
  and [overrides](https://pnpm.io/settings#overrides).
- **Vitest 5:** [migration guide](https://vitest.dev/guide/migration) and
  [Vitest 5 announcement](https://vitest.dev/blog/vitest-5).
- **Cloudflare:** [Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/),
  and the [`@cloudflare/vitest-plugin` CHANGELOG](https://github.com/cloudflare/workers-sdk/blob/main/packages/vitest-plugin/CHANGELOG.md)
  (1.4.0 adds Vitest 5, 1.6.1 fixes vi.mock under 5.1, 1.8.0 fixes CJS under Vitest 5).
- **secretlint:** [v14.0.0 release notes](https://github.com/secretlint/secretlint/releases/tag/v14.0.0)
  and the [v13→v14 migration guide](https://github.com/secretlint/secretlint/blob/HEAD/docs/migrations/v13-to-v14.md).
- **TypeScript 7:** the `typescript@7.0.2` package `exports` map (no classic compiler API),
  plus the peer ranges quoted in the findings.

## Risks

- **Release-age timing.** astro 7.4.13, sitemap 3.7.6, wrangler 4.165.0 and plugin 1.8.5 only
  become eligible during 2026-11-19 (17:35Z–21:52Z). Each item re-checks and uses the fallback
  version if needed. Acceptance 2 names any still-too-new release, rather than failing on it.
- **The Sätteri gate may fail.** In that case the chore ships on astro 7.4.6, below #212's
  7.4.7, and keeps one moderate astro advisory that cannot be reached here. The PR body
  explains it, and the /tweak follow-up carries the move.
- **Inlined CSS or JS churn** from Astro, Tailwind or Vite patches can show up in the HTML
  diff without any markup change. Acceptance 5's residual rule allows only re-ordered or
  re-minified identical declarations, each listed. Anything else stops the chore.
- **Worker Vitest 5** may need test changes. The fallback is to hold the worker on 4.1.x
  (≥ 4.1.12) with plugin 1.8.x.
- **Chromium 159 baselines:** the `container` image may drift from CI. Per the shared rules,
  stop and tell Don, and never refresh from CI. The full local gate needs Don's go-ahead, and
  sibling worktrees can collide on ports 4321/4322 (spurious e2e failures; check `lsof`, wait
  and rerun).
- **An @emnapi beta re-appearing** through `@napi-rs/wasm-runtime`'s peer range. Dedupe first;
  an override is the last resort and must be explained.
- **The secretlint 14 matcher** could change which files are scanned. W5 compares the profile
  counts.
- **Lockfile conflicts with sibling PRs:** never hand-merge `pnpm-lock.yaml`. Re-apply the
  manifest lines and regenerate.
