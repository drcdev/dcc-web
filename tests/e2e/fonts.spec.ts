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
    for (const spec of ["400 1em Inter", "700 1em Inter", "italic 400 1em Inter", "italic 700 1em Inter"]) {
      expect(await page.evaluate((s) => document.fonts.check(s), spec), spec).toBe(true);
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

  test("inline code is drawn in Inter at the face its weight selects", async ({ page }) => {
    // The prose styles set `code` to weight 600, which the two weights shipped (400, 700) draw as
    // bold; the face is derived from the computed weight so a later prose change cannot make this lie.
    const weight = await page.locator("main p code").first().evaluate((el) => Number(getComputedStyle(el).fontWeight));
    const faces = await drawnFaces(page, "main p code");
    expect(faces.length).toBeGreaterThan(0);
    for (const drawn of faces) {
      expect(drawn.custom).toBe(true);
      expect(drawn.name).toBe(weight >= 600 ? "Inter-Bold" : "Inter-Regular");
    }
  });
});

test("every font request is the site's own hashed file, once, and an italic is asked for only by a page that draws one", async ({
  context,
}) => {
  for (const template of TEMPLATES) {
    // A fresh page per template, so one page's late requests are never counted for the next.
    const page = await context.newPage();
    const requests: { url: string; hash: string }[] = [];
    const pending: Promise<void>[] = [];
    const offOrigin: string[] = [];
    const origin = template.path.startsWith("http") ? new URL(template.path).origin : "http://127.0.0.1:4321";
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
    await page.goto(template.path);
    await fontsReady(page);
    await page.waitForLoadState("networkidle");
    await Promise.all(pending);
    page.removeAllListeners("response");

    expect(offOrigin, `${template.name}: off-origin or non-woff2 font request`).toEqual([]);
    const urls = requests.map((r) => r.url);
    expect(new Set(urls).size, `${template.name}: a file requested twice`).toBe(urls.length);
    expect(urls.length, `${template.name}: at most four files`).toBeLessThanOrEqual(4);

    // A page asks for an italic file only when it draws italic text (the home tagline does; most
    // pages do not), and for the bold italic only when it draws bold italic text.
    const drawn = await page.evaluate(() => {
      const found = { italic: false, boldItalic: false };
      for (const el of document.querySelectorAll("body *")) {
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
    await page.close();
  }
});

test("without JavaScript the text is still drawn in Inter", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(POST);
    await page.waitForLoadState("networkidle");
    const faces = await drawnFaces(page, CLOSING);
    expect(faces.length).toBeGreaterThan(0);
    expect(faces.every((f) => f.custom && f.name === "Inter-Regular")).toBe(true);
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
});
