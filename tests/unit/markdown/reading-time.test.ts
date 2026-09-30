// Reading time (research R6; FR-021): words are runs of characters between
// whitespace, 225 a minute, rounded up, at least 1. The Sätteri mdast plugin
// counts the readable text of a post's body as FR-021 defines it, and stores
// `minutesRead` where Astro's `remarkPluginFrontmatter` reads it.
import { mdxToJs } from "satteri";
import { describe, expect, it } from "vitest";
import { readingMinutes, readingTimePlugin } from "../../../src/lib/markdown/reading-time.ts";

const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");

describe("readingMinutes", () => {
  it.each([
    ["", 1],
    ["   \n\t ", 1],
    ["one", 1],
    [words(225), 1],
    [words(226), 2],
    [words(450), 2],
    [words(451), 3],
    [words(2250), 10],
  ])("counts %#: %s words give %i minutes", (text, minutes) => {
    expect(readingMinutes(text)).toBe(minutes);
  });

  it("splits on any run of whitespace, including newlines and tabs", () => {
    expect(readingMinutes(`${words(200)}\n\n\n${words(25)}`)).toBe(1);
    expect(readingMinutes(`${words(200)}\n\n\n${words(26)}`)).toBe(2);
    expect(readingMinutes(`a\t\tb    c\n`.repeat(100))).toBe(2); // 300 words
  });

  it("treats punctuation and hyphens as part of a word", () => {
    expect(readingMinutes("well-known, e.g. it's")).toBe(1);
    expect(readingMinutes(`${words(224)} well-known`)).toBe(1);
    expect(readingMinutes(`${words(224)} well - known`)).toBe(2);
  });
});

/** The minutes the plugin stores for an MDX body, read from the frontmatter the pipeline hands back. */
async function minutes(source: string): Promise<number | undefined> {
  const result = mdxToJs(source, {
    mdastPlugins: [readingTimePlugin],
    data: { astro: { frontmatter: {} } },
  } as never);
  return (result.data as { astro?: { frontmatter?: { minutesRead?: number } } }).astro?.frontmatter?.minutesRead;
}

// 220 plain words, so each case adds 5 words of the kind under test and sits
// exactly on the 225-word boundary: 1 minute when all 5 count, 2 with one more.
const base = words(220);
const five = "one two three four five";

describe("readingTimePlugin", () => {
  it("is named, so the config can be checked for it", () => {
    expect(readingTimePlugin.name).toBe("reading-time");
  });

  it("stores a whole number of minutes, at least 1, for a very short post", async () => {
    expect(await minutes("Hello.")).toBe(1);
    expect(await minutes("")).toBe(1);
  });

  it("counts a long post", async () => {
    expect(await minutes(words(450))).toBe(2);
    expect(await minutes(words(451))).toBe(3);
  });

  const counted: [string, string][] = [
    ["paragraph", five],
    ["heading", `## ${five}`],
    ["list", "- one two\n- three four five"],
    ["table cells", "| one | two |\n| --- | --- |\n| three | four five |"],
    ["code sample text", "```ts\none two three four five\n```"],
    ["code fence caption", '```ts caption="one two three four five"\n```'],
    ["section caption attribute", '<Figure caption="one two three four five" />'],
  ];

  it.each(counted)("counts %s exactly", async (_name, block) => {
    expect(await minutes(`${base}\n\n${block}`)).toBe(1);
    expect(await minutes(`${base} extra\n\n${block}`)).toBe(2);
  });

  it("does not count front matter", async () => {
    const front = `---\ntitle: ${words(300)}\nsummary: ${words(300)}\n---\n\n`;
    expect(await minutes(`${front}${words(225)}`)).toBe(1);
  });

  it("does not count code fence markers or the language name", async () => {
    expect(await minutes(`${words(225)}\n\n\`\`\`typescript\n\`\`\``)).toBe(1);
    expect(await minutes(`${words(224)}\n\n\`\`\`typescript\none\n\`\`\``)).toBe(1);
  });

  it("does not count MDX tag names, other attributes or markup", async () => {
    const tags = '<WideImage src="./images/a-very-long-path-with many words.png" alt="ignored" />\n\n<Lead>\n\n</Lead>';
    expect(await minutes(`${words(225)}\n\n${tags}`)).toBe(1);
  });

  it("does not count the markup around words", async () => {
    expect(await minutes(`${words(223)} **two** *words*`)).toBe(1);
    expect(await minutes(`${words(224)} [one](https://example.com/a/long/address)`)).toBe(1);
  });
});
