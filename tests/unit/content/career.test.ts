// The pure career rules (specs/041-career-timeline: data-model.md C1, C2; contracts/build-errors.md
// rows T08 and T09). Row ids are in the titles. Neutral names only.
import { describe, expect, it } from "vitest";
import { buildTimeline, checkCareer, formatMonth, formatPeriod, orderSteps, type StepFile } from "../../../src/lib/content/career.ts";

const step = (id: string, start: string, end: string, extra: Partial<StepFile["data"]> = {}): StepFile => ({
  id,
  file: `src/content/career/${id}.yaml`,
  data: { role: `Role ${id}`, organization: "Org", start, end, scope: "Scope text.", ...extra },
});

describe("C1 ordering", () => {
  it("sorts by start, then id, whatever the input order", () => {
    const sorted = orderSteps([step("b", "2020-01", "present"), step("z", "2010-05", "2012-01"), step("a", "2020-01", "present")]);
    expect(sorted.map((s) => s.id)).toEqual(["z", "a", "b"]);
  });
});

describe("formatPeriod", () => {
  it("writes month and year with an en dash", () => {
    expect(formatPeriod("2014-10", "2016-09")).toBe("Oct 2014 – Sep 2016");
  });
  it("ends a running period with the word present", () => {
    expect(formatPeriod("2026-06", "present")).toBe("Jun 2026 – present");
  });
  it("formats a single month", () => {
    expect(formatMonth("2022-01")).toBe("Jan 2022");
  });
});

describe("C2 current role", () => {
  it("T08: rejects a next move on the latest step, naming the file", () => {
    const files = [step("old", "2010-01", "2012-01"), step("now", "2020-01", "present", { nextMove: "Moved on." })];
    expect(() => checkCareer(files)).toThrow(/Career step file src\/content\/career\/now\.yaml: .*the current role has no next move yet; remove nextMove/);
  });
  it("T09: rejects a latest step that does not end present, naming the file", () => {
    const files = [step("old", "2010-01", "2012-01"), step("last", "2020-01", "2021-01")];
    expect(() => checkCareer(files)).toThrow(/Career step file src\/content\/career\/last\.yaml: .*this is the latest role, so end must be present/);
  });
  it("accepts a valid set, and an earlier step that also ends present", () => {
    expect(() => checkCareer([step("a", "2010-01", "present", { nextMove: "x" }), step("b", "2020-01", "present")])).not.toThrow();
  });
  it("does nothing with no steps", () => {
    expect(() => checkCareer([])).not.toThrow();
  });
});

describe("buildTimeline", () => {
  it("marks the last step as the current role and keeps only the parts present, in label order", () => {
    const timeline = buildTimeline([
      step("a", "2010-01", "2012-01", { wish: "W", decision: "D", nextMove: "N" }),
      step("b", "2020-01", "present"),
    ]);
    expect(timeline.steps.map((s) => s.id)).toEqual(["a", "b"]);
    expect(timeline.steps[0]!.parts.map((p) => p.label)).toEqual([
      "Scope",
      "Key decision",
      "What I wish I'd known",
      "The skill that led to the next move",
    ]);
    expect(timeline.steps[1]!.parts.map((p) => p.label)).toEqual(["Scope"]);
    expect(timeline.steps[1]!.period).toBe("Jan 2020 – present");
  });
  it("lists the used categories in the fixed order", () => {
    const timeline = buildTimeline([
      step("a", "2010-01", "2012-01", { awards: [{ name: "A", year: 2011 }] }),
      step("b", "2020-01", "present", { achievements: ["x"] }),
    ]);
    expect(timeline.categories).toEqual(["achievements", "awards"]);
  });
  it("is empty with no steps", () => {
    expect(buildTimeline([])).toEqual({ steps: [], categories: [] });
  });
});
