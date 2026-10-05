// The image of each series (data-model.md "Series image"; FR-001, FR-004). Keyed by `seriesIds`
// in src/config/topics.ts, so a topic that is not a series has no image. Astro's image service
// resizes and converts these on build; `seriesImage` throws for an id that is not a series, so a
// template that asks for one fails the build.
import type { ImageMetadata } from "astro";
import driftImage from "../assets/series/drift.png";
import convergenceImage from "../assets/series/convergence.png";
import { seriesIds } from "./topics.ts";

export const seriesImages = {
  drift: driftImage,
  convergence: convergenceImage,
} as const satisfies Record<string, ImageMetadata>;

/** The image of a series; throws when `id` is not a series. */
export function seriesImage(id: string): ImageMetadata {
  if (!seriesIds.includes(id as (typeof seriesIds)[number]) || !(id in seriesImages)) {
    throw new Error(`"${id}" is not a series, so it has no image in src/config/series-images.ts.`);
  }
  return seriesImages[id as keyof typeof seriesImages];
}
