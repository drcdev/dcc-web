// Reads the `posts` collection for every blog page, the feed and the home page
// (data-model.md "PostSummary"; research R3, R6). `getPosts()` is the only reader
// of the collection, so one rule decides what is visible: drafts are left out of
// a production build and included in every other build. The pure parts live in
// src/lib/content/.
import { getCollection, render, type CollectionEntry } from "astro:content";
import { WORKERS_CI, WORKERS_CI_BRANCH } from "astro:env/server";
import { includeDrafts } from "./build-mode.ts";
import { postHref } from "./content/post-address.ts";
import { sortNewestFirst } from "./content/post-order.ts";
import type { PostSummary } from "./content/post-summary.ts";

export type PostEntry = CollectionEntry<"posts">;

/** The repo-relative path of an entry's file, for error messages. */
export function postFileOf(entry: PostEntry): string {
  return entry.filePath ?? `src/content/posts/${entry.id}.mdx`;
}

/**
 * Every post visible in this build, newest first. A draft is visible unless this is a production
 * build (a Workers Builds build of `main`; FR-032, FR-046).
 */
export async function getPosts(): Promise<PostEntry[]> {
  const drafts = includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH });
  const entries = await getCollection("posts", ({ data }) => drafts || !data.draft);
  return sortNewestFirst(entries.map((entry) => ({ entry, slug: entry.id, title: entry.data.title, date: entry.data.date }))).map(
    ({ entry }) => entry,
  );
}

function summaryOf(entry: PostEntry, minutesRead: number): PostSummary {
  const { title, summary, date, updated, topics, featureImage, featured, draft } = entry.data;
  return {
    slug: entry.id,
    href: postHref(entry.id),
    title,
    summary,
    date,
    ...(updated ? { updated } : {}),
    topics,
    // `image()` validates the file and returns its metadata, but the shared schema types it as unknown.
    ...(featureImage ? { featureImage: featureImage as PostSummary["featureImage"] } : {}),
    featured,
    draft,
    minutesRead,
  };
}

let summaries: Promise<PostSummary[]> | undefined;

/**
 * The summaries of every visible post, newest first. Each post is rendered once per build to read
 * `minutesRead`, which the reading-time plugin stores (research R6), and the result is kept so a
 * card on a listing shows the same number as the post page.
 */
export function getPostSummaries(): Promise<PostSummary[]> {
  summaries ??= (async () => {
    const entries = await getPosts();
    return Promise.all(
      entries.map(async (entry) => {
        const { remarkPluginFrontmatter } = await render(entry);
        const minutes = remarkPluginFrontmatter.minutesRead;
        if (typeof minutes !== "number") {
          throw new Error(
            `Post file ${postFileOf(entry)}: no reading time was calculated. Check that the reading-time plugin is registered in astro.config.mjs.`,
          );
        }
        return summaryOf(entry, minutes);
      }),
    );
  })();
  return summaries;
}
