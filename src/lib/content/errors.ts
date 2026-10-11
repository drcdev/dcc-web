// Build errors for page files (data-model.md "PageContentError";
// contracts/build-errors.md). Messages are plain language, name the file and say
// what to change.

export class PageContentError extends Error {
  override name = "PageContentError";
}

export type ContentKind = "page" | "post" | "project";

/** The kinds `contentError` words: the three above plus an architecture part file (036). */
export type ErrorKind = ContentKind | "architecture part";

/**
 * A problem in one file (`Page file <path>: <problem>`) or between two files
 * (`Page files <a> and <b>: <problem>`). `kind` is page, post, project or architecture part.
 */
export function contentError(
  kind: ErrorKind,
  files: string | readonly [string, string],
  problem: string,
): PageContentError {
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  const where = typeof files === "string" ? `file ${files}` : `files ${files[0]} and ${files[1]}`;
  return new PageContentError(`${label} ${where}: ${problem}`);
}
