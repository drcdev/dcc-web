// Pagination on the fixture site (port 4322, playwright.config.ts project `sections`; specs/008-blog
// tasks.md T057; FR-012). The fixture site has the site's own posts (drafts included), the three
// fixture posts (text-only, long-title and every-part) and 13 generated posts, so the all posts
// listing and the agentic-ai topic (which every generated post carries) each have a second page at
// least. The counts are computed from the content: every page but the last holds blog.pageSize posts.
import { test, expect } from "@playwright/test";
import { blog } from "../../src/config/blog.ts";
import { FIXTURE_POSTS, generateFixturePosts } from "../../scripts/build-fixture-site.ts";
import { posts, readEntries } from "../helpers/content.ts";

const ALL = "/writing/all/";
const TOPIC = "/writing/topics/agentic-ai/";

const topicsOf = (entry: { data: Record<string, unknown> }) => (entry.data.topics as string[] | undefined) ?? [];
const fixtureOwned = readEntries("posts", "tests/fixtures/posts/valid").filter((entry) =>
  (FIXTURE_POSTS as readonly string[]).includes(`${entry.slug}.mdx`),
);
// Every post's topics on the fixture site; it is not a production build, so drafts are listed.
const SITE_TOPICS = [
  ...[...posts, ...fixtureOwned].map(topicsOf),
  ...generateFixturePosts().map((post) => [...post.source.matchAll(/^ {2}- (.*)$/gm)].map((match) => match[1]!)),
];
const TOTALS = new Map<string, number>([
  [ALL, SITE_TOPICS.length],
  [TOPIC, SITE_TOPICS.filter((list) => list.includes("agentic-ai")).length],
]);
for (const [first, total] of TOTALS) {
  // Page 2 must exist, which the cases below rely on; the 13 generated posts guarantee it.
  if (total <= blog.pageSize) {
    throw new Error(`tests/e2e/blog-pagination.spec.ts: ${first} has ${total} posts; the cases need a second page.`);
  }
}

for (const [name, first] of [
  ["all posts", ALL],
  ["topic", TOPIC],
] as const) {
  const total = TOTALS.get(first)!;
  const last = Math.ceil(total / blog.pageSize);
  test.describe(`${name} pagination`, () => {
    test("pages from 1 to 2 and back, marking the current page", async ({ page }) => {
      await page.goto(first);
      const pages = page.getByRole("navigation", { name: "Pages" });
      await expect(pages).toBeVisible();
      await expect(pages.getByRole("link", { name: "Previous page" })).toHaveCount(0);
      await expect(pages.locator('[aria-current="page"]')).toHaveText("1");
      await expect(page.locator("main [data-post-card]")).toHaveCount(blog.pageSize);

      await pages.getByRole("link", { name: "Next page" }).click();
      await page.waitForURL(`**${first}2/`);
      await expect(page.getByRole("navigation", { name: "Pages" }).locator('[aria-current="page"]')).toHaveText("2");
      await expect(page.locator("main [data-post-card]")).toHaveCount(Math.min(blog.pageSize, total - blog.pageSize));
      await expect(page.locator("main h1")).toContainText("page 2");
      expect(await page.title()).toContain(", page 2 · ");
      // Only the last page has no Next link.
      await expect(page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Next page" })).toHaveCount(
        last === 2 ? 0 : 1,
      );

      await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Previous page" }).click();
      await page.waitForURL(`**${first}`);
      await expect(page.locator("main [data-post-card]")).toHaveCount(blog.pageSize);
    });

    test("links every page number by its accessible name and page 1 to the bare address", async ({ page }) => {
      await page.goto(`${first}2/`);
      const pages = page.getByRole("navigation", { name: "Pages" });
      await expect(pages.getByRole("link", { name: "Page 1", exact: true })).toHaveAttribute("href", first);
      await expect(pages.locator('[aria-current="page"]')).toHaveText("2");
      await expect(pages.locator('[aria-current="page"]')).not.toHaveAttribute("href", /.*/);
    });

    test("gives each pagination link a target of at least 24 by 24 CSS px", async ({ page }) => {
      await page.goto(first);
      const boxes = await page
        .getByRole("navigation", { name: "Pages" })
        .locator("a, [aria-current]")
        .evaluateAll((els) =>
          els.map((el) => {
            const { width, height } = el.getBoundingClientRect();
            return { width, height };
          }),
        );
      expect(boxes.length).toBeGreaterThan(0);
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    test("returns the not-found page for page 1 and for a page past the last", async ({ page }) => {
      for (const path of [`${first}1/`, `${first}${last + 1}/`]) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(404);
      }
    });
  });
}
