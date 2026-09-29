/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts", "tests/component/**/*.test.ts"],
        },
      },
      {
        // Build tests run a full Astro build of a fixture site, so they get a
        // longer timeout than the rest.
        extends: true,
        test: {
          name: "build",
          include: ["tests/build/**/*.test.ts"],
          testTimeout: 180_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
});
