// The real career step files (specs/041-career-timeline). This skeleton reads src/content/career/
// through the content helper and names no role, organization or post. The rules that need the
// launch files to exist (at least one step, the launch content) are added with them (T018).
import { describe, expect, it } from "vitest";
import { orderSteps } from "../../../src/content/collections/career-rules.ts";
import { careerSteps, currentCareerStep, pages, posts } from "../../helpers/content.ts";

describe("the real career steps", () => {
  it("gives every step file an id, a start and an end", () => {
    for (const step of careerSteps) {
      expect(step.id, step.file).toMatch(/^[a-z0-9-]+$/);
      expect(String(step.data.start), step.file).toMatch(/^\d{4}-\d{2}$/);
      expect(step.data.end, step.file).toBeDefined();
    }
  });

  it("takes the current role by the rule: the latest start, ties by id", () => {
    const current = currentCareerStep(careerSteps);
    for (const step of careerSteps) expect(String(current.data.start) >= String(step.data.start)).toBe(true);
  });

  it("orders by start, then id, whatever the order of the input", () => {
    const a = { id: "b", file: "b", data: { start: "2020-01", end: "present" } };
    const b = { id: "a", file: "a", data: { start: "2020-01", end: "present" } };
    const c = { id: "z", file: "z", data: { start: "2010-01", end: "2012-01" } };
    expect(currentCareerStep([c, a, b])).toBe(a);
  });
});

describe("the About page placement", () => {
  it("places the timeline after the About me list and before Recognition, with no Leadership line (FR-016)", () => {
    const about = pages.find((page) => page.slug === "about")!;
    const body = about.body;
    const timeline = body.indexOf("<CareerTimeline />");
    expect(timeline).toBeGreaterThan(-1);
    expect(body.indexOf("## About me")).toBeLessThan(timeline);
    expect(timeline).toBeLessThan(body.indexOf("### Recognition"));
    const list = body.slice(body.indexOf("## About me"), timeline);
    expect(list).not.toMatch(/^- \*\*Leadership/m);
  });
});

describe("the real career steps, as rules", () => {
  it("has at least one step; the first is the current role and ends present with no next move (FR-001a)", () => {
    expect(careerSteps.length).toBeGreaterThan(0);
    const current = currentCareerStep(careerSteps);
    expect(current.data.end, current.file).toBe("present");
    expect(current.data.nextMove, current.file).toBeUndefined();
  });

  it("orders the real steps newest first, so the current role comes first and the earliest last (FR-001)", () => {
    const ordered = orderSteps(careerSteps.map((s) => ({ id: s.id, data: { start: String(s.data.start) } })));
    expect(ordered[0]!.id).toBe(currentCareerStep(careerSteps).id);
    const starts = ordered.map((s) => s.data.start);
    expect(starts).toEqual([...starts].sort().reverse());
  });

  it("lists only published posts", () => {
    for (const step of careerSteps) {
      for (const slug of step.data.posts ?? []) {
        const post = posts.find((entry) => entry.slug === slug);
        expect(post, `${step.file}: ${slug}`).toBeDefined();
        expect(post!.draft, `${step.file}: ${slug}`).toBe(false);
      }
    }
  });
});
