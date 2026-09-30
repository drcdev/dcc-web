// Accessibility gate (successor of placeholder.a11y.spec.ts). Runs axe with
// every WCAG 2.0/2.1/2.2 A and AA tag against each page template at phone and
// desktop widths in both themes, with the mobile menu open, and with
// JavaScript disabled, plus forced-colours, reduced-motion, reflow and
// text-spacing checks (FR-020, FR-020a, FR-020b, FR-021, FR-021a, FR-022a,
// FR-027, SC-002; contracts/verify-gate.md).
//
// Carried forward from the placeholder: one main, one h1 and no skipped
// heading levels, a non-empty title, lang="en", no horizontal scroll at 320 px
// and at 200% zoom, readable without JavaScript, and a first Tab stop with an
// accessible name and a visible focus style (now the skip link).
// Deliberately dropped (they contradict this feature's spec; listed for the
// PR description, T097): "has no non-text content" and "first Tab stop is the
// link to the current site".
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TEMPLATES } from "./templates.ts";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];


const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const THEMES = ["dark", "light"] as const;

const MENU_BUTTON = 'button[aria-controls="primary-nav-list"]';
// The switch is named by its own visually hidden text ("Theme: Dark"), never
// aria-label (contracts/theme.md "Toggle"; tests/component/ThemeToggle.test.ts).
const THEME_SWITCH = "footer button[data-theme-toggle]";

async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

for (const template of TEMPLATES) {
  test.describe(`${template.name} template`, () => {
    for (const size of WIDTHS) {
      for (const theme of THEMES) {
        test(`has zero axe violations at ${size.name} width in the ${theme} theme`, async ({ page }) => {
          await page.setViewportSize({ width: size.width, height: size.height });
          await setTheme(page, theme);
          await page.goto(template.path);
          await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
          await expectNoAxeViolations(page);
        });
      }
    }

    for (const theme of THEMES) {
      test(`has zero axe violations with the mobile menu open at phone width in the ${theme} theme`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setTheme(page, theme);
        await page.goto(template.path);
        const button = page.locator(MENU_BUTTON);
        await button.click();
        await expect(button).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator("#primary-nav-list")).toBeVisible();
        await expectNoAxeViolations(page);
      });
    }

    test("has zero axe violations with JavaScript disabled at phone width", async ({ browser }) => {
      const viewport = { width: 390, height: 844 };
      const stripScripts = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

      // 1. The genuine no-JavaScript render.
      const noJs = await browser.newContext({ javaScriptEnabled: false, viewport });
      const noJsPage = await noJs.newPage();
      await noJsPage.goto(template.path);
      await expect(noJsPage.locator(MENU_BUTTON)).toBeHidden();
      await expect(noJsPage.locator("#primary-nav-list")).toBeVisible();
      const noJsDom = stripScripts(await noJsPage.evaluate(() => document.documentElement.outerHTML));
      await noJs.close();

      // 2. axe-core schedules its checks with timers, which never fire while
      // script execution is disabled, so it cannot run in that context. Serve
      // the same response with its <script> elements removed instead: none of
      // the page's own code runs, the resulting DOM is checked to be identical
      // to the no-JavaScript render, and axe audits that.
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.route(`**${template.path}`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response, body: stripScripts(await response.text()) });
      });
      await page.goto(template.path);
      expect(stripScripts(await page.evaluate(() => document.documentElement.outerHTML))).toBe(noJsDom);
      await expect(page.locator(MENU_BUTTON)).toBeHidden();
      await expect(page.locator("#primary-nav-list")).toBeVisible();
      await expectNoAxeViolations(page);
      await context.close();
    });

    // A colour transition that runs while the page loads leaves axe sampling a
    // half-faded colour (the home call to action once read 4.23:1 mid-fade).
    // Chromium started one from the browser's default link style for every
    // transitioned element inside a size container (container-type), so no
    // transition may run during load, in either theme or at either width.
    for (const size of WIDTHS) {
      for (const theme of THEMES) {
        test(`runs no CSS transitions while loading at ${size.name} width in the ${theme} theme`, async ({ page }) => {
          await page.setViewportSize({ width: size.width, height: size.height });
          await setTheme(page, theme);
          await page.addInitScript(() => {
            const started: string[] = [];
            (window as unknown as { __transitions: string[] }).__transitions = started;
            document.addEventListener(
              "transitionrun",
              (event) => {
                const target = event.target as Element;
                started.push(`${target.tagName.toLowerCase()}.${String(target.className)} ${event.propertyName}`);
              },
              true,
            );
          });
          await page.goto(template.path);
          // Longer than any transition on the site (300 ms), so a late one is caught.
          await page.waitForTimeout(500);
          const started = await page.evaluate(() => (window as unknown as { __transitions: string[] }).__transitions);
          expect(started).toEqual([]);
        });
      }
    }

    test("has exactly one main landmark", async ({ page }) => {
      await page.goto(template.path);
      await expect(page.locator("main")).toHaveCount(1);
    });

    test("has exactly one h1 and no skipped heading levels", async ({ page }) => {
      await page.goto(template.path);
      await expect(page.locator("h1")).toHaveCount(1);
      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((el) => Number(el.tagName.slice(1))),
      );
      let previous = 0;
      for (const level of levels) {
        expect(level - previous).toBeLessThanOrEqual(1);
        previous = level;
      }
    });

    test("has a non-empty title", async ({ page }) => {
      await page.goto(template.path);
      expect((await page.title()).trim().length).toBeGreaterThan(0);
    });

    test('has lang="en" on the root element', async ({ page }) => {
      await page.goto(template.path);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("reflows without horizontal scroll at 320 CSS px wide", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(template.path);
      await expectNoHorizontalScroll(page);
    });

    test("reflows without horizontal scroll at 200% zoom", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(template.path);
      const client = await page.context().newCDPSession(page);
      await client.send("Emulation.setDeviceMetricsOverride", {
        width: 640,
        height: 360,
        deviceScaleFactor: 2,
        mobile: false,
      });
      await expectNoHorizontalScroll(page);
    });

    test("is readable with JavaScript disabled", async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(template.path);
      expect((await page.locator("main").innerText()).trim().length).toBeGreaterThan(0);
      await context.close();
    });

    test("makes the skip link the first Tab stop, with an accessible name and a visible focus style", async ({
      page,
    }) => {
      await page.goto(template.path);
      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Skip to main content" });
      await expect(skip).toBeFocused();
      await expect(skip).toBeVisible();
      const style = await skip.evaluate((el) => {
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth) };
      });
      expect(style.outlineStyle).not.toBe("none");
      expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
    });

    test("keeps focus outlines and controls visible in forced-colours mode", async ({ browser }) => {
      const context = await browser.newContext({
        forcedColors: "active",
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(template.path);

      const targets = [
        page.getByRole("link", { name: "Skip to main content" }),
        page.locator(MENU_BUTTON),
        page.locator(THEME_SWITCH),
        page.locator("footer a").first(),
      ];
      for (const target of targets) {
        await target.focus();
        await expect(target).toBeVisible();
        const style = await target.evaluate((el) => {
          const s = getComputedStyle(el);
          return { outlineStyle: s.outlineStyle, outlineWidth: parseFloat(s.outlineWidth) };
        });
        expect(style.outlineStyle).not.toBe("none");
        expect(style.outlineWidth).toBeGreaterThanOrEqual(2);
      }

      await page.locator(MENU_BUTTON).click();
      for (const link of await page.locator("#primary-nav-list a").all()) {
        await expect(link).toBeVisible();
      }
      await context.close();
    });

    test("turns off transitions, animations and smooth scrolling with reduced motion", async ({ browser }) => {
      const context = await browser.newContext({
        reducedMotion: "reduce",
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();
      await page.goto(template.path);

      const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
      expect(scrollBehavior).toBe("auto");

      const selectors = ["html", "body", "#primary-nav-list", MENU_BUTTON, THEME_SWITCH, "header", "footer", "main"];
      for (const selector of selectors) {
        await expect(page.locator(selector).first()).toBeAttached();
        const durations = await page.locator(selector).first().evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.transitionDuration, s.animationDuration].flatMap((v) => v.split(",").map((d) => parseFloat(d)));
        });
        for (const duration of durations) expect(duration, selector).toBe(0);
      }
      await context.close();
    });

    test("survives WCAG 1.4.12 text spacing at 320 px without horizontal scroll or clipped navigation", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(template.path);
      // The page's CSP (FR-024a) blocks the inline <style> that addStyleTag
      // injects, so the WCAG 1.4.12 overrides go in through a constructed
      // stylesheet instead, which applies the same rules without weakening CSP.
      await page.evaluate(() => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`* {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p { margin-bottom: 2em !important; }`);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      });
      await expectNoHorizontalScroll(page);

      // Open the menu if it is collapsed at this width, then check each link fits its box.
      const button = page.locator(MENU_BUTTON);
      if (await button.isVisible()) await button.click();
      const links = page.locator('nav[aria-label="Main"] a');
      expect(await links.count()).toBeGreaterThan(0);
      for (const link of await links.all()) {
        await expect(link).toBeVisible();
        // Not clipped: the link's box has size, sits inside the viewport horizontally,
        // and no ancestor that hides overflow cuts it off.
        const clipped = await link.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return true;
          if (rect.left < -1 || rect.right > document.documentElement.clientWidth + 1) return true;
          for (let a = el.parentElement; a; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (s.overflowX === "visible" && s.overflowY === "visible") continue;
            const box = a.getBoundingClientRect();
            if (rect.left < box.left - 1 || rect.right > box.right + 1) return true;
            if (rect.top < box.top - 1 || rect.bottom > box.bottom + 1) return true;
          }
          return false;
        });
        expect(clipped).toBe(false);
      }
    });
  });
}

// The contact form's interactive states (SC-009): field errors, a form-level
// error above Send, and the success panel, in both themes and at both widths.
test.describe("contact form states", () => {
  const fill = async (page: Page) => {
    await page.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
    await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
    await page.getByLabel("Message", { exact: true }).fill("Hello, I would like to talk about a project.");
    await page.getByLabel(/I agree that Don Coleman/).check();
  };

  for (const size of WIDTHS) {
    for (const theme of THEMES) {
      test(`has zero axe violations with field errors at ${size.name} width in the ${theme} theme`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await setTheme(page, theme);
        await page.goto("/contact/");
        await page.getByLabel("Email", { exact: true }).fill("not-an-email");
        await page.getByRole("button", { name: "Send" }).click();
        await expect(page.locator("#contact-name-error")).toBeVisible();
        await expect(page.locator("#contact-email-error")).toBeVisible();
        await expect(page.locator("#contact-message-error")).toBeVisible();
        await expect(page.locator("#contact-consent-error")).toBeVisible();
        await expect(page.locator("#contact-status")).toHaveText("4 fields need attention.");
        await expectNoAxeViolations(page);
      });

      test(`has zero axe violations with a form-level error at ${size.name} width in the ${theme} theme`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await setTheme(page, theme);
        await page.route("**/api/contact", (route) =>
          route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ ok: false, error: "unavailable" }),
          }),
        );
        await page.goto("/contact/");
        await fill(page);
        await page.getByRole("button", { name: "Send" }).click();
        await expect(page.locator("#contact-status")).toContainText("the service is unavailable");
        await expectNoAxeViolations(page);
      });

      test(`has zero axe violations with the success panel at ${size.name} width in the ${theme} theme`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await setTheme(page, theme);
        await page.route("**/api/contact", (route) =>
          route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }),
        );
        await page.goto("/contact/");
        await fill(page);
        await page.getByRole("button", { name: "Send" }).click();
        await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
        await expectNoAxeViolations(page);
      });
    }
  }
});
