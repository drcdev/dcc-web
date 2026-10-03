// The projects pages on the production build (contracts/pages-dom.md). The story
// part is here; the index part comes with Phase 6.
import { expect, test } from "@playwright/test";

const STORY = "/projects/focus-pocus/";
const CHAPTERS = [
  ["problem", "The problem"],
  ["constraints", "What made it hard"],
  ["options", "Options considered"],
  ["built", "What I built"],
  ["outcome", "How it turned out"],
  ["lessons", "What I'd do differently"],
  ["invitation", "Have a problem like this?"],
] as const;

test.describe("the Focus Pocus story", () => {
  test("answers 200 with one h1 and the seven chapters in order", async ({ page }) => {
    const response = await page.goto(STORY);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Focus Pocus");
    await expect(page.locator("main h2")).toHaveText(CHAPTERS.map(([, heading]) => heading));
    const ids = await page.locator("main section[data-stage]").evaluateAll((els) => els.map((el) => el.id));
    expect(ids).toEqual(CHAPTERS.map(([id]) => id));
  });

  test("the 'In this story' links jump to each chapter", async ({ page }) => {
    await page.goto(STORY);
    const nav = page.getByRole("navigation", { name: "In this story" });
    await expect(nav.getByRole("link")).toHaveCount(7);
    for (const [id, heading] of CHAPTERS) {
      await nav.getByRole("link", { name: heading }).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id}-heading`)).toBeInViewport();
    }
  });

  for (const size of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    test(`an 'In this story' link leaves the chapter heading uncovered and moves focus on at ${size.width}px (FR-027)`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      await page.goto(STORY);
      const nav = page.getByRole("navigation", { name: "In this story" });
      for (const [id, heading] of CHAPTERS) {
        await nav.getByRole("link", { name: heading }).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        // Let the smooth scroll bring the heading into view and settle before measuring.
        await expect(page.locator(`#${id}-heading`)).toBeInViewport();
        await page.evaluate(
          () =>
            new Promise<void>((resolve) => {
              let last = -1;
              let steady = 0;
              const tick = () => {
                steady = window.scrollY === last ? steady + 1 : 0;
                last = window.scrollY;
                if (steady >= 10) resolve();
                else requestAnimationFrame(tick);
              };
              tick();
            }),
        );
        const covered = await page.evaluate((headingId) => {
          const el = document.getElementById(headingId)!;
          const rect = el.getBoundingClientRect();
          const hit = document.elementFromPoint(rect.left + 4, rect.top + 2);
          return { top: rect.top, inside: !!hit && (hit === el || el.contains(hit)), info: hit?.outerHTML.slice(0, 120), rect: [rect.left, rect.top, rect.width, rect.height] };
        }, `${id}-heading`);
        expect(covered.top, `${id} heading top edge is in the viewport`).toBeGreaterThanOrEqual(0);
        expect(covered.inside, `${id} heading top edge is not covered ${JSON.stringify(covered)}`).toBe(true);
        await page.keyboard.press("Tab");
        const focus = await page.evaluate((chapterId) => {
          const chapter = document.getElementById(chapterId)!;
          const active = document.activeElement as HTMLElement;
          const position = chapter.compareDocumentPosition(active);
          const inside = chapter.contains(active);
          const after = !!(position & Node.DOCUMENT_POSITION_FOLLOWING);
          return { inside, after, isBody: active === document.body };
        }, id);
        expect(focus.isBody, `${id}: focus is not reset to the page`).toBe(false);
        expect(focus.inside || focus.after, `${id}: focus is in or after the chapter`).toBe(true);
      }
    });
  }

  test("the comparison region can be reached and scrolled by keyboard", async ({ page }) => {
    await page.goto(STORY);
    const region = page.getByRole("region", { name: /ways to reach OmniFocus/ });
    await expect(region).toHaveCount(1);
    await region.focus();
    await expect(region).toBeFocused();
    await expect(region.getByRole("table")).toBeVisible();
    await expect(region.getByRole("columnheader", { name: /Chosen/ })).toHaveCount(1);
  });

  test("has a stand-in link, draft marks and no placeholder marks", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.getByRole("link", { name: "Focus Pocus on drc.dev" })).toHaveAttribute(
      "href",
      "https://drc.dev/projects/focus-pocus",
    );
    await expect(page.getByText("This is not a live demo.")).toBeVisible();
    await expect(page.locator("[data-draft-mark]")).toHaveCount(7);
    // The pictures are real captures from the blog post, so no "Placeholder" mark shows.
    await expect(page.locator("[data-placeholder]")).toHaveCount(0);
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
