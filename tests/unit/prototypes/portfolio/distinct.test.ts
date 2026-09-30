// The three directions differ in at least three of the five FR-001 dimensions
// (data-model invariant 12).
import { describe, expect, it } from "vitest";
import { directions } from "../../../../src/prototypes/portfolio/sample.ts";

const DIMENSIONS = ["storyLayout", "stageMovement", "optionPattern", "indexStructure", "revealStyle"] as const;

describe("direction distinctness", () => {
  const pairs = directions.flatMap((a, i) => directions.slice(i + 1).map((b) => [a, b] as const));

  it("has three pairs to compare", () => {
    expect(pairs).toHaveLength(3);
  });

  it.each(pairs.map((p) => [`${p[0].name} and ${p[1].name}`, p] as const))(
    "%s differ in at least three dimensions",
    (_name, [a, b]) => {
      const differing = DIMENSIONS.filter((d) => a.dimensions[d] !== b.dimensions[d]);
      expect(differing.length).toBeGreaterThanOrEqual(3);
    },
  );

  it("gives every dimension a non-empty value", () => {
    for (const d of directions) for (const k of DIMENSIONS) expect(d.dimensions[k].trim()).not.toBe("");
  });
});
