// Unit tests (primary layer: unit) for the replacement check (data-model.md
// "Validation rules (collection)"; contract rows RP04 and RP05).
import { describe, expect, it } from "vitest";
import { checkReplacements } from "../../../../src/content/collections/project-rules.ts";


type Replaced = { project: { collection: "projects"; id: string } } | { name: string; href?: string };
interface E {
  id: string;
  data: { title: string; status: string; draft: boolean; replacedBy?: Replaced };
}
const e = (id: string, data: Partial<E["data"]> = {}): E => ({
  id,
  data: { title: `Title of ${id}`, status: "shipped", draft: false, ...data },
});
const onSite = (id: string): Replaced => ({ project: { collection: "projects", id } });
const old = (replacedBy?: Replaced) => e("old", { status: "retired", replacedBy });

describe("checkReplacements", () => {
  it("accepts a replacement that names another file", () => {
    expect(() => checkReplacements([old(onSite("new")), e("new")])).not.toThrow();
  });

  it("RP04: names the file, replacedBy, the id and the file to add", () => {
    expect(() => checkReplacements([old(onSite("gone"))])).toThrow(
      /Project file src\/content\/projects\/old\.mdx: .*replacedBy.*"gone".*src\/content\/projects\/gone\.mdx/,
    );
  });

  it("RP05: a project cannot replace itself", () => {
    expect(() => checkReplacements([old(onSite("old"))])).toThrow(/this project itself/);
  });

  it("counts a draft as a file", () => {
    expect(() => checkReplacements([old(onSite("new")), e("new", { draft: true })])).not.toThrow();
  });

  it("ignores projects with no on-site replacement", () => {
    expect(() => checkReplacements([old({ name: "Elsewhere" }), e("x")])).not.toThrow();
  });
});
