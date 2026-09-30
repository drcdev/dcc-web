// Contact page journeys (specs/007-contact-form/quickstart.md; FR-008j, FR-009,
// SC-001). Each test sends a unique CF-Connecting-IP so tests do not share one
// rate-limit bucket (research R6). Turnstile runs with Cloudflare's always-pass
// test keys, so this needs network access to challenges.cloudflare.com.
import { test, expect, type Page } from "@playwright/test";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

let counter = 0;
async function uniqueSender(page: Page) {
  const address = `203.0.113.${((Date.now() + counter++) % 250) + 1}`;
  await page.route("**/api/contact", (route) =>
    route.continue({ headers: { ...route.request().headers(), "cf-connecting-ip": address } }),
  );
}

async function fillValid(page: Page) {
  await page.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
  await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await page.getByLabel("Message", { exact: true }).fill("Hello, I would like to talk about a project.");
  await page.getByLabel(/I agree that Don Coleman/).check();
}

test.describe("valid send", () => {
  test("shows a confirmation with focus on its heading within 5 s, with no challenge request before interaction and no CSP violation", async ({
    page,
  }) => {
    await recordCspViolations(page);
    await uniqueSender(page);
    const challengeRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("challenges.cloudflare.com")) challengeRequests.push(request.url());
    });

    await page.goto("/contact/");
    await expect(page.getByRole("button", { name: "Send" })).toBeEnabled();
    await expect(page.locator("#contact-js-required")).toBeHidden();
    await page.waitForTimeout(500);
    expect(challengeRequests, "no request to Cloudflare before the first interaction (FR-009)").toEqual([]);

    await fillValid(page);
    const started = Date.now();
    await page.getByRole("button", { name: "Send" }).click();

    const success = page.locator("#contact-success");
    await expect(success).toBeVisible({ timeout: 5000 });
    expect(Date.now() - started).toBeLessThan(5500);
    // Focus moves to the panel's heading so it is announced (FR-008j).
    await expect(page.locator("#contact-success-heading")).toBeFocused();
    await expect(page.locator("#contact-form")).toBeHidden();
    expect(await cspViolations(page)).toEqual([]);
    // Retrieval of the stored message through the API is asserted in Phase 6.
  });

  test("/contact/ allows the Turnstile host in its CSP and the home page does not", async ({ request }) => {
    const contact = await (await request.get("/contact/")).text();
    const home = await (await request.get("/")).text();
    const policy = (html: string) => /http-equiv="content-security-policy"\s+content="([^"]*)"/i.exec(html)?.[1] ?? "";
    expect(policy(contact)).toContain("https://challenges.cloudflare.com");
    expect(policy(contact)).toMatch(/frame-src[^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(policy(home)).not.toContain("challenges.cloudflare.com");
  });

  test("keeps the tab order Name, Email, Organization, Message, consent, privacy link, Send", async ({ page }) => {
    await page.goto("/contact/");
    await page.getByLabel("Name", { exact: true }).focus();
    const stops: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      stops.push(
        await page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("href") || ""),
      );
      await page.keyboard.press("Tab");
    }
    expect(stops).toEqual([
      "contact-name",
      "contact-email",
      "contact-organization",
      "contact-message",
      "contact-consent",
      "/privacy-policy/",
      "",
    ]);
  });
});
