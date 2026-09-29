// Crawler instructions, generated at build time so the Sitemap line uses the
// same resolved `site` as every canonical address (contracts/head-metadata.md;
// research R9; FR-018, FR-019). It allows all crawling: a Disallow rule would
// hide the X-Robots-Tag/robots-meta noindex signal from crawlers.
// Pattern from docs.astro.build/en/guides/integrations-guide/sitemap/#sitemap-link-in-robotstxt.
import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("robots.txt needs Astro's `site` (astro.config.mjs).");
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapURL.href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
