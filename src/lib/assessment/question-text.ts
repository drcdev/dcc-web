// Expands the post's assessment components back into Markdown for the question source (FR-021;
// contracts/assessment-data.md "Question source"). Pure and build-only. The questions panel keeps
// the same text it had when the Practical Application paragraphs were prose, and the hash covers
// the expanded text, so a change to the data file regenerates the questions.
import type { Assessment } from "../../content/collections/assessment-rules.ts";
import { countWords } from "../markdown/reading-time.ts";
import { contentError } from "../content/errors.ts";

const attr = (tag: string, name: string): string | undefined => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];

type Assessments = Readonly<Record<string, Assessment>>;

export function expandForQuestions(body: string, assessments: Assessments, file = "this post"): string {
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
    .replace(/[ \t]*<SelfAssessment\b[^>]*\/>[ \t]*\n?/g, "")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * The number of words the post's components render from the data file (the Practical Application
 * paragraphs). The reading-time plugin counts only the Markdown, so the post adds these (FR-021).
 */
export function componentWords(body: string, assessments: Assessments, file = "this post"): number {
  const expanded = expandForQuestions(body, assessments, file);
  const bare = expandForQuestions(body.replace(/<PracticalApplication\b[^>]*\/>/g, ""), assessments, file);
  return countWords(expanded) - countWords(bare);
}
