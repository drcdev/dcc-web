// Not-found page: HTTP status and content (contracts/shell-dom.md; FR-006,
// FR-016; T070). Retired blog addresses, unbuilt nav destinations and any
// other unmatched address are served by Cloudflare's static 404 handling
// (wrangler.jsonc assets.not_found_handling: "404-page"), which returns this
// page's build output with a genuine HTTP 404 status, not a soft 404.
import { test, expect } from "@playwright/test";
import { futureDestinations } from "../../src/config/navigation.ts";
import { pages } from "../helpers/content.ts";
import { expectThemeClass, setTheme } from "./color-theme.ts";

// Retired Ghost blog addresses that this rebuild does not carry over
// (docs/design-source.md "Current live URLs" / "What doesn't carry over").
const RETIRED_ADDRESSES = ["/drift/2025/x/", "/convergence/", "/news/", "/topic/x/"] as const;

// Ghost-only addresses (FR-019, FR-027a): no redirect, the site's own not-found page.
const GHOST_ADDRESSES = ["/tag/x/", "/author/x/", "/rss/", "/ghost/", "/2024/05/an-old-ghost-post/"] as const;

const NOT_FOUND_ADDRESSES = [...RETIRED_ADDRESSES, ...GHOST_ADDRESSES, ...futureDestinations, "/cookie-policy/"] as const;

// Addresses that are built and must keep returning 200 (robots.txt: T083).
const BUILT_ADDRESSES = [...pages.map((page) => page.address), "/robots.txt"];

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
    await setTheme(page, "light");
    await page.goto(NOT_FOUND_ADDRESSES[0]);
    await expectThemeClass(page, "light");
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  });
});

test.describe("old Ghost addresses (FR-019, FR-027a)", () => {
  for (const path of GHOST_ADDRESSES) {
    test(`${path} is a 404 with no redirect`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(404);
      expect(response.headers()["location"]).toBeUndefined();
    });

    test(`${path} explains the page does not exist, links home and has one main heading`, async ({ page }) => {
      await page.goto(path);
      const main = page.getByRole("main");
      await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(main.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
      await expect(main).toContainText(/nothing here/i);
      await expect(main).toContainText(/older blog addresses/i);
      await expect(main).toContainText(/not carried over/i);
      await expect(main.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/");
    });
  }
});
