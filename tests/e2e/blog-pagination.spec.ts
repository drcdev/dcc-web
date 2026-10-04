// Pagination on the fixture site (port 4322, playwright.config.ts project `sections`; specs/008-blog
// tasks.md T057; FR-012). The fixture site holds fixture posts only: the three FIXTURE_POSTS
// (text-only, long-title and every-part) and 13 generated posts, 16 in all. Every generated post
// carries the agentic-ai topic, so the all posts listing and that topic each have a second page.
// The totals are fixed, so the cases do not move when a real post is published. Where the real
// content guarantees live: every real post is listed as a card, newest first, by blog.spec.ts "all
// posts page" (port 4321).
import { test, expect } from "@playwright/test";
import { blog } from "../../src/config/blog.ts";

const ALL = "/writing/all/";
const TOPIC = "/writing/topics/agentic-ai/";

// 13 generated posts + 3 fixture posts = 16 posts; the topic is on the 13 generated ones only.
const TOTALS = new Map<string, number>([
  [ALL, 16],
  [TOPIC, 13],
]);
for (const [first, total] of TOTALS) {
  // Page 2 must exist, which the cases below rely on; the fixed totals above guarantee it.
  if (total <= blog.pageSize) {
    throw new Error(`tests/e2e/blog-pagination.spec.ts: ${first} has ${total} posts; the cases need a second page.`);
  }
}

for (const [name, first] of [
  ["all posts", ALL],
  ["topic", TOPIC],
] as const) {
  const total = TOTALS.get(first)!;
  const last = Math.ceil(total / blog.pageSize);
  test.describe(`${name} pagination`, () => {
    test("pages from 1 to 2 and back, marking the current page", async ({ page }) => {
      await page.goto(first);
      const pages = page.getByRole("navigation", { name: "Pages" });
      await expect(pages).toBeVisible();
      await expect(pages.getByRole("link", { name: "Previous page" })).toHaveCount(0);
      await expect(pages.locator('[aria-current="page"]')).toHaveText("1");
      await expect(page.locator("main [data-post-card]")).toHaveCount(blog.pageSize);

      await pages.getByRole("link", { name: "Next page" }).click();
      await page.waitForURL(`**${first}2/`);
      await expect(page.getByRole("navigation", { name: "Pages" }).locator('[aria-current="page"]')).toHaveText("2");
      await expect(page.locator("main [data-post-card]")).toHaveCount(Math.min(blog.pageSize, total - blog.pageSize));
      await expect(page.locator("main h1")).toContainText("page 2");
      expect(await page.title()).toContain(", page 2 · ");
      // Only the last page has no Next link.
      await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Next page" })).toHaveCount(
        last === 2 ? 0 : 1,
      );

      await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Previous page" }).click();
      await page.waitForURL(`**${first}`);
      await expect(page.locator("main [data-post-card]")).toHaveCount(blog.pageSize);
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
      for (const path of [`${first}1/`, `${first}${last + 1}/`]) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(404);
      }
    });
  });
}
