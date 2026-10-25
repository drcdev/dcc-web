// All of the `readingPaths` collection's rules (specs/040-home-now-start-here/data-model.md; contracts/
// build-errors.md rows R01 to R08, R10). One YAML file per path: a name, a one-sentence description, a
// position and one to five items, each a post or a project named by its file name. Items are references
// (docs.astro.build/en/guides/content-collections/#defining-collection-references). Beside the schema:
// the rules that span files (R04 to R07), run by src/lib/reading-paths.ts when the home page builds.
// Zod comes from Astro's own re-export.
import { reference } from "astro:content";
import { z } from "astro/zod";
import { contentError, PageContentError } from "../../lib/content/errors.ts";

/** The most paths the home page shows, and the most items in one. */
export const MAX_PATHS = 4;
export const MAX_ITEMS = 5;

export type ItemKind = "post" | "project";

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

/** One reading path file with its items as plain slugs. */
export interface PathFile {
  /** The file name without extension. */
  id: string;
  /** Repository-relative path, for messages. */
  file: string;
  data: { title: string; description: string; position: number; items: ({ post: string } | { project: string })[] };
}

export const kindOf = (item: PathFile["data"]["items"][number]): { kind: ItemKind; slug: string } =>
  "post" in item ? { kind: "post", slug: item.post } : { kind: "project", slug: item.project };

/**
 * Checks what no single file can: every item exists (a draft counts as existing), no item is
 * listed twice in one path, there are at most four paths and no two share a position. Throws a
 * PageContentError naming the file.
 */
export function checkReadingPaths(
  files: readonly PathFile[],
  exists: { posts: ReadonlySet<string>; projects: ReadonlySet<string> },
): void {
  if (files.length > MAX_PATHS) {
    throw new PageContentError(
      `Reading path files in src/content/reading-paths/: there are ${files.length} paths; the most is ${MAX_PATHS}.`,
    );
  }
  const positions = new Map<number, PathFile>();
  for (const file of files) {
    const other = positions.get(file.data.position);
    if (other) {
      throw contentError("reading path", [other.file, file.file], `both use position ${file.data.position}.`);
    }
    positions.set(file.data.position, file);
  }
  for (const file of files) {
    const seen = new Set<string>();
    file.data.items.forEach((item, index) => {
      const { kind, slug } = kindOf(item);
      const number = index + 1;
      const known = kind === "post" ? exists.posts : exists.projects;
      if (!known.has(slug)) {
        throw contentError(
          "reading path",
          file.file,
          `item ${number} (${kind}: ${slug}) does not exist. Use the file name of a ${kind} in src/content/${kind}s/.`,
        );
      }
      const key = `${kind}:${slug}`;
      if (seen.has(key)) throw contentError("reading path", file.file, `item ${number} (${kind}: ${slug}) is listed twice.`);
      seen.add(key);
    });
  }
}
