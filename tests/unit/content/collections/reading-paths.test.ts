// The reading path cross-file rules (specs/040-home-now-start-here/contracts/build-errors.md rows R04 to
// R07). Slugs here are made up; no real content is named.
import { describe, expect, it } from "vitest";
import { checkReadingPaths, type PathFile } from "../../../../src/content/collections/reading-path-rules.ts";

const file = (id: string, position: number, items: PathFile["data"]["items"]): PathFile => ({
  id,
  file: `src/content/reading-paths/${id}.yaml`,
  data: { title: `Path ${id}`, description: "A path.", position, items },
});

const exists = { posts: new Set(["alpha", "beta", "gamma", "same"]), projects: new Set(["delta", "same"]) };

describe("checkReadingPaths", () => {
  it("passes valid paths, and the same post in two paths", () => {
    expect(() =>
      checkReadingPaths([file("a", 1, [{ post: "alpha" }]), file("b", 2, [{ post: "alpha" }, { project: "delta" }])], exists),
    ).not.toThrow();
  });

  it("R04: names the file, item number and kind for a missing target", () => {
    expect(() => checkReadingPaths([file("a", 1, [{ post: "alpha" }, { post: "nope" }])], exists)).toThrow(
      "Reading path file src/content/reading-paths/a.yaml: item 2 (post: nope) does not exist. Use the file name of a post in src/content/posts/.",
    );
    expect(() => checkReadingPaths([file("a", 1, [{ project: "nope" }])], exists)).toThrow(
      "item 1 (project: nope) does not exist. Use the file name of a project in src/content/projects/.",
    );
  });

  it("R05: names a duplicate item, and treats a post and a project with one slug as different", () => {
    expect(() => checkReadingPaths([file("a", 1, [{ post: "alpha" }, { project: "delta" }, { post: "alpha" }])], exists)).toThrow(
      "item 3 (post: alpha) is listed twice.",
    );
    expect(() => checkReadingPaths([file("a", 1, [{ post: "same" }, { project: "same" }])], exists)).not.toThrow();
  });

  it("R06: more than four paths fail", () => {
    const five = [1, 2, 3, 4, 5].map((n) => file(`p${n}`, n, [{ post: "alpha" }]));
    expect(() => checkReadingPaths(five, exists)).toThrow(
      "Reading path files in src/content/reading-paths/: there are 5 paths; the most is 4.",
    );
  });

  it("R07: names two paths that share a position", () => {
    expect(() => checkReadingPaths([file("a", 2, [{ post: "alpha" }]), file("b", 2, [{ post: "beta" }])], exists)).toThrow(
      "Reading path files src/content/reading-paths/a.yaml and src/content/reading-paths/b.yaml: both use position 2.",
    );
  });
});
