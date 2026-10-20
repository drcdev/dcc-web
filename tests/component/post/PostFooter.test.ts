// PostFooter (specs/045-post-footer-consolidation/contracts/post-footer.md rows F1, F3, F4): the one
// box at the end of a post that holds the author part and the share part.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostFooter from "../../../src/components/post/PostFooter.astro";
import { byName, classList, tags } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create({ astroConfig: { site: "https://example.test" } });
});

const render = () =>
  container.renderToString(PostFooter, { props: { topics: ["agentic-ai"], title: "A post", href: "/writing/one/" } });

describe("PostFooter", () => {
  it("F1/F3: is one div[data-post-footer] with no role or aria label", async () => {
    const html = await render();
    const found = tags(html).filter((t) => "data-post-footer" in t.attrs);
    expect(found).toHaveLength(1);
    expect(found[0]!.name).toBe("div");
    for (const attr of ["role", "aria-label", "aria-labelledby"]) expect(found[0]!.attrs[attr]).toBeUndefined();
  });

  it("F4: carries the title card's box classes and the 40 px top gap", async () => {
    const [box] = tags(await render()).filter((t) => "data-post-footer" in t.attrs);
    for (const c of [
      "mt-10", "rounded-xl", "border", "border-dusk-200", "bg-white", "p-6", "shadow-sm",
      "dark:border-dusk-700", "dark:bg-dusk-800",
    ]) expect(classList(box!), c).toContain(c);
  });

  it("F1/F3: holds the author card then the share part, with two h2 and no footer, aside or hr", async () => {
    const html = await render();
    expect(html.indexOf("data-author-card")).toBeGreaterThan(-1);
    expect(html.indexOf("data-share")).toBeGreaterThan(html.indexOf("data-author-card"));
    expect(byName(html, "h2")).toHaveLength(2);
    for (const name of ["footer", "aside", "hr"]) expect(byName(html, name), name).toHaveLength(0);
  });
});
