// The career timeline filter's pure logic (specs/041-career-timeline US3; FR-009 to FR-013).
import { describe, expect, it } from "vitest";
import { applyChoice, matchingSteps, statusText, usedCategories, type FilterStep } from "../../../src/lib/content/career-filter.ts";

const steps: FilterStep[] = [
  { id: "a", categories: ["achievements", "leadership"] },
  { id: "b", categories: ["achievements"] },
  { id: "c", categories: [] },
  { id: "d", categories: ["awards"] },
];

describe("usedCategories", () => {
  it("lists only the categories some step uses, in the fixed order", () => {
    expect(usedCategories(steps)).toEqual(["achievements", "leadership", "awards"]);
    expect(usedCategories([{ id: "x", categories: ["awards", "achievements"] }])).toEqual(["achievements", "awards"]);
    expect(usedCategories([{ id: "x", categories: [] }])).toEqual([]);
    expect(usedCategories([])).toEqual([]);
  });
});

describe("matchingSteps", () => {
  it("returns the ids of steps holding the category, counted in steps", () => {
    expect(matchingSteps(steps, "achievements")).toEqual(["a", "b"]);
    expect(matchingSteps(steps, "awards")).toEqual(["d"]);
  });
});

describe("statusText", () => {
  it("reads for all, one match and many matches", () => {
    expect(statusText("all", 4, 6)).toBe("Showing all 6 roles.");
    expect(statusText("awards", 1, 6)).toBe("1 of 6 roles has awards.");
    expect(statusText("achievements", 2, 6)).toBe("2 of 6 roles have achievements.");
    expect(statusText("leadership", 0, 6)).toBe("0 of 6 roles have leadership.");
  });
});

describe("applyChoice", () => {
  it("does nothing for the already selected choice", () => {
    expect(applyChoice("all", "all", steps)).toBeNull();
    expect(applyChoice("awards", "awards", steps)).toBeNull();
  });

  it("opens and marks matches and dithers the rest", () => {
    const plan = applyChoice("all", "achievements", steps)!;
    expect(plan.choice).toBe("achievements");
    expect(plan.status).toBe("2 of 4 roles have achievements.");
    expect(plan.steps).toEqual([
      { id: "a", open: true, dithered: false, match: true },
      { id: "b", open: true, dithered: false, match: true },
      { id: "c", open: false, dithered: true, match: false },
      { id: "d", open: false, dithered: true, match: false },
    ]);
  });

  it("is a fresh plan for every step whatever came before", () => {
    expect(applyChoice("achievements", "awards", steps)!.steps.map((s) => s.open)).toEqual([false, false, false, true]);
  });

  it("resets everything on all: closed, undithered, unmarked", () => {
    const plan = applyChoice("awards", "all", steps)!;
    expect(plan.status).toBe("Showing all 4 roles.");
    expect(plan.steps.every((s) => !s.open && !s.dithered && !s.match)).toBe(true);
  });
});
