// TopicPillRow: every topic as a pill, then a plain "All posts" link
// (contracts/blog-pages.md "Topic pill row"; FR-007, FR-012, FR-013).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import TopicPillRow from "../../../src/components/post/TopicPillRow.astro";
import { pillRowTopics, seriesIds, topicHref } from "../../../src/config/topics.ts";
import { byName, classList } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("TopicPillRow", () => {
  it('is one <nav aria-label="Topics">', async () => {
    const html = await container.renderToString(TopicPillRow);
    const navs = byName(html, "nav");
    expect(navs).toHaveLength(1);
    expect(navs[0]!.attrs["aria-label"]).toBe("Topics");
  });

  it("has one pill per non-series controlled topic in list order, including topics without posts", async () => {
    const html = await container.renderToString(TopicPillRow);
    const pills = byName(html, "a").filter((a) => "data-topic-pill" in a.attrs);
    expect(pills.map((a) => a.attrs.href)).toEqual(pillRowTopics.map((t) => topicHref(t.id)));
  });

  it('ends with a plain "All posts" link to /writing/all/ that is not a pill', async () => {
    const html = await container.renderToString(TopicPillRow);
    const links = byName(html, "a");
    const last = links.at(-1)!;
    expect(last.attrs.href).toBe("/writing/all/");
    expect("data-topic-pill" in last.attrs).toBe(false);
    expect(html.slice(last.index)).toMatch(/^<a[^>]*>\s*All posts\s*<\/a>/);
    expect(classList(last)).not.toContain("rounded-full");
    expect(links).toHaveLength(pillRowTopics.length + 1);
  });

  it("holds no series marker and no free-form pill", async () => {
    const html = await container.renderToString(TopicPillRow);
    const links = byName(html, "a");
    expect(links.some((a) => "data-series-marker" in a.attrs || "data-free-form" in a.attrs)).toBe(false);
    for (const id of seriesIds) expect(links.map((a) => a.attrs.href)).not.toContain(topicHref(id));
  });
});
