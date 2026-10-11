// Component tests for <DevelopmentPlan> (FR-004; contracts/assessment-data.md row A4).
import { describe, expect, it } from "vitest";
import DevelopmentPlan from "../../../src/components/assessment/DevelopmentPlan.astro";
import { byName, textOf } from "../html.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";
import { render } from "../sections/helpers.ts";

const data = sampleAssessment();

describe("DevelopmentPlan", () => {
  it("renders six paragraphs in data order: a bold week title, a line break and the week text", async () => {
    // The dev-mode container adds data-astro-source attributes; the built page has none.
    const html = (await render(DevelopmentPlan, { assessment: "sample", data })).replace(/ data-astro-source-(?:file|loc)="[^"]*"/g, "");
    expect(byName(html, "p")).toHaveLength(6);
    const paragraphs = [...html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]!);
    data.shifts.forEach((shift, i) => {
      expect(paragraphs[i]).toBe(`<strong>Week ${i + 1}: ${shift.name}</strong><br>${shift.week}`);
    });
    expect(paragraphs[5]).toBe(
      `<strong>Week 6: ${data.integrationWeek.name}</strong><br>${data.integrationWeek.week}`,
    );
    expect(textOf(html, "strong")).toBe(`Week 1: ${data.shifts[0]!.name}`);
  });
});
