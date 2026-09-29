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
});

describe(".github/workflows/major-change.yml", () => {
  const contents = read(".github/workflows/major-change.yml");

  it("has job major-change-approval", () => {
    expect(contents).toMatch(/major-change-approval:/);
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

  it("sets permissions: pull-requests: read", () => {
    expect(contents).toMatch(/permissions:\s*\n\s*pull-requests:\s*read/);
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
