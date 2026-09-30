// The sample post (contracts/post-file.md "Sample posts"; FR-035, SC-006).
// One `sample-*.mdx` file, the kitchen-sink sample-everything, stays in the
// repository as a draft so the end-to-end and visual tests have every kind of
// content to check. The cases the removed samples covered (a post with no
// feature image, a very long title) are fixture posts in tests/fixtures/posts/valid/,
// which scripts/build-fixture-site.ts adds to the fixture site. Reads the files
// directly, so a missing case fails here before any build.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { topicIds } from "../../../src/config/topics.ts";

const dir = fileURLToPath(new URL("../../../src/content/posts/", import.meta.url));
const fixtureDir = fileURLToPath(new URL("../../fixtures/posts/valid/", import.meta.url));

interface Sample {
  name: string;
  front: string;
  body: string;
  title: string;
  summary: string;
}

function load(from: string, pattern: RegExp): Sample[] {
  if (!existsSync(from)) return [];
  return readdirSync(from)
    .filter((name) => pattern.test(name))
    .sort()
    .map((name) => {
      const source = readFileSync(`${from}${name}`, "utf-8");
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
      expect(match, `${name} has front matter`).not.toBeNull();
      const front = match![1]!;
      const field = (key: string) => new RegExp(`^${key}: *(.*)$`, "m").exec(front)?.[1] ?? "";
      return { name, front, body: match![2]!, title: field("title").replace(/^["']|["']$/g, ""), summary: field("summary") };
    });
}

const samples = load(dir, /^sample-.*\.mdx$/);
const fixture = (name: string) => load(fixtureDir, new RegExp(`^${name}$`))[0];
const all = (pick: (s: Sample) => string) => samples.map(pick).join("\n");

describe("sample posts", () => {
  it("has exactly one sample-*.mdx file, sample-everything.mdx", () => {
    expect(samples.map((s) => s.name)).toEqual(["sample-everything.mdx"]);
  });

  it.each(samples.map((s) => [s.name, s] as const))("%s is a draft with a Sample: title and a sample summary", (_name, s) => {
    expect(s.front).toMatch(/^draft: true$/m);
    expect(s.title.startsWith("Sample:")).toBe(true);
    expect(s.summary.toLowerCase()).toContain("sample post used to check the blog's pages");
  });

  it("covers a captioned image, a wide image and a full-width image", () => {
    const body = all((s) => s.body);
    expect(body).toMatch(/<Figure caption="[^"]+">/);
    expect(body).toMatch(/<WideImage[\s>]/);
    expect(body).toMatch(/<FullImage[\s>]/);
  });

  it("covers code with a caption, code without a caption and code without a language", () => {
    const body = all((s) => s.body);
    expect(body).toMatch(/^```[a-z]+ caption="[^"]+"$/m);
    expect(body).toMatch(/^```[a-z]+$/m);
    expect(body).toMatch(/^```$/m);
  });

  it("includes a very long code line for the 320 px checks", () => {
    const longest = Math.max(...all((s) => s.body).split("\n").map((line) => line.length));
    expect(longest).toBeGreaterThanOrEqual(120);
  });

  it("covers a wide table (eight or more columns)", () => {
    const header = all((s) => s.body)
      .split("\n")
      .find((line) => /^\|.*\|\s*$/.test(line) && line.split("|").length - 2 >= 8);
    expect(header, "a table row with eight or more cells").toBeDefined();
  });

  it("covers every body heading level from ## to ######", () => {
    const body = all((s) => s.body);
    for (const hashes of ["##", "###", "####", "#####", "######"]) {
      expect(body, hashes).toMatch(new RegExp(`^${hashes} \\S`, "m"));
    }
  });

  it("is featured, has a feature image and has an update date", () => {
    const [sample] = samples;
    expect(sample!.front).toMatch(/^featured: true$/m);
    expect(sample!.front).toMatch(/^featureImage:/m);
    expect(sample!.front).toMatch(/^updated: \d{4}-\d{2}-\d{2}$/m);
  });

  // With the sample post, the real posts use every topic, so each topic page lists a post.
  it("uses all four topics together with the real posts", () => {
    const posts = load(dir, /\.mdx$/);
    const used = new Set(
      posts.flatMap((s) => [
        ...[...s.front.matchAll(/^ {2}- ([a-z0-9-]+)$/gm)].map((m) => m[1]!),
        ...(/^topics: \[(.*)\]$/m.exec(s.front)?.[1]?.split(",").map((id) => id.trim()) ?? []),
      ]),
    );
    for (const id of topicIds) expect(used, id).toContain(id);
  });

  // Only the sample post's pictures (sample-*): the real posts' photos are sized by the build.
  it("keeps every sample image small, for the performance budget", () => {
    const images = `${dir}images/`;
    if (!existsSync(images)) return;
    const names = readdirSync(images).filter((name) => /^sample-/.test(name));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(statSync(`${images}${name}`).size, name).toBeLessThan(60 * 1024);
    }
  });
});

// The fixture posts that stand in for the removed samples on the fixture site
// (scripts/build-fixture-site.ts FIXTURE_POSTS; tests/e2e/blog-fixtures.spec.ts).
describe("fixture posts for the fixture site", () => {
  it("has a post with a very long title containing a long unbroken word", () => {
    const long = fixture("long-title\\.mdx");
    expect(long, "tests/fixtures/posts/valid/long-title.mdx").toBeDefined();
    expect(long!.title.length).toBeGreaterThanOrEqual(100);
    expect(long!.title.split(/\s+/).some((word) => word.length >= 40)).toBe(true);
  });

  it("has a post with no feature image", () => {
    const textOnly = fixture("text-only\\.mdx");
    expect(textOnly, "tests/fixtures/posts/valid/text-only.mdx").toBeDefined();
    expect(textOnly!.front).not.toMatch(/^featureImage:/m);
  });
});
