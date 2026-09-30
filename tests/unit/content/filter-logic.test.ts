// The pure rules behind the theme filter island (contracts/filter-island.md
// "Behaviour"; FR-014). The island only wires these to the page.
import { describe, expect, it } from "vitest";
import { filterStatus, parseThemeParam, themeSearch, type Theme } from "../../../src/lib/content/themes.ts";

const known: Theme[] = [
  { key: "ai-integration", label: "AI integration" },
  { key: "tooling", label: "Tooling" },
];

describe("filterStatus", () => {
  it("counts all projects, singular and plural", () => {
    expect(filterStatus({ shown: 3, total: 3, theme: null, unknown: false })).toBe("Showing all 3 projects.");
    expect(filterStatus({ shown: 1, total: 1, theme: null, unknown: false })).toBe("Showing all 1 project.");
  });

  it("names the theme and counts the matches, singular and plural", () => {
    const theme = known[0]!;
    expect(filterStatus({ shown: 2, total: 5, theme, unknown: false })).toBe("Showing 2 projects about AI integration.");
    expect(filterStatus({ shown: 1, total: 5, theme, unknown: false })).toBe("Showing 1 project about AI integration.");
  });

  it("says no project matches an unknown theme, without repeating the address value", () => {
    expect(filterStatus({ shown: 0, total: 5, theme: null, unknown: true })).toBe("No projects match this theme.");
  });
});

describe("themeSearch", () => {
  it("sets ?theme= to the key", () => {
    expect(themeSearch("", "tooling")).toBe("?theme=tooling");
  });

  it("keeps other parameters and replaces an old theme", () => {
    expect(themeSearch("?a=1&theme=old", "tooling")).toBe("?a=1&theme=tooling");
  });

  it("removes the theme, leaving no bare ? behind", () => {
    expect(themeSearch("?theme=tooling", null)).toBe("");
    expect(themeSearch("?a=1&theme=tooling", null)).toBe("?a=1");
  });
});

describe("markup in ?theme= (FR-014)", () => {
  const evil = "<img src=x onerror=alert(1)>";

  it("is an unknown theme, never a key", () => {
    expect(parseThemeParam(`?theme=${encodeURIComponent(evil)}`, known)).toEqual({ key: null, unknown: true });
  });

  it("does not reach the status text", () => {
    const parsed = parseThemeParam(`?theme=${encodeURIComponent(evil)}`, known);
    const text = filterStatus({ shown: 0, total: 2, theme: null, unknown: parsed.unknown });
    expect(text).not.toContain("<");
    expect(text).not.toContain("onerror");
  });
});
