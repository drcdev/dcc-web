// The generated posts of the fixture site (tasks T026, T091): 13 or more valid
// posts, each with a small generated feature image, so the pagination end-to-end
// tests and the full-listing page-weight measurement (spec FR-041) have a second
// page to look at. `generateFixturePosts()` is pure; the script writes its result.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { postSchema } from "../../../src/content/schemas/post.ts";
import { assertPostDates } from "../../../src/lib/content/post-dates.ts";
import { assertPostFiles } from "../../../src/lib/content/post-address.ts";
import { generateFixturePosts } from "../../../scripts/build-fixture-site.ts";

const fromAstro = createRequire(createRequire(import.meta.url).resolve("astro/package.json"));
const { parseFrontmatter } = (await import(
  pathToFileURL(fromAstro.resolve("@astrojs/internal-helpers/frontmatter")).href
)) as { parseFrontmatter: (code: string) => { frontmatter: Record<string, unknown> } };

const schema = postSchema({ image: () => z.string() });
const posts = generateFixturePosts(13);

describe("generateFixturePosts", () => {
  it("makes at least 13 posts, however few are asked for", () => {
    expect(posts.length).toBeGreaterThanOrEqual(13);
    expect(generateFixturePosts(2).length).toBeGreaterThanOrEqual(13);
    expect(generateFixturePosts(20)).toHaveLength(20);
  });

  it("makes valid file names, unique slugs and no reserved slug", () => {
    const files = posts.map((p) => `${p.slug}.mdx`);
    expect(() => assertPostFiles(files)).not.toThrow();
    expect(new Set(files).size).toBe(files.length);
  });

  it("makes every post valid against the post settings, with an unquoted YYYY-MM-DD date and not a draft", () => {
    for (const post of posts) {
      expect(() => assertPostDates(`${post.slug}.mdx`, post.source), post.slug).not.toThrow();
      const { frontmatter } = parseFrontmatter(post.source);
      const result = schema.safeParse(frontmatter);
      expect(result.success, `${post.slug}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      expect(result.data?.draft).toBe(false);
    }
  });

  it("gives every post a distinct date", () => {
    const dates = posts.map((p) => String(parseFrontmatter(p.source).frontmatter.date));
    expect(new Set(dates).size).toBe(posts.length);
  });

  it("gives every post a small generated PNG feature image it references, with alt text", () => {
    const names = new Set<string>();
    for (const post of posts) {
      const { featureImage } = parseFrontmatter(post.source).frontmatter as { featureImage?: { src: string; alt: string } };
      expect(featureImage?.alt.trim()).toBeTruthy();
      expect(featureImage?.src).toBe(`./images/${post.image.name}`);
      expect(post.image.name.endsWith(".png")).toBe(true);
      names.add(post.image.name);
      expect([...post.image.data.slice(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(post.image.data.byteLength).toBeLessThan(8 * 1024);
    }
    expect(names.size).toBe(posts.length);
  });

  it("gives at least 13 posts one shared topic, so that topic has a page 2", () => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      const topics = (parseFrontmatter(post.source).frontmatter.topics ?? []) as string[];
      for (const topic of topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
    expect(Math.max(...counts.values())).toBeGreaterThanOrEqual(13);
  });

  it("gives exactly one post a free-form topic, so the fixture site has a free-form topic page", () => {
    const named = posts.filter((post) =>
      ((parseFrontmatter(post.source).frontmatter.topics ?? []) as string[]).includes("cloud-cost"),
    );
    expect(named).toHaveLength(1);
  });

  it("gives every post a body with text, so reading time and the post page have content", () => {
    for (const post of posts) {
      const body = post.source.split(/^---$/m).at(-1) ?? "";
      expect(body.trim().length, post.slug).toBeGreaterThan(40);
    }
  });
});
