// Wiring runs for the Now rows of specs/040-home-now-start-here/contracts/build-errors.md. The rules
// are unit-tested (tests/unit/content/now-schema.test.ts, now-body.test.ts); these runs prove the real
// build runs them and renders the section. Each run holds one broken file, because a build stops at the
// first error. Fixtures live in tests/fixtures/now/ and tests/fixtures/reading-paths/broken/.
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

describe("Now wiring", () => {
  it("builds a valid Now entry and the home page holds the Now section", async () => {
    result = await buildFixtureSite([], { mode: "build", now: "now.mdx" });
    expect(result.ok, result.message).toBe(true);
    const home = result.read("index.html");
    expect(home).toContain("data-now");
    expect(home).toMatch(/Updated\s*<time datetime="2026-01-15"[^>]*>January 15, 2026<\/time>/);
  });

  it("N03: the build fails on a future-dated Now", async () => {
    result = await buildFixtureSite([], { mode: "build", now: "../reading-paths/broken/future-now/now.mdx" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("is in the future");
    expect(result.message).toContain("now.mdx");
  });

  it("N06: the build fails on a Now body with no contact link", async () => {
    result = await buildFixtureSite([], { mode: "build", now: "../reading-paths/broken/now-no-contact/now.mdx" });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("must link to");
  });

  it("N07: the build fails when there are two Now files", async () => {
    result = await buildFixtureSite([], {
      mode: "build",
      now: "now.mdx",
      write: { "src/content/now/now-extra.mdx": readFileSync(new URL("../fixtures/reading-paths/broken/two-now/now-extra.mdx", import.meta.url), "utf-8") },
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("there must be exactly one Now file, now.mdx.");
  });

  it("a now.md fails, naming the file and saying to rename it to .mdx", async () => {
    result = await buildFixtureSite([], {
      mode: "sync",
      now: false,
      write: { "src/content/now/now.md": readFileSync(new URL("../fixtures/now/now.mdx", import.meta.url), "utf-8") },
    });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("now.md");
    expect(result.message).toContain("rename it to .mdx");
  });

  it("N07: the build fails when there is no Now file", async () => {
    result = await buildFixtureSite([], { mode: "build", now: false });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("there must be exactly one Now file, now.mdx.");
  });
});

const POSTS = ["valid/minimal.mdx", "valid/draft.mdx"];
const PROJECTS = ["minimal.mdx", "draft.mdx"];
const base = { mode: "build", posts: POSTS, projects: PROJECTS, withoutRealProjects: true } as const;

describe("Start here wiring", () => {
  it("R04: the build fails on a path item that does not exist, naming the file and item", async () => {
    result = await buildFixtureSite([], { ...base, readingPaths: ["broken/missing-item/path.yaml"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("path.yaml");
    expect(result.message).toContain("item 1 (post: no-such-post) does not exist");
  });

  it("R09: the build fails on YAML that does not parse, naming the file", async () => {
    result = await buildFixtureSite([], { ...base, readingPaths: ["broken/bad-yaml/path.yaml"] });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("path.yaml");
  });

  it("shows paths in position order, items in file order, with reading times and the Project label", async () => {
    result = await buildFixtureSite([], {
      ...base,
      // The second path is copied first so file order is not position order.
      readingPaths: ["harness/second-position.yaml", "harness/draft-mixed.yaml"],
    });
    expect(result.ok, result.message).toBe(true);
    const home = result.read("index.html");
    const start = home.slice(home.indexOf("data-start-here"));
    expect(start.indexOf("Mixed path")).toBeGreaterThan(-1);
    expect(start.indexOf("Mixed path")).toBeLessThan(start.indexOf("Second path"));
    const second = start.slice(start.indexOf("Second path"));
    expect(second.indexOf("Minimal project")).toBeLessThan(second.indexOf("A test post"));
    expect(start).toMatch(/\d+ min read/);
    expect(start).toContain("Project");
    expect(home.indexOf("data-now")).toBeLessThan(home.indexOf("data-start-here"));
    expect(home.indexOf("data-start-here")).toBeLessThan(home.indexOf("data-recent-writing"));
  });

  it("a non-production build keeps draft items and a path of only drafts", async () => {
    result = await buildFixtureSite([], { ...base, readingPaths: ["harness/draft-mixed.yaml", "harness/draft-only.yaml"] });
    expect(result.ok, result.message).toBe(true);
    const home = result.read("index.html");
    expect(home).toContain("A draft post");
    expect(home).toContain("Draft project");
    expect(home).toContain("Draft only path");
  });

  it("the production build drops a draft item and a path left empty", async () => {
    result = await buildFixtureSite([], {
      ...base,
      readingPaths: ["harness/draft-mixed.yaml", "harness/draft-only.yaml"],
      env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
    });
    expect(result.ok, result.message).toBe(true);
    const home = result.read("index.html");
    expect(home).toContain("Mixed path");
    expect(home).toContain("A test post");
    expect(home).not.toContain("A draft post");
    expect(home).not.toContain("Draft project");
    expect(home).not.toContain("Draft only path");
  });

  it("with no reading paths the section is hidden: no heading and no empty section", async () => {
    result = await buildFixtureSite([], base);
    expect(result.ok, result.message).toBe(true);
    const home = result.read("index.html");
    expect(home).not.toContain("data-start-here");
    expect(home).not.toContain("Start here");
  });
});
