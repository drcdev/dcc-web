// Unit tests for the question source expansion (FR-021; contracts/assessment-data.md "Question source").
import { describe, expect, it } from "vitest";
import { componentWords, expandForQuestions } from "../../../src/lib/assessment/question-text.ts";
import { sampleAssessment } from "../../helpers/assessment.ts";

const assessment = sampleAssessment();
const all = { sample: assessment };

describe("expandForQuestions", () => {
  it("expands a PracticalApplication tag in place", () => {
    const out = expandForQuestions('Before.\n\n<PracticalApplication assessment="sample" shift="bravo" />\n\nAfter.', all);
    expect(out).toBe(`Before.\n\n**Practical Application**: ${assessment.shifts[1]!.practicalApplication}\n\nAfter.`);
  });

  it("drops a SelfAssessment tag", () => {
    const out = expandForQuestions('A\n\n<SelfAssessment assessment="sample" />\n\nB', all);
    expect(out).toBe("A\n\nB");
  });

  it("leaves no component tag and leaves other text untouched", () => {
    const body =
      '## Heading\n\nText with <em>markup</em>.\n\n<PracticalApplication assessment="sample" shift="alpha" />\n\n<SelfAssessment assessment="sample" />\n';
    const out = expandForQuestions(body, all);
    expect(out).not.toMatch(/<(PracticalApplication|SelfAssessment)/);
    expect(out).toContain("## Heading\n\nText with <em>markup</em>.");
  });

  it("throws for an unknown assessment or shift, naming the file when given", () => {
    expect(() => expandForQuestions('<PracticalApplication assessment="nope" shift="alpha" />', all, "src/content/posts/x.mdx")).toThrow("x.mdx");
    expect(() => expandForQuestions('<PracticalApplication assessment="sample" shift="nope" />', all)).toThrow("nope");
  });
});

describe("componentWords", () => {
  it("counts the words the components render, and nothing for a post without them", () => {
    const count = (text: string) => text.split(/\s+/).filter(Boolean).length;
    const shift = assessment.shifts[1]!;
    expect(componentWords("Plain text only.", all)).toBe(0);
    expect(componentWords('<SelfAssessment assessment="sample" />', all)).toBe(0);
    expect(componentWords('Before.\n\n<PracticalApplication assessment="sample" shift="bravo" />', all)).toBe(
      count(`**Practical Application**: ${shift.practicalApplication}`),
    );
  });
});
