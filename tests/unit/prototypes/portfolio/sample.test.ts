// Sample data invariants (specs/006-portfolio-design-directions/data-model.md, 1 to 11).
import { describe, expect, it } from "vitest";
import { STAGE_ORDER, type ProjectEntry, type Visual } from "../../../../src/prototypes/portfolio/types.ts";
import { allEntries, directions, focusPocus, otherEntries } from "../../../../src/prototypes/portfolio/sample.ts";

const sentenceCount = (s: string) => (s.match(/[.!?](\s|$)/g) ?? []).length;

function visibleStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(visibleStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(visibleStrings);
  return [];
}

describe("sample data", () => {
  it("has five entries: Focus Pocus, Tempo, Flux, drc.dev and Plunge Buddy", () => {
    expect(allEntries).toHaveLength(5);
    expect(allEntries[0]).toBe(focusPocus.entry);
    expect(otherEntries).toHaveLength(4);
    expect(allEntries.map((e) => e.title)).toEqual(["Focus Pocus", "Tempo", "Flux", "drc.dev", "Plunge Buddy"]);
  });

  it("1. stages follow STAGE_ORDER exactly", () => {
    expect(focusPocus.stages.map((s) => s.id)).toEqual([...STAGE_ORDER]);
  });

  it("2. every stage is marked draft", () => {
    for (const stage of focusPocus.stages) expect(stage.draft).toBe(true);
  });

  it("3. exactly one option is chosen and it has a reason", () => {
    const chosen = focusPocus.options.filter((o) => o.chosen);
    expect(chosen).toHaveLength(1);
    expect(chosen[0]!.reason?.trim().length).toBeGreaterThan(0);
    expect(focusPocus.options).toHaveLength(3);
    for (const o of focusPocus.options) {
      expect(o.pros.length).toBeGreaterThan(0);
      expect(o.cons.length).toBeGreaterThan(0);
    }
  });

  it("4. every option's fit covers every constraint", () => {
    expect(focusPocus.constraints.length).toBeGreaterThanOrEqual(3);
    for (const o of focusPocus.options) {
      for (const c of focusPocus.constraints) expect(["meets", "partly", "misses"]).toContain(o.fit[c.id]);
    }
  });

  it("5. only Focus Pocus has a storyPath", () => {
    expect(focusPocus.entry.storyPath).toBeTruthy();
    for (const e of otherEntries) expect(e.storyPath).toBeUndefined();
  });

  it("6. slugs are unique and well formed", () => {
    const slugs = allEntries.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("7. every status appears and there are at least four themes", () => {
    expect(new Set(allEntries.map((e) => e.status))).toEqual(new Set(["shipped", "experiment", "in-progress"]));
    expect(new Set(allEntries.flatMap((e) => e.themes)).size).toBeGreaterThanOrEqual(4);
    for (const e of allEntries) {
      expect(e.themes.length).toBeGreaterThanOrEqual(1);
      expect(e.themes.length).toBeLessThanOrEqual(4);
      expect(new Set(e.themes).size).toBe(e.themes.length);
    }
  });

  it("8. every problem is one sentence of at most 140 characters", () => {
    for (const e of allEntries as ProjectEntry[]) {
      expect(e.problem.length).toBeLessThanOrEqual(140);
      expect(e.problem.endsWith(".")).toBe(true);
      expect(sentenceCount(e.problem)).toBe(1);
    }
  });

  it("9. every placeholder visual has a label and description", () => {
    const visuals: Visual[] = [
      ...allEntries.map((e) => e.visual),
      ...focusPocus.stages.flatMap((s) => (s.visual ? [s.visual] : [])),
      focusPocus.demo.still,
    ];
    const placeholders = visuals.filter((v) => v.kind === "placeholder");
    expect(placeholders.length).toBeGreaterThan(0);
    for (const v of placeholders) {
      expect(v.label.trim()).not.toBe("");
      expect(v.description.trim()).not.toBe("");
    }
  });

  it("10. the demo is a stand-in with a note", () => {
    expect(focusPocus.demo.live).toBe(false);
    expect(focusPocus.demo.standInNote.length).toBeGreaterThan(0);
    expect(focusPocus.demo.href).toBe("https://drc.dev/projects/focus-pocus");
    expect(focusPocus.demo.secondaryHref).toBe("https://github.com/drcdev/focus-pocus");
  });

  it("11. three directions with newResources present", () => {
    expect(directions.map((d) => d.key)).toEqual(["a", "b", "c"]);
    expect(directions.map((d) => d.name)).toEqual(["Timeline", "Cards", "Chapters"]);
    for (const d of directions) {
      expect(Array.isArray(d.newResources)).toBe(true);
      expect(d.indexPath).toBe(`/design/portfolio/${d.key}/`);
      expect(d.storyPath).toBe(`/design/portfolio/${d.key}/focus-pocus/`);
    }
  });

  it("places visuals as specified", () => {
    const visual = (id: string) => focusPocus.stages.find((s) => s.id === id)?.visual;
    expect(visual("built")).toMatchObject({ kind: "diagram", id: "architecture" });
    expect(visual("options")).toMatchObject({ kind: "diagram", id: "options" });
    expect(visual("problem")).toMatchObject({ kind: "placeholder", media: "screenshot" });
    expect(visual("outcome")).toMatchObject({ kind: "placeholder", media: "clip" });
    expect(visual("constraints")).toBeUndefined();
    expect(visual("lessons")).toBeUndefined();
  });

  it("carries the review note on every entry", () => {
    for (const e of allEntries) expect(e.reviewNote).toBe("Themes and status are a draft for Don's review.");
  });

  it("has no empty visible string", () => {
    for (const s of visibleStrings([allEntries, focusPocus, directions])) expect(s.trim()).not.toBe("");
  });
});
