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
  await expect(navLinks(page)).toHaveCount(7);
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
  for (let i = 0; i < 7; i += 1) await page.keyboard.press("Tab");
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
