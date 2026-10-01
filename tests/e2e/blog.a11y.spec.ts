// Accessibility checks for the blog that axe does not make (specs/008-blog/tasks.md
// T092; FR-019, FR-047 to FR-051, FR-054, SC-006). Runs in the existing `a11y`
// project (its testMatch matches this file's name) over every `writing-*` row of
// tests/e2e/templates.ts, so rows added later (landing, listings, topic pages)
// are covered without editing this file. axe itself runs in a11y.spec.ts, which
// loops the same rows.
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { TEMPLATES } from "./templates.ts";

const THEMES = ["dark", "light"] as const;
const SUFFIX = " · Don Coleman";

async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
}

const noSidewaysScroll = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

/** Waits for the copy buttons, which a script shows, so the checks see the page as a reader does. */
async function copyButtonsReady(page: Page) {
  if ((await page.locator("figure[data-code-block]").count()) > 0) {
    await page.locator("figure[data-code-block] button").first().waitFor({ state: "visible" });
  }
}

const blogTemplates = TEMPLATES.filter((t) => t.name.startsWith("writing-"));

test("the blog templates are listed in tests/e2e/templates.ts", () => {
  expect(blogTemplates.length).toBeGreaterThan(0);
});

for (const template of blogTemplates) {
  test.describe(`${template.name} template (blog checks)`, () => {
    for (const theme of THEMES) {
      test.describe(`${theme} theme`, () => {
        test.beforeEach(async ({ page }) => {
          await setTheme(page, theme);
        });

        test("has one h1, no skipped heading levels, and the document title of FR-048", async ({ page }) => {
          await page.goto(template.path);
          await expect(page.locator("h1")).toHaveCount(1);
          const levels = await page.evaluate(() =>
            Array.from(document.querySelectorAll("main h1,main h2,main h3,main h4,main h5,main h6")).map((el) =>
              Number(el.tagName.slice(1)),
            ),
          );
          expect(levels[0]).toBe(1);
          let previous = 0;
          for (const level of levels) {
            expect(level - previous).toBeLessThanOrEqual(1);
            previous = level;
          }
          const title = await page.title();
          expect(title.endsWith(SUFFIX)).toBe(true);
          expect(title.length).toBeGreaterThan(SUFFIX.length);
          if (template.name.startsWith("writing-post")) {
            const h1 = (await page.locator("h1").innerText()).replace(/\s+/g, " ").trim();
            expect(title).toBe(`${h1}${SUFFIX}`);
          }
        });

        test("has the skip link, one banner, one main and one footer landmark", async ({ page }) => {
          await page.goto(template.path);
          await expect(page.getByRole("link", { name: "Skip to main content" })).toHaveCount(1);
          await expect(page.getByRole("banner")).toHaveCount(1);
          await expect(page.getByRole("main")).toHaveCount(1);
          await expect(page.getByRole("contentinfo")).toHaveCount(1);
        });

        test("tabs through every control in DOM and visual order, each with the site's focus indicator", async ({
          page,
        }) => {
          await page.goto(template.path);
          await copyButtonsReady(page);
          const stops: { index: number; top: number; inHeader: boolean; outline: string; width: number }[] = [];
          const count = await page.evaluate(
            () =>
              document.querySelectorAll(
                'a[href], button:not([hidden]), [tabindex="0"], input, select, textarea, summary',
              ).length,
          );
          for (let i = 0; i < count + 4; i += 1) {
            await page.keyboard.press("Tab");
            const stop = await page.evaluate(() => {
              const el = document.activeElement as HTMLElement | null;
              if (!el || el === document.body) return null;
              const all = Array.from(document.querySelectorAll("*"));
              const style = getComputedStyle(el);
              return {
                index: all.indexOf(el),
                // Cards in one grid row are read one after the other, so a card's pills sit below
                // the next card's title. Order is judged by the card a control sits in (FR-049).
                top: (el.closest("[data-post-card], [data-lead-story]") ?? el).getBoundingClientRect().top + window.scrollY,
                inHeader: !!el.closest("header, a[href='#main']") || el.matches("a[href='#main'], .sr-only"),
                outline: style.outlineStyle,
                width: parseFloat(style.outlineWidth),
              };
            });
            if (!stop) break;
            if (stops.length && stops.at(-1)!.index === stop.index) break;
            stops.push(stop);
          }
          expect(stops.length).toBeGreaterThan(3);
          let previous = -1;
          let previousTop = 0;
          for (const stop of stops) {
            expect(stop.index, "DOM order").toBeGreaterThan(previous);
            previous = stop.index;
            expect(stop.outline, "focus indicator style").not.toBe("none");
            expect(stop.width, "focus indicator width").toBeGreaterThanOrEqual(2);
            if (!stop.inHeader) {
              expect(stop.top + 6, "visual order").toBeGreaterThanOrEqual(previousTop);
              previousTop = stop.top;
            }
          }
        });

        test("gives pills, share and copy buttons, pagination and the feed link a 24 by 24 px target", async ({
          page,
        }) => {
          await page.goto(template.path);
          await copyButtonsReady(page);
          const small = await page.evaluate(() => {
            const selector = [
              "[data-topic-pill]",
              "[data-share] a",
              "[data-share] button",
              "figure[data-code-block] button",
              'nav[aria-label="Pagination"] a',
              'nav[aria-label="Pagination"] [aria-current]',
              'a[href$="rss.xml"]',
            ].join(",");
            return Array.from(document.querySelectorAll<HTMLElement>(selector))
              .map((el) => ({ name: el.textContent?.trim().slice(0, 30), rect: el.getBoundingClientRect() }))
              .filter(({ rect }) => rect.width > 0 && rect.height > 0 && (rect.width < 24 || rect.height < 24))
              .map(({ name, rect }) => `${name}: ${Math.round(rect.width)}x${Math.round(rect.height)}`);
          });
          expect(small).toEqual([]);
        });

        test("runs no transition or animation with reduced motion", async ({ browser }) => {
          const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
          const page = await context.newPage();
          await setTheme(page, theme);
          await page.goto(template.path);
          const moving = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLElement>("body *"))
              .filter((el) => {
                const s = getComputedStyle(el);
                return [s.transitionDuration, s.animationDuration]
                  .flatMap((v) => v.split(",").map((d) => parseFloat(d)))
                  .some((d) => d > 0);
              })
              .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`),
          );
          expect(moving).toEqual([]);
          await context.close();
        });

        test("keeps a visible border or outline on pills, marks, notices and code and card edges in forced colours", async ({
          browser,
        }) => {
          const context = await browser.newContext({ forcedColors: "active", viewport: { width: 390, height: 844 } });
          const page = await context.newPage();
          await setTheme(page, theme);
          await page.goto(template.path);
          const bare = await page.evaluate(() => {
            const selector = [
              "[data-topic-pill]",
              "[data-featured-mark]",
              "[data-draft-label]",
              "[data-draft-notice]",
              "[data-post-card]",
              "[data-code-block]",
              ".table-wrapper",
            ].join(",");
            const edge = (side: "top" | "right" | "bottom" | "left", s: CSSStyleDeclaration) => {
              const width = parseFloat(s.getPropertyValue(`border-${side}-width`));
              const style = s.getPropertyValue(`border-${side}-style`);
              return width > 0 && style !== "none" && style !== "hidden";
            };
            return Array.from(document.querySelectorAll<HTMLElement>(selector))
              .filter((el) => {
                const s = getComputedStyle(el);
                const outlined = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
                const bordered = (["top", "right", "bottom", "left"] as const).some((side) => edge(side, s));
                return !outlined && !bordered;
              })
              .map((el) => `${el.tagName.toLowerCase()} ${el.getAttribute("class")?.slice(0, 50) ?? ""}`);
          });
          expect(bare).toEqual([]);
          // Focus indicators survive as well.
          await page.keyboard.press("Tab");
          const focus = await page.evaluate(() => {
            const s = getComputedStyle(document.activeElement as HTMLElement);
            return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
          });
          expect(focus.style).not.toBe("none");
          expect(focus.width).toBeGreaterThanOrEqual(2);
          await context.close();
        });

        test("reflows at 320 px with WCAG 1.4.12 text spacing, without clipping or truncating the title card", async ({
          page,
        }) => {
          await page.setViewportSize({ width: 320, height: 640 });
          await page.goto(template.path);
          await noSidewaysScroll(page);
          // The page's CSP blocks an injected <style>, so the overrides go in as a constructed stylesheet.
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
          await noSidewaysScroll(page);
          const clipped = await page.evaluate(() => {
            const headings = Array.from(document.querySelectorAll<HTMLElement>("main h1, [data-post-card] h2, [data-post-card] h3"));
            return headings
              .filter((el) => {
                const s = getComputedStyle(el);
                if (s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none" && s.webkitLineClamp !== "") return true;
                if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) return true;
                const rect = el.getBoundingClientRect();
                for (let a = el.parentElement; a; a = a.parentElement) {
                  const p = getComputedStyle(a);
                  if (p.overflowX === "visible" && p.overflowY === "visible") continue;
                  const box = a.getBoundingClientRect();
                  if (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.bottom > box.bottom + 1) return true;
                }
                return false;
              })
              .map((el) => el.textContent?.slice(0, 40));
          });
          expect(clipped).toEqual([]);
        });

        test("exposes alt text and keeps the layout intact when every image request fails", async ({ page }) => {
          await page.route("**/*", (route) =>
            route.request().resourceType() === "image" ? route.abort() : route.continue(),
          );
          await page.setViewportSize({ width: 390, height: 844 });
          await page.goto(template.path);
          await noSidewaysScroll(page);
          const missingAlt = await page.evaluate(() =>
            Array.from(document.querySelectorAll("main img"))
              .filter((img) => !(img.getAttribute("alt") ?? "").trim())
              .map((img) => img.getAttribute("src")),
          );
          expect(missingAlt).toEqual([]);
          await expect(page.locator("h1")).toBeVisible();
          await page.setViewportSize({ width: 1280, height: 800 });
          await noSidewaysScroll(page);
        });
      });
    }

    test("loads only the site's own scripts, plus the copy module on a post page (FR-054)", async ({ page }) => {
      await page.goto(template.path);
      const scripts = await page.evaluate(() =>
        Array.from(document.querySelectorAll("script")).map((s) => ({
          src: s.getAttribute("src") ?? "",
          type: s.getAttribute("type") ?? "",
          inline: !s.getAttribute("src"),
        })),
      );
      for (const script of scripts) {
        if (script.src) {
          const url = new URL(script.src, page.url());
          const own = url.origin === new URL(page.url()).origin;
          const analytics = url.origin === "https://static.cloudflareinsights.com";
          expect(own || analytics, script.src).toBe(true);
        }
      }
      // One pre-paint theme script; the rest are bundled modules (copy, and later share).
      expect(scripts.filter((s) => s.inline && s.type !== "module")).toHaveLength(1);
      const modules = scripts.filter((s) => s.type === "module");
      // The site's existing modules (menu, theme switch) are counted on a page with no blog parts;
      // a post page may add the copy module and the share module, nothing else.
      await page.goto("/about/");
      const existing = await page.locator("script[type=module]").count();
      await page.goto(template.path);
      expect(modules.length).toBeLessThanOrEqual(existing + (template.name.startsWith("writing-post") ? 2 : 0));
      // The copy module is present exactly where a code block is.
      const hasCode = (await page.locator("figure[data-code-block]").count()) > 0;
      if (hasCode) expect(modules.length).toBeGreaterThanOrEqual(1);
    });
  });
}

// Series markers and reflow (spec 013 US3; FR-010, FR-016d). axe over these pages runs in
// a11y.spec.ts; these checks cover the pages with markers present in both themes, and reflow.
const MARKER_PAGES = ["/writing/", "/writing/all/", "/writing/self-contained-development-for-ghost-themes/"] as const;
for (const theme of THEMES) {
  for (const path of MARKER_PAGES) {
    test(`${path} shows a series marker with readable text in the ${theme} theme`, async ({ page }) => {
      await setTheme(page, theme);
      await page.goto(path);
      const marker = page.locator("[data-series-marker]").first();
      await expect(marker).toBeVisible();
      await expect(marker).toHaveText(/^Series: (Drift|Convergence)$/);
      expect(await marker.getAttribute("aria-label")).toBeNull();
      const box = await marker.boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    });
  }
}

const REFLOW_PAGES = ["/writing/", "/writing/drift/", "/writing/self-contained-development-for-ghost-themes/", "/"] as const;
for (const path of REFLOW_PAGES) {
  test(`${path} reflows with no horizontal scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await noSidewaysScroll(page);
  });

  test(`${path} reflows with no horizontal scroll at 200% zoom`, async ({ page }) => {
    // 200% zoom of a 1280px window is a 640px layout; the 320px case above is the narrowest.
    await page.setViewportSize({ width: 640, height: 800 });
    await page.goto(path);
    await noSidewaysScroll(page);
  });
}

test("the writing landing lead keeps heading levels in order and has no axe violations", async ({ page }) => {
  await page.goto("/writing/");
  const levels = await page
    .locator("main h1, main h2, main h3")
    .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
  const intro = page.locator("[data-series-intro]");
  await expect(intro.getByRole("heading", { level: 3 })).toHaveCount(2);
  const results = await new AxeBuilder({ page }).include("[data-series-intro]").analyze();
  expect(results.violations).toEqual([]);
});
