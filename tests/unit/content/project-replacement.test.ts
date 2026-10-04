// Unit tests (primary layer: unit) for the replacement checks and resolver (data-model.md
// "Validation rules (collection)" and "Derived: ResolvedReplacement"; contract rows RP04 and RP05).
import { describe, expect, it } from "vitest";
import { checkReplacements, resolveReplacement } from "../../../src/lib/content/project-replacement.ts";

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

describe("resolveReplacement", () => {
  const all = [e("pub"), e("dra", { draft: true })];
  const published = new Set(["pub"]);

  it("links a published project to its page", () => {
    expect(resolveReplacement(old(onSite("pub")), all, published)).toEqual({ name: "Title of pub", href: "/projects/pub/" });
  });

  it("names a draft target without a link when drafts are not built", () => {
    expect(resolveReplacement(old(onSite("dra")), all, published)).toEqual({ name: "Title of dra" });
  });

  it("links a draft target when drafts are built", () => {
    expect(resolveReplacement(old(onSite("dra")), all, new Set(["pub", "dra"]))).toEqual({
      name: "Title of dra",
      href: "/projects/dra/",
    });
  });

  it("uses an off-site name and href", () => {
    expect(resolveReplacement(old({ name: "Metronome", href: "https://example.com/c" }), all, published)).toEqual({
      name: "Metronome",
      href: "https://example.com/c",
    });
  });

  it("uses a name alone with no link", () => {
    expect(resolveReplacement(old({ name: "Metronome" }), all, published)).toEqual({ name: "Metronome" });
  });

  it("returns nothing without replacedBy", () => {
    expect(resolveReplacement(old(), all, published)).toBeUndefined();
  });
});
