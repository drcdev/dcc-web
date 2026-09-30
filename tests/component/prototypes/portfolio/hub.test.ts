// The portfolio directions hub (T067; FR-002, FR-006, FR-007).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import Hub from "../../../../src/pages/design/portfolio/index.astro";
import { byName, meta, textOf } from "../../html.ts";
import { directions } from "../../../../src/prototypes/portfolio/sample.ts";

const ORIGIN = "https://example.test";
let html = "";

beforeAll(async () => {
  const container = await AstroContainer.create({ astroConfig: { site: ORIGIN } });
  html = await container.renderToString(Hub, { request: new Request(`${ORIGIN}/design/portfolio/`) });
});

describe("portfolio hub", () => {
  it("has the h1 and is not indexable", () => {
    expect(byName(html, "h1")).toHaveLength(1);
    expect(textOf(html, "h1")).toContain("Portfolio design directions");
    expect(meta(html, "name", "robots")[0]?.attrs.content).toMatch(/noindex/);
  });

  it("shows each direction with name, summary and links to its index and story", () => {
    const hrefs = byName(html, "a").map((a) => a.attrs.href);
    const text = html.replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");
    expect(directions).toHaveLength(3);
    for (const d of directions) {
      expect(text).toContain(d.name);
      expect(text).toContain(d.summary);
      expect(hrefs).toContain(d.indexPath);
      expect(hrefs).toContain(d.storyPath);
    }
  });
});
