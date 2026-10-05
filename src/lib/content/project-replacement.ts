// The collection-level checks for `replacedBy` and the resolver that turns it into a name and an
// optional link (data-model.md "Validation rules (collection)", "Derived: ResolvedReplacement").
// Astro's reference() only reports a missing target when the entry is read, and then without
// naming the file, so RP04 and RP05 are checked here over every entry, drafts included.
import { contentError } from "./errors.ts";

// The schema allows exactly one of the two forms (RP02), so its inferred type has every key optional.
type Replacement = { project?: { id: string }; name?: string; href?: string };

interface Replaceable {
  id: string;
  data: { title: string; replacedBy?: Replacement };
}

export interface ResolvedReplacement {
  name: string;
  href?: string;
}

const fileOf = (id: string) => `src/content/projects/${id}.mdx`;

/** RP04 (a missing project) and RP05 (a project replacing itself), each naming the file. */
export function checkReplacements(entries: readonly Replaceable[]): void {
  const ids = new Set(entries.map((entry) => entry.id));
  for (const entry of entries) {
    const replacedBy = entry.data.replacedBy;
    if (!replacedBy?.project) continue;
    const target = replacedBy.project.id;
    if (target === entry.id) {
      throw contentError(
        "project",
        fileOf(entry.id),
        "replacedBy names this project itself. Name the project that replaced it, or remove replacedBy.",
      );
    }
    if (!ids.has(target)) {
      throw contentError(
        "project",
        fileOf(entry.id),
        `replacedBy names the project "${target}", but there is no project file ${fileOf(target)}. Use the file name of a project on the site, or name: (with an optional href) for anything off the site.`,
      );
    }
  }
}

/** The replacement as shown in the story header, or undefined when there is none. */
export function resolveReplacement(
  entry: Replaceable,
  all: readonly Replaceable[],
  publishedIds: ReadonlySet<string>,
): ResolvedReplacement | undefined {
  const replacedBy = entry.data.replacedBy;
  if (!replacedBy) return undefined;
  if (replacedBy.project) {
    const id = replacedBy.project.id;
    const target = all.find((candidate) => candidate.id === id);
    const name = target?.data.title ?? id;
    return publishedIds.has(id) ? { name, href: `/projects/${id}/` } : { name };
  }
  if (!replacedBy.name) return undefined;
  return replacedBy.href ? { name: replacedBy.name, href: replacedBy.href } : { name: replacedBy.name };
}
