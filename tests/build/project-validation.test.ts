// One test per row of contracts/build-errors.md for project files (FR-073, FR-076,
// SC-006): the real Astro build must reject each broken project file with a plain
// message that names the file and the problem, and that never carries an
// environment value. Fixtures live in tests/fixtures/projects/broken/. Rows 26
// (duplicate slug and nested file) are in project-routes.test.ts.
import { describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile } from "./fixture-site.ts";

// A value that must never appear in any message.
const CANARY = "canary-secret-value-7f3a91";

async function expectRejected(file: string | FixtureFile, ...contains: string[]) {
  const result = await buildFixtureSite([], { projects: [file], env: { PROJECT_VALIDATION_CANARY: CANARY } });
  try {
    expect(result.ok, "the build should fail").toBe(false);
    for (const text of contains) expect(result.message).toContain(text);
    expect(result.message).not.toContain(CANARY);
  } finally {
    result.cleanup();
  }
}

const broken = (name: string, to?: string): FixtureFile => ({ from: `broken/${name}.mdx`, to: to ?? `${name}.mdx` });

describe("build errors for project files (contracts/build-errors.md)", () => {
  it("row 01: missing title", () => expectRejected(broken("01-no-title"), "01-no-title", "title"));
  it("row 02: missing problem", () => expectRejected(broken("02-no-problem"), "02-no-problem", "problem"));
  it("row 03: unknown status lists the allowed values", () =>
    expectRejected(broken("03-bad-status"), "03-bad-status", "status", "shipped", "experiment", "in-progress"));
  it("row 04: no theme", () => expectRejected(broken("04-no-themes"), "04-no-themes", "themes"));
  it("row 05: index visual without alt", () =>
    expectRejected(broken("05-visual-no-alt"), "05-visual-no-alt", "visual", "alt"));
  it("row 06: setting of the wrong kind", () =>
    expectRejected(broken("06-order-wrong-kind"), "06-order-wrong-kind", "order"));
  it("row 07: unknown setting", () =>
    expectRejected(broken("07-misspelled-setting"), "07-misspelled-setting", "titel"));
  it("row 08: problem too long", () =>
    expectRejected(
      broken("08-long-problem"),
      "08-long-problem",
      "problem",
      "one sentence of at most 140 characters",
    ));
  it("row 09: missing chapter", () =>
    expectRejected(broken("09-missing-chapter"), "09-missing-chapter", "is missing the chapter", "lessons"));
  it("row 10: chapters out of order", () =>
    expectRejected(broken("10-chapters-out-of-order"), "10-chapters-out-of-order", "out of order", "lessons"));
  it("row 11: repeated chapter", () =>
    expectRejected(broken("11-repeated-chapter"), "11-repeated-chapter", "more than once", "lessons"));
  it("row 12: no chosen option", () =>
    expectRejected(broken("12-no-chosen-option"), "12-no-chosen-option", "exactly one option must be chosen"));
  it("row 13: chosen option without a reason", () =>
    expectRejected(broken("13-chosen-no-reason"), "13-chosen-no-reason", "reason"));
  it("row 14: option missing a fit names the option and the constraint", () =>
    expectRejected(broken("14-missing-fit"), "14-missing-fit", "script", "fast"));
  it("row 15: comparison with no options", () =>
    expectRejected(broken("15-no-options"), "15-no-options", "comparison"));
  it("row 16: no OptionComparison block", () =>
    expectRejected(broken("16-no-option-comparison"), "16-no-option-comparison", "OptionComparison"));
  it("row 17: missing image", () =>
    expectRejected(broken("17-missing-image"), "17-missing-image", "./images/nope.png"));
  it("row 18: diagram without a description", () =>
    expectRejected(broken("18-diagram-no-description"), "18-diagram-no-description", "description"));
  it("row 19: clip without a description", () =>
    expectRejected(broken("19-clip-no-description"), "19-clip-no-description", "description"));
  it("row 20: demo address not on drc.dev", () =>
    expectRejected(broken("20-demo-not-drc"), "20-demo-not-drc", "href", "drc.dev"));
  it("row 21: source address not HTTPS", () =>
    expectRejected(broken("21-source-not-https"), "21-source-not-https", "source", "https://"));
  it("row 22: demo and stand-in together", () =>
    expectRejected(broken("22-demo-and-stand-in"), "22-demo-and-stand-in", "demo or standIn, not both"));
  it("row 23: unknown building block lists the blocks", () =>
    expectRejected(broken("23-unknown-block"), "23-unknown-block", "<Timeline>", "Chapter", "OptionComparison"));
  it("row 24: unknown visual name", () =>
    expectRejected(broken("24-unknown-visual"), "24-unknown-visual", "ghost"));
  it("row 25: demo visual without embed", () =>
    expectRejected(broken("25-demo-visual-no-embed"), "25-demo-visual-no-embed", "embed"));
  it("row 27: bad file name", () =>
    expectRejected(broken("27-bad-file-name", "Bad Name.mdx"), "Bad Name.mdx", "lower-case letters, digits and hyphens"));
  it("row 28: level-two heading", () =>
    expectRejected(broken("28-heading-level-two"), "28-heading-level-two", "use ### for headings"));
  it("row 29: body image without alt text", () =>
    expectRejected(broken("29-body-image-no-alt"), "29-body-image-no-alt", "alt text"));
  it("row 30: invitation block missing", () =>
    expectRejected(broken("30-invitation-missing"), "30-invitation-missing", "Invitation"));
  it("row 30: demo block missing when a source address is set", () =>
    expectRejected(broken("30-demo-missing"), "30-demo-missing", "Demo"));
  it("row 31: fit naming an unknown constraint", () =>
    expectRejected(broken("31-fit-unknown-constraint"), "31-fit-unknown-constraint", "ghost"));
  it("row 32: visual name with a bad shape", () =>
    expectRejected(broken("32-bad-visual-name"), "32-bad-visual-name", "visuals", "Bad_Name"));
});
