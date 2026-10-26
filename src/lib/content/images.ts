// Checks that images named in a page's, post's or project's settings exist, before
// Astro bundles them. Astro's own error for a missing file names only the image, so
// this check adds the file (contracts/build-errors.md page row 6, post row P9 and
// project row S09; FR-007).
//
// It also holds the image folder check (#201): every image sits in `images/<entry>/`, named after the
// entry that uses it, so retiring an entry means deleting its file and its folder. The check runs as an
// Astro integration at the start of a production build
// (docs.astro.build/en/reference/integrations-reference/#astrobuildstart, with the project root from
// #astroconfigdone). It does not run in `astro dev`, so a picture can be added before it is used.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { contentError, type ContentKind } from "./errors.ts";

type Src = { src?: unknown } | null | undefined;

const DIRS: Record<ContentKind, string> = {
  page: "src/content/pages",
  post: "src/content/posts",
  project: "src/content/projects",
};

function pageOrPostSources(data: unknown): unknown[] {
  const d = (data ?? {}) as { image?: Src; featureImage?: Src; intro?: { photo?: Src } };
  return [d.image?.src, d.featureImage?.src, d.intro?.photo?.src];
}

function projectSources(data: unknown): unknown[] {
  const d = (data ?? {}) as { visual?: Src; image?: Src; visuals?: Record<string, Src> };
  return [d.visual?.src, d.image?.src, ...Object.values(d.visuals ?? {}).map((visual) => visual?.src)];
}

function imageProblem(src: string, kind: "page" | "post"): string {
  return `the image ${src} does not exist. Add the file, or fix the path (it is relative to the ${kind} file).`;
}

// Where each kind keeps its image paths, and how its message words the problem.
const KINDS: Record<ContentKind, { sources: (data: unknown) => unknown[]; problem: (src: string) => string }> = {
  page: { sources: pageOrPostSources, problem: (src) => imageProblem(src, "page") },
  post: { sources: pageOrPostSources, problem: (src) => imageProblem(src, "post") },
  project: {
    sources: projectSources,
    problem: (src) => `the file ${src} does not exist. Add the file, or fix the path (it is relative to the project file).`,
  },
};

/**
 * @param kind which kind of file this is, for the error prefix and the message wording
 * @param root absolute path of the kind's content folder (for example src/content/pages)
 * @param file path of the file below it, for example `legal/index.mdx`
 * @param data the parsed settings of the file
 */
export function assertImagesExist(kind: ContentKind, root: string, file: string, data: unknown): void {
  const { sources, problem } = KINDS[kind];
  for (const src of sources(data)) {
    if (typeof src !== "string" || !src.startsWith(".")) continue;
    if (!existsSync(resolve(root, dirname(file), src))) {
      throw contentError(kind, `${DIRS[kind]}/${file}`, problem(src));
    }
  }
}

const ENTRY_FILE = /\.mdx?$/;

/** The folder an entry's images live in, below `images/`: its path without the extension; `index` is dropped from a nested page. */
function folderOf(kind: ContentKind, file: string): string {
  const path = file.replace(ENTRY_FILE, "");
  if (kind === "page") return path.endsWith("/index") ? path.slice(0, -"/index".length) : path;
  return posix.basename(path);
}

/**
 * Fails when an image sits outside an entry folder or no entry uses it (#201).
 * `file` and image paths are relative to the collection folder (`about.mdx`, `images/about/x.webp`).
 * A use is any relative path in an entry's text (settings or body) that resolves to the image.
 * Problems are found in sorted path order and the first is thrown.
 */
export function checkImageFolders(
  kind: ContentKind,
  entries: readonly { file: string; text: string }[],
  images: readonly string[],
): void {
  const dir = DIRS[kind];
  const folders = new Set(entries.map((entry) => folderOf(kind, entry.file)));
  const used = new Set<string>();
  for (const { file, text } of entries) {
    for (const [path] of text.matchAll(/\.{1,2}\/[^\s"'`()<>\]]+/g)) used.add(posix.join(posix.dirname(file), path));
  }
  const checked = new Set<string>();
  for (const image of [...images].filter((path) => !posix.basename(path).startsWith(".")).sort()) {
    const below = image.slice("images/".length);
    const folder = posix.dirname(below);
    if (folder === ".") {
      throw contentError(kind, `${dir}/${image}`, `sits directly in images/. Move it into images/<entry>/, the folder named after the ${kind} that uses it.`);
    }
    if (!folders.has(folder) && !checked.has(folder)) {
      throw contentError(kind, `${dir}/images/${folder}/`, `no ${kind} is named ${posix.basename(folder)}. Rename the folder after the ${kind} that uses it, or delete it.`);
    }
    checked.add(folder);
    if (!used.has(image)) throw contentError(kind, `${dir}/${image}`, `no ${kind} uses this image. Use it, or delete it.`);
  }
}

function listFiles(dir: string, prefix = ""): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory() ? listFiles(resolve(dir, item.name), `${prefix}${item.name}/`) : [`${prefix}${item.name}`],
  );
}

/** Reads each collection under `contentRoot`: its entry files with their text, and its image files. */
export function readImageFolders(contentRoot: string) {
  const read = (name: string) => {
    const dir = resolve(contentRoot, name);
    const files = listFiles(dir);
    return {
      entries: files
        .filter((file) => !file.startsWith("images/") && ENTRY_FILE.test(file))
        .sort()
        .map((file) => ({ file, text: readFileSync(resolve(dir, file), "utf-8") })),
      images: files.filter((file) => file.startsWith("images/") && !posix.basename(file).startsWith(".")),
    };
  };
  return { pages: read("pages"), posts: read("posts"), projects: read("projects") };
}

/** Runs the image folder check at the start of every production build. */
export function imageFolderCheck(): AstroIntegration {
  let root = process.cwd();
  return {
    name: "image-folder-check",
    hooks: {
      "astro:config:done": ({ config }) => {
        root = fileURLToPath(config.root);
      },
      "astro:build:start": () => {
        const found = readImageFolders(resolve(root, "src/content"));
        checkImageFolders("page", found.pages.entries, found.pages.images);
        checkImageFolders("post", found.posts.entries, found.posts.images);
        checkImageFolders("project", found.projects.entries, found.projects.images);
      },
    },
  };
}
