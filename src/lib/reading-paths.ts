// Reads the reading paths for the home page's "Start here" section (specs/040-home-now-start-here,
// data-model.md "Derived: resolved home view"). Posts come from getPostSummaries() and projects from
// getPublishedProjects(), so a draft is left out of a production build only (FR-013). Existence is
// checked against every post and project file, drafts included, so a draft is never a build error.
import { getCollection, render } from "astro:content";
import { projectHref } from "./content/addresses.ts";
import { checkReadingPaths, type PathFile } from "../content/collections/reading-path-rules.ts";
import { resolveReadingPaths, type ResolvedPath } from "./content/reading-path-view.ts";
import { getPostSummaries } from "./posts.ts";
import { getPublishedProjects } from "./projects.ts";

export type { ResolvedPath };

export async function getReadingPaths(): Promise<ResolvedPath[]> {
  const entries = await getCollection("readingPaths");
  if (entries.length === 0) return [];

  const files: PathFile[] = entries.map((entry) => ({
    id: entry.id,
    file: entry.filePath ?? `src/content/reading-paths/${entry.id}.yaml`,
    data: {
      ...entry.data,
      items: entry.data.items.map((item) => ("post" in item ? { post: item.post.id } : { project: item.project.id })),
    },
  }));
  const [allPosts, allProjects] = await Promise.all([getCollection("posts"), getCollection("projects")]);
  checkReadingPaths(files, {
    posts: new Set(allPosts.map((entry) => entry.id)),
    projects: new Set(allProjects.map((entry) => entry.id)),
  });

  const posts = new Map((await getPostSummaries()).map(({ slug, title, href, minutesRead }) => [slug, { title, href, minutesRead }]));
  const projects = new Map(
    await Promise.all(
      (await getPublishedProjects()).map(async (entry) => {
        // The one reading-time plugin counts a project story's body as it counts a post's.
        const { remarkPluginFrontmatter } = await render(entry);
        const minutesRead = remarkPluginFrontmatter.minutesRead;
        if (typeof minutesRead !== "number") {
          throw new Error(
            `Project file ${entry.filePath ?? entry.id}: no reading time was calculated. Check that the reading-time plugin is registered in astro.config.mjs.`,
          );
        }
        return [entry.id, { title: entry.data.title, href: projectHref(entry.id), minutesRead }] as const;
      }),
    ),
  );
  return resolveReadingPaths(files, { posts, projects });
}
