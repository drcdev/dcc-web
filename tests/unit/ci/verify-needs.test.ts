import { describe, expect, it } from "vitest";
import { decide, run } from "../../../scripts/ci/verify-needs.ts";

type Needs = Parameters<typeof decide>[0];

const JOBS = ["changes", "static", "build-tests", "e2e"] as const;

function needs(tier: string | undefined, overrides: Record<string, string> = {}): Needs {
  const base: Needs = {
    changes: { result: "success", outputs: tier === undefined ? {} : { tier } },
    static: { result: "success" },
    "build-tests": { result: "success" },
    e2e: { result: "success" },
  };
  for (const [job, result] of Object.entries(overrides)) {
    base[job] = { ...base[job], result };
  }
  return base;
}

describe("decide()", () => {
  it("passes when every job succeeded on the full tier", () => {
    expect(decide(needs("full"))).toEqual({ pass: true, problems: [] });
  });

  it("passes the skip-safe case: heavy jobs skipped, static succeeded", () => {
    const d = decide(needs("skip-safe", { "build-tests": "skipped", e2e: "skipped" }));
    expect(d).toEqual({ pass: true, problems: [] });
  });

  it("passes on skip-safe when the heavy jobs also succeeded", () => {
    expect(decide(needs("skip-safe")).pass).toBe(true);
  });

  it("passes the docs case: heavy jobs skipped, static succeeded", () => {
    expect(decide(needs("docs", { "build-tests": "skipped", e2e: "skipped" }))).toEqual({ pass: true, problems: [] });
  });

  it("passes on docs when the heavy jobs also succeeded", () => {
    expect(decide(needs("docs")).pass).toBe(true);
  });

  it.each(["failure", "skipped", "cancelled"])("fails on docs when static is %s", (result) => {
    const d = decide(needs("docs", { static: result, "build-tests": "skipped", e2e: "skipped" }));
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("static");
  });

  it.each(["content-only", "full"])("fails on %s when build-tests or e2e is skipped", (tier) => {
    expect(decide(needs(tier, { "build-tests": "skipped" })).pass).toBe(false);
    expect(decide(needs(tier, { e2e: "skipped" })).pass).toBe(false);
  });

  it("fails and names e2e when the full tier skipped e2e", () => {
    const d = decide(needs("full", { e2e: "skipped" }));
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("e2e");
  });

  it("fails when the content-only tier skipped a heavy job", () => {
    expect(decide(needs("content-only", { "build-tests": "skipped" })).pass).toBe(false);
  });

  it.each(["full", "content-only", "skip-safe"])("fails and names the job for failure or cancelled on %s", (tier) => {
    for (const result of ["failure", "cancelled"]) {
      for (const job of JOBS) {
        const d = decide(needs(tier, { [job]: result }));
        expect(d.pass, `${tier} ${job} ${result}`).toBe(false);
        expect(d.problems.join("\n"), `${tier} ${job} ${result}`).toContain(job);
      }
    }
  });

  it.each(["failure", "cancelled", "skipped"])("fails on any tier when changes is %s", (result) => {
    for (const tier of ["skip-safe", "docs", "content-only", "full"]) {
      expect(decide(needs(tier, { changes: result })).pass, `${tier} ${result}`).toBe(false);
    }
  });

  it("fails when static is skipped or failed on skip-safe", () => {
    for (const result of ["skipped", "failure"]) {
      const d = decide(needs("skip-safe", { static: result, "build-tests": "skipped", e2e: "skipped" }));
      expect(d.pass).toBe(false);
      expect(d.problems.join("\n")).toContain("static");
    }
  });

  it("fails when changes failed with no output", () => {
    const d = decide({
      changes: { result: "failure" },
      static: { result: "success" },
      "build-tests": { result: "skipped" },
      e2e: { result: "skipped" },
    });
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("changes");
  });

  it.each([undefined, "", "yes", "TRUE", "true", "false", "Full"])("fails closed naming tier when the tier output is %j", (tier) => {
    const d = decide(needs(tier, { "build-tests": "skipped", e2e: "skipped" }));
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("tier");
  });

  it("fails closed for an old-style output with only full", () => {
    const n = needs(undefined, { "build-tests": "skipped", e2e: "skipped" });
    n.changes = { result: "success", outputs: { full: "false" } };
    const d = decide(n);
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("tier");
  });

  it.each(JOBS)("fails when the %s key is missing", (job) => {
    const n = needs("full");
    delete n[job];
    const d = decide(n);
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain(job);
  });
});

describe("run()", () => {
  it("returns 0 for a passing decision", () => {
    expect(run({ NEEDS: JSON.stringify(needs("full")) })).toBe(0);
  });
  it("returns non-zero for a failing decision", () => {
    expect(run({ NEEDS: JSON.stringify(needs("full", { e2e: "failure" })) })).not.toBe(0);
  });
  it.each([undefined, "", "not json", "null", "[]", '"x"'])("returns non-zero for NEEDS %j", (value) => {
    expect(run({ NEEDS: value })).not.toBe(0);
  });
});
