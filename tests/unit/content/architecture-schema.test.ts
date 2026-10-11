// Part schema rows P01 and P02 (contracts/part-files.md), with neutral example data.
import { describe, expect, it } from "vitest";
import { architectureSchema } from "../../../src/content/schemas/architecture.ts";

describe("architectureSchema", () => {
  it("accepts a name with or without a source", () => {
    expect(architectureSchema.safeParse({ name: "Example part" }).success).toBe(true);
    expect(architectureSchema.safeParse({ name: "Example part", source: "some/path.ts" }).success).toBe(true);
  });

  it("P01: rejects a missing or blank name", () => {
    expect(architectureSchema.safeParse({}).success).toBe(false);
    expect(architectureSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("P02: rejects an unknown key and names it", () => {
    const result = architectureSchema.safeParse({ name: "Example part", colour: "red" });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("colour");
  });
});
