// Expands the post's assessment components back into Markdown for the question source (FR-021;
// contracts/assessment-data.md "Question source"). Pure and build-only. The questions panel keeps
// the same text it had when the Practical Application paragraphs and the six-week plan were prose,
// and the hash covers the expanded text, so a change to the data file regenerates the questions.
import type { Assessment } from "../../content/schemas/assessment.ts";
import { contentError } from "../content/errors.ts";

const attr = (tag: string, name: string): string | undefined => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

export function expandForQuestions(body: string, assessments: Readonly<Record<string, Assessment>>, file = "this post"): string {
  const find = (tag: string): Assessment => {
    const id = attr(tag, "assessment") ?? "";
    const found = assessments[id];
    if (!found) {
      throw contentError("post", file, `assessment="${id}" has no data file. The known assessments are: ${Object.keys(assessments).join(", ") || "none"}.`);
    }
    return found;
  };
  return body
    .replace(/<PracticalApplication\b[^>]*\/>/g, (tag) => {
      const assessment = find(tag);
      const shiftId = attr(tag, "shift") ?? "";
      const shift = assessment.shifts.find((candidate) => candidate.id === shiftId);
      if (!shift) {
        throw contentError("post", file, `shift="${shiftId}" is not a shift of this assessment. The shifts are: ${assessment.shifts.map((s) => s.id).join(", ")}.`);
      }
      return `**Practical Application**: ${shift.practicalApplication}`;
    })
    .replace(/<DevelopmentPlan\b[^>]*\/>/g, (tag) => {
      const assessment = find(tag);
      const weeks = [...assessment.shifts.map((shift) => ({ name: shift.name, week: shift.week })), assessment.integrationWeek];
      return weeks.map((week, i) => `**Week ${i + 1}: ${week.name}**  \n${week.week}`).join("\n\n");
    })
    .replace(/[ \t]*<SelfAssessment\b[^>]*\/>[ \t]*\n?/g, "")
    .replace(/\n{3,}/g, "\n\n");
}
