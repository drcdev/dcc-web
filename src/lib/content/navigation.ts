// Merges the navigation entries that pages ask for with the fixed ones
// (data-model.md "NavigationItem"; contracts/build-errors.md row 15; FR-008,
// FR-025).
import { fixedPrimaryNavigation, type NavigationItem } from "../../config/navigation.ts";
import { pageFileError, pageFilesError } from "./errors.ts";

/** What the merge needs to know about one page. */
export interface NavigationPage {
  /** Repo-relative path of the page file, for error messages. */
  file: string;
  address: string;
  title: string;
  nav?: { position: number; label?: string };
}

/** The header items in position order. Pages without `nav` are left out. */
export function mergeNavigation(
  pages: readonly NavigationPage[],
  fixed: readonly NavigationItem[] = fixedPrimaryNavigation,
): NavigationItem[] {
  const items: NavigationItem[] = fixed.map((item) => ({ ...item }));
  const byPosition = new Map<number, NavigationItem>();
  for (const item of items) if (item.position !== undefined) byPosition.set(item.position, item);

  for (const page of [...pages].sort((a, b) => a.file.localeCompare(b.file))) {
    if (!page.nav) continue;
    const { position, label } = page.nav;
    const taken = byPosition.get(position);
    const item: NavigationItem = {
      label: label ?? page.title,
      href: page.address,
      kind: "primary",
      position,
      source: page.file,
    };
    if (taken) {
      throw taken.source?.startsWith("src/content/pages/")
        ? pageFilesError(
            taken.source,
            page.file,
            `both use navigation position ${position}. Change the position in one of them.`,
          )
        : pageFileError(
            page.file,
            `navigation position ${position} is already used by "${taken.label}" (${taken.source}). Choose another position.`,
          );
    }
    byPosition.set(position, item);
    items.push(item);
  }

  return items.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}
