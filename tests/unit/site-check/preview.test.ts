import { describe, expect, it } from "vitest";
import { previewOrigin, waitForPreview, type CheckRun } from "../../../scripts/site-check/preview.ts";

const config = { previewWorkerName: "dcc-web-preview", workersSubdomain: "drc-dev" };
const SHA = "abc123";

function deps(runs: Array<CheckRun | null>) {
  let t = 0;
  let i = 0;
  const sleeps: number[] = [];
  return {
    sleeps,
    d: {
      getCheckRuns: async () => {
        const r = runs[Math.min(i++, runs.length - 1)];
        return r ? [r] : [];
      },
      sleep: async (ms: number) => {
        sleeps.push(ms);
        t += ms;
      },
      now: () => t,
      sha: SHA,
    },
  };
}

describe("waitForPreview", () => {
  it("continues on a successful check run", async () => {
    const { d } = deps([{ status: "completed", conclusion: "success", details_url: "u" }]);
    await expect(waitForPreview(d)).resolves.toBeUndefined();
  });

  it("polls every 20 seconds until completed", async () => {
    const { d, sleeps } = deps([
      null,
      { status: "in_progress", conclusion: null, details_url: "u" },
      { status: "completed", conclusion: "success", details_url: "u" },
    ]);
    await waitForPreview(d);
    expect(sleeps).toEqual([20_000, 20_000]);
  });

  it("fails with the contract message on any other conclusion", async () => {
    const { d } = deps([{ status: "completed", conclusion: "failure", details_url: "https://d/1" }]);
    await expect(waitForPreview(d)).rejects.toThrow(
      "The preview build for abc123 finished as failure; see https://d/1.",
    );
    const { d: d2 } = deps([{ status: "completed", conclusion: "cancelled", details_url: "https://d/2" }]);
    await expect(waitForPreview(d2)).rejects.toThrow("finished as cancelled");
  });

  it("fails closed when no check run appears within 20 minutes", async () => {
    const { d } = deps([null]);
    await expect(waitForPreview(d)).rejects.toThrow(
      'No "Workers Builds: dcc-web-preview" check run appeared for abc123 within 20 minutes. Re-run this job once the preview build has reported.',
    );
  });

  it("fails closed when the run never completes", async () => {
    const { d } = deps([{ status: "in_progress", conclusion: null, details_url: "u" }]);
    await expect(waitForPreview(d)).rejects.toThrow(/within 20 minutes/);
  });

  it("fails closed when the API is unreachable", async () => {
    const d = {
      getCheckRuns: async () => {
        throw new Error("network down");
      },
      sleep: async () => {},
      now: () => 0,
      sha: SHA,
    };
    await expect(waitForPreview(d)).rejects.toThrow();
  });
});

describe("previewOrigin", () => {
  it("builds the alias address from the head ref and config", () => {
    expect(previewOrigin({ HEAD_REF: "011-launch" }, config)).toBe(
      "https://br-011-launch-dcc-web-preview.drc-dev.workers.dev",
    );
  });
  it("fails plainly when no alias can be derived", () => {
    expect(() => previewOrigin({ HEAD_REF: "---" }, config)).toThrow(/preview address/i);
    expect(() => previewOrigin({}, config)).toThrow(/preview address/i);
    expect(() => previewOrigin({ HEAD_REF: "x" }, { previewWorkerName: "dcc-web-preview" })).toThrow(
      /preview address/i,
    );
  });
});
