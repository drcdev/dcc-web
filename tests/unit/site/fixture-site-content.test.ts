// The fixture site (port 4322) holds fixture content only (issue #69): its posts and projects
// are the generated and fixture ones, never the real ones, so the specs that run on it own every
// item they assert on. `prepareFixtureSite` lays the tree out without the Astro build.
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  FIXTURE_PAGES,
  FIXTURE_POSTS,
  generateFixturePosts,
  lowerFilterThreshold,
  prepareFixtureSite,
} from "../../../scripts/build-fixture-site.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const tempRoot = resolve(repoRoot, ".cache/fixture-tests");
const siteRoot = resolve(tempRoot, "fixture-site-content");

const mdxNames = (dir: string) => readdirSync(dir).filter((name) => name.endsWith(".mdx")).sort();

describe("the fixture site's content", () => {
  beforeAll(() => {
    rmSync(siteRoot, { recursive: true, force: true });
    mkdirSync(tempRoot, { recursive: true });
    prepareFixtureSite(siteRoot);
  });
  afterAll(() => rmSync(siteRoot, { recursive: true, force: true }));

  it("holds the generated and fixture posts only", () => {
    const expected = [...generateFixturePosts().map((post) => `${post.slug}.mdx`), ...FIXTURE_POSTS].sort();
    expect(mdxNames(resolve(siteRoot, "src/content/posts"))).toEqual(expected);
  });

  it("holds the fixture projects only", () => {
    const expected = mdxNames(resolve(repoRoot, "tests/fixtures/projects"));
    expect(mdxNames(resolve(siteRoot, "src/content/projects"))).toEqual(expected);
  });

  it("keeps the real pages and adds the fixture pages", () => {
    const names = mdxNames(resolve(siteRoot, "src/content/pages"));
    expect(names).toContain("index.mdx");
    for (const page of FIXTURE_PAGES) expect(names).toContain(page);
  });
});

describe("the fixture site's filter threshold", () => {
  const configPath = "src/config/projects.ts";
  const root = resolve(tempRoot, "fixture-site-threshold");
  beforeAll(() => {
    mkdirSync(tempRoot, { recursive: true });
    prepareFixtureSite(root);
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("is 0 in the copy and stays 10 in the repository", () => {
    expect(readFileSync(resolve(root, configPath), "utf8")).toMatch(/PROJECT_FILTER_THRESHOLD = 0;/);
    expect(readFileSync(resolve(repoRoot, configPath), "utf8")).toMatch(/PROJECT_FILTER_THRESHOLD = 10;/);
  });

  it("fails loudly when the constant is not found exactly once", () => {
    expect(() => lowerFilterThreshold("export const OTHER = 1;")).toThrow();
    const twice = "PROJECT_FILTER_THRESHOLD = 10;\nPROJECT_FILTER_THRESHOLD = 10;";
    expect(() => lowerFilterThreshold(twice)).toThrow();
    expect(lowerFilterThreshold("export const PROJECT_FILTER_THRESHOLD = 10;")).toContain("PROJECT_FILTER_THRESHOLD = 0;");
  });
});

describe("the specs that run only on the fixture site", () => {
  const specs = ["blog-fixtures", "blog-pagination", "projects-fixtures"].map((name) => `tests/e2e/${name}.spec.ts`);

  it.each(specs)("%s reads no real content", (spec) => {
    const source = readFileSync(resolve(repoRoot, spec), "utf8");
    const imports = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*["'][^"']*helpers\/content(?:\.ts)?["']/g)];
    const names = imports.flatMap((match) => match[1]!.split(",").map((name) => name.trim()));
    const real = names.filter((name) => ["posts", "projects", "realPosts", "pages"].includes(name));
    expect(real).toEqual([]);
  });
});
