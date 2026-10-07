// Reads the `pages` collection for the route and the not-found page: the
// address of an entry and the header and footer menus (data-model.md
// "derived values"; FR-025). The pure parts live in src/lib/content/.
import { getCollection, type CollectionEntry } from "astro:content";
import { landingPages, type SiteNavigation } from "../config/navigation.ts";
import { WORKERS_CI, WORKERS_CI_BRANCH } from "astro:env/server";
import { includeDrafts } from "./build-mode.ts";
import { contentError } from "./content/errors.ts";
import { buildMenus } from "./content/navigation.ts";

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

/**
 * The header and footer menus, built only from the page files: every page in this build with a
 * `nav` setting, plus the landing files that give the blog and project listings their entries.
 * A missing landing file fails the build (FR-005, FR-010; contract row V9).
 */
export async function getNavigation(): Promise<SiteNavigation> {
  const [entries, landing] = await Promise.all([getPages(), getCollection("landing")]);
  for (const address of landingPages) {
    const id = address.replaceAll("/", "");
    if (!landing.some((entry) => entry.id === id)) {
      throw contentError("page", `src/content/pages/${id}.mdx`, "missing. Add the landing file with a title and nav.");
    }
  }
  return buildMenus([
    ...entries.map((entry) => ({
      file: fileOf(entry),
      address: addressOf(entry),
      title: entry.data.title,
      nav: entry.data.nav,
    })),
    ...landing.map((entry) => ({
      file: entry.filePath ?? `src/content/pages/${entry.id}.mdx`,
      address: `/${entry.id}/`,
      title: entry.data.title,
      nav: entry.data.nav,
    })),
  ]);
}
