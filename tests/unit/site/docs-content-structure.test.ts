import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { sectionNames } from "../../../src/components/sections/index.ts";
import { validatePageBody } from "../../../src/lib/content/body.ts";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const design = () => readFileSync(root("docs/design-source.md"), "utf-8");
const guide = () => readFileSync(root("docs/pages.md"), "utf-8");

function section(doc: string, heading: string): string {
  const start = doc.indexOf(`## ${heading}`);
  expect(start, `"${heading}" section`).toBeGreaterThanOrEqual(0);
  const rest = doc.slice(start + 3);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("docs/design-source.md content structure", () => {
  const paths = [
    "src/content.config.ts",
    "src/content/schemas/",
    "src/content/pages/",
    "src/components/sections/",
    "src/components/page/",
    "src/layouts/PageLayout.astro",
    "src/lib/content/",
    "src/pages/[...slug].astro",
    "docs/pages.md",
  ];
  it.each(paths)("names %s", (p) => {
    expect(section(design(), "Content structure")).toContain(p);
  });

  it.each(["page.hbs", "layout-author-hero.hbs", "content-feature-image.hbs", "kg-width-wide", "kg-width-full"])(
    "maps %s",
    (row) => {
      expect(design()).toContain(row);
    },
  );

  it("has an accessibility adjustments subsection", () => {
    expect(design()).toMatch(/^#{2,3} Accessibility adjustments/m);
  });
});

describe("docs/pages.md", () => {
  it("exists", () => {
    expect(existsSync(root("docs/pages.md"))).toBe(true);
  });
  it.each(["title", "description", "image", "featureImage", "nav", "position", "label", "draft", "intro"])(
    "lists the key %s",
    (key) => {
      expect(guide()).toContain(`\`${key}\``);
    },
  );
  it("gives description-length guidance", () => {
    expect(guide()).toMatch(/50 to 160 characters/);
    expect(guide()).toMatch(/not enforced/i);
  });
  it("documents the eight components in the registry order", () => {
    const g = guide();
    const positions = sectionNames.map((name) => g.indexOf(`\`${name}\``));
    positions.forEach((at, n) => expect(at, `${sectionNames[n]} is documented`).toBeGreaterThanOrEqual(0));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
  it.each(["Lead", "CallToAction", "Figure", "WideImage", "FullImage", "SideImage", "ContactForm", "RecentWriting"])(
    "has an example of %s",
    (name) => {
      expect(guide()).toContain(`<${name}`);
    },
  );
  it.each([
    ["Lead", null],
    ["CallToAction", ["label", "href"]],
    ["Figure", ["caption"]],
    ["WideImage", ["caption"]],
    ["FullImage", ["caption"]],
  ])("names the props of %s", (name, props) => {
    for (const prop of props ?? []) expect(guide()).toContain(`\`${prop}\``);
    expect(guide()).toContain(`\`${name}\``);
  });
  it("states the plain Markdown rule once", () => {
    const g = guide();
    const rule = /plain Markdown/g;
    expect(g.match(rule)?.length).toBe(1);
    for (const word of ["headings", "paragraphs", "lists", "tables", "quotes", "links", "emphasis"]) {
      expect(g).toContain(word);
    }
    expect(g).toMatch(/components? (are|is) (only )?for/i);
  });
  it("shows a ## heading with text and a ## group with ### items, never ### after the title", () => {
    const g = guide();
    expect(g).toMatch(/^## .+\n\n[A-Za-z]/m);
    expect(g).toMatch(/^### /m);
    for (const block of mdxExamples()) {
      const first = block.split("\n").find((l) => /^#{2,6} /.test(l));
      if (first) expect(first.startsWith("###")).toBe(false);
    }
  });
  it("says how heading addresses are formed and shows a link to one", () => {
    const g = guide();
    expect(g).toMatch(/lower case/i);
    expect(g).toMatch(/hyphen/i);
    expect(g).toContain("-1");
    expect(g).toContain("-2");
    expect(g).toMatch(/\]\(\/[a-z-]+\/#[a-z0-9-]+\)/);
  });
  it("shows a Markdown link inside a heading or item text", () => {
    expect(guide()).toMatch(/^#{2,3} .*\[[^\]]+\]\([^)]+\)/m);
  });
  it("says headings go in the body, not inside a component", () => {
    expect(guide()).toMatch(/not inside a component/i);
  });
  it("names no removed section anywhere", () => {
    expect(guide()).not.toMatch(/<(TextBlock|Offerings|Offering)/);
    expect(guide()).not.toMatch(/\b(TextBlock|Offerings?)\b/);
  });
  it("shows only examples the page body check accepts", () => {
    const blocks = mdxExamples();
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(() => validatePageBody("src/content/pages/x.mdx", block)).not.toThrow();
  });
});

describe("docs/posts.md", () => {
  const posts = () => readFileSync(root("docs/posts.md"), "utf-8");
  it("names Lead and CallToAction as the page sections usable in posts", () => {
    expect(posts()).toContain("`Lead`");
    expect(posts()).toContain("`CallToAction`");
  });
});

describe("removed sections are not named in guides", () => {
  const removed = /\b(TextBlock|Offerings?)\b/;
  function walk(path: string): string[] {
    if (!existsSync(root(path))) return [];
    if (!statSync(root(path)).isDirectory()) return [path];
    return readdirSync(root(path)).flatMap((f) => walk(`${path}/${f}`));
  }
  const files = [...walk("docs"), ...walk(".claude/skills")].filter((f) => /\.(md|mdx|txt|yml|yaml|json)$/.test(f));
  it.each(files)("%s", (file) => {
    expect(readFileSync(root(file), "utf-8")).not.toMatch(removed);
  });
});

function mdxExamples(): string[] {
  return [...guide().matchAll(/```mdx\n([\s\S]*?)```/g)].map((m) => m[1] as string);
}
