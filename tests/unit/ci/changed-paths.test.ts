import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { decide, isContentOnly, isSkipSafe, toOutput } from "../../../scripts/ci/changed-paths.ts";
import type { ChangeInput } from "../../../scripts/ci/changed-paths.ts";
import { filesUnder } from "../../helpers/files.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

const SAFE = [
  "CLAUDE.md",
  ".claude/skills/deliver/SKILL.md",
  ".claude/skills/tweak/SKILL.md",
  ".claude/skills/squash/SKILL.md",
  ".claude/skills/chore/SKILL.md",
  ".specify/memory/constitution.md",
  ".claude/skills/_shared/verify-gate.md",
  ".claude/skills/other/SKILL.md",
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

const CONTENT_TRUE = [
  "src/content/pages/about.mdx",
  "src/content/pages/legal/index.mdx",
  "src/content/posts/starting-something-new.mdx",
  "src/content/projects/focus-pocus.mdx",
  "src/content/pages/images/about-feature.webp",
  "src/content/posts/images/wayfinder-hero.jpg",
  "src/content/posts/images/focus-pocus-hero.png",
  "src/content/projects/images/focus-pocus/architecture.svg",
  "src/content/projects/images/clip.webm",
];

const CONTENT_FALSE = [
  "src/content/schemas/post.ts",
  "src/content.config.ts",
  "src/content/posts/x.md",
  "src/content/pages/about.ts",
  "src/content/pages/images/x.ts",
  "src/content/pages/images/notes.txt",
  "src/content/other/x.mdx",
  "src/content/x.mdx",
  "src/content/../pages/x.mdx",
  "/src/content/pages/a.mdx",
  "src\\content\\pages\\a.mdx",
  "src/content/pages/a b.mdx",
  "public/og-default.png",
  "src/pages/index.astro",
  "tests/build/indexing.test.ts",
  "CLAUDE.md",
];

describe("isContentOnly()", () => {
  it.each(CONTENT_TRUE)("treats %s as content-only", (p) => {
    expect(isContentOnly(p)).toBe(true);
  });
  it.each(CONTENT_FALSE)("treats %s as not content-only", (p) => {
    expect(isContentOnly(p)).toBe(false);
  });
});

describe("decide()", () => {
  it("skips when every changed file is skip-safe on a pull_request", () => {
    const d = decide({ event: "pull_request", files: [".specify/feature.json", ".claude/skills/other/SKILL.md"] });
    expect(d.full).toBe(false);
    expect(d.contentOnly).toBe(false);
  });
  it("runs everything and names the first unsafe file", () => {
    const d = decide({ event: "pull_request", files: [".specify/feature.json", "src/pages/index.astro"] });
    expect(d.full).toBe(true);
    expect(d.contentOnly).toBe(false);
    expect(d.reason).toContain("src/pages/index.astro");
  });
  it("picks the content-only tier for a single content file", () => {
    const d = decide({ event: "pull_request", files: ["src/content/posts/starting-something-new.mdx"] });
    expect(d.full).toBe(true);
    expect(d.contentOnly).toBe(true);
  });
  it("picks the content-only tier for content plus skip-safe files", () => {
    const d = decide({
      event: "pull_request",
      files: [
        "src/content/posts/starting-something-new.mdx",
        "src/content/posts/images/wayfinder-hero.jpg",
        ".specify/feature.json",
        ".specify/chores/x/plan.md",
      ],
    });
    expect(d.full).toBe(true);
    expect(d.contentOnly).toBe(true);
  });
  it("runs the full tier when content changes with a schema", () => {
    const d = decide({
      event: "pull_request",
      files: ["src/content/posts/starting-something-new.mdx", "src/content/schemas/post.ts"],
    });
    expect(d.full).toBe(true);
    expect(d.contentOnly).toBe(false);
    expect(d.reason).toContain("src/content/schemas/post.ts");
  });
  it.each([[[]], [["", "  "]], [null]] as const)("fails closed for %j", (files) => {
    const d = decide({ event: "pull_request", files: files as string[] | null });
    expect(d.full).toBe(true);
    expect(d.contentOnly).toBe(false);
  });
  it.each(["push", "workflow_dispatch", "pull_request_target"])("always runs everything for %s", (event) => {
    expect(decide({ event, files: [".specify/feature.json"] }).full).toBe(true);
    const d = decide({ event, files: ["src/content/posts/starting-something-new.mdx"] });
    expect(d.full).toBe(true);
    expect(d.contentOnly).toBe(false);
  });
  it("skips when only pipeline skills, shared wording, CLAUDE.md or the constitution change", () => {
    const d = decide({
      event: "pull_request",
      files: [
        ".claude/skills/deliver/SKILL.md",
        ".claude/skills/tweak/SKILL.md",
        ".claude/skills/squash/SKILL.md",
        ".claude/skills/chore/SKILL.md",
        ".claude/skills/_shared/open-pr.md",
        "CLAUDE.md",
        ".specify/memory/constitution.md",
      ],
    });
    expect(d.full).toBe(false);
    expect(d.contentOnly).toBe(false);
  });
  it("runs everything when a deny-listed file changes", () => {
    expect(decide({ event: "pull_request", files: [".claude/skills/setup-walkthrough/SKILL.md"] }).full).toBe(true);
  });
  it("never reports contentOnly without full", () => {
    const inputs: ChangeInput[] = [
      { event: "pull_request", files: ["CLAUDE.md"] },
      { event: "pull_request", files: ["src/content/pages/about.mdx"] },
      { event: "pull_request", files: ["src/content/pages/about.mdx", "package.json"] },
      { event: "pull_request", files: null },
      { event: "pull_request", files: [] },
      { event: "push", files: ["src/content/pages/about.mdx"] },
    ];
    for (const input of inputs) {
      const d = decide(input);
      expect(!d.contentOnly || d.full).toBe(true);
    }
  });
});

describe("toOutput()", () => {
  it("renders the GITHUB_OUTPUT lines", () => {
    expect(toOutput({ full: true, contentOnly: false, reason: "" })).toBe("full=true\ncontent_only=false\n");
    expect(toOutput({ full: false, contentOnly: false, reason: "" })).toBe("full=false\ncontent_only=false\n");
    expect(toOutput({ full: true, contentOnly: true, reason: "" })).toBe("full=true\ncontent_only=true\n");
  });
});

function walk(dir: string, anyExt = false): string[] {
  return filesUnder(dir).filter((full) => {
    const segments = relative(dir, full).split(sep);
    if (segments.some((s) => s === "node_modules" || s === "dist" || s === ".astro")) return false;
    return anyExt || /\.(ts|mjs|js|astro|json|md|mdx)$/.test(segments.at(-1)!);
  });
}

const PLACEHOLDER = /\$\{[^}]*\}|%[sd]/g;

/**
 * Expands a literal holding `${...}`, `%s` or `%d` into the repository files it
 * can name. A literal without a placeholder is returned as is. A file matching
 * the pattern counts as read only when every value the placeholders took also
 * appears as a quoted string in the reading file (its list of names), so a
 * check that reads three skills does not deny-list every skill.
 */
function expandPlaceholders(literal: string, text: string): string[] {
  const first = literal.search(PLACEHOLDER);
  if (first === -1) return [literal];
  const fixedDir = literal.slice(0, first).replace(/[^/]*$/, "");
  let candidates: string[] = [];
  try {
    candidates = walk(join(repoRoot, fixedDir), true).map((f) =>
      f.slice(repoRoot.length).split(sep).join("/"),
    );
  } catch {
    // a missing directory matches nothing
  }
  const source = literal
    .split(PLACEHOLDER)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("([^/]+)");
  const re = new RegExp(`^${source}$`);
  return candidates.filter((c) => {
    const m = re.exec(c);
    if (!m) return false;
    return m.slice(1).every((v) => text.includes(`"${v}"`) || text.includes(`'${v}'`));
  });
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
        const expanded = expandPlaceholders(p, text);
        if (expanded.length === 0) {
          offenders.push(`${file}: ${p} (placeholder path matches no file in the repository)`);
          continue;
        }
        for (const path of expanded) if (isSkipSafe(path)) offenders.push(`${file}: ${path}`);
      }
    }
    expect(offenders, "add these paths to READ_BY_CHECKS").toEqual([]);
  });
});
