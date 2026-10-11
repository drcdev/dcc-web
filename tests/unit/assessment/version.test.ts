// Unit tests for the statement set version (FR-014; research R5).
import { describe, expect, it } from "vitest";
import { statementSetVersion } from "../../../src/lib/assessment/version.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";

const version = (a = sampleAssessment()) => statementSetVersion(a.shifts);

describe("statementSetVersion", () => {
  it("is eight lowercase hex digits and stable for the same data", () => {
    expect(version()).toMatch(/^[0-9a-f]{8}$/);
    expect(version()).toBe(version());
  });

  it("changes on any statement text edit, even a typo", () => {
    const edited = sampleAssessment();
    edited.shifts[2]!.statements[1] = edited.shifts[2]!.statements[1]!.replace("statement", "statment");
    expect(version(edited)).not.toBe(version());
  });

  it("changes when shifts are reordered", () => {
    const edited = sampleAssessment();
    edited.shifts.reverse();
    expect(version(edited)).not.toBe(version());
  });

  it("changes when statements within a shift are reordered", () => {
    const edited = sampleAssessment();
    edited.shifts[0]!.statements.reverse();
    expect(version(edited)).not.toBe(version());
  });

  it("does not change when anything but the statements and shift order changes", () => {
    const edited = sampleAssessment();
    edited.title = "Another title";
    edited.intro = "Another intro.";
    edited.scale = ["Rarely", "A", "B", "C", "Almost always"];
    edited.integrationWeek = { name: "Other", week: "Other text." };
    for (const shift of edited.shifts) {
      shift.name += " renamed";
      shift.from += " changed";
      shift.to += " changed";
      shift.practicalApplication += " More.";
      shift.week += " More.";
      shift.anchor += "-x";
    }
    expect(version(edited)).toBe(version());
  });
});
