// Resolves a sample post's image id to an imported SVG. Astro turns a local
// .svg import into an inline component
// (docs.astro.build/en/guides/images/#svg-components), so the prototypes use
// it with role="img" and an accessible name instead of <Image />, which needs
// raster image metadata. Kept apart from samples.ts so tests running outside
// Astro can read the data.
import type { SvgComponent } from "astro/types";
import pipeline from "../_images/pipeline.svg";
import teams from "../_images/teams.svg";
import agents from "../_images/agents.svg";
import records from "../_images/records.svg";
import clinic from "../_images/clinic.svg";
import type { ImageId } from "./samples.ts";

export const sampleImages: Record<ImageId, SvgComponent> = { pipeline, teams, agents, records, clinic };
