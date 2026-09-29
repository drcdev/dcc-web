// FeatureImage: an optimised <img> with alt text and an optional caption
// (contracts/page-dom.md; FR-004).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import FeatureImage from "../../src/components/page/FeatureImage.astro";
import sample from "../fixtures/pages/images/sample.png";
import { byName } from "./html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("FeatureImage", () => {
  it("renders a figure with the image, its alt text and a caption", async () => {
    const html = await container.renderToString(FeatureImage, {
      props: { src: sample, alt: "A stage", caption: "Photo from 2025" },
    });
    expect(byName(html, "figure")).toHaveLength(1);
    const [img] = byName(html, "img");
    expect(img!.attrs.alt).toBe("A stage");
    expect(img!.attrs.width).toBeTruthy();
    expect(img!.attrs.height).toBeTruthy();
    expect(html).toMatch(/<figcaption[^>]*>\s*Photo from 2025\s*<\/figcaption>/);
  });

  it("omits the caption element when there is no caption", async () => {
    const html = await container.renderToString(FeatureImage, { props: { src: sample, alt: "A stage" } });
    expect(byName(html, "figcaption")).toHaveLength(0);
    expect(byName(html, "img")[0]!.attrs.alt).toBe("A stage");
  });
});
