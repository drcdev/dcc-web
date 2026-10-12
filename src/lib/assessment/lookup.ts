// Finds an assessment and its shifts for the post components and the post route (contracts/
// assessment-data.md rows A4 and A5). The finders are pure; `loadAssessments()` reads the
// collection and is the only part that needs Astro's content runtime, so it is imported lazily.
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

/**
 * The id Astro gives the Markdown heading `## <title>` (github-slugger: lower-case, punctuation
 * dropped, spaces to hyphens). The block names itself by that heading and the title-card link
 * points at it, so the data file's title and the post's heading must read the same.
 */
export function headingId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/**
 * The id of the block's content inside its collapsed `<details>` (FR-001a). The title-card link
 * points here, not at the heading: following a link to something inside a closed `<details>`
 * opens it, so the link reveals the block with JavaScript off too.
 */
export function assessmentContentId(title: string): string {
  return `${headingId(title)}-content`;
}

/**
 * A6: every shift's `anchor` is the id of a heading the post renders. A7: the post renders the
 * block for an assessment once. Both name the post file; A6 names the shift and the anchor.
 */
export function checkBlockTargets({
  file,
  assessment,
  id,
  headings,
  blockCount,
}: {
  file: string;
  assessment: Assessment;
  id: string;
  headings: readonly { slug: string }[];
  blockCount: number;
}): void {
  if (blockCount > 1) {
    throw contentError("post", file, `the self-assessment "${id}" is rendered ${blockCount} times. Render <SelfAssessment assessment="${id}" /> once.`);
  }
  for (const shift of assessment.shifts) {
    if (!headings.some((heading) => heading.slug === shift.anchor)) {
      throw contentError("post", file, `the anchor "${shift.anchor}" of "${shift.name}" matches no heading in the post. Fix the anchor in the data file or the heading in the post.`);
    }
  }
}
