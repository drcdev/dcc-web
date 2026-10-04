// Unit tests for the contact hand-off link (FR-015).
import { describe, expect, it } from "vitest";
import { contactHref } from "../../../src/lib/content/contact-link.ts";

describe("contactHref", () => {
  it("builds the contact link with the project slug", () => {
    expect(contactHref("example-project")).toBe("/contact/?project=example-project");
  });
  it("accepts a 64 character slug", () => {
    expect(contactHref("a".repeat(64))).toBe(`/contact/?project=${"a".repeat(64)}`);
  });
  it.each(["", "Example", "a b", "a&b=c", "a/b", "a".repeat(65), "a_b"])("rejects %j", (slug) => {
    expect(() => contactHref(slug)).toThrow();
  });
});
