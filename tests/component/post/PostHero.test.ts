// PostHero (FR-019, FR-052): the feature image, full width, through astro:assets,
// loaded eagerly at high priority because it is the largest paint on the page.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostHero from "../../../src/components/post/PostHero.astro";
import sample from "../../fixtures/pages/images/sample.png";
import { byName } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("PostHero", () => {
  it("renders one image with alt text, size, eager loading and high priority", async () => {
    const html = await container.renderToString(PostHero, { props: { image: { src: sample, alt: "A plain diagram" } } });
    const imgs = byName(html, "img");
    expect(imgs).toHaveLength(1);
    const img = imgs[0]!;
    expect(img.attrs.alt).toBe("A plain diagram");
    expect(img.attrs.width).toBeTruthy();
    expect(img.attrs.height).toBeTruthy();
    expect(img.attrs.loading).toBe("eager");
    expect(img.attrs.fetchpriority).toBe("high");
  });

  it("is not wrapped in a link", async () => {
    const html = await container.renderToString(PostHero, { props: { image: { src: sample, alt: "x" } } });
    expect(byName(html, "a")).toHaveLength(0);
  });
});
