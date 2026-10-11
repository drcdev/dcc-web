// Finds an assessment and its shifts for the post components and the post route (contracts/
// assessment-data.md rows A4 and A5). The finders are pure; `loadAssessments()` reads the
// collection and is the only part that needs Astro's content runtime, so it is imported lazily.
// The A6 and A7 heading checks join this file in US2.
import type { Assessment, AssessmentShift } from "../../content/schemas/assessment.ts";
import { contentError } from "../content/errors.ts";

export type Assessments = Readonly<Record<string, Assessment>>;

export function findAssessment(file: string, id: string, known: Assessments): Assessment {
  const found = known[id];
  if (found) return found;
  throw contentError(
    "post",
    file,
    `assessment="${id}" has no data file in src/content/assessments/. The known assessments are: ${Object.keys(known).join(", ") || "none"}.`,
  );
}

export function findShift(file: string, assessment: Assessment, id: string): AssessmentShift {
  const found = assessment.shifts.find((shift) => shift.id === id);
  if (found) return found;
  throw contentError(
    "post",
    file,
    `shift="${id}" is not a shift of this assessment. The known shifts are: ${assessment.shifts.map((shift) => shift.id).join(", ")}.`,
  );
}

/** Every assessment in the collection, keyed by id (the file name). */
export async function loadAssessments(): Promise<Assessments> {
  const { getCollection } = await import("astro:content");
  const entries = await getCollection("assessments");
  return Object.fromEntries(entries.map((entry) => [entry.id, entry.data]));
}

/** The assessment a component names: from its `data` prop when given (tests), otherwise the collection. */
export async function resolveAssessment(file: string, id: string, data?: Assessment): Promise<Assessment> {
  return data ?? findAssessment(file, id, await loadAssessments());
}
