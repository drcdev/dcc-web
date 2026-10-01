// SeriesMarker: the pill-shaped "Series: Drift" / "Series: Convergence" link
// (spec 013 FR-010, FR-016c, FR-016d).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SeriesMarker from "../../../src/components/post/SeriesMarker.astro";
import { topicStyles } from "../../../src/components/post/topic-styles.ts";
import { findTopic, seriesIds } from "../../../src/config/topics.ts";
import { byName, classList } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("SeriesMarker", () => {
  it.each(seriesIds.map((id) => [id, findTopic(id)!.name, findTopic(id)!.colour] as const))(
    "renders %s as one link reading 'Series: name' to the short address, in the series colour",
    async (id, name, colour) => {
      const html = await container.renderToString(SeriesMarker, { props: { series: id } });
      const links = byName(html, "a");
      expect(links).toHaveLength(1);
      const link = links[0]!;
      expect(link.attrs.href).toBe(`/writing/${id}/`);
      expect("data-series-marker" in link.attrs).toBe(true);
      expect("aria-label" in link.attrs).toBe(false);
      expect(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).toBe(`Series: ${name}`);
      for (const cls of topicStyles[colour]!.marker.split(/\s+/)) expect(classList(link)).toContain(cls);
    },
  );

  it("is semibold with a 2px outline, underlines on hover, and has no colour change, transition or animation", async () => {
    const html = await container.renderToString(SeriesMarker, { props: { series: "drift" } });
    const cls = classList(byName(html, "a")[0]!);
    expect(cls).toContain("font-semibold");
    expect(cls).toContain("border-2");
    expect(cls).toContain("hover:underline");
    expect(cls.filter((c) => /^hover:(text|bg|border)-/.test(c))).toEqual([]);
    expect(cls.filter((c) => /transition|animate|duration/.test(c))).toEqual([]);
  });

  it("has a target of at least 24 by 24 CSS px (padding plus text-sm line height and a 2px border)", async () => {
    const html = await container.renderToString(SeriesMarker, { props: { series: "drift" } });
    const cls = classList(byName(html, "a")[0]!);
    expect(cls).toContain("inline-block");
    expect(cls).toContain("py-1");
    expect(cls).toContain("text-sm");
  });
});
