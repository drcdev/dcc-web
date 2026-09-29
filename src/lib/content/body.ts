// Checks on the Markdown or MDX body of a page file that the collection schema
// cannot make (data-model.md invariants 2, 4, 5 and 8; contracts/build-errors.md
// rows 8, 9, 10 and 16). Each failure names the file. Code fences and inline
// code are ignored, so a page can show example tags and headings.
import { sectionNames } from "../../components/sections/index.ts";
import { pageFileError } from "./errors.ts";

/** Replaces fenced code blocks and inline code with blank space so they are not checked. */
function withoutCode(body: string): string {
  const lines = body.split("\n");
  let fence: string | undefined;
  const kept = lines.map((line) => {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      return "";
    }
    if (marker) {
      fence = marker;
      return "";
    }
    return line.replace(/(`+)[^`]*?\1/g, "");
  });
  return kept.join("\n");
}

export function validatePageBody(file: string, body: string): void {
  if (body.trim() === "") {
    throw pageFileError(file, "the page has no content. Add text below the settings.");
  }

  const text = withoutCode(body);

  if (/^ {0,3}#(?:\s|$)/m.test(text) || /<h1[\s>/]/i.test(text)) {
    throw pageFileError(
      file,
      "the body has a level-1 heading. The page title is the only main heading, so use ## for headings in the body.",
    );
  }

  const known = new Set<string>(sectionNames);
  for (const [, tag] of text.matchAll(/<([A-Z][A-Za-z0-9]*)/g)) {
    if (!known.has(tag as string)) {
      throw pageFileError(
        file,
        `<${tag}> is not a section. The sections are: ${sectionNames.join(", ")}.`,
      );
    }
  }

  if (/!\[\s*\]\(/.test(text)) {
    throw pageFileError(file, "an image in the body has no alt text. Describe the image inside the square brackets.");
  }
}
