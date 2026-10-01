// RecentWriting (spec 008 US7; FR-038, FR-044): the home page's "Recent writing" section.
import { describe, expect, it } from "vitest";
import RecentWriting from "../../../src/components/sections/RecentWriting.astro";
import { byName, tags, textOf } from "../html.ts";
import { summary } from "../post/fixtures.ts";
import { render } from "./helpers.ts";

const posts = (n: number) =>
  Array.from({ length: n }, (_, i) => summary(`p${i}`, { date: new Date(`2026-08-${10 + i}`) }));

describe("RecentWriting", () => {
  it("is a labelled section with the h2 'Recent writing'", async () => {
    const html = await render(RecentWriting, { posts: posts(3) });
    const section = tags(html).find((t) => t.name === "section");
    expect(section?.attrs["aria-labelledby"]).toBeTruthy();
    const h2 = byName(html, "h2");
    expect(h2).toHaveLength(1);
    expect(h2[0]?.attrs.id).toBe(section?.attrs["aria-labelledby"]);
    expect(textOf(html, "h2")).toBe("Recent writing");
  });

  it("shows the 3 newest posts as cards with h3 titles, in a 3-across grid from md", async () => {
    const html = await render(RecentWriting, { posts: posts(5) });
    expect(byName(html, "article")).toHaveLength(3);
    expect(byName(html, "h3")).toHaveLength(3);
    expect(html.indexOf("Title of p4")).toBeLessThan(html.indexOf("Title of p3"));
    expect(html).not.toContain("Title of p1");
    const grid = byName(html, "ul").find((u) => !("aria-label" in u.attrs));
    expect(grid?.attrs.class).toMatch(/md:grid-cols-3/);
  });

  it("links to all writing at /writing/", async () => {
    const html = await render(RecentWriting, { posts: posts(3) });
    const link = byName(html, "a").find((a) => a.attrs.href === "/writing/");
    expect(link).toBeTruthy();
    expect(html).toContain("All writing");
  });

  it("has one paragraph under the heading naming Drift & Convergence with links to both series", async () => {
    const html = await render(RecentWriting, { posts: posts(3) });
    const intro = html.slice(html.indexOf("</h2>"), html.indexOf("<ul"));
    expect(intro).toContain("Drift &amp; Convergence");
    expect(byName(intro, "p")).toHaveLength(1);
    expect(byName(intro, "h3")).toHaveLength(0);
    expect(intro).toMatch(/<a [^>]*href="\/writing\/convergence\/"[^>]*>\s*Convergence\s*<\/a>/);
    expect(intro).toMatch(/<a [^>]*href="\/writing\/drift\/"[^>]*>\s*Drift\s*<\/a>/);
  });

  it("shows series markers on cards of tagged posts", async () => {
    const html = await render(RecentWriting, { posts: posts(3).map((p) => ({ ...p, topics: ["drift"] })) });
    expect(html).toContain("data-series-marker");
  });

  it("renders nothing when there are no visible posts", async () => {
    const html = await render(RecentWriting, { posts: [] });
    expect(html.trim()).toBe("");
  });
});
