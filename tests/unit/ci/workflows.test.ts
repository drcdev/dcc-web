import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function read(path: string): string {
  return readFileSync(new URL(path, `file://${repoRoot}`), "utf-8");
}

const USES_PATTERN = /uses:\s*([^\s@]+)@([^\s#]+)/g;

/** The text of one job: from `\n  <id>:` to the next two-space-indented job key, or the end of the file. */
function job(contents: string, id: string): string {
  const start = contents.indexOf(`\n  ${id}:`);
  expect(start, `expected ci.yml to define job ${id}`).toBeGreaterThan(-1);
  const rest = contents.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[A-Za-z0-9_-]+:/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/** The step of a job that contains `needle`: from its `- ` marker to the next step. */
function stepBlock(jobText: string, needle: string): string {
  const i = jobText.indexOf(needle);
  expect(i, `expected the job to contain ${needle}`).toBeGreaterThan(-1);
  const start = jobText.lastIndexOf("\n      - ", i);
  const next = jobText.indexOf("\n      - ", i);
  return jobText.slice(start, next === -1 ? undefined : next);
}

/** Occurrences of `run: <command>` as a whole line, so `lint` does not match `lint:secrets`. */
function runCount(contents: string, command: string): number {
  return contents.split("\n").filter((l) => l.trim() === `run: ${command}`).length;
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe(".github/workflows/ci.yml", () => {
  const contents = read(".github/workflows/ci.yml");

  it("sets permissions: contents: read", () => {
    expect(contents).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it("runs every verify member exactly once, in the job that owns it", () => {
    const owners: Record<string, string[]> = {
      static: ["pnpm run lint:secrets", "pnpm run lint", "pnpm run typecheck", "pnpm run test:unit", "pnpm run test:worker"],
      "build-tests": ["pnpm run test:build"],
      e2e: ["pnpm run build", "pnpm run test:e2e:parallel", "pnpm run test:budget"],
    };
    for (const [id, commands] of Object.entries(owners)) {
      const text = job(contents, id);
      for (const command of commands) {
        expect(runCount(contents, command), `${command} must appear exactly once in ci.yml`).toBe(1);
        expect(runCount(text, command), `${command} must run in ${id}`).toBe(1);
      }
    }
    expect(contents).not.toMatch(/pnpm run verify/);
  });

  it("installs with --frozen-lockfile", () => {
    expect(contents).toMatch(/--frozen-lockfile/);
  });

  it("pins every third-party action to a 40-character SHA", () => {
    const uses = [...contents.matchAll(USES_PATTERN)];
    expect(uses.length).toBeGreaterThan(0);
    for (const [, action, ref] of uses) {
      expect(ref, `${action} must be pinned to a 40-character commit SHA`).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("has no continue-on-error, no always-false if:, and no secrets other than GITHUB_TOKEN", () => {
    expect(contents).not.toMatch(/continue-on-error/);
    expect(contents).not.toMatch(/if:\s*false/);
    const secretRefs = [...contents.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]);
    for (const name of secretRefs) {
      expect(name).toBe("GITHUB_TOKEN");
    }
  });

});

describe(".github/workflows/ci.yml job rules", () => {
  const contents = read(".github/workflows/ci.yml");
  it("exposes exactly one changes output, tier, and no leftover boolean outputs", () => {
    const changes = job(contents, "changes");
    const outputs = changes.slice(changes.indexOf("    outputs:"), changes.indexOf("    steps:"));
    expect([...outputs.matchAll(/^\s{6}([a-z_]+):/gm)].map((m) => m[1])).toEqual(["tier"]);
    expect(contents).not.toContain("outputs.full");
    expect(contents).not.toContain("outputs.content_only");
  });

  it("runs exactly one build-test step in build-tests, chosen by tier, failing closed to test:build", () => {
    const buildTests = job(contents, "build-tests");
    expect(stepBlock(buildTests, "run: pnpm run test:build\n")).toContain("if: needs.changes.outputs.tier != 'content-only'");
    expect(stepBlock(buildTests, "run: pnpm run test:build:content")).toContain(
      "if: needs.changes.outputs.tier == 'content-only'",
    );
    expect(runCount(contents, "pnpm run test:build:content")).toBe(1);
    expect(job(contents, "static")).not.toContain("content-only");
    expect(job(contents, "e2e")).not.toContain("content-only");
  });

  it("runs secretlint in static on every path, after install", () => {
    const staticJob = job(contents, "static");
    expect(stepBlock(staticJob, "pnpm run lint:secrets")).not.toMatch(/\bif:/);
    expect(staticJob.indexOf("pnpm run lint:secrets")).toBeGreaterThan(staticJob.indexOf("pnpm install --frozen-lockfile"));
  });

  it("makes verify the aggregate: always runs, needs exactly the four jobs, feeds toJSON(needs) to the script", () => {
    const verify = job(contents, "verify");
    expect(verify).toMatch(/^\s{4}if:\s*always\(\)\s*$/m);
    const needs = verify.match(/^\s{4}needs:\s*\[([^\]]*)\]\s*$/m);
    expect(needs, "expected an inline needs list").toBeTruthy();
    expect(needs![1]!.split(",").map((s) => s.trim()).sort()).toEqual(["build-tests", "changes", "e2e", "static"]);
    const step = stepBlock(verify, "node scripts/ci/verify-needs.ts");
    expect(step).toMatch(/NEEDS:\s*\$\{\{\s*toJSON\(needs\)\s*\}\}/);
    expect(verify).not.toContain("pnpm install");
  });

  it("grants no job a write permission", () => {
    expect(contents).not.toMatch(/:\s*write(-all)?\s*$/m);
  });

  it("does not use paths or paths-ignore filters", () => {
    expect(contents).not.toMatch(/^\s*paths(-ignore)?:/m);
  });
});

describe(".github/workflows/visual-baselines.yml", () => {
  const contents = read(".github/workflows/visual-baselines.yml");

  it("sets permissions: contents: read", () => {
    expect(contents).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it("grants no job a write permission", () => {
    expect(contents).not.toMatch(/:\s*write(-all)?\s*$/m);
  });

  it("pins every third-party action to a 40-character SHA", () => {
    const uses = [...contents.matchAll(USES_PATTERN)];
    expect(uses.length).toBeGreaterThan(0);
    for (const [, action, ref] of uses) {
      expect(ref, `${action} must be pinned to a 40-character commit SHA`).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("installs with --frozen-lockfile", () => {
    expect(contents).toMatch(/--frozen-lockfile/);
  });

  it("never commits or pushes anything itself", () => {
    expect(contents).not.toMatch(/git\s+commit/);
    expect(contents).not.toMatch(/git\s+push/);
    expect(contents).not.toMatch(/git-auto-commit-action/);
    expect(contents).not.toMatch(/stefanzweifel/);
  });

  it("has no continue-on-error, no always-false if:, and no secrets other than GITHUB_TOKEN", () => {
    expect(contents).not.toMatch(/continue-on-error/);
    expect(contents).not.toMatch(/if:\s*false/);
    const secretRefs = [...contents.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]);
    for (const name of secretRefs) {
      expect(name).toBe("GITHUB_TOKEN");
    }
  });
});

describe(".github/workflows/ci.yml preview crawl (011-launch FR-001a, FR-002a)", () => {
  const contents = read(".github/workflows/ci.yml");
  const e2e = job(contents, "e2e");
  const step = stepBlock(e2e, "node scripts/site-check/preview.ts");

  it("exposes only GITHUB_TOKEN as a secret, plus public refs", () => {
    const secrets = step.match(/secrets\.[A-Za-z_]+/g) ?? [];
    expect(new Set(secrets)).toEqual(new Set(["secrets.GITHUB_TOKEN"]));
    expect(step).not.toMatch(/CLOUDFLARE|CF_/);
  });
});
