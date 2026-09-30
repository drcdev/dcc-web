// Fixture-site harness for build-level tests (specs/003-standalone-pages/
// research.md R14). Copies this repository's site source into a temporary
// directory under .cache/, adds chosen fixture page files from
// tests/fixtures/pages/ to its src/content/pages/ (and, with the `posts` option,
// post files from tests/fixtures/posts/ to its src/content/posts/, and with the `projects`
// option, project files from tests/fixtures/projects/ to its src/content/projects/), and runs Astro's programmatic
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
const postFixturesRoot = resolve(repoRoot, "tests/fixtures/posts");
const projectFixturesRoot = resolve(repoRoot, "tests/fixtures/projects");

/**
 * A fixture file: `from` is relative to tests/fixtures/pages/ (for the `posts` option, to
 * tests/fixtures/posts/), `to` (default: the base name) to src/content/pages/ (or src/content/posts/).
 */
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
  /**
   * Post fixture files, relative to tests/fixtures/posts/ (for example `valid/minimal.mdx` or
   * `broken/P01-no-title.mdx`), copied into the site's src/content/posts/ together with the
   * pictures in tests/fixtures/posts/images/.
   */
  posts?: readonly (string | FixtureFile)[];
  /**
   * Environment variables for the build, such as `WORKERS_CI`. The runner's own `WORKERS_CI` and
   * `WORKERS_CI_BRANCH` are never passed on, so a build depends only on what the test sets.
   */
  env?: Record<string, string>;
  /** Fixture project files from tests/fixtures/projects/, copied to src/content/projects/ with their images. */
  projects?: readonly (string | FixtureFile)[];
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
async function runAstro(root: string, mode: "build" | "sync", env: Record<string, string> = {}): Promise<string> {
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name !== "WORKERS_CI" && name !== "WORKERS_CI_BRANCH"),
  );
  try {
    await run(process.execPath, [runner, root, mode], {
      cwd: repoRoot,
      maxBuffer: 16 * 1024 * 1024,
      // A Workers Builds build (WORKERS_CI=1) must be given the Turnstile site key
      // (astro.config.mjs; specs/007-contact-form/research.md R6), so the harness
      // supplies Cloudflare's always-pass test key unless a test sets its own.
      env: { PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA", ...inherited, ...env },
    });
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

/** Copies fixture files from `fromRoot` into `into`, applying each file's `to` name and `replace` edit. */
function copyFixtures(files: readonly (string | FixtureFile)[], fromRoot: string, into: string): void {
  for (const file of files) {
    const { from, to, replace } = typeof file === "string" ? ({ from: file } as FixtureFile) : file;
    const target = resolve(into, to ?? from.split("/").at(-1) ?? from);
    mkdirSync(dirname(target), { recursive: true });
    if (replace) {
      const text = readFileSync(resolve(fromRoot, from), "utf-8");
      writeFileSync(target, text.replace(replace[0], replace[1]));
    } else {
      cpSync(resolve(fromRoot, from), target);
    }
  }
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
  copyFixtures(files, fixturesRoot, pagesDir);

  if (options.posts) {
    const postsDir = resolve(root, "src/content/posts");
    mkdirSync(postsDir, { recursive: true });
    const postImages = resolve(postFixturesRoot, "images");
    if (existsSync(postImages)) cpSync(postImages, resolve(postsDir, "images"), { recursive: true });
    copyFixtures(options.posts, postFixturesRoot, postsDir);
  }

  if (options.projects) {
    const projectsDir = resolve(root, "src/content/projects");
    mkdirSync(projectsDir, { recursive: true });
    const projectImages = resolve(projectFixturesRoot, "images");
    if (existsSync(projectImages)) cpSync(projectImages, resolve(projectsDir, "images"), { recursive: true });
    copyFixtures(options.projects, projectFixturesRoot, projectsDir);
  }

  for (const [path, value] of Object.entries(options.overrides ?? {})) {
    const target = resolve(root, path);
    mkdirSync(dirname(target), { recursive: true });
    const next = typeof value === "function" ? value(existsSync(target) ? readFileSync(target, "utf-8") : "") : value;
    writeFileSync(target, next);
  }

  const dist = resolve(root, "dist");
  const message = await runAstro(root, options.mode === "sync" ? "sync" : "build", options.env);
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
