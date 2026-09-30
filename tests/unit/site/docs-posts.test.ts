// docs/posts.md is Don's authoring guide for blog posts (FR-034, FR-002, FR-023,
// FR-024, FR-026, FR-031, FR-042, FR-043). The test keeps its own list of a key
// phrase per build error, since tests may not read specs/.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const guide = () => readFileSync(root("docs/posts.md"), "utf-8");

describe("docs/posts.md", () => {
  it("exists", () => {
    expect(existsSync(root("docs/posts.md"))).toBe(true);
  });

  it.each(["title", "summary", "date", "updated", "topics", "featureImage", "src", "alt", "caption", "featured", "draft"])(
    "lists the setting %s",
    (key) => {
      expect(guide()).toContain(`\`${key}\``);
    },
  );

  it("explains file naming, the address and the warning against renaming a published post", () => {
    const text = guide();
    expect(text).toContain("src/content/posts/");
    expect(text).toContain("/writing/");
    expect(text).toContain("lower-case letters, digits and hyphens");
    expect(text).toContain(".mdx");
    expect(text).toContain("Do not rename a published post");
    expect(text).toContain("`all` and `topics`");
  });

  it("explains how to add, rename and remove a topic", () => {
    const text = guide();
    expect(text).toContain("src/config/topics.ts");
    expect(text).toContain("src/components/post/topic-styles.ts");
    for (const heading of ["Add a topic", "Rename a topic", "Remove a topic"]) expect(text).toContain(heading);
  });

  it("describes the three image widths with one example of each", () => {
    const text = guide();
    for (const name of ["Figure", "WideImage", "FullImage"]) expect(text).toContain(`<${name}`);
    expect(text).toMatch(/text column/i);
    expect(text).toMatch(/full page width/i);
  });

  it("covers tables and introducing them in the text", () => {
    const text = guide();
    expect(text).toMatch(/table/i);
    expect(text).toMatch(/introduce/i);
  });

  it("covers the code-fence caption option and languages", () => {
    const text = guide();
    expect(text).toContain('caption="');
    expect(text).toMatch(/language/i);
    expect(text).toMatch(/plain text/i);
  });

  it("covers drafts, featured, the update date, the sample posts rule and the views note", () => {
    const text = guide();
    expect(text).toContain("anyone with a preview address");
    expect(text).toMatch(/nothing confidential/i);
    expect(text).toMatch(/featured/i);
    expect(text).toMatch(/Updated/);
    expect(text).toMatch(/sample posts/i);
    expect(text).toMatch(/views (in this post )?are my own|views note/i);
  });

  const errors: [string, string][] = [
    ["P1", "`title` is missing or empty"],
    ["P2", "`summary` is missing or empty"],
    ["P3", "`date` is missing"],
    ["P4", "`date` is not a real date"],
    ["P5", "no `topics`"],
    ["P6", "not a topic"],
    ["P7", "same topic twice"],
    ["P8", "`featureImage` has no `alt`"],
    ["P9", "feature image file does not exist"],
    ["P10", "`updated` is earlier than `date`"],
    ["P11", "misspelled setting"],
    ["P12", "image in the body has no alt text"],
    ["P13", "`.md` file"],
    ["P14", "sub-folder"],
    ["P15", "characters other than lower-case letters, digits and hyphens"],
    ["P16", "reserved"],
    ["P17", "two files with the same address"],
    ["P18", "level-1 heading"],
    ["P19", "not a section"],
    ["P20", "no content"],
    ["P21", "topic that was removed"],
    ["P22", "image file in the body does not exist"],
  ];
  it.each(errors)("explains build error %s and how to fix it", (_id, phrase) => {
    expect(guide()).toContain(phrase);
  });

  it("starts the build-error list with the message prefixes", () => {
    expect(guide()).toContain("Post file");
    expect(guide()).toContain("Post files");
  });

  it("says how to check a draft on the preview", () => {
    expect(guide()).toMatch(/preview/i);
    expect(guide()).toMatch(/Draft/);
  });
});
