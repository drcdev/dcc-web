import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

/**
 * Decides which tier of the verify gate a pull request runs. There are three:
 * skip-safe only (secretlint only), content-only (the full gate, but the build
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
export const READ_BY_CHECKS: readonly string[] = [
  ".claude/skills/chore/SKILL.md",
  ".claude/skills/deliver/SKILL.md",
  ".claude/skills/setup-walkthrough/SKILL.md",
  ".claude/skills/squash/SKILL.md",
  ".claude/skills/tweak/SKILL.md",
  "CLAUDE.md",
  ".specify/memory/constitution.md",
];

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

export interface ChangeInput {
  /** GITHUB_EVENT_NAME */
  event: string;
  /** null means the diff could not be computed */
  files: string[] | null;
}

export interface ChangeDecision {
  /** true means run the full verify gate */
  full: boolean;
  /** true means run only the build tests that read real content (implies full) */
  contentOnly: boolean;
  reason: string;
}

export function decide(input: ChangeInput): ChangeDecision {
  if (input.event !== "pull_request") {
    return { full: true, contentOnly: false, reason: `event "${input.event}" always runs the full gate` };
  }
  if (input.files === null) {
    return { full: true, contentOnly: false, reason: "could not compute the changed files, running the full gate" };
  }
  const files = input.files.map((f) => f.trim()).filter((f) => f.length > 0);
  if (files.length === 0) {
    return { full: true, contentOnly: false, reason: "empty diff, running the full gate" };
  }
  if (files.every((f) => isSkipSafe(f))) {
    return {
      full: false,
      contentOnly: false,
      reason: `all ${files.length} changed file(s) are skip-safe, running secretlint only`,
    };
  }
  const other = files.find((f) => !isSkipSafe(f) && !isContentOnly(f));
  if (other === undefined) {
    return {
      full: true,
      contentOnly: true,
      reason: `content-only change (${files.length} file(s)), running the build tests that read real content only`,
    };
  }
  return {
    full: true,
    contentOnly: false,
    reason: `${other} is neither skip-safe nor content-only, running the full gate`,
  };
}

export function toOutput(decision: ChangeDecision): string {
  return `full=${decision.full ? "true" : "false"}\ncontent_only=${decision.contentOnly ? "true" : "false"}\n`;
}

function main(): void {
  const event = process.env.GITHUB_EVENT_NAME ?? "";
  let files: string[] | null = null;
  if (event === "pull_request") {
    try {
      const out = execFileSync("git", ["diff", "--name-only", "--no-renames", "HEAD^1", "HEAD"], {
        encoding: "utf-8",
      });
      files = out.split("\n");
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      files = null;
    }
  }
  const decision = decide({ event, files });
  console.log(`full=${decision.full} content_only=${decision.contentOnly}: ${decision.reason}`);
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
    // verify aggregate fails closed on the missing full output.
    console.error(error instanceof Error ? error.message : String(error));
  }
}
