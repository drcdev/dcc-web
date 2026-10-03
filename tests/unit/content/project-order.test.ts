// Unit tests (primary layer: unit) for the published-project selection and ordering (data-model.md
// "Derived: published projects and order"): newest date first, then title, then file name. The collection
// call itself lives in src/lib/projects.ts; the pure part is tested here.
import { describe, expect, it } from "vitest";
import { selectPublishedProjects } from "../../../src/lib/content/project-order.ts";

interface P {
  id: string;
  data: { title: string; date: Date; draft: boolean };
}

const p = (id: string, data: Partial<P["data"]> = {}): P => ({
  id,
  data: { title: id, date: new Date("2025-01-01"), draft: false, ...data },
});
const ids = (list: readonly P[]) => list.map((entry) => entry.id);
const local = {};
const production = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" };

describe("selectPublishedProjects", () => {
  it("orders by date, newest first", () => {
    const list = [
      p("old", { date: new Date("2024-01-01") }),
      p("mid", { date: new Date("2024-06-01") }),
      p("new", { date: new Date("2025-01-01") }),
    ];
    expect(ids(selectPublishedProjects(list, local))).toEqual(["new", "mid", "old"]);
  });

  it("breaks date ties by title, then by file name", () => {
    const list = [p("z", { title: "Zed" }), p("a", { title: "Alpha" })];
    expect(ids(selectPublishedProjects(list, local))).toEqual(["a", "z"]);
    const same = [p("b-file", { title: "Same" }), p("a-file", { title: "Same" })];
    expect(ids(selectPublishedProjects(same, local))).toEqual(["a-file", "b-file"]);
  });

  it("keeps drafts outside production builds", () => {
    const list = [p("a"), p("d", { draft: true })];
    expect(ids(selectPublishedProjects(list, local))).toEqual(["a", "d"]);
  });

  it("drops drafts in the production build", () => {
    const list = [p("a"), p("d", { draft: true })];
    expect(ids(selectPublishedProjects(list, production))).toEqual(["a"]);
  });

  it("does not change its input", () => {
    const list = [p("b", { date: new Date("2024-01-01") }), p("a", { date: new Date("2025-01-01") })];
    selectPublishedProjects(list, local);
    expect(ids(list)).toEqual(["b", "a"]);
  });
});
