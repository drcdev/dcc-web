// The `posts` collection schema (data-model.md "Post"; contracts/post-file.md;
// research R1). Called with the `image` helper from the collection schema
// context (docs.astro.build/en/guides/images/#images-in-content-collections).
// Strict, so an unknown or misspelled setting fails the build (FR-033).
//
// Dates are a YAML date. js-yaml rolls an impossible date over and `z.date()`
// accepts a timestamp, so the raw front matter text is checked as well, in
// src/lib/content/post-dates.ts (research R1 fallback).
import { z } from "astro/zod";
import { topicIds } from "../../config/topics.ts";
import { requiredText, type ImageValidator } from "./shared.ts";

const allowedTopics = topicIds.join(", ");

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
        .array(
          z.enum(topicIds, {
            error: (issue) => `"${String(issue.input)}" is not a topic. Choose from: ${allowedTopics}.`,
          }),
          { error: "List at least one topic, for example topics: [agentic-ai]." },
        )
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
