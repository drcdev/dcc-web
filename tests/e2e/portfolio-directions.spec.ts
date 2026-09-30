// Portfolio design directions, end to end (specs/006-portfolio-design-directions;
// T027 to T029 for direction A). One `describe` per direction. Removed with the
// prototypes in Phase 9.
import { test, expect, type Browser, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { focusPocus, allEntries } from "../../src/prototypes/portfolio/sample.ts";
import { STAGE_ORDER } from "../../src/prototypes/portfolio/types.ts";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEME_SWITCH = "footer button[data-theme-toggle]";

const A_INDEX = "/design/portfolio/a/";
const A_STORY = "/design/portfolio/a/focus-pocus/";

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

async function axeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations).toEqual([]);
}

/** Every visible link, button and summary inside main, after tabbing to it. */
async function tabThroughMain(page: Page, visit: (info: { tag: string }) => Promise<void>) {
  await page.goto(A_STORY);
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press("Tab");
    const inMain = await page.evaluate(() => Boolean(document.activeElement?.closest("main")));
    // The site scrolls smoothly, so let a focus-driven scroll settle first.
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let last = -1;
          const tick = () => {
            if (window.scrollY === last) resolve();
            else {
              last = window.scrollY;
              setTimeout(tick, 80);
            }
          };
          tick();
        }),
    );
    if (inMain) await visit({ tag: await page.evaluate(() => document.activeElement!.tagName.toLowerCase()) });
  }
}

async function noJsContext(browser: Browser, width = 1280) {
  return browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
}

test.describe("Direction A Timeline: story", () => {
  test("shows the seven stages in order with headings and draft marks", async ({ page }) => {
    await page.goto(A_STORY);
    const ids = await page.locator("main section[aria-labelledby]").evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual([...STAGE_ORDER]);
    for (const stage of focusPocus.stages) {
      await expect(page.locator(`#${stage.id} h2`)).toHaveText(stage.heading);
      await expect(page.locator(`#${stage.id} [data-draft-mark]`)).toBeVisible();
    }
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
    await expect(page.locator("[data-prototype-notice]")).toBeVisible();
  });

  test("reaches every option with the keyboard (Enter and Space)", async ({ page }) => {
    await page.goto(A_STORY);
    for (const option of focusPocus.options) {
      const details = page.locator(`[data-option="${option.id}"]`);
      const summary = details.locator("summary");
      await expect(details).toHaveAttribute("data-option", option.id);
      // Start from a known state: closed, so the key press opens it.
      if ((await details.getAttribute("open")) !== null) {
        await summary.focus();
        await page.keyboard.press("Enter");
        await expect(details).not.toHaveAttribute("open", "");
      }
      await summary.focus();
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open", "");
      await expect(details).toContainText(option.summary);
      for (const line of [...option.pros, ...option.cons]) await expect(details).toContainText(line);
      await page.keyboard.press("Space");
      await expect(details).not.toHaveAttribute("open", "");
      await page.keyboard.press("Space");
      await expect(details).toHaveAttribute("open", "");
    }
  });

  test("starts with the chosen option open and labelled", async ({ page }) => {
    await page.goto(A_STORY);
    const chosen = focusPocus.options.find((o) => o.chosen)!;
    const details = page.locator(`[data-option="${chosen.id}"]`);
    await expect(details).toHaveAttribute("data-chosen", "");
    await expect(details).toHaveAttribute("open", "");
    await expect(details).toContainText("Chosen");
    await expect(details).toContainText(chosen.reason!);
    await expect(page.locator("[data-chosen]")).toHaveCount(1);
  });

  test("puts visuals beside the text at 1280 px and below it at 390 px", async ({ page }) => {
    const withVisual = focusPocus.stages.filter((s) => s.visual);
    for (const [width, beside] of [
      [1280, true],
      [390, false],
    ] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(A_STORY);
      for (const stage of withVisual) {
        const section = page.locator(`#${stage.id}`);
        const heading = await section.locator("h2").boundingBox();
        const visual = await section.locator("[data-stage-visual]").boundingBox();
        const sectionBox = await section.boundingBox();
        expect(heading && visual && sectionBox, stage.id).toBeTruthy();
        // Inside its own stage.
        expect(visual!.y).toBeGreaterThanOrEqual(sectionBox!.y - 1);
        expect(visual!.y + visual!.height).toBeLessThanOrEqual(sectionBox!.y + sectionBox!.height + 1);
        if (beside) {
          expect(visual!.x, `${stage.id} beside`).toBeGreaterThan(heading!.x + heading!.width - 1);
        } else {
          expect(visual!.y, `${stage.id} below`).toBeGreaterThan(heading!.y + heading!.height);
        }
      }
    }
  });

  test("does not scroll sideways at 320, 390 and 1280 px or at 200% zoom", async ({ page }) => {
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(A_STORY);
      await noHorizontalScroll(page);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(A_STORY);
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setDeviceMetricsOverride", { width: 640, height: 360, deviceScaleFactor: 2, mobile: false });
    await noHorizontalScroll(page);
  });

  test("links the invitation to the contact form with the project", async ({ page }) => {
    await page.goto(A_STORY);
    const link = page.locator("#invitation a[href='/contact/?project=focus-pocus']");
    await expect(link).toBeVisible();
    await expect(page.locator("#invitation h2")).toHaveText("Have a problem like this?");
  });

  test("links to the demo page and the repository with the stand-in note", async ({ page }) => {
    await page.goto(A_STORY);
    const built = page.locator("#built");
    await expect(built.locator("a[href='https://drc.dev/projects/focus-pocus']")).toBeVisible();
    await expect(built.locator(`a[href='${focusPocus.demo.secondaryHref}']`)).toBeVisible();
    await expect(built).toContainText(focusPocus.demo.standInNote);
  });

  test("is noindex and absent from the header, footer and sitemap", async ({ page, request }) => {
    for (const path of [A_STORY, A_INDEX]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator("header a[href^='/design/'], footer a[href^='/design/']")).toHaveCount(0);
    }
    const index = await (await request.get("/sitemap-index.xml")).text();
    for (const loc of [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!)) {
      const body = await (await request.get(new URL(loc).pathname)).text();
      expect(body).not.toContain("/design/");
    }
  });

  test("keeps scroll position and focus on the theme toggle mid-story, and does not replay reveals", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(A_STORY);
    await page.locator("#built").scrollIntoViewIfNeeded();
    const toggle = page.locator(THEME_SWITCH);
    await toggle.evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
    const opacities = () =>
      page.locator("[data-reveal]").evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    const before = await opacities();
    const y = await page.evaluate(() => window.scrollY);
    const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.keyboard.press("Enter");
    await expect
      .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(!wasDark);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await expect(toggle).toBeFocused();
    const after = await opacities();
    expect(after.length).toBe(before.length);
    after.forEach((o, i) => expect(Math.abs(o - before[i]!), `reveal ${i}`).toBeLessThan(0.02));
  });

  test("#options puts the heading at the top with the stage visible, and Tab moves into or after it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${A_STORY}#options`);
    await expect(page.locator("#options-heading")).toBeInViewport();
    await expect
      .poll(async () => (await page.locator("#options-heading").boundingBox())!.y, { message: "heading near the top" })
      .toBeLessThan(200);
    const box = await page.locator("#options-heading").boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    // The stage is fully shown at once, not mid-reveal.
    const opacity = await page.locator("#options [data-reveal]").first().evaluate((e) => Number(getComputedStyle(e).opacity));
    expect(opacity).toBe(1);
    await page.keyboard.press("Tab");
    const position = await page.evaluate(() => {
      const target = document.getElementById("options")!;
      const active = document.activeElement!;
      return {
        inside: target.contains(active),
        after: Boolean(target.compareDocumentPosition(active) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    expect(position.inside || position.after).toBe(true);
  });

  test("gives every interactive control a visible focus indicator and keeps it in view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    let visited = 0;
    await tabThroughMain(page, async () => {
      visited += 1;
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const s = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 8));
        return {
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth),
          inView: rect.top >= 0 && rect.bottom <= window.innerHeight,
          covered: !(top === el || el.contains(top) || Boolean(top?.contains(el))),
        };
      });
      expect(info.outlineStyle).not.toBe("none");
      expect(info.outlineWidth).toBeGreaterThanOrEqual(2);
      expect(info.inView).toBe(true);
      expect(info.covered).toBe(false);
    });
    expect(visited).toBeGreaterThan(5);
  });

  test("makes every control at least 24 by 24 CSS pixels", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(A_STORY);
    const small = await page.locator("main a, main summary, main button").evaluateAll((els) =>
      els
        .map((e) => ({ text: (e.textContent ?? "").trim().slice(0, 30), rect: e.getBoundingClientRect() }))
        .filter((e) => e.rect.width > 0 && (e.rect.width < 24 || e.rect.height < 24))
        .map((e) => e.text),
    );
    expect(small).toEqual([]);
  });
});

test.describe("Direction A Timeline: index", () => {
  const status = (page: Page) => page.locator("[data-filter-status]");

  test("shows five entries with title, problem, visual, themes and status", async ({ page }) => {
    await page.goto(A_INDEX);
    await expect(page.locator("h1")).toHaveText("Projects");
    await expect(page.locator("[data-entry]")).toHaveCount(5);
    for (const entry of allEntries) {
      const row = page.locator(`[data-entry="${entry.slug}"]`);
      await expect(row).toContainText(entry.title);
      await expect(row).toContainText(entry.problem);
      await expect(row).toContainText(entry.visual.label);
      for (const theme of entry.themes) await expect(row).toContainText(theme);
      await expect(row.locator("[data-status]")).toBeVisible();
    }
  });

  test("filters by theme, clears, and reads ?theme= known and unknown", async ({ page }) => {
    await page.goto(A_INDEX);
    await expect(status(page)).toHaveText("Showing all 5 projects.");
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect(page.locator("[data-entry]:visible")).toHaveCount(2);
    await expect(status(page)).toHaveText("Showing 2 projects about Mobile.");
    await expect(page).toHaveURL(/\?theme=Mobile/);
    await page.getByRole("button", { name: "All projects" }).click();
    await expect(page.locator("[data-entry]:visible")).toHaveCount(5);
    await expect(status(page)).toHaveText("Showing all 5 projects.");
    await expect(page).not.toHaveURL(/theme=/);

    await page.goto(`${A_INDEX}?theme=Web`);
    await expect(page.locator("[data-entry]:visible")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Web", exact: true })).toHaveAttribute("aria-pressed", "true");

    await page.goto(`${A_INDEX}?theme=Nonsense`);
    await expect(page.locator("[data-entry]:visible")).toHaveCount(0);
    await expect(status(page)).toHaveText("No projects match this theme.");
    await page.getByRole("button", { name: "Show all projects" }).click();
    await expect(page.locator("[data-entry]:visible")).toHaveCount(5);
  });

  test("announces every result change in the live region, including no match", async ({ page }) => {
    await page.goto(A_INDEX);
    const live = status(page);
    await expect(live).toHaveAttribute("role", "status");
    await expect(live).toHaveAttribute("aria-live", "polite");
    await page.getByRole("button", { name: "Productivity", exact: true }).click();
    await expect(live).toHaveText("Showing 2 projects about Productivity.");
    await page.getByRole("button", { name: "Design systems", exact: true }).click();
    await expect(live).toHaveText("Showing 2 projects about Design systems.");
    // A filter with one result uses the singular.
    await page.getByRole("button", { name: "Developer tools", exact: true }).click();
    await expect(live).toHaveText("Showing 1 project about Developer tools.");
    await page.goto(`${A_INDEX}?theme=Nothing`);
    await expect(status(page)).toHaveText("No projects match this theme.");
  });

  test("links Focus Pocus to the A story and no other entry to a story", async ({ page }) => {
    await page.goto(A_INDEX);
    for (const entry of allEntries.filter((e) => !e.storyPath)) {
      const hrefs = await page.locator(`[data-entry="${entry.slug}"] a`).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      expect(hrefs).toEqual([entry.externalHref]);
    }
    await page.locator(`[data-entry="focus-pocus"]`).getByRole("link", { name: "Focus Pocus", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${A_STORY}$`));
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
  });
});

test.describe("Direction A Timeline: reduced motion, no JavaScript, forced colours, axe", () => {
  test("turns reveals off with reduced motion and shows everything", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(A_STORY);
    const reveals = page.locator("[data-reveal]");
    expect(await reveals.count()).toBeGreaterThan(0);
    for (const el of await reveals.all()) {
      const css = await el.evaluate((e) => ({ name: getComputedStyle(e).animationName, opacity: getComputedStyle(e).opacity }));
      expect(css.name).toBe("none");
      expect(css.opacity).toBe("1");
    }
    for (const stage of focusPocus.stages) await expect(page.locator(`#${stage.id}`)).toBeAttached();
    await context.close();
  });

  test("stops reveals from the moment reduced motion is switched on mid-visit", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(A_STORY);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const el of await page.locator("[data-reveal]").all()) {
      const css = await el.evaluate((e) => ({ name: getComputedStyle(e).animationName, opacity: getComputedStyle(e).opacity }));
      expect(css.name).toBe("none");
      expect(css.opacity).toBe("1");
    }
    await context.close();
  });

  test("has no transition or animation on filter changes or <details> toggles with reduced motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    for (const [path, selector] of [
      [A_STORY, "details, summary, [data-option] *"],
      [A_INDEX, "[data-entry], [data-entry] *, portfolio-filter button"],
    ] as const) {
      await page.goto(path);
      const durations = await page.locator(selector).evaluateAll((els) =>
        els.flatMap((e) => {
          const s = getComputedStyle(e);
          return [s.transitionDuration, s.animationDuration].flatMap((v) => v.split(",").map((d) => parseFloat(d)));
        }),
      );
      expect(durations.length).toBeGreaterThan(0);
      for (const d of durations) expect(d).toBe(0);
    }
    await context.close();
  });

  test("shows all content and no visible button with JavaScript off", async ({ browser }) => {
    const context = await noJsContext(browser);
    const page = await context.newPage();
    await page.goto(A_STORY);
    for (const stage of focusPocus.stages) {
      await expect(page.locator(`#${stage.id} h2`)).toBeVisible();
      for (const paragraph of stage.body) await expect(page.locator(`#${stage.id}`)).toContainText(paragraph);
      if (stage.visual) await expect(page.locator(`#${stage.id}`)).toContainText(stage.visual.label);
    }
    for (const option of focusPocus.options) {
      const details = page.locator(`[data-option="${option.id}"]`);
      await expect(details.locator("summary")).toBeVisible();
      await expect(details).toContainText(option.summary);
    }
    await expect(page.locator("[data-chosen]")).toContainText(focusPocus.options.find((o) => o.chosen)!.reason!);
    await expect(page.locator("#invitation a[href='/contact/?project=focus-pocus']")).toBeVisible();
    for (const el of await page.locator("[data-reveal]").all()) {
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    }
    await expect(page.locator("button:visible")).toHaveCount(0);

    await page.goto(A_INDEX);
    await expect(page.locator("[data-entry]:visible")).toHaveCount(5);
    await expect(page.locator("button:visible")).toHaveCount(0);
    await expect(page.locator("[data-filter-status]")).toBeHidden();
    await context.close();
  });

  test("keeps text, controls, focus rings, status labels and diagrams visible in forced colours", async ({ browser }) => {
    const context = await browser.newContext({ forcedColors: "active", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const transparent = (c: string) => c === "rgba(0, 0, 0, 0)" || c === "transparent";
    for (const path of [A_STORY, A_INDEX]) {
      await page.goto(path);
      const problems = await page.locator("main [data-draft-mark], main [data-status], main [data-placeholder], main summary, main [data-marker], main h1, main h2, main p").evaluateAll(
        (els) =>
          els.flatMap((e) => {
            const s = getComputedStyle(e);
            const found: string[] = [];
            const label = `${e.tagName.toLowerCase()} ${(e.textContent ?? "").trim().slice(0, 20)}`;
            if (s.color === "rgba(0, 0, 0, 0)") found.push(`${label}: text transparent`);
            const hasBorder = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none";
            if (hasBorder && s.borderTopColor === "rgba(0, 0, 0, 0)") found.push(`${label}: border transparent`);
            return found;
          }),
      );
      expect(problems).toEqual([]);
      const svgs = page.locator("main [data-diagram] svg");
      for (const svg of await svgs.all()) {
        expect(transparent(await svg.evaluate((e) => getComputedStyle(e).stroke))).toBe(false);
      }
    }
    await page.goto(A_STORY);
    for (const target of [page.locator("main summary").first(), page.locator("#invitation a").first()]) {
      await page.keyboard.press("Tab");
      await target.focus();
      const style = await target.evaluate((el) => ({ w: parseFloat(getComputedStyle(el).outlineWidth), s: getComputedStyle(el).outlineStyle }));
      expect(style.s).not.toBe("none");
      expect(style.w).toBeGreaterThanOrEqual(2);
    }
    await context.close();
  });

  for (const [name, path] of [
    ["story", A_STORY],
    ["index", A_INDEX],
  ] as const) {
    test(`has zero axe violations on the ${name} with reduced motion`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      await page.goto(path);
      await axeClean(page);
      await context.close();
    });

    test(`has zero axe violations on the ${name} with JavaScript off at 1280 px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const strip = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
      await page.route(`**${path}`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response, body: strip(await response.text()) });
      });
      await page.goto(path);
      await axeClean(page);
      await context.close();
    });

    test(`has zero axe violations on the ${name} in forced colours`, async ({ browser }) => {
      const context = await browser.newContext({ forcedColors: "active", viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      // Chromium's forced-colours emulation leaves the dark theme's light text
      // in computed styles over a Canvas that axe reads as white, so axe
      // reports contrast failures that the visitor never sees. The light
      // theme's authored colours match what axe reads, so audit that theme.
      await page.addInitScript(() => localStorage.setItem("color-theme", "light"));
      await page.goto(path);
      await axeClean(page);
      await context.close();
    });

    test(`has zero axe violations on the ${name} at 320 px and at 200% zoom`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await axeClean(page);
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(path);
      const client = await page.context().newCDPSession(page);
      await client.send("Emulation.setDeviceMetricsOverride", { width: 640, height: 360, deviceScaleFactor: 2, mobile: false });
      await axeClean(page);
    });
  }
});

// ---------------------------------------------------------------------------
// Direction B "Cards" (T041 to T043)
// ---------------------------------------------------------------------------
const B_INDEX = "/design/portfolio/b/";
const B_STORY = "/design/portfolio/b/focus-pocus/";

async function settleScroll(page: Page) {
  // The site scrolls smoothly, so let a focus-driven scroll settle first.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = -1;
        const tick = () => {
          if (window.scrollY === last) resolve();
          else {
            last = window.scrollY;
            setTimeout(tick, 80);
          }
        };
        tick();
      }),
  );
}

/** True when a @view-transition rule applies under the page's current media state. */
function hasViewTransitionRule(page: Page) {
  return page.evaluate(() => {
    const walk = (rules: CSSRuleList): boolean => {
      for (const rule of Array.from(rules)) {
        if (rule.cssText.startsWith("@view-transition")) return true;
        if (rule instanceof CSSMediaRule && window.matchMedia(rule.conditionText).matches && walk(rule.cssRules)) return true;
        if (rule instanceof CSSSupportsRule && CSS.supports(rule.conditionText) && walk(rule.cssRules)) return true;
      }
      return false;
    };
    return Array.from(document.styleSheets).some((sheet) => walk(sheet.cssRules));
  });
}

test.describe("Direction B Cards: story", () => {
  test("shows the seven stage cards in order with headings and draft marks", async ({ page }) => {
    await page.goto(B_STORY);
    const ids = await page.locator("main section[aria-labelledby]").evaluateAll((els) => els.map((e) => e.id));
    expect(ids).toEqual([...STAGE_ORDER]);
    for (const stage of focusPocus.stages) {
      await expect(page.locator(`#${stage.id} h2`)).toHaveText(stage.heading);
      await expect(page.locator(`#${stage.id} [data-draft-mark]`)).toBeVisible();
    }
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
    await expect(page.locator("[data-prototype-notice]")).toBeVisible();
  });

  test("exposes the options as tabs named 'Options considered', chosen selected first", async ({ page }) => {
    await page.goto(B_STORY);
    await expect(page.getByRole("tablist", { name: "Options considered" })).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(focusPocus.options.length);
    const chosen = focusPocus.options.find((o) => o.chosen)!;
    await expect(page.locator("[role=tab][aria-selected=true]")).toHaveCount(1);
    await expect(page.locator("[role=tab][aria-selected=true]")).toContainText(chosen.name);
    const panel = page.getByRole("tabpanel");
    await expect(panel).toHaveCount(1);
    await expect(panel).toContainText(chosen.reason!);
    await expect(panel).toContainText("Chosen");
  });

  test("moves between option tabs by keyboard with automatic activation", async ({ page }) => {
    await page.goto(B_STORY);
    const tabs = page.getByRole("tab");
    const n = focusPocus.options.length;
    const tabindexes = await tabs.evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")));
    expect(tabindexes.filter((t) => t === "0")).toHaveLength(1);
    expect(tabindexes.filter((t) => t === "-1")).toHaveLength(n - 1);

    await page.locator("[role=tab][aria-selected=true]").focus();
    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(focusPocus.options[0]!.summary);
    await page.keyboard.press("End");
    await expect(tabs.nth(n - 1)).toBeFocused();
    await expect(page.getByRole("tabpanel")).toContainText(focusPocus.options[n - 1]!.summary);
    await page.keyboard.press("ArrowRight");
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(tabs.nth(n - 1)).toBeFocused();

    // Every option reachable, with its content, and the others hidden.
    for (const [i, option] of focusPocus.options.entries()) {
      await tabs.nth(i).click();
      const panel = page.getByRole("tabpanel");
      await expect(panel).toHaveCount(1);
      await expect(panel).toContainText(option.summary);
      for (const line of [...option.pros, ...option.cons]) await expect(panel).toContainText(line);
      await expect(page.locator("[data-option]:visible")).toHaveCount(1);
      await expect(tabs.nth(i)).toHaveAttribute("aria-controls", (await panel.getAttribute("id"))!);
      await expect(panel).toHaveAttribute("aria-labelledby", (await tabs.nth(i).getAttribute("id"))!);
    }
    // Tab from the selected tab moves into its panel or beyond, not to another tab.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.getAttribute("role"))).not.toBe("tab");
  });

  test("keeps visuals inside their own stage card", async ({ page }) => {
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(B_STORY);
      for (const stage of focusPocus.stages.filter((s) => s.visual)) {
        const section = page.locator(`#${stage.id}`);
        const visual = await section.locator("[data-stage-visual]").boundingBox();
        const box = await section.boundingBox();
        expect(visual && box, stage.id).toBeTruthy();
        expect(visual!.y).toBeGreaterThanOrEqual(box!.y - 1);
        expect(visual!.y + visual!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);
      }
    }
  });

  test("does not scroll sideways at 320, 390 and 1280 px or at 200% zoom", async ({ page }) => {
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(B_STORY);
      await noHorizontalScroll(page);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(B_STORY);
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setDeviceMetricsOverride", { width: 640, height: 360, deviceScaleFactor: 2, mobile: false });
    await noHorizontalScroll(page);
  });

  test("links the invitation to the contact form with the project", async ({ page }) => {
    await page.goto(B_STORY);
    await expect(page.locator("#invitation a[href='/contact/?project=focus-pocus']")).toBeVisible();
    await expect(page.locator("#invitation h2")).toHaveText("Have a problem like this?");
  });

  test("links to the demo page and the repository with the stand-in note", async ({ page }) => {
    await page.goto(B_STORY);
    const built = page.locator("#built");
    await expect(built.locator("a[href='https://drc.dev/projects/focus-pocus']")).toBeVisible();
    await expect(built.locator(`a[href='${focusPocus.demo.secondaryHref}']`)).toBeVisible();
    await expect(built).toContainText(focusPocus.demo.standInNote);
  });

  test("is noindex and absent from the header and footer", async ({ page }) => {
    for (const path of [B_STORY, B_INDEX]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
      await expect(page.locator("header a[href^='/design/'], footer a[href^='/design/']")).toHaveCount(0);
    }
  });

  test("keeps scroll position and focus on the theme toggle mid-story, and does not replay reveals", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(B_STORY);
    await page.locator("#built").scrollIntoViewIfNeeded();
    const toggle = page.locator(THEME_SWITCH);
    await toggle.evaluate((el) => (el as HTMLElement).focus({ preventScroll: true }));
    const opacities = () =>
      page.locator("[data-reveal]").evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
    const before = await opacities();
    const y = await page.evaluate(() => window.scrollY);
    const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.keyboard.press("Enter");
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(!wasDark);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
    await expect(toggle).toBeFocused();
    const after = await opacities();
    after.forEach((o, i) => expect(Math.abs(o - before[i]!), `reveal ${i}`).toBeLessThan(0.02));
  });

  test("#options puts the heading at the top with the card fully shown", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${B_STORY}#options`);
    await expect(page.locator("#options-heading")).toBeInViewport();
    await expect.poll(async () => (await page.locator("#options-heading").boundingBox())!.y).toBeLessThan(250);
    const opacity = await page.locator("#options[data-reveal]").evaluate((e) => Number(getComputedStyle(e).opacity));
    expect(opacity).toBe(1);
  });

  test("gives every interactive control a visible focus indicator and keeps it in view", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(B_STORY);
    let visited = 0;
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press("Tab");
      await settleScroll(page);
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        if (!el.closest("main")) return null;
        const s = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 8));
        return {
          outlineStyle: s.outlineStyle,
          outlineWidth: parseFloat(s.outlineWidth),
          inView: rect.top >= 0 && rect.bottom <= window.innerHeight,
          covered: !(top === el || el.contains(top) || Boolean(top?.contains(el))),
        };
      });
      if (!info) continue;
      visited += 1;
      expect(info.outlineStyle).not.toBe("none");
      expect(info.outlineWidth).toBeGreaterThanOrEqual(2);
      expect(info.inView).toBe(true);
      expect(info.covered).toBe(false);
    }
    expect(visited).toBeGreaterThan(3);
  });

  test("makes every control at least 24 by 24 CSS pixels", async ({ page }) => {
    for (const path of [B_STORY, B_INDEX]) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      const small = await page.locator("main a, main button, main [role=tab]").evaluateAll((els) =>
        els
          .map((e) => ({ text: (e.textContent ?? "").trim().slice(0, 30), rect: e.getBoundingClientRect() }))
          .filter((e) => e.rect.width > 0 && (e.rect.width < 24 || e.rect.height < 24))
          .map((e) => e.text),
      );
      expect(small).toEqual([]);
    }
  });
});

test.describe("Direction B Cards: index", () => {
  const status = (page: Page) => page.locator("[data-filter-status]");

  test("shows five bento cards with title, problem, visual, themes and status", async ({ page }) => {
    await page.goto(B_INDEX);
    await expect(page.locator("h1")).toHaveText("Projects");
    await expect(page.locator("[data-entry]")).toHaveCount(5);
    for (const entry of allEntries) {
      const card = page.locator(`[data-entry="${entry.slug}"]`);
      await expect(card).toContainText(entry.title);
      await expect(card).toContainText(entry.problem);
      await expect(card).toContainText(entry.visual.label);
      for (const theme of entry.themes) await expect(card).toContainText(theme);
      await expect(card.locator("[data-status]")).toBeVisible();
    }
  });

  test("filters by theme, clears, and reads ?theme= known and unknown", async ({ page }) => {
    await page.goto(B_INDEX);
    await expect(status(page)).toHaveText("Showing all 5 projects.");
    await page.getByRole("button", { name: "Mobile", exact: true }).click();
    await expect(page.locator("[data-entry]:visible")).toHaveCount(2);
    await expect(status(page)).toHaveText("Showing 2 projects about Mobile.");
    await expect(page).toHaveURL(/\?theme=Mobile/);
    await page.getByRole("button", { name: "All projects" }).click();
    await expect(page.locator("[data-entry]:visible")).toHaveCount(5);
    await expect(page).not.toHaveURL(/theme=/);

    await page.goto(`${B_INDEX}?theme=Web`);
    await expect(page.locator("[data-entry]:visible")).toHaveCount(2);
    await expect(page.getByRole("button", { name: "Web", exact: true })).toHaveAttribute("aria-pressed", "true");

    await page.goto(`${B_INDEX}?theme=Nonsense`);
    await expect(page.locator("[data-entry]:visible")).toHaveCount(0);
    await expect(status(page)).toHaveText("No projects match this theme.");
    await page.getByRole("button", { name: "Show all projects" }).click();
    await expect(page.locator("[data-entry]:visible")).toHaveCount(5);
  });

  test("announces every result change in the live region, including no match", async ({ page }) => {
    await page.goto(B_INDEX);
    const live = status(page);
    await expect(live).toHaveAttribute("role", "status");
    await expect(live).toHaveAttribute("aria-live", "polite");
    await page.getByRole("button", { name: "Productivity", exact: true }).click();
    await expect(live).toHaveText("Showing 2 projects about Productivity.");
    await page.getByRole("button", { name: "Developer tools", exact: true }).click();
    await expect(live).toHaveText("Showing 1 project about Developer tools.");
    await page.goto(`${B_INDEX}?theme=Nothing`);
    await expect(status(page)).toHaveText("No projects match this theme.");
  });

  test("links Focus Pocus to the B story and no other card to a story", async ({ page }) => {
    await page.goto(B_INDEX);
    for (const entry of allEntries.filter((e) => !e.storyPath)) {
      const hrefs = await page.locator(`[data-entry="${entry.slug}"] a`).evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      expect(hrefs).toEqual([entry.externalHref]);
    }
    await page.locator(`[data-entry="focus-pocus"]`).getByRole("link", { name: "Focus Pocus", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${B_STORY}$`));
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
  });
});

test.describe("Direction B Cards: reduced motion, no JavaScript, forced colours, axe", () => {
  test("turns reveals and the view transition off with reduced motion, and shows everything", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(B_STORY);
    const reveals = page.locator("[data-reveal]");
    expect(await reveals.count()).toBeGreaterThan(0);
    for (const el of await reveals.all()) {
      const css = await el.evaluate((e) => ({ name: getComputedStyle(e).animationName, opacity: getComputedStyle(e).opacity }));
      expect(css.name).toBe("none");
      expect(css.opacity).toBe("1");
    }
    expect(await hasViewTransitionRule(page)).toBe(false);
    await page.goto(B_INDEX);
    expect(await hasViewTransitionRule(page)).toBe(false);
    await context.close();
  });

  test("opts in to the view transition, with title names, when motion is allowed", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    for (const path of [B_INDEX, B_STORY]) {
      await page.goto(path);
      expect(await hasViewTransitionRule(page), path).toBe(true);
      const name = await page.locator("[data-vt-title]").evaluate((e) => getComputedStyle(e).viewTransitionName);
      expect(name, path).not.toBe("none");
    }
    await context.close();
  });

  test("stops reveals and the transition when reduced motion is switched on mid-visit", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(B_STORY);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const el of await page.locator("[data-reveal]").all()) {
      const css = await el.evaluate((e) => ({ name: getComputedStyle(e).animationName, opacity: getComputedStyle(e).opacity }));
      expect(css.name).toBe("none");
      expect(css.opacity).toBe("1");
    }
    expect(await hasViewTransitionRule(page)).toBe(false);
    await context.close();
  });

  for (const motion of ["reduce", "no-preference"] as const) {
    test(`has no transition or animation on tab or filter changes (${motion})`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: motion, viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      for (const [path, selector] of [
        [B_STORY, "option-tabs, option-tabs *"],
        [B_INDEX, "portfolio-filter button"],
      ] as const) {
        await page.goto(path);
        const durations = await page.locator(selector).evaluateAll((els) =>
          els.flatMap((e) => {
            const s = getComputedStyle(e);
            return [s.transitionDuration, s.animationDuration].flatMap((v) => v.split(",").map((d) => parseFloat(d)));
          }),
        );
        expect(durations.length).toBeGreaterThan(0);
        for (const d of durations) expect(d).toBe(0);
      }
      await context.close();
    });
  }

  test("shows all content, every option stacked, and no visible button with JavaScript off", async ({ browser }) => {
    const context = await noJsContext(browser);
    const page = await context.newPage();
    await page.goto(B_STORY);
    for (const stage of focusPocus.stages) {
      await expect(page.locator(`#${stage.id} h2`)).toBeVisible();
      for (const paragraph of stage.body) await expect(page.locator(`#${stage.id}`)).toContainText(paragraph);
      if (stage.visual) await expect(page.locator(`#${stage.id}`)).toContainText(stage.visual.label);
    }
    for (const option of focusPocus.options) {
      const card = page.locator(`[data-option="${option.id}"]`);
      await expect(card).toBeVisible();
      await expect(card).toContainText(option.summary);
      for (const line of [...option.pros, ...option.cons]) await expect(card).toContainText(line);
    }
    await expect(page.locator("[data-chosen]")).toContainText(focusPocus.options.find((o) => o.chosen)!.reason!);
    await expect(page.locator("[role=tab]")).toHaveCount(0);
    await expect(page.locator("#invitation a[href='/contact/?project=focus-pocus']")).toBeVisible();
    for (const el of await page.locator("[data-reveal]").all()) {
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    }
    await expect(page.locator("button:visible")).toHaveCount(0);

    await page.goto(B_INDEX);
    await expect(page.locator("[data-entry]:visible")).toHaveCount(5);
    await expect(page.locator("button:visible")).toHaveCount(0);
    await expect(page.locator("[data-filter-status]")).toBeHidden();
    await context.close();
  });

  test("keeps text, borders, tabs, status labels and diagrams visible in forced colours", async ({ browser }) => {
    const context = await browser.newContext({ forcedColors: "active", viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const path of [B_STORY, B_INDEX]) {
      await page.goto(path);
      const problems = await page
        .locator("main [data-draft-mark], main [data-status], main [data-placeholder], main [role=tab], main [data-entry], main [data-stage], main h1, main h2, main p")
        .evaluateAll((els) =>
          els.flatMap((e) => {
            const s = getComputedStyle(e);
            const found: string[] = [];
            const label = `${e.tagName.toLowerCase()} ${(e.textContent ?? "").trim().slice(0, 20)}`;
            if (s.color === "rgba(0, 0, 0, 0)") found.push(`${label}: text transparent`);
            const hasBorder = parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none";
            if (hasBorder && s.borderTopColor === "rgba(0, 0, 0, 0)") found.push(`${label}: border transparent`);
            return found;
          }),
      );
      expect(problems).toEqual([]);
      for (const svg of await page.locator("main [data-diagram] svg").all()) {
        const stroke = await svg.evaluate((e) => getComputedStyle(e).stroke);
        expect(stroke === "rgba(0, 0, 0, 0)" || stroke === "transparent").toBe(false);
      }
    }
    await page.goto(B_STORY);
    for (const target of [page.getByRole("tab", { selected: true }), page.locator("#invitation a").first()]) {
      await target.focus();
      const style = await target.evaluate((el) => ({ w: parseFloat(getComputedStyle(el).outlineWidth), s: getComputedStyle(el).outlineStyle }));
      expect(style.s).not.toBe("none");
      expect(style.w).toBeGreaterThanOrEqual(2);
    }
    // A selected tab is not told apart by colour alone.
    const selected = await page.getByRole("tab", { selected: true }).evaluate((e) => getComputedStyle(e).borderBottomWidth);
    const other = await page.getByRole("tab", { selected: false }).first().evaluate((e) => getComputedStyle(e).borderBottomWidth);
    expect(parseFloat(selected)).toBeGreaterThan(parseFloat(other));
    await context.close();
  });

  for (const [name, path] of [
    ["story", B_STORY],
    ["index", B_INDEX],
  ] as const) {
    test(`has zero axe violations on the ${name} with reduced motion`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      await page.goto(path);
      await axeClean(page);
      await context.close();
    });

    test(`has zero axe violations on the ${name} with JavaScript off at 1280 px`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const strip = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
      await page.route(`**${path}`, async (route) => {
        const response = await route.fetch();
        await route.fulfill({ response, body: strip(await response.text()) });
      });
      await page.goto(path);
      await axeClean(page);
      await context.close();
    });

    test(`has zero axe violations on the ${name} in forced colours`, async ({ browser }) => {
      const context = await browser.newContext({ forcedColors: "active", viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      // Light theme: see the note in the Direction A forced-colours test.
      await page.addInitScript(() => localStorage.setItem("color-theme", "light"));
      await page.goto(path);
      await axeClean(page);
      await context.close();
    });

    test(`has zero axe violations on the ${name} at 320 px and at 200% zoom`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await axeClean(page);
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(path);
      const client = await page.context().newCDPSession(page);
      await client.send("Emulation.setDeviceMetricsOverride", { width: 640, height: 360, deviceScaleFactor: 2, mobile: false });
      await axeClean(page);
    });
  }

  test("has zero axe violations with a non-default option tab selected and with a filter applied", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(B_STORY);
    await page.getByRole("tab").first().click();
    await axeClean(page);
    await page.goto(`${B_INDEX}?theme=Mobile`);
    await axeClean(page);
    await page.goto(`${B_INDEX}?theme=Nonsense`);
    await axeClean(page);
    await context.close();
  });
});
