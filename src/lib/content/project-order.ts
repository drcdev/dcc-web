// Which projects are published, and in what order (data-model.md "Derived: published projects and
// order"). Pure: src/lib/projects.ts passes in the collection entries.
import { isProductionBuild } from "../build-mode.ts";

interface Orderable {
  id: string;
  data: { title: string; date: Date; draft: boolean };
}

function compare(a: Orderable, b: Orderable): number {
  const byDate = b.data.date.getTime() - a.data.date.getTime();
  if (byDate !== 0) return byDate;
  const byTitle = a.data.title.localeCompare(b.data.title);
  return byTitle !== 0 ? byTitle : a.id.localeCompare(b.id);
}

/** Drafts leave the production build only; the rest is sorted by date (newest first), then title, then file name. */
export function selectPublishedProjects<T extends Orderable>(
  entries: readonly T[],
  env: Readonly<Record<string, string | undefined>>,
): T[] {
  const production = isProductionBuild(env);
  return entries.filter((entry) => !(production && entry.data.draft)).sort(compare);
}
