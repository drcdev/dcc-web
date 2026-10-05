// Checks that images named in a page's, post's or project's settings exist, before
// Astro bundles them. Astro's own error for a missing file names only the image, so
// this check adds the file (contracts/build-errors.md page row 6, post row P9 and
// project row S09; FR-007).
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
