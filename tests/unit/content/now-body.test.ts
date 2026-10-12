// checkNowBody(): the Now body is the "open to" line (contracts/build-errors.md rows N06 and N08).
import { describe, expect, it } from "vitest";
import { checkNowBody } from "../../../src/content/schemas/now.ts";

const file = "src/content/now/now.md";

describe("checkNowBody", () => {
  it("accepts one paragraph with a link to /contact/, and extra links", () => {
    expect(() => checkNowBody(file, "I'm open to talks. [Get in touch](/contact/).\n")).not.toThrow();
    expect(() => checkNowBody(file, "See [this](https://example.com) or [write](/contact/).")).not.toThrow();
  });

  it("N06: an empty body fails", () => {
    expect(() => checkNowBody(file, "  \n")).toThrow(
      `Now file ${file}: the body is the "open to" line and must link to /contact/.`,
    );
  });

  it("N06: a body with no link to /contact/ fails", () => {
    expect(() => checkNowBody(file, "I'm open to talks. [Elsewhere](/about/).")).toThrow(/must link to \/contact\//);
  });

  it("N08: more than one paragraph fails", () => {
    expect(() => checkNowBody(file, "One [x](/contact/).\n\nTwo.")).toThrow(`the "open to" line is one paragraph.`);
  });

  it("N08: a heading fails", () => {
    expect(() => checkNowBody(file, "## Open\n\n[x](/contact/)")).toThrow(`the "open to" line is one paragraph.`);
    expect(() => checkNowBody(file, "# Open [x](/contact/)")).toThrow(`the "open to" line is one paragraph.`);
  });
});
