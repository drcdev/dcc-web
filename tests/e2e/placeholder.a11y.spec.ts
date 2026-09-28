import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("placeholder page — accessibility", () => {
  test("has zero axe violations against WCAG 2.0/2.1/2.2 A+AA", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("has exactly one main landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveCount(1);
  });

  test("has exactly one h1 and no skipped heading levels", async ({ page }) => {
    await page.goto("/");
    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);

    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((el) =>
        Number(el.tagName.slice(1)),
      ),
    );
    let previous = 0;
    for (const level of levels) {
      expect(level - previous).toBeLessThanOrEqual(1);
      previous = level;
    }
  });

  test("has a non-empty title", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });

  test("has lang=\"en\" on the root element", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("has no non-text content", async ({ page }) => {
    await page.goto("/");
    for (const tag of ["img", "svg", "video", "audio", "iframe", "canvas"]) {
      await expect(page.locator(tag)).toHaveCount(0);
    }
  });

  test("reflows without horizontal scroll at 320 CSS px wide", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("reflows without horizontal scroll at 200% zoom", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const client = page.context().newCDPSession ? await page.context().newCDPSession(page) : null;
    if (client) {
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: 640,
        height: 360,
        deviceScaleFactor: 2,
        mobile: false,
      });
    } else {
      await page.setViewportSize({ width: 640, height: 360 });
    }
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("Tab from the top focuses the link to the current site first, with an accessible name and a visible focus style", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const link = page.locator("a");
    await expect(link).toHaveCount(1);
    await expect(link).toBeFocused();

    const accessibleName = await link.evaluate((el) => el.textContent?.trim() ?? "");
    expect(accessibleName.length).toBeGreaterThan(0);
    expect(accessibleName.toLowerCase()).toContain("site");

    const unfocusedStyle = await link.evaluate((el) => {
      (el as HTMLElement).blur();
      const style = getComputedStyle(el);
      return { outline: style.outlineStyle, boxShadow: style.boxShadow };
    });
    await link.focus();
    const focusedStyle = await link.evaluate((el) => {
      const style = getComputedStyle(el);
      return { outline: style.outlineStyle, boxShadow: style.boxShadow };
    });

    const outlineChanged = unfocusedStyle.outline !== focusedStyle.outline;
    const boxShadowChanged = unfocusedStyle.boxShadow !== focusedStyle.boxShadow;
    expect(outlineChanged || boxShadowChanged).toBe(true);
  });
});
