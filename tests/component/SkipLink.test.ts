// Component tests for src/components/SkipLink.astro (contracts/shell-dom.md; FR-010).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import SkipLink from "../../src/components/SkipLink.astro";
import { byName, classList, tags } from "./html.ts";

let html = "";

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(SkipLink);
});

describe("SkipLink", () => {
  it('is a single link to #main with the text "Skip to main content"', () => {
    const links = byName(html, "a");
    expect(links).toHaveLength(1);
    expect(links[0]!.attrs.href).toBe("#main");
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    expect(text).toBe("Skip to main content");
  });

  it("is the only element rendered (nothing focusable before it)", () => {
    expect(tags(html).filter((t) => t.name !== "a")).toHaveLength(0);
  });

  it("is visually hidden until focused", () => {
    const classes = classList(byName(html, "a")[0]!);
    expect(classes).toContain("sr-only");
    expect(classes).toContain("focus:not-sr-only");
  });

  it("appears at the top of the page, above other content, when focused", () => {
    const classes = classList(byName(html, "a")[0]!);
    expect(classes.some((c) => c === "focus:fixed" || c === "focus:absolute")).toBe(true);
    expect(classes.some((c) => c === "focus:top-0" || /^focus:top-\d/.test(c))).toBe(true);
    expect(classes.some((c) => /^focus:z-/.test(c))).toBe(true);
  });

  it("has no tabindex (keeps natural order) and no aria-hidden", () => {
    const link = byName(html, "a")[0]!;
    expect(link.attrs.tabindex).toBeUndefined();
    expect(link.attrs["aria-hidden"]).toBeUndefined();
  });
});
