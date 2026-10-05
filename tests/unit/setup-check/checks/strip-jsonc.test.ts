// stripJsonc is the repo's one JSONC reader: setup-check and the E2E Worker config script share it.
import { describe, expect, it } from "vitest";
import { stripJsonc } from "../../../../scripts/setup-check/checks/contact-shared.ts";

describe("stripJsonc", () => {
  it("parses a sample with line comments, block comments and trailing commas", () => {
    const sample = `{
  // a line comment
  "name": "dcc-web", /* a block comment */
  "url": "https://example.com/a//b",
  "list": [1, 2,],
}`;
    expect(JSON.parse(stripJsonc(sample))).toEqual({ name: "dcc-web", url: "https://example.com/a//b", list: [1, 2] });
  });
});
