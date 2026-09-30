// Current-page matching for navigation links (FR-009; Projects stays current on
// a project story through the same section rule the blog uses, spec 008 FR-004).
import { describe, expect, it } from "vitest";
import { isCurrent, isInSection } from "../../../src/lib/nav.ts";

describe("isCurrent (exact)", () => {
  it("matches the same address with or without the trailing slash", () => {
    expect(isCurrent("/projects/", "/projects/")).toBe(true);
    expect(isCurrent("/projects", "/projects/")).toBe(true);
  });

  it("does not match a child address", () => {
    expect(isCurrent("/projects/focus-pocus/", "/projects/")).toBe(false);
  });
});

describe("isInSection (projects)", () => {
  it("matches the section index and everything below it", () => {
    expect(isInSection("/projects/", "/projects/")).toBe(true);
    expect(isInSection("/projects/focus-pocus/", "/projects/")).toBe(true);
    expect(isInSection("/projects/focus-pocus", "/projects/")).toBe(true);
  });

  it("does not match a look-alike address", () => {
    expect(isInSection("/projects-old/", "/projects/")).toBe(false);
    expect(isInSection("/project/", "/projects/")).toBe(false);
  });

  it("never treats / as a section that holds every address", () => {
    expect(isInSection("/projects/", "/")).toBe(false);
    expect(isInSection("/projects/focus-pocus/", "/")).toBe(false);
  });
});
