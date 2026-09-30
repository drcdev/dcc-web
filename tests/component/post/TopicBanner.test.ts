// TopicBanner: the introduction banner of a topic page (contracts/blog-pages.md
// "Topic"; FR-013).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import TopicBanner from "../../../src/components/post/TopicBanner.astro";
import { topics } from "../../../src/config/topics.ts";
import { tags, textOf } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("TopicBanner", () => {
  it.each(topics)("shows the h1 name and the description of $id, marked data-topic-banner", async (topic) => {
    const html = await container.renderToString(TopicBanner, { props: { topic: topic.id } });
    expect(tags(html).filter((t) => "data-topic-banner" in t.attrs)).toHaveLength(1);
    expect(tags(html).filter((t) => t.name === "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toBe(topic.name);
    expect(html).toContain(topic.description);
  });

  it("uses the topic's colour classes", async () => {
    const html = await container.renderToString(TopicBanner, { props: { topic: "compliant-data" } });
    expect(html).toContain("bg-rust-100");
  });

  it("throws for an unknown topic", async () => {
    await expect(container.renderToString(TopicBanner, { props: { topic: "nope" } })).rejects.toThrow(/nope/);
  });
});
