// Ordering, landing selection, related posts and the home section (research
// R5; data-model.md "LandingSelection"; FR-006 to FR-009, FR-015, FR-029,
// FR-038). Pure functions over post summaries, tested without Astro.
import { blog } from "../../config/blog.ts";

interface Ordered {
  slug: string;
  title: string;
  date: Date;
}

interface Topical extends Ordered {
  topics: readonly string[];
}

interface Landable extends Ordered {
  featured: boolean;
}

const collator = new Intl.Collator("en", { sensitivity: "base" });

/** Newest first; a date tie goes to the title (English collation, case ignored), then the slug (FR-015). */
export function sortNewestFirst<T extends Ordered>(posts: readonly T[]): T[] {
  return [...posts].sort(
    (a, b) =>
      b.date.getTime() - a.date.getTime() ||
      collator.compare(a.title, b.title) ||
      (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
  );
}

export interface LandingSelection<T> {
  /** The newest visible post. */
  lead: T | undefined;
  /** Featured posts other than the lead, newest first. */
  featured: T[];
  /** The newest posts not already shown. */
  latest: T[];
}

/** The landing page: the newest post as lead, up to 3 featured, then up to 6 latest (FR-006 to FR-009). */
export function selectLanding<T extends Landable>(posts: readonly T[]): LandingSelection<T> {
  const [lead, ...rest] = sortNewestFirst(posts);
  const featured = rest.filter((post) => post.featured).slice(0, blog.featuredMax);
  const latest = rest.filter((post) => !featured.includes(post)).slice(0, blog.latestMax);
  return { lead, featured, latest };
}

/** Up to 3 other posts, most shared topics first, then newest; the newest others when none share a topic (FR-029). */
export function selectRelated<T extends Topical>(post: T, posts: readonly T[]): T[] {
  const shared = (other: T) => other.topics.filter((topic) => post.topics.includes(topic)).length;
  const others = sortNewestFirst(posts.filter((other) => other.slug !== post.slug));
  // `sort` is stable, so posts with equally many shared topics stay newest first.
  return others.sort((a, b) => shared(b) - shared(a)).slice(0, blog.relatedMax);
}

/** The newest posts for the home page (FR-038). */
export function selectRecent<T extends Ordered>(posts: readonly T[]): T[] {
  return sortNewestFirst(posts).slice(0, blog.recentMax);
}
