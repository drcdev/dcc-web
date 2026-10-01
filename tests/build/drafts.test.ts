// SC-004 and FR-032, FR-045, FR-046, US7 and FR-073: drafts are built and labelled on every build
// except a Workers Builds build of `main` (or one with no branch variable), and are always
// noindex. Two builds share every case: production (Workers Builds, main) and preview (another
// branch), each with a draft and a published post and a draft and a published project. The sample
// post in src/content/posts/ is a draft, so a site with only draft posts has nothing to show in
// production. The "no branch variable" case (FR-046) has no build of its own: the unit tests in
// tests/unit/site/build-mode.test.ts and tests/unit/content/build-mode.test.ts cover the rule,
// the production build here runs the same includeDrafts call, and
// tests/unit/site/astro-config.test.ts checks the one build-only factor (astro:env hands over
// `undefined` for a missing branch). A broken draft failing the build is asserted in
// project-validation.test.ts. The draft project uses its own image, poster and clip, so their
// absence from dist/ proves draft-only assets are dropped. The local or test build (no
// environment) runs in local-site.test.ts.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { topicHref, topics } from "../../src/config/topics.ts";
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

// A throwaway route written into the copied site prints what getPostSummaries() returns
// (tasks T017, T020; research R3, R6).
const summariesRoute = `import { getPostSummaries } from "../lib/posts.ts";
export async function GET() {
  const posts = await getPostSummaries();
  return new Response(JSON.stringify(posts.map((p) => ({ slug: p.slug, draft: p.draft, minutesRead: p.minutesRead, href: p.href }))));
}
`;
const overrides = { "src/pages/summaries.json.ts": summariesRoute };
type Summary = { slug: string; draft: boolean; minutesRead: number; href: string };

const builds: Record<string, FixtureSiteResult> = {};

beforeAll(async () => {
  // One after the other: parallel builds starve each other when the whole build suite runs at once.
  // Workers Builds sets WORKERS_CI; the harness supplies the Turnstile test key the build then requires.
  builds.production = await buildFixtureSite([], {
    posts: ["valid/draft.mdx"],
    projects,
    overrides,
    env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
  });
  builds.preview = await buildFixtureSite([], {
    posts: ["valid/published.mdx", "valid/draft.mdx"],
    projects,
    overrides,
    env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "some-branch" },
  });
}, 900_000);

afterAll(() => {
  for (const build of Object.values(builds)) build.cleanup();
});

const robots = (html: string) => /<meta[^>]+name="robots"[^>]*>/.exec(html)?.[0] ?? "";
const written = (build: FixtureSiteResult, path: string) => (existsSync(join(build.dist, path)) ? build.read(path) : "");
const summaries = (build: FixtureSiteResult) => JSON.parse(build.read("summaries.json")) as Summary[];
const items = (xml: string) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]!);

function filesUnder(dir: string, into: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) filesUnder(path, into);
    else into.push(path);
  }
  return into;
}
const builtNames = (build: FixtureSiteResult) => filesUnder(build.dist).map((path) => path.slice(build.dist.length));

describe("a production build (Workers Builds, main)", () => {
  const build = () => builds.production!;

  it("builds", () => {
    expect(build().message).toBe("");
  });

  it("has no draft page under writing/", () => {
    const dirs = readdirSync(join(build().dist, "writing"));
    expect(dirs.filter((name) => name === "draft" || name.startsWith("sample-"))).toEqual([]);
  });

  it("mentions no draft in the landing page, sitemap, feed or home page", () => {
    const sitemap = build().read("sitemap-0.xml");
    expect(sitemap).not.toMatch(/\/writing\/(draft|sample-[a-z-]+)\//);
    for (const path of ["writing/index.html", "index.html", "writing/rss.xml"]) {
      const text = written(build(), path);
      expect(text, path).not.toMatch(/\/writing\/(draft|sample-[a-z-]+)\//);
      expect(text, path).not.toContain("A draft post");
    }
  });

  it("leaves the Recent writing section off the home page (US7 AC2, FR-038)", () => {
    const html = build().read("index.html");
    expect(html).not.toContain("data-recent-writing");
    expect(html).not.toContain("Recent writing");
  });

  it("keeps the listing pages in the sitemap although no post is visible (FR-042)", () => {
    const sitemap = build().read("sitemap-0.xml");
    expect(sitemap).toContain("/writing/</loc>");
    expect(sitemap).toContain("/writing/all/</loc>");
    for (const topic of topics) expect(sitemap).toContain(`${topicHref(topic.id)}</loc>`);
    expect(sitemap).not.toContain("/writing/topics/drift/");
    expect(sitemap).not.toContain("/writing/topics/convergence/");
  });

  it("adds no listing pages because of drafts (FR-012)", () => {
    expect(existsSync(join(build().dist, "writing/all/2/index.html"))).toBe(false);
  });

  it("shows the empty landing page with its title, h1, landmarks and topic pill row (FR-014)", () => {
    const html = build().read("writing/index.html");
    expect(html).toContain("There are no posts yet.");
    expect(html).toContain("<title>Writing");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<main");
    expect(html).toContain('aria-label="Topics"');
    expect(html).toContain('href="/writing/all/"');
  });

  it("shows the empty all posts page with the topic pill row (Phase 6)", () => {
    const html = build().read("writing/all/index.html");
    expect(html).toContain("There are no posts yet.");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<main");
    expect(html).toContain('aria-label="Topics"');
  });

  it("shows each empty topic page with its own message, title and h1 (Phase 6)", () => {
    const html = build().read("writing/topics/agentic-ai/index.html");
    expect(html).toContain("There are no posts on this topic yet.");
    expect(html).toContain("Agentic AI in legacy environments");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toContain("<main");
  });
  // Moved from the project drafts test.
  it("leaves the draft project out of the index, the routes and the sitemap", () => {
    const pages = [...build().htmlFiles().keys()];
    expect(pages).toContain("projects/minimal/index.html");
    expect(pages).not.toContain("projects/draft/index.html");
    const index = build().read("projects/index.html");
    expect(index).toContain("Minimal project");
    expect(index).not.toContain("Draft project");
    expect(index).not.toContain("/projects/draft/");
    const sitemap = build().read("sitemap-0.xml");
    expect(sitemap).toContain("/projects/minimal/");
    expect(sitemap).not.toContain("/projects/draft/");
  });

  it("keeps the draft project's title and files out of every built file", () => {
    for (const [path, html] of build().htmlFiles()) {
      expect(html, path).not.toContain("Draft project");
    }
    expect(builtNames(build()).filter((name) => name.includes("draft-only"))).toEqual([]);
  });

  it("marks no project as a draft", () => {
    expect(build().read("projects/minimal/index.html")).not.toContain("data-draft-notice");
  });

  // Moved from the fixture-site harness test: the build got WORKERS_CI and the main branch.
  it("sets the site address from WORKERS_CI and the branch, so main serves doncoleman.ca", () => {
    expect(build().read("sitemap-0.xml")).toContain("https://doncoleman.ca/");
  });

  // Moved from the post summaries test; the "no branch variable" case is the unit tests' (FR-046).
  it("leaves every draft out of getPostSummaries although a draft post is in the input", () => {
    expect(summaries(build())).toEqual([]);
  });

  it("is a valid empty feed channel (the blog listing test covers a feed with posts)", () => {
    const xml = build().read("writing/rss.xml");
    expect(items(xml)).toHaveLength(0);
    expect(xml).toMatch(/<channel>[\s\S]*<\/channel><\/rss>$/);
  });
});

describe("a preview build (Workers Builds, another branch)", () => {
  const build = () => builds.preview!;

  it("builds the draft page with a Draft notice and a noindex robots tag", () => {
    expect(build().message).toBe("");
    const html = build().read("writing/draft/index.html");
    expect(html).toMatch(/data-draft-notice[^>]*>\s*<strong>Draft\.<\/strong>/);
    expect(robots(html)).toMatch(/^<meta name="robots" content="noindex"\s*\/?>$/);
  });

  it("does not show a notice on a published post", () => {
    expect(build().read("writing/published/index.html")).not.toContain("data-draft-notice");
  });

  it("lists the draft with a Draft label on the landing page and in the sitemap", () => {
    expect(build().read("writing/index.html")).toMatch(/data-draft-label[^>]*>\s*Draft\s*</);
    expect(build().read("sitemap-0.xml")).toContain("/writing/draft/");
  });

  it("keeps drafts out of the feed on every build (Phase 8) and holds the published post", () => {
    const xml = build().read("writing/rss.xml");
    expect(xml).toContain("/writing/published/");
    expect(xml).not.toContain("/writing/draft/");
    expect(xml).not.toMatch(/\/writing\/sample-/);
    expect(build().read("writing/index.html")).toContain("Draft");
  });

  it("includes drafts in getPostSummaries", () => {
    const posts = summaries(build());
    expect(posts.some((p) => p.draft)).toBe(true);
    expect(posts.map((p) => p.slug)).toContain("draft");
  });

  // Moved from the project drafts test.
  it("lists and builds the draft project with a Draft mark", () => {
    const index = build().read("projects/index.html");
    expect(index).toContain("Draft project");
    expect(index).toMatch(/data-draft-mark[^>]*>Draft</);
    const story = build().read("projects/draft/index.html");
    expect(story).toContain("Draft project");
    expect(story).toContain("data-draft-notice");
    expect(build().read("sitemap-0.xml")).toContain("/projects/draft/");
  });

  it("emits the draft project's own image and clip, and leaves the published project unmarked", () => {
    const names = builtNames(build());
    expect(names.some((name) => name.includes("draft-only") && name.endsWith(".webm"))).toBe(true);
    expect(names.some((name) => name.includes("draft-only") && !name.endsWith(".webm"))).toBe(true);
    expect(build().read("projects/minimal/index.html")).not.toContain("data-draft-notice");
  });
});
