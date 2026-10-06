import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
  it.each(["Lead", "TextBlock", "Offerings", "Offering", "CallToAction", "Figure", "WideImage", "FullImage", "SideImage"])(
    "has an example of %s",
    (name) => {
      expect(guide()).toContain(`<${name}`);
    },
  );
});
