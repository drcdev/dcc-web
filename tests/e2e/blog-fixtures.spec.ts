// Blog cases the site's own posts no longer hold, checked on the fixture site (port 4322,
// playwright.config.ts project `sections`; scripts/build-fixture-site.ts). The fixture site adds
// two fixture posts from tests/fixtures/posts/valid/ to the site's own posts: text-only.mdx, a
// post with no feature image (2026-08-10; healthcare-leadership, technology-teams), and
// long-title.mdx, a post whose title is very long and holds an unbroken word (2026-08-20;
// technology-teams). It also adds 13 generated posts, fixture-post-01 to -13, dated 2026-06-30
// back to 2026-06-18, all on agentic-ai; fixture-post-01 is featured.
//
// Newest first, the fixture site's posts are: sample-everything (2026-08-27, featured), the long
// title post, the text-only post, the 13 generated posts, then the four real posts: the Wayfinder
// post (2025-08-27, featured), Focus Pocus (08-16, featured), Ghost themes (08-07) and Starting
// something new (03-15, featured).
import { test, expect, type Page } from "@playwright/test";

const LANDING = "/writing/";
const TEXT_ONLY = "/writing/text-only/";
const LONG_TITLE = "/writing/long-title/";
const LONG_TITLE_START = "A very long title that keeps going to check wrapping";
const WAYFINDER = "/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/";
const FOCUS_POCUS = "/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/";
const STARTING = "/writing/starting-something-new/";

const noSidewaysScroll = async (page: Page, what: string) => {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, what).toBeLessThanOrEqual(clientWidth);
};

const cardHrefs = (page: Page, selector: string) =>
  page.locator(`${selector} [data-post-card] h3 a`).evaluateAll((links) => links.map((a) => a.getAttribute("href")));

test.describe("landing page on the fixture site", () => {
  // sample-everything is the lead. Four other posts are featured; Featured holds the 3 newest
  // (fixture-post-01, Wayfinder, Focus Pocus), so the fourth, Starting something new, is not in
  // Featured, and it is too old for the 6 newest that fill Latest.
  test("fills Featured with the 3 newest featured posts and Latest with the 6 newest others", async ({ page }) => {
    await page.goto(LANDING);
    expect(await page.locator("[data-lead-story] h2 a").getAttribute("href")).toBe("/writing/sample-everything/");
    const featured = await cardHrefs(page, "[data-featured-grid]");
    expect(featured).toEqual(["/writing/fixture-post-01/", WAYFINDER, FOCUS_POCUS]);
    await expect(page.locator("[data-featured-grid] [data-featured-mark]")).toHaveCount(3);
    expect(await cardHrefs(page, "[data-latest-grid]")).toEqual([
      LONG_TITLE,
      TEXT_ONLY,
      "/writing/fixture-post-02/",
      "/writing/fixture-post-03/",
      "/writing/fixture-post-04/",
      "/writing/fixture-post-05/",
    ]);
    await expect(page.locator(`main a[href="${STARTING}"]`)).toHaveCount(0);
  });

  test("shows the text-only post as a card with no image and no empty picture box", async ({ page }) => {
    await page.goto(LANDING);
    const textOnly = page.locator("[data-post-card][data-text-only]");
    await expect(textOnly).toHaveCount(1);
    await expect(textOnly.locator("h3 a")).toHaveAttribute("href", TEXT_ONLY);
    await expect(textOnly.locator("img")).toHaveCount(0);
  });
});

test.describe("post with no feature image", () => {
  test("shows the title card without a picture or an update date and shares the default image", async ({ page }) => {
    await page.goto(TEXT_ONLY);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("A post with no feature image");
    // No hero figure and no picture in the title card or the body (the related-post cards below may have some).
    await expect(page.locator("[data-post-hero]")).toHaveCount(0);
    await expect(page.locator("[data-title-card] img, [data-post-body] img")).toHaveCount(0);
    await expect(page.locator("[data-title-card]")).not.toContainText("Updated");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-default\.png$/);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /\S/);
  });
});

test.describe("very long title", () => {
  test("wraps without sideways scrolling at 320 px on every page that shows it", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const [path, heading] of [
      ["/", "h3"],
      [LANDING, "h3"],
      ["/writing/all/", "h2"],
      ["/writing/topics/technology-teams/", "h2"],
      [LONG_TITLE, "h1"],
    ] as const) {
      await page.goto(path);
      await expect(page.locator(heading, { hasText: LONG_TITLE_START }).first(), path).toBeVisible();
      await noSidewaysScroll(page, path);
    }
  });
});

test.describe("topic page on the fixture site", () => {
  test("lists the technology-teams posts newest first, the text-only card among them", async ({ page }) => {
    await page.goto("/writing/topics/technology-teams/");
    const hrefs = await page
      .locator("main [data-post-card] h2 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    // The two fixture posts, the generated posts on technology-teams, then Ghost themes (2025).
    expect(hrefs).toEqual([
      LONG_TITLE,
      TEXT_ONLY,
      "/writing/fixture-post-02/",
      "/writing/fixture-post-05/",
      "/writing/fixture-post-11/",
      "/writing/self-contained-development-for-ghost-themes/",
    ]);
  });
});

test.describe("home page recent writing on the fixture site", () => {
  test("lists the 3 newest posts, including the long title and the text-only card", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section[aria-labelledby]").filter({
      has: page.getByRole("heading", { level: 2, name: "Recent writing" }),
    });
    const cards = section.locator("article[data-post-card]");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).getByRole("heading", { level: 3 })).toContainText("Every kind of content a post can hold");
    await expect(cards.nth(1).getByRole("heading", { level: 3 })).toContainText(LONG_TITLE_START);
    await expect(cards.nth(2).getByRole("heading", { level: 3 })).toContainText("A post with no feature image");
    await expect(cards.nth(2).locator("img")).toHaveCount(0);
  });
});
