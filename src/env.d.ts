// The page route records the page file it is rendering here, so a section
// component that finds a problem can name the file (contracts/build-errors.md).
declare namespace App {
  interface Locals {
    pageFile?: string;
    /** The project the story route is rendering, read by the story building blocks. */
    project?: {
      slug: string;
      /** Repo-relative path of the project file, for error messages. */
      file: string;
      data: import("./lib/projects.ts").ProjectEntry["data"];
    };
  }
}
