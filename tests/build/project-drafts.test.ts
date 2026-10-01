// US7 and FR-073: a draft is built and marked on preview and local builds, and is
// absent from the production build (index, route, sitemap, files). A broken draft
// failing the build is asserted in project-validation.test.ts. The draft here uses its own image, poster and clip so
// their absence from dist/ proves draft-only assets are dropped.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile, type FixtureSiteResult } from "./fixture-site.ts";

const draftWithAssets: FixtureFile = {
  from: "draft.mdx",
  replace: [
    ["src: ./images/sample.png", "src: ./images/draft-only.png"],
    [
      "draft: true\n",
      "draft: true\nvisuals:\n  clip:\n    kind: clip\n    src: ./images/draft-only.webm\n    poster: ./images/draft-only-poster.png\n    label: A draft clip\n    description: Only in the draft.\n",
    ],
    ['<Chapter stage="built">', '<Chapter stage="built" visual="clip">'],
  ],
};
const projects = ["minimal.mdx", draftWithAssets];
// Workers Builds sets WORKERS_CI, and the build then requires the Turnstile site key
// (astro.config.mjs); Cloudflare's always-pass test key stands in for it here.
const workersBuild = { WORKERS_CI: "1", PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" };
const production = { ...workersBuild, WORKERS_CI_BRANCH: "main" };
const preview = { ...workersBuild, WORKERS_CI_BRANCH: "some-branch" };

function filesUnder(dir: string, into: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) filesUnder(path, into);
    else into.push(path);
  }
  return into;
}

describe("a production build", () => {
  let result: FixtureSiteResult;
  beforeAll(async () => {
    result = await buildFixtureSite([], { projects, env: production });
  }, 240_000);
  afterAll(() => result?.cleanup());

  it("builds", () => {
    expect(result.message).toBe("");
  });

  it("leaves the draft out of the index, the routes and the sitemap", () => {
    const pages = [...result.htmlFiles().keys()];
    expect(pages).toContain("projects/minimal/index.html");
    expect(pages).not.toContain("projects/draft/index.html");
    const index = result.read("projects/index.html");
    expect(index).toContain("Minimal project");
    expect(index).not.toContain("Draft project");
    expect(index).not.toContain("/projects/draft/");
    const sitemap = result.read("sitemap-0.xml");
    expect(sitemap).toContain("/projects/minimal/");
    expect(sitemap).not.toContain("/projects/draft/");
  });

  it("keeps the draft's title and files out of every built file", () => {
    for (const [path, html] of result.htmlFiles()) {
      expect(html, path).not.toContain("Draft project");
    }
    const names = filesUnder(result.dist).map((path) => path.slice(result.dist.length));
    expect(names.filter((name) => name.includes("draft-only"))).toEqual([]);
  });

  it("marks nothing as a draft", () => {
    expect(result.read("projects/minimal/index.html")).not.toContain("data-draft-notice");
  });
});

describe("a preview build", () => {
  let result: FixtureSiteResult;
  beforeAll(async () => {
    result = await buildFixtureSite([], { projects, env: preview });
  }, 240_000);
  afterAll(() => result?.cleanup());

  it("lists and builds the draft with a Draft mark", () => {
    expect(result.message).toBe("");
    const index = result.read("projects/index.html");
    expect(index).toContain("Draft project");
    expect(index).toMatch(/data-draft-mark[^>]*>Draft</);
    const story = result.read("projects/draft/index.html");
    expect(story).toContain("Draft project");
    expect(story).toContain("data-draft-notice");
    expect(result.read("sitemap-0.xml")).toContain("/projects/draft/");
  });

  it("emits the draft's own image and clip, and leaves the published project unmarked", () => {
    const names = filesUnder(result.dist).map((path) => path.slice(result.dist.length));
    expect(names.some((name) => name.includes("draft-only") && name.endsWith(".webm"))).toBe(true);
    expect(names.some((name) => name.includes("draft-only") && !name.endsWith(".webm"))).toBe(true);
    expect(result.read("projects/minimal/index.html")).not.toContain("data-draft-notice");
  });
});
