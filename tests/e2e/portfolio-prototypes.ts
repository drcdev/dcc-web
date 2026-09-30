// Portfolio design-direction prototype routes (specs/006-portfolio-design-directions;
// contracts/prototype-routes.md). Same entry shape as TEMPLATES so the shared
// a11y, no-JS and budget suites cover them. Every name starts with `portfolio-`
// so `--grep portfolio` selects them. Removed with the prototypes in Phase 9.
export const PORTFOLIO_PROTOTYPES: ReadonlyArray<{ name: string; path: string; built: true }> = [
  { name: "portfolio-hub", path: "/design/portfolio/", built: true },
  { name: "portfolio-a-index", path: "/design/portfolio/a/", built: true },
  { name: "portfolio-a-story", path: "/design/portfolio/a/focus-pocus/", built: true },
  { name: "portfolio-b-index", path: "/design/portfolio/b/", built: true },
  { name: "portfolio-b-story", path: "/design/portfolio/b/focus-pocus/", built: true },
  { name: "portfolio-c-index", path: "/design/portfolio/c/", built: true },
  { name: "portfolio-c-story", path: "/design/portfolio/c/focus-pocus/", built: true },
];
