// Guard: tests read real posts and projects through tests/helpers/content.ts and never name them,
// so publishing or rewriting a story never needs a test edit. Unit layer: it reads files and
// builds nothing. The needles come from the content, so the guard needs no upkeep.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { projects, realPosts } from "../../helpers/content.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const thisFile = fileURLToPath(import.meta.url);

/** Every real post and project address, entry file name and quoted title. Sample posts are test-owned and left out. */
export function realContentNeedles(): string[] {
  const entries = [...realPosts, ...projects];
  const needles = entries.flatMap((entry) => [entry.address, `${entry.slug}.mdx`]);
  for (const entry of entries) {
    for (const quote of ['"', "'", "`"]) needles.push(`${quote}${entry.title}${quote}`);
  }
  return [...new Set(needles)];
}

/** The needles that appear in `text`. */
export function findNeedles(text: string, needles: readonly string[]): string[] {
  return needles.filter((needle) => needle.length > 0 && text.includes(needle));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const path = join(dir, item.name);
    if (item.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|mts|js|mjs)$/.test(item.name) ? [path] : [];
  });
}

describe("no real content named in tests", () => {
  const needles = realContentNeedles();

  it("flags a snippet that names a real address, entry file or title", () => {
    const project = projects[0];
    const post = realPosts[0];
    expect(findNeedles(`goto("${project.address}")`, needles)).toContain(project.address);
    expect(findNeedles(`open("${post.slug}.mdx")`, needles)).toContain(`${post.slug}.mdx`);
    expect(findNeedles(`getByText("${post.title}")`, needles)).toContain(`"${post.title}"`);
    expect(findNeedles("goto('/example-address/')", needles)).toEqual([]);
  });

  const files = ["tests/e2e", "tests/build", "tests/unit/content"]
    .flatMap((dir) => sourceFiles(join(root, dir)))
    .filter((file) => file !== thisFile);

  it("scans test files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((file) => relative(root, file)))("%s names no real post or project", (file) => {
    const found = findNeedles(readFileSync(join(root, file), "utf8"), needles);
    expect(
      found,
      `${file} names real content (${found.join(", ")}); read it through tests/helpers/content.ts instead`,
    ).toEqual([]);
  });
});
