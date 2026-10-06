// SideImage: one small image as a tile the text wraps beside.
import { describe, expect, it } from "vitest";
import SideImage from "../../../src/components/sections/SideImage.astro";
import { byName } from "../html.ts";
import { optimisedImage, render } from "./helpers.ts";

const text = "<p>2026 award recipient.</p>";

describe("SideImage", () => {
  it("renders the image ahead of the text, outside any paragraph", async () => {
    const html = await render(SideImage, {}, optimisedImage("Alt text") + text);
    expect(byName(html, "img")).toHaveLength(1);
    expect(byName(html, "img")[0]!.attrs.alt).toBe("Alt text");
    expect(byName(html, "p")).toHaveLength(1);
    expect(html.indexOf("<img")).toBeLessThan(html.indexOf("2026 award recipient."));
  });

  it("throws naming the section when there is no text", async () => {
    await expect(render(SideImage, {}, optimisedImage())).rejects.toThrow(/<SideImage>.*text/s);
  });

  it("throws naming the section when there is no image", async () => {
    await expect(render(SideImage, {}, text)).rejects.toThrow(/<SideImage>.*image/s);
  });

  it("throws naming the section when the image has no alt text", async () => {
    await expect(render(SideImage, {}, optimisedImage("") + text)).rejects.toThrow(/<SideImage>.*alt/s);
  });
});
