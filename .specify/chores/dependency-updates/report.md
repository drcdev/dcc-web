# Review report: dependency-updates

Fresh-eyes review of `chore/dependency-updates` (origin/main 553cb617 → HEAD 479dfc46, W1–W8), 2026-11-19 ~16:45Z. The review was read-only. The orchestrator saved this report because the review subagent could not write files.

## Verdict

No CRITICAL or HIGH findings. Every work item W1–W8 is done as planned, or departs from the plan with a recorded reason. No file under `src/`, `public/`, `scripts/`, `tests/`, `.claude/` or `worker/src/` changed, and neither did `astro.config.mjs`, `.secretlintrc.json`, `.secretlintignore` or `.nvmrc`. No check was weakened.

## Findings

### CRITICAL

None.

### HIGH

None.

### LOW

1. **`pnpm-workspace.yaml:8-12`: the `@emnapi` override came in W2, not as W7's last resort.** The justification holds:
   - `@napi-rs/wasm-runtime@1.2.7`'s peer range is `^1.7.1 || 2.0.0-beta.2 || 2.0.0-beta.3`.
   - Auto-installed peers take the beta, and `dedupe` and `update` cannot change that.
   - The override carries a comment, and there is no `minimumReleaseAgeExclude`.
   - The exact 1.11.3 pin blocks 1.x patch releases (see the follow-ups).
2. **`worker/test/contact-email.test.ts:123-125,131` is a test-file edit.** It was an orchestrator decision honouring Don's choice of Vitest 5 for the worker.
   - Literal U+2028/U+2029 characters became ` `/` ` escapes.
   - Decoded, the runtime strings are identical, and the expected values are unchanged ASCII.
   - No assertion was added, removed or loosened.
   - `test:worker`: 16 files and 241 tests passed.
3. **The CSP `<meta>` changes, though nothing a visitor sees changes.** Comparing main and HEAD across 29 pages shows only:
   - The re-minified "Think while you read" inline script (5 post pages). It is control-flow equivalent.
   - The `script-src` sha256 churn that follows from that script.
   - One unused `style-src` hash dropped on every page. Every inline script and style is still covered (0 missing), so the CSP is tighter.
   - `/contact` `script-src` listing `https://challenges.cloudflare.com` twice, because Astro 7.4.12 no longer de-duplicates sources. This is harmless.
4. **The subject of commit `ff0923f0` says "hold worker vitest at 4.1.12".** Commit `c1835c88` supersedes it, and the worker is on 5.1.1. This affects history only.
5. **The frozen-install proof printed "Already up to date" rather than an explicit supply-chain message.** It exited 0 with no `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, and the tree stayed clean.

### Checked and clean

- **Exact pins.** Every dependency in both manifests is an exact pin. `.nvmrc` is unchanged at 24, and `packageManager` is `pnpm@11.15.1`.
- **Action SHAs.** Each matches its tag, and all are the latest releases:
  - checkout v7.0.1
  - setup-node v7.1.0
  - upload-artifact v7.0.2
  - pnpm/action-setup v6.1.1 (annotated tag dereferenced)

  `tests/unit/ci/` passes: 247 tests.
- **Lockfile prereleases.** Every one is an exact pin set by its upstream parent, and none is a direct dependency or `@emnapi`:
  - `miniflare@5.20261117.0-beta`, from wrangler
  - `unenv@2.0.0-rc.24`
  - `youch@4.1.0-beta.10`
  - `get-tsconfig@5.0.0-beta.6`, from astro
- **Single versions.** There is one each of wrangler 4.164.0, vitest 5.1.1 (root and worker), vite 8.3.8 and satteri 0.11.7.
- **`worker/worker-configuration.d.ts`.** The churn is generated, from the workerd bump. The env hash and the compatibility date are unchanged.
- **Visual baselines.** No PNG changed. All 78 shots pass on macOS and in the Linux `container`.

## Before and after

| Measure | Before | After |
|---|---|---|
| `pnpm audit` | 36 advisories: 10 high, 21 moderate, 5 low | 1 moderate |
| `pnpm outdated -r` | most direct dependencies | `@types/node` and `typescript` only, both held on purpose |
| Built HTML, 29 pages | — | the same page set; only the CSP and inline-script changes in LOW 3 |
| Visual baselines | 78 per platform | 0 changed |

## Follow-ups for the PR body

- **Residual advisory GHSA-rj75-hqrm-r3gf (moderate).** `postcss-selector-parser` 6.0.10 is pinned exactly by `@tailwindcss/typography@0.5.20`, the latest release. It runs at build time only.
- **TypeScript 7 held at 6.0.3.** Three tools exclude it: typescript-eslint 8.73.0 peers on `<6.1.0`, `@astrojs/check` 0.9.12 on `^5 || ^6`, and `@volar/kit` on `<7`. TS 7.0.2 also ships no classic compiler API.
- **`@types/node` held at 24.19.2**, the latest 24.x, to match Node 24.
- **pnpm held at 11.15.1.** Bump it in its own chore.
- **Releases too new on 2026-11-19.** They are under pnpm's one-day minimum release age:
  - astro 7.4.13
  - @astrojs/sitemap 3.7.6
  - wrangler 4.165.0 with @cloudflare/vitest-plugin 1.8.5
- **`/contact` duplicate CSP source.** It is harmless. De-duplicate it later.
- **Remove the `@emnapi` override** once wasm-runtime drops the 2.0 betas from its peer range.
- **After merge,** close #211 and #212 as superseded.
