// The seven launch pages as served from the production build
// (contracts/page-dom.md; FR-013, FR-014, FR-015, FR-020, FR-025, FR-027,
// FR-030; SC-001).
import { test, expect } from "@playwright/test";

// [address, h1, draft]. About carries Don's real copy and is live (feature 010); the rest are drafts.
const PAGES = [
  ["/", "Don Coleman", true],
  ["/services/", "Services", true],
  ["/speaking/", "Speaking", true],
  ["/about/", "About", false],
  ["/privacy-policy/", "Privacy policy", true],
  ["/terms-of-use/", "Terms of use", true],
  ["/technology/", "Technology", true],
  // The Tempo privacy policy moved from the first drc.dev is published as it was.
  ["/privacy/tempo/", "Tempo privacy policy", false],
] as const;

const NOT_BUILT = ["/cookie-policy/"] as const;

// The Tempo app store listing points at the first drc.dev's per-project privacy address,
// which public/_redirects sends to the app privacy page with a real 301.
test.describe("redirects from the first drc.dev's app privacy addresses", () => {
  for (const slug of ["tempo"]) {
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
      // The home page's "Recent writing" section (spec 008 US7) is a labelled region by design.
      await expect(
        page.locator(
          "main [role=region], main section[aria-label], main section[aria-labelledby]:not([data-recent-writing])",
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

test("About shows the About me section and the Recognition links (feature 010)", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.getByRole("heading", { level: 2, name: /^about me$/i })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 3, name: "Recognition" })).toHaveCount(1);
  const links = page.locator("main a[href^='https://cchl-ccls.ca/news_article/']");
  await expect(links).toHaveCount(2);
  expect(await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")))).toEqual([
    "https://cchl-ccls.ca/news_article/don-coleman-expresses-the-importance-of-exercising-curiosity-for-healthcare-leaders/",
    "https://cchl-ccls.ca/news_article/2024-chapter-awards-for-distinguished-service/",
  ]);
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

test("the projects index and every story answer 200", async ({ request }) => {
  for (const path of ["/projects/", "/projects/focus-pocus/"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("the sitemap lists the eight pages, the listing pages, the series pages, the real posts, the sample post and the projects, and neither the not-found page nor the cookie policy", async ({ request }) => {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const first = /<loc>[^<]*(\/sitemap-[^<]+\.xml)<\/loc>/.exec(index)?.[1];
  const sitemap = await (await request.get(first!)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname).sort();
  // The sample post is a draft: built outside production, left out of a production build. The four
  // real posts, the four real project stories and the Tempo privacy page are published. Sorted by code point, so drafts sit among the rest.
  expect(paths).toEqual([
    "/",
    "/about/",
    "/contact/",
    "/privacy-policy/",
    "/privacy/tempo/",
    "/projects/",
    "/projects/drcdev-github-io/",
    "/projects/flux/",
    "/projects/focus-pocus/",
    "/projects/tempo/",
    "/services/",
    "/speaking/",
    "/technology/",
    "/terms-of-use/",
    "/writing/",
    "/writing/all/",
    "/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/",
    "/writing/convergence/",
    "/writing/drift/",
    "/writing/sample-everything/",
    "/writing/self-contained-development-for-ghost-themes/",
    "/writing/starting-something-new/",
    "/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/",
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
    await expect(body).toContainText(/I help/);
    await expect(body).toContainText(/what I do/i);
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

test.describe("home recent writing keeps the introduction intact (US7)", () => {
  test("Recent writing comes after the body text, and Home keeps one h1", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    const order = await page.evaluate(() => {
      const titles = [...document.querySelectorAll("h2")].map((h) => h.textContent?.trim());
      return { recent: titles.indexOf("Recent writing"), what: titles.indexOf("What I do") };
    });
    expect(order.what).toBeGreaterThanOrEqual(0);
    expect(order.recent).toBeGreaterThan(order.what);
  });
});

test("home Recent writing names the series and links to both; About links to both (US5)", async ({ page }) => {
  await page.goto("/");
  const recent = page.locator("[data-recent-writing]");
  await expect(recent.getByRole("link", { name: "Convergence", exact: true })).toHaveAttribute(
    "href",
    "/writing/convergence/",
  );
  await expect(recent.getByRole("link", { name: "Drift", exact: true })).toHaveAttribute("href", "/writing/drift/");
  await page.goto("/about/");
  await expect(page.locator("main a[href='/writing/convergence/']")).toHaveCount(1);
  await expect(page.locator("main a[href='/writing/drift/']")).toHaveCount(1);
});
