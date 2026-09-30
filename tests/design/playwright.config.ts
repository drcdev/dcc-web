import { defineConfig, devices } from "@playwright/test";

// Standalone capture config for the blog design pictures (not part of `verify`).
// Serves the production build with `wrangler dev`, like tests/e2e (research R8, R11).
export default defineConfig({
  testDir: ".",
  testMatch: /capture-blog\.spec\.ts$/,
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
  use: { baseURL: "http://127.0.0.1:4321", ...devices["Desktop Chrome"] },
});
