// Current-page matching for navigation links (data-model.md NavigationItem;
// FR-009).

function normalise(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Whether `href` is the page at `pathname`. Both sides are compared with a
 * trailing slash, so `/work-with-me` and `/work-with-me/` match; `/` matches only the
 * home page, never every address.
 */
export function isCurrent(pathname: string, href: string): boolean {
  return normalise(pathname) === normalise(href);
}

/**
 * Whether `pathname` is `href` or an address below it, so a link to a section
 * stays marked on every page inside it (`/writing/` covers `/writing/some-post/`,
 * `/projects/` covers `/projects/some-story/`).
 * `/` covers only itself, never every address. Whole path segments are compared,
 * so `/writing-tips/` is not inside `/writing/`.
 */
export function isInSection(pathname: string, href: string): boolean {
  const path = normalise(pathname === "" ? "/" : pathname);
  const root = normalise(href);
  return root === "/" ? path === "/" : path.startsWith(root);
}
