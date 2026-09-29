// The seven launch page files (data-model.md "Launch content"; FR-020 to
// FR-024). Reads the files directly, so a missing page or a wrong claim fails
// here before any build.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = fileURLToPath(new URL("../../../src/content/pages/", import.meta.url));

function load(name: string) {
  const path = `${dir}${name}`;
  expect(existsSync(path), `${name} exists`).toBe(true);
  const source = readFileSync(path, "utf-8");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  expect(match, `${name} has frontmatter`).not.toBeNull();
  return { front: match![1]!, body: match![2]!, all: source, text: source.toLowerCase() };
}

const LAUNCH = [
  ["index.mdx", 1],
  ["services.mdx", 2],
  ["speaking.mdx", 3],
  ["about.mdx", 6],
  ["privacy-policy.mdx", undefined],
  ["terms-of-use.mdx", undefined],
  ["technology.mdx", undefined],
] as const;

describe("launch page files", () => {
  for (const [name, position] of LAUNCH) {
    it(`${name} is a draft with the expected nav position`, () => {
      const { front } = load(name);
      expect(front).toMatch(/^draft: true$/m);
      if (position === undefined) {
        expect(front).not.toMatch(/^nav:/m);
      } else {
        expect(front).toMatch(/^nav:/m);
        expect(front).toMatch(new RegExp(`position: ${position}\\b`));
      }
    });
  }

  it("home is labelled Home in the navigation", () => {
    expect(load("index.mdx").front).toMatch(/label: "?Home"?/);
  });

  it("home has no CallToAction in its body (the intro card owns the call to action)", () => {
    expect(load("index.mdx").body).not.toContain("<CallToAction");
  });

  it("home has an intro with photo, name, tagline, bio and a call to action to /services/", () => {
    const { front } = load("index.mdx");
    expect(front).toMatch(/^intro:/m);
    for (const key of ["photo:", "name:", "tagline:", "bio:", "cta:"]) expect(front).toContain(key);
    expect(front).toMatch(/photo:\s*\n\s+src: \.\/images\/don-coleman\.jpg/);
    expect(front).toMatch(/alt: \S/);
    expect(front).toMatch(/href: "?\/services\/"?/);
  });

  it("home body says who Don helps and what he does", () => {
    const body = load("index.mdx").body.toLowerCase();
    expect(body).toMatch(/helps?/);
    expect(body).toMatch(/what (don|he) does|the work/);
  });

  it("there is no cookie policy page", () => {
    expect(existsSync(`${dir}cookie-policy.mdx`)).toBe(false);
    expect(existsSync(`${dir}cookie-policy.md`)).toBe(false);
  });
});

describe("Services (FR-021)", () => {
  const { text } = load("services.mdx");
  it("covers kinds of work, how Don works and what he does not do", () => {
    expect(text).toMatch(/kinds of work|the work/);
    expect(text).toMatch(/how i work/);
    expect(text).toMatch(/what i do not do|what i don't do|what i do not take on/);
  });
});

describe("Speaking (FR-021)", () => {
  const { text, body } = load("speaking.mdx");
  it("covers talk topics, past talks and an organiser bio with a photo", () => {
    expect(text).toMatch(/topics/);
    expect(text).toMatch(/past talks/);
    expect(text).toMatch(/organiser/);
    expect(body).toMatch(/!\[[^\]]+\]\(\.\/images\/don-coleman\.jpg\)/);
  });
});

describe("About (FR-021)", () => {
  const { text } = load("about.mdx");
  it("covers background, credentials and how the practice fits alongside his full-time role", () => {
    expect(text).toMatch(/background/);
    expect(text).toMatch(/credentials/);
    expect(text).toMatch(/full-time/);
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
    expect(text).toMatch(/where (that|the) database is located is to be confirmed/);
    expect(text).toContain("retention");
    expect(text).toContain("spam");
    expect(text).toMatch(/delet/);
    expect(text).toMatch(/ask (what|for)/);
  });

  it('marks the four unconfirmed items "to be confirmed"', () => {
    const count = (text.match(/to be confirmed/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(4);
  });

  it("does not assert a storage location", () => {
    expect(text).not.toMatch(/canada|toronto/);
  });

  it("states no concrete retention duration and does not name the spam-protection service", () => {
    expect(text).not.toMatch(/\b\d+\s*(day|week|month|year)s?\b/);
    expect(text).not.toContain("turnstile");
  });

  it("does not link to the old cookie policy and shows a Last updated date", () => {
    expect(all).not.toContain("/cookie-policy/");
    expect(all).toMatch(/Last updated:?\*{0,2}\s*\d{1,2} \w+ \d{4}|Last updated:?\*{0,2}\s*\d{4}-\d{2}-\d{2}/);
  });
});

describe("Terms of use and Technology (FR-023, FR-024)", () => {
  const FORBIDDEN = ["ghost", "member", "subscribe", "comment", "drift", "convergence", "news"];
  for (const name of ["terms-of-use.mdx", "technology.mdx"]) {
    it(`${name} carries real draft copy for the new site`, () => {
      const { front, body, text } = load(name);
      expect(front).toMatch(/^draft: true$/m);
      const paragraphs = body.split(/\n\s*\n/).filter((block) => /^[A-Za-z]/.test(block.trim()));
      expect(paragraphs.length).toBeGreaterThanOrEqual(5);
      expect(text).not.toContain("this is a stub");
      for (const word of FORBIDDEN) expect(text, `${name} mentions "${word}"`).not.toContain(word);
      expect(text).not.toContain("cookie policy");
    });
  }

  it("Technology describes the actual stack", () => {
    const { text } = load("technology.mdx");
    for (const word of ["astro", "cloudflare", "tailwind", "d1"]) expect(text).toContain(word);
  });

  it("Technology does not assert a storage location", () => {
    expect(load("technology.mdx").text).not.toMatch(/canada|toronto/);
  });

  it("Terms of use covers acceptable use, ownership, liability and governing law", () => {
    const { text } = load("terms-of-use.mdx");
    for (const word of ["intellectual property", "liability", "governing law"]) expect(text).toContain(word);
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

  it("Speaking shows the organiser photo through Figure", () => {
    expect(load("speaking.mdx").body).toMatch(/<Figure[^>]*>\s*!\[[^\]]+\]\(\.\/images\/don-coleman\.jpg\)\s*<\/Figure>/);
  });
});
