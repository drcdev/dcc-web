// Visitor statistics resilience (research R10; FR-024b, FR-025, FR-026,
// SC-009). Cloudflare Web Analytics' automatic setup injects the beacon tag at
// the edge on the main build only, so it is never in the repository or the
// build. These tests simulate that injection on pages served by `wrangler dev`:
// the page policy must allow the beacon, and the site must work unchanged when
// the beacon is blocked.
import { test, expect, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const BEACON_ORIGIN = "https://static.cloudflareinsights.com";
const BEACON_URL = `${BEACON_ORIGIN}/beacon.min.js`;
const REPORT_URL = "https://cloudflareinsights.com/simulated-report";
const SWITCH = "button[data-theme-toggle]";

/** Adds a beacon tag before </body> of every HTML page, the way the edge does. */
async function injectBeaconTag(page: Page) {
  await page.route(
    (url) => url.origin === "http://127.0.0.1:4321",
    async (route) => {
      if (route.request().resourceType() !== "document") return route.continue();
      const response = await route.fetch();
      const html = await response.text();
      await route.fulfill({
        response,
        body: html.replace("</body>", `<script defer src="${BEACON_URL}"></script></body>`),
      });
    },
  );
}

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) errors.push(message.text());
  });
  return errors;
}

test("the built policy allows both Web Analytics hosts", async ({ page }) => {
  await page.goto("/");
  const content = (await page.locator('meta[http-equiv="content-security-policy"]').getAttribute("content")) ?? "";
  const directive = (name: string) =>
    content
      .split(";")
      .map((d) => d.trim().split(/\s+/))
      .find(([n]) => n === name)
      ?.slice(1) ?? [];
  expect(directive("script-src")).toContain(BEACON_ORIGIN);
  expect(directive("connect-src")).toContain("https://cloudflareinsights.com");
});

test("a page with a simulated beacon loads it with no CSP violation (FR-024b)", async ({ page }) => {
  const errors = trackErrors(page);
  await recordCspViolations(page);
  await injectBeaconTag(page);
  let reported = false;
  await page.route(BEACON_URL, (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.__beaconRan = true; fetch(${JSON.stringify(REPORT_URL)}, { method: "POST", body: "{}" }).then(() => { window.__beaconReported = true; });`,
    }),
  );
  await page.route(REPORT_URL, (route) => {
    reported = true;
    return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
  });

  await page.goto("/");
  await expect.poll(() => page.evaluate(() => (window as { __beaconRan?: boolean }).__beaconRan)).toBe(true);
  await expect.poll(() => reported).toBe(true);
  expect(await cspViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("with the beacon blocked, pages, navigation and the theme switch still work (FR-026)", async ({ page }) => {
  const errors = trackErrors(page);
  await recordCspViolations(page);
  await injectBeaconTag(page);
  let blocked = 0;
  await page.route(`${BEACON_ORIGIN}/**`, (route) => {
    blocked += 1;
    return route.abort("blockedbyclient");
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect.poll(() => blocked).toBeGreaterThan(0);

  const html = page.locator("html");
  await expect(html).toHaveClass(/(^|\s)dark(\s|$)/);
  await page.locator(SWITCH).click();
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);
  await expect(page.locator(SWITCH)).toHaveAccessibleName("Theme: Light");

  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Don Coleman" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(html).not.toHaveClass(/(^|\s)dark(\s|$)/);

  expect(await cspViolations(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("browsing several pages sets no cookie (SC-009, FR-025)", async ({ page, context }) => {
  for (const path of ["/", "/nope/", "/robots.txt", "/sitemap-index.xml", "/"]) {
    await page.goto(path);
  }
  await page.locator(SWITCH).click();
  expect(await context.cookies()).toEqual([]);
});
