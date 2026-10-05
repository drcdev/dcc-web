// US5 and FR-022, FR-023, FR-082: every real project is in the four-part shape, a draft with its review comment or published without it, and no site code names one. Unit layer: it reads the files and the schema, and builds nothing.
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";
import { validateProjectStory } from "../../../src/lib/content/project-story.ts";
import { projects } from "../../helpers/content.ts";
import { filesUnder } from "../../helpers/files.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
// The demo setting itself stays (an address on drc.dev and a title); only its embed switch was removed.
const removed = ["order", "comparison", "clips", "pros", "cons"];

describe.each(projects.map((entry) => [entry.slug, entry] as const))("the %s project file", (_slug, entry) => {
  const { data: frontmatter, body: content } = entry;
  const source = readFileSync(resolve(root, entry.file), "utf-8");

  it("is a draft with its review comment, or published without it", () => {
    expect(frontmatter.draft === true).toBe(entry.draft);
    if (entry.draft) expect(content).toMatch(/\{\/\*\s*DRAFT FOR REVIEW:/);
    else expect(content).not.toMatch(/DRAFT FOR REVIEW/);
  });

  it("passes the schema and has none of the removed settings", () => {
    const result = projectSchema({ image: () => z.string() }).safeParse(frontmatter);
    expect(result.error?.message).toBeUndefined();
    for (const key of removed) expect(frontmatter).not.toHaveProperty(key);
    expect(frontmatter.demo ?? {}).not.toHaveProperty("embed");
    expect(source).not.toMatch(/<(Chapter|OptionComparison|Demo|Invitation)\b/);
  });

  it("passes the story check with exactly one bold option", () => {
    const table = validateProjectStory(entry.file, content);
    expect(table.options.filter((option) => option.chosen)).toHaveLength(1);
    expect(table.options.length).toBeGreaterThanOrEqual(3);
    expect(table.constraints).toHaveLength(4);
  });

  it("gives every option one fit per constraint, over distinct non-empty constraint labels", () => {
    const table = validateProjectStory(entry.file, content);
    const labels = table.constraints.map((c) => c.label);
    expect(labels.every((label) => label.trim() !== "")).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
    for (const option of table.options) {
      expect(option.fits).toHaveLength(table.constraints.length);
      for (const fit of option.fits) expect(["yes", "partly", "no"]).toContain(fit);
    }
  });

  it("has its own invitation sentence and pictures that name a part", () => {
    expect(String(frontmatter.invitation ?? "")).toMatch(/tell me about it\.$/);
    const visuals = Object.values((frontmatter.visuals ?? {}) as Record<string, { part?: string }>);
    expect(visuals.length).toBeGreaterThanOrEqual(2);
    expect(visuals.some((picture) => picture.part === "problem")).toBe(true);
    expect(visuals.some((picture) => picture.part === "build")).toBe(true);
  });

  it("names a replacement only when it is retired, and a retired project may name none (#65)", () => {
    const replacedBy = frontmatter.replacedBy as { project?: unknown; name?: string } | undefined;
    if (frontmatter.status !== "retired") expect(replacedBy).toBeUndefined();
    else if (replacedBy) expect(Boolean(replacedBy.project) !== Boolean(replacedBy.name)).toBe(true);
  });
});

describe("no site code names a project (FR-082)", () => {
  const targets = ["components", "layouts", "pages", "lib", "styles"].flatMap((d) => filesUnder(resolve(root, "src", d)));
  targets.push(resolve(root, "astro.config.mjs"));
  const sources = targets.map((path) => ({ path: path.slice(root.length), text: readFileSync(path, "utf-8") }));

  it.each(projects.map((entry) => entry.slug))("has no file under src/components, layouts, pages, lib or styles, nor astro.config.mjs, that names %s", (slug) => {
    const quoted = new RegExp(`["'\`]${slug}["'\`]|/projects/${slug}\\b`);
    expect(sources.filter(({ text }) => quoted.test(text)).map(({ path }) => path)).toEqual([]);
  });
});

it("keeps the template beside the five", () => expect(existsSync(resolve(root, "src/content/projects/_template.mdx"))).toBe(true));
