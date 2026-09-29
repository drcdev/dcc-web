// Theme: first-paint guarantee (SC-003) and the theme switch (contracts/theme.md;
// research R5; FR-011, FR-012, FR-012a, FR-013, FR-014, FR-015).
//
// The first-paint check records whether <html> has the `dark` class at the
// moment <body> is inserted, from a MutationObserver installed before any page
// script runs. The inline pre-paint script sits in <head>, so by then the class
// must already match the stored choice.
import { test, expect, type BrowserContext, type Page } from "@playwright/test";

const KEY = "color-theme";
const LOADS = 5;
const SWITCH = "button[data-theme-toggle]";

declare global {
  interface Window {
    __darkAtBody?: boolean;
  }
}

/** Seeds storage before every load; `null` removes the key. */
async function seed(target: Page | BrowserContext, value: string | null) {
  await target.addInitScript(
    ([key, stored]) => {
      if (stored === null) localStorage.removeItem(key);
      else localStorage.setItem(key, stored);
    },
    [KEY, value] as const,
  );
}

async function recordFirstPaint(target: Page | BrowserContext) {
  await target.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (document.body && window.__darkAtBody === undefined) {
        window.__darkAtBody = document.documentElement.classList.contains("dark");
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  });
}

const darkAtBody = (page: Page) => page.evaluate(() => window.__darkAtBody);
const isDarkNow = (page: Page) => page.evaluate(() => document.documentElement.classList.contains("dark"));

function collectErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  return errors;
}

const CASES = [
  { stored: "dark", device: "light", dark: true },
  { stored: "light", device: "dark", dark: false },
  { stored: "system", device: "light", dark: false },
  { stored: "system", device: "dark", dark: true },
  { stored: null, device: "light", dark: true },
  { stored: "garbage", device: "light", dark: true },
] as const;

test.describe("first paint uses the stored choice (SC-003)", () => {
  for (const c of CASES) {
    test.describe(`stored ${c.stored ?? "absent"}, device ${c.device}`, () => {
      test.use({ colorScheme: c.device });

      test.beforeEach(async ({ page }) => {
        await seed(page, c.stored);
        await recordFirstPaint(page);
      });

      async function expectTheme(page: Page) {
        expect(await darkAtBody(page)).toBe(c.dark);
        expect(await isDarkNow(page)).toBe(c.dark);
      }

      test("on first load", async ({ page }) => {
        for (let i = 0; i < LOADS; i += 1) {
          await page.goto(`/?load=${i}`);
          await expectTheme(page);
        }
      });

      test("on reload", async ({ page }) => {
        await page.goto("/");
        for (let i = 0; i < LOADS; i += 1) {
          await page.reload();
          await expectTheme(page);
        }
      });

      test("after following an in-site link", async ({ page }) => {
        await page.goto("/?start");
        for (let i = 0; i < LOADS; i += 1) {
          await Promise.all([
            page.waitForURL((url) => url.pathname === "/" && url.search === ""),
            page.getByRole("banner").getByRole("link", { name: "Don Coleman" }).click(),
          ]);
          await expectTheme(page);
          await page.goto(`/?again=${i}`);
        }
      });

      test("on back and forward navigation", async ({ page }) => {
        await page.goto("/?one");
        await page.goto("/?two");
        for (let i = 0; i < LOADS; i += 1) {
          await page.goBack();
          await expect(page).toHaveURL(/\?one$/);
          await expectTheme(page);
          await page.goForward();
          await expect(page).toHaveURL(/\?two$/);
          await expectTheme(page);
        }
      });
    });
  }
});

test.describe("theme switch", () => {
  test("cycles dark → light → system → dark with click, Enter and Space, keeping focus on the same button", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    const toggle = page.locator(SWITCH);
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAccessibleName("Theme: Dark");
    await toggle.evaluate((el) => ((window as unknown as { __toggle: Element }).__toggle = el));
    const sameFocused = () =>
      page.evaluate(() => document.activeElement === (window as unknown as { __toggle: Element }).__toggle);
    const live = page.locator('[aria-live="polite"]');

    const steps = [
      ["click", "Light", false, "light"],
      ["Enter", "Match device", null, "system"],
      ["Space", "Dark", true, "dark"],
      ["Enter", "Light", false, "light"],
      ["Space", "Match device", null, "system"],
      ["click", "Dark", true, "dark"],
    ] as const;

    await toggle.focus();
    for (const [how, label, dark, stored] of steps) {
      if (how === "click") await toggle.click();
      else await page.keyboard.press(how);
      await expect(toggle).toHaveAccessibleName(`Theme: ${label}`);
      await expect(live).toHaveText(`Theme: ${label}`);
      expect(await sameFocused()).toBe(true);
      if (dark !== null) expect(await isDarkNow(page)).toBe(dark);
      expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(stored);
    }
    expect(errors).toEqual([]);
  });

  test("the choice is remembered across pages", async ({ page }) => {
    await page.goto("/");
    await page.locator(SWITCH).click();
    await page.goto("/?next");
    expect(await isDarkNow(page)).toBe(false);
    await expect(page.locator(SWITCH)).toHaveAccessibleName("Theme: Light");
  });

  for (const [stored, label, state] of [
    ["dark", "Dark", "dark"],
    ["light", "Light", "light"],
    ["system", "Match device", "system"],
  ] as const) {
    test(`on load shows the stored choice ${stored}`, async ({ page }) => {
      await seed(page, stored);
      await page.goto("/");
      const toggle = page.locator(SWITCH);
      await expect(toggle).toHaveAccessibleName(`Theme: ${label}`);
      await expect(toggle.locator(`[data-theme-state="${state}"]`)).toBeVisible();
      await expect(toggle.locator("[data-theme-state]:visible")).toHaveCount(1);
      await expect(page.locator('[aria-live="polite"]')).toHaveText("");
    });
  }
});

test.describe("match device", () => {
  test("follows a device change within 500 ms without a reload", async ({ page }) => {
    await seed(page, "system");
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.evaluate(() => ((window as unknown as { __same: boolean }).__same = true));
    expect(await isDarkNow(page)).toBe(false);
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/, { timeout: 500 });
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/, { timeout: 500 });
    expect(await page.evaluate(() => (window as unknown as { __same?: boolean }).__same)).toBe(true);
  });

  test("a page in the background shows the current device setting when brought to the front", async ({ context }) => {
    await seed(context, "system");
    const first = await context.newPage();
    await first.emulateMedia({ colorScheme: "dark" });
    await first.goto("/");
    const second = await context.newPage();
    await second.emulateMedia({ colorScheme: "dark" });
    await second.goto("/?second");
    await first.bringToFront();
    await second.emulateMedia({ colorScheme: "light" });
    await second.bringToFront();
    await expect(second.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/, { timeout: 500 });
  });

  for (const [stored, dark] of [
    ["dark", true],
    ["light", false],
  ] as const) {
    test(`a device change does not change a ${stored} choice`, async ({ page }) => {
      await seed(page, stored);
      await page.emulateMedia({ colorScheme: dark ? "light" : "dark" });
      await page.goto("/");
      await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });
      await page.waitForTimeout(600);
      expect(await isDarkNow(page)).toBe(dark);
      await page.emulateMedia({ colorScheme: dark ? "light" : "dark" });
      await page.waitForTimeout(600);
      expect(await isDarkNow(page)).toBe(dark);
    });
  }
});

test.describe("storage failures (FR-015)", () => {
  test("when storage cannot be written the switch still changes the page, and the next load uses what is stored", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await seed(page, "light");
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("blocked", "SecurityError");
      };
    });
    await page.goto("/");
    const toggle = page.locator(SWITCH);
    await expect(toggle).toHaveAccessibleName("Theme: Light");
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Theme: Match device");
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Theme: Dark");
    expect(await isDarkNow(page)).toBe(true);
    await page.reload();
    expect(await isDarkNow(page)).toBe(false);
    await expect(toggle).toHaveAccessibleName("Theme: Light");
    expect(errors).toEqual([]);
  });

  test("when nothing can be written and nothing is stored the next load is dark", async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("blocked", "SecurityError");
      };
    });
    await page.goto("/");
    await page.locator(SWITCH).click();
    expect(await isDarkNow(page)).toBe(false);
    await page.reload();
    expect(await isDarkNow(page)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("when storage cannot be read the page is dark with no error and the switch still works", async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new DOMException("blocked", "SecurityError");
      };
    });
    await recordFirstPaint(page);
    await page.goto("/");
    expect(await darkAtBody(page)).toBe(true);
    expect(await isDarkNow(page)).toBe(true);
    const toggle = page.locator(SWITCH);
    await expect(toggle).toHaveAccessibleName("Theme: Dark");
    await toggle.click();
    await expect(toggle).toHaveAccessibleName("Theme: Light");
    expect(await isDarkNow(page)).toBe(false);
    expect(errors).toEqual([]);
  });
});
