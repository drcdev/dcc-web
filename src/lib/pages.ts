// Reads the `pages` collection for the route and the not-found page: the
// address of an entry and the merged header navigation (data-model.md
// "derived values"; FR-025). The pure parts live in src/lib/content/.
import { getCollection, type CollectionEntry } from "astro:content";
import type { NavigationItem } from "../config/navigation.ts";
import { WORKERS_CI, WORKERS_CI_BRANCH } from "astro:env/server";
import { includeDrafts } from "./build-mode.ts";
import { mergeNavigation } from "./content/navigation.ts";

export type PageEntry = CollectionEntry<"pages">;

/** The address of a page entry: `/` for `index`, else `/<id>/`. */
export function addressOf(entry: Pick<PageEntry, "id">): string {
  return entry.id === "index" ? "/" : `/${entry.id}/`;
}

/** The repo-relative path of an entry's file, for error messages. */
export function fileOf(entry: PageEntry): string {
  return entry.filePath ?? `src/content/pages/${entry.id}.mdx`;
}

/**
 * The page entries this build contains. A page with `visible: false` is left out of the
 * production build and built on every other build, like a draft (FR-001, FR-002, FR-014).
 * Filtering a collection: docs.astro.build/en/guides/content-collections/#filtering-collection-queries
 */
export async function getPages(): Promise<PageEntry[]> {
  const drafts = includeDrafts({ WORKERS_CI, WORKERS_CI_BRANCH });
  return getCollection("pages", (entry) => entry.data.visible || drafts);
}

/** The header navigation: fixed entries plus every page with `nav`, in position order. */
export async function getNavigation(): Promise<NavigationItem[]> {
  const entries = await getPages();
  return mergeNavigation(
    entries.map((entry) => ({
      file: fileOf(entry),
      address: addressOf(entry),
      title: entry.data.title,
      nav: entry.data.nav,
    })),
  );
}
