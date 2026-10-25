// The career timeline view helper (specs/041-career-timeline). Neutral names only.
import { describe, expect, it } from "vitest";
import type { StepFile } from "../../../src/content/collections/career-rules.ts";
import { buildTimeline, formatMonth, formatPeriod } from "../../../src/lib/content/career-view.ts";

const step = (id: string, start: string, end: string, extra: Partial<StepFile["data"]> = {}): StepFile => ({
  id,
  file: `src/content/career/${id}.yaml`,
  data: { role: `Role ${id}`, organization: "Org", start, end, scope: "Scope text.", ...extra },
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

describe("buildTimeline", () => {
  it("puts the current role first and keeps only the parts present, in label order", () => {
    const timeline = buildTimeline([
      step("a", "2010-01", "2012-01", { wish: "W", decision: "D", nextMove: "N" }),
      step("b", "2020-01", "present"),
    ]);
    expect(timeline.steps.map((s) => s.id)).toEqual(["b", "a"]);
    expect(timeline.steps[1]!.parts.map((p) => p.label)).toEqual([
      "Scope",
      "Key decision",
      "What I wish I'd known",
      "The skill that led to the next move",
    ]);
    expect(timeline.steps[0]!.parts.map((p) => p.label)).toEqual(["Scope"]);
    expect(timeline.steps[0]!.period).toBe("Jan 2020 – present");
  });
  it("lists the used categories in the fixed order, never achievements", () => {
    const timeline = buildTimeline([
      step("a", "2010-01", "2012-01", { awards: [{ name: "A", year: 2011 }], volunteer: true }),
      step("b", "2020-01", "present", { achievements: ["x"], leadership: ["y"] }),
    ]);
    expect(timeline.categories).toEqual(["leadership", "awards", "volunteer"]);
    expect(buildTimeline([step("b", "2020-01", "present", { achievements: ["x"] })]).categories).toEqual([]);
  });
  it("carries the volunteer flag, false when left out, and offers Volunteer only when a step sets it", () => {
    const timeline = buildTimeline([step("a", "2010-01", "2012-01", { volunteer: true }), step("b", "2020-01", "present", { volunteer: false })]);
    expect(timeline.steps.map((s) => [s.id, s.volunteer])).toEqual([
      ["b", false],
      ["a", true],
    ]);
    expect(timeline.categories).toEqual(["volunteer"]);
    const none = buildTimeline([step("a", "2010-01", "2012-01"), step("b", "2020-01", "present", { volunteer: false })]);
    expect(none.steps.every((s) => s.volunteer === false)).toBe(true);
    expect(none.categories).toEqual([]);
  });
  it("is empty with no steps", () => {
    expect(buildTimeline([])).toEqual({ steps: [], categories: [] });
  });
  it("resolves related posts to title and address in step order (newest first)", () => {
    const posts = new Map([["live", { title: "A live post", draft: false }]]);
    const files = [step("old", "2010-01", "2012-01", { posts: ["live"] }), step("now", "2020-01", "present")];
    expect(buildTimeline(files, posts).steps[1]!.posts).toEqual([{ title: "A live post", href: "/writing/live/" }]);
  });
});
