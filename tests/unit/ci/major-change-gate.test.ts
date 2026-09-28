import { describe, expect, it } from "vitest";
import { decide, type MajorGateInput } from "../../../scripts/ci/major-change-gate.ts";

function baseInput(overrides: Partial<MajorGateInput> = {}): MajorGateInput {
  return {
    labels: [],
    author: "dcc-bot",
    headSha: "a".repeat(40),
    reviews: [],
    owner: "drcdev",
    ...overrides,
  };
}

describe("major-change-gate decide()", () => {
  it("passes when there is no major-change label", () => {
    const result = decide(baseInput({ labels: [] }));
    expect(result.pass).toBe(true);
  });

  it("fails when the label is present and the PR author is the owner", () => {
    const result = decide(
      baseInput({ labels: ["major-change"], author: "drcdev" }),
    );
    expect(result.pass).toBe(false);
    expect(result.message).toMatch(/reopen/i);
    expect(result.message).toMatch(/dcc-bot/i);
  });

  it("passes when the label is present and the owner's latest review is APPROVED on the head commit", () => {
    const headSha = "b".repeat(40);
    const result = decide(
      baseInput({
        labels: ["major-change"],
        author: "dcc-bot",
        headSha,
        reviews: [
          {
            user: "drcdev",
            state: "APPROVED",
            commitId: headSha,
            submittedAt: "2026-09-28T00:00:00Z",
          },
        ],
      }),
    );
    expect(result.pass).toBe(true);
  });

  it("fails when the label is present and there is no owner approval", () => {
    const result = decide(baseInput({ labels: ["major-change"], reviews: [] }));
    expect(result.pass).toBe(false);
    expect(result.message).toMatch(/waiting for don's approval/i);
  });

  it("fails when the owner's approval is on a stale commit", () => {
    const result = decide(
      baseInput({
        labels: ["major-change"],
        headSha: "c".repeat(40),
        reviews: [
          {
            user: "drcdev",
            state: "APPROVED",
            commitId: "d".repeat(40),
            submittedAt: "2026-09-28T00:00:00Z",
          },
        ],
      }),
    );
    expect(result.pass).toBe(false);
    expect(result.message).toMatch(/waiting for don's approval/i);
  });

  it("fails when the latest owner review is not APPROVED", () => {
    const headSha = "e".repeat(40);
    const result = decide(
      baseInput({
        labels: ["major-change"],
        headSha,
        reviews: [
          {
            user: "drcdev",
            state: "CHANGES_REQUESTED",
            commitId: headSha,
            submittedAt: "2026-09-28T00:00:00Z",
          },
        ],
      }),
    );
    expect(result.pass).toBe(false);
  });

  it("uses only the owner's latest review when there are several", () => {
    const headSha = "f".repeat(40);
    const result = decide(
      baseInput({
        labels: ["major-change"],
        headSha,
        reviews: [
          {
            user: "drcdev",
            state: "APPROVED",
            commitId: headSha,
            submittedAt: "2026-09-28T00:00:00Z",
          },
          {
            user: "drcdev",
            state: "CHANGES_REQUESTED",
            commitId: headSha,
            submittedAt: "2026-09-28T01:00:00Z",
          },
        ],
      }),
    );
    expect(result.pass).toBe(false);
  });

  it("ignores reviews from users other than the owner", () => {
    const headSha = "1".repeat(40);
    const result = decide(
      baseInput({
        labels: ["major-change"],
        headSha,
        reviews: [
          {
            user: "someone-else",
            state: "APPROVED",
            commitId: headSha,
            submittedAt: "2026-09-28T00:00:00Z",
          },
        ],
      }),
    );
    expect(result.pass).toBe(false);
  });
});
