// The Wayfinder self-assessment in a real browser (specs/037-wayfinder-self-assessment,
// contracts/assessment-ui.md). The post and its expectations come from the content helper and the
// post's data file, so editing the statements or the post needs no change here. User story 1
// section: answering, validation, results, lazy loading, no network, layout.
import { test, expect, type Locator, type Page } from "@playwright/test";
import { postsWithAssessment } from "../helpers/content.ts";
import { cspViolations, recordCspViolations } from "./csp-violations.ts";
import { encodeResult } from "../../src/lib/assessment/result-link.ts";
import { statementSetVersion } from "../../src/lib/assessment/version.ts";

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

/** The three squeezed conditions the layout checks run under. */
const LAYOUTS = [
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
] as const;

test.describe("self-assessment: layout (U17, FR-018)", () => {
  // The checks add a stylesheet, which the page policy would refuse, so they run without it.
  test.use({ bypassCSP: true });

  for (const [name, setup] of LAYOUTS) {
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
    const hashBefore = new URL(page.url()).hash;
    await page.locator("[data-assessment-results] [data-low-link]").first().click();
    const heading = page.locator(`[id="${SHIFTS[0]!.anchor}"]`);
    await expect(heading).toBeFocused();
    await expect.poll(() => heading.evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBeGreaterThanOrEqual(48);
    await expect(heading).toBeInViewport();
    expect(new URL(page.url()).hash).toBe(hashBefore);
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

test.describe("self-assessment: print a six-week plan (US3)", () => {
  const show = (page: Page) => page.locator("[data-assessment-show]").click();
  const sheet = (page: Page) => page.locator("body > [data-assessment-plan-sheet]");
  // MIXED sums: 6, 9, 12, 7, 15 -> plan order by score: shifts 0, 3, 1, 2, 4.
  const PLAN_ORDER = [0, 3, 1, 2, 4];

  test("Print my plan calls window.print and adds the plan sheet and root attribute", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { printed: number }).printed = 0;
      window.print = () => {
        (window as unknown as { printed: number }).printed++;
      };
    });
    await open(page);
    await expect(page.locator("[data-assessment-print]")).toHaveCount(0);
    await answer(page, MIXED);
    await show(page);
    await expect(sheet(page)).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("data-assessment-plan", "");
    await page.getByRole("button", { name: "Print my plan" }).click();
    expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
  });

  test("in print media only the plan sheet shows, in the stated order, weeks by score (U8)", async ({ page }) => {
    await open(page);
    await answer(page, MIXED);
    await show(page);
    await page.emulateMedia({ media: "print" });
    await expect(sheet(page)).toBeVisible();
    for (const hidden of ["header", "footer", "main", "article"]) {
      for (const node of await page.locator(hidden).all()) await expect(node).toBeHidden();
    }
    const text = (await sheet(page).innerText()).replace(/\s+/g, " ");
    const marks = [
      assessment.title,
      ...SHIFTS.map((s) => s.name + ": "),
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5",
      "Week 6",
    ];
    let at = -1;
    for (const mark of marks) {
      const next = text.indexOf(mark, at + 1);
      expect(next, `${mark} after position ${at}`).toBeGreaterThan(at);
      at = next;
    }
    const weeks = sheet(page).locator("[data-plan-week]");
    await expect(weeks).toHaveCount(6);
    for (let n = 0; n < 5; n++) {
      const shift = SHIFTS[PLAN_ORDER[n]!]!;
      await expect(weeks.nth(n)).toContainText(`Week ${n + 1}`);
      await expect(weeks.nth(n)).toContainText(shift.name);
      await expect(weeks.nth(n)).toContainText(shift.week.replace(/\s+/g, " "));
    }
    await expect(weeks.nth(5)).toContainText("Week 6");
    await expect(weeks.nth(5)).toContainText(assessment.integrationWeek.name);
    await expect(weeks.nth(5)).toContainText(assessment.integrationWeek.week.replace(/\s+/g, " "));
  });

  test("tied scores keep the post's order in the plan", async ({ page }) => {
    await open(page);
    await answer(page, ALL(3));
    await show(page);
    const weeks = sheet(page).locator("[data-plan-week]");
    for (let n = 0; n < 5; n++) await expect(weeks.nth(n)).toContainText(SHIFTS[n]!.name);
  });

  for (const format of ["A4", "Letter"] as const) {
    test(`the plan prints on at most two pages on ${format} (U9, SC-003)`, async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "page.pdf is Chromium only");
      await open(page);
      await answer(page, MIXED);
      await show(page);
      const pdf = await page.pdf({ format });
      const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
      expect(pages).toBeGreaterThan(0);
      expect(pages).toBeLessThanOrEqual(2);
    });
  }

  test("without results the print holds the statement list and no form controls (FR-011)", async ({ page }) => {
    await open(page);
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("[data-assessment-nojs]")).toBeVisible();
    await expect(page.locator("[data-assessment-app]")).toBeHidden();
    await expect(page.locator("[data-assessment-nojs] li")).toHaveCount(STATEMENT_COUNT);
    await expect(page.locator("[data-assessment] input:visible, [data-assessment] button:visible")).toHaveCount(0);
    await expect(page.locator("body > [data-assessment-plan-sheet]")).toHaveCount(0);
  });
});

test.describe("self-assessment: retake later and see how I have grown (US4)", () => {
  const show = (page: Page) => page.locator("[data-assessment-show]").click();
  const VERSION = statementSetVersion(SHIFTS);
  const OTHER_VERSION = VERSION === "ffffffff" ? "eeeeeeee" : "ffffffff";
  const EARLIER_SUMS = [6, 9, 12, 7, 15];
  const linkFor = (version = VERSION, sums = EARLIER_SUMS) => `${PATH}#${encodeResult({ version, date: "2026-09-01", sums })}`;
  const earlier = (page: Page) => page.locator("[data-assessment-earlier]");
  const titleLink = (page: Page) => page.locator("[data-assessment-link]");
  const originalLinkText = "Take the self-assessment";

  async function openLink(page: Page, url = linkFor()) {
    // A hash-only change would not reload the page, so leave it first.
    await page.goto("about:blank");
    await page.goto(url);
    await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
  }

  test("an earlier result shows at once with its date and the title-card link changes wording without moving (L1, U20)", async ({ page }) => {
    await page.goto(PATH);
    const before = await titleLink(page).evaluate((node) => node.parentElement!.getBoundingClientRect().toJSON());
    await expect(titleLink(page)).toHaveText(originalLinkText);
    await openLink(page);
    await expect(earlier(page)).toBeVisible();
    await expect(earlier(page)).toContainText("Earlier result from");
    await expect(earlier(page)).toContainText("2026");
    await expect(earlier(page)).not.toContainText("made with an earlier set of questions");
    await expect(earlier(page).locator("[data-summary-line]")).toHaveCount(SHIFTS.length);
    await expect(earlier(page).locator("[data-chart-row]")).toHaveCount(SHIFTS.length);
    await expect(page.locator("[data-assessment-results]")).toBeHidden();
    await expect(page.locator('[data-statement] input:checked')).toHaveCount(0);
    await expect(titleLink(page)).toHaveText("Your earlier result is below");
    const after = await titleLink(page).evaluate((node) => node.parentElement!.getBoundingClientRect().toJSON());
    expect(after).toEqual(before);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("activating the title-card link focuses its target heading and leaves the fragment (U20)", async ({ page }) => {
    await openLink(page);
    await titleLink(page).click();
    await expect(page.locator("[data-earlier-heading]")).toBeFocused();
    expect(new URL(page.url()).hash).toBe(new URL(linkFor(), "http://x").hash);
    await page.goto("about:blank");
    await open(page);
    await titleLink(page).click();
    await expect(page.locator(`[id="${(await titleLink(page).getAttribute("href"))!.slice(1)}"]`)).toBeFocused();
    expect(new URL(page.url()).hash).toBe("");
  });

  test("a result made with an earlier set of questions shows on its own and a retake shows separately with no change (L2, U13)", async ({ page }) => {
    await openLink(page, linkFor(OTHER_VERSION));
    await expect(earlier(page)).toContainText("made with an earlier set of questions");
    await answer(page, ALL(3));
    await show(page);
    const results = page.locator("[data-assessment-results]");
    await expect(results).toBeVisible();
    await expect(earlier(page)).toBeVisible();
    await expect(results.locator("[data-summary-line]")).toHaveCount(SHIFTS.length);
    await expect(results.locator("[data-chart-legend]")).toHaveCount(0);
    await expect(results.locator('polygon[data-marker="earlier"]')).toHaveCount(0);
    await expect(results.locator("[data-summary-line]").filter({ hasText: /since your earlier result|\b(up|down) \d|no change/ })).toHaveCount(0);
  });

  test("a retake of the same questions shows both markers, a legend and the change per shift (L1, U12)", async ({ page }) => {
    await openLink(page);
    await answer(page, ALL(3));
    await show(page);
    const results = page.locator("[data-assessment-results]");
    await expect(results.locator("[data-chart-legend]")).toContainText("Earlier");
    await expect(results.locator("[data-chart-legend]")).toContainText("Now");
    const rows = results.locator("[data-chart-row]");
    const lines = results.locator("[data-summary-line]");
    // Earlier sums 6, 9, 12, 7, 15 against a retake of 9 each.
    const change = ["up 1.0", "no change", "down 1.0", "up 0.7", "down 2.0"];
    for (let s = 0; s < SHIFTS.length; s++) {
      await expect(rows.nth(s).locator('circle[data-marker="new"]')).toHaveCount(1);
      await expect(rows.nth(s).locator('polygon[data-marker="earlier"]')).toHaveCount(1);
      await expect(lines.nth(s)).toContainText(change[s]!);
      await expect(lines.nth(s)).toContainText(`${SHIFTS[s]!.name}: 3.0 of 5`);
    }
    // The diamond sits where the earlier mean put it: (mean - 1) / 4 of the track.
    const points = await rows.first().locator("polygon").getAttribute("points");
    const xs = points!.split(" ").map((pair) => Number(pair.split(",")[0]));
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(((6 / 3 - 1) / 4) * 100, 1);
  });

  test("a link that cannot be read says so, keeps the title-card wording and leaves the fragment (L3)", async ({ page }) => {
    const bad = `${PATH}#result=${VERSION}.20260901.6-9-12-7-16`;
    await openLink(page, bad);
    await expect(page.locator("[data-assessment-status]")).toHaveText("This results link could not be read.");
    await expect(earlier(page)).toBeHidden();
    await expect(titleLink(page)).toHaveText(originalLinkText);
    expect(new URL(page.url()).hash).toBe(new URL(bad, "http://x").hash);
    await answer(page, ALL(3));
    await show(page);
    expect(new URL(page.url()).hash).toMatch(/^#result=[0-9a-f]{8}\.\d{8}\.9-9-9-9-9$/);
  });

  test("with a fragment the module chunk is requested at once, without scrolling (U16, FR-017)", async ({ page }) => {
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto(linkFor());
    await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(scripts.some((url) => url.includes("client"))).toBe(true);
  });

  test("showing results writes the new result into the address without adding a history entry (L5)", async ({ page }) => {
    await open(page);
    const length = await page.evaluate(() => history.length);
    await answer(page, MIXED);
    await show(page);
    expect(new URL(page.url()).hash).toMatch(/^#result=[0-9a-f]{8}\.\d{8}\.6-9-12-7-15$/);
    expect(await page.evaluate(() => history.length)).toBe(length);
    await answer(page, ALL(1));
    await show(page);
    expect(new URL(page.url()).hash).toMatch(/\.3-3-3-3-3$/);
    expect(await page.evaluate(() => history.length)).toBe(length);
  });

  test("the results show the link as text, a Copy link button and the sharing sentence (U10)", async ({ page, context, browserName }) => {
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page);
    await answer(page, MIXED);
    await show(page);
    const text = (await page.locator("[data-results-link]").innerText()).trim();
    expect(text).toBe(page.url());
    await expect(page.locator("[data-results-link-note]")).toContainText(/anyone with the link/i);
    await expect(page.locator("[data-results-link-note]")).toContainText(/clearing/i);
    await page.getByRole("button", { name: "Copy link" }).click();
    await expect(page.locator("[data-assessment-status]")).toContainText("Link copied.");
    if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  });

  test("Clear my answers removes answers, results, the earlier result, the plan and the fragment, and focuses the first radio (L6, U14)", async ({ page }) => {
    await openLink(page);
    await answer(page, MIXED);
    await show(page);
    await expect(page.locator("body > [data-assessment-plan-sheet]")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear my answers" }).click();
    await expect(page.locator("[data-assessment-status]")).toHaveText("Your answers have been cleared.");
    await expect(statement(page, 0, 0).getByRole("radio").first()).toBeFocused();
    await expect(page.locator("[data-statement] input:checked")).toHaveCount(0);
    await expect(page.locator("[data-assessment-results]")).toBeHidden();
    await expect(earlier(page)).toBeHidden();
    await expect(page.locator("body > [data-assessment-plan-sheet]")).toHaveCount(0);
    await expect(page.locator("html")).not.toHaveAttribute("data-assessment-plan", "");
    expect(new URL(page.url()).hash).toBe("");
    await expect(titleLink(page)).toHaveText(originalLinkText);
  });

  test("clearing after errors hides the errors too", async ({ page }) => {
    await open(page);
    await show(page);
    await page.getByRole("button", { name: "Clear my answers" }).click();
    await expect(page.locator("[data-assessment-errors]")).toBeHidden();
    await expect(page.locator('[data-statement][aria-invalid="true"]')).toHaveCount(0);
  });
});

test.describe("self-assessment: nothing leaves the page (L7, U15, SC-004, FR-012, FR-016)", () => {
  test("a journey opened through a results link makes no request carrying the result and writes nothing", async ({ page, context }) => {
    const version = statementSetVersion(SHIFTS);
    const fragment = encodeResult({ version, date: "2026-09-01", sums: [6, 9, 12, 7, 15] });
    const everything: { url: string; headers: string; body: string; type: string }[] = [];
    const pending: Promise<void>[] = [];
    context.on("request", (request) => {
      pending.push(
        request.allHeaders().then((headers) => {
          everything.push({ url: request.url(), headers: JSON.stringify(headers), body: request.postData() ?? "", type: request.resourceType() });
        }),
      );
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
    await page.addInitScript(() => {
      window.print = () => {};
    });
    await page.goto(`${PATH}#${fragment}`);
    await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
    // Scroll the whole page once so the browser's own lazy images are loaded before the baseline.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.waitForLoadState("networkidle");
    await Promise.all(pending);

    const storage = () =>
      page.evaluate(async () => ({
        local: JSON.stringify({ ...localStorage }),
        session: JSON.stringify({ ...sessionStorage }),
        databases: (await indexedDB.databases()).map((db) => db.name),
        caches: await caches.keys(),
        state: JSON.stringify(history.state),
      }));
    const cookiesBefore = await context.cookies();
    const storageBefore = await storage();
    const afterLoad = everything.length;

    await answer(page, MIXED);
    await page.locator("[data-assessment-show]").click();
    await page.locator("[data-assessment-results] [data-low-link]").first().click();
    await page.getByRole("button", { name: "Copy link" }).click();
    await page.getByRole("button", { name: "Print my plan" }).click();
    await titleLinkClick(page);
    await page.getByRole("button", { name: "Clear my answers" }).click();
    await page.waitForTimeout(500);
    await Promise.all(pending);

    expect(everything.slice(afterLoad), "requests after load").toEqual([]);
    const answerTexts = SHIFTS.flatMap((s) => s.statements);
    for (const request of everything) {
      const haystack = `${request.url}\n${request.headers}\n${request.body}`;
      expect(haystack, request.url).not.toContain("result=");
      expect(haystack, request.url).not.toContain(fragment);
      expect(haystack, request.url).not.toContain("6-9-12-7-15");
      for (const text of answerTexts) expect(haystack).not.toContain(encodeURIComponent(text));
    }
    expect(await context.cookies()).toEqual(cookiesBefore);
    expect(await storage()).toEqual(storageBefore);
  });

  async function titleLinkClick(page: Page) {
    await page.locator("[data-assessment-link]").click();
  }
});

test.describe("self-assessment: no layout shift or overflow from a results link (U21, U17)", () => {
  const url = `${PATH}#${encodeResult({ version: statementSetVersion(SHIFTS), date: "2026-09-01", sums: [6, 9, 12, 7, 15] })}`;

  for (const width of [320, 390]) {
    test(`layout shifts before the first input sum to 0 at ${width} px (FR-018a)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript(() => {
        const w = window as unknown as { __shift: number };
        w.__shift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
            if (!entry.hadRecentInput) w.__shift += entry.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(url);
      await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
      await expect(page.locator("[data-assessment-earlier]")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBe(0);
    });
  }

  test.describe("with a comparison shown", () => {
    test.use({ bypassCSP: true });
    for (const [name, setup] of LAYOUTS) {
      test(`the markers, change text and results link fit ${name} without sideways scroll or clipping`, async ({ page }) => {
        await setup(page);
        await page.goto(url);
        await expect(root(page)).toHaveAttribute("data-assessment-ready", "true");
        await expectContained(page, root(page));
        await answer(page, ALL(3));
        await page.locator("[data-assessment-show]").click();
        await expect(page.locator("[data-chart-legend]")).toBeVisible();
        await expectContained(page, root(page));
      });
    }
  });
});
