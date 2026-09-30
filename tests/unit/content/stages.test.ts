// Unit tests for the seven stages (data-model.md "Stage and Chapter").
import { describe, expect, it } from "vitest";
import { stages } from "../../../src/lib/content/stages.ts";

describe("stages", () => {
  it("lists the seven stages in order with their headings", () => {
    expect(stages.map((s) => [s.id, s.heading])).toEqual([
      ["problem", "The problem"],
      ["constraints", "What made it hard"],
      ["options", "Options considered"],
      ["built", "What I built"],
      ["outcome", "How it turned out"],
      ["lessons", "What I'd do differently"],
      ["invitation", "Have a problem like this?"],
    ]);
  });
  it("numbers the stages 1 to 7", () => {
    expect(stages.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
