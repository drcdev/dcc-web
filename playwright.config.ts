import { defineConfig, devices } from "@playwright/test";

// E2E always runs against the production build served by Cloudflare's own
// local runtime (`wrangler dev`), never `astro dev`/`astro preview`, so
// `public/_headers` and `wrangler.jsonc`'s `not_found_handling` are applied
// the same way they are in production (specs/002-site-foundation/tasks.md,
// "Execution environment"; research R11).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // CI runs 4 workers (the verify-gate split runs these projects in their own job);
  // locally Playwright's default applies. The `budget` project is the exception: it
  // measures timing, so `pnpm run test:budget` passes `--workers=1`. The CLI flag
  // overrides this config value, which keeps budget runs free of contention.
  workers: process.env.CI ? 4 : undefined,
  reporter: "list",
  retries: 0,
  webServer: [
    {
      // Fresh local D1 state on every start, then the site plus the Worker (research R4).
      command:
        "rm -rf .cache/e2e-state && pnpm exec wrangler d1 migrations apply DB --local --persist-to .cache/e2e-state && pnpm exec wrangler dev --ip 127.0.0.1 --port 4321 --persist-to .cache/e2e-state --env-file tests/fixtures/worker/e2e.env",
      url: "http://127.0.0.1:4321",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: { WRANGLER_SEND_METRICS: "false" },
    },
    // Fixture site for the section-component tests (tests/e2e/sections.spec.ts):
    // the repository's site plus tests/fixtures/pages/sections.mdx, built by
    // scripts/build-fixture-site.ts and served with `astro preview`, so every
    // Playwright run has it without any other script or workflow change.
    {
      command:
        "pnpm run build:fixtures && pnpm exec astro preview --root .cache/fixture-site --port 4322",
      url: "http://localhost:4322",
      reuseExistingServer: !process.env.CI,
      timeout: 300 * 1000,
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:4321",
  },
  // A missing baseline is a failure, never a silent pass (FR-005b).
  updateSnapshots: "none",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: "disabled",
      caret: "hide",
    },
  },
  projects: [
    {
      name: "a11y",
      testMatch: /a11y\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "budget",
      testMatch: /budget\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual",
      testMatch: /visual\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "sections",
      testMatch: [
        /sections\.spec\.ts$/,
        /blog-pagination\.spec\.ts$/,
        /blog-fixtures\.spec\.ts$/,
        /projects-fixtures\.spec\.ts$/,
      ],
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4322" },
    },
    {
      name: "e2e",
      testIgnore: [
        /a11y\.spec\.ts$/,
        /budget\.spec\.ts$/,
        /visual\.spec\.ts$/,
        /sections\.spec\.ts$/,
        /blog-pagination\.spec\.ts$/,
        /blog-fixtures\.spec\.ts$/,
        /projects-fixtures\.spec\.ts$/,
      ],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
