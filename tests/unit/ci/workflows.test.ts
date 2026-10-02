import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function read(path: string): string {
  return readFileSync(new URL(path, `file://${repoRoot}`), "utf-8");
}

const USES_PATTERN = /uses:\s*([^\s@]+)@([^\s#]+)/g;

const CI_JOB_IDS = ["changes", "static", "build-tests", "e2e", "verify"] as const;

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

  it("is named CI", () => {
    expect(contents).toMatch(/^name:\s*CI\s*$/m);
  });

  it("has the jobs changes, static, build-tests, e2e and the aggregate verify, with unique names", () => {
    expect(contents).toMatch(/^\s{2}verify:/m);
    const names: string[] = [];
    for (const id of CI_JOB_IDS) {
      const m = job(contents, id).match(/^\s{4}name:\s*(\S+)\s*$/m);
      expect(m, `expected job ${id} to have a name`).toBeTruthy();
      expect(m![1]).toBe(id);
      names.push(m![1]!);
    }
    expect(new Set(names).size).toBe(names.length);
    expect(contents).not.toMatch(/name:\s*major-change-approval\b/);
    expect(contents).not.toMatch(/^\s{2}major-change-approval:/m);
  });

  it("triggers on pull_request and push to main", () => {
    expect(contents).toMatch(/pull_request:/);
    expect(contents).toMatch(/push:/);
    expect(contents).toMatch(/branches:\s*\n?\s*-?\s*\[?["']?main/);
  });

  it("sets permissions: contents: read", () => {
    expect(contents).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it("cancels superseded runs", () => {
    expect(contents).toMatch(/concurrency:[\s\S]*?cancel-in-progress:\s*true/);
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

  it("uploads Playwright output on failure in e2e, after the budget step, pinned to a full SHA (FR-005b, FR-027a, FR-031)", () => {
    const e2e = job(contents, "e2e");
    const budgetIndex = e2e.indexOf("pnpm run test:budget");
    expect(budgetIndex).toBeGreaterThan(0);

    const afterBudget = e2e.slice(budgetIndex);
    expect(
      afterBudget,
      "expected an if: failure() step using a SHA-pinned actions/upload-artifact after the budget step",
    ).toMatch(/if:\s*failure\(\)[\s\S]*?uses:\s*actions\/upload-artifact@[0-9a-f]{40}/);

    const uploadStep = stepBlock(afterBudget, "actions/upload-artifact@");
    expect(uploadStep).toMatch(/if:\s*failure\(\)/);
    expect(uploadStep).toContain("playwright-report/");
    expect(uploadStep).toContain("test-results/");
    expect(uploadStep).toContain("tests/e2e/**/*-snapshots/**");
    expect(count(contents, "upload-artifact@")).toBe(1);
  });
});

describe(".github/workflows/ci.yml change detection and job topology", () => {
  const contents = read(".github/workflows/ci.yml");
  const changes = job(contents, "changes");
  const gated = "if: needs.changes.outputs.full != 'false'";

  it("checks out two commits in changes so HEAD^1 exists", () => {
    expect(stepBlock(changes, "actions/checkout@")).toMatch(/fetch-depth:\s*2\b/);
  });

  it("detects changes in changes, after setup-node, and exposes the full and content_only outputs", () => {
    const step = stepBlock(changes, "node scripts/ci/changed-paths.ts");
    expect(step).toMatch(/id:\s*changes/);
    expect(changes.indexOf("node scripts/ci/changed-paths.ts")).toBeGreaterThan(changes.indexOf("actions/setup-node@"));
    expect(changes).toMatch(/outputs:\s*\n\s+full:\s*\$\{\{\s*steps\.changes\.outputs\.full\s*\}\}/);
    expect(changes).toMatch(/^\s+content_only:\s*\$\{\{\s*steps\.changes\.outputs\.content_only\s*\}\}\s*$/m);
    expect(changes).not.toContain("pnpm install");
  });

  it("runs exactly one build-test step in build-tests, chosen by content_only and failing closed to test:build", () => {
    const buildTests = job(contents, "build-tests");
    expect(stepBlock(buildTests, "run: pnpm run test:build\n")).toContain("if: needs.changes.outputs.content_only != 'true'");
    expect(stepBlock(buildTests, "run: pnpm run test:build:content")).toContain(
      "if: needs.changes.outputs.content_only == 'true'",
    );
    expect(runCount(contents, "pnpm run test:build:content")).toBe(1);
    expect(count(contents, "needs.changes.outputs.content_only")).toBe(2);
    expect(job(contents, "static")).not.toContain("content_only");
    expect(job(contents, "e2e")).not.toContain("content_only");
  });

  it("makes static, build-tests and e2e need changes, so every installing job waits for it", () => {
    for (const id of ["static", "build-tests", "e2e"]) {
      expect(job(contents, id), `${id} must need changes`).toMatch(/^\s{4}needs:\s*changes\s*$/m);
    }
  });

  it("gates build-tests and e2e at job level on full != 'false'", () => {
    for (const id of ["build-tests", "e2e"]) {
      const text = job(contents, id);
      const header = text.slice(0, text.indexOf("steps:"));
      expect(header, id).toContain(`    ${gated}\n`);
    }
  });

  it("has no job-level if: on static, and gates its non-secretlint steps on full != 'false'", () => {
    const staticJob = job(contents, "static");
    expect(staticJob.slice(0, staticJob.indexOf("steps:"))).not.toMatch(/^\s{4}if:/m);
    for (const command of ["pnpm run lint", "pnpm run typecheck", "pnpm run test:unit", "pnpm run test:worker"]) {
      expect(stepBlock(staticJob, `run: ${command}\n`), command).toContain(gated);
    }
  });

  it("runs secretlint in static on every path, after install", () => {
    const staticJob = job(contents, "static");
    expect(stepBlock(staticJob, "pnpm run lint:secrets")).not.toMatch(/\bif:/);
    expect(staticJob.indexOf("pnpm run lint:secrets")).toBeGreaterThan(staticJob.indexOf("pnpm install --frozen-lockfile"));
  });

  it("installs unconditionally in static, build-tests and e2e", () => {
    for (const id of ["static", "build-tests", "e2e"]) {
      expect(stepBlock(job(contents, id), "pnpm install --frozen-lockfile"), id).not.toMatch(/\bif:/);
    }
  });

  it("installs the Playwright browser only in e2e, before the build and the Playwright runs", () => {
    expect(count(contents, "playwright install")).toBe(1);
    const e2e = job(contents, "e2e");
    const install = e2e.indexOf("playwright install --with-deps chromium");
    expect(install).toBeGreaterThan(e2e.indexOf("pnpm install --frozen-lockfile"));
    for (const later of ["pnpm run build", "pnpm run test:e2e:parallel", "pnpm run test:budget"]) {
      expect(e2e.indexOf(later), later).toBeGreaterThan(install);
    }
    expect(e2e.indexOf("pnpm run test:budget")).toBeGreaterThan(e2e.indexOf("pnpm run test:e2e:parallel"));
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

  it("gives e2e checks: read plus contents: read, and every other job contents: read only", () => {
    const e2e = job(contents, "e2e");
    expect(e2e).toMatch(/permissions:\s*\n\s+checks:\s*read\s*\n\s+contents:\s*read/);
    for (const id of ["changes", "static", "build-tests", "verify"]) {
      const text = job(contents, id);
      const header = text.slice(0, text.indexOf("steps:"));
      expect(header, id).toMatch(/permissions:\s*\n\s+contents:\s*read\s*\n/);
      expect(header, id).not.toContain("checks:");
    }
  });

  it("does not use paths or paths-ignore filters", () => {
    expect(contents).not.toMatch(/^\s*paths(-ignore)?:/m);
  });
});

describe(".github/workflows/major-change.yml", () => {
  const contents = read(".github/workflows/major-change.yml");

  it("names the job `gate`, not the required status context, so its check run cannot collide with the status", () => {
    expect(contents).toMatch(/^\s{2}gate:/m);
    expect(contents).toMatch(/^\s{4}name:\s*gate\s*$/m);
    expect(contents).not.toMatch(/^\s{2}major-change-approval:/m);
    expect(contents).not.toMatch(/name:\s*major-change-approval\b/);
  });

  it("triggers on the documented pull_request and pull_request_review events", () => {
    expect(contents).toMatch(/pull_request:/);
    for (const type of ["opened", "synchronize", "reopened", "labeled", "unlabeled", "ready_for_review"]) {
      expect(contents).toContain(type);
    }
    expect(contents).toMatch(/pull_request_review:/);
    for (const type of ["submitted", "edited", "dismissed"]) {
      expect(contents).toContain(type);
    }
  });

  it("sets permissions to exactly pull-requests: read and statuses: write", () => {
    const block = contents.match(/^permissions:\s*\n((?:\s{2}.+\n)+)/m);
    expect(block, "expected a top-level permissions block").toBeTruthy();
    const lines = block![1]!.split("\n").map((l) => l.trim()).filter(Boolean).sort();
    expect(lines).toEqual(["pull-requests: read", "statuses: write"]);
  });

  it("passes GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER and RUN_URL to the gate step", () => {
    for (const name of ["GITHUB_TOKEN", "GITHUB_REPOSITORY", "PR_NUMBER", "RUN_URL"]) {
      expect(contents).toMatch(new RegExp(`^\\s+${name}:`, "m"));
    }
  });

  it("reports the verdict as a commit status, not through the script's exit code", () => {
    const script = read("scripts/ci/major-change-gate.ts");
    expect(script).toContain("/statuses/");
    expect(script).not.toContain("process.exit(decision.pass ? 0 : 1)");
  });

  it("runs scripts/ci/major-change-gate.ts", () => {
    expect(contents).toMatch(/scripts\/ci\/major-change-gate\.ts/);
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

describe(".github/workflows/visual-baselines.yml", () => {
  const contents = read(".github/workflows/visual-baselines.yml");

  it("is triggered only by workflow_dispatch and a labeled pull_request, never push or schedule", () => {
    expect(contents).toMatch(/^on:\s*\n\s*workflow_dispatch:/m);
    expect(contents).toMatch(/pull_request:\s*\n\s*types:\s*\[labeled\]/);
    expect(contents).not.toMatch(/^\s*push:/m);
    expect(contents).not.toMatch(/schedule:/);
  });

  it("guards the job to only run on dispatch or the visual-baselines label", () => {
    expect(contents).toMatch(
      /if:\s*github\.event_name == 'workflow_dispatch' \|\| github\.event\.label\.name == 'visual-baselines'/,
    );
  });

  it("checks out the PR head SHA for the pull_request event, default otherwise", () => {
    expect(contents).toMatch(
      /ref:\s*\$\{\{\s*github\.event_name == 'pull_request' && github\.event\.pull_request\.head\.sha \|\| github\.sha\s*\}\}/,
    );
  });

  it("runs on ubuntu with minimal permissions: contents: read", () => {
    expect(contents).toMatch(/runs-on:\s*ubuntu-latest/);
    expect(contents).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it("pins every third-party action to a 40-character SHA", () => {
    const uses = [...contents.matchAll(USES_PATTERN)];
    expect(uses.length).toBeGreaterThan(0);
    for (const [, action, ref] of uses) {
      expect(ref, `${action} must be pinned to a 40-character commit SHA`).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("installs with --frozen-lockfile and installs Playwright's Chromium browser", () => {
    expect(contents).toMatch(/--frozen-lockfile/);
    expect(contents).toMatch(/playwright install --with-deps chromium/);
  });

  it("builds the site before updating snapshots", () => {
    const buildIndex = contents.indexOf("pnpm run build");
    const updateIndex = contents.indexOf("pnpm run test:visual:update");
    expect(buildIndex, "expected a step running pnpm run build").toBeGreaterThan(0);
    expect(updateIndex, "expected a step running pnpm run test:visual:update").toBeGreaterThan(0);
    expect(buildIndex).toBeLessThan(updateIndex);
  });

  it("runs the visual project only, with --update-snapshots", () => {
    expect(contents).toMatch(/pnpm run test:visual:update/);
  });

  it("uploads the visual snapshot directory as visual-baselines-linux with 7 day retention", () => {
    const uploadMatch = contents.match(
      /uses:\s*actions\/upload-artifact@([0-9a-f]{40})/,
    );
    expect(uploadMatch, "expected a SHA-pinned actions/upload-artifact step").toBeTruthy();
    expect(contents).toMatch(/name:\s*visual-baselines-linux/);
    expect(contents).toMatch(/tests\/e2e\/visual\.spec\.ts-snapshots\//);
    expect(contents).toMatch(/retention-days:\s*7/);
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

  it("has the preview crawl step in e2e, after the budget run", () => {
    expect(e2e.indexOf("node scripts/site-check/preview.ts")).toBeGreaterThan(e2e.indexOf("pnpm run test:budget"));
    expect(count(contents, "node scripts/site-check/preview.ts")).toBe(1);
  });

  it("runs only on pull_request", () => {
    expect(step).toMatch(/if:.*github\.event_name == 'pull_request'/);
  });

  it("exposes only GITHUB_TOKEN as a secret, plus public refs", () => {
    const secrets = step.match(/secrets\.[A-Za-z_]+/g) ?? [];
    expect(new Set(secrets)).toEqual(new Set(["secrets.GITHUB_TOKEN"]));
    expect(step).not.toMatch(/CLOUDFLARE|CF_/);
  });
});

describe(".github/CODEOWNERS", () => {
  const contents = read(".github/CODEOWNERS");
  const majorPaths = [
    "/.github/",
    "/package.json",
    "/pnpm-lock.yaml",
    "/.nvmrc",
    "/wrangler.jsonc",
    "/astro.config.mjs",
    "/public/_headers",
    "/scripts/ci/",
    "/setup/",
    "/.specify/memory/constitution.md",
    "/.github/CODEOWNERS",
  ];

  it("assigns @drcdev to every major path", () => {
    for (const path of majorPaths) {
      const line = contents
        .split("\n")
        .find((l) => l.trim().startsWith(path));
      expect(line, `missing CODEOWNERS line for ${path}`).toBeDefined();
      expect(line).toContain("@drcdev");
    }
  });
});
