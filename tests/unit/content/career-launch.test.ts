// The real career step files (specs/041-career-timeline). This skeleton reads src/content/career/
// through the content helper and names no role, organization or post. The rules that need the
// launch files to exist (at least one step, the launch content) are added with them (T018).
import { describe, expect, it } from "vitest";
import { careerSteps, currentCareerStep } from "../../helpers/content.ts";

describe("the real career steps", () => {
  it("gives every step file an id, a start and an end", () => {
    for (const step of careerSteps) {
      expect(step.id, step.file).toMatch(/^[a-z0-9-]+$/);
      expect(String(step.data.start), step.file).toMatch(/^\d{4}-\d{2}$/);
      expect(step.data.end, step.file).toBeDefined();
    }
  });

  it("takes the current role by the rule: the latest start, ties by id", () => {
    const current = currentCareerStep(careerSteps);
    for (const step of careerSteps) expect(String(current.data.start) >= String(step.data.start)).toBe(true);
  });

  it("orders by start, then id, whatever the order of the input", () => {
    const a = { id: "b", file: "b", data: { start: "2020-01", end: "present" } };
    const b = { id: "a", file: "a", data: { start: "2020-01", end: "present" } };
    const c = { id: "z", file: "z", data: { start: "2010-01", end: "2012-01" } };
    expect(currentCareerStep([c, a, b])).toBe(a);
  });
});
