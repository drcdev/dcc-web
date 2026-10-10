// The projects index on the fixture site (port 4322, playwright.config.ts project
// `sections`). The fixture site holds the five fixture projects only (tests/fixtures/projects:
// draft, minimal, every-part, every-setting, retired), so the counts and the order below are fixed
// and filtering, clearing, sharing and the unknown-theme message have something to work on (US4;
// contracts/filter-island.md; FR-014). Where the real content guarantees live: every real project
// listed with a link is projects.spec.ts "the projects index ... one row for every project" (port
// 4321), and real projects sitting among others newest first is the order rule in
// tests/unit/content/project-order.test.ts.
import { expect, test, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const INDEX = "/projects/";
// The fixture site is not a production build, so the draft fixture counts: five projects, two of
// them (draft, minimal) on Tooling.
const ALL = 5;
const TOOLING = 2;
const rows = (page: Page) => page.locator("[data-project]:not([hidden])");
const status = (page: Page) => page.locator("[data-filter-status]");

test("lists every project, with the controls ready", async ({ page }) => {
  await page.goto(INDEX);
  await expect(page.locator("project-filter[data-ready]")).toHaveCount(1);
  await expect(rows(page)).toHaveCount(ALL);
  await expect(status(page)).toHaveText(`Showing all ${ALL} projects.`);
  await expect(page.getByRole("group", { name: "Filter by theme" })).toBeVisible();
  await expect(page.locator("[data-filter-all]")).toHaveAttribute("aria-pressed", "true");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the filter element lists every project and hides its controls, status and empty message", async ({ page }) => {
    await page.goto(INDEX);
    await expect(page.locator("project-filter")).toHaveCount(1);
    await expect(page.locator("[data-project]")).toHaveCount(ALL);
    for (const row of await page.locator("[data-project]").all()) await expect(row).toBeVisible();
    await expect(page.locator("[data-filter-controls]")).toBeHidden();
    await expect(page.locator("[data-filter-status]")).toBeHidden();
    await expect(page.locator("[data-filter-empty]")).toBeHidden();
  });
});

test("theme variants collapse to one button", async ({ page }) => {
  await page.goto(INDEX);
  // Tooling is on two fixtures and AI integration on one: one button each.
  await expect(page.locator('button[data-theme="tooling"]')).toHaveCount(1);
  await expect(page.locator('button[data-theme="ai-integration"]')).toHaveCount(1);
});

test("filters by theme, announces the count and clears", async ({ page }) => {
  await page.goto(INDEX);
  await page.locator('button[data-theme="tooling"]').click();
  await expect(rows(page)).toHaveCount(TOOLING);
  await expect(status(page)).toHaveText(`Showing ${TOOLING} projects about Tooling.`);
  await expect(page).toHaveURL(/\/projects\/\?theme=tooling$/);
  await expect(page.locator('button[data-theme="tooling"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-filter-all]").click();
  await expect(rows(page)).toHaveCount(ALL);
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(status(page)).toHaveText(`Showing all ${ALL} projects.`);
});

test("keeps focus on the pressed button", async ({ page }) => {
  await page.goto(INDEX);
  const button = page.locator('button[data-theme="macos"]');
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toBeFocused();
});

test("reloading or sharing ?theme= applies the filter", async ({ page }) => {
  await page.goto(`${INDEX}?theme=tooling`);
  await expect(rows(page)).toHaveCount(TOOLING);
  await expect(page.locator('button[data-theme="tooling"]')).toHaveAttribute("aria-pressed", "true");
  await expect(status(page)).toHaveText(`Showing ${TOOLING} projects about Tooling.`);
  await page.reload();
  await expect(rows(page)).toHaveCount(TOOLING);
});

test("an unknown theme lists nothing, says so and keeps the address until cleared", async ({ page }) => {
  await page.goto(`${INDEX}?theme=nonsense`);
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator("[data-filter-empty]")).toBeVisible();
  await expect(status(page)).toHaveText("No projects match this theme.");
  await expect(page).toHaveURL(/\?theme=nonsense$/);
  await page.getByRole("button", { name: "Show all projects" }).click();
  await expect(rows(page)).toHaveCount(ALL);
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator("[data-filter-empty]")).toBeHidden();
  await expect(page.locator("[data-filter-all]")).toBeFocused();
});

test("an unknown ?theme= with markup renders nothing from it and is not repeated", async ({ page }) => {
  await page.goto(`${INDEX}?theme=${encodeURIComponent("<img src=x onerror=window.__x=1>")}`);
  await expect(page.locator("[data-filter-empty]")).toBeVisible();
  await expect(page.locator("main img[src='x']")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { __x?: number }).__x)).toBeUndefined();
  await expect(status(page)).not.toContainText("img");
  await expect(page.locator("main")).not.toContainText("onerror");
});

test("changing the filter twice then pressing Back leaves the index (no history entries)", async ({ page }) => {
  await page.goto("/");
  await page.goto(INDEX);
  await page.locator('button[data-theme="tooling"]').click();
  await page.locator('button[data-theme="macos"]').click();
  await expect(page).toHaveURL(/\?theme=macos$/);
  await page.goBack();
  await expect(page).not.toHaveURL(/projects/);
});

test("going back from a story restores the index with its ?theme=", async ({ page }) => {
  await page.goto(`${INDEX}?theme=tooling`);
  await expect(rows(page)).toHaveCount(TOOLING);
  await rows(page).first().locator("h2 a").click();
  await page.goBack();
  await expect(page).toHaveURL(/\/projects\/\?theme=tooling$/);
  await expect(rows(page)).toHaveCount(TOOLING);
  await expect(page.locator('button[data-theme="tooling"]')).toHaveAttribute("aria-pressed", "true");
});

test("the header Projects link always opens the unfiltered index", async ({ page }) => {
  await page.goto(`${INDEX}?theme=tooling`);
  await page.locator('#primary-nav-list a[href="/projects/"]').click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(rows(page)).toHaveCount(ALL);
  await expect(page.locator("[data-filter-all]")).toHaveAttribute("aria-pressed", "true");
});

test("announces the status as a polite live region", async ({ page }) => {
  await page.goto(INDEX);
  await expect(status(page)).toHaveAttribute("aria-live", "polite");
  await expect(status(page)).toHaveAttribute("role", "status");
  await page.locator('button[data-theme="tooling"]').click();
  await page.locator('button[data-theme="tooling"]').click();
  await expect(status(page)).toHaveText(`Showing ${TOOLING} projects about Tooling.`);
});

test("filter targets are at least 24x24 px", async ({ page }) => {
  await page.goto(INDEX);
  for (const button of await page.locator("project-filter button:visible").all()) {
    const box = await button.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  }
});

test("lists projects newest first", async ({ page }) => {
  await page.goto(INDEX);
  const slugs = await rows(page).evaluateAll((els) => els.map((el) => el.getAttribute("data-project")));
  // Fixture dates: draft 2026-01-02, minimal 2026-01-01, every-part 2025-12-01, every-setting 2025-06-01, retired 2025-01-01.
  expect(slugs).toEqual(["draft", "minimal", "every-part", "every-setting", "retired"]);
});

test("row title links are at least 24x24 px (FR-027)", async ({ page }) => {
  await page.goto(INDEX);
  const links = await page.locator("[data-project] [data-project-title] a:visible").all();
  expect(links.length).toBe(ALL);
  for (const link of links) {
    const box = await link.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  }
});

test("buttons wrap and the page does not scroll sideways at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(INDEX);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  const tops = new Set<number>();
  for (const button of await page.locator("project-filter button:visible").all()) {
    tops.add(Math.round((await button.boundingBox())!.y));
  }
  expect(tops.size).toBeGreaterThan(1);
});

// US6: a live demo is a plain link, never a frame (specs/014-project-four-part-story, FR-008). The
// demo address is answered locally so the run needs no network.
test.describe("demos", () => {
  test("a live demo is one same-tab link in Build, with no frame and no CSP violation", async ({ page }) => {
    await recordCspViolations(page);
    const requested: string[] = [];
    await page.route("https://demo.drc.dev/**", (route) => {
      requested.push(route.request().url());
      return route.abort();
    });
    await page.goto("/projects/every-setting/");
    await page.locator('[data-part="build"]').scrollIntoViewIfNeeded();
    await expect(page.locator("iframe")).toHaveCount(0);
    const link = page.getByRole("link", { name: "Open the Every setting demo" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://demo.drc.dev/every-setting");
    await expect(link).not.toHaveAttribute("target", /.+/);
    await expect(page.locator('[data-part="build"] [data-build-links] a[href^="https://demo.drc.dev"]')).toHaveCount(1);
    expect(requested, "the page never loads the demo itself").toEqual([]);
    expect(await cspViolations(page)).toEqual([]);
  });

  test("a stand-in story has no frame and says it is not a live demo", async ({ page }) => {
    await page.goto("/projects/every-part/");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Every part stand-in" })).toBeVisible();
    await expect(page.getByText("This is not a live demo.")).toBeVisible();
  });

  test("a story page has no video", async ({ page }) => {
    await page.goto("/projects/every-setting/");
    await expect(page.locator("video")).toHaveCount(0);
  });
});

// FR-080: a story with its own sharing image uses it (resized) instead of the site default.
test("a story with its own sharing image shares that image and its alt text", async ({ page, request }) => {
  await page.goto("/projects/every-setting/");
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toBeTruthy();
  expect(image).not.toContain("og-default");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "A sharing image");
  const response = await request.get(new URL(image!).pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});

// US8: a story with a picture on every part (tests/fixtures/projects/every-part.mdx).
test.describe("the every-part story", () => {
  test("renders four parts each with a picture beside it, a sub-heading, a plain table, the links and the invitation", async ({
    page,
  }) => {
    await page.goto("/projects/every-part/");
    await expect(page.locator("section[data-part]")).toHaveCount(4);
    await expect(page.locator("[data-part-picture]")).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "A sub-heading", level: 3 })).toBeVisible();
    // The Build table is the writer's own plain table; the Options table is the component's region.
    await expect(page.locator('[data-part="build"] table')).toHaveCount(1);
    await expect(page.locator('[data-part="build"] [data-options-table]')).toHaveCount(0);
    await expect(page.locator('[data-part="options"] [data-options-table]')).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Every part stand-in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Source code for Every part" })).toBeVisible();
    await expect(page.locator("[data-invitation-text]")).toHaveText("If you have a problem shaped like this one, tell me about it.");
    await expect(page.locator('a[href="/contact/?project=every-part"]')).toHaveCount(1);
  });

  test("loads the first picture eagerly and the others lazily", async ({ page }) => {
    await page.goto("/projects/every-part/");
    const loading = await page.locator("[data-part-picture] img").evaluateAll((els) => els.map((el) => el.getAttribute("loading")));
    expect(loading).toEqual(["eager", "lazy", "lazy", "lazy"]);
  });

  test("the comparison scrolls with the keyboard at a narrow width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/projects/every-part/");
    const region = page.locator("[data-options-table]");
    await region.scrollIntoViewIfNeeded();
    await region.focus();
    await expect(region).toBeFocused();
    expect(await region.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});

// SC-002, US2-1: only a browser shows that the note's link is followed in one click, in the same tab.
test("the retired story's note links to the replacement story in the same tab", async ({ page }) => {
  await page.goto("/projects/retired/");
  const link = page.locator("[data-retired-note] a");
  await expect(link).toHaveText("Minimal project");
  await link.click();
  await expect(page).toHaveURL(/\/projects\/minimal\/$/);
  await expect(page.locator("[data-story-title]")).toHaveText("Minimal project");
});
