// Smoke test for the fixture-site harness (tests/build/fixture-site.ts): it copies a site, places
// fixture page, post and project files (with `to` names and `replace` edits), runs the content layer
// and reports failures as text. Two syncs cover it: S1 places every kind of file with the default
// options, S2 keeps the real posts. A broken page, post or project file reported by file and key is
// asserted in page-validation, post-validation and project-validation (their first sync). The
// `env` option runs in drafts.test.ts (WORKERS_CI sets the site address) and local-site.test.ts
// (the variable stays out of a default build).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prepareFixtureSite } from "../../scripts/build-fixture-site.ts";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const isPost = (name: string) => /\.mdx?$/.test(name);
const realPostNames = readdirSync(`${root}src/content/posts`).filter((name) => isPost(name) && !name.startsWith("sample-"));

let s1: FixtureSiteResult;
let s2: FixtureSiteResult;
let s1Root = "";

beforeAll(async () => {
  s1 = await buildFixtureSite([{ from: "workshops.mdx", to: "legal/index.mdx" }, "workshops.mdx"], {
    mode: "sync",
    posts: [
      "valid/minimal.mdx",
      { from: "valid/untagged.mdx", to: "renamed-post.mdx", replace: ["A post in no series", "A renamed post"] },
    ],
    projects: ["minimal.mdx", "every-setting.mdx", "draft.mdx"],
    readingPaths: [{ from: "harness/minimal-path.yaml", to: "renamed-path.yaml" }],
    now: "now.mdx",
  });
  s1Root = s1.root;
  s2 = await buildFixtureSite([], { mode: "sync", realPosts: true });
}, 300_000);

afterAll(() => {
  s1?.cleanup();
  s2?.cleanup();
});

describe("fixture-site harness, S1 (every kind of file, default options)", () => {
  it("syncs valid page, post and project files into a temporary site", () => {
    expect(s1.message).toBe("");
    expect(s1.ok).toBe(true);
    expect(existsSync(`${s1.root}/src/content/pages/workshops.mdx`)).toBe(true);
  });

  it("places a page file at the `to` path", () => {
    expect(existsSync(`${s1.root}/src/content/pages/legal/index.mdx`)).toBe(true);
  });

  it("syncs project fixtures with their images into the projects collection", () => {
    expect(existsSync(`${s1.root}/src/content/projects/minimal.mdx`)).toBe(true);
    expect(existsSync(`${s1.root}/src/content/projects/every-setting.mdx`)).toBe(true);
    expect(existsSync(`${s1.root}/src/content/projects/draft.mdx`)).toBe(true);
    expect(existsSync(`${s1.root}/src/content/projects/images/sample.png`)).toBe(true);
  });

  it("copies post files and their images from tests/fixtures/posts/ into src/content/posts/", () => {
    expect(existsSync(`${s1.root}/src/content/posts/minimal.mdx`)).toBe(true);
    expect(existsSync(`${s1.root}/src/content/posts/images/sample.png`)).toBe(true);
  });

  it("leaves the repository's real posts out by default and keeps the sample post", () => {
    const posts = readdirSync(`${s1.root}/src/content/posts`).filter(isPost);
    expect(posts.filter((name) => name.startsWith("sample-")).length).toBeGreaterThan(0);
    expect(realPostNames.length).toBeGreaterThan(0);
    for (const name of realPostNames) expect(posts, name).not.toContain(name);
    expect(posts.filter((name) => !name.startsWith("sample-")).sort()).toEqual(["minimal.mdx", "renamed-post.mdx"]);
  });

  it("places a post file at the `to` name", () => {
    expect(existsSync(`${s1.root}/src/content/posts/renamed-post.mdx`)).toBe(true);
    expect(existsSync(`${s1.root}/src/content/posts/untagged.mdx`)).toBe(false);
  });

  it("replaces text in a copied post file, to test an edit", () => {
    const text = readFileSync(`${s1.root}/src/content/posts/renamed-post.mdx`, "utf-8");
    expect(text).toContain("A renamed post");
    expect(text).not.toContain("A post in no series");
  });

  it("installs the reading-path files a test asks for, at the `to` name, and no real reading path", () => {
    expect(s1.message).toBe("");
    expect(yamlNames(`${s1.root}/src/content/reading-paths`)).toEqual(["renamed-path.yaml"]);
  });

  it("installs the fixture Now file in place of the default one", () => {
    expect(readFileSync(`${s1.root}/src/content/now/now.mdx`, "utf-8")).toBe(readFileSync(`${root}tests/fixtures/now/now.mdx`, "utf-8"));
    expect(readdirSync(`${s1.root}/src/content/now`)).toEqual(["now.mdx"]);
  });

  it("removes the temporary site on cleanup", () => {
    s1.cleanup();
    expect(existsSync(s1Root)).toBe(false);
  });
});

describe("fixture-site harness, S2 (realPosts)", () => {
  it("keeps the repository's real posts with `realPosts`", () => {
    expect(s2.message).toBe("");
    expect(s2.ok).toBe(true);
    expect(realPostNames.length).toBeGreaterThan(0);
    for (const name of realPostNames) expect(existsSync(`${s2.root}/src/content/posts/${name}`), name).toBe(true);
  });
});

// Contract rows N and R need the reading-path and Now files to follow the posts and projects a
// fixture build holds. Reason for build layer: only the real harness copies show which files a
// fixture site is made of (specs/040-home-now-start-here, plan "Fixture builds").
const yamlNames = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(".yaml")).sort() : []);
const realPathNames = yamlNames(`${root}src/content/reading-paths`);

describe("fixture-site harness, reading paths and Now", () => {
  it("keeps the real reading paths when real posts are kept", () => {
    expect(yamlNames(`${s2.root}/src/content/reading-paths`)).toEqual(realPathNames);
  });
});

describe("Playwright fixture site copy", () => {
  const siteRoot = `${root}.cache/fixture-site-copy-test`;
  beforeAll(() => {
    mkdirSync(`${root}.cache`, { recursive: true });
    prepareFixtureSite(siteRoot);
  });
  afterAll(() => rmSync(siteRoot, { recursive: true, force: true }));

  it("holds exactly the fixture reading-path files and none from the real folder", () => {
    const fixtureNames = yamlNames(`${root}tests/fixtures/reading-paths`);
    expect(fixtureNames.length).toBeGreaterThan(0);
    expect(yamlNames(`${siteRoot}/src/content/reading-paths`)).toEqual(fixtureNames);
  });

  it("holds exactly the fixture Now file", () => {
    expect(readdirSync(`${siteRoot}/src/content/now`)).toEqual(["now.mdx"]);
    expect(readFileSync(`${siteRoot}/src/content/now/now.mdx`, "utf-8")).toBe(readFileSync(`${root}tests/fixtures/now/now.mdx`, "utf-8"));
  });
});
