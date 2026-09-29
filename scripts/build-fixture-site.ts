// Builds the fixture site used by the section-component browser tests:
// a copy of this repository's site with tests/fixtures/pages/sections.mdx
// added as an extra page, written to .cache/fixture-site/dist
// (specs/003-standalone-pages/tasks.md, T004, T005).
import { cpSync, existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "astro";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const siteRoot = resolve(repoRoot, ".cache/fixture-site");
const fixture = resolve(repoRoot, "tests/fixtures/pages/sections.mdx");

rmSync(siteRoot, { recursive: true, force: true });
mkdirSync(siteRoot, { recursive: true });

// Finder metadata stays out of the copy. Passing a filter also keeps Node on its
// JavaScript copy: the native directory copy it uses without one fails with
// EACCES on a Docker Desktop bind mount, which is where
// scripts/visual-baselines-linux.sh builds this site.
const copyOptions = { recursive: true, filter: (source: string) => !source.endsWith(".DS_Store") };

for (const entry of ["src", "public", "setup", "astro.config.mjs", "tsconfig.json", "package.json"]) {
  cpSync(resolve(repoRoot, entry), resolve(siteRoot, entry), copyOptions);
}
// Dependencies resolve through the repository's node_modules.
symlinkSync(resolve(repoRoot, "node_modules"), resolve(siteRoot, "node_modules"), "dir");

if (existsSync(fixture)) {
  mkdirSync(resolve(siteRoot, "src/content/pages"), { recursive: true });
  cpSync(fixture, resolve(siteRoot, "src/content/pages/sections.mdx"));
  const images = resolve(repoRoot, "tests/fixtures/pages/images");
  if (existsSync(images)) cpSync(images, resolve(siteRoot, "src/content/pages/images"), copyOptions);
}

await build({ root: siteRoot, logLevel: "warn" });
