// Post addresses from file paths, and the checks on the list of post files
// (data-model.md "Post" derived values and invariant 1; contracts/build-errors.md
// rows P13 to P17; FR-003). Pure functions: the route passes in the file list
// from import.meta.glob, relative to src/content/posts/.
import { seriesIds } from "../../config/topics.ts";
import { postFileError, postFilesError } from "./errors.ts";

const POSTS_DIR = "src/content/posts";
const SLUG = /^[a-z0-9-]+$/;
/** Addresses under /writing/ that belong to listing pages, so no post may use them. */
const RESERVED = new Set<string>(["all", "topics", ...seriesIds]);

/** The slug of a post file, given its path below src/content/posts/: the file name without `.mdx`. */
export function slugFromPostPath(path: string): string {
  return (path.split("/").at(-1) ?? path).replace(/\.mdx?$/, "");
}

/** The address of a post: `/writing/{slug}/`. */
export function postHref(slug: string): string {
  return `/writing/${slug}/`;
}

/**
 * Throws a PageContentError when the post files break an address rule. `files` are paths below
 * src/content/posts/; anything under `images/` is a picture folder and is ignored, as are files
 * that are not Markdown or MDX.
 */
export function assertPostFiles(files: readonly string[]): void {
  const posts = files
    .filter((path) => !path.startsWith("images/") && /\.mdx?$/.test(path))
    .sort()
    .map((path) => ({ path, file: `${POSTS_DIR}/${path}`, slug: slugFromPostPath(path) }));

  const seen = new Map<string, string>();
  for (const { file, slug } of posts) {
    const first = seen.get(slug);
    if (first) {
      throw postFilesError(first, file, `both make the address ${postHref(slug)}. Keep one of them.`);
    }
    seen.set(slug, file);
  }

  for (const { path, file, slug } of posts) {
    if (path.includes("/")) {
      throw postFileError(file, "posts cannot be in a sub-folder. Move the file to src/content/posts/.");
    }
    if (!path.endsWith(".mdx")) {
      throw postFileError(file, "a post must be an .mdx file, so rename it to .mdx.");
    }
    if (!SLUG.test(slug)) {
      throw postFileError(
        file,
        "the file name may use only lower-case letters, digits and hyphens. Rename the file.",
      );
    }
    if (RESERVED.has(slug)) {
      throw postFileError(
        file,
        `the address ${postHref(slug)} is reserved for ${
          (seriesIds as readonly string[]).includes(slug) ? "the series page" : "a listing page"
        }. Rename the file.`,
      );
    }
  }
}
