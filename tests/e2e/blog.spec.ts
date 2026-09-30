// Blog end-to-end tests against the production build served by `wrangler dev`
// (specs/008-blog/tasks.md T030; contracts/blog-pages.md "Post"). Later phases
// add the landing, listing, topic, share and feed cases to this file (T042,
// T057, T063, T067, T071). The sample posts are drafts, so every build that is
// not a production build shows them.
import { test, expect, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const POST = "/writing/sample-everything/";
const TEXT_ONLY_POST = "/writing/sample-text-only/";
const CAPTIONED_CODE = "const { title, summary } = entry.data;\nconsole.log(`${title}: ${summary}`);";

const noSidewaysScroll = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

test.describe("post page reads without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the title, the body, the code and the table, and no copy button", async ({ page }) => {
    await page.goto(POST);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every kind of content a post can hold");
    await expect(page.locator("[data-post-body]")).toContainText("A captioned image");
    await expect(page.locator("figure[data-code-block]").first()).toBeVisible();
    await expect(page.locator("figure[data-code-block] pre").first()).toContainText("const { title, summary }");
    await expect(page.locator("figure[data-code-block] button:visible")).toHaveCount(0);
    await expect(page.locator(".table-wrapper table")).toBeVisible();
    await expect(page.locator("[data-views-note]")).toBeVisible();
  });
});

test.describe("post page", () => {
  test("shows the update date beside the publication date on an updated post", async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator("article time[datetime='2026-08-27']")).toHaveText("August 27, 2026");
    await expect(page.locator("article time[datetime='2026-09-15']")).toHaveText("September 15, 2026");
    await expect(page.locator("article")).toContainText("Updated");
    await page.goto(TEXT_ONLY_POST);
    await expect(page.locator("article")).not.toContainText("Updated");
  });

  test("has no content security policy violation and no inline style inside highlighted code", async ({ page }) => {
    await recordCspViolations(page);
    const failed: string[] = [];
    page.on("pageerror", (error) => failed.push(error.message));
    await page.goto(POST);
    await page.locator("figure[data-code-block] button").first().waitFor({ state: "visible" });
    expect(await cspViolations(page)).toEqual([]);
    expect(failed).toEqual([]);
    await expect(page.locator(".astro-code")).not.toHaveCount(0);
    await expect(page.locator(".astro-code [style], .astro-code[style]")).toHaveCount(0);
    // Highlighting works: some tokens carry a class.
    await expect(page.locator(".astro-code .hl-keyword").first()).toBeAttached();
  });

  test("puts the exact code on the clipboard and says Copied, then resets with focus kept", async ({
    browser,
  }) => {
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    await page.goto(POST);
    const block = page.locator("figure[data-code-block]").first();
    const button = block.getByRole("button");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Copy code");
    await button.click();
    await expect(button).toHaveText("Copied");
    await expect(block.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(CAPTIONED_CODE);
    await expect(button).toBeFocused();
    await expect(button).toHaveText("Copy code", { timeout: 4000 });
    await expect(block.getByRole("status")).toHaveText("");
    await expect(button).toBeFocused();
    await context.close();
  });

  test("says the copy failed, and how to copy by hand, when the browser refuses", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
      });
    });
    await page.goto(POST);
    const block = page.locator("figure[data-code-block]").first();
    const button = block.getByRole("button");
    await button.click();
    await expect(button).toHaveText("Copy failed. Select the code to copy it.");
    await expect(block.getByRole("status")).toHaveText("Copy failed. Select the code to copy it.");
    // The code stays selectable.
    expect(await block.locator("pre").evaluate((pre) => getComputedStyle(pre).userSelect)).not.toBe("none");
    await expect(button).toHaveText("Copy code", { timeout: 4000 });
  });

  test("shows the caption on a captioned code block and none on the others", async ({ page }) => {
    await page.goto(POST);
    const blocks = page.locator("figure[data-code-block]");
    await expect(blocks.first().locator("figcaption")).toHaveText("Reading a post's settings");
    await expect(blocks.nth(1).locator("figcaption")).toHaveCount(0);
  });

  test("keeps the page from scrolling sideways at 320 px, with the wide table and the long code line", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(POST);
    await noSidewaysScroll(page);
    const table = page.locator(".table-wrapper");
    expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    const longest = page.locator("figure[data-code-block] pre", { hasText: "sample-post-check" });
    expect(await longest.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  });

  test("keeps wide and full-width images inside the page at phone and desktop widths", async ({ page }) => {
    for (const width of [320, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(POST);
      await expect(page.locator(".kg-width-wide")).toBeVisible();
      await expect(page.locator(".kg-width-full")).toBeVisible();
      await noSidewaysScroll(page);
      for (const selector of [".kg-width-wide", ".kg-width-full"]) {
        const box = await page.locator(selector).boundingBox();
        expect(box!.x, `${selector} at ${width}`).toBeGreaterThanOrEqual(-1);
        expect(box!.x + box!.width, `${selector} at ${width}`).toBeLessThanOrEqual(width + 1);
      }
    }
  });

  test("shows a scrollable table region that a keyboard can reach", async ({ page }) => {
    await page.goto(POST);
    const region = page.getByRole("region", { name: "Table" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await region.focus();
    await expect(region).toBeFocused();
  });
});
