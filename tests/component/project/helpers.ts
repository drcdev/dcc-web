// Shared setup for the project component tests: a project record shaped like
// the one the story route puts in `Astro.locals.project`, and a renderer.
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { render as renderComponent } from "../sections/helpers.ts";

export const image = { src: "/_astro/sample.abc123.png", width: 64, height: 48, format: "png" } as const;

export function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    slug: "focus-pocus",
    file: "src/content/projects/focus-pocus.mdx",
    data: {
      title: "Focus Pocus",
      problem: "Managing OmniFocus meant switching apps.",
      description: "How Focus Pocus works.",
      themes: ["AI integration"],
      status: "experiment",
      visual: { kind: "image", src: image, alt: "Index" },
      draft: false,
      visuals: {
        screenshot: { kind: "image", src: image, alt: "A screenshot of the tool", placeholder: true },
        architecture: {
          kind: "diagram",
          src: image,
          alt: "Boxes joined by arrows",
          description: "Three boxes in a row.",
        },
        walkthrough: {
          kind: "clip",
          src: "./images/clip.webm",
          poster: image,
          label: "A walkthrough",
          description: "Shows the flow from start to finish.",
        },
      },
      ...overrides,
    },
  };
}

export function renderWithProject(
  component: AstroComponentFactory,
  props: Record<string, unknown> = {},
  slot?: string,
  project: ReturnType<typeof makeProject> = makeProject(),
) {
  return renderComponent(component, props, slot, { project });
}
