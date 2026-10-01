// SeriesBanner: the introduction banner of a series page (spec 013 contracts/writing-pages.md
// "Series page"; FR-009, FR-016a, FR-016b).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SeriesBanner from "../../../src/components/post/SeriesBanner.astro";
import { findTopic } from "../../../src/config/topics.ts";
import { byName, tags, textOf } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (props: { series: string; page?: number }) => container.renderToString(SeriesBanner, { props });

describe("SeriesBanner", () => {
  it.each([
    ["drift", "Convergence", "/writing/convergence/"],
    ["convergence", "Drift", "/writing/drift/"],
  ])("shows %s with one h1, the description and the links", async (id, otherName, otherHref) => {
    const series = findTopic(id)!;
    const html = await render({ series: id });
    expect(tags(html).filter((t) => t.attrs["data-series-banner"] === id)).toHaveLength(1);
    expect(byName(html, "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toBe(series.name);
    expect(html).toContain(series.description);
    const links = byName(html, "a").map((a) => a.attrs.href);
    expect(links).toEqual([otherHref, "/writing/"]);
    expect(html).toContain(`Read ${otherName}`);
    expect(html).toContain("All writing");
  });

  it("has a Series eyebrow that is a paragraph, not a heading", async () => {
    const html = await render({ series: "drift" });
    expect(html).toMatch(/<p[^>]*>\s*Series\s*<\/p>/);
    expect(byName(html, "h2")).toHaveLength(0);
  });

  it("adds no landmark", async () => {
    const html = await render({ series: "drift" });
    for (const name of ["nav", "aside", "section", "main", "footer"]) expect(byName(html, name)).toHaveLength(0);
    expect(tags(html).filter((t) => "role" in t.attrs)).toHaveLength(0);
  });

  it("adds the page number to the name on page 2 and later", async () => {
    expect(textOf(await render({ series: "drift", page: 2 }), "h1")).toBe("Drift, page 2");
    expect(textOf(await render({ series: "drift", page: 1 }), "h1")).toBe("Drift");
  });

  it("uses the series palette and never a /writing/topics/ address", async () => {
    const html = await render({ series: "convergence" });
    expect(html).toContain("bg-sage-100");
    expect(html).not.toContain("/writing/topics/");
  });

  it("throws for an id that is not a series", async () => {
    await expect(render({ series: "agentic-ai" })).rejects.toThrow(/agentic-ai/);
  });
});
