// The shared content helper (tests/helpers/content.ts) reads src/content/** for the tests, so no
// test needs to name a real post or project. Unit layer: it reads files and builds nothing. Each
// assertion compares the helper with the files themselves, never with today's slugs.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { seriesIds, topicHref, topics } from "../../../src/config/topics.ts";
import {
  inBuild,
  isSample,
  pages,
  pickedStory,
  posts,
  projects,
  readEntries,
  realPosts,
  seriesPost,
  sitemapPaths,
} from "../../helpers/content.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));

/** Every `.mdx` file path (below the collection folder) that is content: not `_*`, not under `images/`. */
function filesIn(dir: string, prefix = ""): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((item) => {
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.isDirectory()) return item.name === "images" ? [] : filesIn(dir, path);
    return item.name.endsWith(".mdx") && !item.name.startsWith("_") ? [path] : [];
  });
}

const collections = { pages, posts, projects } as const;

describe.each(Object.entries(collections))("the %s entries", (name, entries) => {
  const dir = join(root, "src/content", name);
  const files = filesIn(dir).map((file) => `src/content/${name}/${file}`);

  it("holds every content file exactly once", () => {
    expect(entries.map((entry) => entry.file).sort()).toEqual([...files].sort());
    expect(new Set(entries.map((entry) => entry.address)).size).toBe(entries.length);
  });

  it("takes each draft flag from the file's draft line", () => {
    for (const entry of entries) {
      const source = readFileSync(join(root, entry.file), "utf-8");
      const line = /^draft:\s*(true|false)\s*$/m.exec(source)?.[1];
      expect(entry.draft, entry.file).toBe(line === "true");
      expect(entry.title, entry.file).toBeTruthy();
      expect(entry.body.length, entry.file).toBeGreaterThan(0);
    }
  });
});

describe("addresses", () => {
  it("puts posts under /writing/ and projects under /projects/", () => {
    for (const post of posts) expect(post.address).toBe(`/writing/${post.slug}/`);
    for (const project of projects) expect(project.address).toBe(`/projects/${project.slug}/`);
  });

  it("gives a page its own address, and a nested page its folder", () => {
    for (const page of pages) {
      const path = page.file.replace("src/content/pages/", "").replace(/\.mdx$/, "").replace(/\/?index$/, "");
      expect(page.address).toBe(path === "" ? "/" : `/${path}/`);
    }
    expect(pages.some((page) => page.address.startsWith("/privacy/"))).toBe(true);
  });
});

describe("build modes", () => {
  it("leaves out exactly the draft posts and projects of a production build, and keeps every page", () => {
    for (const entries of [posts, projects]) {
      expect(inBuild(entries, { production: true })).toEqual(entries.filter((entry) => !entry.draft));
      expect(inBuild(entries, { production: false })).toEqual(entries);
    }
    expect(inBuild(pages, { production: true })).toEqual(pages);
    expect(inBuild(pages, { production: false })).toEqual(pages);
  });
});

describe("the sample post", () => {
  it("matches only sample-* posts", () => {
    for (const post of posts) expect(isSample(post), post.slug).toBe(post.slug.startsWith("sample-"));
    expect(realPosts).toEqual(posts.filter((post) => !isSample(post)));
  });
});

describe("sitemapPaths", () => {
  it("lists the pages, the listings, every topic page and each visible post and project", () => {
    for (const production of [true, false]) {
      const paths = sitemapPaths({ production });
      expect(new Set(paths).size).toBe(paths.length);
      for (const page of pages) expect(paths).toContain(page.address);
      for (const listing of ["/writing/", "/writing/all/", "/projects/"]) expect(paths).toContain(listing);
      for (const topic of topics) expect(paths).toContain(topicHref(topic.id));
      for (const entry of [...inBuild(posts, { production }), ...inBuild(projects, { production })]) {
        expect(paths).toContain(entry.address);
      }
      for (const entry of [...posts, ...projects].filter((item) => item.draft && production)) {
        expect(paths).not.toContain(entry.address);
      }
    }
  });
});

describe("readEntries", () => {
  it("reads the fixture projects and skips the broken folder and images", () => {
    const fixtures = readEntries("projects", "tests/fixtures/projects");
    const names = readdirSync(join(root, "tests/fixtures/projects")).filter((name) => name.endsWith(".mdx"));
    expect(fixtures.map((entry) => entry.slug).sort()).toEqual(names.map((name) => name.replace(".mdx", "")).sort());
    expect(fixtures.length).toBeGreaterThan(0);
    expect(fixtures.every((entry) => !entry.file.includes("/broken/"))).toBe(true);
    for (const entry of fixtures) expect(existsSync(join(root, entry.file))).toBe(true);
  });
});

describe("picked entries", () => {
  it("picks a story that has a build link", () => {
    const data = pickedStory.data as { source?: unknown; demo?: unknown; standIn?: unknown };
    expect(pickedStory.collection).toBe("projects");
    expect(Boolean(data.source ?? data.demo ?? data.standIn)).toBe(true);
  });

  it("picks the newest real post that is in a series", () => {
    const tagged = realPosts.filter((post) => (post.data.topics as string[]).some((id) => seriesIds.includes(id as never)));
    expect(seriesPost.collection).toBe("posts");
    expect(tagged).toContain(seriesPost);
    const newest = Math.max(...tagged.map((post) => (post.data.date as Date).getTime()));
    expect((seriesPost.data.date as Date).getTime()).toBe(newest);
  });
});
