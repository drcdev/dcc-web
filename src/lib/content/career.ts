// The pure part of the career timeline (specs/041-career-timeline: data-model.md C1 and C2,
// contracts/build-errors.md rows T08 and T09). src/lib/career.ts reads the collection and passes
// the steps in, so these functions need no Astro runtime.
import { postHref } from "./addresses.ts";
import { contentError } from "./errors.ts";

export type CategoryId = "achievements" | "leadership" | "awards";
/** The fixed category list, in display order (data-model.md "Category"). */
export const categoryIds: readonly CategoryId[] = ["achievements", "leadership", "awards"];

export interface Award {
  name: string;
  year: number;
  href?: string;
}

/** One career step file with its posts as plain slugs. */
export interface StepFile {
  /** The file name without extension. */
  id: string;
  /** Repository-relative path, for messages. */
  file: string;
  data: {
    role: string;
    organization: string;
    start: string;
    end: string;
    scope: string;
    decision?: string;
    changed?: string;
    wish?: string;
    nextMove?: string;
    achievements?: string[];
    leadership?: string[];
    awards?: Award[];
    posts?: string[];
  };
}

/** What the post lookup knows about each post file, drafts included, keyed by slug. */
export type PostLookup = ReadonlyMap<string, { title: string; draft: boolean }>;

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

/** C1: newest first, by start descending, ties by id descending. The first step is the current role. */
export function orderSteps<T extends { id: string; data: { start: string } }>(files: readonly T[]): T[] {
  return [...files].sort((a, b) => b.data.start.localeCompare(a.data.start) || b.id.localeCompare(a.id));
}

/**
 * C2: the current role ends present and has no next move. C3 and C4: every listed post exists and is
 * published (a draft is rejected in every build mode). Throws a PageContentError naming the file.
 */
export function checkCareer(files: readonly StepFile[], posts?: PostLookup): void {
  if (posts) {
    for (const { file, data } of orderSteps(files)) {
      for (const slug of data.posts ?? []) {
        const post = posts.get(slug);
        if (!post) throw contentError("career step", file, `posts: post "${slug}" does not exist in src/content/posts/.`);
        if (post.draft) throw contentError("career step", file, `posts: post "${slug}" is a draft; publish it or remove it from posts.`);
      }
    }
  }
  const current = orderSteps(files).at(0);
  if (!current) return;
  if (current.data.end !== "present") {
    throw contentError("career step", current.file, `end: ${current.data.end} – this is the latest role, so end must be present.`);
  }
  if (current.data.nextMove !== undefined) {
    throw contentError("career step", current.file, "nextMove: the current role has no next move yet; remove nextMove.");
  }
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
    posts: (data.posts ?? []).flatMap((slug) => {
      const post = posts?.get(slug);
      return post ? [{ title: oneLine(post.title), href: postHref(slug) }] : [];
    }),
  }));
  const categories = categoryIds.filter((id) => steps.some((step) => step[id].length > 0));
  return { steps, categories };
}
