// The site's navigation, in one typed module (data-model.md NavigationItem;
// research R4; FR-006, FR-008). Final addresses are used now; until the
// features that build them exist they serve the not-found page.

export interface NavigationItem {
  /** Plain-language link text (or accessible name, for icon links). */
  label: string;
  /** Internal addresses start and end with `/`; external ones use `https://`. */
  href: string;
  kind: "primary" | "footer" | "social";
  /** Primary items only: the place in the header list, from 1. Unique across pages and fixed entries. */
  position?: number;
  /** Primary items only: where the entry is defined, for error messages. */
  source?: string;
}

/** The navigation config file, named in error messages about fixed entries. */
export const navigationSource = "src/config/navigation.ts";

/**
 * Primary entries whose pages are built by code routes, not page files. Pages add the
 * rest through `nav` in their settings; `mergeNavigation()`
 * (src/lib/content/navigation.ts) puts them in order (FR-025).
 */
export const fixedPrimaryNavigation: readonly NavigationItem[] = [
  { label: "Writing", href: "/writing/", kind: "primary", position: 4, source: navigationSource },
  { label: "Projects", href: "/projects/", kind: "primary", position: 5, source: navigationSource },
  { label: "Contact", href: "/contact/", kind: "primary", position: 7, source: navigationSource },
];

export const footerNavigation: readonly NavigationItem[] = [
  { label: "Privacy policy", href: "/privacy-policy/", kind: "footer" },
  { label: "Terms of use", href: "/terms-of-use/", kind: "footer" },
  { label: "Technology", href: "/technology/", kind: "footer" },
];

export const socialNavigation: readonly NavigationItem[] = [
  { label: "GitHub", href: "https://github.com/drcdev", kind: "social" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/drcdev", kind: "social" },
];
