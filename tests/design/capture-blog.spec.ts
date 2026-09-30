// Captures the pictures for docs/design/blog.md: 3 directions x 3 screens x 2 widths x 2 themes
// = 36 full-page JPEGs. Illustrations only, no pixel comparison. Deleted with the prototypes.
import { mkdirSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { landingPath, listingPath, postPath, posts, type DirectionId } from "../../src/pages/design/blog/_data/samples.ts";

const OUT = "docs/design/blog";
const MAX_HEIGHT = 2600;
const DIRECTIONS: DirectionId[] = ["a", "b", "c"];
const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;
const THEMES = ["dark", "light"] as const;

const fullPost = posts.find((p) => p.body === "full-with-image")!;
const SCREENS = {
  landing: (d: DirectionId) => landingPath(d),
  listing: (d: DirectionId) => listingPath(d, 1),
  post: (d: DirectionId) => postPath(d, fullPost),
} as const;

mkdirSync(OUT, { recursive: true });

for (const d of DIRECTIONS) {
  for (const [screen, pathFor] of Object.entries(SCREENS)) {
    for (const size of WIDTHS) {
      for (const theme of THEMES) {
        test(`${d} ${screen} ${size.name} ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: size.width, height: size.height });
          await page.addInitScript((value) => {
            try {
              localStorage.setItem("color-theme", value);
            } catch {
              // Storage unavailable: the page falls back to dark.
            }
          }, theme);
          await page.goto(pathFor(d));
          await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
          await page.evaluate(() => document.fonts.ready);
          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.screenshot({
            path: `${OUT}/${d}-${screen}-${size.name}-${theme}.jpg`,
            type: "jpeg",
            quality: 70,
            fullPage: true,
            animations: "disabled",
            caret: "hide",
            clip: { x: 0, y: 0, width: size.width, height: Math.min(height, MAX_HEIGHT) },
          });
        });
      }
    }
  }
}
