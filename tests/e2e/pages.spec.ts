// The site pages as served from the production build
// (contracts/page-dom.md; FR-013, FR-014, FR-015, FR-020, FR-025, FR-027,
// FR-030; SC-001).
import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { homeCtaHref, homeSecondaryCtaHref, pages, projects } from "../helpers/content";
import { setTheme } from "./color-theme.ts";
import { TEMPLATES } from "./templates.ts";

// [address, h1, draft], from each page's front matter. The h1 is the page title on every page.
const PAGES = pages.map((entry) => [entry.address, entry.title, entry.draft] as const);

// Old Ghost addresses (spec 030). E2E because only the real Cloudflare runtime shows the 301
// answering before html_handling and not_found_handling. The rules are read from the file, so
// no post names live here.
const GHOST_RULES = readFileSync("public/_redirects", "utf-8")
  .split("\n")
  .map((line) => line.trim().split(/\s+/))
  .filter(([from]) => from?.startsWith("/") && !from.startsWith("/writing/topics/") && !from.startsWith("/projects/"));

test.describe("redirects from the old Ghost addresses", () => {
  test("the file holds Ghost rules", () => {
    expect(GHOST_RULES.length).toBeGreaterThan(0);
  });
  for (const [from, to] of GHOST_RULES) {
    test(`${from} answers 301 to ${to}, which answers 200`, async ({ request }) => {
      const response = await request.get(from!, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(new URL(response.headers().location!, "http://127.0.0.1:4321").pathname).toBe(to);
      expect((await request.get(to!)).status()).toBe(200);
    });
  }
});

// An app store listing points at the first drc.dev's per-project privacy address,
// which public/_redirects sends to the app privacy page with a real 301.
test.describe("redirects from the first drc.dev's app privacy addresses", () => {
  for (const slug of pages.filter((entry) => entry.slug.startsWith("privacy/")).map((entry) => entry.slug.slice("privacy/".length))) {
    for (const from of [`/projects/${slug}/privacy`, `/projects/${slug}/privacy/`]) {
      test(`${from} answers 301 to /privacy/${slug}/`, async ({ request }) => {
        const response = await request.get(from, { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        expect(new URL(response.headers().location!, "http://127.0.0.1:4321").pathname).toBe(`/privacy/${slug}/`);
      });
    }
  }
});

for (const [path, title, draft] of PAGES) {
  test.describe(`${path}`, () => {
    test(`returns 200 with one h1 and ${draft ? "a" : "no"} draft notice`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(title);
      if (draft) {
        await expect(page.locator("[data-draft-notice]")).toHaveCount(1);
        await expect(page.locator("[data-draft-notice]")).toContainText("Draft.");
      } else {
        await expect(page.locator("[data-draft-notice]")).toHaveCount(0);
      }
    });

    test("has exactly the foundation's landmarks", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("navigation")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      // The home page's "Recent writing" (spec 008 US7), "Now" and "Start here" sections and each
      // reading path (spec 040 FR-018) are regions labelled by their own heading, by design.
      await expect(
        page.locator(
          "main [role=region], main section[aria-label], main section[aria-labelledby]:not([data-recent-writing], [data-now], [data-start-here], [data-reading-path])",
        ),
      ).toHaveCount(0);
      await expect(page.locator("aside, [role=complementary], [role=search]")).toHaveCount(0);
    });

    test("has its own title, description and canonical", async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(path === "/" ? /Don Coleman/ : new RegExp(`^${title} · Don Coleman$`));
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /og-default\.png$/);
    });

    test("ships only the foundation's scripts and reads without JavaScript", async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
      expect((await page.locator("main").innerText()).length).toBeGreaterThan(100);
      const scripts = await page.locator("script").evaluateAll((els) =>
        els.map((el) => ({ src: el.getAttribute("src"), type: el.getAttribute("type"), inline: !el.getAttribute("src") })),
      );
      const external = scripts.filter((s) => !s.inline);
      for (const s of external) expect(s.src, "same-origin module").toMatch(/^\/_astro\//);
      await context.close();
    });

    // Templates are covered by geometry.spec.ts at the same widths.
    if (!TEMPLATES.some((t) => t.path === path)) {
      for (const width of [320, 390, 1280]) {
        test(`does not scroll sideways at ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 800 });
          await page.goto(path);
          const { scrollWidth, clientWidth } = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
        });
      }
    }
  });
}

test("Work with me and About mark themselves current; Home does not when elsewhere", async ({ page }) => {
  for (const [path, label] of [
    ["/work-with-me/", "Work with me"],
    ["/about/", "About"],
  ] as const) {
    await page.goto(path);
    const current = page.locator('#primary-nav-list a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(label);
  }
  await page.goto("/");
  await expect(page.locator('#primary-nav-list a[aria-current="page"]')).toHaveText("Home");
  await page.goto("/privacy-policy/");
  await expect(page.locator('#primary-nav-list a[aria-current="page"]')).toHaveCount(0);
});

test("the former single-word addresses resolve", async ({ request }) => {
  for (const path of ["/about/", "/privacy-policy/", "/terms-of-use/", "/technology/"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("the projects index and every story answer 200", async ({ request }) => {
  for (const path of ["/projects/", ...projects.map((entry) => entry.address)]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test.describe("home introduction card (FR-016 to FR-019, FR-028a)", () => {
  test("shows the card with one h1 equal to the name and no Subscribe", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Don Coleman");
    const card = page.locator("main section").first();
    await expect(card.locator("img")).toBeVisible();
    await expect(card.locator("img")).toHaveAttribute("alt", /\S{3,}/);
    await expect(card.locator("p.italic")).toBeVisible();
    await expect(card.getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(card.getByRole("link", { name: "LinkedIn" })).toBeVisible();
    await expect(page.getByText(/subscribe/i)).toHaveCount(0);
  });

  test("the call to action navigates to the address in the home page file", async ({ page }) => {
    await page.goto("/");
    await page.locator("main section").first().locator(`a[href="${homeCtaHref}"]`).click();
    await expect(page).toHaveURL((url) => url.pathname === homeCtaHref);
  });

  test("the text below the card has no button-style links", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("#content-section");
    // Recent writing's topic pills use a tinted rust background; only a button-style link is unwanted.
    await expect(
      body.locator("a.bg-rust-600, a[class*='bg-rust']:not([data-topic-pill])"),
    ).toHaveCount(0);
  });

  test("the photo is an optimised WebP loaded with high priority", async ({ page }) => {
    await page.goto("/");
    const img = page.locator("main section").first().locator("img");
    await expect(img).toHaveAttribute("fetchpriority", "high");
    await expect(img).toHaveAttribute("src", /\.webp/);
    const type = await page.evaluate(async () => {
      const src = document.querySelector("main section img")!.getAttribute("src")!;
      return (await fetch(src)).headers.get("content-type");
    });
    expect(type).toBe("image/webp");
  });

  test("social links and the call to action have the focus indicator and 24px targets", async ({ page }) => {
    await page.goto("/");
    const targets = page.locator("main section").first().locator("a");
    await expect(targets).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const link = targets.nth(i);
      await link.focus();
      const style = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { style: s.outlineStyle, width: parseFloat(s.outlineWidth), offset: parseFloat(s.outlineOffset), w: r.width, h: r.height };
      });
      expect(style.style).toBe("solid");
      expect(style.width).toBeGreaterThanOrEqual(2);
      expect(style.offset).toBe(2);
      expect(style.w).toBeGreaterThanOrEqual(24);
      expect(style.h).toBeGreaterThanOrEqual(24);
    }
  });
});

// Spec 051: the second call to action and its layout, measured in a real browser.
const mainLink = (page: Page) => page.locator("main section").first().locator(`a[href="${homeCtaHref}"]`);
const secondLink = (page: Page) => page.locator("main section").first().locator(`a[href="${homeSecondaryCtaHref}"]`);
const box = async (l: Locator) => (await l.boundingBox())!;

/** Relative luminance of a Chromium computed colour (`rgb()` or `color(srgb ...)`). */
function lum(color: string): number {
  const unit = color.startsWith("color(") ? 1 : 255;
  const [r, g, b] = (color.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((v) => {
    const c = Number(v) / unit;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** The card's own surface colour, behind the buttons. */
const cardBackground = (page: Page) =>
  page.locator("main section").first().locator("h1").evaluate((h) => {
    for (let n: Element | null = h; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (!/rgba\(.*, 0\)|transparent/.test(c)) return c;
    }
    return "rgb(255, 255, 255)";
  });

test.describe("home introduction card buttons (spec 051)", () => {
  test("stack full width at 375 with the main button on top", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const [m, s] = [await box(mainLink(page)), await box(secondLink(page))];
    const column = await box(page.locator("main section").first().locator("h1").locator(".."));
    expect(s.y).toBeGreaterThan(m.y + m.height - 1);
    expect(Math.abs(m.width - s.width)).toBeLessThan(1);
    expect(Math.abs(m.x - s.x)).toBeLessThan(1);
    expect(m.width).toBeGreaterThan(column.width - 2 * 24 - 2);
    expect(s.y - (m.y + m.height)).toBeCloseTo(12, 0);
  });

  for (const width of [640, 768, 1280]) {
    test(`share one left-aligned row at ${width}, social row above`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const [m, s] = [await box(mainLink(page)), await box(secondLink(page))];
      const h1 = await box(page.locator("main section").first().locator("h1"));
      const social = await box(page.locator("main section").first().locator("ul a").first());
      expect(Math.abs(m.y - s.y)).toBeLessThan(1);
      expect(s.x).toBeGreaterThan(m.x + m.width - 1);
      expect(s.x - (m.x + m.width)).toBeCloseTo(12, 0);
      expect(Math.abs(m.x - h1.x)).toBeLessThan(1);
      expect(social.y + social.height).toBeLessThanOrEqual(m.y);
      const labelWidth = await mainLink(page).evaluate((el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return r.getBoundingClientRect().width;
      });
      expect(m.width).toBeLessThan(labelWidth + 40);
    });
  }

  for (const width of [320, 375, 640, 768, 1280]) {
    test(`equal heights of at least 44 px, links inside the card, no overflow at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const card = await box(page.locator("main section").first().locator("h1").locator("../../.."));
      const links = page.locator("main section").first().locator("a");
      const boxes = [];
      for (let i = 0; i < 4; i++) boxes.push(await box(links.nth(i)));
      const [m, s] = [boxes[2]!, boxes[3]!];
      expect(Math.abs(m.height - s.height)).toBeLessThan(1);
      for (const b of [m, s]) {
        expect(b.height).toBeGreaterThanOrEqual(44);
        expect(b.width).toBeGreaterThanOrEqual(44);
      }
      for (const b of boxes) {
        expect(b.x).toBeGreaterThanOrEqual(card.x);
        expect(b.x + b.width).toBeLessThanOrEqual(card.x + card.width + 0.5);
        expect(b.y + b.height).toBeLessThanOrEqual(card.y + card.height + 0.5);
      }
      for (let i = 0; i < 4; i++)
        for (let j = i + 1; j < 4; j++) {
          const [a, b] = [boxes[i]!, boxes[j]!];
          const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
          expect(apart, `links ${i} and ${j} overlap`).toBe(true);
        }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test("gaps are 16 px under the social row, stacked and in a row", async ({ page }) => {
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const social = await box(page.locator("main section").first().locator("ul"));
      const m = await box(mainLink(page));
      expect(m.y - (social.y + social.height), `at ${width}`).toBeCloseTo(16, 0);
    }
  });

  for (const width of [375, 640]) {
    test(`a long second label wraps inside its button at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await secondLink(page).evaluate((el) => {
        el.textContent = "Read all of my writing about systems thinking, practical AI and leading complex change";
      });
      const [m, s] = [await box(mainLink(page)), await box(secondLink(page))];
      expect(Math.abs(m.height - s.height)).toBeLessThan(1);
      expect(s.height).toBeGreaterThan(44);
      const clipped = await secondLink(page).evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(clipped).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test("the second link navigates to the address in the home page file", async ({ page }) => {
    await page.goto("/");
    await secondLink(page).click();
    await expect(page).toHaveURL((url) => url.pathname === homeSecondaryCtaHref);
  });

  for (const theme of ["light", "dark"] as const) {
    test.describe(`${theme} theme`, () => {
      test.beforeEach(async ({ page }) => {
        await setTheme(page, theme);
        // Reduced motion: transition-colors also fades outline-color, so no mid-fade colour is sampled.
        await page.emulateMedia({ reducedMotion: "reduce" });
      });

      test("second button border and focus outline are at least 3:1 and not clipped or covered", async ({ page }) => {
        await page.setViewportSize({ width: 640, height: 800 });
        await page.goto("/");
        const bg = await cardBackground(page);
        const border = await secondLink(page).evaluate((el) => getComputedStyle(el).borderTopColor);
        expect(ratio(border, bg)).toBeGreaterThanOrEqual(3);
        const card = await box(page.locator("main section").first().locator("h1").locator("../../.."));
        const links = page.locator("main section").first().locator("a");
        for (let i = 0; i < 4; i++) {
          const link = links.nth(i);
          await link.focus();
          const outline = await link.evaluate((el) => getComputedStyle(el).outlineColor);
          expect(ratio(outline, bg), `link ${i}`).toBeGreaterThanOrEqual(3);
          const b = await box(link);
          const o = { x: b.x - 4, y: b.y - 4, w: b.width + 8, h: b.height + 8 };
          expect(o.x).toBeGreaterThanOrEqual(card.x);
          expect(o.x + o.w).toBeLessThanOrEqual(card.x + card.width);
          expect(o.y + o.h).toBeLessThanOrEqual(card.y + card.height);
          for (let j = 0; j < 4; j++) {
            if (j === i) continue;
            const c = await box(links.nth(j));
            // Outline boxes of neighbours may touch, but the outline must not cover a neighbour's own box.
            const covers = o.x < c.x + c.width && o.x + o.w > c.x && o.y < c.y + c.height && o.y + o.h > c.y;
            if (covers) {
              const inner = { x: b.x - 2, y: b.y - 2, w: b.width + 4, h: b.height + 4 };
              expect(inner.x + inner.w <= c.x || c.x + c.width <= inner.x || inner.y + inner.h <= c.y || c.y + c.height <= inner.y, `outline ${i} covers ${j}`).toBe(true);
            }
          }
        }
      });

      test("hover text is at least 4.5:1 on both buttons", async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto("/");
        for (const link of [mainLink(page), secondLink(page)]) {
          await link.hover();
          const { color, background } = await link.evaluate((el) => {
            const s = getComputedStyle(el);
            return { color: s.color, background: s.backgroundColor };
          });
          const behind = /rgba\(.*, 0\)|transparent/.test(background) ? await cardBackground(page) : background;
          expect(ratio(color, behind)).toBeGreaterThanOrEqual(4.5);
        }
      });
    });
  }
});

test.describe("home recent writing keeps the introduction intact (US7)", () => {
  test("Recent writing comes after the body content, and Home keeps one h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const recentFollowsBody = await page.evaluate(() => {
      // Spec 040 FR-016: the order is intro, Now, Start here, Recent writing.
      const order = ["h1", "[data-now]", "[data-start-here]", "[data-recent-writing]"].map((selector) =>
        document.querySelector(selector),
      );
      return (
        order.every((el) => !!el) &&
        order.every(
          (el, i) => i === 0 || !!(order[i - 1]!.compareDocumentPosition(el!) & Node.DOCUMENT_POSITION_FOLLOWING),
        )
      );
    });
    expect(recentFollowsBody).toBe(true);
  });
});

test("home Recent writing names the series and links to both (US5)", async ({ page }) => {
  await page.goto("/");
  const recent = page.locator("[data-recent-writing]");
  await expect(recent.getByRole("link", { name: "Convergence", exact: true })).toHaveAttribute(
    "href",
    "/writing/convergence/",
  );
  await expect(recent.getByRole("link", { name: "Drift", exact: true })).toHaveAttribute("href", "/writing/drift/");
});
