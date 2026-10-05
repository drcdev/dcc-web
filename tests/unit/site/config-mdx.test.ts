import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), "utf-8");
const pkg = JSON.parse(read("package.json"));

describe("MDX and fixture-site configuration", () => {
  it("pins @astrojs/mdx like the other dependencies", () => {
    expect(pkg.dependencies["@astrojs/mdx"]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("pins the blog dependencies to exact versions", () => {
    expect(pkg.dependencies["@astrojs/rss"]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("registers mdx() in astro.config.mjs", () => {
    const config = read("astro.config.mjs");
    expect(config).toMatch(/from "@astrojs\/mdx"/);
    expect(config).toMatch(/integrations:\s*\[[^\]]*mdx\(\)/s);
  });

  it("serves the fixture site on port 4322 and isolates the sections project", () => {
    const config = read("playwright.config.ts");
    expect(config).toContain("pnpm run build:fixtures");
    expect(config).toContain("astro preview");
    expect(config).toContain("--port 4322");
    expect(config).toMatch(/name:\s*"sections"/);
    // The project also runs the pagination spec, which needs the fixture site's 13 or more posts
    // (spec 008 T057), the blog fixtures spec, which needs the fixture site's text-only and long
    // title posts (spec 010), the project fixtures spec (spec 009) and the questions panel spec (spec 022).
    expect(config).toMatch(
      /testMatch:\s*\[\s*\/sections\\\.spec\\\.ts\$\/,\s*\/blog-pagination\\\.spec\\\.ts\$\/,\s*\/blog-fixtures\\\.spec\\\.ts\$\/,\s*\/projects-fixtures\\\.spec\\\.ts\$\/,\s*\/questions\\\.spec\\\.ts\$\/,?\s*\]/,
    );
    expect(config).toMatch(/testIgnore:\s*\[[^\]]*sections\\\.spec\\\.ts\$/s);
    expect(config).toMatch(/testIgnore:\s*\[[^\]]*blog-fixtures\\\.spec\\\.ts\$/s);
    expect(config).toMatch(/testIgnore:\s*\[[^\]]*projects-fixtures\\\.spec\\\.ts\$/s);
  });

  it("includes tests/build in vitest", () => {
    expect(read("vitest.config.ts")).toContain("tests/build/**");
  });

  it("ignores .cache/ in eslint and git", () => {
    expect(read("eslint.config.js")).toContain('".cache/**"');
    expect(read(".gitignore")).toMatch(/^\.cache\/$/m);
  });
});
