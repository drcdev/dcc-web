import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

/**
 * Decides which tier of the verify gate a pull request or a push to `main` runs. There are four:
 * skip-safe only (secretlint only), docs (secretlint and the unit tests, for
 * Markdown files under `docs/`), content-only (the full gate, but the build
 * tests that read real content by name instead of the whole build project) and
 * full. A path is skip-safe only when no check reads it, and content-only only
 * when it is an `.mdx` file or an image under a content collection. Anything
 * not positively recognised runs the full gate (fail closed).
 */

export const SKIP_SAFE_FILES: readonly string[] = ["CLAUDE.md"];
export const SKIP_SAFE_PREFIXES: readonly string[] = [".claude/", ".specify/", "specs/"];
export const SKIP_SAFE_EXTENSIONS: readonly string[] = [
  ".md",
  ".yml",
  ".yaml",
  ".json",
  ".sh",
  ".py",
  ".ps1",
];
/** Files under a skip-safe prefix that a test or check reads. */
export const READ_BY_CHECKS: readonly string[] = [".claude/skills/setup-walkthrough/SKILL.md"];

export function isSkipSafe(path: string): boolean {
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  if (READ_BY_CHECKS.includes(path)) return false;
  if (SKIP_SAFE_FILES.includes(path)) return true;
  if (!SKIP_SAFE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  return SKIP_SAFE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export const CONTENT_FILE =
  /^src\/content\/(pages|posts|projects)\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.mdx$/;
export const CONTENT_IMAGE =
  /^src\/content\/(pages|posts|projects)\/images\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(avif|gif|jpe?g|mp4|png|svg|webm|webp)$/;

export function isContentOnly(path: string): boolean {
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  return CONTENT_FILE.test(path) || CONTENT_IMAGE.test(path);
}

/** A Markdown file under `docs/`. Only unit tests read these files, so only unit tests run. */
export function isDocs(path: string): boolean {
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  return path.startsWith("docs/") && path.endsWith(".md");
}

export interface ChangeInput {
  /** GITHUB_EVENT_NAME */
  event: string;
  /** null means the diff could not be computed */
  files: string[] | null;
}

export type Tier = "skip-safe" | "docs" | "content-only" | "full";

export interface ChangeDecision {
  tier: Tier;
  reason: string;
}

export function decide(input: ChangeInput): ChangeDecision {
  if (input.event !== "pull_request" && input.event !== "push") {
    return { tier: "full", reason: `event "${input.event}" always runs the full gate` };
  }
  if (input.files === null) {
    return { tier: "full", reason: "could not compute the changed files, running the full gate" };
  }
  const files = input.files.map((f) => f.trim()).filter((f) => f.length > 0);
  if (files.length === 0) {
    return { tier: "full", reason: "empty diff, running the full gate" };
  }
  if (files.every((f) => isSkipSafe(f))) {
    return {
      tier: "skip-safe",
      reason: `all ${files.length} changed file(s) are skip-safe, running secretlint only`,
    };
  }
  if (files.every((f) => isSkipSafe(f) || isDocs(f))) {
    const docs = files.filter((f) => isDocs(f)).length;
    return {
      tier: "docs",
      reason: `${docs} documentation file(s) and ${files.length - docs} skip-safe file(s), running secretlint and the unit tests`,
    };
  }
  const other = files.find((f) => !isSkipSafe(f) && !isDocs(f) && !isContentOnly(f));
  if (other === undefined) {
    return {
      tier: "content-only",
      reason: `content-only change (${files.length} file(s)), running the build tests that read real content only`,
    };
  }
  return {
    tier: "full",
    reason: `${other} is not skip-safe, documentation or content-only, running the full gate`,
  };
}

export function toOutput(decision: ChangeDecision): string {
  return `tier=${decision.tier}\n`;
}

export type GitRunner = (args: string[]) => string;

const FULL_SHA = /^[0-9a-f]{40}$/;
const ZERO_SHA = /^0{40}$/;

function hasCommit(git: GitRunner, sha: string): boolean {
  try {
    git(["cat-file", "-e", `${sha}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * The files a run changed, or null when they cannot be determined (which `decide` maps to the
 * full gate). A pull request diffs the merge commit against its first parent. A push diffs the
 * `before` commit against HEAD; `before` must be 40 lowercase hex characters and not all zeros,
 * and is fetched by id first unless it is already present (a shallow fetch into a full local
 * clone would make that clone shallow). Paths are only read from git output, never passed back
 * to git.
 */
export function collectFiles(
  input: { event: string; before?: string | undefined },
  git: GitRunner,
): string[] | null {
  try {
    if (input.event === "pull_request") {
      return git(["diff", "--name-only", "--no-renames", "HEAD^1", "HEAD"]).split("\n");
    }
    if (input.event === "push") {
      const before = input.before;
      if (before === undefined || !FULL_SHA.test(before) || ZERO_SHA.test(before)) {
        console.error("push has no usable before commit, running the full gate");
        return null;
      }
      if (!hasCommit(git, before)) git(["fetch", "--no-tags", "--depth=1", "origin", before]);
      return git(["diff", "--name-only", "--no-renames", before, "HEAD"]).split("\n");
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  return null;
}

function main(): void {
  const event = process.env.GITHUB_EVENT_NAME ?? "";
  const files = collectFiles({ event, before: process.env.BEFORE_SHA }, (args) =>
    execFileSync("git", args, { encoding: "utf-8" }),
  );
  const decision = decide({ event, files });
  console.log(`tier=${decision.tier}: ${decision.reason}`);
  if (files) console.log(`Changed files:\n${files.filter(Boolean).join("\n")}`);
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) appendFileSync(outputFile, toOutput(decision));
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  try {
    main();
  } catch (error) {
    // Never fail the job over a detection problem: an unset output runs every check, and the
    // verify aggregate fails closed on the missing tier output.
    console.error(error instanceof Error ? error.message : String(error));
  }
}
