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
    expect(html).toContain(series.description.replaceAll("'", "&#39;"));
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

  it("has no transition, animate or duration class on the banner or its links", async () => {
    const html = await render({ series: "drift" });
    expect(html).not.toMatch(/class="[^"]*\b(transition|animate|duration)[\w-]*/);
  });

  it("throws for an id that is not a series", async () => {
    await expect(render({ series: "agentic-ai" })).rejects.toThrow(/agentic-ai/);
  });

  describe("series image strip (specs/025-topic-images contracts/series-cards.md section 2; FR-003, FR-016)", () => {
    it.each(["drift", "convergence"])("puts the %s strip first in the header, before the eyebrow", async (id) => {
      const html = await render({ series: id });
      const header = tags(html).find((t) => t.attrs["data-series-banner"] === id)!;
      expect(header.attrs.class).toContain("mb-8");
      expect(header.attrs.class).toContain("overflow-hidden");
      expect(header.attrs.class).toContain("rounded-xl");
      const images = byName(html, "img");
      expect(images).toHaveLength(1);
      const img = images[0]!;
      expect(img.attrs["data-series-image"]).toBe(id);
      expect(img.attrs.alt).toBe("");
      expect(img.attrs.width).toBe("1536");
      expect(img.attrs.height).toBe("384");
      expect(img.attrs.loading).toBe("eager");
      expect(img.attrs.fetchpriority).toBe("high");
      expect(img.attrs.class).toContain("aspect-[4/1]");
      expect(html.indexOf("<img")).toBeLessThan(html.search(/<p[^>]*>\s*Series\s*<\/p>/));
      expect(html.indexOf("<img")).toBeGreaterThan(html.indexOf("<header"));
    });

    it("keeps the image out of any link and the h1 as the only heading", async () => {
      const html = await render({ series: "drift" });
      expect(html).not.toMatch(/<a\b[^>]*>[^]*<img/);
      expect(byName(html, "h1")).toHaveLength(1);
      expect(byName(html, "h2")).toHaveLength(0);
    });

    it("shows the same strip on page 2", async () => {
      const html = await render({ series: "drift", page: 2 });
      expect(byName(html, "img")).toHaveLength(1);
      expect(byName(html, "img")[0]!.attrs["data-series-image"]).toBe("drift");
    });

    it("pads the text block p-6 md:p-8 and not the header", async () => {
      const html = await render({ series: "drift" });
      const header = tags(html).find((t) => "data-series-banner" in t.attrs)!;
      expect(header.attrs.class).not.toMatch(/\bp-6\b/);
      expect(html).toMatch(/<div[^>]*class="[^"]*\bp-6 md:p-8\b/);
    });

    it("applies the series outline", async () => {
      const html = await render({ series: "drift" });
      expect(html).toContain("forced-colors:border-[CanvasText]");
    });
  });
});
