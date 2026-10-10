import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { collectFiles, decide, isContentOnly, isDocs, isSkipSafe, toOutput } from "../../../scripts/ci/changed-paths.ts";
import type { ChangeInput } from "../../../scripts/ci/changed-paths.ts";
import { filesUnder } from "../../helpers/files.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

const SAFE = [
  "CLAUDE.md",
  "VOICE.md",
  ".specify/memory/constitution.md",
  ".specify/extensions/.registry",
  ".specify/notes.txt",
  ".claude/settings.json",
  ".claude/agents/x.md",
  ".specify/templates/x.toml",
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
  ".claude/skills/deliver/SKILL.md",
  ".claude/skills/_shared/open-pr.md",
  ".claude/skills/x/notes.txt",
  ".claude/skills/x/run.ts",
  ".specify/x.mjs",
  ".specify/x.astro",
  ".github/CODEOWNERS",
  ".github/dependabot.yml",
  "setup/github-ruleset.json",
  "nested/VOICE.md",
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

const DOCS_TRUE = [
  "docs/testing.md",
  "docs/design/blog.md",
  "docs/--help.md",
  ".claude/skills/deliver/SKILL.md",
  ".claude/skills/tweak/SKILL.md",
  ".claude/skills/squash/SKILL.md",
  ".claude/skills/chore/SKILL.md",
  ".claude/skills/_shared/open-pr.md",
  ".claude/skills/_shared/verify-gate.md",
  ".claude/skills/other/SKILL.md",
  ".claude/skills/setup-walkthrough/SKILL.md",
  ".claude/skills/x/notes.txt",
];
const DOCS_FALSE = [
  "docs/x.png",
  "docs/x.mdx",
  "docs/x.MD",
  "docs/x.markdown",
  "Docs/a.md",
  "README.md",
  "src/docs/a.md",
  "docs",
  "docs/../src/a.md",
  "/docs/a.md",
  "docs\\a.md",
  '"docs/\\303\\251.md"',
  ".claude/skills/x/run.ts",
  ".claude/skills/x/run.js",
  ".claude/agents/x.md",
  ".claude/skills",
  ".claude/skills/../../src/a.md",
];

describe("isDocs()", () => {
  it.each(DOCS_TRUE)("treats %s as documentation", (p) => {
    expect(isDocs(p)).toBe(true);
  });
  it.each(DOCS_FALSE)("treats %s as not documentation", (p) => {
    expect(isDocs(p)).toBe(false);
  });
});

describe("decide() docs tier", () => {
  const pr = (files: string[] | null) => decide({ event: "pull_request", files });
  it("picks docs for docs files only", () => {
    expect(pr(["docs/testing.md", "docs/design/blog.md"]).tier).toBe("docs");
  });
  it("picks docs for docs plus skip-safe files", () => {
    expect(pr(["docs/testing.md", ".specify/feature.json"]).tier).toBe("docs");
  });
  it("keeps skip-safe when no docs file changed", () => {
    expect(pr([".specify/feature.json"]).tier).toBe("skip-safe");
  });
  it("picks content-only for docs plus content", () => {
    expect(pr(["docs/testing.md", "src/content/posts/starting-something-new.mdx"]).tier).toBe("content-only");
  });
  it("runs full for docs plus source, naming the file", () => {
    const d = pr(["docs/testing.md", "src/pages/index.astro"]);
    expect(d.tier).toBe("full");
    expect(d.reason).toContain("src/pages/index.astro");
  });
  it("runs full for docs plus a non-markdown docs file", () => {
    const d = pr(["docs/testing.md", "docs/design/x.png"]);
    expect(d.tier).toBe("full");
    expect(d.reason).toContain("docs/design/x.png");
  });
  it.each([".github/workflows/ci.yml", "scripts/ci/changed-paths.ts", "scripts/ci/verify-needs.ts"])(
    "runs full for docs plus %s",
    (file) => {
      const d = pr(["docs/testing.md", file]);
      expect(d.tier).toBe("full");
      expect(d.reason).toContain(file);
    },
  );
  it.each([[[]], [["", "  "]], [null]] as const)("fails closed for %j", (files) => {
    expect(pr(files as string[] | null).tier).toBe("full");
  });
  it("names the counts in the docs reason", () => {
    expect(pr(["docs/a.md", "docs/b.md"]).reason).toContain("2");
  });
});

describe("decide()", () => {
  it("skips when every changed file is skip-safe on a pull_request", () => {
    const d = decide({ event: "pull_request", files: [".specify/feature.json", ".claude/settings.json"] });
    expect(d.tier).toBe("skip-safe");
  });
  it("runs everything and names the first unsafe file", () => {
    const d = decide({ event: "pull_request", files: [".specify/feature.json", "src/pages/index.astro"] });
    expect(d.tier).toBe("full");
    expect(d.reason).toContain("src/pages/index.astro");
  });
  it("picks the content-only tier for a single content file", () => {
    const d = decide({ event: "pull_request", files: ["src/content/posts/starting-something-new.mdx"] });
    expect(d.tier).toBe("content-only");
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
    expect(d.tier).toBe("content-only");
  });
  it("runs the full tier when content changes with a schema", () => {
    const d = decide({
      event: "pull_request",
      files: ["src/content/posts/starting-something-new.mdx", "src/content/schemas/post.ts"],
    });
    expect(d.tier).toBe("full");
    expect(d.reason).toContain("src/content/schemas/post.ts");
  });
  it.each([[[]], [["", "  "]], [null]] as const)("fails closed for %j", (files) => {
    const d = decide({ event: "pull_request", files: files as string[] | null });
    expect(d.tier).toBe("full");
  });
  it.each(["workflow_dispatch", "pull_request_target"])("always runs everything for %s", (event) => {
    expect(decide({ event, files: [".specify/feature.json"] }).tier).toBe("full");
    expect(decide({ event, files: ["src/content/posts/starting-something-new.mdx"] }).tier).toBe("full");
  });
  it("runs the docs tier when only pipeline skills, shared wording, CLAUDE.md or the constitution change", () => {
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
    expect(d.tier).toBe("docs");
  });
  it("skips when only CLAUDE.md, VOICE.md, the constitution and Spec Kit files change", () => {
    const d = decide({
      event: "pull_request",
      files: [
        "CLAUDE.md",
        "VOICE.md",
        ".specify/memory/constitution.md",
        ".specify/extensions/.registry",
        ".claude/settings.json",
      ],
    });
    expect(d.tier).toBe("skip-safe");
  });
  it("runs the docs tier when the setup-walkthrough skill changes", () => {
    expect(decide({ event: "pull_request", files: [".claude/skills/setup-walkthrough/SKILL.md"] }).tier).toBe("docs");
  });
  it.each([
    ".claude/hooks/check.ts",
    ".claude/skills/x/run.ts",
    ".specify/x.astro",
    ".github/CODEOWNERS",
    ".github/dependabot.yml",
    "setup/github-ruleset.json",
    "nested/CLAUDE.md",
    "nested/VOICE.md",
  ])("runs the full tier for %s alone", (file) => {
    expect(decide({ event: "pull_request", files: [file] }).tier).toBe("full");
  });
  it("always returns one of the known tiers with a reason", () => {
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
      expect(["skip-safe", "docs", "content-only", "full"]).toContain(d.tier);
      expect(d.reason.length).toBeGreaterThan(0);
    }
  });
});

describe("toOutput()", () => {
  it.each(["skip-safe", "content-only", "full"] as const)("renders tier=%s for GITHUB_OUTPUT", (tier) => {
    expect(toOutput({ tier, reason: "" })).toBe(`tier=${tier}\n`);
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
  if (first === -1) {
    // A literal naming a directory stands for every file under it.
    const dir = join(repoRoot, literal);
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      return walk(dir, true).map((f) => f.slice(repoRoot.length).split(sep).join("/"));
    }
    return [literal];
  }
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
    const pattern = /["'`](?:\.\.\/)*\/?((?:\.claude|\.specify|specs)\/[^"'`\s]+|CLAUDE\.md|VOICE\.md)/g;
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
    expect(offenders, "a check reads these skip-safe paths; make them docs tier (a unit test reads them) or full").toEqual([]);
  });
});

describe("collectFiles()", () => {
  const BEFORE = "a".repeat(40);
  function fake(impl: (args: string[]) => string = () => "") {
    const calls: string[][] = [];
    const git = (args: string[]): string => {
      calls.push(args);
      return impl(args);
    };
    return { git, calls };
  }

  it("diffs HEAD^1 to HEAD for a pull request", () => {
    const { git, calls } = fake(() => "a.md\nb.md\n");
    expect(collectFiles({ event: "pull_request" }, git)).toEqual(["a.md", "b.md", ""]);
    expect(calls).toEqual([["diff", "--name-only", "--no-renames", "HEAD^1", "HEAD"]]);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["short", "abc123"],
    ["non-hex", "g".repeat(40)],
    ["uppercase", "A".repeat(40)],
    ["all zeros", "0".repeat(40)],
    ["too long", "a".repeat(41)],
  ])("returns null without calling git for a %s before on a push", (_name, before) => {
    const { git, calls } = fake();
    expect(collectFiles({ event: "push", before }, git)).toBeNull();
    expect(calls).toEqual([]);
  });

  it("returns null when the fetch throws", () => {
    const { git } = fake((args) => {
      if (args[0] === "cat-file" || args[0] === "fetch") throw new Error("no such commit");
      return "x";
    });
    expect(collectFiles({ event: "push", before: BEFORE }, git)).toBeNull();
  });

  it("returns null when the diff throws", () => {
    const { git } = fake((args) => {
      if (args[0] === "diff") throw new Error("bad object");
      return "";
    });
    expect(collectFiles({ event: "push", before: BEFORE }, git)).toBeNull();
  });

  it("fetches the validated id when it is missing, then diffs it to HEAD with renames split", () => {
    const { git, calls } = fake((args) => {
      if (args[0] === "cat-file") throw new Error("missing");
      return args[0] === "diff" ? "docs/a.md\ndocs/b.md\n" : "";
    });
    const files = collectFiles({ event: "push", before: BEFORE }, git);
    expect(files).toEqual(["docs/a.md", "docs/b.md", ""]);
    expect(calls).toEqual([
      ["cat-file", "-e", `${BEFORE}^{commit}`],
      ["fetch", "--no-tags", "--depth=1", "origin", BEFORE],
      ["diff", "--name-only", "--no-renames", BEFORE, "HEAD"],
    ]);
  });

  // A shallow fetch into a full local clone would make that clone shallow.
  it("does not fetch when the before commit is already present", () => {
    const { git, calls } = fake((args) => (args[0] === "diff" ? "docs/a.md\n" : ""));
    expect(collectFiles({ event: "push", before: BEFORE }, git)).toEqual(["docs/a.md", ""]);
    expect(calls).toEqual([
      ["cat-file", "-e", `${BEFORE}^{commit}`],
      ["diff", "--name-only", "--no-renames", BEFORE, "HEAD"],
    ]);
  });

  it("returns null for any other event", () => {
    const { git, calls } = fake();
    expect(collectFiles({ event: "workflow_dispatch", before: BEFORE }, git)).toBeNull();
    expect(calls).toEqual([]);
  });

  it("diffs the merge base of a local base ref to HEAD and never fetches", () => {
    const { git, calls } = fake(() => "docs/a.md\n");
    expect(collectFiles({ event: "local", base: "origin/main" }, git)).toEqual(["docs/a.md", ""]);
    expect(calls).toEqual([["diff", "--name-only", "--no-renames", "origin/main...HEAD"]]);
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["leading dash", "--output=x"],
    ["range", "a..b"],
    ["whitespace", "origin/main HEAD"],
    ["backslash", "origin\\main"],
  ])("returns null without calling git for a %s local base", (_name, base) => {
    const { git, calls } = fake();
    expect(collectFiles({ event: "local", base }, git)).toBeNull();
    expect(calls).toEqual([]);
  });

  it("returns null when the local diff throws", () => {
    const { git } = fake(() => {
      throw new Error("unknown revision");
    });
    expect(collectFiles({ event: "local", base: "origin/main" }, git)).toBeNull();
  });

  it("lets decide() sort a local branch like a pull request", () => {
    expect(decide({ event: "local", files: ["docs/testing.md"] }).tier).toBe("docs");
    expect(decide({ event: "local", files: ["CLAUDE.md"] }).tier).toBe("skip-safe");
    expect(decide({ event: "local", files: ["src/pages/index.astro"] }).tier).toBe("full");
    expect(decide({ event: "local", files: null }).tier).toBe("full");
  });

  it("lets decide() sort a docs-only push and fail closed on unknown files", () => {
    expect(decide({ event: "push", files: ["docs/testing.md"] }).tier).toBe("docs");
    expect(decide({ event: "push", files: null }).tier).toBe("full");
  });
});
