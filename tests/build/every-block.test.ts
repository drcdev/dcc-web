// FR-075 and US8: a story that uses every story block and the page sections
// (Figure, TextBlock, Lead, CallToAction) inside a chapter builds and renders each.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureSiteResult } from "./fixture-site.ts";

describe("a story that uses every block", () => {
  let result: FixtureSiteResult;
  let html = "";
  beforeAll(async () => {
    result = await buildFixtureSite([], { projects: ["every-block.mdx"] });
    if (result.ok) html = result.read("projects/every-block/index.html");
  }, 240_000);
  afterAll(() => result?.cleanup());

  it("builds", () => expect(result.message).toBe(""));

  it("renders the seven chapters, the comparison, the demo link and the invitation", () => {
    expect(html.match(/data-chapter(?=[\s>])/g)).toHaveLength(7);
    expect(html).toContain("data-comparison");
    expect(html).toContain("Every block stand-in");
    expect(html).toContain("/contact/?project=every-block");
  });

  it("renders the visual block, the placeholder mark and the draft mark", () => {
    expect(html).toContain("A placeholder screenshot");
    expect(html).toContain("data-placeholder");
    expect(html).toContain("Draft for review");
  });

  it("renders the page sections inside chapters", () => {
    expect(html).toContain("An intro paragraph inside a chapter.");
    expect(html).toContain("A titled block");
    expect(html).toContain("A figure inside a chapter");
    expect(html).toContain("See the source");
  });
});
