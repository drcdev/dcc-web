// The site page files (FR-020 to FR-024). Reads the files directly, so a missing page, a wrong nav position or
// draft flag, or a data-handling claim fails here before any build. It checks
// structure and data handling, not page copy: Don reviews every copy edit.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { landingSchema, pageSchema } from "../../../src/content/schemas/page.ts";
import { landingPages, pages } from "../../helpers/content";

const dir = fileURLToPath(new URL("../../../src/content/pages/", import.meta.url));

function load(name: string) {
  const path = `${dir}${name}`;
  expect(existsSync(path), `${name} exists`).toBe(true);
  const source = readFileSync(path, "utf-8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  expect(match, `${name} has frontmatter`).not.toBeNull();
  return { front: match![1]!, body: match![2]!, all: source, text: source.toLowerCase() };
}

// [file, nav location and position (undefined: not in a menu), draft, visible].
const SITE_PAGES = [
  ["index.mdx", ["header", 1], false, true],
  ["work-with-me.mdx", ["header", 2], true, false],
  ["about.mdx", ["header", 6], false, true],
  ["contact.mdx", ["header", 7], false, true],
  ["privacy-policy.mdx", ["footer", 1], false, true],
  ["terms-of-use.mdx", ["footer", 2], false, true],
  ["technology.mdx", ["footer", 3], false, true],
] as const;

describe("site page files", () => {
  for (const [name, nav, draft, visible] of SITE_PAGES) {
    it(`${name} is ${visible ? "visible" : "not visible"}, ${draft ? "a draft" : "published"}, with the expected nav location and position`, () => {
      const { front } = load(name);
      // A published, visible page may leave `draft` and `visible` out (defaults false and true).
      if (draft) expect(front).toMatch(/^draft: true$/m);
      else expect(front).not.toMatch(/^draft: true$/m);
      if (visible) expect(front).not.toMatch(/^visible: false$/m);
      else expect(front).toMatch(/^visible: false$/m);
      if (nav === undefined) {
        expect(front).not.toMatch(/^nav:/m);
      } else {
        expect(front).toMatch(/^nav:/m);
        expect(front).toMatch(new RegExp(`location: ${nav[0]}\\b`));
        expect(front).toMatch(new RegExp(`position: ${nav[1]}\\b`));
      }
    });
  }

  // The writing and projects landing files hold the two listing links in the header (US3).
  for (const [name, position] of [["writing.mdx", 4], ["projects.mdx", 5]] as const) {
    it(`${name} is a landing file in the header at position ${position}`, () => {
      load(name);
      const entry = landingPages.find((page) => page.file.endsWith(`/${name}`));
      expect(entry, `${name} is read as a landing page`).toBeDefined();
      const result = landingSchema.safeParse(entry!.data);
      expect(result.success, result.success ? "" : JSON.stringify(result.error.issues)).toBe(true);
      expect(entry!.data.nav).toMatchObject({ location: "header", position });
      expect(entry!.body.trim()).toBe("");
      expect(pages.some((page) => page.file === entry!.file), "pages excludes landing files").toBe(false);
    });
  }

  it("a page under privacy/ is in no menu (US4)", () => {
    const apps = pages.filter((page) => page.file.includes("/pages/privacy/"));
    expect(apps.length).toBeGreaterThan(0);
    for (const page of apps) expect(page.data.nav, page.file).toBeUndefined();
  });

  it("every page's front matter passes the page schema", () => {
    const schema = pageSchema({ image: () => z.string() });
    for (const [name] of SITE_PAGES) {
      const entry = pages.find((page) => page.file.endsWith(`/${name}`));
      expect(entry, `${name} is read by the content helper`).toBeDefined();
      const result = schema.safeParse(entry!.data);
      expect(result.success, `${name}: ${result.success ? "" : JSON.stringify(result.error.issues)}`).toBe(true);
    }
  });

  it("home is labelled Home in the navigation", () => {
    expect(load("index.mdx").front).toMatch(/label: "?Home"?/);
  });

  it("the Services and Speaking pages are gone (FR-006, FR-007)", () => {
    for (const name of ["services.mdx", "speaking.mdx"]) {
      expect(existsSync(`${dir}${name}`), `${name} is removed`).toBe(false);
    }
  });

  it("there is no cookie policy page", () => {
    expect(existsSync(`${dir}cookie-policy.mdx`)).toBe(false);
    expect(existsSync(`${dir}cookie-policy.md`)).toBe(false);
  });
});

describe("Privacy policy (FR-022, FR-022a)", () => {
  const { text, all } = load("privacy-policy.mdx");

  it("says the site sets no cookies and where the theme choice is kept", () => {
    expect(text).toMatch(/no cookies|does not set (any )?cookies/);
    expect(text).toContain("local storage");
    expect(text).toContain("theme");
  });

  it("names Cloudflare Web Analytics and Cloudflare hosting with request information", () => {
    expect(text).toContain("cloudflare web analytics");
    expect(text).toContain("cloudflare");
    expect(text).toContain("ip address");
  });

  it("names Cloudflare D1 for storage, retention, spam protection and how to ask about or delete data", () => {
    expect(text).toContain("cloudflare d1");
    expect(text).toContain("deleted automatically");
    expect(text).toContain("spam");
    expect(text).toMatch(/delet/);
    expect(text).toMatch(/ask (what|for)/);
  });

  // The contact-form facts (region, retention, Turnstile, deletion route) are pinned
  // against the shared rules in tests/unit/site/privacy-policy.test.ts.

  it("does not link to the old cookie policy and shows a Last updated date", () => {
    expect(all).not.toContain("/cookie-policy/");
    expect(all).toMatch(/Last updated:?\*{0,2}\s*\d{1,2} \w+ \d{4}|Last updated:?\*{0,2}\s*\d{4}-\d{2}-\d{2}/);
  });
});

describe("Technology", () => {
  it("does not assert a storage location", () => {
    expect(load("technology.mdx").text).not.toMatch(/canada|toronto/);
  });
});

const registered = new Set([
  "Lead",
  "CallToAction",
  "Figure",
  "WideImage",
  "FullImage",
]);
const used = (body: string) => [...body.matchAll(/<([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]!);

describe("sections in the Work with me page (US4)", () => {
  it("uses at least one section and only registered ones", () => {
    const tags = used(load("work-with-me.mdx").body);
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) expect(registered.has(tag), `${tag} is registered`).toBe(true);
  });
});

// Structure only (FR-002 to FR-005, data-model "Validation"); the wording is Don's to review.
describe("Work with me page", () => {
  // Loaded inside each test, so a missing file fails these tests and not the whole file.
  const page = () => {
    const { body, front } = load("work-with-me.mdx");
    const top = [...body.matchAll(/^<(Lead|Figure|CallToAction)\b([^>]*)>/gm)].map((m) => ({
      tag: m[1]!,
      attrs: m[2]!,
    }));
    // Headings in document order (the page has no code blocks).
    const headings = [...body.matchAll(/^(#{1,6}) (.+)$/gm)].map((m) => ({ level: m[1]!.length, text: m[2]!.trim(), at: m.index! }));
    return { body, front, top, headings };
  };

  it("is plain Markdown apart from Lead and CallToAction", () => {
    const { body } = page();
    expect([...new Set(used(body))].sort()).toEqual(["CallToAction", "Lead"]);
  });

  // The titles are Don's copy, so the tests read the order and nesting from the file's own headings.
  it("has six ## sections, with three ### under the first and under the fourth (FR-005)", () => {
    const { headings } = page();
    expect(headings.filter((h) => h.level === 1)).toHaveLength(0);
    const groups: number[] = [];
    for (const h of headings) {
      if (h.level === 2) groups.push(0);
      else if (h.level === 3) groups[groups.length - 1] = (groups[groups.length - 1] ?? 0) + 1;
      else throw new Error(`unexpected h${h.level}: ${h.text}`);
    }
    expect(groups).toEqual([3, 0, 0, 3, 0, 0]);
  });

  it("opens with the Lead, with nothing before it, and ends with the CallToAction", () => {
    const { body, top } = page();
    expect(body.trimStart().startsWith("<Lead>")).toBe(true);
    expect(top.map((t) => t.tag)).toEqual(["Lead", "CallToAction"]);
    expect(body.trimEnd().endsWith("</CallToAction>")).toBe(true);
  });

  it("puts the no-practice note under the third ## section", () => {
    const { body, headings } = page();
    const third = headings.filter((h) => h.level === 2)[2];
    const fourth = headings.filter((h) => h.level === 2)[3];
    const note = body.indexOf("consulting practice today");
    expect(note).toBeGreaterThan(third!.at);
    expect(note).toBeLessThan(fourth!.at);
  });

  it("keeps the last ## section as a Markdown list", () => {
    const { body, headings } = page();
    const last = headings.filter((h) => h.level === 2).at(-1)!;
    const after = body.slice(last.at);
    expect(after.slice(0, after.indexOf("<CallToAction")).match(/^- /gm) ?? []).toHaveLength(2);
  });

  it("has exactly one Lead and one CallToAction", () => {
    const { body } = page();
    expect(used(body).filter((t) => t === "Lead")).toHaveLength(1);
    expect(used(body).filter((t) => t === "CallToAction")).toHaveLength(1);
  });

  it("links the call to action to /contact/", () => {
    const { top } = page();
    const cta = top.find((t) => t.tag === "CallToAction");
    expect(cta, "a CallToAction exists").toBeDefined();
    expect(/href="([^"]*)"/.exec(cta!.attrs)?.[1]).toBe("/contact/");
  });

  it("is titled Work with me and has a non-empty meta description", () => {
    const { front } = page();
    expect(front).toMatch(/^title: "?Work with me"?$/m);
    const description = /^description: (.+)$/m.exec(front)?.[1]?.replace(/^"|"$/g, "").trim();
    expect(description, "description is present").toBeTruthy();
  });

  it("gives the call to action a specific, non-generic label", () => {
    const { top } = page();
    const cta = top.find((t) => t.tag === "CallToAction");
    expect(cta, "a CallToAction exists").toBeDefined();
    const label = /label="([^"]*)"/.exec(cta!.attrs)?.[1]?.trim() ?? "";
    expect(label.length).toBeGreaterThan(0);
    expect(label.toLowerCase()).not.toMatch(/^(click here|more|read more|here)$/);
  });

});
