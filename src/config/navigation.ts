// The site's navigation, in one typed module (data-model.md NavigationItem;
// research R4; FR-006, FR-008). Final addresses are used now; until the
// features that build them exist they serve the not-found page.

export interface NavigationItem {
  /** Plain-language link text (or accessible name, for icon links). */
  label: string;
  /** Internal addresses start and end with `/`; external ones use `https://`. */
  href: string;
  kind: "primary" | "footer" | "social";
}

export const primaryNavigation: readonly NavigationItem[] = [
  { label: "Home", href: "/", kind: "primary" },
  { label: "Services", href: "/services/", kind: "primary" },
  { label: "Speaking", href: "/speaking/", kind: "primary" },
  { label: "Writing", href: "/writing/", kind: "primary" },
  { label: "Projects", href: "/projects/", kind: "primary" },
  { label: "About", href: "/about/", kind: "primary" },
  { label: "Contact", href: "/contact/", kind: "primary" },
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

/**
 * Internal navigation addresses that no page builds yet. Link checks accept a
 * not-found response only for these, so a typo in any other link still fails.
 * Remove an entry when the feature that builds that page lands.
 */
export const futureDestinations: readonly string[] = [
  "/services/",
  "/speaking/",
  "/writing/",
  "/projects/",
  "/about/",
  "/contact/",
  "/privacy-policy/",
  "/terms-of-use/",
  "/technology/",
];
