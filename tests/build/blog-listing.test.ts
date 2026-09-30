// Listing pages in a real build (specs/008-blog/tasks.md T056; FR-012 to FR-015,
// FR-030, FR-048; contracts/blog-pages.md "Addresses"). A production-mode build
// leaves the sample drafts out, so the only posts are the 14 written here: 14 on
// `agentic-ai` (two listing pages) and two of them also on `technology-teams`.
// Two posts share a date, to check the order of a tie (title, then slug).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let site: FixtureSiteResult;

const COUNT = 14;
const post = (n: number, extra: { date?: string; title?: string; topics?: string[] } = {}) => {
  const number = String(n).padStart(2, "0");
  const day = String(30 - n).padStart(2, "0");
  const topics = extra.topics ?? ["agentic-ai"];
  return [
    "---",
    `title: ${extra.title ?? `Listing post ${number}`}`,
    `summary: Listing post ${number} for the listing tests.`,
    `date: ${extra.date ?? `2026-06-${day}`}`,
    "topics:",
    ...topics.map((t) => `  - ${t}`),
    "---",
    "",
    `Body of listing post ${number}.`,
    "",
  ].join("\n");
};

beforeAll(async () => {
  const overrides: Record<string, string> = {};
  for (let n = 1; n <= COUNT; n += 1) {
    const topics = n <= 2 ? ["agentic-ai", "technology-teams"] : ["agentic-ai"];
    overrides[`src/content/posts/listing-post-${String(n).padStart(2, "0")}.mdx`] = post(n, { topics });
  }
  // Same date as post 01 (2026-06-29); the title decides, ignoring case: "a tied post" sorts before "Listing post 01".
  overrides["src/content/posts/tie-b.mdx"] = post(15, { date: "2026-06-29", title: "a tied post" });
  site = await buildFixtureSite([], {
    overrides,
    env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
  });
}, 900_000);

afterAll(() => site?.cleanup());

const TOTAL = COUNT + 1;
const exists = (path: string) => existsSync(join(site.dist, path));
const hrefs = (html: string) =>
  [...html.matchAll(/<h2[^>]*>\s*<a [^>]*href="(\/writing\/[a-z0-9-]+\/)"/g)].map((m) => m[1]);

describe("the listing pages of a site with more than 12 posts", () => {
  it("builds", () => {
    expect(site.message).toBe("");
  });

  it("puts 12 posts on page 1 and the rest on page 2", () => {
    expect(hrefs(site.read("writing/all/index.html"))).toHaveLength(12);
    expect(hrefs(site.read("writing/all/2/index.html"))).toHaveLength(TOTAL - 12);
  });

  it("builds no /writing/all/1/ and no page past the last", () => {
    expect(exists("writing/all/1/index.html")).toBe(false);
    expect(exists("writing/all/3/index.html")).toBe(false);
    expect(exists("writing/topics/agentic-ai/1/index.html")).toBe(false);
    expect(exists("writing/topics/agentic-ai/3/index.html")).toBe(false);
  });

  it("builds no page for an unknown topic", () => {
    expect(exists("writing/topics/not-a-topic/index.html")).toBe(false);
  });

  it("orders posts by date, then title ignoring case, across pages", () => {
    const all = [...hrefs(site.read("writing/all/index.html")), ...hrefs(site.read("writing/all/2/index.html"))];
    expect(all.slice(0, 3)).toEqual(["/writing/tie-b/", "/writing/listing-post-01/", "/writing/listing-post-02/"]);
    expect(all.at(-1)).toBe("/writing/listing-post-14/");
  });

  it("gives page 1 its bare address, title and canonical, with no page number", () => {
    const html = site.read("writing/all/index.html");
    expect(html).toMatch(/<title>All posts · /);
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/writing\/all\/"/);
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*All posts\s*<\/h1>/);
    expect(html).toContain('aria-label="Topics"');
    expect(html).toContain('aria-label="Pages"');
  });

  it("gives page 2 its own canonical, a title and description with the page number", () => {
    const html = site.read("writing/all/2/index.html");
    expect(html).toMatch(/<title>All posts, page 2 · /);
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/writing\/all\/2\/"/);
    expect(html).toMatch(/<meta[^>]+name="description"[^>]+content="[^"]*page 2/);
    expect(html).toMatch(/<h1[^>]*>\s*All posts, page 2\s*<\/h1>/);
  });

  it("advertises the feed and keeps Writing current in the header", () => {
    const html = site.read("writing/all/2/index.html");
    expect(html).toMatch(/<link[^>]+rel="alternate"[^>]+type="application\/rss\+xml"/);
    expect(html).toMatch(/href="\/writing\/"[^>]*aria-current="true"|aria-current="true"[^>]*href="\/writing\/"/);
  });
});

describe("topic pages", () => {
  it("holds only that topic's posts, paged, with a banner and no pill row", () => {
    const first = site.read("writing/topics/agentic-ai/index.html");
    expect(hrefs(first)).toHaveLength(12);
    expect(hrefs(site.read("writing/topics/agentic-ai/2/index.html"))).toHaveLength(TOTAL - 12);
    expect(first).toContain("data-topic-banner");
    expect(first).not.toContain('aria-label="Topics"><ul');
    expect(first.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(first).toMatch(/<h1[^>]*>\s*Agentic AI in legacy environments\s*<\/h1>/);
  });

  it("lists only the posts that carry the topic", () => {
    const html = site.read("writing/topics/technology-teams/index.html");
    expect(hrefs(html).sort()).toEqual(["/writing/listing-post-01/", "/writing/listing-post-02/"]);
    expect(exists("writing/topics/technology-teams/2/index.html")).toBe(false);
    expect(html).not.toContain('aria-label="Pages"');
  });

  it("gives a page 2 its own canonical and a title with the page number", () => {
    const html = site.read("writing/topics/agentic-ai/2/index.html");
    expect(html).toMatch(/<title>Agentic AI in legacy environments, page 2 · /);
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/writing\/topics\/agentic-ai\/2\/"/);
    expect(html).toMatch(/<meta[^>]+name="description"[^>]+content="[^"]*page 2/);
  });

  it("builds an empty topic page with its message and a link to all posts", () => {
    const html = site.read("writing/topics/compliant-data/index.html");
    expect(html).toContain("There are no posts on this topic yet.");
    expect(html).toContain('href="/writing/all/"');
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(exists("writing/topics/compliant-data/2/index.html")).toBe(false);
  });
});
