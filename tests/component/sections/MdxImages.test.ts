// Plan risk R8: a Markdown image inside a section child is optimised by Astro's
// MDX pipeline (an optimised WebP through the image service, with width and height) with no import in
// the page file.
import { getContainerRenderer } from "@astrojs/mdx/container-renderer";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { describe, expect, it } from "vitest";
import Page from "./figure-in-mdx.mdx";
import { byName } from "../html.ts";

describe("images inside section children (R8)", () => {
  it("are optimised by Astro when the page is MDX", async () => {
    const renderers = await loadRenderers([getContainerRenderer()]);
    const container = await AstroContainer.create({ renderers });
    const html = await container.renderToString(Page);
    const [img] = byName(html, "img");
    expect(byName(html, "figure")).toHaveLength(1);
    expect(img!.attrs.src).toMatch(/(_astro|_image)/);
    expect(img!.attrs.width).toBeTruthy();
    expect(img!.attrs.height).toBeTruthy();
    expect(img!.attrs.alt).toBe("A plain rectangle");
  });
});
