// Unit tests for the page body checks (data-model.md invariants 2, 4, 5, 8;
// contracts/build-errors.md rows 8, 9, 10, 16; FR-007, FR-014).
import { describe, expect, it } from "vitest";
import { sectionNames } from "../../../src/components/sections/index.ts";
import { validatePageBody } from "../../../src/lib/content/body.ts";

const FILE = "src/content/pages/example.mdx";
const check = (body: string) => validatePageBody(FILE, body);

describe("validatePageBody", () => {
  it("accepts plain Markdown", () => {
    expect(() => check("Some text.\n\n## A heading\n\nMore text.")).not.toThrow();
  });

  it.each(["", "   \n\n  "])("rejects an empty body (%j)", (body) => {
    expect(() => check(body)).toThrow(FILE);
    expect(() => check(body)).toThrow("no content");
  });

  it("rejects an unknown capitalised tag, naming the file, the tag and the valid sections", () => {
    const run = () => check("<Callout>\n\nHello\n\n</Callout>");
    expect(run).toThrow(FILE);
    expect(run).toThrow("Callout");
    for (const name of sectionNames) expect(run).toThrow(name);
  });

  it("rejects an unknown self-closing tag", () => {
    expect(() => check("Text\n\n<Banner />")).toThrow("Banner");
  });

  it("rejects an image with empty alt text", () => {
    const run = () => check("Text\n\n![](./images/a.jpg)");
    expect(run).toThrow(FILE);
    expect(run).toThrow("alt text");
    expect(() => check("![  ](./images/a.jpg)")).toThrow("alt text");
  });

  it("accepts an image with alt text", () => {
    expect(() => check("![A whiteboard](./images/a.jpg)")).not.toThrow();
  });

  it("rejects a level-1 Markdown heading and an <h1>, saying to use ##", () => {
    for (const body of ["# Title\n\nText", "Text\n\n# Title", "Text\n\n<h1>Title</h1>", "<H1 class='x'>T</H1>"]) {
      expect(() => check(body)).toThrow(FILE);
      expect(() => check(body)).toThrow("use ##");
    }
  });

  it("does not treat ## or ### as level 1, or a # inside a word", () => {
    expect(() => check("## Two\n\n### Three\n\nC# is a language, issue #4")).not.toThrow();
  });

  it("ignores tags and level-1 headings inside fenced code and inline code", () => {
    const body = [
      "Text with `<Callout>` and `# not a heading` inline.",
      "",
      "```mdx",
      "# heading in a fence",
      "<Callout>x</Callout>",
      "![](./x.jpg)",
      "<h1>x</h1>",
      "```",
      "",
      "~~~",
      "<Other />",
      "~~~",
    ].join("\n");
    expect(() => check(body)).not.toThrow();
  });

  it.each(sectionNames)("accepts the registered section %s", (name) => {
    expect(() => check(`<${name}>\n\nText\n\n</${name}>`)).not.toThrow();
    expect(() => check(`Text\n\n<${name} />`)).not.toThrow();
  });

  it("does not treat lower-case HTML tags as sections", () => {
    expect(() => check("Text <em>x</em>\n\n<div>y</div>")).not.toThrow();
  });
});

describe("validatePageBody for a post file (P12, P18 to P20)", () => {
  const POST = "src/content/posts/example.mdx";
  const checkPost = (body: string) => validatePageBody(POST, body, "post");

  it("starts every message with Post file and names the file", () => {
    for (const body of ["", "# Title", "<Callout />", "![](./x.jpg)"]) {
      expect(() => checkPost(body)).toThrow(`Post file ${POST}: `);
    }
  });

  it("says the post has no content, not the page", () => {
    expect(() => checkPost("  ")).toThrow("the post has no content");
  });

  it("keeps the same rules: use ##, unknown section with the list, alt text", () => {
    expect(() => checkPost("# Title")).toThrow("use ##");
    const run = () => checkPost("<Callout />");
    expect(run).toThrow("Callout");
    for (const name of sectionNames) expect(run).toThrow(name);
    expect(() => checkPost("![](./x.jpg)")).toThrow("alt text");
  });

  it("leaves the page messages unchanged when no kind is given", () => {
    expect(() => validatePageBody(FILE, "")).toThrow(`Page file ${FILE}: the page has no content. Add text below the settings.`);
    expect(() => validatePageBody(FILE, "", "page")).toThrow(`Page file ${FILE}: the page has no content.`);
  });
});

