import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";

/**
 * Decides whether a pull request can skip the heavy part of the verify gate.
 * A path is skip-safe only when no check reads it. Anything not positively
 * recognised runs the full gate (fail closed).
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
  ".specify/memory/constitution.md",
];

export function isSkipSafe(path: string): boolean {
  if (path.includes("..") || path.startsWith("/") || path.includes("\\")) return false;
  if (READ_BY_CHECKS.includes(path)) return false;
  if (SKIP_SAFE_FILES.includes(path)) return true;
  if (!SKIP_SAFE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  return SKIP_SAFE_EXTENSIONS.some((ext) => path.endsWith(ext));
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
  reason: string;
}

export function decide(input: ChangeInput): ChangeDecision {
  if (input.event !== "pull_request") {
    return { full: true, reason: `event "${input.event}" always runs the full gate` };
  }
  if (input.files === null) {
    return { full: true, reason: "could not compute the changed files, running the full gate" };
  }
  const files = input.files.map((f) => f.trim()).filter((f) => f.length > 0);
  if (files.length === 0) {
    return { full: true, reason: "empty diff, running the full gate" };
  }
  const unsafe = files.find((f) => !isSkipSafe(f));
  if (unsafe !== undefined) {
    return { full: true, reason: `${unsafe} is not skip-safe, running the full gate` };
  }
  return {
    full: false,
    reason: `all ${files.length} changed file(s) are skip-safe, running secretlint only`,
  };
}

export function toOutput(decision: ChangeDecision): string {
  return `full=${decision.full ? "true" : "false"}\n`;
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
  console.log(`full=${decision.full}: ${decision.reason}`);
  if (files) console.log(`Changed files:\n${files.filter(Boolean).join("\n")}`);
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) appendFileSync(outputFile, toOutput(decision));
}

const isMainModule = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  try {
    main();
  } catch (error) {
    // Never fail the job over a detection problem: an unset output runs the full gate.
    console.error(error instanceof Error ? error.message : String(error));
  }
}
