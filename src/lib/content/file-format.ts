// The one file-format rule for content (issue #200): a file with a body is `.mdx`; a file without
// one is `.yaml`. Loaders match the wrong extension only so this check can fail the file with a
// rename message, because a file the pattern skipped would be ignored without a word.
import { contentError, type ErrorKind } from "./errors.ts";

interface Format {
  ext: ".mdx" | ".yaml";
  noun: string;
}

const FORMATS: Partial<Record<ErrorKind, Format>> = {
  page: { ext: ".mdx", noun: "a page" },
  post: { ext: ".mdx", noun: "a post" },
  project: { ext: ".mdx", noun: "a project" },
  now: { ext: ".mdx", noun: "the Now file" },
  "career step": { ext: ".yaml", noun: "a career step" },
  "reading path": { ext: ".yaml", noun: "a reading path" },
  assessment: { ext: ".yaml", noun: "an assessment" },
};

/** Throws when `file` (a path as the error should name it) does not end in the extension its kind requires. */
export function assertFileFormat(kind: ErrorKind, file: string): void {
  const format = FORMATS[kind];
  if (!format || file.endsWith(format.ext)) return;
  const article = format.ext === ".mdx" ? "an" : "a";
  throw contentError(kind, file, `${format.noun} must be ${article} ${format.ext} file, so rename it to ${format.ext}.`);
}
