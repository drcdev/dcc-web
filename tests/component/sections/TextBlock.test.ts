import { describe, expect, it } from "vitest";
import TextBlock from "../../../src/components/sections/TextBlock.astro";
import { byName, textOf } from "../html.ts";
import { render } from "./helpers.ts";

describe("TextBlock", () => {
  it("renders a section with an h2 title and the body, and no accessible name", async () => {
    const html = await render(TextBlock, { title: "How I work" }, "<p>Short engagements.</p>");
    const [section] = byName(html, "section");
    expect(byName(html, "section")).toHaveLength(1);
    expect(section!.attrs["aria-label"]).toBeUndefined();
    expect(section!.attrs["aria-labelledby"]).toBeUndefined();
    expect(section!.attrs.role).toBeUndefined();
    expect(byName(html, "h2")).toHaveLength(1);
    expect(textOf(html, "h2")).toBe("How I work");
    expect(html).toContain("Short engagements.");
  });

  it("throws naming the section and the missing title", async () => {
    await expect(render(TextBlock, {}, "<p>Body</p>")).rejects.toThrow(/<TextBlock>.*title/s);
  });

  it("throws naming the section when there is no body", async () => {
    await expect(render(TextBlock, { title: "T" }, "")).rejects.toThrow(/<TextBlock>.*text/s);
  });

  it("names the page file when the page route has recorded it", async () => {
    await expect(render(TextBlock, {}, "<p>x</p>", { pageFile: "services.mdx" })).rejects.toThrow(
      /Page file services\.mdx: <TextBlock>.*title/s,
    );
  });
});
