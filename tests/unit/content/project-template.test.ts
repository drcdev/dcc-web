// Unit tests (primary layer: unit) for the writer's template `src/content/projects/_template.mdx`
// (specs/014-project-four-part-story/data-model.md "Template"; US2). The build-level checks (the
// loader excludes it, a renamed copy builds) are in tests/build/project-validation.test.ts.
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";
import { validateProjectStory } from "../../../src/lib/content/project-story.ts";

// `@astrojs/internal-helpers` is Astro's own dependency, so resolve it from Astro.
const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = (await import(
  pathToFileURL(fromAstro.resolve("@astrojs/internal-helpers/frontmatter")).href
)) as { parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown>; content: string } };

const path = new URL("../../../src/content/projects/_template.mdx", import.meta.url);
const source = existsSync(path) ? readFileSync(path, "utf-8") : "";
const { frontmatter, content } = parseFrontmatter(source);

describe("the project template", () => {
  it("exists, and its picture file exists", () => {
    expect(source).not.toBe("");
    expect(existsSync(new URL("../../../src/content/projects/images/template/diagram.svg", import.meta.url))).toBe(true);
  });

  it("is a draft", () => expect(frontmatter.draft).toBe(true));

  it("passes the project schema", () => {
    const result = projectSchema({ image: () => z.string() }).safeParse(frontmatter);
    expect(result.error?.message).toBeUndefined();
    expect(result.success).toBe(true);
  });

  it("passes the story check with four parts and an options table", () => {
    const comparison = validateProjectStory("src/content/projects/_template.mdx", content);
    expect(comparison.options.filter((option) => option.chosen)).toHaveLength(1);
  });

  it("has an example picture beside a part and an invitation", () => {
    const visuals = Object.values((frontmatter.visuals ?? {}) as Record<string, { part?: string }>);
    expect(visuals.some((picture) => picture.part === "build")).toBe(true);
    expect(String(frontmatter.invitation ?? "").length).toBeGreaterThan(0);
  });

  it("names the optional details in comments", () => {
    const comments = [...content.matchAll(/\{\/\*([\s\S]*?)\*\/\}/g)].map((match) => match[1]).join("\n");
    for (const detail of ["visuals", "standIn", "demo", "source", "image", "invitation", "retired", "replacedBy"]) {
      expect(comments).toContain(detail);
    }
  });

  it("links only to example.com", () => {
    const links = source.match(/https?:\/\/[^\s)"'<>]+/g) ?? [];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(new URL(link).hostname).toBe("example.com");
  });
});
