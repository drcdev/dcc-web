// @ts-check
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

import { resolveSiteOrigin } from "./src/lib/site-origin.ts";

// Astro evaluates this file before loading .env files, so the build's own
// address is resolved from process.env (set by Cloudflare Workers Builds) and
// the committed, public setup/config.json — never from import.meta.env
// (docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file;
// specs/002-site-foundation/contracts/site-origin.md).
const setupConfigPath = fileURLToPath(new URL("./setup/config.json", import.meta.url));
const setupConfig = JSON.parse(readFileSync(setupConfigPath, "utf-8"));
const site = resolveSiteOrigin(process.env, setupConfig);

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: "always",

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
