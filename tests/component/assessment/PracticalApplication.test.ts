// Component tests for <PracticalApplication> (FR-004; contracts/assessment-data.md rows A4 and A5).
import { describe, expect, it } from "vitest";
import PracticalApplication from "../../../src/components/assessment/PracticalApplication.astro";
import { typographic } from "../../../src/lib/assessment/typography.ts";
import { textOf } from "../html.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";
import { render } from "../sections/helpers.ts";

const data = sampleAssessment();
const FILE = "src/content/posts/example.mdx";

describe("PracticalApplication", () => {
  it("renders the paragraph the Markdown produced, with the text from the data", async () => {
    const shift = data.shifts[2]!;
    // The dev-mode container adds data-astro-source attributes; the built page has none.
    const html = (await render(PracticalApplication, { assessment: "sample", shift: shift.id, data })).replace(/ data-astro-source-(?:file|loc)="[^"]*"/g, "");
    expect(html).toContain("<p><strong>Practical Application</strong>: ");
    expect(textOf(html, "p")).toBe(`Practical Application: ${typographic(shift.practicalApplication)}`);
    expect(textOf(html, "p")).toContain("\u201CWhat next?\u201D");
  });

  it("throws for an unknown shift, naming the post file, the shift and the known shifts (A5)", async () => {
    const run = render(PracticalApplication, { assessment: "sample", shift: "missing", data }, undefined, { pageFile: FILE });
    await expect(run).rejects.toThrow(FILE);
    await expect(run).rejects.toThrow('shift="missing"');
    for (const shift of data.shifts) await expect(run).rejects.toThrow(shift.id);
  });
});
