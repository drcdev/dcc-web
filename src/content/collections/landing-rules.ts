// The `landing` collection rules: the schema, the checks a schema cannot express (contracts/
// page-settings.md rows V8 and V9; FR-005, FR-010) and the loader's front-matter helper. The
// loader checks run in `generateId`, so the build stops before any page is rendered and the error
// names the file.
import { z } from "astro/zod";
import { contentError } from "../../lib/content/errors.ts";
import { navField, requiredText } from "../../lib/content/schema-fields.ts";

const PAGES_DIR = "src/content/pages";

/**
 * A landing file (`writing.mdx`, `projects.mdx`): only the title and a header menu entry. The
 * address, heading and lists come from the code route (contracts/page-settings.md).
 */
export const landingSchema = z.strictObject({
  title: requiredText,
  nav: navField.extend({ location: z.literal("header") }),
});

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

/**
 * Every landing page the code routes need has a landing file (V9). `required` is the addresses
 * (`/writing/`), `present` the ids of the landing entries read.
 */
export function checkLandingFiles(required: readonly string[], present: readonly string[]): void {
  for (const address of required) {
    const id = address.replaceAll("/", "");
    if (!present.includes(id)) {
      throw contentError("page", `${PAGES_DIR}/${id}.mdx`, "missing. Add the landing file with a title and nav.");
    }
  }
}
