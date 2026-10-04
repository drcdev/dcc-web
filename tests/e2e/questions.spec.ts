// The questions panel journeys on a fixture post (specs/022 tasks T024; contracts/questions-panel.md
// P04, P08, P10 to P17; FR-005, FR-016, FR-019). Runs on the fixture site (port 4322, project
// `sections`) with `/api/questions` stubbed, so no model is ever called.
import { expect, test, type Page } from "@playwright/test";
import { stubQuestionsApi } from "./questions-stub.ts";

const POST = "/writing/text-only/";
const SET = ["What evidence supports the claim?", "Who might disagree?", "What would change the conclusion?"];
const ok = (questions: string[], source = "generated") => ({ body: { ok: true, source, questions } });

const panel = (page: Page) => page.locator("[data-questions]");
const getButton = (page: Page) => panel(page).locator("[data-questions-get]");
const newButton = (page: Page) => panel(page).locator("[data-questions-new]");
const status = (page: Page) => panel(page).locator("[data-questions-status]");
const items = (page: Page) => panel(page).locator("[data-questions-list] > li");
const note = (page: Page) => panel(page).locator("[data-questions-note]");

test.describe("questions panel", () => {
  test("makes no request on load (P04)", async ({ page }) => {
    const stub = await stubQuestionsApi(page, [ok(SET)]);
    await page.goto(POST);
    await expect(getButton(page)).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(stub.requests).toHaveLength(0);
  });

  test("sends the slug, the page's hash and fresh: false when Get questions is pressed (P10)", async ({ page }) => {
    const stub = await stubQuestionsApi(page, [ok(SET)]);
    await page.goto(POST);
    const hash = await panel(page).getAttribute("data-hash");
    await getButton(page).click();
    await expect(items(page)).toHaveCount(3);
    expect(stub.requests).toEqual([{ slug: "text-only", hash, fresh: false }]);
  });

  test("shows a loading state that keeps focus, ignores a second press and announces it (P11, FR-005)", async ({ page }) => {
    const stub = await stubQuestionsApi(page, [{ ...ok(SET), hold: true }]);
    await page.goto(POST);
    await getButton(page).focus();
    await getButton(page).click();
    await expect(getButton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(status(page)).toHaveText("Getting questions...");
    await expect(getButton(page)).toBeFocused();
    await getButton(page).click({ force: true });
    await page.keyboard.press("Enter");
    expect(stub.requests).toHaveLength(1);
    stub.release();
    await expect(items(page)).toHaveCount(3);
  });

  test("shows exactly the returned strings as text in an ordered list, with the AI note (P12, P13)", async ({ page }) => {
    await stubQuestionsApi(page, [ok(["Is <b>x</b> really so?", "Why does it matter?"])]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(items(page)).toHaveCount(2);
    await expect(items(page).first()).toHaveText("Is <b>x</b> really so?");
    await expect(panel(page).locator("[data-questions-list] b")).toHaveCount(0);
    expect(await panel(page).locator("[data-questions-list]").evaluate((el) => el.tagName)).toBe("OL");
    await expect(note(page)).toBeVisible();
    await expect(note(page)).toHaveText(
      "These questions were written by an AI model from the post text. They may be imperfect.",
    );
  });

  test("announces that questions are ready and moves focus to New questions (P08)", async ({ page }) => {
    await stubQuestionsApi(page, [ok(SET)]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(status(page)).toHaveText("Questions are ready.");
    await expect(newButton(page)).toBeVisible();
    await expect(newButton(page)).toBeFocused();
    await expect(getButton(page)).toBeHidden();
  });

  test("New questions sends fresh: true, replaces the items in place and announces it (P10)", async ({ page }) => {
    const stub = await stubQuestionsApi(page, [ok(SET), ok(["A new question?", "Another new one?"], "fresh")]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(items(page)).toHaveCount(3);
    const hash = await panel(page).getAttribute("data-hash");
    await newButton(page).click();
    await expect(items(page)).toHaveCount(2);
    await expect(items(page).first()).toHaveText("A new question?");
    await expect(status(page)).toHaveText("New questions are ready.");
    await expect(newButton(page)).toBeFocused();
    await expect(note(page)).toBeVisible();
    expect(stub.requests[1]).toEqual({ slug: "text-only", hash, fresh: true });
  });

  test("treats fewer than 2 returned strings as an error and shows at most 4 (P16)", async ({ page }) => {
    await stubQuestionsApi(page, [ok(["Only one?"]), ok(["a?", "b?", "c?", "d?", "e?", "f?"])]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(status(page)).toHaveText("Questions could not be loaded. Try again.");
    await expect(items(page)).toHaveCount(0);
    await getButton(page).click();
    await expect(items(page)).toHaveCount(4);
  });

  for (const [name, response] of [
    ["503", { status: 503, body: { ok: false, error: "unavailable" } }],
    ["404 not_found", { status: 404, body: { ok: false, error: "not_found" } }],
  ] as const) {
    test(`shows the retry message on a ${name} answer and keeps the button available (P14, P17)`, async ({ page }) => {
      const stub = await stubQuestionsApi(page, [response, ok(SET)]);
      await page.goto(POST);
      await getButton(page).click();
      await expect(status(page)).toHaveText("Questions could not be loaded. Try again.");
      await expect(getButton(page)).toBeVisible();
      await expect(getButton(page)).not.toHaveAttribute("aria-disabled", "true");
      await expect(getButton(page)).toBeFocused();
      await getButton(page).click();
      await expect(items(page)).toHaveCount(3);
      expect(stub.requests).toHaveLength(2);
    });
  }

  test("shows the retry message when the network fails", async ({ page }) => {
    await page.route("**/api/questions", (route) => route.abort());
    await page.goto(POST);
    await getButton(page).click();
    await expect(status(page)).toHaveText("Questions could not be loaded. Try again.");
    await expect(getButton(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("keeps the previous questions when New questions fails (P14)", async ({ page }) => {
    await stubQuestionsApi(page, [ok(SET), { status: 503, body: { ok: false, error: "unavailable" } }]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(items(page)).toHaveCount(3);
    await newButton(page).click();
    await expect(status(page)).toHaveText("Questions could not be loaded. Try again.");
    await expect(items(page)).toHaveCount(3);
    await expect(newButton(page)).toBeFocused();
  });

  test("tells the reader to reload when the post has changed (stale)", async ({ page }) => {
    await stubQuestionsApi(page, [{ status: 404, body: { ok: false, error: "stale" } }]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(status(page)).toHaveText("This post has changed since the page loaded. Reload the page to get questions.");
  });

  test("on 429 shows the limit message in minutes from retryAfter (P15)", async ({ page }) => {
    await stubQuestionsApi(page, [
      { status: 429, headers: { "Retry-After": "432" }, body: { ok: false, error: "limited", retryAfter: 432 } },
    ]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(status(page)).toHaveText(
      "Questions are unavailable for now because today's limit has been reached. Try again in about 8 minutes.",
    );
    await expect(getButton(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("on 429 with a long wait shows hours (P15)", async ({ page }) => {
    await stubQuestionsApi(page, [
      { status: 429, headers: { "Retry-After": "7300" }, body: { ok: false, error: "limited", retryAfter: 7300 } },
    ]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(status(page)).toContainText("Try again in about 3 hours.");
  });

  for (const [seconds, wait] of [
    [1, "1 minute"],
    [59, "1 minute"],
    [60, "1 minute"],
    [61, "2 minutes"],
    [5400, "90 minutes"],
    [5401, "2 hours"],
    [7200, "2 hours"],
  ] as const) {
    test(`on 429 with retryAfter ${seconds} the wait reads "${wait}", announced in the status region (P15)`, async ({ page }) => {
      await stubQuestionsApi(page, [
        { status: 429, headers: { "Retry-After": String(seconds) }, body: { ok: false, error: "limited", retryAfter: seconds } },
      ]);
      await page.goto(POST);
      await getButton(page).focus();
      await getButton(page).click();
      await expect(status(page)).toHaveText(
        `Questions are unavailable for now because today's limit has been reached. Try again in about ${wait}.`,
      );
      await expect(getButton(page)).toBeFocused();
      await expect(getButton(page)).not.toHaveAttribute("aria-disabled", "true");
    });
  }

  test("keeps the previous questions and focus on New questions when it is limited (P15)", async ({ page }) => {
    await stubQuestionsApi(page, [
      ok(SET),
      { status: 429, headers: { "Retry-After": "432" }, body: { ok: false, error: "limited", retryAfter: 432 } },
    ]);
    await page.goto(POST);
    await getButton(page).click();
    await expect(items(page)).toHaveCount(3);
    await newButton(page).click();
    await expect(status(page)).toContainText("today's limit has been reached. Try again in about 8 minutes.");
    await expect(items(page)).toHaveCount(3);
    await expect(newButton(page)).toBeFocused();
    await expect(newButton(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("sets no cookie and writes nothing to local or session storage (FR-019)", async ({ page }) => {
    await stubQuestionsApi(page, [ok(SET), ok(["A new question?", "Another new one?"], "fresh")]);
    await page.goto(POST);
    const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    await getButton(page).click();
    await expect(items(page)).toHaveCount(3);
    await newButton(page).click();
    await expect(items(page)).toHaveCount(2);
    expect(await page.evaluate(() => document.cookie)).toBe("");
    const after = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
    expect(after).toEqual(before);
  });
});
