// Pagination on the fixture site (port 4322, playwright.config.ts project `sections`; specs/008-blog
// tasks.md T057; FR-012). The fixture site has the four sample posts and 13 generated posts (17 in
// all, so 12 on page 1 and 5 on page 2); every generated post and two samples are on `agentic-ai`.
import { test, expect } from "@playwright/test";

const ALL = "/writing/all/";
const TOPIC = "/writing/topics/agentic-ai/";

for (const [name, first] of [
  ["all posts", ALL],
  ["topic", TOPIC],
] as const) {
  test.describe(`${name} pagination`, () => {
    test("pages from 1 to 2 to the last and back, marking the current page", async ({ page }) => {
      await page.goto(first);
      const pages = page.getByRole("navigation", { name: "Pages" });
      await expect(pages).toBeVisible();
      await expect(pages.getByRole("link", { name: "Previous page" })).toHaveCount(0);
      await expect(pages.locator('[aria-current="page"]')).toHaveText("1");
      await expect(page.locator("main [data-post-card]")).toHaveCount(12);

      await pages.getByRole("link", { name: "Next page" }).click();
      await page.waitForURL(`**${first}2/`);
      await expect(page.getByRole("navigation", { name: "Pages" }).locator('[aria-current="page"]')).toHaveText("2");
      await expect(page.locator("main h1")).toContainText("page 2");
      expect(await page.title()).toContain(", page 2 · ");
      await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Next page" })).toHaveCount(0);

      await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Previous page" }).click();
      await page.waitForURL(`**${first}`);
      await expect(page.locator("main [data-post-card]")).toHaveCount(12);
    });

    test("links every page number by its accessible name and page 1 to the bare address", async ({ page }) => {
      await page.goto(`${first}2/`);
      const pages = page.getByRole("navigation", { name: "Pages" });
      await expect(pages.getByRole("link", { name: "Page 1", exact: true })).toHaveAttribute("href", first);
      await expect(pages.locator('[aria-current="page"]')).toHaveText("2");
      await expect(pages.locator('[aria-current="page"]')).not.toHaveAttribute("href", /.*/);
    });

    test("gives each pagination link a target of at least 24 by 24 CSS px", async ({ page }) => {
      await page.goto(first);
      const boxes = await page
        .getByRole("navigation", { name: "Pages" })
        .locator("a, [aria-current]")
        .evaluateAll((els) =>
          els.map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
          }),
        );
      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    test("returns the not-found page for page 1 and for a page past the last", async ({ page }) => {
      for (const path of [`${first}1/`, `${first}3/`]) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(404);
      }
    });
  });
}
