// Checks that images named in a page's settings exist, before Astro bundles
// them. Astro's own error for a missing file names only the image, so this
// check adds the page file (contracts/build-errors.md row 6; FR-007).
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pageFileError } from "./errors.ts";

const PAGES_DIR = "src/content/pages";

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
 * @param pagesRoot absolute path of src/content/pages
 * @param file path of the page file below it, for example `legal/index.mdx`
 * @param data the parsed settings of the page
 */
export function assertFrontmatterImagesExist(pagesRoot: string, file: string, data: unknown): void {
  for (const src of sources(data)) {
    if (!existsSync(resolve(pagesRoot, dirname(file), src))) {
      throw pageFileError(
        `${PAGES_DIR}/${file}`,
        `the image ${src} does not exist. Add the file, or fix the path (it is relative to the page file).`,
      );
    }
  }
}
