// US9 and FR-082: Focus Pocus is the first real project, a plain project file
// with its draft chapters and placeholders marked, and no site code names it.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../", import.meta.url));
const file = resolve(root, "src/content/projects/focus-pocus.mdx");
const source = () => readFileSync(file, "utf-8");
const stageIds = ["problem", "constraints", "options", "built", "outcome", "lessons", "invitation"];

function frontmatter(): string {
  return /^---\n([\s\S]*?)\n---/.exec(source())?.[1] ?? "";
}

describe("the Focus Pocus project file", () => {
  it("exists, is published (draft: false) and has all seven chapters in order", () => {
    expect(existsSync(file)).toBe(true);
    expect(frontmatter()).toMatch(/^draft: false$/m);
    const stages = [...source().matchAll(/<Chapter\b[^>]*\bstage="([a-z]+)"/g)].map((m) => m[1]);
    expect(stages).toEqual(stageIds);
  });

  it("marks every chapter as a draft", () => {
    const chapters = [...source().matchAll(/<Chapter\b[^>]*>/g)].map((m) => m[0]);
    expect(chapters).toHaveLength(7);
    for (const tag of chapters) expect(tag).toMatch(/\sdraft(\s|>|\/)/);
  });

  it("marks every placeholder visual with placeholder: true", () => {
    // Every picture of kind image or clip stands in for a capture that does not exist yet.
    const lines = frontmatter().split("\n");
    const placeholders = lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => /^\s+kind: (image|clip)\s*$/.test(line));
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
    for (const { index } of placeholders) {
      const block = lines.slice(index, index + 8).join("\n");
      expect(block).toMatch(/placeholder: true/);
    }
  });

  it("has a stand-in address and chooses JXA behind an MCP server", () => {
    const front = frontmatter();
    expect(front).toMatch(/^standIn:\n\s+href: https:\/\/drc\.dev\/projects\/focus-pocus$/m);
    expect(front).toMatch(/id: jxa-mcp[\s\S]*?chosen: true/);
    expect(front).not.toMatch(/chosen: true[\s\S]*chosen: true/);
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
