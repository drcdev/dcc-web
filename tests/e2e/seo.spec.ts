// Search and sharing metadata, the sitemap and robots.txt as served by
// `wrangler dev` from the production build (contracts/head-metadata.md;
// research R9; FR-017, FR-017a, FR-017b, FR-017c, FR-018, FR-019, SC-006).
// A local build resolves its origin to the fallback https://doncoleman.ca, so
// absolute addresses are checked against the origin robots.txt reports and
// fetched from the local server by path.
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

const NOT_FOUND_PATH = "/nope/";

async function robotsOrigin(request: APIRequestContext): Promise<string> {
  const text = await (await request.get("/robots.txt")).text();
  const sitemap = /^Sitemap: (.+)$/m.exec(text)?.[1];
  expect(sitemap, "robots.txt has a Sitemap line").toBeDefined();
  return new URL(sitemap!).origin;
}

async function sitemapEntries(request: APIRequestContext): Promise<string[]> {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  expect(sitemaps.length).toBeGreaterThan(0);
  const entries: string[] = [];
  for (const sitemap of sitemaps) {
    const response = await request.get(new URL(sitemap).pathname);
    expect(response.status()).toBe(200);
    entries.push(...[...(await response.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!));
  }
  return entries;
}

const attr = (page: Page, selector: string, name = "content") =>
  page.locator(selector).first().getAttribute(name);

async function expectSharedMetadata(page: Page, origin: string, type: "website" | "article" = "website") {
  const description = await attr(page, 'meta[name="description"]');
  expect(description?.trim()).toBeTruthy();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /\S/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description!);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", type);
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Don Coleman");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_CA");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('link[rel="sitemap"]')).toHaveAttribute("href", "/sitemap-index.xml");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /\S/);

  const image = await attr(page, 'meta[property="og:image"]');
  expect(image).toBeTruthy();
  const imageUrl = new URL(image!);
  expect(imageUrl.origin).toBe(origin);
  const response = await page.request.get(imageUrl.pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const png = await response.body();
  expect(png.subarray(1, 4).toString("latin1")).toBe("PNG");
  expect(png.subarray(12, 16).toString("latin1")).toBe("IHDR");
  // The default sharing image is 1200 by 630; a post shares its feature image resized to 1200 wide.
  expect(png.readUInt32BE(16)).toBe(1200);
  if (type === "website") expect(png.readUInt32BE(20)).toBe(630);
}

// This build is not a production build, so the sample post (a draft) is built and listed;
// production leaves it out (specs/008-blog research R3). The four real posts (feature 010)
// are published and listed on every build.
const POSTS = [
  "/writing/building-focus-pocus-what-i-learned-about-ai-coding-and-integration/",
  "/writing/sample-everything/",
  "/writing/self-contained-development-for-ghost-themes/",
  "/writing/starting-something-new/",
  "/writing/the-systems-leadership-wayfinder-five-mindset-shifts-for-leading-complex-change/",
];

// The all posts page and one page per topic are built on every build (spec 008 US4).
const TOPIC_PAGES = [
  "/writing/topics/agentic-ai/",
  "/writing/topics/compliant-data/",
  "/writing/topics/healthcare-leadership/",
  "/writing/topics/technology-teams/",
];

test("the sitemap lists exactly the built public pages, never /404", async ({ request }) => {
  const origin = await robotsOrigin(request);
  const entries = await sitemapEntries(request);
  expect([...entries].sort()).toEqual(
    [
      "/",
      "/about/",
      "/contact/",
      "/privacy-policy/",
      "/projects/",
      "/projects/focus-pocus/",
      "/services/",
      "/speaking/",
      "/technology/",
      "/terms-of-use/",
      "/writing/",
      "/writing/all/",
      ...TOPIC_PAGES,
      ...POSTS,
    ]
      .map((path) => `${origin}${path}`)
      .sort(),
  );
  for (const entry of entries) expect(new URL(entry).pathname.startsWith("/404")).toBe(false);
});

test("robots.txt allows all crawling and points at the sitemap on the page origin", async ({ request, page }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  const text = await response.text();
  expect(text.trim().split("\n")).toEqual([
    "User-agent: *",
    "Allow: /",
    "",
    expect.stringMatching(/^Sitemap: https:\/\/[^/]+\/sitemap-index\.xml$/),
  ]);
  expect(text).not.toMatch(/^Disallow/im);

  await page.goto("/");
  const canonical = await attr(page, 'link[rel="canonical"]', "href");
  expect(new URL(canonical!).origin).toBe(await robotsOrigin(request));
});

/** Post pages are articles; the landing, all posts and topic pages are ordinary pages (FR-030). */
const isPostPath = (path: string) =>
  path.startsWith("/writing/") &&
  path !== "/writing/" &&
  !path.startsWith("/writing/all/") &&
  !path.startsWith("/writing/topics/");

test("every public page has complete, consistent metadata", async ({ page, request }) => {
  const origin = await robotsOrigin(request);
  const entries = await sitemapEntries(request);
  const titles = new Set<string>();
  for (const entry of entries) {
    const path = new URL(entry).pathname;
    expect(path.endsWith("/"), path).toBe(true);
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    const title = await page.title();
    expect(title.trim()).toBeTruthy();
    expect(titles.has(title), `duplicate title ${title}`).toBe(false);
    titles.add(title);

    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", entry);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", entry);
    await expectSharedMetadata(page, origin, isPostPath(path) ? "article" : "website");
  }
  expect(titles.size).toBe(entries.length);
});

test("the not-found page has metadata and noindex but no canonical and no og:url", async ({ page, request }) => {
  const origin = await robotsOrigin(request);
  const response = await page.goto(NOT_FOUND_PATH);
  expect(response?.status()).toBe(404);
  expect((await page.title()).trim()).toBeTruthy();
  await page.goto("/");
  const homeTitle = await page.title();
  await page.goto(NOT_FOUND_PATH);
  expect(await page.title()).not.toBe(homeTitle);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await expectSharedMetadata(page, origin);
});

test("the project story has its own title, description, canonical, sharing image and sitemap entry", async ({
  page,
  request,
}) => {
  const origin = await robotsOrigin(request);
  const entries = await sitemapEntries(request);
  expect(entries).toContain(`${origin}/projects/`);
  expect(entries).toContain(`${origin}/projects/focus-pocus/`);
  await page.goto("/projects/focus-pocus/");
  expect(await page.title()).toContain("Focus Pocus");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}/projects/focus-pocus/`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Focus Pocus/);
  await expectSharedMetadata(page, origin);
  // Focus Pocus has no sharing image of its own, so it uses the site default (FR-080).
  expect(await attr(page, 'meta[property="og:image"]')).toContain("og-default");
});
