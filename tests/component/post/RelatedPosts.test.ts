// RelatedPosts (FR-029, FR-044): a titled list of up to 3 cards, absent for none.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import RelatedPosts from "../../../src/components/post/RelatedPosts.astro";
import { byName, tags, textOf } from "../html.ts";
import { summary } from "./fixtures.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const render = (posts: ReturnType<typeof summary>[]) => container.renderToString(RelatedPosts, { props: { posts } });

describe("RelatedPosts", () => {
  it("is a data-related section with the h2 'Related posts' and cards with h3 titles in a list", async () => {
    const html = await render([summary("a"), summary("b"), summary("c")]);
    expect(tags(html).filter((t) => "data-related" in t.attrs)).toHaveLength(1);
    expect(textOf(html, "h2")).toBe("Related posts");
    expect(byName(html, "h2")).toHaveLength(1);
    expect(byName(html, "h3")).toHaveLength(3);
    // The card list (the cards' own topic lists carry an aria-label).
    expect(byName(html, "ul").filter((u) => !("aria-label" in u.attrs))).toHaveLength(1);
    expect(byName(html, "article")).toHaveLength(3);
  });

  it("shows at most 3 cards", async () => {
    const html = await render([summary("a"), summary("b"), summary("c"), summary("d")]);
    expect(byName(html, "article")).toHaveLength(3);
  });

  it("renders nothing at all when there are no other posts", async () => {
    const html = await render([]);
    expect(html.trim()).toBe("");
  });

  it("shows the series marker on a related post that is in a series", async () => {
    const html = await render([summary("a", { topics: ["agentic-ai", "drift"] }), summary("b")]);
    const markers = byName(html, "a").filter((a) => "data-series-marker" in a.attrs);
    expect(markers.map((a) => a.attrs.href)).toEqual(["/writing/drift/"]);
  });
});
