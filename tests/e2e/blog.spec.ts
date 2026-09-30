// Blog end-to-end tests against the production build served by `wrangler dev`
// (specs/008-blog/tasks.md T030; contracts/blog-pages.md "Post"). Later phases
// add the landing, listing, topic, share and feed cases to this file (T042,
// T057, T063, T067, T071). The sample posts are drafts, so every build that is
// not a production build shows them.
import { test, expect, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const POST = "/writing/sample-everything/";
const TEXT_ONLY_POST = "/writing/sample-text-only/";
const CAPTIONED_CODE = "const { title, summary } = entry.data;\nconsole.log(`${title}: ${summary}`);";

const noSidewaysScroll = async (page: Page) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
};

test.describe("post page reads without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the title, the body, the code and the table, and no copy button", async ({ page }) => {
    await page.goto(POST);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Every kind of content a post can hold");
    await expect(page.locator("[data-post-body]")).toContainText("A captioned image");
    await expect(page.locator("figure[data-code-block]").first()).toBeVisible();
    await expect(page.locator("figure[data-code-block] pre").first()).toContainText("const { title, summary }");
    await expect(page.locator("figure[data-code-block] button:visible")).toHaveCount(0);
    await expect(page.locator(".table-wrapper table")).toBeVisible();
    await expect(page.locator("[data-views-note]")).toBeVisible();
  });
});

test.describe("post page", () => {
  test("shows the update date beside the publication date on an updated post", async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator("article time[datetime='2026-08-27']")).toHaveText("August 27, 2026");
    await expect(page.locator("article time[datetime='2026-09-15']")).toHaveText("September 15, 2026");
    await expect(page.locator("article")).toContainText("Updated");
    await page.goto(TEXT_ONLY_POST);
    await expect(page.locator("article")).not.toContainText("Updated");
  });

  test("has no content security policy violation and no inline style inside highlighted code", async ({ page }) => {
    await recordCspViolations(page);
    const failed: string[] = [];
    page.on("pageerror", (error) => failed.push(error.message));
    await page.goto(POST);
    await page.locator("figure[data-code-block] button").first().waitFor({ state: "visible" });
    expect(await cspViolations(page)).toEqual([]);
    expect(failed).toEqual([]);
    await expect(page.locator(".astro-code")).not.toHaveCount(0);
    await expect(page.locator(".astro-code [style], .astro-code[style]")).toHaveCount(0);
    // Highlighting works: some tokens carry a class.
    await expect(page.locator(".astro-code .hl-keyword").first()).toBeAttached();
  });

  test("puts the exact code on the clipboard and says Copied, then resets with focus kept", async ({
    browser,
  }) => {
    const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
    const page = await context.newPage();
    await page.goto(POST);
    const block = page.locator("figure[data-code-block]").first();
    const button = block.getByRole("button");
    await expect(button).toBeVisible();
    await expect(button).toHaveText("Copy code");
    await button.click();
    await expect(button).toHaveText("Copied");
    await expect(block.getByRole("status")).toHaveText("Copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(CAPTIONED_CODE);
    await expect(button).toBeFocused();
    await expect(button).toHaveText("Copy code", { timeout: 4000 });
    await expect(block.getByRole("status")).toHaveText("");
    await expect(button).toBeFocused();
    await context.close();
  });

  test("says the copy failed, and how to copy by hand, when the browser refuses", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
      });
    });
    await page.goto(POST);
    const block = page.locator("figure[data-code-block]").first();
    const button = block.getByRole("button");
    await button.click();
    await expect(button).toHaveText("Copy failed. Select the code to copy it.");
    await expect(block.getByRole("status")).toHaveText("Copy failed. Select the code to copy it.");
    // The code stays selectable.
    expect(await block.locator("pre").evaluate((pre) => getComputedStyle(pre).userSelect)).not.toBe("none");
    await expect(button).toHaveText("Copy code", { timeout: 4000 });
  });

  test("shows the caption on a captioned code block and none on the others", async ({ page }) => {
    await page.goto(POST);
    const blocks = page.locator("figure[data-code-block]");
    await expect(blocks.first().locator("figcaption")).toHaveText("Reading a post's settings");
    await expect(blocks.nth(1).locator("figcaption")).toHaveCount(0);
  });

  test("keeps the page from scrolling sideways at 320 px, with the wide table and the long code line", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(POST);
    await noSidewaysScroll(page);
    const table = page.locator(".table-wrapper");
    expect(await table.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    const longest = page.locator("figure[data-code-block] pre", { hasText: "sample-post-check" });
    expect(await longest.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  });

  test("keeps wide and full-width images inside the page at phone and desktop widths", async ({ page }) => {
    for (const width of [320, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(POST);
      await expect(page.locator(".kg-width-wide")).toBeVisible();
      await expect(page.locator(".kg-width-full")).toBeVisible();
      await noSidewaysScroll(page);
      for (const selector of [".kg-width-wide", ".kg-width-full"]) {
        const box = await page.locator(selector).boundingBox();
        expect(box!.x, `${selector} at ${width}`).toBeGreaterThanOrEqual(-1);
        expect(box!.x + box!.width, `${selector} at ${width}`).toBeLessThanOrEqual(width + 1);
      }
    }
  });

  test("shows a scrollable table region that a keyboard can reach", async ({ page }) => {
    await page.goto(POST);
    const region = page.getByRole("region", { name: "Table" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await region.focus();
    await expect(region).toBeFocused();
  });
});

// The landing page (T042; contracts/blog-pages.md "Landing"). This build is not a production
// build, so the sample posts show: sample-everything is the newest (the lead story), sample-short
// is the only other featured post.
const LANDING = "/writing/";
const LEAD_TITLE = "Sample: Every kind of content a post can hold";

test.describe("landing page", () => {
  test("shows the parts in order: eyebrow and h1, feed link, lead story, pills, Featured, Latest, All posts", async ({
    page,
  }) => {
    await page.goto(LANDING);
    const main = page.locator("main");
    await expect(main.locator("h1")).toHaveText("Writing");
    await expect(main.getByText("Drift & Convergence", { exact: true }).first()).toBeVisible();
    const feed = main.getByRole("link", { name: "Subscribe (RSS)" });
    await expect(feed).toBeVisible();
    await expect(feed).toHaveAttribute("href", "/writing/rss.xml");
    await expect(main.locator("[data-lead-story]")).toHaveCount(1);
    await expect(main.locator("[data-lead-story] h2")).toHaveText(LEAD_TITLE);
    await expect(main.getByRole("navigation", { name: "Topics" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Featured" })).toBeVisible();
    await expect(main.locator("[data-featured-grid]")).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Latest" })).toBeVisible();
    await expect(main.locator("[data-latest-grid]")).toBeVisible();
    await expect(main.getByRole("link", { name: "All posts" }).first()).toBeVisible();

    // Document order.
    const order = await page.evaluate(() => {
      const at = (selector: string) => {
        const el = document.querySelector(selector);
        return el ? Array.from(document.querySelectorAll("*")).indexOf(el) : -1;
      };
      const heading = (text: string) => {
        const el = Array.from(document.querySelectorAll("main h2")).find((h) => h.textContent?.trim() === text);
        return el ? Array.from(document.querySelectorAll("*")).indexOf(el) : -1;
      };
      return [
        at("main h1"),
        at('main a[href$="rss.xml"]'),
        at("[data-lead-story]"),
        at('main nav[aria-label="Topics"]'),
        heading("Featured"),
        at("[data-featured-grid]"),
        heading("Latest"),
        at("[data-latest-grid]"),
      ];
    });
    expect(order.every((n) => n >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  test("shows no post twice: the lead story is not in Featured or Latest, and no Featured post is in Latest", async ({
    page,
  }) => {
    await page.goto(LANDING);
    const hrefs = async (selector: string) =>
      page.locator(`${selector} [data-post-card] h3 a`).evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    const featured = await hrefs("[data-featured-grid]");
    const latest = await hrefs("[data-latest-grid]");
    const lead = await page.locator("[data-lead-story] h2 a").getAttribute("href");
    expect(lead).toBe("/writing/sample-everything/");
    expect(featured).toEqual(["/writing/sample-short/"]);
    expect(featured).not.toContain(lead);
    expect(latest).not.toContain(lead);
    for (const href of featured) expect(latest).not.toContain(href);
    expect(new Set([lead, ...featured, ...latest]).size).toBe(1 + featured.length + latest.length);
    await expect(page.locator("[data-featured-grid] [data-featured-mark]")).toHaveCount(featured.length);
  });

  test("shows the lead story's image eagerly and a text-only card without one", async ({ page }) => {
    await page.goto(LANDING);
    const img = page.locator("[data-lead-story] img");
    await expect(img).toHaveAttribute("fetchpriority", "high");
    await expect(img).toHaveAttribute("loading", "eager");
    const textOnly = page.locator("[data-post-card][data-text-only]");
    await expect(textOnly).toHaveCount(1);
    await expect(textOnly.locator("img")).toHaveCount(0);
  });

  test("advertises the feed in the head, and has its own title, description and canonical address", async ({
    page,
  }) => {
    await page.goto(LANDING);
    await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      "href",
      /\/writing\/rss\.xml$/,
    );
    expect(await page.title()).toBe("Writing · Don Coleman");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /compliant data/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/writing\/$/);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    // The site's default sharing image (FR-030 says a feature image is for posts only).
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\.png$/);
    await expect(page.locator('meta[property="og:image"]')).not.toHaveAttribute("content", /sample/);
  });

  test("links each pill to its topic page and offers every topic, with All posts last", async ({ page }) => {
    await page.goto(LANDING);
    const links = page.locator('main nav[aria-label="Topics"] a');
    expect(await links.count()).toBeGreaterThanOrEqual(5);
    const hrefs = await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")));
    expect(hrefs.at(-1)).toBe("/writing/all/");
    for (const href of hrefs.slice(0, -1)) expect(href).toMatch(/^\/writing\/topics\/[a-z-]+\/$/);
    const first = hrefs[0]!;
    await Promise.all([
      page.waitForURL(`**${first}`),
      links.first().click(),
    ]);
  });

  test("marks Writing as the current page", async ({ page }) => {
    await page.goto(LANDING);
    await expect(page.locator('#primary-nav-list a[href="/writing/"]')).toHaveAttribute("aria-current", "page");
    await expect(page.locator("#primary-nav-list a[aria-current]")).toHaveCount(1);
  });

  test("marks Writing as the current section on a post page", async ({ page }) => {
    await page.goto(POST);
    await expect(page.locator('#primary-nav-list a[href="/writing/"]')).toHaveAttribute("aria-current", "true");
  });

  test("does not scroll sideways at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(LANDING);
    await noSidewaysScroll(page);
  });
});
