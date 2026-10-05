// Frontmatter image files are checked before Astro bundles them, so a missing
// file is reported with the page file's name (contracts/build-errors.md row 6).
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { PageContentError } from "../../../src/lib/content/errors.ts";
import { assertImagesExist } from "../../../src/lib/content/images.ts";

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
