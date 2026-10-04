// Shared colour-theme helpers for the browser specs. The site's pre-paint script reads the
// `color-theme` key from localStorage, so a test picks a theme by writing it with
// `page.addInitScript`, which runs before any page script on every navigation.
import { expect, type Page } from "@playwright/test";

export type Theme = "dark" | "light";

/** Writes the colour theme before the first paint, as the site's own script reads it. */
export async function setTheme(page: Page, theme: Theme) {
  await page.addInitScript((value) => {
    try {
      localStorage.setItem("color-theme", value);
    } catch {
      // Storage unavailable: the page falls back to dark.
    }
  }, theme);
}

/** Asserts that the document is rendered in the given theme (the `dark` class on html). */
export async function expectThemeClass(page: Page, theme: Theme) {
  await expect(page.locator("html")).toHaveClass(theme === "dark" ? /\bdark\b/ : /^(?!.*\bdark\b)/);
}
