// The career timeline on the fixture site's /about/ (specs/041-career-timeline US1; contracts/
// timeline-markup.md). Fixture steps only, so the expectations come from the DOM, not from literals.
// Browser-only behaviour: toggling, focus, geometry, print, motion and forced colours.
import { expect, test, type Page } from "@playwright/test";

const ABOUT = "/about/";
const steps = "[data-career] [data-step]";

test("lists the steps earliest to latest, each closed", async ({ page }) => {
  await page.goto(ABOUT);
  const count = await page.locator(steps).count();
  expect(count).toBeGreaterThan(1);
  const starts = await page.locator(`${steps} summary time:first-of-type`).evaluateAll((els) => els.map((e) => e.getAttribute("datetime")!));
  expect(starts).toEqual([...starts].sort());
  for (const details of await page.locator(`${steps} details`).all()) await expect(details).not.toHaveAttribute("open", "");
  await expect(page.getByRole("heading", { name: "Career", level: 3 })).toBeVisible();
});

test("opens and closes by mouse", async ({ page }) => {
  await page.goto(ABOUT);
  const first = page.locator(steps).first();
  const detail = first.locator("[data-step-detail]");
  await expect(detail).toBeHidden();
  await first.locator("summary").click();
  await expect(detail).toBeVisible();
  await expect(first.locator("details")).toHaveJSProperty("open", true);
  await first.locator("summary").click();
  await expect(detail).toBeHidden();
});

test("opens and closes by keyboard with Enter and Space", async ({ page }) => {
  await page.goto(ABOUT);
  const summary = page.locator(steps).first().locator("summary");
  const details = page.locator(steps).first().locator("details");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(details).toHaveJSProperty("open", true);
  await page.keyboard.press("Space");
  await expect(details).toHaveJSProperty("open", false);
  await page.keyboard.press("Space");
  await expect(details).toHaveJSProperty("open", true);
  await page.keyboard.press("Enter");
  await expect(details).toHaveJSProperty("open", false);
});

test("names each summary by role, organization and period and gives it a 24 px target", async ({ page }) => {
  await page.goto(ABOUT);
  const summary = page.locator(steps).first().locator("summary");
  // The name is role, organization and period, with the dash heard as "to" (FR-002, FR-007a).
  await expect(summary).toHaveAccessibleName(/\S.* to .*\S/);
  // Native <details>: the browser exposes the expanded state itself, so the markup must be the native pair.
  await expect(page.locator(`${steps} details > summary`).first()).toBeVisible();
  const box = (await summary.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
});

test("shows the site's focus outline on a keyboard-focused summary", async ({ page }) => {
  await page.goto(ABOUT);
  const summary = page.locator(steps).first().locator("summary");
  await page.locator("main a").first().focus();
  await summary.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const outline = await summary.evaluate((el) => {
    const style = getComputedStyle(el);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test("has no sideways scroll at 320 px with every step open", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(ABOUT);
  for (const summary of await page.locator(`${steps} summary`).all()) await summary.click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("prints every step open", async ({ page }) => {
  await page.goto(ABOUT);
  await page.emulateMedia({ media: "print" });
  for (const detail of await page.locator(`${steps} [data-step-detail]`).all()) await expect(detail).toBeVisible();
});

test("does not animate opening or closing, even when motion is allowed", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(`http://localhost:4322${ABOUT}`);
  const animated = await page.locator(`${steps} details, ${steps} summary, ${steps} [data-step-detail]`).evaluateAll((els) =>
    els.some((el) => {
      const s = getComputedStyle(el);
      return parseFloat(s.transitionDuration) > 0 || parseFloat(s.animationDuration) > 0;
    }),
  );
  expect(animated).toBe(false);
  await context.close();
});

test("keeps a visible disclosure state in forced colours", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(ABOUT);
  const first = page.locator(steps).first();
  await expect(first.locator("summary")).toBeVisible();
  expect(await first.locator("summary").evaluate((el) => getComputedStyle(el).display)).toBe("list-item");
  await first.locator("summary").click();
  await expect(first.locator("[data-step-detail]")).toBeVisible();
});

test("a post link and an award link in an opened step go to the right targets", async ({ page }) => {
  await page.goto(ABOUT);
  const step = page.locator(steps).filter({ has: page.locator("[data-list=posts]") }).first();
  await step.locator("summary").click();
  const post = step.locator("[data-list=posts] a").first();
  const href = (await post.getAttribute("href"))!;
  const title = (await post.textContent())!.trim();
  await post.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);

  await page.goto(ABOUT);
  const awarded = page.locator(steps).filter({ has: page.locator("[data-list=awards] a") }).first();
  await awarded.locator("summary").click();
  const award = awarded.locator("[data-list=awards] a").first();
  const target = (await award.getAttribute("href"))!;
  expect(target).toMatch(/^https:\/\//);
  await expect(award).toBeVisible();
});

// FR-007b: the disclosure marker shares the role title's first line. The marker is the summary's own
// ::marker, which has no box to measure, so a block role pushed under it shows as a role that starts a
// line below the summary's content edge. Real layout, so E2E.
async function markerOnRoleLine(page: Page) {
  for (const summary of await page.locator(`${steps} summary`).all()) {
    const m = await summary.evaluate((el) => {
      const role = el.querySelector("[data-step-role]")!;
      const rects = [...role.getClientRects()];
      const first = rects[0]!;
      const box = el.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(el).paddingTop);
      return { fromTop: first.top - box.top - pad, left: first.left - box.left, line: parseFloat(getComputedStyle(role).lineHeight) || first.height, height: first.height };
    });
    // The role starts on the summary's first line (no marker line above it) and after the marker.
    expect(m.fromTop).toBeLessThan(m.height * 0.5);
    expect(m.left).toBeGreaterThan(8);
  }
}

for (const size of [{ name: "phone", width: 390, height: 844 }, { name: "desktop", width: 1280, height: 800 }]) {
  test(`puts the disclosure marker on the role title's line at ${size.name}, idle and filtered`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto(ABOUT);
    await markerOnRoleLine(page);
    await expect(page.locator(steps).first().locator("summary")).toHaveAccessibleName(/\S.* to .*\S/);
    await button(page, "achievements").click();
    await markerOnRoleLine(page); // a matching step (open) and a muted one
    await page.locator(`${steps}[data-muted] summary`).first().click();
    await markerOnRoleLine(page); // opened by hand
    await page.locator(`${steps}[data-muted] summary`).first().click();
    await page.locator(steps).first().locator("summary").click();
    await markerOnRoleLine(page); // closed again
  });
}

test.describe("marker line without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the marker is on the role title's line", async ({ page }) => {
    await page.goto(ABOUT);
    await markerOnRoleLine(page);
  });
});

// ---------------------------------------------------------------- Filter (US3)

const filter = "[data-career-filter]";
const statusLine = "[data-career-status]";
const button = (page: Page, category: string) => page.locator(`${filter} button[data-category="${category}"]`);
const allButton = (page: Page) => page.locator(`${filter} [data-category-all]`);
const stepsFor = (category: string) => `${steps}[data-categories~="${category}"]`;

/** Fixture step ids, and which categories each holds, read from the DOM. */
async function stepCategories(page: Page) {
  return page.locator(steps).evaluateAll((els) =>
    els.map((el) => ({ id: el.getAttribute("data-step")!, categories: (el.getAttribute("data-categories") ?? "").split("|").filter(Boolean) })),
  );
}

test("reveals the filter once ready, with All selected and an empty status line", async ({ page }) => {
  await page.goto(ABOUT);
  await expect(page.locator("career-timeline")).toHaveAttribute("data-ready", "");
  await expect(page.locator(filter)).toBeVisible();
  await expect(allButton(page)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(filter).getByRole("button").first()).toHaveText("All");
  // Visible but empty: nothing is announced on load (FR-013).
  await expect(page.locator(statusLine)).toHaveText("");
  await expect(page.getByRole("group", { name: "Show" })).toBeVisible();
});

test("choosing a category opens matching steps with marked items and mutes the rest, still openable", async ({ page }) => {
  await page.goto(ABOUT);
  const info = await stepCategories(page);
  const category = "achievements";
  const matching = info.filter((s) => s.categories.includes(category));
  const others = info.filter((s) => !s.categories.includes(category));
  expect(matching.length).toBeGreaterThan(0);
  expect(others.length).toBeGreaterThan(0);

  await button(page, category).click();
  await expect(button(page, category)).toHaveAttribute("aria-pressed", "true");
  await expect(allButton(page)).toHaveAttribute("aria-pressed", "false");
  for (const step of matching) {
    const li = page.locator(`${steps}[data-step="${step.id}"]`);
    await expect(li.locator("details")).toHaveJSProperty("open", true);
    await expect(li).not.toHaveAttribute("data-muted", "");
    const items = li.locator(`[data-list=${category}] > li`);
    expect(await items.count()).toBeGreaterThan(0);
    for (const item of await items.all()) await expect(item).toHaveAttribute("data-match", "");
  }
  for (const step of others) {
    const li = page.locator(`${steps}[data-step="${step.id}"]`);
    await expect(li).toHaveAttribute("data-muted", "");
    await expect(li.locator("details")).toHaveJSProperty("open", false);
    await expect(li.locator("summary")).toBeVisible();
    await expect(li.locator("summary")).toContainText(/\S/);
  }
  // A muted step still opens, and opening it leaves it muted.
  const muted = page.locator(`${steps}[data-step="${others[0]!.id}"]`);
  await muted.locator("summary").click();
  await expect(muted.locator("[data-step-detail]")).toBeVisible();
  await expect(muted).toHaveAttribute("data-muted", "");
  // The match marks only the chosen category's lists.
  expect(await page.locator("[data-match]").evaluateAll((els) => els.every((el) => el.parentElement?.getAttribute("data-list") === "achievements"))).toBe(true);
});

test("announces the count only after a change, in the exact wording", async ({ page }) => {
  await page.goto(ABOUT);
  const total = await page.locator(steps).count();
  const status = page.locator(statusLine);
  await expect(status).toHaveText("");
  const info = await stepCategories(page);
  const count = (c: string) => info.filter((s) => s.categories.includes(c)).length;
  for (const category of ["achievements", "leadership", "awards"]) {
    const n = count(category);
    await button(page, category).click();
    await expect(status).toHaveText(`${n} of ${total} ${n === 1 ? "roles has" : "roles have"} ${category}.`);
  }
  await allButton(page).click();
  await expect(status).toHaveText(`Showing all ${total} roles.`);
});

test("choosing the selected button again changes and announces nothing", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "awards").click();
  const text = await page.locator(statusLine).textContent();
  // Make a hand change that a repeat press must not undo.
  const closed = page.locator(`${stepsFor("awards")} details`).first();
  await closed.locator("summary").click();
  await expect(closed).toHaveJSProperty("open", false);
  await page.evaluate(() => {
    const el = document.querySelector("[data-career-status]")!;
    (window as unknown as { __writes: number }).__writes = 0;
    new MutationObserver(() => ((window as unknown as { __writes: number }).__writes += 1)).observe(el, { childList: true, characterData: true, subtree: true });
  });
  await button(page, "awards").click();
  await expect(closed).toHaveJSProperty("open", false);
  expect(await page.evaluate(() => (window as unknown as { __writes: number }).__writes)).toBe(0);
  await expect(page.locator(statusLine)).toHaveText(text!);
});

test("All resets hand-opened steps, muted and marks", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "awards").click();
  const muted = page.locator(`${steps}[data-muted]`).first();
  await muted.locator("summary").click();
  await allButton(page).click();
  for (const details of await page.locator(`${steps} details`).all()) await expect(details).toHaveJSProperty("open", false);
  await expect(page.locator("[data-muted]")).toHaveCount(0);
  await expect(page.locator("[data-match]")).toHaveCount(0);
  await expect(allButton(page)).toHaveAttribute("aria-pressed", "true");
});

test("each change is fresh for every step, whatever was done by hand", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "achievements").click();
  const match = page.locator(`${stepsFor("achievements")} details`).first();
  await match.locator("summary").click(); // close a matching step by hand
  await expect(match).toHaveJSProperty("open", false);
  await button(page, "leadership").click();
  const info = await stepCategories(page);
  for (const step of info) {
    const li = page.locator(`${steps}[data-step="${step.id}"]`);
    await expect(li.locator("details")).toHaveJSProperty("open", step.categories.includes("leadership"));
  }
});

test("focus stays on the pressed button; it moves to the summary when its step closes around it", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "achievements").click();
  await expect(button(page, "achievements")).toBeFocused();
  // Keyboard: Space on the next button keeps focus there.
  await button(page, "leadership").focus();
  await page.keyboard.press("Space");
  await expect(button(page, "leadership")).toBeFocused();

  // Focus inside a step the next change closes (a script-driven press leaves focus where it was).
  await button(page, "achievements").click();
  const closing = page.locator(`${stepsFor("achievements")}:not(${stepsFor("leadership")})`).first();
  await closing.locator("[data-step-detail]").evaluate((el) => el.setAttribute("tabindex", "-1"));
  await closing.locator("[data-step-detail]").focus();
  await button(page, "leadership").evaluate((el: HTMLElement) => el.click());
  await expect(closing.locator("summary")).toBeFocused();
});

test("keeps a visible focus outline on a muted summary", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "awards").click();
  const summary = page.locator(`${steps}[data-muted] summary`).first();
  await summary.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(summary).toBeFocused();
  const outline = await summary.evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).toBeGreaterThanOrEqual(2);
});

test("a muted step has no background image and no reduced opacity (FR-011)", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "awards").click();
  for (const li of await page.locator(`${steps}[data-muted]`).all()) {
    for (const selector of ["", "summary", "[data-step-role]"]) {
      const style = await (selector ? li.locator(selector).first() : li).evaluate((el) => {
        const s = getComputedStyle(el);
        return { image: s.backgroundImage, opacity: Number(s.opacity) };
      });
      expect(style.image).toBe("none");
      expect(style.opacity).toBe(1);
    }
  }
});

// Variant B (FR-011a): a muted step collapses to one compact line in a smaller, muted-but-readable size; no tint,
// no rule. The size and layout change is the non-colour cue. Browser-only: computed style and real layout.
const lineOf = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((li) => {
    const tops = ["[data-step-role]", "[data-step-org]", "[data-step-period]"].map((part) => {
      const rects = [...li.querySelector(part)!.getClientRects()];
      return { top: Math.round(rects[0]!.top), bottom: Math.round(rects[rects.length - 1]!.bottom), lines: rects.length };
    });
    const s = getComputedStyle(li);
    const sum = getComputedStyle(li.querySelector("summary")!);
    return {
      tops,
      size: parseFloat(getComputedStyle(li.querySelector("[data-step-role]")!).fontSize),
      bg: sum.backgroundColor,
      liBg: s.backgroundColor,
      image: s.backgroundImage,
      borderStyle: s.borderLeftStyle,
      borderColor: s.borderLeftColor,
    };
  });

test("Variant B: a muted step is one compact line, smaller, with no tint, image or dashed rule; a matching step stays full size", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(ABOUT);
  const before = await lineOf(page, `${steps}:not([data-muted])`);
  await button(page, "achievements").click();
  const muted = await lineOf(page, `${steps}[data-muted]`);
  const match = await lineOf(page, `${steps}[data-matching]`);
  // Marker, role, organization and period share one line: the role, organization and period boxes overlap vertically.
  const first = muted.tops[0]!;
  for (const part of muted.tops) {
    expect(part.lines).toBe(1);
    expect(part.top).toBeLessThan(first.bottom);
    expect(part.bottom).toBeGreaterThan(first.top);
  }
  expect(muted.size).toBeLessThan(match.size);
  expect(match.size).toBe(before.size);
  expect(muted.bg).toBe("rgba(0, 0, 0, 0)");
  expect(muted.liBg).toBe("rgba(0, 0, 0, 0)");
  expect(muted.image).toBe("none");
  expect(muted.borderStyle).not.toBe("dashed");
  expect(match.borderStyle).not.toBe("dashed");
  expect(match.borderColor).toBe(muted.borderColor);
});

test("Variant B: opening a muted step shows its detail at full size", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "achievements").click();
  const detailSize = (selector: string) =>
    page.locator(`${selector} [data-step-detail]`).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const muted = page.locator(`${steps}[data-muted]`).first();
  await muted.locator("summary").click();
  await expect(muted.locator("[data-step-detail]")).toBeVisible();
  expect(await detailSize(`${steps}[data-muted]`)).toBe(await detailSize(`${steps}[data-matching]`));
});

for (const width of [320, 160]) {
  test(`Variant B: the muted line wraps at ${width} px with no sideways scroll or clipping`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ABOUT);
    await button(page, "achievements").click();
    // Only the muted lines are checked below: the rest of the page at 160 px is not this feature's.
    if (width === 320) expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const summary of await page.locator(`${steps}[data-muted] summary`).all()) {
      const fits = await summary.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return el.scrollWidth <= el.clientWidth + 1 && [...el.querySelectorAll("span")].every((s) => s.getBoundingClientRect().right <= box.right + 1);
      });
      expect(fits).toBe(true);
    }
  });
}

test("Variant B: in forced colours the muted line has no dashed rule and stays compact", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(ABOUT);
  await button(page, "achievements").click();
  const muted = await lineOf(page, `${steps}[data-muted]`);
  const match = await lineOf(page, `${steps}[data-matching]`);
  expect(muted.borderStyle).not.toBe("dashed");
  expect(muted.size).toBeLessThan(match.size);
});

test("Variant B: print shows full-size blocks, no rule and no tint", async ({ page }) => {
  await page.goto(ABOUT);
  const full = await lineOf(page, steps);
  await button(page, "achievements").click();
  await page.emulateMedia({ media: "print" });
  for (const li of await page.locator(steps).all()) {
    const style = await li.evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: parseFloat(s.borderLeftWidth), bg: s.backgroundColor, size: parseFloat(getComputedStyle(el.querySelector("[data-step-role]")!).fontSize), orgDisplay: getComputedStyle(el.querySelector("[data-step-org]")!).display };
    });
    expect(style.width).toBe(0);
    expect(style.bg).toBe("rgba(0, 0, 0, 0)");
    expect(style.size).toBe(full.size);
    expect(style.orgDisplay).toBe("block");
  }
});

test("revealing the filter shifts nothing; filtering writes nothing to storage, cookies or the address", async ({ page }) => {
  // Only shifts of the timeline's own nodes count: the rest of the page is not this feature's.
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as { value: number; sources?: { node: Node | null }[] }[]) {
        if (entry.sources?.some((source) => source.node && document.querySelector("[data-career]")?.contains(source.node))) {
          (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(ABOUT);
  await expect(page.locator("career-timeline")).toHaveAttribute("data-ready", "");
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0);
  const url = page.url();
  const state = () => page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
  const before = await state();
  await button(page, "awards").click();
  await allButton(page).click();
  expect(page.url()).toBe(url);
  expect(await state()).toBe(before);
  expect(await page.context().cookies()).toEqual([]);
});

test("does not animate filtering, even when motion is allowed", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(`http://localhost:4322${ABOUT}`);
  await button(page, "awards").click();
  const animated = await page.locator(`${steps}, ${steps} summary, ${steps} details, ${filter} button`).evaluateAll((els) =>
    els.some((el) => {
      const s = getComputedStyle(el);
      return parseFloat(s.transitionDuration) > 0 || parseFloat(s.animationDuration) > 0;
    }),
  );
  expect(animated).toBe(false);
  await context.close();
});

test("prints the plain timeline with a category chosen: every step open, no muted, highlight, filter or status", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "awards").click();
  await page.emulateMedia({ media: "print" });
  for (const detail of await page.locator(`${steps} [data-step-detail]`).all()) await expect(detail).toBeVisible();
  await expect(page.locator(filter)).toBeHidden();
  await expect(page.locator(statusLine)).toBeHidden();
  for (const summary of await page.locator(`${steps} summary`).all()) {
    expect(await summary.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe("none");
  }
  for (const item of await page.locator("[data-match]").all()) {
    const style = await item.evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: parseFloat(s.borderLeftWidth), weight: s.fontWeight, bg: s.backgroundColor };
    });
    expect(style.border).toBe(0);
    expect(Number(style.weight)).toBeLessThan(600);
    expect(style.bg).toBe("rgba(0, 0, 0, 0)");
  }
});

test("keeps the filter state through a theme switch", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "awards").click();
  const before = await page.locator("[data-muted]").count();
  await page.locator("footer button[data-theme-toggle]").click();
  await expect(button(page, "awards")).toHaveAttribute("aria-pressed", "true");
  expect(await page.locator("[data-muted]").count()).toBe(before);
  await expect(page.locator(`${stepsFor("awards")} details`).first()).toHaveJSProperty("open", true);
});

test("shows the highlight as a left border and bold text, not colour alone", async ({ page }) => {
  await page.goto(ABOUT);
  await button(page, "achievements").click();
  const item = page.locator("[data-match]").first();
  const style = await item.evaluate((el) => {
    const s = getComputedStyle(el);
    return { border: parseFloat(s.borderLeftWidth), weight: Number(s.fontWeight) };
  });
  expect(style.border).toBeGreaterThanOrEqual(2);
  expect(style.weight).toBeGreaterThanOrEqual(600);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every step is listed and can be opened with its native disclosure", async ({ page }) => {
    await page.goto(ABOUT);
    const all = await page.locator(steps).all();
    expect(all.length).toBeGreaterThan(1);
    for (const step of all) {
      await expect(step.locator("[data-step-detail]")).toBeHidden();
      await step.locator("summary").click();
      await expect(step.locator("[data-step-detail]")).toBeVisible();
    }
    await expect(page.locator("[data-career-filter]")).toBeHidden();
    await expect(page.locator("[data-career-status]")).toBeHidden();
  });
});
