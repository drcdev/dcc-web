// The closed set of story building blocks available in project files without an
// import (contracts/project-file.md; research R3). Same pattern as
// src/components/sections/index.ts.
import Chapter from "./Chapter.astro";
import Demo from "./Demo.astro";
import Invitation from "./Invitation.astro";
import OptionComparison from "./OptionComparison.astro";
import Visual from "./Visual.astro";

export const storyBlockNames = ["Chapter", "Visual", "OptionComparison", "Demo", "Invitation"] as const;

export type StoryBlockName = (typeof storyBlockNames)[number];

/** The story blocks a project body can use without importing them, keyed by name. */
export const storyBlockComponents = {
  Chapter,
  Visual,
  OptionComparison,
  Demo,
  Invitation,
} satisfies Record<StoryBlockName, unknown>;
