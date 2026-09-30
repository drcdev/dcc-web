// Build errors for page files (data-model.md "PageContentError";
// contracts/build-errors.md). Messages are plain language, name the file and say
// what to change.

export class PageContentError extends Error {
  override name = "PageContentError";
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

