// Unit tests for the assessment collection schema (contracts/assessment-data.md rows A1 to A3).
import { describe, expect, it } from "vitest";
import { assessmentSchema } from "../../../src/content/schemas/assessment.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";

const parse = (value: unknown) => assessmentSchema.safeParse(value);
const messages = (value: unknown) => {
  const result = parse(value);
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

describe("assessment schema", () => {
  it("accepts a complete assessment", () => {
    expect(parse(sampleAssessment()).success).toBe(true);
  });

  it.each(["title", "intro", "integrationWeek"])("A1: rejects a missing %s", (field) => {
    const data: Record<string, unknown> = { ...sampleAssessment() };
    delete data[field];
    expect(parse(data).success).toBe(false);
  });

  it("A1: rejects an empty text field and names its path", () => {
    const data = sampleAssessment();
    data.shifts[2]!.from = "  ";
    expect(messages(data).join("\n")).toContain("shifts.2.from");
  });

  it("A1: rejects an unknown key at any level", () => {
    expect(parse({ ...sampleAssessment(), extra: 1 }).success).toBe(false);
    const data = sampleAssessment();
    (data.shifts[0] as Record<string, unknown>).colour = "red";
    expect(parse(data).success).toBe(false);
  });

  it("A1: rejects other than five shifts or three statements", () => {
    const four = sampleAssessment();
    four.shifts.pop();
    expect(parse(four).success).toBe(false);
    const two = sampleAssessment();
    two.shifts[1]!.statements.pop();
    expect(messages(two).join("\n")).toContain("shifts.1.statements");
    const four2 = sampleAssessment();
    four2.shifts[1]!.statements.push("Another.");
    expect(parse(four2).success).toBe(false);
  });

  it("A1: rejects a scale that is not five labels", () => {
    const data = sampleAssessment();
    data.scale = ["Rarely", "Sometimes", "Almost always"];
    expect(parse(data).success).toBe(false);
  });

  it("A2: rejects a repeated shift id or anchor, naming the value", () => {
    const id = sampleAssessment();
    id.shifts[3]!.id = id.shifts[0]!.id;
    expect(messages(id).join("\n")).toContain(id.shifts[0]!.id);
    const anchor = sampleAssessment();
    anchor.shifts[4]!.anchor = anchor.shifts[1]!.anchor;
    expect(messages(anchor).join("\n")).toContain(anchor.shifts[1]!.anchor);
  });

  it("A3: rejects a scale that does not start with Rarely and end with Almost always", () => {
    const first = sampleAssessment();
    first.scale[0] = "Never";
    expect(messages(first).join("\n")).toContain("scale");
    const last = sampleAssessment();
    last.scale[4] = "Always";
    expect(messages(last).join("\n")).toContain("scale");
  });

  it("rejects a shift id that is not a lower-case slug", () => {
    const data = sampleAssessment();
    data.shifts[0]!.id = "Not A Slug";
    expect(parse(data).success).toBe(false);
  });
});
