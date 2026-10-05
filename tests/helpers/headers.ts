// Parser for public/_headers, shared by the unit test and the e2e spec. It imports neither
// Vitest nor Playwright, so both can use it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const headersPath = fileURLToPath(new URL("../../public/_headers", import.meta.url));

/** Header name (lowercase) → value for each rule, keyed by the rule's path or host pattern. */
export function headerRules(): Map<string, Map<string, string>> {
  const result = new Map<string, Map<string, string>>();
  let current: Map<string, string> | undefined;
  for (const line of readFileSync(headersPath, "utf-8").split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = new Map();
      result.set(line.trim(), current);
      continue;
    }
    const colon = line.indexOf(":");
    current!.set(line.slice(0, colon).trim().toLowerCase(), line.slice(colon + 1).trim());
  }
  return result;
}
