// Page templates the shell E2E specs run against (contracts/shell-dom.md).
//
// The not-found page is built in Phase 7 (T071, src/pages/404.astro). Until
// then, header/no-JS assertions on it are marked `fixme` rather than removed,
// so they are visible in every run; T072 sets `built: true` here and they must
// then pass.
export const TEMPLATES = [
  { name: "home", path: "/", built: true },
  { name: "not-found", path: "/nope/", built: false },
] as const;

export const NOT_FOUND_PENDING = "not-found page is built in Phase 7 (T071); T072 enables this";

export const PRIMARY = [
  ["Home", "/"],
  ["Services", "/services/"],
  ["Speaking", "/speaking/"],
  ["Writing", "/writing/"],
  ["Projects", "/projects/"],
  ["About", "/about/"],
  ["Contact", "/contact/"],
] as const;

export const MENU_BUTTON = 'button[aria-controls="primary-nav-list"]';
export const NAV_LIST = "#primary-nav-list";
