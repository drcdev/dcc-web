// Sample data invariants for the blog design prototypes (data-model.md
// invariants 1-10; FR-004, FR-006, FR-011, FR-012). Prototype-only: deleted
// with the prototypes.
import { describe, expect, it } from "vitest";
import {
  byNewest,
  directions,
  featuredPosts,
  landingPath,
  listingPath,
  posts,
  postPath,
  postsInTopic,
  proposedAddress,
  prototypeAddress,
  relatedTo,
  topicPath,
  topics,
} from "../../../src/pages/design/blog/_data/samples.ts";

describe("blog design sample data", () => {
  it("has exactly 13 posts", () => {
    expect(posts).toHaveLength(13);
  });

  it("has four topics, each with a post, and only healthcare-leadership has a single post", () => {
    expect(topics.map((t) => t.slug)).toEqual([
      "compliant-data",
      "high-performing-teams",
      "agentic-ai-legacy",
      "healthcare-leadership",
    ]);
    for (const topic of topics) expect(postsInTopic(topic.slug).length).toBeGreaterThanOrEqual(1);
    const single = topics.filter((t) => postsInTopic(t.slug).length === 1).map((t) => t.slug);
    expect(single).toEqual(["healthcare-leadership"]);
  });

  it("gives every topic a unique tone and a 60-280 character intro, and every post a summary of at most 240", () => {
    expect(new Set(topics.map((t) => t.tone)).size).toBe(topics.length);
    for (const topic of topics) {
      expect(topic.intro.length).toBeGreaterThanOrEqual(60);
      expect(topic.intro.length).toBeLessThanOrEqual(280);
    }
    for (const post of posts) expect(post.summary.length).toBeLessThanOrEqual(240);
  });

  it("features 3 or 4 posts, and not only the newest", () => {
    expect(featuredPosts.length).toBeGreaterThanOrEqual(3);
    expect(featuredPosts.length).toBeLessThanOrEqual(4);
    expect(featuredPosts.map((p) => p.slug)).not.toEqual(byNewest.slice(0, featuredPosts.length).map((p) => p.slug));
  });

  it("has at least two posts without an image, one on the first listing page", () => {
    expect(posts.filter((p) => !p.image).length).toBeGreaterThanOrEqual(2);
    expect(byNewest.slice(0, 5).some((p) => !p.image)).toBe(true);
  });

  it("has a title of 90 or more characters and a post with three or more topics", () => {
    expect(posts.some((p) => p.title.length >= 90)).toBe(true);
    expect(posts.some((p) => p.topics.length >= 3)).toBe(true);
  });

  it("references only existing topics", () => {
    const known = new Set(topics.map((t) => t.slug));
    for (const post of posts) {
      expect(post.topics.length).toBeGreaterThanOrEqual(1);
      for (const slug of post.topics) expect(known.has(slug)).toBe(true);
    }
  });

  it("has exactly one full-with-image and one full-no-image body", () => {
    expect(posts.filter((p) => p.body === "full-with-image")).toHaveLength(1);
    expect(posts.filter((p) => p.body === "full-no-image")).toHaveLength(1);
    expect(posts.filter((p) => p.body === "short")).toHaveLength(11);
    expect(posts.find((p) => p.body === "full-with-image")?.image).toBeDefined();
    expect(posts.find((p) => p.body === "full-no-image")?.image).toBeUndefined();
  });

  it("keeps topic words and reserved words out of post slugs", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(["all", "topics"]).not.toContain(slug);
      for (const topic of topics) expect(slug).not.toContain(topic.slug);
    }
  });

  it("proposes no post address that contains a topic slug", () => {
    for (const direction of ["a", "b", "c"] as const) {
      for (const post of posts) {
        const address = proposedAddress(direction, post);
        expect(address).toMatch(/^\/writing\//);
        for (const topic of topics) expect(address).not.toContain(topic.slug);
      }
    }
    const first = byNewest[0]!;
    expect(proposedAddress("a", first)).toBe(`/writing/${first.slug}/`);
    expect(proposedAddress("b", first)).toBe(`/writing/${first.slug}/`);
    expect(proposedAddress("c", first)).toBe(`/writing/${first.date.slice(0, 4)}/${first.slug}/`);
  });

  it("maps a proposed address onto the prototype address", () => {
    expect(prototypeAddress("a", "/writing/")).toBe("/design/blog/a/");
    expect(prototypeAddress("c", "/writing/all/2/")).toBe("/design/blog/c/all/2/");
    expect(prototypeAddress("b", "/writing/topics/x/")).toBe("/design/blog/b/topics/x/");
  });

  it("builds the prototype paths for each screen", () => {
    const post = byNewest[0]!;
    expect(landingPath("a")).toBe("/design/blog/a/");
    expect(listingPath("b", 1)).toBe("/design/blog/b/all/");
    expect(listingPath("b", 3)).toBe("/design/blog/b/all/3/");
    expect(topicPath("a", "compliant-data")).toBe("/design/blog/a/topics/compliant-data/");
    expect(topicPath("c", "compliant-data")).toBe("/design/blog/c/compliant-data/");
    expect(postPath("b", post)).toBe(`/design/blog/b/${post.slug}/`);
    expect(postPath("c", post)).toBe(`/design/blog/c/${post.date.slice(0, 4)}/${post.slug}/`);
  });

  it("has unique dates in 2025-2026 and a total newest-first order", () => {
    const dates = posts.map((p) => p.date);
    expect(new Set(dates).size).toBe(dates.length);
    for (const date of dates) expect(date).toMatch(/^202[56]-\d{2}-\d{2}$/);
    expect(byNewest.map((p) => p.date)).toEqual([...dates].sort().reverse());
  });

  it("gives every image non-empty alt text", () => {
    for (const post of posts) if (post.image) expect(post.image.alt.trim().length).toBeGreaterThan(0);
  });

  it("returns three related posts, never the post itself, falling back to the newest", () => {
    for (const post of posts) {
      const related = relatedTo(post);
      expect(related).toHaveLength(3);
      expect(related.map((p) => p.slug)).not.toContain(post.slug);
      expect(new Set(related.map((p) => p.slug)).size).toBe(3);
    }
    const lone = posts.find((p) => p.topics.length === 1 && p.topics[0] === "healthcare-leadership")!;
    const newestOthers = byNewest.filter((p) => p.slug !== lone.slug && !p.topics.includes("healthcare-leadership"));
    expect(relatedTo(lone).map((p) => p.slug)).toEqual(newestOthers.slice(0, 3).map((p) => p.slug));
  });

  it("defines the three directions with no new colours or fonts", () => {
    expect(directions.map((d) => d.id)).toEqual(["a", "b", "c"]);
    for (const direction of directions) {
      expect(direction.name.length).toBeGreaterThan(0);
      expect(direction.summary.length).toBeGreaterThan(0);
      expect(direction.topicPresentation.length).toBeGreaterThan(0);
      expect(direction.noFeaturedBehaviour.length).toBeGreaterThan(0);
      expect(direction.newColoursOrFonts).toEqual([]);
      expect(direction.addresses.topic).toContain("{topic}");
      expect(direction.addresses.post).not.toContain("{topic}");
    }
  });
});
