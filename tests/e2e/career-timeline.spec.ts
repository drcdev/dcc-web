// The career timeline on the fixture site's /about/ (specs/041-career-timeline US1; contracts/
// timeline-markup.md). Fixture steps only, so the expectations come from the DOM, not from literals.
// Browser-only behaviour: toggling, focus, geometry, print, motion and forced colours.
import { expect, test } from "@playwright/test";

const ABOUT = "/about/";
const steps = "[data-career] [data-step]";

test("lists the steps earliest to latest, each closed", async ({ page }) => {
  await page.goto(ABOUT);
  const count = await page.locator(steps).count();
  expect(count).toBeGreaterThan(1);
  const starts = await page.locator(`${steps} summary time:first-of-type`).evaluateAll((els) => els.map((e) => e.getAttribute("datetime")!));
  expect(starts).toEqual([...starts].sort());
  for (const details of await page.locator(`${steps} details`).all()) await expect(details).not.toHaveAttribute("open", "");
  await expect(page.getByRole("heading", { name: "Career", level: 3 })).toBeVisible();
});

test("opens and closes by mouse", async ({ page }) => {
  await page.goto(ABOUT);
  const first = page.locator(steps).first();
  const detail = first.locator("[data-step-detail]");
  await expect(detail).toBeHidden();
  await first.locator("summary").click();
  await expect(detail).toBeVisible();
  await expect(first.locator("details")).toHaveJSProperty("open", true);
  await first.locator("summary").click();
  await expect(detail).toBeHidden();
});

test("opens and closes by keyboard with Enter and Space", async ({ page }) => {
  await page.goto(ABOUT);
  const summary = page.locator(steps).first().locator("summary");
  const details = page.locator(steps).first().locator("details");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveJSProperty("open", true);
  await page.keyboard.press("Space");
  await expect(details).toHaveJSProperty("open", false);
  await page.keyboard.press("Space");
  await expect(details).toHaveJSProperty("open", true);
  await page.keyboard.press("Enter");
  await expect(details).toHaveJSProperty("open", false);
});

test("names each summary by role, organization and period and gives it a 24 px target", async ({ page }) => {
  await page.goto(ABOUT);
  const summary = page.locator(steps).first().locator("summary");
  // The name is role, organization and period, with the dash heard as "to" (FR-002, FR-007a).
  await expect(summary).toHaveAccessibleName(/\S.* to .*\S/);
  // Native <details>: the browser exposes the expanded state itself, so the markup must be the native pair.
  await expect(page.locator(`${steps} details > summary`).first()).toBeVisible();
  const box = (await summary.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
});

test("shows the site's focus outline on a keyboard-focused summary", async ({ page }) => {
  await page.goto(ABOUT);
  const summary = page.locator(steps).first().locator("summary");
  await page.locator("main a").first().focus();
  await summary.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await summary.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test("has no sideways scroll at 320 px with every step open", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(ABOUT);
  for (const summary of await page.locator(`${steps} summary`).all()) await summary.click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("prints every step open", async ({ page }) => {
  await page.goto(ABOUT);
  await page.emulateMedia({ media: "print" });
  for (const detail of await page.locator(`${steps} [data-step-detail]`).all()) await expect(detail).toBeVisible();
});

test("does not animate opening or closing, even when motion is allowed", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(`http://localhost:4322${ABOUT}`);
  const animated = await page.locator(`${steps} details, ${steps} summary, ${steps} [data-step-detail]`).evaluateAll((els) =>
    els.some((el) => {
      const s = getComputedStyle(el);
      return parseFloat(s.transitionDuration) > 0 || parseFloat(s.animationDuration) > 0;
    }),
  );
  expect(animated).toBe(false);
  await context.close();
});

test("keeps a visible disclosure state in forced colours", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(ABOUT);
  const first = page.locator(steps).first();
  await expect(first.locator("summary")).toBeVisible();
  expect(await first.locator("summary").evaluate((el) => getComputedStyle(el).display)).toBe("list-item");
  await first.locator("summary").click();
  await expect(first.locator("[data-step-detail]")).toBeVisible();
});

test("a post link and an award link in an opened step go to the right targets", async ({ page }) => {
  await page.goto(ABOUT);
  const step = page.locator(steps).filter({ has: page.locator("[data-list=posts]") }).first();
  await step.locator("summary").click();
  const post = step.locator("[data-list=posts] a").first();
  const href = (await post.getAttribute("href"))!;
  const title = (await post.textContent())!.trim();
  await post.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  await page.goto(ABOUT);
  const awarded = page.locator(steps).filter({ has: page.locator("[data-list=awards] a") }).first();
  await awarded.locator("summary").click();
  const award = awarded.locator("[data-list=awards] a").first();
  const target = (await award.getAttribute("href"))!;
  expect(target).toMatch(/^https:\/\//);
  await expect(award).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every step is listed and can be opened with its native disclosure", async ({ page }) => {
    await page.goto(ABOUT);
    const all = await page.locator(steps).all();
    expect(all.length).toBeGreaterThan(1);
    for (const step of all) {
      await expect(step.locator("[data-step-detail]")).toBeHidden();
      await step.locator("summary").click();
      await expect(step.locator("[data-step-detail]")).toBeVisible();
    }
    await expect(page.locator("[data-career-filter]")).toBeHidden();
    await expect(page.locator("[data-career-status]")).toBeHidden();
  });
});
