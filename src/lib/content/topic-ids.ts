// Pure helpers for post topic ids (data-model.md "Free-form topic" and "Post";
// FR-011, FR-012). A post's topics may be controlled (src/config/topics.ts) or
// free-form; these helpers are unit-tested.
import { findTopic, seriesIds } from "../../config/topics.ts";

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

/** The display label of a free-form id: hyphens become spaces, first letter capitalised. */
export function topicLabel(id: string): string {
  const spaced = id.replaceAll("-", " ");
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
