// The raw-date check shared by posts and the Now entry (specs/040-home-now-start-here, rows N02, N03).
import { describe, expect, it } from "vitest";
import { isAfterBuildDate, isRealDate, rawDateProblem } from "../../../src/lib/content/dates.ts";

const today = new Date("2026-10-11T23:59:59Z");

describe("isRealDate", () => {
  it("accepts a real YYYY-MM-DD day", () => {
    expect(isRealDate("2026-10-11")).toBe(true);
    expect(isRealDate("2028-02-29")).toBe(true);
  });

  it("rejects a day that does not exist (N02)", () => {
    expect(isRealDate("2026-02-30")).toBe(false);
    expect(isRealDate("2027-02-29")).toBe(false);
    expect(isRealDate("2026-13-01")).toBe(false);
  });

  it("rejects any other shape (N02)", () => {
    for (const value of ["", "2026-1-1", "2026/10/11", "2026-10-11T00:00:00Z", "'2026-10-11'", "October 11"]) {
      expect(isRealDate(value), value).toBe(false);
    }
  });
});

describe("isAfterBuildDate", () => {
  it("passes the build date itself, in UTC (N03)", () => {
    expect(isAfterBuildDate("2026-10-11", today)).toBe(false);
  });

  it("fails a later day (N03)", () => {
    expect(isAfterBuildDate("2026-10-12", today)).toBe(true);
    expect(isAfterBuildDate("2027-01-01", today)).toBe(true);
  });

  it("passes an earlier day", () => {
    expect(isAfterBuildDate("2026-10-10", today)).toBe(false);
  });

  it("uses the UTC day, not the local one", () => {
    expect(isAfterBuildDate("2026-10-12", new Date("2026-10-11T23:59:59-08:00"))).toBe(false);
  });
});

describe("rawDateProblem", () => {
  it("returns null for a real day on or before the build date", () => {
    expect(rawDateProblem("2026-10-11", today)).toBeNull();
    expect(rawDateProblem("2026-01-01", today)).toBeNull();
  });

  it("names a bad shape or impossible day (N02)", () => {
    expect(rawDateProblem("2026-02-30", today)).toMatch(/real date written YYYY-MM-DD/);
  });

  it("names a future day and shows it (N03)", () => {
    expect(rawDateProblem("2027-01-01", today)).toMatch(/2027-01-01.*in the future/);
  });
});
