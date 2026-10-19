// Content card geometry (spec 050; contracts/content-card.md invariant 3). The page content card
// (`#content-section`) is drawn the same in light and dark: same box, same padding, same text
// column. Only colours may differ between themes.
//
// Why this is an E2E test: only a browser computes layout. Each page loads once per width and the
// `dark` class on <html> is flipped in place, so both themes are read from the same load. Colours
// per theme are owned by theme-tokens.spec.ts and are not repeated here.
//
// 320 px, dark: geometry.spec.ts owns the 320 px no-sideways-scroll check but loads every template
// in the default light theme only, so the dark half of SC-004 has no other owner. The light half
// is not repeated here.
import { test, expect, type Page } from "@playwright/test";
import { setTheme } from "./color-theme.ts";

const PAGES = ["/about/", "/nope/"] as const;

const WIDTHS = [
  { width: 390, padding: "16px" },
  { width: 640, padding: "24px" },
  { width: 768, padding: "32px" },
  { width: 1280, padding: "32px" },
] as const;

async function readCard(page: Page) {
  return page.evaluate(() => {
    const card = document.querySelector("#content-section");
    if (!card) return null;
    const r = card.getBoundingClientRect();
    const s = getComputedStyle(card);
    const p = card.querySelector("p")?.getBoundingClientRect();
    return {
      box: { x: r.x, y: r.y, width: r.width, height: r.height },
      padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft],
      borderTopWidth: parseFloat(s.borderTopWidth),
      boxShadow: s.boxShadow,
      paragraph: p ? { x: p.x, width: p.width } : null,
    };
  });
}

const flipDark = (page: Page) => page.evaluate(() => document.documentElement.classList.add("dark"));

for (const path of PAGES) {
  for (const { width, padding } of WIDTHS) {
    test(`${path} card is the same box and padding in both themes at ${width} px (FR-003, FR-004, FR-005, SC-001, SC-002, SC-003)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await setTheme(page, "light");
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);

      const light = await readCard(page);
      expect(light, "#content-section is on the page").not.toBeNull();
      await flipDark(page);
      await expect(page.locator("html")).toHaveClass(/\bdark\b/);
      const dark = await readCard(page);

      expect(dark!.box, "card box moves between themes").toEqual(light!.box);
      expect(dark!.paragraph, "first paragraph moves between themes").toEqual(light!.paragraph);
      for (const [name, read] of [
        ["light", light],
        ["dark", dark],
      ] as const) {
        expect(read!.padding, `padding in ${name}`).toEqual([padding, padding, padding, padding]);
      }
      expect(light!.borderTopWidth, "light border width").toBeGreaterThanOrEqual(1);
      expect(light!.boxShadow, "light shadow").not.toBe("none");
    });
  }

  test(`${path} does not scroll sideways at 320 px in dark (SC-004)`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await setTheme(page, "light");
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    await flipDark(page);
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, "page scrolls horizontally").toBeLessThanOrEqual(clientWidth);
  });
}
