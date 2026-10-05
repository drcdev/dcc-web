// The series marker and ordinary pills in forced-colours mode (spec 013 US3; FR-010, FR-016d).
// Author colours are replaced by the system palette, so what must survive is structure: the
// marker keeps its 2px outline and its "Series:" text, an ordinary pill keeps its 1px border.
import { expect, test, type Page } from "@playwright/test";
import { seriesPost } from "../helpers/content.ts";

const POST = seriesPost.address;

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

test("the series marker keeps a 2px outline in the system text colour and its Series text", async ({ page }) => {
  await page.goto(POST);
  const marker = page.locator("[data-series-marker]").first();
  await expect(marker).toHaveText(/^Series: /);
  await expect(marker).toHaveCSS("border-top-width", "2px");
  await expect(marker).toHaveCSS("border-top-color", await systemColor(page, "CanvasText"));
});

test("the questions panel keeps its border, button outline and focus indicator (P23)", async ({ page }) => {
  await page.goto(POST);
  const panel = page.locator("[data-questions]");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("border-top-width", "1px");
  await expect(panel).toHaveCSS("border-top-color", await systemColor(page, "CanvasText"));
  const button = panel.locator("[data-questions-get]");
  await expect(button).toHaveCSS("border-top-width", "1px");
  await expect(button).not.toHaveCSS("border-top-style", "none");
  await button.focus();
  await expect(button).toBeFocused();
  await expect(button).not.toHaveCSS("outline-style", "none");
  await expect(button).toHaveCSS("outline-width", "2px");
});

test("an ordinary topic pill keeps a 1px border", async ({ page }) => {
  await page.goto(POST);
  const pill = page.locator("[data-topic-pill]").first();
  await expect(pill).toBeVisible();
  await expect(pill).toHaveCSS("border-top-width", "1px");
  await expect(pill).not.toHaveCSS("border-top-style", "none");
});

// Cards and tiles keep a solid border of at least 1px in forced colours, in both themes
// (spec 025 FR-014). Author colours are replaced, so the border width and the system text
// colour are what must survive.
for (const scheme of ["light", "dark"] as const) {
  test.describe(`card outlines, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    const expectEdge = async (page: Page, locator: ReturnType<Page["locator"]>) => {
      await expect(locator).toBeVisible();
      await expect(locator).not.toHaveCSS("border-top-style", "none");
      const width = await locator.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
      expect(width).toBeGreaterThanOrEqual(1);
      await expect(locator).toHaveCSS("border-top-color", await systemColor(page, "CanvasText"));
    };

    test("series tile, post card and lead story", async ({ page }) => {
      await page.goto("/writing/");
      await expectEdge(page, page.locator("[data-series-intro-item]").first());
      await expectEdge(page, page.locator("[data-post-card]").first());
      await expectEdge(page, page.locator("[data-lead-story]").first());
      await expect(page.locator("[data-series-image]").first()).toBeVisible();
    });

    test("joined series banner", async ({ page }) => {
      await page.goto("/writing/drift/");
      await expectEdge(page, page.locator("[data-series-banner]"));
      await expect(page.locator("[data-series-image]").first()).toBeVisible();
    });
  });
}
