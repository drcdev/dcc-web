// The seven launch page files (data-model.md "Launch content"; FR-020 to
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
  ["services.mdx", 2, true],
  ["speaking.mdx", 3, true],
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

describe("sections in Services and Speaking (US4)", () => {
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

  for (const name of ["services.mdx", "speaking.mdx"]) {
    it(`${name} uses at least one section and only registered ones`, () => {
      const tags = used(load(name).body);
      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) expect(registered.has(tag), `${tag} is registered`).toBe(true);
    });
  }
});
