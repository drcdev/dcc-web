// A fixture site copies src/ but not the repository's other folders, while each architecture part
// file (src/content/architecture/) names a repository path as its `source` and the loader checks
// that it exists. This links every such path that the copy lacks to the repository's own, so the
// real part files pass the loader in a fixture build (specs/036-technology-architecture-diagram).
import { existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function linkPartSources(repoRoot: string, siteRoot: string): void {
  const parts = resolve(siteRoot, "src/content/architecture");
  if (!existsSync(parts)) return;
  for (const name of readdirSync(parts)) {
    const source = /^source:\s*(\S+)\s*$/m.exec(readFileSync(resolve(parts, name), "utf-8"))?.[1];
    if (!source || existsSync(resolve(siteRoot, source))) continue;
    mkdirSync(dirname(resolve(siteRoot, source)), { recursive: true });
    symlinkSync(resolve(repoRoot, source), resolve(siteRoot, source));
  }
}
