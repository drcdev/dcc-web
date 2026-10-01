// SC-004 and FR-032, FR-045, FR-046: drafts are built and labelled on every build
// except a Workers Builds build of `main` (or one with no branch variable), and
// are always noindex. The sample post in src/content/posts/ is a draft, so a
// site with only draft posts has nothing to show in production. The all posts and
// topic page cases turn green with Phase 6, the feed with Phase 8 and the home
// section with Phase 9.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { topicHref, topics } from "../../src/config/topics.ts";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

const posts = ["valid/published.mdx", "valid/draft.mdx"];
const builds: Record<string, FixtureSiteResult> = {};

beforeAll(async () => {
  // One after the other: parallel builds starve each other when the whole build suite runs at once.
  const production = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" };
  builds.production = await buildFixtureSite([], { posts: ["valid/draft.mdx"], env: production });
  builds.noBranch = await buildFixtureSite([], { posts: ["valid/draft.mdx"], env: { WORKERS_CI: "1" } });
  builds.preview = await buildFixtureSite([], { posts, env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "008-blog" } });
  builds.local = await buildFixtureSite([], { posts });
}, 900_000);

afterAll(() => {
  for (const build of Object.values(builds)) build.cleanup();
});

const robots = (html: string) => /<meta[^>]+name="robots"[^>]*>/.exec(html)?.[0] ?? "";
const written = (build: FixtureSiteResult, path: string) => (existsSync(join(build.dist, path)) ? build.read(path) : "");

describe.each([
  ["a production build (Workers Builds, main)", "production"],
  ["a Workers Builds build with no branch variable (FR-046)", "noBranch"],
] as const)("%s", (_label, key) => {
  it("builds", () => {
    expect(builds[key]!.message).toBe("");
  });

  it("has no draft page under writing/", () => {
    const build = builds[key]!;
    const dirs = readdirSync(join(build.dist, "writing"));
    expect(dirs.filter((name) => name === "draft" || name.startsWith("sample-"))).toEqual([]);
  });

  it("mentions no draft in the landing page, sitemap, feed or home page", () => {
    const build = builds[key]!;
    const sitemap = build.read("sitemap-0.xml");
    expect(sitemap).not.toMatch(/\/writing\/(draft|sample-[a-z-]+)\//);
    for (const path of ["writing/index.html", "index.html", "writing/rss.xml"]) {
      const text = written(build, path);
      expect(text, path).not.toMatch(/\/writing\/(draft|sample-[a-z-]+)\//);
      expect(text, path).not.toContain("A draft post");
    }
  });

  it("leaves the Recent writing section off the home page (US7 AC2, FR-038)", () => {
    const html = builds[key]!.read("index.html");
    expect(html).not.toContain("data-recent-writing");
    expect(html).not.toContain("Recent writing");
  });

  it("keeps the listing pages in the sitemap although no post is visible (FR-042)", () => {
    const sitemap = builds[key]!.read("sitemap-0.xml");
    expect(sitemap).toContain("/writing/</loc>");
    expect(sitemap).toContain("/writing/all/</loc>");
    for (const topic of topics) expect(sitemap).toContain(`${topicHref(topic.id)}</loc>`);
    expect(sitemap).not.toContain("/writing/topics/drift/");
    expect(sitemap).not.toContain("/writing/topics/convergence/");
  });

  it("adds no listing pages because of drafts (FR-012)", () => {
    expect(existsSync(join(builds[key]!.dist, "writing/all/2/index.html"))).toBe(false);
  });

  it("shows the empty landing page with its title, h1, landmarks and topic pill row (FR-014)", () => {
    const html = builds[key]!.read("writing/index.html");
    expect(html).toContain("There are no posts yet.");
    expect(html).toContain("<title>Writing");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<main");
    expect(html).toContain('aria-label="Topics"');
    expect(html).toContain('href="/writing/all/"');
  });

  it("shows the empty all posts page with the topic pill row (Phase 6)", () => {
    const html = builds[key]!.read("writing/all/index.html");
    expect(html).toContain("There are no posts yet.");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<main");
    expect(html).toContain('aria-label="Topics"');
  });

  it("shows each empty topic page with its own message, title and h1 (Phase 6)", () => {
    const html = builds[key]!.read("writing/topics/agentic-ai/index.html");
    expect(html).toContain("There are no posts on this topic yet.");
    expect(html).toContain("Agentic AI in legacy environments");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<main");
  });
});

describe.each([
  ["a preview build (Workers Builds, another branch)", "preview"],
  ["a local or test build (no environment)", "local"],
] as const)("%s", (_label, key) => {
  it("builds the draft page with a Draft notice and a noindex robots tag", () => {
    const build = builds[key]!;
    expect(build.message).toBe("");
    const html = build.read("writing/draft/index.html");
    expect(html).toMatch(/data-draft-notice[^>]*>\s*<strong>Draft\.<\/strong>/);
    expect(robots(html)).toMatch(/^<meta name="robots" content="noindex"\s*\/?>$/);
  });

  it("does not show a notice on a published post", () => {
    expect(builds[key]!.read("writing/published/index.html")).not.toContain("data-draft-notice");
  });

  it("lists the draft with a Draft label on the landing page and in the sitemap", () => {
    const build = builds[key]!;
    expect(build.read("writing/index.html")).toMatch(/data-draft-label[^>]*>\s*Draft\s*</);
    expect(build.read("sitemap-0.xml")).toContain("/writing/draft/");
  });

  it("keeps drafts out of the feed on every build (Phase 8)", () => {
    expect(builds[key]!.read("writing/rss.xml")).not.toContain("/writing/draft/");
  });
});
