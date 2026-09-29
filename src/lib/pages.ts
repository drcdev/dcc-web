// Reads the `pages` collection for the route and the not-found page: the
// address of an entry and the merged header navigation (data-model.md
// "derived values"; FR-025). The pure parts live in src/lib/content/.
import { getCollection, type CollectionEntry } from "astro:content";
import type { NavigationItem } from "../config/navigation.ts";
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

/** The header navigation: fixed entries plus every page with `nav`, in position order. */
export async function getNavigation(): Promise<NavigationItem[]> {
  const entries = await getCollection("pages");
  return mergeNavigation(
    entries.map((entry) => ({
      file: fileOf(entry),
      address: addressOf(entry),
      title: entry.data.title,
      nav: entry.data.nav,
    })),
  );
}
