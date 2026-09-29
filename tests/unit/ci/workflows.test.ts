import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

function read(path: string): string {
  return readFileSync(new URL(path, `file://${repoRoot}`), "utf-8");
}

const USES_PATTERN = /uses:\s*([^\s@]+)@([^\s#]+)/g;

describe(".github/workflows/ci.yml", () => {
  const contents = read(".github/workflows/ci.yml");

  it("is named CI", () => {
    expect(contents).toMatch(/^name:\s*CI\s*$/m);
  });

  it("has job verify", () => {
    expect(contents).toMatch(/^\s{2}verify:/m);
    expect(contents).toMatch(/name:\s*verify/);
  });

  it("triggers on pull_request and push to main", () => {
    expect(contents).toMatch(/pull_request:/);
    expect(contents).toMatch(/push:/);
    expect(contents).toMatch(/branches:\s*\n?\s*-?\s*\[?["']?main/);
  });

  it("sets permissions: contents: read", () => {
    expect(contents).toMatch(/permissions:\s*\n\s*contents:\s*read/);
  });

  it("has a step running pnpm run verify", () => {
    expect(contents).toMatch(/pnpm run verify/);
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

  it("uploads Playwright output on failure, after the verify step, pinned to a full SHA (FR-005b, FR-027a, FR-031)", () => {
    const verifyStepIndex = contents.indexOf("pnpm run verify");
    expect(verifyStepIndex).toBeGreaterThan(0);

    const afterVerify = contents.slice(verifyStepIndex);
    const uploadMatch = afterVerify.match(
      /if:\s*failure\(\)[\s\S]*?uses:\s*actions\/upload-artifact@([0-9a-f]{40})/,
    );
    expect(uploadMatch, "expected an if: failure() step using a SHA-pinned actions/upload-artifact after the verify step").toBeTruthy();

    const uploadStepIndex = afterVerify.search(/if:\s*failure\(\)/);
    const uploadStep = afterVerify.slice(uploadStepIndex, uploadStepIndex + 600);
    expect(uploadStep).toContain("playwright-report/");
    expect(uploadStep).toContain("test-results/");
    expect(uploadStep).toContain("tests/e2e/**/*-snapshots/**");
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
