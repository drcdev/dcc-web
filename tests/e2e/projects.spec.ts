// The projects pages on the production build (specs/014-project-four-part-story/contracts/pages-dom.md).
// The story part is here; the index part follows.
import { expect, test, type Locator, type Page } from "@playwright/test";

const STORY = "/projects/focus-pocus/";
const POST = "/writing/sample-everything/";
const PARTS = [
  ["problem", "Problem"],
  ["options", "Options"],
  ["build", "Build"],
  ["lessons", "Lessons"],
] as const;

/** True when the element's top edge is on screen, below the progress bar, and nothing else covers its centre. */
async function isVisibleAndUncovered(page: Page, target: Locator): Promise<{ ok: boolean; info: string }> {
  const result = await target.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const bar = document.querySelector("[data-progress]")?.getBoundingClientRect();
    const barBottom = bar && getComputedStyle(document.querySelector("[data-progress]")!).display !== "none" ? bar.bottom : 0;
    const hit = document.elementFromPoint(rect.left + Math.min(rect.width / 2, 40), rect.top + Math.min(rect.height / 2, 10));
    const covered = !hit || !(hit === el || el.contains(hit) || hit.contains(el));
    return {
      top: rect.top,
      bottom: rect.bottom,
      barBottom,
      innerHeight: window.innerHeight,
      covered,
      hit: hit?.outerHTML.slice(0, 100) ?? "nothing",
    };
  });
  const ok = result.top >= result.barBottom && result.bottom <= result.innerHeight && !result.covered;
  return { ok, info: JSON.stringify(result) };
}

test.describe("the Focus Pocus story", () => {
  test("answers 200 with one h1 and the four parts in order, with no contents list or chapter numbers", async ({ page }) => {
    const response = await page.goto(STORY);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article > header h1")).toHaveCount(1);
    await expect(page.locator("main h2")).toHaveText(PARTS.map(([, heading]) => heading));
    const ids = await page.locator("main section[data-part]").evaluateAll((els) => els.map((el) => el.getAttribute("data-part")));
    expect(ids).toEqual(PARTS.map(([id]) => id));
    for (const [id] of PARTS) {
      await expect(page.locator(`section[data-part="${id}"]`)).toHaveAttribute("aria-labelledby", id);
      await expect(page.locator(`section[data-part="${id}"] h2#${id}`)).toHaveCount(1);
    }
    await expect(page.getByRole("navigation", { name: "In this story" })).toHaveCount(0);
    await expect(page.locator("[data-chapter], [data-reveal], [data-story-contents]")).toHaveCount(0);
    await expect(page.getByText(/Chapter \d of/)).toHaveCount(0);
  });

  test("no part is sized to fill the screen (FR-004)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(STORY);
    for (const part of await page.locator("section[data-part]").all()) {
      const { minHeight, height } = await part.evaluate((el) => ({
        minHeight: getComputedStyle(el).minHeight,
        height: el.getBoundingClientRect().height,
      }));
      expect(minHeight).toMatch(/^(0px|auto|normal)$/);
      expect(height).toBeGreaterThan(0);
    }
  });

  for (const size of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    test(`a part heading is the same size as a post heading at ${size.width}px (FR-003)`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto(POST);
      const postSize = await page.locator("main .prose h2").first().evaluate((el) => getComputedStyle(el).fontSize);
      await page.goto(STORY);
      for (const [id] of PARTS) {
        await expect(page.locator(`section[data-part="${id}"] h2`)).toHaveCSS("font-size", postSize);
      }
    });
  }

  test("a part's picture sits beside its text at 1280px and below it at 390px (FR-005)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(STORY);
    const part = page.locator('section[data-part][data-has-picture="true"]').first();
    await expect(part).toHaveCount(1);
    const wide = {
      text: (await part.locator("[data-part-text]").boundingBox())!,
      picture: (await part.locator("[data-part-picture]").boundingBox())!,
    };
    expect(wide.picture.x).toBeGreaterThanOrEqual(wide.text.x + wide.text.width - 1);
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = {
      text: (await part.locator("[data-part-text]").boundingBox())!,
      picture: (await part.locator("[data-part-picture]").boundingBox())!,
    };
    expect(narrow.picture.y).toBeGreaterThanOrEqual(narrow.text.y + narrow.text.height - 1);
  });

  test("has the comparison as a keyboard-reachable table region with the chosen row marked in words", async ({ page }) => {
    await page.goto(STORY);
    const region = page.locator("[data-options-table]");
    await expect(region).toHaveCount(1);
    await expect(region).toHaveAttribute("role", "region");
    await region.focus();
    await expect(region).toBeFocused();
    await expect(region.getByRole("table")).toBeVisible();
    await expect(region.getByRole("rowheader").filter({ hasText: "Chosen" })).toHaveCount(1);
    await expect(region.locator("tr[data-chosen]")).toHaveCount(1);
    for (const cell of await region.locator("td[data-fit]").all()) await expect(cell).toHaveText(/Yes|Partly|No/);
  });

  test("has a stand-in link and a draft notice, and no iframe", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.getByRole("link", { name: "Focus Pocus on drc.dev" })).toHaveAttribute(
      "href",
      "https://drc.dev/projects/focus-pocus",
    );
    await expect(page.getByText("This is not a live demo.")).toBeVisible();
    await expect(page.locator("[data-draft-notice]")).toHaveCount(1);
    await expect(page.locator("iframe")).toHaveCount(0);
  });

  test("ends with the invitation, after the four parts", async ({ page }) => {
    await page.goto(STORY);
    const order = await page.evaluate(() => {
      const lessons = document.querySelector('section[data-part="lessons"]')!;
      const block = document.querySelector("[data-invitation-block]")!;
      return lessons.compareDocumentPosition(block);
    });
    expect(order & 4 /* DOCUMENT_POSITION_FOLLOWING */).toBeTruthy();
    await expect(page.locator("[data-invitation-text]")).toHaveCount(1);
  });

  test("the invitation opens the contact form about the project, with no cookie and no new origin", async ({
    page,
    context,
  }) => {
    const origins = new Set<string>();
    page.on("request", (request) => origins.add(new URL(request.url()).origin));
    await page.goto(STORY);
    const beforeCookies = await context.cookies();
    const invitation = page.locator("[data-invitation]");
    await expect(invitation).toHaveAttribute("href", "/contact/?project=focus-pocus");
    await invitation.click();
    await expect(page).toHaveURL(/\/contact\/\?project=focus-pocus$/);
    await expect(page.locator("#contact-project")).toHaveText("About: focus-pocus");
    expect(await context.cookies()).toEqual(beforeCookies);
    expect([...origins]).toEqual(["http://127.0.0.1:4321"]);
  });

  test.describe("with motion allowed", () => {
    test.use({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });

    test("shows a progress bar that fills as the page scrolls", async ({ page }) => {
      await page.goto(STORY);
      const bar = page.locator("[data-progress]");
      await expect(bar).toHaveCSS("display", "block");
      const width = () => bar.evaluate((el) => el.getBoundingClientRect().width);
      expect(await width()).toBeLessThan(2);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect.poll(width).toBeGreaterThan(1400);
    });

    test("names the title for the view transition so it carries over from the list", async ({ page }) => {
      await page.goto(STORY);
      await expect(page.locator("h1")).toHaveCSS("view-transition-name", "project-focus-pocus");
      await expect(page.locator("h1")).toHaveAttribute("data-title-slug", "focus-pocus");
    });
  });

  // FR-027: when focus reaches these, the browser scrolls them into view; the fixed progress bar must not sit over them.
  for (const size of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    test(`keyboard focus on the Build links, the table region and the invitation link is visible and uncovered at ${size.width}px (FR-027)`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto(STORY);
      const targets: [string, Locator][] = [
        ["a Build link", page.locator("[data-build-links] a").first()],
        ["the table region", page.locator("[data-options-table]")],
        ["the invitation link", page.locator("[data-invitation]")],
      ];
      for (const [name, target] of targets) {
        await target.focus();
        await expect(target, name).toBeFocused();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const { ok, info } = await isVisibleAndUncovered(page, target);
        expect(ok, `${name}: ${info}`).toBe(true);
        const outline = await target.evaluate((el) => getComputedStyle(el).outlineStyle);
        expect(outline, `${name} shows a focus outline`).not.toBe("none");
      }
    });
  }
});

test.describe("the projects index", () => {
  const INDEX = "/projects/";

  test("answers 200 with one h1, a row for Focus Pocus and a link to its story", async ({ page }) => {
    const response = await page.goto(INDEX);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Projects");
    // Focus Pocus is the one published project; the stories migrated from the first
    // drc.dev are drafts, listed on this non-production build with a draft mark.
    expect(await page.locator("[data-project]").count()).toBeGreaterThanOrEqual(1);
    const link = page.locator("[data-project] h2 a", { hasText: "Focus Pocus" });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", STORY);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${STORY}$`));
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
  });

  test("the header Projects link is current on the index and on a story", async ({ page }) => {
    // The index is the link's own page; a story is inside its section (spec 008 FR-004).
    for (const [path, value] of [
      [INDEX, "page"],
      [STORY, "true"],
    ] as const) {
      await page.goto(path);
      const current = page.locator("#primary-nav-list a[aria-current]");
      await expect(current).toHaveCount(1);
      await expect(current).toHaveText("Projects");
      await expect(current).toHaveAttribute("aria-current", value);
      await expect(current).toHaveClass(/underline/);
    }
  });

  test("a row is two columns at 1280px and one column at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(INDEX);
    const text = await page.locator("[data-project-text]").first().boundingBox();
    const visual = await page.locator("[data-project-visual]").first().boundingBox();
    expect(visual!.x).toBeGreaterThan(text!.x + text!.width - 1);
    await page.setViewportSize({ width: 390, height: 844 });
    const textNarrow = await page.locator("[data-project-text]").first().boundingBox();
    const visualNarrow = await page.locator("[data-project-visual]").first().boundingBox();
    expect(visualNarrow!.y).toBeGreaterThanOrEqual(textNarrow!.y + textNarrow!.height - 1);
  });

  for (const width of [320, 390, 1280]) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(INDEX);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }

  test("going back from a story restores the index with its ?theme=", async ({ page }) => {
    await page.goto(`${INDEX}?theme=macos`);
    // Only Focus Pocus has the macOS theme; the other rows stay in the list, hidden.
    const shown = page.locator("[data-project]:not([hidden])");
    await expect(shown).toHaveCount(1);
    await expect(shown).toBeVisible();
    await shown.locator("h2 a").click();
    await page.goBack();
    await expect(page).toHaveURL(/\/projects\/\?theme=macos$/);
    await expect(page.locator('button[data-theme="macos"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("the header Projects link always opens the unfiltered index", async ({ page }) => {
    await page.goto(`${INDEX}?theme=macos`);
    await page.locator('#primary-nav-list a[href="/projects/"]').click();
    await expect(page).toHaveURL(/\/projects\/$/);
    await expect(page.locator("[data-filter-all]")).toHaveAttribute("aria-pressed", "true");
  });
});
