// The pure view of the reading paths (specs/040-home-now-start-here; spec FR-008, FR-013). Slugs here are
// made up; no real content is named.
import { describe, expect, it } from "vitest";
import type { PathFile } from "../../../src/content/collections/reading-path-rules.ts";
import { resolveReadingPaths } from "../../../src/lib/content/reading-path-view.ts";

const file = (id: string, position: number, items: PathFile["data"]["items"]): PathFile => ({
  id,
  file: `src/content/reading-paths/${id}.yaml`,
  data: { title: `Path ${id}`, description: "A path.", position, items },
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
