// The real architecture part files (specs/036-technology-architecture-diagram/contracts/part-files.md
// rows P08, P10, P11). Read through architectureParts, so rewording a part never needs a test edit.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { layout } from "../../../src/lib/architecture/layout.ts";
import { checkParts } from "../../../src/lib/architecture/check.ts";
import { architectureParts } from "../../helpers/content.ts";

describe("architecture part files", () => {
  it("P08: have exactly the layout's ids and names that join the label lines", () => {
    expect(architectureParts.map((p) => p.id).sort()).toEqual(layout.parts.map((p) => p.id).sort());
    expect(() => checkParts(layout, architectureParts)).not.toThrow();
  });

  it("P10: every part but the browser has a source tracked by git; the browser has none", () => {
    for (const part of architectureParts) {
      if (part.id === "browser") {
        expect(part.source, "browser has no source").toBeUndefined();
        continue;
      }
      expect(part.source, `${part.id} has a source`).toBeTruthy();
      const tracked = execFileSync("git", ["ls-files", "--", part.source!], { encoding: "utf-8" }).trim();
      expect(tracked, `${part.source} is tracked by git`).not.toBe("");
    }
  });

  it("P11: each explanation is two to five sentences and at most 100 words", () => {
    for (const part of architectureParts) {
      const text = part.body.trim();
      const sentences = text.split(/[.!?]+(?:\s+|$)/).filter(Boolean);
      expect(sentences.length, `${part.id} sentences`).toBeGreaterThanOrEqual(2);
      expect(sentences.length, `${part.id} sentences`).toBeLessThanOrEqual(5);
      expect(text.split(/\s+/).length, `${part.id} words`).toBeLessThanOrEqual(100);
    }
  });
});
