// The closed set of reusable sections available in page files without an
// import (contracts/sections.md; research R3). The registry maps each name to
// its component; anything else fails the build (src/lib/content/body.ts).
import CallToAction from "./CallToAction.astro";
import ContactForm from "./ContactForm.astro";
import Figure from "./Figure.astro";
import FullImage from "./FullImage.astro";
import Lead from "./Lead.astro";
import Offering from "./Offering.astro";
import Offerings from "./Offerings.astro";
import RecentWriting from "./RecentWriting.astro";
import SideImage from "./SideImage.astro";
import TextBlock from "./TextBlock.astro";
import WideImage from "./WideImage.astro";

export const sectionNames = [
  "Lead",
  "TextBlock",
  "Offerings",
  "Offering",
  "CallToAction",
  "Figure",
  "WideImage",
  "FullImage",
  "SideImage",
  "ContactForm",
  "RecentWriting",
] as const;

export type SectionName = (typeof sectionNames)[number];

/**
 * The components an MDX page body can use without importing them, keyed by
 * section name. The page route passes this to `<Content components={...} />`
 * (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content).
 */
export const sectionComponents = {
  Lead,
  TextBlock,
  Offerings,
  Offering,
  CallToAction,
  Figure,
  WideImage,
  FullImage,
  SideImage,
  ContactForm,
  RecentWriting,
} satisfies Record<SectionName, unknown>;
