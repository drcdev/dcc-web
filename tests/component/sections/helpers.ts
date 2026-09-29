// Shared setup for the section component tests: one container, and small helpers
// to render a section with props and default-slot HTML.
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";

let container: AstroContainer | undefined;

export async function render(
  component: AstroComponentFactory,
  props: Record<string, unknown> = {},
  slot?: string,
  locals?: Record<string, unknown>,
): Promise<string> {
  container ??= await AstroContainer.create();
  return container.renderToString(component, {
    props,
    slots: slot === undefined ? {} : { default: slot },
    ...(locals ? { locals: locals as App.Locals } : {}),
  });
}

/** What Astro's Markdown pipeline renders for `![alt](./images/x.png)`: an optimised, hashed file with size. */
export const optimisedImage = (alt = "A plain rectangle") =>
  `<p><img src="/_astro/sample.abc123.png" alt="${alt}" width="64" height="48" loading="lazy" decoding="async"></p>`;
