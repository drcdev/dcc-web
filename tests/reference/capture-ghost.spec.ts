import { test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Captures reference screenshots of the live Ghost site (https://www.doncoleman.ca) for Don's
// later by-eye comparison against the new build (FR-005). Not part of `verify`: run on demand
// via `pnpm run reference:capture` (tests/reference/playwright.config.ts).
//
// Theme is forced via localStorage before each page loads, using Flux's own storage key
// ("color-theme") and values ("dark" / "light"), read from
// .reference/flux/assets/js/theme-toggle.js.

const outDir = fileURLToPath(new URL("./ghost", import.meta.url));
mkdirSync(outDir, { recursive: true });

const widths = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const themes = ["dark", "light"] as const;

let postPath: string | undefined;

test.describe.configure({ mode: "serial" });

test.describe("Ghost reference screenshots", () => {
  test.beforeAll(async ({ browser }) => {
    // Discover the first post URL linked from the home page.
    const page = await browser.newPage();
    let response;
    try {
      response = await page.goto("/", { waitUntil: "domcontentloaded" });
    } catch (error) {
      throw new Error(`Live site unreachable: GET / failed (${(error as Error).message})`);
    }
    if (!response || !response.ok()) {
      throw new Error(`Live site unreachable: GET / returned ${response?.status()}`);
    }
    const hrefs = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => a.getAttribute("href") ?? ""),
    );
    const match = hrefs.find((href) => /\/(drift|convergence|news)\/\d{4}\//.test(href));
    if (!match) {
      throw new Error(
        "Could not find a post link matching /(drift|convergence|news)/\\d{4}/ on the home page",
      );
    }
    postPath = match.startsWith("http") ? new URL(match).pathname : match;
    await page.close();
  });

  const pages = [
    { name: "home", getPath: () => "/" },
    { name: "post", getPath: () => postPath! },
    { name: "about", getPath: () => "/about/" },
  ] as const;

  for (const pageDef of pages) {
    for (const widthDef of widths) {
      for (const theme of themes) {
        test(`capture ${pageDef.name}-${widthDef.name}-${theme}`, async ({ browser }) => {
          const context = await browser.newContext({
            viewport: { width: widthDef.width, height: widthDef.height },
          });
          await context.addInitScript((themeValue: string) => {
            window.localStorage.setItem("color-theme", themeValue);
          }, theme);
          const page = await context.newPage();
          const path = pageDef.getPath();
          let response;
          try {
            response = await page.goto(path, { waitUntil: "networkidle" });
          } catch (error) {
            await context.close();
            throw new Error(
              `Live site unreachable: GET ${path} failed (${(error as Error).message})`,
            );
          }
          if (!response || !response.ok()) {
            await context.close();
            throw new Error(`Live site unreachable: GET ${path} returned ${response?.status()}`);
          }
          await page.screenshot({
            path: `${outDir}/${pageDef.name}-${widthDef.name}-${theme}.png`,
            fullPage: true,
          });
          await context.close();
        });
      }
    }
  }

  test("write README.md recording capture date and post URL used", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const readme = [
      "# Ghost reference screenshots",
      "",
      `Captured: ${date}`,
      `Post URL used: https://www.doncoleman.ca${postPath}`,
      "",
      "12 full-page PNGs at phone (390x844) and desktop (1280x800) widths, in dark and light",
      "themes, for the home page, the post above, and /about/.",
      "",
    ].join("\n");
    writeFileSync(`${outDir}/README.md`, readme, "utf-8");
  });
});
