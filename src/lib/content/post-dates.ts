// The check on the raw front matter text of a post file that `z.date()` cannot
// make (research R1 fallback, spike 3; contracts/build-errors.md row P4; FR-031).
// Astro's glob loader parses front matter with js-yaml, which turns an impossible
// date such as 2026-02-30 into 2 March and lets a timestamp through as a Date.
// So `date:` and `updated:` must be written exactly YYYY-MM-DD and name a real
// calendar day.
import { postFileError } from "./errors.ts";

const DATE_KEYS = ["date", "updated"] as const;
const SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The top-level front matter block of a file's source text, or "" when there is none. */
function frontMatterOf(source: string): string {
  return /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1] ?? "";
}

/** True for a real calendar date written YYYY-MM-DD. */
function isRealDate(value: string): boolean {
  const match = SHAPE.exec(value);
  if (!match) return false;
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Throws a PageContentError naming the file and the key when `date` or `updated` is written in any
 * form other than a real YYYY-MM-DD date. A missing key is left to the schema.
 * @param file repo-relative path of the post file, for the message
 * @param source the whole text of the file
 */
export function assertPostDates(file: string, source: string): void {
  const front = frontMatterOf(source);
  for (const key of DATE_KEYS) {
    // Top-level keys only: a key nested under another setting is indented.
    const line = new RegExp(`^${key}:(.*)$`, "m").exec(front);
    if (!line) continue;
    const value = (line[1] ?? "").replace(/\s+#.*$/, "").trim();
    if (!isRealDate(value)) {
      throw postFileError(
        file,
        `${key} must be a real date written YYYY-MM-DD with no quotes or time, for example ${key}: 2026-08-27. Found ${key}: ${value === "" ? "(nothing)" : value}.`,
      );
    }
  }
}
