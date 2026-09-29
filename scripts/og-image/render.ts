#!/usr/bin/env node
// scripts/og-image/render.ts — renders the site-wide default sharing image,
// public/og-default.png (1200×630), from a small HTML template in the Flux
// colours: dusk background, rust name (FR-017b; research R9). Run once by hand
// with `node scripts/og-image/render.ts` and commit the PNG; the build never
// runs it. Colours are the Flux palette bases in src/styles/global.css.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";

const WIDTH = 1200;
const HEIGHT = 630;
const DUSK = "#1c1a29"; // --color-dusk-BASE
const RUST = "#d68844"; // --color-rust-BASE
const out = fileURLToPath(new URL("../../public/og-default.png", import.meta.url));

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; width: ${WIDTH}px; height: ${HEIGHT}px; }
      body {
        background: ${DUSK};
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 96px;
        box-sizing: border-box;
        font-family: ui-sans-serif, system-ui, sans-serif;
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

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: out, type: "png" });
  console.log(`Wrote ${WIDTH}×${HEIGHT} sharing image to public/og-default.png`);
} finally {
  await browser.close();
}
