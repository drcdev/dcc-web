import { defineConfig, devices } from "@playwright/test";

// E2E always runs against the production build served by Cloudflare's own
// local runtime (`wrangler dev`), never `astro dev`/`astro preview`, so
// `public/_headers` and `wrangler.jsonc`'s `not_found_handling` are applied
// the same way they are in production (specs/002-site-foundation/tasks.md,
// "Execution environment"; research R11).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  retries: 0,
  webServer: {
    command: "pnpm exec wrangler dev --ip 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
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
      name: "e2e",
      testIgnore: [/a11y\.spec\.ts$/, /budget\.spec\.ts$/, /visual\.spec\.ts$/],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
