// Prepares one post for the questions API (specs/022 research R3 and R4, data-model section 1).
// Pure: the build writes the result to `/writing/<slug>/question-source.json` and renders the same
// hash on the post page. The Worker reads that file and never accepts text from a caller.
import { createHash } from "node:crypto";
// The one place the input cap lives, imported as ContactForm.astro imports the contact rules.
import { MAX_INPUT_CHARS } from "../../../worker/src/questions/config.ts";

export interface QuestionSource {
  slug: string;
  title: string;
  summary: string;
  /** The body as plain text, at most MAX_INPUT_CHARS characters, cut at a paragraph boundary. */
  text: string;
  /** SHA-256 of JSON.stringify([title, summary, raw body]), 64 lowercase hex characters. */
  hash: string;
}

/** Turns the raw MDX body into plain text (research R4). */
function plainText(body: string): string {
  const withoutCode = body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, "[code example]");
  return withoutCode
    .split("\n")
    .filter((line) => !/^\s*(import|export)\s/.test(line))
    .join("\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Cuts at the last paragraph boundary at or before `limit`; one oversized paragraph is cut hard. */
function capAtParagraph(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const boundary = text.lastIndexOf("\n\n", limit);
  return boundary > 0 ? text.slice(0, boundary) : text.slice(0, limit);
}

export function prepareQuestionSource({
  slug,
  title,
  summary,
  body,
}: {
  slug: string;
  title: string;
  summary: string;
  body: string;
}): QuestionSource {
  const hash = createHash("sha256").update(JSON.stringify([title, summary, body])).digest("hex");
  return { slug, title, summary, text: capAtParagraph(plainText(body), MAX_INPUT_CHARS), hash };
}
