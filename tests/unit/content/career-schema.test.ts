// The career step schema (specs/041-career-timeline/contracts/build-errors.md rows T01 to T07, T12 and T14).
// Posts are references; a plain slug string is what the YAML holds.
import { describe, expect, it } from "vitest";
import { careerSchema } from "../../../src/content/schemas/career.ts";

const schema = careerSchema();
const valid = {
  role: "Analyst",
  organization: "Example Works",
  start: "2010-03",
  end: "2013-08",
  scope: "Kept the reporting tools running.",
};

function problems(input: unknown): string {
  const result = schema.safeParse(input);
  return result.success ? "" : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
}

describe("career step schema", () => {
  it("accepts a minimal step, a current role and a full step", () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, end: "present" }).success).toBe(true);
    expect(
      schema.safeParse({
        ...valid,
        decision: "d",
        changed: "c",
        wish: "w",
        nextMove: "n",
        achievements: ["a"],
        leadership: ["l"],
        awards: [{ name: "Award", year: 2012, href: "https://example.com/a" }, { name: "Other", year: 2013 }],
        posts: ["one", "two"],
        volunteer: true,
      }).success,
    ).toBe(true);
  });

  for (const key of ["role", "organization", "scope"] as const) {
    it(`T01: a missing or empty ${key} is named`, () => {
      const rest = Object.fromEntries(Object.entries(valid).filter(([k]) => k !== key));
      expect(problems(rest)).toContain(key);
      expect(problems({ ...valid, [key]: "   " })).toContain(key);
    });
  }

  it("T02: start and end must be YYYY-MM (end may be present) with a real month", () => {
    for (const bad of ["2010", "2010-3", "2010-13", "2010-00", "March 2010", "2010-03-01"]) {
      expect(problems({ ...valid, start: bad }), bad).toContain("start: write the month as YYYY-MM");
      expect(problems({ ...valid, end: bad }), bad).toContain("end: write the month as YYYY-MM or present");
    }
    expect(problems({ ...valid, start: "present" })).toContain("start");
  });

  it("T03: an end before the start fails; the same month passes", () => {
    expect(problems({ ...valid, start: "2013-09", end: "2013-08" })).toContain("end: the end month is before the start month");
    expect(schema.safeParse({ ...valid, start: "2013-08", end: "2013-08" }).success).toBe(true);
  });

  it("T04: an unknown key, including another category, is named", () => {
    expect(problems({ ...valid, mood: "x" })).toContain("mood");
    expect(problems({ ...valid, skills: ["x"] })).toContain("skills");
  });

  it("T05: an empty list is an error", () => {
    for (const key of ["achievements", "leadership", "awards", "posts"]) {
      expect(problems({ ...valid, [key]: [] }), key).toContain(`${key}: list at least one item, or leave the key out`);
    }
  });

  it("T06: an award needs a name and year, and an https href", () => {
    expect(problems({ ...valid, awards: [{ year: 2012 }] })).toContain("awards.0.name");
    expect(problems({ ...valid, awards: [{ name: "A" }] })).toContain("awards.0.year");
    expect(problems({ ...valid, awards: [{ name: "A", year: 2012, href: "http://example.com" }] })).toContain("awards.0.href");
    expect(problems({ ...valid, awards: [{ name: "A", year: 2012, href: "not a url" }] })).toContain("awards.0.href");
    expect(problems({ ...valid, awards: [{ name: "A", year: 2012.5 }] })).toContain("awards.0.year");
  });

  it("T07: the same post twice fails, naming it", () => {
    expect(problems({ ...valid, posts: ["one", "two", "one"] })).toContain("posts: one is listed twice");
  });

  it("T14: volunteer is true or false, or left out", () => {
    expect(schema.safeParse({ ...valid, volunteer: true }).success).toBe(true);
    expect(schema.safeParse({ ...valid, volunteer: false }).success).toBe(true);
    for (const bad of ["yes", "true", 1, null, []]) {
      expect(problems({ ...valid, volunteer: bad }), String(bad)).toContain("volunteer: write true, or leave the key out");
    }
  });

  it("T12: text over its limit is named with the limit", () => {
    const over = (n: number) => "x".repeat(n + 1);
    const at = (n: number) => "x".repeat(n);
    expect(problems({ ...valid, role: over(120) })).toContain("role: keep this under 120 characters");
    expect(problems({ ...valid, organization: over(120) })).toContain("organization: keep this under 120 characters");
    expect(problems({ ...valid, scope: over(300) })).toContain("scope: keep this under 300 characters");
    for (const key of ["decision", "changed", "wish", "nextMove"]) {
      expect(problems({ ...valid, [key]: over(300) }), key).toContain(`${key}: keep this under 300 characters`);
    }
    expect(problems({ ...valid, achievements: [over(200)] })).toContain("achievements.0: keep this under 200 characters");
    expect(problems({ ...valid, leadership: [over(200)] })).toContain("leadership.0: keep this under 200 characters");
    expect(problems({ ...valid, awards: [{ name: over(200), year: 2012 }] })).toContain("awards.0.name: keep this under 200 characters");
    expect(schema.safeParse({ ...valid, role: at(120), scope: at(300), achievements: [at(200)] }).success).toBe(true);
  });
});
