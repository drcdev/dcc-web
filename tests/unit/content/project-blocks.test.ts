// The story building block registry and prop schemas (contracts/project-file.md).
import { describe, expect, it } from "vitest";
import { storyBlockNames } from "../../../src/components/project/blocks/index.ts";
import { storyBlockSchemas } from "../../../src/components/project/blocks/schemas.ts";
import { stageIds } from "../../../src/lib/content/stages.ts";

describe("story block registry", () => {
  it("is the closed set of five blocks", () => {
    expect([...storyBlockNames]).toEqual(["Chapter", "Visual", "OptionComparison", "Demo", "Invitation"]);
  });

  it("has a prop schema for each block", () => {
    expect(Object.keys(storyBlockSchemas).sort()).toEqual([...storyBlockNames].sort());
  });
});

describe("story block prop schemas", () => {
  it("accepts every stage for Chapter, with optional visual and draft", () => {
    for (const stage of stageIds) expect(storyBlockSchemas.Chapter.safeParse({ stage }).success).toBe(true);
    expect(storyBlockSchemas.Chapter.safeParse({ stage: "problem", visual: "demo", draft: true }).success).toBe(true);
  });

  it("rejects an unknown stage, an unknown prop and an empty visual for Chapter", () => {
    expect(storyBlockSchemas.Chapter.safeParse({ stage: "epilogue" }).success).toBe(false);
    expect(storyBlockSchemas.Chapter.safeParse({ stage: "problem", extra: 1 }).success).toBe(false);
    expect(storyBlockSchemas.Chapter.safeParse({ stage: "problem", visual: "" }).success).toBe(false);
  });

  it("requires a name for Visual", () => {
    expect(storyBlockSchemas.Visual.safeParse({ name: "screenshot" }).success).toBe(true);
    expect(storyBlockSchemas.Visual.safeParse({}).success).toBe(false);
  });

  it("takes no props for OptionComparison, Demo and Invitation", () => {
    for (const name of ["OptionComparison", "Demo", "Invitation"] as const) {
      expect(storyBlockSchemas[name].safeParse({}).success).toBe(true);
      expect(storyBlockSchemas[name].safeParse({ x: 1 }).success).toBe(false);
    }
  });
});
