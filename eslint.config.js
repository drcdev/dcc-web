// @ts-check
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: [
      "dist/**",
      ".astro/**",
      ".wrangler/**",
      "node_modules/**",
      // Fixture-site builds write here (tests/build, scripts/build-fixture-site.ts).
      ".cache/**",
      "test-results/**",
      "playwright-report/**",
      // Read-only design reference (Flux theme), gitignored and never
      // imported (FR-033) — not this repository's code to lint.
      ".reference/**",
    ],
  },
);
