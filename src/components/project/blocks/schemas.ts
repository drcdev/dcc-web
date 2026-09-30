// Zod schemas for the props of each story building block (contracts/project-file.md).
// Components parse their props with these at render as a second line of defence
// behind the body check in src/lib/content/project-body.ts.
import { z } from "astro/zod";
import { stageIds } from "../../../lib/content/stages.ts";
import type { StoryBlockName } from "./index.ts";

const text = z.string().trim().min(1);

export const storyBlockSchemas = {
  Chapter: z.strictObject({ stage: z.enum(stageIds), visual: text.optional(), draft: z.boolean().optional() }),
  Visual: z.strictObject({ name: text, eager: z.boolean().optional(), idPrefix: text.optional() }),
  OptionComparison: z.strictObject({}),
  // `frame` is set by <Chapter visual="demo"> to render the embedded demo itself.
  Demo: z.strictObject({ frame: z.boolean().optional() }),
  Invitation: z.strictObject({}),
} satisfies Record<StoryBlockName, z.ZodType>;
