// The projects pages in forced-colours mode (US5; FR-024). Author colours are
// replaced by the system palette, so what must survive is structure: borders, the
// chosen mark (a word plus a column edge), the status, the progress bar and focus.
import { expect, test, type Page } from "@playwright/test";

const STORY = "/projects/focus-pocus/";

test.use({ forcedColors: "active", reducedMotion: "no-preference", viewport: { width: 1280, height: 800 } });

/** What a system colour keyword resolves to, as the browser reports it. */
const systemColor = (page: Page, keyword: string) =>
  page.evaluate((value) => {
    const probe = document.createElement("span");
    probe.style.color = value;
    document.body.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, keyword);

test("chapter rules and the comparison keep visible borders", async ({ page }) => {
  await page.goto(STORY);
  const canvasText = await systemColor(page, "CanvasText");
  const chapter = page.locator("section[data-stage]").first();
  await expect(chapter).toHaveCSS("border-top-color", canvasText);
  expect(parseFloat(await chapter.evaluate((el) => getComputedStyle(el).borderTopWidth))).toBeGreaterThan(0);
  const cell = page.locator("[data-comparison] td").first();
  await expect(cell).toHaveCSS("border-top-color", canvasText);
});

test("the chosen option is marked in words and by a column edge", async ({ page }) => {
  await page.goto(STORY);
  const label = page.locator("[data-chosen-label]");
  await expect(label).toBeVisible();
  await expect(label).toHaveText(/Chosen/);
  const highlight = await systemColor(page, "Highlight");
  await expect(page.locator("[data-comparison] th[data-chosen]")).toHaveCSS("border-left-color", highlight);
});

test("the status pill keeps a border", async ({ page }) => {
  await page.goto(STORY);
  const status = page.locator("[data-status]").first();
  await expect(status).toBeVisible();
  expect(parseFloat(await status.evaluate((el) => getComputedStyle(el).borderTopWidth))).toBeGreaterThan(0);
  await expect(status).toHaveCSS("border-top-color", await systemColor(page, "CanvasText"));
});

test("the progress bar is drawn in a system colour as the page scrolls", async ({ page }) => {
  await page.goto(STORY);
  const bar = page.locator("[data-progress]");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
  await expect.poll(() => bar.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(100);
  await expect(bar).toHaveCSS("background-color", await systemColor(page, "Highlight"));
});

test("keyboard focus is outlined", async ({ page }) => {
  await page.goto(STORY);
  const link = page.getByRole("navigation", { name: "In this story" }).getByRole("link").first();
  await link.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(link).toBeFocused();
  const outline = await link.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThan(0);
});

test("the index keeps row borders", async ({ page }) => {
  await page.goto("/projects/");
  await expect(page.locator("[data-project]").first()).toHaveCSS("border-top-color", await systemColor(page, "CanvasText"));
});
