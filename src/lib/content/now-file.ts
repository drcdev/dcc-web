// The check on the raw front matter of the Now file that the schema cannot make: Astro's glob
// loader parses front matter with js-yaml, which turns 2026-02-30 into 2 March, so the raw text of
// `updated` is checked as a real YYYY-MM-DD day (contracts/build-errors.md row N02).
import { isRealDate } from "./dates.ts";
import { contentError } from "./errors.ts";

/** Throws a PageContentError when `updated` is written in any form other than a real YYYY-MM-DD date. */
export function assertNowDate(file: string, source: string): void {
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1] ?? "";
  const line = /^updated:(.*)$/m.exec(front);
  if (!line) return; // a missing key is the schema's to report (N01)
  const value = (line[1] ?? "").replace(/\s+#.*$/, "").trim();
  if (!isRealDate(value)) {
    throw contentError(
      "now",
      file,
      `updated must be a real date written YYYY-MM-DD with no quotes or time. Found ${value === "" ? "(nothing)" : value}.`,
    );
  }
}
