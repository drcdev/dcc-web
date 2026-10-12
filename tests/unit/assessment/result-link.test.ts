// Unit tests for the results link grammar (contracts/results-link.md).
import { describe, expect, it } from "vitest";
import { decodeResult, encodeResult, resultUrl } from "../../../src/lib/assessment/result-link.ts";

const result = { version: "3fa9c2d0", date: "2026-10-11", sums: [7, 12, 15, 9, 3] };

describe("encodeResult", () => {
  it("writes version, compact date and the five sums", () => {
    expect(encodeResult(result)).toBe("result=3fa9c2d0.20261011.7-12-15-9-3");
  });

  it.each([
    ["a sum below 3", { ...result, sums: [2, 12, 15, 9, 3] }],
    ["a sum above 15", { ...result, sums: [7, 16, 15, 9, 3] }],
    ["a fractional sum", { ...result, sums: [7, 12.5, 15, 9, 3] }],
    ["four sums", { ...result, sums: [7, 12, 15, 9] }],
    ["six sums", { ...result, sums: [7, 12, 15, 9, 3, 3] }],
    ["an upper-case version", { ...result, version: "3FA9C2D0" }],
    ["a short version", { ...result, version: "3fa9" }],
    ["an impossible date", { ...result, date: "2026-02-30" }],
  ])("throws on %s", (_name, bad) => {
    expect(() => encodeResult(bad)).toThrow();
  });
});

describe("decodeResult", () => {
  it("round-trips, with or without the leading #", () => {
    const fragment = encodeResult(result);
    expect(decodeResult(`#${fragment}`)).toEqual({ kind: "result", result });
    expect(decodeResult(fragment)).toEqual({ kind: "result", result });
  });

  it.each(["", "#", "#mindset-shift-1", "#result", "#results=3fa9c2d0.20261011.7-12-15-9-3"])(
    "returns none for %j (empty or an ordinary anchor)",
    (hash) => {
      expect(decodeResult(hash)).toEqual({ kind: "none" });
    },
  );

  it.each([
    "#result=",
    "#result=3fa9c2d0.20261011.7-12-15-9",
    "#result=3fa9c2d0.20261011.7-12-15-9-3-3",
    "#result=3fa9c2d0.20261011.7-12-15-9-2",
    "#result=3fa9c2d0.20261011.7-12-16-9-3",
    "#result=3fa9c2d0.20261011.07-12-15-9-3",
    "#result=3fa9c2d0.20261011.+7-12-15-9-3",
    "#result=3FA9C2D0.20261011.7-12-15-9-3",
    "#result=3fa9c2d.20261011.7-12-15-9-3",
    "#result=3fa9c2d0.20260230.7-12-15-9-3",
    "#result=3fa9c2d0.20261301.7-12-15-9-3",
    "#result=3fa9c2d0.2026101.7-12-15-9-3",
    "#result=3fa9c2d0.20261011.7-12-15-9-3&x=1",
    "#result=3fa9c2d0.20261011.7-12-15-9-3.",
    "#result=3fa9c2d0.20261011.a-12-15-9-3",
  ])("returns malformed for %s", (hash) => {
    expect(decodeResult(hash)).toEqual({ kind: "malformed" });
  });

  it("accepts a date in the future", () => {
    expect(decodeResult("#result=3fa9c2d0.29991231.7-12-15-9-3").kind).toBe("result");
  });
});

describe("resultUrl", () => {
  it("joins origin, path and fragment and drops a query string", () => {
    expect(resultUrl({ origin: "https://example.test", pathname: "/writing/a-post/", search: "?utm=1" }, result)).toBe(
      "https://example.test/writing/a-post/#result=3fa9c2d0.20261011.7-12-15-9-3",
    );
  });
});
