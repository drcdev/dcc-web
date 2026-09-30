// Checks that images named in a page's or post's settings exist, before Astro
// bundles them. Astro's own error for a missing file names only the image, so this
// check adds the file (contracts/build-errors.md page row 6 and post row P9;
// FR-007).
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pageFileError, postFileError } from "./errors.ts";

const DIRS = { page: "src/content/pages", post: "src/content/posts" } as const;

function sources(data: unknown): string[] {
  const d = (data ?? {}) as {
    image?: { src?: unknown };
    featureImage?: { src?: unknown };
    intro?: { photo?: { src?: unknown } };
  };
  return [d.image?.src, d.featureImage?.src, d.intro?.photo?.src].filter(
    (value): value is string => typeof value === "string" && value.startsWith("."),
  );
}

/**
 * @param root absolute path of src/content/pages (or src/content/posts)
 * @param file path of the file below it, for example `legal/index.mdx`
 * @param data the parsed settings of the file
 * @param kind which kind of file this is, for the error prefix ("page" by default)
 */
export function assertFrontmatterImagesExist(
  root: string,
  file: string,
  data: unknown,
  kind: "page" | "post" = "page",
): void {
  const fileError = kind === "post" ? postFileError : pageFileError;
  for (const src of sources(data)) {
    if (!existsSync(resolve(root, dirname(file), src))) {
      throw fileError(
        `${DIRS[kind]}/${file}`,
        `the image ${src} does not exist. Add the file, or fix the path (it is relative to the ${kind} file).`,
      );
    }
  }
}
