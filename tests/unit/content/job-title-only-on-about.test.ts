// FR-019 and "nothing else on the site may read the career files" (specs/041-career-timeline).
// Unit layer: it reads source files and builds nothing. The title comes from the current step file,
// so the guard names no literal and needs no upkeep when the role changes.
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { careerSteps, currentCareerStep } from "../../helpers/content.ts";
import { filesUnder } from "../../helpers/files.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const src = filesUnder(fileURLToPath(new URL("../../../src/", import.meta.url)))
  .filter((path) => /\.(astro|ts|tsx|mdx?|ya?ml|json|css)$/.test(path))
  .map((path) => ({ file: relative(root, path), text: readFileSync(path, "utf-8") }));

describe("the career files stay with the About page", () => {
  it("puts the current role's title in no src file except the About page and the career files", () => {
    const title = String(currentCareerStep(careerSteps).data.role);
    expect(title.length).toBeGreaterThan(0);
    const found = src
      .filter(({ file, text }) => text.includes(title) && file !== "src/content/pages/about.mdx" && !file.startsWith("src/content/career/"))
      .map(({ file }) => file);
    expect(found).toEqual([]);
  });

  it("reads the career collection only in src/lib/career.ts, which only CareerTimeline.astro imports", () => {
    const readers = src.filter(({ text }) => /getCollection\(\s*["']career["']/.test(text)).map(({ file }) => file);
    expect(readers).toEqual(["src/lib/career.ts"]);
    const importers = src.filter(({ text }) => /getCareerTimeline/.test(text)).map(({ file }) => file).sort();
    expect(importers).toEqual(["src/components/sections/CareerTimeline.astro", "src/lib/career.ts"]);
  });
});
