// The sections fixture page (tests/fixtures/pages/sections.mdx) built into the
// fixture site on port 4322 (playwright.config.ts, project `sections`): every
// section once, checked for accessibility, reflow, no-JS reading, image widths,
// focus and target size, heading colours and metadata (FR-010, FR-011, FR-013,
// FR-014, FR-028a; US3 scenario 2; US4 scenarios 1 to 6).
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const PATH = "/sections/";
const THEMES = ["dark", "light"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
}

for (const theme of THEMES) {
  for (const size of SIZES) {
    test(`axe finds no violations — ${size.name} — ${theme}`, async ({ page }) => {
      await setTheme(page, theme);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(PATH);
      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(results.violations).toEqual([]);
    });
  }
}

for (const width of [320, 390, 1100, 1280]) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PATH);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}

test("the long unbroken address wraps inside the text column", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(PATH);
  const p = page.locator("p", { hasText: "long unbroken web address" });
  const box = await p.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every section's content is readable", async ({ page }) => {
    await page.goto(PATH);
    for (const text of [
      "This page uses every section once",
      "How I work",
      "What I offer",
      "Architecture reviews",
      "Get in touch",
      "A figure with a caption",
      "A full-width image with a caption",
    ]) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
    expect(await page.locator("main script").count()).toBe(0);
  });
});

test("the wide image is wider than the text column at 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(PATH);
  const wide = (await page.locator("figure.kg-width-wide").boundingBox())!;
  const column = (await page.locator("#content-section").boundingBox())!;
  expect(wide.width).toBeGreaterThan(column.width);
  expect(wide.x).toBeGreaterThanOrEqual(0);
  expect(wide.x + wide.width).toBeLessThanOrEqual(1280);
});

test("the full-width image equals the viewport content width", async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(PATH);
    const box = (await page.locator("figure.kg-width-full").boundingBox())!;
    const content = await page.evaluate(() => document.documentElement.clientWidth);
    expect(Math.round(box.width)).toBe(content);
    expect(Math.round(box.x)).toBe(0);
  }
});

test("the CTA and offering links have the focus indicator and 24px targets", async ({ page }) => {
  await page.goto(PATH);
  const links = page.locator("main").locator("a", { hasText: /Get in touch|Architecture reviews/ });
  await expect(links).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const link = links.nth(i);
    await link.focus();
    const style = await link.evaluate((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), offset: parseFloat(s.outlineOffset), w: r.width, h: r.height };
    });
    expect(style.style).toBe("solid");
    expect(style.width).toBeGreaterThanOrEqual(2);
    expect(style.offset).toBe(2);
    expect(style.w).toBeGreaterThanOrEqual(24);
    expect(style.h).toBeGreaterThanOrEqual(24);
  }
});

test("links in the content are underlined", async ({ page }) => {
  await page.goto(PATH);
  const link = page.locator("main a", { hasText: "Architecture reviews" });
  expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain("underline");
});

// The design-system heading colours (FR-014): h2 rust, h3 sage, h4 lavender.
const HEADINGS = {
  dark: { h2: "rust-400", h3: "sage-400", h4: "lavender-300" },
  light: { h2: "rust-600", h3: "sage-700", h4: "lavender-600" },
} as const;

for (const theme of THEMES) {
  test(`content headings use the design-system colours — ${theme}`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto(PATH);
    for (const level of ["h2", "h3", "h4"] as const) {
      const [got, want] = await page.evaluate(
        ([tag, token]) => {
          const el = document.querySelector(`#content-section ${tag}`) as HTMLElement;
          const probe = document.createElement("span");
          probe.style.color = `var(--color-${token})`;
          document.body.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return [getComputedStyle(el).color, expected];
        },
        [level, HEADINGS[theme][level]],
      );
      expect(got, `${level} colour`).toBe(want);
    }
  });
}

test("metadata, feature image and draft state", async ({ page }) => {
  await page.goto(PATH);
  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toContain("/_astro/");
  expect(og).not.toContain("og-default");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    "A plain blue-grey rectangle used as a sharing image",
  );
  const feature = page.locator("article figure").first();
  await expect(feature.locator("img")).toHaveAttribute("alt", "A plain blue-grey rectangle used as a feature image");
  await expect(feature.locator("figcaption")).toHaveText("A caption under the feature image");
  await expect(page.locator("[data-draft-notice]")).toHaveCount(0);
});
