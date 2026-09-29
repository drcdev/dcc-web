// Not-found page: HTTP status and content (contracts/shell-dom.md; FR-006,
// FR-016; T070). Retired blog addresses, unbuilt nav destinations and any
// other unmatched address are served by Cloudflare's static 404 handling
// (wrangler.jsonc assets.not_found_handling: "404-page"), which returns this
// page's build output with a genuine HTTP 404 status, not a soft 404.
import { test, expect } from "@playwright/test";
import { futureDestinations } from "../../src/config/navigation.ts";

// Retired Ghost blog addresses that this rebuild does not carry over
// (docs/design-source.md "Current live URLs" / "What doesn't carry over").
const RETIRED_ADDRESSES = ["/drift/2025/x/", "/convergence/", "/news/", "/topic/x/", "/author/x/"] as const;

const NOT_FOUND_ADDRESSES = [...RETIRED_ADDRESSES, ...futureDestinations] as const;

// Addresses that are built and must keep returning 200. robots.txt is built in
// Phase 8 (T083); add "/robots.txt" here once it exists.
const BUILT_ADDRESSES = ["/"] as const;

test.describe("not-found status", () => {
  for (const path of NOT_FOUND_ADDRESSES) {
    test(`${path} returns HTTP 404`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(404);
    });
  }

  for (const path of BUILT_ADDRESSES) {
    test(`${path} returns HTTP 200`, async ({ request }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
    });
  }
});

test.describe("not-found content", () => {
  for (const path of NOT_FOUND_ADDRESSES) {
    test(`${path} shows the not-found page inside the shell`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
    });
  }

  test("renders in the visitor's currently-chosen theme", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("color-theme", "light"));
    await page.goto(NOT_FOUND_ADDRESSES[0]);
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});
