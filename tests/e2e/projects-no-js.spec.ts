// The projects pages without script (US5; FR-064 to FR-066; contracts/filter-island.md).
// The story needs no script of its own (FR-011), and the index lists every project with the
// filter controls, status and empty message all hidden, never dead.
import { expect, test } from "@playwright/test";

const STORY = "/projects/focus-pocus/";
const INDEX = "/projects/";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the story reads fully: four parts, alt text, the whole comparison, all links and the invitation", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.locator("main h2")).toHaveCount(4);
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
    await expect(page.locator("main section[data-part]")).toHaveCount(4);
    const images = page.locator("main img");
    const count = await images.count();
    for (let i = 0; i < count; i += 1) await expect(images.nth(i)).toHaveAttribute("alt", /.+/);
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    expect(await table.getByRole("columnheader").count()).toBeGreaterThan(2);
    await expect(page.getByRole("navigation", { name: "In this story" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Focus Pocus on drc.dev" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Source code for Focus Pocus/ })).toBeVisible();
    await expect(page.locator("[data-invitation-text]")).toBeVisible();
    await expect(page.getByRole("link", { name: /Tell me about a problem like Focus Pocus/ })).toBeVisible();
  });

  test("the story has no script beyond the shell's", async ({ page }) => {
    const scripts = async (path: string) => {
      const html = await (await page.request.get(path)).text();
      return Array.from(html.matchAll(/<script\b[^>]*>/g), (m) => m[0]).sort();
    };
    const story = await scripts(STORY);
    const plain = await scripts("/about/");
    expect(story).toEqual(plain);
  });

  test("the index lists every project and shows no controls, status or empty message", async ({ page }) => {
    await page.goto(INDEX);
    const rows = page.locator("[data-project]");
    expect(await rows.count()).toBeGreaterThan(0);
    for (const row of await rows.all()) {
      await expect(row).toBeVisible();
      await expect(row.getByRole("link")).toHaveCount(1);
    }
    await expect(page.locator("[data-filter-controls]")).toBeHidden();
    await expect(page.locator("[data-filter-status]")).toBeHidden();
    await expect(page.locator("[data-filter-empty]")).toBeHidden();
    await expect(page.locator("[data-filter-controls] button:visible")).toHaveCount(0);
    await expect(page.locator("project-filter[data-ready]")).toHaveCount(0);
  });

  test("a project row opens its story", async ({ page }) => {
    await page.goto(INDEX);
    await page.getByRole("link", { name: "Focus Pocus" }).first().click();
    await expect(page).toHaveURL(/\/projects\/focus-pocus\/$/);
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
  });
});

test.describe("with the island script blocked", () => {
  test("the controls stay hidden and every project stays listed", async ({ page }) => {
    // The island script is inlined into the page, so blocking it means removing every script tag.
    await page.route("**/projects/", async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(/<script\b[\s\S]*?<\/script>/g, "");
      await route.fulfill({ response, body: html });
    });
    await page.goto(INDEX);
    await expect(page.locator("[data-project]").first()).toBeVisible();
    await expect(page.locator("project-filter[data-ready]")).toHaveCount(0);
    await expect(page.locator("[data-filter-controls] button:visible")).toHaveCount(0);
    await expect(page.locator("[data-filter-status]")).toBeHidden();
    await expect(page.locator("[data-filter-empty]")).toBeHidden();
  });
});
