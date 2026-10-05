// What `wrangler dev` serves from the production build matches public/_headers, and the page
// CSP meta tag holds on the home page (contracts/http-responses.md; research R8; FR-010d,
// FR-024, FR-024a, FR-024c). Expected values are read from public/_headers, so this spec
// restates none; the unit tests hold the rules themselves.
import { test, expect } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";
import { headerRules } from "../helpers/headers";

const rules = headerRules();
const allPaths = rules.get("/*")!;
const astroCache = rules.get("/_astro/*")!.get("cache-control")!;

test("the home page is served with the /* rule and a page CSP that holds", async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await recordCspViolations(page);

  const response = (await page.goto("/"))!;
  expect(response.status()).toBe(200);
  const headers = response.headers();
  for (const [name, value] of allPaths) expect(headers[name], name).toBe(value);
  // The noindex header is a host rule for workers.dev previews and the review host; this
  // host (wrangler dev on 127.0.0.1) is neither (FR-010d).
  expect(headers["x-robots-tag"]).toBeUndefined();
  expect(headers["set-cookie"]).toBeUndefined();
  // The HTML is not fingerprinted, so an over-broad cache rule would cache pages for a year.
  expect(headers["cache-control"] ?? "").not.toContain("immutable");

  const meta = page.locator('meta[http-equiv="content-security-policy"]');
  await expect(meta).toHaveCount(1);
  const content = (await meta.getAttribute("content")) ?? "";
  expect(content).not.toContain("unsafe-inline");
  const scriptSrc = content
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .find(([name]) => name === "script-src")!;

  // Astro injects the meta tag just before the stylesheet, so the pre-paint theme script
  // (FR-013) is the one script ahead of it, and its hash is in the policy.
  const before = await page.evaluate(() => {
    const all = [...document.querySelectorAll("meta, script")];
    const metaAt = all.findIndex((el) => el.getAttribute("http-equiv") === "content-security-policy");
    return all
      .slice(0, metaAt)
      .filter((el) => el.tagName === "SCRIPT")
      .map((el) => el.textContent ?? "");
  });
  expect(before).toHaveLength(1);
  const digest = await page.evaluate(async (text) => {
    const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
    return btoa(String.fromCharCode(...bytes));
  }, before[0]!);
  expect(scriptSrc).toContain(`'sha256-${digest}'`);

  // Let the page's own scripts run, then check nothing was refused.
  await page.waitForLoadState("load");
  await page.locator("button[data-theme-toggle]").click();
  expect(await cspViolations(page)).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

// Only the served response shows that wrangler's `_headers` matching reaches a nested path under
// /_astro/ and replaces Cloudflare's default Cache-Control.
test("a served /_astro/ font file carries the /_astro/* cache rule and the /* headers", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="preload"][as="font"]').first().getAttribute("href");
  expect(href).toMatch(/^\/_astro\/fonts\/[^/]+\.woff2$/);
  const response = await request.get(href!);
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["cache-control"]).toBe(astroCache);
  for (const [name, value] of allPaths) expect(headers[name], name).toBe(value);
  expect(headers["set-cookie"]).toBeUndefined();
});
