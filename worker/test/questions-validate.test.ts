import { describe, expect, it } from "vitest";
import { validateQuestions } from "../src/questions/validate";

const SOURCE = "Remote work changed how teams share context. Written decisions beat meetings for most choices.";

function valid(...lines: string[]) {
  const result = validateQuestions(lines.join("\n"), SOURCE);
  return result.ok ? result.questions : result;
}

describe("question validation (data-model section 5)", () => {
  it("keeps plain questions that end with a question mark", () => {
    expect(valid("What evidence supports the claim?", "Who bears the cost of this choice?")).toEqual([
      "What evidence supports the claim?",
      "Who bears the cost of this choice?",
    ]);
  });

  it("drops a line that does not end with a question mark", () => {
    expect(valid("What is missing?", "This is a statement.", "Why does it matter?")).toEqual([
      "What is missing?",
      "Why does it matter?",
    ]);
  });

  it("drops a line with a sentence end before the final question mark", () => {
    expect(valid("It works. Does it scale?", "Wow! Is that true?", "Really? Is that so?", "Does it scale?", "Who gains?")).toEqual([
      "Does it scale?",
      "Who gains?",
    ]);
  });

  it("drops a line over 25 words and accepts exactly 25", () => {
    const words = (n: number) => Array.from({ length: n }, (_, i) => `w${i}`).join(" ");
    expect(valid(`${words(26)}?`, "Why?", "How so?")).toEqual(["Why?", "How so?"]);
    expect(valid(`${words(25)}?`, "Why?")).toHaveLength(2);
  });

  it("drops a line over 200 characters", () => {
    const long = `${"a".repeat(201)}?`;
    expect(valid(long, "Why?", "How so?")).toEqual(["Why?", "How so?"]);
  });

  it("drops lines with angle brackets, backticks or URLs", () => {
    expect(
      valid("Is <b>this</b> safe?", "Does `code` help?", "Is https://example.com right?", "Is www.example.com right?", "Why?", "How so?"),
    ).toEqual(["Why?", "How so?"]);
  });

  it("drops a line that shares a run of 10 words with the source text, ignoring case and punctuation", () => {
    const quoted = "Is it true that REMOTE work changed how teams share context, written decisions beat meetings?";
    const quoted2 = "Remote work changed how teams share context written decisions beat?";
    expect(valid(quoted, quoted2, "Why?", "How so?")).toEqual(["Why?", "How so?"]);
  });

  it("allows a shorter shared run", () => {
    expect(valid("Do written decisions beat meetings for most choices?", "Why?")).toHaveLength(2);
  });

  it("drops case-insensitive duplicates", () => {
    expect(valid("What is missing?", "WHAT IS MISSING?", "Why?")).toEqual(["What is missing?", "Why?"]);
  });

  it("accepts the numbered lines 1. 2. 3. and strips the markers", () => {
    expect(valid("1. What does the evidence show?", "2. Who gains from this?", "3. What would change your mind?")).toEqual([
      "What does the evidence show?",
      "Who gains from this?",
      "What would change your mind?",
    ]);
  });

  it("strips list markers, quotes and emphasis", () => {
    expect(valid("1. What is missing?", "2) **Why does it matter?**", '- "Who gains?"', "* _How so?_", "• Is it true?")).toEqual([
      "What is missing?",
      "Why does it matter?",
      "Who gains?",
      "How so?",
    ]);
  });

  it("keeps the first four valid lines", () => {
    const result = valid("A one?", "B two?", "C three?", "D four?", "E five?");
    expect(result).toEqual(["A one?", "B two?", "C three?", "D four?"]);
  });

  it("returns malformed when fewer than two are valid", () => {
    expect(valid("Only one?", "A statement.")).toEqual({ ok: false, reason: "malformed" });
    expect(validateQuestions("", SOURCE)).toEqual({ ok: false, reason: "malformed" });
  });
});
