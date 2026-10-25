// The post topic near-miss check (data-model.md "Free-form topic"; FR-011). No framework needed.
import { describe, expect, it } from "vitest";
import { editDistance, nearMiss } from "../../../../src/content/collections/post-rules.ts";

describe("editDistance", () => {
  it("is 0 for equal strings", () => {
    expect(editDistance("drift", "drift")).toBe(0);
  });
  it("counts insertions, deletions and substitutions", () => {
    expect(editDistance("agentic-ai", "agentic-a1")).toBe(1);
    expect(editDistance("agentic-ai", "agentic-a")).toBe(1);
    expect(editDistance("convergence", "convergance")).toBe(1);
    expect(editDistance("drift", "drfit")).toBe(2);
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("kitten", "sitting")).toBe(3);
  });
});

describe("nearMiss", () => {
  const controlled = ["compliant-data", "technology-teams", "agentic-ai", "healthcare-leadership", "drift", "convergence"];

  it("names the controlled id a close id probably meant", () => {
    expect(nearMiss("convergance", controlled)).toBe("convergence");
    expect(nearMiss("drfit", controlled)).toBe("drift");
    expect(nearMiss("agentic-a", controlled)).toBe("agentic-ai");
    expect(nearMiss("agentic-a1", controlled)).toBe("agentic-ai");
  });

  it("returns undefined for an exact controlled id", () => {
    expect(nearMiss("drift", controlled)).toBeUndefined();
  });

  it("returns undefined for an id that is not close to any controlled id", () => {
    expect(nearMiss("cloud-cost", controlled)).toBeUndefined();
    expect(nearMiss("security", controlled)).toBeUndefined();
  });
});

describe("nearMiss ties", () => {
  it("names the controlled id earlier in the list when two are equally near", () => {
    expect(nearMiss("cat", ["bat", "hat"])).toBe("bat");
    expect(nearMiss("cat", ["hat", "bat"])).toBe("hat");
  });
});
