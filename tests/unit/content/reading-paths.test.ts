// The pure reading path module (specs/040-home-now-start-here/contracts/build-errors.md rows R04 to
// R07; spec FR-008, FR-013). Slugs here are made up; no real content is named.
import { describe, expect, it } from "vitest";
import { checkReadingPaths, resolveReadingPaths, type PathFile } from "../../../src/lib/content/reading-paths.ts";

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

const visible = {
  posts: new Map([
    ["alpha", { title: "Alpha", href: "/writing/alpha/", minutesRead: 3 }],
    ["beta", { title: "Beta", href: "/writing/beta/", minutesRead: 5 }],
  ]),
  projects: new Map([["delta", { title: "Delta", href: "/projects/delta/", minutesRead: 2 }]]),
};

describe("resolveReadingPaths", () => {
  it("sorts paths by position and keeps item order", () => {
    const paths = resolveReadingPaths(
      [file("late", 2, [{ project: "delta" }, { post: "beta" }]), file("early", 1, [{ post: "alpha" }])],
      visible,
    );
    expect(paths.map((p) => p.id)).toEqual(["early", "late"]);
    expect(paths[1]?.items).toEqual([
      { kind: "project", title: "Delta", href: "/projects/delta/", minutesRead: 2 },
      { kind: "post", title: "Beta", href: "/writing/beta/", minutesRead: 5 },
    ]);
    expect(paths[0]).toMatchObject({ title: "Path early", description: "A path." });
  });

  it("drops an item that is not visible, and a path left empty", () => {
    const paths = resolveReadingPaths(
      [file("a", 1, [{ post: "alpha" }, { post: "hidden" }]), file("b", 2, [{ post: "hidden" }])],
      visible,
    );
    expect(paths.map((p) => p.id)).toEqual(["a"]);
    expect(paths[0]?.items.map((i) => i.title)).toEqual(["Alpha"]);
  });

  it("keeps a path of one item", () => {
    expect(resolveReadingPaths([file("a", 1, [{ post: "alpha" }])], visible)).toHaveLength(1);
  });

  it("returns none when every path is dropped, or there are no files", () => {
    expect(resolveReadingPaths([file("a", 1, [{ post: "hidden" }])], visible)).toEqual([]);
    expect(resolveReadingPaths([], visible)).toEqual([]);
  });

  it("allows the same post in two paths", () => {
    const paths = resolveReadingPaths([file("a", 1, [{ post: "alpha" }]), file("b", 2, [{ post: "alpha" }])], visible);
    expect(paths.flatMap((p) => p.items.map((i) => i.title))).toEqual(["Alpha", "Alpha"]);
  });
});
