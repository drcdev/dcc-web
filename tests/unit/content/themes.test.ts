// Unit tests for theme keys, the derived theme list and the filter rule
// (data-model.md "Theme (derived)").
import { describe, expect, it } from "vitest";
import { matches, parseThemeParam, themeKey, themesOf } from "../../../src/lib/content/themes.ts";

describe("themeKey", () => {
  it.each([
    ["AI integration", "ai-integration"],
    ["ai  integration", "ai-integration"],
    ["  Web   Performance ", "web-performance"],
    ["Tooling", "tooling"],
  ])("maps %j to %j", (raw, key) => {
    expect(themeKey(raw)).toBe(key);
  });
});

describe("themesOf", () => {
  it("dedupes spelling variants, keeps the first spelling as the label and sorts by label", () => {
    const themes = themesOf([
      { themes: ["Tooling", "AI integration"] },
      { themes: ["ai  integration", "Accessibility"] },
    ]);
    expect(themes).toEqual([
      { key: "accessibility", label: "Accessibility" },
      { key: "ai-integration", label: "AI integration" },
      { key: "tooling", label: "Tooling" },
    ]);
  });

  it("returns nothing for no entries", () => {
    expect(themesOf([])).toEqual([]);
  });
});

describe("parseThemeParam", () => {
  const known = themesOf([{ themes: ["AI integration", "Tooling"] }]);

  it("reads a known key", () => {
    expect(parseThemeParam("?theme=tooling", known)).toEqual({ key: "tooling", unknown: false });
  });
  it("normalises mixed case and %20", () => {
    expect(parseThemeParam("?theme=AI%20Integration", known)).toEqual({ key: "ai-integration", unknown: false });
    expect(parseThemeParam("?theme=TOOLING", known)).toEqual({ key: "tooling", unknown: false });
  });
  it("flags an unknown value", () => {
    expect(parseThemeParam("?theme=nope", known)).toEqual({ key: null, unknown: true });
  });
  it("treats a missing parameter as no filter", () => {
    expect(parseThemeParam("", known)).toEqual({ key: null, unknown: false });
    expect(parseThemeParam("?other=1", known)).toEqual({ key: null, unknown: false });
  });
});

describe("matches", () => {
  const entry = { themes: ["AI integration", "Tooling"] };
  it("matches everything when no theme is selected", () => {
    expect(matches(entry, null)).toBe(true);
  });
  it("matches by key, ignoring spelling", () => {
    expect(matches(entry, "ai-integration")).toBe(true);
    expect(matches({ themes: ["ai  integration"] }, "ai-integration")).toBe(true);
  });
  it("does not match an unlisted theme", () => {
    expect(matches(entry, "accessibility")).toBe(false);
  });
});
