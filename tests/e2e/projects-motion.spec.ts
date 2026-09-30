// Motion on the projects pages (US5; FR-016 to FR-018, FR-025, FR-060 to FR-063;
// contracts/pages-dom.md "Motion"). All of it is CSS: a reading-progress bar, the
// chapter heading uncover, a sticky visual panel and a cross-document view
// transition. Every effect is off under reduced motion, and none of it hides content.
import { expect, test, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const STORY = "/projects/focus-pocus/";

/** The @view-transition rules that apply to this page right now, nested rules included. */
const activeViewTransitionRules = (page: Page) =>
  page.evaluate(() => {
    const found: string[] = [];
    const walk = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        const text = rule.cssText;
        if (text.startsWith("@view-transition")) found.push(text);
        else if (rule instanceof CSSMediaRule) {
          if (window.matchMedia(rule.conditionText).matches) walk(rule.cssRules);
        } else if (rule instanceof CSSSupportsRule) {
          if (CSS.supports(rule.conditionText)) walk(rule.cssRules);
        } else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules);
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        walk(sheet.cssRules);
      } catch {
        // A cross-origin sheet cannot be read; the site serves its own.
      }
    }
    return found;
  });

const RESTING_CLIP = /^(none|inset\(0(px|%)?( 0(px|%)?){0,3}\))$/;

test.describe("with motion allowed", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });

  test("the title-pairing style and the progress bar raise no Content Security Policy violation", async ({ page }) => {
    await recordCspViolations(page);
    for (const path of [STORY, "/projects/"]) {
      await page.goto(path);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      expect(await cspViolations(page), path).toEqual([]);
    }
  });

  test("shows a progress bar that fills as the page scrolls", async ({ page }) => {
    await page.goto(STORY);
    const bar = page.locator("[data-progress]");
    await expect(bar).toHaveCSS("display", "block");
    await expect(bar).toHaveAttribute("aria-hidden", "true");
    const width = () => bar.evaluate((el) => el.getBoundingClientRect().width);
    expect(await width()).toBeLessThan(2);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
    await expect.poll(width).toBeGreaterThan(300);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(width).toBeGreaterThan(1400);
  });

  test("runs the heading uncover on a scroll timeline", async ({ page }) => {
    await page.goto(STORY);
    const timelines = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-chapter-heading]")).map((el) =>
        el.getAnimations().map((a) => a.timeline?.constructor.name),
      ),
    );
    expect(timelines).toHaveLength(7);
    for (const list of timelines) expect(list).toEqual(["ViewTimeline"]);
  });

  test("opts in to cross-document view transitions and names the title", async ({ page }) => {
    await page.goto(STORY);
    const rules = await activeViewTransitionRules(page);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatch(/navigation:\s*auto/);
    await expect(page.locator("h1")).toHaveCSS("view-transition-name", "project-focus-pocus");
    await page.goto("/projects/");
    expect(await activeViewTransitionRules(page)).toHaveLength(1);
    await expect(page.locator('[data-project="focus-pocus"] [data-project-title]')).toHaveCSS(
      "view-transition-name",
      "project-focus-pocus",
    );
  });

  test("uncovers a heading that is already in view when the page opens at #options", async ({ page }) => {
    await page.goto(`${STORY}#options`);
    const heading = page.locator("#options-heading");
    await expect(heading).toBeInViewport();
    await expect.poll(() => heading.evaluate((el) => getComputedStyle(el).clipPath)).toMatch(RESTING_CLIP);
    // Nothing is left covering it: the heading text is fully inside its own clip.
    const covered = await heading.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + 4, box.top + box.height / 2);
      return hit !== el && !el.contains(hit);
    });
    expect(covered).toBe(false);
  });

  test("uncovers headings above the viewport as well", async ({ page }) => {
    await page.goto(`${STORY}#invitation`);
    for (const id of ["problem", "constraints", "options", "built", "outcome", "lessons"]) {
      await expect
        .poll(() => page.locator(`#${id}-heading`).evaluate((el) => getComputedStyle(el).clipPath))
        .toMatch(RESTING_CLIP);
    }
  });

  test("keeps the visual panel beside its text, inside its own chapter", async ({ page }) => {
    await page.goto(STORY);
    const chapters = page.locator('[data-chapter-grid][data-has-visual="true"]');
    const count = await chapters.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const chapter = chapters.nth(i);
      const visual = chapter.locator("[data-chapter-visual]");
      await expect(visual).toHaveCSS("position", "sticky");
      const box = await chapter.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height };
      });
      // Walk down the chapter in steps and past its end: the panel never leaves the chapter.
      for (let step = 0; step <= 10; step += 1) {
        await page.evaluate((y) => window.scrollTo(0, y), box.top - 100 + ((box.height + 400) * step) / 10);
        const inside = await chapter.evaluate((el) => {
          const c = el.getBoundingClientRect();
          const v = el.querySelector("[data-chapter-visual]")!.getBoundingClientRect();
          return v.bottom <= c.bottom + 1 && v.top >= c.top - 1;
        });
        expect(inside, `chapter ${i} step ${step}`).toBe(true);
      }
    }
  });

  test("never overlaps the next chapter's content", async ({ page }) => {
    await page.goto(STORY);
    const overlap = await page.evaluate(async () => {
      const chapters = Array.from(document.querySelectorAll("section[data-stage]"));
      const found: string[] = [];
      for (let y = 0; y < document.documentElement.scrollHeight; y += 350) {
        window.scrollTo(0, y);
        await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        chapters.forEach((chapter, index) => {
          const visual = chapter.querySelector("[data-chapter-visual]");
          const next = chapters[index + 1];
          if (!visual || !next) return;
          if (visual.getBoundingClientRect().bottom > next.getBoundingClientRect().top + 1) found.push(chapter.id);
        });
      }
      return found;
    });
    expect(overlap).toEqual([]);
  });

  test("is not sticky below 80rem", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.goto(STORY);
    const visual = page.locator("[data-chapter-visual]").first();
    await expect(visual).toHaveCSS("position", "static");
  });
});

/** Resolve any CSS colour to sRGB channels by painting it on a canvas. */
const contrastRatio = (page: Page) =>
  page.evaluate(() => {
    const toRgb = (color: string): [number, number, number] => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.fillStyle = "#000";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return [r!, g!, b!];
    };
    const luminance = ([r, g, b]: [number, number, number]) => {
      const lin = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    const bar = getComputedStyle(document.querySelector("[data-progress]")!).backgroundColor;
    let background = "rgb(255, 255, 255)";
    for (const el of [document.body, document.documentElement]) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        background = bg;
        break;
      }
    }
    const a = luminance(toRgb(bar));
    const b = luminance(toRgb(background));
    return { bar, background, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });

test.describe("progress bar contrast (FR-083, WCAG 1.4.11)", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
  for (const theme of ["light", "dark"] as const) {
    test(`is at least 3:1 against the page background in the ${theme} theme`, async ({ page }) => {
      await page.addInitScript((value) => {
        try {
          localStorage.setItem("color-theme", value);
        } catch {
          // Storage unavailable: the page falls back to its default theme.
        }
      }, theme);
      await page.goto(STORY);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
      await expect(page.locator("[data-progress]")).toHaveCSS("display", "block");
      const { bar, background, ratio } = await contrastRatio(page);
      expect(ratio, `${bar} on ${background}`).toBeGreaterThanOrEqual(3);
    });
  }
});

test.describe("chapter DOM order (FR-023)", () => {
  test("puts each chapter's text before its visual, so focus order follows", async ({ page }) => {
    await page.goto(STORY);
    const grids = page.locator('[data-chapter-grid][data-has-visual="true"]');
    const count = await grids.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const order = await grids.nth(i).evaluate((el) => {
        const text = el.querySelector("[data-chapter-text]")!;
        const visual = el.querySelector("[data-chapter-visual]")!;
        return text.compareDocumentPosition(visual);
      });
      expect(order & 4 /* DOCUMENT_POSITION_FOLLOWING */, `chapter ${i}`).toBeTruthy();
    }
  });
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });

  test("has no progress bar, no heading animation and no sticky visual", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "none");
    const animated = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-chapter-heading]")).filter(
        (el) => el.getAnimations().length > 0 || getComputedStyle(el).clipPath !== "none",
      ).length,
    );
    expect(animated).toBe(0);
    await expect(page.locator("[data-chapter-visual]").first()).toHaveCSS("position", "static");
  });

  test("has no view transition on either page, and no clip is playing", async ({ page }) => {
    await page.goto(STORY);
    expect(await activeViewTransitionRules(page)).toEqual([]);
    await expect(page.locator("h1")).toHaveCSS("view-transition-name", "none");
    const playing = await page.evaluate(() => Array.from(document.querySelectorAll("video")).filter((v) => !v.paused).length);
    expect(playing).toBe(0);
    await page.goto("/projects/");
    expect(await activeViewTransitionRules(page)).toEqual([]);
  });

  test("still shows every chapter heading and the whole comparison", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.locator("main h2")).toHaveCount(7);
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
  });
});

// FR-060, FR-024 and the "Printing a story" edge case.
test.describe("switching modes on an open story", () => {
  test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });

  test("switching to reduced motion without a reload removes the bar, unpins the visual and settles headings", async ({
    page,
  }) => {
    await page.goto(STORY);
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "block");
    await expect(page.locator("[data-chapter-visual]").first()).toHaveCSS("position", "sticky");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "none");
    await expect(page.locator("[data-chapter-visual]").first()).toHaveCSS("position", "static");
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Array.from(document.querySelectorAll("[data-chapter-heading]")).filter(
              (el) => el.getAnimations().length > 0 || getComputedStyle(el).clipPath !== "none",
            ).length,
        ),
      )
      .toBe(0);
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
  });

  test("printing shows every chapter and the full comparison, and no progress bar", async ({ page }) => {
    await page.goto(STORY);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-progress]")).toHaveCSS("display", "none");
    await expect(page.locator("section[data-stage]")).toHaveCount(7);
    for (const heading of await page.locator("main h2").all()) await expect(heading).toBeVisible();
    const comparison = page.getByRole("table");
    await expect(comparison).toBeVisible();
    const cut = await page.locator("[data-comparison]").first().evaluate((el) => {
      const region = el.closest("[role=region]") ?? el;
      return { client: region.clientWidth, scroll: region.scrollWidth, overflow: getComputedStyle(region).overflowX };
    });
    expect(cut.scroll <= cut.client || cut.overflow === "visible", "the comparison is not cut off").toBe(true);
  });
});
