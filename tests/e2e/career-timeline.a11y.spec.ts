// Accessibility of the career timeline in the states that exist only after a press (specs/041-career-timeline
// US3; SC-004). The template a11y runs cover /about/ as loaded; this adds each category chosen and a muted
// step opened by hand, light and dark, phone and desktop. Runs on the fixture site (port 4322) so the steps
// are fixed; the categories offered are read from the page.
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { setTheme } from "./color-theme.ts";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEMES = ["dark", "light"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;
const ABOUT = "http://localhost:4322/about/";
const timeline = "[data-career]";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).include(timeline).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
}

for (const size of SIZES) {
  for (const theme of THEMES) {
    test.describe(`${size.name} ${theme}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await setTheme(page, theme);
        await page.goto(ABOUT);
        await expect(page.locator("career-timeline")).toHaveAttribute("data-ready", "");
      });

      test("has zero axe violations with each offered category chosen", async ({ page }) => {
        const categories = await page.locator("[data-career-filter] button[data-category]").evaluateAll((els) => els.map((el) => el.getAttribute("data-category")!));
        expect(categories.length).toBeGreaterThan(0);
        for (const category of categories) {
          await page.locator(`[data-career-filter] button[data-category="${category}"]`).click();
          await expectNoAxeViolations(page);
        }
        await page.locator("[data-career-filter] [data-category-all]").click();
        await expectNoAxeViolations(page);
      });

      test("has zero axe violations with a muted step opened by hand", async ({ page }) => {
        await page.locator("[data-career-filter] button[data-category]").first().click();
        const muted = page.locator("[data-career] [data-muted]").first();
        await muted.locator("summary").click();
        await expect(muted.locator("[data-step-detail]")).toBeVisible();
        await expectNoAxeViolations(page);
      });

      test("keeps 24 px targets on the filter buttons and summaries", async ({ page }) => {
        await page.locator("[data-career-filter] button[data-category]").first().click();
        for (const locator of [page.locator("[data-career-filter] button"), page.locator("[data-career] summary")]) {
          for (const el of await locator.all()) {
            const box = (await el.boundingBox())!;
            expect(box.width).toBeGreaterThanOrEqual(24);
            expect(box.height).toBeGreaterThanOrEqual(24);
          }
        }
      });
    });
  }
}
