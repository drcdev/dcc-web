// The rules that give a project's title the same view-transition name on the index
// and on its story, so the browser pairs them across the page change (research R4).
// Astro's `transition:name` emits a scoped <style> that the page's Content Security
// Policy does not hash, and an inline style="" attribute is not allowed at all, so
// the rules are written here and hashed with Astro.csp.insertStyleHash()
// (docs.astro.build/en/reference/api-reference/#csp).
import { createHash } from "node:crypto";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The stylesheet text for these project slugs; <TitleTransition> renders it and the hash covers exactly this. */
export function transitionCss(slugs: readonly string[]): string {
  const rules = slugs.map((slug) => {
    if (!SLUG.test(slug)) throw new Error(`Cannot name a view transition for the project slug "${slug}".`);
    return `[data-title-slug="${slug}"] { view-transition-name: project-${slug}; }`;
  });
  return `@media (prefers-reduced-motion: no-preference) { ${rules.join(" ")} }`;
}

/** The CSP hash of that text. Register it from route or layout frontmatter, before the head renders. */
export function transitionHash(slugs: readonly string[]): `sha256-${string}` {
  return `sha256-${createHash("sha256").update(transitionCss(slugs)).digest("base64")}`;
}
