import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { CAPTURES } from "./captures";

const OUT_DIR = "docs/design/portfolio";
const MAX_BYTES = 600 * 1024; // FR-042
const QUALITIES = [82, 72, 62, 52, 42, 32];

mkdirSync(OUT_DIR, { recursive: true });

for (const c of CAPTURES) {
  test(c.name, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: c.width, height: c.height },
      reducedMotion: "reduce",
      colorScheme: c.theme,
      deviceScaleFactor: 1,
    });
    // The site reads the stored preference (src/scripts/theme-init.js).
    await context.addInitScript((theme) => {
      try {
        localStorage.setItem("color-theme", theme);
      } catch {}
    }, c.theme);
    const page = await context.newPage();
    await page.goto(c.path, { waitUntil: "load" });
    await expect(page.locator("html")).toHaveClass(c.theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ fullPage: true, animations: "disabled" });
    await context.close();

    let out = Buffer.alloc(0);
    for (const quality of QUALITIES) {
      out = await sharp(png).webp({ quality }).toBuffer();
      if (out.length <= MAX_BYTES) break;
    }
    expect(out.length, `${c.name} must stay under 600 KB`).toBeLessThanOrEqual(MAX_BYTES);
    writeFileSync(`${OUT_DIR}/${c.name}`, out);
  });
}
