// Local layer of the launch site check (011-launch contracts/site-check.md): the crawler runs
// against the production build served by `wrangler dev`. A local build declares the fallback
// origin; the crawler maps it onto the base. No `expectNoindex`: a localhost host does not match
// the host-scoped `_headers` rules.
import { test, expect } from "@playwright/test";
import { crawl, formatFailures } from "../../scripts/site-check/crawl.ts";

const BASE = "http://127.0.0.1:4321";

test("every sitemap page and internal link resolves", async ({ playwright }) => {
  test.setTimeout(120_000);
  const context = await playwright.request.newContext();
  try {
    const result = await crawl({
      base: BASE,
      checkLinks: true,
      concurrency: 4,
      fetcher: async (url) => {
        const res = await context.get(url, { maxRedirects: 0, failOnStatusCode: false });
        return {
          status: res.status(),
          headers: res.headers(),
          body: res.status() === 200 ? await res.text() : "",
          location: res.headers()["location"] ?? null,
        };
      },
    });
    expect(result.pagesChecked).toBeGreaterThan(0);
    expect(formatFailures(result)).toEqual([]);
    expect(result.failures).toEqual([]);
  } finally {
    await context.dispose();
  }
});
