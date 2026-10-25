// Pure display helpers for post topic ids (data-model.md "Free-form topic" and "Post"; FR-011).
// A post's topics may be controlled (src/config/topics.ts) or free-form. The rule that checks a
// topic id (the near-miss check) is in src/content/collections/post-rules.ts.
import { findTopic, seriesIds } from "../../config/topics.ts";

/** The display label of a free-form id: hyphens become spaces, first letter capitalised. */
export function topicLabel(id: string): string {
  const spaced = id.replace(/-+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const isSeries = (id: string) => (seriesIds as readonly string[]).includes(id);

/** The topics with the series first and the rest in written order. */
export function orderTopics<T extends string>(topics: readonly T[]): T[] {
  return [...topics.filter(isSeries), ...topics.filter((id) => !isSeries(id))];
}

/** The series id if any, else the first controlled id, else undefined. Colours a text-only card's border. */
export function mainTopic<T extends string>(topics: readonly T[]): T | undefined {
  return topics.find(isSeries) ?? topics.find((id) => findTopic(id) !== undefined);
}
