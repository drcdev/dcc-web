// PostCard against contracts/blog-pages.md "Post card" (FR-011, FR-044, FR-047):
// <li><article data-post-card>, the title as the only link to the post, an
// image or a text-only variant, marks, date, reading time and topic pills.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostCard from "../../../src/components/post/PostCard.astro";
import { topicStyles } from "../../../src/components/post/topic-styles.ts";
import { topics } from "../../../src/config/topics.ts";
import { byName, classList, textOf } from "../html.ts";
import sample from "../../fixtures/pages/images/sample.png";
import { summary, withImage } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (post: ReturnType<typeof summary>, props: Record<string, unknown> = {}) =>
  container.renderToString(PostCard, { props: { post, ...props } });

describe("PostCard structure", () => {
  it("is an <li> holding one <article data-post-card>", async () => {
    const html = await render(summary("one"));
    expect(html.trim().startsWith("<li")).toBe(true);
    const articles = byName(html, "article");
    expect(articles).toHaveLength(1);
    expect("data-post-card" in articles[0]!.attrs).toBe(true);
  });

  it("puts the title in an h2 by default and an h3 when asked, linking to the post", async () => {
    const h2 = await render(summary("one"));
    expect(byName(h2, "h2")).toHaveLength(1);
    expect(h2).toMatch(/<h2[^>]*>\s*<a [^>]*href="\/writing\/one\/"[^>]*>\s*Title of one\s*<\/a>\s*<\/h2>/);
    const h3 = await render(summary("one"), { headingLevel: "h3" });
    expect(byName(h3, "h3")).toHaveLength(1);
    expect(byName(h3, "h2")).toHaveLength(0);
  });

  it("has exactly one link to the post: the card is not wrapped in a link", async () => {
    for (const post of [summary("one"), withImage("two")]) {
      const html = await render(post);
      const toPost = byName(html, "a").filter((a) => a.attrs.href === post.href);
      expect(toPost).toHaveLength(1);
      expect(html.indexOf("<a ")).toBeGreaterThan(html.indexOf("<article"));
    }
  });

  it("shows the summary in a paragraph", async () => {
    expect(await render(summary("one"))).toMatch(/<p[^>]*>\s*Summary of one\.\s*<\/p>/);
  });

  it("shows the date in a <time datetime> as Month D, YYYY, and the reading time", async () => {
    const html = await render(summary("one", { date: new Date("2026-01-05"), minutesRead: 7 }));
    const [time] = byName(html, "time");
    expect(time!.attrs.datetime).toBe("2026-01-05");
    expect(textOf(html, "time")).toBe("January 5, 2026");
    expect(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).toContain("7 min read");
  });

  it("lists the topic pills in a labelled list, in the post's order, each linking to its topic", async () => {
    const html = await render(summary("one", { topics: ["healthcare-leadership", "compliant-data"] }));
    const lists = byName(html, "ul").filter((u) => u.attrs["aria-label"] === "Topics");
    expect(lists).toHaveLength(1);
    const pills = byName(html, "a").filter((a) => "data-topic-pill" in a.attrs);
    expect(pills.map((p) => p.attrs.href)).toEqual([
      "/writing/topics/healthcare-leadership/",
      "/writing/topics/compliant-data/",
    ]);
  });
});

describe("PostCard image and text-only variants (FR-011)", () => {
  it("shows the feature image with its alt text, size and lazy loading, outside any link", async () => {
    const html = await render(withImage("pic"));
    const [img] = byName(html, "img");
    expect(img!.attrs.alt).toBe("Picture for pic");
    expect(img!.attrs.width).toBeTruthy();
    expect(img!.attrs.height).toBeTruthy();
    expect(img!.attrs.loading).toBe("lazy");
    const article = byName(html, "article")[0]!;
    expect("data-text-only" in article.attrs).toBe(false);
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf("<a "));
  });

  it("has no image element and is marked text-only, bordered in the main topic's colour", async () => {
    for (const topic of topics) {
      const html = await render(summary("plain", { topics: [topic.id, "technology-teams"] }));
      expect(byName(html, "img")).toHaveLength(0);
      const article = byName(html, "article")[0]!;
      expect("data-text-only" in article.attrs).toBe(true);
      for (const cls of topicStyles[topic.colour]!.border.split(/\s+/)) {
        expect(classList(article), topic.id).toContain(cls);
      }
    }
  });

  it("puts no topic border on a card that has an image", async () => {
    const html = await render(withImage("pic", { topics: ["compliant-data"] }));
    const article = byName(html, "article")[0]!;
    for (const cls of topicStyles.rust!.border.split(/\s+/)) expect(classList(article)).not.toContain(cls);
  });
});

describe("PostCard marks", () => {
  it("shows the Featured mark only for a featured post", async () => {
    const featured = await render(summary("f", { featured: true }));
    expect("data-featured" in byName(featured, "article")[0]!.attrs).toBe(true);
    expect(byName(featured, "span").filter((s) => "data-featured-mark" in s.attrs)).toHaveLength(1);
    expect(featured).toMatch(/data-featured-mark[^>]*>\s*Featured\s*</);
    const plain = await render(summary("p"));
    expect(byName(plain, "span").some((s) => "data-featured-mark" in s.attrs)).toBe(false);
    expect("data-featured" in byName(plain, "article")[0]!.attrs).toBe(false);
  });

  it("shows the Draft label only for a draft post", async () => {
    const draft = await render(summary("d", { draft: true }));
    expect("data-draft" in byName(draft, "article")[0]!.attrs).toBe(true);
    expect(draft).toMatch(/data-draft-label[^>]*>\s*Draft\s*</);
    const plain = await render(summary("p"));
    expect(plain).not.toContain("data-draft-label");
    expect("data-draft" in byName(plain, "article")[0]!.attrs).toBe(false);
  });

  it("can show both marks on one card", async () => {
    const html = await render(summary("both", { featured: true, draft: true }));
    expect(html).toContain("data-featured-mark");
    expect(html).toContain("data-draft-label");
  });

  it("shows the series marker first, then the other topics in written order", async () => {
    const html = await render(summary("s", { topics: ["agentic-ai", "cloud-cost", "drift"] }));
    const links = byName(html, "a").filter((a) => "data-topic-pill" in a.attrs || "data-series-marker" in a.attrs);
    expect(links.map((a) => a.attrs.href)).toEqual([
      "/writing/drift/",
      "/writing/topics/agentic-ai/",
      "/writing/topics/cloud-cost/",
    ]);
    expect("data-series-marker" in links[0]!.attrs).toBe(true);
  });

  it("shows no series marker for an untagged post", async () => {
    const html = await render(summary("u", { topics: ["agentic-ai"] }));
    expect(html).not.toContain("data-series-marker");
  });

  it("borders a text-only post in its series colour, else its first controlled topic, else neutral dusk", async () => {
    const cases: [string[], string][] = [
      [["agentic-ai", "convergence"], topicStyles.sage!.border],
      [["cloud-cost", "technology-teams", "agentic-ai"], topicStyles.sand!.border],
      [["cloud-cost"], "border-dusk-200 dark:border-dusk-700"],
    ];
    for (const [topics, border] of cases) {
      const html = await render(summary("t", { topics }));
      const article = byName(html, "article")[0]!;
      for (const cls of border.split(/\s+/)) expect(classList(article)).toContain(cls);
    }
  });
});

describe("PostCard image candidates (issue #73)", () => {
  const SIZES = "(min-width: 1024px) 320px, (min-width: 640px) 45vw, calc(100vw - 2rem)";
  const candidates = (html: string) => {
    const [img] = byName(html, "img");
    return (img!.attrs.srcset ?? "").split(",").map((entry) => {
      const [url, descriptor] = entry.trim().split(/\s+/);
      return { url: url!, descriptor: descriptor! };
    });
  };

  it("offers 320w, 400w and 640w for a wide source (C1)", async () => {
    const html = await render(withImage("pic"));
    expect(candidates(html).map((c) => c.descriptor)).toEqual(["320w", "400w", "640w"]);
  });

  it("never enlarges a narrower source (C1)", async () => {
    const narrow = withImage("pic");
    narrow.featureImage = { ...narrow.featureImage!, src: { ...sample, width: 480, height: 270 } };
    const html = await render(narrow);
    expect(candidates(html).map((c) => c.descriptor)).toEqual(["320w", "400w", "480w"]);
  });

  it("sizes the image for the phone column minus the page gutters (C2)", async () => {
    const [img] = byName(await render(withImage("pic")), "img");
    expect(img!.attrs.sizes).toBe(SIZES);
  });

  it("requests WebP at quality 65 for src and every candidate (C3)", async () => {
    const html = await render(withImage("pic"));
    const [img] = byName(html, "img");
    for (const url of [img!.attrs.src!, ...candidates(html).map((c) => c.url)]) {
      expect(url).toContain("q=65");
      expect(url).toContain("f=webp");
    }
  });
});
