// Unit tests for the six-week plan order (specs/037 FR-010).
import { describe, expect, it } from "vitest";
import { planOrder } from "../../../src/lib/assessment/plan.ts";

describe("planOrder", () => {
  it("orders the shifts from the lowest sum to the highest", () => {
    expect(planOrder([12, 5, 9, 15, 7])).toEqual([1, 4, 2, 0, 3]);
  });

  it("keeps the post's order for tied sums", () => {
    expect(planOrder([9, 6, 9, 6, 12])).toEqual([1, 3, 0, 2, 4]);
  });

  it("keeps the post's order when every sum is tied", () => {
    expect(planOrder([9, 9, 9, 9, 9])).toEqual([0, 1, 2, 3, 4]);
  });

  it("does not change its input", () => {
    const sums = [12, 5, 9, 15, 7];
    planOrder(sums);
    expect(sums).toEqual([12, 5, 9, 15, 7]);
  });
});
