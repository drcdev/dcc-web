// PortfolioFilter markup before any script runs (contracts/islands.md; FR-022, FR-035, FR-036).
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "../../sections/helpers.ts";
import { byName, classList, tags } from "../../html.ts";
import PortfolioFilter from "../../../../src/prototypes/portfolio/shared/PortfolioFilter.astro";
import { allEntries } from "../../../../src/prototypes/portfolio/sample.ts";

const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const slot = allEntries
  .map((e) => `<li data-entry data-themes="${e.themes.join("|")}">${e.title}</li>`)
  .join("");

let html = "";
beforeAll(async () => {
  html = await render(PortfolioFilter, { entries: allEntries }, `<ul>${slot}</ul>`);
});

describe("PortfolioFilter", () => {
  it("is a portfolio-filter custom element", () => {
    expect(byName(html, "portfolio-filter")).toHaveLength(1);
  });

  it("hides the control group without JavaScript", () => {
    const group = tags(html).find((t) => t.attrs.role === "group");
    expect(group).toBeDefined();
    expect(group!.attrs["aria-labelledby"]).toBeTruthy();
    expect(html).toContain(`id="${group!.attrs["aria-labelledby"]}"`);
    const cls = classList(group!);
    expect(cls).toContain("hidden");
    expect(cls).toContain("js:flex");
  });

  it("has a polite live status hidden without JavaScript", () => {
    const status = tags(html).find((t) => t.attrs.role === "status");
    expect(status).toBeDefined();
    expect(status!.name).toBe("p");
    expect(status!.attrs["aria-live"]).toBe("polite");
    expect(classList(status!)).toEqual(expect.arrayContaining(["hidden", "js:block"]));
    expect(plain(html)).toContain("Showing all 5 projects.");
  });

  it("keeps every entry in the HTML with data-themes", () => {
    const entries = tags(html).filter((t) => "data-entry" in t.attrs);
    expect(entries).toHaveLength(5);
    for (const e of entries) expect(e.attrs["data-themes"]).toBeTruthy();
  });

  it("has a hidden no-match message and clear button", () => {
    expect(plain(html)).toContain("No projects match this theme.");
    const empty = tags(html).find((t) => "data-filter-empty" in t.attrs);
    expect(empty).toBeDefined();
    expect("hidden" in empty!.attrs || classList(empty!).includes("hidden")).toBe(true);
    expect(plain(html)).toContain("Show all projects");
  });

  it("uses native buttons with pressed state, names and a 24px target", () => {
    const buttons = byName(html, "button");
    const pressable = buttons.filter((b) => "aria-pressed" in b.attrs);
    // One per theme plus "All projects".
    expect(pressable.length).toBe(6 + 1);
    for (const b of buttons) {
      expect(b.attrs.type).toBe("button");
      expect(classList(b).some((c) => c.startsWith("min-h-"))).toBe(true);
      expect(classList(b).some((c) => c.startsWith("min-w-"))).toBe(true);
    }
    const all = pressable.find((b) => "data-filter-all" in b.attrs);
    expect(all?.attrs["aria-pressed"]).toBe("true");
    expect(plain(html)).toContain("All projects");
    for (const theme of ["AI integration", "Web", "Mobile"]) expect(plain(html)).toContain(theme);
  });
});
