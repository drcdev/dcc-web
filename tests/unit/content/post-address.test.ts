// Post addresses from file paths and the checks on the list of post files
// (data-model.md "Post" derived values and invariant 1; contracts/build-errors.md
// rows P13 to P17; FR-003). Pure functions: the route passes in the file list
// from import.meta.glob, relative to src/content/posts/.
import { describe, expect, it } from "vitest";
import { assertPostFiles, postHref, slugFromPostPath } from "../../../src/lib/content/post-address.ts";

const check = (...files: string[]) => () => assertPostFiles(files);

describe("slugFromPostPath and postHref", () => {
  it("returns the file name without .mdx", () => {
    expect(slugFromPostPath("my-first-post.mdx")).toBe("my-first-post");
    expect(slugFromPostPath("2026-recap.mdx")).toBe("2026-recap");
  });

  it("also drops .md, so a wrong extension is still seen as the same slug", () => {
    expect(slugFromPostPath("x.md")).toBe("x");
  });

  it("builds the address /writing/{slug}/", () => {
    expect(postHref("my-first-post")).toBe("/writing/my-first-post/");
  });
});

describe("assertPostFiles", () => {
  it("accepts top-level .mdx files with valid names, and anything under images/", () => {
    expect(check("a.mdx", "b-2.mdx", "images/a.png", "images/deep/b.jpg", "images/notes.mdx")).not.toThrow();
    expect(check()).not.toThrow();
  });

  it("rejects a .md file, naming the file and saying to rename it to .mdx (P13)", () => {
    const run = check("notes.md");
    expect(run).toThrow("src/content/posts/notes.md");
    expect(run).toThrow("rename it to .mdx");
  });

  it("rejects a post in a sub-folder, naming the file and the sub-folder (P14)", () => {
    const run = check("2026/recap.mdx");
    expect(run).toThrow("src/content/posts/2026/recap.mdx");
    expect(run).toThrow("sub-folder");
  });

  it.each(["My Post.mdx", "my_post.mdx", "MyPost.mdx", "post!.mdx", "café.mdx"])(
    "rejects the file name %s (P15)",
    (name) => {
      const run = check(name);
      expect(run).toThrow(`src/content/posts/${name}`);
      expect(run).toThrow("lower-case letters, digits and hyphens");
    },
  );

  it.each(["all", "topics"])("rejects the reserved slug %s, naming the address (P16)", (slug) => {
    const run = check(`${slug}.mdx`);
    expect(run).toThrow(`src/content/posts/${slug}.mdx`);
    expect(run).toThrow(`/writing/${slug}/`);
    expect(run).toThrow("reserved");
  });

  it.each(["drift", "convergence"])("rejects the series slug %s, naming the address (P25)", (slug) => {
    const run = check(`${slug}.mdx`);
    expect(run).toThrow(`src/content/posts/${slug}.mdx`);
    expect(run).toThrow(`/writing/${slug}/`);
    expect(run).toThrow("reserved");
  });

  it("rejects two files with one slug, naming both files and the address (P17)", () => {
    const run = check("x.mdx", "x.md");
    expect(run).toThrow("src/content/posts/x.mdx");
    expect(run).toThrow("src/content/posts/x.md");
    expect(run).toThrow("/writing/x/");
  });

  it("names both files whatever order the list is in", () => {
    expect(check("x.md", "x.mdx")).toThrow("src/content/posts/x.mdx");
    expect(check("x.md", "x.mdx")).toThrow("src/content/posts/x.md");
  });

  it("errors start with Post file(s)", () => {
    expect(check("x.md")).toThrow(/^Post file src\/content\/posts\/x\.md: /);
    expect(check("x.mdx", "x.md")).toThrow(/^Post files /);
  });
});
