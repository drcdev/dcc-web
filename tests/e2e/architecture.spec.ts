// The architecture diagram on the Technology page, in a real browser (specs/036-technology-
// architecture-diagram; contracts/diagram-dom.md rows R01-R03, R05, N01, N02). Label sizes and
// containment exist only in a rendered page, so this is the E2E layer. Part names come from
// `architectureParts`, never from literals.
import { test, expect, type Page } from "@playwright/test";
import { architectureParts } from "../helpers/content.ts";
import { setTheme, type Theme } from "./color-theme.ts";

const PAGE = "/technology/";
const WIDTHS = [
  { name: "phone", width: 320, height: 800 },
  { name: "desktop", width: 1280, height: 900 },
] as const;
const THEMES: readonly Theme[] = ["light", "dark"];

async function open(page: Page, theme: Theme, width: number, height: number) {
  await page.setViewportSize({ width, height });
  await setTheme(page, theme);
  await page.goto(PAGE);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

test.describe("diagram labels", () => {
  for (const theme of THEMES) {
    test(`R01: part labels are at least 14 px and connection labels at least 12 px at 320 px (${theme})`, async ({ page }) => {
      await open(page, theme, 320, 800);
      const sizes = await page.evaluate(() => {
        const svg = document.querySelector<SVGSVGElement>("#architecture-diagram svg")!;
        const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize) * scale;
        return {
          parts: [...svg.querySelectorAll("text.arch-part-label")].map(size),
          connections: [...svg.querySelectorAll("text.arch-connection-label")].map(size),
        };
      });
      expect(sizes.parts).toHaveLength(architectureParts.length);
      expect(sizes.connections.length).toBeGreaterThan(0);
      for (const size of sizes.parts) expect(size).toBeGreaterThanOrEqual(14);
      for (const size of sizes.connections) expect(size).toBeGreaterThanOrEqual(12);
    });
  }

  test("R02: diagram text is drawn in Inter", async ({ page }) => {
    await open(page, "light", 320, 800);
    const result = await page.evaluate(() =>
      [...document.querySelectorAll("#architecture-diagram svg text")].map((el) => {
        const style = getComputedStyle(el);
        return { family: style.fontFamily, ok: document.fonts.check(`${style.fontWeight} ${style.fontSize} Inter`, el.textContent ?? "") };
      }),
    );
    expect(result.length).toBeGreaterThan(0);
    for (const label of result) {
      expect(label.family).toMatch(/Inter/);
      expect(label.ok).toBe(true);
    }
  });

  for (const size of WIDTHS) {
    test(`R03: every part label lies inside its box at ${size.width} px`, async ({ page }) => {
      await open(page, "light", size.width, size.height);
      const misfits = await page.evaluate(() => {
        const out: string[] = [];
        for (const link of document.querySelectorAll<SVGAElement>("#architecture-diagram a[data-part]")) {
          const box = link.querySelector("rect")!.getBoundingClientRect();
          const text = link.querySelector("text")!.getBoundingClientRect();
          const fits = text.left >= box.left && text.right <= box.right && text.top >= box.top && text.bottom <= box.bottom;
          if (!fits) out.push(`${link.dataset.part}: text ${Math.round(text.left)}-${Math.round(text.right)} box ${Math.round(box.left)}-${Math.round(box.right)}`);
        }
        return out;
      });
      expect(misfits).toEqual([]);
    });
  }

  test("R05: every part link's clickable area is at least 24 x 24 px at 320 px", async ({ page }) => {
    await open(page, "dark", 320, 800);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<SVGAElement>("#architecture-diagram a[data-part]")]
        .map((link) => ({ id: link.dataset.part, box: link.querySelector("rect")!.getBoundingClientRect() }))
        .filter(({ box }) => box.width < 24 || box.height < 24)
        .map(({ id, box }) => `${id}: ${box.width.toFixed(1)} x ${box.height.toFixed(1)}`),
    );
    expect(small).toEqual([]);
  });
});

test.describe("without JavaScript", () => {
  // The site scrolls smoothly unless the reader asks for less motion; a moving page cannot be clicked reliably.
  test.use({ javaScriptEnabled: false, reducedMotion: "reduce" });

  test("N01, SC-004: the diagram renders and every part link lands on an entry with its content", async ({ page }) => {
    await page.goto(PAGE);
    const links = page.locator("#architecture-diagram a[data-part]");
    await expect(links).toHaveCount(architectureParts.length);
    for (const part of architectureParts) {
      const entry = page.locator(`article[id="${part.id}"]`);
      await expect(entry, `${part.id} entry`).toHaveCount(1);
      await expect(entry.locator("h3")).toHaveText(part.name);
      await expect(entry.locator("p").first()).not.toHaveText("");
      const source = entry.locator("a[target=_blank]");
      await expect(source).toHaveCount(part.source ? 1 : 0);
      if (part.source) await expect(source).toContainText(part.source);
      await page.locator(`#architecture-diagram a[data-part="${part.id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${part.id}$`));
      await expect(entry).toBeInViewport();
    }
  });

  test("N02: each back link goes to the diagram", async ({ page }) => {
    await page.goto(PAGE);
    const back = page.locator("article[data-entry] a[data-back]");
    await expect(back).toHaveCount(architectureParts.length);
    for (const href of await back.evaluateAll((links) => links.map((a) => a.getAttribute("href")))) {
      expect(href).toBe("#architecture-diagram");
    }
    await back.first().click();
    await expect(page).toHaveURL(/#architecture-diagram$/);
  });
});
