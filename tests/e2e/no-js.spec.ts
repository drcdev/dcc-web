// The shell with JavaScript turned off (FR-007, FR-007a, FR-013, FR-022,
// FR-022a; contracts/shell-dom.md; research R6). Without script the links are
// a plain wrapping list in the "Main" navigation, there is no menu button or
// theme switch, and the page is dark.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MENU_BUTTON, NAV_LIST, NOT_FOUND_PENDING, PRIMARY, TEMPLATES } from "./templates.ts";

const THEME_INIT = readFileSync(
  fileURLToPath(new URL("../../src/scripts/theme-init.js", import.meta.url)),
  "utf-8",
).trim();

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

test.use({ javaScriptEnabled: false });

for (const template of TEMPLATES) {
  for (const size of WIDTHS) {
    test.describe(`${template.name} at ${size.name} width without JavaScript`, () => {
      test.use({ viewport: { width: size.width, height: size.height } });

      test.beforeEach(async ({ page }) => {
        test.fixme(!template.built, NOT_FOUND_PENDING);
        await page.goto(template.path);
      });

      test("shows the navigation as a plain wrapping list inside the Main landmark", async ({ page }) => {
        const nav = page.getByRole("navigation", { name: "Main" });
        await expect(nav).toHaveCount(1);
        const list = nav.locator(NAV_LIST);
        await expect(list).toBeVisible();
        await expect(list).toHaveCSS("flex-wrap", "wrap");
        const links = list.locator("a");
        await expect(links).toHaveCount(7);
        for (let i = 0; i < PRIMARY.length; i += 1) await expect(links.nth(i)).toBeVisible();
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });

      test("shows no menu button and no theme switch", async ({ page }) => {
        await expect(page.locator(MENU_BUTTON)).toBeHidden();
        await expect(page.locator('button[aria-label^="Theme:"]')).toHaveCount(0);
        await expect(page.locator("button:visible:enabled")).toHaveCount(0);
      });

      test("reaches every navigation link with Tab in order", async ({ page }) => {
        const hrefs: string[] = [];
        for (let i = 0; i < 12; i += 1) {
          await page.keyboard.press("Tab");
          hrefs.push(await page.evaluate(() => document.activeElement?.getAttribute("href") ?? ""));
        }
        // Skip link, site name, then the seven links (no menu button without script).
        expect(hrefs.slice(0, 9)).toEqual(["#main", "/", ...PRIMARY.map(([, href]) => href)]);
      });

      test("activates a navigation link with Enter", async ({ page }) => {
        await page.locator(`${NAV_LIST} a[href="/about/"]`).focus();
        await Promise.all([page.waitForURL("**/about/"), page.keyboard.press("Enter")]);
      });

      test("is dark, with the header, main content and footer readable", async ({ page }) => {
        await expect(page.locator("html")).toHaveClass(/\bdark\b/);
        await expect(page.locator("html")).not.toHaveClass(/\bjs\b/);
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.locator("main h1")).toBeVisible();
        await expect(page.getByRole("contentinfo")).toHaveCount(1);
      });
    });
  }

  test(`${template.name}: the served HTML has only the inline theme-init script and same-origin bundled module scripts`, async ({
    request,
    baseURL,
  }) => {
    test.fixme(!template.built, NOT_FOUND_PENDING);
    const response = await request.get(template.path);
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => ({
      attrs: m[1] ?? "",
      body: (m[2] ?? "").trim(),
    }));
    expect(scripts.length).toBeGreaterThan(0);
    const inlineClassic = scripts.filter((s) => !/\bsrc=/.test(s.attrs) && !/type="module"/.test(s.attrs));
    expect(inlineClassic.map((s) => s.body)).toEqual([THEME_INIT]);
    for (const script of scripts) {
      expect(script.attrs).not.toMatch(/\son[a-z]+=/i);
      const src = /\bsrc="([^"]*)"/.exec(script.attrs)?.[1];
      if (src === undefined) continue;
      expect(script.attrs).toMatch(/type="module"/);
      expect(new URL(src, baseURL).origin).toBe(new URL(baseURL!).origin);
    }
  });
}

test("the writing landing lead and both series links are present and usable without JavaScript", async ({ page }) => {
  await page.goto("/writing/");
  const lead = page.locator("main [data-series-intro]");
  await expect(lead.getByRole("heading", { level: 2, name: "Drift & Convergence" })).toBeVisible();
  await expect(lead.getByRole("link", { name: "Read Convergence" })).toBeVisible();
  await lead.getByRole("link", { name: "Read Drift" }).click();
  await expect(page).toHaveURL(/\/writing\/drift\/$/);
  await expect(page.locator("main h1")).toHaveText("Drift");
});
