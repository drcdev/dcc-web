// Listing pages in a real build (specs/008-blog/tasks.md T056; FR-012 to FR-015,
// FR-030, FR-048; contracts/blog-pages.md "Addresses"). A production-mode build
// leaves the sample drafts out, so the only posts are the 14 written here: 14 on
// `agentic-ai` (two listing pages) and two of them also on `technology-teams`.
// Two posts share a date, to check the order of a tie (title, then slug). A throwaway route
// prints getPostSummaries() so the production summaries are checked on the same build (tasks T017,
// T020; research R3, R6). The preview and no-branch builds run in drafts.test.ts.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let site: FixtureSiteResult;

const COUNT = 14;
const post = (n: number, extra: { date?: string; title?: string; topics?: string[]; updated?: string } = {}) => {
  const number = String(n).padStart(2, "0");
  const day = String(30 - n).padStart(2, "0");
  const topics = extra.topics ?? ["agentic-ai"];
  return [
    "---",
    `title: ${extra.title ?? `Listing post ${number}`}`,
    `summary: Listing post ${number} for the listing tests.`,
    `date: ${extra.date ?? `2026-06-${day}`}`,
    ...(extra.updated ? [`updated: ${extra.updated}`] : []),
    "topics:",
    ...topics.map((t) => `  - ${t}`),
    "---",
    "",
    `Body of listing post ${number}.`,
    "",
  ].join("\n");
};

const summariesRoute = `import { getPostSummaries } from "../lib/posts.ts";
export async function GET() {
  const posts = await getPostSummaries();
  return new Response(JSON.stringify(posts.map((p) => ({ slug: p.slug, draft: p.draft, minutesRead: p.minutesRead, href: p.href }))));
}
`;

beforeAll(async () => {
  const overrides: Record<string, string> = {};
  for (let n = 1; n <= COUNT; n += 1) {
    const topics = n <= 2 ? ["agentic-ai", "technology-teams", "drift"] : ["agentic-ai", "drift"];
    const updated = n === 3 ? "2026-07-15" : undefined;
    overrides[`src/content/posts/listing-post-${String(n).padStart(2, "0")}.mdx`] = post(n, { topics, updated });
  }
  // Same date as post 01 (2026-06-29); the title decides, ignoring case: "a tied post" sorts before "Listing post 01".
  overrides["src/content/posts/tie-b.mdx"] = post(15, { date: "2026-06-29", title: "a tied post", topics: ["agentic-ai", "drift"] });
  // A visible free-form topic, and a free-form topic only a draft names (no page in production).
  overrides["src/content/posts/free-form-post.mdx"] = post(16, { date: "2026-05-01", topics: ["cloud-cost"] });
  overrides["src/content/posts/free-form-draft.mdx"] = post(17, { date: "2026-05-02", topics: ["draft-only-topic"] }).replace("---\n\nBody", "draft: true\n---\n\nBody");
  overrides["src/pages/summaries.json.ts"] = summariesRoute;
  site = await buildFixtureSite([], {
    overrides,
    env: { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" },
  });
}, 900_000);

afterAll(() => {
  site?.cleanup();
});

/** Posts on agentic-ai and on drift (the 14 plus the tie post). */
const TOTAL = COUNT + 1;
/** Every visible post: those plus one with a free-form topic (the draft one is left out). */
const ALL_POSTS = TOTAL + 1;
const exists = (path: string) => existsSync(join(site.dist, path));
const hrefs = (html: string) =>
  [...html.matchAll(/<h2[^>]*>\s*<a [^>]*href="(\/writing\/[a-z0-9-]+\/)"/g)].map((m) => m[1]);

describe("the listing pages of a site with more than 12 posts", () => {
  it("builds", () => {
    expect(site.message).toBe("");
  });

  it("puts 12 posts on page 1 and the rest on page 2", () => {
    expect(hrefs(site.read("writing/all/index.html"))).toHaveLength(12);
    expect(hrefs(site.read("writing/all/2/index.html"))).toHaveLength(ALL_POSTS - 12);
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
    expect(all.at(-1)).toBe("/writing/free-form-post/");
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

describe("series pages (spec 013 US4; contracts/writing-pages.md)", () => {
  it("builds /writing/drift/ and pages at /writing/drift/{n}/ with the series' posts only", () => {
    const first = site.read("writing/drift/index.html");
    expect(hrefs(first)).toHaveLength(12);
    expect(hrefs(site.read("writing/drift/2/index.html"))).toHaveLength(TOTAL - 12);
    expect(first).toContain('data-series-banner="drift"');
    expect(first.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(first).toMatch(/<h1[^>]*>\s*Drift\s*<\/h1>/);
    expect(first).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/writing\/drift\/"/);
    expect(site.read("writing/drift/2/index.html")).toMatch(/<title>Drift, page 2 · /);
    expect(exists("writing/drift/1/index.html")).toBe(false);
    expect(exists("writing/drift/3/index.html")).toBe(false);
  });

  it("builds an empty /writing/convergence/ with the empty message", () => {
    const html = site.read("writing/convergence/index.html");
    expect(html).toContain("There are no posts in this series yet.");
    expect(html).toContain('data-series-banner="convergence"');
    expect(html).toContain('href="/writing/all/"');
    expect(exists("writing/convergence/2/index.html")).toBe(false);
  });

  it("does not build the old series topic addresses", () => {
    expect(exists("writing/topics/drift/index.html")).toBe(false);
    expect(exists("writing/topics/drift/2/index.html")).toBe(false);
    expect(exists("writing/topics/convergence/index.html")).toBe(false);
  });

  it("lists the series pages, and not the old addresses, in the sitemap", () => {
    const sitemap = site.read("sitemap-0.xml");
    expect(sitemap).toContain("/writing/drift/</loc>");
    expect(sitemap).toContain("/writing/convergence/</loc>");
    expect(sitemap).not.toContain("/writing/topics/drift/");
    expect(sitemap).not.toContain("/writing/topics/convergence/");
  });
});

describe("free-form topic pages (spec 013 research R9)", () => {
  it("builds a plain banner and listing for a free-form id named by a visible post", () => {
    const html = site.read("writing/topics/cloud-cost/index.html");
    expect(hrefs(html)).toEqual(["/writing/free-form-post/"]);
    expect(html).toContain("data-topic-banner");
    expect(html).toContain("bg-dusk-100");
    expect(html).toMatch(/<h1[^>]*>\s*Cloud cost\s*<\/h1>/);
    expect(html).toMatch(/<title>Cloud cost · /);
    expect(site.read("sitemap-0.xml")).toContain("/writing/topics/cloud-cost/</loc>");
  });

  it("builds no page for a free-form id that only a draft names, in production", () => {
    expect(exists("writing/topics/draft-only-topic/index.html")).toBe(false);
  });
});

describe("the feed (/writing/rss.xml)", () => {
  const items = (xml: string) => [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]!);
  const field = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([^<]*)</${name}>`))?.[1];

  it("is RSS 2.0 with the blog's title and language", () => {
    const xml = site.read("writing/rss.xml");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toMatch(/<rss [^>]*version="2\.0"/);
    expect(xml).toContain('xmlns:dcterms="http://purl.org/dc/terms/"');
    expect(field(xml.split("<item>")[0]!, "title")).toBe("Drift &amp; Convergence");
    expect(field(xml, "language")).toBe("en-ca");
  });

  it("lists every published post, newest first, with the same tie order as the listings", () => {
    const links = items(site.read("writing/rss.xml")).map((item) => field(item, "link")!);
    expect(links).toHaveLength(ALL_POSTS);
    const path = (link: string) => new URL(link).pathname;
    expect(links.slice(0, 3).map(path)).toEqual(["/writing/tie-b/", "/writing/listing-post-01/", "/writing/listing-post-02/"]);
    expect(path(links.at(-1)!)).toBe("/writing/free-form-post/");
  });

  it("uses absolute links against the build's own origin, and a permalink guid equal to the link", () => {
    const xml = site.read("writing/rss.xml");
    const origin = new URL(field(xml.split("<item>")[0]!, "link")!).origin;
    expect(site.read("writing/index.html")).toContain(`href="${origin}/writing/"`);
    for (const item of items(xml)) {
      const link = field(item, "link")!;
      expect(link.startsWith(`${origin}/writing/`)).toBe(true);
      expect(item).toContain(`<guid isPermaLink="true">${link}</guid>`);
    }
  });

  it("adds dcterms:modified only to a post that was updated", () => {
    const withModified = items(site.read("writing/rss.xml")).filter((item) => item.includes("<dcterms:modified>"));
    expect(withModified).toHaveLength(1);
    expect(withModified[0]).toContain("/writing/listing-post-03/");
    expect(field(withModified[0]!, "dcterms:modified")).toMatch(/^2026-07-15T/);
  });

  it("is not listed in the sitemap", () => {
    expect(site.read("sitemap-0.xml")).not.toContain("rss.xml");
  });
});

describe("getPostSummaries in a production build", () => {
  const summaries = () => JSON.parse(site.read("summaries.json")) as { slug: string; draft: boolean }[];

  it("lists the 16 visible posts newest first, with the same tie order as the listings", () => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const expected = ["tie-b", ...Array.from({ length: COUNT }, (_, i) => `listing-post-${pad(i + 1)}`), "free-form-post"];
    expect(summaries().map((p) => p.slug)).toEqual(expected);
    expect(expected).toHaveLength(ALL_POSTS);
  });

  it("leaves every draft out: no draft flag, the free-form draft and every sample post absent", () => {
    const posts = summaries();
    expect(posts.some((p) => p.draft)).toBe(false);
    const slugs = posts.map((p) => p.slug);
    expect(slugs).not.toContain("free-form-draft");
    expect(slugs.filter((slug) => slug.startsWith("sample-"))).toEqual([]);
  });
});
