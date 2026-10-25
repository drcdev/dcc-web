// Finds an assessment and its shifts for the post components and the post route (contracts/
// assessment-data.md rows A4 and A5). The finders are pure; `loadAssessments()` reads the
// collection and is the only part that needs Astro's content runtime, so it is imported lazily.
import { findAssessment, type Assessment, type Assessments } from "../../content/collections/assessment-rules.ts";

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
