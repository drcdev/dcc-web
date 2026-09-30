// Blog design prototypes (specs/005-blog-design-directions): page furniture,
// structure and accessibility checks for the throwaway routes under
// /design/blog/. The page list is built from the sample data, never
// hard-coded twice (contracts/prototype-routes.md). Prototype-only: deleted
// with the prototypes (task T041). The prototypes are deliberately not added
// to TEMPLATES, the visual project or a11y.spec.ts.
import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  byNewest,
  directions,
  landingPath,
  listingPath,
  posts,
  postPath,
  topicBySlug,
  topicPath,
  type DirectionId,
} from "../../src/pages/design/blog/_data/samples.ts";
import { TEMPLATES } from "./templates.ts";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

export const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
export const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;
export const THEMES = ["dark", "light"] as const;

const INDEX_PATH = "/design/blog/";
const DIRECTION_IDS: DirectionId[] = ["a", "b", "c"];
const withImage = posts.find((p) => p.body === "full-with-image")!;
const withoutImage = posts.find((p) => p.body === "full-no-image")!;

export interface PrototypePage {
  name: string;
  direction?: DirectionId;
  screen: "index" | "landing" | "listing-first" | "listing-last" | "topic-several" | "topic-one" | "post-image" | "post-no-image";
  path: string;
}

/** The 22 sampled pages: the index plus seven screens for each direction. */
export const PAGES: PrototypePage[] = [
  { name: "index", screen: "index", path: INDEX_PATH },
  ...DIRECTION_IDS.flatMap((d): PrototypePage[] => [
    { name: `${d} landing`, direction: d, screen: "landing", path: landingPath(d) },
    { name: `${d} listing, first page`, direction: d, screen: "listing-first", path: listingPath(d, 1) },
    { name: `${d} listing, last page`, direction: d, screen: "listing-last", path: listingPath(d, 3) },
    { name: `${d} topic, several posts`, direction: d, screen: "topic-several", path: topicPath(d, "agentic-ai-legacy") },
    { name: `${d} topic, one post`, direction: d, screen: "topic-one", path: topicPath(d, "healthcare-leadership") },
    { name: `${d} post with image`, direction: d, screen: "post-image", path: postPath(d, withImage) },
    { name: `${d} post without image`, direction: d, screen: "post-no-image", path: postPath(d, withoutImage) },
  ]),
];

export async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
}

export async function openPage(page: Page, path: string, theme: "dark" | "light" = "dark") {
  await setTheme(page, theme);
  const response = await page.goto(path);
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
  return response;
}

export const stripScripts = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

export async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
}

export { cspViolations, recordCspViolations, byNewest };

// ---------------------------------------------------------------------------
// Sanity: the page list matches the contract.
// ---------------------------------------------------------------------------
test("lists 22 prototype pages", () => {
  expect(PAGES).toHaveLength(22);
  expect(new Set(PAGES.map((p) => p.path)).size).toBe(22);
});

// ---------------------------------------------------------------------------
// Global: prototypes stay out of the sitemap and the site navigation.
// ---------------------------------------------------------------------------
test.describe("prototypes stay hidden", () => {
  test("the sitemap files list no /design/ address", async ({ request }) => {
    const index = await (await request.get("/sitemap-index.xml")).text();
    const sitemaps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
    expect(sitemaps.length).toBeGreaterThan(0);
    for (const path of sitemaps) {
      const xml = await (await request.get(path)).text();
      const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
      expect(entries.length).toBeGreaterThan(0);
      for (const entry of entries) expect(entry.startsWith("/design/"), entry).toBe(false);
    }
  });

  for (const template of TEMPLATES) {
    test(`neither the header nor the footer of ${template.name} links to /design/`, async ({ page }) => {
      await page.goto(template.path);
      const hrefs = await page.locator("header a[href], footer a[href]").evaluateAll((links) =>
        links.map((link) => link.getAttribute("href") ?? ""),
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) expect(href.startsWith("/design/"), href).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Directions index (FR-005, FR-017, SC-004).
// ---------------------------------------------------------------------------
test.describe("directions index", () => {
  test("returns 200 with noindex, no canonical, a Prototype title, the notice and one h1", async ({ page }) => {
    const response = await page.goto(INDEX_PATH);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    expect(await page.title()).toMatch(/^Prototype/);
    await expect(page.locator("[data-prototype-notice]")).toContainText(
      "Design prototype for review. This is not the published blog.",
    );
    await expect(page.locator("h1")).toHaveCount(1);
  });

  for (const direction of directions) {
    test(`presents Direction ${direction.id.toUpperCase()} with its summary, no-featured sentence and links`, async ({
      page,
    }) => {
      await page.goto(INDEX_PATH);
      const section = page.locator(`[data-direction="${direction.id}"]`);
      await expect(section).toHaveCount(1);
      await expect(section).toContainText(direction.name);
      await expect(section).toContainText(direction.summary);
      await expect(section.locator('[data-role="no-featured"]')).toContainText(direction.noFeaturedBehaviour);

      for (const kind of ["landing", "listing", "post"] as const) {
        const link = section.locator(`a[data-link="${kind}"]`);
        await expect(link).toHaveCount(1);
        expect(await link.getAttribute("href"), kind).toBeTruthy();
      }
      const expected = {
        landing: landingPath(direction.id),
        listing: listingPath(direction.id, 1),
        post: postPath(direction.id, byNewest[0]!),
      };
      await expect(section.locator('a[data-link="landing"]')).toHaveAttribute("href", expected.landing);
      await expect(section.locator('a[data-link="listing"]')).toHaveAttribute("href", expected.listing);
      await expect(section.locator('a[data-link="post"]')).toHaveAttribute("href", expected.post);
    });
  }

  // Stays red until the direction pages exist (Phase 3, T015-T017).
  for (const direction of directions) {
    test(`every link from the Direction ${direction.id.toUpperCase()} section returns 200`, async ({ page, request }) => {
      await page.goto(INDEX_PATH);
      for (const link of await page.locator(`[data-direction="${direction.id}"] a`).all()) {
        const href = await link.getAttribute("href");
        expect((await request.get(href!)).status(), href!).toBe(200);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// User Story 1 (T014): every direction page exists, is furnished as a
// prototype, links onward, and the directions differ in structure.
// ---------------------------------------------------------------------------
const DIRECTION_PAGES = PAGES.filter((p) => p.direction);
const others = (d: DirectionId) => DIRECTION_IDS.filter((x) => x !== d);

/** Every generated prototype page (FR-017), enumerated from the sample data. */
function allGeneratedPaths(d: DirectionId): string[] {
  const listing = [1, 2, 3].map((n) => listingPath(d, n));
  const topicPaths = [...new Set(posts.flatMap((p) => p.topics))].map((t) => topicPath(d, t));
  return [landingPath(d), ...listing, ...topicPaths, ...posts.map((p) => postPath(d, p))];
}

test.describe("US1: direction pages", () => {
  for (const p of DIRECTION_PAGES) {
    test(`${p.name}: furniture, headings and links`, async ({ page, request }) => {
      const response = await page.goto(p.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      expect(await page.title()).toMatch(/^Prototype/);
      await expect(page.locator("[data-prototype-notice]")).toHaveCount(1);
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main")).toContainText("Drift & Convergence");
      await expect(page.locator("a[href='#main']").first()).toBeAttached();

      // No skipped heading levels inside main.
      const levels = await page
        .locator("main :is(h1,h2,h3,h4,h5,h6)")
        .evaluateAll((hs) => hs.map((h) => Number(h.tagName.slice(1))));
      for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!, p.path).toBeLessThanOrEqual(1);

      // Notice links: index and the same screen elsewhere (FR-005).
      const notice = page.locator("[data-prototype-notice]");
      await expect(notice.locator('a[href="/design/blog/"]')).toHaveCount(1);
      for (const other of others(p.direction!)) {
        await expect(notice.locator(`a[data-other-direction="${other}"]`)).toHaveCount(1);
      }

      // Links resolve; none point at the real blog.
      const hrefs = await page
        .locator("main a[href]")
        .evaluateAll((links) => links.map((l) => l.getAttribute("href") ?? ""));
      for (const href of new Set(hrefs)) {
        expect(href.startsWith("/writing"), href).toBe(false);
        if (href.startsWith("/") && !href.startsWith("//")) {
          expect((await request.get(href)).status(), href).toBe(200);
        }
      }
    });
  }

  for (const d of DIRECTION_IDS) {
    test(`Direction ${d.toUpperCase()}: landing reaches the listing and a post within two clicks of the index`, async ({
      page,
    }) => {
      await page.goto(INDEX_PATH);
      await page.locator(`[data-direction="${d}"] a[data-link="landing"]`).click();
      await expect(page).toHaveURL(landingPath(d));
      const hrefs = await page.locator("main a[href]").evaluateAll((ls) => ls.map((l) => l.getAttribute("href")!));
      expect(hrefs).toContain(listingPath(d, 1));
      expect(hrefs.some((h) => posts.some((post) => h === postPath(d, post)))).toBe(true);
    });

    test(`Direction ${d.toUpperCase()}: every generated page has the prototype furniture (FR-017)`, async ({
      request,
    }) => {
      for (const path of allGeneratedPaths(d)) {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        const html = await response.text();
        expect(html, path).toMatch(/<meta name="robots" content="noindex"/);
        expect(html, path).not.toMatch(/rel="canonical"/);
        expect(html, path).toMatch(/<title>Prototype/);
        expect(html, path).toContain("data-prototype-notice");
      }
    });
  }

  test("A: lead story and featured bento region", async ({ page }) => {
    await page.goto(landingPath("a"));
    await expect(page.locator("[data-lead-story]")).toHaveCount(1);
    await expect(page.locator("[data-bento] [data-featured]").first()).toBeVisible();
  });

  test("B: Start here list and month grouping", async ({ page }) => {
    await page.goto(landingPath("b"));
    await expect(page.getByRole("heading", { name: "Start here" })).toBeVisible();
    expect(await page.locator("[data-month-group]").count()).toBeGreaterThan(1);
  });

  test("C: topic hub regions and a topic index", async ({ page }) => {
    await page.goto(landingPath("c"));
    expect(await page.locator("[data-topic-hub]").count()).toBe(4);
    await page.goto(listingPath("c", 1));
    await expect(page.locator("[data-topic-index]").first()).toBeAttached();
  });
});

// ---------------------------------------------------------------------------
// User Story 2 (T019): each direction shows everything a reader will need.
// ---------------------------------------------------------------------------
const topicSlugs = [...new Set(posts.flatMap((p) => p.topics))];
const newest = byNewest[0]!;
const featuredList = posts.filter((p) => p.featured);
const longTitle = posts.reduce((a, b) => (b.title.length > a.title.length ? b : a));
const manyTopics = posts.reduce((a, b) => (b.topics.length > a.topics.length ? b : a));
const lastPageCount = posts.length - 5 * 2;
const hrefsIn = (scope: Locator, selector: string) =>
  scope.locator(selector).evaluateAll((ls) => ls.map((l) => l.getAttribute("href") ?? ""));

test.describe("US2: reader needs", () => {
  for (const d of DIRECTION_IDS) {
    test.describe(`Direction ${d.toUpperCase()}`, () => {
      for (const viewport of [
        { name: "desktop", width: 1280, height: 800, limit: 800 },
        { name: "phone", width: 390, height: 844, limit: 844 * 2 },
      ]) {
        test(`landing shows the newest post within the first ${viewport.name} viewport(s)`, async ({ page }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(landingPath(d));
          const link = page.locator(`main a[href="${postPath(d, newest)}"]`).first();
          await expect(link).toBeVisible();
          const box = (await link.boundingBox())!;
          const scrollY = await page.evaluate(() => window.scrollY);
          expect(box.y + scrollY).toBeLessThan(viewport.limit);
        });
      }

      test("landing sets featured posts apart with a visible Featured marker", async ({ page }) => {
        await page.goto(landingPath(d));
        const region = { a: "[data-bento]", b: "section:has(> #start-here)", c: "[data-topic-hub]" }[d];
        expect(await page.locator(region).count()).toBeGreaterThan(0);
        const hrefs = await hrefsIn(page.locator(region), "a");
        const shown = featuredList.filter((p) => hrefs.includes(postPath(d, p)));
        expect(shown.length).toBeGreaterThan(0);
        const markers = page.locator("main [data-featured]");
        expect(await markers.count()).toBeGreaterThan(0);
        for (const marker of await markers.all()) {
          await expect(marker).toBeVisible();
          await expect(marker).toHaveText("Featured");
        }
      });

      test("landing links to the listing and every topic", async ({ page }) => {
        await page.goto(landingPath(d));
        const hrefs = await hrefsIn(page.locator("main"), "a[href]");
        expect(hrefs).toContain(listingPath(d, 1));
        for (const t of topicSlugs) expect(hrefs, t).toContain(topicPath(d, t));
      });

      test("listing pages show posts newest first, five per page, with pagination edges", async ({ page }) => {
        const all: string[] = [];
        for (const n of [1, 2, 3]) {
          await page.goto(listingPath(d, n));
          const articles = page.locator("main article");
          expect(await articles.count()).toBe(n === 3 ? lastPageCount : 5);
          all.push(
            ...(await articles.evaluateAll((els) => els.map((el) => el.querySelector("time")!.getAttribute("datetime")!))),
          );
          const nav = page.getByRole("navigation", { name: "Pagination" });
          await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
          await expect(nav.locator('[aria-current="page"]')).toContainText(String(n));
          await expect(nav.getByRole("link", { name: /Newer/ })).toHaveCount(n === 1 ? 0 : 1);
          await expect(nav.getByRole("link", { name: /Older/ })).toHaveCount(n === 3 ? 0 : 1);
        }
        expect(all).toEqual(byNewest.map((p) => p.date));
      });

      test("topic pages name the topic, introduce it above its posts and link onward", async ({ page }) => {
        for (const t of topicSlugs) {
          await page.goto(topicPath(d, t));
          const topic = topicBySlug(t);
          await expect(page.locator("h1")).toHaveText(topic.name);
          const intro = page.getByText(topic.intro, { exact: true });
          await expect(intro).toBeVisible();
          const introBox = (await intro.boundingBox())!;
          const firstPost = (await page.locator("main article").first().boundingBox())!;
          expect(introBox.y, t).toBeLessThan(firstPost.y);
          const hrefs = await hrefsIn(page.locator("main"), "a[href]");
          expect(hrefs).toContain(listingPath(d, 1));
          for (const other of topicSlugs.filter((x) => x !== t)) expect(hrefs, other).toContain(topicPath(d, other));
        }
      });

      test("the one-post topic renders its single post", async ({ page }) => {
        await page.goto(topicPath(d, "healthcare-leadership"));
        const inTopic = posts.filter((p) => p.topics.includes("healthcare-leadership"));
        expect(inTopic).toHaveLength(1);
        await expect(page.locator("main article")).toHaveCount(1);
        await expect(page.locator(`main article a[href="${postPath(d, inTopic[0]!)}"]`)).toHaveCount(1);
      });

      test("every post presentation shows title, date, reading time, topics and summary", async ({ page }) => {
        const screens = [landingPath(d), listingPath(d, 1), listingPath(d, 3), topicPath(d, "agentic-ai-legacy")];
        for (const path of screens) {
          await page.goto(path);
          const articles = await page.locator("main article").all();
          expect(articles.length, path).toBeGreaterThan(0);
          for (const article of articles) {
            await expect(article.locator("h2, h3, h4").first().locator("a")).toHaveCount(1);
            await expect(article.locator("time[datetime]")).toHaveCount(1);
            await expect(article).toContainText(/\d+ min read/);
            const topicLinks = await hrefsIn(article, "a[data-topic]");
            expect(topicLinks.length, path).toBeGreaterThan(0);
            for (const href of topicLinks) expect(topicSlugs.some((t) => href === topicPath(d, t)), href).toBe(true);
            expect(((await article.locator("p").first().textContent()) ?? "").trim().length, path).toBeGreaterThan(20);
          }
        }
        for (const post of [withImage, withoutImage]) {
          await page.goto(postPath(d, post));
          await expect(page.locator("main time[datetime]").first()).toBeVisible();
          await expect(page.locator("main")).toContainText(/\d+ min read/);
          expect((await hrefsIn(page.locator("main"), "a[data-topic]")).length).toBeGreaterThan(0);
          await expect(page.locator("main")).toContainText(post.summary);
        }
      });

      test("post pages have image with caption and alt, code, table and three related posts", async ({ page }) => {
        for (const post of [withImage, withoutImage]) {
          await page.goto(postPath(d, post));
          const figure = page.locator("main article figure");
          await expect(figure).toHaveCount(1);
          await expect(figure.locator("figcaption")).not.toBeEmpty();
          await expect(figure.locator("[role=img][aria-label]")).toHaveCount(1);
          const regions = page.locator("main [role=region][tabindex='0']");
          await expect(regions.filter({ has: page.locator("code") })).toHaveCount(1);
          await expect(regions.filter({ has: page.locator("table") })).toHaveCount(1);
          for (const region of await regions.all()) expect(await region.getAttribute("aria-label")).toBeTruthy();
          const related = page.locator("section:has(> h2#related)");
          await expect(related.getByRole("heading", { level: 2, name: "Related posts" })).toBeVisible();
          const postHrefs = (await hrefsIn(related, "a[href]")).filter((h) => posts.some((p) => h === postPath(d, p)));
          expect(new Set(postHrefs).size).toBe(3);
        }
      });

      test("related posts show their date and reading time", async ({ page }) => {
        await page.goto(postPath(d, withImage));
        const times = page.locator("section:has(> h2#related) time[datetime]");
        expect(await times.count()).toBeGreaterThanOrEqual(3);
      });

      test("long-title and many-topics posts do not overflow at 390 px", async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        const paths = [postPath(d, longTitle), postPath(d, manyTopics), landingPath(d), listingPath(d, 1), listingPath(d, 2), listingPath(d, 3)];
        for (const path of paths) {
          await page.goto(path);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, path).toBeLessThanOrEqual(0);
        }
      });
    });
  }
});
