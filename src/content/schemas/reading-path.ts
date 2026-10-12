// The `readingPaths` collection (specs/040-home-now-start-here/data-model.md; contracts/build-errors.md
// rows R01 to R03, R08, R10). One YAML file per path: a name, a one-sentence description, a position
// and one to five items, each a post or a project named by its file name. Items are references
// (docs.astro.build/en/guides/content-collections/#defining-collection-references); the rules that
// span files are in src/lib/content/reading-paths.ts. Zod comes from Astro's own re-export.
import { reference } from "astro:content";
import { z } from "astro/zod";
import { MAX_ITEMS, MAX_PATHS } from "../../lib/content/reading-paths.ts";

const MAX_DESCRIPTION = 160;

const text = z.string().trim().min(1);

const itemMessage = "each item is either post: <slug> or project: <slug>";
const itemsMessage = `list between 1 and ${MAX_ITEMS} items`;

const description = text
  .max(MAX_DESCRIPTION, `description: keep it to one sentence of at most ${MAX_DESCRIPTION} characters`)
  .refine(
    (value) => value.endsWith(".") && !/[.!?]\s+\S/.test(value),
    "description: write one sentence that ends with a full stop",
  );

export function readingPathSchema() {
  const item = z.union(
    [z.strictObject({ post: reference("posts") }), z.strictObject({ project: reference("projects") })],
    { error: itemMessage },
  );
  return z.strictObject({
    title: text,
    description,
    position: z.number().int().min(1, `position: use a whole number from 1 to ${MAX_PATHS}`).max(MAX_PATHS, `position: use a whole number from 1 to ${MAX_PATHS}`),
    items: z.array(item).min(1, itemsMessage).max(MAX_ITEMS, itemsMessage),
  });
}
