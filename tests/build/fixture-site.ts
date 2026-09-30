// Fixture-site harness for build-level tests (specs/003-standalone-pages/
// research.md R14). Copies this repository's site source into a temporary
// directory under .cache/, adds chosen fixture page files from
// tests/fixtures/pages/ to its src/content/pages/, and runs Astro's programmatic
// build() or sync() (docs.astro.build/en/reference/programmatic-reference/).
// The programmatic API is experimental; only tests use it.
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixturesRoot = resolve(repoRoot, "tests/fixtures/pages");

/** A fixture page file: `from` is relative to tests/fixtures/pages/, `to` (default: the base name) to src/content/pages/. */
export interface FixtureFile {
  from: string;
  to?: string;
  /** Replace the first occurrence of `[search, replacement]` in the copied file (to test an edit). */
  replace?: readonly [string, string];
}

export interface FixtureSiteOptions {
  /** `build` runs a full build; `sync` only loads and validates the content collections. Default `build`. */
  mode?: "build" | "sync";
  /**
   * Files written into the copied site after the repository files, keyed by path relative to the
   * site root. A function receives the copied file's current text (or "" when there is none) and
   * returns the new text, so a test can patch a file such as astro.config.mjs.
   */
  overrides?: Record<string, string | ((current: string) => string)>;
}

export interface FixtureSiteResult {
  ok: boolean;
  /** The error text (message, hint and file) when the run failed; empty when it succeeded. */
  message: string;
  /** The temporary site's root directory. */
  root: string;
  /** The built site's directory (exists after a successful build). */
  dist: string;
  /** Read a built file relative to `dist`. */
  read: (path: string) => string;
  /** Every built HTML file under `dist`, keyed by its path relative to `dist`. */
  htmlFiles: () => Map<string, string>;
  /** Delete the temporary site. */
  cleanup: () => void;
}

const siteEntries = ["src", "public", "setup", "astro.config.mjs", "tsconfig.json", "package.json"];

const run = promisify(execFile);
const runner = fileURLToPath(new URL("./run-astro.ts", import.meta.url));

/** Runs Astro in a child process; resolves to the error text, or "" when it succeeded. */
async function runAstro(root: string, mode: "build" | "sync"): Promise<string> {
  try {
    await run(process.execPath, [runner, root, mode], { cwd: repoRoot, maxBuffer: 16 * 1024 * 1024 });
    return "";
  } catch (error) {
    const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
    const line = stdout.trim().split("\n").at(-1) ?? "";
    try {
      return (JSON.parse(line) as { error: string }).error;
    } catch {
      return `Astro exited without a readable error.\n${stdout}\n${stderr}`.trim();
    }
  }
}

function walk(dir: string, into: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, into);
    else into.push(path);
  }
  return into;
}

export async function buildFixtureSite(
  files: readonly (string | FixtureFile)[],
  options: FixtureSiteOptions = {},
): Promise<FixtureSiteResult> {
  const root = resolve(repoRoot, ".cache/fixture-tests", randomUUID());
  mkdirSync(root, { recursive: true });
  for (const entry of siteEntries) cpSync(resolve(repoRoot, entry), resolve(root, entry), { recursive: true });
  // The contact form imports its shared limits from the Worker package.
  mkdirSync(resolve(root, "worker/src/contact"), { recursive: true });
  cpSync(resolve(repoRoot, "worker/src/contact/rules.ts"), resolve(root, "worker/src/contact/rules.ts"));
  // Dependencies resolve through the repository's node_modules.
  symlinkSync(resolve(repoRoot, "node_modules"), resolve(root, "node_modules"), "dir");

  const pagesDir = resolve(root, "src/content/pages");
  mkdirSync(pagesDir, { recursive: true });
  const images = resolve(fixturesRoot, "images");
  if (existsSync(images)) cpSync(images, resolve(pagesDir, "images"), { recursive: true });
  for (const file of files) {
    const { from, to, replace } = typeof file === "string" ? ({ from: file } as FixtureFile) : file;
    const target = resolve(pagesDir, to ?? from.split("/").at(-1) ?? from);
    mkdirSync(dirname(target), { recursive: true });
    if (replace) {
      const text = readFileSync(resolve(fixturesRoot, from), "utf-8");
      writeFileSync(target, text.replace(replace[0], replace[1]));
    } else {
      cpSync(resolve(fixturesRoot, from), target);
    }
  }

  for (const [path, value] of Object.entries(options.overrides ?? {})) {
    const target = resolve(root, path);
    mkdirSync(dirname(target), { recursive: true });
    const next = typeof value === "function" ? value(existsSync(target) ? readFileSync(target, "utf-8") : "") : value;
    writeFileSync(target, next);
  }

  const dist = resolve(root, "dist");
  const message = await runAstro(root, options.mode === "sync" ? "sync" : "build");
  const ok = message === "";

  return {
    ok,
    message,
    root,
    dist,
    read: (path) => readFileSync(resolve(dist, path), "utf-8"),
    htmlFiles: () => {
      const map = new Map<string, string>();
      if (!existsSync(dist)) return map;
      for (const path of walk(dist)) {
        if (path.endsWith(".html")) map.set(path.slice(dist.length + 1), readFileSync(path, "utf-8"));
      }
      return map;
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
