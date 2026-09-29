// The closed set of reusable sections available in page files without an
// import (contracts/sections.md; research R3). Names only at this stage: the
// section components are added to this registry with the components themselves.

export const sectionNames = [
  "Lead",
  "TextBlock",
  "Offerings",
  "Offering",
  "CallToAction",
  "Figure",
  "WideImage",
  "FullImage",
] as const;

export type SectionName = (typeof sectionNames)[number];

/**
 * The components an MDX page body can use without importing them, keyed by
 * section name. The page route passes this to `<Content components={...} />`
 * (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content).
 * Empty until the section components are built.
 */
export const sectionComponents: Partial<Record<SectionName, unknown>> = {};
