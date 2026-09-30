// One test per row of contracts/build-errors.md: the real Astro build must
// reject each broken page file with a message that names the file and the
// problem (SC-003, FR-007 to FR-009). Fixtures live in
// tests/fixtures/pages/broken/. Rows that need the page route, the section
// components or the section prop checks stay red until Phases 3 to 6.
import { afterEach, describe, expect, it } from "vitest";
import { buildFixtureSite, type FixtureFile, type FixtureSiteResult } from "./fixture-site.ts";

let result: FixtureSiteResult | undefined;
afterEach(() => result?.cleanup());

async function expectRejected(files: readonly (string | FixtureFile)[], ...contains: string[]) {
  result = await buildFixtureSite(files);
  expect(result.ok, "the build should fail").toBe(false);
  for (const text of contains) expect(result.message).toContain(text);
}

const broken = (name: string, to?: string): FixtureFile => ({ from: `broken/${name}`, to });

describe("build errors for page files (contracts/build-errors.md)", () => {
  it("row 1: no title", () => expectRejected([broken("01-no-title.mdx")], "01-no-title", "title"));

  it("row 2: no description", () =>
    expectRejected([broken("02-no-description.mdx")], "02-no-description", "description"));

  it("row 3: wrong type for nav.position", () =>
    expectRejected([broken("03-wrong-type.mdx")], "03-wrong-type", "position"));

  it("row 4: unknown or misspelled key", () =>
    expectRejected([broken("04-misspelled-key.mdx")], "04-misspelled-key", "titel"));

  it("row 5: image without alt", () => expectRejected([broken("05-image-no-alt.mdx")], "05-image-no-alt", "alt"));

  it("row 6: image file missing (frontmatter)", () =>
    expectRejected([broken("06-missing-image-frontmatter.mdx")], "06-missing-image-frontmatter", "does-not-exist.png"));

  it("row 7: image file missing (body)", () =>
    expectRejected([broken("07-missing-image-body.mdx")], "does-not-exist.png"));

  it("row 8: Markdown image with empty alt", () =>
    expectRejected([broken("08-empty-alt.mdx")], "08-empty-alt", "alt text"));

  it("row 9: empty body", () => expectRejected([broken("09-empty-body.mdx")], "09-empty-body", "no content"));

  it("row 10: unknown section", () =>
    expectRejected([broken("10-unknown-section.mdx")], "10-unknown-section", "Callout", "CallToAction", "Figure"));

  it("row 11: section missing required information", () =>
    expectRejected([broken("11-section-missing-prop.mdx")], "11-section-missing-prop", "CallToAction", "href"));

  it("row 12: image section without an image", () =>
    expectRejected([broken("12-image-section-no-image.mdx")], "12-image-section-no-image", "Figure", "image"));

  it("row 13: two files with the same address (about.md and about.mdx)", () =>
    expectRejected(
      [broken("13-duplicate-address-a.mdx", "about.mdx"), broken("13-duplicate-address-b.mdx", "about.md")],
      "about.mdx",
      "about.md",
      "/about/",
    ));

  it("row 13: two files with the same address (x.mdx and x/index.mdx)", () =>
    expectRejected(
      [broken("13-duplicate-address-a.mdx", "x.mdx"), broken("13-duplicate-address-b.mdx", "x/index.mdx")],
      "x.mdx",
      "x/index.mdx",
      "/x/",
    ));

  it("row 14: address used by another route", () =>
    expectRejected([broken("14-route-conflict.mdx", "404.mdx")], "404.mdx", "404.astro", "/404/"));

  it("row 14: address reserved for a later feature", async () => {
    // The blog and the portfolio have both landed, so the site reserves nothing at the moment; the
    // copied site reserves /later/ itself, so the check stays covered until the next feature does.
    result = await buildFixtureSite([broken("14-reserved-address.mdx", "later.mdx")], {
      overrides: {
        "src/config/navigation.ts": (current) => {
          const reserved = current.replace(
            "export const futureDestinations: readonly string[] = [];",
            'export const futureDestinations: readonly string[] = ["/later/"];',
          );
          if (reserved === current) throw new Error("navigation.ts no longer declares an empty futureDestinations list");
          return reserved;
        },
      },
    });
    expect(result.ok, "the build should fail").toBe(false);
    for (const text of ["later.mdx", "reserved", "/later/"]) expect(result.message).toContain(text);
  });

  it("row 15: two navigation entries with the same position", () =>
    expectRejected(
      [broken("15-nav-position-a.mdx"), broken("15-nav-position-b.mdx")],
      "15-nav-position-a.mdx",
      "15-nav-position-b.mdx",
      "2",
    ));

  it("row 16: level-1 heading in the body", () =>
    expectRejected([broken("16-level-one-heading.mdx")], "16-level-one-heading", "use ##"));

  it("row 17: file name with characters other than lower-case letters, digits and hyphens", () =>
    expectRejected(
      [broken("17-bad-file-name.mdx", "About_Me.mdx")],
      "About_Me.mdx",
      "lower-case letters, digits and hyphens",
    ));
});
