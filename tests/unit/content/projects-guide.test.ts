// FR-020 (specs/014-project-four-part-story): Don's authoring guide (docs/projects.md) must name every
// setting the project schema allows, every allowed answer, every part and every class of build error, and
// must not describe the removed blocks, chapters or settings, so the guide cannot drift from the code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";
import { partHeadings, partIds } from "../../../src/lib/content/parts.ts";

const guide = readFileSync(new URL("../../../docs/projects.md", import.meta.url), "utf-8");

// Every key of every object in the schema, and every enum value, found by walking the Zod definitions.
function collect(schema: unknown, keys = new Set<string>(), values = new Set<string>()) {
  const def = (schema as { _zod?: { def?: Record<string, unknown> } })?._zod?.def;
  if (!def) return { keys, values };
  const type = def.type as string;
  if (type === "object") {
    for (const [key, child] of Object.entries(def.shape as Record<string, unknown>)) {
      keys.add(key);
      collect(child, keys, values);
    }
  } else if (type === "array") collect(def.element, keys, values);
  else if (type === "record") collect(def.valueType, keys, values);
  else if (type === "union") for (const option of def.options as unknown[]) collect(option, keys, values);
  else if (type === "enum") for (const value of Object.values(def.entries as Record<string, string>)) values.add(value);
  else if (type === "literal") for (const value of def.values as string[]) values.add(value);
  // reference() is a pipe whose input is a union of an id and Astro's own { id, collection } object. It is a
  // leaf here: the guide names `project`, not Astro's internal keys.
  else if (type === "pipe") {
    const input = (def.in as { _zod?: { def?: { options?: Array<{ _zod?: { def?: { type?: string } } }> } } })?._zod?.def;
    const isReference = input?.options?.some((option) => option._zod?.def?.type === "string") && input?.options?.some((option) => option._zod?.def?.type === "object");
    if (!isReference) collect(def.in, keys, values);
  }
  else if ("innerType" in def) collect(def.innerType, keys, values);
  return { keys, values };
}

const { keys, values } = collect(projectSchema({ image: () => z.string() }));
const settings = [...keys];

describe("docs/projects.md", () => {
  it("finds the settings in the schema", () => {
    expect(settings).toEqual(
      expect.arrayContaining(["title", "problem", "themes", "demo", "standIn", "visuals", "part", "invitation", "date", "replacedBy", "project", "name", "href"]),
    );
    expect([...values]).toEqual(expect.arrayContaining(["shipped", "experiment", "in-progress", "retired", "image", "diagram"]));
  });

  it.each(settings)("names the setting %s", (setting) => {
    expect(guide).toContain(setting);
  });

  it.each([...values])("names the allowed value %s", (value) => {
    expect(guide).toContain(value);
  });

  it.each(partIds)("names the part %s by its heading", (id) => {
    expect(guide).toContain(`## ${partHeadings[id]}`);
    expect(guide).toContain(`\`${id}\``);
  });

  it.each(["yes", "partly", "no"])("names the allowed table answer %s", (answer) => {
    expect(guide).toContain(`\`${answer}\``);
  });

  it("names the template", () => {
    expect(guide).toContain("_template.mdx");
  });

  // Removed in this feature: the guide must not teach the blocks, the chapters or the options data. (It may name a removed setting in order to say it is removed.)
  it.each(["<Chapter", "<OptionComparison", "<Demo", "<Invitation", "<Visual", "stage=", "comparison:"])(
    "does not mention the removed %s",
    (removed) => {
      expect(guide).not.toContain(removed);
    },
  );

  // FR-015: every class of build error is explained in plain language.
  const errorClasses: Array<[string, RegExp]> = [
    ["no themes", /no themes|without any themes|at least one theme/i],
    ["more than four themes", /more than four themes|over four themes/i],
    ["the same theme twice", /same theme (twice|more than once)|repeated theme/i],
    ["a removed setting", /removed setting|`order`[^\n]*(removed|no longer)/i],
    ["a visual name that breaks the name rule", /visual name[^\n]*(lower-case|letters)/i],
    ["two pictures for one part", /two pictures[^\n]*(same|one) part/i],
    ["a part that is missing, renamed, repeated or out of order", /part[^\n]*(missing|renamed|repeated|out of order)/i],
    ["a tag, import or picture in the body", /(tag|import|picture|image)[^\n]*body|body[^\n]*(tag|import|picture|image)/i],
    ["an Options table problem", /table[^\n]*(yes, partly or no|bold)/i],
    ["a constraint list that does not match the table", /constraint[^\n]*(same names|same order|match)/i],
    ["a missing Why line", /`Why`|"Why"|word Why/],
    ["an unsupported image file", /(unsupported|not supported|other than)[^\n]*(picture|image|file type)/i],
    ["a page claiming an address under /projects/", /\/projects\/[^\n]*(page|address)|page[^\n]*\/projects\//i],
    ["two files with the same address", /same address|`x\.md`/i],
    ["a replacement on a project that is not retired (RP01)", /replacedBy[^\n]*(not retired|only a retired)|only a retired/i],
    ["a replacement that names both or neither of project and name (RP02)", /both[^\n]*`project`[^\n]*`name`|`project`[^\n]*`name`[^\n]*(both|neither)/i],
    ["a replacement address that is not https (RP03)", /replacedBy[^\n]*https|href[^\n]*https/i],
    ["a replacement naming a missing project (RP04)", /replacedBy[^\n]*(no (such )?project file|missing|does not exist)/i],
    ["a project that replaces itself (RP05)", /replace[sd]? itself|itself[^\n]*replacedBy/i],
  ];
  it.each(errorClasses)("explains the build error: %s", (_name, pattern) => {
    const section = guide.slice(guide.indexOf("## Build errors you may see"));
    expect(section).toMatch(pattern);
  });

  it("tells Don to remove location and camera details from photos", () => {
    expect(guide).toMatch(/location[^\n]*camera|camera[^\n]*location/i);
    expect(guide).toMatch(/remove/i);
  });
});
