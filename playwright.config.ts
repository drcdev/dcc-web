import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  webServer: {
    command: "pnpm run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Astro 7 auto-backgrounds `astro preview` when it detects an AI coding
    // agent (docs.astro.build/en/guides/build-with-ai/#background-mode). That
    // detaches the process Playwright is trying to supervise, so force the
    // server to stay in the foreground here regardless of the environment.
    env: { ASTRO_PREVIEW_BACKGROUND: "0" },
  },
  use: {
    baseURL: "http://localhost:4321",
  },
});
