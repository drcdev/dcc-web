import { defineConfig } from "vitest/config";

// Own config so Vitest does not walk up to the repository's Vitest 5 config.
// Phase 2 adds `cloudflareTest()` from @cloudflare/vitest-plugin once the
// Worker entry point exists.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
  },
});
