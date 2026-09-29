import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { decide, isSkipSafe, toOutput } from "../../../scripts/ci/changed-paths.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

const SAFE = [
  "CLAUDE.md",
  ".claude/skills/tweak/SKILL.md",
  ".claude/skills/squash/SKILL.md",
  ".specify/bugs/x/assessment.md",
  ".specify/extensions/git/git-config.yml",
  ".specify/scripts/bash/common.sh",
  ".specify/extensions/git/scripts/python/auto_commit.py",
  ".specify/feature.json",
  "specs/003-standalone-pages/spec.md",
  "specs/001-setup-walkthrough/contracts/check-report.schema.json",
];

const UNSAFE = [
  ".claude/skills/setup-walkthrough/SKILL.md",
  ".specify/memory/constitution.md",
  "docs/setup.md",
  "docs/pages.md",
  "docs/design-source.md",
  "README.md",
  "src/pages/index.astro",
  "src/content/pages/about.mdx",
  "tests/unit/ci/workflows.test.ts",
  "package.json",
  "pnpm-lock.yaml",
  ".github/workflows/ci.yml",
  ".gitignore",
  ".secretlintignore",
  "tsconfig.json",
  ".claude/hooks/check.ts",
  ".claude/x.js",
  "specs/foo/helper.mjs",
  "specs/foo/page.astro",
  ".specify/extensions/.registry",
  "claude.md",
  ".claude",
  "nested/CLAUDE.md",
  "specs/../src/index.ts",
  "/CLAUDE.md",
  ".claude\\skills\\x.md",
];

describe("isSkipSafe()", () => {
  it.each(SAFE)("treats %s as skip-safe", (p) => {
    expect(isSkipSafe(p)).toBe(true);
  });
  it.each(UNSAFE)("treats %s as not skip-safe", (p) => {
    expect(isSkipSafe(p)).toBe(false);
  });
});

describe("decide()", () => {
  it("skips when every changed file is skip-safe on a pull_request", () => {
    const d = decide({ event: "pull_request", files: ["CLAUDE.md", ".claude/skills/tweak/SKILL.md"] });
    expect(d.full).toBe(false);
  });
  it("runs everything and names the first unsafe file", () => {
    const d = decide({ event: "pull_request", files: ["CLAUDE.md", "src/pages/index.astro"] });
    expect(d.full).toBe(true);
    expect(d.reason).toContain("src/pages/index.astro");
  });
  it.each([[[]], [["", "  "]], [null]] as const)("fails closed for %j", (files) => {
    expect(decide({ event: "pull_request", files: files as string[] | null }).full).toBe(true);
  });
  it.each(["push", "workflow_dispatch", "pull_request_target"])("always runs everything for %s", (event) => {
    expect(decide({ event, files: ["CLAUDE.md"] }).full).toBe(true);
  });
  it("runs everything when a deny-listed file changes", () => {
    expect(decide({ event: "pull_request", files: [".specify/memory/constitution.md"] }).full).toBe(true);
  });
});

describe("toOutput()", () => {
  it("renders the GITHUB_OUTPUT line", () => {
    expect(toOutput({ full: true, reason: "" })).toBe("full=true\n");
    expect(toOutput({ full: false, reason: "" })).toBe("full=false\n");
  });
});

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".astro") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|mjs|js|astro|json|md|mdx)$/.test(name)) out.push(full);
  }
  return out;
}

describe("drift guard", () => {
  it("no check reads a path the allowlist calls skip-safe", () => {
    const files = [
      ...["src", "scripts", "tests"].flatMap((d) => walk(join(repoRoot, d))),
      ...["astro.config.mjs", "vitest.config.ts", "playwright.config.ts", "eslint.config.js"].map((f) =>
        join(repoRoot, f),
      ),
    ].filter((f) => !f.endsWith("changed-paths.test.ts") && !f.endsWith("changed-paths.ts"));
    const pattern = /["'`](?:\.\.\/)*\/?((?:\.claude|\.specify|specs)\/[^"'`\s]+|CLAUDE\.md)/g;
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf-8");
      for (const m of text.matchAll(pattern)) {
        const p = m[1]!.replace(/^(\.\.\/)+/, "").replace(/^\//, "");
        if (isSkipSafe(p)) offenders.push(`${file}: ${p}`);
      }
    }
    expect(offenders, "add these paths to READ_BY_CHECKS").toEqual([]);
  });
});
