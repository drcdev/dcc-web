// Blog design prototypes (specs/005-blog-design-directions): page furniture,
// structure and accessibility checks for the throwaway routes under
// /design/blog/. The page list is built from the sample data, never
// hard-coded twice (contracts/prototype-routes.md). Prototype-only: deleted
// with the prototypes (task T041). The prototypes are deliberately not added
// to TEMPLATES, the visual project or a11y.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  byNewest,
  directions,
  landingPath,
  listingPath,
  posts,
  postPath,
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
