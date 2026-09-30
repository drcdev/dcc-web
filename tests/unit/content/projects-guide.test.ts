// FR-075: Don's authoring guide (docs/projects.md) must name every setting the
// project schema allows, every building block and page section, every chapter
// stage and every allowed status, so the guide cannot drift from the code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "astro/zod";
import { projectSchema } from "../../../src/content/schemas/project.ts";
import { storyBlockNames } from "../../../src/components/project/blocks/index.ts";
import { sectionNames } from "../../../src/components/sections/index.ts";
import { stageIds } from "../../../src/lib/content/stages.ts";

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
  else if (type === "pipe") collect(def.in, keys, values);
  else if ("innerType" in def) collect(def.innerType, keys, values);
  return { keys, values };
}

const { keys, values } = collect(projectSchema({ image: () => z.string() }));
// `id` inside a record of visuals is a name the author chooses, not a setting; the guide still shows it.
const settings = [...keys];

describe("docs/projects.md", () => {
  it("finds the settings in the schema", () => {
    expect(settings).toEqual(expect.arrayContaining(["title", "problem", "themes", "comparison", "demo", "standIn", "visuals", "fit"]));
    expect([...values]).toEqual(expect.arrayContaining(["shipped", "experiment", "in-progress", "meets", "partly", "misses"]));
  });

  it.each(settings)("names the setting %s", (setting) => {
    expect(guide).toContain(setting);
  });

  it.each([...values])("names the allowed value %s", (value) => {
    expect(guide).toContain(value);
  });

  it.each(storyBlockNames)("shows the block %s as a tag", (name) => {
    expect(guide).toContain(`<${name}`);
  });

  it.each(sectionNames)("names the page section %s", (name) => {
    expect(guide).toContain(`\`${name}\``);
  });

  it.each(stageIds)("names the chapter %s", (stage) => {
    expect(guide).toContain(stage);
  });

  // FR-073: every class of build error is explained in plain language.
  const errorClasses: Array<[string, RegExp]> = [
    ["no themes", /no themes|without any themes|at least one theme/i],
    ["more than four themes", /more than four themes|over four themes/i],
    ["the same theme twice", /same theme (twice|more than once)|repeated theme/i],
    ["an order that is not a whole number of 1 or more", /`order`[^\n]*(whole number|below 1|less than 1)/i],
    ["a visual name that breaks the name rule", /visual name[^\n]*(lower-case|letters)/i],
    ["the reserved visual name demo", /reserved[^\n]*`demo`|`demo`[^\n]*reserved/i],
    ["a clip used as the index visual", /clip[^\n]*(as|for) the (card|index|project's) (visual|picture)|`visual`[^\n]*clip/i],
    ["two options or constraints with the same id", /same `id`|`id` (that )?(repeats|is used twice)/i],
    ["an unsupported image or clip file", /(unsupported|not supported|other than)[^\n]*(picture|image|clip|file type)/i],
    ["a page claiming an address under /projects/", /\/projects\/[^\n]*(page|address)|page[^\n]*\/projects\//i],
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
