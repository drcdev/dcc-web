// Self-hosted Inter in a real browser (specs/018 US2; F13 to F16; FR-001, FR-003, FR-004, FR-008,
// FR-017, FR-018; SC-002, SC-003). Only a real browser shows which face is drawn
// (CDP `CSS.getPlatformFontsForNode`, research R8) and which font files a page requests. The
// head markup is checked in tests/component/BaseLayout.test.ts (F05); the requests here are the
// second layer over it, because the browser decides from the @font-face rules which files a page
// triggers. Every check waits for `document.fonts.ready` first, so a face still loading is never
// read as a fallback.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { FIXTURE_SITE, TEMPLATES } from "./templates.ts";

const POST = `${FIXTURE_SITE}/writing/every-part/`;
const CLOSING = '//main//p[starts-with(normalize-space(.), "A closing paragraph")]';

const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const source = (name: string) => sha(readFileSync(`src/assets/fonts/${name}.woff2`));
const BOLD_ITALIC = source("Inter-BoldItalic");
const ITALIC_HASHES = new Set([source("Inter-Italic"), BOLD_ITALIC]);
const INTER_HASHES = new Set(["Regular", "Italic", "Bold", "BoldItalic"].map((n) => source(`Inter-${n}`)));
const mono = (name: string) => sha(readFileSync(`src/assets/fonts/jetbrains-mono/JetBrainsMono-${name}.woff2`));
// Mono files are identified by the SHA-256 of the committed files (they carry hashed names).
const MONO_BY_FACE = {
  "400 normal": mono("Regular"),
  "400 italic": mono("Italic"),
  "700 normal": mono("Bold"),
  "700 italic": mono("BoldItalic"),
} as const;
const MONO_HASHES = new Set<string>(Object.values(MONO_BY_FACE));
const CODE_ELEMENTS = "code, pre, kbd, samp";

async function fontsReady(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/**
 * The faces the browser drew for the first node a CDP search finds (CSS selector or XPath), by
 * PostScript name. The platform fonts of a node include those of its inline children, so a plain
 * text case names an element with no styled children.
 */
async function drawnFaces(page: Page, query: string): Promise<{ name: string; custom: boolean }[]> {
  const client = await page.context().newCDPSession(page);
  try {
    await client.send("DOM.enable");
    await client.send("CSS.enable");
    await client.send("DOM.getDocument", { depth: 0 });
    const { searchId, resultCount } = await client.send("DOM.performSearch", { query });
    expect(resultCount, `${query} exists`).toBeGreaterThan(0);
    const { nodeIds } = await client.send("DOM.getSearchResults", { searchId, fromIndex: 0, toIndex: 1 });
    const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId: nodeIds[0]! });
    return fonts.map((f) => ({ name: f.postScriptName ?? f.familyName, custom: f.isCustomFont }));
  } finally {
    await client.detach();
  }
}

const CASES: { label: string; query: string; face: string }[] = [
  { label: "a paragraph", query: CLOSING, face: "Inter-Regular" },
  { label: "strong text", query: "main p strong", face: "Inter-Bold" },
  { label: "emphasis", query: '//main//p/em[contains(., "emphasis")]', face: "Inter-Italic" },
  { label: "bold italic", query: "main p em strong, main p strong em", face: "Inter-BoldItalic" },
  { label: "a block quote", query: "main blockquote p", face: "Inter-Italic" },
  { label: "the views note", query: "[data-views-note]", face: "Inter-Italic" },
  { label: "a font-medium header link", query: "header a.font-medium", face: "Inter-Regular" },
  { label: "a font-semibold heading", query: "header a.font-semibold", face: "Inter-Bold" },
  { label: "a section heading", query: "main h2", face: "Inter-Bold" },
];

test.describe("the drawn face", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POST);
    await fontsReady(page);
  });

  test("Inter is loaded for every weight and style the page draws", async ({ page }) => {
    // Astro registers the family as `Inter-<hash>`, so `document.fonts.check('400 1em Inter')`
    // names a family with no faces and passes whatever happens; the faces are found by that
    // hashed family instead, and each must have loaded.
    const statuses = await page.evaluate(() =>
      Array.from(document.fonts)
        .filter((face) => /^"?Inter-[0-9a-f]+"?$/.test(face.family))
        .map((face) => ({ weight: face.weight, style: face.style, status: face.status })),
    );
    for (const [weight, style] of [
      ["400", "normal"],
      ["700", "normal"],
      ["400", "italic"],
      ["700", "italic"],
    ] as const) {
      const faces = statuses.filter((face) => face.weight === weight && face.style === style);
      expect(faces.length, `${weight} ${style} face exists`).toBeGreaterThan(0);
      for (const face of faces) expect(face.status, `${weight} ${style}`).toBe("loaded");
    }
  });

  for (const { label, query, face } of CASES) {
    test(`${label} is drawn in ${face}`, async ({ page }) => {
      const faces = await drawnFaces(page, query);
      expect(faces.length).toBeGreaterThan(0);
      for (const drawn of faces) {
        expect(drawn.custom, `${drawn.name} is a custom font`).toBe(true);
        expect(drawn.name).toBe(face);
      }
    });
  }

  test("a code block and its highlighted token are drawn in JetBrainsMono-Regular (M13)", async ({ page }) => {
    for (const query of ["main pre code span span"]) {
      const faces = await drawnFaces(page, query);
      expect(faces.length, query).toBeGreaterThan(0);
      for (const drawn of faces) {
        expect(drawn.custom, `${query} is a custom font`).toBe(true);
        expect(drawn.name, query).toBe("JetBrainsMono-Regular");
      }
    }
  });

  test("inline code is drawn in the mono face its weight selects (M13)", async ({ page }) => {
    // The prose styles set `code` to weight 600, which the two weights shipped (400, 700) draw as
    // bold; the face is derived from the computed weight so a later prose change cannot make this lie.
    const weight = await page.locator("main p code").first().evaluate((el) => Number(getComputedStyle(el).fontWeight));
    const faces = await drawnFaces(page, "main p code");
    expect(faces.length).toBeGreaterThan(0);
    for (const drawn of faces) {
      expect(drawn.custom).toBe(true);
      expect(drawn.name).toBe(weight >= 600 ? "JetBrainsMono-Bold" : "JetBrainsMono-Regular");
    }
  });

  for (const { label, query, face } of [
    { label: "code in emphasis", query: "main p em code", face: "JetBrainsMono-BoldItalic" },
    { label: "code in strong", query: "main p strong code", face: "JetBrainsMono-Bold" },
    { label: "kbd", query: "main kbd", face: "JetBrainsMono-Regular" },
    { label: "samp", query: "main p > samp", face: "JetBrainsMono-Regular" },
    { label: "samp in emphasis", query: "main p em samp", face: "JetBrainsMono-Italic" },
  ]) {
    test(`${label} is drawn in ${face} (M13)`, async ({ page }) => {
      const faces = await drawnFaces(page, query);
      expect(faces.length).toBeGreaterThan(0);
      for (const drawn of faces) {
        expect(drawn.custom).toBe(true);
        expect(drawn.name).toBe(face);
      }
    });
  }

  test("the code card caption and the Copy button stay in Inter (FR-004)", async ({ page }) => {
    for (const query of [".code-card__caption", ".code-card__button"]) {
      const faces = await drawnFaces(page, query);
      expect(faces.length, query).toBeGreaterThan(0);
      for (const drawn of faces) expect(drawn.name.startsWith("Inter-"), `${query}: ${drawn.name}`).toBe(true);
    }
  });

  test("code characters of different shapes have equal advance (M14)", async ({ page }) => {
    expect(await equalAdvance(page)).toBe(true);
  });
});

/**
 * Appends two inline `code` runs of equal length but different letters and compares their widths.
 * Built in the page so the fixture is not edited; no inline style is set (the CSP forbids it).
 */
async function equalAdvance(page: Page): Promise<boolean> {
  await page.evaluate(() => {
    const p = document.createElement("p");
    for (const text of ["iiiiiiii", "WWWWWWWW"]) {
      const code = document.createElement("code");
      code.dataset.probe = "";
      code.textContent = text;
      p.append(code, " ");
    }
    document.querySelector("main")!.append(p);
  });
  // Reading the layout starts the faces loading; fonts.ready then waits for them.
  await page.evaluate(() => document.querySelector("[data-probe]")!.getBoundingClientRect().width);
  await fontsReady(page);
  const widths = await page.evaluate(() =>
    [...document.querySelectorAll("[data-probe]")].map((el) => el.getBoundingClientRect().width),
  );
  expect(widths).toHaveLength(2);
  return Math.abs(widths[0]! - widths[1]!) < 0.01;
}

/**
 * Loads a path in a fresh page and returns every font file it requested (as a content hash of the
 * served bytes), plus any request that is not a same-origin hashed woff2.
 */
async function loadAndCollect(page: Page, path: string) {
  const requests: { url: string; hash: string }[] = [];
  const pending: Promise<void>[] = [];
  const offOrigin: string[] = [];
  const origin = path.startsWith("http") ? new URL(path).origin : "http://127.0.0.1:4321";
  page.on("response", (response) => {
    const url = response.url();
    if (response.request().resourceType() !== "font" && !/\.(woff2?|ttf|otf)(\?|$)/.test(url)) return;
    if (!url.startsWith(`${origin}/_astro/fonts/`) || !url.endsWith(".woff2")) offOrigin.push(url);
    pending.push(
      // A preload's body can be gone by the time it is read, so the file is fetched again.
      page.request.get(url).then(async (fetched) => {
        const body = await fetched.body();
        requests.push({ url, hash: sha(body) });
      }),
    );
  });
  await page.goto(path);
  await fontsReady(page);
  await page.waitForLoadState("networkidle");
  await Promise.all(pending);
  page.removeAllListeners("response");
  return { requests, offOrigin };
}

/** The mono faces the page's visible code text draws, by standard font matching on weight and style. */
async function drawnMonoFaces(page: Page): Promise<Set<string>> {
  const found = await page.evaluate((selector) => {
    const faces = new Set<string>();
    const matches = [...document.querySelectorAll(`:is(${selector}), :is(${selector}) *`)];
    for (const el of matches) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())) continue;
      if (el.getClientRects().length === 0) continue;
      const style = getComputedStyle(el);
      const weight = Number(style.fontWeight) >= 600 ? "700" : "400";
      faces.add(`${weight} ${style.fontStyle === "normal" ? "normal" : "italic"}`);
    }
    return [...faces];
  }, CODE_ELEMENTS);
  return new Set(found);
}

test("every font request is the site's own hashed file, once, and each page asks only for the faces it draws", async ({
  context,
}) => {
  for (const template of TEMPLATES) {
    // A fresh page per template, so one page's late requests are never counted for the next.
    const page = await context.newPage();
    const { requests, offOrigin } = await loadAndCollect(page, template.path);

    expect(offOrigin, `${template.name}: off-origin or non-woff2 font request`).toEqual([]);
    const urls = requests.map((r) => r.url);
    expect(new Set(urls).size, `${template.name}: a file requested twice`).toBe(urls.length);
    const inter = requests.filter((r) => INTER_HASHES.has(r.hash));
    const monoRequests = requests.filter((r) => MONO_HASHES.has(r.hash));
    expect(inter.length, `${template.name}: at most four Inter files`).toBeLessThanOrEqual(4);
    expect(monoRequests.length, `${template.name}: at most four mono files`).toBeLessThanOrEqual(4);
    expect(inter.length + monoRequests.length, `${template.name}: every file is an Inter or mono file`).toBe(
      requests.length,
    );

    // A page asks for an italic file only when it draws italic text (the home tagline does; most
    // pages do not), and for the bold italic only when it draws bold italic text.
    const drawn = await page.evaluate(() => {
      const found = { italic: false, boldItalic: false };
      for (const el of document.querySelectorAll("body *")) {
        if (el.closest("code, pre, kbd, samp")) continue;
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())) continue;
        const style = getComputedStyle(el);
        if (style.fontStyle !== "italic") continue;
        found.italic = true;
        if (Number(style.fontWeight) >= 600) found.boldItalic = true;
      }
      return found;
    });
    if (!drawn.italic) {
      expect(requests.filter((r) => ITALIC_HASHES.has(r.hash)), `${template.name} draws no italic`).toEqual([]);
    }
    if (!drawn.boldItalic) {
      expect(requests.some((r) => r.hash === BOLD_ITALIC), `${template.name} draws no bold italic`).toBe(false);
    }

    // FR-007 (stricter than M15): the mono files requested are exactly the faces the code text draws.
    const faces = await drawnMonoFaces(page);
    const expected = [...faces].map((f) => MONO_BY_FACE[f as keyof typeof MONO_BY_FACE]).sort();
    expect(monoRequests.map((r) => r.hash).sort(), `${template.name}: mono files requested`).toEqual(expected);
    await page.close();
  }
});

test("a page whose code is only a block at regular weight requests only the Regular mono file", async ({
  page,
}) => {
  // A real built page with no code, given one code block through `page.route`; no fixture is added.
  await page.route("**/about/", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace("</main>", "<pre><code>const a = 1;</code></pre></main>");
    await route.fulfill({ response, body });
  });
  const { requests, offOrigin } = await loadAndCollect(page, "/about/");
  expect(offOrigin).toEqual([]);
  expect(await page.locator("main pre code").count()).toBe(1);
  expect(requests.filter((r) => MONO_HASHES.has(r.hash)).map((r) => r.hash)).toEqual([MONO_BY_FACE["400 normal"]]);
});

test("without JavaScript the text and the code are still drawn in the shipped faces", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(POST);
    await page.waitForLoadState("networkidle");
    const faces = await drawnFaces(page, CLOSING);
    expect(faces.length).toBeGreaterThan(0);
    expect(faces.every((f) => f.custom && f.name === "Inter-Regular")).toBe(true);
    const code = await drawnFaces(page, "main pre code span span");
    expect(code.length).toBeGreaterThan(0);
    expect(code.every((f) => f.custom && f.name === "JetBrainsMono-Regular")).toBe(true);
  } finally {
    await context.close();
  }
});

test("when the font files fail, the text shows in another face and italics stay slanted", async ({ page }) => {
  await page.route("**/_astro/fonts/**", (route) => route.abort());
  await page.goto(POST);
  await page.waitForLoadState("load");
  await fontsReady(page);
  await expect(page.locator("main p").filter({ hasText: "A closing paragraph" }).first()).toBeVisible();
  const faces = await drawnFaces(page, CLOSING);
  expect(faces.length).toBeGreaterThan(0);
  for (const drawn of faces) expect(drawn.name.startsWith("Inter-")).toBe(false);
  const style = await page.locator("main p em").first().evaluate((el) => getComputedStyle(el).fontStyle);
  expect(style).toBe("italic");

  // Code: visible, drawn by a monospace fallback (equal advances), italic code stays slanted (M17, FR-006).
  await expect(page.locator("main pre code").first()).toBeVisible();
  const code = await drawnFaces(page, "main pre code span span");
  expect(code.length).toBeGreaterThan(0);
  for (const drawn of code) expect(drawn.name.startsWith("JetBrainsMono-"), drawn.name).toBe(false);
  expect(await page.locator("main p em code").first().evaluate((el) => getComputedStyle(el).fontStyle)).toBe("italic");
  expect(await equalAdvance(page), "fallback code has equal advances").toBe(true);

  // FR-012 with the fallback: no sideways scroll at 320 px and the focused scroll region is visible.
  await page.setViewportSize({ width: 320, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "no sideways page scroll").toBeLessThanOrEqual(0);
  const pre = page.locator("main pre").first();
  await pre.focus();
  await expect(pre).toBeFocused();
  await expect(pre).toBeInViewport();
  const box = await pre.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(320 + 0.5);
});
