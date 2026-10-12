// The launch reading paths (specs/040-home-now-start-here, FR-014, FR-022), read through the content
// helper so no slug is named. Invariants only: it guards later edits to src/content/reading-paths/.
import { describe, expect, it } from "vitest";
import { posts, projects, readingPaths } from "../../helpers/content.ts";

describe("the real reading paths", () => {
  it("has at most four paths with unique positions", () => {
    expect(readingPaths.length).toBeLessThanOrEqual(4);
    const positions = readingPaths.map((p) => p.data.position);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it("names only posts and projects that exist, with no duplicate in a path", () => {
    const postSlugs = new Set(posts.map((p) => p.slug));
    const projectSlugs = new Set(projects.map((p) => p.slug));
    for (const path of readingPaths) {
      const keys = (path.data.items ?? []).map((item) => ("post" in item ? `post:${item.post}` : `project:${item.project}`));
      expect(keys.length, path.file).toBeGreaterThanOrEqual(1);
      expect(keys.length, path.file).toBeLessThanOrEqual(5);
      expect(new Set(keys).size, path.file).toBe(keys.length);
      for (const item of path.data.items ?? []) {
        if (item.post !== undefined) expect(postSlugs.has(item.post), `${path.file}: ${item.post}`).toBe(true);
        else expect(projectSlugs.has(item.project ?? ""), `${path.file}: ${item.project}`).toBe(true);
      }
    }
  });

  it("gives every path a one-sentence description of at most 160 characters", () => {
    for (const path of readingPaths) {
      const text = path.data.description ?? "";
      expect(text.length, path.file).toBeLessThanOrEqual(160);
      expect(text.endsWith("."), path.file).toBe(true);
      expect(/[.!?]\s+\S/.test(text), path.file).toBe(false);
    }
  });
});
