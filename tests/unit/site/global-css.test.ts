// The wide and full-width image styles and the page container (research R9;
// FR-010, FR-011). The clamp and the container-width unit are what keep them
// from causing horizontal scroll on desktop, so the test pins both.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(fileURLToPath(new URL("../../../src/styles/global.css", import.meta.url)), "utf-8");

function rule(selector: string): string {
  const match = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`).exec(css);
  return match?.[1] ?? "";
}

describe("global.css section styles", () => {
  it("makes the full-width page wrapper an inline-size container so cqw excludes the scrollbar", () => {
    expect(rule(".page-container")).toMatch(/container-type:\s*inline-size/);
  });

  it("does not put containment on the body, which would stop its background covering the window", () => {
    expect(css).not.toMatch(/(^|\n)body\s*\{[^}]*container-type/);
  });

  it("defines kg-width-wide with a clamped negative margin", () => {
    expect(css).toContain(".kg-width-wide");
    expect(css).toMatch(/max\(\s*calc\(-12vw \+ 2rem\)\s*,\s*calc\(50% - 50cqw\)\s*\)/);
  });

  it("defines kg-width-full with a cqw-based width, never 100vw", () => {
    const full = rule(".kg-width-full");
    expect(full).toMatch(/width:\s*100cqw/);
    expect(full).toMatch(/margin-inline:\s*calc\(50% - 50cqw\)/);
    expect(full).not.toContain("100vw");
  });

  it("centres captions of wide and full images", () => {
    expect(css).toMatch(/\.kg-width-wide figcaption/);
    expect(css).toMatch(/\.kg-width-full figcaption/);
  });
});
