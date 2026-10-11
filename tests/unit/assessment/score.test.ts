// Unit tests for the scoring rules (FR-005, FR-007, SC-002; data-model.md "Result").
import { describe, expect, it } from "vitest";
import { band, bandPhrase, changeText, formatScore, markerPosition, scoreOf, summaryLine, sumOf } from "../../../src/lib/assessment/score.ts";

const shift = { name: "Alpha", from: "the old way", to: "the new way" };

describe("sumOf and scoreOf", () => {
  it("adds the three answers and takes the mean", () => {
    expect(sumOf([1, 2, 5])).toBe(8);
    expect(scoreOf(8)).toBeCloseTo(8 / 3, 10);
  });
});

describe("formatScore", () => {
  it.each([
    [3, "1.0"],
    [7, "2.3"],
    [8, "2.7"],
    [9, "3.0"],
    [10, "3.3"],
    [15, "5.0"],
  ])("writes a sum of %i as %s", (sum, text) => {
    expect(formatScore(sum)).toBe(text);
  });
});

describe("band", () => {
  it("is low below a mean of 3, middle at exactly 3 and high above", () => {
    expect(band(3)).toBe("low");
    expect(band(8)).toBe("low");
    expect(band(9)).toBe("middle");
    expect(band(10)).toBe("high");
    expect(band(15)).toBe("high");
  });
});

describe("bandPhrase", () => {
  it("names the From wording below the middle, the To wording above, and the middle at exactly 3", () => {
    expect(bandPhrase(shift, 8)).toBe("nearer 'From' (the old way)");
    expect(bandPhrase(shift, 9)).toBe("in the middle");
    expect(bandPhrase(shift, 10)).toBe("nearer 'To' (the new way)");
  });
});

describe("summaryLine", () => {
  it("joins the name, the one-decimal score out of 5 and the band phrase", () => {
    expect(summaryLine(shift, 7)).toBe("Alpha: 2.3 of 5, nearer 'From' (the old way)");
    expect(summaryLine(shift, 9)).toBe("Alpha: 3.0 of 5, in the middle");
  });
});

describe("markerPosition", () => {
  it("places a mean of 1 at the From end, 3 in the middle and 5 at the To end", () => {
    expect(markerPosition(3)).toBe(0);
    expect(markerPosition(9)).toBeCloseTo(0.5, 10);
    expect(markerPosition(15)).toBe(1);
  });
});

describe("changeText", () => {
  it("writes the change in the mean to one decimal", () => {
    expect(changeText(7, 9)).toBe("up 0.7");
    expect(changeText(9, 8)).toBe("down 0.3");
    expect(changeText(9, 9)).toBe("no change");
  });
});
