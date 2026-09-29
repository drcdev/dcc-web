// Component tests for src/components/ThemeToggle.astro via Astro's Container API
// (contracts/theme.md "Toggle"; research R5, R15; FR-008a, FR-012, FR-012a,
// FR-013, FR-022).
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { beforeAll, describe, expect, it } from "vitest";
import ThemeToggle from "../../src/components/ThemeToggle.astro";
import { byName, classList, tags, type Tag } from "./html.ts";

let html = "";

beforeAll(async () => {
  const container = await AstroContainer.create();
  html = await container.renderToString(ThemeToggle);
});

/** Markup between the opening tag and its close tag (non-nested use only). */
function inner(tag: Tag): string {
  const start = tag.index + tag.raw.length;
  return html.slice(start, html.indexOf(`</${tag.name}>`, start));
}

const text = (markup: string) => markup.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const wrapper = () => tags(html).find((t) => "data-theme-switch" in t.attrs)!;
const button = () => byName(html, "button")[0]!;

describe("ThemeToggle structure", () => {
  it("shows the visible label Theme: before one native button", () => {
    const buttons = byName(html, "button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.attrs.type).toBe("button");
    const before = html.slice(wrapper().index, buttons[0]!.index);
    expect(text(before)).toBe("Theme:");
  });

  it('is named "Theme: Dark" by its content (the server-rendered default), not aria-label', () => {
    const b = button();
    expect(b.attrs["aria-label"]).toBeUndefined();
    expect(b.attrs["aria-pressed"]).toBeUndefined();
    const name = tags(inner(b)).find((t) => "data-theme-name" in t.attrs);
    expect(name).toBeDefined();
    expect(classList(name!)).toContain("sr-only");
    expect(text(inner(b)).startsWith("Theme: Dark")).toBe(true);
  });

  it("holds decorative moon and sun icons and the word System, one state shown at a time", () => {
    const b = inner(button());
    const svgs = byName(b, "svg");
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg.attrs["aria-hidden"]).toBe("true");
    const states = tags(b).filter((t) => "data-theme-state" in t.attrs);
    expect(states.map((t) => t.attrs["data-theme-state"]).sort()).toEqual(["dark", "light", "system"]);
    for (const state of states) {
      expect(state.attrs["aria-hidden"]).toBe("true");
      const shown = !classList(state).includes("hidden");
      expect(shown).toBe(state.attrs["data-theme-state"] === "dark");
    }
    expect(text(b)).toContain("System");
  });

  it("has a visually hidden polite live region, empty until the choice changes", () => {
    const regions = tags(html).filter((t) => t.attrs["aria-live"] === "polite");
    expect(regions).toHaveLength(1);
    expect(classList(regions[0]!)).toContain("sr-only");
    expect(text(inner(regions[0]!))).toBe("");
    expect(regions[0]!.index).toBeGreaterThan(button().index);
  });
});

describe("ThemeToggle without JavaScript", () => {
  it("is hidden unless the js class is present", () => {
    const classes = classList(wrapper());
    expect(classes).toContain("hidden");
    expect(classes.some((c) => /^js:(inline-)?flex$/.test(c))).toBe(true);
  });

  it("uses no inline event handlers (CSP)", () => {
    for (const t of tags(html)) {
      expect(Object.keys(t.attrs).filter((a) => a.startsWith("on"))).toEqual([]);
    }
  });
});
