// Mobile menu behaviour at phone width with JavaScript on: one test per row of
// the table in contracts/shell-dom.md "Mobile menu behaviour" (FR-007,
// FR-007a; research R6). The menu is a disclosure, not a modal: it never traps
// focus.
import { test, expect, type Page } from "@playwright/test";
import { MENU_BUTTON, NAV_LIST } from "./templates.ts";

test.use({ viewport: { width: 390, height: 844 } });

const button = (page: Page) => page.locator(MENU_BUTTON);
const list = (page: Page) => page.locator(NAV_LIST);
const navLinks = (page: Page) => page.locator(`${NAV_LIST} a`);

async function expectClosed(page: Page) {
  await expect(button(page)).toHaveAttribute("aria-expanded", "false");
  await expect(list(page)).toBeHidden();
}

async function expectOpen(page: Page) {
  await expect(button(page)).toHaveAttribute("aria-expanded", "true");
  await expect(list(page)).toBeVisible();
}

/** Opens the menu from the keyboard so focus is on the button, as a keyboard user would have it. */
async function openWithKeyboard(page: Page) {
  await button(page).focus();
  await page.keyboard.press("Enter");
  await expectOpen(page);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("on page load the list is hidden, the button is visible and aria-expanded is false", async ({ page }) => {
  await expect(button(page)).toBeVisible();
  await expect(button(page)).toHaveAccessibleName("Menu");
  await expectClosed(page);
});

test("activating the button shows the list and sets aria-expanded to true", async ({ page }) => {
  await button(page).click();
  await expectOpen(page);
  await expect(navLinks(page)).toHaveCount(6);
});

test("the button opens and closes with Enter and with Space", async ({ page }) => {
  await button(page).focus();
  await page.keyboard.press("Enter");
  await expectOpen(page);
  await page.keyboard.press("Enter");
  await expectClosed(page);
  await page.keyboard.press("Space");
  await expectOpen(page);
  await page.keyboard.press("Space");
  await expectClosed(page);
});

test("activating the button again closes the list and keeps focus on the button", async ({ page }) => {
  await openWithKeyboard(page);
  await page.keyboard.press("Enter");
  await expectClosed(page);
  await expect(button(page)).toBeFocused();
});

test("Escape while open closes the list and returns focus to the button", async ({ page }) => {
  await openWithKeyboard(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(navLinks(page).nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  await expectClosed(page);
  await expect(button(page)).toBeFocused();
});

test("choosing a link closes the list", async ({ page }) => {
  await openWithKeyboard(page);
  // Stop the navigation itself so the menu's own state can be observed; the
  // menu script's handler still runs, as it would before the browser navigates.
  await page.evaluate(() => {
    document.addEventListener("click", (event) => event.preventDefault(), { capture: true });
  });
  await navLinks(page).nth(2).click();
  await expectClosed(page);
  await expect(page).toHaveURL(/\/$/);
});

test("a click outside the menu closes it", async ({ page }) => {
  await button(page).click();
  await expectOpen(page);
  await page.locator("main h1").click();
  await expectClosed(page);
});

test("Tab out of the navigation closes it and focus moves on normally (no focus trap)", async ({ page }) => {
  await openWithKeyboard(page);
  for (let i = 0; i < 6; i += 1) await page.keyboard.press("Tab");
  await expect(navLinks(page).last()).toBeFocused();
  await expectOpen(page);
  await page.keyboard.press("Tab");
  await expectClosed(page);
  const focusInNav = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Main"]');
    return nav?.contains(document.activeElement) ?? false;
  });
  expect(focusInNav).toBe(false);
});

test("Shift+Tab out of the navigation closes it and focus moves to the previous element", async ({ page }) => {
  await openWithKeyboard(page);
  await page.keyboard.press("Shift+Tab");
  await expectClosed(page);
  await expect(page.getByRole("link", { name: "Don Coleman", exact: true }).first()).toBeFocused();
});

test("widening to 48rem resets to closed, shows the desktop list and moves focus off the hidden button", async ({
  page,
}) => {
  await openWithKeyboard(page);
  await page.setViewportSize({ width: 768, height: 844 });
  await expect(button(page)).toHaveAttribute("aria-expanded", "false");
  await expect(button(page)).toBeHidden();
  await expect(list(page)).toBeVisible();
  await expect(navLinks(page).first()).toBeFocused();
  // Narrowing again starts closed.
  await page.setViewportSize({ width: 390, height: 844 });
  await expectClosed(page);
});

test("widening to 48rem leaves focus where it was when it is not on the button", async ({ page }) => {
  await openWithKeyboard(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(navLinks(page).nth(2)).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(button(page)).toHaveAttribute("aria-expanded", "false");
  await expect(list(page)).toBeVisible();
  await expect(navLinks(page).nth(2)).toBeFocused();
});

// The Work with me label is the longest in the menu (FR-012, edge case "label fit"). The page-level
// reflow checks run with the menu closed, so this is the only check of the open menu and the label.
const WORK_WITH_ME = 'a[href="/work-with-me/"]';

/** The link's box is one line tall: its height does not exceed its computed line height by a line. */
async function expectOneLine(page: Page) {
  const wrapped = await page.locator(`${NAV_LIST} ${WORK_WITH_ME}`).evaluate((el) => {
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    return el.getBoundingClientRect().height - padding > lineHeight * 1.5;
  });
  expect(wrapped, "the Work with me label wraps").toBe(false);
}

async function expectNoSidewaysScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test("at 1280 px the six links share one row and Work with me is on one line", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(navLinks(page)).toHaveCount(6);
  const tops = await navLinks(page).evaluateAll((links) => links.map((a) => Math.round(a.getBoundingClientRect().top)));
  expect(new Set(tops).size, "all links start on one row").toBe(1);
  await expectOneLine(page);
});

test("at 320 px the open menu has no sideways scroll and Work with me lies inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await button(page).click();
  await expectOpen(page);
  await expectNoSidewaysScroll(page);
  await expectOneLine(page);
  const box = await page.locator(`${NAV_LIST} ${WORK_WITH_ME}`).boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});

// The same 200% zoom emulation as a11y.spec.ts: no inline styles, the CSP blocks them.
test("at 200% zoom the open menu has no sideways scroll and Work with me lies inside the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setDeviceMetricsOverride", { width: 640, height: 360, deviceScaleFactor: 2, mobile: false });
  await button(page).click();
  await expectOpen(page);
  await expectNoSidewaysScroll(page);
  const box = await page.locator(`${NAV_LIST} ${WORK_WITH_ME}`).boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(640);
});
