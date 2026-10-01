// Shiki transformer: colours to classes (specs/008-blog/research.md R7, R8).
// Astro runs its own `pre` transformer first, then the ones in
// `markdown.shikiConfig.transformers`. This one
//   - swaps each token's placeholder colour (shiki-theme.ts) for an `hl-*` class,
//   - removes the `pre` element's `style` (background, colour, overflow; the
//     overflow and colours are in src/styles/global.css instead), and
//   - copies `caption="..."` from the fence's meta string to `data-caption`.
// A final `root` hook fails the build if any `style` attribute is left, or if a
// token has a colour with no class, so a build cannot ship an inline style
// (FR-053) by accident.
import type { ShikiConfig } from "astro";
import { highlightClasses } from "./shiki-theme.ts";

type Transformer = NonNullable<ShikiConfig["transformers"]>[number];

interface HastNode {
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function walk(node: HastNode, visit: (node: HastNode) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** `#RRGGBB` from a `color:` declaration, lower-cased, or undefined. */
function colourOf(style: unknown): string | undefined {
  return /(?:^|;)\s*color:\s*(#[0-9a-fA-F]{6})/.exec(String(style ?? ""))?.[1]?.toLowerCase();
}

function captionOf(meta: string | undefined): string | undefined {
  return /(?:^|\s)caption="([^"]*)"/.exec(meta ?? "")?.[1] || undefined;
}

export function createClassTransformer(classes: Record<string, string> = highlightClasses): Transformer {
  return {
    name: "dcc-highlight-classes",
    preprocess(code, options) {
      // 0 = no limit: deterministic highlighting under load (Astro does not pass tokenizeTimeLimit through).
      options.tokenizeTimeLimit = 0;
      return code;
    },
    pre(node) {
      delete node.properties.style;
      const caption = captionOf(this.options.meta?.__raw);
      if (caption) node.properties["data-caption"] = caption;
    },
    span(node) {
      if (node.properties.style === undefined) return;
      const colour = colourOf(node.properties.style);
      if (!colour) return;
      const cls = classes[colour];
      if (!cls) {
        throw new Error(
          `Syntax highlighting: the token colour ${colour} has no class. Add it to highlightClasses in src/lib/markdown/shiki-theme.ts and style the class in src/styles/global.css.`,
        );
      }
      node.properties.class = [node.properties.class, cls].flat().filter(Boolean).join(" ");
      delete node.properties.style;
    },
    root(root) {
      walk(root as HastNode, (node) => {
        if (node.properties?.style !== undefined) {
          throw new Error(
            `Syntax highlighting: a style attribute was left on <${node.tagName}> (${String(node.properties.style)}). The page's content security policy forbids inline styles; give the token a class in src/lib/markdown/shiki-theme.ts.`,
          );
        }
      });
    },
  };
}

export const shikiClassTransformer = createClassTransformer();
