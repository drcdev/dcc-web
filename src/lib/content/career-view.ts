// The view of the career timeline (specs/041-career-timeline): sorts, formats and resolves, and holds
// no rule. src/lib/career.ts reads the collection and passes the steps in, so these functions need
// no Astro runtime and the CareerTimeline client bundle never reaches `astro:content`.
import { orderSteps, type Award, type PostLookup, type StepFile } from "../../content/collections/career-rules.ts";
import { postHref } from "./addresses.ts";
import { categoryIds, type CategoryId } from "./career-filter.ts";

export interface Part {
  label: string;
  text: string;
}

export interface TimelineStep {
  id: string;
  role: string;
  organization: string;
  start: string;
  /** `YYYY-MM` or `present`. */
  end: string;
  /** Display period, for example "Oct 2014 – Sep 2016". */
  period: string;
  parts: Part[];
  achievements: string[];
  leadership: string[];
  awards: Award[];
  /** A volunteer role (FR-004a): the Volunteer category. */
  volunteer: boolean;
  /** Related posts resolved to title and address; filled from User Story 2. */
  posts: { title: string; href: string }[];
}

export interface Timeline {
  steps: TimelineStep[];
  categories: CategoryId[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2016-09` becomes "Sep 2016". */
export function formatMonth(month: string): string {
  const [year, number] = month.split("-");
  return `${MONTHS[Number(number) - 1]} ${year}`;
}

/** "Oct 2014 – Sep 2016", or "Jun 2026 – present". */
export function formatPeriod(start: string, end: string): string {
  return `${formatMonth(start)} – ${end === "present" ? "present" : formatMonth(end)}`;
}

/** Plain text on one line: a line break inside a field is not kept (FR-003b). */
const oneLine = (text: string): string => text.replace(/\s*\r?\n\s*/g, " ").trim();

const partFields = [
  ["scope", "Scope"],
  ["decision", "Key decision"],
  ["changed", "What changed in how I worked"],
  ["wish", "What I wish I'd known"],
  ["nextMove", "The skill that led to the next move"],
] as const;

/** The view the component renders (posts resolved through `posts`): steps in order with only the parts present, and the used categories. */
export function buildTimeline(files: readonly StepFile[], posts?: PostLookup): Timeline {
  const steps = orderSteps(files).map(({ id, data }): TimelineStep => ({
    id,
    role: oneLine(data.role),
    organization: oneLine(data.organization),
    start: data.start,
    end: data.end,
    period: formatPeriod(data.start, data.end),
    parts: partFields.flatMap(([key, label]) => (data[key] ? [{ label, text: oneLine(data[key]) }] : [])),
    achievements: (data.achievements ?? []).map(oneLine),
    leadership: (data.leadership ?? []).map(oneLine),
    awards: (data.awards ?? []).map((award) => ({ ...award, name: oneLine(award.name) })),
    volunteer: data.volunteer ?? false,
    posts: (data.posts ?? []).flatMap((slug) => {
      const post = posts?.get(slug);
      return post ? [{ title: oneLine(post.title), href: postHref(slug) }] : [];
    }),
  }));
  const categories = categoryIds.filter((id) => steps.some((step) => stepHas(step, id)));
  return { steps, categories };
}

/** Whether a step uses a category: an item in its list, or for Volunteer the step's own flag (FR-009). */
export function stepHas(step: TimelineStep, id: CategoryId): boolean {
  return id === "volunteer" ? step.volunteer : step[id].length > 0;
}
