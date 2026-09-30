// Shared helpers for the story blocks: read the current project from
// `Astro.locals.project` (set by the story route; research R2) and validate props.
import type { z } from "astro/zod";
import { PageContentError, projectFileError } from "../../../lib/content/errors.ts";
import { storyBlockSchemas } from "./schemas.ts";
import type { StoryBlockName } from "./index.ts";

export type StoryProject = NonNullable<App.Locals["project"]>;
export type ProjectVisual = NonNullable<StoryProject["data"]["visuals"]>[string];

/** The project the route is rendering, or a build error when a block is used outside a story. */
export function currentProject(block: StoryBlockName, locals: App.Locals): StoryProject {
  if (!locals.project) throw new PageContentError(`<${block}> can only be used inside a project story (no project is set)`);
  return locals.project;
}

/** Parses a block's props; a failure names the block, the prop and the project file. */
export function checkProps<Name extends StoryBlockName>(
  block: Name,
  props: unknown,
  project: StoryProject,
): z.infer<(typeof storyBlockSchemas)[Name]> {
  const result = storyBlockSchemas[block].safeParse(props);
  if (result.success) return result.data as z.infer<(typeof storyBlockSchemas)[Name]>;
  const issue = result.error.issues[0]!;
  const prop = issue.path.join(".") || "props";
  throw projectFileError(project.file, `<${block}> ${prop}: ${issue.message}`);
}

/** Looks up a named visual, or fails naming the project file and the visuals it has. */
export function findVisual(block: StoryBlockName, name: string, project: StoryProject): ProjectVisual {
  const visual = project.data.visuals?.[name];
  if (!visual) {
    const known = Object.keys(project.data.visuals ?? {});
    throw projectFileError(
      project.file,
      `<${block}> uses the visual "${name}", which is not in visuals (${known.length ? known.join(", ") : "none defined"}).`,
    );
  }
  return visual;
}
