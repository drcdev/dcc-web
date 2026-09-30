// The seven launch pages as served from the production build
// (contracts/page-dom.md; FR-013, FR-014, FR-015, FR-020, FR-025, FR-027,
// FR-030; SC-001).
import { test, expect } from "@playwright/test";

const PAGES = [
  ["/", "Don Coleman"],
  ["/services/", "Services"],
  ["/speaking/", "Speaking"],
  ["/about/", "About"],
  ["/privacy-policy/", "Privacy policy"],
  ["/terms-of-use/", "Terms of use"],
  ["/technology/", "Technology"],
] as const;

const NOT_BUILT = ["/cookie-policy/", "/projects/"] as const;

for (const [path, title] of PAGES) {
  test.describe(`${path}`, () => {
    test("returns 200 with one h1 and a draft notice", async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(title);
      await expect(page.locator("[data-draft-notice]")).toHaveCount(1);
      await expect(page.locator("[data-draft-notice]")).toContainText("Draft.");
    });

    test("has exactly the foundation's landmarks", async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("navigation")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      await expect(page.locator("main [role=region], main section[aria-label], main section[aria-labelledby]")).toHaveCount(0);
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
  });
}

test("Services, Speaking and About mark themselves current; Home does not when elsewhere", async ({ page }) => {
  for (const [path, label] of [
    ["/services/", "Services"],
    ["/speaking/", "Speaking"],
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

for (const path of NOT_BUILT) {
  test(`${path} returns 404`, async ({ request }) => {
    expect((await request.get(path)).status()).toBe(404);
  });
}

test("the sitemap lists the eight pages, the listing pages and the sample posts, and neither the not-found page nor the cookie policy", async ({ request }) => {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const first = /<loc>[^<]*(\/sitemap-[^<]+\.xml)<\/loc>/.exec(index)?.[1];
  const sitemap = await (await request.get(first!)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname).sort();
  // The sample posts are drafts: built outside production, left out of a production build.
  expect(paths).toEqual([
    "/",
    "/about/",
    "/contact/",
    "/privacy-policy/",
    "/services/",
    "/speaking/",
    "/technology/",
    "/terms-of-use/",
    "/writing/",
    "/writing/all/",
    "/writing/sample-everything/",
    "/writing/sample-long-title/",
    "/writing/sample-short/",
    "/writing/sample-text-only/",
    "/writing/topics/agentic-ai/",
    "/writing/topics/compliant-data/",
    "/writing/topics/healthcare-leadership/",
    "/writing/topics/technology-teams/",
  ]);
  expect(paths.some((p) => p.startsWith("/404") || p === "/cookie-policy/")).toBe(false);
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

  test("the call to action navigates to /services/", async ({ page }) => {
    await page.goto("/");
    await page.locator("main section").first().locator('a[href="/services/"]').click();
    await expect(page).toHaveURL(/\/services\/$/);
  });

  test("the text below the card says who Don helps and what he does", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("#content-section");
    await expect(body).toContainText(/helps/i);
    await expect(body).toContainText(/what don does/i);
    await expect(body.locator("a.bg-rust-600, a[class*='bg-rust']")).toHaveCount(0);
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
    await expect(targets).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
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
