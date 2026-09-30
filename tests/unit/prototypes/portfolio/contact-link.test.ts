// specs/006-portfolio-design-directions/contracts/contact-handoff.md (FR-015)
import { describe, expect, it } from "vitest";
import { contactHref } from "../../../../src/prototypes/portfolio/contact-link.ts";

describe("contactHref", () => {
  it("builds the hand-off link", () => {
    expect(contactHref("focus-pocus")).toBe("/contact/?project=focus-pocus");
  });
  it.each([["Focus Pocus"], [""], ["a".repeat(65)], ["focus_pocus"], ["x&y=1"]])("throws on %j", (slug) => {
    expect(() => contactHref(slug)).toThrow();
  });
  it("accepts a 64-character slug", () => {
    expect(contactHref("a".repeat(64))).toBe(`/contact/?project=${"a".repeat(64)}`);
  });
});
