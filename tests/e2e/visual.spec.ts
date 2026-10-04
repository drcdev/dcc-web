// Visual baselines for the design system and the templates, never for real
// content. Phone (390) and desktop (1280) widths, dark and light themes - 66
// images per platform:
//   - the header, the footer and the open mobile menu from `/` (the menu at
//     phone width only), and the full not-found page;
//   - the sections fixture page on the fixture site (port 4322), full page;
//   - twelve fixture-site subjects, each an element shot: the post template, the
//     project-story template, the lead story, the listing cards, a series
//     banner, five project index rows (minimal, every-setting, draft, in
//     progress and retired), the retired story header and the contact form.
// Every fixture subject is an element shot, because the pages around it also
// show real posts and real project rows (Related posts, the real project rows),
// and a full-page shot would pin the shell a second time. The project-row
// subjects also remove the real rows first, because their position would
// otherwise move the fixture row. So a content edit
// cannot fail this project (issue #40, V1, V2 and V3). Comparison settings
// (maxDiffPixelRatio 0.001, animations disabled, caret hidden) and
// updateSnapshots "none" (a missing baseline fails) come from
// playwright.config.ts.
//
// The footer year is frozen to 2026 before every shot (freezeFooterYear), so a
// new calendar year cannot fail the shell, not-found or sections shots (issue #45).
import { test, expect, type Locator, type Page } from "@playwright/test";
import { expectThemeClass, setTheme, type Theme } from "./color-theme.ts";
import { freezeFooterYear } from "./footer-year";

const WIDTHS = [
  { name: "phone", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

const THEMES = ["dark", "light"] as const;

async function open(page: Page, path: string, width: number, height: number, theme: Theme) {
  await page.setViewportSize({ width, height });
  await setTheme(page, theme);
  await page.goto(path);
  await freezeFooterYear(page);
  await expectThemeClass(page, theme);
  await settleImages(page);
}

// Astro renders images with loading="lazy", so an image below the first
// viewport only starts loading when a full-page screenshot enlarges the
// viewport, and whether it has painted by the time the screenshot is taken
// depends on timing (under 4 Playwright workers in CI it often has not). Make
// every image eager, wait for each one to load and decode, then wait for two
// animation frames so the paint has happened, and finally assert that every
// image has pixels. A screenshot is then never taken before its images paint.
async function settleImages(page: Page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    for (const img of images) img.loading = "eager";
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise<void>((done) => {
            img.addEventListener("load", () => done(), { once: true });
            img.addEventListener("error", () => done(), { once: true });
          });
        }
        await img.decode().catch(() => undefined);
      }),
    );
    await new Promise<void>((frame) => requestAnimationFrame(() => requestAnimationFrame(() => frame())));
  });
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0));
}

for (const size of WIDTHS) {
  for (const theme of THEMES) {
    test(`header — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "/", size.width, size.height, theme);
      await expect(page.locator("header").first()).toHaveScreenshot(`header-${size.name}-${theme}.png`);
    });

    test(`footer — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "/", size.width, size.height, theme);
      await expect(page.locator("footer").first()).toHaveScreenshot(`footer-${size.name}-${theme}.png`);
    });

    test(`not-found page — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "/nope/", size.width, size.height, theme);
      await expect(page).toHaveScreenshot(`not-found-${size.name}-${theme}.png`, { fullPage: true });
    });
  }
}

for (const theme of THEMES) {
  test(`mobile menu open — phone — ${theme}`, async ({ page }) => {
    await open(page, "/", 390, 844, theme);
    const button = page.locator('button[aria-controls="primary-nav-list"]');
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("header").first()).toHaveScreenshot(`menu-open-phone-${theme}.png`);
  });
}

// The sections fixture page (built into the fixture site on port 4322 by the
// Playwright config's second web server), full page, both sizes and themes.
for (const size of WIDTHS) {
  for (const theme of THEMES) {
    test(`sections fixture — ${size.name} — ${theme}`, async ({ page }) => {
      await open(page, "http://localhost:4322/sections/", size.width, size.height, theme);
      await expect(page).toHaveScreenshot(`sections-${size.name}-${theme}.png`, { fullPage: true });
    });
  }
}

// The fixture-site template subjects (V3). Layer: visual, because pixel identity
// of a template on frozen content is what only a snapshot shows. What these
// pages do is asserted elsewhere (blog-fixtures, projects-fixtures, contact,
// projects and theme-tokens specs); this block adds only the pixels. Each shot
// is the element, not the page, so Related posts, real project rows and the
// footer stay out of it. Reduced motion puts the story in its
// resting state (chapters final, no reading-progress bar).
const FIXTURE = "http://localhost:4322";

// The fixture index also lists the real projects, newest first, so a real project
// added or removed above a fixture row moves that row by a fraction of a pixel
// and changes its rendering. Removing the real rows once the filter island is
// ready leaves each row's position set by the four fixtures alone (PR #42).
const FIXTURE_PROJECTS = ["draft", "minimal", "every-part", "every-setting", "retired"];

async function onlyFixtureRows(page: Page) {
  await expect(page.locator("project-filter[data-ready]")).toHaveCount(1);
  await page
    .locator("li[data-project]")
    .evaluateAll((rows, keep) => rows.filter((row) => !keep.includes(row.getAttribute("data-project") ?? "")).forEach((row) => row.remove()), FIXTURE_PROJECTS);
  await expect(page.locator("li[data-project]")).toHaveCount(FIXTURE_PROJECTS.length);
}

const FIXTURE_SUBJECTS = [
  {
    prefix: "post-template",
    title: "fixture post template",
    path: "/writing/every-part/",
    locator: (page: Page) => page.locator("#main > article"),
    wait: async (page: Page) => {
      await expect(page.locator(".code-card__button").first()).toBeVisible();
    },
  },
  {
    prefix: "story-template",
    title: "fixture project story template",
    path: "/projects/every-part/",
    locator: (page: Page) => page.locator("article[data-story]"),
  },
  {
    prefix: "lead-story",
    title: "fixture lead story",
    path: "/writing/",
    locator: (page: Page) => page.locator("[data-lead-story]"),
    wait: async (page: Page) => {
      // Guards against a real post taking the lead.
      await expect(page.locator("[data-lead-story] h2 a")).toHaveAttribute("href", "/writing/every-part/");
    },
  },
  {
    prefix: "listing-cards",
    title: "fixture listing cards",
    path: "/writing/topics/fixture-cards/",
    locator: (page: Page) => page.locator("ul[data-topic-grid]"),
    wait: async (page: Page) => {
      await expect(page.locator("ul[data-topic-grid] [data-post-card]")).toHaveCount(3);
    },
  },
  {
    prefix: "series-banner",
    title: "fixture series banner",
    path: "/writing/drift/",
    locator: (page: Page) => page.locator("header[data-series-banner]"),
  },
  {
    prefix: "project-row-minimal",
    title: "fixture project row, minimal",
    path: "/projects/",
    locator: (page: Page) => page.locator('li[data-project="minimal"]'),
    wait: onlyFixtureRows,
  },
  {
    prefix: "project-row-every-setting",
    title: "fixture project row, every setting",
    path: "/projects/",
    locator: (page: Page) => page.locator('li[data-project="every-setting"]'),
    wait: onlyFixtureRows,
  },
  {
    prefix: "project-row-draft",
    title: "fixture project row, draft",
    path: "/projects/",
    locator: (page: Page) => page.locator('li[data-project="draft"]'),
    wait: onlyFixtureRows,
  },
  {
    prefix: "project-row-in-progress",
    title: "fixture project row, in progress",
    path: "/projects/",
    locator: (page: Page) => page.locator('li[data-project="every-part"]'),
    wait: onlyFixtureRows,
  },
  {
    prefix: "project-row-retired",
    title: "fixture project row, retired",
    path: "/projects/",
    locator: (page: Page) => page.locator('li[data-project="retired"]'),
    wait: onlyFixtureRows,
  },
  {
    prefix: "retired-story-header",
    title: "fixture retired story header",
    path: "/projects/retired/",
    locator: (page: Page) => page.locator("header[data-story-header]"),
  },
  {
    prefix: "contact-form",
    title: "fixture contact form",
    path: "/contact-form/",
    locator: (page: Page) => page.locator("[data-contact]"),
    wait: async (page: Page) => {
      // The island ran (same check as contact.spec.ts).
      await expect(page.locator("#contact-js-required")).toBeHidden();
    },
  },
] as const satisfies ReadonlyArray<{
  prefix: string;
  title: string;
  path: string;
  locator: (page: Page) => Locator;
  wait?: (page: Page) => Promise<void>;
}>;

for (const subject of FIXTURE_SUBJECTS) {
  for (const size of WIDTHS) {
    for (const theme of THEMES) {
      test(`${subject.title} — ${size.name} — ${theme}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await open(page, `${FIXTURE}${subject.path}`, size.width, size.height, theme);
        if ("wait" in subject && subject.wait) await subject.wait(page);
        const target = subject.locator(page);
        await expect(target).toHaveCount(1);
        await expect(target).toHaveScreenshot(`${subject.prefix}-${size.name}-${theme}.png`);
      });
    }
  }
}
