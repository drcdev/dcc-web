// Checks on page settings that a schema cannot express (contracts/page-settings.md rows V5 and
// V8; FR-010). They run in the collection loaders' `generateId`, so the build stops before any
// page is rendered and the error names the file.
import { contentError } from "./errors.ts";

const PAGES_DIR = "src/content/pages";

/** The home page may be a draft, but it must always be visible: it is the site's front door (V5). */
export function assertHomeVisible(id: string, entry: string, data: { visible?: unknown; draft?: unknown }): void {
  if (id === "index" && data.visible === false) {
    throw contentError(
      "page",
      `${PAGES_DIR}/${entry}`,
      "the home page cannot have visible: false. Remove the setting, or use draft: true to keep it off the index.",
    );
  }
}

/** The text after a file's front matter. `generateId` is not given the body, so the loader reads the file. */
export function bodyAfterFrontMatter(source: string): string {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/, "");
}

/** A landing file holds menu settings only; its page is built by code (V8). */
export function assertLandingBody(entry: string, body: string | undefined): void {
  if (body?.trim()) {
    throw contentError("page", `${PAGES_DIR}/${entry}`, "a landing file has no body. Remove the text below the settings.");
  }
}
