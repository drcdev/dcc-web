// Page templates the shell E2E specs run against (contracts/shell-dom.md).
//
// The not-found page was built in Phase 7 (T071, src/pages/404.astro; T072
// flipped `built` to `true` here), so the header/no-JS assertions that were
// marked `fixme` while it didn't exist now run and must pass.
export const TEMPLATES = [
  { name: "home", path: "/", built: true },
  { name: "not-found", path: "/nope/", built: true },
  { name: "services", path: "/services/", built: true },
  { name: "speaking", path: "/speaking/", built: true },
  { name: "about", path: "/about/", built: true },
  { name: "privacy-policy", path: "/privacy-policy/", built: true },
  { name: "terms-of-use", path: "/terms-of-use/", built: true },
  { name: "technology", path: "/technology/", built: true },
  { name: "contact", path: "/contact/", built: true },
  { name: "writing-landing", path: "/writing/", built: true },
  { name: "writing-all", path: "/writing/all/", built: true },
  { name: "writing-topic", path: "/writing/topics/technology-teams/", built: true },
  // Blog post pages. The sample posts are drafts, so these also cover the draft post page (FR-039).
  { name: "writing-post", path: "/writing/sample-everything/", built: true },
  { name: "writing-post-text-only", path: "/writing/sample-text-only/", built: true },
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
