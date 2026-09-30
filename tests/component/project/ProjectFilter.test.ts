import { describe, expect, it } from "vitest";
import ProjectFilter from "../../../src/components/project/ProjectFilter.astro";
import { byName } from "../html.ts";
import { render } from "../sections/helpers.ts";

const themes = [
  { key: "ai-integration", label: "AI integration" },
  { key: "macos", label: "macOS" },
];
const list = '<li data-project="a">A</li><li data-project="b">B</li>';

describe("ProjectFilter", () => {
  it("wraps the island element, with the total, and keeps every project in the HTML", async () => {
    const html = await render(ProjectFilter, { themes, total: 2 }, list);
    const [island] = byName(html, "project-filter");
    expect(island!.attrs["data-total"]).toBe("2");
    expect(island!.attrs["data-ready"]).toBeUndefined();
    expect(byName(html, "li").filter((t) => "data-project" in t.attrs)).toHaveLength(2);
    expect(byName(html, "ul").some((t) => "data-project-list" in t.attrs)).toBe(true);
  });

  it("hides the controls, status and empty message until the island is ready", async () => {
    const html = await render(ProjectFilter, { themes, total: 2 }, list);
    const group = byName(html, "div").find((t) => t.attrs.role === "group")!;
    expect(group.attrs.hidden).toBeDefined();
    expect(byName(html, "p").find((t) => "data-filter-status" in t.attrs)!.attrs.hidden).toBeDefined();
    expect(byName(html, "div").find((t) => "data-filter-empty" in t.attrs)!.attrs.hidden).toBeDefined();
    expect(html).not.toMatch(/js:/);
  });

  it("names the group and has an All button plus one button per theme", async () => {
    const html = await render(ProjectFilter, { themes, total: 2 }, list);
    const group = byName(html, "div").find((t) => t.attrs.role === "group")!;
    const label = group.attrs["aria-labelledby"]!;
    expect(html).toMatch(new RegExp(`id="${label}"[^>]*>[^<]*Filter by theme`));
    const buttons = byName(html, "button");
    expect(buttons.filter((t) => "data-filter-all" in t.attrs)).toHaveLength(1);
    const themeButtons = buttons.filter((t) => t.attrs["data-theme"]);
    expect(themeButtons.map((t) => t.attrs["data-theme"])).toEqual(["ai-integration", "macos"]);
    expect(buttons.every((t) => t.attrs.type === "button")).toBe(true);
    expect(buttons.filter((t) => "data-filter-all" in t.attrs)[0]!.attrs["aria-pressed"]).toBe("true");
    expect(themeButtons[0]!.attrs["aria-pressed"]).toBe("false");
  });

  it("has a polite status and a clear button in the empty message", async () => {
    const html = await render(ProjectFilter, { themes, total: 2 }, list);
    const status = byName(html, "p").find((t) => "data-filter-status" in t.attrs)!;
    expect(status.attrs.role).toBe("status");
    expect(status.attrs["aria-live"]).toBe("polite");
    expect(html).toContain("Showing all 2 projects.");
    expect(html).toContain("Show all projects");
    expect(byName(html, "button").some((t) => "data-filter-clear" in t.attrs)).toBe(true);
  });
});
