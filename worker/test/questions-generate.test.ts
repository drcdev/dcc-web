// extractText reads the model's text from either result shape (research R5).
import { describe, expect, it } from "vitest";
import { extractText } from "../src/questions/generate";

describe("extractText", () => {
  it("reads the response field of a text-generation result", () => {
    expect(extractText({ response: "Why?" })).toBe("Why?");
  });

  it("reads choices[0].message.content of a chat-completion result", () => {
    expect(extractText({ choices: [{ index: 0, message: { role: "assistant", content: "Why?" } }] })).toBe("Why?");
  });

  it("prefers response when both are present", () => {
    expect(extractText({ response: "A?", choices: [{ message: { content: "B?" } }] })).toBe("A?");
  });

  it("is undefined for null, absent or non-string content", () => {
    expect(extractText(null)).toBeUndefined();
    expect(extractText(undefined)).toBeUndefined();
    expect(extractText({})).toBeUndefined();
    expect(extractText({ response: 3 })).toBeUndefined();
    expect(extractText({ choices: [] })).toBeUndefined();
    expect(extractText({ choices: [{ message: { content: null } }] })).toBeUndefined();
  });
});
