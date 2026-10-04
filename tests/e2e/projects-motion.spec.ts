// Motion on the projects pages (US5; FR-010; specs/014-project-four-part-story). All of it is
// CSS: a reading-progress bar and a cross-document view transition. Both are off under reduced
// motion, and none of it hides content. The heading uncover and the sticky picture are gone.
import { expect, test, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";
import { pickedStory } from "../helpers/content";
import { expectThemeClass, setTheme } from "./color-theme.ts";

const STORY = pickedStory.address;

/** The @view-transition rules that apply to this page right now, nested rules included. */
const activeViewTransitionRules = (page: Page) =>
  page.evaluate(() => {
    const found: string[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        const text = rule.cssText;
        if (text.startsWith("@view-transition")) found.push(text);
        else if (rule instanceof CSSMediaRule) {
          if (window.matchMedia(rule.conditionText).matches) walk(rule.cssRules);
        } else if (rule instanceof CSSSupportsRule) {
          if (CSS.supports(rule.conditionText)) walk(rule.cssRules);
        } else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // A cross-origin sheet cannot be read; the site serves its own.
      }
    }
    return found;
  });

test.describe("with motion allowed", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });

  test("the title-pairing style and the progress bar raise no Content Security Policy violation", async ({ page }) => {
    await recordCspViolations(page);
    for (const path of [STORY, "/projects/"]) {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await cspViolations(page), path).toEqual([]);
    }
  });

  test("shows a progress bar that fills as the page scrolls", async ({ page }) => {
    await page.goto(STORY);
    const bar = page.locator("[data-progress]");
    await expect(bar).toHaveCSS("display", "block");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    const width = () => bar.evaluate((el) => el.getBoundingClientRect().width);
    expect(await width()).toBeLessThan(2);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await expect.poll(width).toBeGreaterThan(300);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(width).toBeGreaterThan(1400);
  });

  test("opts in to cross-document view transitions and names the title", async ({ page }) => {
    await page.goto(STORY);
    const rules = await activeViewTransitionRules(page);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatch(/navigation:\s*auto/);
    await expect(page.locator("h1")).toHaveCSS("view-transition-name", `project-${pickedStory.slug}`);
    await page.goto("/projects/");
    expect(await activeViewTransitionRules(page)).toHaveLength(1);
    await expect(page.locator(`[data-project="${pickedStory.slug}"] [data-project-title]`)).toHaveCSS(
      "view-transition-name",
      `project-${pickedStory.slug}`,
    );
  });

});

/** Resolve any CSS colour to sRGB channels by painting it on a canvas. */
const contrastRatio = (page: Page) =>
  page.evaluate(() => {
    const toRgb = (color: string): [number, number, number] => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r!, g!, b!];
    };
    const luminance = ([r, g, b]: [number, number, number]) => {
      const lin = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const bar = getComputedStyle(document.querySelector("[data-progress]")!).backgroundColor;
    let background = "rgb(255, 255, 255)";
    for (const el of [document.body, document.documentElement]) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        background = bg;
        break;
      }
    }
    const a = luminance(toRgb(bar));
    const b = luminance(toRgb(background));
    return { bar, background, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });

test.describe("progress bar contrast (FR-083, WCAG 1.4.11)", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
  for (const theme of ["light", "dark"] as const) {
    test(`is at least 3:1 against the page background in the ${theme} theme`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(STORY);
      await expectThemeClass(page, theme);
      await expect(page.locator("[data-progress]")).toHaveCSS("display", "block");
      const { bar, background, ratio } = await contrastRatio(page);
      expect(ratio, `${bar} on ${background}`).toBeGreaterThanOrEqual(3);
    });
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });

  test("has no progress bar and no animation on a part heading", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "none");
    const animated = await page.evaluate(() =>
      Array.from(document.querySelectorAll("section[data-part] h2")).filter((el) => el.getAnimations().length > 0).length,
    );
    expect(animated).toBe(0);
  });

  test("has no view transition on either page", async ({ page }) => {
    await page.goto(STORY);
    expect(await activeViewTransitionRules(page)).toEqual([]);
    await expect(page.locator("h1")).toHaveCSS("view-transition-name", "none");
    await page.goto("/projects/");
    expect(await activeViewTransitionRules(page)).toEqual([]);
  });

  test("still shows every part heading and the whole comparison", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.locator("main h2")).toHaveCount(4);
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });
});

// FR-060, FR-024 and the "Printing a story" edge case.
test.describe("switching modes on an open story", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });

  test("switching to reduced motion without a reload removes the bar and leaves every heading visible", async ({
    page,
  }) => {
    await page.goto(STORY);
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "block");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "none");
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
  });

  test("printing shows every part and the full comparison, and no progress bar", async ({ page }) => {
    await page.goto(STORY);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "none");
    await expect(page.locator("section[data-part]")).toHaveCount(4);
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
    const comparison = page.getByRole("table");
    await expect(comparison).toBeVisible();
    const cut = await page.locator("[data-options-table]").first().evaluate((el) => {
      const region = el.closest("[role=region]") ?? el;
      return { client: region.clientWidth, scroll: region.scrollWidth, overflow: getComputedStyle(region).overflowX };
    });
    expect(cut.scroll <= cut.client || cut.overflow === "visible", "the comparison is not cut off").toBe(true);
  });
});
