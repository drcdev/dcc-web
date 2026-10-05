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
    expect(textOf(html.slice(html.indexOf("</h1>")), "p")).toBe(topic.description);
  });

  it("uses the topic's colour classes", async () => {
    const html = await container.renderToString(TopicBanner, { props: { topic: "compliant-data" } });
    expect(html).toContain("bg-rust-100");
  });

  it("renders a free-form topic as a plain dusk banner with a sentence-case label and the same headings", async () => {
    const html = await container.renderToString(TopicBanner, { props: { topic: "cloud-cost" } });
    expect(tags(html).filter((t) => "data-topic-banner" in t.attrs)).toHaveLength(1);
    expect(tags(html).filter((t) => t.name === "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toBe("Cloud cost");
    expect(textOf(html, "p")).toBe("Topic");
    expect(html).toContain("bg-dusk-100");
    expect(tags(html).filter((t) => t.name === "p")).toHaveLength(1);
  });

  it("adds the page number to a free-form topic's name", async () => {
    const html = await container.renderToString(TopicBanner, { props: { topic: "cloud-cost", page: 2 } });
    expect(textOf(html, "h1")).toBe("Cloud cost, page 2");
  });

  it.each(topics)("has no image in the banner of $id (FR-004)", async (topic) => {
    const html = await container.renderToString(TopicBanner, { props: { topic: topic.id } });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("data-series-image");
  });

  it("has no image in the banner of a free-form topic", async () => {
    const html = await container.renderToString(TopicBanner, { props: { topic: "cloud-cost" } });
    expect(html).not.toContain("<img");
  });
});
