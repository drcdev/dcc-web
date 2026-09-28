// @ts-check
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";

export default tseslint.config(
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "test-results/**", "playwright-report/**"],
  },
);
