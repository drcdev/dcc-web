// Security headers on every response `wrangler dev` serves from the production
// build, and the page CSP meta tag on every HTML page
// (contracts/http-responses.md; research R8; FR-019, FR-024, FR-024a, FR-024c).
import { test, expect } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const HEADERS: Record<string, string> = {
  "x-robots-tag": "noindex",
  "content-security-policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "x-frame-options": "DENY",
  "cross-origin-opener-policy": "same-origin",
  "strict-transport-security": "max-age=31536000",
};

const REQUIRED_DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "https://static.cloudflareinsights.com"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'", "https://cloudflareinsights.com"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

const FORBIDDEN = ["unsafe-inline", "unsafe-eval", "web3forms", "jsdelivr", "supabase", "localhost", "ws:"];

const RESPONSES = [
  { path: "/", status: 200, html: true },
  { path: "/nope/", status: 404, html: true },
  { path: "/robots.txt", status: 200, html: false },
  { path: "/sitemap-index.xml", status: 200, html: false },
  { path: "/og-default.png", status: 200, html: false },
] as const;

for (const { path, status } of RESPONSES) {
  test(`${path} returns ${status} with the full security header set and no cookie`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(status);
    const headers = response.headers();
    for (const [name, value] of Object.entries(HEADERS)) {
      expect(headers[name], name).toBe(value);
    }
    expect(headers["set-cookie"]).toBeUndefined();
  });
}

test("a bundled static asset carries the full security header set", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
  expect(href).toMatch(/^\/_astro\//);
  const response = await request.get(href!);
  expect(response.status()).toBe(200);
  for (const [name, value] of Object.entries(HEADERS)) {
    expect(response.headers()[name], name).toBe(value);
  }
  expect(response.headers()["set-cookie"]).toBeUndefined();
});

for (const { path } of RESPONSES.filter((r) => r.html)) {
  test(`${path} carries the page CSP meta tag with the closed allow-list`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /Content Security Policy/i.test(message.text())) {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await recordCspViolations(page);
    await page.goto(path);
    const meta = page.locator('meta[http-equiv="content-security-policy"]');
    await expect(meta).toHaveCount(1);
    const content = (await meta.getAttribute("content")) ?? "";

    const directives = new Map(
      content
        .split(";")
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const [name, ...sources] = d.split(/\s+/);
          return [name!, sources] as const;
        }),
    );
    for (const [name, expected] of Object.entries(REQUIRED_DIRECTIVES)) {
      const sources = directives.get(name);
      expect(sources, name).toBeDefined();
      expect(sources!.filter((s) => !/^'sha(256|384|512)-/.test(s)).sort(), name).toEqual([...expected].sort());
    }
    expect(directives.get("script-src")!.some((s) => s.startsWith("'sha256-"))).toBe(true);
    for (const forbidden of FORBIDDEN) expect(content).not.toContain(forbidden);
    for (const sources of directives.values()) expect(sources).not.toContain("https:");

    // Astro injects the meta tag where it injects head content (just before the
    // stylesheet), so the pre-paint theme script, which must run before the
    // stylesheet (FR-013), is the one script ahead of it. Its hash is still in
    // the policy; every other script on the page comes after the meta tag.
    const order = await page.evaluate(() => {
      const all = [...document.querySelectorAll("meta, script")];
      const metaAt = all.findIndex((el) => el.getAttribute("http-equiv") === "content-security-policy");
      const before = all.slice(0, metaAt).filter((el) => el.tagName === "SCRIPT");
      return {
        metaAt,
        before: before.map((el) => ({ inline: !el.hasAttribute("src") && !el.getAttribute("type"), text: el.textContent })),
        after: all.slice(metaAt).filter((el) => el.tagName === "SCRIPT").length,
      };
    });
    expect(order.metaAt).toBeGreaterThanOrEqual(0);
    expect(order.before).toHaveLength(1);
    expect(order.before[0]!.inline).toBe(true);
    const digest = await page.evaluate(async (text) => {
      const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
      return btoa(String.fromCharCode(...bytes));
    }, order.before[0]!.text ?? "");
    expect(directives.get("script-src")).toContain(`'sha256-${digest}'`);
    expect(order.after).toBeGreaterThan(0);

    // Let the page's own scripts run, then check nothing was refused.
    await page.waitForLoadState("load");
    await page.locator("button[data-theme-toggle]").click();
    expect(await cspViolations(page)).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
