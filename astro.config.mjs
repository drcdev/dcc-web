// @ts-check
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, envField } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";

import { resolveSiteOrigin } from "./src/lib/site-origin.ts";
import { readingTimePlugin } from "./src/lib/markdown/reading-time.ts";
import { shikiClassTransformer } from "./src/lib/markdown/shiki-classes.ts";
import { shikiTheme } from "./src/lib/markdown/shiki-theme.ts";

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

  // The two Workers Builds variables that tell production from a preview build,
  // read by src/lib/posts.ts to decide whether draft posts are built
  // (docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables;
  // specs/008-blog/research.md R3).
  env: {
    schema: {
      WORKERS_CI: envField.string({ context: "server", access: "public", optional: true }),
      WORKERS_CI_BRANCH: envField.string({ context: "server", access: "public", optional: true }),
    },
  },

  // Sätteri is Astro's default Markdown processor; it is named here only to add
  // the reading-time plugin, which stores `minutesRead` for posts
  // (docs.astro.build/en/recipes/reading-time/; specs/008-blog/research.md R6).
  //
  // Code is highlighted with Astro's Shiki, using a semantic theme and a
  // transformer that turns every token colour into a class, so no inline style
  // reaches the page and the content security policy below needs no
  // 'unsafe-inline' for styles (docs.astro.build/en/guides/syntax-highlighting/;
  // specs/008-blog/research.md R7). The colours are in src/styles/global.css.
  markdown: {
    processor: satteri({ mdastPlugins: [readingTimePlugin] }),
    shikiConfig: { theme: shikiTheme, transformers: [shikiClassTransformer] },
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
