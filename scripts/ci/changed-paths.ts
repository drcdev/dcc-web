import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";

/**
 * Decides which tier of the verify gate a pull request or a push to `main` runs. There are four:
 * skip-safe only (secretlint only), docs (secretlint and the unit tests, for Markdown files under
 * `docs/` and non-code files under `.claude/skills/`, which unit tests read), content-only (the
 * full gate, but the build tests that read real content by name instead of the whole build
 * project) and full. A path is skip-safe only when no check reads it, and content-only only when
 * it is an `.mdx` file or an image under a content collection. Anything not positively
 * recognised runs the full gate (fail closed).
 *
 * Under `.claude/` and `.specify/` every file is skip-safe (only the local Claude Code harness and
 * Spec Kit read them) except code files, which `eslint .` and `astro check`/`tsc` read, and
 * `.claude/skills/`, which is docs tier. CODE_EXTENSIONS follows ESLint's flat-config default
 * patterns plus the typescript-eslint and Astro plugin patterns; update it when `eslint.config.js`
 * lints a new extension.
 */

export const SKIP_SAFE_FILES: readonly string[] = ["CLAUDE.md", "VOICE.md"];
/** Every file under these prefixes is skip-safe unless it is code or under SKILLS_PREFIX. */
export const AGENT_PREFIXES: readonly string[] = [".claude/", ".specify/"];
/** Under `specs/` only these extensions are skip-safe. */
export const SKIP_SAFE_EXTENSIONS: readonly string[] = [
  ".md",
  ".yml",
  ".yaml",
  ".json",
  ".sh",
  ".py",
  ".ps1",
];
export const CODE_EXTENSIONS: readonly string[] = [
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".ts",
  ".mts",
  ".cts",
  ".tsx",
  ".astro",
];
/** Skill files: a unit test reads them, so they are docs tier, not skip-safe. */
export const SKILLS_PREFIX = ".claude/skills/";

function isMalformed(path: string): boolean {
  return path.includes("..") || path.startsWith("/") || path.includes("\\");
}

function isCode(path: string): boolean {
  return CODE_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function isSkipSafe(path: string): boolean {
  if (isMalformed(path)) return false;
  if (SKIP_SAFE_FILES.includes(path)) return true;
  if (AGENT_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return !path.startsWith(SKILLS_PREFIX) && !isCode(path);
  }
  if (path.startsWith("specs/")) return SKIP_SAFE_EXTENSIONS.some((ext) => path.endsWith(ext));
  return false;
}

export const CONTENT_FILE =
  /^src\/content\/(pages|posts|projects)\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.mdx$/;
export const CONTENT_IMAGE =
  /^src\/content\/(pages|posts|projects)\/images\/(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(avif|gif|jpe?g|mp4|png|svg|webm|webp)$/;

export function isContentOnly(path: string): boolean {
  if (isMalformed(path)) return false;
  return CONTENT_FILE.test(path) || CONTENT_IMAGE.test(path);
}

/**
 * A Markdown file under `docs/`, or a non-code file under `.claude/skills/`. Only unit tests read
 * these files, so only unit tests run.
 */
export function isDocs(path: string): boolean {
  if (isMalformed(path)) return false;
  if (path.startsWith("docs/")) return path.endsWith(".md");
  return path.startsWith(SKILLS_PREFIX) && !isCode(path);
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
  if (input.event !== "pull_request" && input.event !== "push" && input.event !== "local") {
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
 * to git. The `local` event (`--base <ref>`) diffs the merge base of a plain ref against HEAD,
 * without fetching, so an agent can run only its tier's checks before opening a pull request.
 */
export function collectFiles(
  input: { event: string; before?: string | undefined; base?: string | undefined },
  git: GitRunner,
): string[] | null {
  try {
    if (input.event === "local") {
      const base = input.base;
      if (base === undefined || base === "" || base.startsWith("-") || /\.\.|\s|\\/.test(base)) {
        console.error("local base is not a plain ref, running the full gate");
        return null;
      }
      return git(["diff", "--name-only", "--no-renames", `${base}...HEAD`]).split("\n");
    }
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
  const { values } = parseArgs({ options: { base: { type: "string" } }, strict: false });
  const base = typeof values.base === "string" ? values.base : undefined;
  const event = base !== undefined ? "local" : (process.env.GITHUB_EVENT_NAME ?? "");
  const files = collectFiles({ event, before: process.env.BEFORE_SHA, base }, (args) =>
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
