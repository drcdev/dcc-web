// The home page on the fixture site (port 4322, playwright.config.ts project `sections`), whose
// home page is the real index.mdx with the fixture Now file and fixture reading paths
// (scripts/build-fixture-site.ts). Spec 040: Now (US1), Start here (US2), Recent writing (US3).
import { expect, test, type Page } from "@playwright/test";

const noHorizontalScroll = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

/** Every element in `selector` sits inside the viewport width and is not cut off by an ancestor. */
const notClipped = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) =>
    els.filter((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return true;
      if (rect.left < -1 || rect.right > document.documentElement.clientWidth + 1) return true;
      for (let a = el.parentElement; a; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (s.overflowX === "visible" && s.overflowY === "visible") continue;
        const box = a.getBoundingClientRect();
        if (rect.left < box.left - 1 || rect.right > box.right + 1) return true;
      }
      return false;
    }).length,
  );

test.describe("Now", () => {
  test("sits after the intro and before Start here", async ({ page }) => {
    await page.goto("/");
    const order = await page.evaluate(() => {
      const main = document.querySelector("main")!;
      const all = [...main.querySelectorAll("h1, [data-now], [data-start-here], [data-recent-writing]")];
      return all.map((el) =>
        el.hasAttribute("data-now") ? "now" : el.hasAttribute("data-start-here") ? "start" : el.hasAttribute("data-recent-writing") ? "recent" : "intro",
      );
    });
    expect(order).toEqual(["intro", "now", "start", "recent"]);
  });

  test("the home page has no 'What I do' heading and no mention of advisory work or workshops", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("what i do");
    expect(text).not.toMatch(/advis|workshop/);
  });

  test("shows the date, the four topics in order and the open-to link", async ({ page }) => {
    await page.goto("/");
    const now = page.locator("[data-now]");
    await expect(now.getByRole("heading", { level: 2, name: "Now" })).toBeVisible();
    await expect(now.locator("time")).toHaveAttribute("datetime", "2026-01-15");
    await expect(now.locator("dt")).toHaveText(["Working on", "Reading", "MBA research", "AI experiments"]);
  });

  test("the contact link is an inline text link that goes to /contact/", async ({ page }) => {
    await page.goto("/");
    const link = page.locator("[data-now-open-to] a[href='/contact/']");
    await expect(link).toBeVisible();
    expect(await link.evaluate((el) => getComputedStyle(el).display)).toBe("inline");
    await link.click();
    await expect(page).toHaveURL(/\/contact\/$/);
  });

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });
    test("the Now section is fully readable", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("[data-now] dt")).toHaveCount(4);
      await expect(page.locator("[data-now-open-to] a[href='/contact/']")).toBeVisible();
    });
  });

  for (const [name, setup] of [
    ["320 px", { width: 320, height: 640 }],
    ["200% zoom (640 px at 2x)", { width: 640, height: 800, zoom: 2 }],
  ] as const) {
    test(`no horizontal scroll and no clipped text at ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: setup.width, height: setup.height });
      if ("zoom" in setup) await page.addInitScript((z) => { document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.zoom = String(z); }); }, setup.zoom);
      await page.goto("/");
      await noHorizontalScroll(page);
      expect(await notClipped(page, "[data-now] dd, [data-now] dt, [data-now-open-to] a")).toBe(0);
    });
  }

  test("survives WCAG 1.4.12 text spacing at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    // The page's CSP blocks an injected <style>, so the overrides go in as a constructed stylesheet.
    await page.evaluate(() => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    });
    await noHorizontalScroll(page);
    expect(await notClipped(page, "[data-now] dd, [data-now] dt, [data-now-open-to] a")).toBe(0);
  });

  test.describe("forced colours", () => {
    test.use({ forcedColors: "active" });
    test("the Now link and its focus indicator stay visible", async ({ page }) => {
      await page.goto("/");
      const link = page.locator("[data-now-open-to] a[href='/contact/']");
      await link.focus();
      await expect(link).toBeVisible();
      const style = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth) };
      });
      expect(style.outlineStyle).not.toBe("none");
      expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
    });
  });
});

const START_CLIPPABLE = "[data-start-here] a, [data-start-here] p, [data-start-here] h3";

test.describe("Start here", () => {
  test("sits between Now and Recent writing, with one h1, h2 sections and an h3 per path", async ({ page }) => {
    await page.goto("/");
    const order = await page.evaluate(() => {
      const main = document.querySelector("main")!;
      return [...main.querySelectorAll("[data-now], [data-start-here], [data-recent-writing]")].map((el) => Object.keys((el as HTMLElement).dataset)[0]);
    });
    expect(order).toEqual(["now", "startHere", "recentWriting"]);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("[data-start-here]").getByRole("heading", { level: 2, name: "Start here" })).toBeVisible();
    const paths = page.locator("[data-reading-path]");
    expect(await paths.count()).toBeGreaterThanOrEqual(2);
    for (const path of await paths.all()) await expect(path.getByRole("heading", { level: 3 })).toHaveCount(1);
  });

  test("a path link navigates to its post or project page", async ({ page }) => {
    await page.goto("/");
    const post = page.locator("[data-start-here] li[data-kind='post'] a").first();
    const href = await post.getAttribute("href");
    await post.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await page.goto("/");
    const project = page.locator("[data-start-here] li[data-kind='project'] a").first();
    const projectHref = await project.getAttribute("href");
    await project.click();
    await expect(page).toHaveURL(new RegExp(`${projectHref}$`));
  });

  test("tab order follows source order through Now and Start here", async ({ page }) => {
    await page.goto("/");
    const expected = await page.evaluate(() =>
      [...document.querySelectorAll("[data-now] a, [data-start-here] a")].map((a) => (a as HTMLAnchorElement).getAttribute("href")),
    );
    await page.locator("[data-now] a").first().focus();
    const visited: (string | null)[] = [];
    for (let i = 0; i < expected.length; i++) {
      visited.push(await page.evaluate(() => document.activeElement?.getAttribute("href") ?? null));
      await page.keyboard.press("Tab");
    }
    expect(visited).toEqual(expected);
  });

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });
    test("Start here is readable", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("[data-start-here] li a").first()).toBeVisible();
      await expect(page.locator("[data-start-here] li").first()).toContainText("min read");
    });
  });

  for (const [name, setup] of [
    ["320 px", { width: 320, height: 640 }],
    ["200% zoom (640 px at 2x)", { width: 640, height: 800, zoom: 2 }],
  ] as const) {
    test(`no horizontal scroll and no clipped text at ${name}`, async ({ page }) => {
      await page.setViewportSize({ width: setup.width, height: setup.height });
      if ("zoom" in setup) await page.addInitScript((z) => { document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.zoom = String(z); }); }, setup.zoom);
      await page.goto("/");
      await noHorizontalScroll(page);
      expect(await notClipped(page, START_CLIPPABLE)).toBe(0);
    });
  }

  test("survives WCAG 1.4.12 text spacing at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/");
    await page.evaluate(() => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(`* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    });
    await noHorizontalScroll(page);
    expect(await notClipped(page, START_CLIPPABLE)).toBe(0);
  });

  test("links are at least 24 px tall and one column below 768 px, two from it", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto("/");
    for (const link of await page.locator("[data-start-here] li a").all()) {
      const box = (await link.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
    const lefts = async () => page.locator("[data-reading-path]").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    expect(new Set(await lefts()).size).toBe(1);
    await page.setViewportSize({ width: 1024, height: 800 });
    expect(new Set(await lefts()).size).toBe(2);
  });

  test.describe("forced colours", () => {
    test.use({ forcedColors: "active" });
    test("path links and their focus indicator stay visible", async ({ page }) => {
      await page.goto("/");
      const link = page.locator("[data-start-here] li a").first();
      await link.focus();
      await expect(link).toBeVisible();
      const style = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth) };
      });
      expect(style.outlineStyle).not.toBe("none");
      expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
    });
  });
});
