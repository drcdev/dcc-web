// Screen descriptors shared by the prototype components: where the same screen
// lives in each direction, and how dates are shown. Prototype-only.
import {
  directionById,
  landingPath,
  listingPath,
  postPath,
  topicPath,
  type DirectionId,
  type SamplePost,
} from "./samples.ts";

export type Screen =
  | { kind: "index" }
  | { kind: "landing" }
  | { kind: "listing"; page: number }
  | { kind: "topic"; topic: string }
  | { kind: "post"; post: SamplePost };

export const INDEX_PATH = "/design/blog/";

export function screenPath(direction: DirectionId, screen: Screen): string {
  switch (screen.kind) {
    case "index":
      return INDEX_PATH;
    case "landing":
      return landingPath(direction);
    case "listing":
      return listingPath(direction, screen.page);
    case "topic":
      return topicPath(direction, screen.topic);
    case "post":
      return postPath(direction, screen.post);
  }
}

export function directionLabel(id: DirectionId): string {
  return `Direction ${id.toUpperCase()}: ${directionById(id).name}`;
}

const dateFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "long", timeZone: "UTC" });

export const formatDate = (date: string) => dateFormat.format(new Date(`${date}T00:00:00Z`));
export const formatMonth = (date: string) => monthFormat.format(new Date(`${date}T00:00:00Z`));

/** Groups posts (already in order) by a key, keeping first-seen order. */
export function groupPosts(list: SamplePost[], key: (post: SamplePost) => string): [string, SamplePost[]][] {
  const groups = new Map<string, SamplePost[]>();
  for (const post of list) {
    const k = key(post);
    groups.set(k, [...(groups.get(k) ?? []), post]);
  }
  return [...groups.entries()];
}

/** The sections of the full sample body, for in-page contents (direction C). */
export const bodySections = [
  { id: "what-we-found", title: "What we found" },
  { id: "a-sample-check", title: "A sample check" },
  { id: "what-it-costs", title: "What it costs" },
  { id: "where-this-leaves-us", title: "Where this leaves us" },
] as const;
