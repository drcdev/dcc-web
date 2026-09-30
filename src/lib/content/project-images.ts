// Checks that images and clips named in a project's settings exist, before Astro
// bundles them, so the error names the project file (data-model.md invariant 5).
import { existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { projectFileError } from "./errors.ts";

const PROJECTS_DIR = "src/content/projects";

/** The largest clip a project may carry (data-model.md "clip"). */
export const MAX_CLIP_BYTES = 5 * 1024 * 1024;

const isClip = (src: string) => /\.(webm|mp4)$/i.test(src);

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
 * @param file path of the project file below it, for example `my-project.mdx`
 * @param data the parsed settings of the project
 */
export function assertProjectImagesExist(projectsRoot: string, file: string, data: unknown): void {
  for (const src of sources(data)) {
    const path = resolve(projectsRoot, dirname(file), src);
    if (!existsSync(path)) {
      throw projectFileError(
        `${PROJECTS_DIR}/${file}`,
        `the file ${src} does not exist. Add the file, or fix the path (it is relative to the project file).`,
      );
    }
    if (isClip(src) && statSync(path).size > MAX_CLIP_BYTES) {
      throw projectFileError(
        `${PROJECTS_DIR}/${file}`,
        `the clip ${src} is larger than 5 MB. Shorten it or compress it, then try again.`,
      );
    }
  }
}
