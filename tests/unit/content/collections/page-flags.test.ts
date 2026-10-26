// Unit tests for the page flag checks (029; contract rows V5, V8; FR-008, FR-010). Layer: unit. The helpers are pure, so no build is needed. The build
// layer (tests/build/drafts.test.ts) covers the wiring.
import { describe, expect, it } from "vitest";
import { assertHomeVisible } from "../../../../src/content/collections/page-rules.ts";
import { assertLandingBody } from "../../../../src/content/collections/landing-rules.ts";

describe("assertHomeVisible (V5)", () => {
  it("refuses visible: false for the home page, naming the file", () => {
    expect(() => assertHomeVisible("index", "index.mdx", { visible: false })).toThrow(
      /Page file src\/content\/pages\/index\.mdx: .*home page/,
    );
  });

  it("allows a visible or draft home page, and any other page being hidden", () => {
    expect(() => assertHomeVisible("index", "index.mdx", { visible: true })).not.toThrow();
    expect(() => assertHomeVisible("index", "index.mdx", { draft: true })).not.toThrow();
    expect(() => assertHomeVisible("index", "index.mdx", {})).not.toThrow();
    expect(() => assertHomeVisible("example", "example.mdx", { visible: false })).not.toThrow();
  });
});

describe("assertLandingBody (V8)", () => {
  it("refuses a landing file with a body, naming the file", () => {
    expect(() => assertLandingBody("example.mdx", "Some text\n")).toThrow(
      /Page file src\/content\/pages\/example\.mdx: .*no body/,
    );
  });

  it("allows an empty or whitespace-only body", () => {
    expect(() => assertLandingBody("example.mdx", "")).not.toThrow();
    expect(() => assertLandingBody("example.mdx", " \n\n  \n")).not.toThrow();
  });
});
