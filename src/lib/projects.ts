// Reads the `projects` collection: the published projects in index order
// (data-model.md "Derived: published projects and order"). The pure ordering lives
// in src/lib/content/project-order.ts.
import { getCollection, type CollectionEntry } from "astro:content";
import { selectPublishedProjects } from "./content/project-order.ts";

export type ProjectEntry = CollectionEntry<"projects">;

/** Projects for this build: drafts are left out of the production build only. */
export async function getPublishedProjects(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<ProjectEntry[]> {
  return selectPublishedProjects(await getCollection("projects"), env);
}

/** The repo-relative path of an entry's file, for error messages. */
export function fileOfProject(entry: ProjectEntry): string {
  return entry.filePath ?? `src/content/projects/${entry.id}.mdx`;
}
