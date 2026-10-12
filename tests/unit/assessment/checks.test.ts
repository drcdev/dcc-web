// Unit tests for the post checks A9 and A10 (contracts/assessment-data.md).
import { describe, expect, it } from "vitest";
import { assessmentsNamedIn, checkFromToLines, checkNoMovedText } from "../../../src/lib/assessment/checks.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";

const FILE = "src/content/posts/example.mdx";
const assessment = sampleAssessment();

function postBody(overrides: { from?: string; to?: string } = {}): { body: string; headings: { slug: string; text: string; depth: number }[] } {
  const headings = assessment.shifts.map((shift, i) => ({
    slug: shift.anchor,
    text: `Mindset Shift #${i + 1}: ${shift.name}`,
    depth: 3,
  }));
  const body = assessment.shifts
    .map(
      (shift, i) =>
        `### ${headings[i]!.text}\n\n**From**: ${i === 1 && overrides.from ? overrides.from : shift.from}  \n**To**: ${
          i === 1 && overrides.to ? overrides.to : shift.to
        }\n\nSome prose about ${shift.name}.\n`,
    )
    .join("\n");
  return { body, headings };
}

describe("A9 checkFromToLines", () => {
  it("accepts a post whose From and To lines equal the data file", () => {
    const { body, headings } = postBody();
    expect(() => checkFromToLines({ file: FILE, body, headings, assessment })).not.toThrow();
  });

  it("names the post file, the shift, the field and both texts when From differs", () => {
    const { body, headings } = postBody({ from: "Something else" });
    const run = () => checkFromToLines({ file: FILE, body, headings, assessment });
    expect(run).toThrow(FILE);
    expect(run).toThrow(assessment.shifts[1]!.name);
    expect(run).toThrow("from");
    expect(run).toThrow("Something else");
    expect(run).toThrow(assessment.shifts[1]!.from);
  });

  it("names the To line when it differs", () => {
    const { body, headings } = postBody({ to: "Another place" });
    expect(() => checkFromToLines({ file: FILE, body, headings, assessment })).toThrow(/\*\*To\*\*[\s\S]*Another place/);
  });

  it("does not throw for a shift whose anchor matches no heading (left to A6)", () => {
    const { body, headings } = postBody();
    const withoutOne = headings.filter((heading) => heading.slug !== assessment.shifts[2]!.anchor);
    expect(() => checkFromToLines({ file: FILE, body, headings: withoutOne, assessment })).not.toThrow();
    expect(() => checkFromToLines({ file: FILE, body, headings: [], assessment })).not.toThrow();
  });

  it("fails when a shift's section has no From line", () => {
    const { body, headings } = postBody();
    expect(() => checkFromToLines({ file: FILE, body: body.replaceAll("**From**:", "From:"), headings, assessment })).toThrow(FILE);
  });
});

describe("A10 checkNoMovedText", () => {
  it("accepts a body that holds none of the moved texts", () => {
    expect(() => checkNoMovedText({ file: FILE, body: "Plain prose.", assessment })).not.toThrow();
  });

  it("rejects a practical application still in the prose, naming the post and the field", () => {
    const shift = assessment.shifts[3]!;
    const run = () => checkNoMovedText({ file: FILE, body: `Text.\n\n**Practical Application**: ${shift.practicalApplication}\n`, assessment });
    expect(run).toThrow(FILE);
    expect(run).toThrow("practicalApplication");
    expect(run).toThrow(shift.name);
  });
});

describe("assessmentsNamedIn", () => {
  it("lists the assessment ids used by any component, and those with a block", () => {
    const body =
      'Text.\n\n<PracticalApplication assessment="one" shift="a" />\n\n<SelfAssessment assessment="one" />\n\n<SelfAssessment assessment="two" />\n\n<PracticalApplication assessment="three" shift="a" />';
    const named = assessmentsNamedIn(body);
    expect([...named.used].sort()).toEqual(["one", "three", "two"]);
    expect([...named.withBlock].sort()).toEqual(["one", "two"]);
  });

  it("finds nothing in a plain post", () => {
    expect(assessmentsNamedIn("Plain prose.")).toEqual({ used: [], withBlock: [] });
  });
});
