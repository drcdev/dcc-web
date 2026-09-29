import { defineConfig, devices } from "@playwright/test";

// Standalone config for capturing reference screenshots of the live Ghost site
// (https://www.doncoleman.ca). This is deliberately not part of the `e2e`/`a11y`/
// `budget`/`visual` projects or the `verify` pipeline: it depends on a live external
// site rather than this repository's own build, and is run on demand via
// `pnpm run reference:capture` (added in Phase 2).
export default defineConfig({
  testDir: ".",
  testMatch: "capture-ghost.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  timeout: 60 * 1000,
  use: {
    baseURL: "https://www.doncoleman.ca",
    ...devices["Desktop Chrome"],
  },
});
