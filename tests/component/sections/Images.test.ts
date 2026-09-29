// Figure, WideImage and FullImage (contracts/sections.md). The MDX test at the
// end is the plan's risk R8 check: a Markdown image written inside a section is
// optimised by Astro with no import.
import { describe, expect, it } from "vitest";
import Figure from "../../../src/components/sections/Figure.astro";
import FullImage from "../../../src/components/sections/FullImage.astro";
import WideImage from "../../../src/components/sections/WideImage.astro";
import { byName, classList } from "../html.ts";
import { optimisedImage, render } from "./helpers.ts";

const cases = [
  ["Figure", Figure, undefined],
  ["WideImage", WideImage, "kg-width-wide"],
  ["FullImage", FullImage, "kg-width-full"],
] as const;

describe.each(cases)("%s", (name, component, widthClass) => {
  it("renders a figure around the image with an optional caption", async () => {
    const html = await render(component, { caption: "A caption" }, optimisedImage("Alt text"));
    const [figure] = byName(html, "figure");
    expect(byName(html, "figure")).toHaveLength(1);
    expect(byName(html, "img")).toHaveLength(1);
    expect(byName(html, "img")[0]!.attrs.alt).toBe("Alt text");
    expect(byName(html, "img")[0]!.attrs.src).toContain("/_astro/");
    expect(html).toMatch(/<figcaption[^>]*>\s*A caption\s*<\/figcaption>/);
    if (widthClass) expect(classList(figure!)).toContain(widthClass);
    else {
      expect(classList(figure!)).not.toContain("kg-width-wide");
      expect(classList(figure!)).not.toContain("kg-width-full");
    }
  });

  it("omits figcaption without a caption and does not put the image in a paragraph", async () => {
    const html = await render(component, {}, optimisedImage());
    expect(byName(html, "figcaption")).toHaveLength(0);
    expect(byName(html, "p")).toHaveLength(0);
  });

  it("throws naming the section when there is no image", async () => {
    await expect(render(component, {}, "<p>Just text</p>")).rejects.toThrow(new RegExp(`<${name}>.*image`, "s"));
  });

  it("throws naming the section when there are two images", async () => {
    await expect(render(component, {}, optimisedImage() + optimisedImage())).rejects.toThrow(
      new RegExp(`<${name}>.*image`, "s"),
    );
  });

  it("throws naming the section when the image has no alt text", async () => {
    await expect(render(component, {}, optimisedImage(""))).rejects.toThrow(new RegExp(`<${name}>.*alt`, "s"));
  });
});
