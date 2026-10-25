// The `posts` collection schema (data-model.md "Post"; contracts/post-file.md;
// research R1). Called with the `image` helper from the collection schema
// context (docs.astro.build/en/guides/images/#images-in-content-collections).
// Strict, so an unknown or misspelled setting fails the build (FR-033). All of a post's rules are in
// this file: the schema, the raw date check and the topic near-miss.
//
// Dates are a YAML date. js-yaml rolls an impossible date over and `z.date()`
// accepts a timestamp, so the raw front matter text is checked as well, in
// `assertPostDates` below (research R1 fallback).
import { z } from "astro/zod";
import { seriesIds, topicIds } from "../../config/topics.ts";
import { isRealDate } from "../../lib/content/dates.ts";
import { contentError } from "../../lib/content/errors.ts";
import { requiredText, type ImageValidator } from "../../lib/content/schema-fields.ts";

const allowedTopics = topicIds.join(", ");

// A topic id is a controlled id or a free-form one (FR-011). Free-form ids follow the same
// format as controlled ones: lower-case letters, digits and hyphens, at most 40 characters.
const topicId = z
  .string({ error: "Write each topic as an id, for example agentic-ai." })
  .max(40, { error: (issue) => `"${String(issue.input)}" is longer than 40 characters. Shorten the topic id.` })
  .regex(/^[a-z0-9-]+$/, {
    error: (issue) =>
      `"${String(issue.input)}" is not a valid topic id. Use lower-case letters, digits and hyphens only.`,
  });

const altText = z
  .string({ error: "Add alt text that describes the image." })
  .trim()
  .min(1, "Add alt text that describes the image (it cannot be empty).");

const postDate = z.date({ error: "Write the date as YYYY-MM-DD, for example 2026-08-27." });

export function postSchema({ image }: { image: ImageValidator }) {
  return z
    .strictObject({
      title: requiredText,
      summary: requiredText,
      date: postDate,
      updated: postDate.optional(),
      topics: z
        .array(topicId, { error: "List at least one topic, for example topics: [agentic-ai]." })
        .min(1, `List at least one topic. Choose from: ${allowedTopics}.`),
      featureImage: z.strictObject({ src: image(), alt: altText, caption: requiredText.optional() }).optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .superRefine((post, context) => {
      if (new Set(post.topics).size !== post.topics.length) {
        context.addIssue({
          code: "custom",
          path: ["topics"],
          message: "Name each topic once in topics.",
        });
      }
      const named = new Set(post.topics);
      const inSeries = seriesIds.filter((id) => named.has(id));
      if (inSeries.length > 1) {
        context.addIssue({
          code: "custom",
          path: ["topics"],
          message: `A post can be in only one series, but topics lists ${inSeries.map((id) => `"${id}"`).join(" and ")}. Keep one series.`,
        });
      }
      for (const id of named) {
        const meant = nearMiss(id, topicIds);
        if (meant) {
          context.addIssue({
            code: "custom",
            path: ["topics"],
            message: `"${id}" is not a topic. Choose from: ${allowedTopics}. Did you mean "${meant}"?`,
          });
        }
      }
      if (post.updated && post.updated < post.date) {
        context.addIssue({
          code: "custom",
          path: ["updated"],
          message: "updated cannot be earlier than date.",
        });
      }
    });
}

export type PostData = z.infer<ReturnType<typeof postSchema>>;

// The check on the raw front matter text of a post file that `z.date()` cannot make (contracts/
// build-errors.md row P4; FR-031).
const DATE_KEYS = ["date", "updated"] as const;

/** The top-level front matter block of a file's source text, or "" when there is none. */
function frontMatterOf(source: string): string {
  return /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1] ?? "";
}

/**
 * Throws a PageContentError naming the file and the key when `date` or `updated` is written in any
 * form other than a real YYYY-MM-DD date. A missing key is left to the schema.
 * @param file repo-relative path of the post file, for the message
 * @param source the whole text of the file
 */
export function assertPostDates(file: string, source: string): void {
  const front = frontMatterOf(source);
  for (const key of DATE_KEYS) {
    // Top-level keys only: a key nested under another setting is indented.
    const line = new RegExp(`^${key}:(.*)$`, "m").exec(front);
    if (!line) continue;
    const value = (line[1] ?? "").replace(/\s+#.*$/, "").trim();
    if (!isRealDate(value)) {
      throw contentError(
        "post",
        file,
        `${key} must be a real date written YYYY-MM-DD with no quotes or time, for example ${key}: 2026-08-27. Found ${key}: ${value === "" ? "(nothing)" : value}.`,
      );
    }
  }
}

// Topic typo check (FR-011).
/** Levenshtein distance between two strings. */
export function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost);
    }
    previous = current;
  }
  return previous[b.length]!;
}

/**
 * The controlled id a non-controlled id is probably a typo of: the closest one within edit
 * distance 2, or undefined when the id is controlled or is not close to any (FR-011).
 */
export function nearMiss(id: string, controlled: readonly string[]): string | undefined {
  if (controlled.includes(id)) return undefined;
  let best: string | undefined;
  let bestDistance = 3;
  for (const candidate of controlled) {
    const distance = editDistance(id, candidate);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
