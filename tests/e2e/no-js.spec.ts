// The shell with JavaScript turned off (FR-007, FR-007a, FR-013, FR-022,
// FR-022a; contracts/shell-dom.md; research R6). Without script the links are
// a plain wrapping list in the "Main" navigation, there is no menu button or
// theme switch, and the page is dark.
import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { postsWithAssessment } from "../helpers/content.ts";
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
        await expect(links).toHaveCount(6);
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
        // Skip link, site name, then the six links (no menu button without script).
        expect(hrefs.slice(0, 8)).toEqual(["#main", "/", ...PRIMARY.map(([, href]) => href)]);
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

// specs/022 P05, FR-011: without JavaScript the questions panel is not shown at all (no dead
// button) and the post reads normally.
test("a writing post shows no questions panel without JavaScript and reads normally", async ({ page }) => {
  await page.goto("/writing/sample-everything/");
  await expect(page.locator("[data-questions]")).toBeHidden();
  await expect(page.getByRole("button", { name: "Get questions" })).toHaveCount(0);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("[data-post-body]")).toBeVisible();
});

// specs/046 D09, SC-006: with JavaScript off, at phone and desktop width, nothing in the questions
// area is displayed or focusable, and the post body follows the title card.
for (const size of WIDTHS) {
  test(`the questions area is not shown or focusable without JavaScript at ${size.name} width`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("/writing/sample-everything/");
    const aside = page.locator("[data-questions]");
    await expect(aside).toBeHidden();
    await expect(page.locator("[data-questions-toggle]")).toBeHidden();
    await expect(page.locator("[data-questions-content]")).toBeHidden();
    // No focusable element survives inside the area: nothing is displayed, so Tab cannot land there.
    const focusable = await aside.evaluate(
      (el) =>
        [...el.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]")].filter(
          (node) => node.getClientRects().length > 0,
        ).length,
    );
    expect(focusable).toBe(0);
    const order = await page.evaluate(() => {
      const card = document.querySelector("[data-title-card]");
      const body = document.querySelector("[data-post-body]");
      return card && body ? Boolean(card.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(order).toBe(true);
    await expect(page.locator("[data-post-body]")).toBeVisible();
  });
}

// specs/037 U18: without JavaScript the post reads in full, the self-assessment shows a note and its
// statements as a list, and no form control is visible.
test("the self-assessment post reads without JavaScript and lists the statements without controls", async ({ page }) => {
  const { post, assessment } = postsWithAssessment()[0]!;
  await page.goto(post.address);
  const block = page.locator("[data-assessment]");
  // Collapsed behind its button (FR-001a); native disclosure opens it without JavaScript.
  await expect(block.locator("[data-assessment-nojs]")).toBeHidden();
  await block.locator("details[data-assessment-details] > summary").click();
  await expect(block).toContainText("needs JavaScript");
  for (const shift of assessment.shifts) {
    await expect(block.getByRole("heading", { name: shift.name })).toBeVisible();
    await expect(block.locator("[data-assessment-nojs] li", { hasText: shift.statements[0]! }).first()).toBeVisible();
    // The moved text is in the HTML.
    await expect(page.locator("[data-post-body]")).toContainText(shift.practicalApplication.slice(0, 25));
  }
  await expect(block.locator("input:visible, button:visible, form:visible")).toHaveCount(0);
});

// specs/037 FR-001a: the title-card link opens the collapsed block without JavaScript.
test("the self-assessment title-card link reveals the statement list without JavaScript", async ({ page }) => {
  const { post } = postsWithAssessment()[0]!;
  await page.goto(post.address);
  const block = page.locator("[data-assessment]");
  await expect(block.locator("[data-assessment-nojs]")).toBeHidden();
  await page.locator("[data-assessment-link]").click();
  await expect(block.locator("details[data-assessment-details]")).toHaveAttribute("open", "");
  await expect(block.locator("[data-assessment-nojs] li").first()).toBeVisible();
  await expect(block.locator("[data-assessment-nojs] li").first()).toBeInViewport();
});

// specs/037 FR-011 (quickstart step 11): with JavaScript off and print media, the statement list
// prints in full and no form control shows.
test("the self-assessment post prints all fifteen statements without JavaScript and without controls", async ({ page }) => {
  const { post, assessment } = postsWithAssessment()[0]!;
  await page.goto(post.address);
  await page.emulateMedia({ media: "print" });
  const block = page.locator("[data-assessment]");
  const statements = block.locator("[data-assessment-nojs] li");
  await expect(statements).toHaveCount(assessment.shifts.length * 3);
  for (const li of await statements.all()) await expect(li).toBeVisible();
  await expect(block.locator("input:visible, button:visible, form:visible, select:visible")).toHaveCount(0);
});
