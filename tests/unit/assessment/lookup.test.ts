// headingId must equal the id Astro's Markdown renderer gives `## <title>` (github-slugger), so the
// block's aria-labelledby and the title-card link always name a rendered heading (specs/037 U20).
import { readFileSync } from "node:fs";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { describe, expect, it } from "vitest";
import { headingId } from "../../../src/lib/assessment/lookup.ts";

async function renderedId(title: string): Promise<string | undefined> {
  const processor = await createSatteriMarkdownProcessor({});
  const result = await processor.render(`## ${title}\n`);
  return result.metadata.headings[0]?.slug;
}

const realTitle = /^title:\s*(.+)$/m
  .exec(readFileSync(new URL("../../../src/content/assessments/wayfinder.yaml", import.meta.url), "utf-8"))?.[1]
  ?.trim()
  .replace(/^(["'])(.*)\1$/, "$2");

describe("headingId", () => {
  it("reads the real data file's title", () => expect(realTitle).toBeTruthy());

  it.each([
    realTitle ?? "",
    "What is next?",
    "Step #1: begin",
    "Don's  map",
    "It’s “quoted” here",
    "Many    spaces   inside",
  ])("equals the rendered heading id for %j", async (title) => {
    expect(headingId(title)).toBe(await renderedId(title));
  });
});
