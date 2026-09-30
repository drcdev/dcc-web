// Post summaries for the post component tests (data-model.md "PostSummary").
import sample from "../../fixtures/pages/images/sample.png";
import type { PostSummary } from "../../../src/lib/content/post-summary.ts";

export function summary(slug: string, extra: Partial<PostSummary> = {}): PostSummary {
  return {
    slug,
    href: `/writing/${slug}/`,
    title: `Title of ${slug}`,
    summary: `Summary of ${slug}.`,
    date: new Date("2026-08-27"),
    topics: ["agentic-ai"],
    featured: false,
    draft: false,
    minutesRead: 4,
    ...extra,
  };
}

export const withImage = (slug: string, extra: Partial<PostSummary> = {}) =>
  summary(slug, { featureImage: { src: sample, alt: `Picture for ${slug}` }, ...extra });
