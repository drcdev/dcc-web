// PostMeta (FR-020, FR-021): publication date, a separate "Updated" date, reading
// time and topic pills, each in its own element.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostMeta from "../../../src/components/post/PostMeta.astro";
import { byName } from "../html.ts";
import { summary } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});
const render = (extra = {}) => container.renderToString(PostMeta, { props: { post: summary("one", extra) } });
const renderPost = (post: ReturnType<typeof summary>) => container.renderToString(PostMeta, { props: { post } });
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

describe("PostMeta", () => {
  it("shows the publication date in a <time datetime>", async () => {
    const html = await render({ date: new Date("2026-01-05") });
    const [time] = byName(html, "time");
    expect(time!.attrs.datetime).toBe("2026-01-05");
    expect(html).toMatch(/<time[^>]*>\s*January 5, 2026\s*<\/time>/);
  });

  it("shows the update date in its own <time> only when the post was updated", async () => {
    const plain = await render();
    expect(byName(plain, "time")).toHaveLength(1);
    expect(text(plain)).not.toContain("Updated");
    const html = await render({ updated: new Date("2026-09-15") });
    const times = byName(html, "time");
    expect(times).toHaveLength(2);
    expect(times[1]!.attrs.datetime).toBe("2026-09-15");
    expect(html).toMatch(/Updated\s*<time[^>]*>\s*September 15, 2026\s*<\/time>/);
  });

  it("shows the reading time", async () => {
    expect(text(await render({ minutesRead: 7 }))).toContain("7 min read");
  });

  it("lists a pill for each topic, in order, linking to its topic page", async () => {
    const html = await render({ topics: ["healthcare-leadership", "compliant-data"] });
    const pills = byName(html, "a").filter((a) => "data-topic-pill" in a.attrs);
    expect(pills.map((p) => p.attrs.href)).toEqual([
      "/writing/topics/healthcare-leadership/",
      "/writing/topics/compliant-data/",
    ]);
    expect(byName(html, "ul").some((u) => u.attrs["aria-label"] === "Topics")).toBe(true);
  });

  it("shows the series marker first, then the other topics in written order", async () => {
    const html = await renderPost(summary("s", { topics: ["agentic-ai", "cloud-cost", "drift"] }));
    const links = byName(html, "a").filter((a) => "data-topic-pill" in a.attrs || "data-series-marker" in a.attrs);
    expect(links.map((a) => a.attrs.href)).toEqual([
      "/writing/drift/",
      "/writing/topics/agentic-ai/",
      "/writing/topics/cloud-cost/",
    ]);
    expect("data-series-marker" in links[0]!.attrs).toBe(true);
  });

  it("shows no series marker for an untagged post", async () => {
    const html = await renderPost(summary("u", { topics: ["agentic-ai"] }));
    expect(html).not.toContain("data-series-marker");
  });
});
