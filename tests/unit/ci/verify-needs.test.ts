import { describe, expect, it } from "vitest";
import { decide, run } from "../../../scripts/ci/verify-needs.ts";

type Needs = Parameters<typeof decide>[0];

const JOBS = ["changes", "static", "build-tests", "e2e"] as const;

function needs(full: string | undefined, overrides: Record<string, string> = {}): Needs {
  const base: Needs = {
    changes: { result: "success", outputs: full === undefined ? {} : { full } },
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
  it("passes when every job succeeded and the full gate ran", () => {
    expect(decide(needs("true"))).toEqual({ pass: true, problems: [] });
  });

  it("passes the skip-safe case: heavy jobs skipped, static succeeded", () => {
    const d = decide(needs("false", { "build-tests": "skipped", e2e: "skipped" }));
    expect(d).toEqual({ pass: true, problems: [] });
  });

  it("passes when full is false and the heavy jobs also succeeded", () => {
    expect(decide(needs("false")).pass).toBe(true);
  });

  it("fails and names e2e when full is true and e2e was skipped", () => {
    const d = decide(needs("true", { e2e: "skipped" }));
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("e2e");
  });

  it.each(["failure", "cancelled"])("fails and names the job for %s in each job", (result) => {
    for (const job of JOBS) {
      const d = decide(needs("true", { [job]: result }));
      expect(d.pass, `${job} ${result}`).toBe(false);
      expect(d.problems.join("\n"), `${job} ${result}`).toContain(job);
    }
  });

  it("fails when static is skipped even if full is false", () => {
    const d = decide(needs("false", { static: "skipped" }));
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain("static");
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

  it.each([undefined, "", "yes", "TRUE"])("fails closed when the full output is %j", (full) => {
    const d = decide(needs(full, { "build-tests": "skipped", e2e: "skipped" }));
    expect(d.pass).toBe(false);
  });

  it.each(JOBS)("fails when the %s key is missing", (job) => {
    const n = needs("true");
    delete n[job];
    const d = decide(n);
    expect(d.pass).toBe(false);
    expect(d.problems.join("\n")).toContain(job);
  });
});

describe("run()", () => {
  it("returns 0 for a passing decision", () => {
    expect(run({ NEEDS: JSON.stringify(needs("true")) })).toBe(0);
  });
  it("returns non-zero for a failing decision", () => {
    expect(run({ NEEDS: JSON.stringify(needs("true", { e2e: "failure" })) })).not.toBe(0);
  });
  it.each([undefined, "", "not json", "null", "[]", '"x"'])("returns non-zero for NEEDS %j", (value) => {
    expect(run({ NEEDS: value })).not.toBe(0);
  });
});
