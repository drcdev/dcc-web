// The sample posts (contracts/post-file.md "Sample posts"; FR-035, SC-006).
// Three or four `sample-*.mdx` files stay in the repository as drafts so the
// end-to-end and visual tests have every kind of content to check. Reads the
// files directly, so a missing case fails here before any build.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { topicIds } from "../../../src/config/topics.ts";

const dir = fileURLToPath(new URL("../../../src/content/posts/", import.meta.url));

interface Sample {
  name: string;
  front: string;
  body: string;
  title: string;
  summary: string;
}

function load(): Sample[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => /^sample-.*\.mdx$/.test(name))
    .sort()
    .map((name) => {
      const source = readFileSync(`${dir}${name}`, "utf-8");
      const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
      expect(match, `${name} has front matter`).not.toBeNull();
      const front = match![1]!;
      const field = (key: string) => new RegExp(`^${key}: *(.*)$`, "m").exec(front)?.[1] ?? "";
      return { name, front, body: match![2]!, title: field("title").replace(/^["']|["']$/g, ""), summary: field("summary") };
    });
}

const samples = load();
const all = (pick: (s: Sample) => string) => samples.map(pick).join("\n");

describe("sample posts", () => {
  it("has three or four sample-*.mdx files", () => {
    expect(samples.length).toBeGreaterThanOrEqual(3);
    expect(samples.length).toBeLessThanOrEqual(4);
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

  it("has a very long title containing a long unbroken word", () => {
    const long = samples.find((s) => s.title.length >= 100 && s.title.split(/\s+/).some((word) => word.length >= 40));
    expect(long, "a title of 100+ characters with a 40+ character word").toBeDefined();
  });

  it("has a featured post, a post with no feature image and an updated post", () => {
    expect(samples.some((s) => /^featured: true$/m.test(s.front))).toBe(true);
    expect(samples.some((s) => !/^featureImage:/m.test(s.front))).toBe(true);
    expect(samples.some((s) => /^updated: \d{4}-\d{2}-\d{2}$/m.test(s.front))).toBe(true);
  });

  it("uses all four topics", () => {
    const used = new Set(samples.flatMap((s) => [...s.front.matchAll(/^ {2}- ([a-z0-9-]+)$/gm)].map((m) => m[1]!)));
    for (const id of topicIds) expect(used, id).toContain(id);
  });

  // Only the sample posts' pictures (sample-*): the real posts' photos are sized by the build.
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
