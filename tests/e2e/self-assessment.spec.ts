// The Wayfinder self-assessment in a real browser (specs/037-wayfinder-self-assessment,
// contracts/assessment-ui.md). The post and its expectations come from the content helper and the
// post's data file, so editing the statements or the post needs no change here. User story 1
// section: answering, validation, results, lazy loading, no network, layout.
import { test, expect, type Locator, type Page } from "@playwright/test";
import { postsWithAssessment } from "../helpers/content.ts";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";

const found = postsWithAssessment();
const { post, assessment } = found[0]!;
const PATH = post.address;
const SHIFTS = assessment.shifts;
const STATEMENT_COUNT = SHIFTS.length * 3;

const root = (page: Page) => page.locator("[data-assessment]");
const statement = (page: Page, shift: number, index: number) => page.locator(`[data-statement="${shift}.${index}"]`);

/** Scrolls the block near the viewport and waits until the lazily loaded module has started. */
async function ready(page: Page) {
  await root(page).scrollIntoViewIfNeeded();
  await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
}

async function open(page: Page, path = PATH) {
  await page.goto(path);
  await ready(page);
}

/** Answers every statement; `values[shift][index]` is 1 to 5. */
async function answer(page: Page, values: number[][]) {
  for (let s = 0; s < SHIFTS.length; s++) {
    for (let i = 0; i < 3; i++) {
      await statement(page, s, i).getByLabel(assessment.scale[values[s]![i]! - 1]!, { exact: true }).check();
    }
  }
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const ALL = (value: number) => SHIFTS.map(() => [value, value, value]);
// Shift 0 low (2.0), shift 1 middle (3.0), shift 2 high (4.0), shift 3 low (2.3), shift 4 high (5.0).
const MIXED = [[1, 2, 3], [3, 3, 3], [4, 4, 4], [2, 2, 3], [5, 5, 5]];

test.describe("self-assessment: answering and results", () => {
  test("the post that renders the assessment exists", () => {
    expect(found.length).toBeGreaterThan(0);
  });

  test("showing results with nothing answered shows an error summary and moves focus to the first gap (U3)", async ({ page }) => {
    await open(page);
    await page.locator("[data-assessment-show]").click();
    const errors = page.locator("[data-assessment-errors]");
    await expect(errors).toBeVisible();
    await expect(errors).toContainText(`${STATEMENT_COUNT} statements need an answer`);
    await expect(errors.getByRole("link")).toHaveCount(STATEMENT_COUNT);
    await expect(page.locator("[data-assessment-results]")).toBeHidden();
    const invalid = page.locator('[data-statement][aria-invalid="true"]');
    await expect(invalid).toHaveCount(STATEMENT_COUNT);
    await expect(page.locator("[data-statement-error]:visible")).toHaveCount(STATEMENT_COUNT);
    await expect(page.locator("[data-statement-error]").first()).toContainText("Choose an answer");
    await expect(page.locator("[data-assessment-status]")).toContainText(String(STATEMENT_COUNT));
    const firstRadio = statement(page, 0, 0).getByRole("radio").first();
    await expect(firstRadio).toBeFocused();
  });

  test("answering a statement clears its error and the count falls", async ({ page }) => {
    await open(page);
    await page.locator("[data-assessment-show]").click();
    await statement(page, 0, 0).getByLabel(assessment.scale[2]!, { exact: true }).check();
    await expect(statement(page, 0, 0)).not.toHaveAttribute("aria-invalid", "true");
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-errors]")).toContainText(`${STATEMENT_COUNT - 1} statements need an answer`);
  });

  test("a partly answered form lists only the unanswered statements and the first one is focused", async ({ page }) => {
    await open(page);
    for (let i = 0; i < 3; i++) await statement(page, 0, i).getByLabel(assessment.scale[0]!, { exact: true }).check();
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-errors]").getByRole("link")).toHaveCount(STATEMENT_COUNT - 3);
    await expect(statement(page, 1, 0).getByRole("radio").first()).toBeFocused();
  });

  test("complete answers show one chart row and one summary line per shift, each equal to the mean (U4, SC-002)", async ({ page }) => {
    await open(page);
    await answer(page, MIXED);
    await page.locator("[data-assessment-show]").click();
    const results = page.locator("[data-assessment-results]");
    await expect(results).toBeVisible();
    await expect(page.locator("[data-assessment-errors]")).toBeHidden();
    const lines = results.locator("[data-summary-line]");
    await expect(lines).toHaveCount(SHIFTS.length);
    const rows = results.locator("[data-chart-row]");
    await expect(rows).toHaveCount(SHIFTS.length);
    for (let s = 0; s < SHIFTS.length; s++) {
      const m = mean(MIXED[s]!);
      const score = m.toFixed(1);
      const text = (await lines.nth(s).innerText()).replace(/\s+/g, " ");
      expect(text).toContain(`${SHIFTS[s]!.name}: ${score} of 5`);
      if (m < 3) expect(text).toContain(`nearer 'From' (${SHIFTS[s]!.from})`);
      else if (m === 3) expect(text).toContain("in the middle");
      else expect(text).toContain(`nearer 'To' (${SHIFTS[s]!.to})`);
      // The marker sits at (mean - 1) / 4 of the track, a geometry attribute, not a style.
      const cx = Number(await rows.nth(s).locator("circle").getAttribute("cx"));
      expect(cx).toBeCloseTo(((m - 1) / 4) * 100, 1);
      // The row names both ends of the scale.
      await expect(rows.nth(s)).toContainText(SHIFTS[s]!.from);
      await expect(rows.nth(s)).toContainText(SHIFTS[s]!.to);
    }
  });

  test("the status announces the results and the results follow the button in DOM order (U5)", async ({ page }) => {
    await open(page);
    await answer(page, ALL(3));
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-status]")).toContainText("Your results are ready below.");
    const followsButton = await page.evaluate(() => {
      const button = document.querySelector("[data-assessment-show]")!;
      const results = document.querySelector("[data-assessment-results]")!;
      return Boolean(button.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(followsButton).toBe(true);
    await expect(page.locator("[data-assessment-show]")).toBeFocused();
  });

  test("changing an answer and showing results again updates the chart and the summary", async ({ page }) => {
    await open(page);
    await answer(page, ALL(1));
    await page.locator("[data-assessment-show]").click();
    const first = page.locator("[data-summary-line]").first();
    await expect(first).toContainText("1.0 of 5");
    for (let i = 0; i < 3; i++) await statement(page, 0, i).getByLabel(assessment.scale[4]!, { exact: true }).check();
    await page.locator("[data-assessment-show]").click();
    await expect(first).toContainText("5.0 of 5");
    await expect(page.locator("[data-assessment-status]")).toContainText("Your results are updated.");
    await expect(page.locator("[data-chart-row]")).toHaveCount(SHIFTS.length);
    expect(Number(await page.locator("[data-chart-row]").first().locator("circle").getAttribute("cx"))).toBeCloseTo(100, 1);
  });

  test("a keyboard alone completes the form and shows the results", async ({ page }) => {
    await open(page);
    await statement(page, 0, 0).getByRole("radio").first().focus();
    for (let s = 0; s < SHIFTS.length; s++) {
      for (let i = 0; i < 3; i++) {
        // Arrow keys move through the group and check as they go: three presses reach "Often".
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
        await expect(statement(page, s, i).getByLabel(assessment.scale[2]!, { exact: true })).toBeChecked();
        await page.keyboard.press("Tab");
      }
    }
    await expect(page.locator("[data-assessment-show]")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-assessment-results]")).toBeVisible();
    await expect(page.locator("[data-summary-line]")).toHaveCount(SHIFTS.length);
  });

  test("answering and showing results cause no network request (U15, FR-016)", async ({ page }) => {
    await open(page);
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await answer(page, MIXED);
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-results]")).toBeVisible();
    expect(requests).toEqual([]);
  });

  test("sets no style attribute, no inline handler and triggers no CSP violation (U19)", async ({ page }) => {
    await recordCspViolations(page);
    await open(page);
    await page.locator("[data-assessment-show]").click();
    await answer(page, MIXED);
    await page.locator("[data-assessment-show]").click();
    await expect(page.locator("[data-assessment-results]")).toBeVisible();
    expect(await page.locator("[data-assessment] [style]").count()).toBe(0);
    expect(await page.locator("[data-assessment] [onclick], [data-assessment] [onchange]").count()).toBe(0);
    expect(await cspViolations(page)).toEqual([]);
  });
});

test.describe("self-assessment: lazy loading (U16, FR-017)", () => {
  test("the module is requested only once the block is within one viewport height", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto(PATH);
    await page.waitForLoadState("networkidle");
    const top = await root(page).evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    expect(top, "the block sits more than two viewports down").toBeGreaterThan(844 * 2.5);
    const atLoad = scripts.length;
    await expect(root(page)).not.toHaveAttribute("data-assessment-ready", "true");

    // Two and a half viewports above the block: still too far.
    await page.evaluate((y) => window.scrollTo(0, y), top - 844 * 2.5);
    await page.waitForTimeout(300);
    expect(scripts.length).toBe(atLoad);
    await expect(root(page)).not.toHaveAttribute("data-assessment-ready", "true");

    // One and a half viewports above the block: within one viewport height of the visible area.
    await page.evaluate((y) => window.scrollTo(0, y), top - 844 * 1.5);
    await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
    expect(scripts.length).toBeGreaterThan(atLoad);
  });
});

/** Text-spacing overrides of WCAG 1.4.12. */
const TEXT_SPACING = "*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}p{margin-bottom:2em !important}";

async function expectContained(page: Page, scope: Locator) {
  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.client);
  // No descendant of the block pokes out past the block's own edges.
  const poking = await scope.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return [...element.querySelectorAll("*")]
      .filter((child) => {
        const rect = child.getBoundingClientRect();
        return rect.width > 0 && (rect.right > box.right + 1 || rect.left < box.left - 1);
      })
      .map((child) => child.tagName.toLowerCase() + (child.getAttribute("data-chart-row") === null ? "" : "[chart-row]"));
  });
  expect(poking).toEqual([]);
}

test.describe("self-assessment: layout (U17, FR-018)", () => {
  // The checks add a stylesheet, which the page policy would refuse, so they run without it.
  test.use({ bypassCSP: true });

  for (const [name, setup] of [
    ["320 px wide", async (page: Page) => page.setViewportSize({ width: 320, height: 700 })],
    ["200% zoom", async (page: Page) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.zoom = "2"; }));
    }],
    ["the text-spacing overrides at 320 px", async (page: Page) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.addInitScript((css) => document.addEventListener("DOMContentLoaded", () => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }), TEXT_SPACING);
    }],
  ] as const) {
    test(`the form, errors and results fit ${name} without sideways scroll or clipping`, async ({ page }) => {
      await setup(page);
      await open(page);
      await expectContained(page, root(page));
      await page.locator("[data-assessment-show]").click();
      await expect(page.locator("[data-assessment-errors]")).toBeVisible();
      await expectContained(page, root(page));
      await answer(page, MIXED);
      await page.locator("[data-assessment-show]").click();
      await expect(page.locator("[data-assessment-results]")).toBeVisible();
      await expectContained(page, root(page));
    });
  }
});

test.describe("self-assessment: from a low score to what to practise (US2)", () => {
  const show = (page: Page) => page.locator("[data-assessment-show]").click();

  test("two low shifts show exactly two Read links and their Practical Application text (U6)", async ({ page }) => {
    await open(page);
    await answer(page, MIXED);
    await show(page);
    const links = page.locator("[data-assessment-results] [data-low-link]");
    await expect(links).toHaveCount(2);
    for (const [n, s] of [[0, 0], [1, 3]] as const) {
      await expect(links.nth(n)).toHaveText(`Read ${SHIFTS[s]!.name}`);
      await expect(links.nth(n)).toHaveAttribute("href", `#${SHIFTS[s]!.anchor}`);
      const item = page.locator("[data-assessment-results] [data-low-shift]").nth(n);
      await expect(item).toContainText(SHIFTS[s]!.practicalApplication.replace(/\s+/g, " "));
    }
    await expect(page.locator("[data-assessment-results]")).not.toContainText("None of your scores is below the middle.");
  });

  test("following a link shows the heading below the top, focuses it and leaves the fragment alone (U7)", async ({ page }) => {
    await open(page);
    await answer(page, MIXED);
    await show(page);
    await page.locator("[data-assessment-results] [data-low-link]").first().click();
    const heading = page.locator(`[id="${SHIFTS[0]!.anchor}"]`);
    await expect(heading).toBeFocused();
    await expect.poll(() => heading.evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBeGreaterThanOrEqual(48);
    await expect(heading).toBeInViewport();
    expect(new URL(page.url()).hash).toBe("");
  });

  test("with no low shift the message and the next shift to practise show", async ({ page }) => {
    await open(page);
    const values = ALL(4);
    values[2] = [3, 3, 3];
    values[4] = [3, 3, 3];
    values[1] = [3, 3, 4];
    await answer(page, values);
    await show(page);
    const results = page.locator("[data-assessment-results]");
    await expect(results).toContainText("None of your scores is below the middle.");
    await expect(results).toContainText(`Next to practise: ${SHIFTS[2]!.name}`);
    await expect(results.locator("[data-low-link]")).toHaveCount(1);
    await expect(results).toContainText(SHIFTS[2]!.practicalApplication.replace(/\s+/g, " "));
  });

  test("with reduced motion the page scrolls instantly (U20)", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await open(page);
    await answer(page, MIXED);
    await show(page);
    await page.locator("[data-assessment-results] [data-low-link]").first().click();
    const heading = page.locator(`[id="${SHIFTS[0]!.anchor}"]`);
    await expect(heading).toBeFocused();
    // Instant scrolling: the heading is in place on the next frame, without waiting for an animation.
    const top = await heading.evaluate((node) => new Promise<number>((resolve) => requestAnimationFrame(() => resolve(node.getBoundingClientRect().top))));
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(400);
    await context.close();
  });
});
