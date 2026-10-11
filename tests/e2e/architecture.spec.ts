// The architecture diagram on the Technology page, in a real browser (specs/036-technology-
// architecture-diagram; contracts/diagram-dom.md rows R01-R03, R05, N01, N02). Label sizes and
// containment exist only in a rendered page, so this is the E2E layer. Part names come from
// `architectureParts`, never from literals.
import { test, expect, type Page } from "@playwright/test";
import { architectureParts } from "../helpers/content.ts";
import { layout } from "../../src/lib/architecture/layout.ts";
import AxeBuilder from "@axe-core/playwright";
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

// Selection, focus and the back link (rows J01-J07, SC-002, SC-003). With reduced motion, so that
// the page's smooth scrolling cannot make a link "not stable" mid-scroll.
test.describe("selecting a part", () => {
  test.use({ reducedMotion: "reduce" });
  const [first, second] = architectureParts;
  const link = (page: Page, id: string) => page.locator(`#architecture-diagram a[data-part="${id}"]`);
  const entry = (page: Page, id: string) => page.locator(`article[id="${id}"]`);

  test("J01: clicking a part selects it and moves focus to its entry", async ({ page }) => {
    await open(page, "light", 1280, 900);
    await link(page, first!.id).click();
    await expect(page).toHaveURL(new RegExp(`#${first!.id}$`));
    await expect(link(page, first!.id)).toHaveAttribute("aria-current", "true");
    await expect(entry(page, first!.id)).toHaveAttribute("data-selected", "");
    await expect(entry(page, first!.id)).toBeFocused();
  });

  test("J01: Enter on a focused part does the same", async ({ page }) => {
    await open(page, "light", 1280, 900);
    await link(page, second!.id).focus();
    await page.keyboard.press("Enter");
    await expect(entry(page, second!.id)).toBeFocused();
    await expect(link(page, second!.id)).toHaveAttribute("aria-current", "true");
  });

  test("J02: only one part and one entry are selected at a time", async ({ page }) => {
    await open(page, "light", 1280, 900);
    await link(page, first!.id).click();
    await page.locator(`article[id="${first!.id}"] a[data-back]`).click();
    await link(page, second!.id).click();
    await expect(page.locator("#architecture-diagram a[aria-current]")).toHaveCount(1);
    await expect(page.locator("article[data-selected]")).toHaveCount(1);
    await expect(entry(page, second!.id)).toHaveAttribute("data-selected", "");
  });

  test("J03: a deep link selects the part and entry without moving focus", async ({ page }) => {
    await page.goto(`${PAGE}#${second!.id}`);
    await expect(link(page, second!.id)).toHaveAttribute("aria-current", "true");
    await expect(entry(page, second!.id)).toHaveAttribute("data-selected", "");
    await expect(entry(page, second!.id)).not.toBeFocused();
  });

  test("J04: the back link returns focus to the part and keeps the selection", async ({ page }) => {
    await open(page, "light", 1280, 900);
    await link(page, first!.id).click();
    await page.locator(`article[id="${first!.id}"] a[data-back]`).click();
    await expect(link(page, first!.id)).toBeFocused();
    await expect(link(page, first!.id)).toHaveAttribute("aria-current", "true");
    await expect(entry(page, first!.id)).toHaveAttribute("data-selected", "");
  });

  test("J05: a fragment that is not a part clears the selection", async ({ page }) => {
    await page.goto(`${PAGE}#${first!.id}`);
    await expect(page.locator("article[data-selected]")).toHaveCount(1);
    await page.evaluate(() => {
      location.hash = "#how-each-part-works";
    });
    await expect(page.locator("article[data-selected]")).toHaveCount(0);
    await expect(page.locator("#architecture-diagram a[aria-current]")).toHaveCount(0);
  });

  for (const theme of THEMES) {
    for (const forced of [false, true]) {
      test(`J06: focus ring and a non-colour selected cue are visible (${theme}${forced ? ", forced colours" : ""})`, async ({ page }) => {
        await page.emulateMedia({ forcedColors: forced ? "active" : "none" });
        await open(page, theme, 1280, 900);
        const target = link(page, first!.id);
        await target.focus();
        const ring = await target.locator("rect").evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth));
        expect(ring).toBeGreaterThanOrEqual(3);
        await target.click();
        const selected = await entry(page, first!.id).evaluate((el) => {
          const s = getComputedStyle(el);
          return { border: parseFloat(s.borderLeftWidth), style: s.borderLeftStyle };
        });
        expect(selected.style).not.toBe("none");
        expect(selected.border).toBeGreaterThanOrEqual(3);
        // Tailwind's preflight sets border-style: solid everywhere, so an idle entry shows no bar by width.
        const idle = await entry(page, second!.id).evaluate((el) => parseFloat(getComputedStyle(el).borderLeftWidth));
        expect(idle).toBe(0);
        const selectedPart = await link(page, first!.id)
          .locator("rect")
          .evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth));
        expect(selectedPart).toBeGreaterThanOrEqual(3);
      });
    }
  }

  test("J07: selecting a part animates nothing", async ({ page }) => {
    await open(page, "light", 1280, 900);
    const motion = await page.evaluate(() => {
      const el = document.querySelector("article[data-entry]")!;
      const rect = document.querySelector("#architecture-diagram a[data-part] rect")!;
      return {
        scroll: getComputedStyle(document.documentElement).scrollBehavior,
        entry: getComputedStyle(el).transitionDuration,
        rect: getComputedStyle(rect).transitionDuration,
      };
    });
    expect(motion.scroll).toBe("auto");
    expect(parseFloat(motion.entry)).toBe(0);
    expect(parseFloat(motion.rect)).toBe(0);
  });

  test("SC-002: Tab visits every part top to bottom with no trap", async ({ page }) => {
    await open(page, "light", 1280, 900);
    const order = layout.parts.map((p) => p.id);
    await link(page, order[0]!).focus();
    const seen: string[] = [order[0]!];
    for (let i = 1; i < order.length; i++) {
      await page.keyboard.press("Tab");
      seen.push(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.part ?? "none"));
    }
    expect(seen).toEqual(order);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.part ?? "left")).toBe("left");
  });
});

test.describe("accessibility with a part selected", () => {
  test.use({ reducedMotion: "reduce" });
  const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
  for (const theme of THEMES) {
    for (const size of WIDTHS) {
      test(`SC-003: no axe violations with a part selected (${theme}, ${size.name})`, async ({ page }) => {
        await open(page, theme, size.width, size.height);
        await page.locator("#architecture-diagram a[data-part]").first().click();
        await expect(page.locator("article[data-selected]")).toHaveCount(1);
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
