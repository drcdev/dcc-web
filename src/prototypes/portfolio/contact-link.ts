// Hand-off link to the contact form (contracts/contact-handoff.md; FR-015).
const SLUG = /^[a-z0-9-]{1,64}$/;

export function contactHref(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid project slug for the contact link: ${JSON.stringify(slug)}`);
  return `/contact/?project=${slug}`;
}
