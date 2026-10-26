// The resolver that turns `replacedBy` into a name and an optional link (data-model.md "Derived:
// ResolvedReplacement"). The collection-level checks (RP04, RP05) are `checkReplacements` in
// src/content/collections/project-rules.ts.
import type { Replaceable } from "../../content/collections/project-rules.ts";
import { projectHref } from "./addresses.ts";

export interface ResolvedReplacement {
  name: string;
  href?: string;
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
    return publishedIds.has(id) ? { name, href: projectHref(id) } : { name };
  }
  if (!replacedBy.name) return undefined;
  return replacedBy.href ? { name: replacedBy.name, href: replacedBy.href } : { name: replacedBy.name };
}
