// What cards, listings, the feed and the home section need from a post
// (data-model.md "PostSummary"). Types only, so components and pure functions can
// import it without the content layer.
import type { ImageMetadata } from "astro";

export interface PostSummary {
  slug: string;
  /** `/writing/{slug}/` */
  href: string;
  title: string;
  summary: string;
  date: Date;
  updated?: Date;
  /** The first topic is the main topic. */
  topics: string[];
  featureImage?: { src: ImageMetadata; alt: string; caption?: string };
  featured: boolean;
  draft: boolean;
  minutesRead: number;
}
