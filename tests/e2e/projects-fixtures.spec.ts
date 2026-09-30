// The projects index on the fixture site (port 4322, playwright.config.ts project
// `sections`): five projects (Focus Pocus and the four fixtures) so filtering,
// clearing, sharing and the unknown-theme message have something to work on
// (US4; contracts/filter-island.md; FR-014).
import { expect, test, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const INDEX = "/projects/";
const rows = (page: Page) => page.locator("[data-project]:not([hidden])");
const status = (page: Page) => page.locator("[data-filter-status]");

test("lists every project, with the controls ready", async ({ page }) => {
  await page.goto(INDEX);
  await expect(page.locator("project-filter[data-ready]")).toHaveCount(1);
  await expect(rows(page)).toHaveCount(5);
  await expect(status(page)).toHaveText("Showing all 5 projects.");
  await expect(page.getByRole("group", { name: "Filter by theme" })).toBeVisible();
  await expect(page.locator("[data-filter-all]")).toHaveAttribute("aria-pressed", "true");
});

test("theme variants collapse to one button", async ({ page }) => {
  await page.goto(INDEX);
  // Tooling is on two projects and AI integration on two: one button each.
  await expect(page.locator('button[data-theme="tooling"]')).toHaveCount(1);
  await expect(page.locator('button[data-theme="ai-integration"]')).toHaveCount(1);
});

test("filters by theme, announces the count and clears", async ({ page }) => {
  await page.goto(INDEX);
  await page.locator('button[data-theme="tooling"]').click();
  await expect(rows(page)).toHaveCount(2);
  await expect(status(page)).toHaveText("Showing 2 projects about Tooling.");
  await expect(page).toHaveURL(/\/projects\/\?theme=tooling$/);
  await expect(page.locator('button[data-theme="tooling"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-filter-all]").click();
  await expect(rows(page)).toHaveCount(5);
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(status(page)).toHaveText("Showing all 5 projects.");
});

test("keeps focus on the pressed button", async ({ page }) => {
  await page.goto(INDEX);
  const button = page.locator('button[data-theme="macos"]');
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toBeFocused();
});

test("reloading or sharing ?theme= applies the filter", async ({ page }) => {
  await page.goto(`${INDEX}?theme=tooling`);
  await expect(rows(page)).toHaveCount(2);
  await expect(page.locator('button[data-theme="tooling"]')).toHaveAttribute("aria-pressed", "true");
  await expect(status(page)).toHaveText("Showing 2 projects about Tooling.");
  await page.reload();
  await expect(rows(page)).toHaveCount(2);
});

test("an unknown theme lists nothing, says so and keeps the address until cleared", async ({ page }) => {
  await page.goto(`${INDEX}?theme=nonsense`);
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator("[data-filter-empty]")).toBeVisible();
  await expect(status(page)).toHaveText("No projects match this theme.");
  await expect(page).toHaveURL(/\?theme=nonsense$/);
  await page.getByRole("button", { name: "Show all projects" }).click();
  await expect(rows(page)).toHaveCount(5);
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator("[data-filter-empty]")).toBeHidden();
  await expect(page.locator("[data-filter-all]")).toBeFocused();
});

test("an unknown ?theme= with markup renders nothing from it and is not repeated", async ({ page }) => {
  await page.goto(`${INDEX}?theme=${encodeURIComponent("<img src=x onerror=window.__x=1>")}`);
  await expect(page.locator("[data-filter-empty]")).toBeVisible();
  await expect(page.locator("main img[src='x']")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
  await expect(status(page)).not.toContainText("img");
  await expect(page.locator("main")).not.toContainText("onerror");
});

test("changing the filter twice then pressing Back leaves the index (no history entries)", async ({ page }) => {
  await page.goto("/");
  await page.goto(INDEX);
  await page.locator('button[data-theme="tooling"]').click();
  await page.locator('button[data-theme="macos"]').click();
  await expect(page).toHaveURL(/\?theme=macos$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/projects/);
});

test("announces the status as a polite live region", async ({ page }) => {
  await page.goto(INDEX);
  await expect(status(page)).toHaveAttribute("aria-live", "polite");
  await expect(status(page)).toHaveAttribute("role", "status");
  await page.locator('button[data-theme="tooling"]').click();
  await page.locator('button[data-theme="tooling"]').click();
  await expect(status(page)).toHaveText("Showing 2 projects about Tooling.");
});

test("filter targets are at least 24x24 px", async ({ page }) => {
  await page.goto(INDEX);
  for (const button of await page.locator("project-filter button:visible").all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  }
});

test("buttons wrap and the page does not scroll sideways at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(INDEX);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  const tops = new Set<number>();
  for (const button of await page.locator("project-filter button:visible").all()) {
    tops.add(Math.round((await button.boundingBox())!.y));
  }
  expect(tops.size).toBeGreaterThan(1);
});

// US6: embedded demo, link-only demo and clip (contracts/pages-dom.md). The demo
// address is answered locally so the run needs no network.
test.describe("demos and clips", () => {
  test("an embedded demo is a lazy frame that loads on reaching it, with no CSP violation", async ({ page }) => {
    await recordCspViolations(page);
    const requested: string[] = [];
    await page.route("https://demo.drc.dev/**", (route) => {
      requested.push(route.request().url());
      return route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Demo</title><p>Demo</p>" });
    });
    await page.goto("/projects/every-setting/");
    const frame = page.locator("iframe");
    await expect(frame).toHaveCount(1);
    await expect(frame).toHaveAttribute("loading", "lazy");
    await expect(frame).toHaveAttribute("title", "Every setting demo");
    await frame.scrollIntoViewIfNeeded();
    await expect.poll(() => requested.length).toBeGreaterThan(0);
    expect(await cspViolations(page)).toEqual([]);
    await expect(page.getByRole("link", { name: "Open the Every setting demo" })).toBeVisible();
  });

  test("a link-only story (Focus Pocus, a stand-in) has no frame", async ({ page }) => {
    await page.goto("/projects/focus-pocus/");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Focus Pocus on drc.dev" })).toBeVisible();
  });

  test("a clip shows its controls and is not playing", async ({ page }) => {
    await page.goto("/projects/every-setting/");
    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    await video.scrollIntoViewIfNeeded();
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).toHaveJSProperty("autoplay", false);
    await expect(video).toHaveJSProperty("muted", true);
  });
});

// FR-080: a story with its own sharing image uses it (resized) instead of the site default.
test("a story with its own sharing image shares that image and its alt text", async ({ page, request }) => {
  await page.goto("/projects/every-setting/");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toBeTruthy();
  expect(image).not.toContain("og-default");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "A sharing image");
  const response = await request.get(new URL(image!).pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});

// US8: a story that uses every block (tests/fixtures/projects/every-block.mdx).
test.describe("the every-block story", () => {
  test("renders all seven chapters, the page sections and the invitation", async ({ page }) => {
    await page.goto("/projects/every-block/");
    await expect(page.locator("[data-chapter]")).toHaveCount(7);
    await expect(page.getByText("An intro paragraph inside a chapter.")).toBeVisible();
    await expect(page.getByText("A titled block")).toBeVisible();
    await expect(page.getByText("A figure inside a chapter")).toBeVisible();
    await expect(page.getByRole("link", { name: "See the source" })).toBeVisible();
    await expect(page.locator('a[href="/contact/?project=every-block"]')).toHaveCount(1);
  });

  test("marks placeholders and the draft chapter with real text", async ({ page }) => {
    await page.goto("/projects/every-block/");
    await expect(page.locator("[data-placeholder]").first()).toContainText("Placeholder");
    await expect(page.locator("#lessons [data-draft-mark]")).toHaveText("Draft for review");
    await expect(page.locator("[data-draft-mark]")).toHaveCount(1);
  });

  test("the comparison scrolls with the keyboard at a narrow width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/projects/every-block/");
    const region = page.locator("[data-comparison]");
    await region.scrollIntoViewIfNeeded();
    await region.focus();
    await expect(region).toBeFocused();
    expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
