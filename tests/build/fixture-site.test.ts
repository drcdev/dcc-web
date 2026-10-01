// Smoke test for the fixture-site harness (tests/build/fixture-site.ts): it
// builds a copy of the site, runs the content layer against fixture pages, and
// reports failures as text. Fails until the content layer exists.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("fixture-site harness", () => {
  it("syncs a valid page file into a temporary site", async () => {
    result = await buildFixtureSite(["workshops.mdx"], { mode: "sync" });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
    expect(existsSync(`${result.root}/src/content/pages/workshops.mdx`)).toBe(true);
  });

  it("reports a broken page file as a failure that names the file and the problem", async () => {
    result = await buildFixtureSite(["broken/01-no-title.mdx"], { mode: "sync" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("01-no-title");
    expect(result.message).toContain("title");
  });

  it("places a file at the `to` path", async () => {
    result = await buildFixtureSite([{ from: "workshops.mdx", to: "legal/index.mdx" }], { mode: "sync" });
    expect(existsSync(`${result.root}/src/content/pages/legal/index.mdx`)).toBe(true);
    expect(result.ok).toBe(true);
  });

  it("syncs valid project fixtures with their images into the projects collection", async () => {
    result = await buildFixtureSite([], { mode: "sync", projects: ["minimal.mdx", "every-setting.mdx", "draft.mdx"] });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
    expect(existsSync(`${result.root}/src/content/projects/minimal.mdx`)).toBe(true);
    expect(existsSync(`${result.root}/src/content/projects/images/sample.png`)).toBe(true);
  });

  it("reports a project file with a missing setting by file and setting", async () => {
    result = await buildFixtureSite([], {
      mode: "sync",
      projects: [{ from: "minimal.mdx", to: "no-status.mdx", replace: ["status: shipped\n", ""] }],
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("no-status");
    expect(result.message).toContain("status");
  });

  it("removes the temporary site on cleanup", async () => {
    result = await buildFixtureSite(["workshops.mdx"], { mode: "sync" });
    const { root } = result;
    result.cleanup();
    expect(existsSync(root)).toBe(false);
  });
});

describe("fixture-site harness, post fixtures (T025)", () => {
  it("copies post files and their images from tests/fixtures/posts/ into src/content/posts/", async () => {
    result = await buildFixtureSite([], { mode: "sync", posts: ["valid/minimal.mdx"] });
    expect(result.message).toBe("");
    expect(result.ok).toBe(true);
    expect(existsSync(`${result.root}/src/content/posts/minimal.mdx`)).toBe(true);
    expect(existsSync(`${result.root}/src/content/posts/images/sample.png`)).toBe(true);
  });

  it("leaves the repository's real posts out by default and keeps the sample post", async () => {
    result = await buildFixtureSite([], { mode: "sync" });
    expect(result.message).toBe("");
    const posts = readdirSync(`${result.root}/src/content/posts`).filter((name) => /\.mdx?$/.test(name));
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.filter((name) => !name.startsWith("sample-"))).toEqual([]);
  });

  it("keeps the repository's real posts with `realPosts`", async () => {
    result = await buildFixtureSite([], { mode: "sync", realPosts: true });
    expect(result.message).toBe("");
    const real = readdirSync(`${root}src/content/posts`).filter((name) => /\.mdx?$/.test(name) && !name.startsWith("sample-"));
    expect(real.length).toBeGreaterThan(0);
    for (const name of real) expect(existsSync(`${result.root}/src/content/posts/${name}`), name).toBe(true);
  });

  it("places a post file at the `to` name", async () => {
    result = await buildFixtureSite([], {
      mode: "sync",
      posts: [{ from: "valid/minimal.mdx", to: "renamed-post.mdx" }],
    });
    expect(existsSync(`${result.root}/src/content/posts/renamed-post.mdx`)).toBe(true);
    expect(existsSync(`${result.root}/src/content/posts/minimal.mdx`)).toBe(false);
    expect(result.ok).toBe(true);
  });

  it("replaces text in a copied post file, to test an edit", async () => {
    result = await buildFixtureSite([], {
      mode: "sync",
      posts: [{ from: "valid/minimal.mdx", replace: ["featured: false", "featured: true"] }],
    });
    const text = readFileSync(`${result.root}/src/content/posts/minimal.mdx`, "utf-8");
    expect(text).toContain("featured: true");
    expect(text).not.toContain("featured: false");
  });

  it("reports a broken post file as a failure that names the file and the problem", async () => {
    result = await buildFixtureSite([], { mode: "sync", posts: ["broken/p01-no-title.mdx"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("p01-no-title");
    expect(result.message).toContain("title");
  });

  it("sets environment variables for the build (WORKERS_CI)", async () => {
    // The site address depends on WORKERS_CI and the branch (main serves doncoleman.ca), so the built sitemap shows the variables arrived.
    result = await buildFixtureSite(["workshops.mdx"], {
      env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
    });
    expect(result.message).toBe("");
    expect(result.read("sitemap-0.xml")).toContain("https://doncoleman.ca/");
  });
});
