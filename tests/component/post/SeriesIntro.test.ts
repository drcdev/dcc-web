// SeriesIntro: the framing lead on the writing landing (spec 013 contracts/writing-pages.md
// "Landing"; FR-016a, FR-016b).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SeriesIntro from "../../../src/components/post/SeriesIntro.astro";
import { blog } from "../../../src/config/blog.ts";
import { findTopic } from "../../../src/config/topics.ts";
import { byName, classList, tags, textOf } from "../html.ts";

let container: AstroContainer;
let html: string;
beforeAll(async () => {
  container = await AstroContainer.create();
  html = await container.renderToString(SeriesIntro);
});

describe("SeriesIntro", () => {
  it("is one section labelled by its h2 'Drift & Convergence'", () => {
    const sections = byName(html, "section");
    expect(sections).toHaveLength(1);
    expect(sections[0]!.attrs["data-series-intro"]).toBeDefined();
    const h2 = byName(html, "h2");
    expect(h2).toHaveLength(1);
    expect(h2[0]!.attrs.id).toBeTruthy();
    expect(sections[0]!.attrs["aria-labelledby"]).toBe(h2[0]!.attrs.id);
    expect(textOf(html, "h2")).toBe("Drift & Convergence");
  });

  it("has an h3 per series, Convergence first, with its description", () => {
    const h3 = byName(html, "h3");
    expect(h3).toHaveLength(2);
    expect(textOf(html, "h3")).toBe("Convergence");
    expect(html.indexOf(findTopic("convergence")!.description.replaceAll("'", "&#39;"))).toBeLessThan(
      html.indexOf(findTopic("drift")!.description.replaceAll("'", "&#39;")),
    );
    for (const id of ["convergence", "drift"]) expect(html).toContain(findTopic(id)!.description.replaceAll("'", "&#39;"));
    expect(html).toContain(blog.seriesIntro);
  });

  it("links 'Read Convergence' and 'Read Drift' to the short addresses", () => {
    const links = byName(html, "a");
    expect(links.map((a) => a.attrs.href)).toEqual(["/writing/convergence/", "/writing/drift/"]);
    expect(html).toContain("Read Convergence");
    expect(html).toContain("Read Drift");
    expect(html).not.toContain("/writing/topics/");
    expect(tags(html).filter((t) => "role" in t.attrs)).toHaveLength(0);
  });

  it("opens each tile with its own image, outside the padded text and any link (FR-001, FR-002)", () => {
    const tiles = byName(html, "div").filter((d) => "data-series-intro-item" in d.attrs);
    expect(tiles.map((t) => t.attrs["data-series-intro-item"])).toEqual(["convergence", "drift"]);
    const imgs = byName(html, "img");
    expect(imgs.map((i) => i.attrs["data-series-image"])).toEqual(["convergence", "drift"]);
    for (const tile of tiles) {
      const id = tile.attrs["data-series-intro-item"]!;
      const end = html.indexOf("</div>\n", tile.index);
      const tileHtml = html.slice(tile.index, end === -1 ? undefined : end);
      const img = imgs.find((i) => i.attrs["data-series-image"] === id)!;
      // The image is the first element inside the tile, before the p-5 text div.
      const inner = tags(html.slice(tile.index + tile.raw.length)).filter((t) => t.name !== "/");
      expect(inner[0]!.name).toBe("img");
      expect(inner[0]!.attrs["data-series-image"]).toBe(id);
      expect(inner[1]!.name).toBe("div");
      expect(classList(inner[1]!)).toContain("p-5");
      expect(classList(tile)).toEqual(expect.arrayContaining(["overflow-hidden", "rounded-xl"]));
      expect(classList(tile)).not.toContain("p-5");
      expect(tileHtml).toContain(img.raw);
      expect(img.attrs.alt).toBe("");
      expect(img.attrs.loading).toBe("eager");
      expect(img.attrs.width).toBe("1008");
      expect(img.attrs.height).toBe("504");
      expect(img.attrs.title).toBeUndefined();
      expect(img.attrs["aria-label"]).toBeUndefined();
      expect(img.attrs.srcset!.match(/\s(400|640|1008)w/g)).toHaveLength(3);
    }
    // No image sits inside a link.
    expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<img/);
  });

  it("gives only the first tile (Convergence) high fetch priority", () => {
    const imgs = byName(html, "img");
    expect(imgs[0]!.attrs.fetchpriority).toBe("high");
    expect(imgs[1]!.attrs.fetchpriority).not.toBe("high");
  });

  it("has no transition, animate or duration class on the lead or its links", () => {
    expect(html).not.toMatch(/class="[^"]*\b(transition|animate|duration)[\w-]*/);
  });

  it("uses plain wording with no hype words", () => {
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    for (const word of ["revolutionary", "game-changing", "cutting-edge", "unlock", "supercharge", "leverage", "delve"])
      expect(text).not.toContain(word);
  });
});
