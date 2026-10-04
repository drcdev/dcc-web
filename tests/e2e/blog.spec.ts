// Blog end-to-end tests against the production build served by `wrangler dev`
// (specs/008-blog/tasks.md T030; contracts/blog-pages.md "Post"). Later phases
// add the landing, listing, topic, share and feed cases to this file (T042,
// T057, T063, T067, T071). The sample post is a draft, so every build that is
// not a production build shows it. The cases the removed sample posts covered (a
// post with no feature image, a very long title, more featured posts than fit)
// run against the fixture site in tests/e2e/blog-fixtures.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";
import { blog } from "../../src/config/blog.ts";
import { topics, topicHref, seriesIds, otherSeries, findTopic } from "../../src/config/topics.ts";
import { selectLanding, selectRecent, selectRelated, sortNewestFirst } from "../../src/lib/content/post-order.ts";
import { inBuild, posts, postSummary, seriesPost } from "../helpers/content.ts";

const POST = "/writing/sample-everything/";
// The e2e server serves a local build, which is not a production build, so drafts are built and listed.
const BUILT_POSTS = inBuild(posts, { production: false }).map(postSummary);
/** The newest post with no update date. */
const PLAIN_POST = (() => {
  const plain = sortNewestFirst(BUILT_POSTS.filter((post) => !post.updated))[0];
  if (!plain) throw new Error("tests/e2e/blog.spec.ts: no post lacks an update date.");
  return plain.href;
})();
/** The series id a post is tagged with, if any. */
const seriesOf = (post: { topics: readonly string[] }) => post.topics.find((id) => (seriesIds as readonly string[]).includes(id));
const SAMPLE = BUILT_POSTS.find((post) => post.href === POST)!;
const TAGGED_HREFS = BUILT_POSTS.filter((post) => seriesOf(post)).map((post) => post.href);
const SERIES_POST = postSummary(seriesPost);
const SERIES_POST_NAME = findTopic(seriesOf(SERIES_POST)!)!.name;
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
    await expect(page.locator("[data-title-card]")).toContainText("Updated");
    await page.goto(PLAIN_POST);
    await expect(page.locator("[data-title-card]")).not.toContainText("Updated");
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

// The landing page (T042; contracts/blog-pages.md "Landing"). The expected lead, Featured and
// Latest come from selectLanding over the posts the build holds (the rule has its own unit test and
// fixed-data cases on the fixture site, tests/e2e/blog-fixtures.spec.ts).
const LANDING = "/writing/";
const LANDING_SELECTION = selectLanding(BUILT_POSTS);
/** Every built post's entry by address, for the front matter the summary leaves out. */
const BUILT_ENTRY = new Map(inBuild(posts, { production: false }).map((entry) => [entry.address, entry]));
const LEAD_TITLE = LANDING_SELECTION.lead!.title;

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
        at("[data-series-intro]"),
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

  test("opens with a framing lead between the h1 and the lead story, with a link into each series", async ({
    page,
  }) => {
    await page.goto(LANDING);
    const intro = page.locator("main [data-series-intro]");
    await expect(intro).toHaveCount(1);
    await expect(intro.getByRole("heading", { level: 2, name: "Drift & Convergence" })).toBeVisible();
    await expect(intro.getByRole("heading", { level: 3 })).toHaveText(["Convergence", "Drift"]);
    const headings = await page.locator("main h1, main h2").evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(headings.slice(0, 3)).toEqual(["Writing", "Drift & Convergence", LEAD_TITLE]);
    // The pill row does not offer the series.
    const pills = page.getByRole("navigation", { name: "Topics" });
    await expect(pills.getByRole("link", { name: /^(Drift|Convergence)$/ })).toHaveCount(0);
  });

  test("reaches each series page from the lead", async ({ page }) => {
    for (const [name, path] of [
      ["Convergence", "/writing/convergence/"],
      ["Drift", "/writing/drift/"],
    ] as const) {
      await page.goto(LANDING);
      await page.locator("[data-series-intro]").getByRole("link", { name: `Read ${name}` }).click();
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator("main h1")).toHaveText(name);
    }
  });

  test("shows both series links on a desktop viewport without scrolling past the lead story", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(LANDING);
    const leadTop = await page.locator("[data-lead-story]").evaluate((el) => el.getBoundingClientRect().top);
    for (const name of ["Read Convergence", "Read Drift"]) {
      const box = await page.locator("[data-series-intro]").getByRole("link", { name }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(800);
      expect(box!.y + box!.height).toBeLessThanOrEqual(leadTop + 1);
    }
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
    expect(lead).toBe(LANDING_SELECTION.lead!.href);
    expect(featured).toEqual(LANDING_SELECTION.featured.map((post) => post.href));
    expect(latest).toEqual(LANDING_SELECTION.latest.map((post) => post.href));
    expect(featured).not.toContain(lead);
    expect(latest).not.toContain(lead);
    for (const href of featured) expect(latest).not.toContain(href);
    expect(new Set([lead, ...featured, ...latest]).size).toBe(1 + featured.length + latest.length);
    await expect(page.locator("[data-featured-grid] [data-featured-mark]")).toHaveCount(featured.length);
  });

  // featureImage is optional: a post without one is a text-only card, so the counts come from the selection.
  test("shows the lead story's image eagerly and every card with its image", async ({ page }) => {
    await page.goto(LANDING);
    const hasImage = (href: string) => Boolean(BUILT_ENTRY.get(href)!.data.featureImage);
    const lead = LANDING_SELECTION.lead!;
    if (hasImage(lead.href)) {
      const img = page.locator("[data-lead-story] img");
      await expect(img).toHaveAttribute("fetchpriority", "high");
      await expect(img).toHaveAttribute("loading", "eager");
    } else {
      await expect(page.locator("[data-lead-story][data-text-only]")).toHaveCount(1);
    }
    const cardPosts = [...LANDING_SELECTION.featured, ...LANDING_SELECTION.latest];
    const cards = page.locator("[data-featured-grid] [data-post-card], [data-latest-grid] [data-post-card]");
    await expect(cards).toHaveCount(cardPosts.length);
    await expect(
      page.locator("[data-featured-grid] [data-post-card][data-text-only], [data-latest-grid] [data-post-card][data-text-only]"),
    ).toHaveCount(cardPosts.filter((post) => !hasImage(post.href)).length);
    await expect(cards.locator("img")).toHaveCount(cardPosts.filter((post) => hasImage(post.href)).length);
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
    for (const href of hrefs.slice(0, -1)) expect(href).toMatch(/^\/writing\/(topics\/)?[a-z-]+\/$/);
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

// The all posts and topic pages (T057; contracts/blog-pages.md "All posts" and "Topic"). The default
// build lists every post, newest first. Pagination runs against the fixture site in
// tests/e2e/blog-pagination.spec.ts. The topic checked here is the first controlled, non-series
// topic that a built post uses.
const ALL = "/writing/all/";
const TOPIC_ENTRY = topics.find((topic) => !("series" in topic) && BUILT_POSTS.some((post) => post.topics.includes(topic.id)));
if (!TOPIC_ENTRY) throw new Error("tests/e2e/blog.spec.ts: no post uses a non-series topic.");
const TOPIC = topicHref(TOPIC_ENTRY.id);
const TOPIC_NAME = TOPIC_ENTRY.name;

test.describe("all posts page", () => {
  test("shows the h1, the pill row and every post as a card, newest first", async ({ page }) => {
    await page.goto(ALL);
    const main = page.locator("main");
    await expect(main.locator("h1")).toHaveText("All posts");
    await expect(main.getByRole("navigation", { name: "Topics" })).toBeVisible();
    const hrefs = await main
      .locator("[data-post-card] h2 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(sortNewestFirst(BUILT_POSTS).slice(0, blog.pageSize).map((post) => post.href));
    // Pagination is checked on the fixture site; here the posts fit on one page, so there is none.
    if (BUILT_POSTS.length <= blog.pageSize) {
      await expect(main.getByRole("navigation", { name: "Pages" })).toHaveCount(0);
    }
  });

  test("advertises the feed and keeps Writing current in the header", async ({ page }) => {
    await page.goto(ALL);
    await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
      "href",
      /\/writing\/rss\.xml$/,
    );
    expect(await page.title()).toBe("All posts · Don Coleman");
    await expect(page.locator('#primary-nav-list a[href="/writing/"]')).toHaveAttribute("aria-current", "true");
  });

  test("does not scroll sideways at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ALL);
    await noSidewaysScroll(page);
  });

  test("reaches a topic page from a pill on a card", async ({ page }) => {
    await page.goto(ALL);
    await page.locator(`main [data-post-card] a[data-topic-pill][href="${TOPIC}"]`).first().click();
    await page.waitForURL(`**${TOPIC}`);
    await expect(page.locator("main h1")).toHaveText(TOPIC_NAME);
  });

  test("returns the not-found page with status 404 for /writing/all/1/ and /writing/all/99/", async ({ page }) => {
    for (const path of ["/writing/all/1/", "/writing/all/99/"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
      await expect(page.locator("main h1")).not.toHaveText("All posts");
    }
  });
});

test.describe("topic page", () => {
  test("opens with a banner and h1, then the topic's posts, with no pill row", async ({ page }) => {
    await page.goto(TOPIC);
    const main = page.locator("main");
    await expect(main.locator("[data-topic-banner]")).toBeVisible();
    await expect(main.locator("h1")).toHaveText(TOPIC_NAME);
    await expect(main.getByRole("navigation", { name: "Topics" })).toHaveCount(0);
    const hrefs = await main
      .locator("[data-post-card] h2 a")
      .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    const inTopic = BUILT_POSTS.filter((post) => post.topics.includes(TOPIC_ENTRY.id));
    expect(hrefs).toEqual(sortNewestFirst(inTopic).slice(0, blog.pageSize).map((post) => post.href));
    expect(await page.title()).toBe(`${TOPIC_NAME} · Don Coleman`);
  });

  test("returns the not-found page with status 404 for an unknown topic and for page 1", async ({ page }) => {
    for (const path of ["/writing/topics/nope/", `${TOPIC}1/`]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
  });
});

// Share and related posts (T063; FR-028, FR-029). Related posts are ranked by shared topics, then
// newest. sample-everything (agentic-ai, compliant-data) shares agentic-ai with the Focus Pocus post
// only, so it comes first, then the newest others that share no topic: the Wayfinder post
// (2025-08-27), then Ghost themes (08-07), ahead of Starting something new (03-15). Filling the
// list from posts that share no topic is also proven in the selection unit tests.
test.describe("share", () => {
  test("shows the Share button and calls navigator.share with the title and address", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { shared: unknown[] }).shared = [];
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: (data: unknown) => {
          (window as unknown as { shared: unknown[] }).shared.push(data);
          return Promise.resolve();
        },
      });
    });
    await page.goto(POST);
    const button = page.locator("[data-share]").getByRole("button", { name: "Share", exact: true });
    await expect(button).toBeVisible();
    await button.click();
    const shared = await page.evaluate(() => (window as unknown as { shared: unknown[] }).shared);
    // The address is the post's canonical one, on the site's own origin.
    const canonical = await page.locator("link[rel=canonical]").getAttribute("href");
    expect(canonical).toMatch(new RegExp(`${POST}$`));
    expect(shared).toEqual([{ title: "Sample: Every kind of content a post can hold", url: canonical }]);
  });

  test("showing the button moves no other content", async ({ browser }) => {
    const shown = await browser.newPage();
    await shown.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.resolve() });
    });
    await shown.goto(POST);
    await shown.locator("[data-share] button").waitFor({ state: "visible" });
    const hidden = await browser.newPage();
    await hidden.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await hidden.goto(POST);
    await expect(hidden.locator("[data-share] button")).toBeHidden();
    for (const selector of ["[data-share] a", "[data-related]"]) {
      expect((await shown.locator(selector).first().boundingBox())!.y).toBe(
        (await hidden.locator(selector).first().boundingBox())!.y,
      );
    }
    await shown.close();
    await hidden.close();
  });

  test("has no button without navigator.share, and the plain links work", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    });
    await page.goto(POST);
    const share = page.locator("[data-share]");
    await expect(share.getByRole("heading", { level: 2, name: "Share this post" })).toBeVisible();
    await expect(share.getByRole("button")).toBeHidden();
    const canonical = await page.locator("link[rel=canonical]").getAttribute("href");
    await expect(share.getByRole("link", { name: "Share on LinkedIn" })).toHaveAttribute(
      "href",
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical!)}`,
    );
    await expect(share.getByRole("link", { name: "Share by email" })).toHaveAttribute(
      "href",
      /^mailto:\?subject=Sample%3A%20Every%20kind.*&body=https%3A%2F%2F/,
    );
  });

  test.describe("without scripts", () => {
    test.use({ javaScriptEnabled: false });

    test("shows the LinkedIn and email links and no Share button", async ({ page }) => {
      await page.goto(PLAIN_POST);
      const share = page.locator("[data-share]");
      await expect(share.getByRole("link", { name: "Share on LinkedIn" })).toBeVisible();
      await expect(share.getByRole("link", { name: "Share by email" })).toBeVisible();
      await expect(share.getByRole("button")).toBeHidden();
    });
  });
});

test.describe("related posts", () => {
  test("lists up to 3 other posts, most shared topics first, never the post itself", async ({ page }) => {
    await page.goto(POST);
    const related = page.locator("[data-related]");
    await expect(related.getByRole("heading", { level: 2, name: "Related posts" })).toBeVisible();
    const hrefs = await related.locator("li h3 a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs).toEqual(selectRelated(SAMPLE, BUILT_POSTS).map((post) => post.href));
    expect(hrefs).not.toContain(POST);
  });

  test("puts the share area and then the related posts after the views note", async ({ page }) => {
    await page.goto(POST);
    const views = await page.locator("[data-views-note]").boundingBox();
    const share = await page.locator("[data-share]").boundingBox();
    const related = await page.locator("[data-related]").boundingBox();
    expect(share!.y).toBeGreaterThan(views!.y);
    expect(related!.y).toBeGreaterThan(share!.y);
  });
});

test.describe("feed", () => {
  test("serves /writing/rss.xml as well-formed XML with an XML content type", async ({ page, request }) => {
    const response = await request.get("/writing/rss.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/^application\/(rss\+)?xml/);
    const xml = await response.text();
    const parsed = await page.evaluate((text) => {
      const doc = new DOMParser().parseFromString(text, "application/xml");
      return {
        error: doc.querySelector("parsererror")?.textContent ?? null,
        root: doc.documentElement.nodeName,
        version: doc.documentElement.getAttribute("version"),
        title: doc.querySelector("channel > title")?.textContent ?? null,
      };
    }, xml);
    expect(parsed).toEqual({ error: null, root: "rss", version: "2.0", title: "Drift & Convergence" });
  });

  for (const path of [
    "/writing/",
    "/writing/all/",
    TOPIC,
    POST,
    SERIES_POST.href,
  ]) {
    test(`advertises the feed in the head of ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('head link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute(
        "href",
        /\/writing\/rss\.xml$/,
      );
    });
  }
});

test.describe("home page recent writing (US7)", () => {
  const RECENT = selectRecent(BUILT_POSTS);
  test("lists the 3 newest posts as cards, newest first, with a link to all writing", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section[aria-labelledby]").filter({
      has: page.getByRole("heading", { level: 2, name: "Recent writing" }),
    });
    await expect(section).toBeVisible();
    const cards = section.locator("article[data-post-card]");
    await expect(cards).toHaveCount(RECENT.length);
    for (const [index, post] of RECENT.entries()) {
      await expect(cards.nth(index).getByRole("heading", { level: 3 })).toContainText(post.title);
    }
    await expect(section.getByRole("link", { name: "All writing" })).toHaveAttribute("href", "/writing/");
  });

  test("reaches the newest post in 2 selections from Home (SC-001)", async ({ page }) => {
    await page.goto("/");
    const [newest] = RECENT;
    await page.getByRole("link", { name: newest!.title }).first().click();
    await expect(page).toHaveURL(new RegExp(`${newest!.href}$`));
  });
});

// Series pages and redirects (spec 013 US4; contracts/writing-pages.md; SC-003). Each series page lists the
// posts tagged with its id, newest first. The sample post has no series.
const SERIES_POSTS = Object.fromEntries(
  seriesIds.map((id) => [
    id,
    {
      name: findTopic(id)!.name,
      other: findTopic(otherSeries(id))!.name,
      otherPath: topicHref(otherSeries(id)),
      posts: sortNewestFirst(BUILT_POSTS.filter((post) => post.topics.includes(id)))
        .slice(0, blog.pageSize)
        .map((post) => post.href),
    },
  ]),
);

test.describe("series pages", () => {
  for (const [id, series] of Object.entries(SERIES_POSTS)) {
    const path = `/writing/${id}/`;

    test(`${id}: shows the banner and lists every post tagged with the series, and only those`, async ({ page }) => {
      await page.goto(path);
      const main = page.locator("main");
      await expect(main.locator(`[data-series-banner="${id}"]`)).toBeVisible();
      await expect(main.locator("h1")).toHaveText(series.name);
      await expect(main.getByRole("navigation", { name: "Topics" })).toHaveCount(0);
      const hrefs = await main
        .locator("[data-post-card] h2 a")
        .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
      expect(hrefs).toEqual(series.posts);
      expect(await page.title()).toBe(`${series.name} · Don Coleman`);
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${path}$`));
    });

    test(`${id}: the other-series link and the All writing link work`, async ({ page }) => {
      await page.goto(path);
      const banner = page.locator(`[data-series-banner="${id}"]`);
      await banner.getByRole("link", { name: `Read ${series.other}` }).click();
      await expect(page).toHaveURL(new RegExp(`${series.otherPath}$`));
      await page.goto(path);
      await banner.getByRole("link", { name: "All writing" }).click();
      await expect(page).toHaveURL(/\/writing\/$/);
    });
  }

  test("page 1 and a page past the last are not built", async ({ page }) => {
    for (const path of [`${topicHref(seriesIds[0])}1/`, `${topicHref(seriesIds[0])}99/`]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(404);
    }
  });
});

test.describe("redirects from the old series topic addresses (FR-008a)", () => {
  const [first] = seriesIds;
  const cases: Array<[string, string]> = [
    [`/writing/topics/${first}`, topicHref(first!)],
    [`/writing/topics/${first}/`, topicHref(first!)],
    [`/writing/topics/${first}/2/`, `${topicHref(first!)}2/`],
    ...seriesIds.slice(1).map((id): [string, string] => [`/writing/topics/${id}/`, topicHref(id)]),
  ];
  for (const [from, to] of cases) {
    test(`${from} answers 301 to ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(new URL(response.headers().location!, "http://127.0.0.1:4321").pathname).toBe(to);
    });
  }

  test("following the redirect for a page past the last ends on the not-found page with status 404", async ({
    request,
  }) => {
    const response = await request.get(`/writing/topics/${seriesIds[0]}/99/`);
    expect(response.status()).toBe(404);
    expect(new URL(response.url()).pathname).toBe(`${topicHref(seriesIds[0]!)}99/`);
  });
});

// Series markers on every page that shows topics (spec 013 US3; FR-010; SC-002). Tagged posts carry a
// "Series: ..." marker; the sample post has no series and shows none.
test.describe("series markers", () => {
  const seriesNames = seriesIds.map((id) => findTopic(id)!.name);
  // A topic page shows markers only when one of its posts is in a series.
  const markerTopic = topics.find(
    (topic) => !("series" in topic) && BUILT_POSTS.some((post) => seriesOf(post) && post.topics.includes(topic.id)),
  );
  if (!markerTopic) throw new Error("tests/e2e/blog.spec.ts: no non-series topic is shared with a series post.");
  const listings = [
    ["the landing page", "/writing/"],
    ["/writing/all/", "/writing/all/"],
    ["a topic page", topicHref(markerTopic.id)],
    ["a series page", topicHref(seriesIds[0]!)],
    ["the home page's Recent writing", "/"],
  ] as const;
  for (const [name, path] of listings) {
    test(`${name} shows markers on tagged cards`, async ({ page }) => {
      await page.goto(path);
      const markers = page.locator("[data-series-marker]");
      expect(await markers.count()).toBeGreaterThan(0);
      for (const text of await markers.allInnerTexts()) expect(text).toMatch(new RegExp(`^Series: (${seriesNames.join("|")})$`));
      const untagged = page.locator("[data-post-card], [data-lead-story]").filter({ has: page.locator(`a[href="${POST}"]`) });
      for (let i = 0; i < (await untagged.count()); i += 1) {
        await expect(untagged.nth(i).locator("[data-series-marker]")).toHaveCount(0);
      }
    });
  }

  test("the marker comes first in a card's topic list", async ({ page }) => {
    await page.goto(topicHref(seriesOf(SERIES_POST)!));
    const card = page.locator("[data-post-card]").filter({ has: page.locator(`a[href="${SERIES_POST.href}"]`) });
    await expect(card.locator('ul[aria-label="Topics"] a').first()).toHaveText(`Series: ${SERIES_POST_NAME}`);
  });

  test("a tagged post header shows a marker that links to the series page", async ({ page }) => {
    await page.goto(SERIES_POST.href);
    const link = page.locator("[data-series-marker]", { hasText: `Series: ${SERIES_POST_NAME}` }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${topicHref(seriesOf(SERIES_POST)!)}$`));
  });

  test("an untagged post header has no marker", async ({ page }) => {
    await page.goto(POST);
    // Related posts below the post may carry markers; the header (everything outside them) has none.
    const all = await page.locator("[data-series-marker]").count();
    const inRelated = await page.locator("[data-related] [data-series-marker]").count();
    expect(all - inRelated).toBe(0);
  });

  test("related posts show markers for tagged posts and none for untagged", async ({ page }) => {
    await page.goto(POST);
    const cards = page.locator("[data-related] [data-post-card]");
    expect(await cards.count()).toBeGreaterThan(0);
    for (let i = 0; i < (await cards.count()); i += 1) {
      const card = cards.nth(i);
      const href = await card.locator("h3 a").getAttribute("href");
      const tagged = TAGGED_HREFS.includes(href ?? "");
      await expect(card.locator("[data-series-marker]")).toHaveCount(tagged ? 1 : 0);
    }
  });
});
