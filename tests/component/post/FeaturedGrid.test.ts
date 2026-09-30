// FeaturedGrid: the bento grid of 1 to 3 featured posts on the landing page
// (contracts/blog-pages.md "Landing" item 4; FR-007).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import FeaturedGrid from "../../../src/components/post/FeaturedGrid.astro";
import { byName } from "../html.ts";
import { summary, withImage } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (posts: ReturnType<typeof summary>[]) => container.renderToString(FeaturedGrid, { props: { posts } });
const featured = (slug: string) => summary(slug, { featured: true });

describe("FeaturedGrid", () => {
  it.each([1, 2, 3])(
    "renders %i card(s) in one <ul data-featured-grid>, each titled with an h3 and marked Featured",
    async (n) => {
      const posts = ["a", "b", "c"]
        .slice(0, n)
        .map((slug) => (slug === "b" ? withImage(slug, { featured: true }) : featured(slug)));
      const html = await render(posts);
      const lists = byName(html, "ul").filter((u) => "data-featured-grid" in u.attrs);
      expect(lists).toHaveLength(1);
      expect(byName(html, "article")).toHaveLength(n);
      expect(byName(html, "h3")).toHaveLength(n);
      expect(byName(html, "h2")).toHaveLength(0);
      expect(html.match(/data-featured-mark/g)).toHaveLength(n);
    },
  );

  it("keeps the order given", async () => {
    const html = await render([featured("c"), featured("a")]);
    const order = [...html.matchAll(/<h3[^>]*>\s*<a [^>]*href="(\/writing\/[a-z]+\/)"/g)].map((m) => m[1]);
    expect(order).toEqual(["/writing/c/", "/writing/a/"]);
  });

  it("never shows a fourth card, so no fourth full-width card exists", async () => {
    const html = await render(["a", "b", "c", "d"].map(featured));
    expect(byName(html, "article")).toHaveLength(3);
  });

  it("renders nothing for no posts", async () => {
    expect(byName(await render([]), "ul")).toHaveLength(0);
  });
});
