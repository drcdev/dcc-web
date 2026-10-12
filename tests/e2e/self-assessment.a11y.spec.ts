// Accessibility of the self-assessment block in the states that exist only after interaction
// (specs/037 contracts/assessment-ui.md U17; FR-018, SC-006). The template a11y runs cover the page
// as loaded; this adds the empty, errors and results states in both themes, plus the checks axe
// does not make: target size (2.5.8), focus visibility (2.4.7, 2.4.11), non-text contrast (1.4.11)
// and forced colours. The post and its statements come from the content helper.
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { postsWithAssessment } from "../helpers/content.ts";
import { setTheme } from "./color-theme.ts";
import { encodeResult } from "../../src/lib/assessment/result-link.ts";
import { statementSetVersion } from "../../src/lib/assessment/version.ts";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEMES = ["dark", "light"] as const;
const { post, assessment } = postsWithAssessment()[0]!;
const root = (page: Page) => page.locator("[data-assessment]");
const summary = (page: Page) => page.locator("[data-assessment] details[data-assessment-details] > summary");

/** Loads the post with the block in view, still collapsed (FR-001a). */
async function reach(page: Page) {
  await page.goto(post.address);
  await root(page).scrollIntoViewIfNeeded();
  await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
}

async function open(page: Page) {
  await reach(page);
  await summary(page).click();
  await expect(page.locator("[data-assessment-form]")).toBeVisible();
}

async function answerAll(page: Page) {
  for (let s = 0; s < assessment.shifts.length; s++) {
    for (let i = 0; i < 3; i++) {
      await page.locator(`[data-statement="${s}.${i}"]`).getByLabel(assessment.scale[(s + i) % 5]!, { exact: true }).check();
    }
  }
}

const states = {
  empty: async () => {},
  errors: async (page: Page) => {
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-errors]")).toBeVisible();
  },
  results: async (page: Page) => {
    await answerAll(page);
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-results]")).toBeVisible();
  },
} as const;

// Results-link states (US4): a comparison, two separate results and an unreadable link.
const VERSION = statementSetVersion(assessment.shifts);
const linkTo = (version: string, sums = [6, 9, 12, 7, 15]) => `${post.address}#${encodeResult({ version, date: "2026-09-01", sums })}`;
const linked = {
  comparison: {
    url: linkTo(VERSION),
    enter: async (page: Page) => {
      await answerAll(page);
      await page.locator("[data-assessment-show]").click();
      await expect(page.locator("[data-chart-legend]")).toBeVisible();
    },
  },
  "separate results": {
    url: linkTo(VERSION === "ffffffff" ? "eeeeeeee" : "ffffffff"),
    enter: async (page: Page) => {
      await answerAll(page);
      await page.locator("[data-assessment-show]").click();
      await expect(page.locator("[data-assessment-results]")).toBeVisible();
      await expect(page.locator("[data-assessment-earlier]")).toBeVisible();
    },
  },
  "unreadable link": {
    url: `${post.address}#result=${VERSION}.20260901.6-9-12-7-16`,
    enter: async (page: Page) => {
      await expect(page.locator("[data-assessment-status]")).toHaveText("This results link could not be read.");
    },
  },
} as const;

async function openLinked(page: Page, url: string) {
  await page.goto(url);
  await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
}

/** WCAG relative luminance of an `rgb()`/`rgba()` colour. */
function luminance(color: string): number {
  // Chromium writes colours from the theme's relative-colour tokens as `color(srgb r g b)` with 0 to 1 channels.
  const unit = color.startsWith("color(") ? 1 : 255;
  const [r, g, b] = (color.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((v) => {
    const c = Number(v) / unit;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** The colour behind an element: the nearest ancestor background that is not transparent. */
const backgroundOf = (locator: ReturnType<Page["locator"]>) =>
  locator.evaluate((element) => {
    for (let node: Element | null = element; node; node = node.parentElement) {
      const color = getComputedStyle(node).backgroundColor;
      if (!/rgba\(.*, 0\)|transparent/.test(color)) return color;
    }
    return "rgb(255, 255, 255)";
  });

for (const theme of THEMES) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await setTheme(page, theme);
    });

    test("has no axe violations while collapsed, and the button is at least 24 x 24 with a visible focus ring (FR-001a)", async ({ page }) => {
      await reach(page);
      const results = await new AxeBuilder({ page }).withTags(TAGS).include("[data-assessment]").analyze();
      expect(results.violations).toEqual([]);
      const box = await summary(page).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
      await summary(page).focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(summary(page)).toBeFocused();
      const ring = await summary(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor };
      });
      expect(ring.style).not.toBe("none");
      expect(ring.width).toBeGreaterThanOrEqual(2);
      expect(contrast(ring.color, await backgroundOf(summary(page)))).toBeGreaterThanOrEqual(3);
    });

    for (const [name, enter] of Object.entries(states)) {
      test(`has no axe violations in the ${name} state`, async ({ page }) => {
        await open(page);
        await enter(page);
        const results = await new AxeBuilder({ page }).withTags(TAGS).include("[data-assessment]").analyze();
        expect(results.violations).toEqual([]);
      });
    }

    for (const [name, state] of Object.entries(linked)) {
      test(`has no axe violations in the ${name} state`, async ({ page }) => {
        await openLinked(page, state.url);
        await state.enter(page);
        const results = await new AxeBuilder({ page }).withTags(TAGS).include("[data-assessment]").analyze();
        expect(results.violations).toEqual([]);
      });
    }

    test("the diamond, the circle and the legend markers reach 3:1 and Copy link is at least 24 x 24 (1.4.11, 2.5.8)", async ({ page }) => {
      await openLinked(page, linked.comparison.url);
      await linked.comparison.enter(page);
      const background = await backgroundOf(page.locator("[data-chart-row] svg").first());
      const diamond = page.locator('[data-chart-row] polygon[data-marker="earlier"]').first();
      const circle = page.locator('[data-chart-row] circle[data-marker="new"]').first();
      expect(contrast(await diamond.evaluate((e) => getComputedStyle(e).stroke), background), "diamond").toBeGreaterThanOrEqual(3);
      expect(contrast(await circle.evaluate((e) => getComputedStyle(e).fill), background), "circle").toBeGreaterThanOrEqual(3);
      const legend = page.locator("[data-chart-legend]");
      const legendBackground = await backgroundOf(legend);
      expect(contrast(await legend.locator("polygon").evaluate((e) => getComputedStyle(e).stroke), legendBackground), "legend diamond").toBeGreaterThanOrEqual(3);
      expect(contrast(await legend.locator("circle").evaluate((e) => getComputedStyle(e).fill), legendBackground), "legend circle").toBeGreaterThanOrEqual(3);
      const box = await page.getByRole("button", { name: "Copy link" }).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    });

    test("every answer choice and button is at least 24 x 24 CSS px (2.5.8)", async ({ page }) => {
      await open(page);
      await states.results(page);
      const small = await root(page).evaluate((section) =>
        [...section.querySelectorAll("label, button, input[type=radio], a")]
          .filter((element) => (element as HTMLElement).offsetParent !== null)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { text: (element.textContent ?? "").trim().slice(0, 30), width: rect.width, height: rect.height, inline: element.tagName === "A" && getComputedStyle(element).display === "inline" };
          })
          // A link inside a sentence is exempt from the target-size rule.
          .filter((box) => !box.inline && (box.width < 24 || box.height < 24)),
      );
      expect(small).toEqual([]);
    });

    test("every control reached by Tab shows a focus indicator not hidden by the header (2.4.7, 2.4.11)", async ({ page }) => {
      await open(page);
      await states.results(page);
      await page.locator('[data-statement="0.0"] input').first().focus();
      for (let i = 0; i < 8; i++) {
        const state = await page.evaluate(() => {
          const element = document.activeElement as HTMLElement;
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          const header = document.querySelector("header")?.getBoundingClientRect();
          const sticky = header && ["sticky", "fixed"].includes(getComputedStyle(document.querySelector("header")!).position);
          return {
            visibleRing: (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2) || style.boxShadow !== "none",
            hiddenByHeader: Boolean(sticky && header && rect.top < header.bottom && rect.bottom > header.top),
          };
        });
        expect(state.visibleRing).toBe(true);
        expect(state.hiddenByHeader).toBe(false);
        await page.keyboard.press("Tab");
      }
    });

    test("the chart track and marker, the radio boundary and the focus ring reach 3:1 (1.4.11)", async ({ page }) => {
      await open(page);
      await states.results(page);
      const track = page.locator("[data-chart-row] [data-chart-track]").first();
      const marker = page.locator("[data-chart-row] circle").first();
      const radio = page.locator('[data-statement="0.0"] input[type=radio]').first();
      const svgBackground = await backgroundOf(track);
      const trackColor = await track.evaluate((element) => getComputedStyle(element).stroke);
      const markerColor = await marker.evaluate((element) => getComputedStyle(element).fill);
      expect(contrast(trackColor, svgBackground), "track").toBeGreaterThanOrEqual(3);
      expect(contrast(markerColor, svgBackground), "marker").toBeGreaterThanOrEqual(3);
      const radioBorder = await radio.evaluate((element) => getComputedStyle(element).borderTopColor);
      expect(contrast(radioBorder, await backgroundOf(radio.locator(".."))), "radio boundary").toBeGreaterThanOrEqual(3);
      await radio.focus();
      const ring = await radio.evaluate((element) => getComputedStyle(element).outlineColor);
      expect(contrast(ring, await backgroundOf(radio.locator(".."))), "focus ring").toBeGreaterThanOrEqual(3);
    });
  });
}

test("forced colours keep the button's border and its open-and-close indicator visible (FR-001a)", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await reach(page);
  const background = await backgroundOf(summary(page));
  expect(contrast(await summary(page).evaluate((e) => getComputedStyle(e).borderTopColor), background), "border").toBeGreaterThanOrEqual(3);
  const indicator = summary(page).locator("svg[data-disclosure-indicator]");
  await expect(indicator).toBeVisible();
  expect(contrast(await indicator.evaluate((e) => getComputedStyle(e).stroke), background), "indicator").toBeGreaterThanOrEqual(3);
});

test("forced colours keep the track and the marker visible", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await open(page);
  await states.results(page);
  const track = page.locator("[data-chart-row] [data-chart-track]").first();
  const marker = page.locator("[data-chart-row] circle").first();
  const background = await backgroundOf(track);
  expect(contrast(await track.evaluate((e) => getComputedStyle(e).stroke), background)).toBeGreaterThanOrEqual(3);
  expect(contrast(await marker.evaluate((e) => getComputedStyle(e).fill), background)).toBeGreaterThanOrEqual(3);
  const radio = page.locator('[data-statement="0.0"] input[type=radio]').first();
  expect(contrast(await radio.evaluate((e) => getComputedStyle(e).borderTopColor), await backgroundOf(radio.locator("..")))).toBeGreaterThanOrEqual(3);
});

test("forced colours keep both markers, the tracks and the legend visible", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openLinked(page, linked.comparison.url);
  await linked.comparison.enter(page);
  const background = await backgroundOf(page.locator("[data-chart-row] svg").first());
  const legend = page.locator("[data-chart-legend]");
  const checks = [
    [page.locator("[data-chart-row] [data-chart-track]").first(), "stroke"],
    [page.locator('[data-chart-row] polygon[data-marker="earlier"]').first(), "stroke"],
    [page.locator('[data-chart-row] circle[data-marker="new"]').first(), "fill"],
    [legend.locator("polygon"), "stroke"],
    [legend.locator("circle"), "fill"],
  ] as const;
  for (const [locator, property] of checks) {
    const color = await locator.evaluate((e, p) => getComputedStyle(e).getPropertyValue(p), property);
    expect(color, property).not.toBe("none");
    expect(contrast(color, background)).toBeGreaterThanOrEqual(3);
  }
  await expect(legend).toBeVisible();
});
