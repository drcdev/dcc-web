// PostImage: what a Markdown image in a post body renders as (specs/037 tasks T075). The post route
// hands it to MDX as `img`, so `![alt](./images/x.png)` keeps working with no import and a phone
// downloads a file near its own width instead of the original.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import PostImage from "../../../src/components/post/PostImage.astro";
import sample from "../../fixtures/assets/sample.png";
import { byName } from "../html.ts";

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

describe("PostImage", () => {
  it("renders one optimised image with a srcset no wider than the original, a sizes value and its alt text", async () => {
    const html = await container.renderToString(PostImage, { props: { src: sample, alt: "A plain diagram" } });
    const imgs = byName(html, "img");
    expect(imgs).toHaveLength(1);
    const img = imgs[0]!;
    expect(img.attrs.alt).toBe("A plain diagram");
    expect(img.attrs.width).toBe(String(sample.width));
    expect(img.attrs.height).toBe(String(sample.height));
    expect(img.attrs.loading).toBe("lazy");
    expect(img.attrs.sizes).toBe("(min-width: 1280px) 1280px, calc(100vw - 2rem)");
    const widths = (img.attrs.srcset ?? "").split(",").map((candidate) => Number(/(\d+)w\s*$/.exec(candidate.trim())?.[1]));
    expect(widths.length).toBeGreaterThan(0);
    expect(Math.min(...widths)).toBeLessThanOrEqual(360);
    expect(Math.max(...widths)).toBeLessThanOrEqual(sample.width);
    expect(img.attrs.style).toBeUndefined();
  });

  it("renders a remote or public image as a plain img with its alt text", async () => {
    const html = await container.renderToString(PostImage, { props: { src: "/files/plain.png", alt: "A plain picture" } });
    const [img] = byName(html, "img");
    expect(img!.attrs.src).toBe("/files/plain.png");
    expect(img!.attrs.alt).toBe("A plain picture");
    expect(img!.attrs.srcset).toBeUndefined();
  });
});
