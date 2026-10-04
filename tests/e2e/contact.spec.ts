// Contact page journeys (specs/007-contact-form/quickstart.md; FR-008j, FR-009,
// SC-001). Each test sends a unique CF-Connecting-IP so tests do not share one
// rate-limit bucket (research R6). Turnstile runs with Cloudflare's always-pass
// test keys, so this needs network access to challenges.cloudflare.com.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
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
    // Retrieval of the stored message is asserted in "retrieval through the API" below.
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

const send = (page: Page) => page.getByRole("button", { name: /^Send/ });

test.describe("recovering from an error", () => {
  test("shows a consent error tied to the checkbox and keeps the typed values", async ({ page }) => {
    await uniqueSender(page);
    await page.goto("/contact/");
    await page.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
    await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
    await page.getByLabel("Message", { exact: true }).fill("Hello");
    await send(page).click();

    const consent = page.locator("#contact-consent");
    await expect(page.locator("#contact-consent-error")).toBeVisible();
    await expect(page.locator("#contact-consent-error")).toContainText("Tick the box to agree before sending.");
    await expect(consent).toHaveAttribute("aria-invalid", "true");
    await expect(consent).toHaveAttribute("aria-describedby", "contact-consent-error");
    await expect(consent).toBeFocused();
    await expect(page.locator("#contact-status")).toHaveText("1 field needs attention.");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Ada Lovelace");
    await expect(page.getByLabel("Message", { exact: true })).toHaveValue("Hello");

    // A corrected field's error clears on the next send.
    await consent.check();
    await send(page).click();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#contact-consent-error")).toBeHidden();
  });

  test("names the field and the limit for an invalid email and a 5,001-character message, with focus on the first invalid field", async ({
    page,
  }) => {
    await page.goto("/contact/");
    await fillValid(page);
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    // maxlength stops typing at 5,000; a paste-like programmatic value can exceed it.
    await page.locator("#contact-message").evaluate((el: HTMLTextAreaElement) => {
      el.value = "x".repeat(5001);
    });
    await send(page).click();

    await expect(page.locator("#contact-email-error")).toContainText("Email: enter a valid email address.");
    await expect(page.locator("#contact-message-error")).toContainText(
      "Message is too long. The limit is 5,000 characters.",
    );
    await expect(page.locator("#contact-email")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#contact-email")).toHaveAttribute("aria-describedby", "contact-email-error");
    await expect(page.locator("#contact-message")).toHaveAttribute("aria-describedby", "contact-message-error");
    await expect(page.locator("#contact-status")).toHaveText("2 fields need attention.");
    await expect(page.locator("#contact-email")).toBeFocused();
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue("not-an-email");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Ada Lovelace");
    expect(await page.locator("#contact-message").inputValue()).toHaveLength(5001);
  });

  test("a double-click on Send stores one message", async ({ page }) => {
    await uniqueSender(page);
    const posts: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/contact") && request.method() === "POST") posts.push(request.url());
    });
    await page.goto("/contact/");
    await fillValid(page);
    await send(page).dblclick();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    expect(posts).toHaveLength(1);
  });

  for (const [status, error, message] of [
    [503, "unavailable", "Your message wasn't sent because the service is unavailable. Please try again in a few minutes."],
    [429, "rate_limited", "You've sent too many messages. Please try again later."],
  ] as const) {
    test(`a ${status} answer shows the plain error, keeps every value and returns focus to Send`, async ({ page }) => {
      await page.route("**/api/contact", (route) =>
        route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ ok: false, error }) }),
      );
      await page.goto("/contact/");
      await fillValid(page);
      await send(page).click();

      await expect(page.locator("#contact-status")).toHaveText(message);
      await expect(send(page)).toBeEnabled();
      await expect(send(page)).toBeFocused();
      await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Ada Lovelace");
      await expect(page.getByLabel("Email", { exact: true })).toHaveValue("ada@example.com");
      await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
        "Hello, I would like to talk about a project.",
      );
      await expect(page.getByLabel(/I agree that Don Coleman/)).toBeChecked();
      await expect(page.locator("#contact-form")).toBeVisible();
      await expect(page.locator("#contact-success")).toBeHidden();
    });
  }

  test("a blocked Turnstile script shows the spam-check message and keeps the values", async ({ page }) => {
    await page.route("**/challenges.cloudflare.com/**", (route) => route.abort());
    await page.goto("/contact/");
    await fillValid(page);
    await send(page).click();

    await expect(page.locator("#contact-status")).toHaveText("The spam check couldn't load. Please try again later.");
    await expect(send(page)).toBeEnabled();
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Ada Lovelace");
    await expect(page.getByLabel("Message", { exact: true })).toHaveValue(
      "Hello, I would like to talk about a project.",
    );
    await expect(page.locator("#contact-success")).toBeHidden();
  });

  test("works by keyboard alone, announcing errors and then the success", async ({ page }) => {
    await uniqueSender(page);
    await page.goto("/contact/");
    await page.getByLabel("Name", { exact: true }).focus();
    // Tab to Send from the first field and press Enter on the empty form.
    for (let i = 0; i < 6; i += 1) await page.keyboard.press("Tab");
    await expect(send(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#contact-status")).toHaveText("4 fields need attention.");
    await expect(page.locator("#contact-status")).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("#contact-name")).toBeFocused();

    await page.keyboard.type("Ada Lovelace");
    await page.keyboard.press("Tab");
    await page.keyboard.type("ada@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type("A message typed without a mouse.");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await expect(page.locator("#contact-consent")).toBeChecked();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(send(page)).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#contact-success-heading")).toBeFocused();
    await expect(page.locator("#contact-name-error")).toBeHidden();
  });
});

// Retrieval through the API (FR-020 to FR-023b). The token is the public fake value in the
// e2e env file; the local D1 state is shared across tests, so the message is found by name.
const FIXTURE_ENV = fileURLToPath(new URL("../fixtures/worker/e2e.env", import.meta.url));
const READ_TOKEN = /^CONTACT_READ_TOKEN=(.+)$/m.exec(readFileSync(FIXTURE_ENV, "utf-8"))?.[1]?.trim() ?? "";

interface Listed {
  id: string;
  name: string;
  [key: string]: unknown;
}

async function listNew(request: APIRequestContext, name: string): Promise<Listed | undefined> {
  let cursor: string | null = null;
  do {
    const response = await request.get(`/api/messages/new?limit=100${cursor ? `&after=${cursor}` : ""}`, {
      headers: { Authorization: `Bearer ${READ_TOKEN}` },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { messages: Listed[]; next_cursor: string | null };
    const found = body.messages.find((m) => m.name === name);
    if (found) return found;
    cursor = body.next_cursor;
  } while (cursor);
  return undefined;
}

test.describe("retrieval through the API", () => {
  test("a sent message is listed once, can be marked read, and is then gone", async ({ page, request }) => {
    expect(READ_TOKEN.length).toBeGreaterThan(0);
    await uniqueSender(page);
    const name = `Retrieval ${Date.now()}`;
    await page.goto("/contact/");
    await expect(send(page)).toBeEnabled();
    await fillValid(page);
    await page.getByLabel("Name", { exact: true }).fill(name);
    await send(page).click();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });

    const listed = await listNew(request, name);
    expect(listed, "the sent message is in the new list").toBeDefined();
    expect(listed).toMatchObject({ email: "ada@example.com", organization: null, project: null });
    expect(listed).not.toHaveProperty("ip_hash");
    expect(listed).not.toHaveProperty("status");

    const auth = { Authorization: `Bearer ${READ_TOKEN}` };
    const marked = await request.post(`/api/messages/${listed!.id}/read`, { headers: auth });
    expect(marked.status()).toBe(200);
    expect(await marked.json()).toEqual({ id: listed!.id, status: "read" });

    expect(await listNew(request, name), "a read message never appears again").toBeUndefined();

    const again = await request.post(`/api/messages/${listed!.id}/read`, { headers: auth });
    expect(again.status()).toBe(409);

    const refused = await request.get("/api/messages/new");
    expect(refused.status()).toBe(401);
    expect(await refused.json()).toEqual({ error: "unauthorized" });
  });
});

test.describe("spam and abuse", () => {
  test("keeps the honeypot out of the tab order and the accessibility tree", async ({ page }) => {
    await page.goto("/contact/");
    const trap = page.locator('input[name="website"]');
    await expect(trap).toHaveCount(1);
    await expect(trap).toBeHidden();
    expect(await trap.getAttribute("tabindex")).toBe("-1");
    expect(await trap.evaluate((el) => el.closest("[aria-hidden='true']") !== null)).toBe(true);
    await expect(page.getByRole("textbox", { name: /website/i })).toHaveCount(0);

    // Tabbing through the whole form never lands on the trap.
    await page.getByLabel("Name", { exact: true }).focus();
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.name)).not.toBe("website");
    }
  });

  test("shows the success panel when the honeypot is filled, and stores nothing", async ({ page, request }) => {
    await uniqueSender(page);
    const name = `Honeypot ${Date.now()}`;
    await page.goto("/contact/");
    await expect(send(page)).toBeEnabled();
    await fillValid(page);
    await page.getByLabel("Name", { exact: true }).fill(name);
    await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => {
      el.value = "http://spam.example";
    });
    await send(page).click();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    expect(await listNew(request, name), "a honeypot submission is not stored").toBeUndefined();
  });
});

test.describe("coming from a project story", () => {
  test("?project=Metronome shows the About line and stores the project", async ({ page, request }) => {
    await uniqueSender(page);
    const name = `Project ${Date.now()}`;
    await page.goto("/contact/?project=Metronome");
    await expect(page.locator("#contact-project")).toHaveText("About: Metronome");
    await expect(page.locator("#contact-project")).toBeVisible();
    await fillValid(page);
    await page.getByLabel("Name", { exact: true }).fill(name);
    await send(page).click();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    expect((await listNew(request, name))?.project).toBe("Metronome");
  });

  test("a 150-character markup value renders as text, is cut to 100 and is stored the same way", async ({
    page,
    request,
  }) => {
    await uniqueSender(page);
    const name = `Project long ${Date.now()}`;
    const value = `<b>x</b>${"y".repeat(142)}`;
    expect(value).toHaveLength(150);
    const expected = value.slice(0, 100);
    await page.goto(`/contact/?project=${encodeURIComponent(value)}`);
    await expect(page.locator("#contact-project")).toHaveText(`About: ${expected}`);
    expect(await page.locator("#contact-project b").count()).toBe(0);
    await fillValid(page);
    await page.getByLabel("Name", { exact: true }).fill(name);
    await send(page).click();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    expect((await listNew(request, name))?.project).toBe(expected);
  });

  test("no parameter shows no line and stores null", async ({ page, request }) => {
    await uniqueSender(page);
    const name = `Project none ${Date.now()}`;
    await page.goto("/contact/");
    await expect(send(page)).toBeEnabled();
    await expect(page.locator("#contact-project")).toBeHidden();
    await fillValid(page);
    await page.getByLabel("Name", { exact: true }).fill(name);
    await send(page).click();
    await expect(page.locator("#contact-success")).toBeVisible({ timeout: 5000 });
    expect((await listNew(request, name))?.project).toBeNull();
  });
});

test.describe("privacy note", () => {
  test("the page note links the privacy policy, underlined, in a new tab", async ({ page }) => {
    await page.goto("/contact/");
    const link = page.locator("main p a[href='/privacy-policy/']").first();
    await expect(link).toHaveText("privacy policy (opens in a new tab)");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
    expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toContain("underline");
  });
});
