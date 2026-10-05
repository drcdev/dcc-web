// Build errors for page files (data-model.md "PageContentError";
// contracts/build-errors.md). Messages are plain language, name the file and say
// what to change.

export class PageContentError extends Error {
  override name = "PageContentError";
}

export type ContentKind = "page" | "post" | "project";

/**
 * A problem in one file (`Page file <path>: <problem>`) or between two files
 * (`Page files <a> and <b>: <problem>`). `kind` is page, post or project.
 */
export function contentError(
  kind: ContentKind,
  files: string | readonly [string, string],
  problem: string,
): PageContentError {
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  const where = typeof files === "string" ? `file ${files}` : `files ${files[0]} and ${files[1]}`;
  return new PageContentError(`${label} ${where}: ${problem}`);
}

/** A problem in one page file: `Page file <path>: <problem>`. */
export function pageFileError(file: string, problem: string): PageContentError {
  return new PageContentError(`Page file ${file}: ${problem}`);
}

/** A problem between two page files: `Page files <a> and <b>: <problem>`. */
export function pageFilesError(fileA: string, fileB: string, problem: string): PageContentError {
  return new PageContentError(`Page files ${fileA} and ${fileB}: ${problem}`);
}

/** A problem in one post file: `Post file <path>: <problem>`. */
export function postFileError(file: string, problem: string): PageContentError {
  return new PageContentError(`Post file ${file}: ${problem}`);
}

/** A problem between two post files: `Post files <a> and <b>: <problem>`. */
export function postFilesError(fileA: string, fileB: string, problem: string): PageContentError {
  return new PageContentError(`Post files ${fileA} and ${fileB}: ${problem}`);
}

/** A problem in one project file: `Project file <path>: <problem>`. */
export function projectFileError(file: string, problem: string): PageContentError {
  return new PageContentError(`Project file ${file}: ${problem}`);
}

/** A problem between two project files: `Project files <a> and <b>: <problem>`. */
export function projectFilesError(fileA: string, fileB: string, problem: string): PageContentError {
  return new PageContentError(`Project files ${fileA} and ${fileB}: ${problem}`);
}
