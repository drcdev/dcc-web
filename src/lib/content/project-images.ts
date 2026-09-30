// Checks that images and clips named in a project's settings exist, before Astro
// bundles them, so the error names the project file (data-model.md invariant 5).
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { projectFileError } from "./errors.ts";

const PROJECTS_DIR = "src/content/projects";

function sources(data: unknown): string[] {
  const d = (data ?? {}) as {
    visual?: { src?: unknown };
    image?: { src?: unknown };
    visuals?: Record<string, { src?: unknown; poster?: unknown } | null | undefined>;
  };
  const found: unknown[] = [d.visual?.src, d.image?.src];
  for (const visual of Object.values(d.visuals ?? {})) found.push(visual?.src, visual?.poster);
  return found.filter((value): value is string => typeof value === "string" && value.startsWith("."));
}

/**
 * @param projectsRoot absolute path of src/content/projects
 * @param file path of the project file below it, for example `focus-pocus.mdx`
 * @param data the parsed settings of the project
 */
export function assertProjectImagesExist(projectsRoot: string, file: string, data: unknown): void {
  for (const src of sources(data)) {
    if (!existsSync(resolve(projectsRoot, dirname(file), src))) {
      throw projectFileError(
        `${PROJECTS_DIR}/${file}`,
        `the file ${src} does not exist. Add the file, or fix the path (it is relative to the project file).`,
      );
    }
  }
}
