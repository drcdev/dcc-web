// CardGrid: a <ul> of post cards (contracts/blog-pages.md "Post card"; FR-044).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import CardGrid from "../../../src/components/post/CardGrid.astro";
import { byName } from "../html.ts";
import { summary, withImage } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (props: Record<string, unknown>) => container.renderToString(CardGrid, { props });

describe("CardGrid", () => {
  it("renders one <ul> with a card per post, in the order given", async () => {
    const html = await render({ posts: [summary("a"), withImage("b"), summary("c")] });
    const lists = byName(html, "ul").filter((u) => !("aria-label" in u.attrs));
    expect(lists).toHaveLength(1);
    expect(byName(html, "article")).toHaveLength(3);
    const order = [...html.matchAll(/<h2[^>]*>\s*<a [^>]*href="(\/writing\/[a-z]+\/)"/g)].map((m) => m[1]);
    expect(order).toEqual(["/writing/a/", "/writing/b/", "/writing/c/"]);
  });

  it("passes the heading level to every card", async () => {
    const html = await render({ posts: [summary("a"), summary("b")], headingLevel: "h3" });
    expect(byName(html, "h3")).toHaveLength(2);
    expect(byName(html, "h2")).toHaveLength(0);
  });

  it("defaults the heading level to h2", async () => {
    expect(byName(await render({ posts: [summary("a")] }), "h2")).toHaveLength(1);
  });

  it("passes other attributes to the <ul>, so a page can mark its grid", async () => {
    const html = await render({ posts: [summary("a")], "data-featured-grid": "" });
    expect("data-featured-grid" in byName(html, "ul")[0]!.attrs).toBe(true);
  });

  it("renders nothing for no posts, so an empty list is never output", async () => {
    const html = await render({ posts: [] });
    expect(byName(html, "ul")).toHaveLength(0);
    expect(byName(html, "li")).toHaveLength(0);
  });
});
