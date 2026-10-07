// Builds the header and footer menus from the `nav` setting of the page files
// (data-model.md "SiteNavigation"; contracts/page-settings.md V6 and V11; FR-005, FR-008, FR-009).
// There are no fixed entries: a menu holds exactly the pages that ask for it.
import type { NavigationItem, SiteNavigation } from "../../config/navigation.ts";
import { contentError } from "./errors.ts";

/** What the builder needs to know about one page or landing file. */
export interface NavigationPage {
  /** Repo-relative path of the file, for error messages. */
  file: string;
  address: string;
  title: string;
  nav?: { location: "header" | "footer"; position: number; label?: string };
}

type Location = "header" | "footer";

function buildMenu(location: Location, pages: readonly NavigationPage[]): NavigationItem[] {
  const members = pages
    .filter((page) => page.nav?.location === location)
    // File-path order, so an error always names the same pair of files whatever order they came in.
    .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

  const byPosition = new Map<number, NavigationPage>();
  const byText = new Map<string, NavigationPage>();
  const items: NavigationItem[] = [];
  for (const page of members) {
    const { position, label } = page.nav!;
    const shown = (label ?? page.title).trim();

    const samePosition = byPosition.get(position);
    if (samePosition) {
      throw contentError(
        "page",
        [samePosition.file, page.file],
        `both use ${location} position ${position}. Change the position in one of them.`,
      );
    }
    const key = shown.toLowerCase();
    const sameText = byText.get(key);
    if (sameText) {
      const first = (sameText.nav!.label ?? sameText.title).trim();
      throw contentError(
        "page",
        [sameText.file, page.file],
        `both show "${first}" in the ${location}. Give one of them a different label.`,
      );
    }
    byPosition.set(position, page);
    byText.set(key, page);
    items.push({
      label: shown,
      href: page.address,
      kind: location === "header" ? "primary" : "footer",
      position,
      source: page.file,
    });
  }
  return items.sort((a, b) => a.position! - b.position!);
}

/** The header and footer items in position order. A page without `nav` is in no menu. */
export function buildMenus(pages: readonly NavigationPage[]): SiteNavigation {
  return { header: buildMenu("header", pages), footer: buildMenu("footer", pages) };
}
