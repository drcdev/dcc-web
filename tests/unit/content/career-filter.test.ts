// The career timeline filter's pure logic (specs/041-career-timeline US3; FR-009 to FR-013).
import { describe, expect, it } from "vitest";
import { categoryIds } from "../../../src/lib/content/career.ts";
import { applyChoice, matchingSteps, statusText, usedCategories, type FilterStep } from "../../../src/lib/content/career-filter.ts";

const steps: FilterStep[] = [
  { id: "a", categories: ["leadership", "volunteer"] },
  { id: "b", categories: ["leadership"] },
  { id: "c", categories: [] },
  { id: "d", categories: ["awards"] },
];

describe("categoryIds", () => {
  it("is exactly leadership, awards, volunteer, in that order (no achievements)", () => {
    expect(categoryIds).toEqual(["leadership", "awards", "volunteer"]);
  });
});

describe("usedCategories", () => {
  it("lists only the categories some step uses, in the fixed order", () => {
    expect(usedCategories(steps)).toEqual(["leadership", "awards", "volunteer"]);
    expect(usedCategories([{ id: "x", categories: ["volunteer", "awards"] }])).toEqual(["awards", "volunteer"]);
    expect(usedCategories([{ id: "x", categories: [] }])).toEqual([]);
    expect(usedCategories([])).toEqual([]);
  });
});

describe("matchingSteps", () => {
  it("returns the ids of steps holding the category, counted in steps", () => {
    expect(matchingSteps(steps, "leadership")).toEqual(["a", "b"]);
    expect(matchingSteps(steps, "awards")).toEqual(["d"]);
    expect(matchingSteps(steps, "volunteer")).toEqual(["a"]);
  });
});

describe("statusText", () => {
  it("reads for all, one match and many matches", () => {
    expect(statusText("all", 4, 6)).toBe("Showing all 6 roles.");
    expect(statusText("awards", 1, 6)).toBe("1 of 6 roles has recognition.");
    expect(statusText("leadership", 2, 6)).toBe("2 of 6 roles have leadership.");
    expect(statusText("leadership", 0, 6)).toBe("0 of 6 roles have leadership.");
  });

  it("reads as volunteer roles for Volunteer, singular for one match", () => {
    expect(statusText("volunteer", 2, 7)).toBe("2 of 7 roles are volunteer roles.");
    expect(statusText("volunteer", 1, 7)).toBe("1 of 7 roles is a volunteer role.");
    expect(statusText("volunteer", 0, 7)).toBe("0 of 7 roles are volunteer roles.");
  });
});

describe("applyChoice", () => {
  it("does nothing for the already selected choice", () => {
    expect(applyChoice("all", "all", steps)).toBeNull();
    expect(applyChoice("awards", "awards", steps)).toBeNull();
  });

  it("opens and marks matches and mutes the rest", () => {
    const plan = applyChoice("all", "leadership", steps)!;
    expect(plan.choice).toBe("leadership");
    expect(plan.status).toBe("2 of 4 roles have leadership.");
    expect(plan.steps).toEqual([
      { id: "a", open: true, muted: false, match: true },
      { id: "b", open: true, muted: false, match: true },
      { id: "c", open: false, muted: true, match: false },
      { id: "d", open: false, muted: true, match: false },
    ]);
  });

  it("opens the volunteer steps and mutes the rest for Volunteer", () => {
    const plan = applyChoice("all", "volunteer", steps)!;
    expect(plan.status).toBe("1 of 4 roles is a volunteer role.");
    expect(plan.steps).toEqual([
      { id: "a", open: true, muted: false, match: true },
      { id: "b", open: false, muted: true, match: false },
      { id: "c", open: false, muted: true, match: false },
      { id: "d", open: false, muted: true, match: false },
    ]);
  });

  it("is a fresh plan for every step whatever came before", () => {
    expect(applyChoice("leadership", "awards", steps)!.steps.map((s) => s.open)).toEqual([false, false, false, true]);
  });

  it("resets everything on all: closed, unmuted, unmarked", () => {
    const plan = applyChoice("awards", "all", steps)!;
    expect(plan.status).toBe("Showing all 4 roles.");
    expect(plan.steps.every((s) => !s.open && !s.muted && !s.match)).toBe(true);
  });
});
