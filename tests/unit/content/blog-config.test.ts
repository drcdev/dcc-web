// Blog settings in one place (data-model.md "Blog settings"; research R5;
// FR-027): the section name, feed wording, page and list sizes and the views note.
import { describe, expect, it } from "vitest";
import { blog } from "../../../src/config/blog.ts";

describe("blog settings", () => {
  it("names the section Drift & Convergence", () => {
    expect(blog.sectionName).toBe("Drift & Convergence");
  });

  it("has a feed title and a plain one-line description", () => {
    expect(blog.feedTitle).toBe("Drift & Convergence");
    expect(blog.feedDescription.trim()).not.toBe("");
    expect(blog.feedDescription).not.toContain("\n");
  });

  it("sets the page and list sizes", () => {
    expect(blog.pageSize).toBe(12);
    expect(blog.featuredMax).toBe(3);
    expect(blog.latestMax).toBe(6);
    expect(blog.recentMax).toBe(3);
    expect(blog.relatedMax).toBe(3);
  });

  it("has a landing description that names Drift & Convergence and both series", () => {
    expect(blog.landingDescription).toContain("Drift & Convergence");
    expect(blog.landingDescription).toContain("Drift");
    expect(blog.landingDescription).toContain("Convergence");
    expect(blog.landingDescription).not.toContain("\n");
  });

  it("has the series intro copy", () => {
    expect(blog.seriesIntro.trim()).not.toBe("");
  });

  it("has a non-empty views note", () => {
    expect(blog.viewsNote.trim()).not.toBe("");
  });
});
