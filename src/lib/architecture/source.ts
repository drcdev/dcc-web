// Source links for the architecture diagram's part files (specs/036-technology-architecture-
// diagram/contracts/part-files.md rows P03-P07). The path rules run in the collection's `generateId`,
// so a bad path fails the build naming the part file. Git tracking is checked by a content test.
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { contentError } from "../content/errors.ts";

export const REPOSITORY_URL = "https://github.com/drcdev/dcc-web";

/**
 * @param file the part file's repository path, for the message
 * @param base absolute path of the repository root
 * @param data the parsed settings of the part file
 */
export function assertPartSource(file: string, base: string, data: unknown): void {
  const source = (data as { source?: unknown } | null | undefined)?.source;
  if (typeof source !== "string") return;
  if (source.startsWith("/") || source.split("/").includes("..")) {
    throw contentError(
      "architecture part",
      file,
      `source "${source}" must be a path inside the repository, like worker/src/index.ts.`,
    );
  }
  if (!existsSync(resolve(base, source))) {
    throw contentError("architecture part", file, `source "${source}" does not exist in the repository.`);
  }
}

/** A part file with no text below its settings has nothing to show (P07). */
export function assertPartBody(file: string, body: string): void {
  if (!body.trim()) {
    throw contentError(
      "architecture part",
      file,
      "the part has no explanation. Add a few sentences below the settings.",
    );
  }
}

/** The public address of a file (`/blob/main/`) or folder (`/tree/main/`) on the repository's main branch. */
export function sourceUrl(root: string, path: string): string {
  const clean = path.replace(/\/+$/, "");
  const kind = statSync(resolve(root, clean)).isDirectory() ? "tree" : "blob";
  return `${REPOSITORY_URL}/${kind}/main/${clean}`;
}
