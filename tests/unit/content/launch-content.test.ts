// The launch page files (data-model.md "Launch content"; FR-020 to
// FR-024). Reads the files directly, so a missing page, a wrong nav position or
// draft flag, or a data-handling claim fails here before any build. It checks
// structure and data handling, not page copy: Don reviews every copy edit.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { pageSchema } from "../../../src/content/schemas/page.ts";
import { pages } from "../../helpers/content";

const dir = fileURLToPath(new URL("../../../src/content/pages/", import.meta.url));

function load(name: string) {
  const path = `${dir}${name}`;
  expect(existsSync(path), `${name} exists`).toBe(true);
  const source = readFileSync(path, "utf-8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  expect(match, `${name} has frontmatter`).not.toBeNull();
  return { front: match![1]!, body: match![2]!, all: source, text: source.toLowerCase() };
}

// [file, nav position (undefined: not in the navigation), draft].
const LAUNCH = [
  ["index.mdx", 1, true],
  ["work-with-me.mdx", 2, true],
  ["about.mdx", 6, false],
  ["privacy-policy.mdx", undefined, true],
  ["terms-of-use.mdx", undefined, true],
  ["technology.mdx", undefined, true],
] as const;

describe("launch page files", () => {
  for (const [name, position, draft] of LAUNCH) {
    it(`${name} is ${draft ? "a draft" : "live"} with the expected nav position`, () => {
      const { front } = load(name);
      expect(front).toMatch(new RegExp(`^draft: ${draft}$`, "m"));
      if (position === undefined) {
        expect(front).not.toMatch(/^nav:/m);
      } else {
        expect(front).toMatch(/^nav:/m);
        expect(front).toMatch(new RegExp(`position: ${position}\\b`));
      }
    });
  }

  it("every launch page's front matter passes the page schema", () => {
    const schema = pageSchema({ image: () => z.string() });
    for (const [name] of LAUNCH) {
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
  "TextBlock",
  "Offerings",
  "Offering",
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
    // Top-level section tags in document order (Offering is nested inside Offerings).
    const top = [...body.matchAll(/^<(Lead|Offerings|TextBlock|Figure|CallToAction)\b([^>]*)>/gm)].map((m) => ({
      tag: m[1]!,
      attrs: m[2]!,
    }));
    return { body, front, top };
  };

  it("lists the sections in the FR-004 order", () => {
    const { top } = page();
    expect(top.map((t) => t.tag)).toEqual([
      "Lead",
      "Offerings",
      "TextBlock",
      "TextBlock",
      "TextBlock",
      "Offerings",
      "TextBlock",
      "CallToAction",
    ]);
  });

  it("opens with the Lead, with nothing before it", () => {
    const { body } = page();
    expect(body.trimStart().startsWith("<Lead>")).toBe(true);
  });

  it("puts the no-practice note inside the consulting half, after the talks", () => {
    const { body } = page();
    const consulting = body.indexOf('<TextBlock title="Consulting">');
    expect(consulting, "a Consulting TextBlock exists").toBeGreaterThan(body.indexOf("<Offerings"));
    expect(body.indexOf("consulting practice today")).toBeGreaterThan(consulting);
  });

  it("has exactly one Lead and one CallToAction", () => {
    const { body } = page();
    expect(used(body).filter((t) => t === "Lead")).toHaveLength(1);
    expect(used(body).filter((t) => t === "CallToAction")).toHaveLength(1);
  });

  it("has two Offerings groups of three Offering each", () => {
    const { body } = page();
    const groups = body.split(/<Offerings\b/).slice(1);
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      const inside = group.slice(0, group.indexOf("</Offerings>"));
      expect(inside.match(/<Offering\b/g) ?? []).toHaveLength(3);
    }
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
