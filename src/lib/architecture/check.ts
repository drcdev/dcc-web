// Checks that the part files and the layout describe the same parts (contracts/part-files.md
// rows P08 and P09). Run by <ArchitectureDiagram> at build time.
import { PageContentError } from "../content/errors.ts";
import type { Layout } from "./layout.ts";

export function checkParts(layout: Layout, parts: readonly { id: string; name: string }[]): void {
  const layoutIds = new Set(layout.parts.map((part) => part.id));
  const fileIds = new Set(parts.map((part) => part.id));
  const missing = [...layoutIds].filter((id) => !fileIds.has(id));
  const extra = [...fileIds].filter((id) => !layoutIds.has(id));
  if (missing.length || extra.length) {
    const said = [
      missing.length ? `no part file for ${missing.join(", ")}` : "",
      extra.length ? `no place in the layout for ${extra.join(", ")}` : "",
    ].filter(Boolean);
    throw new PageContentError(
      `Architecture diagram: ${said.join("; ")}. Each part file in src/content/architecture/ needs a box in src/lib/architecture/layout.ts, and the other way round.`,
    );
  }
  for (const part of layout.parts) {
    const name = parts.find((file) => file.id === part.id)?.name;
    if (part.lines.join(" ") !== name) {
      throw new PageContentError(
        `Architecture diagram: the label lines for ${part.id} ("${part.lines.join(" ")}") do not join to its name "${name}". Fix the lines in src/lib/architecture/layout.ts or the name in the part file.`,
      );
    }
  }
}
