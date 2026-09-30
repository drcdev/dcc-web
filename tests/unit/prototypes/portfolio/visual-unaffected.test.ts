// The visual project never snapshots a prototype page (FR-054). File reads only.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("visual project", () => {
  it("snapshots no /design/ path", () => {
    const source = readFileSync("tests/e2e/visual.spec.ts", "utf8");
    expect(source).not.toMatch(/\/design\//);
    expect(source).not.toMatch(/portfolio/);
  });
});
