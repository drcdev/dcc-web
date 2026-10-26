// All of the `career` collection's rules (specs/041-career-timeline/data-model.md C1 to C4;
// contracts/build-errors.md rows T01 to T14). One YAML file per career step. Every object is strict,
// so an unknown key (including a fourth category) fails the build. Posts are references
// (docs.astro.build/en/guides/content-collections/#defining-collection-references). Beside the
// schema: the rules that span files (C1 to C4), run by src/lib/career.ts when the About page builds.
// Zod comes from Astro's own re-export.
import { reference } from "astro:content";
import { z } from "astro/zod";
import { contentError } from "../../lib/content/errors.ts";

const SHORT = 120;
const LONG = 300;
const ITEM = 200;

const monthMessage = (field: string, extra = "") => `${field}: write the month as YYYY-MM${extra}`;
const month = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Trimmed, non-empty plain text of at most `limit` characters. */
const text = (field: string, limit: number) =>
  z.string().trim().min(1, `${field}: write some text, or leave the key out`).max(limit, `${field}: keep this under ${limit} characters`);

const list = <T extends z.ZodType>(field: string, item: T) =>
  z.array(item).min(1, `${field}: list at least one item, or leave the key out`);

export function careerSchema() {
  return z
    .strictObject({
      role: z.string().trim().min(1, "role: write the role").max(SHORT, `role: keep this under ${SHORT} characters`),
      organization: z
        .string()
        .trim()
        .min(1, "organization: write the organization")
        .max(SHORT, `organization: keep this under ${SHORT} characters`),
      start: z.string().regex(month, monthMessage("start")),
      end: z
        .string()
        .refine((value) => value === "present" || month.test(value), monthMessage("end", " or present")),
      scope: z.string().trim().min(1, "scope: write what the role covered").max(LONG, `scope: keep this under ${LONG} characters`),
      decision: text("decision", LONG).optional(),
      changed: text("changed", LONG).optional(),
      wish: text("wish", LONG).optional(),
      nextMove: text("nextMove", LONG).optional(),
      achievements: list("achievements", z.string().trim().min(1, "write some text").max(ITEM, `keep this under ${ITEM} characters`)).optional(),
      leadership: list("leadership", z.string().trim().min(1, "write some text").max(ITEM, `keep this under ${ITEM} characters`)).optional(),
      awards: list(
        "awards",
        z.strictObject({
          name: z.string().trim().min(1, "write the award name").max(ITEM, `keep this under ${ITEM} characters`),
          year: z.number({ error: "write the year as a whole number" }).int("write the year as a whole number"),
          href: z
            .url({ error: "write a full https address" })
            .refine((value) => value.startsWith("https://"), "the address must start with https://")
            .optional(),
        }),
      ).optional(),
      posts: list("posts", reference("posts")).optional(),
      volunteer: z.boolean({ error: "volunteer: write true, or leave the key out" }).optional(),
    })
    .superRefine((step, ctx) => {
      if (step.end !== "present" && month.test(step.start) && step.end < step.start) {
        ctx.addIssue({ code: "custom", path: ["end"], message: "end: the end month is before the start month" });
      }
      const seen = new Set<string>();
      for (const post of step.posts ?? []) {
        const slug = typeof post === "string" ? post : post.id;
        if (seen.has(slug)) ctx.addIssue({ code: "custom", path: ["posts"], message: `posts: ${slug} is listed twice` });
        seen.add(slug);
      }
    });
}

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
    volunteer?: boolean;
  };
}

/** What the post lookup knows about each post file, drafts included, keyed by slug. */
export type PostLookup = ReadonlyMap<string, { title: string; draft: boolean }>;

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
