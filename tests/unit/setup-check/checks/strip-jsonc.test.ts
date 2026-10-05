// stripJsonc is the repo's one JSONC reader: setup-check, the E2E Worker config script and the config tests share it.
import { describe, expect, it } from "vitest";
import { stripJsonc } from "../../../../scripts/lib/jsonc.ts";

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
