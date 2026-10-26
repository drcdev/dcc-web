// Frontmatter image files are checked before Astro bundles them, so a missing
// file is reported with the page file's name (contracts/build-errors.md row 6).
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { PageContentError } from "../../../src/lib/content/errors.ts";
import { assertImagesExist, checkImageFolders, readImageFolders } from "../../../src/lib/content/images.ts";

const root = mkdtempSync(join(tmpdir(), "images-test-"));
mkdirSync(join(root, "images"));
mkdirSync(join(root, "legal"));
writeFileSync(join(root, "images", "here.png"), "x");
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("assertImagesExist", () => {
  it("accepts existing images in image, featureImage and intro.photo", () => {
    expect(() =>
      assertImagesExist("page", root, "a.mdx", {
        image: { src: "./images/here.png", alt: "a" },
        featureImage: { src: "./images/here.png", alt: "a" },
        intro: { photo: { src: "./images/here.png", alt: "a" } },
      }),
    ).not.toThrow();
  });

  it("accepts pages with no images", () => {
    expect(() => assertImagesExist("page", root, "a.mdx", { title: "x" })).not.toThrow();
  });

  it("names the page file and the image path when a file is missing", () => {
    expect(() =>
      assertImagesExist("page", root, "legal/a.mdx", { image: { src: "../images/nope.png", alt: "a" } }),
    ).toThrow(/Page file src\/content\/pages\/legal\/a\.mdx: .*\.\.\/images\/nope\.png/);
    try {
      assertImagesExist("page", root, "a.mdx", { featureImage: { src: "./images/nope.png", alt: "a" } });
    } catch (error) {
      expect(error).toBeInstanceOf(PageContentError);
    }
  });

  it("names the post file, with the post wording, when a post's feature image is missing (P9)", () => {
    const run = () =>
      assertImagesExist("post", root, "a-post.mdx", { featureImage: { src: "./images/nope.png", alt: "a" } });
    expect(run).toThrow(/^Post file src\/content\/posts\/a-post\.mdx: .*\.\/images\/nope\.png.*post file/);
    expect(() =>
      assertImagesExist("post", root, "a-post.mdx", { featureImage: { src: "./images/here.png", alt: "a" } }),
    ).not.toThrow();
  });

  it("resolves paths relative to the page file's folder", () => {
    expect(() =>
      assertImagesExist("page", root, "legal/a.mdx", { image: { src: "../images/here.png", alt: "a" } }),
    ).not.toThrow();
  });

  it("names the project file, with the project wording, when a visual is missing (S09)", () => {
    const missing = { src: "./images/nope.png", alt: "a" };
    const here = { src: "./images/here.png", alt: "a" };
    for (const data of [{ visual: missing }, { image: missing }, { visuals: { hero: here, extra: missing } }]) {
      const run = () => assertImagesExist("project", root, "a-project.mdx", data);
      expect(run).toThrow(/^Project file src\/content\/projects\/a-project\.mdx: the file \.\/images\/nope\.png does not exist.*project file/);
      try {
        run();
      } catch (error) {
        expect(error).toBeInstanceOf(PageContentError);
      }
    }
  });

  it("accepts a project whose visual, image and visuals all exist", () => {
    const here = { src: "./images/here.png", alt: "a" };
    expect(() =>
      assertImagesExist("project", root, "a-project.mdx", { visual: here, image: here, visuals: { hero: here } }),
    ).not.toThrow();
  });
});

describe("checkImageFolders (#201)", () => {
  const uses = (path: string) => `---\nimage:\n  src: ${path}\n---\n`;

  it("passes when every image is in its entry's folder and used", () => {
    expect(() =>
      checkImageFolders(
        "page",
        [
          { file: "example-page.mdx", text: uses("./images/example-page/a.png") },
          { file: "privacy/policy.mdx", text: "![a](../images/privacy/policy/b.png)" },
          { file: "index.mdx", text: uses("./images/index/c.png") },
        ],
        ["images/example-page/a.png", "images/privacy/policy/b.png", "images/index/c.png"],
      ),
    ).not.toThrow();
    expect(() =>
      checkImageFolders(
        "post",
        [{ file: "example-post.mdx", text: uses("./images/example-post/a.png") }],
        ["images/example-post/a.png"],
      ),
    ).not.toThrow();
    expect(() =>
      checkImageFolders(
        "project",
        [{ file: "_template.mdx", text: uses("./images/_template/a.png") }],
        ["images/_template/a.png"],
      ),
    ).not.toThrow();
  });

  it("names the folder when no entry is named after it", () => {
    expect(() =>
      checkImageFolders("post", [{ file: "example-post.mdx", text: "" }], ["images/no-such-post/a.png"]),
    ).toThrow(/Post file src\/content\/posts\/images\/no-such-post\/: no post is named no-such-post/);
  });

  it("names the file when an image sits directly in images/", () => {
    expect(() =>
      checkImageFolders("page", [{ file: "example-page.mdx", text: "./images/a.png" }], ["images/a.png"]),
    ).toThrow(/Page file src\/content\/pages\/images\/a\.png: sits directly in images\//);
  });

  it("names the file when no entry uses the image", () => {
    expect(() =>
      checkImageFolders("project", [{ file: "example.mdx", text: "" }], ["images/example/a.png"]),
    ).toThrow(/Project file src\/content\/projects\/images\/example\/a\.png: no project uses this image/);
  });

  it("counts a body image and a front matter src as uses", () => {
    expect(() =>
      checkImageFolders(
        "post",
        [{ file: "example-post.mdx", text: `${uses("./images/example-post/a.png")}![a](./images/example-post/b.png)` }],
        ["images/example-post/a.png", "images/example-post/b.png"],
      ),
    ).not.toThrow();
  });

  it("ignores dot files", () => {
    expect(() =>
      checkImageFolders("page", [{ file: "example-page.mdx", text: "" }], [
        "images/.gitkeep",
        "images/example-page/.DS_Store",
      ]),
    ).not.toThrow();
  });

  it("counts a reference from another entry as a use", () => {
    expect(() =>
      checkImageFolders(
        "page",
        [
          { file: "example-page.mdx", text: "" },
          { file: "other-page.mdx", text: "./images/example-page/a.png" },
        ],
        ["images/example-page/a.png"],
      ),
    ).not.toThrow();
  });

  it("reads a content root and throws for an orphan placed there", () => {
    const base = mkdtempSync(join(tmpdir(), "image-folders-"));
    try {
      for (const dir of ["pages", "posts", "projects"]) mkdirSync(join(base, dir, "images", "example"), { recursive: true });
      writeFileSync(join(base, "pages", "example.mdx"), "./images/example/a.png");
      writeFileSync(join(base, "pages", "images", "example", "a.png"), "x");
      writeFileSync(join(base, "pages", "images", ".gitkeep"), "");
      const read = readImageFolders(base);
      expect(read.pages.entries.map((e) => e.file)).toEqual(["example.mdx"]);
      expect(read.pages.images).toEqual(["images/example/a.png"]);
      expect(() => checkImageFolders("page", read.pages.entries, read.pages.images)).not.toThrow();
      writeFileSync(join(base, "posts", "images", "example", "orphan.png"), "x");
      const posts = readImageFolders(base).posts;
      expect(() => checkImageFolders("post", posts.entries, posts.images)).toThrow(/images\/example\//);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });
});
