# Contract: `verify` gate (local = CI)

`pnpm run verify` runs, in order, stopping at the first failure:

1. `lint:secrets` — secretlint (unchanged)
2. `lint` — ESLint (unchanged config; covers new `.astro`/`.ts`)
3. `typecheck` — `astro check`
4. `test` — Vitest: `tests/unit/**/*.test.ts` and `tests/component/**/*.test.ts`
5. `build` — `astro build`
6. `test:e2e` — Playwright, all projects, against `wrangler dev` on `http://127.0.0.1:4321`:
   - `e2e`: `shell`, `menu`, `theme`, `not-found`, `seo`, `headers`, `analytics`, `no-js`
   - `a11y`: axe WCAG 2.0/2.1/2.2 A+AA (zero violations of any impact), home and not-found ×
     390/1280 × dark/light, plus menu open, plus JavaScript disabled at 390; forced-colours and
     reduced-motion emulation checks
   - `budget`: LCP ≤ 2500 ms, CLS < 0.1, long tasks ≤ 200 ms, JS ≤ 10 KB, total ≤ 100 KB
   - `visual`: `toHaveScreenshot` baselines (per-platform, 14 each), `maxDiffPixelRatio: 0.001`,
     animations disabled; no retries

Convenience scripts: `test:a11y`, `test:budget`, `test:visual`, `test:visual:update`.
Not in `verify`: `reference:capture` (live Ghost site), `deploy:preview` (Workers Builds only).

CI (`.github/workflows/ci.yml`, job `verify`): unchanged steps + on failure upload
`playwright-report/`, `test-results/` and `tests/e2e/**/*-snapshots/**` as an artifact.
No secrets or variables are added to GitHub Actions.
