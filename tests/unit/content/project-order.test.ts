// Unit tests for the published-project selection and ordering (data-model.md
// "Derived: published projects and order"; FR-016). The collection call itself
// lives in src/lib/projects.ts; the pure part is tested here.
import { describe, expect, it } from "vitest";
import { selectPublishedProjects } from "../../../src/lib/content/project-order.ts";

interface P {
  id: string;
  data: { title: string; order?: number; date?: Date; draft: boolean };
}

const p = (id: string, data: Partial<P["data"]> = {}): P => ({ id, data: { title: id, draft: false, ...data } });
const ids = (list: readonly P[]) => list.map((entry) => entry.id);
const local = {};
const production = { WORKERS_CI: "1", WORKERS_CI_BRANCH: "main" };

describe("selectPublishedProjects", () => {
  it("puts ordered projects first, ascending by order", () => {
    const list = [p("c"), p("b", { order: 2 }), p("a", { order: 1 })];
    expect(ids(selectPublishedProjects(list, local))).toEqual(["a", "b", "c"]);
  });

  it("orders the unordered by date descending, dated before undated", () => {
    const list = [
      p("old", { date: new Date("2024-01-01") }),
      p("none"),
      p("new", { date: new Date("2025-01-01") }),
    ];
    expect(ids(selectPublishedProjects(list, local))).toEqual(["new", "old", "none"]);
  });

  it("breaks remaining ties by title", () => {
    const list = [p("z", { title: "Zed" }), p("a", { title: "Alpha" })];
    expect(ids(selectPublishedProjects(list, local))).toEqual(["a", "z"]);
    const same = [p("q", { order: 1, title: "Beta" }), p("r", { order: 1, title: "Alpha" })];
    expect(ids(selectPublishedProjects(same, local))).toEqual(["r", "q"]);
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
    const list = [p("b", { order: 2 }), p("a", { order: 1 })];
    selectPublishedProjects(list, local);
    expect(ids(list)).toEqual(["b", "a"]);
  });
});
