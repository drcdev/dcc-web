// @ts-check
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";

import { resolveSiteOrigin } from "./src/lib/site-origin.ts";

// Astro evaluates this file before loading .env files, so the build's own
// address is resolved from process.env (set by Cloudflare Workers Builds) and
// the committed, public setup/config.json — never from import.meta.env
// (docs.astro.build/en/guides/environment-variables/#in-the-astro-config-file;
// specs/002-site-foundation/contracts/site-origin.md).
const setupConfigPath = fileURLToPath(new URL("./setup/config.json", import.meta.url));
const setupConfig = JSON.parse(readFileSync(setupConfigPath, "utf-8"));
const site = resolveSiteOrigin(process.env, setupConfig);

// The pre-paint theme script is rendered with is:inline (src/layouts/BaseLayout.astro),
// which Astro's CSP does not hash automatically, so its hash is computed here from
// the exact text that is rendered
// (docs.astro.build/en/reference/configuration-reference/#securitycspscriptdirectivehashes;
// research R8).
const themeInitSource = readFileSync(new URL("./src/scripts/theme-init.js", import.meta.url), "utf-8");
/** @type {`sha256-${string}`} */
const themeInitHash = `sha256-${createHash("sha256").update(themeInitSource).digest("base64")}`;

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: "always",

  vite: {
    plugins: [tailwindcss()],
  },

  // Page content security policy, rendered by Astro as a <meta> tag with hashes
  // of every script and style it emits (docs.astro.build/en/reference/configuration-reference/#securitycsp;
  // contracts/http-responses.md; FR-024a, FR-024b). The closed allow-list is
  // the site itself plus the two Cloudflare Web Analytics hosts. Directives a
  // meta tag cannot carry (frame-ancestors) are sent by public/_headers.
  security: {
    csp: {
      scriptDirective: {
        resources: ["'self'", "https://static.cloudflareinsights.com"],
        hashes: [themeInitHash],
      },
      styleDirective: {
        resources: ["'self'"],
      },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },

  // The Turnstile site key is public by design. Workers Builds must set it (a
  // missing variable fails the build rather than shipping a test key); every
  // other build defaults to Cloudflare's always-pass test key
  // (docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables;
  // specs/007-contact-form/research.md R6).
  env: {
    schema: {
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: "client",
        access: "public",
        ...(process.env.WORKERS_CI === "1" ? {} : { default: "1x00000000000000000000AA" }),
      }),
    },
  },

  // The not-found page is not a public page (FR-017c, FR-018; research R9).
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith("/404") }), mdx()],
});
