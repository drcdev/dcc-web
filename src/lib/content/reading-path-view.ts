// The pure view of the home page's reading paths (specs/040-home-now-start-here/contracts/build-errors.md;
// spec FR-008, FR-013). It holds no rule: it sorts and resolves. src/lib/reading-paths.ts reads the
// collections and passes them in, so these functions need no Astro runtime.
import { kindOf, type ItemKind, type PathFile } from "../../content/collections/reading-path-rules.ts";

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
