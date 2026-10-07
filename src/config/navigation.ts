// The shape of the site's navigation and the social links (data-model.md NavigationItem and
// SiteNavigation; FR-005, FR-006). The header and footer entries are not listed here: they come from
// the `nav` setting of each page file (src/lib/content/navigation.ts).

export interface NavigationItem {
  /** Plain-language link text (or accessible name, for icon links). */
  label: string;
  /** Internal addresses start and end with `/`; external ones use `https://`. */
  href: string;
  kind: "primary" | "footer" | "social";
  /** Page-sourced items only: the place in the menu, from 1. Unique within a menu. */
  position?: number;
  /** Page-sourced items only: the page file that defines the entry, for error messages. */
  source?: string;
}

/**
 * The addresses of the pages that code routes build (the blog and project listings). Their menu
 * entries are settings in landing files in src/content/pages/ (`writing.mdx`, `projects.mdx`);
 * getNavigation() fails the build when one is missing (FR-005, FR-010).
 */
export const landingPages: readonly string[] = ["/writing/", "/projects/"];

/** The two menus, each in position order, built from the page files by buildMenus(). */
export interface SiteNavigation {
  header: NavigationItem[];
  footer: NavigationItem[];
}

export const socialNavigation: readonly NavigationItem[] = [
  { label: "GitHub", href: "https://github.com/drcdev", kind: "social" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/drcdev", kind: "social" },
];
