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

  test("the comparison region can be reached and scrolled by keyboard", async ({ page }) => {
    await page.goto(STORY);
    const region = page.getByRole("region", { name: /ways to reach OmniFocus/ });
    await expect(region).toHaveCount(1);
    await region.focus();
    await expect(region).toBeFocused();
    await expect(region.getByRole("table")).toBeVisible();
    await expect(region.getByRole("columnheader", { name: /Chosen/ })).toHaveCount(1);
  });

  test("has a stand-in link, draft marks and placeholder marks", async ({ page }) => {
    await page.goto(STORY);
    await expect(page.getByRole("link", { name: "Focus Pocus on drc.dev" })).toHaveAttribute(
      "href",
      "https://drc.dev/projects/focus-pocus",
    );
    await expect(page.getByText("This is not a live demo.")).toBeVisible();
    await expect(page.locator("[data-draft-mark]")).toHaveCount(7);
    expect(await page.locator("[data-placeholder]").count()).toBeGreaterThan(0);
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
