// Hand-off link to the contact form (FR-015).
const SLUG = /^[a-z0-9-]{1,64}$/;

/** `/contact/?project=<slug>`. Throws for a slug that is not a valid project slug. */
export function contactHref(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid project slug for the contact link: ${JSON.stringify(slug)}`);
  return `/contact/?project=${slug}`;
}
