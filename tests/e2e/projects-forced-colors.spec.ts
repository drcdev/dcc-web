// The projects pages in forced-colours mode (US5; FR-024). Author colours are
// replaced by the system palette, so what must survive is structure: borders, the
// chosen mark (a word plus a row edge), the status, the progress bar and focus.
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

test("the comparison table keeps visible borders", async ({ page }) => {
  await page.goto(STORY);
  const canvasText = await systemColor(page, "CanvasText");
  const cell = page.locator("[data-options-table] td").first();
  await expect(cell).toHaveCSS("border-top-color", canvasText);
  expect(parseFloat(await cell.evaluate((el) => getComputedStyle(el).borderTopWidth))).toBeGreaterThan(0);
  const header = page.locator("[data-options-table] th").first();
  await expect(header).toHaveCSS("border-top-color", canvasText);
});

test("every answer is in words, so no answer depends on its tint", async ({ page }) => {
  await page.goto(STORY);
  const cells = page.locator("[data-options-table] td[data-fit]");
  expect(await cells.count()).toBeGreaterThan(0);
  for (const cell of await cells.all()) await expect(cell).toHaveText(/Yes|Partly|No/);
});

test("the chosen option is marked in words and by a row edge", async ({ page }) => {
  await page.goto(STORY);
  const label = page.locator("[data-chosen-label]");
  await expect(label).toBeVisible();
  await expect(label).toHaveText(/Chosen/);
  const highlight = await systemColor(page, "Highlight");
  const edge = await page.locator("[data-options-table] tr[data-chosen] th").evaluate((el) => {
    const style = getComputedStyle(el);
    return { left: style.borderLeftColor, leftWidth: parseFloat(style.borderLeftWidth), top: style.borderTopColor, topWidth: parseFloat(style.borderTopWidth) };
  });
  // The heavier edge may be on the row's left or top; either is drawn in the system highlight colour.
  const marked = (edge.left === highlight && edge.leftWidth >= 2) || (edge.top === highlight && edge.topWidth >= 2);
  expect(marked, JSON.stringify({ edge, highlight })).toBe(true);
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
  const link = page.locator("[data-invitation]");
  await link.focus();
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
