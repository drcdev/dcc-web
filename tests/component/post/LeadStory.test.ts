// LeadStory: the newest post, large, at the top of the landing page
// (contracts/blog-pages.md "Landing" item 2; FR-006, FR-011, FR-052).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import LeadStory from "../../../src/components/post/LeadStory.astro";
import { cardEdge, topicStyles } from "../../../src/components/post/topic-styles.ts";
import { findTopic } from "../../../src/config/topics.ts";
import { byName, classList } from "../html.ts";
import { summary, withImage } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (post: ReturnType<typeof summary>) => container.renderToString(LeadStory, { props: { post } });

describe("LeadStory", () => {
  it("is one <article data-lead-story> with the title as an h2 link to the post", async () => {
    const html = await render(summary("one"));
    const articles = byName(html, "article");
    expect(articles).toHaveLength(1);
    expect("data-lead-story" in articles[0]!.attrs).toBe(true);
    expect(html).toMatch(/<h2[^>]*>\s*<a [^>]*href="\/writing\/one\/"[^>]*>\s*Title of one\s*<\/a>\s*<\/h2>/);
    expect(byName(html, "a").filter((a) => a.attrs.href === "/writing/one/")).toHaveLength(1);
  });

  it("shows the summary, the date, the reading time and the topic pills", async () => {
    const html = await render(summary("one", { topics: ["agentic-ai", "compliant-data"], minutesRead: 9 }));
    expect(html).toContain("Summary of one.");
    expect(byName(html, "time")).toHaveLength(1);
    expect(html.replace(/<[^>]+>/g, " ")).toContain("9 min read");
    expect(byName(html, "a").filter((a) => "data-topic-pill" in a.attrs).map((a) => a.attrs.href)).toEqual([
      "/writing/topics/agentic-ai/",
      "/writing/topics/compliant-data/",
    ]);
  });

  it("loads its feature image eagerly at automatic priority, with its alt text", async () => {
    const html = await render(withImage("one"));
    const [img] = byName(html, "img");
    expect(img!.attrs.alt).toBe("Picture for one");
    expect(img!.attrs.loading).toBe("eager");
    expect(img!.attrs.fetchpriority).toBe("auto");
    expect("data-text-only" in byName(html, "article")[0]!.attrs).toBe(false);
  });

  it("puts no quality parameter on any image candidate URL (FR-006)", async () => {
    const html = await render(withImage("one"));
    const [img] = byName(html, "img");
    expect(`${img!.attrs.src} ${img!.attrs.srcset ?? ""}`).not.toMatch(/[?&]q=/);
  });

  it("is a text-only card bordered in the main topic colour, with no image, without an image", async () => {
    const html = await render(summary("one", { topics: ["technology-teams"] }));
    expect(byName(html, "img")).toHaveLength(0);
    const article = byName(html, "article")[0]!;
    expect("data-text-only" in article.attrs).toBe(true);
    const colour = findTopic("technology-teams")!.colour;
    for (const cls of topicStyles[colour]!.border.split(/\s+/)) expect(classList(article)).toContain(cls);
  });

  it("gives an image lead story the shared cardEdge and no dusk-700 edge (spec 025 FR-010)", async () => {
    const article = byName(await render(withImage("one")), "article")[0]!;
    for (const cls of cardEdge.split(/\s+/)) expect(classList(article)).toContain(cls);
    expect(classList(article)).not.toContain("dark:border-dusk-700");
  });

  it("keeps the 2px topic border on a text-only lead story and adds no second edge (spec 025 FR-013)", async () => {
    const article = byName(await render(summary("one", { topics: ["technology-teams"] })), "article")[0]!;
    expect(classList(article)).toContain("border-2");
    expect(classList(article)).not.toContain("dark:border-dusk-500");
    expect(classList(article)).not.toContain("border");
  });

  it("marks a featured lead story", async () => {
    expect(await render(summary("one", { featured: true }))).toContain("data-featured-mark");
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
