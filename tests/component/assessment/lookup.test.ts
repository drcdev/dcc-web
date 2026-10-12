// Component-layer tests for the A4 lookup used by every assessment component (a unit of
// build-time wiring: no browser, no build). Both components share it, so it is covered once here.
import { describe, expect, it } from "vitest";
import PracticalApplication from "../../../src/components/assessment/PracticalApplication.astro";
import { findAssessment, findShift } from "../../../src/lib/assessment/lookup.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";
import { render } from "../sections/helpers.ts";

const FILE = "src/content/posts/example.mdx";
const known = { sample: sampleAssessment() };

describe("assessment lookup (A4, A5)", () => {
  it("returns the assessment and the shift", () => {
    expect(findAssessment(FILE, "sample", known)).toBe(known.sample);
    expect(findShift(FILE, known.sample, "charlie").name).toBe("Charlie");
  });

  it("A4: names the post file, the assessment id and the known ids", () => {
    const run = () => findAssessment(FILE, "nope", known);
    expect(run).toThrow(FILE);
    expect(run).toThrow('assessment="nope"');
    expect(run).toThrow("sample");
  });

  it("A4: a component given an unknown assessment through its props fails with that message", async () => {
    // With no `data` prop the component reads the collection; an unknown id there raises A4.
    await expect(
      render(PracticalApplication, { assessment: "nope", shift: "alpha" }, undefined, { pageFile: FILE }),
    ).rejects.toThrow('assessment="nope"');
  });
});
