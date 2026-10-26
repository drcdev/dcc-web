// The Now front matter schema (specs/040-home-now-start-here/contracts/build-errors.md rows N01 to N05, N09).
import { describe, expect, it } from "vitest";
import { nowSchema } from "../../../../src/content/collections/now-rules.ts";

const clock = () => new Date("2026-10-11T12:00:00Z");
const schema = nowSchema(clock);
const valid = {
  updated: "2026-10-01",
  workingOn: "Fixture work.",
  reading: "A fixture book.",
  mbaResearch: "Fixture research.",
  aiExperiments: "Fixture experiments.",
};

const without = (key: keyof typeof valid) => Object.fromEntries(Object.entries(valid).filter(([k]) => k !== key));

function problems(input: unknown): string {
  const result = schema.safeParse(input);
  return result.success ? "" : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
}

describe("Now front matter schema", () => {
  it("accepts plain text topics and a real date, as text or as the date YAML makes of it", () => {
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, updated: new Date("2026-10-01T00:00:00Z") }).success).toBe(true);
  });

  it("N01: a missing updated is named", () => {
    expect(problems(without("updated"))).toContain("updated: write the date as YYYY-MM-DD");
  });

  it("N02: a date that is not a real YYYY-MM-DD day fails", () => {
    expect(problems({ ...valid, updated: "2026-02-30" })).toContain("updated must be a real date written YYYY-MM-DD");
    expect(problems({ ...valid, updated: "October 1" })).toContain("updated must be a real date written YYYY-MM-DD");
  });

  it("N03: a date after the build date (UTC) fails, and the build date itself passes", () => {
    expect(problems({ ...valid, updated: "2027-01-01" })).toContain("updated (2027-01-01) is in the future. Use today's date or earlier.");
    expect(schema.safeParse({ ...valid, updated: "2026-10-11" }).success).toBe(true);
  });

  for (const key of ["workingOn", "reading", "mbaResearch", "aiExperiments"] as const) {
    it(`N04: ${key} missing or blank is named`, () => {
      expect(problems(without(key))).toContain(`add ${key}:`);
      expect(problems({ ...valid, [key]: "   " })).toContain(`add ${key}:`);
    });

    it(`N09: ${key} over 200 characters or on more than one line fails`, () => {
      expect(problems({ ...valid, [key]: "x".repeat(201) })).toContain(`${key}: keep it to one line of at most 200 characters`);
      expect(problems({ ...valid, [key]: "a\nb" })).toContain(`${key}: keep it to one line of at most 200 characters`);
      expect(schema.safeParse({ ...valid, [key]: "x".repeat(200) }).success).toBe(true);
    });
  }

  it("N05: an unknown key fails and is named", () => {
    expect(problems({ ...valid, mood: "good" })).toContain("mood");
  });
});
