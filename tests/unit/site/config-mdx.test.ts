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
  });

  it("includes tests/build in vitest", () => {
    expect(read("vitest.config.ts")).toContain("tests/build/**");
  });

  it("ignores .cache/ in eslint and git", () => {
    expect(read("eslint.config.js")).toContain('".cache/**"');
    expect(read(".gitignore")).toMatch(/^\.cache\/$/m);
  });
});
