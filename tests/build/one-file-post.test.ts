// SC-002 and US3: one file is enough to publish a post, and no other file needs an
// edit (FR-002, FR-006, FR-016, FR-032). Modelled on one-file-page.test.ts. The
// entries on the all-posts page and the topic pages turn green with Phase 6, the
// feed with Phase 8 and the home section with Phase 9; each is its own case.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

let published: FixtureSiteResult;
let future: FixtureSiteResult;

beforeAll(async () => {
  // One after the other: parallel builds starve each other when the whole build suite runs at once.
  published = await buildFixtureSite([], { posts: ["valid/published.mdx"] });
  future = await buildFixtureSite([], {
    posts: [{ from: "valid/published.mdx", to: "future-post.mdx", replace: ["2026-08-27", "2099-01-01"] }],
  });
}, 900_000);

afterAll(() => {
  published?.cleanup();
  future?.cleanup();
});

describe("a post that is one file", () => {
  it("builds", () => {
    expect(published.message).toBe("");
    expect(published.ok).toBe(true);
  });

  it("publishes /writing/{slug}/ with its own title, description and canonical address", () => {
    const html = published.read("writing/published/index.html");
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1);
    expect(html).toMatch(/<h1[^>]*>\s*A published post\s*<\/h1>/);
    expect(html).toContain("A published post used by the build tests.");
    expect(html).toMatch(/<link[^>]+rel="canonical"[^>]+href="[^"]*\/writing\/published\/"/);
    expect(html).not.toContain("data-draft-notice");
  });

  it("adds the post to the sitemap", () => {
    expect(published.read("sitemap-0.xml")).toContain("/writing/published/");
  });

  it("lists the post on the landing page", () => {
    expect(published.read("writing/index.html")).toContain('href="/writing/published/"');
  });

  it("lists the post on the all posts page (Phase 6)", () => {
    expect(published.read("writing/all/index.html")).toContain('href="/writing/published/"');
  });

  it("lists the post on the page of its topic (Phase 6)", () => {
    expect(published.read("writing/topics/agentic-ai/index.html")).toContain('href="/writing/published/"');
  });

  it("adds the post to the feed (Phase 8)", () => {
    expect(published.read("writing/rss.xml")).toContain("/writing/published/");
  });

  it("adds the post to the home page section (Phase 9)", () => {
    expect(published.read("index.html")).toContain('href="/writing/published/"');
  });

  it("publishes a post dated in the future like any other (no scheduling)", () => {
    expect(future.message).toBe("");
    expect(future.ok).toBe(true);
    expect(future.read("writing/future-post/index.html")).toMatch(/<h1[^>]*>\s*A published post\s*<\/h1>/);
    expect(future.read("sitemap-0.xml")).toContain("/writing/future-post/");
    expect(future.read("writing/index.html")).toContain('href="/writing/future-post/"');
  });
});
