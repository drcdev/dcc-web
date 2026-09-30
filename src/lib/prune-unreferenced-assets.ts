// Removes built assets no built file refers to, from the production build only.
//
// A draft project is left out of the production build (no page, no index entry, no
// sitemap entry), but the content layer still loads and validates it, and Astro
// emits every image and clip a collection entry names, used or not. Without this
// step a draft's pictures and clips would sit in dist/ and be served. Pruning by
// reference, rather than by file name, cannot remove an asset a published page
// uses, even when a draft has a file of the same name (specs/009-portfolio, FR-073).
// It runs as an Astro integration hook: docs.astro.build/en/reference/integrations-reference/#astrobuilddone
import { readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { isProductionBuild } from "./build-mode.ts";

const TEXT = new Set([".html", ".css", ".js", ".mjs", ".json", ".xml", ".txt", ".svg", ".webmanifest"]);

function walk(dir: string, into: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, into);
    else into.push(path);
  }
  return into;
}

/** Deletes files under `<dist>/_astro` whose name appears in no text file of `dist`. Returns the deleted paths. */
export function pruneUnreferencedAssets(dist: string): string[] {
  const files = walk(dist);
  const assetsDir = join(dist, "_astro");
  const text = files
    .filter((path) => TEXT.has(extname(path).toLowerCase()))
    .map((path) => readFileSync(path, "utf-8"))
    .join("\n");
  const removed: string[] = [];
  for (const path of files) {
    if (!path.startsWith(`${assetsDir}/`)) continue;
    const name = path.slice(assetsDir.length + 1);
    if (text.includes(name)) continue;
    rmSync(path);
    removed.push(path);
  }
  return removed;
}

export function pruneDraftAssets(env: Readonly<Record<string, string | undefined>> = process.env): AstroIntegration {
  return {
    name: "prune-draft-assets",
    hooks: {
      "astro:build:done": ({ dir }) => {
        if (isProductionBuild(env)) pruneUnreferencedAssets(fileURLToPath(dir));
      },
    },
  };
}
