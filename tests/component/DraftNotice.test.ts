// DraftNotice: a plain paragraph, not a landmark or heading (FR-015;
// contracts/page-dom.md).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import DraftNotice from "../../src/components/page/DraftNotice.astro";
import { byName, tags } from "./html.ts";

let html = "";
beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(DraftNotice);
});

describe("DraftNotice", () => {
  it("is one <p data-draft-notice> in plain language", () => {
    const p = byName(html, "p");
    expect(p).toHaveLength(1);
    expect("data-draft-notice" in p[0]!.attrs).toBe(true);
    expect(html).toContain("Draft.");
    expect(html).toContain("placeholder");
  });

  it("has no role, heading or landmark", () => {
    expect(tags(html).some((t) => "role" in t.attrs)).toBe(false);
    for (const name of ["h1", "h2", "h3", "section", "aside", "nav", "header", "footer", "main"]) {
      expect(byName(html, name)).toHaveLength(0);
    }
  });

  it("opts out of prose styling", () => {
    expect(byName(html, "p")[0]!.attrs.class).toContain("not-prose");
  });
});

describe("DraftNotice message prop (posts reuse it)", () => {
  it("replaces the wording after the bold Draft. lead-in and keeps the structure", async () => {
    const container = await AstroContainer.create();
    const custom = await container.renderToString(DraftNotice, {
      props: { message: "This post is a draft and is not on the live site." },
    });
    expect(custom).toContain("This post is a draft and is not on the live site.");
    expect(custom).not.toContain("placeholder");
    expect(custom).toMatch(/<strong[^>]*>Draft\.<\/strong>/);
    expect("data-draft-notice" in byName(custom, "p")[0]!.attrs).toBe(true);
    expect(byName(custom, "p")[0]!.attrs.class).toBe(byName(html, "p")[0]!.attrs.class);
  });

  it("keeps the default wording when no message is given", () => {
    expect(html).toContain("This page is a placeholder and will change.");
  });
});

