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
