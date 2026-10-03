// The project parts plugin (specs/014-project-four-part-story/research.md R2; FR-002, FR-006, FR-016).
// A Sätteri mdast plugin that wraps each level-2 heading and the siblings after it in a `ProjectPart`
// element and swaps the first table in the Options part for an `OptionsTable` element, so the page
// gets a real container per part from plain Markdown. The route hands both components to
// `<Content components>` (docs.astro.build/en/guides/integrations-guide/mdx/#passing-components-to-mdx-content).
// The plugin shape follows docs.astro.build/en/recipes/reading-time/. It does nothing for a file
// outside src/content/projects/, so posts and pages are untouched. The story check
// (src/lib/content/project-story.ts) has already made sure the four headings are present and in order.
import { defineMdastPlugin } from "satteri";
import type { PluginFactoryContext } from "satteri";
import { partHeadings, partIds, type PartId } from "../content/parts.ts";

interface Node {
  type: string;
  depth?: number;
  [key: string]: unknown;
}

const PROJECTS_DIR = "/src/content/projects/";

function partOfHeading(text: string): PartId | undefined {
  const wanted = text.trim().toLowerCase();
  return partIds.find((id) => partHeadings[id].toLowerCase() === wanted);
}

function element(name: string, attributes: Record<string, string>, children: Node[]): Node {
  return {
    type: "mdxJsxFlowElement",
    name,
    attributes: Object.entries(attributes).map(([key, value]) => ({ type: "mdxJsxAttribute", name: key, value })),
    children,
  };
}

function plugin() {
  return defineMdastPlugin({
    name: "project-parts",
    before(root, context) {
      const grouped: Node[] = [];
      let part: { id: PartId; children: Node[] } | undefined;
      const close = () => {
        if (!part) return;
        let swapped = false;
        const id = part.id;
        const children = part.children.map((node) => {
          if (id === "options" && !swapped && node.type === "table") {
            swapped = true;
            return element("OptionsTable", {}, []);
          }
          return node;
        });
        grouped.push(element("ProjectPart", { name: id }, children));
        part = undefined;
      };
      for (const node of root.children as unknown as Node[]) {
        const id = node.type === "heading" && node.depth === 2 ? partOfHeading(context.textContent(node as never)) : undefined;
        if (id) {
          close();
          part = { id, children: [node] };
        } else if (part) {
          part.children.push(node);
        } else {
          grouped.push(node);
        }
      }
      close();
      context.setProperty(root, "children", grouped as never);
    },
  });
}

/** Factory: the plugin for a file under src/content/projects/, nothing for any other document. */
export const projectPartsPlugin = (ctx: PluginFactoryContext) =>
  ctx.fileURL?.pathname.includes(PROJECTS_DIR) ? plugin() : null;
