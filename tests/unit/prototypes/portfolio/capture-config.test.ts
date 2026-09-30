// The screenshot capture is a standalone Playwright config that `verify` never
// runs (specs/006-portfolio-design-directions/tasks.md T075).
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CONFIG = "tests/design/portfolio/capture.config.ts";
const SPEC = "tests/design/portfolio/capture.spec.ts";

describe("portfolio capture setup", () => {
  it("has a standalone capture config and spec", () => {
    expect(existsSync(CONFIG)).toBe(true);
    expect(existsSync(SPEC)).toBe(true);
  });

  it("is not referenced by playwright.config.ts, so verify never runs it", () => {
    const main = readFileSync("playwright.config.ts", "utf8");
    expect(main).not.toMatch(/tests\/design|capture/);
    const pkg = readFileSync("package.json", "utf8");
    expect(pkg).not.toMatch(/capture\.config/);
  });

  it("enumerates exactly the 24 named combinations", async () => {
    const { CAPTURES } = await import("../../../design/portfolio/captures");
    const names = CAPTURES.map((c: { name: string }) => c.name);
    const expected: string[] = [];
    for (const d of ["a", "b", "c"])
      for (const p of ["index", "story"])
        for (const w of ["phone", "desktop"])
          for (const t of ["light", "dark"]) expected.push(`${d}-${p}-${w}-${t}.webp`);
    expect(names).toHaveLength(24);
    expect(new Set(names).size).toBe(24);
    expect([...names].sort()).toEqual([...expected].sort());
  });

  it("uses 390 and 1280 px widths", async () => {
    const { CAPTURES } = await import("../../../design/portfolio/captures");
    const widths = new Set(CAPTURES.map((c: { width: number }) => c.width));
    expect([...widths].sort((a, b) => a - b)).toEqual([390, 1280]);
  });

  it("the spec uses the shared list, sharp and the 600 KB limit", () => {
    const spec = readFileSync(SPEC, "utf8");
    expect(spec).toContain("./captures");
    expect(spec).toContain("sharp");
    expect(spec).toContain("docs/design/portfolio");
    expect(spec).toMatch(/MAX_BYTES/);
  });
});
