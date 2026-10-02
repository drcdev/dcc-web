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
  await settleImages(page);
}

// Astro renders images with loading="lazy", so an image below the first
// viewport only starts loading when a full-page screenshot enlarges the
// viewport, and whether it has painted by the time the screenshot is taken
// depends on timing (under 4 Playwright workers in CI it often has not). Make
// every image eager, wait for each one to load and decode, then wait for two
// animation frames so the paint has happened, and finally assert that every
// image has pixels. A screenshot is then never taken before its images paint.
async function settleImages(page: Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const img of images) img.loading = "eager";
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
          });
        }
        await img.decode().catch(() => undefined);
      }),
    );
    await new Promise<void>((frame) => requestAnimationFrame(() => requestAnimationFrame(() => frame())));
  });
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0));
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

// The pages: home (with the introduction card), about and contact, full page.
for (const size of WIDTHS) {
  for (const theme of THEMES) {
    for (const [name, path] of [
      ["home", "/"],
      ["about", "/about/"],
      ["contact", "/contact/"],
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

// The sections fixture page (built into the fixture site on port 4322 by the
// Playwright config's second web server), full page, both sizes and themes.
for (const size of WIDTHS) {
  for (const theme of THEMES) {
    test(`sections fixture — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "http://localhost:4322/sections/", size.width, size.height, theme);
      await expect(page).toHaveScreenshot(`sections-${size.name}-${theme}.png`, { fullPage: true });
    });
  }
}

// The blog pages (spec 008): landing, all posts, one topic page and the richest
// sample post, plus the Drift series page (spec 013), full page, both sizes and
// themes (20 images per platform).
for (const size of WIDTHS) {
  for (const theme of THEMES) {
    for (const [name, path] of [
      ["writing-landing", "/writing/"],
      ["writing-all", "/writing/all/"],
      ["writing-topic", "/writing/topics/technology-teams/"],
      ["writing-post", "/writing/sample-everything/"],
      ["writing-series", "/writing/drift/"],
    ] as const) {
      test(`${name} — ${size.name} — ${theme}`, async ({ page }) => {
        await open(page, path, size.width, size.height, theme);
        if (name === "writing-post") {
          await expect(page.locator("button", { hasText: "Copy" }).first()).toBeVisible();
        }
        // Below-the-fold images are lazy: load them all so a full-page shot shows every card image.
        await page.evaluate(async () => {
          const images = Array.from(document.images);
          for (const img of images) img.loading = "eager";
          await Promise.all(images.map((img) => img.decode().catch(() => undefined)));
        });
        await expect(page).toHaveScreenshot(`${name}-${size.name}-${theme}.png`, { fullPage: true });
      });
    }
  }
}

// The projects index and the Focus Pocus story (FR-084), full page, both sizes
// and themes, with reduced motion emulated so every chapter is in its final state.
for (const size of WIDTHS) {
  for (const theme of THEMES) {
    for (const [name, path] of [
      ["projects", "/projects/"],
      ["project-story", "/projects/focus-pocus/"],
    ] as const) {
      test(`${name} page — ${size.name} — ${theme}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open(page, path, size.width, size.height, theme);
        await expect(page).toHaveScreenshot(`${name}-${size.name}-${theme}.png`, { fullPage: true });
      });
    }
  }
}
