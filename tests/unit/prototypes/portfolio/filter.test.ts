import { describe, expect, it } from "vitest";
import { matches, parseThemeParam, themesOf } from "../../../../src/prototypes/portfolio/filter.ts";

const entries = [
  { themes: ["Web", "AI integration"] },
  { themes: ["Mobile"] },
  { themes: ["Web", "Design systems"] },
];

describe("themesOf", () => {
  it("returns sorted unique themes", () => {
    expect(themesOf(entries)).toEqual(["AI integration", "Design systems", "Mobile", "Web"]);
  });
  it("returns an empty list for no entries", () => {
    expect(themesOf([])).toEqual([]);
  });
});

describe("matches", () => {
  it("shows everything when the theme is null", () => {
    for (const e of entries) expect(matches(e, null)).toBe(true);
  });
  it("matches a listed theme exactly and case-sensitively", () => {
    expect(matches(entries[0]!, "Web")).toBe(true);
    expect(matches(entries[1]!, "Web")).toBe(false);
    expect(matches(entries[0]!, "web")).toBe(false);
  });
});

describe("parseThemeParam", () => {
  const known = ["Mobile", "Web"];
  it("reads a known theme", () => {
    expect(parseThemeParam("?theme=Mobile", known)).toEqual({ theme: "Mobile", unknown: false });
    expect(parseThemeParam("?x=1&theme=Web", known)).toEqual({ theme: "Web", unknown: false });
  });
  it("decodes an encoded theme", () => {
    expect(parseThemeParam("?theme=AI%20integration", ["AI integration"])).toEqual({
      theme: "AI integration",
      unknown: false,
    });
  });
  it("flags an unknown theme", () => {
    expect(parseThemeParam("?theme=Nope", known)).toEqual({ theme: null, unknown: true });
    expect(parseThemeParam("?theme=", known)).toEqual({ theme: null, unknown: true });
  });
  it("returns null when the parameter is missing", () => {
    expect(parseThemeParam("", known)).toEqual({ theme: null, unknown: false });
    expect(parseThemeParam("?other=1", known)).toEqual({ theme: null, unknown: false });
  });
});
