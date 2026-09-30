// Accessibility of the blog templates the default build cannot show (specs/008-blog/tasks.md T093;
// FR-039, FR-014). Runs in the `a11y` project (the file name matches its testMatch) with the same
// axe WCAG 2.2 AA conditions as a11y.spec.ts and the structure checks of blog.a11y.spec.ts:
//   (a) the fixture site on port 4322: all posts page 2 and the page-2 topic (17 posts, every
//       generated post on `agentic-ai`);
//   (b) the empty landing, all posts and topic pages, from a production-mode build made here
//       (WORKERS_CI=1, WORKERS_CI_BRANCH=main, so the sample drafts are left out) and served from its
//       dist/ through `page.route`, with no extra web server.
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { buildFixtureSite, type FixtureSiteResult } from "../build/fixture-site.ts";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];
const THEMES = ["dark", "light"] as const;
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;
const MENU_BUTTON = 'button[aria-controls="primary-nav-list"]';
const SUFFIX = " · Don Coleman";
const EMPTY_ORIGIN = "http://empty-site.test";
const stripScripts = (html: string) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

interface Target {
  name: string;
  /** Address the browser opens. */
  url: string;
  /** The exact document title. */
  title: string;
  /** Serve from this build's dist/ instead of the network. */
  dist?: () => string;
}

let empty: FixtureSiteResult | undefined;
const emptyDist = () => empty!.dist;

const TARGETS: Target[] = [
  {
    name: "all posts page 2 (fixture site)",
    url: "http://localhost:4322/writing/all/2/",
    title: `All posts, page 2${SUFFIX}`,
  },
  {
    name: "page 2 of a topic (fixture site)",
    url: "http://localhost:4322/writing/topics/agentic-ai/2/",
    title: `Agentic AI in legacy environments, page 2${SUFFIX}`,
  },
  { name: "empty landing", url: `${EMPTY_ORIGIN}/writing/`, title: `Writing${SUFFIX}`, dist: emptyDist },
  { name: "empty all posts", url: `${EMPTY_ORIGIN}/writing/all/`, title: `All posts${SUFFIX}`, dist: emptyDist },
  {
    name: "empty topic page",
    url: `${EMPTY_ORIGIN}/writing/topics/agentic-ai/`,
    title: `Agentic AI in legacy environments${SUFFIX}`,
    dist: emptyDist,
  },
];

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

/** Serves the empty-site build from its dist/ under a made-up origin, so no web server is needed. */
async function serveDist(context: BrowserContext, dist: string, transform?: (html: string) => string) {
  await context.route(`${EMPTY_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    let file = normalize(join(dist, decodeURIComponent(pathname)));
    if (!file.startsWith(dist)) return route.fulfill({ status: 403 });
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "Not found" });
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    const body = readFileSync(file);
    await route.fulfill({
      status: 200,
      contentType: type,
      body: transform && type.startsWith("text/html") ? transform(body.toString("utf-8")) : body,
    });
  });
}

async function setTheme(page: Page, theme: "dark" | "light") {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
}

async function open(page: Page, target: Target, options: { stripped?: boolean } = {}) {
  if (target.dist) {
    await serveDist(page.context(), target.dist(), options.stripped ? stripScripts : undefined);
  } else if (options.stripped) {
    await page.route(`${target.url}`, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: stripScripts(await response.text()) });
    });
  }
  await page.goto(target.url);
}

const expectNoAxeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations).toEqual([]);
};

// One worker runs the whole file, so the production-mode build in `beforeAll` happens once.
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  // Only the empty-site targets need the build; the others use the running fixture site.
  test.setTimeout(600_000);
  empty = await buildFixtureSite([], { env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" } });
  expect(empty.message).toBe("");
});

test.afterAll(() => empty?.cleanup());

for (const target of TARGETS) {
  test.describe(target.name, () => {
    for (const size of SIZES) {
      for (const theme of THEMES) {
        test(`has zero axe violations at ${size.name} width in the ${theme} theme`, async ({ page }) => {
          await page.setViewportSize({ width: size.width, height: size.height });
          await setTheme(page, theme);
          await open(page, target);
          await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
          await expectNoAxeViolations(page);
        });
      }
    }

    for (const theme of THEMES) {
      test(`has zero axe violations with the mobile menu open in the ${theme} theme`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await setTheme(page, theme);
        await open(page, target);
        const button = page.locator(MENU_BUTTON);
        await button.click();
        await expect(button).toHaveAttribute("aria-expanded", "true");
        await expectNoAxeViolations(page);
      });
    }

    test("has zero axe violations without scripts at phone width", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      // axe needs script execution, so the response is served with its scripts removed (as a11y.spec.ts does).
      await open(page, target, { stripped: true });
      await expect(page.locator(MENU_BUTTON)).toBeHidden();
      await expect(page.locator("#primary-nav-list")).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test("has one h1, no skipped heading levels, the landmarks and the title of FR-048", async ({ page }) => {
      await open(page, target);
      await expect(page.locator("h1")).toHaveCount(1);
      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll("main h1,main h2,main h3,main h4,main h5,main h6")).map((el) =>
          Number(el.tagName.slice(1)),
        ),
      );
      expect(levels[0]).toBe(1);
      let previous = 0;
      for (const level of levels) {
        expect(level - previous).toBeLessThanOrEqual(1);
        previous = level;
      }
      expect(await page.title()).toBe(target.title);
      await expect(page.getByRole("link", { name: "Skip to main content" })).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
    });

    test("does not scroll sideways at 320 px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await open(page, target);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  });
}
