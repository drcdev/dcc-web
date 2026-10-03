// The shared shell on every page template: header part (FR-006, FR-009,
// FR-010, FR-010a, FR-021, SC-005; contracts/shell-dom.md "Header" and
// "Focus"), and the footer part (FR-008, FR-010a, SC-005; contracts/shell-dom.md
// "Footer").
import { test, expect, type Locator, type Page } from "@playwright/test";
import { futureDestinations } from "../../src/config/navigation.ts";
import { MENU_BUTTON, NAV_LIST, NOT_FOUND_PENDING, PRIMARY, TEMPLATES } from "./templates.ts";

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

async function headerSnapshot(page: Page) {
  return page.getByRole("banner").evaluate((header) => ({
    siteName: header.querySelector("a")?.textContent?.trim(),
    siteHref: header.querySelector("a")?.getAttribute("href"),
    links: Array.from(header.querySelectorAll("#primary-nav-list a")).map((a) => [
      a.textContent?.trim(),
      a.getAttribute("href"),
    ]),
  }));
}

/** Describes the focused element so a Tab walk can be compared with the expected order. */
async function focused(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "body";
    if (el.tagName === "BUTTON") return `button:${el.textContent?.trim()}`;
    return el.getAttribute("href") ?? el.tagName.toLowerCase();
  });
}

async function expectVisibleFocusRing(locator: Locator) {
  const outline = await locator.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
}

const HEADER_ORDER = ["#main", "/", ...PRIMARY.map(([, href]) => href)];

test.describe("header on every template", () => {
  let reference: Awaited<ReturnType<typeof headerSnapshot>> | undefined;

  for (const template of TEMPLATES) {
    test(`${template.name}: shows the site name and the seven links in order`, async ({ page }) => {
      test.fixme(!template.built, NOT_FOUND_PENDING);
      await page.goto(template.path);
      const snapshot = await headerSnapshot(page);
      expect(snapshot).toEqual({
        siteName: "Don Coleman",
        siteHref: "/",
        links: PRIMARY.map((p) => [...p]),
      });
      reference ??= snapshot;
      expect(snapshot).toEqual(reference);
    });
  }
});

test("marks Home as the current page on / with aria-current and an underline", async ({ page }) => {
  await page.goto("/");
  const links = page.locator(`${NAV_LIST} a`);
  await expect(links.first()).toHaveAttribute("aria-current", "page");
  await expect(page.locator(`${NAV_LIST} a[aria-current]`)).toHaveCount(1);
  const decoration = await links.first().evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(decoration).toContain("underline");
  const other = await links.nth(1).evaluate((el) => getComputedStyle(el).textDecorationLine);
  expect(other).not.toContain("underline");
});

test.describe("skip link", () => {
  test("is the first Tab stop, visible on focus and hidden again on blur", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    const box = async () => (await skip.boundingBox()) ?? { width: 0, height: 0 };
    expect((await box()).width).toBeLessThanOrEqual(1);
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    expect((await box()).width).toBeGreaterThan(1);
    expect((await box()).height).toBeGreaterThan(1);
    await expectVisibleFocusRing(skip);
    await page.keyboard.press("Tab");
    expect((await box()).width).toBeLessThanOrEqual(1);
  });

  test("moves focus to <main> so the next Tab goes past the header", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
    await page.keyboard.press("Tab");
    const inHeader = await page.evaluate(() => {
      const el = document.activeElement;
      return Boolean(el && el !== document.body && document.querySelector("header")?.contains(el));
    });
    expect(inHeader).toBe(false);
  });
});

for (const [widthName, viewport, withButton] of [
  ["phone", PHONE, true],
  ["desktop", DESKTOP, false],
] as const) {
  test.describe(`keyboard order at ${widthName} width`, () => {
    test.use({ viewport });

    const expected = withButton
      ? [HEADER_ORDER[0]!, HEADER_ORDER[1]!, "button:Menu", ...HEADER_ORDER.slice(2)]
      : HEADER_ORDER;

    test("Tab walks skip link, site name, menu button (phone only) and the seven links with a visible focus ring", async ({
      page,
    }) => {
      await page.goto("/");
      const seen: string[] = [];
      for (let i = 0; i < expected.length; i += 1) {
        await page.keyboard.press("Tab");
        seen.push(await focused(page));
        await expectVisibleFocusRing(page.locator(":focus"));
        // Opening the menu from the keyboard is what makes the collapsed links reachable.
        if (withButton && seen.at(-1) === "button:Menu") await page.keyboard.press("Enter");
      }
      expect(seen).toEqual(expected);
    });

    test("Shift+Tab walks the same stops in reverse", async ({ page }) => {
      await page.goto("/");
      // At phone width the collapsed list is opened first so its last link can take focus.
      if (withButton) await page.locator(MENU_BUTTON).click();
      await page.locator(`${NAV_LIST} a`).last().focus();
      const seen: string[] = [await focused(page)];
      for (let i = 1; i < expected.length; i += 1) {
        await page.keyboard.press("Shift+Tab");
        seen.push(await focused(page));
        await expectVisibleFocusRing(page.locator(":focus"));
      }
      expect(seen).toEqual([...expected].reverse());
    });
  });
}

test.describe("activation", () => {
  test.use({ viewport: DESKTOP });

  test("each header link activates with Enter", async ({ page }) => {
    // A marker query string means the link's target (Home, "/") is never
    // already the current URL when the wait starts: `waitForURL`'s predicate
    // checks the page's current state immediately, so for a same-page link it
    // would otherwise resolve before Enter's navigation actually happens,
    // leaving it in flight to collide with the next iteration's `page.goto`.
    await page.goto("/?before-header-name");
    await page.getByRole("link", { name: "Don Coleman", exact: true }).first().focus();
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/" && url.search === ""),
      page.keyboard.press("Enter"),
    ]);
    for (const [, href] of PRIMARY) {
      await page.goto("/?before-header-link");
      await page.locator(`${NAV_LIST} a[href="${href}"]`).focus();
      await Promise.all([
        page.waitForURL((url) => url.pathname === href && url.search === ""),
        page.keyboard.press("Enter"),
      ]);
    }
  });

  test("the menu button activates with Enter and Space at phone width", async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto("/");
    const button = page.locator(MENU_BUTTON);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  // A header link whose page is still to come (src/config/navigation.ts `futureDestinations`)
  // is an ordinary link to the not-found page. The blog and the portfolio have both landed, so
  // the list is empty for now and these skip; they run again when a feature reserves an address.
  const NO_FUTURE = "no header link is a future destination at the moment";

  test("a future destination is an ordinary link that serves the not-found status", async ({ page }) => {
    test.skip(futureDestinations.length === 0, NO_FUTURE);
    await page.goto("/");
    for (const href of futureDestinations) {
      const [response] = await Promise.all([
        page.waitForResponse((r) => new URL(r.url()).pathname === href),
        page.locator(`${NAV_LIST} a[href="${href}"]`).click(),
      ]);
      expect(response.status(), href).toBe(404);
      await page.goto("/");
    }
  });

  test("a future destination loads the not-found page", async ({ page }) => {
    test.skip(futureDestinations.length === 0, NO_FUTURE);
    test.fixme(!TEMPLATES[1].built, NOT_FOUND_PENDING);
    for (const href of futureDestinations) {
      await page.goto("/");
      await page.locator(`${NAV_LIST} a[href="${href}"]`).click();
      await expect(page.getByRole("heading", { level: 1, name: "Page not found" }), href).toBeVisible();
    }
  });
});

test.describe("narrow screens", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const javaScriptEnabled of [true, false]) {
    test.describe(`with JavaScript ${javaScriptEnabled ? "on" : "off"}`, () => {
      test.use({ javaScriptEnabled });

      test("has no horizontal scroll at 320 px, including with a very long page title", async ({ page }) => {
        await page.goto("/");
        const scroll = () =>
          page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          }));
        let { scrollWidth, clientWidth } = await scroll();
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
        await page.locator("main h1").evaluate((h1) => {
          h1.textContent =
            "A very long page title that goes on and on to check that the header, navigation and footer never overflow a narrow phone screen";
        });
        ({ scrollWidth, clientWidth } = await scroll());
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Footer (T063)

const FOOTER_LINKS = [
  ["Privacy policy", "/privacy-policy/"],
  ["Terms of use", "/terms-of-use/"],
  ["Technology", "/technology/"],
] as const;

const SOCIAL_LINKS = [
  ["GitHub", "https://github.com/drcdev"],
  ["LinkedIn", "https://www.linkedin.com/in/drcdev"],
] as const;

/** Footer focus stops in visual order: site name, site links, theme switch, social links. */
const FOOTER_ORDER = [
  "/",
  ...FOOTER_LINKS.map(([, href]) => href),
  "theme-switch",
  ...SOCIAL_LINKS.map(([, href]) => href),
];

async function footerStop(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return "body";
    if (!document.querySelector("body > footer")?.contains(el)) return `outside:${el.getAttribute("href") ?? el.tagName}`;
    if (el.hasAttribute("data-theme-toggle")) return "theme-switch";
    return el.getAttribute("href") ?? el.tagName.toLowerCase();
  });
}

/** External destinations are answered locally so the tests never leave the machine. */
async function stubExternal(page: Page) {
  await page.route(/^https:\/\/(github\.com|www\.linkedin\.com)\//, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stub</title>" }),
  );
}

test.describe("footer on every template", () => {
  for (const template of TEMPLATES) {
    test(`${template.name}: shows the footer links, social links and copyright with the build year`, async ({
      page,
    }) => {
      test.fixme(!template.built, NOT_FOUND_PENDING);
      await page.goto(template.path);
      const footer = page.getByRole("contentinfo");
      await expect(footer).toHaveCount(1);
      for (const [name, href] of [...FOOTER_LINKS, ...SOCIAL_LINKS]) {
        await expect(footer.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
      }
      await expect(footer).toContainText(`© ${new Date().getFullYear()} Don Coleman. All rights reserved.`);
      await expect(footer.getByRole("button", { name: /^Theme: / })).toBeVisible();
    });

    test(`${template.name}: Tab goes from main content through the footer in visual order, Shift+Tab walks back, with no trap`, async ({
      page,
    }) => {
      test.fixme(!template.built, NOT_FOUND_PENDING);
      await page.setViewportSize(DESKTOP);
      await page.goto(template.path);
      await page.locator("main#main").focus();

      // Skip past any focusable elements inside main's own content (for
      // example the not-found page's link to the home page, T071): this test
      // covers only the footer's tab order.
      let stop = await footerStop(page);
      while (stop.startsWith("outside:")) {
        await page.keyboard.press("Tab");
        stop = await footerStop(page);
      }
      await expectVisibleFocusRing(page.locator(":focus"));

      const forward: string[] = [stop];
      for (let i = 1; i < FOOTER_ORDER.length; i += 1) {
        await page.keyboard.press("Tab");
        forward.push(await footerStop(page));
        await expectVisibleFocusRing(page.locator(":focus"));
      }
      expect(forward).toEqual(FOOTER_ORDER);

      // Focus leaves the last footer control: no keyboard trap.
      await page.keyboard.press("Tab");
      expect(FOOTER_ORDER).not.toContain(await footerStop(page));

      await page.getByRole("contentinfo").getByRole("link", { name: "LinkedIn" }).focus();
      const backward: string[] = [await footerStop(page)];
      for (let i = 1; i < FOOTER_ORDER.length; i += 1) {
        await page.keyboard.press("Shift+Tab");
        backward.push(await footerStop(page));
        await expectVisibleFocusRing(page.locator(":focus"));
      }
      expect(backward).toEqual([...FOOTER_ORDER].reverse());
      await page.keyboard.press("Shift+Tab");
      expect(await footerStop(page)).not.toBe("/");
    });
  }

  test("Tab from the skip link reaches the end of the page without getting stuck", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto("/");
    const seen: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press("Tab");
      const stop = await footerStop(page);
      seen.push(stop);
      if (stop === "https://www.linkedin.com/in/drcdev") break;
    }
    expect(seen.at(-1)).toBe("https://www.linkedin.com/in/drcdev");
    // Each stop is visited once on the way down (the header and footer each link "/" twice or once).
    // The home card's call to action repeats the Services link, so "outside:/services/" may repeat too.
    // The Recent writing section (spec 008) repeats the Writing link and shares topic links between cards.
    const distinct = seen.filter(
      (s) => s !== "/" && s !== "outside:/" && s !== "outside:/services/" && !s.startsWith("outside:/writing/"),
    );
    expect(new Set(distinct).size).toBe(distinct.length);
  });
});

test.describe("footer activation", () => {
  test.use({ viewport: DESKTOP });

  test("each footer link activates with Enter", async ({ page }) => {
    await stubExternal(page);
    const footerLink = (href: string) => page.getByRole("contentinfo").locator(`a[href="${href}"]`);
    for (const href of ["/", ...FOOTER_LINKS.map(([, h]) => h)]) {
      await page.goto("/?from-footer");
      await footerLink(href).focus();
      await Promise.all([
        page.waitForURL((url) => url.pathname === href && url.search === ""),
        page.keyboard.press("Enter"),
      ]);
    }
    for (const [, href] of SOCIAL_LINKS) {
      await page.goto("/");
      await footerLink(href).focus();
      await Promise.all([page.waitForURL(href), page.keyboard.press("Enter")]);
    }
  });

  test("the theme switch activates with Enter and Space", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("contentinfo").locator("button[data-theme-toggle]");
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAccessibleName("Theme: Light");
    await page.keyboard.press("Space");
    await expect(toggle).toHaveAccessibleName("Theme: Match device");
    await expect(toggle).toBeFocused();
  });
});
