// Project slugs from file names, and the check that no two files share one
// (contracts/build-errors.md rows 26 and 27). Pure functions.
import { projectFileError, projectFilesError } from "./errors.ts";

const PROJECTS_DIR = "src/content/projects";
const SLUG = /^[a-z0-9-]{1,64}$/;

/** The slug of a project file, given its path below src/content/projects/. */
export function slugFromPath(path: string): string {
  const file = `${PROJECTS_DIR}/${path}`;
  if (path.includes("/")) {
    throw projectFileError(file, "project files must sit directly in the projects folder, not in a subfolder. Move the file.");
  }
  const slug = path.replace(/\.mdx?$/, "");
  if (!SLUG.test(slug)) {
    throw projectFileError(
      file,
      "file names may use only lower-case letters, digits and hyphens (up to 64 characters). Rename the file.",
    );
  }
  return slug;
}

/** Throws when two files (for example `x.md` and `x.mdx`) make the same slug. */
export function assertUniqueProjectFiles(files: readonly string[]): void {
  const seen = new Map<string, string>();
  for (const path of [...files].sort()) {
    const slug = slugFromPath(path);
    const first = seen.get(slug);
    if (first) {
      throw projectFilesError(
        `${PROJECTS_DIR}/${first}`,
        `${PROJECTS_DIR}/${path}`,
        `both make the slug ${slug}. Keep one of them.`,
      );
    }
    seen.set(slug, path);
  }
}
