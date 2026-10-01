// SeriesIntro: the framing lead on the writing landing (spec 013 contracts/writing-pages.md
// "Landing"; FR-016a, FR-016b).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SeriesIntro from "../../../src/components/post/SeriesIntro.astro";
import { blog } from "../../../src/config/blog.ts";
import { findTopic } from "../../../src/config/topics.ts";
import { byName, tags, textOf } from "../html.ts";

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

  it("has no transition, animate or duration class on the lead or its links", () => {
    expect(html).not.toMatch(/class="[^"]*\b(transition|animate|duration)[\w-]*/);
  });

  it("uses plain wording with no hype words", () => {
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    for (const word of ["revolutionary", "game-changing", "cutting-edge", "unlock", "supercharge", "leverage", "delve"])
      expect(text).not.toContain(word);
  });
});
