// Prop and content checks shared by the section components (contracts/
// sections.md; contracts/build-errors.md rows 11 and 12). A section renders its
// slot to HTML, summarises what is inside (text, images, offerings) and checks
// that summary together with its props against the schema in schemas.ts. A
// failure is a PageContentError that names the section and the prop, and the
// page file when the page route has recorded it in `Astro.locals.pageFile`.
import { PageContentError, pageFileError } from "../../lib/content/errors.ts";
import { sectionSchemas } from "./schemas.ts";
import type { SectionName } from "./index.ts";

/** What is inside a section, from its rendered slot HTML. */
export function summarise(html: string) {
  const text = html
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  return {
    text: text !== "",
    images: (html.match(/<img\b/gi) ?? []).length,
    offerings: (html.match(/<li\b[^>]*\bdata-offering\b/gi) ?? []).length,
  };
}

function fail(name: SectionName, message: string, file?: string): never {
  const problem = `<${name}> ${message}`;
  throw file ? pageFileError(file, problem) : new PageContentError(`Section ${problem}`);
}

/**
 * Checks a section's props and slot HTML; throws a PageContentError naming the
 * section and what is wrong. `props` is `Astro.props`, `html` the rendered
 * default slot, `locals` is `Astro.locals`.
 */
export function checkSection(
  name: SectionName,
  props: object,
  html: string,
  locals?: { pageFile?: string },
): void {
  const file = locals?.pageFile;
  const result = sectionSchemas[name].safeParse({ ...props, content: summarise(html) });
  if (!result.success) {
    const issue = result.error.issues[0]!;
    if (issue.code === "unrecognized_keys") {
      fail(name, `has a setting it does not use: ${issue.keys.join(", ")}.`, file);
    }
    const path = issue.path[0];
    if (path === "content") fail(name, issue.message + ".", file);
    fail(name, `needs a valid "${String(path)}" (${issue.message}).`, file);
  }
  if (/<img\b/i.test(html)) {
    for (const [tag] of html.matchAll(/<img\b[^>]*>/gi)) {
      if (!/\balt="\s*[^"\s][^"]*"/.test(tag)) fail(name, "has an image with no alt text. Describe the image inside the square brackets.", file);
    }
  }
}

/** Removes the paragraph Markdown wraps around a lone image or a lone line of text. */
export function unwrapParagraph(html: string): string {
  const match = /^\s*<p>([\s\S]*)<\/p>\s*$/.exec(html);
  return match && !match[1]!.includes("<p>") ? match[1]! : html;
}
