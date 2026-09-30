// Read-only repository-file provider: reads setup/*.json and docs/setup.md
// relative to the repository root. No write capability exists here.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { RepoReader } from "../types.ts";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export function createRepoReader(root: string = REPO_ROOT): RepoReader {
  const resolve = (relativePath: string) => `${root}${relativePath}`;

  return {
    readText(relativePath: string): string | null {
      const path = resolve(relativePath);
      if (!existsSync(path)) return null;
      return readFileSync(path, "utf-8");
    },
    readJson<T = unknown>(relativePath: string): T | null {
      const text = this.readText(relativePath);
      if (text === null) return null;
      return JSON.parse(text) as T;
    },
    exists(relativePath: string): boolean {
      return existsSync(resolve(relativePath));
    },
    listFiles(relativeDir: string): string[] {
      const path = resolve(relativeDir);
      if (!existsSync(path)) return [];
      return readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort();
    },
  };
}
