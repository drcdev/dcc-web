// The reading path front matter schema (specs/040-home-now-start-here/contracts/build-errors.md rows
// R01, R02, R03, R08, R10). Items are references; a plain slug string is what the YAML holds.
import { describe, expect, it } from "vitest";
import { readingPathSchema } from "../../../../src/content/collections/reading-path-rules.ts";

const schema = readingPathSchema();
const valid = {
  title: "Fixture path",
  description: "A path for the schema tests.",
  position: 1,
  items: [{ post: "one" }, { project: "two" }],
};

const without = (key: keyof typeof valid) => Object.fromEntries(Object.entries(valid).filter(([k]) => k !== key));

function problems(input: unknown): string {
  const result = schema.safeParse(input);
  return result.success ? "" : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
}

describe("reading path schema", () => {
  it("accepts a valid path", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  for (const key of ["title", "description", "position"] as const) {
    it(`R01: a missing ${key} is named`, () => {
      expect(problems(without(key))).toContain(key);
    });
  }

  it("R02: a description must be one sentence ending in a full stop, at most 160 characters", () => {
    expect(problems({ ...valid, description: "No full stop" })).toContain("description");
    expect(problems({ ...valid, description: "One. Two." })).toContain("description");
    expect(problems({ ...valid, description: `${"x".repeat(160)}.` })).toContain("description");
    expect(schema.safeParse({ ...valid, description: `${"x".repeat(159)}.` }).success).toBe(true);
  });

  it("R03: items must be between 1 and 5", () => {
    expect(problems({ ...valid, items: [] })).toContain("list between 1 and 5 items");
    expect(problems({ ...valid, items: Array.from({ length: 6 }, (_, i) => ({ post: `p${i}` })) })).toContain("list between 1 and 5 items");
    expect(schema.safeParse({ ...valid, items: Array.from({ length: 5 }, (_, i) => ({ post: `p${i}` })) }).success).toBe(true);
  });

  it("R08: an item with both keys, neither key or another key fails", () => {
    const message = "each item is either post: <slug> or project: <slug>";
    expect(problems({ ...valid, items: [{ post: "a", project: "b" }] })).toContain(message);
    expect(problems({ ...valid, items: [{}] })).toContain(message);
    expect(problems({ ...valid, items: [{ page: "a" }] })).toContain(message);
  });

  it("R10: position must be 1 to 4", () => {
    expect(problems({ ...valid, position: 0 })).toContain("position");
    expect(problems({ ...valid, position: 5 })).toContain("position");
    expect(problems({ ...valid, position: 1.5 })).toContain("position");
    expect(schema.safeParse({ ...valid, position: 4 }).success).toBe(true);
  });

  it("an unknown key fails", () => {
    expect(problems({ ...valid, mood: "x" })).toContain("mood");
  });
});
