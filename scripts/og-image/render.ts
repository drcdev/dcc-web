#!/usr/bin/env node
// scripts/og-image/render.ts — renders the site-wide default sharing image,
// public/og-default.png (1200×630), from a small HTML template in the Flux
// colours: dusk background, rust name (FR-017b; research R9). The lettering is Inter Bold,
// embedded from src/assets/fonts/Inter-Bold.woff2 (specs/020-inter-diagram-social-text).
// Re-run `node scripts/og-image/render.ts` and commit the PNG whenever this script changes;
// the build never runs it. Colours are the Flux palette bases in src/styles/global.css.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const WIDTH = 1200;
const HEIGHT = 630;
const DUSK = "#1c1a29"; // --color-dusk-BASE
const RUST = "#d68844"; // --color-rust-BASE
const out = fileURLToPath(new URL("../../public/og-default.png", import.meta.url));

export const OG_FONT_FILE = fileURLToPath(new URL("../../src/assets/fonts/Inter-Bold.woff2", import.meta.url));

export function ogHtml(fontBase64: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      @font-face {
        font-family: Inter;
        font-style: normal;
        font-weight: 700;
        src: url(data:font/woff2;base64,${fontBase64}) format("woff2");
      }
      html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; }
      body {
        background: ${DUSK};
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 96px;
        box-sizing: border-box;
        font-family: Inter;
      }
      h1 { color: ${RUST}; font-size: 112px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
      .rule { width: 160px; height: 8px; background: ${RUST}; margin-top: 40px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Don Coleman</h1>
    <div class="rule"></div>
  </body>
</html>`;
}

if (import.meta.main) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
    await page.setContent(ogHtml(readFileSync(OG_FONT_FILE).toString("base64")));
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(
      () =>
        [...document.fonts].some((f) => f.family.replace(/["']/g, "") === "Inter" && f.weight === "700" && f.status === "loaded") &&
        document.fonts.check("700 112px Inter", "Don Coleman"),
    );
    if (!loaded) throw new Error("Inter Bold did not load; the sharing image was not written");
    await page.screenshot({ path: out, type: "png" });
    console.log(`Wrote ${WIDTH}×${HEIGHT} sharing image to public/og-default.png`);
  } finally {
    await browser.close();
  }
}
