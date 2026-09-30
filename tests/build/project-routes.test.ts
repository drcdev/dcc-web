// Row 26 of contracts/build-errors.md and the address rule for /projects/…: two
// project files with one slug, a project file in a subfolder, and a page file
// under /projects/ all fail the build and name the files.
import { describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile } from "./fixture-site.ts";

const project = (to: string): FixtureFile => ({ from: "broken/26-duplicate-slug.mdx", to });

describe("project routes", () => {
  it("rejects x.md and x.mdx, naming both files", async () => {
    const result = await buildFixtureSite([], { projects: [project("x.mdx"), project("x.md")] });
    try {
      expect(result.ok).toBe(false);
      expect(result.message).toContain("x.md");
      expect(result.message).toContain("x.mdx");
      expect(result.message).toContain("slug x");
    } finally {
      result.cleanup();
    }
  });

  it("rejects a project file in a subfolder", async () => {
    const result = await buildFixtureSite([], { projects: [project("nested/x.mdx")] });
    try {
      expect(result.ok).toBe(false);
      expect(result.message).toContain("nested/x.mdx");
      expect(result.message).toContain("not in a subfolder");
    } finally {
      result.cleanup();
    }
  });

  it("rejects a page file under /projects/", async () => {
    const result = await buildFixtureSite([{ from: "workshops.mdx", to: "projects/workshops.mdx" }], {
      projects: ["minimal.mdx"],
    });
    try {
      expect(result.ok).toBe(false);
      expect(result.message).toContain("projects/workshops.mdx");
    } finally {
      result.cleanup();
    }
  });
});
