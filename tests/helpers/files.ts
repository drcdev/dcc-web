// One recursive file lister for tests. It imports neither Vitest nor Playwright, so unit, build
// and e2e specs can all use it. Each caller keeps its own filter on the result.
import { readdirSync } from "node:fs";
import { join } from "node:path";

/** Absolute paths of every file under `dir`, at any depth (directories are not listed). */
export function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
}
