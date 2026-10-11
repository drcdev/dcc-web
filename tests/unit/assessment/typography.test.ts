// Unit tests for the curly-quote helper that keeps moved text reading as the Markdown did (FR-004).
import { describe, expect, it } from "vitest";
import { typographic } from "../../../src/lib/assessment/typography.ts";

describe("typographic", () => {
  it("curls double quotes by position", () => {
    expect(typographic('Ask: "Who else?" Then "go".')).toBe("Ask: “Who else?” Then “go”.");
  });

  it("curls quotes after an opening bracket and writes an ellipsis", () => {
    expect(typographic('language ("You need to...") with ("How might we...?")')).toBe(
      "language (“You need to…”) with (“How might we…?”)",
    );
  });

  it("writes an apostrophe as a closing single quote and leaves hyphens alone", () => {
    expect(typographic("hadn't a 90-day plan")).toBe("hadn’t a 90-day plan");
  });
});
