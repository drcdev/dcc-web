// @ts-check
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, envField, fontProviders } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";

import { pruneDraftAssets } from "./src/lib/prune-unreferenced-assets.ts";
import { INTER_UNICODE_RANGE, MONO_FALLBACK_STACK, SYSTEM_FONT_STACK } from "./src/lib/fonts/charset.ts";
import { unlistedPageAddresses } from "./src/lib/content/draft-pages.ts";
import { resolveSiteOrigin } from "./src/lib/site-origin.ts";
import { readingTimePlugin } from "./src/lib/markdown/reading-time.ts";
import { projectPartsPlugin } from "./src/lib/markdown/project-parts.ts";
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

// Draft pages are built (notice and noindex) but left out of the sitemap, so the site does not
// point search engines at pages it asks them to skip. The filter gets only a URL, so the draft
// addresses are read here (docs.astro.build/en/guides/integrations-guide/sitemap/#filter).
const draftPages = unlistedPageAddresses(fileURLToPath(new URL("./src/content/pages/", import.meta.url)));

// The pre-paint theme script is rendered with is:inline (src/layouts/BaseLayout.astro),
// which Astro's CSP does not hash automatically, so its hash is computed here from
// the exact text that is rendered
// (docs.astro.build/en/reference/configuration-reference/#securitycspscriptdirectivehashes;
// research R8).
const themeInitSource = readFileSync(new URL("./src/scripts/theme-init.js", import.meta.url), "utf-8");
/** @type {`sha256-${string}`} */
const themeInitHash = `sha256-${createHash("sha256").update(themeInitSource).digest("base64")}`;

// What the eight faces (four Inter, four JetBrains Mono) share: swap while loading, and the
// subset's unicode-range.
/** @type {{ display: "swap"; unicodeRange: [string, ...string[]] }} */
const subsetFace = { display: "swap", unicodeRange: [INTER_UNICODE_RANGE[0], ...INTER_UNICODE_RANGE.slice(1)] };

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: "ignore",
  // Fail the build when two routes make the same URL (configuration reference, prerenderConflictBehavior).
  // The custom route check in the pages route still runs first, so its message names the files.
  prerenderConflictBehavior: "error",

  vite: {
    plugins: [tailwindcss()],
  },

  // Sätteri is Astro's default Markdown processor; it is named here only to add
  // the reading-time plugin, which stores `minutesRead` for posts
  // (docs.astro.build/en/recipes/reading-time/; specs/008-blog/research.md R6), and the
  // project parts plugin (specs/014-project-four-part-story/research.md R2).
  //
  // Code is highlighted with Astro's Shiki, using a semantic theme and a
  // transformer that turns every token colour into a class, so no inline style
  // reaches the page and the content security policy below needs no
  // 'unsafe-inline' for styles (docs.astro.build/en/guides/syntax-highlighting/;
  // specs/008-blog/research.md R7). The colours are in src/styles/global.css.
  markdown: {
    processor: satteri({ mdastPlugins: [readingTimePlugin, projectPartsPlugin] }),
    shikiConfig: { theme: shikiTheme, transformers: [shikiClassTransformer] },
  },

  // Self-hosted Inter through Astro's Fonts API: four committed subset files, hashed into
  // /_astro/fonts/ at build, preloaded by <Font /> in BaseLayout. The system stack is the fallback
  // and Astro adjusts the last generic entry's metrics so the swap does not shift the layout
  // (docs.astro.build/en/guides/fonts/; specs/018-self-hosted-fonts/research.md R1, R6).
  // JetBrains Mono is the second family, for code: same local provider, four committed subset
  // files, the same unicode-range, Tailwind's mono stack as fallback with optimized fallbacks.
  // It has no preload, so only pages that draw code fetch it
  // (docs.astro.build/en/guides/fonts/; feature 019 research R1, R3).
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter",
      cssVariable: "--font-inter",
      fallbacks: [...SYSTEM_FONT_STACK],
      optimizedFallbacks: true,
      options: {
        variants: [
          { weight: 400, style: "normal", src: ["./src/assets/fonts/Inter-Regular.woff2"], ...subsetFace },
          { weight: 400, style: "italic", src: ["./src/assets/fonts/Inter-Italic.woff2"], ...subsetFace },
          { weight: 700, style: "normal", src: ["./src/assets/fonts/Inter-Bold.woff2"], ...subsetFace },
          { weight: 700, style: "italic", src: ["./src/assets/fonts/Inter-BoldItalic.woff2"], ...subsetFace },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "JetBrains Mono",
      cssVariable: "--font-jetbrains-mono",
      fallbacks: [...MONO_FALLBACK_STACK],
      optimizedFallbacks: true,
      options: {
        variants: [
          { weight: 400, style: "normal", src: ["./src/assets/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2"], ...subsetFace },
          { weight: 400, style: "italic", src: ["./src/assets/fonts/jetbrains-mono/JetBrainsMono-Italic.woff2"], ...subsetFace },
          { weight: 700, style: "normal", src: ["./src/assets/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2"], ...subsetFace },
          { weight: 700, style: "italic", src: ["./src/assets/fonts/jetbrains-mono/JetBrainsMono-BoldItalic.woff2"], ...subsetFace },
        ],
      },
    },
  ],

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
  //
  // The two Workers Builds variables that tell production from a preview build,
  // read by src/lib/posts.ts to decide whether draft posts are built
  // (specs/008-blog/research.md R3).
  env: {
    schema: {
      WORKERS_CI: envField.string({ context: "server", access: "public", optional: true }),
      WORKERS_CI_BRANCH: envField.string({ context: "server", access: "public", optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({
        context: "client",
        access: "public",
        ...(process.env.WORKERS_CI === "1" ? {} : { default: "1x00000000000000000000AA" }),
      }),
    },
  },

  // The not-found page is not a public page (FR-017c, FR-018; research R9).
  // pruneDraftAssets drops what only a draft project used from the production build.
  integrations: [
    sitemap({
      filter: (page) => {
        const { pathname } = new URL(page);
        // The per-post question source files are data for the questions API, not pages (specs/022).
        return !pathname.startsWith("/404") && !pathname.endsWith("/question-source.json") && !draftPages.has(pathname);
      },
    }),
    mdx(),
    pruneDraftAssets(process.env),
  ],
});
