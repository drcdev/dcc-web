// The pure part of the home page's reading paths (specs/040-home-now-start-here/contracts/build-errors.md
// rows R04 to R07; spec FR-008, FR-013). src/lib/reading-paths.ts reads the collections and passes
// them in, so these functions need no Astro runtime.
import { contentError, PageContentError } from "./errors.ts";

/** The most paths the home page shows, and the most items in one. */
export const MAX_PATHS = 4;
export const MAX_ITEMS = 5;

export type ItemKind = "post" | "project";

/** One reading path file with its items as plain slugs. */
export interface PathFile {
  /** The file name without extension. */
  id: string;
  /** Repository-relative path, for messages. */
  file: string;
  data: { title: string; description: string; position: number; items: ({ post: string } | { project: string })[] };
}

export interface ResolvedItem {
  kind: ItemKind;
  title: string;
  href: string;
  minutesRead: number;
}

export interface ResolvedPath {
  id: string;
  title: string;
  description: string;
  items: ResolvedItem[];
}

const kindOf = (item: PathFile["data"]["items"][number]): { kind: ItemKind; slug: string } =>
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

interface Visible {
  title: string;
  href: string;
  minutesRead: number;
}

/**
 * The paths the home page shows: sorted by position, items in file order, with any item that is not
 * in `visible` (a draft in a production build) dropped, and any path left empty dropped.
 */
export function resolveReadingPaths(
  files: readonly PathFile[],
  visible: { posts: ReadonlyMap<string, Visible>; projects: ReadonlyMap<string, Visible> },
): ResolvedPath[] {
  return [...files]
    .sort((a, b) => a.data.position - b.data.position)
    .map((file): ResolvedPath => {
      const items = file.data.items.flatMap((item): ResolvedItem[] => {
        const { kind, slug } = kindOf(item);
        const found = (kind === "post" ? visible.posts : visible.projects).get(slug);
        return found ? [{ kind, ...found }] : [];
      });
      return { id: file.id, title: file.data.title, description: file.data.description, items };
    })
    .filter((path) => path.items.length > 0);
}
