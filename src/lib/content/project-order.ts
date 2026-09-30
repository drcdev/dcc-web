// Which projects are published, and in what order (data-model.md "Derived:
// published projects and order"; FR-016). Pure: src/lib/projects.ts passes in the
// collection entries.
import { isProductionBuild } from "../build-mode.ts";

interface Orderable {
  data: { title: string; order?: number | undefined; date?: Date | undefined; draft: boolean };
}

function compare(a: Orderable, b: Orderable): number {
  const [ao, bo] = [a.data.order, b.data.order];
  if (ao !== undefined && bo !== undefined && ao !== bo) return ao - bo;
  if ((ao === undefined) !== (bo === undefined)) return ao === undefined ? 1 : -1;
  const [ad, bd] = [a.data.date?.getTime(), b.data.date?.getTime()];
  if (ad !== undefined && bd !== undefined && ad !== bd) return bd - ad;
  if ((ad === undefined) !== (bd === undefined)) return ad === undefined ? 1 : -1;
  return a.data.title.localeCompare(b.data.title);
}

/** Drafts leave the production build only; the rest is sorted by order, then date (newest first), then title. */
export function selectPublishedProjects<T extends Orderable>(
  entries: readonly T[],
  env: Readonly<Record<string, string | undefined>>,
): T[] {
  const production = isProductionBuild(env);
  return entries.filter((entry) => !(production && entry.data.draft)).sort(compare);
}
