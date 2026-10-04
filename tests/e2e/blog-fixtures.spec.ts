// Blog cases the site's own posts no longer hold, checked on the fixture site (port 4322,
// playwright.config.ts project `sections`; scripts/build-fixture-site.ts). The fixture site is
// the site's own posts (drafts included, as it is not a production build) plus three fixture
// posts from tests/fixtures/posts/valid/: text-only.mdx, a post with no feature image
// (healthcare-leadership, technology-teams, fixture-cards), long-title.mdx, a post
// whose title is very long and holds an unbroken word (technology-teams,
// fixture-cards), and every-part.mdx, a featured post that shows every part of the post template
// (2099-01-01, so it is always the lead; drift, compliant-data, healthcare-leadership,
// fixture-cards). It also adds 13 generated posts, fixture-post-01 to -13, all on agentic-ai:
// fixture-post-01 is dated 2026-06-30 and featured, and posts 02 to 13 run 2026-06-29 back to
// 2026-06-18. The lists these tests check (landing, topic page, home) are computed from the site's
// own posts plus those, so a new story never needs a test change. A fixture post's place in a list
// is asserted only through that computed selection; the fixture-only topic page fixture-cards
// holds the three fixture-owned posts whatever else the site gains, so the no-image card and the
// long-title wrap are always checked there.
import { test, expect, type Page } from "@playwright/test";
import { blog } from "../../src/config/blog.ts";
import { selectLanding, selectRecent, sortNewestFirst } from "../../src/lib/content/post-order.ts";
import { FIXTURE_POSTS, generateFixturePosts } from "../../scripts/build-fixture-site.ts";
import { posts, postSummary, readEntries } from "../helpers/content.ts";

const LANDING = "/writing/";
const TEXT_ONLY = "/writing/text-only/";
const LONG_TITLE = "/writing/long-title/";
const LONG_TITLE_START = "A very long title that keeps going to check wrapping";

const generated = generateFixturePosts().map((post) => {
  const field = (name: string) => new RegExp(`^${name}: (.*)$`, "m").exec(post.source)?.[1] ?? "";
  return {
    slug: post.slug,
    title: field("title"),
    date: new Date(field("date")),
    updated: undefined,
    topics: [...(/^topics:\n((?:  - .*\n)+)/m.exec(post.source)?.[1] ?? "").matchAll(/  - (.*)/g)].map((match) => match[1]!),
    featured: field("featured") === "true",
    draft: false,
    href: `/writing/${post.slug}/`,
  };
});
const fixtureOwned = readEntries("posts", "tests/fixtures/posts/valid")
  .filter((entry) => (FIXTURE_POSTS as readonly string[]).includes(`${entry.slug}.mdx`))
  .map(postSummary);
// Every post the fixture site builds, newest first. It is not a production build, so drafts are built.
const SITE_POSTS = sortNewestFirst([...posts.map(postSummary), ...fixtureOwned, ...generated]);
const LANDING_POSTS = selectLanding(SITE_POSTS);
const LANDING_GRID_HREFS = [...LANDING_POSTS.featured, ...LANDING_POSTS.latest].map((post) => post.href);
const RECENT_HREFS = selectRecent(SITE_POSTS).map((post) => post.href);
const FIXTURE_CARDS = "/writing/topics/fixture-cards/";
const hrefsWithTopic = (id: string) => SITE_POSTS.filter((post) => post.topics.includes(id)).map((post) => post.href);

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
  // every-part is the lead (2099). Featured holds the newest featured posts and Latest the newest
  // others, both computed from the site's posts, so no post outside the lead, Featured and Latest
  // is linked in those grids. The fixture posts' places in Featured and Latest are asserted only
  // through that computed selection.
  test("fills Featured with the newest featured posts and Latest with the newest others", async ({ page }) => {
    await page.goto(LANDING);
    expect(await page.locator("[data-lead-story] h2 a").getAttribute("href")).toBe("/writing/every-part/");
    expect(LANDING_POSTS.lead?.href).toBe("/writing/every-part/");
    const featured = await cardHrefs(page, "[data-featured-grid]");
    expect(featured).toEqual(LANDING_POSTS.featured.map((post) => post.href));
    await expect(page.locator("[data-featured-grid] [data-featured-mark]")).toHaveCount(featured.length);
    const latest = await cardHrefs(page, "[data-latest-grid]");
    expect(latest).toEqual(LANDING_POSTS.latest.map((post) => post.href));
    const shown = new Set([LANDING_POSTS.lead!, ...LANDING_POSTS.featured, ...LANDING_POSTS.latest].map((post) => post.href));
    for (const post of SITE_POSTS.filter((candidate) => !shown.has(candidate.href))) {
      await expect(page.locator(`main a[href="${post.href}"]`), post.href).toHaveCount(0);
    }
  });

  test("shows the text-only post as a card with no image and no empty picture box when the landing lists it", async ({ page }) => {
    await page.goto(LANDING);
    const textOnly = page.locator(`[data-post-card]:has(a[href="${TEXT_ONLY}"])`);
    if (!LANDING_GRID_HREFS.includes(TEXT_ONLY)) {
      await expect(textOnly).toHaveCount(0);
      return;
    }
    await expect(textOnly).toHaveCount(1);
    await expect(textOnly).toHaveAttribute("data-text-only", /.*/);
    await expect(textOnly.locator("img")).toHaveCount(0);
  });
});

test.describe("fixture-only topic page", () => {
  // Only the three fixture-owned posts carry fixture-cards, so they are always on its one page.
  test("shows the text-only post as a card with no image and no empty picture box", async ({ page }) => {
    await page.goto(FIXTURE_CARDS);
    const textOnly = page.locator(`[data-post-card]:has(a[href="${TEXT_ONLY}"])`);
    await expect(textOnly).toHaveCount(1);
    await expect(textOnly).toHaveAttribute("data-text-only", /.*/);
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
    const technologyTeams = hrefsWithTopic("technology-teams");
    const pages: Array<readonly [string, string]> = [
      [FIXTURE_CARDS, "h2"],
      [LONG_TITLE, "h1"],
    ];
    if (RECENT_HREFS.includes(LONG_TITLE)) pages.push(["/", "h3"]);
    if (LANDING_GRID_HREFS.includes(LONG_TITLE)) pages.push([LANDING, "h3"]);
    if (SITE_POSTS.findIndex((post) => post.href === LONG_TITLE) < blog.pageSize) pages.push(["/writing/all/", "h2"]);
    if (technologyTeams.indexOf(LONG_TITLE) < blog.pageSize) pages.push(["/writing/topics/technology-teams/", "h2"]);
    for (const [path, heading] of pages) {
      await page.goto(path);
      await expect(page.locator(heading, { hasText: LONG_TITLE_START }).first(), path).toBeVisible();
      await noSidewaysScroll(page, path);
    }
  });
});

test.describe("topic page on the fixture site", () => {
  test("lists the first page of technology-teams posts newest first", async ({ page }) => {
    await page.goto("/writing/topics/technology-teams/");
    const hrefs = await page
      .locator("main [data-post-card] h2 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(hrefsWithTopic("technology-teams").slice(0, blog.pageSize));
  });

  test("lists the fixture-cards posts, the long-title and text-only cards among them", async ({ page }) => {
    await page.goto(FIXTURE_CARDS);
    const hrefs = await page
      .locator("main [data-post-card] h2 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(hrefsWithTopic("fixture-cards"));
    expect(hrefs).toEqual(expect.arrayContaining([LONG_TITLE, TEXT_ONLY]));
  });
});

// The oldest generated post, fixture-post-13, also carries the free-form topic `cloud-cost`
// (scripts/build-fixture-site.ts). The empty series page needs a site with no posts, so it is
// checked in blog-fixture.a11y.spec.ts (empty-site build) and in tests/build/blog-listing.test.ts.
test.describe("free-form topic page on the fixture site", () => {
  test("renders a plain banner and a listing of the posts that name the topic", async ({ page }) => {
    await page.goto("/writing/topics/cloud-cost/");
    const main = page.locator("main");
    await expect(main.locator("[data-topic-banner]")).toBeVisible();
    await expect(main.locator("h1")).toHaveText("Cloud cost");
    await expect(main.getByRole("navigation", { name: "Topics" })).toHaveCount(0);
    const hrefs = await main
      .locator("[data-post-card] h2 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(["/writing/fixture-post-13/"]);
    expect(await page.title()).toBe("Cloud cost · Don Coleman");
  });

  test("reaches the page from the neutral pill on the post's card", async ({ page }) => {
    const place = SITE_POSTS.findIndex((post) => post.slug === "fixture-post-13");
    const pageNumber = Math.floor(place / blog.pageSize) + 1;
    await page.goto(pageNumber === 1 ? "/writing/all/" : `/writing/all/${pageNumber}/`);
    const pill = page.locator("main [data-post-card] a[data-topic-pill][data-free-form]");
    await expect(pill).toHaveText("Cloud cost");
    await pill.click();
    await expect(page).toHaveURL(/\/writing\/topics\/cloud-cost\/$/);
  });
});

test.describe("series lead on the fixture site", () => {
  // The lead (every-part) joins drift and no fixture post joins convergence, so the lead links both series.
  test("links both series even though neither has a post", async ({ page }) => {
    await page.goto(LANDING);
    const lead = page.locator("[data-series-intro]");
    await expect(lead.getByRole("link", { name: "Read Convergence" })).toHaveAttribute("href", "/writing/convergence/");
    await expect(lead.getByRole("link", { name: "Read Drift" })).toHaveAttribute("href", "/writing/drift/");
  });
});

test.describe("home page recent writing on the fixture site", () => {
  test("lists the newest posts, the fixture lead first", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section[aria-labelledby]").filter({
      has: page.getByRole("heading", { level: 2, name: "Recent writing" }),
    });
    const recent = selectRecent(SITE_POSTS);
    const cards = section.locator("article[data-post-card]");
    await expect(cards).toHaveCount(recent.length);
    expect(recent[0]?.href).toBe("/writing/every-part/");
    for (const [index, post] of recent.entries()) {
      await expect(cards.nth(index).getByRole("heading", { level: 3 })).toContainText(post.title);
    }
  });
});
