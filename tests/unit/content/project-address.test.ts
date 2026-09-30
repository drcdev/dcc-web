// Unit tests for project slugs and project build errors (contracts/build-errors.md
// rows 26 and 27).
import { describe, expect, it } from "vitest";
import { PageContentError, projectFileError, projectFilesError } from "../../../src/lib/content/errors.ts";
import { assertUniqueProjectFiles, slugFromPath } from "../../../src/lib/content/project-address.ts";

describe("slugFromPath", () => {
  it.each([
    ["focus-pocus.mdx", "focus-pocus"],
    ["focus-pocus.md", "focus-pocus"],
    ["2026-plan.mdx", "2026-plan"],
  ])("maps %s to %s", (path, slug) => {
    expect(slugFromPath(path)).toBe(slug);
  });

  it.each(["Focus.mdx", "focus pocus.mdx", "focus_pocus.mdx", "a.b.mdx", `${"a".repeat(65)}.mdx`, ".mdx"])(
    "rejects %s with the file name and the naming rule",
    (path) => {
      expect(() => slugFromPath(path)).toThrow(path);
      expect(() => slugFromPath(path)).toThrow("lower-case letters, digits and hyphens");
    },
  );

  it("rejects a nested file", () => {
    expect(() => slugFromPath("x/y.mdx")).toThrow("x/y.mdx");
    expect(() => slugFromPath("x/y.mdx")).toThrow(PageContentError);
  });
});

describe("assertUniqueProjectFiles", () => {
  it("accepts distinct slugs", () => {
    expect(() => assertUniqueProjectFiles(["a.mdx", "b.md"])).not.toThrow();
  });
  it("names both files when .md and .mdx share a slug", () => {
    expect(() => assertUniqueProjectFiles(["x.mdx", "x.md"])).toThrow(
      "Project files src/content/projects/x.md and src/content/projects/x.mdx",
    );
  });
});

describe("project errors", () => {
  it("formats a single-file problem", () => {
    const error = projectFileError("src/content/projects/a.mdx", "problem.");
    expect(error).toBeInstanceOf(PageContentError);
    expect(error.message).toBe("Project file src/content/projects/a.mdx: problem.");
  });
  it("formats a two-file problem", () => {
    expect(projectFilesError("a", "b", "clash.").message).toBe("Project files a and b: clash.");
  });
});
