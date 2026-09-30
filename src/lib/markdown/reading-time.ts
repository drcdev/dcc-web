// Reading time at build time (research R6; FR-021). A Sätteri mdast plugin,
// following Astro's "Add reading time" recipe
// (docs.astro.build/en/recipes/reading-time/), counts the readable words of a
// post's body and stores `minutesRead` on the front matter, where `render()`
// returns it as `remarkPluginFrontmatter.minutesRead`. The recipe's
// `reading-time` package is not used: a word count is ten lines of code.
//
// Counted (FR-021): headings, paragraphs, lists, table cells, the text of code
// samples, and captions (a code fence's `caption="..."` and a section's
// `caption` attribute). Not counted: front matter, fence markers, the language
// name, MDX tag names, other attributes, link addresses and image alt text.
import { defineMdastPlugin, type MdastNode } from "satteri";

const WORDS_PER_MINUTE = 225;

/** Words: runs of characters between whitespace. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Whole minutes for a number of words: 225 a minute, rounded up, at least 1. */
export function minutesForWords(words: number): number {
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Whole minutes to read this text. */
export function readingMinutes(text: string): number {
  return minutesForWords(countWords(text));
}

/** Words counted so far, per document; the data bag is the same object for every visitor of one document. */
const counted = new WeakMap<object, number>();

function add(data: object, text: string | undefined): void {
  if (text) counted.set(data, (counted.get(data) ?? 0) + countWords(text));
}

/** The text of a code fence's `caption="..."` (or `caption='...'`) in its meta string. */
function fenceCaption(meta: string | null | undefined): string | undefined {
  const match = /(?:^|\s)caption=(?:"([^"]*)"|'([^']*)')/.exec(meta ?? "");
  return match?.[1] ?? match?.[2];
}

/** The text of a string `caption` attribute on an MDX element such as `<Figure caption="...">`. */
function elementCaption(node: { attributes?: readonly { type: string; name?: string; value?: unknown }[] }): string | undefined {
  const attribute = node.attributes?.find((a) => a.type === "mdxJsxAttribute" && a.name === "caption");
  return typeof attribute?.value === "string" ? attribute.value : undefined;
}

export const readingTimePlugin = defineMdastPlugin({
  name: "reading-time",
  paragraph(node, context) {
    add(context.data, context.textContent(node, { includeImageAlt: false }));
  },
  heading(node, context) {
    add(context.data, context.textContent(node, { includeImageAlt: false }));
  },
  tableCell(node, context) {
    add(context.data, context.textContent(node, { includeImageAlt: false }));
  },
  code(node, context) {
    add(context.data, node.value);
    add(context.data, fenceCaption(node.meta));
  },
  mdxJsxFlowElement(node, context) {
    add(context.data, elementCaption(node as Parameters<typeof elementCaption>[0]));
  },
  mdxJsxTextElement(node, context) {
    add(context.data, elementCaption(node as Parameters<typeof elementCaption>[0]));
  },
  after(_root: Readonly<MdastNode>, context) {
    if (context.data.astro !== undefined) {
      context.data.astro.frontmatter.minutesRead = minutesForWords(counted.get(context.data) ?? 0);
    }
  },
});
