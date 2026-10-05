// Maps posts to `@astrojs/rss` options (data-model.md "Feed item"; contracts/feed.md;
// FR-036). Pure, so the mapping is unit-tested; src/pages/writing/rss.xml.ts supplies the
// posts and the build's own origin. Pattern from docs.astro.build/en/recipes/rss/.
import type { RSSFeedItem, RSSOptions } from "@astrojs/rss";
import { blog } from "../config/blog.ts";
import { postHref } from "./content/addresses.ts";

/** The fields of a post the feed needs. */
export interface FeedPost {
  slug: string;
  title: string;
  summary: string;
  date: Date;
  updated?: Date | undefined;
  draft: boolean;
}

/**
 * The feed's channel and items. Drafts are never mapped, on any build (research R11), and the
 * order given is kept, so callers pass posts newest first. Titles and summaries are plain text:
 * `@astrojs/rss` escapes them when it writes the XML.
 */
export function feedOptions(posts: readonly FeedPost[], site: string | URL): RSSOptions & { items: RSSFeedItem[] } {
  return {
    title: blog.feedTitle,
    description: blog.feedDescription,
    site,
    xmlns: { dcterms: "http://purl.org/dc/terms/" },
    customData: "<language>en-ca</language>",
    items: posts
      .filter((post) => !post.draft)
      .map((post) => ({
        title: post.title,
        link: new URL(postHref(post.slug), site).href,
        description: post.summary,
        pubDate: post.date,
        ...(post.updated
          ? {
              customData: `<dcterms:modified>${post.updated.toISOString()}</dcterms:modified>`,
            }
          : {}),
      })),
  };
}
