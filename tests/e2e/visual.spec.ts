// Visual baselines for the shell (FR-005a, FR-005b; research R13): the header,
// the footer and the full not-found page at phone (390) and desktop (1280)
// widths, and the open mobile menu at phone width only, each in dark and light
// themes — 14 images per platform. Comparison settings (maxDiffPixelRatio
// 0.001, animations disabled, caret hidden) and updateSnapshots "none" (a
// missing baseline fails) come from playwright.config.ts.
import { test, expect, type Page } from "@playwright/test";

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const THEMES = ["dark", "light"] as const;

async function open(page: Page, path: string, width: number, height: number, theme: "dark" | "light") {
  await page.setViewportSize({ width, height });
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
  await page.goto(path);
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
}

for (const size of WIDTHS) {
  for (const theme of THEMES) {
    test(`header — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "/", size.width, size.height, theme);
      await expect(page.locator("header").first()).toHaveScreenshot(`header-${size.name}-${theme}.png`);
    });

    test(`footer — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "/", size.width, size.height, theme);
      await expect(page.locator("footer").first()).toHaveScreenshot(`footer-${size.name}-${theme}.png`);
    });

    test(`not-found page — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "/nope/", size.width, size.height, theme);
      await expect(page).toHaveScreenshot(`not-found-${size.name}-${theme}.png`, { fullPage: true });
    });
  }
}

// The new pages: home (with the introduction card) and about, full page.
for (const size of WIDTHS) {
  for (const theme of THEMES) {
    for (const [name, path] of [
      ["home", "/"],
      ["about", "/about/"],
    ] as const) {
      test(`${name} page — ${size.name} — ${theme}`, async ({ page }) => {
        await open(page, path, size.width, size.height, theme);
        await expect(page).toHaveScreenshot(`${name}-${size.name}-${theme}.png`, { fullPage: true });
      });
    }
  }
}

for (const theme of THEMES) {
  test(`mobile menu open — phone — ${theme}`, async ({ page }) => {
    await open(page, "/", 390, 844, theme);
    const button = page.locator('button[aria-controls="primary-nav-list"]');
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("header").first()).toHaveScreenshot(`menu-open-phone-${theme}.png`);
  });
}
