// Shared setup for the project component tests: a project record shaped like
// the one the story route puts in `Astro.locals.project`, and a renderer.
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import type { OptionsComparison } from "../../../src/lib/content/options-comparison.ts";
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
      date: new Date("2025-06-01"),
      draft: false,
      visuals: {
        screenshot: { kind: "image", src: image, alt: "A screenshot of the tool", part: "build" },
        architecture: {
          kind: "diagram",
          src: image,
          alt: "Boxes joined by arrows",
          description: "Three boxes in a row.",
          part: "options",
        },
      },
      ...overrides,
    },
    comparison: {
      optionHeader: "Option",
      constraints: [{ label: "Works on macOS" }, { label: "Natural-language dates" }],
      options: [
        { name: "URL scheme", chosen: false, fits: ["yes", "no"] },
        { name: "JXA", chosen: true, fits: ["yes", "partly"] },
      ],
    } satisfies OptionsComparison,
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
