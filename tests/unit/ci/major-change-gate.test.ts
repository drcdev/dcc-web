import { describe, expect, it } from "vitest";
import {
  decide,
  statusApiArgs,
  STATUS_CONTEXT,
  toCommitStatus,
  type MajorGateInput,
} from "../../../scripts/ci/major-change-gate.ts";

function baseInput(overrides: Partial<MajorGateInput> = {}): MajorGateInput {
  return {
    labels: [],
    author: "drc-agents",
    headSha: "a".repeat(40),
    reviews: [],
    owner: "drcdev",
    machineAccount: "drc-agents",
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
    expect(result.message).toMatch(/drc-agents/i);
  });

  it("uses the configured machine account name in the reopen message", () => {
    const result = decide(
      baseInput({ labels: ["major-change"], author: "drcdev", machineAccount: "some-other-bot" }),
    );
    expect(result.pass).toBe(false);
    expect(result.message).toMatch(/some-other-bot/);
    expect(result.message).not.toMatch(/drc-agents/);
  });

  it("passes when the label is present and the owner's latest review is APPROVED on the head commit", () => {
    const headSha = "b".repeat(40);
    const result = decide(
      baseInput({
        labels: ["major-change"],
        author: "drc-agents",
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

describe("major-change-gate toCommitStatus()", () => {
  it("uses the required status context", () => {
    expect(STATUS_CONTEXT).toBe("major-change-approval");
  });

  it("is success when there is no label", () => {
    const status = toCommitStatus(decide(baseInput()));
    expect(status.state).toBe("success");
    expect(status.context).toBe("major-change-approval");
  });

  it("is success when the owner approved the head commit", () => {
    const sha = "b".repeat(40);
    const decision = decide(
      baseInput({
        labels: ["major-change"],
        headSha: sha,
        reviews: [{ user: "drcdev", state: "APPROVED", commitId: sha, submittedAt: "2026-01-01T00:00:00Z" }],
      }),
    );
    expect(toCommitStatus(decision).state).toBe("success");
  });

  it("is pending while waiting for approval", () => {
    const status = toCommitStatus(decide(baseInput({ labels: ["major-change"] })));
    expect(status.state).toBe("pending");
    expect(status.context).toBe("major-change-approval");
  });

  it("is pending for an owner-authored PR", () => {
    const status = toCommitStatus(decide(baseInput({ labels: ["major-change"], author: "drcdev" })));
    expect(status.state).toBe("pending");
    expect(status.description).toMatch(/reopen/i);
  });

  it("truncates the description to 140 characters", () => {
    const status = toCommitStatus({ pass: false, message: "x".repeat(500) });
    expect(status.description.length).toBeLessThanOrEqual(140);
  });

  it("passes target_url through, and omits it when absent", () => {
    expect(toCommitStatus({ pass: true, message: "ok" }, "https://example.test/run/1").target_url).toBe(
      "https://example.test/run/1",
    );
    expect(toCommitStatus({ pass: true, message: "ok" })).not.toHaveProperty("target_url");
  });
});

describe("major-change-gate statusApiArgs()", () => {
  it("builds a POST to the statuses endpoint for the sha", () => {
    const status = toCommitStatus({ pass: false, message: "Waiting" });
    const args = statusApiArgs("drcdev/dcc-web", "c".repeat(40), status);
    expect(args.slice(0, 4)).toEqual(["api", "-X", "POST", `repos/drcdev/dcc-web/statuses/${"c".repeat(40)}`]);
    expect(args).toContain("state=pending");
    expect(args).toContain("context=major-change-approval");
    expect(args).toContain("description=Waiting");
    expect(args.some((a) => a.startsWith("target_url="))).toBe(false);
  });

  it("adds target_url when set", () => {
    const status = toCommitStatus({ pass: true, message: "ok" }, "https://example.test/run/1");
    expect(statusApiArgs("o/r", "abc", status)).toContain("target_url=https://example.test/run/1");
  });
});
