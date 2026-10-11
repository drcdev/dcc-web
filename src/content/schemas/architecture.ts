// The `architecture` collection schema (specs/036-technology-architecture-diagram/data-model.md
// "Part file"). Strict, so an unknown or misspelled key fails the build naming it. The path rules
// for `source` run in the loader's `generateId` (src/lib/architecture/source.ts), where the file
// name is known.
import { z } from "astro/zod";

export const architectureSchema = z.strictObject({
  name: z.string().trim().min(1),
  source: z.string().trim().min(1).optional(),
});
