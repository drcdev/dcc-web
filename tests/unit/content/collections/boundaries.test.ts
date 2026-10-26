// Guard: each content collection has one rules module under src/content/collections/, and the
// readers in src/lib/ load and assemble without holding a rule. Unit layer: it reads source files
// and builds nothing. Every file set comes from the tree, so the guard needs no upkeep.
import { existsSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { filesUnder } from "../../../helpers/files.ts";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const src = resolve(root, "src");

const relativeSpecifiers = /(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']*)["']/g;

/** The file a relative specifier names, trying `x`, `x.ts` and `x/index.ts`. */
function resolveSpecifier(from: string, specifier: string): string | undefined {
  const base = resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.ts`, resolve(base, "index.ts")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return undefined;
}

function specifiersOf(file: string): string[] {
  return [...readFileSync(file, "utf8").matchAll(relativeSpecifiers)].map((match) => match[1]);
}

/** Every file reached from `entry` through relative imports, `entry` included. */
function reachableFrom(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (!/\.(ts|mts|js|mjs)$/.test(file)) continue;
    for (const specifier of specifiersOf(file)) {
      const target = resolveSpecifier(file, specifier);
      if (target) queue.push(target);
    }
  }
  return [...seen];
}

const allowedFolders = ["src/content/collections/", "src/lib/content/", "src/config/"];

/** Files in `files` that lie outside the folders the content config may reach. */
export function outsideAllowedFolders(files: readonly string[]): string[] {
  return files
    .map((file) => relative(root, file))
    .filter((path) => path !== "src/content.config.ts" && !allowedFolders.some((folder) => path.startsWith(folder)));
}

/** Basenames that appear more than once among `paths`. */
export function duplicateBasenames(paths: readonly string[]): string[] {
  const counts = new Map<string, number>();
  for (const path of paths) counts.set(basename(path), (counts.get(basename(path)) ?? 0) + 1);
  return [...counts].filter(([, count]) => count > 1).map(([name]) => name).sort();
}

/** Readers (files under src/lib that call getCollection) with an import of the content error helper. */
export function readersImportingErrors(files: readonly string[]): string[] {
  return files
    .filter((file) => readFileSync(file, "utf8").includes("getCollection("))
    .filter((file) => specifiersOf(file).some((specifier) => /(^|\/)errors(\.ts)?$/.test(specifier)))
    .map((file) => relative(root, file));
}

const tsFilesUnder = (dir: string) => filesUnder(resolve(src, dir)).filter((path) => path.endsWith(".ts"));

describe("content collection boundaries", () => {
  it("content.config.ts reaches only rules modules, shared helpers and config", () => {
    const reached = reachableFrom(resolve(src, "content.config.ts"));
    expect(reached.length).toBeGreaterThan(1);
    expect(outsideAllowedFolders(reached)).toEqual([]);
  });

  it("no two modules in src/content/collections and src/lib share a file name", () => {
    const files = [...tsFilesUnder("content/collections"), ...tsFilesUnder("lib")];
    expect(files.length).toBeGreaterThan(8);
    expect(duplicateBasenames(files)).toEqual([]);
  });

  it("no reader imports the content error helper", () => {
    const files = tsFilesUnder("lib");
    expect(files.some((file) => file.endsWith("src/lib/now.ts"))).toBe(true);
    expect(readersImportingErrors(files)).toEqual([]);
  });
});
