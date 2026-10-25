// The pure career rules (specs/041-career-timeline: data-model.md C1, C2; contracts/build-errors.md
// rows T08 and T09). Row ids are in the titles. Neutral names only.
import { describe, expect, it } from "vitest";
import { checkCareer, orderSteps, type StepFile } from "../../../../src/content/collections/career-rules.ts";

const step = (id: string, start: string, end: string, extra: Partial<StepFile["data"]> = {}): StepFile => ({
  id,
  file: `src/content/career/${id}.yaml`,
  data: { role: `Role ${id}`, organization: "Org", start, end, scope: "Scope text.", ...extra },
});

describe("C1 ordering", () => {
  it("sorts newest first by start, then id descending, whatever the input order", () => {
    const sorted = orderSteps([step("b", "2020-01", "present"), step("z", "2010-05", "2012-01"), step("a", "2020-01", "present")]);
    expect(sorted.map((s) => s.id)).toEqual(["b", "a", "z"]);
    const again = orderSteps([step("z", "2010-05", "2012-01"), step("a", "2020-01", "present"), step("b", "2020-01", "present")]);
    expect(again.map((s) => s.id)).toEqual(["b", "a", "z"]);
  });
});

describe("C2 current role", () => {
  it("T08: rejects a next move on the latest step, naming the file", () => {
    const files = [step("old", "2010-01", "2012-01"), step("now", "2020-01", "present", { nextMove: "Moved on." })];
    expect(() => checkCareer(files)).toThrow(/Career step file src\/content\/career\/now\.yaml: .*the current role has no next move yet; remove nextMove/);
  });
  it("T09: rejects a latest step that does not end present, naming the file", () => {
    const files = [step("old", "2010-01", "2012-01"), step("last", "2020-01", "2021-01")];
    expect(() => checkCareer(files)).toThrow(/Career step file src\/content\/career\/last\.yaml: .*this is the latest role, so end must be present/);
  });
  it("accepts a valid set, and an earlier step that also ends present", () => {
    expect(() => checkCareer([step("a", "2010-01", "present", { nextMove: "x" }), step("b", "2020-01", "present")])).not.toThrow();
  });
  it("does nothing with no steps", () => {
    expect(() => checkCareer([])).not.toThrow();
  });
});

describe("C3 and C4 related posts", () => {
  const posts = new Map([
    ["live", { title: "A live post", draft: false }],
    ["wip", { title: "A draft post", draft: true }],
  ]);
  const last = step("now", "2020-01", "present");

  it("T10: rejects a post that has no file, naming the file, field and post", () => {
    const files = [step("old", "2010-01", "2012-01", { posts: ["gone"] }), last];
    expect(() => checkCareer(files, posts)).toThrow(
      /Career step file src\/content\/career\/old\.yaml: .*posts.*post "gone" does not exist in src\/content\/posts\//,
    );
  });
  it("T11: rejects a draft post, naming the file, field and post", () => {
    const files = [step("old", "2010-01", "2012-01", { posts: ["wip"] }), last];
    expect(() => checkCareer(files, posts)).toThrow(
      /Career step file src\/content\/career\/old\.yaml: .*posts.*post "wip" is a draft; publish it or remove it from posts/,
    );
  });
  it("accepts live posts", () => {
    const files = [step("old", "2010-01", "2012-01", { posts: ["live"] }), last];
    expect(() => checkCareer(files, posts)).not.toThrow();
  });
});
