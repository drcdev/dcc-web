// US5 and FR-022, FR-023, FR-082: the five real projects are in the four-part shape, all drafts,
// and no site code names one. Unit layer: it reads the files and the schema, and builds nothing.
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";
import { validateProjectStory } from "../../../src/lib/content/project-story.ts";

const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = (await import(
  pathToFileURL(fromAstro.resolve("@astrojs/internal-helpers/frontmatter")).href
)) as { parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown>; content: string } };

const root = fileURLToPath(new URL("../../../", import.meta.url));
const slugs = ["focus-pocus", "drcdev-github-io", "flux", "plunge-buddy", "tempo"];
const read = (slug: string) => {
  const path = resolve(root, `src/content/projects/${slug}.mdx`);
  const source = readFileSync(path, "utf-8");
  return { path, source, ...parseFrontmatter(source) };
};
const removed = ["order", "comparison", "demo", "clips", "pros", "cons"];

describe.each(slugs)("the %s project file", (slug) => {
  const { source, frontmatter, content } = read(slug);

  it("is a draft and keeps its review comment", () => {
    expect(frontmatter.draft).toBe(true);
    expect(content).toMatch(/\{\/\*\s*DRAFT FOR REVIEW:/);
  });

  it("passes the schema and has none of the removed settings", () => {
    const result = projectSchema({ image: () => z.string() }).safeParse(frontmatter);
    expect(result.error?.message).toBeUndefined();
    for (const key of removed) expect(frontmatter).not.toHaveProperty(key);
    expect(source).not.toMatch(/<(Chapter|OptionComparison|Demo|Invitation)\b/);
  });

  it("passes the story check with exactly one bold option", () => {
    const table = validateProjectStory(`src/content/projects/${slug}.mdx`, content);
    expect(table.options.filter((option) => option.chosen)).toHaveLength(1);
    expect(table.options.length).toBeGreaterThanOrEqual(3);
    expect(table.constraints).toHaveLength(4);
  });

  it("has its own invitation sentence and pictures that name a part", () => {
    expect(String(frontmatter.invitation ?? "")).toMatch(/tell me about it\.$/);
    const visuals = Object.values((frontmatter.visuals ?? {}) as Record<string, { part?: string }>);
    expect(visuals.length).toBeGreaterThanOrEqual(2);
    expect(visuals.some((picture) => picture.part === "problem")).toBe(true);
    expect(visuals.some((picture) => picture.part === "build")).toBe(true);
  });
});

describe("Focus Pocus", () => {
  const { frontmatter, content } = read("focus-pocus");
  it("chooses JXA behind an MCP server and keeps the packing-list picture without a part", () => {
    expect(validateProjectStory("focus-pocus.mdx", content).options.find((o) => o.chosen)?.name).toBe("JXA behind an MCP server");
    const visuals = frontmatter.visuals as Record<string, { part?: string }>;
    expect(visuals["packing-list"]).toBeDefined();
    expect(visuals["packing-list"]!.part).toBeUndefined();
  });
  it("has a stand-in address", () => {
    expect(frontmatter.standIn).toMatchObject({ href: "https://drc.dev/projects/focus-pocus" });
  });
});

describe("the migrated tables follow FR-022", () => {
  it("maps Flux's fit answers and chosen option", () => {
    const table = validateProjectStory("flux.mdx", read("flux").content);
    expect(table.constraints.map((c) => c.label)).toEqual([
      "Two newsletters, two looks",
      "Works on hosted Ghost",
      "Dark mode done properly",
      "Safe AI additions",
    ]);
    expect(table.options.map((o) => [o.name, o.chosen, o.fits])).toEqual([
      ["Ghost's stock Casper theme", false, ["no", "yes", "partly", "no"]],
      ["A marketplace theme, customised", false, ["partly", "yes", "partly", "no"]],
      ["A theme built from scratch", true, ["yes", "yes", "yes", "yes"]],
    ]);
  });
});

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("no site code names a project (FR-082)", () => {
  it("has no file under src/components, layouts, pages, lib or styles, nor astro.config.mjs, that names focus-pocus", () => {
    const targets = ["components", "layouts", "pages", "lib", "styles"].flatMap((d) => files(resolve(root, "src", d)));
    targets.push(resolve(root, "astro.config.mjs"));
    const named = targets.filter((path) => /focus[-_ ]?pocus/i.test(readFileSync(path, "utf-8")));
    expect(named.map((p) => p.slice(root.length))).toEqual([]);
  });
});

it("keeps the template beside the five", () => expect(existsSync(resolve(root, "src/content/projects/_template.mdx"))).toBe(true));
