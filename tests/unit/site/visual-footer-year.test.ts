import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FROZEN_FOOTER_YEAR, freezeYearText } from "../../e2e/footer-year";

// The visual project renders the footer with a fixed year so a new calendar year cannot fail
// its shots. These cases pin the pure text rewrite and the fact that every shot goes through it.

describe("freezeYearText", () => {
  it("freezes on 2026, the year in the committed baselines", () => {
    expect(FROZEN_FOOTER_YEAR).toBe(2026);
  });

  it("replaces the year and leaves the whitespace and the rest untouched", () => {
    expect(freezeYearText("\n  © 2031 Don Coleman. All rights reserved.\n")).toBe(
      "\n  © 2026 Don Coleman. All rights reserved.\n",
    );
  });

  it("returns null when the text has no copyright year, so the helper can fail loudly", () => {
    expect(freezeYearText("Don Coleman. All rights reserved.")).toBeNull();
  });
});

describe("visual.spec.ts", () => {
  const source = readFileSync(fileURLToPath(new URL("../../e2e/visual.spec.ts", import.meta.url)), "utf-8");

  it("freezes the footer year in open(), after page.goto", () => {
    const start = source.indexOf("async function open(");
    expect(start).toBeGreaterThan(-1);
    const body = source.slice(start);
    const goto = body.indexOf("page.goto(");
    const freeze = body.indexOf("await freezeFooterYear(page)");
    expect(goto).toBeGreaterThan(-1);
    expect(freeze).toBeGreaterThan(goto);
  });

  it("navigates in one place only, so no shot skips the freeze", () => {
    expect(source.split("page.goto(").length - 1).toBe(1);
  });
});
