import { defineConfig, devices } from "@playwright/test";

// Standalone config for the decision-document screenshots. It is not one of
// playwright.config.ts's projects, so `pnpm run verify` never runs it. Run:
//   ASTRO_PREVIEW_BACKGROUND=1 pnpm exec playwright test --config tests/design/portfolio/capture.config.ts
// against a fresh `pnpm run build`, served by `wrangler dev` as E2E does.
export default defineConfig({
  testDir: ".",
  testMatch: /capture\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  retries: 0,
  timeout: 60 * 1000,
  webServer: {
    command: "pnpm exec wrangler dev --ip 127.0.0.1 --port 4321",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4321",
    reducedMotion: "reduce",
  },
});
